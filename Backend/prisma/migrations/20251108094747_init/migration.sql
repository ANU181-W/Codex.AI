-- CreateTable
CREATE TABLE `projects` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('ACTIVE', 'ARCHIVED', 'DELETED') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `projects_created_at_idx`(`created_at`),
    INDEX `projects_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `files` (
    `id` VARCHAR(191) NOT NULL,
    `project_id` VARCHAR(191) NOT NULL,
    `path` VARCHAR(500) NOT NULL,
    `filename` VARCHAR(255) NOT NULL,
    `type` ENUM('HTML', 'JSX', 'TSX', 'CSS', 'SCSS', 'LESS', 'JSON', 'YAML') NOT NULL,
    `content` LONGTEXT NOT NULL,
    `hash` VARCHAR(64) NOT NULL,
    `size` INTEGER NOT NULL,
    `encoding` VARCHAR(20) NOT NULL DEFAULT 'utf-8',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `files_project_id_idx`(`project_id`),
    INDEX `files_hash_idx`(`hash`),
    INDEX `files_type_idx`(`type`),
    UNIQUE INDEX `files_project_id_path_key`(`project_id`, `path`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `issues` (
    `id` VARCHAR(191) NOT NULL,
    `file_id` VARCHAR(191) NOT NULL,
    `category` ENUM('STRUCTURAL', 'ACCESSIBILITY', 'SEO', 'SECURITY', 'PERFORMANCE', 'I18N', 'DESIGN_SYSTEM', 'BEST_PRACTICE') NOT NULL,
    `severity` ENUM('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO') NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `line` INTEGER NULL,
    `column` INTEGER NULL,
    `end_line` INTEGER NULL,
    `end_column` INTEGER NULL,
    `code` TEXT NULL,
    `rule` VARCHAR(100) NULL,
    `rule_url` VARCHAR(500) NULL,
    `status` ENUM('OPEN', 'FIXED', 'IGNORED', 'WONT_FIX') NOT NULL DEFAULT 'OPEN',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `resolved_at` DATETIME(3) NULL,

    INDEX `issues_file_id_idx`(`file_id`),
    INDEX `issues_category_idx`(`category`),
    INDEX `issues_severity_idx`(`severity`),
    INDEX `issues_status_idx`(`status`),
    INDEX `issues_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fixes` (
    `id` VARCHAR(191) NOT NULL,
    `issue_id` VARCHAR(191) NOT NULL,
    `patch_diff` LONGTEXT NOT NULL,
    `rationale` TEXT NOT NULL,
    `ai_generated` BOOLEAN NOT NULL DEFAULT false,
    `ai_model` VARCHAR(50) NULL,
    `generated_content` TEXT NULL,
    `confidence` FLOAT NULL,
    `applied` BOOLEAN NOT NULL DEFAULT false,
    `applied_at` DATETIME(3) NULL,
    `verified` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `fixes_issue_id_idx`(`issue_id`),
    INDEX `fixes_applied_idx`(`applied`),
    INDEX `fixes_ai_generated_idx`(`ai_generated`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `design_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `project_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `category` ENUM('COLOR', 'TYPOGRAPHY', 'SPACING', 'BORDER_RADIUS', 'SHADOW', 'BREAKPOINT', 'Z_INDEX', 'ANIMATION', 'OTHER') NOT NULL,
    `value` VARCHAR(500) NOT NULL,
    `css_variable` VARCHAR(255) NULL,
    `tokens_json` LONGTEXT NOT NULL,
    `version` VARCHAR(20) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `design_tokens_project_id_idx`(`project_id`),
    INDEX `design_tokens_category_idx`(`category`),
    UNIQUE INDEX `design_tokens_project_id_name_key`(`project_id`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `scan_results` (
    `id` VARCHAR(191) NOT NULL,
    `project_id` VARCHAR(191) NOT NULL,
    `total_files` INTEGER NOT NULL DEFAULT 0,
    `total_issues` INTEGER NOT NULL DEFAULT 0,
    `critical_issues` INTEGER NOT NULL DEFAULT 0,
    `high_issues` INTEGER NOT NULL DEFAULT 0,
    `medium_issues` INTEGER NOT NULL DEFAULT 0,
    `low_issues` INTEGER NOT NULL DEFAULT 0,
    `info_issues` INTEGER NOT NULL DEFAULT 0,
    `fixes_generated` INTEGER NOT NULL DEFAULT 0,
    `fixes_applied` INTEGER NOT NULL DEFAULT 0,
    `scan_duration` INTEGER NOT NULL,
    `cache_hits` INTEGER NOT NULL DEFAULT 0,
    `ai_calls_made` INTEGER NOT NULL DEFAULT 0,
    `ai_cost_usd` FLOAT NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `scan_results_project_id_idx`(`project_id`),
    INDEX `scan_results_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cache` (
    `id` VARCHAR(191) NOT NULL,
    `file_hash` VARCHAR(64) NOT NULL,
    `scan_results` LONGTEXT NOT NULL,
    `hit_count` INTEGER NOT NULL DEFAULT 0,
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `last_accessed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `cache_file_hash_key`(`file_hash`),
    INDEX `cache_file_hash_idx`(`file_hash`),
    INDEX `cache_expires_at_idx`(`expires_at`),
    INDEX `cache_last_accessed_at_idx`(`last_accessed_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_preferences` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(255) NULL,
    `session_id` VARCHAR(255) NULL,
    `preference_key` VARCHAR(100) NOT NULL,
    `preference_value` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `user_preferences_user_id_idx`(`user_id`),
    INDEX `user_preferences_session_id_idx`(`session_id`),
    INDEX `user_preferences_preference_key_idx`(`preference_key`),
    UNIQUE INDEX `user_preferences_user_id_preference_key_key`(`user_id`, `preference_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clarification_questions` (
    `id` VARCHAR(191) NOT NULL,
    `issue_id` VARCHAR(191) NULL,
    `question` TEXT NOT NULL,
    `context` TEXT NULL,
    `options` JSON NULL,
    `answer` TEXT NULL,
    `answered_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `clarification_questions_issue_id_idx`(`issue_id`),
    INDEX `clarification_questions_answered_at_idx`(`answered_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` VARCHAR(191) NOT NULL,
    `entity_type` VARCHAR(50) NOT NULL,
    `entity_id` VARCHAR(36) NOT NULL,
    `action` VARCHAR(50) NOT NULL,
    `user_id` VARCHAR(255) NULL,
    `metadata` JSON NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_entity_type_entity_id_idx`(`entity_type`, `entity_id`),
    INDEX `audit_logs_user_id_idx`(`user_id`),
    INDEX `audit_logs_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `verification_results` (
    `id` VARCHAR(191) NOT NULL,
    `project_id` VARCHAR(191) NOT NULL,
    `before_scan_id` VARCHAR(191) NOT NULL,
    `after_scan_id` VARCHAR(191) NOT NULL,
    `issues_resolved` INTEGER NOT NULL DEFAULT 0,
    `issues_remaining` INTEGER NOT NULL DEFAULT 0,
    `improvement_percent` FLOAT NOT NULL,
    `performance_score` INTEGER NULL,
    `accessibility_score` INTEGER NULL,
    `seo_score` INTEGER NULL,
    `security_score` INTEGER NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `verification_results_project_id_idx`(`project_id`),
    INDEX `verification_results_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ai_usage` (
    `id` VARCHAR(191) NOT NULL,
    `model` VARCHAR(50) NOT NULL,
    `prompt_tokens` INTEGER NOT NULL,
    `completion_tokens` INTEGER NOT NULL,
    `total_tokens` INTEGER NOT NULL,
    `cost_usd` FLOAT NOT NULL,
    `latency_ms` INTEGER NOT NULL,
    `success` BOOLEAN NOT NULL DEFAULT true,
    `error_message` TEXT NULL,
    `context` VARCHAR(100) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ai_usage_model_idx`(`model`),
    INDEX `ai_usage_created_at_idx`(`created_at`),
    INDEX `ai_usage_context_idx`(`context`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `files` ADD CONSTRAINT `files_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `issues` ADD CONSTRAINT `issues_file_id_fkey` FOREIGN KEY (`file_id`) REFERENCES `files`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fixes` ADD CONSTRAINT `fixes_issue_id_fkey` FOREIGN KEY (`issue_id`) REFERENCES `issues`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `design_tokens` ADD CONSTRAINT `design_tokens_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `scan_results` ADD CONSTRAINT `scan_results_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
