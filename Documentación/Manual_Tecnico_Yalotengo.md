CAPÍTULO I
1.	INTRODUCCIÓN
En la actualidad, la incorporación de soluciones tecnológicas en la gestión de comercialización e investigación es fundamental para mejorar la competitividad y el alcance de las organizaciones. Este proyecto nace bajo la iniciativa peruana "Invéntalo", la cual impulsa actividades de investigación, desarrollo, innovación y capacitación orientadas a generar soluciones para la competitividad y el desarrollo sostenible de las poblaciones andino-amazónicas.

Para potenciar este impacto, "Invéntalo" enfrenta el reto de centralizar y digitalizar la oferta de sus múltiples servicios y productos tecnológicos. El sistema abarca: la comercialización de Modelos 3D (digitalizados, impresos y cotizaciones personalizadas), la venta de literatura especializada (Libros), la inscripción a Cursos técnicos, y la emisión de Reservas de tickets para museos. Adicionalmente, de forma exclusiva para la administración interna, la organización cuenta con una Aplicación Móvil de Realidad Aumentada (Unity AR) externa e independiente, cuyos modelos tridimensionales requieren ser gestionados desde un entorno centralizado.

Para abordar estas necesidades y consolidar sus líneas de negocio, se plantea la implementación de "Yalotengo", una plataforma web de comercialización integral. Este ecosistema digitalizado está diseñado para automatizar las ventas, suscripciones y descargas, al mismo tiempo que provee un panel administrativo robusto. Dicho panel no solo controla el e-commerce, sino que actúa como el puente de gestión para alimentar los modelos 3D que consumirá la aplicación de Realidad Aumentada externa, optimizando así los procesos internos y mejorando significativamente la experiencia de los clientes y usuarios.

2. DESCRIPCIÓN DETALLADA DEL TEMA SELECCIONADO
Este proyecto tiene como objetivo principal el diseño e implementación de la plataforma web "Yalotengo" para la iniciativa "Invéntalo". La solución tecnológica propuesta permitirá automatizar y optimizar la comercialización integral de productos y servicios tecnológicos, el catálogo de productos (físicos y digitales), y la administración de recursos interactivos.

El sistema contará con una interfaz amigable (E-commerce) donde los clientes, previa autenticación y edición de perfil (para actualizar datos necesarios para sus compras o reservas), podrán explorar el catálogo y verificar costos. Siguiendo el recorrido del usuario, el sistema permite realizar compras directas de Modelos 3D (digitalizados, impresos y cotizaciones personalizadas), adquirir Libros Digitales, registrarse en Cursos, y finalmente, efectuar la Reserva de tickets para micro museos (con comprobantes QR). Asimismo, ofrecerá herramientas administrativas (Panel de Control) que permitirán al personal de "Invéntalo" gestionar de manera integral el inventario y las ventas, manteniendo un flujo de trabajo que prioriza la administración de: Modelos 3D, Libros, Unity AR, Cursos y Reserva de tickets.

Es crucial destacar que, referente a la Realidad Aumentada, la plataforma web "Yalotengo" no ejecuta mecánicas de AR directamente. La Aplicación de Realidad Aumentada es un software móvil completamente independiente. La responsabilidad de "Yalotengo" se limita exclusivamente al Panel Administrativo, desde donde los gestores pueden subir, actualizar y organizar los Modelos 3D y marcadores visuales que posteriormente dicha App externa descargará y utilizará para su funcionamiento.


2.1 Funcionalidades Principales
2.1.1 Autenticación, Control de Accesos y Edición de Perfil: Inicio de sesión seguro y obligatorio para los clientes, ya sea mediante un formulario de registro tradicional o a través de autenticación rápida con Google (OAuth). Por defecto, todo usuario se registra como "Cliente". Los permisos de "Administrador" no se asignan en el sistema, sino que son configurados manualmente por el equipo desarrollador directamente en la base de datos. Ambos roles (Cliente y Administrador) tienen la capacidad de acceder a la "Edición de perfil" para actualizar nombres y datos obligatorios que facilitan la adquisición de productos o servicios.

2.1.2 Catálogo de Modelos 3D (Digitalizados, Impresos y Cotizaciones Personalizadas): Exhibición y venta directa de archivos digitales y modelos físicos, así como un módulo interactivo para que los clientes soliciten cotizaciones de impresiones a medida.

