# INFORME EJECUTIVO DE AVANCE DEL PROYECTO

---

## DATOS GENERALES

| Campo | Detalle |
| :--- | :--- |
| **Nombre del Proyecto** | Yalotengo — Plataforma E-commerce de Comercialización Tecnológica |
| **Empresa / Iniciativa** | Invéntalo |
| **Metodología** | Scrum |
| **Fecha del Informe** | 13 de mayo de 2026 |
| **Etapa Actual** | Sprint 3 — Diseño de Interfaces Gráficas de Usuario |

---

## 1. RESUMEN EJECUTIVO

El presente informe documenta el avance del proyecto "Yalotengo", una plataforma e-commerce de comercialización integral desarrollada para la iniciativa peruana "Invéntalo". El sistema tiene como objetivo centralizar y automatizar la venta de Modelos 3D digitalizados e impresos, cotizaciones personalizadas, Libros digitales, inscripción a Cursos técnicos, Reserva de tickets para micro museos, y la gestión administrativa de activos para Realidad Aumentada.

El desarrollo se ejecuta bajo la metodología ágil **Scrum**, organizando el trabajo en sprints de duración definida. Hasta la fecha, el proyecto ha completado las fases de análisis de requerimientos y definición de la arquitectura del sistema, y se encuentra finalizando la **etapa de Diseño de Interfaces Gráficas de Usuario**, donde se han elaborado los prototipos y mockups de las pantallas principales de la plataforma.

---

## 2. METODOLOGÍA ÁGIL: SCRUM

### 2.1. ¿Por qué Scrum?

Se eligió Scrum por su capacidad de gestión iterativa e incremental, ideal para un proyecto con múltiples verticales de negocio. Este enfoque permite:

- **Entregas frecuentes** de incrementos funcionales al final de cada sprint.
- **Adaptabilidad** ante cambios de requerimientos durante el desarrollo.
- **Retroalimentación continua** con los interesados de "Invéntalo".

### 2.2. Roles del Equipo Scrum

| Rol Scrum | Encargado | Responsabilidades |
| :--- | :--- | :--- |
| **Product Owner** | Rengifo Pinedo, Brittany Ariana | Definir y priorizar los requisitos del sistema. Representar los intereses del cliente. |
| **Scrum Master** | Alvarado Silvano, Danilo | Facilitar el proceso Scrum, eliminar obstáculos y garantizar el funcionamiento del equipo. |
| **Equipo de Desarrollo** | Alvarado Silvano, Danilo (Fullstack); Mozombite Gastón, Fabrizio Gael (Backend); Rengifo Teagua, Axel Andre (Frontend); Torres Flores, Julio Adrian (Analista); Reátegui Piña, Fressia Nicolle (Diseñadora); Li, Xuan (DBA) | Implementar el sistema, diseñar, desarrollar funcionalidades y asegurar la calidad del código. |

### 2.3. Personal Involucrado

| Nombre | Rol | Responsabilidades | Contacto |
| :--- | :--- | :--- | :--- |
| Alvarado Silvano, Danilo | Scrum Master / Desarrollador Fullstack | Liderar el proceso ágil y desarrollo integral del sistema. | daniloalvarado2002@gmail.com |
| Rengifo Pinedo, Brittany Ariana | Product Owner / Líder de Proyecto | Gestión del Product Backlog y coordinación del proyecto. | brittanyrengifo@gmail.com |
| Mozombite Gastón, Fabrizio Gael | Desarrollador Backend | Desarrollo de la lógica del lado del servidor y APIs. | fabriziomozombite@gmail.com |
| Rengifo Teagua, Axel Andre | Desarrollador Frontend | Implementación de interfaces de usuario interactivas. | axelrengifo@gmail.com |
| Torres Flores, Julio Adrian | Analista de Sistemas | Análisis de requerimientos y documentación técnica. | juliotorres@gmail.com |
| Reátegui Piña, Fressia Nicolle | Diseñadora UI/UX y Control de Calidad | Diseño de interfaces y aseguramiento de la calidad. | fressiareategui@gmail.com |
| Li, Xuan | Administrador de Base de Datos | Gestión de base de datos MySQL y almacenamiento MinIO. | xuanli@gmail.com |

