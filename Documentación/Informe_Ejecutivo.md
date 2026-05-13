# INFORME EJECUTIVO DE AVANCE DEL PROYECTO

---

## DATOS GENERALES

| Campo | Detalle |
| :--- | :--- |
| **Nombre del Proyecto** | Yalotengo — Ecosistema Web de Comercialización Tecnológica |
| **Empresa / Iniciativa** | Invéntalo |
| **Metodología** | Scrum (Desarrollo Ágil) |
| **Fecha del Informe** | 13 de mayo de 2026 |
| **Etapa Actual** | Sprint 3 — Diseño de Interfaces Gráficas de Usuario |

---

## 1. RESUMEN EJECUTIVO

El presente informe documenta el avance del proyecto "Yalotengo", una plataforma web de comercialización integral desarrollada para la iniciativa peruana "Invéntalo". El sistema tiene como objetivo centralizar y automatizar la venta de Modelos 3D (digitalizados, impresos y cotizaciones personalizadas), Libros digitales, inscripción a Cursos técnicos, Reserva de tickets para micro museos, y la gestión administrativa de activos de Realidad Aumentada (Unity AR).

El desarrollo se ejecuta bajo la metodología ágil **Scrum**, organizando el trabajo en sprints de duración definida. Hasta la fecha, el proyecto ha completado las fases de análisis de requerimientos, arquitectura del sistema y se encuentra finalizando la **etapa de Diseño de Interfaces Gráficas de Usuario (UI/UX)**, con interfaces funcionales ya implementadas para los módulos principales tanto del lado del cliente como del administrador.

---

## 2. METODOLOGÍA ÁGIL: SCRUM

### 2.1. ¿Por qué Scrum?

Se eligió Scrum por su capacidad de gestión iterativa e incremental, ideal para un proyecto con múltiples verticales de negocio (Modelos 3D, Libros, Cursos, Reservas, Unity AR). Este enfoque permite:

- **Entregas frecuentes** de incrementos funcionales al final de cada sprint.
- **Adaptabilidad** ante cambios de requerimientos durante el desarrollo.
- **Retroalimentación continua** con los interesados de "Invéntalo".

### 2.2. Roles del Equipo Scrum

| Rol Scrum | Encargado | Responsabilidades |
| :--- | :--- | :--- |
| **Product Owner** | Brittany Rengifo Pinedo | Definir y priorizar los requisitos del sistema. Representar los intereses del cliente. |
| **Scrum Master** | Danilo Alvarado Silvano | Facilitar el proceso Scrum, eliminar obstáculos y garantizar el funcionamiento del equipo. |
| **Equipo de Desarrollo** | Danilo Alvarado Silvano, Walter Armando Zumaeta Zegarra | Implementar el sistema, diseñar, desarrollar funcionalidades y asegurar la calidad del código. |

### 2.3. Personal Involucrado

| Nombre | Rol | Responsabilidades | Contacto |
| :--- | :--- | :--- | :--- |
| Danilo Alvarado | Desarrollador | Desarrollo de componentes y funcionalidades del sistema. Participación en diseño y pruebas. | daniloalvarado2002@gmail.com |
| Brittany Rengifo | Líder de Proyecto | Coordinación general, toma de decisiones, planificación y supervisión del progreso. | — |
| Walter Zumaeta Zegarra | Analista | Recopilar y analizar requisitos, definir especificaciones funcionales y técnicas. | zumeate21@gmail.com |
| Angie Cabanillas | Diseñador | Crear interfaces de usuario intuitivas y optimizar la experiencia del usuario. | — |

---

## 3. PLANIFICACIÓN DE SPRINTS

### 3.1. Product Backlog (Resumen)

El Product Backlog contiene **36 Requisitos Funcionales (RF)** organizados por módulo y prioridad. Los requisitos fueron levantados durante la fase de análisis y validados con el Product Owner.

### 3.2. Sprints Ejecutados

| Sprint | Duración | Objetivo | Estado |
| :--- | :--- | :--- | :--- |
| **Sprint 1** | Semanas 1-2 | Arquitectura base: Backend (Node.js + Express), Base de Datos (MySQL), Almacenamiento (MinIO), Docker. Autenticación (JWT + OAuth Google). | ✅ Completado |
| **Sprint 2** | Semanas 3-4 | Módulos de negocio: CRUD de Modelos 3D (Admin), Catálogo de cliente, Carrito unificado, Pasarela de pagos (MercadoPago), CRUD de Libros, CRUD de Cursos. | ✅ Completado |
| **Sprint 3** | Semanas 5-6 | Reservas y Ticketing QR, Unity AR (gestión de AssetBundles), Cotizaciones 3D personalizadas, **Diseño y pulido de interfaces gráficas**. | 🔄 En curso |
| **Sprint 4** | Semanas 7-8 | Pruebas integrales, corrección de bugs, optimización de rendimiento, despliegue final en VPS de producción. | ⏳ Pendiente |