2.1.3 Gestión de Libros: Distribución automatizada de literatura digital (PDF) tras la confirmación de pago.

2.1.4 Gestión de Modelos para la App AR Externa (Unity AR): Para el rol administrador, módulo exclusivo para subir los AssetBundles (archivos 3D) y los Targets (imágenes de reconocimiento) asociados a la metadata taxonómica (Darwin Core) que la aplicación móvil de Realidad Aumentada consumirá vía API.

2.1.5 Gestión de Cursos: Administración de cupos para talleres técnicos e inscripciones.

2.1.6 Ticketing y Reservas (Micro Museo): Sistema de venta de entradas con generación automática de códigos QR como comprobantes de ingreso.

2.2 Flujo del Proceso
2.2.1 Autenticación y Perfil: El cliente ingresa a la plataforma web Yalotengo y se autentica obligatoriamente. Una vez logueado, puede gestionar sus datos en la sección de Edición de Perfil. Tras esto, explora el catálogo: Modelos 3D, Libros, Cursos o Reserva de tickets.

2.2.2 Transacción (E-commerce): El cliente añade al carrito el servicio de su elección, como por ejemplo un Modelo 3D Digitalizado, y procede al pago.

2.2.3 Confirmación y Entrega: El sistema valida la transacción y habilita automáticamente la respuesta del servicio (ej. enlace de descarga del archivo digital o generación del ticket QR). 

2.2.4. Gestión Administrativa Externa (App AR): En otro flujo, el Administrador ingresa al Panel de Control de Yalotengo. Se dirige a la sección de “Unity AR", sube un nuevo espécimen (Target + AssetBundle 3D). La plataforma web guarda estos archivos en la nube (MinIO) y los expone en su API. Cuando un usuario externo abre la App Móvil de Realidad Aumentada, esta consulta la API de Yalotengo, descarga el nuevo modelo y lo visualiza, completando la integración sin que la plataforma web renderice la AR.


3. PROBLEMÁTICA
Antes de la conceptualización de la plataforma integral "Yalotengo", la iniciativa "Invéntalo" enfrentaba desafíos significativos en la distribución y administración de sus activos tecnológicos:

3.1 Comercialización Descentralizada y Manual: La venta de Modelos 3D generados (como los creados por plataformas IA), libros y la inscripción a cursos dependía de interacciones manuales (correos, mensajes directos), lo que ralentizaba las ventas y propiciaba errores en el control de inventario y cupos.

3.2 Control Ineficiente de Reservas de Museos: La venta de entradas o tickets para micro museos carecía de un sistema digital de validación rápida. Esto generaba demoras en el acceso físico, riesgo de falsificación o pérdida de entradas en papel, y una nula trazabilidad automatizada sobre la asistencia real.

3.3 Gestión Estática de Activos para AR: La actualización de contenidos para su Aplicación Móvil de Realidad Aumentada requería la recompilación del software móvil cada vez que se agregaba un nuevo espécimen en 3D, un proceso ineficiente que consumía tiempo de desarrollo y limitaba la escalabilidad del proyecto educativo.

3.4 Falta de Trazabilidad en Cotizaciones: La recepción de prototipos o ideas de clientes para impresiones 3D personalizadas carecía de un flujo estructurado, lo que dificultaba el seguimiento del estado de la cotización y el intercambio de archivos referenciales.

Estos desafíos evidencian la necesidad de adoptar la plataforma web unificada (Yalotengo) que centralice el e-commerce de productos digitales/físicos, provea automatización de tickets y reservas, y que, simultáneamente, actúe como un gestor de contenido (Backend) ágil para alimentar dinámicamente a su aplicación externa de Realidad Aumentada.


4. JUSTIFICACIÓN DE LA ELECCIÓN DE TEMA
La implementación de la plataforma web "Yalotengo" para "Invéntalo" tiene como objetivo principal consolidar y optimizar bajo un único ecosistema digital la comercialización e interactividad de sus áreas operativas clave: Modelos 3D, Libros, Unity AR (para administración), Cursos y Reservas de Tickets. A pesar de que los productos tienen naturalezas variadas, el sistema ofrece ventajas cruciales que justifican su desarrollo, tales como:

4.1. Mayor accesibilidad y personalización para los usuarios: Los clientes pueden editar su perfil para agilizar compras, y adquirir desde cualquier lugar la gama completa de servicios, centralizando sus descargas y cupones en una única web.

