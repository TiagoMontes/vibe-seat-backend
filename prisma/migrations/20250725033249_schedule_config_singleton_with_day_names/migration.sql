/*
  Warnings:

  - You are about to drop the column `dayOfWeek` on the `ScheduleConfig` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `ScheduleConfig` DROP COLUMN `dayOfWeek`,
    MODIFY `id` INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE `DayOfWeek` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `scheduleConfigId` INTEGER NOT NULL DEFAULT 1,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `DayOfWeek` ADD CONSTRAINT `DayOfWeek_scheduleConfigId_fkey` FOREIGN KEY (`scheduleConfigId`) REFERENCES `ScheduleConfig`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
