# Guia de Despliegue en VPS - Danilo
# Servidor: 69.197.187.81 (Rastreos Online)
# Carpeta base de todos los proyectos: /home/Danilo/

================================================================
ESTRUCTURA DE CARPETAS EN EL VPS
================================================================

/home/Danilo/
    yalotengo/          <- este proyecto (puerto 8070)
    otro-proyecto/      <- futuros proyectos (cada uno en su puerto)


================================================================
SERVICIOS EN DOCKER (todo en el VPS, sin servicios externos)
================================================================

MySQL   <- base de datos en Docker (datos permanentes en volumen)
Redis   <- cache en Docker
Backend <- Node.js API
Gateway <- Nginx que sirve el frontend y hace proxy al backend

MinIO   <- sigue en VPS Identiarbol (108.181.166.127) [EXTERNO]


================================================================
DESPLEGAR YALOTENGO (Primera vez)
================================================================

1. Conectarse al VPS:
   ssh administrator@69.197.187.81
   Password: @6P0obyS#6L2%g@l

2. Crear la carpeta Danilo:
   sudo mkdir -p /home/Danilo
   sudo chown administrator:administrator /home/Danilo
   cd /home/Danilo

3. Clonar el repositorio:
   git clone https://github.com/daniloalvarado/yalotengo yalotengo
   cd yalotengo/deploy

4. Preparar el archivo de variables:
   cp .env.vps .env

5. Abrir el puerto 8070 en el firewall:
   sudo ufw allow 8070/tcp

6. Levantar todos los servicios:
   docker compose -f docker-compose.vps.yml up -d --build

   (La primera vez tarda unos minutos porque construye las imagenes)

7. Verificar que todo corre:
   docker compose -f docker-compose.vps.yml ps

8. IMPORTANTE - Importar la base de datos desde Clever Cloud:
   Ver seccion "MIGRAR BASE DE DATOS" mas abajo.

9. Acceso web:
   http://69.197.187.81:8070


================================================================
MIGRAR LA BASE DE DATOS (de Clever Cloud al VPS)
================================================================

Hacer esto UNA SOLA VEZ despues del primer despliegue.

PASO A - Exportar de Clever Cloud (ejecutar en tu PC):
   mysqldump -h bbjcjb5ue2m4zyykuxto-mysql.services.clever-cloud.com ^
             -u uxx6spskv6f2pza3 -p ^
             bbjcjb5ue2m4zyykuxto > yalotengo_export.sql

   (Te pedira la password: utVdNVI61v2dCSu0RU6c)

PASO B - Copiar el archivo al VPS:
   scp yalotengo_export.sql administrator@69.197.187.81:/home/Danilo/

PASO C - Importar en el MySQL del Docker (en el VPS):
   ssh administrator@69.197.187.81
   cd /home/Danilo/yalotengo/deploy
   docker compose -f docker-compose.vps.yml exec -T mysql ^
     mysql -u yalotengo_user -pYal0t3ng0_Pass#2024 yalotengo ^
     < /home/Danilo/yalotengo_export.sql

PASO D - Verificar la importacion:
   docker compose -f docker-compose.vps.yml exec mysql ^
     mysql -u yalotengo_user -pYal0t3ng0_Pass#2024 yalotengo ^
     -e "SHOW TABLES;"


================================================================
ACTUALIZAR YALOTENGO (cambios futuros)
================================================================

Desde tu PC:
   git add .
   git commit -m "descripcion del cambio"
   git push

En el VPS:
   ssh administrator@69.197.187.81
   cd /home/Danilo/yalotengo
   git pull
   cd deploy
   docker compose -f docker-compose.vps.yml up -d --build


================================================================
COMANDOS UTILES DE DOCKER
================================================================

Ver estado de los contenedores:
   docker compose -f docker-compose.vps.yml ps

Ver logs en tiempo real:
   docker compose -f docker-compose.vps.yml logs -f

Ver logs de un servicio especifico:
   docker compose -f docker-compose.vps.yml logs -f backend

Reiniciar un servicio:
   docker compose -f docker-compose.vps.yml restart backend

Apagar todo (datos se conservan en volumenes):
   docker compose -f docker-compose.vps.yml down

Entrar a MySQL desde el VPS:
   docker compose -f docker-compose.vps.yml exec mysql mysql -u root -pRoot_Yal0t3ng0#2024


================================================================
REQUISITOS PARA SUBIR OTRO PROYECTO NUEVO
================================================================

REQUISITO 1 - Tener un Dockerfile en el proyecto
   Tu backend/frontend debe tener un Dockerfile para construirse.

REQUISITO 2 - Elegir un puerto libre
   Puertos ya ocupados en este VPS:
       80    <- Apache (Rastreos Online)
       8070  <- Yalotengo
   Para otro proyecto usar: 8071, 8072, 8080, etc.
   Abre el puerto: sudo ufw allow 8071/tcp

REQUISITO 3 - Crear un docker-compose para el nuevo proyecto
   Copiar docker-compose.vps.yml como base y ajustar:
   - El puerto (cambiar 8070 por el nuevo)
   - El context de build (ruta al codigo)
   - El env_file (variables del nuevo proyecto)

REQUISITO 4 - Crear el .env del nuevo proyecto
   Con todas las variables especificas de ese proyecto.

PASOS GENERICOS:
   cd /home/Danilo
   git clone https://github.com/tu-usuario/nuevo-repo
   cd nuevo-repo/deploy
   cp .env.vps .env
   sudo ufw allow NUEVO_PUERTO/tcp
   docker compose -f docker-compose.vps.yml up -d --build
   Acceso: http://69.197.187.81:NUEVO_PUERTO


================================================================
NOTAS FINALES
================================================================

- Cada proyecto usa su propio puerto. No interfieren entre si.
- Apache (Rastreos Online, puerto 80) no se ve afectado.
- Los datos de MySQL y Redis persisten en volumenes Docker.
  No se pierden aunque reinicies el servidor.
- MinIO en Identiarbol (108.181.166.127:9000) es externo y
  compartido. Sus datos ya son permanentes.
