# INFORME EJECUTIVO FINAL DEL PROYECTO

# YALOTENGO
## Ecosistema Web de Comercialización Tecnológica

**Integrantes:**
- Alvarado Silvano, Danilo
- Rengifo Pinedo, Brittany Ariana
- Mozombite Gastón, Fabrizio Gael
- Rengifo Teagua, Axel Andre
- Torres Flores, Julio Adrian
- Reátegui Piña, Fressia Nicolle
- Li, Xuan

**Empresa:** Invéntalo
**Fecha:** Junio de 2026
**Metodología:** Scrum (Desarrollo Ágil)

---

## 1. RESUMEN EJECUTIVO

El presente informe documenta la culminación y despliegue del proyecto "Yalotengo", una plataforma e-commerce de comercialización integral desarrollada para la iniciativa peruana "Invéntalo". El sistema centraliza y automatiza la venta de Modelos 3D digitalizados e impresos, libros digitales, y reserva de tickets para micromuseos. (*Nota: Las secciones de cotizaciones personalizadas y cursos han sido omitidas para el alcance de este proyecto*).

El desarrollo se ejecutó exitosamente bajo la metodología ágil Scrum, completando todas las fases del ciclo de vida del software, desde el levantamiento de requerimientos y diseño de interfaces, hasta el desarrollo de código y su posterior despliegue en un entorno de producción.

## 2. METODOLOGÍA ÁGIL: SCRUM

### 2.1. ¿Por qué Scrum?
Se eligió Scrum por su capacidad de gestión iterativa e incremental, ideal para un proyecto con múltiples verticales de negocio. Este enfoque permitió:
- Entregas frecuentes de incrementos funcionales al final de cada sprint.
- Adaptabilidad ante cambios de requerimientos durante el desarrollo.
- Retroalimentación continua con los interesados de "Invéntalo".

### 2.2. Roles del Equipo Scrum
> *[🖼️ INSERTE IMAGEN AQUÍ: Gráfico o tabla de Roles del Equipo Scrum]*

### 2.3. Personal Involucrado
> *[🖼️ INSERTE IMAGEN AQUÍ: Tabla de Personal Involucrado]*

## 3. GESTIÓN DE SPRINTS

### 3.1. Product Backlog
El Product Backlog contuvo los requisitos funcionales organizados por módulo y prioridad. Los requisitos fueron levantados, validados e iterados con el Product Owner a lo largo del proyecto.

### 3.2. Sprints Ejecutados
> *[🖼️ INSERTE IMAGEN AQUÍ: Cronograma o tabla de los Sprints Ejecutados]*

## 4. MÓDULOS DEL SISTEMA

A continuación, se describen las funcionalidades implementadas en cada módulo de la plataforma.

### 4.1. Módulo de Autenticación y Perfil 
- Registro tradicional con validación de correo único.
- Inicio de sesión con JWT, local y Google OAuth.
- Edición de perfil con subida de avatar a MinIO.
- Cambio de contraseña: el sistema verifica que la contraseña actual sea correcta antes de permitir el cambio, exige un mínimo de 8 caracteres y bloquea la opción para usuarios que se registraron vía Google OAuth.

### 4.2. Módulo de Modelos 3D 
- Catálogo público con filtros por categoría: Digitalizado e Impreso.
- Carrito con prevención de duplicados para digitalizados. 
- Carrito con cantidad variable para modelos impresos.
- Pasarela de pagos MercadoPago integrada.
- Descarga segura de archivos en formato GLB post-pago, solo para modelos digitalizados.
- Seguimiento de entrega para modelos impresos: el administrador gestiona el estado del pedido (ACCEPTED → IN_PROGRESS → DELIVERED), y el cliente puede consultar el estado desde su historial.
- Panel admin: CRUD completo de modelos con subida de archivos a MinIO.

### 4.3. Módulo de Libros 
- Catálogo de libros con imagen de portada, autor y descripción.
- Carrito con prevención de compra repetida. Si el libro ya fue comprado o ya está en el carrito, el sistema rechaza la operación para evitar cobros innecesarios.
- Descarga automática de PDF tras confirmación de pago.
- Panel admin: CRUD de libros con subida de imagen de portada y archivo PDF.

### 4.4. Módulo de Reservas y Ticketing QR 
- Generación dinámica de slots por fecha y horario.
- Reserva con selección de invitados de 1 a 10.
- Pago con MercadoPago y generación de QR automático.
- Expiración automática de reservas no pagadas a los 15 minutos.
- Panel admin: Venta en taquilla en efectivo, Escáner QR de validación y Gestión de reservas.

### 4.5. Carrito Unificado y Pasarela de Pagos
- Carrito que acumula productos de todas las categorías activas: Modelos 3D y Libros.
- Pago consolidado en una sola transacción mediante MercadoPago.

