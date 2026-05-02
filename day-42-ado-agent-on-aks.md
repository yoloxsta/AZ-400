# Day 42: Azure DevOps Agent Setup on AKS
## Complete Guide: Self-Hosted Build Agents Running on Kubernetes

> **🎯 Objective:** Deploy and configure Azure DevOps self-hosted agents on Azure Kubernetes Service (AKS) for scalable, containerized CI/CD pipelines.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [Part A — Create Azure DevOps Agent Pool](#part-a--create-azure-devops-agent-pool)
4. [Part B — Create PAT (Personal Access Token)](#part-b--create-pat-personal-access-token)
5. [Part C — Build Custom Agent Docker Image](#part-c--build-custom-agent-docker-image)
6. [Part D — Deploy Agent to AKS](#part-d--deploy-agent-to-aks)
7. [Part E — Verify Agent Registration](#part-e--verify-agent-registration)
8. [Part F — Test Agent with Pipeline](#part-f--test-agent-with-pipeline)
9. [Part G — Scale Agents Horizontally](#part-g--scale-agents-horizontally)
10. [Part H — Troubleshooting & Diagnostics](#part-h--troubleshooting--diagnostics)
11. [Summary](#summary)

---

## 1. Architecture Overview

### Why Run Azure DevOps Agents on AKS?

| Benefit | Description |
|---|---|
| **Scalability** | Scale agents up/down based on workload demand |
| **Cost Efficiency** | Pay only for running pods; scale to zero when idle |
| **Isolation** | Each job runs in a fresh container |
| **Consistency** | Same environment for all builds |
| **Maintenance** | Easy updates via rolling deployments |

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Azure DevOps Organization                            │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      Agent Pool: k8s-build-agents                    │   │
│  │                                                                      │   │
│  │   Agent registration via PAT token                                   │   │
│  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │   │
│  │   │  ado-agent  │  │  ado-agent  │  │  ado-agent  │                │   │
│  │   │     -0      │  │     -1      │  │     -2      │                │   │
│  │   └─────────────┘  └─────────────┘  └─────────────┘                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    ▲                                        │
│                                    │ WebSocket connection                   │
│                                    │ (job polling)                         │
└────────────────────────────────────┼────────────────────────────────────────┘
                                     │
┌────────────────────────────────────┼────────────────────────────────────────┐
│                         Azure Cloud │                                       │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         AKS Cluster                                  │   │
│  │                                                                      │   │
│  │   ┌──────────────────────────────────────────────────────────────┐  │   │
│  │   │              Namespace: ado-agents                            │  │   │
│  │   │                                                              │  │   │
│  │   │   ┌─────────────────┐  ┌─────────────────┐                  │  │   │
│  │   │   │      Pod        │  │      Pod        │    StatefulSet   │  │   │
│  │   │   │   ado-agent-0   │  │   ado-agent-1   │    (replicas: 3) │  │   │
│  │   │   │                 │  │                 │                  │  │   │
│  │   │   │  ┌───────────┐  │  │  ┌───────────┐  │                  │  │   │
│  │   │   │  │ ADO Agent │  │  │  │ ADO Agent │  │                  │  │   │
│  │   │   │  │ Software  │  │  │  │ Software  │  │                  │  │   │
│  │   │   │  │ - Docker  │  │  │  │ - Docker  │  │                  │  │   │
│  │   │   │  │ - kubectl │  │  │  │ - kubectl │  │                  │  │   │
│  │   │   │  │ - az-cli  │  │  │  │ - az-cli  │  │                  │  │   │
│  │   │   │  │ - Node.js │  │  │  │ - Node.js │  │                  │  │   │
│  │   │   │  └───────────┘  │  │  └───────────┘  │                  │  │   │
│  │   │   └─────────────────┘  └─────────────────┘                  │  │   │
│  │   │                                                              │  │   │
│  │   │   ┌─────────────────────────────────────────────────────┐   │  │   │
│  │   │   │              Secret: ado-pat-secret                 │   │  │   │
│  │   │   │              (PAT token for authentication)         │   │  │   │
│  │   │   └─────────────────────────────────────────────────────┘   │  │   │
│  │   └──────────────────────────────────────────────────────────────┘  │   │
│  │                                                                      │   │
│  │   ┌──────────────────┐     ┌──────────────────────────────────────┐ │   │
│  │   │       ACR        │────▶│         User-Assigned Identity       │ │   │
│  │   │  (Image Store)   │     │         (AcrPull role)               │ │   │
│  │   └──────────────────┘     └──────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```


---

## 2. Prerequisites

### Required Resources

| Resource | Name (example) | Purpose |
|---|---|---|
| Azure Subscription | Your subscription | Hosting AKS, ACR |
| AKS Cluster | `aks-hello-dev` | Running agent pods |
| ACR | `acrhelloaksdev` | Storing agent Docker image |
| Azure DevOps Org | `your-org` | Agent pool & pipelines |
| Azure DevOps Project | `hello-world-aks` | CI/CD pipelines |

### Tools Required

- Azure CLI (`az`)
- kubectl
- Docker
- Git

### Verify Prerequisites

```bash
# Check Azure CLI
az --version

# Check kubectl
kubectl version --client

# Check Docker
docker --version

# Check Git
git --version

# Verify AKS connection
az aks get-credentials \
  --resource-group rg-hello-aks-dev \
  --name aks-hello-dev

kubectl get nodes
```

**Expected Output:**
```
NAME                                STATUS   ROLES   AGE   VERSION
aks-nodepool1-12345678-vmss000000   Ready    agent   10d   v1.28.x
```

---

## Part A — Create Azure DevOps Agent Pool

### Step 1: Navigate to Agent Pools (GUI)

1. Go to **Azure DevOps** (`https://dev.azure.com/{your-org}`)
2. Click **Project Settings** (bottom-left gear icon)
3. Under **Pipelines**, click **Agent pools**
4. Click **Add pool**

### Step 2: Create New Agent Pool

Configure:
- **Pool type**: **Self-hosted**
- **Name**: `k8s-build-agents`
- **Description**: "Self-hosted agents running on AKS for Docker/Kubernetes builds"
- **Auto-provision**: Unchecked (we'll add agents manually via Kubernetes)
- **Grant access to all pipelines**: ✅ Checked

Click **Create**.

### Step 3: Note the Pool Details

After creation, note these values:

| Property | Value |
|---|---|
| Pool Name | `k8s-build-agents` |
| Pool ID | (visible in URL, e.g., `poolId=42`) |

You'll need the pool name for agent configuration.

### Step 4: Verify Pool Creation (GUI)

1. Go to **Project Settings** → **Agent pools**
2. Click on `k8s-build-agents`
3. You should see:
   - **Agents** tab: Empty (no agents yet)
   - **Details** tab: Pool information
   - **Security** tab: Permission settings

---

## Part B — Create PAT (Personal Access Token)

The agent needs a PAT to authenticate with Azure DevOps.

### Step 1: Create PAT (GUI)

1. Click your **profile icon** (top-right)
2. Click **Personal access tokens** (or go to `https://dev.azure.com/{your-org}/_usersSettings/tokens`)
3. Click **New Token**

### Step 2: Configure PAT

Configure:
- **Name**: `ado-agent-pat-k8s`
- **Organization**: All accessible organizations (or specific org)
- **Expiration**: 90 days (or custom, max 1 year for security)
- **Scopes**:
  - ✅ **Agent Pools**: Read & manage
  - ✅ **Build**: Read & execute
  - ✅ **Deployment**: Read & manage
  - ✅ **Environment**: Read & manage
  - ✅ **Release**: Read, write, & execute
  - ✅ **Variable Groups**: Read, create, & manage

Alternatively, select **Custom defined** → **Show all scopes** → Set:
- **Agent Pools**: Read & manage
- **Build**: Read & execute

Click **Create**.

### Step 3: Save the PAT

**⚠️ IMPORTANT:** Copy the PAT immediately! You won't see it again.

```
PAT Example: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Save it securely (e.g., in a password manager or Azure Key Vault).

---

## Part C — Build Custom Agent Docker Image

We'll create a custom Docker image with all tools needed for AKS deployments.

### Step 1: Create Project Directory

```bash
mkdir -p ado-agent-k8s
cd ado-agent-k8s
```

### Step 2: Create Dockerfile

Create `Dockerfile`:

```dockerfile
# Dockerfile for Azure DevOps Agent on AKS
# Based on Ubuntu with full build tools

FROM ubuntu:22.04

# Avoid interactive prompts during build
ENV DEBIAN_FRONTEND=noninteractive

# Set environment variables for the agent
ENV AZP_AGENT_INPUT_URL=""
ENV AZP_AGENT_INPUT_AUTH="pat"
ENV AZP_AGENT_INPUT_TOKEN=""
ENV AZP_AGENT_INPUT_POOL=""
ENV AZP_AGENT_INPUT_AGENT_NAME=""

# Label for tracking
LABEL maintainer="DevOps Team"
LABEL description="Azure DevOps Agent for AKS deployments"
LABEL version="1.0.0"

# Install base dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    jq \
    git \
    git-lfs \
    unzip \
    wget \
    apt-transport-https \
    lsb-release \
    gnupg \
    software-properties-common \
    sudo \
    && rm -rf /var/lib/apt/lists/*

# Install Azure CLI
RUN curl -sL https://aka.ms/InstallAzureCLIDeb | bash

# Install kubectl
RUN az aks install-cli

# Install Docker CLI (for building/pushing images)
RUN curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null \
    && apt-get update \
    && apt-get install -y docker-ce-cli \
    && rm -rf /var/lib/apt/lists/*

# Install Helm (optional, for Helm deployments)
RUN curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 \
    && chmod +x get_helm.sh \
    && ./get_helm.sh \
    && rm get_helm.sh

# Install Node.js 18.x (for Node.js builds)
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Verify installations
RUN az --version && \
    kubectl version --client && \
    docker --version && \
    helm version && \
    node --version && \
    npm --version

# Create agent user (non-root for security)
RUN useradd -m -s /bin/bash azureuser \
    && echo "azureuser ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Create working directory
WORKDIR /home/azureuser/agent

# Download Azure DevOps Agent
RUN curl -sL https://vstsagentpackage.azureedge.net/agent/3.242.0/vsts-agent-linux-x64-3.242.0.tar.gz | tar xz

# Change ownership
RUN chown -R azureuser:azureuser /home/azureuser

# Switch to non-root user
USER azureuser

# Copy entrypoint script
COPY --chown=azureuser:azureuser start.sh .
RUN sudo chmod +x start.sh

# Entry point
ENTRYPOINT ["./start.sh"]
```

### Step 3: Create Entrypoint Script

Create `start.sh`:

```bash
#!/bin/bash
# start.sh - Azure DevOps Agent Startup Script for Kubernetes

set -e

echo "========================================"
echo "  Azure DevOps Agent Startup"
echo "========================================"
echo ""

# Validate required environment variables
if [ -z "$AZP_AGENT_INPUT_URL" ]; then
    echo "ERROR: AZP_AGENT_INPUT_URL is not set"
    exit 1
fi

if [ -z "$AZP_AGENT_INPUT_TOKEN" ]; then
    echo "ERROR: AZP_AGENT_INPUT_TOKEN is not set"
    exit 1
fi

if [ -z "$AZP_AGENT_INPUT_POOL" ]; then
    echo "ERROR: AZP_AGENT_INPUT_POOL is not set"
    exit 1
fi

# Set default agent name if not provided
if [ -z "$AZP_AGENT_INPUT_AGENT_NAME" ]; then
    export AZP_AGENT_INPUT_AGENT_NAME=$(hostname)
fi

echo "Azure DevOps URL: $AZP_AGENT_INPUT_URL"
echo "Agent Pool: $AZP_AGENT_INPUT_POOL"
echo "Agent Name: $AZP_AGENT_INPUT_AGENT_NAME"
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo "========================================"
    echo "  Shutting down agent..."
    echo "========================================"
    
    if [ -e ./config.sh ]; then
        ./config.sh remove --unattended \
            --auth pat \
            --token "$AZP_AGENT_INPUT_TOKEN"
    fi
    
    exit 0
}

# Trap signals for graceful shutdown
trap cleanup SIGTERM SIGINT SIGPIPE

# Configure the agent
echo "Configuring agent..."
./config.sh --unattended \
    --url "$AZP_AGENT_INPUT_URL" \
    --auth pat \
    --token "$AZP_AGENT_INPUT_TOKEN" \
    --pool "$AZP_AGENT_INPUT_POOL" \
    --agent "$AZP_AGENT_INPUT_AGENT_NAME" \
    --acceptTeeEula \
    --work "_work"

echo ""
echo "========================================"
echo "  Agent configured successfully!"
echo "========================================"
echo ""

# Run the agent
echo "Starting agent..."
./run.sh

# Keep the container running
wait
```

### Step 4: Make Script Executable

```bash
chmod +x start.sh
```

### Step 5: Build the Docker Image

```bash
# Set your ACR name
ACR_NAME="acrhelloaksdev"

# Build the image
docker build -t ${ACR_NAME}.azurecr.io/ado-agent-k8s:v1.0 .

# Verify the build
docker images | grep ado-agent-k8s
```

**Expected Output:**
```
acrhelloaksdev.azurecr.io/ado-agent-k8s   v1.0   abc123def456   2 minutes ago   1.2GB
```

### Step 6: Push Image to ACR

```bash
# Login to ACR
az acr login --name $ACR_NAME

# Push the image
docker push ${ACR_NAME}.azurecr.io/ado-agent-k8s:v1.0

# Verify push
az acr repository show \
  --name $ACR_NAME \
  --repository ado-agent-k8s
```

**Expected Output:**
```json
{
  "createdTime": "2024-01-15T10:30:00.0000000Z",
  "imageName": "ado-agent-k8s",
  "manifestCount": 1,
  "registry": "acrhelloaksdev.azurecr.io",
  "tagCount": 1
}
```

---

## Part D — Deploy Agent to AKS

### Step 1: Create Namespace for Agents

```bash
# Create dedicated namespace
kubectl create namespace ado-agents

# Verify namespace
kubectl get namespace ado-agents
```

**Expected Output:**
```
NAME          STATUS   AGE
ado-agents    Active   5s
```

### Step 2: Create Kubernetes Secret for PAT

Store your PAT token securely in a Kubernetes secret:

```bash
# Set your PAT token (replace with your actual PAT)
ADO_PAT="YOUR_PAT_TOKEN_HERE"

# Set your Azure DevOps organization URL
ADO_URL="https://dev.azure.com/your-org"

# Create the secret
kubectl create secret generic ado-agent-secret \
  --from-literal=AZP_URL=$ADO_URL \
  --from-literal=AZP_TOKEN=$ADO_PAT \
  --namespace ado-agents

# Verify secret creation
kubectl get secret ado-agent-secret -n ado-agents
```

**Expected Output:**
```
NAME               TYPE     DATA   AGE
ado-agent-secret   Opaque   2      10s
```

### Step 3: Create StatefulSet Manifest

Create `ado-agent-statefulset.yaml`:

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: ado-agent
  namespace: ado-agents
  labels:
    app: ado-agent
spec:
  serviceName: ado-agent
  replicas: 2
  selector:
    matchLabels:
      app: ado-agent
  template:
    metadata:
      labels:
        app: ado-agent
    spec:
      # Use a service account with necessary permissions
      serviceAccountName: ado-agent-sa
      
      # Security context
      securityContext:
        runAsUser: 1000
        runAsGroup: 1000
        fsGroup: 1000
      
      # Host alias for Docker socket access (optional)
      # hostAliases:
      #   - ip: "127.0.0.1"
      #     hostnames:
      #       - "docker.local"
      
      containers:
        - name: ado-agent
          image: acrhelloaksdev.azurecr.io/ado-agent-k8s:v1.0
          imagePullPolicy: Always
          
          env:
            # Azure DevOps URL
            - name: AZP_AGENT_INPUT_URL
              valueFrom:
                secretKeyRef:
                  name: ado-agent-secret
                  key: AZP_URL
            
            # PAT Token
            - name: AZP_AGENT_INPUT_TOKEN
              valueFrom:
                secretKeyRef:
                  name: ado-agent-secret
                  key: AZP_TOKEN
            
            # Agent Pool Name
            - name: AZP_AGENT_INPUT_POOL
              value: "k8s-build-agents"
            
            # Agent Name (uses pod name)
            - name: AZP_AGENT_INPUT_AGENT_NAME
              valueFrom:
                fieldRef:
                  fieldPath: metadata.name
          
          resources:
            requests:
              cpu: "500m"
              memory: "1Gi"
            limits:
              cpu: "2000m"
              memory: "4Gi"
          
          # Volume mounts
          volumeMounts:
            - name: work
              mountPath: /home/azureuser/agent/_work
            # Mount Docker socket (for Docker-in-Docker or Docker-out-of-Docker)
            # - name: docker-sock
            #   mountPath: /var/run/docker.sock
      
      # Volumes
      volumes:
        - name: work
          emptyDir: {}
        # Docker socket (optional - requires privileged mode)
        # - name: docker-sock
        #   hostPath:
        #     path: /var/run/docker.sock
        #     type: Socket
  
  # Volume claim templates for persistent storage
  volumeClaimTemplates:
    - metadata:
        name: work
      spec:
        accessModes: ["ReadWriteOnce"]
        storageClassName: "default"
        resources:
          requests:
            storage: 10Gi
```

### Step 4: Create Service Account and RBAC

Create `ado-agent-rbac.yaml`:

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: ado-agent-sa
  namespace: ado-agents
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: ado-agent-role
rules:
  # Read/write access to pods, deployments, services
  - apiGroups: [""]
    resources: ["pods", "pods/log", "services", "configmaps", "secrets"]
    verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
  - apiGroups: ["apps"]
    resources: ["deployments", "replicasets", "statefulsets"]
    verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
  - apiGroups: ["extensions", "networking.k8s.io"]
    resources: ["ingresses"]
    verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: ado-agent-binding
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: ado-agent-role
subjects:
  - kind: ServiceAccount
    name: ado-agent-sa
    namespace: ado-agents
```

### Step 5: Deploy to AKS

```bash
# Apply RBAC first
kubectl apply -f ado-agent-rbac.yaml

# Apply StatefulSet
kubectl apply -f ado-agent-statefulset.yaml

# Verify pods are running
kubectl get pods -n ado-agents -w
```

**Expected Output:**
```
NAME           READY   STATUS    RESTARTS   AGE
ado-agent-0    1/1     Running   0          30s
ado-agent-1    1/1     Running   0          25s
```

Press `Ctrl+C` to stop watching.

### Step 6: Check Pod Logs

```bash
# Check logs for the first agent
kubectl logs -f ado-agent-0 -n ado-agents
```

**Expected Output:**
```
========================================
  Azure DevOps Agent Startup
========================================

Azure DevOps URL: https://dev.azure.com/your-org
Agent Pool: k8s-build-agents
Agent Name: ado-agent-0

Configuring agent...
>> Connect:

Connecting to server ...

>> Register Agent:

Scanning for tool capabilities.
Connecting to the server.
Successfully added the agent 'ado-agent-0'.

========================================
  Agent configured successfully!
========================================

Starting agent...
Scanning for tool capabilities.
Connecting to the server.
2024-01-15 10:35:00Z: Listening for Jobs
```


---

## Part E — Verify Agent Registration

### Step 1: Check Agent Status in Azure DevOps (GUI)

1. Go to **Azure DevOps** → **Project Settings** → **Agent pools**
2. Click on `k8s-build-agents`
3. Click **Agents** tab
4. You should see your agents listed with **Online** status

**Example View:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Agent Pool: k8s-build-agents                                               │
│                                                                             │
│  Agents (2)                                                                 │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 🟢 Online   ado-agent-0                                       v1.0  │   │
│  │    Enabled • Linux • X64 • 2 jobs completed                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 🟢 Online   ado-agent-1                                       v1.0  │   │
│  │    Enabled • Linux • X64 • 0 jobs completed                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Step 2: Check Agent Capabilities

1. Click on an agent name (e.g., `ado-agent-0`)
2. Click **Capabilities** tab
3. Verify the following capabilities are present:

| Capability | Expected Value |
|---|---|
| Agent.Name | ado-agent-0 |
| Agent.OS | Linux |
| Agent.OSVersion | 22.04 |
| Agent.Version | 3.242.0 |
| docker | installed |
| kubectl | installed |
| az | installed |
| helm | installed |
| node | installed |
| npm | installed |

### Step 3: Verify Agent is Ready (CLI)

```bash
# Check pod status
kubectl get pods -n ado-agents

# Check pod is ready
kubectl get pods -n ado-agents -o custom-columns=NAME:.metadata.name,STATUS:.status.phase,READY:.status.conditions[?\(@.type==\"Ready\"\)].status
```

**Expected Output:**
```
NAME           STATUS    READY
ado-agent-0    Running   True
ado-agent-1    Running   True
```

### Step 4: Verify Network Connectivity

```bash
# Test if agent can reach Azure DevOps
kubectl exec -it ado-agent-0 -n ado-agents -- curl -I https://dev.azure.com

# Test if agent can reach ACR
kubectl exec -it ado-agent-0 -n ado-agents -- curl -I https://acrhelloaksdev.azurecr.io

# Test Azure CLI
kubectl exec -it ado-agent-0 -n ado-agents -- az version

# Test kubectl
kubectl exec -it ado-agent-0 -n ado-agents -- kubectl version --client
```

---

## Part F — Test Agent with Pipeline

### Step 1: Create Test Pipeline

Create `azure-pipelines-test-agent.yml` in your Azure DevOps repo:

```yaml
# azure-pipelines-test-agent.yml
# Test pipeline for k8s-build-agents pool

trigger:
  branches:
    include:
      - main

pool:
  name: 'k8s-build-agents'  # Use the self-hosted agent pool

steps:
  # Verify agent environment
  - script: |
      echo "========================================"
      echo "  Agent Environment Test"
      echo "========================================"
      echo ""
      echo "Agent Name: $(Agent.Name)"
      echo "Agent OS: $(Agent.OS)"
      echo "Agent Version: $(Agent.Version)"
      echo "Build ID: $(Build.BuildId)"
      echo ""
      echo "========================================"
    displayName: 'Print Agent Info'

  # Test Azure CLI
  - script: |
      echo "Testing Azure CLI..."
      az version --query '"azure-cli"' -o tsv
    displayName: 'Test Azure CLI'

  # Test kubectl
  - script: |
      echo "Testing kubectl..."
      kubectl version --client --short
    displayName: 'Test kubectl'

  # Test Docker
  - script: |
      echo "Testing Docker CLI..."
      docker --version
    displayName: 'Test Docker CLI'

  # Test Node.js
  - script: |
      echo "Testing Node.js..."
      node --version
      npm --version
    displayName: 'Test Node.js'

  # Test Helm
  - script: |
      echo "Testing Helm..."
      helm version --short
    displayName: 'Test Helm'

  # Test Git
  - script: |
      echo "Testing Git..."
      git --version
    displayName: 'Test Git'

  # Success message
  - script: |
      echo ""
      echo "========================================"
      echo "  All tests passed successfully!"
      echo "========================================"
    displayName: 'Success Message'
```

### Step 2: Run the Test Pipeline (GUI)

1. Go to **Pipelines** → **New pipeline**
2. Select **Azure Repos Git**
3. Select your repository
4. Select **Existing Azure Pipelines YAML file**
5. Select `azure-pipelines-test-agent.yml`
6. Click **Run**

### Step 3: Monitor Pipeline Execution

**GUI:**
1. Click on the running pipeline
2. Click on the job to see live logs
3. Verify the agent name matches your K8s agent (e.g., `ado-agent-0`)

**Expected Pipeline Output:**
```
========================================
  Agent Environment Test
========================================

Agent Name: ado-agent-0
Agent OS: Linux
Agent Version: 3.242.0
Build ID: 123

========================================
Testing Azure CLI...
2.50.0
Testing kubectl...
Client Version: v1.28.0
Testing Docker CLI...
Docker version 24.0.7, build afdd53b
Testing Node.js...
v18.19.0
10.2.3
Testing Helm...
v3.13.0+g....
Testing Git...
git version 2.34.1

========================================
  All tests passed successfully!
========================================
```

### Step 4: Check Agent Job History

1. Go to **Project Settings** → **Agent pools** → `k8s-build-agents`
2. Click on `ado-agent-0`
3. Click **Job History** tab
4. You should see the completed job with timestamp

---

## Part G — Scale Agents Horizontally

### Step 1: Manual Scaling

```bash
# Scale up to 5 agents
kubectl scale statefulset ado-agent -n ado-agents --replicas=5

# Verify new pods are running
kubectl get pods -n ado-agents -w
```

**Expected Output:**
```
NAME           READY   STATUS    RESTARTS   AGE
ado-agent-0    1/1     Running   0          10m
ado-agent-1    1/1     Running   0          10m
ado-agent-2    1/1     Running   0          30s
ado-agent-3    1/1     Running   0          25s
ado-agent-4    0/1     Running   0          5s
ado-agent-4    1/1     Running   0          45s
```

### Step 2: Check New Agents in Azure DevOps (GUI)

1. Go to **Agent pools** → `k8s-build-agents` → **Agents**
2. You should now see 5 agents listed

### Step 3: Horizontal Pod Autoscaler (HPA)

Create `ado-agent-hpa.yaml` for automatic scaling:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ado-agent-hpa
  namespace: ado-agents
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: StatefulSet
    name: ado-agent
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

Apply the HPA:

```bash
kubectl apply -f ado-agent-hpa.yaml

# Check HPA status
kubectl get hpa -n ado-agents
```

**Expected Output:**
```
NAME              REFERENCE                 TARGETS   MINPODS   MAXPODS   REPLICAS   AGE
ado-agent-hpa     StatefulSet/ado-agent     5%/10%    2         10        2          30s
```

### Step 4: Scale Down (Save Costs)

```bash
# Scale down to 1 agent during off-hours
kubectl scale statefulset ado-agent -n ado-agents --replicas=1

# Or scale to zero (no jobs will run)
kubectl scale statefulset ado-agent -n ado-agents --replicas=0
```


---

## Part H — Troubleshooting & Diagnostics

### Common Issues and Solutions

#### Issue 1: Agent Not Showing in Pool

**Symptoms:**
- Pod is running but agent not visible in Azure DevOps
- Logs show connection errors

**Diagnosis:**
```bash
# Check pod logs
kubectl logs ado-agent-0 -n ado-agents --tail=100

# Check events
kubectl get events -n ado-agents --sort-by='.lastTimestamp'
```

**Solutions:**
1. Verify PAT token is correct and not expired
2. Verify AZP_URL is correct (include `https://`)
3. Check if agent pool name matches exactly
4. Verify network connectivity to Azure DevOps

#### Issue 2: Agent Shows Offline

**Symptoms:**
- Agent was online, now shows offline
- Pod may be in error state

**Diagnosis:**
```bash
# Check pod status
kubectl describe pod ado-agent-0 -n ado-agents

# Check recent events
kubectl get events -n ado-agents --field-selector involvedObject.name=ado-agent-0
```

**Solutions:**
1. Delete the pod and let StatefulSet recreate it:
   ```bash
   kubectl delete pod ado-agent-0 -n ado-agents
   ```
2. Check if resource limits were hit
3. Verify node has enough resources

#### Issue 3: Docker Commands Fail

**Symptoms:**
- Docker build fails
- Docker push fails
- Error: "Cannot connect to the Docker daemon"

**Solutions:**
1. **Option A: Use Docker-out-of-Docker (DooD)** - Mount host Docker socket:
   ```yaml
   # Add to pod spec
   volumes:
     - name: docker-sock
       hostPath:
         path: /var/run/docker.sock
   # Add to container
   volumeMounts:
     - name: docker-sock
       mountPath: /var/run/docker.sock
   ```

2. **Option B: Use Docker-in-Docker (DinD)** - Run privileged container:
   ```yaml
   # Add to container spec
   securityContext:
     privileged: true
   ```

3. **Option C: Use Kaniko or Buildah** - Rootless container building:
   ```yaml
   # Use kaniko executor image instead
   image: gcr.io/kaniko-project/executor:latest
   ```

#### Issue 4: kubectl Commands Fail

**Symptoms:**
- kubectl cannot connect to AKS
- Permission denied errors

**Solutions:**
1. Verify RBAC is applied correctly
2. Check if service account has correct permissions
3. Get AKS credentials inside the pod:
   ```yaml
   - script: |
       az login --identity
       az aks get-credentials --resource-group rg-hello-aks-dev --name aks-hello-dev
   ```

#### Issue 5: Agent Registration Fails

**Symptoms:**
- Error during agent configuration
- "Failed to add agent" message

**Diagnosis:**
```bash
# Check full logs
kubectl logs ado-agent-0 -n ado-agents

# Run interactive shell to debug
kubectl exec -it ado-agent-0 -n ado-agents -- /bin/bash

# Test connectivity manually
curl -v https://dev.azure.com
```

**Solutions:**
1. Regenerate PAT with correct scopes
2. Verify pool exists and name matches exactly
3. Check if organization requires MFA/conditional access

### Diagnostic Commands

```bash
# List all agents in namespace
kubectl get all -n ado-agents

# Check agent pod details
kubectl describe pod ado-agent-0 -n ado-agents

# Check agent logs (live)
kubectl logs -f ado-agent-0 -n ado-agents

# Check agent logs (last 100 lines)
kubectl logs ado-agent-0 -n ado-agents --tail=100

# Check events in namespace
kubectl get events -n ado-agents --sort-by='.lastTimestamp'

# Check resource usage
kubectl top pods -n ado-agents

# Check node resources
kubectl describe node | grep -A 5 "Allocated resources"

# Execute shell in pod
kubectl exec -it ado-agent-0 -n ado-agents -- /bin/bash

# Check network connectivity
kubectl exec -it ado-agent-0 -n ado-agents -- curl -I https://dev.azure.com

# Check DNS resolution
kubectl exec -it ado-agent-0 -n ado-agents -- nslookup dev.azure.com
```

### Cleanup Commands

```bash
# Delete a specific agent pod (StatefulSet will recreate it)
kubectl delete pod ado-agent-0 -n ado-agents

# Delete entire StatefulSet
kubectl delete statefulset ado-agent -n ado-agents

# Delete namespace (removes everything)
kubectl delete namespace ado-agents

# Remove agent registration from Azure DevOps (GUI)
# Go to Agent pools → Select pool → Select agent → Delete
```

---

## Summary

### What We Built

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Day 42 Summary                                            │
│                                                                             │
│  ✅ Created Azure DevOps Agent Pool (k8s-build-agents)                     │
│  ✅ Generated PAT token for authentication                                  │
│  ✅ Built custom Docker image with Docker, kubectl, az-cli, Helm, Node.js  │
│  ✅ Pushed image to Azure Container Registry                                │
│  ✅ Created Kubernetes namespace and secrets                                │
│  ✅ Deployed StatefulSet with 2 agent replicas                              │
│  ✅ Configured RBAC for Kubernetes access                                   │
│  ✅ Verified agent registration in Azure DevOps                             │
│  ✅ Tested agent with sample pipeline                                       │
│  ✅ Configured Horizontal Pod Autoscaler (HPA)                              │
│  ✅ Learned troubleshooting techniques                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Files Created

| File | Purpose |
|---|---|
| `Dockerfile` | Custom agent image with all tools |
| `start.sh` | Agent startup script |
| `ado-agent-statefulset.yaml` | Kubernetes StatefulSet manifest |
| `ado-agent-rbac.yaml` | ServiceAccount and RBAC configuration |
| `ado-agent-hpa.yaml` | Horizontal Pod Autoscaler |
| `azure-pipelines-test-agent.yml` | Test pipeline |

### Key Commands Reference

| Task | Command |
|---|---|
| Build image | `docker build -t acr.azurecr.io/ado-agent:v1.0 .` |
| Push to ACR | `docker push acr.azurecr.io/ado-agent:v1.0` |
| Create secret | `kubectl create secret generic ado-agent-secret ...` |
| Deploy agents | `kubectl apply -f ado-agent-statefulset.yaml` |
| Check pods | `kubectl get pods -n ado-agents` |
| View logs | `kubectl logs -f ado-agent-0 -n ado-agents` |
| Scale agents | `kubectl scale statefulset ado-agent --replicas=5 -n ado-agents` |

### Security Best Practices

| Practice | Description |
|---|---|
| ✅ Use Kubernetes secrets | Store PAT tokens securely |
| ✅ Rotate PAT regularly | Every 90 days or less |
| ✅ Use non-root containers | Run as non-privileged user |
| ✅ Limit RBAC permissions | Grant only necessary permissions |
| ✅ Use managed identity | For Azure resource access |
| ✅ Monitor agent activity | Check job history and logs |
| ✅ Network isolation | Use namespace isolation |

### Next Steps

- **Day 43:** Add Helm charts for agent deployment
- **Day 44:** Configure auto-scaling based on queue depth
- **Day 45:** Implement agent versioning and updates

---

> **Completed:** You now have Azure DevOps agents running on AKS, ready for scalable CI/CD pipelines!
