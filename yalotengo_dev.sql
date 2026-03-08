-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 08-03-2026 a las 16:29:59
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `yalotengo_dev`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `boo_book`
--

CREATE TABLE `boo_book` (
  `boo_int_id` int(11) NOT NULL,
  `boo_txt_title` varchar(255) NOT NULL,
  `boo_txt_author` varchar(255) DEFAULT NULL,
  `boo_txt_desc` text DEFAULT NULL,
  `boo_txt_pdf_filename` varchar(255) DEFAULT NULL,
  `boo_txt_cover_image` varchar(255) DEFAULT NULL,
  `boo_dec_price` decimal(10,2) DEFAULT 0.00,
  `boo_bool_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `boo_book`
--

INSERT INTO `boo_book` (`boo_int_id`, `boo_txt_title`, `boo_txt_author`, `boo_txt_desc`, `boo_txt_pdf_filename`, `boo_txt_cover_image`, `boo_dec_price`, `boo_bool_active`, `created_at`, `updated_at`) VALUES
(2, 'El Miedo a la Libertad', 'Erich Fromm', 'Análisis psicológico sobre la libertad humana', '1771268233511_El_Miedo_a_la_Libertad___Erich_Fromm.pdf', '1771268251783_El_Miedo_a_la_Libertad.jpg', 19.90, 1, '2026-01-28 16:36:33', '2026-02-16 18:57:33'),
(3, 'La Dama de las Camelias', 'Alejandro Dumas (hijo)', 'Clásico de la literatura francesa', '1771268323377_La_Dama_de_las_Camelias___Alejandro_Dumas__hijo_.pdf', '1771268279732_La_Dama_de_la_Camelias.jpg', 19.90, 1, '2026-01-28 16:36:33', '2026-02-16 18:58:45'),
(9, 'El Infierno Amazónico', 'Isaac Ocampo', 'Una aventura épica en la selva amazónica ', '1771268162784_El_Infierno_Amaz__nico___Isaac_Ocampo.pdf', '1771268179334_El_Infierno_Amaz____nico.webp', 19.90, 1, '2026-02-07 19:32:29', '2026-02-16 18:56:20');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `bpu_book_purchase`
--

CREATE TABLE `bpu_book_purchase` (
  `bpu_int_id` int(11) NOT NULL,
  `use_int_id` int(11) NOT NULL COMMENT 'ID del usuario que compró',
  `boo_int_id` int(11) NOT NULL COMMENT 'ID del libro comprado',
  `bpu_txt_status` enum('PENDING','PAID','FAILED') DEFAULT 'PENDING',
  `bpu_txt_payment_id` varchar(100) DEFAULT NULL COMMENT 'ID de transacción de MercadoPago',
  `bpu_dec_amount` decimal(10,2) NOT NULL,
  `bpu_dt_created` datetime DEFAULT NULL,
  `bpu_dt_updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `bpu_book_purchase`
--

INSERT INTO `bpu_book_purchase` (`bpu_int_id`, `use_int_id`, `boo_int_id`, `bpu_txt_status`, `bpu_txt_payment_id`, `bpu_dec_amount`, `bpu_dt_created`, `bpu_dt_updated`) VALUES
(15, 7, 9, 'PAID', '1344718193', 19.90, '2026-02-14 22:19:40', '2026-02-14 22:19:42'),
(20, 7, 2, 'PAID', '1344782635', 19.90, '2026-02-17 01:19:32', '2026-02-17 01:19:35');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `core_user`
--

CREATE TABLE `core_user` (
  `use_int_id` int(11) NOT NULL,
  `use_txt_nombres` varchar(120) DEFAULT NULL,
  `use_txt_apellidos` varchar(120) DEFAULT NULL,
  `use_txt_documento` varchar(20) DEFAULT NULL,
  `use_txt_email` varchar(160) DEFAULT NULL,
  `use_txt_passwordhash` varchar(120) DEFAULT NULL,
  `use_txt_role` varchar(20) DEFAULT 'cliente',
  `use_txt_fb_id` varchar(64) DEFAULT NULL,
  `use_txt_avatar` text DEFAULT NULL,
  `use_txt_google_id` varchar(64) DEFAULT NULL,
  `use_txt_address` varchar(255) DEFAULT NULL,
  `use_txt_phone` varchar(20) DEFAULT NULL,
  `use_txt_provider_avatar` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `core_user`
--

INSERT INTO `core_user` (`use_int_id`, `use_txt_nombres`, `use_txt_apellidos`, `use_txt_documento`, `use_txt_email`, `use_txt_passwordhash`, `use_txt_role`, `use_txt_fb_id`, `use_txt_avatar`, `use_txt_google_id`, `use_txt_address`, `use_txt_phone`, `use_txt_provider_avatar`) VALUES
(6, 'Danilo', 'Alvarado', NULL, 'daniloalvarado2002@gmail.com', NULL, 'admin', NULL, 'https://lh3.googleusercontent.com/a/ACg8ocIXE_67oxaxc4_1gxHQJM-aSlIodxkGaEQMpiFOatkUTHY8066Z9w=s96-c', '100016188293704955189', NULL, NULL, 'https://lh3.googleusercontent.com/a/ACg8ocIXE_67oxaxc4_1gxHQJM-aSlIodxkGaEQMpiFOatkUTHY8066Z9w=s96-c'),
(7, 'Leo', 'Alvarado', '72453509', 'leoalvarado1203@gmail.com', NULL, 'cliente', NULL, '1771213652293_inventalo.png', '113717031116314250808', 'Anita Cabrera. Calle 2 de Frebrero #167', '953808566', 'https://lh3.googleusercontent.com/a/ACg8ocIFC225JxESSkVKPGkGAc5H22t7T14P8dA93_kswOg1_LCl6Q=s96-c'),
(10, 'LEONARDO DANILO ALVARADO SILVANO', 'ALVARADO SILVANO', NULL, '21131b0685@unapiquitos.edu.pe', NULL, 'cliente', NULL, '2715b02d-3c3b-4811-88ac-8314c55cbdf3.png', '107611113163449265882', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cou_course`
--

CREATE TABLE `cou_course` (
  `cou_int_id` int(11) NOT NULL,
  `cou_txt_title` varchar(255) NOT NULL,
  `cou_txt_desc` text DEFAULT NULL,
  `cou_txt_image` varchar(255) DEFAULT NULL COMMENT 'Nombre de la imagen en frontend/public/cursos/',
  `cou_dec_price` decimal(10,2) NOT NULL DEFAULT 99.90,
  `cou_txt_duration` varchar(50) DEFAULT NULL COMMENT 'Duración del curso (ej: 4 semanas)',
  `cou_bool_active` tinyint(4) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `cou_int_seats` int(11) NOT NULL DEFAULT 10,
  `cou_int_sold` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `cou_course`
--

INSERT INTO `cou_course` (`cou_int_id`, `cou_txt_title`, `cou_txt_desc`, `cou_txt_image`, `cou_dec_price`, `cou_txt_duration`, `cou_bool_active`, `created_at`, `updated_at`, `cou_int_seats`, `cou_int_sold`) VALUES
(2, 'Impresiones 3D', 'Diseño e impresión 3D desde cero', '1771268386822_impresiones_3D.png', 99.90, '6 semanas', 1, '0000-00-00 00:00:00', '2026-02-17 00:10:12', 10, 2),
(3, 'Robótica 12-15 años', 'Robótica para adolescentes', '1771268400006_robotica_12_15.png', 99.90, '8 semanas', 1, '0000-00-00 00:00:00', '2026-02-17 00:10:12', 10, 1),
(4, 'Robótica 16+ años', 'Robótica avanzada para jóvenes y adultos', '1771268422043_robotica_16.png', 99.90, '8 semanas', 1, '0000-00-00 00:00:00', '2026-02-16 19:00:23', 10, 0),
(5, 'Robótica para Niñas', 'Robótica especial para niñas', '1771268433680_robotica_para_ni____as.png', 99.90, '6 semanas', 1, '0000-00-00 00:00:00', '2026-02-16 19:00:34', 10, 0);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cpu_course_purchase`
--

CREATE TABLE `cpu_course_purchase` (
  `cpu_int_id` int(11) NOT NULL,
  `use_int_id` int(11) NOT NULL COMMENT 'ID del usuario que compró',
  `cou_int_id` int(11) NOT NULL COMMENT 'ID del curso comprado',
  `cpu_txt_status` varchar(20) DEFAULT 'PENDING',
  `cpu_txt_payment_id` varchar(100) DEFAULT NULL COMMENT 'ID de transacción de MercadoPago',
  `cpu_dec_amount` decimal(10,2) NOT NULL,
  `cpu_dt_created` datetime NOT NULL,
  `cpu_dt_updated` datetime NOT NULL,
  `cpu_int_quantity` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `cpu_course_purchase`
--

INSERT INTO `cpu_course_purchase` (`cpu_int_id`, `use_int_id`, `cou_int_id`, `cpu_txt_status`, `cpu_txt_payment_id`, `cpu_dec_amount`, `cpu_dt_created`, `cpu_dt_updated`, `cpu_int_quantity`) VALUES
(9, 7, 2, 'PAID', '1344774213', 99.90, '2026-02-16 21:43:05', '2026-02-16 21:43:06', 1),
(10, 7, 2, 'PAID', '1344775657', 99.90, '2026-02-17 00:09:27', '2026-02-17 00:10:12', 1),
(11, 7, 3, 'PAID', '1344775657', 99.90, '2026-02-17 00:09:28', '2026-02-17 00:10:12', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `mm_darwin_data`
--

CREATE TABLE `mm_darwin_data` (
  `id` int(11) NOT NULL,
  `scientificName` varchar(255) NOT NULL,
  `kingdom` varchar(255) DEFAULT NULL,
  `phylum` varchar(255) DEFAULT NULL,
  `subphylum` varchar(255) DEFAULT NULL,
  `class` varchar(255) DEFAULT NULL,
  `subclass` varchar(255) DEFAULT NULL,
  `order` varchar(255) DEFAULT NULL,
  `family` varchar(255) DEFAULT NULL,
  `genus` varchar(255) DEFAULT NULL,
  `specificEpithet` varchar(255) DEFAULT NULL,
  `vernacularName` varchar(255) DEFAULT NULL,
  `taxonRemarks` text DEFAULT NULL,
  `assetBundleFileName` varchar(255) DEFAULT NULL,
  `estado` enum('activo','desactivo','eliminado') DEFAULT 'activo',
  `fecha_create` datetime NOT NULL,
  `fecha_update` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `mod_model3d`
--

CREATE TABLE `mod_model3d` (
  `mod_int_id` int(11) NOT NULL,
  `mod_txt_name` varchar(100) NOT NULL,
  `mod_txt_desc` text DEFAULT NULL,
  `mod_txt_glb_filename` varchar(255) NOT NULL COMMENT 'Nombre del archivo .glb en /public/models/',
  `mod_dec_price` decimal(10,2) NOT NULL DEFAULT 19.90,
  `mod_txt_category` varchar(20) NOT NULL DEFAULT 'DIGITALIZADO',
  `mod_bool_active` tinyint(1) NOT NULL DEFAULT 1,
  `mod_dt_created` datetime NOT NULL,
  `mod_dt_updated` datetime NOT NULL,
  `mod_dt_deleted` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `mod_model3d`
--

INSERT INTO `mod_model3d` (`mod_int_id`, `mod_txt_name`, `mod_txt_desc`, `mod_txt_glb_filename`, `mod_dec_price`, `mod_txt_category`, `mod_bool_active`, `mod_dt_created`, `mod_dt_updated`, `mod_dt_deleted`) VALUES
(1, 'Mosquito', 'Modelo 3D de un mosquito detallado', '1771268092465_mosquito.glb', 19.90, 'DIGITALIZADO', 1, '0000-00-00 00:00:00', '2026-02-16 18:54:55', NULL),
(2, 'Mosca', 'Modelo 3D detallado de una mosca ', '1771268127223_mosca.glb', 19.90, 'DIGITALIZADO', 1, '0000-00-00 00:00:00', '2026-02-16 18:55:29', NULL),
(3, 'Pulga', 'Modelo 3D detallado de una pulga', '1771268138790_pulga.glb', 19.90, 'DIGITALIZADO', 1, '0000-00-00 00:00:00', '2026-02-16 18:55:40', NULL),
(8, 'Impreso 1', 'Modelo impreso disponible para venta directa.', 'printed_1770490115369_impreso1.jpg', 149.90, 'IMPRESO', 1, '2026-02-06 21:51:29', '2026-02-07 18:54:45', '2026-02-07 18:54:45'),
(9, 'Impreso 2', 'Modelo impreso disponible para venta directa.', '1772980488408_Impreso2.jpg', 79.90, 'IMPRESO', 1, '2026-02-06 21:51:29', '2026-03-08 14:34:51', NULL),
(10, 'Impreso 3', 'Modelo impreso disponible para venta directa.', '1772980501551_Impresos3.jpg', 99.90, 'IMPRESO', 1, '2026-02-06 21:51:29', '2026-03-08 14:35:04', NULL),
(11, 'Impreso 1', 'Modelo impreso disponible para venta directa', '1772980475877_Impreso1.jpg', 149.90, 'IMPRESO', 1, '2026-02-07 18:56:55', '2026-03-08 14:34:39', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `mod_purchase`
--

CREATE TABLE `mod_purchase` (
  `pur_int_id` int(11) NOT NULL,
  `use_int_id` int(11) NOT NULL,
  `mod_int_id` int(11) NOT NULL,
  `pur_txt_status` varchar(20) NOT NULL DEFAULT 'PENDING',
  `pur_txt_payment_id` varchar(64) DEFAULT NULL,
  `pur_dec_amount` decimal(10,2) NOT NULL,
  `pur_dt_created` datetime NOT NULL,
  `pur_dt_updated` datetime NOT NULL,
  `pur_txt_delivery_status` enum('ACCEPTED','IN_PROGRESS','DELIVERED') NOT NULL DEFAULT 'ACCEPTED',
  `pur_txt_delivery_estimate` varchar(50) NOT NULL DEFAULT '1 día',
  `pur_int_quantity` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `mod_purchase`
--

INSERT INTO `mod_purchase` (`pur_int_id`, `use_int_id`, `mod_int_id`, `pur_txt_status`, `pur_txt_payment_id`, `pur_dec_amount`, `pur_dt_created`, `pur_dt_updated`, `pur_txt_delivery_status`, `pur_txt_delivery_estimate`, `pur_int_quantity`) VALUES
(23, 7, 1, 'PAID', '1344718373', 19.90, '2026-02-14 22:46:38', '2026-02-14 22:46:39', 'ACCEPTED', '1 día', 1),
(34, 7, 11, 'PAID', '1344772499', 149.90, '2026-02-16 21:42:10', '2026-02-16 21:42:11', 'ACCEPTED', '1 día', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `res_reservation`
--

CREATE TABLE `res_reservation` (
  `res_int_id` int(11) NOT NULL,
  `use_int_id` int(11) NOT NULL COMMENT 'FK al usuario que hace la reserva',
  `res_dt_date` date NOT NULL COMMENT 'Fecha de la visita (YYYY-MM-DD)',
  `res_txt_timeslot` varchar(10) NOT NULL COMMENT 'Hora de inicio del slot (ej: "10:00")',
  `res_txt_status` varchar(20) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING | PAID | USED | EXPIRED | CANCELLED',
  `res_txt_qr_code` varchar(64) DEFAULT NULL COMMENT 'Código único para el QR de entrada',
  `res_txt_qr_key` varchar(255) DEFAULT NULL COMMENT 'Ruta del archivo QR en MinIO',
  `res_dec_price` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Precio pagado por la entrada',
  `res_int_guests` int(11) NOT NULL DEFAULT 1 COMMENT 'Número de personas en esta reserva',
  `res_dt_created_at` datetime DEFAULT NULL,
  `res_dt_used_at` datetime DEFAULT NULL COMMENT 'Fecha/hora cuando se usó el ticket',
  `res_txt_payment_id` varchar(64) DEFAULT NULL,
  `res_txt_currency` varchar(10) DEFAULT 'PEN'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `res_reservation`
--

INSERT INTO `res_reservation` (`res_int_id`, `use_int_id`, `res_dt_date`, `res_txt_timeslot`, `res_txt_status`, `res_txt_qr_code`, `res_txt_qr_key`, `res_dec_price`, `res_int_guests`, `res_dt_created_at`, `res_dt_used_at`, `res_txt_payment_id`, `res_txt_currency`) VALUES
(184, 7, '2026-02-16', '11:30', 'PAID', 'd66b7cd7a51dc23ecbfb24490e41d1c5c9490be6eea60c1b', 'qr-tickets/184.png', 2.00, 1, '2026-02-16 03:22:31', NULL, '1344738751', 'USD'),
(185, 7, '2026-02-17', '09:30', 'EXPIRED', 'fb971f0f30568670a8e0b9ce6fba0d4f16d4264b4f39f0ac', NULL, 2.00, 1, '2026-02-16 19:17:37', NULL, NULL, 'PEN');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sequelizemeta`
--

CREATE TABLE `sequelizemeta` (
  `name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Volcado de datos para la tabla `sequelizemeta`
--

INSERT INTO `sequelizemeta` (`name`) VALUES
('20250919205607-add-pro-kind.js'),
('20250919205625-add-pro-kind.js');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `boo_book`
--
ALTER TABLE `boo_book`
  ADD PRIMARY KEY (`boo_int_id`);

--
-- Indices de la tabla `bpu_book_purchase`
--
ALTER TABLE `bpu_book_purchase`
  ADD PRIMARY KEY (`bpu_int_id`),
  ADD KEY `bpu_book_purchase_user_fk` (`use_int_id`),
  ADD KEY `bpu_book_purchase_ibfk_1` (`boo_int_id`);

--
-- Indices de la tabla `core_user`
--
ALTER TABLE `core_user`
  ADD PRIMARY KEY (`use_int_id`),
  ADD UNIQUE KEY `use_txt_email` (`use_txt_email`);

--
-- Indices de la tabla `cou_course`
--
ALTER TABLE `cou_course`
  ADD PRIMARY KEY (`cou_int_id`);

--
-- Indices de la tabla `cpu_course_purchase`
--
ALTER TABLE `cpu_course_purchase`
  ADD PRIMARY KEY (`cpu_int_id`),
  ADD KEY `cpu_course_purchase_user_fk` (`use_int_id`),
  ADD KEY `cpu_course_purchase_ibfk_1` (`cou_int_id`);

--
-- Indices de la tabla `mm_darwin_data`
--
ALTER TABLE `mm_darwin_data`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `mod_model3d`
--
ALTER TABLE `mod_model3d`
  ADD PRIMARY KEY (`mod_int_id`);

--
-- Indices de la tabla `mod_purchase`
--
ALTER TABLE `mod_purchase`
  ADD PRIMARY KEY (`pur_int_id`),
  ADD KEY `mod_int_id` (`mod_int_id`),
  ADD KEY `mod_purchase_user_fk` (`use_int_id`);

--
-- Indices de la tabla `res_reservation`
--
ALTER TABLE `res_reservation`
  ADD PRIMARY KEY (`res_int_id`),
  ADD UNIQUE KEY `res_txt_qr_code` (`res_txt_qr_code`),
  ADD KEY `res_reservation_user_fk` (`use_int_id`);

--
-- Indices de la tabla `sequelizemeta`
--
ALTER TABLE `sequelizemeta`
  ADD PRIMARY KEY (`name`),
  ADD UNIQUE KEY `name` (`name`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `boo_book`
--
ALTER TABLE `boo_book`
  MODIFY `boo_int_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT de la tabla `bpu_book_purchase`
--
ALTER TABLE `bpu_book_purchase`
  MODIFY `bpu_int_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT de la tabla `core_user`
--
ALTER TABLE `core_user`
  MODIFY `use_int_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `cou_course`
--
ALTER TABLE `cou_course`
  MODIFY `cou_int_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de la tabla `cpu_course_purchase`
--
ALTER TABLE `cpu_course_purchase`
  MODIFY `cpu_int_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT de la tabla `mm_darwin_data`
--
ALTER TABLE `mm_darwin_data`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `mod_model3d`
--
ALTER TABLE `mod_model3d`
  MODIFY `mod_int_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT de la tabla `mod_purchase`
--
ALTER TABLE `mod_purchase`
  MODIFY `pur_int_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT de la tabla `res_reservation`
--
ALTER TABLE `res_reservation`
  MODIFY `res_int_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=186;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `bpu_book_purchase`
--
ALTER TABLE `bpu_book_purchase`
  ADD CONSTRAINT `bpu_book_purchase_ibfk_1` FOREIGN KEY (`boo_int_id`) REFERENCES `boo_book` (`boo_int_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `bpu_book_purchase_user_fk` FOREIGN KEY (`use_int_id`) REFERENCES `core_user` (`use_int_id`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `cpu_course_purchase`
--
ALTER TABLE `cpu_course_purchase`
  ADD CONSTRAINT `cpu_course_purchase_ibfk_1` FOREIGN KEY (`cou_int_id`) REFERENCES `cou_course` (`cou_int_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `cpu_course_purchase_user_fk` FOREIGN KEY (`use_int_id`) REFERENCES `core_user` (`use_int_id`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `mod_purchase`
--
ALTER TABLE `mod_purchase`
  ADD CONSTRAINT `mod_purchase_ibfk_1` FOREIGN KEY (`mod_int_id`) REFERENCES `mod_model3d` (`mod_int_id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `mod_purchase_user_fk` FOREIGN KEY (`use_int_id`) REFERENCES `core_user` (`use_int_id`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `res_reservation`
--
ALTER TABLE `res_reservation`
  ADD CONSTRAINT `res_reservation_user_fk` FOREIGN KEY (`use_int_id`) REFERENCES `core_user` (`use_int_id`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