---

## 3. PLANIFICACIÓN DE SPRINTS

### 3.1. Product Backlog

El Product Backlog contiene **36 Requisitos Funcionales** organizados por módulo y prioridad. Los requisitos fueron levantados durante la fase de análisis y validados con el Product Owner.

### 3.2. Sprints Planificados

| Sprint | Duración | Objetivo | Estado |
| :--- | :--- | :--- | :--- |
| **Sprint 1** | Semanas 1-2 | Levantamiento de requerimientos, análisis del sistema, definición de requisitos funcionales y casos de uso. | ✅ Completado |
| **Sprint 2** | Semanas 3-4 | Definición de la arquitectura del sistema. Diseño del modelo de base de datos y flujos de proceso. | ✅ Completado |
| **Sprint 3** | Semanas 5-6 | **Diseño de Interfaces Gráficas de Usuario.** Elaboración de prototipos y mockups de las pantallas principales del e-commerce y del panel administrativo. | 🔄 En curso |
| **Sprint 4** | Semanas 7-8 | Desarrollo e implementación del sistema. Codificación de módulos, integración de componentes, pruebas y despliegue en producción. | ⏳ Pendiente |

---

## 4. DISEÑO POR MÓDULO

A continuación se describe el diseño planificado de cada módulo del sistema, según los requisitos funcionales definidos en el Sprint 1.

### 4.1. Módulo de Autenticación y Perfil (RF-01 a RF-05)
- Registro tradicional con validación de correo único.
- Inicio de sesión con JWT, local y Google OAuth.
- Edición de perfil con subida de avatar a MinIO.
- Cambio de contraseña: el sistema verifica que la contraseña actual sea correcta antes de permitir el cambio, exige un mínimo de 8 caracteres para la nueva contraseña, y bloquea la opción para usuarios que se registraron vía Google OAuth.

### 4.2. Módulo de Modelos 3D (RF-06 a RF-14)
- Catálogo público con filtros por categoría: Digitalizado e Impreso.
- Carrito con prevención de duplicados para digitalizados. No se puede agregar el mismo modelo si ya está en el carrito o ya fue comprado.
- Carrito con cantidad variable para modelos impresos.
- Pasarela de pagos MercadoPago integrada.
- Descarga segura de archivos .glb post-pago, solo para modelos digitalizados.
- Seguimiento de entrega para modelos impresos: el administrador gestiona el estado del pedido a través de las fases ACCEPTED → IN_PROGRESS → DELIVERED, y el cliente puede consultar el estado desde su historial.
- Módulo de cotizaciones personalizadas con hasta 5 imágenes referenciales.
- Panel admin: CRUD completo de modelos con subida de archivos a MinIO.

### 4.3. Módulo de Libros (RF-15 a RF-17)
- Catálogo de libros con imagen de portada, autor y descripción.
- Carrito con prevención de compra repetida. Si el libro ya fue comprado o ya está en el carrito, el sistema rechaza la operación para evitar cobros innecesarios.
- Descarga automática de PDF tras confirmación de pago.
- Panel admin: CRUD de libros con subida de imagen de portada y archivo PDF.

### 4.4. Módulo de Cursos (RF-18 a RF-20)
- Catálogo con cupos disponibles en tiempo real.
- Control de cupos al momento del pago.
- Inscripción automática post-pago.
- Panel admin: CRUD de cursos con gestión de cupos.

### 4.5. Módulo de Reservas y Ticketing QR (RF-22 a RF-25, RF-35, RF-36)
- Generación dinámica de slots por fecha y horario.
- Reserva con selección de invitados de 1 a 10.
- Pago con MercadoPago y generación de QR automático.
- Expiración automática de reservas no pagadas a los 15 minutos.
- Panel admin: Venta en taquilla en efectivo, Escáner QR y Gestión de reservas.