### 4.6. Dashboard Administrativo 
- Métricas en tiempo real: ingresos, modelos vendidos, libros, visitantes del día.

## 5. INTERFACES GRÁFICAS DE USUARIO

### 5.1. Criterios de Diseño
El diseño de las interfaces se materializó siguiendo principios de UX/UI modernos, priorizando:
- **Estética:** Paleta de colores con modo claro y oscuro, con acentos en verde esmeralda para transmitir innovación tecnológica.
- **Responsividad:** Todas las interfaces son completamente adaptables a desktop, tablet y móvil.
- **Accesibilidad:** Contraste adecuado, tipografía legible y navegación intuitiva.
- **Feedback visual:** Animaciones de carga, notificaciones en pantalla (toasts) y validaciones visuales.

### 5.2. Principales Pantallas Implementadas

#### 5.2.1. Página de Autenticación
Permite a los usuarios registrarse o iniciar sesión en el sistema de forma segura. Existe la opción de utilizar un correo electrónico y contraseña local, o utilizar la autenticación de un solo paso mediante una cuenta de Google.
> *[🖼️ INSERTE IMAGEN AQUÍ: Captura de la Página de Autenticación]*

#### 5.2.2. Página de Inicio
Una interfaz moderna e intuitiva que recibe a los visitantes. Presenta un eslogan dinámico ("INVESTIGACIÓN. DESARROLLO. INNOVACIÓN.") acompañado de accesos rápidos a los catálogos de Modelos 3D, Libros, Reservas o directamente al carrito de compras.
> *[🖼️ INSERTE IMAGEN AQUÍ: Captura de la Página de Inicio]*

#### 5.2.3. Módulo de Modelos 3D
**Cliente:** Navegación a través del catálogo de modelos digitales (etiquetados como "GLB") listos para la descarga tras el pago, o réplicas físicas ("Impresos") habilitadas para entrega a domicilio.
> *[🖼️ INSERTE IMAGEN AQUÍ: Captura del catálogo de modelos 3D Digitalizados e Impresos]*

**Administrador:** Panel de gestión con control total para registrar nuevos modelos, asignar precios y usar herramientas de acción rápida. Además, una vista logística para llevar el seguimiento y actualizar el estado de los envíos de los modelos físicos.
> *[🖼️ INSERTE IMAGEN AQUÍ: Captura del panel de administración de Modelos 3D y tabla de compras logísticas]*

#### 5.2.4. Módulo de Libros
**Cliente:** Visualización de portadas de libros, autores y reseñas, permitiendo la compra de literatura digital con validaciones de prevención de compra doble.
> *[🖼️ INSERTE IMAGEN AQUÍ: Captura del catálogo de Libros]*

**Administrador:** Panel de inventario para cargar los archivos PDF y portadas, definiendo su información para el público.
> *[🖼️ INSERTE IMAGEN AQUÍ: Captura del panel de administración de Libros]*

#### 5.2.5. Pasarela de Pagos con MercadoPago
Interfaz de checkout unificada que muestra el resumen del pedido consolidado y permite pagar con Tarjeta de Crédito/Débito o Yape en una experiencia cifrada y sin salir de la plataforma.
> *[🖼️ INSERTE IMAGEN AQUÍ: Captura del Checkout integrado con MercadoPago]*

#### 5.2.6. Módulo de Reservas
**Cliente:** Interfaz interactiva para la selección de día, horario de visita al micromuseo y número de asistentes, con cálculo automático del precio y pago en línea.
> *[🖼️ INSERTE IMAGEN AQUÍ: Captura de la interfaz de Reservas]*

**Administrador:** Panel de Taquilla para gestionar ingresos presenciales en efectivo y un sistema de escáner que usa la cámara web para validar boletos QR de los visitantes.
> *[🖼️ INSERTE IMAGEN AQUÍ: Captura del panel de Taquilla y Escáner QR]*

#### 5.2.7. Carrito de Compras
Página de revisión de pedido que detalla productos digitales y físicos, permitiendo ajustar cantidades en tiempo real antes del pago.
> *[🖼️ INSERTE IMAGEN AQUÍ: Captura del Carrito de Compras]*

#### 5.2.8. Historial de Compras
Espacio centralizado categorizado por pestañas donde el usuario tiene disponible todas sus compras y botones directos para descargar sus archivos digitales (GLB, PDF).
> *[🖼️ INSERTE IMAGEN AQUÍ: Captura del Historial de Compras]*

#### 5.2.9. Edición de Perfil
Formulario en el que el usuario puede actualizar datos personales, avatar, y modificar contraseñas.
> *[🖼️ INSERTE IMAGEN AQUÍ: Captura del formulario de Edición de Perfil]*

