# Codex.AI - Azure Deployment Guide

This codebase is now **production-ready** for Azure deployment with full support for:
- ✅ Azure Database for MySQL (Prisma)
- ✅ Azure Cache for Redis
- ✅ Azure Blob Storage (file uploads)
- ✅ Azure OpenAI Service
- ✅ Backward compatibility with DB-only storage

---

## **What Changed**

### **New Services Added**

1. **Azure Blob Storage Service** (`Backend/services/storage/blob.service.js`)
   - Upload/download files to Azure Blob Storage
   - Supports Managed Identity (prod) and Connection String (dev)
   - Automatic deduplication by file hash
   - Fallback to DB storage if unavailable

2. **Redis Cache Adapter** (`Backend/services/storage/redis.adapter.js`)
   - Drop-in replacement for in-memory cache
   - Falls back to memory if Redis unavailable
   - Same interface as existing cache.service.js

3. **File Storage Helper** (`Backend/services/storage/fileStorage.helper.js`)
   - Abstracts storage operations
   - Handles dual-mode (DB or Blob) via `USE_BLOB_STORAGE` flag
   - Fetches content for AI analysis from correct storage

4. **Health Check Endpoints** (`Backend/Routes/healthRoutes.js`)
   - `/api/health/healthz` - Liveness probe
   - `/api/health/readyz` - Readiness probe (checks DB, Redis, Blob)

### **Modified Files (Backward Compatible)**

1. **Prisma Schema** (`Backend/prisma/schema.prisma`)
   - Added: `storageKey`, `contentStoredExternally`, `textPreview` to `File` model
   - Made `content` field nullable
   - **Migration:** `Backend/prisma/migrations/20251126_add_blob_storage_fields/migration.sql`

2. **File Controller** (`Backend/Controller/fileController.js`)
   - Uses `fileStorageHelper` to store files
   - Automatically uploads to Blob if `USE_BLOB_STORAGE=true`
   - Falls back to DB if Blob unavailable

3. **AI Service** (`Backend/services/ai.service.js`)
   - Supports Azure OpenAI via `OPENAI_PROVIDER=azure`
   - Fetches file content from Blob Storage when needed
   - Uses Redis cache if `REDIS_URL` configured

4. **Package.json** (`Backend/package.json`)
   - Added: `@azure/storage-blob`, `@azure/identity`, `ioredis`

5. **Environment Variables** (`Backend/.env.example`)
   - Added all Azure service configuration

---

## **Local Development Setup**

### **1. Install Dependencies**

```powershell
cd Backend
npm install

cd ../Client
npm install
```

### **2. Configure Environment**

Copy `.env.example` to `.env` and configure:

```bash
# Backend/.env
NODE_ENV=development
PORT=5000

# Database (local MySQL or Azure MySQL dev tier)
DATABASE_URL=mysql://user:password@localhost:3306/codex_ai

# CORS
CORS_ORIGIN=http://localhost:5173

# OpenAI (can use standard OpenAI for dev)
OPENAI_API_KEY=sk-...
OPENAI_PROVIDER=openai

# Cache (optional - will use in-memory if not set)
# REDIS_URL=redis://localhost:6379

# Blob Storage (optional - will use DB storage if not set)
USE_BLOB_STORAGE=false
```

### **3. Run Database Migrations**

```powershell
cd Backend
npx prisma generate
npx prisma migrate deploy
```

### **4. Start Services**

```powershell
# Terminal 1: Backend
cd Backend
npm run dev

# Terminal 2: Client
cd Client
npm run dev
```

### **5. Test Health Endpoints**

```powershell
# Test liveness
curl http://localhost:5000/api/health/healthz

# Test readiness
curl http://localhost:5000/api/health/readyz
```

---

## **Azure Production Deployment**

### **Prerequisites**

Request these Azure services from your org (see DEPLOYMENT-AZURE.md for full list):

**Required:**
- Azure Container Registry
- Azure Container Apps (or App Service)
- Azure Database for MySQL - Flexible Server
- Azure Cache for Redis
- Azure Storage Account (with `project-files` container)
- Azure OpenAI Service (with `gpt-4o-mini` and `gpt-4o` deployments)
- Azure Key Vault
- Application Insights

**Optional:**
- Virtual Network + Private Endpoints (production security)
- Azure Service Bus (async scanning)

### **Environment Configuration (Production)**

Set these in Azure Container App/App Service configuration or Key Vault:

