ALTER TABLE `Order`
  MODIFY `status` ENUM('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED') NOT NULL DEFAULT 'PENDING';

ALTER TABLE `OrderStatusUpdate`
  MODIFY `status` ENUM('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED') NOT NULL;

CREATE TABLE `WhatsAppMessage` (
  `id` VARCHAR(191) NOT NULL,
  `orderId` VARCHAR(191) NOT NULL,
  `orderStatus` ENUM('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED') NOT NULL,
  `templateName` VARCHAR(100) NOT NULL,
  `recipient` VARCHAR(20) NOT NULL,
  `customerName` VARCHAR(120) NOT NULL,
  `state` ENUM('QUEUED', 'PROCESSING', 'SENT', 'DELIVERED', 'READ', 'FAILED') NOT NULL DEFAULT 'QUEUED',
  `providerMessageId` VARCHAR(191) NULL,
  `attempts` INTEGER NOT NULL DEFAULT 0,
  `nextAttemptAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `lastErrorCode` VARCHAR(80) NULL,
  `lastErrorMessage` VARCHAR(500) NULL,
  `sentAt` DATETIME(3) NULL,
  `deliveredAt` DATETIME(3) NULL,
  `readAt` DATETIME(3) NULL,
  `failedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `WhatsAppMessage_providerMessageId_key` (`providerMessageId`),
  UNIQUE INDEX `WhatsAppMessage_orderId_orderStatus_key` (`orderId`, `orderStatus`),
  INDEX `WhatsAppMessage_state_nextAttemptAt_idx` (`state`, `nextAttemptAt`),
  PRIMARY KEY (`id`),
  CONSTRAINT `WhatsAppMessage_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
