-- AlterTable
ALTER TABLE `FocusSession` ADD COLUMN `mode` VARCHAR(191) NOT NULL DEFAULT 'focus',
    ADD COLUMN `plannedMinutes` INTEGER NULL,
    ADD COLUMN `targetEnd` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `TimerPause` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,
    `startedAt` DATETIME(3) NOT NULL,
    `endedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TimerPause_userId_idx`(`userId`),
    INDEX `TimerPause_sessionId_idx`(`sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TimerStop` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,
    `stoppedAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TimerStop_userId_idx`(`userId`),
    INDEX `TimerStop_sessionId_idx`(`sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TimerPause` ADD CONSTRAINT `TimerPause_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `FocusSession`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TimerPause` ADD CONSTRAINT `TimerPause_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TimerStop` ADD CONSTRAINT `TimerStop_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `FocusSession`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TimerStop` ADD CONSTRAINT `TimerStop_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
