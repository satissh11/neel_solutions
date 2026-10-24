ALTER TABLE `Order`
  ADD COLUMN `shippingPhone` VARCHAR(20) NULL,
  ADD COLUMN `whatsappUpdates` BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE `OrderStatusUpdate` (
  `id` VARCHAR(191) NOT NULL,
  `orderId` VARCHAR(191) NOT NULL,
  `status` ENUM('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED') NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `OrderStatusUpdate_orderId_createdAt_idx`(`orderId`, `createdAt`),
  PRIMARY KEY (`id`),
  CONSTRAINT `OrderStatusUpdate_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `OrderStatusUpdate` (`id`, `orderId`, `status`, `createdAt`)
SELECT UUID(), `id`, `status`, `updatedAt` FROM `Order`;
