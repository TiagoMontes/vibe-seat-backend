-- DropForeignKey
ALTER TABLE `DayOfWeek` DROP FOREIGN KEY `DayOfWeek_scheduleConfigId_fkey`;

-- DropIndex
DROP INDEX `DayOfWeek_scheduleConfigId_fkey` ON `DayOfWeek`;

-- AlterTable
ALTER TABLE `DayOfWeek` MODIFY `scheduleConfigId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `DayOfWeek` ADD CONSTRAINT `DayOfWeek_scheduleConfigId_fkey` FOREIGN KEY (`scheduleConfigId`) REFERENCES `ScheduleConfig`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
