# CAPÍTULO I

## INTRODUCCIÓN

En la actualidad, la incorporación de soluciones tecnológicas en la gestión de comercialización e investigación es fundamental para mejorar la competitividad y el alcance de las organizaciones. Este proyecto nace bajo la iniciativa peruana "Invéntalo", la cual impulsa actividades de investigación, desarrollo, innovación y capacitación orientadas a generar soluciones para la competitividad y el desarrollo sostenible de las poblaciones andino-amazónicas.

Para potenciar este impacto, "Invéntalo" enfrenta el reto de centralizar y digitalizar la oferta de sus múltiples servicios y productos tecnológicos. El sistema abarca: la comercialización de Modelos 3D (digitalizados, impresos y cotizaciones personalizadas), la venta de literatura especializada (Libros), la inscripción a Cursos técnicos, y la emisión de Reservas de tickets para museos. Adicionalmente, de forma exclusiva para la administración interna, la organización cuenta con una Aplicación Móvil de Realidad Aumentada (Unity AR) externa e independiente, cuyos modelos tridimensionales requieren ser gestionados desde un entorno centralizado.

Para abordar estas necesidades y consolidar sus líneas de negocio, se plantea la implementación de "Yalotengo", una plataforma web de comercialización integral. Este ecosistema digitalizado está diseñado para automatizar las ventas, suscripciones y descargas, al mismo tiempo que provee un panel administrativo robusto. Dicho panel no solo controla el e-commerce, sino que actúa como el puente de gestión para alimentar los modelos 3D que consumirá la aplicación de Realidad Aumentada externa, optimizando así los procesos internos y mejorando significativamente la experiencia de los clientes y usuarios.

## 2. DESCRIPCIÓN DETALLADA DEL TEMA SELECCIONADO

Este proyecto tiene como objetivo principal el diseño e implementación de la plataforma web "Yalotengo" para la iniciativa "Invéntalo". La solución tecnológica propuesta permitirá automatizar y optimizar la comercialización integral de productos y servicios tecnológicos, el catálogo de productos (físicos y digitales), y la administración de recursos interactivos.

El sistema contará con una interfaz amigable (E-commerce) donde los clientes, previa autenticación y edición de perfil (para actualizar datos necesarios para sus compras o reservas), podrán explorar el catálogo y verificar costos. Siguiendo el recorrido del usuario, el sistema permite realizar compras directas de Modelos 3D (digitalizados, impresos y cotizaciones personalizadas), adquirir Libros Digitales, registrarse en Cursos, y finalmente, efectuar la Reserva de tickets para micro museos (con comprobantes QR). Asimismo, ofrecerá herramientas administrativas (Panel de Control) que permitirán al personal de "Invéntalo" gestionar de manera integral el inventario y las ventas, manteniendo un flujo de trabajo que prioriza la administración de: Modelos 3D, Libros, Unity AR, Cursos y Reserva de tickets.

Es crucial destacar que, referente a la Realidad Aumentada, la plataforma web "Yalotengo" no ejecuta mecánicas de AR directamente. La Aplicación de Realidad Aumentada es un software móvil completamente independiente. La responsabilidad de "Yalotengo" se limita exclusivamente al Panel Administrativo, desde donde los gestores pueden subir, actualizar y organizar los Modelos 3D y marcadores visuales que posteriormente dicha App externa descargará y utilizará para su funcionamiento.

### 2.1. Funcionalidades Principales

2.1.1. Autenticación, Control de Accesos y Edición de Perfil: Inicio de sesión seguro y obligatorio para los clientes, ya sea mediante un formulario de registro tradicional o a través de autenticación rápida con Google (OAuth). Por defecto, todo usuario se registra como "Cliente". Los permisos de "Administrador" no se asignan en el sistema, sino que son configurados manualmente por el equipo desarrollador directamente en la base de datos. Ambos roles (Cliente y Administrador) tienen la capacidad de acceder a la "Edición de perfil" para actualizar nombres y datos obligatorios que facilitan la adquisición de productos o servicios.

2.1.2. Catálogo de Modelos 3D (Digitalizados, Impresos y Cotizaciones Personalizadas): Exhibición y venta directa de archivos digitales y modelos físicos, así como un módulo interactivo para que los clientes soliciten cotizaciones de impresiones a medida.

