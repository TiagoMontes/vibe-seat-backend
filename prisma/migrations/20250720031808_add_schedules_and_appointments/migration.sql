-- CreateTable
CREATE TABLE `ScheduleConfig` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `chairId` INTEGER NOT NULL,
    `dayOfWeek` INTEGER NOT NULL,
    `timeStart` VARCHAR(191) NOT NULL,
    `timeEnd` VARCHAR(191) NOT NULL,
    `validFrom` DATETIME(3) NULL,
    `validTo` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Appointment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `chairId` INTEGER NOT NULL,
    `datetimeStart` DATETIME(3) NOT NULL,
    `datetimeEnd` DATETIME(3) NOT NULL,
    `status` ENUM('SCHEDULED', 'CANCELLED', 'CONFIRMED') NOT NULL DEFAULT 'SCHEDULED',
    `presenceConfirmed` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ScheduleConfig` ADD CONSTRAINT `ScheduleConfig_chairId_fkey` FOREIGN KEY (`chairId`) REFERENCES `Chair`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Appointment` ADD CONSTRAINT `Appointment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Appointment` ADD CONSTRAINT `Appointment_chairId_fkey` FOREIGN KEY (`chairId`) REFERENCES `Chair`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
