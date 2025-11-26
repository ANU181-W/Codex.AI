/**
 * File Storage Helper
 * Abstracts file storage operations to support both DB and Azure Blob Storage
 * Provides backward compatibility with existing DB-stored files
 */

const blobService = require('./blob.service');
const prisma = require('../../utils/prisma');

class FileStorageHelper {
  constructor() {
    this.useBlobStorage = process.env.USE_BLOB_STORAGE === 'true';
    this.textPreviewMaxBytes = parseInt(process.env.BLOB_TEXT_PREVIEW_MAX_BYTES, 10) || 4096;
  }

  /**
   * Store file content (either in DB or Blob Storage based on config)
   * @param {Buffer} buffer - File content
   * @param {object} fileMetadata - { projectId, filename, type, hash, size }
   * @returns {Promise<object>} Storage result with content/storageKey
   */
  async storeFile(buffer, fileMetadata) {
    const { projectId, filename, type, hash, size } = fileMetadata;

    if (this.useBlobStorage) {
      try {
        // Check if blob service is available
        const isAvailable = await blobService.isAvailable();
        
        if (!isAvailable) {
          console.warn('FileStorageHelper: Blob storage not available, falling back to DB');
          return this._storeInDatabase(buffer, fileMetadata);
        }

        // Upload to Azure Blob Storage
        const contentType = this._getContentType(type);
        const uploadResult = await blobService.uploadFile(
          buffer,
          projectId,
          filename,
          contentType,
          { type, hash, size: size.toString() }
        );

        // Generate text preview for small files (for search/quick access)
        const content = buffer.toString('utf-8');
        const textPreview = content.length <= this.textPreviewMaxBytes 
          ? content 
          : content.substring(0, this.textPreviewMaxBytes);

        return {
          content: null, // Don't store in DB
          storageKey: uploadResult.blobPath,
          contentStoredExternally: true,
          textPreview,
          blobUrl: uploadResult.url,
          deduplicated: uploadResult.deduplicated || false
        };
      } catch (error) {
        console.error('FileStorageHelper: Blob upload failed, falling back to DB:', error.message);
        return this._storeInDatabase(buffer, fileMetadata);
      }
    }

    // Default: store in database
    return this._storeInDatabase(buffer, fileMetadata);
  }

  /**
   * Store file in database (fallback or default mode)
   * @private
   */
  _storeInDatabase(buffer, fileMetadata) {
    const content = buffer.toString('utf-8');
    return {
      content,
      storageKey: null,
      contentStoredExternally: false,
      textPreview: null
    };
  }

  /**
   * Retrieve file content (from DB or Blob Storage)
   * @param {object} fileRecord - File record from database
   * @returns {Promise<string>} File content as string
   */
  async getFileContent(fileRecord) {
    // If content is stored externally, fetch from blob
    if (fileRecord.contentStoredExternally && fileRecord.storageKey) {
      try {
        const content = await blobService.downloadText(fileRecord.storageKey, fileRecord.encoding || 'utf-8');
        return content;
      } catch (error) {
        console.error('FileStorageHelper: Failed to fetch from blob:', error.message);
        
        // Fallback to textPreview if available
        if (fileRecord.textPreview) {
          console.warn('FileStorageHelper: Using textPreview as fallback');
          return fileRecord.textPreview;
        }
        
        throw new Error('Failed to retrieve file content from blob storage');
      }
    }

    // Return content from database
    if (fileRecord.content) {
      return fileRecord.content;
    }

    // Fallback to text preview
    if (fileRecord.textPreview) {
      return fileRecord.textPreview;
    }

    throw new Error('File content not available');
  }

  /**
   * Get file content for multiple files (optimized batch operation)
   * @param {Array<object>} fileRecords - Array of file records
   * @returns {Promise<Map<string, string>>} Map of fileId -> content
   */
  async getMultipleFileContents(fileRecords) {
    const contentMap = new Map();

    for (const file of fileRecords) {
      try {
        const content = await this.getFileContent(file);
        contentMap.set(file.id, content);
      } catch (error) {
        console.error(`FileStorageHelper: Failed to get content for file ${file.id}:`, error.message);
        contentMap.set(file.id, null);
      }
    }

    return contentMap;
  }