4.2. Optimizar el tiempo del personal administrativo: Al automatizar procesos de validación de pagos, entrega de enlaces PDF, gestión de cupos y emisión de QRs de acceso, el equipo de "Invéntalo" reduce drásticamente el tiempo dedicado a transacciones manuales. De igual forma, el panel simplifica el flujo de cotizaciones de impresiones 3D.

4.3. Independencia y Gestión Dinámica de AR: Aislar la responsabilidad de los modelos 3D y marcadores al backend de Yalotengo desvincula el proceso de creación de contenido del ciclo de desarrollo de la App Móvil de AR. Esto permite enriquecer el repositorio de manera inmediata sin requerir reinstalaciones en los teléfonos de los usuarios.

5. OBJETIVOS
5.1 Objetivo General
Desarrollar e implementar el ecosistema web "Yalotengo" para "Invéntalo", con el fin de automatizar la comercialización de productos técnicos (Modelos 3D, Libros), proveer infraestructura de gestión para el aplicativo Unity AR, optimizar la asistencia a Cursos y modernizar la gestión de Reserva de tickets.

5.2 Objetivos Específicos
-	Automatizar los flujos de ventas y descargas seguras para el Catálogo de Modelos 3D (Digitalizados y Físicos) y literario (Libros en PDF).
-	Implementar un sistema interactivo de cotizaciones 3D personalizadas conectando eficientemente a los usuarios con la administración.
-	Desplegar una arquitectura backend orquestada con Docker y MinIO que exponga las APIs necesarias para abastecer los recursos ('AssetBundles') del módulo Unity AR.
-	Diseñar y organizar un módulo de administración de Cursos que gestione los cupos y la inscripción automatizada.
-	Integrar un sistema de emisión y validación de tickets (QR) para el aseguramiento de entradas en las Reservas de micro museos.

6. ALCANCE
El alcance del proyecto abarca el diseño, desarrollo, y despliegue del ecosistema web "Yalotengo" en su totalidad (Backend, Frontend, Base de Datos y Almacenamiento MinIO). Entre las principales funcionalidades cubiertas se encuentran el registro, autenticación y edición de perfil de clientes, un catálogo dinámico (con pasarela de pagos integrada), flujos de cotización personalizados y la generación de tickets QR.

Para el perfil administrativo, el alcance incluye herramientas integrales manteniendo un flujo unificado y secuencial para la gestión de: Modelos 3D, Libros, Unity AR (subida de AssetBundles), Cursos y Reserva de tickets.