### 4.6. Módulo Unity AR — Gestión Backend (RF-29 a RF-32)
- CRUD de especímenes con metadata taxonómica Darwin Core.
- Subida de AssetBundles .unity3d, .glb y Targets a MinIO.
- Soporte multilenguaje: ES, EN, PT, FR, IT, DE.
- API pública `/public/targets` para consumo de la App Móvil AR.
- Endpoint `/ar-login` para registro de usuarios desde la App.
- Dashboard analítico AR con métricas de leads y modelos activos.

### 4.7. Carrito Unificado y Pasarela de Pagos (RF-21)
- Carrito que acumula productos de todas las categorías: Modelos 3D, Libros y Cursos.
- Pago consolidado en una sola transacción MercadoPago.

### 4.8. Dashboard Administrativo (RF-26)
- Métricas en tiempo real: ingresos, modelos vendidos, libros, cursos inscritos, visitantes del día.

---

## 5. ETAPA ACTUAL: DISEÑO DE INTERFACES GRÁFICAS

### 5.1. Criterios de Diseño

El diseño de las interfaces se ha realizado siguiendo principios de **UX/UI modernos**, priorizando:

- **Estética Premium:** Paleta de colores con modo claro y acentos en verde esmeralda para transmitir innovación tecnológica.
- **Responsividad:** Todas las interfaces son adaptativas a desktop, tablet y móvil.
- **Accesibilidad:** Contraste adecuado, tipografía legible y navegación intuitiva.
- **Feedback visual:** Animaciones de carga, toasts de confirmación, estados de botones activo/deshabilitado.

### 5.2. Principales Pantallas Diseñadas

#### 5.2.1. Página de Inicio
- Hero section con imagen de portada a pantalla completa.
- Degradado oscuro sobre la imagen para legibilidad del texto.
- Título "YA LO TENGO" con tipografía Black y animaciones de entrada.
- Badge de "Tecnología e Innovación" con estilo glassmorphism.
- Subtítulo con acentos en verde esmeralda: "INVESTIGACIÓN. DESARROLLO. INNOVACIÓN."

#### 5.2.2. Página de Autenticación
- Diseño dividido en dos columnas en escritorio: mensaje de bienvenida y formulario.
- Tabs para alternar entre "Iniciar sesión" y "Crear cuenta".
- Integración visual de botón "Continuar con Google".
- Icono de ojo para mostrar/ocultar contraseña.

#### 5.2.3. Catálogo de Productos
- Grid responsivo de tarjetas con imagen, título, descripción y precio.
- Filtros por categoría: Digitalizados, Impresos y Libros.
- Modal de vista ampliada de imagen al hacer clic.
- Botón "Agregar al carrito" con feedback visual.

#### 5.2.4. Panel Administrativo — Modelos 3D
- Tabla con listado de modelos: nombre, categoría, precio y estado.
- Modal de creación/edición con formulario completo.
- Subida de archivos con indicador de progreso: imagen de preview, modelo .glb e imágenes adicionales.

#### 5.2.5. Panel Administrativo — Libros
- Listado de libros con imagen miniatura, título y autor.
- Formulario modal para crear/editar con subida de PDF e imagen de portada del libro.

#### 5.2.6. Panel Administrativo — Cursos
- Gestión de cursos con control visual de cupos vendidos vs. disponibles.
- Formulario con campos de título, descripción, precio, cupos y duración.

#### 5.2.7. Panel Administrativo — Unity AR (Micromuseo)
- Formulario avanzado con metadata taxonómica Darwin Core.
- Tabs de idiomas para traducciones multilenguaje.
- Subida de AssetBundles .unity3d, .glb y marcadores AR con preview de imagen.

