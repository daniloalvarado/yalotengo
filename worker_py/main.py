import os, io, json, time, re
import redis, boto3, requests
from pikepdf import Pdf, Permissions, Encryption
from reportlab.pdfgen import canvas

# -------- Helpers --------
def log(*a):
    print("[WORKER]", *a, flush=True)

def env_int(name, default):
    """
    Lee un entero desde .env con tolerancia a comentarios o espacios.
    Ej: "60   (o 1 en pruebas)" -> 60
    """
    raw = os.getenv(name, "")
    if raw is None:
        return default
    s = str(raw).strip()
    try:
        return int(s)
    except Exception:
        m = re.search(r'-?\d+', s)
        return int(m.group(0)) if m else default

def clamp_delay(mins, vmin, vmax, fallback):
    try:
        m = int(mins)
    except Exception:
        m = fallback
    if m < vmin: m = vmin
    if m > vmax: m = vmax
    return m

def draw_footer_center(lines, w, h, y_margin=18, font="Helvetica-Bold", size=10, leading=12, gray=0.0):
    """
    Dibuja 'lines' en el pie de página, centrado horizontalmente.
    - y_margin: distancia desde el borde inferior (en puntos)
    - leading: separación entre líneas (en puntos)
    - gray: 0=negro, 1=blanco (0.35 recomendado si lo quieres tenue)
    """
    if isinstance(lines, str):
        lines = [lines]

    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=(w, h))
    c.setFont(font, size)
    try:
        # Si quieres el texto más tenue, sube el valor (p.ej. 0.35)
        c.setFillGray(gray)
    except Exception:
        pass

    y = y_margin
    for line in lines:
        c.drawCentredString(w / 2.0, y, str(line))
        y += leading
    c.save()
    buf.seek(0)
    return Pdf.open(buf)

# --- ENV ---
REDIS_URL      = os.getenv("REDIS_URL","redis://redis:6379")
S3_ENDPOINT    = os.getenv("S3_ENDPOINT","http://minio:9000")
S3_ACCESS      = os.getenv("S3_ACCESS","minio")
S3_SECRET      = os.getenv("S3_SECRET","minio123")
S3_BUCKET      = os.getenv("S3_BUCKET","tienda-bucket")

API_INTERNAL    = os.getenv("API_INTERNAL","http://backend:3000")
INTERNAL_SECRET = os.getenv("INTERNAL_SECRET","supersecret123")

DEFAULT_DELAY_MIN = env_int("DEFAULT_DELAY_MIN", 10)     # por defecto
VERIFY_MIN        = env_int("WORKER_VERIFY_MIN", 1)      # mínimo 1
VERIFY_MAX        = env_int("WORKER_VERIFY_MAX", 100)    # máximo 100
POLL_SECONDS      = env_int("WORKER_POLL_SECONDS", 5)    # frecuencia de poll

# Redis keys
QUEUE_NAME = os.getenv("QUEUE_NAME", "prep_jobs")     # cola de trabajos PDF
ZSET_READY = os.getenv("ZSET_READY", "ready_jobs")    # zset con epoch para marcar READY

def process_job(job, s3, r):
    # Datos para personalizar
    full_name = job.get('userFullName', 'Cliente')
    dni = job.get('dni', '00000000')
    user_line_1 = f"Se concede la licencia de uso a: {full_name}"
    user_line_2 = f"DNI: {dni}"

    src_key = job['fileKey']
    dst_key = job['outKey']
    delay_min = clamp_delay(job.get('delayMin', DEFAULT_DELAY_MIN), VERIFY_MIN, VERIFY_MAX, DEFAULT_DELAY_MIN)

    # 1) Descargar master
    src = io.BytesIO()
    s3.download_fileobj(S3_BUCKET, src_key, src)
    src.seek(0)

    # 2) Personalizar PDF (footer centrado en cada página)
    pdf = Pdf.open(src)
    for page in pdf.pages:
        w = float(page.MediaBox[2]); h = float(page.MediaBox[3])
        # Si lo quieres más tenue, usa gray=0.35
        overlay = draw_footer_center([user_line_1, user_line_2], w, h, y_margin=18, font="Helvetica-Bold", size=10, leading=12, gray=0.0)
        page.add_overlay(overlay.pages[0])

    # 3) Guardar con permisos/clave (pikepdf 9.x)
    out = io.BytesIO()
    perms = Permissions(
        accessibility=True,
        extract=False,
        modify_annotation=False,
        modify_form=False,
        modify_other=False,
        modify_assembly=False,
        print_lowres=False,
        print_highres=False
    )
    pdf.save(out, encryption=Encryption(
        user=dni,
        owner=dni,
        allow=perms
    ))
    out.seek(0)

    # 4) Subir preparado
    s3.upload_fileobj(out, S3_BUCKET, dst_key)

    # 5) Programar cambio de estado READY en ZSET (epoch seg)
    #    ⚠️ Corrección: minutos -> segundos
    due_ts = int(time.time()) + delay_min * 60
    member = str(job['ord_int_id'])
    r.zadd(ZSET_READY, { member: due_ts })

    log(f"Procesado {dst_key} para {full_name} | DNI {dni} | READY en {delay_min} min (ord {member})")

def mark_ready_due(r):
    """Revisa ZSET y marca READY en backend para órdenes vencidas."""
    now = int(time.time())
    due = r.zrangebyscore(ZSET_READY, "-inf", now)
    if not due:
        return
    for member in due:
        ord_id = member.decode() if isinstance(member, bytes) else str(member)
        try:
            url = f"{API_INTERNAL}/internal/orders/{ord_id}/mark-ready"
            resp = requests.post(url, headers={"X-Internal-Secret": INTERNAL_SECRET}, timeout=10)
            if resp.status_code == 200:
                r.zrem(ZSET_READY, member)
                log(f"[READY] Orden {ord_id} marcada como READY")
            else:
                # si falla, deja el member para reintentar en el próximo ciclo
                log(f"[READY] Falló marcar {ord_id}: {resp.status_code} {resp.text}")
        except Exception as e:
            log(f"[READY] Error marcando {ord_id}: {e}")

def main():
    log("Iniciando…")
    log(f"Config: DEFAULT_DELAY_MIN={DEFAULT_DELAY_MIN}, RANGE=[{VERIFY_MIN},{VERIFY_MAX}], POLL={POLL_SECONDS}s")
    r = redis.from_url(REDIS_URL)
    log("Redis OK:", REDIS_URL)
    s3 = boto3.client(
        's3',
        endpoint_url=S3_ENDPOINT,
        aws_access_key_id=S3_ACCESS,
        aws_secret_access_key=S3_SECRET
    )
    log("MinIO OK:", S3_ENDPOINT, "bucket:", S3_BUCKET)

    log(f"Cola {QUEUE_NAME} tamaño actual:", r.llen(QUEUE_NAME))
    log(f"ZSET {ZSET_READY} pendientes:", r.zcard(ZSET_READY))
    log("Esperando trabajos…")

    # Bucle principal: escucha trabajos y además hace poll del ZSET
    while True:
        # BLPOP con timeout para poder intercalar el poll del ZSET
        item = r.blpop(QUEUE_NAME, timeout=POLL_SECONDS)
        if item:
            _, data = item
            try:
                job = json.loads(data)
                log("Job recibido:", job)
                process_job(job, s3, r)
            except Exception as e:
                log("Error procesando job:", e)
        # revisar vencidos
        mark_ready_due(r)

if __name__ == "__main__":
    main()
