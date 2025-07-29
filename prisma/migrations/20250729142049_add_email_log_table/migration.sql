-- CreateTable
CREATE TABLE `EmailLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `appointmentId` INTEGER NOT NULL,
    `emailType` ENUM('CONFIRMATION', 'REMINDER') NOT NULL,
    `recipientEmail` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'SENT', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `sentAt` DATETIME(3) NULL,
    `errorMessage` VARCHAR(191) NULL,
    `category` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `EmailLog_appointmentId_emailType_key`(`appointmentId`, `emailType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `EmailLog` ADD CONSTRAINT `EmailLog_appointmentId_fkey` FOREIGN KEY (`appointmentId`) REFERENCES `Appointment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