2.1.3. Gestión de Libros: Distribución automatizada de literatura digital (PDF) tras la confirmación de pago.

2.1.4. Gestión de Modelos para la App AR Externa (Unity AR): Para el rol administrador, módulo exclusivo para subir los AssetBundles (archivos 3D) y los Targets (imágenes de reconocimiento) asociados a la metadata taxonómica (Darwin Core) que la aplicación móvil de Realidad Aumentada consumirá vía API.

2.1.5. Gestión de Cursos: Administración de cupos para talleres técnicos e inscripciones.

2.1.6. Ticketing y Reservas (Micro Museo): Sistema de venta de entradas con generación automática de códigos QR como comprobantes de ingreso.

### 2.2. Flujo del Proceso

2.2.1. Autenticación y Perfil: El cliente ingresa a la plataforma web Yalotengo y se autentica obligatoriamente. Una vez logueado, puede gestionar sus datos en la sección de Edición de Perfil. Tras esto, explora el catálogo: Modelos 3D, Libros, Cursos o Reserva de tickets.

2.2.2. Transacción (E-commerce): El cliente añade al carrito el servicio de su elección, como por ejemplo un Modelo 3D Digitalizado, y procede al pago.

2.2.3 Confirmación y Entrega: El sistema valida la transacción y habilita automáticamente la respuesta del servicio (ej. enlace de descarga del archivo digital o generación del ticket QR). 

2.2.4. Gestión Administrativa Externa (App AR): En otro flujo, el Administrador ingresa al Panel de Control de Yalotengo. Se dirige a la sección de “Unity AR", sube un nuevo espécimen (Target + AssetBundle 3D). La plataforma web guarda estos archivos en la nube (MinIO) y los expone en su API. Cuando un usuario externo abre la App Móvil de Realidad Aumentada, esta consulta la API de Yalotengo, descarga el nuevo modelo y lo visualiza, completando la integración sin que la plataforma web renderice la AR.

## 3. PROBLEMÁTICA

Antes de la conceptualización de la plataforma integral "Yalotengo", la iniciativa "Invéntalo" enfrentaba desafíos significativos en la distribución y administración de sus activos tecnológicos:

3.1. Comercialización Descentralizada y Manual: La venta de Modelos 3D generados (como los creados por plataformas IA), libros y la inscripción a cursos dependía de interacciones manuales (correos, mensajes directos), lo que ralentizaba las ventas y propiciaba errores en el control de inventario y cupos.

3.2. Control Ineficiente de Reservas de Museos: La venta de entradas o tickets para micro museos carecía de un sistema digital de validación rápida. Esto generaba demoras en el acceso físico, riesgo de falsificación o pérdida de entradas en papel, y una nula trazabilidad automatizada sobre la asistencia real.

3.3. Gestión Estática de Activos para AR: La actualización de contenidos para su Aplicación Móvil de Realidad Aumentada requería la recompilación del software móvil cada vez que se agregaba un nuevo espécimen en 3D, un proceso ineficiente que consumía tiempo de desarrollo y limitaba la escalabilidad del proyecto educativo.

3.4. Falta de Trazabilidad en Cotizaciones: La recepción de prototipos o ideas de clientes para impresiones 3D personalizadas carecía de un flujo estructurado, lo que dificultaba el seguimiento del estado de la cotización y el intercambio de archivos referenciales.

Estos desafíos evidencian la necesidad de adoptar la plataforma web unificada (Yalotengo) que centralice el e-commerce de productos digitales/físicos, provea automatización de tickets y reservas, y que, simultáneamente, actúe como un gestor de contenido (Backend) ágil para alimentar dinámicamente a su aplicación externa de Realidad Aumentada.

## 4. JUSTIFICACIÓN DE LA ELECCIÓN DE TEMA

La implementación de la plataforma web "Yalotengo" para "Invéntalo" tiene como objetivo principal consolidar y optimizar bajo un único ecosistema digital la comercialización e interactividad de sus áreas operativas clave: Modelos 3D, Libros, Unity AR (para administración), Cursos y Reservas de Tickets. A pesar de que los productos tienen naturalezas variadas, el sistema ofrece ventajas cruciales que justifican su desarrollo, tales como:

