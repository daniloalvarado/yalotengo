-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 29-01-2026 a las 05:26:32
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
(1, 'El Infierno Amazónico', 'Isaac Ocampo', 'Una aventura épica en la selva amazónica', 'El Infierno Amazónico - Isaac Ocampo.pdf', 'libros/El Infierno Amazónico.jpg', 19.90, 1, '2026-01-28 16:36:33', '2026-01-28 18:42:51'),
(2, 'El Miedo a la Libertad', 'Erich Fromm', 'Análisis psicológico sobre la libertad humana', 'El Miedo a la Libertad - Erich Fromm.pdf', 'libros/El Miedo a la Libertad.jpg', 19.90, 1, '2026-01-28 16:36:33', '2026-01-28 18:42:51'),
(3, 'La Dama de las Camelias', 'Alejandro Dumas (hijo)', 'Clásico de la literatura francesa', 'La Dama de las Camelias - Alejandro Dumas (hijo).pdf', 'libros/La Dama de la Camelias.jpg', 19.90, 1, '2026-01-28 16:36:33', '2026-01-28 18:42:51');

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
(1, 7, 1, 'PAID', '1326044736', 19.90, '2026-01-28 16:51:43', '2026-01-28 16:51:46');

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
-- Estructura de tabla para la tabla `cart_item`
--