#### 5.2.10. Dashboard
Panel de control general que concentra métricas clave: gráficas de ingresos, volumen de ventas y flujo de asistentes al micromuseo.
> *[🖼️ INSERTE IMAGEN AQUÍ: Captura del Dashboard Administrativo]*

## 6. DISEÑO DE BASE DE DATOS (MODELO RELACIONAL)

El ecosistema Yalotengo ha sido estructurado bajo un enfoque modular y escalable. A continuación, se presenta la arquitectura de la base de datos:

> *[🖼️ INSERTE IMAGEN AQUÍ: Esquema general visual de la base de datos]*

La base de datos funciona como el motor unificado de la plataforma, usando como eje central la tabla de usuarios (`core_user`). Esta se conecta con tres módulos principales:
1. **Modelos 3D (`mod_model3d` y `mod_purchase`):** Vincula los archivos 3D y transacciones logísticas.
2. **Libros (`boo_book` y `bpu_book_purchase`):** Enlaza literatura en PDF con sus respectivos comprobantes.
3. **Reservas (`res_reservation`):** Agenda fechas y horarios, genera pases de asistentes y códigos QR.
De esta manera, toda la actividad de compras y reservas queda unida de forma íntegra al historial financiero del usuario.

> *[🖼️ INSERTE IMAGEN AQUÍ: Diagrama detallado de relaciones]*

## 7. ARTEFACTOS SCRUM GENERADOS
> *[🖼️ INSERTE IMAGEN AQUÍ: Tabla o capturas de Artefactos Scrum (Backlog, Sprint backlog, Trello/Jira, etc.)]*

## 8. TECNOLOGÍAS UTILIZADAS
> *[🖼️ INSERTE IMAGEN AQUÍ: Logos de Tecnologías utilizadas (Node.js, React, Tailwind, MySQL, MercadoPago, MinIO, etc.)]*

## 9. IMPLEMENTACIÓN TÉCNICA (Backend & Frontend)

### 9.1. Arquitectura y Configuración
- **Estructura Base:** Servidor en Node.js/Express con variables de entorno, CORS y manejo de errores globales.
- **Base de Datos:** Implementada en MySQL empleando Sequelize (ORM) con migraciones iniciales.
- **Estado Frontend:** Uso de Context API para sesión de usuario y carrito de compras en React.
- **Cliente HTTP:** Instancias de Axios con interceptores de tokens JWT automáticos.

### 9.2. Autenticación y Usuarios
- Endpoints de registro y login (JWT + bcrypt).
- Integración de Google OAuth 2.0 unificada.
- Subida de archivos (Avatares) hacia el almacenamiento local/MinIO.

### 9.3. Backend Core y Almacenamiento
- Middlwares (Multer) configurados para subidas concurrentes de formatos pesados (.glb, .pdf).
- Controladores CRUD completos, paginados y asegurados con roles de administrador.

### 9.4. Vistas de Catálogo y Cliente
- Grids responsivos implementados en TailwindCSS.
- Integración del visor nativo `<model-viewer>` para la interactividad de elementos 3D.
- Lógicas estrictas en Frontend y Backend para bloquear dobles adquisiciones en material digital.

### 9.5. Pasarela de Pagos (MercadoPago)
- Preferencias de pago y webhooks configurados y operativos.
- Escucha de notificaciones asíncronas (IPN) para confirmar ventas y habilitar descargas digitales de forma automatizada, garantizando seguridad en las descargas (los links solo funcionan post-pago validado).

### 9.6. Componente de Reservas 
- Algoritmos para manejo dinámico de aforo (por slots y por personas).
- Generación y cifrado automático de códigos QR, validados en vivo en el Panel Administrativo a través de cámara web.

### 9.7. Calidad, Pruebas y Despliegue
- Pruebas en el flujo "End-to-End" desde selección de producto, pago en MercadoPago y obtención final.
- Aplicación contenerizada o configurada en servidor (Linux/Ubuntu) usando Nginx, con certificados SSL garantizando acceso seguro.

## 10. CONCLUSIONES

1. El proyecto "Yalotengo" fue finalizado e implementado satisfactoriamente, cumpliendo con los estándares requeridos como ecosistema de comercialización tecnológica.
2. Todas las integraciones clave (Catálogo 3D, Venta de Libros y Módulo de Micromuseo) fueron consolidadas en una arquitectura de Carrito de Compras universal.
4. Las interfaces de usuario (UI/UX) brindan experiencias atractivas, con soporte a modos oscuro/claro y total adaptabilidad en móviles.
5. El sistema ya cuenta con los requerimientos necesarios de seguridad, pagos mediante MercadoPago y entrega digital automática para escalar en el mercado.