4.1. Mayor accesibilidad y personalización para los usuarios: Los clientes pueden editar su perfil para agilizar compras, y adquirir desde cualquier lugar la gama completa de servicios, centralizando sus descargas y cupones en una única web.

4.2. Optimizar el tiempo del personal administrativo: Al automatizar procesos de validación de pagos, entrega de enlaces PDF, gestión de cupos y emisión de QRs de acceso, el equipo de "Invéntalo" reduce drásticamente el tiempo dedicado a transacciones manuales. De igual forma, el panel simplifica el flujo de cotizaciones de impresiones 3D.

4.3. Independencia y Gestión Dinámica de AR: Aislar la responsabilidad de los modelos 3D y marcadores al backend de Yalotengo desvincula el proceso de creación de contenido del ciclo de desarrollo de la App Móvil de AR. Esto permite enriquecer el repositorio de manera inmediata sin requerir reinstalaciones en los teléfonos de los usuarios.

## 5. OBJETIVOS

### 5.1. Objetivo General

Desarrollar e implementar el ecosistema web "Yalotengo" para "Invéntalo", con el fin de automatizar la comercialización de productos técnicos (Modelos 3D, Libros), proveer infraestructura de gestión para el aplicativo Unity AR, optimizar la asistencia a Cursos y modernizar la gestión de Reserva de tickets.

### 5.2. Objetivos Específicos

Automatizar los flujos de ventas y descargas seguras para el Catálogo de Modelos 3D (Digitalizados y Físicos) y literario (Libros en PDF).

Implementar un sistema interactivo de cotizaciones 3D personalizadas conectando eficientemente a los usuarios con la administración.

Desplegar una arquitectura backend orquestada con Docker y MinIO que exponga las APIs necesarias para abastecer los recursos ('AssetBundles') del módulo Unity AR.

Diseñar y organizar un módulo de administración de Cursos que gestione los cupos y la inscripción automatizada.

Integrar un sistema de emisión y validación de tickets (QR) para el aseguramiento de entradas en las Reservas de micro museos.

## 6. ALCANCE

El alcance del proyecto abarca el diseño, desarrollo, y despliegue del ecosistema web "Yalotengo" en su totalidad (Backend, Frontend, Base de Datos y Almacenamiento MinIO). Entre las principales funcionalidades cubiertas se encuentran el registro, autenticación y edición de perfil de clientes, un catálogo dinámico (con pasarela de pagos integrada), flujos de cotización personalizados y la generación de tickets QR.

Para el perfil administrativo, el alcance incluye herramientas integrales manteniendo un flujo unificado y secuencial para la gestión de: Modelos 3D, Libros, Unity AR (subida de AssetBundles), Cursos y Reserva de tickets.

