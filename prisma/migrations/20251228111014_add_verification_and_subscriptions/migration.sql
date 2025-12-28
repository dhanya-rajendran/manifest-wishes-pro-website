/*
  Warnings:

  - A unique constraint covering the columns `[phone]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `User` ADD COLUMN `emailVerified` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `gender` VARCHAR(191) NULL,
    ADD COLUMN `phone` VARCHAR(191) NULL,
    ADD COLUMN `phoneVerified` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `SubscriptionPlan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `priceMonthlyCents` INTEGER NOT NULL DEFAULT 0,
    `priceYearlyCents` INTEGER NOT NULL DEFAULT 0,
    `yearlyDiscountPercent` INTEGER NULL,
    `limits` JSON NULL,
    `permissions` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SubscriptionPlan_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserSubscription` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `planId` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NULL,
    `cancelAt` DATETIME(3) NULL,

    INDEX `UserSubscription_userId_idx`(`userId`),
    INDEX `UserSubscription_planId_idx`(`planId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmailVerificationToken` (
    `id` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `EmailVerificationToken_token_key`(`token`),
    INDEX `EmailVerificationToken_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhoneVerificationCode` (
    `id` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PhoneVerificationCode_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `User_phone_key` ON `User`(`phone`);

-- AddForeignKey
ALTER TABLE `UserSubscription` ADD CONSTRAINT `UserSubscription_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserSubscription` ADD CONSTRAINT `UserSubscription_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `SubscriptionPlan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmailVerificationToken` ADD CONSTRAINT `EmailVerificationToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhoneVerificationCode` ADD CONSTRAINT `PhoneVerificationCode_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