```bash
NODE_ENV=production
PORT=5000

# Database
DATABASE_URL=mysql://user:password@mysql-codexai-prod.mysql.database.azure.com:3306/codexai?sslmode=required

# CORS (your Static Web App or Front Door URL)
CORS_ORIGIN=https://swa-codexai.azurestaticapps.net

# Azure OpenAI
OPENAI_API_KEY={from Key Vault}
OPENAI_BASE_URL=https://aoai-codexai-prod.openai.azure.com
OPENAI_DEPLOYMENT_NAME=gpt-4o-mini
OPENAI_API_VERSION=2024-08-01-preview
OPENAI_PROVIDER=azure
MODEL_ROUTING_SMALL=gpt-4o-mini
MODEL_ROUTING_MEDIUM=gpt-4o
MODEL_ROUTING_LARGE=gpt-4o

# Redis
REDIS_URL=rediss://redis-codexai-prod.redis.cache.windows.net:6380

# Azure Blob Storage (Managed Identity)
USE_BLOB_STORAGE=true
AZURE_STORAGE_ACCOUNT=stcodexai
AZURE_STORAGE_CONTAINER=project-files
USE_MANAGED_IDENTITY=true

# Observability
APPINSIGHTS_CONNECTION_STRING={from Key Vault}
```

### **Deployment Steps**

#### **1. Build and Push Docker Image**

Create `Backend/Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Generate Prisma Client
RUN npx prisma generate

EXPOSE 5000

CMD ["node", "server.js"]
```

Build and push:

```powershell
# Login to ACR
az acr login --name acrcodexai

# Build and push
docker build -t acrcodexai.azurecr.io/codexai-backend:latest ./Backend
docker push acrcodexai.azurecr.io/codexai-backend:latest
```

#### **2. Deploy to Azure Container Apps**

```powershell
# Create Container App
az containerapp create `
  --name ca-codexai-api `
  --resource-group rg-codexai-prod `
  --environment cae-codexai-prod `
  --image acrcodexai.azurecr.io/codexai-backend:latest `
  --target-port 5000 `
  --ingress external `
  --min-replicas 1 `
  --max-replicas 10 `
  --cpu 1.0 `
  --memory 2Gi `
  --registry-server acrcodexai.azurecr.io `
  --env-vars @env-vars.yaml
```

#### **3. Run Database Migrations**

```powershell
# Execute migration in container
az containerapp exec `
  --name ca-codexai-api `
  --resource-group rg-codexai-prod `
  --command "npx prisma migrate deploy"
```

#### **4. Enable Managed Identity**

```powershell
# Enable system-assigned identity
az containerapp identity assign `
  --name ca-codexai-api `
  --resource-group rg-codexai-prod `
  --system-assigned

# Get the identity principal ID
$principalId = az containerapp identity show `
  --name ca-codexai-api `
  --resource-group rg-codexai-prod `
  --query principalId -o tsv

# Grant permissions
az role assignment create `
  --assignee $principalId `
  --role "Storage Blob Data Contributor" `
  --scope /subscriptions/{subscription-id}/resourceGroups/rg-codexai-prod/providers/Microsoft.Storage/storageAccounts/stcodexai

az role assignment create `
  --assignee $principalId `
  --role "Key Vault Secrets User" `
  --scope /subscriptions/{subscription-id}/resourceGroups/rg-codexai-prod/providers/Microsoft.KeyVault/vaults/kv-codexai-prod
```

---

## **Feature Flags**

### **Storage Mode**

```bash
# Use Azure Blob Storage for file uploads
USE_BLOB_STORAGE=true

# Fallback to database storage (backward compatible)
USE_BLOB_STORAGE=false
```

**When to enable:**
- ✅ Enable in production for scalability
- ⚠️ Optional in dev (can use DB for simplicity)

### **Cache Backend**

```bash
# Use Redis
REDIS_URL=redis://localhost:6379

# Use in-memory cache (automatic fallback if Redis not configured)
# (omit REDIS_URL)
```

### **AI Provider**

```bash
# Azure OpenAI
OPENAI_PROVIDER=azure
OPENAI_BASE_URL=https://your-openai.openai.azure.com
OPENAI_DEPLOYMENT_NAME=gpt-4o-mini

# Standard OpenAI
OPENAI_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

---

## **Monitoring & Health Checks**

### **Liveness Probe**
```
GET /api/health/healthz
```
Returns 200 if app is running.

### **Readiness Probe**
```
GET /api/health/readyz
```
Returns 200 if app + dependencies (DB, Redis, Blob) are ready.

### **Configure in Container Apps**

