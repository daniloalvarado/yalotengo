-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 15-02-2026 a las 19:25:58
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
(2, 'El Miedo a la Libertad', 'Erich Fromm', 'Análisis psicológico sobre la libertad humana', 'El Miedo a la Libertad - Erich Fromm.pdf', 'El Miedo a la Libertad.jpg', 19.90, 1, '2026-01-28 16:36:33', '2026-01-29 22:03:33'),
(3, 'La Dama de las Camelias', 'Alejandro Dumas (hijo)', 'Clásico de la literatura francesa', 'La Dama de las Camelias - Alejandro Dumas (hijo).pdf', 'La Dama de la Camelias.jpg', 19.90, 1, '2026-01-28 16:36:33', '2026-01-29 21:52:01'),
(9, 'El Infierno Amazónico', 'Isaac Ocampo', 'Una aventura épica en la selva amazónica ', 'El_Infierno_AmazÃ³nico_-_Isaac_Ocampo.pdf', 'El_Infierno_AmazÃ³nico.webp', 19.90, 1, '2026-02-07 19:32:29', '2026-02-07 19:33:37');

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
(18, 7, 2, 'PENDING', NULL, 19.90, '2026-02-15 16:36:52', '2026-02-15 16:36:52');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cart_cart`
--

CREATE TABLE `cart_cart` (
  `car_int_id` int(11) NOT NULL,
  `use_int_id` int(11) DEFAULT NULL,
  `car_dt_created` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `cart_cart`
--

INSERT INTO `cart_cart` (`car_int_id`, `use_int_id`, `car_dt_created`) VALUES
(4, 2, '2026-01-13 07:13:10'),
(5, 1, '2026-01-13 16:38:17'),
(6, 3, '2026-01-13 19:29:43'),
(7, 4, '2026-01-13 19:32:50'),
(8, 5, '2026-01-13 19:36:16'),
(9, 6, '2026-01-13 19:52:56'),
(10, 7, '2026-01-13 20:56:54');

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
  `use_txt_phone` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `core_user`
--

INSERT INTO `core_user` (`use_int_id`, `use_txt_nombres`, `use_txt_apellidos`, `use_txt_documento`, `use_txt_email`, `use_txt_passwordhash`, `use_txt_role`, `use_txt_fb_id`, `use_txt_avatar`, `use_txt_google_id`, `use_txt_address`, `use_txt_phone`) VALUES
(6, 'Danilo', 'Alvarado', NULL, 'daniloalvarado2002@gmail.com', NULL, 'admin', NULL, 'https://lh3.googleusercontent.com/a/ACg8ocIXE_67oxaxc4_1gxHQJM-aSlIodxkGaEQMpiFOatkUTHY8066Z9w=s96-c', '100016188293704955189', NULL, NULL),
(7, 'Leo', 'Alvarado', NULL, 'leoalvarado1203@gmail.com', NULL, 'cliente', NULL, 'avatar_1770252784512_favicon.png', '113717031116314250808', NULL, NULL);

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
(1, 'Drones', 'Aprende a pilotar y programar drones', 'drones.png', 99.90, '4 semanas', 1, '0000-00-00 00:00:00', '0000-00-00 00:00:00', 10, 0),
(2, 'Impresiones 3D', 'Diseño e impresión 3D desde cero', 'impresiones 3D.png', 99.90, '6 semanas', 1, '0000-00-00 00:00:00', '2026-02-09 19:48:55', 10, 0),
(3, 'Robótica 12-15 años', 'Robótica para adolescentes', 'robotica 12-15.png', 99.90, '8 semanas', 1, '0000-00-00 00:00:00', '0000-00-00 00:00:00', 10, 0),
(4, 'Robótica 16+ años', 'Robótica avanzada para jóvenes y adultos', 'robotica 16.png', 99.90, '8 semanas', 1, '0000-00-00 00:00:00', '0000-00-00 00:00:00', 10, 0),
(5, 'Robótica para Niñas', 'Robótica especial para niñas', 'robotica para niñas.png', 99.90, '6 semanas', 1, '0000-00-00 00:00:00', '0000-00-00 00:00:00', 10, 0);

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
(1, 'Mosquito', 'Modelo 3D de un mosquito detallado', 'mosquito.glb', 19.90, 'DIGITALIZADO', 1, '0000-00-00 00:00:00', '2026-02-09 20:06:56', NULL),
(2, 'Mosca', 'Modelo 3D detallado de una mosca ', 'mosca.glb', 19.90, 'DIGITALIZADO', 1, '0000-00-00 00:00:00', '0000-00-00 00:00:00', NULL),
(3, 'Pulga', 'Modelo 3D detallado de una pulga', 'pulga.glb', 19.90, 'DIGITALIZADO', 1, '0000-00-00 00:00:00', '0000-00-00 00:00:00', NULL),
(8, 'Impreso 1', 'Modelo impreso disponible para venta directa.', 'printed_1770490115369_impreso1.jpg', 149.90, 'IMPRESO', 1, '2026-02-06 21:51:29', '2026-02-07 18:54:45', '2026-02-07 18:54:45'),
(9, 'Impreso 2', 'Modelo impreso disponible para venta directa.', 'printed_1770491704965_Impreso2.jpg', 79.90, 'IMPRESO', 1, '2026-02-06 21:51:29', '2026-02-07 19:15:06', NULL),
(10, 'Impreso 3', 'Modelo impreso disponible para venta directa.', 'printed_1770491716029_Impresos3.jpg', 99.90, 'IMPRESO', 1, '2026-02-06 21:51:29', '2026-02-07 19:22:01', NULL),
(11, 'Impreso 1', 'Modelo impreso disponible para venta directa', 'printed_1770491672135_impreso1.jpg', 149.90, 'IMPRESO', 1, '2026-02-07 18:56:55', '2026-02-07 19:14:34', NULL),
(12, 'Isula', 'Isula', 'Isula.glb', 19.90, 'DIGITALIZADO', 1, '2026-02-09 19:59:48', '2026-02-09 20:05:22', '2026-02-09 20:05:22'),
(14, 'Isula', 'Isual', 'Isula.glb', 19.90, 'DIGITALIZADO', 1, '2026-02-09 21:10:37', '2026-02-09 21:11:08', '2026-02-09 21:11:08'),
(15, 'Isula', 'Isula', 'Isula.glb', 19.90, 'DIGITALIZADO', 1, '2026-02-15 16:57:39', '2026-02-15 16:58:54', '2026-02-15 16:58:54'),
(16, 'Isula', 'Isula', 'Isula.glb', 19.90, 'DIGITALIZADO', 1, '2026-02-15 17:11:56', '2026-02-15 17:13:43', '2026-02-15 17:13:43');

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
(27, 7, 2, 'PENDING', NULL, 19.90, '2026-02-15 16:35:53', '2026-02-15 16:35:53', 'ACCEPTED', '1 día', 1);

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
  ADD KEY `boo_int_id` (`boo_int_id`);

--
-- Indices de la tabla `cart_cart`
--
ALTER TABLE `cart_cart`
  ADD PRIMARY KEY (`car_int_id`);

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
  ADD KEY `cou_int_id` (`cou_int_id`);

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
  ADD KEY `mod_int_id` (`mod_int_id`);

--
-- Indices de la tabla `res_reservation`
--
ALTER TABLE `res_reservation`
  ADD PRIMARY KEY (`res_int_id`),
  ADD UNIQUE KEY `res_txt_qr_code` (`res_txt_qr_code`);

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
  MODIFY `boo_int_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de la tabla `bpu_book_purchase`
