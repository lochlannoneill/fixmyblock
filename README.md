# FixMyBlock

A community reporting web app where citizens upload photos and pin local issues (potholes, broken streetlights, graffiti, etc.) on a 3D map. Built with React, MapLibre GL JS, and Azure.

## Architecture

```
┌─────────────────────────────────────────────────┐
│              Azure Static Web Apps               │
│  ┌──────────────┐     ┌───────────────────────┐ │
│  │  React + Vite │────▶│  Azure Functions API  │ │
│  │  (MapLibre 3D)│◀────│  (Node.js + TS)       │ │
│  └──────────────┘     └──────┬──────┬─────────┘ │
│                              │      │            │
│                    ┌─────────▼┐  ┌──▼──────────┐ │
│                    │ Cosmos DB │  │ Blob Storage│ │
│                    │(complaints│  │  (images)   │ │
│                    └──────────┘  └─────────────┘ │
│                                                   │
│               Azure Maps (tile provider)          │
└─────────────────────────────────────────────────┘
```

## Azure Services Used

| Service | Purpose |
|---------|---------|
| **Azure Static Web Apps** | Hosts the React frontend + Azure Functions API together |
| **Azure Cosmos DB** | NoSQL database for complaint records |
| **Azure Blob Storage** | Stores uploaded images |
| **Azure Maps** | Map tile provider for the 3D MapLibre map |

## Prerequisites

- [Node.js 20+](https://nodejs.org/)
- [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli)
- [Azure Functions Core Tools v4](https://learn.microsoft.com/azure/azure-functions/functions-run-local)
- An Azure account with an active subscription

## Azure Setup

### 1. Login to Azure

```bash
az login
az account set --subscription "<YOUR_SUBSCRIPTION_ID>"
```

### 2. Create a Resource Group

```bash
az group create --name fixmyblock-rg --location eastus
```

### 3. Create Azure Cosmos DB

```bash
# Create Cosmos DB account (serverless to minimize cost)
az cosmosdb create \
  --name fixmyblock-cosmos \
  --resource-group fixmyblock-rg \
  --default-consistency-level Session \
  --capabilities EnableServerless

# Create database
az cosmosdb sql database create \
  --account-name fixmyblock-cosmos \
  --resource-group fixmyblock-rg \
  --name fixmyblock

# Create container (partition key = /id)
az cosmosdb sql container create \
  --account-name fixmyblock-cosmos \
  --resource-group fixmyblock-rg \
  --database-name fixmyblock \
  --name complaints \
  --partition-key-path "/id"

# Get connection string
az cosmosdb keys list \
  --name fixmyblock-cosmos \
  --resource-group fixmyblock-rg \
  --type connection-strings \
  --query "connectionStrings[0].connectionString" -o tsv
```

### 4. Create Azure Blob Storage

```bash
# Create storage account
az storage account create \
  --name fixmyblockimages \
  --resource-group fixmyblock-rg \
  --sku Standard_LRS \
  --kind StorageV2 \
  --allow-blob-public-access true

# Create container for images
az storage container create \
  --name images \
  --account-name fixmyblockimages \
  --public-access blob

# Get connection string
az storage account show-connection-string \
  --name fixmyblockimages \
  --resource-group fixmyblock-rg \
  --query connectionString -o tsv
```

### 5. Create Azure Maps Account

```bash
az maps account create \
  --name fixmyblock-maps \
  --resource-group fixmyblock-rg \
  --sku G2 \
  --kind Gen2

# Get the key
az maps account keys list \
  --name fixmyblock-maps \
  --resource-group fixmyblock-rg \
  --query primaryKey -o tsv
```

### 6. Deploy with Azure Static Web Apps

```bash
# Install the SWA CLI
npm install -g @azure/static-web-apps-cli

# Create the Static Web App resource
az staticwebapp create \
  --name fixmyblock \
  --resource-group fixmyblock-rg \
  --location eastus2

# Get deployment token
az staticwebapp secrets list \
  --name fixmyblock \
  --resource-group fixmyblock-rg \
  --query "properties.apiKey" -o tsv
```

### 7. Configure Environment Variables

In Azure Portal, go to your Static Web App > Configuration:

**Application settings (API):**
- `COSMOS_CONNECTION_STRING` = (from step 3)
- `COSMOS_DATABASE` = `fixmyblock`
- `COSMOS_CONTAINER` = `complaints`
- `STORAGE_CONNECTION_STRING` = (from step 4)
- `STORAGE_CONTAINER` = `images`

**Environment variables (Frontend):**

Create `client/.env.local`:
```
VITE_AZURE_MAPS_KEY=<your Azure Maps key from step 5>
```

## Local Development

### 1. Install dependencies

```bash
cd client && npm install
cd ../api && npm install
```

### 2. Configure local settings

Copy `api/local.settings.json` and fill in your connection strings.
Copy `client/.env.example` to `client/.env.local` and add your Azure Maps key.

### 3. Start the API

```bash
cd api
npm run dev
```

### 4. Start the frontend

```bash
cd client
npm run dev
```

The frontend runs on `http://localhost:5173` and proxies `/api/*` to the Azure Functions on port 7071.

### 5. Or use SWA CLI for full-stack local dev

```bash
swa start client --api-location api
```

## Project Structure

```
fixmyblock/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── MapView.tsx       # 3D MapLibre map with complaint pins
│   │   │   ├── ReportForm.tsx    # Submit new complaint form
│   │   │   ├── ComplaintList.tsx  # Sidebar list of complaints
│   │   │   └── Header.tsx        # App header
│   │   ├── services/
│   │   │   └── api.ts            # API client
│   │   ├── types/
│   │   │   └── complaint.ts      # TypeScript interfaces
│   │   ├── App.tsx               # Main app component
│   │   ├── App.css               # Styles
│   │   └── main.tsx              # Entry point
│   ├── .env.example
│   ├── vite.config.ts
│   └── package.json
├── api/                       # Azure Functions API
│   ├── src/
│   │   ├── functions/
│   │   │   └── complaints.ts    # CRUD endpoints
│   │   ├── cosmos.ts            # Cosmos DB operations
│   │   ├── storage.ts           # Blob Storage operations
│   │   └── multipart.ts         # Form data parser
│   ├── host.json
│   ├── local.settings.json
│   └── package.json
├── staticwebapp.config.json   # Azure SWA routing config
└── README.md
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/complaints` | List all complaints |
| GET | `/api/complaints/:id` | Get single complaint |
| POST | `/api/complaints` | Create complaint (multipart/form-data) |
| POST | `/api/complaints/:id/upvote` | Upvote a complaint |

## Cost Estimate

Using serverless/consumption tiers, this setup is very low-cost:
- **Static Web Apps**: Free tier available
- **Cosmos DB Serverless**: Pay per request (~$0.25 per 1M reads)
- **Blob Storage**: ~$0.02/GB/month
- **Azure Maps**: 1,000 free transactions/day on Gen2