---

## 4. AVANCE POR MÓDULO

### 4.1. Módulo de Autenticación y Perfil (RF-01 a RF-05)
- **Estado:** ✅ Completado
- Registro tradicional con validación de correo único.
- Inicio de sesión con JWT (local y Google OAuth).
- Edición de perfil con subida de avatar a MinIO.
- Cambio de contraseña con validación de seguridad.

### 4.2. Módulo de Modelos 3D (RF-06 a RF-14)
- **Estado:** ✅ Completado
- Catálogo público con filtros por categoría (Digitalizado / Impreso).
- Carrito con validación de duplicados para digitalizados.
- Carrito con cantidad variable para impresos.
- Pasarela de pagos MercadoPago integrada.
- Descarga segura de archivos `.glb` post-pago.
- Seguimiento de entrega (ACCEPTED → IN_PROGRESS → DELIVERED).
- Módulo de cotizaciones personalizadas con hasta 5 imágenes referenciales.
- Panel admin: CRUD completo de modelos con subida de archivos a MinIO.

### 4.3. Módulo de Libros (RF-15 a RF-17)
- **Estado:** ✅ Completado
- Catálogo de libros con portada, autor y descripción.
- Carrito con validación de compra duplicada.
- Descarga automática de PDF tras confirmación de pago.
- Panel admin: CRUD de libros con subida de portada y PDF.

### 4.4. Módulo de Cursos (RF-18 a RF-20)
- **Estado:** ✅ Completado
- Catálogo con cupos disponibles en tiempo real.
- Control de cupos al momento del pago.
- Inscripción automática post-pago.
- Panel admin: CRUD de cursos con gestión de cupos.

### 4.5. Módulo de Reservas y Ticketing QR (RF-22 a RF-25, RF-35, RF-36)
- **Estado:** ✅ Completado
- Generación dinámica de slots por fecha y horario.
- Reserva con selección de invitados (1-10).
- Pago con MercadoPago y generación de QR automático.
- Expiración automática de reservas no pagadas (15 min).
- Panel admin: Venta en taquilla (efectivo), Escáner QR y Gestión de reservas.

### 4.6. Módulo Unity AR — Gestión Backend (RF-29 a RF-32)
- **Estado:** ✅ Completado
- CRUD de especímenes con metadata taxonómica (Darwin Core).
- Subida de AssetBundles (.unity3d) y Targets (marcadores AR) a MinIO.
- Soporte multilenguaje (ES, EN, PT, FR, IT, DE).
- API pública `/public/targets` para consumo de la App Móvil AR.
- Endpoint `/ar-login` para registro de usuarios desde la App.
- Dashboard analítico AR con métricas de leads y modelos activos.

### 4.7. Carrito Unificado y Pasarela de Pagos (RF-21)
- **Estado:** ✅ Completado
- Carrito que acumula productos de todas las categorías.
- Pago consolidado en una sola transacción MercadoPago.

### 4.8. Dashboard Administrativo (RF-26)
- **Estado:** ✅ Completado
- Métricas en tiempo real: ingresos, modelos vendidos, libros, cursos inscritos, visitantes del día.

---

## 5. ETAPA ACTUAL: DISEÑO DE INTERFACES GRÁFICAS

### 5.1. Criterios de Diseño

El diseño de las interfaces se ha realizado siguiendo principios de **UX/UI modernos**, priorizando:

- **Estética Premium:** Paleta de colores con modo oscuro y acentos en verde esmeralda (`#0d9467`) para transmitir innovación tecnológica.
- **Responsividad:** Todas las interfaces son adaptativas (desktop, tablet, móvil).
- **Accesibilidad:** Contraste adecuado, tipografía legible y navegación intuitiva.
- **Feedback visual:** Animaciones de carga, toasts de confirmación (éxito/error), estados de botones (activo/deshabilitado).

### 5.2. Principales Pantallas Diseñadas

#### 5.2.1. Página de Inicio (Home)
- Hero section con imagen de portada a pantalla completa.
- Degradado oscuro sobre la imagen para legibilidad del texto.
- Título "YA LO TENGO" con tipografía Black y animaciones de entrada.
- Badge de "Tecnología e Innovación" con estilo glassmorphism.
- Subtítulo con acentos en verde esmeralda: "INVESTIGACIÓN. DESARROLLO. INNOVACIÓN."

#### 5.2.2. Página de Autenticación (Login / Registro)
- Diseño dividido en dos columnas (desktop): mensaje de bienvenida + formulario.
- Tabs para alternar entre "Iniciar sesión" y "Crear cuenta".
- Integración visual de botón "Continuar con Google" (OAuth).
- Icono de ojo para mostrar/ocultar contraseña.