Exclusiones: Este proyecto se centra exclusivamente en el entorno de escritorio/web de "Yalotengo" y su API. Queda fuera del alcance técnico de este documento el desarrollo, programación gráfica (scripts C#) o compilación del software cliente de la Aplicación Móvil de Realidad Aumentada, la cual figura únicamente como un consumidor externo de los servicios expuestos por este backend.

## PERSONAL INVOLUCRADO

## 8. METODOLOGÍA

### 8.1. Metodología de Desarrollo

Para llevar a cabo el diseño e implementación del ecosistema web "Yalotengo", se ha elegido la metodología ágil Scrum. Este enfoque iterativo e incremental es ideal para este proyecto dada su complejidad tecnológica, ya que permite una gestión dinámica y flexible para integrar progresivamente cada uno de sus verticales (Modelos 3D, Libros, Backend para Unity AR, Cursos y Reserva de tickets), adaptándose a los cambios y garantizando que las necesidades de "Invéntalo" sean atendidas de manera continua.

Scrum organiza el desarrollo en sprints, ciclos cortos de trabajo o iteraciones que se enfocan en cumplir objetivos específicos dentro de un tiempo definido. Al finalizar cada sprint, el equipo entrega un incremento funcional del sistema, lo que permite a los interesados evaluar los avances de forma práctica y realizar ajustes inmediatos (por ejemplo, alineando las necesidades del e-commerce con los requisitos técnicos de los AssetBundles de AR). Con este marco de trabajo, no solo se alcanzan los objetivos del ecosistema de manera eficiente, sino que también se garantiza entregar un producto final pulido y operativo para clientes y administradores.

### 8.2. Planificación

Teniendo como base y marco de trabajo a la metodología Scrum, la ejecución del proyecto se estructuró estableciendo roles cruciales, y programando eventos específicos. Esta planificación modular ha sido la directriz para guiar efectivamente el desarrollo, asegurando que componentes como el servidor Node.js, la base de datos MySQL, el contenedor MinIO y el Frontend interactúen armónicamente dentro de los plazos establecidos para su puesta a producción y uso concurrente por parte de los clientes y administradores.

8.2.1. Roles del Equipo Scrum

El equipo de desarrollo estará compuesto por roles específicos, cada uno desempeñando funciones cruciales dentro del marco Scrum.

# CAPÍTULO III: ANÁLISIS Y REQUERIMIENTOS DE SISTEMAS DE INFORMACIÓN

## 1. DIAGRAMAS DE CASO DE USO

## 2. REQUISITOS FUNCIONALES


| Nombre | Rol | Responsabilidades | Información de Contacto | Aprobación |
| --- | --- | --- | --- | --- |
|    Danilo Alvarado |    Desarrollador  |  Desarrollo de componentes y funcionalidades específicas del sistema. Participación en el diseño y las pruebas. |  daniloalvarado2002@gmail.com  |   Sí |
|   Brittany Rengifo   |  Líder de Proyecto |  Coordinación general del equipo, toma de decisiones, planificación y supervisión del progreso del proyecto. |   |  Sí |
|    Walter Zumaeta Zegarra  |   Analista |  Responsable de recopilar y analizar los requisitos del sistema, definiendo las especificaciones funcionales y técnicas, así como de asegurar que el sistema cumpla con las necesidades. |   zumeate21@gmail.com  |   Sí |
|     Angie Cabanillas |   Diseñador |  Encargado de crear una interfaz de usuario intuitiva y amigable, optimizando la experiencia del usuario tanto para estudiantes como para administradores. |    |   Sí |
|    |  Tester |  Encargado de realizar pruebas exhaustivas del sistema para identificar y corregir errores, garantizando que el producto final sea funcional y confiable. |   |  Sí |


| Rol | Encargado | Responsabilidades |
| --- | --- | --- |
|   Product Owner |   Rengifo Pinedo |  Definir y priorizar los requisitos del sistema. Representar los intereses y expectativas del cliente.  |
|     Scrum Master |     Danilo Alvarado Silvano        |  Facilitar el proceso Scrum y eliminar obstáculos. Garantizar el funcionamiento efectivo del equipo.  |
|   Equipo de desarrollo   |   Danilo Alvarado Silvano Walter Armando Zumaeta Zegarra   |   Implementar el sistema según los requisitos definidos. Colaborar en el diseño y desarrollo de funcionalidades.  Asegurar la calidad del código y las funcionalidades.  Contribuir a la entrega exitosa de incrementos de producto.   |


|  N.º  | 1 |
| --- | --- |
| Código | RF-01 |
| Nombre | Registro de usuario |
| Descripción  | El sistema debe permitir el registro de clientes mediante formulario (nombres, apellidos, DNI, correo, contraseña) con validación de correo único. Al registrarse, se genera un token JWT de acceso. |
| Rol | Cliente |
| Prioridad | Alta |


|  N.º  | 2 |
| --- | --- |
| Código | RF-02 |
| Nombre | Autenticación local |
| Descripción  | El sistema debe permitir el inicio de sesión mediante correo y contraseña, validando las credenciales con hash bcrypt y devolviendo un token JWT con el rol del usuario. |
| Rol | Cliente, Administrador |
| Prioridad | Alta |


|  N.º  | 3 |
| --- | --- |
| Código | RF-03 |
| Nombre | Autenticación OAuth |
| Descripción  | El sistema debe permitir el inicio de sesión rápido con Google OAuth, creando automáticamente la cuenta si no existe, asignando el rol "cliente" por defecto o si lo tiene con rol de administrador, y guardando el avatar del proveedor. |
| Rol | Cliente, Administrador |
| Prioridad | Alta |


|  N.º  | 4 |
| --- | --- |
| Código | RF-04 |
| Nombre | Edición de perfil |
| Descripción  | El sistema debe permitir al usuario autenticado actualizar sus datos: nombres, apellidos, DNI, teléfono y dirección; así como subir un avatar (imagen de perfil) almacenado en MinIO. |
| Rol | Cliente, Administrador |
| Prioridad | Alta |


|  N.º  | 5 |
| --- | --- |
| Código | RF-05 |
| Nombre | Cambio de contraseña |
| Descripción  | El sistema debe permitir al usuario local cambiar su contraseña verificando la contraseña actual, validando un mínimo de 8 caracteres y rechazando el cambio para usuarios OAuth.  |
| Rol | Cliente |
| Prioridad | Media |


|  N.º  | 6 |
| --- | --- |
| Código | RF-06 |
| Nombre | Catálogo de Modelos 3D |
| Descripción  | El sistema debe listar todos los modelos 3D activos, mostrando nombre, descripción, precio, categoría (Digitalizado/Impreso) e imágenes de preview. En “Mis Cotizaciones” se debe listar las cotizaciones personalizadas que desea imprimir. |
| Rol | Cliente |
| Prioridad | Alta |


|  N.º  | 7 |
| --- | --- |
| Código | RF-07 |
| Nombre | Carrito (Modelos 3D Digitalizados) |
| Descripción  | El sistema debe permitir añadir modelos digitalizados al carrito (estado PENDING). Si el modelo ya existe en el carrito o ya fue comprado (estado PAID), el sistema debe rechazar la operación e impedir la compra duplicada. La cantidad es siempre 1 y no puede modificarse. |
| Rol | Cliente |
| Prioridad | Alta |


|  N.º  | 8 |
| --- | --- |
| Código | RF-08 |
| Nombre | Carrito (Modelos 3D Impresos) |
| Descripción  | El sistema debe permitir añadir modelos impresos al carrito (estado PENDING) con cantidad variable. Si el modelo ya existe en el carrito, el sistema debe incrementar la cantidad automáticamente. El cliente puede modificar la cantidad desde el carrito. No se bloquea la recompra de un modelo impreso ya adquirido anteriormente. |
| Rol | Cliente |
| Prioridad | Alta |


|  N.º  | 9 |
| --- | --- |
| Código | RF-09 |
| Nombre | Compra de Modelos 3D Digitalizados |
| Descripción  | El sistema debe procesar pagos de modelos digitalizados mediante MercadoPago, actualizando el estado de PENDING a PAID o FAILED y registrando el ID de transacción. |
| Rol | Cliente |
| Prioridad | Alta |


|  N.º  | 10 |
| --- | --- |
| Código | RF-10 |
| Nombre | Descarga de Modelos 3D Digitalizados |
| Descripción  | El sistema debe habilitar la descarga del archivo.glb del modelo digitalizado, únicamente si el estado de la compra es PAID y la compra pertenece al usuario autenticado.  |
| Rol | Cliente |
| Prioridad | Alta |


|  N.º  | 11 |
| --- | --- |
| Código | RF-11 |
| Nombre | Compra de Modelos 3D Impresos |
| Descripción  | El sistema debe procesar pagos de modelos impresos mediante MercadoPago, calculando el monto total como precio unitario × cantidad solicitada. Al confirmar el pago, se debe asignar automáticamente el estado de entrega inicial ACCEPTED con un estimado de entrega de "1 día". |
| Rol | Cliente |
| Prioridad | Alta |


|  N.º  | 12 |
| --- | --- |
| Código | RF-12 |
| Nombre | Seguimiento de entrega (Modelos Impresos) |
| Descripción  | El sistema debe gestionar el seguimiento de los modelos impresos comprados mediante un flujo de estados de entrega: ACCEPTED (pedido aceptado) → IN_PROGRESS (en proceso de impresión/envío) → DELIVERED (entregado). El administrador actualiza el estado y el cliente lo visualiza desde su historial de compras. |
| Rol | Cliente, Administrador |
| Prioridad | Alta |


|  N.º  | 13 |
| --- | --- |
| Código | RF-13 |
| Nombre | Cotizaciones 3D personalizadas |
| Descripción  | El sistema debe permitir al cliente crear solicitudes de cotización con descripción, hasta 5 imágenes referenciales (almacenadas en MinIO), teléfono y preferencia de notificación. |
| Rol | Cliente |
| Prioridad | Alta |


|  N.º  | 14 |
| --- | --- |
| Código | RF-14 |
| Nombre | Gestión de cotizaciones del cliente |
| Descripción  | El sistema debe permitir al cliente editar (solo en estado Pendiente), eliminar y consultar el historial de sus cotizaciones junto con las respuestas del administrador. |
| Rol | Cliente |
| Prioridad | Alta |


|  N.º  | 15 |
| --- | --- |
| Código | RF-15 |
| Nombre | Catálogo de Libros |
| Descripción  | El sistema debe listar todos los libros activos con portada, título, autor, descripción y precio. |
| Rol | Cliente |
| Prioridad | Alta |


|  N.º  | 16 |
| --- | --- |
| Código | RF-16 |
| Nombre | Carrito de compras (Libros)  |
| Descripción  | El sistema debe permitir añadir libros al carrito con validación de duplicados (PENDING y PAID), impidiendo la compra repetida del mismo libro. |
| Rol | Cliente |
| Prioridad | Alta |


|  N.º  | 17 |
| --- | --- |
| Código | RF-17 |
| Nombre | Compra y descarga de Libros |
| Descripción  | El sistema debe procesar el pago del libro mediante MercadoPago y, una vez aprobado, habilitar la descarga del PDF con nombre amigable desde MinIO. |
| Rol | Cliente |
| Prioridad | Alta |


|  N.º  | 18 |
| --- | --- |
| Código | RF-18 |
| Nombre | Catálogo de Cursos |
| Descripción  | El sistema debe listar todos los cursos activos mostrando título, descripción, precio, cupos totales, permitiendo al cliente identificar la disponibilidad. |
| Rol | Cliente |
| Prioridad | Alta |


|  N.º  | 19 |
| --- | --- |
| Código | RF-19 |
| Nombre | Carrito de compras (Cursos)  |
| Descripción  | El sistema debe permitir añadir cursos al carrito verificando disponibilidad de cupos en tiempo real antes de aceptar el ítem, e incrementando la cantidad si ya existe. |
| Rol | Cliente |
| Prioridad | Alta |


|  N.º  | 20 |
| --- | --- |
| Código | RF-20 |
| Nombre | Compra de Cursos con control de cupos |
| Descripción  | El sistema debe validar la disponibilidad de cupos justo antes de procesar el pago. Tras la aprobación, debe incrementar el contador cou_int_sold y registrar la inscripción. |
| Rol | Cliente |
| Prioridad | Alta |


|  N.º  | 21 |
| --- | --- |
| Código | RF-21 |
| Nombre | Carrito unificado |
| Descripción  | El sistema debe permitir acumular productos de distintas categorías (Modelos 3D, Libros, Cursos) en un carrito único, con pago consolidado en una sola transacción de MercadoPago. |
| Rol | Cliente |
| Prioridad | Alta |


|  N.º  | 22 |
| --- | --- |
| Código | RF-22 |
| Nombre | Reserva de tickets (Micro Museo) |
| Descripción  | El sistema debe mostrar la disponibilidad de slots por fecha (generados dinámicamente según horario de apertura/cierre y duración del slot), permitir seleccionar horario y número de invitados (1-10), y crear la reserva en estado PENDING. |
| Rol | Cliente |
| Prioridad | Alta |


|  N.º  | 23 |
| --- | --- |
| Código | RF-23 |
| Nombre | Pago de reserva y generación de QR  |
| Descripción  | Tras confirmar el pago, el sistema debe generar un código QR único, almacenarlo en MinIO, y presentarlo como comprobante digital descargable. |
| Rol | Cliente |
| Prioridad | Alta |


|  N.º  | 24 |
| --- | --- |
| Código | RF-24 |
| Nombre | Expiración automática de reservas |
| Descripción  | El sistema debe expirar automáticamente las reservas PENDING que superen los 15 minutos sin pago, liberando el slot para otros clientes. |
| Rol | Cliente |
| Prioridad | Alta |


|  N.º  | 25 |
| --- | --- |
| Código | RF-25 |
| Nombre | Historial de compras y reservas |
| Descripción  | El sistema debe permitir al cliente consultar todas sus compras pagadas (Modelos, Libros, Cursos) y sus reservas, con posibilidad de re-descargar archivos digitales. |
| Rol | Cliente |
| Prioridad | Alta |


|  N.º  | 26 |
| --- | --- |
| Código | RF-26 |
| Nombre | Dashboard administrativo |
| Descripción  | El sistema debe presentar métricas en tiempo real al administrador: ingresos por reservas, modelos y libros vendidos, cursos inscritos, visitantes del día y totales acumulados. |
| Rol | Admin |
| Prioridad | Alta |


|  N.º  | 27 |
| --- | --- |
| Código | RF-27 |
| Nombre | CRUD de Modelos 3D (Admin) |
| Descripción  | El sistema debe permitir al administrador crear, editar, activar/desactivar y eliminar modelos 3D del catálogo, incluyendo la subida de archivos digitales, portadas e imágenes a MinIO tanto para digitalizados como para los impresos.  |
| Rol | Admin |
| Prioridad | Alta |


|  N.º  | 28 |
| --- | --- |
| Código | RF-28 |
| Nombre | Gestión de Cotizaciones (Admin) |
| Descripción  | El sistema debe permitir al administrador visualizar todas las cotizaciones 3D con datos del cliente, cambiar estado (Pendiente/Cotizado/Comprado/Rechazado) y enviar respuestas escritas. |
| Rol | Admin |
| Prioridad | Alta |


|  N.º  | 29 |
| --- | --- |
| Código | RF-29 |
| Nombre | Gestión Unity AR (CRUD de Especímenes) |
| Descripción  | El sistema debe permitir al administrador crear, editar, activar o desactivar y eliminar especímenes para la App AR externa: subir Targets (imágenes de marcador), AssetBundles 3D, metadata taxonómica y traducciones multilenguaje (ES, EN, PT, FR, IT, DE).  |
| Rol | Admin |
| Prioridad | Alta |


|  N.º  | 30 |
| --- | --- |
| Código | RF-30 |
| Nombre | Dashboard Analítico AR |
| Descripción  | El sistema debe presentar métricas AR al administrador: total de leads registrados desde la App, últimos usuarios AR y conteo de modelos activos/totales, así como para análisis en Unity.  |
| Rol | Admin |
| Prioridad | Alta |


|  N.º  | 31 |
| --- | --- |
| Código | RF-31 |
| Nombre | API público de Targets AR |
| Descripción  | El sistema debe exponer un endpoint público (/public/targets) que retorne la lista de especímenes activos con URLs de marcadores y AssetBundles para consumo de la App Móvil AR.  |
| Rol | Admin |
| Prioridad | Alta |


|  N.º  | 32 |
| --- | --- |
| Código | RF-32 |
| Nombre | Login desde la App AR (Unity) |
| Descripción  | El sistema debe exponer un endpoint /ar-login que registre o identifique usuarios desde la App Móvil sin contraseña, marcándolos como is_ar_user y generando un token JWT. |
| Rol | Cliente |
| Prioridad | Alta |


|  N.º  | 33 |
| --- | --- |
| Código | RF-33 |
| Nombre | CRUD de Libros (Admin) |
| Descripción  | El sistema debe permitir al administrador crear, editar y activar o desactivar libros del catálogo, subiendo portadas, archivos PDF a MinIO y detalles del libro. |
| Rol | Admin |
| Prioridad | Alta |


|  N.º  | 34 |
| --- | --- |
| Código | RF-34 |
| Nombre | CRUD de Cursos (Admin) |
| Descripción  | El sistema debe permitir al administrador crear, editar, activar o desactivar cursos, configurando título, duración, cupos, precio y estado. |
| Rol | Admin |
| Prioridad | Alta |


|  N.º  | 35 |
| --- | --- |
| Código | RF-35 |
| Nombre | Gestión de Reservas (Admin) |
| Descripción  | El sistema debe permitir al administrador visualizar todas las reservas, filtrar por fecha/estado y monitorear la ocupación del museo.  |
| Rol | Admin |
| Prioridad | Alta |


|  N.º  | 36 |
| --- | --- |
| Código | RF-36 |
| Nombre | Scanner de tickets QR |
| Descripción  | El sistema debe permitir al administrador escanear códigos QR en la entrada del museo, validando fecha, estado PAID y marcando el ticket como USED con la fecha/hora de uso.  |
| Rol | Admin |
| Prioridad | Alta |

