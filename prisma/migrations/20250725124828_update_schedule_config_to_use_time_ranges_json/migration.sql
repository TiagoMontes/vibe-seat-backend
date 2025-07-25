/*
  Warnings:

  - You are about to drop the column `timeEnd` on the `ScheduleConfig` table. All the data in the column will be lost.
  - You are about to drop the column `timeStart` on the `ScheduleConfig` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `ScheduleConfig` DROP COLUMN `timeEnd`,
    DROP COLUMN `timeStart`,
    ADD COLUMN `timeRanges` JSON NOT NULL DEFAULT ('[]');
