/*
  Warnings:

  - You are about to drop the column `chairId` on the `ScheduleConfig` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `ScheduleConfig` DROP FOREIGN KEY `ScheduleConfig_chairId_fkey`;

-- DropIndex
DROP INDEX `ScheduleConfig_chairId_fkey` ON `ScheduleConfig`;

-- AlterTable
ALTER TABLE `ScheduleConfig` DROP COLUMN `chairId`;
