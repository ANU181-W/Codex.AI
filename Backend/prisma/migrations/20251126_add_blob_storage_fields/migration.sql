-- AlterTable: Add Azure Blob Storage support to files table
-- Makes content nullable and adds storage fields for external blob storage

ALTER TABLE `files` 
  MODIFY `content` LONGTEXT NULL,
  ADD COLUMN `storage_key` VARCHAR(1000) NULL AFTER `encoding`,
  ADD COLUMN `content_stored_externally` BOOLEAN NOT NULL DEFAULT false AFTER `storage_key`,
  ADD COLUMN `text_preview` TEXT NULL AFTER `content_stored_externally`,
  ADD INDEX `files_content_stored_externally_idx` (`content_stored_externally`);
