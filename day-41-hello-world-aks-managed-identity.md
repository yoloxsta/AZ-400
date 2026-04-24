# Day 41: Hello World App on AKS with User-Assigned Managed Identity, Azure DevOps CI/CD, ACR & Azure Artifacts

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [Part A — Create the Hello World Application](#part-a--create-the-hello-world-application)
4. [Part B — Azure Infrastructure Setup](#part-b--azure-infrastructure-setup)
5. [Part C — User-Assigned Managed Identity (Deep Dive)](#part-c--user-assigned-managed-identity-deep-dive)
6. [Part D — Azure Container Registry (ACR)](#part-d--azure-container-registry-acr)
7. [Part E — Azure Kubernetes Service (AKS)](#part-e--azure-kubernetes-service-aks)
8. [Part F — Azure DevOps — Repo & Pipeline](#part-f--azure-devops--repo--pipeline)
9. [Part G — Azure Artifacts (Package Feed) — Deep Dive](#part-g--azure-artifacts-package-feed--deep-dive)
10. [Part H — End-to-End Deployment Walkthrough](#part-h--end-to-end-deployment-walkthrough)
11. [Part I — Verification & Troubleshooting](#part-i--verification--troubleshooting)
12. [Summary & Key Takeaways](#summary--key-takeaways)

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

---

## 2. Prerequisites

- Azure Subscription with Owner/Contributor access
- Azure CLI installed (`az --version` ≥ 2.50)
- Docker Desktop installed
- kubectl installed (`az aks install-cli`)
- Node.js 18+ and npm
- Azure DevOps Organization & Project created
- Git installed

```bash
# Verify tools
az --version
docker --version
kubectl version --client
node --version
npm --version
git --version
```

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

## Part B — Azure Infrastructure Setup

### Step 1: Set Variables

```bash
# ─── Configuration Variables ───
RESOURCE_GROUP="rg-hello-aks-dev"
LOCATION="eastus"
ACR_NAME="acrhelloaksdev"          # Must be globally unique, lowercase, no hyphens
AKS_CLUSTER="aks-hello-dev"
IDENTITY_NAME="id-aks-hello-dev"   # User-Assigned Managed Identity name
SUBSCRIPTION_ID=$(az account show --query id -o tsv)

echo "Resource Group : $RESOURCE_GROUP"
echo "Location       : $LOCATION"
echo "ACR Name       : $ACR_NAME"
echo "AKS Cluster    : $AKS_CLUSTER"
echo "Identity Name  : $IDENTITY_NAME"
echo "Subscription   : $SUBSCRIPTION_ID"
```

### Step 2: Create Resource Group

```bash
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION

# Output:
# {
#   "id": "/subscriptions/xxxx/resourceGroups/rg-hello-aks-dev",
#   "location": "eastus",
#   "name": "rg-hello-aks-dev",
#   "properties": { "provisioningState": "Succeeded" }
# }
```

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

### Step 1: Create User-Assigned Managed Identity

```bash
az identity create \
  --name $IDENTITY_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION

# Output:
# {
#   "clientId": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
#   "id": "/subscriptions/xxxx/resourcegroups/rg-hello-aks-dev/providers/Microsoft.ManagedIdentity/userAssignedIdentities/id-aks-hello-dev",
#   "location": "eastus",
#   "name": "id-aks-hello-dev",
#   "principalId": "ffffffff-1111-2222-3333-444444444444",
#   "type": "Microsoft.ManagedIdentity/userAssignedIdentities"
# }
```

### Step 2: Capture Identity IDs

```bash
# Get the full resource ID of the identity
IDENTITY_ID=$(az identity show \
  --name $IDENTITY_NAME \
  --resource-group $RESOURCE_GROUP \
  --query id -o tsv)

# Get the Principal ID (Object ID in Azure AD)
IDENTITY_PRINCIPAL_ID=$(az identity show \
  --name $IDENTITY_NAME \
  --resource-group $RESOURCE_GROUP \
  --query principalId -o tsv)

# Get the Client ID
IDENTITY_CLIENT_ID=$(az identity show \
  --name $IDENTITY_NAME \
  --resource-group $RESOURCE_GROUP \
  --query clientId -o tsv)

echo "Identity Resource ID : $IDENTITY_ID"
echo "Identity Principal ID: $IDENTITY_PRINCIPAL_ID"
echo "Identity Client ID   : $IDENTITY_CLIENT_ID"
```

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

## Part D — Azure Container Registry (ACR)

### Step 1: Create ACR

```bash
az acr create \
  --name $ACR_NAME \
  --resource-group $RESOURCE_GROUP \
  --sku Basic \
  --location $LOCATION

# Output:
# {
#   "adminUserEnabled": false,
#   "loginServer": "acrhelloaksdev.azurecr.io",
#   "name": "acrhelloaksdev",
#   "provisioningState": "Succeeded",
#   "sku": { "name": "Basic", "tier": "Basic" }
# }
```

### Step 2: Get ACR Resource ID

```bash
ACR_ID=$(az acr show \
  --name $ACR_NAME \
  --resource-group $RESOURCE_GROUP \
  --query id -o tsv)

echo "ACR Resource ID: $ACR_ID"
```

### Step 3: Assign AcrPull Role to Managed Identity

This is the key step — it allows the managed identity to pull images from ACR without any password.

```bash
az role assignment create \
  --assignee $IDENTITY_PRINCIPAL_ID \
  --role "AcrPull" \
  --scope $ACR_ID

# Output:
# {
#   "principalId": "ffffffff-1111-2222-3333-444444444444",
#   "roleDefinitionName": "AcrPull",
#   "scope": "/subscriptions/xxxx/resourceGroups/rg-hello-aks-dev/providers/Microsoft.ContainerRegistry/registries/acrhelloaksdev"
# }
```

> **What is AcrPull?** It is a built-in Azure role that grants read-only access to pull container images from ACR. It does NOT allow pushing images.

### Step 4: Test — Push an Image to ACR (Manual)

```bash
# Login to ACR
az acr login --name $ACR_NAME

# Tag the local image for ACR
docker tag hello-world-aks:local $ACR_NAME.azurecr.io/hello-world-aks:v1

# Push to ACR
docker push $ACR_NAME.azurecr.io/hello-world-aks:v1

# Verify
az acr repository list --name $ACR_NAME --output table
# Result:
# hello-world-aks

az acr repository show-tags --name $ACR_NAME --repository hello-world-aks --output table
# Result:
# v1
```

---

## Part E — Azure Kubernetes Service (AKS)

### Step 1: Create AKS Cluster with User-Assigned Managed Identity

```bash
az aks create \
  --name $AKS_CLUSTER \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --node-count 1 \
  --node-vm-size Standard_B2s \
  --generate-ssh-keys \
  --assign-identity $IDENTITY_ID \
  --assign-kubelet-identity $IDENTITY_ID \
  --attach-acr $ACR_NAME \
  --network-plugin azure \
  --enable-managed-identity \
  --no-wait

# Key flags explained:
# --assign-identity         : Control plane uses this User-Assigned Managed Identity
# --assign-kubelet-identity : Kubelet (node agent) uses this same identity to pull images
# --attach-acr              : Automatically assigns AcrPull role (we already did it, but this ensures it)
# --enable-managed-identity : Enables managed identity mode (NOT service principal)
# --no-wait                 : Don't wait for cluster creation (takes ~5-10 min)
```

> **Important:** We pass `--assign-identity` AND `--assign-kubelet-identity` with the same user-assigned identity. This means both the control plane and the kubelet use our pre-created identity — no system-assigned identity is created.

### Step 2: Wait for Cluster to Be Ready

```bash
# Check status
az aks show \
  --name $AKS_CLUSTER \
  --resource-group $RESOURCE_GROUP \
  --query "provisioningState" -o tsv

# Wait until output is: Succeeded
```

### Step 3: Get Credentials (kubeconfig)

```bash
az aks get-credentials \
  --name $AKS_CLUSTER \
  --resource-group $RESOURCE_GROUP \
  --overwrite-existing

# Verify connection
kubectl get nodes
# NAME                                STATUS   ROLES    AGE   VERSION
# aks-nodepool1-12345678-vmss000000   Ready    <none>   5m    v1.28.x
```

### Step 4: Verify Identity Assignment

```bash
# Confirm the cluster is using User-Assigned (not System-Assigned)
az aks show \
  --name $AKS_CLUSTER \
  --resource-group $RESOURCE_GROUP \
  --query "identity" -o json

# Expected output:
# {
#   "type": "UserAssigned",
#   "userAssignedIdentities": {
#     "/subscriptions/xxxx/.../id-aks-hello-dev": {
#       "clientId": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
#       "principalId": "ffffffff-1111-2222-3333-444444444444"
#     }
#   }
# }

# Confirm kubelet identity
az aks show \
  --name $AKS_CLUSTER \
  --resource-group $RESOURCE_GROUP \
  --query "identityProfile.kubeletidentity" -o json

# Expected: shows the same user-assigned identity client ID
```

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

### Step 6: Deploy Manually (Test)

```bash
# Apply manifests
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

# Check pods
kubectl get pods -l app=hello-world-aks
# NAME                               READY   STATUS    RESTARTS   AGE
# hello-world-aks-6b8f9c7d4f-abc12   1/1     Running   0          30s
# hello-world-aks-6b8f9c7d4f-def34   1/1     Running   0          30s

# Get external IP
kubectl get svc hello-world-aks-svc
# NAME                  TYPE           CLUSTER-IP    EXTERNAL-IP     PORT(S)
# hello-world-aks-svc   LoadBalancer   10.0.45.123   20.85.xxx.xxx   80:31234/TCP

# Test
curl http://20.85.xxx.xxx
# {"message":"Hello World from AKS!","version":"1.0.0","hostname":"hello-world-aks-6b8f9c7d4f-abc12",...}
```

---

## Part F — Azure DevOps — Repo & Pipeline

### Step 1: Create Azure DevOps Project

1. Go to [https://dev.azure.com](https://dev.azure.com)
2. Click **New Project**
3. Name: `hello-world-aks`
4. Visibility: Private
5. Click **Create**

### Step 2: Push Code to Azure Repos

```bash
# Inside your hello-world-aks folder
git init
git add .
git commit -m "Initial commit - Hello World AKS app"

# Add Azure Repos as remote
# Replace {org} with your Azure DevOps org name
git remote add origin https://dev.azure.com/{org}/hello-world-aks/_git/hello-world-aks

git push -u origin main
```

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

### Step 3: Create Service Connection (Azure DevOps → Azure)

This allows Azure Pipelines to interact with your Azure subscription.

1. In Azure DevOps → **Project Settings** (bottom-left gear icon)
2. **Service connections** → **New service connection**
3. Select **Azure Resource Manager**
4. Select **Service principal (automatic)**
5. Configure:
   - Subscription: Select your Azure subscription
   - Resource Group: `rg-hello-aks-dev`
   - Service connection name: `azure-sub-connection`
   - Check: **Grant access permission to all pipelines**
6. Click **Save**

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

### Step 4b: Create Docker Service Connection for ACR

Before the pipeline can push to ACR, you need a Docker Registry service connection:

1. **Project Settings** → **Service connections** → **New service connection**
2. Select **Docker Registry**
3. Select **Azure Container Registry**
4. Configure:
   - Subscription: Your Azure subscription
   - Azure Container Registry: `acrhelloaksdev`
   - Service connection name: `acrhelloaksdev` (must match `containerRegistry` in pipeline)
5. Click **Save**

### Step 5: Create Pipeline in Azure DevOps

1. Go to **Pipelines** → **New Pipeline**
2. Select **Azure Repos Git**
3. Select your repo: `hello-world-aks`
4. Select **Existing Azure Pipelines YAML file**
5. Path: `/azure-pipelines.yml`
6. Click **Run**

### Pipeline Execution Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Pipeline Trigger                          │
│                  (push to main branch)                       │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
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
│  STAGE 2: Deploy to AKS                                     │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 1. Update image tag in deployment.yaml              │    │
│  │ 2. az aks get-credentials                           │    │
│  │ 3. kubectl apply -f k8s/                            │    │
│  │ 4. kubectl rollout status (wait for healthy)        │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

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

### Step-by-Step: Create and Use Azure Artifacts npm Feed

#### Step 1: Create a Feed

1. In Azure DevOps → **Artifacts** (left sidebar)
2. Click **Create Feed**
3. Configure:
   - Name: `hello-world-npm-feed`
   - Visibility: **People in your organization**
   - Check: **Include packages from common public sources** (enables upstream from npmjs.com)
4. Click **Create**

#### Step 2: Connect to Feed (Local Development)

After creating the feed, click **Connect to Feed** → **npm**. You'll see instructions:

```bash
# Create .npmrc in your project root
# Replace {org} with your Azure DevOps org name

echo "registry=https://pkgs.dev.azure.com/{org}/hello-world-aks/_packaging/hello-world-npm-feed/npm/registry/
always-auth=true" > .npmrc
```

#### Step 3: Authenticate

```bash
# Install the Azure Artifacts credential provider
npx vsts-npm-auth -config .npmrc

# Or use a Personal Access Token (PAT):
# 1. Azure DevOps → User Settings (top-right) → Personal Access Tokens
# 2. Create token with "Packaging (Read & Write)" scope
# 3. Add to .npmrc:
#    //pkgs.dev.azure.com/{org}/_packaging/hello-world-npm-feed/npm/registry/:username={org}
#    //pkgs.dev.azure.com/{org}/_packaging/hello-world-npm-feed/npm/registry/:_password={BASE64_PAT}
#    //pkgs.dev.azure.com/{org}/_packaging/hello-world-npm-feed/npm/registry/:email=you@example.com
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

#### Step 5: Publish to Azure Artifacts Feed

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

#### Step 7: Use Azure Artifacts in Pipeline

Update `azure-pipelines.yml` to authenticate with the feed during build:

```yaml
# Add this step BEFORE the Docker build in Stage 1
- task: npmAuthenticate@0
  displayName: "Authenticate npm with Azure Artifacts"
  inputs:
    workingFile: ".npmrc"
```

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

### Pipeline Artifact Example

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

### Trigger the Pipeline

```bash
# Make a change and push
echo "# Updated" >> README.md
git add .
git commit -m "Trigger pipeline - deploy v2"
git push origin main

# Pipeline will automatically:
# 1. Build Docker image with tag = BuildId
# 2. Push to ACR
# 3. Publish K8s manifests as pipeline artifact
# 4. Download manifests in deploy stage
# 5. Update image tag in deployment.yaml
# 6. Deploy to AKS
# 7. Wait for healthy rollout
```

---

## Part I — Verification & Troubleshooting

### Verify Everything Works

```bash
# 1. Check ACR has the image
az acr repository show-tags --name acrhelloaksdev --repository hello-world-aks -o table

# 2. Check AKS pods are running
kubectl get pods -l app=hello-world-aks
# Both pods should be Running, 1/1 Ready

# 3. Check service has external IP
kubectl get svc hello-world-aks-svc
# EXTERNAL-IP should be assigned (not <pending>)

# 4. Test the app
EXTERNAL_IP=$(kubectl get svc hello-world-aks-svc -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
curl http://$EXTERNAL_IP
# {"message":"Hello World from AKS!","version":"1.0.0",...}

# 5. Check identity is correct (no system-assigned)
az aks show -n aks-hello-dev -g rg-hello-aks-dev --query "identity.type" -o tsv
# Output: UserAssigned

# 6. Check Azure Artifacts feed
# Go to Azure DevOps → Artifacts → hello-world-npm-feed
# You should see @myorg/shared-logger@1.0.0
```

### Common Issues & Fixes

| Issue | Cause | Fix |
|---|---|---|
| `ImagePullBackOff` | AKS can't pull from ACR | Verify AcrPull role: `az role assignment list --assignee $IDENTITY_PRINCIPAL_ID --scope $ACR_ID` |
| `ErrImagePull` | Wrong image name/tag | Check: `kubectl describe pod <pod-name>` and verify image path |
| `EXTERNAL-IP: <pending>` | LoadBalancer not provisioned yet | Wait 2-3 minutes, or check: `kubectl describe svc hello-world-aks-svc` |
| Pipeline fails at Docker push | Missing Docker service connection | Create Docker Registry service connection named `acrhelloaksdev` |
| `npm ERR! 401 Unauthorized` | Azure Artifacts auth failed | Re-run `npx vsts-npm-auth -config .npmrc` or check PAT expiry |
| Identity type shows `SystemAssigned` | Didn't pass `--assign-identity` flag | Recreate cluster with `--assign-identity` and `--assign-kubelet-identity` |

### Useful kubectl Commands

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

> **Next:** Day 42 — Add Helm charts, Ingress Controller, and multi-environment (dev/staging/prod) deployment with approval gates.
