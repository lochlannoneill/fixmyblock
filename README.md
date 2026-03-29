# FixMyBlock

A community-driven civic engagement app where citizens report and track local infrastructure issues on an interactive 3D map. Upload photos, pin problems, and let your community like, comment, and follow along as issues get resolved.

Built with React 19, MapLibre GL JS, Tailwind CSS, and Azure.

## Features

- **3D interactive map** — Pin issues on a tilted, rotatable map with 3D building extrusions
- **Photo uploads** — Attach up to 5 images per report
- **Categories** — Pothole, streetlight, graffiti, litter, sidewalk, drainage, signage, other
- **Status tracking** — Open → In Progress → Resolved (color-coded markers: red/amber/green)
- **Social interactions** — Like, comment (threaded), and save posts
- **User profiles** — View your contributions, stats, and saved posts
- **Multiple map layers** — Terrain, satellite, topo, transport, minimal, Azure Maps
- **Dark mode** — System preference detection with manual toggle
- **Social auth** — Sign in with Google, Microsoft, Apple, or Facebook
- **Mobile-responsive** — Draggable sidebar with touch gestures
- **Geolocation** — Pin your exact location or tap the map
- **Reverse geocoding** — Automatic address lookup via Nominatim (OpenStreetMap)

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                Azure Static Web Apps                  │
│                                                       │
│  ┌───────────────┐       ┌─────────────────────────┐ │
│  │ React + Vite  │──────▶│  Azure Functions API     │ │
│  │ (MapLibre 3D) │◀──────│  (Node.js 20 + TS)      │ │
│  └───────────────┘       └───┬──────┬──────┬───────┘ │
│                              │      │      │          │
│                   ┌──────────▼┐ ┌───▼────┐ │          │
│                   │ Cosmos DB  │ │  Blob  │ │          │
│                   │  (posts)   │ │Storage │ │          │
│                   └───────────┘ └────────┘ │          │
│                                            │          │
│                              ┌─────────────▼────────┐ │
│                              │ Azure Maps (proxied) │ │
│                              └──────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

## Tech Stack

### Frontend (`client/`)

| Library | Version | Purpose |
|---------|---------|---------|
| React | 19 | UI framework |
| Vite | 8 | Bundler & dev server |
| TypeScript | 5.9 | Type safety |
| MapLibre GL JS | 5 | 3D map rendering |
| React Map GL | 8 | React wrapper for MapLibre |
| Tailwind CSS | 4 | Utility-first styling |
| FontAwesome | 7 | Icons (SVG + React) |

### Backend (`api/`)

| Library | Version | Purpose |
|---------|---------|---------|
| Azure Functions | 4 | Serverless HTTP endpoints |
| @azure/cosmos | 4 | Cosmos DB client |
| @azure/storage-blob | 12 | Blob Storage client |
| TypeScript | 5.7 | Type safety |

### Azure Services

| Service | Purpose |
|---------|---------|
| **Static Web Apps** | Hosts frontend + API, manages OAuth, CI/CD |
| **Cosmos DB** (Serverless) | NoSQL document database for posts |
| **Blob Storage** | Stores uploaded images (public blob access) |
| **Azure Maps** | Map tile provider (proxied through API to protect key) |

## Project Structure