--
ALTER TABLE `bpu_book_purchase`
  MODIFY `bpu_int_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT de la tabla `cart_cart`
--
ALTER TABLE `cart_cart`
  MODIFY `car_int_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `core_user`
--
ALTER TABLE `core_user`
  MODIFY `use_int_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de la tabla `cou_course`
--
ALTER TABLE `cou_course`
  MODIFY `cou_int_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `cpu_course_purchase`
--
ALTER TABLE `cpu_course_purchase`
  MODIFY `cpu_int_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `mod_model3d`
--
ALTER TABLE `mod_model3d`
  MODIFY `mod_int_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT de la tabla `mod_purchase`
--
ALTER TABLE `mod_purchase`
  MODIFY `pur_int_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT de la tabla `res_reservation`
--
ALTER TABLE `res_reservation`
  MODIFY `res_int_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=183;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `bpu_book_purchase`
--
ALTER TABLE `bpu_book_purchase`
  ADD CONSTRAINT `bpu_book_purchase_ibfk_1` FOREIGN KEY (`boo_int_id`) REFERENCES `boo_book` (`boo_int_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `cpu_course_purchase`
--
ALTER TABLE `cpu_course_purchase`
  ADD CONSTRAINT `cpu_course_purchase_ibfk_1` FOREIGN KEY (`cou_int_id`) REFERENCES `cou_course` (`cou_int_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `mod_purchase`
--
ALTER TABLE `mod_purchase`
  ADD CONSTRAINT `mod_purchase_ibfk_1` FOREIGN KEY (`mod_int_id`) REFERENCES `mod_model3d` (`mod_int_id`) ON DELETE NO ACTION ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