Exclusiones: Este proyecto se centra exclusivamente en el entorno web de "Yalotengo" y su API. Queda fuera del alcance técnico de este documento el desarrollo, programación gráfica (scripts C#) o compilación del software cliente de la Aplicación Móvil de Realidad Aumentada, la cual figura únicamente como un consumidor externo de los servicios expuestos por este backend.

7. PERSONAL INVOLUCRADO
Para gestionar eficientemente el diseño y desarrollo de las múltiples verticales del sistema Yalotengo se constituyó un equipo de trabajo con responsabilidades divididas. A continuación se presentan los miembros principales:

![Personal Involucrado](imágenes/7.%20Personal%20Involucrado.png)

8. METODOLOGÍA

8.1. Metodología de Desarrollo
Para llevar a cabo el diseño e implementación del ecosistema web "Yalotengo", se ha elegido la metodología ágil Scrum. Este enfoque iterativo e incremental es ideal para este proyecto dada su complejidad tecnológica, ya que permite una gestión dinámica y flexible para integrar progresivamente cada una de sus verticales (Modelos 3D, Libros, Backend para Unity AR, Cursos y Reserva de tickets), adaptándose a los cambios y garantizando que las necesidades de "Invéntalo" sean atendidas de manera continua.

Scrum organiza el desarrollo en sprints, ciclos cortos de trabajo o iteraciones que se enfocan en cumplir objetivos específicos dentro de un tiempo definido. Al finalizar cada sprint, el equipo entrega un incremento funcional del sistema, lo que permite a los interesados evaluar los avances de forma práctica y realizar ajustes inmediatos (por ejemplo, alineando las necesidades del e-commerce con los requisitos técnicos de los AssetBundles de AR). Con este marco de trabajo, no solo se alcanzan los objetivos del ecosistema de manera eficiente, sino que también se garantiza entregar un producto final pulido y operativo para clientes y administradores.

8.2. Planificación
Teniendo como base y marco de trabajo a la metodología Scrum, la ejecución del proyecto se estructuró estableciendo roles cruciales, y programando eventos específicos. Esta planificación modular ha sido la directriz para guiar efectivamente el desarrollo, asegurando que componentes como el servidor Node.js, la base de datos MySQL, el contenedor MinIO y el Frontend interactúen armónicamente dentro de los plazos establecidos para su puesta a producción y uso concurrente por parte de los clientes y administradores.


9. ESCENARIO

9.1 Escenario General del Sistema
La plataforma "Yalotengo" opera como un ecosistema web de comercialización integral que sirve simultáneamente a dos tipos de usuarios diferenciados: los Clientes (usuarios públicos) y los Administradores (personal de "Invéntalo"). A continuación se describen los escenarios de uso principales desde la perspectiva de cada rol.

9.2 Escenario del Cliente

9.2.1 Registro y Autenticación
El cliente accede a la plataforma web desde cualquier navegador. Puede registrarse de dos maneras: mediante un formulario de registro tradicional (ingresando nombre, apellidos, documento, correo y contraseña), o a través de autenticación rápida con Google OAuth o Facebook. En ambos casos, el sistema genera un token JWT que le permite acceder a las funcionalidades protegidas. Todo usuario se registra automáticamente con el rol "cliente".

9.2.2 Edición de Perfil
Una vez autenticado, el cliente puede acceder a la sección de Edición de Perfil para actualizar sus datos personales: nombres, apellidos, documento de identidad, dirección y teléfono. Estos datos son necesarios para completar compras y reservas. El cliente también puede subir una foto de perfil (avatar) almacenada en MinIO, y cambiar su contraseña (en caso de ser usuario local y no de Google).

9.2.3 Exploración y Compra de Modelos 3D
El cliente navega el catálogo de Modelos 3D, que presenta tres categorías: Digitalizados (archivos descargables), Impresos (modelos físicos) y Cotizaciones Personalizadas. El cliente selecciona el producto deseado, lo añade al Carrito de Compras (estado PENDING), y cuando está listo, procede al pago unificado a través de MercadoPago. Tras la aprobación del pago, el sistema actualiza el estado a PAID y habilita la descarga del archivo digital correspondiente.

9.2.4 Cotizaciones 3D Personalizadas
El cliente que desea una impresión 3D personalizada accede al módulo de Cotizaciones. Describe su solicitud, adjunta hasta 5 imágenes referenciales (almacenadas en MinIO), e indica sus preferencias de notificación (WhatsApp y/o correo). La solicitud queda en estado "Pendiente" hasta que el administrador la revise, cotice y responda. El cliente puede editar o eliminar su cotización mientras esté en estado Pendiente, y consultar el historial de todas sus solicitudes.

9.2.5 Compra de Libros Digitales
El cliente explora el catálogo de libros activos, añade los de su interés al carrito y realiza el pago. Una vez confirmada la transacción, el sistema habilita un enlace de descarga seguro del archivo PDF, almacenado en MinIO bajo la ruta books/pdf/. El sistema previene compras duplicadas del mismo libro y genera un nombre amigable para el archivo descargado.

9.2.6 Inscripción a Cursos
El cliente visualiza los cursos disponibles con información de cupos (asientos totales vs. vendidos). Al añadir un curso al carrito, el sistema verifica en tiempo real la disponibilidad de cupos. Si hay espacio, se registra la intención de compra. Al confirmar el pago, se incrementa el contador de cupos vendidos (cou_int_sold) y se registra la inscripción.

9.2.7 Reserva de Tickets para Micro Museo
El cliente selecciona una fecha de visita y visualiza los horarios disponibles (slots generados automáticamente según la configuración de apertura/cierre del museo, con intervalos de 30 minutos y capacidad máxima por slot). Indica el número de acompañantes (1 a 10), crea la reserva (estado PENDING) y procede al pago mediante MercadoPago. Tras la aprobación, el sistema genera un código QR único (24 bytes aleatorios en hexadecimal), lo almacena en MinIO y lo presenta como comprobante digital. Las reservas pendientes no pagadas en 15 minutos se cancelan automáticamente (estado EXPIRED).

9.2.8 Carrito de Compras Unificado
El cliente puede acumular productos de distintas verticales (Modelos 3D, Libros, Cursos) en un único carrito. Al momento del pago, el sistema procesa una transacción unificada con MercadoPago que agrupa todos los items, actualiza los estados individuales a PAID y registra el ID de transacción.

9.2.9 Historial de Compras
El cliente puede consultar desde su perfil el historial de todas sus compras (modelos, libros, cursos) y reservas, con la posibilidad de re-descargar archivos digitales adquiridos previamente.

9.3 Escenario del Administrador

9.3.1 Panel de Control (Dashboard)
El administrador ingresa al Panel de Administración autenticado con un token que verifica el rol admin (asignado manualmente en la base de datos). Visualiza un dashboard con estadísticas generales: ingresos totales por reservas, modelos y libros vendidos, cursos inscritos, visitantes del día y conteos acumulados. Los KPIs se calculan en tiempo real desde la base de datos.

9.3.2 Gestión de Modelos 3D
El administrador crea, edita, desactiva y elimina modelos 3D del catálogo. Sube archivos digitales (formatos .glb, .stl, .obj), portadas e imágenes de preview, todos almacenados en MinIO. Configura precios, categorías (Digitalizado, Impreso) y la disponibilidad (activo/inactivo).

9.3.3 Gestión de Libros
El administrador crea y edita libros del catálogo, subiendo la portada y el archivo PDF. Configura precio, descripción y estado activo/inactivo. Los archivos se almacenan en MinIO bajo carpetas organizadas (books/covers/, books/pdf/).

9.3.4 Gestión de Cursos
El administrador crea cursos con título, descripción, precio, número de cupos (asientos) y estado activo/inactivo. Puede monitorear en tiempo real cuántos cupos se han vendido y realizar ajustes.

9.3.5 Gestión de Reservas de Museo
El administrador accede al panel de reservas donde puede visualizar todas las reservas realizadas, filtrar por fecha y estado (PENDING, PAID, USED, EXPIRED, CANCELLED). Dispone de un módulo Scanner para verificar tickets QR en la entrada del museo: al escanear un código, el sistema valida la fecha, el estado de pago y marca el ticket como USED, mostrando los datos del visitante.

9.3.6 Gestión de Modelos para la App AR (Unity AR)
El administrador accede a la sección "Unity AR" donde puede subir nuevos especímenes para la Aplicación Móvil de Realidad Aumentada. Para cada espécimen gestiona: nombre científico, metadata taxonómica (Darwin Core), dos imágenes de marcador (Target) para reconocimiento visual, el archivo AssetBundle 3D del modelo, y traducciones multilenguaje (ES, EN, PT, FR, IT, DE). Los archivos se almacenan en MinIO y se exponen a través de una API pública (/public/targets) que la App consume dinámicamente. Incluye un Dashboard Analítico AR que muestra leads registrados desde la App y métricas de modelos activos.

9.3.7 Gestión de Cotizaciones 3D
El administrador visualiza todas las solicitudes de cotización recibidas junto con los datos del cliente. Puede cambiar el estado de cada solicitud (Pendiente → Cotizado → Comprado o Rechazado) y enviar respuestas escritas. Al responder una cotización pendiente, el sistema la pasa automáticamente a estado "Cotizado".

9.3.8 Gestión de Usuarios
El administrador puede visualizar la lista de usuarios registrados en el sistema (clientes, usuarios AR) y sus datos básicos. Los permisos de administrador se configuran manualmente a nivel de base de datos.


10. REQUISITOS DEL PRODUCTO

10.1 Requisitos Funcionales

| N.° | Código | Nombre | Descripción | Rol | Prioridad |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | RF-01 | Registro de usuario | El sistema debe permitir el registro de clientes mediante formulario (nombres, apellidos, documento, email, contraseña) con validación de email único. Al registrarse, se genera un token JWT de acceso. | Cliente | Alta |
| 2 | RF-02 | Autenticación local | El sistema debe permitir el inicio de sesión mediante email y contraseña, validando las credenciales con hash bcrypt y devolviendo un token JWT con el rol del usuario. | Cliente, Admin | Alta |
| 3 | RF-03 | Autenticación OAuth | El sistema debe permitir el inicio de sesión rápido con Google OAuth y Facebook, creando automáticamente la cuenta si no existe, asignando el rol "cliente" por defecto, y guardando el avatar del proveedor. | Cliente | Alta |
| 4 | RF-04 | Edición de perfil | El sistema debe permitir al usuario autenticado actualizar sus datos: nombres, apellidos, documento, dirección y teléfono; así como subir un avatar (imagen de perfil) almacenado en MinIO. | Cliente, Admin | Alta |
| 5 | RF-05 | Cambio de contraseña | El sistema debe permitir al usuario local cambiar su contraseña verificando la contraseña actual, validando un mínimo de 8 caracteres y rechazando el cambio para usuarios OAuth. | Cliente | Media |
| 6 | RF-06 | Catálogo de Modelos 3D | El sistema debe listar todos los modelos 3D activos, mostrando nombre, descripción, precio, categoría (Digitalizado/Impreso) e imágenes de preview, ordenados por fecha de creación descendente. | Cliente | Alta |
| 7 | RF-07 | Carrito (Modelos 3D Digitalizados) | El sistema debe permitir añadir modelos digitalizados al carrito (estado PENDING). Si el modelo ya existe en el carrito o ya fue comprado (estado PAID), el sistema debe rechazar la operación e impedir la compra duplicada. La cantidad es siempre 1 y no puede modificarse. | Cliente | Alta |
| 8 | RF-08 | Carrito (Modelos 3D Impresos) | El sistema debe permitir añadir modelos impresos al carrito (estado PENDING) con cantidad variable. Si el modelo ya existe en el carrito, el sistema debe incrementar la cantidad automáticamente. El cliente puede modificar la cantidad desde el carrito. No se bloquea la recompra de un modelo impreso ya adquirido anteriormente. | Cliente | Alta |
| 9 | RF-09 | Compra de Modelos 3D Digitalizados | El sistema debe procesar pagos de modelos digitalizados mediante MercadoPago, actualizando el estado de PENDING a PAID o FAILED y registrando el ID de transacción. | Cliente | Alta |
| 10 | RF-10 | Descarga de Modelos 3D Digitalizados | El sistema debe habilitar la descarga del archivo .glb del modelo digitalizado comprado desde MinIO, únicamente si el estado de la compra es PAID y la compra pertenece al usuario autenticado. El archivo se descarga con un nombre amigable basado en el nombre del modelo. | Cliente | Alta |
| 11 | RF-11 | Compra de Modelos 3D Impresos | El sistema debe procesar pagos de modelos impresos mediante MercadoPago, calculando el monto total como precio unitario × cantidad solicitada. Al confirmar el pago, se debe asignar automáticamente el estado de entrega inicial ACCEPTED con un estimado de entrega de "1 día". | Cliente | Alta |
| 12 | RF-12 | Seguimiento de entrega (Modelos Impresos) | El sistema debe gestionar el seguimiento de los modelos impresos comprados mediante un flujo de estados de entrega: ACCEPTED (pedido aceptado) → IN_PROGRESS (en proceso de impresión/envío) → DELIVERED (entregado). El administrador actualiza el estado y el cliente lo visualiza desde su historial de compras. | Cliente, Admin | Alta |
| 13 | RF-13 | Catálogo de Libros | El sistema debe listar todos los libros activos con título, descripción, precio y portada, ordenados por fecha de creación descendente. | Cliente | Alta |
| 14 | RF-14 | Carrito de compras (Libros) | El sistema debe permitir añadir libros al carrito con validación de duplicados (PENDING y PAID), impidiendo la compra repetida del mismo libro. | Cliente | Alta |
| 15 | RF-15 | Compra y descarga de Libros | El sistema debe procesar el pago del libro mediante MercadoPago y, una vez aprobado, habilitar la descarga del PDF con nombre amigable desde MinIO. | Cliente | Alta |
| 16 | RF-16 | Catálogo de Cursos | El sistema debe listar todos los cursos activos mostrando título, descripción, precio, cupos totales y cupos vendidos, permitiendo al cliente identificar la disponibilidad. | Cliente | Alta |
| 17 | RF-17 | Carrito de compras (Cursos) | El sistema debe permitir añadir cursos al carrito verificando disponibilidad de cupos en tiempo real antes de aceptar el item, e incrementando la cantidad si ya existe. | Cliente | Alta |
| 18 | RF-18 | Compra de Cursos con control de cupos | El sistema debe validar la disponibilidad de cupos justo antes de procesar el pago. Tras la aprobación, debe incrementar el contador cou_int_sold y registrar la inscripción. | Cliente | Alta |
| 19 | RF-19 | Carrito unificado | El sistema debe permitir acumular productos de distintas categorías (Modelos 3D Digitalizados, Modelos 3D Impresos, Libros, Cursos) en un carrito único, con pago consolidado en una sola transacción de MercadoPago. | Cliente | Alta |
| 20 | RF-20 | Cotizaciones 3D personalizadas | El sistema debe permitir al cliente crear solicitudes de cotización con descripción, hasta 5 imágenes referenciales (almacenadas en MinIO), teléfono y preferencia de notificación. | Cliente | Media |
| 21 | RF-21 | Gestión de cotizaciones del cliente | El sistema debe permitir al cliente editar (solo en estado Pendiente), eliminar y consultar el historial de sus cotizaciones junto con las respuestas del administrador. | Cliente | Media |
| 22 | RF-22 | Reserva de tickets (Micro Museo) | El sistema debe mostrar la disponibilidad de slots por fecha (generados dinámicamente según horario de apertura/cierre y duración del slot), permitir seleccionar horario y número de invitados (1-10), y crear la reserva en estado PENDING. | Cliente | Alta |
| 23 | RF-23 | Pago de reserva y generación de QR | Tras confirmar el pago, el sistema debe generar un código QR único (24 bytes aleatorios hex), almacenarlo en MinIO, y presentarlo como comprobante digital descargable. | Cliente | Alta |
| 24 | RF-24 | Expiración automática de reservas | El sistema debe expirar automáticamente las reservas PENDING que superen los 15 minutos sin pago, liberando el slot para otros clientes. | Cliente | Alta |
| 25 | RF-25 | Historial de compras y reservas | El sistema debe permitir al cliente consultar todas sus compras pagadas (Modelos Digitalizados, Modelos Impresos con estado de entrega, Libros, Cursos) y sus reservas, con posibilidad de re-descargar archivos digitales. | Cliente | Media |
| 26 | RF-26 | Dashboard administrativo | El sistema debe presentar métricas en tiempo real al administrador: ingresos por reservas, modelos y libros vendidos, cursos inscritos, visitantes del día y totales acumulados. | Admin | Alta |
| 27 | RF-27 | CRUD de Modelos 3D (Admin) | El sistema debe permitir al administrador crear, editar, activar/desactivar y eliminar modelos 3D del catálogo (tanto digitalizados como impresos), incluyendo la subida de archivos digitales, portadas e imágenes a MinIO, y la configuración de categoría y subcategoría. | Admin | Alta |
| 28 | RF-28 | CRUD de Libros (Admin) | El sistema debe permitir al administrador crear, editar y gestionar libros del catálogo, subiendo portadas y archivos PDF a MinIO. | Admin | Alta |
| 29 | RF-29 | CRUD de Cursos (Admin) | El sistema debe permitir al administrador crear, editar y gestionar cursos, configurando título, precio, cupos y estado. | Admin | Alta |
| 30 | RF-30 | Gestión de Reservas (Admin) | El sistema debe permitir al administrador visualizar todas las reservas, filtrar por fecha/estado y monitorear la ocupación del museo. | Admin | Alta |
| 31 | RF-31 | Scanner de tickets QR | El sistema debe permitir al administrador escanear códigos QR en la entrada del museo, validando fecha, estado PAID y marcando el ticket como USED con la fecha/hora de uso. | Admin | Alta |
| 32 | RF-32 | Gestión Unity AR (CRUD de Especímenes) | El sistema debe permitir al administrador crear, editar y gestionar especímenes para la App AR externa: subir Targets (imágenes de marcador), AssetBundles 3D, metadata taxonómica y traducciones multilenguaje (ES, EN, PT, FR, IT, DE). | Admin | Alta |
| 33 | RF-33 | API pública de Targets AR | El sistema debe exponer un endpoint público (/public/targets) que retorne la lista de especímenes activos con URLs de marcadores y AssetBundles para consumo de la App Móvil AR. | Admin | Alta |
| 34 | RF-34 | Dashboard Analítico AR | El sistema debe presentar métricas AR al administrador: total de leads registrados desde la App, últimos usuarios AR y conteo de modelos activos/totales. | Admin | Media |
| 35 | RF-35 | Gestión de Cotizaciones (Admin) | El sistema debe permitir al administrador visualizar todas las cotizaciones 3D con datos del cliente, cambiar estado (Pendiente/Cotizado/Comprado/Rechazado) y enviar respuestas escritas. | Admin | Media |
| 36 | RF-36 | Login desde la App AR (Unity) | El sistema debe exponer un endpoint /ar-login que registre o identifique usuarios desde la App Móvil sin contraseña, marcándolos como is_ar_user y generando un token JWT. | Cliente | Media |

10.2 Requisitos No Funcionales

| N.° | Código | Nombre | Descripción |
| :--- | :--- | :--- | :--- |
| 1 | RNF-01 | Rendimiento | El sistema debe ser capaz de gestionar múltiples solicitudes simultáneas sin degradación perceptible, garantizando un tiempo de respuesta promedio inferior a 2 segundos por solicitud HTTP bajo condiciones normales de carga. |
| 2 | RNF-02 | Disponibilidad | El sistema debe mantener una disponibilidad mínima del 99.5% durante los horarios de operación del museo y periodos de actividad comercial. El backend está desplegado en Render con mecanismos de reinicio automático. |
| 3 | RNF-03 | Seguridad – Autenticación | La autenticación se gestiona mediante JSON Web Tokens (JWT) firmados con clave secreta. Las contraseñas se almacenan cifradas con bcrypt (10 factores de sal). Las rutas administrativas requieren verificación de rol admin en el middleware adminAuth. |
| 4 | RNF-04 | Seguridad – Autorización | El sistema implementa dos niveles de autorización: auth (cualquier usuario autenticado) y adminAuth (únicamente administradores). Los endpoints sensibles verifican adicionalmente que el recurso pertenezca al usuario solicitante (use_int_id). |
| 5 | RNF-05 | Seguridad – Pagos | Los pagos se procesan a través de MercadoPago con tokenización de tarjetas en el lado del cliente (PCI DSS compliant). El servidor nunca recibe ni almacena datos de tarjetas, solo tokens temporales y IDs de transacción. |
| 6 | RNF-06 | Seguridad – SSL/HTTPS | Todas las comunicaciones del sistema (Web, API y App AR) se realizan a través de HTTPS forzado, incluyendo un certificado handler bypass para entornos de desarrollo Unity. |
| 7 | RNF-07 | Usabilidad | La interfaz web se diseñó como una SPA (Single Page Application) con React y navegación fluida mediante React Router DOM. La plataforma es responsive y compatible con dispositivos móviles, tablets y escritorios. Los flujos de compra se completan en un máximo de 4 pasos: explorar, añadir al carrito, pagar y descargar/confirmar. |
| 8 | RNF-08 | Escalabilidad | La arquitectura modular del backend (14 módulos independientes en Express.js) permite escalar componentes individualmente. La base de datos MySQL con Sequelize ORM soporta migración y extensión de esquemas sin rediseño. MinIO proporciona almacenamiento escalable tipo S3. |
| 9 | RNF-09 | Mantenibilidad | El código del backend sigue una estructura modular por dominio (modules/entidad/), con separación clara entre modelos, rutas y lógica de negocio. Las rutas de administración se aíslan en archivos routes.admin.* independientes. |
| 10 | RNF-10 | Compatibilidad | La plataforma web es compatible con los navegadores Chrome, Firefox, Safari y Edge en sus últimas 2 versiones. La App Móvil AR es compatible con dispositivos Android 8.0+ equipados con cámara. |
| 11 | RNF-11 | Almacenamiento de Archivos | Todos los archivos binarios (PDFs, imágenes, modelos 3D, AssetBundles, QRs, avatares) se almacenan en MinIO (compatible con Amazon S3), organizado en buckets y carpetas semánticas: books/, models3d/, microscopicos/, cotizaciones/, avatars/, reservations/. |
| 12 | RNF-12 | Internacionalización (i18n) | La App Móvil AR soporta 6 idiomas (Español, Inglés, Portugués, Francés, Italiano y Alemán), con traducción completa de la interfaz de usuario y los mensajes de feedback. La plataforma web opera en español con soporte de metadatos multilenguaje para los especímenes AR. |
| 13 | RNF-13 | Tolerancia a Red (App AR) | La App Móvil implementa timeouts extendidos de 30s, bypass de validación SSL, descargas escalonadas (0.4s entre marcadores, 1.0s entre modelos) y validación de respuestas vacías para tolerar la latencia de red y el arranque en frío del servidor Render. |
| 14 | RNF-14 | Caché de Modelos 3D (App AR) | La App Móvil utiliza el sistema nativo de caché de AssetBundles de Unity para almacenar los modelos 3D en disco después de la primera descarga, garantizando carga instantánea en escaneos posteriores sin tráfico de red adicional. |