CREATE TABLE `cart_item` (
  `cit_int_id` int(11) NOT NULL,
  `car_int_id` int(11) DEFAULT NULL,
  `pro_int_id` int(11) DEFAULT NULL,
  `cit_int_qty` int(11) DEFAULT NULL,
  `cit_dec_price` decimal(12,2) DEFAULT NULL,
  `cit_txt_name_snapshot` varchar(200) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
  `use_txt_google_id` varchar(64) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `core_user`
--

INSERT INTO `core_user` (`use_int_id`, `use_txt_nombres`, `use_txt_apellidos`, `use_txt_documento`, `use_txt_email`, `use_txt_passwordhash`, `use_txt_role`, `use_txt_fb_id`, `use_txt_avatar`, `use_txt_google_id`) VALUES
(6, 'Danilo', 'Alvarado', NULL, 'daniloalvarado2002@gmail.com', NULL, 'admin', NULL, 'https://lh3.googleusercontent.com/a/ACg8ocIXE_67oxaxc4_1gxHQJM-aSlIodxkGaEQMpiFOatkUTHY8066Z9w=s96-c', '100016188293704955189'),
(7, 'Leo', 'Alvarado', NULL, 'leoalvarado1203@gmail.com', NULL, 'cliente', NULL, 'https://lh3.googleusercontent.com/a/ACg8ocIFC225JxESSkVKPGkGAc5H22t7T14P8dA93_kswOg1_LCl6Q=s96-c', '113717031116314250808');

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
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `cou_course`
--

INSERT INTO `cou_course` (`cou_int_id`, `cou_txt_title`, `cou_txt_desc`, `cou_txt_image`, `cou_dec_price`, `cou_txt_duration`, `cou_bool_active`, `created_at`, `updated_at`) VALUES
(1, 'Drones', 'Aprende a pilotar y programar drones', 'drones.png', 99.90, '4 semanas', 1, '0000-00-00 00:00:00', '0000-00-00 00:00:00'),
(2, 'Impresiones 3D', 'Diseño e impresión 3D desde cero', 'impresiones 3D.png', 99.90, '6 semanas', 1, '0000-00-00 00:00:00', '0000-00-00 00:00:00'),
(3, 'Robótica 12-15 años', 'Robótica para adolescentes', 'robotica 12-15.png', 99.90, '8 semanas', 1, '0000-00-00 00:00:00', '0000-00-00 00:00:00'),
(4, 'Robótica 16+ años', 'Robótica avanzada para jóvenes y adultos', 'robotica 16.png', 99.90, '8 semanas', 1, '0000-00-00 00:00:00', '0000-00-00 00:00:00'),
(5, 'Robótica para Niñas', 'Robótica especial para niñas', 'robotica para niñas.png', 99.90, '6 semanas', 1, '0000-00-00 00:00:00', '0000-00-00 00:00:00');

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
  `cpu_dt_updated` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `cpu_course_purchase`
--

INSERT INTO `cpu_course_purchase` (`cpu_int_id`, `use_int_id`, `cou_int_id`, `cpu_txt_status`, `cpu_txt_payment_id`, `cpu_dec_amount`, `cpu_dt_created`, `cpu_dt_updated`) VALUES
(1, 7, 1, 'PAID', '1326045092', 99.90, '2026-01-28 19:01:49', '2026-01-28 19:01:51');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `inv_category`
--

CREATE TABLE `inv_category` (
  `cat_int_id` int(11) NOT NULL,
  `cat_txt_name` varchar(120) DEFAULT NULL,
  `cat_txt_slug` varchar(120) DEFAULT NULL,
  `cat_bol_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `inv_product`
--

CREATE TABLE `inv_product` (
  `pro_int_id` int(11) NOT NULL,
  `pro_txt_name` varchar(200) DEFAULT NULL,
  `pro_txt_slug` varchar(200) DEFAULT NULL,
  `pro_txt_desc` text DEFAULT NULL,
  `pro_dec_price` decimal(12,2) DEFAULT NULL,
  `pro_bol_virtual` tinyint(1) DEFAULT NULL,
  `pro_txt_filekey` varchar(255) DEFAULT NULL,
  `pro_int_stock` int(11) DEFAULT NULL,
  `pro_txt_kind` varchar(20) NOT NULL DEFAULT 'ARTICULO',
  `pro_int_stock_min` int(11) DEFAULT NULL,
  `cat_int_id` int(11) DEFAULT NULL,
  `pro_txt_image` varchar(200) DEFAULT NULL,
  `pro_bol_active` tinyint(1) DEFAULT 1
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
  `mod_dt_updated` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `mod_model3d`
--

INSERT INTO `mod_model3d` (`mod_int_id`, `mod_txt_name`, `mod_txt_desc`, `mod_txt_glb_filename`, `mod_dec_price`, `mod_txt_category`, `mod_bool_active`, `mod_dt_created`, `mod_dt_updated`) VALUES
(1, 'Mosquito', 'Modelo 3D de un mosquito detallado', 'mosquito.glb', 19.90, 'DIGITALIZADO', 1, '0000-00-00 00:00:00', '0000-00-00 00:00:00'),
(2, 'Mosca', 'Modelo 3D detallado de una mosca ', 'mosca.glb', 19.90, 'DIGITALIZADO', 1, '0000-00-00 00:00:00', '0000-00-00 00:00:00'),
(3, 'Pulga', 'Modelo 3D detallado de una pulga', 'pulga.glb', 19.90, 'DIGITALIZADO', 1, '0000-00-00 00:00:00', '0000-00-00 00:00:00');

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
  `pur_dt_updated` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `mod_purchase`
--

INSERT INTO `mod_purchase` (`pur_int_id`, `use_int_id`, `mod_int_id`, `pur_txt_status`, `pur_txt_payment_id`, `pur_dec_amount`, `pur_dt_created`, `pur_dt_updated`) VALUES
(1, 7, 1, 'PENDING', NULL, 19.90, '2026-01-28 05:12:41', '2026-01-28 05:12:41'),
(2, 7, 1, 'PENDING', NULL, 19.90, '2026-01-28 05:13:54', '2026-01-28 05:13:54'),
(3, 7, 2, 'PENDING', NULL, 19.90, '2026-01-28 05:18:15', '2026-01-28 05:18:15'),
(4, 7, 2, 'PAID', '1344262367', 19.90, '2026-01-28 05:22:03', '2026-01-28 05:22:05');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ord_item`
--

CREATE TABLE `ord_item` (
  `ori_int_id` int(11) NOT NULL,
  `ord_int_id` int(11) DEFAULT NULL,
  `pro_int_id` int(11) DEFAULT NULL,
  `ori_int_qty` int(11) DEFAULT NULL,
  `ori_dec_price` decimal(12,2) DEFAULT NULL,
  `ori_bol_virtual` tinyint(1) DEFAULT NULL,
  `ori_txt_filekey` varchar(255) DEFAULT NULL,
  `ori_txt_prepared_key` varchar(255) DEFAULT NULL,
  `ori_txt_status` varchar(20) DEFAULT 'READY',
  `ori_bol_admin_download` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ord_order`
--

CREATE TABLE `ord_order` (
  `ord_int_id` int(11) NOT NULL,
  `use_int_id` int(11) DEFAULT NULL,
  `ord_dec_total` decimal(12,2) DEFAULT NULL,
  `ord_txt_status` varchar(20) DEFAULT NULL,
  `ord_dt_ready_at` datetime DEFAULT NULL,
  `ord_txt_whatsapp` varchar(30) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
(153, 7, '2026-02-04', '09:00', 'PAID', '827e8b9ce3b8b5d4ac958166a4b2c7c4249b52e427ddaca0', 'qr-tickets/153.png', 4.00, 2, '2026-01-27 18:29:18', NULL, '1344254003', 'USD'),
(154, 7, '2026-01-28', '10:30', 'PAID', '405745cb7e1029bf1803a7bfbff3d485cb87327d80b6bf15', 'qr-tickets/154.png', 4.00, 2, '2026-01-28 01:39:34', NULL, '1326040184', 'USD'),
(156, 7, '2026-01-28', '11:00', 'EXPIRED', 'cbbd3e3ee538c3bf0c32e3017aa2e41b7dd0613fa3e0df55', NULL, 2.00, 1, '2026-01-28 02:01:02', NULL, NULL, 'PEN'),
(161, 7, '2026-01-28', '11:00', 'EXPIRED', '0e2a12e2743132eb9e991d25944c08550fc36a8fa0978814', NULL, 2.00, 1, '2026-01-28 02:37:46', NULL, NULL, 'PEN'),
(162, 7, '2026-01-28', '11:00', 'EXPIRED', '8b8b4fb38541de3add80f99e2bf5a09a937647a5bfb7b7c0', NULL, 2.00, 1, '2026-01-28 02:50:17', NULL, NULL, 'PEN'),
(163, 7, '2026-01-28', '11:00', 'EXPIRED', 'e2b4ec660ff2758f06838f73e7b93849d1bb451716e4a712', NULL, 4.00, 2, '2026-01-28 02:51:08', NULL, NULL, 'PEN'),
(164, 7, '2026-01-28', '11:00', 'EXPIRED', '908bd47881a3908ad6d22a76bdf4c6d943458fbc73beaf01', NULL, 2.00, 1, '2026-01-28 03:11:46', NULL, NULL, 'PEN'),
(165, 7, '2026-01-28', '13:30', 'EXPIRED', '85475f08d548740d5e99e7e354e57fc78501216edefc7ca9', NULL, 2.00, 1, '2026-01-28 03:15:49', NULL, NULL, 'PEN'),
(166, 7, '2026-01-28', '09:30', 'PAID', '07d5debcebaf474b7f6145e0e0351237c7722f8b13212c06', 'qr-tickets/166.png', 2.00, 1, '2026-01-28 03:31:03', NULL, '1326040798', 'USD'),
(167, 7, '2026-01-28', '13:30', 'EXPIRED', '449c37fe6427b0a7958980c69b9e9a963c5fdf162d0ccf40', NULL, 2.00, 1, '2026-01-28 04:46:11', NULL, NULL, 'PEN'),
(168, 7, '2026-01-28', '13:30', 'EXPIRED', 'd834fb4e67cca9bf0795925d0d137664f564c68de7ade0bb', NULL, 2.00, 1, '2026-01-28 04:50:35', NULL, NULL, 'PEN'),
(169, 7, '2026-01-28', '11:00', 'EXPIRED', '0d2bda72fe819e754d5b38018b986dbf41375da7dd4eb228', NULL, 2.00, 1, '2026-01-28 04:56:39', NULL, NULL, 'PEN'),
(170, 7, '2026-01-28', '09:00', 'PAID', '19c5706068d2464d64f7033c3229e4e93e557ede7dd67ee5', 'qr-tickets/170.png', 2.00, 1, '2026-01-28 05:06:25', NULL, '1344261719', 'USD'),
(171, 7, '2026-01-29', '11:00', 'EXPIRED', 'a03f1b4b084b57515efd21db16060e91144d55c79a9a3397', NULL, 2.00, 1, '2026-01-28 19:27:31', NULL, NULL, 'PEN'),
(172, 7, '2026-01-29', '11:00', 'EXPIRED', 'e21b5639248097342716a605add109259079cc6bb1b10744', NULL, 2.00, 1, '2026-01-28 19:59:40', NULL, NULL, 'PEN'),
(173, 7, '2026-01-28', '16:00', 'PAID', 'fc4f393327b7bee10d3a29e1bd38eabfde16ddfd0340d10d', 'qr-tickets/173.png', 2.00, 1, '2026-01-28 20:48:34', NULL, '1344275151', 'USD');

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
-- Indices de la tabla `cart_item`
--
ALTER TABLE `cart_item`
  ADD PRIMARY KEY (`cit_int_id`);

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
-- Indices de la tabla `inv_category`
--
ALTER TABLE `inv_category`
  ADD PRIMARY KEY (`cat_int_id`);

--
-- Indices de la tabla `inv_product`
--
ALTER TABLE `inv_product`
  ADD PRIMARY KEY (`pro_int_id`),
  ADD UNIQUE KEY `pro_txt_slug` (`pro_txt_slug`);

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
-- Indices de la tabla `ord_item`
--
ALTER TABLE `ord_item`
  ADD PRIMARY KEY (`ori_int_id`);

--
-- Indices de la tabla `ord_order`
--
ALTER TABLE `ord_order`
  ADD PRIMARY KEY (`ord_int_id`);

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
  MODIFY `boo_int_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `bpu_book_purchase`
--
ALTER TABLE `bpu_book_purchase`
  MODIFY `bpu_int_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `cart_cart`
--
ALTER TABLE `cart_cart`
  MODIFY `car_int_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `cart_item`
--
ALTER TABLE `cart_item`
  MODIFY `cit_int_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `core_user`
--
ALTER TABLE `core_user`
  MODIFY `use_int_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `cou_course`
--
ALTER TABLE `cou_course`
  MODIFY `cou_int_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `cpu_course_purchase`
--
ALTER TABLE `cpu_course_purchase`
  MODIFY `cpu_int_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `inv_category`
--
ALTER TABLE `inv_category`
  MODIFY `cat_int_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `inv_product`
--
ALTER TABLE `inv_product`
  MODIFY `pro_int_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `mod_model3d`
--
ALTER TABLE `mod_model3d`
  MODIFY `mod_int_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `mod_purchase`
--
ALTER TABLE `mod_purchase`
  MODIFY `pur_int_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `ord_item`
--
ALTER TABLE `ord_item`
  MODIFY `ori_int_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `ord_order`
--
ALTER TABLE `ord_order`
  MODIFY `ord_int_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `res_reservation`
--
ALTER TABLE `res_reservation`
  MODIFY `res_int_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=174;

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
