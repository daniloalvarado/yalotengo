-- 1. Modificar columna de estado para usar 'IN_PROGRESS'
-- NOTA: Esto convertirá 'PREPARING' o 'PRINTING' antiguos a 'IN_PROGRESS' si se hace con cuidado.
-- MySQL a veces rechaza cambios de ENUM si hay datos que no coinciden.
-- Lo más seguro es hacer UPDATE primero:

UPDATE mod_purchase SET pur_txt_delivery_status = 'ACCEPTED' WHERE pur_txt_delivery_status NOT IN ('ACCEPTED', 'DELIVERED');

ALTER TABLE mod_purchase 
MODIFY COLUMN pur_txt_delivery_status ENUM('ACCEPTED', 'IN_PROGRESS', 'DELIVERED') NOT NULL DEFAULT 'ACCEPTED';

-- 2. Agregar columna de Estimación de Entrega
ALTER TABLE mod_purchase 
ADD COLUMN pur_txt_delivery_estimate VARCHAR(50) NOT NULL DEFAULT '1 día';
