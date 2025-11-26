/**
 * Azure Blob Storage Service
 * Handles file uploads, downloads, and management in Azure Blob Storage
 * Supports both connection string (dev) and Managed Identity (prod)
 */

const crypto = require('crypto');
const { BlobServiceClient } = require('@azure/storage-blob');
const { DefaultAzureCredential } = require('@azure/identity');
const stream = require('stream');

class BlobStorageService {
  constructor() {
    this.containerName = process.env.AZURE_STORAGE_CONTAINER || 'project-files';
    this.accountName = process.env.AZURE_STORAGE_ACCOUNT;
    this.useManagedIdentity = process.env.USE_MANAGED_IDENTITY === 'true';
    this.blobServiceClient = null;
    this.containerClient = null;
    this.initialized = false;
  }

  /**
   * Initialize blob service client
   * Uses Managed Identity in production, connection string in dev
   */
  async initialize() {
    if (this.initialized) return;

    try {
      if (this.useManagedIdentity && this.accountName) {
        // Production: Use Managed Identity
        console.log('BlobStorageService: Initializing with Managed Identity');
        const credential = new DefaultAzureCredential();
        const accountUrl = `https://${this.accountName}.blob.core.windows.net`;
        this.blobServiceClient = new BlobServiceClient(accountUrl, credential);
      } else if (process.env.AZURE_STORAGE_CONNECTION_STRING) {
        // Development: Use connection string
        console.log('BlobStorageService: Initializing with connection string');
        this.blobServiceClient = BlobServiceClient.fromConnectionString(
          process.env.AZURE_STORAGE_CONNECTION_STRING
        );
      } else {
        console.warn('BlobStorageService: No storage credentials configured');
        return;
      }

      this.containerClient = this.blobServiceClient.getContainerClient(this.containerName);
      
      // Create container if it doesn't exist
      await this.containerClient.createIfNotExists({
        access: 'none' // Private container
      });

      this.initialized = true;
      console.log(`BlobStorageService: Initialized successfully (container: ${this.containerName})`);
    } catch (error) {
      console.error('BlobStorageService: Initialization failed:', error.message);
      throw error;
    }
  }

  /**
   * Generate blob path: {projectId}/{hash}/{timestamp}-{filename}
   */
  generateBlobPath(projectId, hash, filename) {
    const timestamp = Date.now();
    const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `${projectId}/${hash}/${timestamp}-${sanitized}`;
  }

