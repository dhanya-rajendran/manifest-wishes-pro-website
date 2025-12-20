-- AlterTable
ALTER TABLE `User` ADD COLUMN `plan` VARCHAR(191) NOT NULL DEFAULT 'free';

-- CreateTable
CREATE TABLE `UserCategory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `UserCategory_userId_idx`(`userId`),
    UNIQUE INDEX `UserCategory_userId_name_key`(`userId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserCategory` ADD CONSTRAINT `UserCategory_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