```yaml
probes:
  liveness:
    httpGet:
      path: /api/health/healthz
      port: 5000
    initialDelaySeconds: 10
    periodSeconds: 30
  readiness:
    httpGet:
      path: /api/health/readyz
      port: 5000
    initialDelaySeconds: 5
    periodSeconds: 10
```

---

## **Migration Path: DB Storage → Blob Storage**

If you have existing files in the database:

### **1. Run Migration Script**

```javascript
// Backend/scripts/migrate-to-blob.js
const prisma = require('./utils/prisma');
const fileStorageHelper = require('./services/storage/fileStorage.helper');

async function migrateFilesToBlob() {
  const files = await prisma.file.findMany({
    where: {
      contentStoredExternally: false,
      content: { not: null }
    }
  });

  console.log(`Found ${files.length} files to migrate`);

  for (const file of files) {
    try {
      await fileStorageHelper.migrateFileToBlob(file.id);
      console.log(`Migrated file ${file.id}: ${file.filename}`);
    } catch (error) {
      console.error(`Failed to migrate file ${file.id}:`, error.message);
    }
  }

  console.log('Migration complete');
}

migrateFilesToBlob().then(() => process.exit(0)).catch(console.error);
```

### **2. Run Migration**

```powershell
# Set environment variables
$env:USE_BLOB_STORAGE = "true"
$env:AZURE_STORAGE_CONNECTION_STRING = "..."

# Run script
node Backend/scripts/migrate-to-blob.js
```

---

## **Cost Optimization**

### **Current Mode (DB Storage)**
- MySQL storage: ~$0.12/GB/month
- All files stored in database
- Increases backup size and costs

### **Blob Storage Mode (Production)**
- Blob storage: ~$0.02/GB/month (Hot tier)
- 83% cost reduction vs DB storage
- Separate backups for data and files

### **Recommendations**
1. **Dev:** Use DB storage (`USE_BLOB_STORAGE=false`)
2. **Prod:** Use Blob storage (`USE_BLOB_STORAGE=true`)
3. **Hybrid:** Migrate incrementally, old files stay in DB, new files go to Blob

---

## **Testing**

### **Test File Upload (DB Mode)**

```powershell
curl -X POST http://localhost:5000/api/files/upload/{projectId} `
  -F "index=@test.html" `
  -H "Content-Type: multipart/form-data"
```

### **Test File Upload (Blob Mode)**

```powershell
$env:USE_BLOB_STORAGE = "true"
$env:AZURE_STORAGE_CONNECTION_STRING = "..."

# Restart server, then upload
curl -X POST http://localhost:5000/api/files/upload/{projectId} `
  -F "index=@test.html"

# Verify in Azure Portal: Storage Account → Containers → project-files
```

### **Test AI Analysis**

```powershell
curl -X POST http://localhost:5000/api/analysis/code `
  -H "Content-Type: application/json" `
  -d '{"content":"<html><img src=\"test.jpg\"></html>","type":"html","filename":"test.html"}'
```

---

## **Troubleshooting**

### **"Blob storage not available"**
- Check `AZURE_STORAGE_CONNECTION_STRING` or Managed Identity permissions
- Verify container `project-files` exists
- Check firewall rules if using Private Endpoint

### **"Redis connection failed"**
- Check `REDIS_URL` format (redis:// or rediss:// for TLS)
- Verify Redis is running and accessible
- App will automatically fall back to in-memory cache

### **"Azure OpenAI deployment not found"**
- Verify `OPENAI_DEPLOYMENT_NAME` matches your Azure OpenAI deployment
- Check `OPENAI_BASE_URL` includes correct resource name
- Ensure API version is compatible

### **"Prisma migration failed"**
- Run `npx prisma generate` before `npx prisma migrate deploy`
- Ensure DATABASE_URL has correct permissions
- Check MySQL version compatibility (8.0+)

---

## **Next Steps**

1. **Install dependencies**: `npm install` in Backend/
2. **Run migrations**: `npx prisma migrate deploy`
3. **Test locally**: Set `USE_BLOB_STORAGE=false` for dev
4. **Deploy to Azure**: Follow deployment steps above
5. **Enable Blob Storage**: Set `USE_BLOB_STORAGE=true` in production
6. **Monitor**: Use Application Insights dashboards

For complete Azure service requirements, see **DEPLOYMENT-AZURE.md**.

---

## **Support**

For issues or questions:
- **Technical**: Check logs via `az containerapp logs show`
- **Azure Services**: Contact platform team (Samarth Sihare)
- **Code Issues**: Create GitHub issue in repo

**Your codebase is now production-ready for Azure! 🚀**