  /**
   * Delete file (from DB and/or Blob Storage)
   * @param {object} fileRecord - File record from database
   * @returns {Promise<boolean>}
   */
  async deleteFile(fileRecord) {
    let success = true;

    // Delete from blob storage if applicable
    if (fileRecord.contentStoredExternally && fileRecord.storageKey) {
      try {
        await blobService.deleteFile(fileRecord.storageKey);
      } catch (error) {
        console.error('FileStorageHelper: Failed to delete from blob:', error.message);
        success = false;
      }
    }

    return success;
  }

  /**
   * Delete all files for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<number>} Number of files deleted
   */
  async deleteProjectFiles(projectId) {
    try {
      // Get all files for project
      const files = await prisma.file.findMany({
        where: { projectId },
        select: { id: true, storageKey: true, contentStoredExternally: true }
      });

      // Delete blobs
      let deletedCount = 0;
      for (const file of files) {
        if (file.contentStoredExternally && file.storageKey) {
          try {
            await blobService.deleteFile(file.storageKey);
            deletedCount++;
          } catch (error) {
            console.error(`FileStorageHelper: Failed to delete blob for file ${file.id}`);
          }
        }
      }

      // Alternatively, use batch delete if all files are in same project folder
      if (this.useBlobStorage) {
        try {
          const batchDeleted = await blobService.deleteProjectFiles(projectId);
          console.log(`FileStorageHelper: Batch deleted ${batchDeleted} blobs for project ${projectId}`);
        } catch (error) {
          console.error('FileStorageHelper: Batch delete failed:', error.message);
        }
      }

      return deletedCount;
    } catch (error) {
      console.error('FileStorageHelper: Delete project files failed:', error.message);
      return 0;
    }
  }

  /**
   * Migrate existing DB-stored file to blob storage
   * @param {string} fileId - File ID
   * @returns {Promise<boolean>}
   */
  async migrateFileToBlob(fileId) {
    try {
      const file = await prisma.file.findUnique({ where: { id: fileId } });
      
      if (!file || !file.content) {
        console.warn(`FileStorageHelper: File ${fileId} has no content to migrate`);
        return false;
      }

      if (file.contentStoredExternally) {
        console.warn(`FileStorageHelper: File ${fileId} already migrated`);
        return true;
      }

      // Upload to blob
      const buffer = Buffer.from(file.content, file.encoding || 'utf-8');
      const contentType = this._getContentType(file.type);
      
      const uploadResult = await blobService.uploadFile(
        buffer,
        file.projectId,
        file.filename,
        contentType,
        { type: file.type, hash: file.hash, size: file.size.toString() }
      );

      // Generate text preview
      const textPreview = file.content.length <= this.textPreviewMaxBytes 
        ? file.content 
        : file.content.substring(0, this.textPreviewMaxBytes);

      // Update database record
      await prisma.file.update({
        where: { id: fileId },
        data: {
          storageKey: uploadResult.blobPath,
          contentStoredExternally: true,
          textPreview,
          content: null // Clear content from DB
        }
      });

      console.log(`FileStorageHelper: Migrated file ${fileId} to blob storage`);
      return true;
    } catch (error) {
      console.error(`FileStorageHelper: Migration failed for file ${fileId}:`, error.message);
      return false;
    }
  }

  /**
   * Get content type from file type enum
   * @private
   */
  _getContentType(fileType) {
    const typeMap = {
      HTML: 'text/html',
      CSS: 'text/css',
      SCSS: 'text/x-scss',
      LESS: 'text/x-less',
      JS: 'application/javascript',
      JSX: 'text/jsx',
      TS: 'application/typescript',
      TSX: 'text/tsx',
      JSON: 'application/json',
      YAML: 'text/yaml'
    };
    return typeMap[fileType] || 'text/plain';
  }

  /**
   * Check if blob storage is enabled and available
   * @returns {Promise<boolean>}
   */
  async isBlobStorageEnabled() {
    if (!this.useBlobStorage) return false;
    return await blobService.isAvailable();
  }
}

// Export singleton instance
module.exports = new FileStorageHelper();
