CREATE TABLE `friends` (
    `userOneId` INT(10) UNSIGNED NOT NULL,
    `userTwoId` INT(10) UNSIGNED NOT NULL,
    `status` TINYINT(3) UNSIGNED NOT NULL DEFAULT '0',
    `actionUserId` INT(10) UNSIGNED NOT NULL,
    FOREIGN KEY (`userOneId`) REFERENCES users(`id`),
    FOREIGN KEY (`userTwoId`) REFERENCES users(`id`),
    FOREIGN KEY (`actionUserId`) REFERENCES users(`id`)
);

ALTER TABLE `friends`
ADD UNIQUE KEY `uniqueUsersId` (`userOneId`,`userTwoId`);


-- Create friendship between Richard and Cheney
INSERT INTO `friends` (`userOneId`, `userTwoId`, `status`, `actionUserId`) VALUES
(2, 12, 1, 2);

-- Get posts by my friends
SET @current_user:=2;

SELECT R.*
FROM reports R
JOIN friends F ON (F.userOneId = @current_user OR F.userTwoId = @current_user)
WHERE R.authorId != @current_user AND (R.authorId = F.userOneId OR R.authorId = F.userTwoId);

-- Get posts by me AND my friends
SET @current_user:=2;

SELECT R.*
FROM reports R
JOIN friends F ON (F.userOneId = @current_user OR F.userTwoId = @current_user)
WHERE R.authorId = F.userOneId OR R.authorId = F.userTwoId;