  /**
   * Upload file buffer to blob storage
   * @param {Buffer} buffer - File content
   * @param {string} projectId - Project ID
   * @param {string} filename - Original filename
   * @param {string} contentType - MIME type
   * @param {object} metadata - Additional metadata
   * @returns {Promise<{blobPath: string, hash: string, url: string}>}
   */
  async uploadFile(buffer, projectId, filename, contentType, metadata = {}) {
    await this.initialize();

    if (!this.containerClient) {
      throw new Error('BlobStorageService: Not initialized');
    }

    try {
      // Compute hash for deduplication
      const hash = crypto.createHash('sha256').update(buffer).digest('hex');
      const blobPath = this.generateBlobPath(projectId, hash, filename);
      
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobPath);

      // Check if blob already exists (deduplication)
      const exists = await blockBlobClient.exists();
      if (exists) {
        console.log(`BlobStorageService: Blob already exists (deduplicated): ${blobPath}`);
        return {
          blobPath,
          hash,
          url: blockBlobClient.url,
          deduplicated: true
        };
      }

      // Upload buffer
      const uploadOptions = {
        blobHTTPHeaders: {
          blobContentType: contentType || 'application/octet-stream',
          blobContentDisposition: `attachment; filename="${filename}"`
        },
        metadata: {
          originalFilename: filename,
          projectId,
          hash,
          uploadedAt: new Date().toISOString(),
          ...metadata
        }
      };

      await blockBlobClient.uploadData(buffer, uploadOptions);

      console.log(`BlobStorageService: Uploaded successfully: ${blobPath} (${buffer.length} bytes)`);

      return {
        blobPath,
        hash,
        url: blockBlobClient.url,
        deduplicated: false
      };
    } catch (error) {
      console.error('BlobStorageService: Upload failed:', error.message);
      throw error;
    }
  }

  /**
   * Upload from stream (for large files)
   * @param {Stream} readStream - Readable stream
   * @param {string} projectId - Project ID
   * @param {string} filename - Original filename
   * @param {string} contentType - MIME type
   * @param {number} size - File size in bytes
   * @returns {Promise<{blobPath: string, url: string}>}
   */
  async uploadStream(readStream, projectId, filename, contentType, size) {
    await this.initialize();

    if (!this.containerClient) {
      throw new Error('BlobStorageService: Not initialized');
    }

    try {
      // Generate hash from filename+timestamp for stream uploads
      const hash = crypto.createHash('sha256')
        .update(`${filename}${Date.now()}`)
        .digest('hex')
        .substring(0, 16);
      
      const blobPath = this.generateBlobPath(projectId, hash, filename);
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobPath);

      const uploadOptions = {
        blobHTTPHeaders: {
          blobContentType: contentType || 'application/octet-stream',
          blobContentDisposition: `attachment; filename="${filename}"`
        },
        metadata: {
          originalFilename: filename,
          projectId,
          uploadedAt: new Date().toISOString()
        }
      };

      await blockBlobClient.uploadStream(readStream, size, 5, uploadOptions);

      console.log(`BlobStorageService: Stream uploaded: ${blobPath}`);

      return {
        blobPath,
        hash,
        url: blockBlobClient.url
      };
    } catch (error) {
      console.error('BlobStorageService: Stream upload failed:', error.message);
      throw error;
    }
  }

  /**
   * Download blob content as buffer
   * @param {string} blobPath - Path to blob
   * @returns {Promise<Buffer>}
   */
  async downloadFile(blobPath) {
    await this.initialize();

    if (!this.containerClient) {
      throw new Error('BlobStorageService: Not initialized');
    }

    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobPath);
      const downloadResponse = await blockBlobClient.download(0);
      
      // Convert stream to buffer
      const chunks = [];
      for await (const chunk of downloadResponse.readableStreamBody) {
        chunks.push(chunk);
      }
      
      const buffer = Buffer.concat(chunks);
      console.log(`BlobStorageService: Downloaded ${blobPath} (${buffer.length} bytes)`);
      return buffer;
    } catch (error) {
      console.error(`BlobStorageService: Download failed for ${blobPath}:`, error.message);
      throw error;
    }
  }

  /**
   * Download blob as string (for text files)
   * @param {string} blobPath - Path to blob
   * @param {string} encoding - Text encoding (default: utf-8)
   * @returns {Promise<string>}
   */
  async downloadText(blobPath, encoding = 'utf-8') {
    const buffer = await this.downloadFile(blobPath);
    return buffer.toString(encoding);
  }

  /**
   * Get download stream (for large files)
   * @param {string} blobPath - Path to blob
   * @returns {Promise<ReadableStream>}
   */
  async getDownloadStream(blobPath) {
    await this.initialize();

    if (!this.containerClient) {
      throw new Error('BlobStorageService: Not initialized');
    }

    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobPath);
      const downloadResponse = await blockBlobClient.download(0);
      return downloadResponse.readableStreamBody;
    } catch (error) {
      console.error(`BlobStorageService: Get stream failed for ${blobPath}:`, error.message);
      throw error;
    }
  }

  /**
   * Check if blob exists
   * @param {string} blobPath - Path to blob
   * @returns {Promise<boolean>}
   */
  async exists(blobPath) {
    await this.initialize();

    if (!this.containerClient) {
      return false;
    }

    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobPath);
      return await blockBlobClient.exists();
    } catch (error) {
      console.error(`BlobStorageService: Exists check failed for ${blobPath}:`, error.message);
      return false;
    }
  }

  /**
   * Delete blob
   * @param {string} blobPath - Path to blob
   * @returns {Promise<boolean>}
   */
  async deleteFile(blobPath) {
    await this.initialize();

    if (!this.containerClient) {
      throw new Error('BlobStorageService: Not initialized');
    }

    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobPath);
      await blockBlobClient.deleteIfExists();
      console.log(`BlobStorageService: Deleted ${blobPath}`);
      return true;
    } catch (error) {
      console.error(`BlobStorageService: Delete failed for ${blobPath}:`, error.message);
      return false;
    }
  }

  /**
   * Delete all files for a project
   * @param {string} projectId - Project ID
   * @returns {Promise<number>} Number of deleted blobs
   */
  async deleteProjectFiles(projectId) {
    await this.initialize();

    if (!this.containerClient) {
      throw new Error('BlobStorageService: Not initialized');
    }

    try {
      let deletedCount = 0;
      const prefix = `${projectId}/`;

      for await (const blob of this.containerClient.listBlobsFlat({ prefix })) {
        await this.deleteFile(blob.name);
        deletedCount++;
      }

      console.log(`BlobStorageService: Deleted ${deletedCount} blobs for project ${projectId}`);
      return deletedCount;
    } catch (error) {
      console.error(`BlobStorageService: Delete project files failed:`, error.message);
      throw error;
    }
  }

  /**
   * Generate SAS URL for temporary download (15 min expiry)
   * @param {string} blobPath - Path to blob
   * @param {number} expiryMinutes - Expiry in minutes (default: 15)
   * @returns {Promise<string>} SAS URL
   */
  async generateSasUrl(blobPath, expiryMinutes = 15) {
    await this.initialize();

    if (!this.containerClient) {
      throw new Error('BlobStorageService: Not initialized');
    }

    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobPath);
      const { BlobSASPermissions, generateBlobSASQueryParameters } = require('@azure/storage-blob');
      
      const sasOptions = {
        containerName: this.containerName,
        blobName: blobPath,
        permissions: BlobSASPermissions.parse('r'), // Read-only
        startsOn: new Date(),
        expiresOn: new Date(Date.now() + expiryMinutes * 60 * 1000)
      };

      // Note: SAS generation requires account key, may not work with Managed Identity
      // For Managed Identity, serve files through backend proxy instead
      const sasToken = generateBlobSASQueryParameters(
        sasOptions,
        this.blobServiceClient.credential
      ).toString();

      return `${blockBlobClient.url}?${sasToken}`;
    } catch (error) {
      console.warn('BlobStorageService: SAS generation not supported with current auth method');
      // Return blob URL without SAS (backend should proxy download)
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobPath);
      return blockBlobClient.url;
    }
  }

  /**
   * Get blob metadata
   * @param {string} blobPath - Path to blob
   * @returns {Promise<object>}
   */
  async getMetadata(blobPath) {
    await this.initialize();

    if (!this.containerClient) {
      throw new Error('BlobStorageService: Not initialized');
    }

    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobPath);
      const properties = await blockBlobClient.getProperties();
      return {
        contentType: properties.contentType,
        contentLength: properties.contentLength,
        lastModified: properties.lastModified,
        metadata: properties.metadata
      };
    } catch (error) {
      console.error(`BlobStorageService: Get metadata failed for ${blobPath}:`, error.message);
      throw error;
    }
  }

  /**
   * Check if blob storage is available
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    try {
      await this.initialize();
      return this.initialized && this.containerClient !== null;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
module.exports = new BlobStorageService();
