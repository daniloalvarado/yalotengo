# worker_py/Dockerfile
FROM python:3.11-slim

# Dependencias nativas que mencionaste (qpdf + fuentes)
RUN apt-get update && apt-get install -y --no-install-recommends \
    qpdf fonts-dejavu-core \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Instala deps Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia tu código
COPY . .

# Evita buffering
ENV PYTHONUNBUFFERED=1

# Arranque
CMD ["python", "main.py"]
