# Day 41: Hello World App on AKS with User-Assigned Managed Identity (GUI Edition)
## Complete GUI Guide: Azure Portal + Azure DevOps Portal

> **⚠️ GUI-FOCUSED GUIDE:** This version uses Azure Portal (portal.azure.com) and Azure DevOps Portal (dev.azure.com) interfaces instead of CLI commands. All steps include screenshots references, button locations, and visual workflows.

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [Part A — Create the Hello World Application](#part-a--create-the-hello-world-application)
4. [Part B — Azure Infrastructure Setup (GUI)](#part-b--azure-infrastructure-setup-gui)
5. [Part C — User-Assigned Managed Identity (Deep Dive)](#part-c--user-assigned-managed-identity-deep-dive)
6. [Part D — Azure Container Registry (ACR) via GUI](#part-d--azure-container-registry-acr-via-gui)
7. [Part E — Azure Kubernetes Service (AKS) via GUI](#part-e--azure-kubernetes-service-aks-via-gui)
8. [Part F — Azure DevOps — Repo & Pipeline](#part-f--azure-devops--repo--pipeline)
9. [Part F2 — Azure DevOps Agent Setup (Self-Hosted Runner)](#part-f2--azure-devops-agent-setup-self-hosted-runner)
10. [Part G — Azure Artifacts (Package Feed) — Deep Dive](#part-g--azure-artifacts-package-feed--deep-dive)
11. [Part H — End-to-End Deployment Walkthrough](#part-h--end-to-end-deployment-walkthrough)
12. [Part I — Verification & Troubleshooting](#part-i--verification--troubleshooting)
13. [Summary & Key Takeaways](#summary--key-takeaways)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Azure DevOps                                 │
│  ┌──────────────┐    ┌──────────────────────────────────────────┐   │
│  │  Azure Repos  │───▶│  Azure Pipelines (CI/CD)                │   │
│  │  (Git Source) │    │  ┌────────┐   ┌────────┐   ┌─────────┐ │   │
│  └──────────────┘    │  │ Build  │──▶│Push to │──▶│Deploy  │ │   │
│                       │  │ Image  │   │  ACR   │   │to AKS  │ │   │
│  ┌──────────────┐    │  └────────┘   └────────┘   └─────────┘ │   │
│  │Azure Artifacts│    └──────────────────────────────────────────┘   │
│  │ (npm feed)    │                                                   │
│  └──────────────┘                                                   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Self-Hosted Agent Pool                                     │   │
│  │  ┌─────────────┐    ┌─────────────┐                        │   │
│  │  │   Agent 1   │    │   Agent 2   │                        │   │
│  │  │ (VM/Linux)  │    │ (VM/Linux)  │                        │   │
│  │  └─────────────┘    └─────────────┘                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Azure Cloud                                 │
│                                                                     │
│  ┌──────────────────┐     ┌──────────────────────────────────────┐  │
│  │  ACR              │     │  AKS Cluster                        │  │
│  │  (Container       │────▶│  ┌──────────┐  ┌──────────────────┐│  │
│  │   Registry)       │     │  │ Pod:      │  │ User-Assigned    ││  │
│  └──────────────────┘     │  │ hello-app │  │ Managed Identity ││  │
│                            │  └──────────┘  └──────────────────┘│  │
│  ┌──────────────────┐     └──────────────────────────────────────┘  │
│  │ User-Assigned     │                                              │
│  │ Managed Identity  │──── AcrPull role on ACR                      │
│  └──────────────────┘                                              │
└─────────────────────────────────────────────────────────────────────┘
```

### What We Will Build

| Component | Detail |
|---|---|
| App | Node.js "Hello World" Express app |
| Container Registry | Azure Container Registry (ACR) |
| Orchestrator | Azure Kubernetes Service (AKS) |
| Identity | User-Assigned Managed Identity (NOT system-assigned) |
| Source Control | Azure Repos (Git) |
| CI/CD | Azure Pipelines (YAML) |
| Package Management | Azure Artifacts (npm feed) |
| Build Agent | Self-Hosted Agent (Linux VM) |

---

## 2. Prerequisites

- Azure Subscription with Owner/Contributor access
- Azure Portal access (portal.azure.com)
- Docker Desktop installed
- Node.js 18+ and npm
- Azure DevOps Organization & Project created (dev.azure.com)
- Git installed
- Web browser (Chrome, Edge, Firefox)

> **Note:** This guide uses GUI (Azure Portal & Azure DevOps Portal) instead of CLI commands.

---

## Part A — Create the Hello World Application

### Step 1: Initialize the Node.js Project

```bash
mkdir hello-world-aks
cd hello-world-aks
npm init -y
```

This creates `package.json`:

```json
{
  "name": "hello-world-aks",
  "version": "1.0.0",
  "description": "Hello World app for AKS deployment",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "test": "echo \"No tests yet\" && exit 0"
  },
  "author": "",
  "license": "ISC"
}
```

### Step 2: Install Express

```bash
npm install express
```

### Step 3: Create `server.js`

```javascript
// server.js
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.json({
    message: "Hello World from AKS!",
    version: "1.0.0",
    hostname: require("os").hostname(),
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

app.listen(PORT, () => {
  console.log(`Hello World app running on port ${PORT}`);
});
```

### Step 4: Create `Dockerfile`

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files first (layer caching)
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy application code
COPY server.js .

# Expose port
EXPOSE 3000

# Run as non-root user (security best practice)
USER node

CMD ["node", "server.js"]
```

### Step 5: Create `.dockerignore`

```
node_modules
npm-debug.log
.git
.gitignore
README.md
```

### Step 6: Test Locally

```bash
# Build image
docker build -t hello-world-aks:local .

# Run container
docker run -p 3000:3000 hello-world-aks:local

# Test in another terminal
curl http://localhost:3000
# Output: {"message":"Hello World from AKS!","version":"1.0.0","hostname":"abc123","timestamp":"..."}

curl http://localhost:3000/health
# Output: {"status":"healthy"}
```

---

## Part B — Azure Infrastructure Setup (GUI)

### Step 1: Create Resource Group via Azure Portal

1. Go to [Azure Portal](https://portal.azure.com)
2. Click **Create a resource** (top-left)
3. Search for **Resource group** and select it
4. Click **Create**
5. Configure:
   - **Subscription**: Select your Azure subscription
   - **Resource group name**: `rg-hello-aks-dev`
   - **Region**: `East US`
6. Click **Review + create**
7. Click **Create**

### Step 2: Note Your Configuration

Write down these values (you'll need them throughout the guide):

| Resource | Name |
|---|---|
| Resource Group | `rg-hello-aks-dev` |
| Location/Region | `East US` |
| ACR Name | `acrhelloaksdev` (must be globally unique) |
| AKS Cluster | `aks-hello-dev` |
| Managed Identity | `id-aks-hello-dev` |
| Azure DevOps Project | `hello-world-aks` |

---

## Part C — User-Assigned Managed Identity (Deep Dive)

### What is Managed Identity?

Managed Identity is an Azure feature that provides an automatically managed identity in Azure AD for applications to use when connecting to resources. It eliminates the need to store credentials (passwords, connection strings, keys) in code or config.

### Two Types of Managed Identity

| Feature | System-Assigned | User-Assigned |
|---|---|---|
| Creation | Created as part of a resource (e.g., AKS, VM) | Created as a standalone Azure resource |
| Lifecycle | Tied to the parent resource — deleted when resource is deleted | Independent — survives resource deletion |
| Sharing | Cannot be shared across resources | Can be shared across multiple resources |
| Use Case | Single resource, simple scenarios | Multiple resources, reusable identity |

### Why User-Assigned (Not System-Assigned)?

1. **Reusable** — Same identity can be used by AKS, pipelines, and other services
2. **Pre-provisioned** — Create identity and assign roles BEFORE creating AKS
3. **Survives recreation** — If you delete and recreate AKS, the identity and its role assignments remain
4. **Better for CI/CD** — Pipeline can reference a known identity

### Step 1: Create User-Assigned Managed Identity via Azure Portal

1. Go to **Azure Portal** → Search for **Managed Identities** in the search bar
2. Click **Create**
3. Configure:
   - **Subscription**: Select your subscription
   - **Resource group**: `rg-hello-aks-dev` (select existing)
   - **Region**: `East US`
   - **Name**: `id-aks-hello-dev`
   - **Tags**: (optional) Add tags like `Environment=Dev`, `Project=HelloWorld`
4. Click **Review + create** → **Create**

### Step 2: Capture Identity IDs from Portal

After creation, click on the identity `id-aks-hello-dev`:

1. **Overview** page shows:
   - **Client ID**: `aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee` (copy this)
   - **Principal ID**: `ffffffff-1111-2222-3333-444444444444` (copy this)
   - **Resource ID**: `/subscriptions/xxxx/resourcegroups/rg-hello-aks-dev/providers/Microsoft.ManagedIdentity/userAssignedIdentities/id-aks-hello-dev` (copy this)

2. Write down these values:

| Identity Property | Value (example) | Where to find in Portal |
|---|---|---|
| Client ID | `aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee` | Overview → Client ID |
| Principal ID (Object ID) | `ffffffff-1111-2222-3333-444444444444` | Overview → Principal ID |
| Resource ID | `/subscriptions/.../id-aks-hello-dev` | Properties → Resource ID |

> **Important:** The Principal ID is what you'll use for role assignments. The Client ID is what AKS will use internally.

### How It Works — Visual Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    Azure AD (Entra ID)                        │
│                                                              │
│   User-Assigned Managed Identity: id-aks-hello-dev           │
│   ├── Client ID:    aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee    │
│   ├── Principal ID: ffffffff-1111-2222-3333-444444444444     │
│   └── Roles:                                                 │
│       └── AcrPull on acrhelloaksdev                          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
          │                              │
          ▼                              ▼
┌──────────────────┐          ┌──────────────────┐
│  AKS Cluster     │          │  ACR              │
│  (uses identity  │──────────│  (identity has    │
│   as kubelet     │  pulls   │   AcrPull role)   │
│   identity)      │  images  │                   │
└──────────────────┘          └──────────────────┘

No passwords. No secrets. No connection strings.
Azure handles token exchange automatically.
```

---

## Part D — Azure Container Registry (ACR) via GUI

### Step 1: Create ACR via Azure Portal

1. Go to **Azure Portal** → Search for **Container registries**
2. Click **Create**
3. Configure:
   - **Subscription**: Select your subscription
   - **Resource group**: `rg-hello-aks-dev` (select existing)
   - **Registry name**: `acrhelloaksdev` (must be globally unique, lowercase, no hyphens)
   - **Location**: `East US`
   - **SKU**: **Basic** (cheapest tier for dev)
   - **Admin user**: **Disabled** (we'll use managed identity, not admin credentials)
4. Click **Review + create** → **Create**

### Step 2: Get ACR Details from Portal

After creation, click on `acrhelloaksdev`:

1. **Overview** page shows:
   - **Login server**: `acrhelloaksdev.azurecr.io` (copy this)
   - **Subscription ID**: (note this)
   - **Resource ID**: `/subscriptions/xxxx/resourceGroups/rg-hello-aks-dev/providers/Microsoft.ContainerRegistry/registries/acrhelloaksdev` (copy this)

### Step 3: Assign AcrPull Role to Managed Identity via Portal

This is the key step — it allows the managed identity to pull images from ACR without any password.

1. Go to your ACR → **Access control (IAM)** in left menu
2. Click **+ Add** → **Add role assignment**
3. Configure:
   - **Role**: **AcrPull** (search for it)
   - **Assign access to**: **User, group, or service principal**
   - **Select**: Search for `id-aks-hello-dev` (your managed identity)
4. Click **Review + assign** → **Assign**

> **What is AcrPull?** It is a built-in Azure role that grants read-only access to pull container images from ACR. It does NOT allow pushing images.

### Step 4: Verify Role Assignment

1. Go to ACR → **Access control (IAM)** → **Role assignments**
2. Filter by **Role**: `AcrPull`
3. You should see `id-aks-hello-dev` listed

### Step 5: Test — Push an Image to ACR (Manual via Docker CLI)

```bash
# Login to ACR (still need CLI for this)
az acr login --name acrhelloaksdev

# Tag the local image for ACR
docker tag hello-world-aks:local acrhelloaksdev.azurecr.io/hello-world-aks:v1

# Push to ACR
docker push acrhelloaksdev.azurecr.io/hello-world-aks:v1
```

### Step 6: Verify Image in Portal

1. Go to ACR → **Repositories** in left menu
2. You should see `hello-world-aks` repository
3. Click on it → You should see tag `v1`

---

## Part E — Azure Kubernetes Service (AKS) via GUI

### Step 1: Create AKS Cluster via Azure Portal

1. Go to **Azure Portal** → Search for **Kubernetes services**
2. Click **Create** → **Create a Kubernetes cluster**
3. **Basics** tab:
   - **Subscription**: Your subscription
   - **Resource group**: `rg-hello-aks-dev` (select existing)
   - **Kubernetes cluster name**: `aks-hello-dev`
   - **Region**: `East US`
   - **Availability zones**: None (for dev)
   - **AKS pricing tier**: **Free** (for dev/testing)

4. **Node pools** tab:
   - **Node pool name**: `nodepool1`
   - **Node count**: `1`
   - **Node size**: **Standard_B2s** (cheapest for dev)
   - **Scale mode**: **Manual**

5. **Authentication** tab (CRITICAL STEP):
   - **Authentication method**: **Managed identity**
   - **Managed identity**: **Use existing**
   - **User-assigned managed identity**: Click **Select managed identity** → Choose `id-aks-hello-dev`
   - **Kubelet identity**: Click **Select managed identity** → Choose `id-aks-hello-dev` (SAME identity!)

6. **Networking** tab:
   - **Network configuration**: **Azure CNI**
   - **Network policy**: **None**

7. **Integrations** tab:
   - **Container registry**: **Attach a registry**
   - **Registry**: Select `acrhelloaksdev`
   - This automatically grants AcrPull role (we already did it, but this ensures it)

8. Click **Review + create** → **Create** (takes 5-10 minutes)

> **Important:** Setting both **Managed identity** AND **Kubelet identity** to the same user-assigned identity means both the control plane and the kubelet use our pre-created identity — no system-assigned identity is created.

### Step 2: Wait for Cluster to Be Ready

1. Go to **Kubernetes services** → `aks-hello-dev`
2. Watch the **Notifications** bell icon (top-right) for progress
3. When status shows **Provisioning succeeded**, continue

### Step 3: Get Credentials (kubeconfig) via Portal

1. Go to AKS cluster → **Overview**
2. Click **Connect** button (top)
3. You'll see commands to:
   - **Option 1**: Run in Azure Cloud Shell (opens browser-based terminal)
   - **Option 2**: Run locally (requires Azure CLI installed)

4. For GUI approach, use **Azure Cloud Shell**:
   - Click the Cloud Shell icon `>_` in top toolbar
   - Select **Bash** environment
   - Run the provided `az aks get-credentials` command
   - Then run `kubectl get nodes` to verify connection

### Step 4: Verify Identity Assignment in Portal

1. Go to AKS cluster → **Properties**
2. Check:
   - **Identity type**: Should show **User assigned**
   - **User assigned identities**: Should list `id-aks-hello-dev`
   - **Kubelet identity**: Should show same identity

3. Alternative: Go to AKS → **Access control (IAM)** → **Role assignments**
   - Filter by scope: `This resource`
   - You should see `id-aks-hello-dev` with role `Managed Identity Operator`

### Step 5: Create Kubernetes Manifests

#### `k8s/deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hello-world-aks
  labels:
    app: hello-world-aks
spec:
  replicas: 2
  selector:
    matchLabels:
      app: hello-world-aks
  template:
    metadata:
      labels:
        app: hello-world-aks
    spec:
      containers:
        - name: hello-world-aks
          image: acrhelloaksdev.azurecr.io/hello-world-aks:v1   # Will be replaced by pipeline
          ports:
            - containerPort: 3000
          resources:
            requests:
              cpu: "100m"
              memory: "128Mi"
            limits:
              cpu: "250m"
              memory: "256Mi"
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 15
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
```

#### `k8s/service.yaml`

```yaml
apiVersion: v1
kind: Service
metadata:
  name: hello-world-aks-svc
spec:
  type: LoadBalancer
  selector:
    app: hello-world-aks
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
```

### Step 6: Deploy Manually (Test via Azure Cloud Shell)

1. Open **Azure Cloud Shell** (`>_` icon in portal)
2. Upload your `k8s` folder files:
   - Click **Upload/download files** (top toolbar)
   - Upload `deployment.yaml` and `service.yaml`
3. Run commands:

```bash
# Apply manifests
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml

# Check pods
kubectl get pods -l app=hello-world-aks
# NAME                               READY   STATUS    RESTARTS   AGE
# hello-world-aks-6b8f9c7d4f-abc12   1/1     Running   0          30s
# hello-world-aks-6b8f9c7d4f-def34   1/1     Running   0          30s

# Get external IP
kubectl get svc hello-world-aks-svc
# NAME                  TYPE           CLUSTER-IP    EXTERNAL-IP     PORT(S)
# hello-world-aks-svc   LoadBalancer   10.0.45.123   20.85.xxx.xxx   80:31234/TCP
```

4. Test the app:
   - Copy the **EXTERNAL-IP** from above
   - Open browser to `http://20.85.xxx.xxx`
   - Should see: `{"message":"Hello World from AKS!","version":"1.0.0",...}`

5. **Alternative GUI method**: Use **Azure Portal Workloads view**:
   - Go to AKS cluster → **Workloads** (left menu)
   - Click **+ Create** → **Create from YAML**
   - Paste your YAML files
   - Click **Create**

---

## Part F — Azure DevOps — Repo & Pipeline

### Step 1: Create Azure DevOps Project

1. Go to [https://dev.azure.com](https://dev.azure.com)
2. Click **New Project**
3. Name: `hello-world-aks`
4. Visibility: Private
5. Click **Create**

### Step 2: Push Code to Azure Repos via GUI

**Method 1: Using Azure DevOps Portal**

1. Go to your Azure DevOps project → **Repos**
2. Click **Initialize** (if empty repo) or **Clone** button
3. You'll see Git commands to clone
4. On your local machine:

```bash
# Clone the empty repo
git clone https://dev.azure.com/{your-org}/hello-world-aks/_git/hello-world-aks

# Copy your code into the cloned folder
cp -r ../hello-world-aks/* hello-world-aks/

# Commit and push
cd hello-world-aks
git add .
git commit -m "Initial commit - Hello World AKS app"
git push origin main
```

**Method 2: Using Import Repository (GUI)**

1. In Azure DevOps → **Repos** → **Files**
2. Click **Import** button
3. Select **Git** as source type
4. Enter your local Git repository URL (if you have one)
5. Click **Import**

**Method 3: Using VS Code with Azure Repos Extension**
1. Install "Azure Repos" extension in VS Code
2. Sign in to Azure DevOps
3. Clone repository directly from VS Code

### Your Repo Structure Should Look Like:

```
hello-world-aks/
├── k8s/
│   ├── deployment.yaml
│   └── service.yaml
├── .dockerignore
├── Dockerfile
├── package.json
├── package-lock.json
├── server.js
└── azure-pipelines.yml        ← We will create this next
```

### Step 3: Create Service Connection (Azure DevOps → Azure) via GUI

This allows Azure Pipelines to interact with your Azure subscription.

1. In Azure DevOps → **Project Settings** (bottom-left gear icon)
2. **Service connections** → **New service connection**
3. Select **Azure Resource Manager**
4. Select **Service principal (automatic)** (recommended)
5. Configure:
   - **Subscription**: Select your Azure subscription from dropdown
   - **Resource Group**: `rg-hello-aks-dev` (optional, can leave blank)
   - **Service connection name**: `azure-sub-connection`
   - **Description**: "Connection to Azure for AKS/ACR"
   - ✅ **Grant access permission to all pipelines** (IMPORTANT: check this)
6. Click **Save**

**Visual Guide:**
```
Azure DevOps Project Settings
    ↓
Service connections
    ↓
+ New service connection
    ↓
Azure Resource Manager
    ↓
Service principal (automatic)
    ↓
Fill form → Save
```

### Step 4: Create the CI/CD Pipeline (`azure-pipelines.yml`)

```yaml
# azure-pipelines.yml
trigger:
  branches:
    include:
      - main

variables:
  acrName: "acrhelloaksdev"
  acrLoginServer: "acrhelloaksdev.azurecr.io"
  imageName: "hello-world-aks"
  resourceGroup: "rg-hello-aks-dev"
  aksCluster: "aks-hello-dev"
  azureSubscription: "azure-sub-connection"   # Service connection name
  tag: "$(Build.BuildId)"

stages:
  # ═══════════════════════════════════════════
  # STAGE 1: BUILD & PUSH TO ACR
  # ═══════════════════════════════════════════
  - stage: Build
    displayName: "Build & Push Image"
    jobs:
      - job: BuildAndPush
        displayName: "Build Docker Image & Push to ACR"
        pool:
          vmImage: "ubuntu-latest"
        steps:
          # Step 1: Login to ACR
          - task: AzureCLI@2
            displayName: "Login to ACR"
            inputs:
              azureSubscription: $(azureSubscription)
              scriptType: bash
              scriptLocation: inlineScript
              inlineScript: |
                az acr login --name $(acrName)

          # Step 2: Build Docker Image
          - task: Docker@2
            displayName: "Build Docker Image"
            inputs:
              containerRegistry: $(acrName)
              repository: $(imageName)
              command: build
              Dockerfile: "**/Dockerfile"
              tags: |
                $(tag)
                latest

          # Step 3: Push Docker Image to ACR
          - task: Docker@2
            displayName: "Push Image to ACR"
            inputs:
              containerRegistry: $(acrName)
              repository: $(imageName)
              command: push
              tags: |
                $(tag)
                latest

  # ═══════════════════════════════════════════
  # STAGE 2: DEPLOY TO AKS
  # ═══════════════════════════════════════════
  - stage: Deploy
    displayName: "Deploy to AKS"
    dependsOn: Build
    jobs:
      - job: DeployToAKS
        displayName: "Deploy to AKS Cluster"
        pool:
          vmImage: "ubuntu-latest"
        steps:
          # Step 1: Replace image tag in deployment manifest
          - task: Bash@3
            displayName: "Update Image Tag in Manifest"
            inputs:
              targetType: inline
              script: |
                echo "Updating image tag to $(tag)..."
                sed -i 's|acrhelloaksdev.azurecr.io/hello-world-aks:.*|acrhelloaksdev.azurecr.io/hello-world-aks:$(tag)|g' k8s/deployment.yaml
                echo "Updated deployment.yaml:"
                cat k8s/deployment.yaml

          # Step 2: Deploy to AKS
          - task: AzureCLI@2
            displayName: "Deploy to AKS"
            inputs:
              azureSubscription: $(azureSubscription)
              scriptType: bash
              scriptLocation: inlineScript
              inlineScript: |
                # Get AKS credentials
                az aks get-credentials \
                  --resource-group $(resourceGroup) \
                  --name $(aksCluster) \
                  --overwrite-existing

                # Apply Kubernetes manifests
                kubectl apply -f k8s/deployment.yaml
                kubectl apply -f k8s/service.yaml

                # Wait for rollout
                kubectl rollout status deployment/hello-world-aks --timeout=120s

                # Show status
                echo "=== Pods ==="
                kubectl get pods -l app=hello-world-aks
                echo "=== Service ==="
                kubectl get svc hello-world-aks-svc
```

### Step 4b: Create Docker Service Connection for ACR via GUI

Before the pipeline can push to ACR, you need a Docker Registry service connection:

1. **Project Settings** → **Service connections** → **New service connection**
2. Select **Docker Registry**
3. Select **Azure Container Registry**
4. Configure:
   - **Subscription**: Your Azure subscription (dropdown)
   - **Azure Container Registry**: `acrhelloaksdev` (dropdown - will list your ACRs)
   - **Service connection name**: `acrhelloaksdev` (MUST match `containerRegistry` in pipeline YAML)
   - **Description**: "Connection to ACR for pushing Docker images"
   - ✅ **Grant access permission to all pipelines**
5. Click **Save**

**Note:** The service connection name `acrhelloaksdev` must exactly match what's in your `azure-pipelines.yml`:
```yaml
containerRegistry: $(acrName)  # This variable should be "acrhelloaksdev"
```

### Step 5: Create Pipeline in Azure DevOps via GUI

1. Go to **Pipelines** → **New pipeline**
2. Select **Azure Repos Git** (your code is in Azure Repos)
3. Select your repository: `hello-world-aks`
4. Select **Existing Azure Pipelines YAML file**
5. Path: `/azure-pipelines.yml` (browse or type)
6. Click **Run**

**Visual Pipeline Creation Flow:**
```
Pipelines → New pipeline
    ↓
Azure Repos Git
    ↓
Select repository: hello-world-aks
    ↓
Configure your pipeline
    ↓
Existing Azure Pipelines YAML file
    ↓
Path: /azure-pipelines.yml
    ↓
Run (triggers first build)
```

**Alternative: Classic Editor (GUI-based pipeline builder)**
1. **Pipelines** → **New pipeline**
2. Select **Use the classic editor** (bottom)
3. Select source: **Azure Repos Git**
4. Choose YAML file path
5. Configure stages/tasks visually
6. Save and queue

### Pipeline Execution Flow (with Self-Hosted Agent)

```
┌─────────────────────────────────────────────────────────────┐
│                    Pipeline Trigger                          │
│                  (push to main branch)                       │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Self-Hosted Agent: vm-ado-agent-01                         │
│  (Linux VM in Azure)                                        │
│                                                             │
│  STAGE 1: Build & Push                                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 1. Login to ACR                                     │    │
│  │ 2. docker build -t acrhelloaksdev.azurecr.io/       │    │
│  │    hello-world-aks:$(BuildId)                       │    │
│  │ 3. docker push acrhelloaksdev.azurecr.io/           │    │
│  │    hello-world-aks:$(BuildId)                       │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  Same Agent Continues...                                    │
│                                                             │
│  STAGE 2: Deploy to AKS                                     │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 1. Update image tag in deployment.yaml              │    │
│  │ 2. az aks get-credentials                           │    │
│  │ 3. kubectl apply -f k8s/                            │    │
│  │ 4. kubectl rollout status (wait for healthy)        │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

**Key Point:** Both stages run on the same self-hosted agent, maintaining:
- Same environment/tools
- Network connectivity to ACR/AKS
- Cached Docker layers
- Persistent workspace

---

## Part F2 — Azure DevOps Agent Setup (Self-Hosted Runner)

### What is an Azure DevOps Agent?

Azure DevOps Agents (also called "runners" or "build agents") are the machines that execute your pipeline jobs. There are two types:

| Type | Description | Use Case |
|---|---|---|
| **Microsoft-Hosted Agents** | Managed by Microsoft, pre-installed software, ephemeral | General builds, open-source projects |
| **Self-Hosted Agents** | You install and manage on your own infrastructure | Custom software, security requirements, network isolation |

### Why Use Self-Hosted Agents?

1. **Custom Software** - Install specific SDKs, tools, dependencies
2. **Network Access** - Access internal resources (private ACR, on-prem systems)
3. **Security** - Control over environment, no shared infrastructure
4. **Performance** - Dedicated hardware, faster builds
5. **Cost** - Can be cheaper for high-volume builds

### Step 1: Create Agent Pool via Azure DevOps Portal

1. Go to **Project Settings** → **Agent pools**
2. Click **Add pool**
3. Configure:
   - **Pool type**: **Self-hosted**
   - **Name**: `aks-build-agents`
   - **Description**: "Self-hosted agents for AKS builds"
   - **Auto-provision**: Unchecked (we'll add agents manually)
4. Click **Create**

### Step 2: Create Azure VM for Agent (Optional but Recommended)

For AKS builds, you might want a Linux VM. Create via Azure Portal:

1. **Azure Portal** → **Virtual machines** → **Create**
2. Configure:
   - **Subscription**: Your subscription
   - **Resource group**: `rg-hello-aks-dev` (same as AKS)
   - **VM name**: `vm-ado-agent-01`
   - **Region**: `East US`
   - **Image**: **Ubuntu Server 22.04 LTS**
   - **Size**: **Standard_B2s** (2 vCPU, 4 GB RAM)
   - **Authentication**: SSH public key or password
3. Click **Review + create** → **Create**

### Step 3: Install Agent Software on VM

Connect to your VM via SSH:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install prerequisites
sudo apt install -y curl git docker.io

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Download agent
mkdir myagent && cd myagent
wget https://vstsagentpackage.azureedge.net/agent/3.242.2/vsts-agent-linux-x64-3.242.2.tar.gz
tar zxvf vsts-agent-linux-x64-3.242.2.tar.gz
```

### Step 4: Configure Agent via GUI (Interactive Setup)

```bash
# Run configuration
./config.sh
```

Follow the prompts:

1. **Enter server URL**: `https://dev.azure.com/{your-org}`
2. **Authentication method**: **PAT** (Personal Access Token)
3. **Enter PAT**: (create in DevOps → User Settings → PATs)
4. **Enter agent pool**: `aks-build-agents`
5. **Enter agent name**: `vm-ado-agent-01`
6. **Enter work folder**: `_work` (default)
7. **Run as service?**: **Yes** (recommended)

### Step 5: Start Agent as Service

```bash
# Install as service
sudo ./svc.sh install

# Start service
sudo ./svc.sh start

# Check status
sudo ./svc.sh status
```

### Step 6: Verify Agent in Azure DevOps Portal

1. Go to **Project Settings** → **Agent pools**
2. Click `aks-build-agents` pool
3. You should see `vm-ado-agent-01` agent with **Online** status
4. Click agent → See capabilities, recent jobs

### Step 7: Configure Pipeline to Use Self-Hosted Agent

Update your `azure-pipelines.yml`:

```yaml
stages:
  - stage: Build
    displayName: "Build & Push Image to ACR"
    jobs:
      - job: BuildAndPush
        displayName: "Build & Push"
        pool:
          name: 'aks-build-agents'  # ← Use self-hosted pool
          demands:
            - agent.name -equals vm-ado-agent-01  # Optional: specific agent
```

### Step 8: Install Additional Tools on Agent

For AKS deployments, install:

```bash
# Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# kubectl
sudo az aks install-cli

# Docker (already installed)
# Helm (optional)
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

### Step 9: Configure Agent Capabilities (GUI)

Add custom capabilities to help pipeline routing:

1. Go to agent pool → Click agent → **Capabilities** tab
2. Click **Add capability**
3. Add:
   - **Name**: `docker`
   - **Value**: `installed`
4. Add more:
   - `kubectl`, `azure-cli`, `node`, `npm`, etc.

### Step 10: Agent Security Best Practices

1. **Use Managed Identity** for VM → Assign roles (AcrPush, Contributor)
2. **Restrict network** → NSG rules, private endpoints
3. **Regular updates** → Patch OS, tools
4. **Monitor logs** → Agent logs at `~/myagent/_diag`
5. **Scale agents** → Add more VMs to pool for parallel builds

### Agent Pool vs Agent vs Job Relationship

```
┌─────────────────────────────────────────────────────────┐
│                Azure DevOps Organization                  │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                Agent Pool: aks-build-agents         │  │
│  │  ┌─────────────┐    ┌─────────────┐                │  │
│  │  │   Agent 1   │    │   Agent 2   │                │  │
│  │  │ vm-agent-01 │    │ vm-agent-02 │                │  │
│  │  └─────────────┘    └─────────────┘                │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                Pipeline Job                         │  │
│  │  "pool: aks-build-agents" → picks available agent   │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Common Agent Issues & Solutions

| Issue | Solution |
|---|---|
| Agent offline | Check service: `sudo ./svc.sh status` |
| PAT expired | Generate new PAT in DevOps → Update config |
| Disk full | Clean `_work` folder: `rm -rf _work/*` |
| Docker permission denied | `sudo usermod -aG docker $USER` + logout/login |
| Azure CLI not found | Install: `curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash` |
| kubectl not found | `az aks install-cli` |
| Network timeout | Check NSG/firewall rules, proxy settings |

### When to Use Microsoft-Hosted vs Self-Hosted

**Use Microsoft-Hosted when:**
- Simple builds
- No special software requirements
- Public repositories
- Limited budget for infrastructure
- Quick prototyping

**Use Self-Hosted when:**
- Building Docker images for private ACR
- Deploying to private AKS
- Need specific SDK versions
- Security/compliance requirements
- High-volume builds
- Access to internal resources

---

## Part G — Azure Artifacts (Package Feed) — Deep Dive

### What is Azure Artifacts?

Azure Artifacts is a package management service in Azure DevOps. It lets you create, host, and share packages (npm, NuGet, Maven, Python, Universal) with your team.

### What is a "Package" vs an "Artifact"?

| Term | Meaning | Example |
|---|---|---|
| **Package** | A reusable unit of code distributed via a package manager | `express@4.18.2` (npm), `Newtonsoft.Json` (NuGet) |
| **Artifact** | Any output produced by a build pipeline | Docker image, ZIP file, compiled binary, test results |
| **Azure Artifacts** | Azure DevOps service for hosting **packages** (npm, NuGet, etc.) | Your private npm feed |
| **Pipeline Artifact** | A file/folder published during a pipeline run for use in later stages | `$(Build.ArtifactStagingDirectory)` |

### Why Use Azure Artifacts?

```
┌──────────────────────────────────────────────────────────────────┐
│                     Without Azure Artifacts                       │
│                                                                  │
│  Team A builds a shared utility library                          │
│  ├── Copies files manually to Team B                             │
│  ├── Team B copies to Team C                                     │
│  ├── Version confusion everywhere                                │
│  └── No audit trail, no access control                           │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                     With Azure Artifacts                          │
│                                                                  │
│  Team A publishes @myorg/shared-utils@1.2.3 to feed              │
│  ├── Team B: npm install @myorg/shared-utils@1.2.3               │
│  ├── Team C: npm install @myorg/shared-utils@1.2.3               │
│  ├── Versioned, immutable, audited                               │
│  └── Access controlled via Azure DevOps permissions              │
└──────────────────────────────────────────────────────────────────┘
```

### Upstream Sources

Azure Artifacts can proxy public registries (npmjs.com, nuget.org). When you request a package:

```
Your Pipeline ──▶ Azure Artifacts Feed ──▶ npmjs.com (upstream)
                        │
                        ├── If package exists in feed → serve from feed (cached)
                        └── If not → fetch from npmjs.com → cache in feed → serve
```

This gives you:
- **Caching** — faster builds, no dependency on external registry uptime
- **Security** — audit what packages your team uses
- **Availability** — if npmjs.com goes down, cached packages still work

---

### Step-by-Step: Create and Use Azure Artifacts npm Feed via GUI

#### Step 1: Create a Feed via Azure DevOps Portal

1. In Azure DevOps → **Artifacts** (left sidebar)
2. Click **Create Feed** button
3. Configure:
   - **Name**: `hello-world-npm-feed`
   - **Visibility**: **People in your organization** (or **Project** for project-only)
   - ✅ **Include packages from common public sources** (IMPORTANT: enables upstream from npmjs.com)
   - **Description**: "Private npm feed for Hello World AKS project"
4. Click **Create**

#### Step 2: Connect to Feed via GUI

After creating the feed:

1. Click on your feed `hello-world-npm-feed`
2. Click **Connect to feed** button
3. Select **npm** from the package manager list
4. You'll see a GUI with:
   - **.npmrc file content** (copy this)
   - **Project setup instructions**
   - **Authentication options**

#### Step 3: Set Up .npmrc via GUI Instructions

Copy the provided `.npmrc` content:

```
registry=https://pkgs.dev.azure.com/{your-org}/hello-world-aks/_packaging/hello-world-npm-feed/npm/registry/
always-auth=true
```

Create `.npmrc` in your project root with this content.

#### Step 4: Authenticate via GUI Methods

**Method 1: Personal Access Token (PAT) via Portal**
1. Azure DevOps → User Settings (top-right) → **Personal Access Tokens**
2. Click **New Token**
3. Configure:
   - **Name**: `npm-auth-token`
   - **Organization**: Your org
   - **Scopes**: **Packaging (Read & Write)**
   - **Expiration**: 90 days (recommended)
4. Click **Create** → **Copy token** (SAVE THIS - won't show again)

**Method 2: vsts-npm-auth tool (CLI)**
```bash
# Install credential provider
npx vsts-npm-auth -config .npmrc
# Follow prompts to sign in
```

**Method 3: Manual .npmrc with PAT**
Add to your `.npmrc`:
```
//pkgs.dev.azure.com/{org}/_packaging/hello-world-npm-feed/npm/registry/:username={org}
//pkgs.dev.azure.com/{org}/_packaging/hello-world-npm-feed/npm/registry/:_password={BASE64_ENCODED_PAT}
//pkgs.dev.azure.com/{org}/_packaging/hello-world-npm-feed/npm/registry/:email=you@example.com
```

#### Step 4: Create a Shared Package (Example)

Let's say your team has a shared logging utility:

```bash
mkdir shared-logger
cd shared-logger
npm init --scope=@myorg -y
```

`shared-logger/index.js`:
```javascript
// A simple shared logging utility
module.exports = {
  info: (msg) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`),
  error: (msg) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`),
};
```

`shared-logger/package.json`:
```json
{
  "name": "@myorg/shared-logger",
  "version": "1.0.0",
  "description": "Shared logging utility for all team projects",
  "main": "index.js"
}
```

#### Step 5: Publish to Azure Artifacts Feed via GUI

**Method 1: Using npm CLI (with authenticated .npmrc)**
```bash
# Make sure .npmrc points to your feed
npm publish

# Output:
# npm notice === Tarball Details ===
# npm notice name:          @myorg/shared-logger
# npm notice version:       1.0.0
# npm notice package size:  512 B
# npm notice total files:   2
# + @myorg/shared-logger@1.0.0
```

**Method 2: Using Azure DevOps Portal**
1. Go to **Artifacts** → `hello-world-npm-feed`
2. Click **Publish** button
3. Select **npm** as package type
4. Upload your package files or use CLI method above

**Method 3: Using VS Code Azure Artifacts Extension**
1. Install "Azure Artifacts" extension in VS Code
2. Sign in to Azure DevOps
3. Right-click package.json → **Publish to Azure Artifacts**
4. Select your feed

#### Step 6: Consume the Package in Hello World App

```bash
cd ../hello-world-aks

# Install from your private feed
npm install @myorg/shared-logger
```

Update `server.js` to use it:

```javascript
const express = require("express");
const logger = require("@myorg/shared-logger");
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  logger.info("Received request on /");
  res.json({
    message: "Hello World from AKS!",
    version: "1.0.0",
    hostname: require("os").hostname(),
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

app.listen(PORT, () => {
  logger.info(`Hello World app running on port ${PORT}`);
});
```

#### Step 7: Use Azure Artifacts in Pipeline via GUI Task

Add the npmAuthenticate task to your pipeline YAML:

```yaml
# Add this step BEFORE the Docker build in Stage 1
- task: npmAuthenticate@0
  displayName: "Authenticate npm with Azure Artifacts"
  inputs:
    workingFile: ".npmrc"
```

**GUI Alternative: Add Task via Classic Editor**
1. Edit pipeline → **Tasks** tab
2. Click **+** to add task
3. Search for **npm authenticate**
4. Add task to your build stage
5. Configure:
   - **Working .npmrc file**: `.npmrc`
   - **Custom registry**: (auto-detected from .npmrc)

This ensures `npm ci` inside the Dockerfile can pull packages from your private feed.

> **Note:** For Docker builds, you'll need to pass the `.npmrc` into the build context. Update the Dockerfile:

```dockerfile
# Updated Dockerfile with Azure Artifacts support
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY .npmrc ./

RUN npm ci --only=production

# Remove .npmrc after install (don't ship credentials in image)
RUN rm -f .npmrc

COPY server.js .

EXPOSE 3000
USER node
CMD ["node", "server.js"]
```

---

### Azure Artifacts vs Pipeline Artifacts — Comparison

```
┌────────────────────────────────────────────────────────────────────┐
│                    Azure Artifacts (Package Feed)                   │
│                                                                    │
│  Purpose: Host reusable PACKAGES for teams                         │
│  Types:   npm, NuGet, Maven, Python, Universal                     │
│  Scope:   Organization-wide or project-scoped                      │
│  Example: npm install @myorg/shared-logger                         │
│  Lifecycle: Permanent until deleted, versioned                     │
│                                                                    │
│  Use when: You have shared libraries, utilities, or components     │
│            that multiple projects/teams consume                     │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│                    Pipeline Artifacts                               │
│                                                                    │
│  Purpose: Pass BUILD OUTPUTS between pipeline stages/jobs          │
│  Types:   Any file or folder                                       │
│  Scope:   Within a single pipeline run                             │
│  Example: Publish compiled binary from Build stage,                │
│           download in Deploy stage                                 │
│  Lifecycle: Tied to pipeline run, retention policies apply         │
│                                                                    │
│  Use when: You need to pass files between stages in the same       │
│            pipeline (e.g., build output → deploy stage)            │
└────────────────────────────────────────────────────────────────────┘
```

### Pipeline Artifact Example via GUI Tasks

**Adding Publish Pipeline Artifact Task (GUI Method):**
1. Edit pipeline → **Tasks** tab
2. Select **Build** stage
3. Click **+** to add task
4. Search for **Publish Pipeline Artifact**
5. Configure:
   - **Path to publish**: `$(System.DefaultWorkingDirectory)/k8s`
   - **Artifact name**: `k8s-manifests`
   - **Artifact publish location**: **Azure Pipelines**

**Adding Download Pipeline Artifact Task (GUI Method):**
1. Select **Deploy** stage
2. Add task **Download Pipeline Artifact**
3. Configure:
   - **Artifact name**: `k8s-manifests`
   - **Download path**: `$(Pipeline.Workspace)/k8s`

**YAML Equivalent:**
```yaml
# In Build stage — publish artifact
- task: PublishPipelineArtifact@1
  displayName: "Publish K8s Manifests"
  inputs:
    targetPath: "$(System.DefaultWorkingDirectory)/k8s"
    artifact: "k8s-manifests"

# In Deploy stage — download artifact
- task: DownloadPipelineArtifact@2
  displayName: "Download K8s Manifests"
  inputs:
    artifact: "k8s-manifests"
    targetPath: "$(Pipeline.Workspace)/k8s"
```

---

## Part H — End-to-End Deployment Walkthrough

### Complete Pipeline (`azure-pipelines.yml` — Final Version)

```yaml
# azure-pipelines.yml — FINAL VERSION
trigger:
  branches:
    include:
      - main

variables:
  acrName: "acrhelloaksdev"
  acrLoginServer: "acrhelloaksdev.azurecr.io"
  imageName: "hello-world-aks"
  resourceGroup: "rg-hello-aks-dev"
  aksCluster: "aks-hello-dev"
  azureSubscription: "azure-sub-connection"
  tag: "$(Build.BuildId)"

stages:
  # ═══════════════════════════════════════════
  # STAGE 1: BUILD & PUSH
  # ═══════════════════════════════════════════
  - stage: Build
    displayName: "Build & Push Image to ACR"
    jobs:
      - job: BuildAndPush
        displayName: "Build & Push"
        pool:
          vmImage: "ubuntu-latest"
        steps:
          - task: npmAuthenticate@0
            displayName: "Authenticate npm (Azure Artifacts)"
            inputs:
              workingFile: ".npmrc"

          - task: Docker@2
            displayName: "Build & Push Docker Image"
            inputs:
              containerRegistry: $(acrName)
              repository: $(imageName)
              command: buildAndPush
              Dockerfile: "**/Dockerfile"
              tags: |
                $(tag)
                latest

          - task: PublishPipelineArtifact@1
            displayName: "Publish K8s Manifests as Artifact"
            inputs:
              targetPath: "$(System.DefaultWorkingDirectory)/k8s"
              artifact: "k8s-manifests"

  # ═══════════════════════════════════════════
  # STAGE 2: DEPLOY TO AKS
  # ═══════════════════════════════════════════
  - stage: Deploy
    displayName: "Deploy to AKS"
    dependsOn: Build
    jobs:
      - job: DeployToAKS
        displayName: "Deploy"
        pool:
          vmImage: "ubuntu-latest"
        steps:
          - task: DownloadPipelineArtifact@2
            displayName: "Download K8s Manifests"
            inputs:
              artifact: "k8s-manifests"
              targetPath: "$(Pipeline.Workspace)/k8s"

          - task: Bash@3
            displayName: "Update Image Tag"
            inputs:
              targetType: inline
              script: |
                sed -i 's|acrhelloaksdev.azurecr.io/hello-world-aks:.*|acrhelloaksdev.azurecr.io/hello-world-aks:$(tag)|g' \
                  $(Pipeline.Workspace)/k8s/deployment.yaml
                cat $(Pipeline.Workspace)/k8s/deployment.yaml

          - task: AzureCLI@2
            displayName: "Deploy to AKS"
            inputs:
              azureSubscription: $(azureSubscription)
              scriptType: bash
              scriptLocation: inlineScript
              inlineScript: |
                az aks get-credentials \
                  --resource-group $(resourceGroup) \
                  --name $(aksCluster) \
                  --overwrite-existing

                kubectl apply -f $(Pipeline.Workspace)/k8s/deployment.yaml
                kubectl apply -f $(Pipeline.Workspace)/k8s/service.yaml

                echo "Waiting for rollout..."
                kubectl rollout status deployment/hello-world-aks --timeout=180s

                echo ""
                echo "════════════════════════════════════════"
                echo "  DEPLOYMENT SUCCESSFUL"
                echo "════════════════════════════════════════"
                echo ""
                kubectl get pods -l app=hello-world-aks -o wide
                echo ""
                kubectl get svc hello-world-aks-svc
```

### Trigger the Pipeline via GUI

**Method 1: Push Code (Automatic Trigger)**
```bash
# Make a change and push
echo "# Updated" >> README.md
git add .
git commit -m "Trigger pipeline - deploy v2"
git push origin main
```

**Method 2: Manual Run via Azure DevOps Portal**
1. Go to **Pipelines** → Your pipeline `hello-world-aks`
2. Click **Run pipeline** button
3. Select branch: `main`
4. Click **Run**

**Method 3: Scheduled Trigger (GUI Configuration)**
1. Edit pipeline → **Triggers** tab
2. Enable **Scheduled** trigger
3. Add schedule: Daily at 8 AM
4. Save

**Pipeline will automatically:**
1. Build Docker image with tag = BuildId
2. Push to ACR
3. Publish K8s manifests as pipeline artifact
4. Download manifests in deploy stage
5. Update image tag in deployment.yaml
6. Deploy to AKS
7. Wait for healthy rollout

---

## Part I — Verification & Troubleshooting

### Verify Everything Works via GUI

**1. Check ACR has the image (Azure Portal)**
- Go to ACR `acrhelloaksdev` → **Repositories**
- Click `hello-world-aks` repository
- Should see tags: `latest` and build number (e.g., `42`)

**2. Check AKS pods are running (Azure Portal)**
- Go to AKS `aks-hello-dev` → **Workloads**
- Click **Deployments** → `hello-world-aks`
- Should show 2 pods, both **Ready**
- Click **Pods** tab to see individual pods

**3. Check service has external IP (Azure Portal)**
- Go to AKS → **Services and ingresses**
- Click `hello-world-aks-svc`
- **External IP** should show an IP address (not `<pending>`)

**4. Test the app (Browser)**
- Copy **External IP** from above
- Open browser to `http://EXTERNAL_IP`
- Should see: `{"message":"Hello World from AKS!","version":"1.0.0",...}`

**5. Check identity is correct (Azure Portal)**
- Go to AKS → **Properties**
- **Identity type**: Should show **User assigned**
- **User assigned identities**: Should list `id-aks-hello-dev`

**6. Check Azure Artifacts feed (Azure DevOps Portal)**
- Go to **Artifacts** → `hello-world-npm-feed`
- Should see `@myorg/shared-logger@1.0.0` package

**7. Check Pipeline Run (Azure DevOps Portal)**
- Go to **Pipelines** → Recent runs
- Click on latest run → Should show **Succeeded** for both stages

### Common Issues & Fixes (GUI Solutions)

| Issue | Cause | GUI Fix |
|---|---|---|
| `ImagePullBackOff` | AKS can't pull from ACR | **Portal**: ACR → IAM → Verify `id-aks-hello-dev` has `AcrPull` role |
| `ErrImagePull` | Wrong image name/tag | **Portal**: AKS → Workloads → Pods → Click pod → Check **Events** tab |
| `EXTERNAL-IP: <pending>` | LoadBalancer not provisioning | **Portal**: AKS → Services → Click service → Wait 2-3 min or check **Events** |
| Pipeline fails at Docker push | Missing Docker service connection | **DevOps**: Project Settings → Service connections → Create Docker Registry connection |
| `npm ERR! 401 Unauthorized` | Azure Artifacts auth failed | **DevOps**: User Settings → PATs → Create new token with Packaging scope |
| Identity shows `SystemAssigned` | Wrong identity configuration | **Portal**: Recreate AKS with **User assigned** identity selected |
| Pipeline fails at AKS deploy | Missing Azure service connection | **DevOps**: Project Settings → Service connections → Create Azure Resource Manager connection |
| Docker build fails | Missing .npmrc in Docker context | **Pipeline**: Add `COPY .npmrc .` before `RUN npm ci` in Dockerfile |
| No packages in Artifacts feed | Not authenticated | **DevOps**: Artifacts → Feed → Connect to feed → Follow npm setup |
| **Agent offline** | Agent service stopped | **VM**: SSH → `sudo ./svc.sh status` → `sudo ./svc.sh start` |
| **No agent available** | Pool has no online agents | **DevOps**: Agent pools → Check agent status → Ensure online |
| **Agent disk full** | _work folder filled | **VM**: Clean `_work` folder: `rm -rf _work/*` |
| **Docker permission denied** | User not in docker group | **VM**: `sudo usermod -aG docker $USER` + logout/login |
| **Azure CLI not found** | Not installed on agent | **VM**: `curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash` |
| **kubectl not found** | Not installed on agent | **VM**: `az aks install-cli` |

**GUI Troubleshooting Tips:**
1. **Azure Portal Activity Log**: Check for errors in resource creation
2. **AKS Insights**: Go to AKS → **Insights** for health metrics
3. **Pipeline Logs**: Click on failed task → **View logs** for detailed error
4. **Service Connection Test**: DevOps → Service connections → Click connection → **Test** button
5. **Agent Status**: DevOps → Agent pools → Click pool → See agent status/capabilities
6. **VM Diagnostics**: Portal → VM → Diagnostics → Check CPU/memory/disk

### Useful kubectl Commands (via Azure Cloud Shell)

**Using Azure Cloud Shell for kubectl:**
1. Open **Azure Cloud Shell** (`>_` icon in portal)
2. Run kubectl commands:

```bash
# View pod logs
kubectl logs -l app=hello-world-aks --tail=50

# Describe pod (see events, image pull status)
kubectl describe pod -l app=hello-world-aks

# Scale up/down
kubectl scale deployment hello-world-aks --replicas=3

# View rollout history
kubectl rollout history deployment/hello-world-aks

# Rollback to previous version
kubectl rollout undo deployment/hello-world-aks
```

**GUI Alternatives in Azure Portal:**

| kubectl Command | Portal Equivalent |
|---|---|
| `kubectl get pods` | AKS → Workloads → Pods |
| `kubectl logs` | AKS → Workloads → Pods → Click pod → **Logs** tab |
| `kubectl describe` | AKS → Workloads → Pods → Click pod → **Events** tab |
| `kubectl scale` | AKS → Workloads → Deployments → Click deployment → **Scale** button |
| `kubectl rollout history` | AKS → Workloads → Deployments → Click deployment → **Revision history** |
| `kubectl get svc` | AKS → Services and ingresses |

**Azure Monitor for Containers (Advanced GUI):**
- Go to AKS → **Insights**
- View pod metrics, logs, health
- Set up alerts
- Performance monitoring

---

## Summary & Key Takeaways

```
┌─────────────────────────────────────────────────────────────────┐
│                    What We Built Today                           │
│                                                                 │
│  ✔ Node.js Hello World app with health checks                  │
│  ✔ Dockerized with security best practices                     │
│  ✔ User-Assigned Managed Identity (no secrets anywhere)        │
│  ✔ ACR for private container image storage                     │
│  ✔ AKS cluster using the managed identity for image pulls      │
│  ✔ Azure DevOps Repo for source control                        │
│  ✔ Azure Pipelines for automated CI/CD                         │
│  ✔ Azure Artifacts for private npm package hosting              │
│  ✔ Pipeline Artifacts for passing files between stages          │
└─────────────────────────────────────────────────────────────────┘
```

| Concept | Key Point |
|---|---|
| User-Assigned Managed Identity | Created independently, reusable, survives resource deletion |
| AcrPull Role | Grants image pull access — no passwords needed |
| `--assign-kubelet-identity` | The flag that makes AKS nodes use YOUR identity for ACR pulls |
| Azure Artifacts | Private package feeds (npm, NuGet, etc.) for team sharing |
| Pipeline Artifacts | Temporary files passed between pipeline stages |
| Upstream Sources | Azure Artifacts proxies npmjs.com for caching & security |

---

## GUI vs CLI: Key Benefits

| Aspect | GUI (Portal) | CLI (Command Line) |
|---|---|---|
| **Learning Curve** | Easier for beginners | Steeper learning curve |
| **Visual Feedback** | Real-time progress bars, status indicators | Text output only |
| **Error Discovery** | Visual error messages, activity logs | Parse error messages |
| **Resource Browsing** | Click-through navigation | Need to know exact resource names |
| **Role Assignment** | Visual IAM interface | Command syntax required |
| **Pipeline Creation** | Drag-and-drop editor | YAML file editing |
| **Debugging** | Integrated logs, events view | Manual log inspection |

## When to Use GUI vs CLI

**Use GUI when:**
- Learning Azure/AKS concepts
- Setting up initial infrastructure
- Debugging permission/role issues
- Creating one-off resources
- Visualizing resource relationships

**Use CLI when:**
- Automating deployments (CI/CD)
- Scripting repetitive tasks
- Working in headless environments
- Need precise control over parameters
- Infrastructure as Code (IaC)

---

> **Next:** Day 42 — Add Helm charts, Ingress Controller, and multi-environment (dev/staging/prod) deployment with approval gates.