#### 5.2.3. Catálogo de Productos
- Grid responsivo de tarjetas (Cards) con imagen, título, descripción y precio.
- Filtros por categoría (Digitalizados / Impresos / Libros).
- Modal de vista ampliada de imagen al hacer clic.
- Botón "Agregar al carrito" con feedback visual.

#### 5.2.4. Panel Administrativo — Modelos 3D
- Tabla con listado de modelos (nombre, categoría, precio, estado).
- Modal de creación/edición con formulario completo.
- Subida de archivos (portada, modelo .glb, imágenes) con indicador de progreso.
- Botón de guardar con **protección anti-doble clic** (se deshabilita y muestra "Guardando...").

#### 5.2.5. Panel Administrativo — Libros
- Listado de libros con portada miniatura, título y autor.
- Formulario modal para crear/editar con subida de PDF y portada.
- Protección de doble envío implementada.

#### 5.2.6. Panel Administrativo — Cursos
- Gestión de cursos con control visual de cupos (vendidos vs. disponibles).
- Formulario con campos de título, descripción, precio, cupos y duración.
- Botón con estado de carga para prevenir duplicados.

#### 5.2.7. Panel Administrativo — Unity AR (Micromuseo)
- Formulario avanzado con metadata taxonómica (Darwin Core).
- Tabs de idiomas para traducciones multilenguaje.
- Subida de AssetBundles y marcadores AR con preview de imagen.
- Botón de registro con bloqueo durante el envío.

#### 5.2.8. Panel de Reservas (Taquilla + Escáner + Gestión)
- **Venta en Taquilla:** Grid de slots horarios con estados (disponible, lleno, cerrado). Panel lateral de cobro con cálculo automático del total.
- **Escáner QR:** Visor de cámara integrado para escanear tickets en la entrada del museo. Resultado visual (verde = válido, rojo = inválido).
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
| **Sprint Backlog** | Tareas específicas asignadas por sprint (Sprint 1 a 4). |
| **Incremento** | Al final de cada sprint se entrega una versión funcional desplegada en el VPS de producción. |
| **Definition of Done** | Un requisito se considera "Done" cuando el código está en la rama `main`, se ha desplegado en producción y el Product Owner ha validado el funcionamiento. |

---

## 7. TECNOLOGÍAS UTILIZADAS

| Capa | Tecnología |
| :--- | :--- |
| **Frontend** | React 18 + Vite, TailwindCSS, Recharts |
| **Backend** | Node.js + Express |
| **Base de Datos** | MySQL |
| **Almacenamiento** | MinIO (S3-compatible, auto-hospedado) |
| **Autenticación** | JWT + Google OAuth 2.0 |
| **Pagos** | MercadoPago SDK |
| **Contenedores** | Docker + Docker Compose |
| **Servidor** | VPS Linux (Ubuntu) |
| **Control de Versiones** | Git + GitHub |
| **Modelo 3D / AR** | Unity (App externa), AssetBundles |

---

## 8. RIESGOS IDENTIFICADOS Y MITIGACIÓN

| Riesgo | Impacto | Mitigación |
| :--- | :--- | :--- |
| Caída del servicio de MercadoPago | Alto | Manejo de errores con reintentos y notificaciones al admin. |
| Archivos grandes de AssetBundles saturan el almacenamiento | Medio | MinIO con política de retención y monitoreo de uso de disco. |
| Acceso no autorizado a recursos administrativos | Alto | Middleware de autenticación JWT + verificación de rol en cada ruta protegida. |
| Doble envío de formularios por clic múltiple | Medio | Implementado estado `isSaving` con bloqueo de botón en todos los formularios admin. |

---

## 9. CONCLUSIONES

1. El proyecto "Yalotengo" se encuentra avanzando conforme al cronograma establecido bajo la metodología Scrum.
2. Se han completado exitosamente los Sprints 1 y 2, cubriendo la arquitectura base y los módulos de negocio principales.
3. El Sprint 3 (en curso) se enfoca en el pulido de interfaces y la integración de los módulos de Reservas y Unity AR.
4. Las interfaces gráficas diseñadas cumplen con estándares modernos de UX/UI, priorizando la responsividad y la experiencia del usuario.
5. El equipo mantiene una comunicación fluida y las ceremonias Scrum (Daily, Sprint Review, Retrospectiva) se ejecutan de manera regular.

---

## 10. PRÓXIMOS PASOS (SPRINT 4)

- [ ] Pruebas integrales de todos los módulos en el entorno de producción.
- [ ] Corrección de bugs reportados durante el Sprint Review del Sprint 3.
- [ ] Optimización de rendimiento (carga de imágenes, tiempos de respuesta del API).
- [ ] Documentación técnica final y manual de usuario.
- [ ] Despliegue definitivo en el VPS de producción.

---

*Elaborado por el Equipo de Desarrollo Yalotengo — Invéntalo, 2026.*