```
fixmyblock/
├── client/                          # React frontend
│   ├── src/
│   │   ├── App.tsx                  # Main layout & state management
│   │   ├── main.tsx                 # React entry point
│   │   ├── index.css                # Global styles & Tailwind
│   │   ├── components/
│   │   │   ├── AuthModal/           # Social login modal (Google, Microsoft, Apple, Facebook)
│   │   │   ├── Header/              # Logo, location search (Nominatim autocomplete), user menu
│   │   │   ├── MapView/             # 3D map with markers, popups, geolocation, 3D buildings
│   │   │   ├── Layers/              # Map layer switcher (6 layers, Azure locked behind sign-in)
│   │   │   ├── RequestForm/         # Multi-step issue creation form with image upload
│   │   │   ├── RequestList/         # Infinite-scrolling issue list (IntersectionObserver)
│   │   │   ├── RequestDetail/       # Full issue view with image carousel & threaded comments
│   │   │   ├── RequestToolbar/      # Search, category/status filters, sort controls
│   │   │   ├── Comments/            # Threaded comment display & input
│   │   │   ├── ProfilePage/         # User stats & tabs (Your Posts / Saved Posts)
│   │   │   ├── SettingsPage/        # Dark mode toggle, GPS accuracy, version info
│   │   │   └── FeedbackPage/        # Submit app feedback (general, bug, feature request)
│   │   ├── hooks/
│   │   │   ├── useAuth.ts           # Auth state (login/logout via Azure SWA /.auth endpoints)
│   │   │   ├── useRequests.ts       # CRUD operations & optimistic state updates
│   │   │   └── useTheme.ts          # Dark/light mode with localStorage persistence
│   │   ├── services/
│   │   │   └── api.ts               # Fetch wrapper (base URL from VITE_API_URL or /api)
│   │   └── types/
│   │       └── request.ts           # TypeScript interfaces (Request, Comment, categories, statuses)
│   ├── .env.example                 # Client env template
│   ├── vite.config.ts               # Vite config with dev proxy & Tailwind plugin
│   └── package.json
│
├── api/                             # Azure Functions backend
│   ├── src/
│   │   ├── functions/
│   │   │   ├── requests.ts          # CRUD endpoints for posts, comments, likes, saves
│   │   │   └── mapTile.ts           # Azure Maps tile proxy (hides API key server-side)
│   │   ├── cosmos.ts                # Cosmos DB read/write operations
│   │   ├── storage.ts               # Blob Storage upload operations
│   │   └── multipart.ts             # Multipart form data parser
│   ├── host.json                    # Azure Functions host config
│   ├── local.settings.json          # Local dev secrets (gitignored)
│   └── package.json
│
├── staticwebapp.config.json         # SWA routing, auth providers, role-based access
├── .github/workflows/
│   └── azure-static-web-apps-*.yml  # CI/CD: build & deploy on push to main / PR
└── README.md
```

## API Endpoints

All routes are prefixed with `/api`. Auth-required routes are enforced via `staticwebapp.config.json` role rules — the `x-ms-client-principal` header is automatically set by Azure SWA for authenticated users.

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/posts` | No | List all posts (newest first) |
| GET | `/api/posts/{id}` | No | Get a single post |
| POST | `/api/posts` | Yes | Create a post (multipart/form-data with up to 5 images) |
| DELETE | `/api/posts/{id}` | Yes | Delete a post |
| POST | `/api/posts/{id}/like` | Yes | Toggle like on a post |
| POST | `/api/posts/{id}/save` | Yes | Toggle save on a post |
| POST | `/api/posts/{id}/comments` | Yes | Add a comment (supports `parentId` for threading) |
| POST | `/api/posts/{id}/comments/{commentId}/like` | Yes | Toggle like on a comment |
| GET | `/api/map/tile` | No | Proxy Azure Maps tiles (`tilesetId`, `z`, `x`, `y` query params) |

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
az group create --name fixmyblock-rg --location northeurope
```

### 3. Create Azure Cosmos DB

