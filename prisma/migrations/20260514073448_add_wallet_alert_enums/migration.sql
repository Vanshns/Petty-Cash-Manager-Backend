/*
  Warnings:

  - You are about to alter the column `type` on the `walletledger` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(2))`.
  - Added the required column `type` to the `Alert` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `alert` ADD COLUMN `type` ENUM('LOW_BALANCE') NOT NULL;

-- AlterTable
ALTER TABLE `walletledger` MODIFY `type` ENUM('CREDIT', 'DEBIT') NOT NULL;