#### 5.2.8. Panel de Reservas
- **Venta en Taquilla:** Grid de slots horarios con estados disponible, lleno y cerrado. Panel lateral de cobro con cálculo automático del total.
- **Escáner QR:** Visor de cámara integrado para escanear tickets en la entrada del museo.
- **Gestión:** Tabla con filtros por fecha, estado y buscador por cliente. Estadísticas de ingresos, visitantes y aforo.

#### 5.2.9. Cotizaciones 3D (Admin)
- Listado de cotizaciones con datos del cliente, estado y preferencias de notificación.
- Galería de imágenes referenciales con descarga en ZIP.
- Modal de respuesta con selector de estado y campo de texto para la oferta.

---

## 6. ARTEFACTOS SCRUM GENERADOS

| Artefacto | Descripción |
| :--- | :--- |
| **Product Backlog** | 36 Requisitos Funcionales priorizados por módulo. |
| **Sprint Backlog** | Tareas específicas asignadas por sprint. |
| **Incremento** | Al final de cada sprint se entrega un avance tangible: documentos de análisis, prototipos de diseño o código funcional, según la etapa. |
| **Definition of Done** | Un entregable se considera "Done" cuando ha sido revisado y aprobado por el Product Owner. |

---

## 7. TECNOLOGÍAS UTILIZADAS

| Capa | Tecnología |
| :--- | :--- |
| **Frontend** | React 18 + Vite, TailwindCSS, Recharts |
| **Backend** | Node.js + Express |
| **Base de Datos** | MySQL |
| **Almacenamiento** | MinIO |
| **Autenticación** | JWT + Google OAuth 2.0 |
| **Pagos** | MercadoPago SDK |
| **Contenedores** | Docker + Docker Compose |
| **Servidor** | VPS Linux (Ubuntu) |
| **Control de Versiones** | Git + GitHub |
| **Modelo 3D / AR** | Unity, AssetBundles |

---

## 8. RIESGOS IDENTIFICADOS Y MITIGACIÓN

| Riesgo | Impacto | Mitigación |
| :--- | :--- | :--- |
| Caída del servicio de MercadoPago | Alto | Manejo de errores con reintentos y notificaciones al admin. |
| Archivos grandes de AssetBundles saturan el almacenamiento | Medio | MinIO con política de retención y monitoreo de uso de disco. |
| Acceso no autorizado a recursos administrativos | Alto | Middleware de autenticación JWT + verificación de rol en cada ruta protegida. |

---

## 9. CONCLUSIONES

1. El proyecto "Yalotengo" se encuentra avanzando conforme al cronograma establecido bajo la metodología Scrum.
2. Se han completado exitosamente los Sprints 1 y 2, cubriendo el análisis de requerimientos y la definición de la arquitectura del sistema.
3. El Sprint 3, actualmente en curso, se enfoca en el diseño de las interfaces gráficas de usuario mediante prototipos y mockups.
4. Las interfaces diseñadas cumplen con estándares modernos de UX/UI, priorizando la responsividad, la accesibilidad y la experiencia del usuario.
5. El desarrollo e implementación del código está planificado para el Sprint 4, una vez aprobados los diseños por el Product Owner.

---

## 10. PRÓXIMOS PASOS — SPRINT 4

- [ ] Desarrollo e implementación del Backend.
- [ ] Desarrollo del Frontend basado en los diseños aprobados.
- [ ] Integración de la pasarela de pagos MercadoPago.
- [ ] Pruebas integrales de todos los módulos.
- [ ] Despliegue en el VPS de producción.

---

*Elaborado por el Equipo de Desarrollo Yalotengo — Invéntalo, 2026.*
*Integrantes: Alvarado Silvano Danilo, Mozombite Gastón Fabrizio Gael, Rengifo Pinedo Brittany Ariana, Rengifo Teagua Axel Andre, Torres Flores Julio Adrian, Reátegui Piña Fressia Nicolle, Li Xuan.*
