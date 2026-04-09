# Day 35: Azure Repos → Docker → ACR → VM (Complete CI/CD Pipeline)

## What You'll Learn

Build a complete CI/CD pipeline from scratch, fully step by step:
- ✅ Create Azure DevOps Organization and Project
- ✅ Create Azure Repos and push code
- ✅ Create Agent Pool and Self-Hosted Runner (step by step)
- ✅ Create Azure Container Registry (ACR)
- ✅ Create Azure VM and install Docker
- ✅ Build Docker image and push to ACR via pipeline
- ✅ Deploy container to VM via pipeline
- ✅ Complete test, check, and confirm at every step

## Table of Contents

1. [Architecture](#architecture)
2. [Lab 1: Create Azure DevOps Organization & Project](#lab-1-create-azure-devops-organization--project)
3. [Lab 2: Create Azure Repos & Push Code](#lab-2-create-azure-repos--push-code)
4. [Lab 3: Create Agent Pool & Self-Hosted Runner](#lab-3-create-agent-pool--self-hosted-runner)
5. [Lab 4: Create Azure Container Registry (ACR)](#lab-4-create-azure-container-registry-acr)
6. [Lab 5: Create Azure VM & Install Docker](#lab-5-create-azure-vm--install-docker)
7. [Lab 6: Create Service Connections](#lab-6-create-service-connections)
8. [Lab 7: Create CI/CD Pipeline](#lab-7-create-cicd-pipeline)
9. [Lab 8: Run Pipeline & Verify Deployment](#lab-8-run-pipeline--verify-deployment)
10. [Cleanup](#cleanup)

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  COMPLETE CI/CD FLOW                                              │
│                                                                   │
│  Step 1: Developer pushes code                                   │
│  ┌──────────────┐                                                │
│  │ Azure Repos   │ ← git push (code + Dockerfile)               │
│  └──────┬───────┘                                                │
│         │ trigger                                                 │
│         ↓                                                         │
│  Step 2: Pipeline runs on Agent                                  │
│  ┌──────────────┐                                                │
│  │ Agent Pool    │ (Microsoft-hosted OR self-hosted runner)      │
│  │ (Runner VM)   │                                                │
│  └──────┬───────┘                                                │
│         │ docker build + push                                     │
│         ↓                                                         │
│  Step 3: Image stored in ACR                                     │
│  ┌──────────────┐                                                │
│  │ Azure ACR     │ hello-world:latest                            │
│  └──────┬───────┘                                                │
│         │ docker pull + run                                       │
│         ↓                                                         │
│  Step 4: App runs on VM                                          │
│  ┌──────────────┐                                                │
│  │ Azure VM      │ http://<VM-IP> → Hello World!                │
│  └──────────────┘                                                │
└──────────────────────────────────────────────────────────────────┘
```

### What is an Agent / Runner?

```
┌──────────────────────────────────────────────────────────────┐
│  AGENT (RUNNER) EXPLAINED                                     │
│                                                               │
│  Agent = A machine that RUNS your pipeline steps             │
│                                                               │
│  When pipeline says "docker build", SOMETHING must           │
│  execute that command. That something is the Agent.          │
│                                                               │
│  Two types:                                                  │
│                                                               │
│  1. Microsoft-Hosted Agent:                                  │
│     ├─ Microsoft provides the VM                             │
│     ├─ Pre-installed tools (Docker, Node, Python, etc.)     │
│     ├─ Fresh VM every run (clean environment)                │
│     ├─ pool: vmImage: 'ubuntu-latest'                       │
│     ├─ Free: 1 parallel job, 1800 min/month                │
│     ├─ Paid: $40/month per parallel job                     │
│     └─ ✅ Easiest, no setup needed                          │
│                                                               │
│  2. Self-Hosted Agent:                                       │
│     ├─ YOU provide the VM (Azure VM, on-prem, etc.)         │
│     ├─ YOU install the agent software                        │
│     ├─ YOU install tools (Docker, etc.)                      │
│     ├─ pool: name: 'my-pool'                                │
│     ├─ Free: Unlimited minutes                               │
│     ├─ Cost: Only the VM cost                                │
│     └─ ✅ Full control, faster (cached), unlimited          │
│                                                               │
│  We'll set up BOTH so you understand each!                   │
└──────────────────────────────────────────────────────────────┘
```

---

## Lab 1: Create Azure DevOps Organization & Project

### Step 1: Create Azure DevOps Organization

```
1. Open browser → Go to https://dev.azure.com
2. Sign in with your Microsoft account
3. If first time:
   - Click "Create new organization"
   - Organization name: your-name-devops (e.g., john-devops)
   - Region: East US (or closest to you)
   - Click "Continue"
4. If you already have an org, use it
```

### Step 2: Create a Project

```
1. In your organization, click "+ New project"
2. Fill in:
   - Project name: day35-cicd
   - Description: Complete CI/CD pipeline lab
   - Visibility: Private
   - Version control: Git
   - Work item process: Basic
3. Click "Create"
```

### Step 3: Test, Check, and Confirm

```
1. Go to https://dev.azure.com/your-org/day35-cicd
   ✅ Project page loads
   ✅ Left menu shows: Boards, Repos, Pipelines, etc.
   ✅ Repos section is empty (we'll add code next)
```

**✅ Result**: Azure DevOps organization and project ready!

---

## Lab 2: Create Azure Repos & Push Code

### Step 1: Create the Application Files Locally

```bash
# Create project directory
mkdir hello-world-app
cd hello-world-app
```

### Step 2: Create app.js

```bash
cat > app.js << 'EOF'
const express = require('express');
const os = require('os');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Hello World - Day 35</title>
      <style>
        body { font-family: Arial; text-align: center; padding: 50px; background: #1a1a2e; color: #e94560; }
        h1 { font-size: 3em; }
        .info { color: #0f3460; background: #e0e0e0; padding: 20px; border-radius: 10px; margin: 20px auto; max-width: 500px; }
      </style>
    </head>
    <body>
      <h1>Hello World!</h1>
      <h2>Day 35 - Azure DevOps CI/CD</h2>
      <div class="info">
        <p><strong>Hostname:</strong> ${os.hostname()}</p>
        <p><strong>Platform:</strong> ${os.platform()}</p>
        <p><strong>Deployed via:</strong> Azure DevOps Pipeline</p>
        <p><strong>Image from:</strong> Azure Container Registry</p>
        <p><strong>Running on:</strong> Azure VM</p>
      </div>
    </body>
    </html>
  `);
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', hostname: os.hostname(), uptime: process.uptime() });
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
EOF
```

### Step 3: Create package.json

```bash
cat > package.json << 'EOF'
{
  "name": "hello-world-app",
  "version": "1.0.0",
  "description": "Day 35 CI/CD Lab",
  "main": "app.js",
  "scripts": {
    "start": "node app.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}
EOF
```

### Step 4: Create Dockerfile

```bash
cat > Dockerfile << 'EOF'
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
EOF
```

### Step 5: Create .gitignore

```bash
cat > .gitignore << 'EOF'
node_modules/
.env
EOF
```

### Step 6: Initialize Git and Push to Azure Repos

```bash
# Initialize git
git init
git add .
git commit -m "Initial commit: Hello World app with Dockerfile"

# Get the repo URL from Azure DevOps:
# Go to Repos → Files → Click "Clone" → Copy the HTTPS URL
# It looks like: https://dev.azure.com/your-org/day35-cicd/_git/day35-cicd

# Add remote
git remote add origin https://dev.azure.com/your-org/day35-cicd/_git/day35-cicd

# Push (you'll be prompted for credentials)
git push -u origin main

# If prompted for credentials:
# Use your Azure DevOps username and a Personal Access Token (PAT)
# To create PAT: Azure DevOps → User Settings (top right) → Personal Access Tokens → New Token
```

### Step 7: Test, Check, and Confirm

```
1. Go to Azure DevOps → Repos → Files
2. Verify:
   ✅ app.js exists
   ✅ package.json exists
   ✅ Dockerfile exists
   ✅ .gitignore exists
   ✅ All file contents correct
```

**✅ Result**: Code pushed to Azure Repos!

---

## Lab 3: Create Agent Pool & Self-Hosted Runner

### Option A: Use Microsoft-Hosted Agent (Easiest)

```
If you just want to use Microsoft's free agent:

In your pipeline YAML, use:
  pool:
    vmImage: 'ubuntu-latest'

That's it! No setup needed.
Microsoft provides a fresh Ubuntu VM for each pipeline run.

Free tier: 1 parallel job, 1800 minutes/month.
Skip to Lab 4 if you want to use this option.
```

### Option B: Create Self-Hosted Agent (Full Control)

This is the step-by-step guide to create your own runner.

### Step 1: Create Agent Pool in Azure DevOps

```
1. Go to Azure DevOps → Project Settings (bottom left gear icon)
2. Left menu → "Agent pools" (under Pipelines section)
3. Click "Add pool"
4. Fill in:
   - Pool to link: New
   - Pool type: Self-hosted
   - Name: my-linux-pool
   - Description: Self-hosted Linux agent for Day 35
   - Grant access permission to all pipelines: ✅ Yes
   - Auto-provision this agent pool in all projects: ✅ Yes
5. Click "Create"
```

### Step 2: Create a VM for the Agent

```
1. Azure Portal → Search "Virtual machines" → "+ Create"
2. Fill in:
   - Resource group: rg-day35-cicd
   - Name: vm-agent-runner
   - Region: East US
   - Image: Ubuntu Server 22.04 LTS
   - Size: Standard_B2s (2 vCPU, 4 GB RAM - needs more than B1s for Docker builds)
   - Authentication: Password
   - Username: azureuser
   - Password: Day35Agent@2026
   - Public inbound ports: Allow SSH (22)
3. Click "Review + create" → "Create"
```

**⏱️ Wait**: 2-3 minutes

### Step 3: Install Docker on Agent VM

```bash
# SSH into the agent VM
ssh azureuser@<AGENT-VM-PUBLIC-IP>

# Update packages
sudo apt update && sudo apt upgrade -y

# Install Docker
sudo apt install -y docker.io

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group (so agent can run docker without sudo)
sudo usermod -aG docker azureuser

# Verify Docker
docker --version
# Docker version 24.x.x

# IMPORTANT: Logout and login again for group changes
exit
ssh azureuser@<AGENT-VM-PUBLIC-IP>

# Verify docker works without sudo
docker ps
# Should show empty list (no error)
```

### Step 4: Get Agent Download URL and PAT

```
1. Go to Azure DevOps → Project Settings → Agent pools
2. Click "my-linux-pool"
3. Click "New agent" (top button)
4. Select: Linux → x64
5. You'll see download instructions. Note the download URL.

6. Create a Personal Access Token (PAT):
   - Azure DevOps → User Settings (top right, person icon)
   - Click "Personal access tokens"
   - Click "+ New Token"
   - Name: agent-token
   - Organization: Your organization
   - Expiration: 90 days (or custom)
   - Scopes: Click "Show all scopes"
     - Agent Pools: Read & manage ✅
     - (or select "Full access" for simplicity)
   - Click "Create"
   - ⚠️ COPY THE TOKEN NOW! It won't be shown again.
```

### Step 5: Install and Configure Agent on VM

```bash
# SSH into agent VM
ssh azureuser@<AGENT-VM-PUBLIC-IP>

# Create agent directory
mkdir myagent && cd myagent

# Download the agent (use the URL from Step 4)
curl -O https://vstsagentpackage.azureedge.net/agent/3.248.0/vsts-agent-linux-x64-3.248.0.tar.gz

# Extract
tar zxvf vsts-agent-linux-x64-3.248.0.tar.gz

# Configure the agent
./config.sh
```

**The config.sh will ask you questions. Answer them:**

```
Enter server URL > https://dev.azure.com/your-org
Enter authentication type (press enter for PAT) > [press Enter]
Enter personal access token > [paste your PAT from Step 4]
Enter agent pool (press enter for default) > my-linux-pool
Enter agent name (press enter for vm-agent-runner) > [press Enter]
Enter work folder (press enter for _work) > [press Enter]

# You should see:
# Settings Saved.
# Successfully added the agent
```

### Step 6: Start the Agent as a Service

```bash
# Install as a systemd service (runs on boot)
sudo ./svc.sh install

# Start the service
sudo ./svc.sh start

# Check status
sudo ./svc.sh status
# Should show: active (running)
```

### Step 7: Verify Agent is Online

```
1. Go to Azure DevOps → Project Settings → Agent pools
2. Click "my-linux-pool"
3. Click "Agents" tab
4. Verify:
   ✅ vm-agent-runner listed
   ✅ Status: Online (green circle)
   ✅ Enabled: Yes
```

### Step 8: Test, Check, and Confirm - Agent

**Test 1: Agent Pool Created**

```
1. Project Settings → Agent pools
   ✅ "my-linux-pool" exists
   ✅ Type: Self-hosted
```

**Test 2: Agent Online**

```
1. my-linux-pool → Agents tab
   ✅ vm-agent-runner: Online
   ✅ OS: Linux
   ✅ Version: 3.x.x
```

**Test 3: Docker Available on Agent**

```
SSH into agent VM:
  docker --version → ✅ Docker installed
  docker ps → ✅ No errors (can run without sudo)
```

**Test 4: Agent Service Running**

```
SSH into agent VM:
  sudo ./svc.sh status
  ✅ active (running)
```

**✅ Result**: Self-hosted agent pool and runner ready!

---

## Lab 4: Create Azure Container Registry (ACR)

### Step 1: Create ACR via Portal

```
1. Azure Portal → Search "Container registries" → "+ Create"
2. Fill in:
   - Subscription: Your subscription
   - Resource group: rg-day35-cicd (create new if needed)
   - Registry name: acrday35 (must be globally unique, lowercase, no dashes)
   - Location: East US
   - SKU: Basic (cheapest, ~$5/month)
3. Click "Review + create" → "Create"
```

**⏱️ Wait**: 1-2 minutes

### Step 2: Enable Admin Access (for pipeline)

```
1. Go to acrday35 → Left menu → "Access keys"
2. Toggle "Admin user": ✅ Enabled
3. Note down:
   - Login server: acrday35.azurecr.io
   - Username: acrday35
   - Password: (copy the password)
   
   You'll need these for the pipeline.
```

### Step 3: Test, Check, and Confirm

**Test 1: ACR Created**

```
1. Container registries → acrday35
   ✅ Status: Active
   ✅ Login server: acrday35.azurecr.io
   ✅ SKU: Basic
```

**Test 2: Admin Access Enabled**

```
1. acrday35 → Access keys
   ✅ Admin user: Enabled
   ✅ Username and password visible
```

**Test 3: Test Login (from agent VM or local)**

```bash
docker login acrday35.azurecr.io -u acrday35 -p <password>
# Login Succeeded ✅
```

**✅ Result**: ACR ready!

---

## Lab 5: Create Azure VM & Install Docker

### Step 1: Create Deployment VM

```
This is the VM where your app will RUN (not the agent VM).

1. Azure Portal → Virtual machines → "+ Create"
2. Fill in:
   - Resource group: rg-day35-cicd
   - Name: vm-app-deploy
   - Region: East US
   - Image: Ubuntu Server 22.04 LTS
   - Size: Standard_B1s (cheapest, enough for our app)
   - Authentication: Password
   - Username: azureuser
   - Password: Day35Deploy@2026
   - Public inbound ports: Allow SSH (22) and HTTP (80)
3. Click "Review + create" → "Create"
```

**⏱️ Wait**: 2-3 minutes

### Step 2: Install Docker on Deploy VM

```bash
# SSH into the deploy VM
ssh azureuser@<DEPLOY-VM-PUBLIC-IP>

# Install Docker
sudo apt update
sudo apt install -y docker.io
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker azureuser

# Logout and login again
exit
ssh azureuser@<DEPLOY-VM-PUBLIC-IP>

# Verify
docker --version
docker ps
```

### Step 3: Login to ACR on Deploy VM

```bash
# Login to ACR (so VM can pull images)
docker login acrday35.azurecr.io -u acrday35 -p <password>
# Login Succeeded ✅
```

### Step 4: Test, Check, and Confirm

**Test 1: VM Running**

```
1. Virtual machines → vm-app-deploy
   ✅ Status: Running
   ✅ Public IP: noted
```

**Test 2: Docker Installed**

```
SSH into vm-app-deploy:
  docker --version → ✅
  docker ps → ✅ (no errors)
```

**Test 3: ACR Login Works**

```
docker login acrday35.azurecr.io → ✅ Login Succeeded
```

**Test 4: Port 80 Open**

```
1. vm-app-deploy → Networking
   ✅ Inbound rule: Allow HTTP (80) from Any
   ✅ Inbound rule: Allow SSH (22) from Any
```

**✅ Result**: Deploy VM ready!

---

## Lab 6: Create Service Connections

### Step 1: Create Docker Registry Service Connection (ACR)

```
1. Azure DevOps → Project Settings → Service connections
2. Click "New service connection"
3. Select "Docker Registry" → Click "Next"
4. Fill in:
   - Registry type: Others
   - Docker Registry: https://acrday35.azurecr.io
   - Docker ID: acrday35
   - Docker Password: (paste ACR password from Lab 4)
   - Service connection name: acr-connection
   - Grant access to all pipelines: ✅ Yes
5. Click "Verify and save"
```

### Step 2: Create SSH Service Connection (Deploy VM)

```
1. Project Settings → Service connections
2. Click "New service connection"
3. Select "SSH" → Click "Next"
4. Fill in:
   - Host name: <DEPLOY-VM-PUBLIC-IP>
   - Port number: 22
   - Username: azureuser
   - Password: Day35Deploy@2026
   - Service connection name: vm-ssh-connection
   - Grant access to all pipelines: ✅ Yes
5. Click "Verify and save"
```

### Step 3: Test, Check, and Confirm

**Test 1: ACR Connection**

```
1. Service connections → acr-connection
   ✅ Status: Verified (green checkmark)
   ✅ Type: Docker Registry
```

**Test 2: SSH Connection**

```
1. Service connections → vm-ssh-connection
   ✅ Status: Verified (green checkmark)
   ✅ Type: SSH
```

**✅ Result**: Service connections ready!

---

## Lab 7: Create CI/CD Pipeline

### Step 1: Create Pipeline YAML

```
1. Azure DevOps → Repos → Files
2. Click "New" → "File"
3. File name: azure-pipelines.yml
4. Paste the content below
5. Click "Commit"
```

**Pipeline using Microsoft-Hosted Agent:**

```yaml
# azure-pipelines.yml
trigger:
  branches:
    include:
      - main

# Option A: Microsoft-Hosted Agent (no setup needed)
pool:
  vmImage: 'ubuntu-latest'

# Option B: Self-Hosted Agent (uncomment below, comment above)
# pool:
#   name: 'my-linux-pool'

variables:
  acrName: 'acrday35'
  acrLoginServer: 'acrday35.azurecr.io'
  imageName: 'hello-world-app'
  tag: '$(Build.BuildId)'

stages:
# ==========================================
# STAGE 1: BUILD & PUSH DOCKER IMAGE
# ==========================================
- stage: Build
  displayName: 'Build & Push Docker Image'
  jobs:
  - job: BuildAndPush
    displayName: 'Build and Push to ACR'
    steps:
    
    - task: Docker@2
      displayName: 'Build Docker Image'
      inputs:
        containerRegistry: 'acr-connection'
        repository: '$(imageName)'
        command: 'build'
        Dockerfile: '**/Dockerfile'
        tags: |
          $(tag)
          latest

    - task: Docker@2
      displayName: 'Push to ACR'
      inputs:
        containerRegistry: 'acr-connection'
        repository: '$(imageName)'
        command: 'push'
        tags: |
          $(tag)
          latest

    - script: |
        echo "✅ Image built and pushed: $(acrLoginServer)/$(imageName):$(tag)"
        echo "✅ Image also tagged as: $(acrLoginServer)/$(imageName):latest"
      displayName: 'Print Image Info'

# ==========================================
# STAGE 2: DEPLOY TO VM
# ==========================================
- stage: Deploy
  displayName: 'Deploy to Azure VM'
  dependsOn: Build
  jobs:
  - job: DeployToVM
    displayName: 'Deploy Container to VM'
    steps:

    - task: SSH@0
      displayName: 'Deploy Container on VM'
      inputs:
        sshEndpoint: 'vm-ssh-connection'
        runOptions: 'inline'
        inline: |
          echo "=== Pulling latest image ==="
          docker pull $(acrLoginServer)/$(imageName):latest
          
          echo "=== Stopping old container (if exists) ==="
          docker stop hello-world-app 2>/dev/null || true
          docker rm hello-world-app 2>/dev/null || true
          
          echo "=== Starting new container ==="
          docker run -d \
            --name hello-world-app \
            --restart unless-stopped \
            -p 80:3000 \
            $(acrLoginServer)/$(imageName):latest
          
          echo "=== Waiting for app to start ==="
          sleep 5
          
          echo "=== Verifying ==="
          docker ps | grep hello-world-app
          curl -s http://localhost | head -5
          
          echo "=== ✅ Deployment complete! ==="
        failOnStdErr: false
```

### Step 2: Understanding the Pipeline

```
┌──────────────────────────────────────────────────────────────┐
│  PIPELINE EXPLAINED                                           │
│                                                               │
│  trigger:                                                    │
│    branches: [main]                                          │
│    → Pipeline runs when code is pushed to main branch        │
│                                                               │
│  pool:                                                       │
│    vmImage: 'ubuntu-latest'                                  │
│    → Use Microsoft's free Ubuntu agent                       │
│    → OR use: name: 'my-linux-pool' for self-hosted          │
│                                                               │
│  Stage 1: Build                                              │
│    Docker@2 build → Builds image from Dockerfile             │
│    Docker@2 push → Pushes to ACR                             │
│    Tags: Build ID (unique) + latest                          │
│                                                               │
│  Stage 2: Deploy                                             │
│    SSH@0 → Connects to deploy VM via SSH                     │
│    docker pull → Downloads image from ACR                    │
│    docker stop/rm → Removes old container                    │
│    docker run → Starts new container on port 80              │
│    curl → Verifies app is running                            │
└──────────────────────────────────────────────────────────────┘
```

### Step 3: Test, Check, and Confirm - Pipeline Created

**Test 1: Pipeline YAML in Repo**

```
1. Repos → Files
   ✅ azure-pipelines.yml exists
   ✅ Content is correct
```

**Test 2: Pipeline Detected**

```
1. Pipelines → Pipelines
   ✅ Pipeline should auto-detect from YAML
   If not: Click "New pipeline" → Azure Repos Git → Select repo → Existing YAML
```

**✅ Result**: Pipeline YAML ready!

---

## Lab 8: Run Pipeline & Verify Deployment

### Step 1: Run the Pipeline

```
1. Go to Pipelines → Pipelines
2. Click on your pipeline (day35-cicd)
3. Click "Run pipeline"
4. Branch: main
5. Click "Run"
```

### Step 2: Monitor Pipeline Execution

```
1. Click on the running pipeline
2. Watch the stages:

   Stage 1: Build & Push Docker Image
   ├─ Build Docker Image: ⏳ → ✅ (2-3 minutes)
   └─ Push to ACR: ⏳ → ✅ (1-2 minutes)

   Stage 2: Deploy to Azure VM
   └─ Deploy Container on VM: ⏳ → ✅ (1-2 minutes)

3. Click on each step to see detailed logs
4. Total time: ~5-7 minutes
```

### Step 3: Verify Image in ACR

```
1. Azure Portal → Container registries → acrday35
2. Left menu → "Repositories"
3. Click "hello-world-app"
4. Verify:
   ✅ Tag: latest
   ✅ Tag: <build-id> (e.g., 20260401.1)
   ✅ Image size shown
   ✅ Push date: Just now
```

### Step 4: Verify App Running on VM

```
1. Open browser → http://<DEPLOY-VM-PUBLIC-IP>
2. You should see:
   
   Hello World!
   Day 35 - Azure DevOps CI/CD
   Hostname: <container-id>
   Deployed via: Azure DevOps Pipeline
   Image from: Azure Container Registry
   Running on: Azure VM

   ✅ App is running!
```

### Step 5: Verify via SSH

```bash
ssh azureuser@<DEPLOY-VM-PUBLIC-IP>

# Check container running
docker ps
# CONTAINER ID  IMAGE                                    STATUS        PORTS
# abc123        acrday35.azurecr.io/hello-world-app:latest  Up 5 min  0.0.0.0:80->3000/tcp

# Check health endpoint
curl http://localhost/health
# {"status":"healthy","hostname":"abc123","uptime":300}

# Check logs
docker logs hello-world-app
# App listening at http://localhost:3000

exit
```

### Step 6: Test Auto-Deploy (Push a Change)

```
1. Go to Azure DevOps → Repos → Files
2. Click on app.js → Edit
3. Change "Hello World!" to "Hello World v2!"
4. Click "Commit" → Commit to main

5. Go to Pipelines → Watch new pipeline run automatically!
   (Triggered by the push to main)

6. After pipeline completes:
   Refresh browser → http://<DEPLOY-VM-PUBLIC-IP>
   ✅ Now shows "Hello World v2!"
   ✅ Auto-deploy working!
```

### Step 7: Complete Test, Check, and Confirm

**Test 1: Pipeline Succeeded**

```
1. Pipelines → Latest run
   ✅ Stage 1 (Build): Succeeded (green)
   ✅ Stage 2 (Deploy): Succeeded (green)
   ✅ Overall: Succeeded
```

**Test 2: Image in ACR**

```
1. ACR → Repositories → hello-world-app
   ✅ latest tag exists
   ✅ Build ID tag exists
```

**Test 3: App Accessible**

```
Browser: http://<DEPLOY-VM-PUBLIC-IP>
   ✅ Hello World page loads
   ✅ Shows hostname, platform info
```

**Test 4: Health Endpoint**

```
curl http://<DEPLOY-VM-PUBLIC-IP>/health
   ✅ {"status":"healthy",...}
```

**Test 5: Auto-Deploy on Push**

```
1. Edit code in Repos → Commit to main
2. Pipeline triggers automatically
3. New version deployed
   ✅ CI/CD fully automated!
```

**Test 6: Container Running**

```
SSH into deploy VM:
  docker ps → ✅ hello-world-app running
  docker logs hello-world-app → ✅ No errors
```

**Test 7: Agent Status (if self-hosted)**

```
1. Project Settings → Agent pools → my-linux-pool
   ✅ Agent: Online
   ✅ Last used: Just now
```

**✅ Result**: Complete CI/CD pipeline working!

---

## Troubleshooting

### Issue 1: Pipeline Can't Find Dockerfile

```
Error: "Dockerfile not found"

Fix:
  Check Dockerfile is in the ROOT of the repo (not in a subfolder)
  Or update the pipeline: Dockerfile: 'path/to/Dockerfile'
```

### Issue 2: Docker Push Fails (ACR Auth)

```
Error: "unauthorized: authentication required"

Fix:
  1. Verify ACR admin user is enabled
  2. Verify service connection credentials are correct
  3. Re-create the acr-connection service connection
```

### Issue 3: SSH Deploy Fails

```
Error: "Connection refused" or "Permission denied"

Fix:
  1. Verify VM public IP hasn't changed
  2. Verify SSH credentials in service connection
  3. Verify VM NSG allows SSH (port 22)
  4. Update vm-ssh-connection with correct IP/password
```

### Issue 4: App Not Accessible on Port 80

```
Error: Browser shows "Connection refused"

Fix:
  1. Check VM NSG allows HTTP (port 80) inbound
  2. SSH into VM → docker ps (is container running?)
  3. docker logs hello-world-app (any errors?)
  4. Verify port mapping: -p 80:3000
```

### Issue 5: Self-Hosted Agent Offline

```
Error: "No agent found in pool"

Fix:
  SSH into agent VM:
  cd myagent
  sudo ./svc.sh status
  
  If stopped:
  sudo ./svc.sh start
  
  If not installed:
  sudo ./svc.sh install
  sudo ./svc.sh start
```

---

## Cleanup

```
1. Delete Azure Resources:
   - Resource groups → rg-day35-cicd → Delete
   - This deletes: ACR, both VMs, and all related resources

2. Delete Azure DevOps Project (optional):
   - Project Settings → Overview → Delete project

3. Delete Agent (if self-hosted):
   SSH into agent VM:
   cd myagent
   sudo ./svc.sh stop
   sudo ./svc.sh uninstall
   ./config.sh remove
```

**⏱️ Wait**: 5-10 minutes

**✅ Result**: All resources deleted!

---

## Quick Reference

### Pipeline Pool Options

```yaml
# Microsoft-Hosted (free, no setup)
pool:
  vmImage: 'ubuntu-latest'

# Self-Hosted (your VM, unlimited minutes)
pool:
  name: 'my-linux-pool'
```

### Agent Commands

```bash
# Configure agent
./config.sh

# Install as service
sudo ./svc.sh install

# Start/Stop/Status
sudo ./svc.sh start
sudo ./svc.sh stop
sudo ./svc.sh status

# Remove agent
./config.sh remove
```

### Useful Links

- [Azure DevOps Pipelines](https://learn.microsoft.com/azure/devops/pipelines/)
- [Self-Hosted Agents](https://learn.microsoft.com/azure/devops/pipelines/agents/linux-agent)
- [Docker@2 Task](https://learn.microsoft.com/azure/devops/pipelines/tasks/reference/docker-v2)
- [SSH@0 Task](https://learn.microsoft.com/azure/devops/pipelines/tasks/reference/ssh-v0)
- [ACR Documentation](https://learn.microsoft.com/azure/container-registry/)

---

**🎉 Congratulations!** You've completed Day 35 with a full CI/CD pipeline: Azure Repos → Docker Build → ACR Push → VM Deploy, with both Microsoft-hosted and self-hosted agent options!

###
```
✅ Step-by-step: Create Service Principal (from Azure Portal UI)
1. Go to Azure Portal

Open:
👉 https://portal.azure.com

2. Open Microsoft Entra ID (Azure AD)
Search: “Microsoft Entra ID”
Click it
3. App registrations
Click App registrations
Click + New registration
4. Create App

Fill:

Name → azdo-devops-lab-sp (or anything)
Supported account types → Single tenant (default)
Click Register
5. Copy important values

After created, copy these:

Application (client) ID
Directory (tenant) ID

👉 You will need these in Azure DevOps

6. Create Client Secret

Go to:

Certificates & secrets
Click + New client secret

Fill:

Description → devops-secret
Expiry → 6 months / 12 months

Click Add

⚠️ IMPORTANT:

Copy Value immediately (you can't see it again)
7. Give permission (VERY IMPORTANT)

Now assign permission to ACR:

Go to:
Subscriptions
Select your subscription
Click Access control (IAM)
Add role:
Click + Add → Add role assignment

Select:

Role → AcrPush (for push)
OR Contributor (for full access, easier for lab)
Assign to:
Select: User, group, or service principal
Click Select members
Search your app name → azdo-devops-lab-sp
Select it

Click Review + assign

✅ Now you have:
Item	Example
Client ID	xxxxxxxx
Tenant ID	xxxxxxxx
Client Secret	xxxxxxxx
✅ Next: Use in Azure DevOps

Go to:

👉 Project Settings → Service connections → New

Choose:

Azure Resource Manager
Authentication → Service principal (manual)

Fill:

Subscription ID
Subscription name
Tenant ID
Client ID
Client Secret
⚠️ Common mistakes (you had these before)
❌ Missing permission

→ fix: assign AcrPush role

❌ Expired secret

→ fix: create new secret

❌ Wrong service connection type
Docker task needs Docker Registry
AzureCLI task uses Azure Resource Manager
```
