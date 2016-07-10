DROP DATABASE IF EXISTS `nu_code`;
CREATE DATABASE `nu_code`;
USE `nu_code`;

CREATE TABLE `users` (
	`id` 				INT UNSIGNED 	NOT NULL AUTO_INCREMENT
);

CREATE TABLE `competitions` (
	`id` 				INT UNSIGNED 	NOT NULL AUTO_INCREMENT,
	`name` 				VARCHAR(50) 	NOT NULL,
    `creator_id` 		INT UNSIGNED 	NOT NULL,

	PRIMARY KEY	(`id`),
    FOREIGN KEY (`creator_id`) REFERENCES `users` (`id`)
);

CREATE TABLE `competition_rounds` (
	`id` 				INT UNSIGNED 	NOT NULL AUTO_INCREMENT,
    `competition_id` 	INT UNSIGNED 	NOT NULL,
    `round_number` 		INT UNSIGNED 	NOT NULL,
    `start_time` 		DATETIME		NOT NULL,
    `end_time` 			DATETIME		NOT NULL,

    PRIMARY KEY	(`id`),
    FOREIGN KEY (`competition_id`) REFERENCES `competitions` (`id`)
);

CREATE TABLE `competition_problems` (
	`id` 				INT UNSIGNED 	NOT NULL AUTO_INCREMENT,
    `round_id` 			INT UNSIGNED 	NOT NULL,
    `name` 				VARCHAR(50)		NOT NULL,
    `description` 		TEXT			NOT NULL,
    `timeout` 			INT UNSIGNED	NOT NULL,
    `penalty_seconds`	INT UNSIGNED	NOT NULL,

	PRIMARY KEY	(`id`),
    FOREIGN KEY (`round_id`) REFERENCES `competition_rounds` (`id`)
);

CREATE TABLE `competition_problem_test_cases` (
	`id`				INT UNSIGNED	NOT NULL AUTO_INCREMENT,
	`problem_id`		INT UNSIGNED	NOT NULL,
	`input`				TEXT 			NOT NULL,
	`output`			TEXT 			NOT NULL,

    PRIMARY KEY	(`id`),
    FOREIGN KEY (`problem_id`) REFERENCES `competition_problems` (`id`)
);

CREATE TABLE `competition_problem_submissions` (
	`id`				INT UNSIGNED	NOT NULL AUTO_INCREMENT,
	`problem_id`		INT UNSIGNED	NOT NULL,
	`submitter_id`		INT UNSIGNED	NOT NULL,
	`status_id`			INT UNSIGNED	NOT NULL,
	`code`				TEXT 			NOT NULL,
	`exec_time`			DECIMAL 		NOT NULL,
	`submission_time`	DATETIME		NOT NULL,

    PRIMARY KEY	(`id`),
    FOREIGN KEY (`problem_id`) REFERENCES `competition_problems` (`id`),
    FOREIGN KEY (`submitter_id`) REFERENCES `users` (`id`),
    FOREIGN KEY (`status_id`) REFERENCES `submission_statuses` (`id`)
);

CREATE TABLE `submission_statuses` (
	`id`				INT UNSIGNED	NOT NULL AUTO_INCREMENT,
    `name`				VARCHAR(50)		NOT NULL,

    PRIMARY KEY (`id`)
);

-- Difficulty??
CREATE TABLE `problems` (
	`id` 				INT UNSIGNED 	NOT NULL AUTO_INCREMENT,
    `name` 				VARCHAR(50)		NOT NULL,
    `description` 		TEXT			NOT NULL,
    `timeout` 			INT UNSIGNED	NOT NULL,
	`creator_id` 		INT UNSIGNED 	NOT NULL,

	PRIMARY KEY	(`id`),
    FOREIGN KEY (`creator_id`) REFERENCES `users` (`id`)
);

CREATE TABLE `problem_test_cases` (
	`id`				INT UNSIGNED	NOT NULL AUTO_INCREMENT,
	`problem_id`		INT UNSIGNED	NOT NULL,
	`input`				TEXT 			NOT NULL,
	`output`			TEXT 			NOT NULL,

    PRIMARY KEY	(`id`),
    FOREIGN KEY (`problem_id`) REFERENCES `problems` (`id`)
);

CREATE TABLE `problem_submissions` (
	`id`				INT UNSIGNED	NOT NULL AUTO_INCREMENT,
	`problem_id`		INT UNSIGNED	NOT NULL,
	`submitter_id`		INT UNSIGNED	NOT NULL,
	`status_id`			INT UNSIGNED	NOT NULL,
	`code`				TEXT 			NOT NULL,
	`exec_time`			DECIMAL 		NOT NULL,
	`submission_time`	DATETIME		NOT NULL,

    PRIMARY KEY	(`id`),
    FOREIGN KEY (`problem_id`) REFERENCES `problems` (`id`),
    FOREIGN KEY (`submitter_id`) REFERENCES `users` (`id`),
    FOREIGN KEY (`status_id`) REFERENCES `submission_statuses` (`id`)
);