```bash
# Create account (serverless to minimise cost)
az cosmosdb create \
  --name fixmyblock-db \
  --resource-group fixmyblock-rg \
  --locations regionName=northeurope \
  --default-consistency-level Session \
  --capabilities EnableServerless

# Create database
az cosmosdb sql database create \
  --account-name fixmyblock-db \
  --resource-group fixmyblock-rg \
  --name fixmyblock

# Create container (partition key = /id)
az cosmosdb sql container create \
  --account-name fixmyblock-db \
  --resource-group fixmyblock-rg \
  --database-name fixmyblock \
  --name complaints \
  --partition-key-path "/id"

# Get connection string
az cosmosdb keys list \
  --name fixmyblock-db \
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
# Create the Static Web App resource
az staticwebapp create \
  --name fixmyblock \
  --resource-group fixmyblock-rg \
  --location westeurope

# Get deployment token (add as AZURE_STATIC_WEB_APPS_API_TOKEN in GitHub repo secrets)
az staticwebapp secrets list \
  --name fixmyblock \
  --resource-group fixmyblock-rg \
  --query "properties.apiKey" -o tsv
```

CI/CD is handled automatically by the GitHub Actions workflow — pushes to `main` and pull requests trigger build & deploy.

### 7. Configure Application Settings

In Azure Portal → Static Web App → Configuration → Application settings:

| Setting | Value |
|---------|-------|
| `COSMOS_CONNECTION_STRING` | *(from step 3)* |
| `COSMOS_DATABASE` | `fixmyblock` |
| `COSMOS_CONTAINER` | `complaints` |
| `STORAGE_CONNECTION_STRING` | *(from step 4)* |
| `STORAGE_CONTAINER` | `images` |
| `AZURE_MAPS_KEY` | *(from step 5)* |

Or via CLI:

```bash
az staticwebapp appsettings set \
  --name fixmyblock \
  --resource-group fixmyblock-rg \
  --setting-names \
    COSMOS_CONNECTION_STRING="<value>" \
    COSMOS_DATABASE="fixmyblock" \
    COSMOS_CONTAINER="complaints" \
    STORAGE_CONNECTION_STRING="<value>" \
    STORAGE_CONTAINER="images" \
    AZURE_MAPS_KEY="<value>"
```

> **Note:** All secrets are server-side only. The Azure Maps key is never exposed to the client — tiles are fetched through the `/api/map/tile` proxy function.

### 8. Configure Auth Providers (Optional)

To enable social login beyond Microsoft, add these application settings for each provider:

| Provider | Settings needed |
|----------|----------------|
| Google | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| Apple | `APPLE_CLIENT_ID`, `APPLE_CLIENT_SECRET` |
| Facebook | `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET` |

Microsoft auth works out of the box with Azure SWA.

## Local Development

### 1. Install dependencies

```bash
cd client && npm install
cd ../api && npm install
```

### 2. Configure local settings

Fill in `api/local.settings.json` with your Azure connection strings and keys:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "COSMOS_CONNECTION_STRING": "<your Cosmos DB connection string>",
    "COSMOS_DATABASE": "fixmyblock",
    "COSMOS_CONTAINER": "complaints",
    "STORAGE_CONNECTION_STRING": "<your Storage connection string>",
    "STORAGE_CONTAINER": "images",
    "AZURE_MAPS_KEY": "<your Azure Maps key>"
  }
}
```

This file is gitignored — secrets never leave your machine.

### 3. Start the API

```bash
cd api
npm run dev
```

Runs on `http://localhost:7071`.

### 4. Start the frontend

```bash
cd client
npm run dev
```

Runs on `http://localhost:5173`. The Vite dev server proxies `/api/*` requests to the local Functions host.

### 5. Full-stack local dev with SWA CLI (optional)

For testing with real Azure SWA auth:

```bash
npm install -g @azure/static-web-apps-cli
swa start client --api-location api
```

Runs on `http://localhost:4280` with the full auth flow.

> **Dev mode auth:** When not running on port 4280, the app uses a mock user via localStorage so you can test authenticated features without setting up OAuth.

## Cost Estimate

Using serverless/consumption tiers:

| Service | Cost |
|---------|------|
| **Static Web Apps** | Free tier available |
| **Cosmos DB Serverless** | ~$0.25 per 1M reads |
| **Blob Storage** | ~$0.02/GB/month |
| **Azure Maps** | 1,000 free transactions/day (Gen2) |
