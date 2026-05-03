# Day 42 Part 2: Azure DevOps Agent on VM (Containerized)
## Complete Guide: Self-Hosted Agent Running in Docker on Azure VM

> **🎯 Objective:** Deploy Azure DevOps self-hosted agents as Docker containers on an Azure VM for CI/CD pipelines.

> **⚠️ Important Note (June 2025):** The old domain `vstsagentpackage.azureedge.net` has been retired. Use the new CDN domain:
> - **Old:** `vstsagentpackage.azureedge.net` (retired)
> - **New:** `download.agent.dev.azure.com`
> - Example URL: `https://download.agent.dev.azure.com/agent/4.273.0/vsts-agent-linux-x64-4.273.0.tar.gz`

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [Part A — Verify VM and Docker Setup](#part-a--verify-vm-and-docker-setup)
4. [Part B — Create Azure DevOps Agent Pool](#part-b--create-azure-devops-agent-pool)
5. [Part C — Create PAT Token](#part-c--create-pat-token)
6. [Part D — Build Custom Agent Docker Image](#part-d--build-custom-agent-docker-image)
7. [Part E — Run Agent Container](#part-e--run-agent-container)
8. [Part F — Verify Agent Registration](#part-f--verify-agent-registration)
9. [Part G — Test Agent with Pipeline](#part-g--test-agent-with-pipeline)
10. [Part H — Run Multiple Agents](#part-h--run-multiple-agents)
11. [Part I — Docker Compose for Easy Management](#part-i--docker-compose-for-easy-management)
12. [Part J — Systemd Service for Auto-Start](#part-j--systemd-service-for-auto-start)
13. [Part K — Troubleshooting](#part-k--troubleshooting)
14. [Summary](#summary)

---

## 1. Architecture Overview

### Why Containerized Agents on VM?

| Benefit | Description |
|---|---|
| **Isolation** | Each agent runs in its own container |
| **Easy Updates** | Pull new image, restart container |
| **Consistency** | Same environment across all agents |
| **Flexibility** | Run multiple agent versions |
| **Resource Control** | Limit CPU/memory per container |

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Azure DevOps Organization                            │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      Agent Pool: vm-build-agents                     │   │
│  │                                                                      │   │
│  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │   │
│  │   │  ado-agent  │  │  ado-agent  │  │  ado-agent  │                │   │
│  │   │     -1      │  │     -2      │  │     -3      │                │   │
│  │   └─────────────┘  └─────────────┘  └─────────────┘                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    ▲                                        │
│                                    │ WebSocket connection                   │
└────────────────────────────────────┼────────────────────────────────────────┘
                                     │
┌────────────────────────────────────┼────────────────────────────────────────┐
│                         Azure VM    │                                       │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                               Docker                                 │   │
│  │                                                                      │   │
│  │   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │   │
│  │   │   Container     │  │   Container     │  │   Container     │    │   │
│  │   │  ado-agent-1    │  │  ado-agent-2    │  │  ado-agent-3    │    │   │
│  │   │                 │  │                 │  │                 │    │   │
│  │   │  ┌───────────┐  │  │  ┌───────────┐  │  │  ┌───────────┐  │    │   │
│  │   │  │ ADO Agent │  │  │  │ ADO Agent │  │  │  │ ADO Agent │  │    │   │
│  │   │  │ Software  │  │  │  │ Software  │  │  │  │ Software  │  │    │   │
│  │   │  │ - Docker  │  │  │  │ - Docker  │  │  │  │ - Docker  │  │    │   │
│  │   │  │ - kubectl │  │  │  │ - kubectl │  │  │  │ - kubectl │  │    │   │
│  │   │  │ - az-cli  │  │  │  │ - az-cli  │  │  │  │ - az-cli  │  │    │   │
│  │   │  │ - Node.js │  │  │  │ - Node.js │  │  │  │ - Node.js │  │    │   │
│  │   │  └───────────┘  │  │  └───────────┘  │  │  └───────────┘  │    │   │
│  │   └─────────────────┘  └─────────────────┘  └─────────────────┘    │   │
│  │                                                                      │   │
│  │   Docker Socket: /var/run/docker.sock (shared)                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  OS: Ubuntu 22.04 LTS                                                       │
│  Docker: Installed and Running                                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Prerequisites

### What You Already Have

| Resource | Status |
|---|---|
| Azure VM | ✅ Created |
| Docker | ✅ Installed |
| SSH Access | ✅ Available |

### Additional Requirements

| Requirement | Description |
|---|---|
| Azure DevOps Organization | Your ADO org (dev.azure.com/your-org) |
| Azure DevOps Project | Your project for pipelines |
| PAT Token | For agent authentication |

---

## Part A — Verify VM and Docker Setup

### Step 1: SSH into Your VM

```bash
# Replace with your VM's public IP
ssh azureuser@<VM_PUBLIC_IP>

# Or if using key file
ssh -i ~/.ssh/my-key.pem azureuser@<VM_PUBLIC_IP>
```

### Step 2: Verify Docker is Running

```bash
# Check Docker version
docker --version

# Check Docker service status
sudo systemctl status docker

# Check Docker is running
sudo docker ps
```

**Expected Output:**
```
CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES
(empty - no containers running yet)
```

### Step 3: Verify Current User Can Run Docker

```bash
# Check if user is in docker group
groups

# If docker is not listed, add user to docker group
sudo usermod -aG docker $USER

# Apply changes (log out and log back in, or run)
newgrp docker

# Verify
docker ps
```

### Step 4: Check Available Resources

```bash
# Check CPU and memory
free -h
nproc

# Check disk space
df -h
```

**Example Output:**
```
              total        used        free      shared  buff/cache   available
Mem:          7.7Gi       1.2Gi       5.8Gi       120Mi       700Mi       6.1Gi
4  (4 CPU cores)
```

---

## Part B — Create Azure DevOps Agent Pool

### Step 1: Go to Azure DevOps (GUI)

1. Open browser to `https://dev.azure.com/{your-org}`
2. Click **Project Settings** (bottom-left gear icon)
3. Under **Pipelines**, click **Agent pools**
4. Click **Add pool**

### Step 2: Create Pool

Configure:
- **Pool type**: **Self-hosted**
- **Name**: `vm-build-agents`
- **Description**: "Self-hosted agents running in Docker on VM"
- **Auto-provision**: Unchecked
- **Grant access to all pipelines**: ✅ Checked

Click **Create**.

### Step 3: Note the Pool Name

```
Pool Name: vm-build-agents
```

---

## Part C — Create PAT Token

### Step 1: Create PAT (GUI)

1. Click your **profile icon** (top-right)
2. Click **Personal access tokens**
3. Click **New Token**

### Step 2: Configure PAT

- **Name**: `ado-agent-vm-pat`
- **Organization**: Your organization
- **Expiration**: 90 days (recommended)
- **Scopes**:
  - ✅ **Agent Pools**: Read & manage
  - ✅ **Build**: Read & execute
  - ✅ **Deployment**: Read & manage

Click **Create**.

### Step 3: Copy and Save PAT

**⚠️ IMPORTANT:** Copy the PAT now! Example:
```
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Save it somewhere safe.

---

## Part D — Build Custom Agent Docker Image

### Step 1: Create Project Directory on VM

```bash
# SSH into your VM (if not already)
ssh azureuser@<VM_PUBLIC_IP>

# Create directory
mkdir -p ~/ado-agent-docker
cd ~/ado-agent-docker
```

### Step 2: Create Dockerfile

Create the `Dockerfile`:

```bash
cat > Dockerfile << 'EOF'
# Dockerfile for Azure DevOps Agent (VM Docker)
FROM ubuntu:22.04

# Avoid interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# Agent environment variables
ENV AZP_URL=""
ENV AZP_TOKEN=""
ENV AZP_POOL=""
ENV AZP_AGENT_NAME=""

# Labels
LABEL maintainer="DevOps Team"
LABEL description="Azure DevOps Agent for VM Docker"
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
    iputils-ping \
    && rm -rf /var/lib/apt/lists/*

# Install Azure CLI
RUN curl -sL https://aka.ms/InstallAzureCLIDeb | bash

# Install kubectl
RUN az aks install-cli

# Install Docker CLI
RUN curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null \
    && apt-get update \
    && apt-get install -y docker-ce-cli \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 18.x
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install Helm
RUN curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 \
    && chmod +x get_helm.sh \
    && ./get_helm.sh \
    && rm get_helm.sh

# Create agent user
RUN useradd -m -s /bin/bash azureuser \
    && echo "azureuser ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

WORKDIR /home/azureuser/agent

# Download Azure DevOps Agent from new CDN (old domain vstsagentpackage.azureedge.net retired June 2025)
RUN curl -L -o agent.tar.gz "https://download.agent.dev.azure.com/agent/4.273.0/vsts-agent-linux-x64-4.273.0.tar.gz" \
    && tar xzf agent.tar.gz && rm agent.tar.gz

# Change ownership
RUN chown -R azureuser:azureuser /home/azureuser

USER azureuser

COPY start.sh .
USER root
RUN chmod +x start.sh
USER azureuser

ENTRYPOINT ["./start.sh"]
EOF
```

### Step 3: Create Start Script

Create `start.sh`:

```bash
cat > start.sh << 'EOF'
#!/bin/bash
set -e

echo "========================================"
echo "  Azure DevOps Agent Startup"
echo "========================================"
echo ""

# Validate environment variables
if [ -z "$AZP_URL" ]; then
    echo "ERROR: AZP_URL is not set"
    exit 1
fi

if [ -z "$AZP_TOKEN" ]; then
    echo "ERROR: AZP_TOKEN is not set"
    exit 1
fi

if [ -z "$AZP_POOL" ]; then
    echo "ERROR: AZP_POOL is not set"
    exit 1
fi

# Set agent name from hostname if not provided
if [ -z "$AZP_AGENT_NAME" ]; then
    export AZP_AGENT_NAME=$(hostname)
fi

echo "Azure DevOps URL: $AZP_URL"
echo "Agent Pool: $AZP_POOL"
echo "Agent Name: $AZP_AGENT_NAME"
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
            --token "$AZP_TOKEN" 2>/dev/null || true
    fi
    
    exit 0
}

trap cleanup SIGTERM SIGINT SIGPIPE

# Remove existing configuration if present (handles container restart)
if [ -f .agent ]; then
    echo "Removing existing agent configuration..."
    ./config.sh remove --unattended --auth pat --token "$AZP_TOKEN" 2>/dev/null || true
fi

# Configure the agent
echo "Configuring agent..."
./config.sh --unattended \
    --url "$AZP_URL" \
    --auth pat \
    --token "$AZP_TOKEN" \
    --pool "$AZP_POOL" \
    --agent "$AZP_AGENT_NAME" \
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

wait
EOF

chmod +x start.sh
```

### Step 4: Build the Docker Image

```bash
# Build the image
docker build -t ado-agent:latest .

# Verify build
docker images | grep ado-agent
```

**Expected Output:**
```
ado-agent   latest    abc123def456   2 minutes ago   1.2GB
```

---

## Part E — Run Agent Container

### Step 1: Set Environment Variables

Replace with your actual values:

```bash
# Set your Azure DevOps URL
AZP_URL="https://dev.azure.com/your-org"

# Set your PAT token
AZP_TOKEN="your-pat-token-here"

# Set your pool name
AZP_POOL="vm-build-agents"

# Set agent name (optional, will use container hostname if not set)
AZP_AGENT_NAME="vm-agent-1"
```

### Step 2: Run the Container

```bash
docker run -d \
  --name ado-agent-1 \
  --restart unless-stopped \
  -e AZP_URL="$AZP_URL" \
  -e AZP_TOKEN="$AZP_TOKEN" \
  -e AZP_POOL="$AZP_POOL" \
  -e AZP_AGENT_NAME="$AZP_AGENT_NAME" \
  -v /var/run/docker.sock:/var/run/docker.sock \
  ado-agent:latest
```

**Explanation of flags:**
- `-d`: Run in detached mode (background)
- `--name ado-agent-1`: Container name
- `--restart unless-stopped`: Auto-restart on reboot
- `-e`: Environment variables
- `-v /var/run/docker.sock:/var/run/docker.sock`: Mount Docker socket (allows container to run Docker commands)

### Step 3: Check Container Status

```bash
# List running containers
docker ps

# Check container logs
docker logs -f ado-agent-1
```

**Expected Output:**
```
========================================
  Azure DevOps Agent Startup
========================================

Azure DevOps URL: https://dev.azure.com/your-org
Agent Pool: vm-build-agents
Agent Name: vm-agent-1

Configuring agent...
>> Connect:
Connecting to server ...
>> Register Agent:
Scanning for tool capabilities.
Successfully added the agent 'vm-agent-1'.

========================================
  Agent configured successfully!
========================================

Starting agent...
Listening for Jobs
```

Press `Ctrl+C` to exit log view.

### Step 4: Verify Container is Running

```bash
docker ps --filter name=ado-agent-1
```

**Expected Output:**
```
CONTAINER ID   IMAGE              COMMAND           STATUS          PORTS     NAMES
abc123def456   ado-agent:latest   "./start.sh"      Up 2 minutes              ado-agent-1
```


---

## Part F — Verify Agent Registration

### Step 1: Check in Azure DevOps (GUI)

1. Go to **Azure DevOps** → **Project Settings** → **Agent pools**
2. Click on `vm-build-agents`
3. Click **Agents** tab

**You should see:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Agent Pool: vm-build-agents                                                 │
│                                                                             │
│  Agents (1)                                                                 │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 🟢 Online   vm-agent-1                                         v1.0  │   │
│  │    Enabled • Linux • X64 • 0 jobs completed                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Step 2: Check Agent Capabilities

1. Click on `vm-agent-1`
2. Click **Capabilities** tab
3. Verify tools:

| Capability | Expected Value |
|---|---|
| Agent.Name | vm-agent-1 |
| Agent.OS | Linux |
| docker | installed |
| kubectl | installed |
| az | installed |
| node | installed |
| helm | installed |

### Step 3: Verify from VM (CLI)

```bash
# Check container is healthy
docker inspect ado-agent-1 | grep -A 5 "Status"

# Check agent is listening for jobs
docker logs ado-agent-1 | grep "Listening for Jobs"
```

---

## Part G — Test Agent with Pipeline

### Step 1: Create Test Pipeline in Azure DevOps

Create `azure-pipelines-test-vm-agent.yml`:

```yaml
# Test pipeline for vm-build-agents pool
trigger:
  branches:
    include:
      - main

pool:
  name: 'vm-build-agents'

steps:
  - script: |
      echo "========================================"
      echo "  Testing VM Agent"
      echo "========================================"
      echo "Agent Name: $(Agent.Name)"
      echo "Agent OS: $(Agent.OS)"
    displayName: 'Print Agent Info'

  - script: |
      echo "Testing tools..."
      docker --version
      kubectl version --client --short
      az version --query '"azure-cli"' -o tsv
      node --version
      helm version --short
    displayName: 'Test Tools'

  - script: |
      echo "Testing Docker-in-Docker..."
      docker ps
    displayName: 'Test Docker Access'

  - script: |
      echo "========================================"
      echo "  All tests passed!"
      echo "========================================"
    displayName: 'Success'
```

### Step 2: Run Pipeline (GUI)

1. Go to **Pipelines** → **New pipeline**
2. Select **Azure Repos Git**
3. Select repository
4. Select **Existing Azure Pipelines YAML file**
5. Choose `azure-pipelines-test-vm-agent.yml`
6. Click **Run**

### Step 3: Monitor Execution

Watch the pipeline run. You should see:
- Agent: `vm-agent-1`
- All test steps passing

---

## Part H — Run Multiple Agents

You can run multiple agent containers on the same VM.

### Step 1: Run Additional Agents

```bash
# Agent 2
docker run -d \
  --name ado-agent-2 \
  --restart unless-stopped \
  -e AZP_URL="$AZP_URL" \
  -e AZP_TOKEN="$AZP_TOKEN" \
  -e AZP_POOL="$AZP_POOL" \
  -e AZP_AGENT_NAME="vm-agent-2" \
  -v /var/run/docker.sock:/var/run/docker.sock \
  ado-agent:latest

# Agent 3
docker run -d \
  --name ado-agent-3 \
  --restart unless-stopped \
  -e AZP_URL="$AZP_URL" \
  -e AZP_TOKEN="$AZP_TOKEN" \
  -e AZP_POOL="$AZP_POOL" \
  -e AZP_AGENT_NAME="vm-agent-3" \
  -v /var/run/docker.sock:/var/run/docker.sock \
  ado-agent:latest
```

### Step 2: Verify All Agents Running

```bash
docker ps --filter name=ado-agent
```

**Expected Output:**
```
CONTAINER ID   IMAGE              STATUS          NAMES
abc123def456   ado-agent:latest   Up 5 minutes    ado-agent-1
def456ghi789   ado-agent:latest   Up 2 minutes    ado-agent-2
ghi789jkl012   ado-agent:latest   Up 1 minute     ado-agent-3
```

### Step 3: Check in Azure DevOps

Go to **Agent pools** → `vm-build-agents` → **Agents**

You should see 3 agents online.

### Step 4: Quick Script to Launch Multiple Agents

Create `start-agents.sh`:

```bash
#!/bin/bash
# start-agents.sh - Launch multiple ADO agents

AZP_URL="https://dev.azure.com/your-org"
AZP_TOKEN="your-pat-token"
AZP_POOL="vm-build-agents"
NUM_AGENTS=${1:-3}  # Default 3 agents, or pass as argument

echo "Starting $NUM_AGENTS agents..."

for i in $(seq 1 $NUM_AGENTS); do
    echo "Starting agent $i..."
    docker run -d \
      --name ado-agent-$i \
      --restart unless-stopped \
      -e AZP_URL="$AZP_URL" \
      -e AZP_TOKEN="$AZP_TOKEN" \
      -e AZP_POOL="$AZP_POOL" \
      -e AZP_AGENT_NAME="vm-agent-$i" \
      -v /var/run/docker.sock:/var/run/docker.sock \
      ado-agent:latest
done

echo "Done! Check status with: docker ps"
```

Run:
```bash
chmod +x start-agents.sh
./start-agents.sh 5  # Start 5 agents
```

---

## Part I — Docker Compose for Easy Management

Using Docker Compose makes it easier to manage multiple agents.

### Step 1: Install Docker Compose (if not installed)

```bash
# Check if docker compose is available
docker compose version

# If not, install it
sudo apt-get update
sudo apt-get install docker-compose-plugin
```

### Step 2: Create docker-compose.yml

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  ado-agent-1:
    image: ado-agent:latest
    container_name: ado-agent-1
    restart: unless-stopped
    environment:
      - AZP_URL=https://dev.azure.com/your-org
      - AZP_TOKEN=${AZP_TOKEN}
      - AZP_POOL=vm-build-agents
      - AZP_AGENT_NAME=vm-agent-1
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock

  ado-agent-2:
    image: ado-agent:latest
    container_name: ado-agent-2
    restart: unless-stopped
    environment:
      - AZP_URL=https://dev.azure.com/your-org
      - AZP_TOKEN=${AZP_TOKEN}
      - AZP_POOL=vm-build-agents
      - AZP_AGENT_NAME=vm-agent-2
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock

  ado-agent-3:
    image: ado-agent:latest
    container_name: ado-agent-3
    restart: unless-stopped
    environment:
      - AZP_URL=https://dev.azure.com/your-org
      - AZP_TOKEN=${AZP_TOKEN}
      - AZP_POOL=vm-build-agents
      - AZP_AGENT_NAME=vm-agent-3
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
```

### Step 3: Create .env File for Sensitive Data

Create `.env`:

```bash
cat > .env << 'EOF'
AZP_TOKEN=your-pat-token-here
EOF

# Secure the file
chmod 600 .env
```

### Step 4: Manage with Docker Compose

```bash
# Start all agents
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f

# Stop all agents
docker compose down

# Restart all agents
docker compose restart

# Scale to 5 agents (requires extending compose file)
docker compose up -d --scale ado-agent-1=5
```

### Step 5: Docker Compose with Scaling

Updated `docker-compose.yml` for scaling:

```yaml
version: '3.8'

services:
  ado-agent:
    image: ado-agent:latest
    restart: unless-stopped
    environment:
      - AZP_URL=https://dev.azure.com/your-org
      - AZP_TOKEN=${AZP_TOKEN}
      - AZP_POOL=vm-build-agents
      - AZP_AGENT_NAME=vm-agent-{{.TaskSlot}}
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    deploy:
      replicas: 3
```

Run scaled:
```bash
docker compose up -d --scale ado-agent=5
```

---

## Part J — Systemd Service for Auto-Start

Ensure agents start automatically when VM reboots.

### Note: Docker Already Handles This

When you run containers with `--restart unless-stopped`, Docker automatically starts them after reboot.

Verify:
```bash
# Check Docker is enabled
sudo systemctl is-enabled docker

# Check container restart policy
docker inspect ado-agent-1 | grep -A 5 "RestartPolicy"
```

**Expected Output:**
```
"RestartPolicy": {
    "Name": "unless-stopped",
    "MaximumRetryCount": 0
}
```

### Optional: Create Systemd Service for Docker Compose

Create `/etc/systemd/system/ado-agent.service`:

```bash
sudo tee /etc/systemd/system/ado-agent.service << 'EOF'
[Unit]
Description=Azure DevOps Agents (Docker Compose)
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/azureuser/ado-agent-docker
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=0
User=azureuser

[Install]
WantedBy=multi-user.target
EOF

# Enable the service
sudo systemctl daemon-reload
sudo systemctl enable ado-agent.service

# Start the service
sudo systemctl start ado-agent.service

# Check status
sudo systemctl status ado-agent.service
```

---

## Part K — Troubleshooting

### Common Issues

#### Issue 1: Container Won't Start

**Check logs:**
```bash
docker logs ado-agent-1
```

**Common causes:**
- Invalid PAT token
- Wrong AZP_URL
- Pool doesn't exist

#### Issue 2: Agent Shows Offline

**Diagnosis:**
```bash
# Check container status
docker ps -a | grep ado-agent

# If container exited, check logs
docker logs ado-agent-1 --tail 50

# Restart container
docker restart ado-agent-1
```

#### Issue 3: Docker Commands Fail Inside Container

**Check Docker socket mount:**
```bash
docker exec ado-agent-1 docker ps
```

**If error:**
```
Cannot connect to the Docker daemon
```

**Solution:** Ensure Docker socket is mounted:
```bash
docker run ... -v /var/run/docker.sock:/var/run/docker.sock ...
```

#### Issue 4: Permission Denied on Docker Socket

**Solution:**
```bash
# On the host VM, check permissions
ls -la /var/run/docker.sock

# Should show:
# srw-rw---- 1 root docker 0 ... /var/run/docker.sock

# Ensure user is in docker group
sudo usermod -aG docker $USER
newgrp docker
```

#### Issue 5: Agent Not Picking Up Jobs

**Check:**
```bash
# View agent logs
docker logs -f ado-agent-1

# Check pipeline is targeting correct pool
# In YAML: pool: { name: 'vm-build-agents' }
```

### Useful Commands

```bash
# List all agent containers
docker ps -a --filter name=ado-agent

# View logs for specific agent
docker logs ado-agent-1 --tail 100

# Follow logs
docker logs -f ado-agent-1

# Restart all agents
docker restart $(docker ps -q --filter name=ado-agent)

# Stop all agents
docker stop $(docker ps -q --filter name=ado-agent)

# Remove all agents
docker rm -f $(docker ps -aq --filter name=ado-agent)

# Execute shell inside container
docker exec -it ado-agent-1 /bin/bash

# Check container resource usage
docker stats ado-agent-1

# Inspect container configuration
docker inspect ado-agent-1
```

---

## Summary

### What We Built

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Day 42 Part 2 Summary                                      │
│                                                                             │
│  ✅ Verified VM and Docker setup                                            │
│  ✅ Created Azure DevOps agent pool (vm-build-agents)                       │
│  ✅ Generated PAT token for authentication                                  │
│  ✅ Built custom Docker image with Docker, kubectl, az-cli, Node.js, Helm  │
│  ✅ Ran agent container with Docker socket access                           │
│  ✅ Verified agent registration in Azure DevOps                             │
│  ✅ Tested agent with sample pipeline                                       │
│  ✅ Ran multiple agents on single VM                                        │
│  ✅ Configured Docker Compose for easy management                           │
│  ✅ Set up auto-restart on reboot                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Quick Reference Commands

| Task | Command |
|---|---|
| Build image | `docker build -t ado-agent:latest .` |
| Run agent | `docker run -d --name ado-agent-1 ...` |
| Check status | `docker ps` |
| View logs | `docker logs -f ado-agent-1` |
| Restart agent | `docker restart ado-agent-1` |
| Stop agent | `docker stop ado-agent-1` |
| Remove agent | `docker rm -f ado-agent-1` |
| Scale with compose | `docker compose up -d --scale ado-agent=5` |

### Files Created

| File | Purpose |
|---|---|
| `Dockerfile` | Custom agent image |
| `start.sh` | Agent startup script |
| `docker-compose.yml` | Multi-agent management |
| `.env` | PAT token (keep secure!) |
| `start-agents.sh` | Batch launch script |

---

> **Completed:** You now have containerized Azure DevOps agents running on your VM, ready for CI/CD pipelines!

```
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV AZP_URL=""
ENV AZP_TOKEN=""
ENV AZP_POOL=""
ENV AZP_AGENT_NAME=""

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl jq git git-lfs unzip wget \
    apt-transport-https lsb-release gnupg software-properties-common sudo \
    iputils-ping \
    && rm -rf /var/lib/apt/lists/*

RUN curl -sL https://aka.ms/InstallAzureCLIDeb | bash

RUN az aks install-cli

RUN curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
    | tee /etc/apt/sources.list.d/docker.list > /dev/null \
    && apt-get update \
    && apt-get install -y docker-ce-cli \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -m -s /bin/bash azureuser \
    && echo "azureuser ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

WORKDIR /home/azureuser/agent

RUN curl -L -o agent.tar.gz "https://download.agent.dev.azure.com/agent/4.273.0/vsts-agent-linux-x64-4.273.0.tar.gz" \
    && tar xzf agent.tar.gz \
    && rm agent.tar.gz \
    && ls -la

RUN chown -R azureuser:azureuser /home/azureuser

USER azureuser

COPY start.sh .

USER root
RUN chmod +x start.sh

USER azureuser

ENTRYPOINT ["./start.sh"]
```
###
```
#!/bin/bash
set -e

echo "========================================"
echo " Azure DevOps Agent Startup"
echo "========================================"

# Validate required env vars
if [ -z "$AZP_URL" ]; then
    echo "ERROR: AZP_URL not set"
    exit 1
fi

if [ -z "$AZP_TOKEN" ]; then
    echo "ERROR: AZP_TOKEN not set"
    exit 1
fi

if [ -z "$AZP_POOL" ]; then
    echo "ERROR: AZP_POOL not set"
    exit 1
fi

if [ -z "$AZP_AGENT_NAME" ]; then
    export AZP_AGENT_NAME=$(hostname)
fi

echo "URL: $AZP_URL"
echo "Pool: $AZP_POOL"
echo "Agent: $AZP_AGENT_NAME"

# ================================
# CLEAN OLD STATE (IMPORTANT FIX)
# ================================
echo "Cleaning previous agent state..."

rm -rf .agent _work _diag || true

# If config exists, try safe removal (ignore errors)
if [ -f ./config.sh ]; then
    ./config.sh remove --unattended \
        --auth pat \
        --token "$AZP_TOKEN" 2>/dev/null || true
fi

# ================================
# CONFIGURE AGENT
# ================================
./config.sh --unattended \
    --url "$AZP_URL" \
    --auth pat \
    --token "$AZP_TOKEN" \
    --pool "$AZP_POOL" \
    --agent "$AZP_AGENT_NAME" \
    --acceptTeeEula \
    --work "_work_docker"

echo "Agent configured. Starting..."

# ================================
# RUN AGENT
# ================================
exec ./run.sh
```

### 

```
azureuser@aia-mi-vm:~/ado-agent-docker$ cat Dockerfile
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV AZP_URL=""
ENV AZP_TOKEN=""
ENV AZP_POOL=""
ENV AZP_AGENT_NAME=""

# ================================
# Base dependencies
# ================================
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl jq git git-lfs unzip wget \
    apt-transport-https lsb-release gnupg software-properties-common sudo \
    iputils-ping \
    && rm -rf /var/lib/apt/lists/*

# ================================
# Azure CLI + kubectl
# ================================
RUN curl -sL https://aka.ms/InstallAzureCLIDeb | bash
RUN az aks install-cli

# ================================
# Docker CLI (for pipelines)
# ================================
RUN curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
    | tee /etc/apt/sources.list.d/docker.list > /dev/null \
    && apt-get update && apt-get install -y docker-ce-cli \
    && rm -rf /var/lib/apt/lists/*

# ================================
# Node.js (optional build tools)
# ================================
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# ================================
# Create user
# ================================
RUN useradd -m -s /bin/bash azureuser \
    && echo "azureuser ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# ================================
# IMPORTANT: Docker group alignment (FIX)
# Host docker group GID = 988
# ================================
RUN groupadd -g 988 docker || true \
    && usermod -aG docker azureuser

# ================================
# Agent setup
# ================================
WORKDIR /home/azureuser/agent

RUN curl -L -o agent.tar.gz \
    "https://download.agent.dev.azure.com/agent/4.273.0/vsts-agent-linux-x64-4.273.0.tar.gz" \
    && tar xzf agent.tar.gz \
    && rm agent.tar.gz

# Ownership fix
RUN chown -R azureuser:azureuser /home/azureuser

# ================================
# Start script
# ================================
USER azureuser
COPY start.sh ./

USER root
RUN chmod +x start.sh

USER azureuser

ENTRYPOINT ["./start.sh"]
azureuser@aia-mi-vm:~/ado-agent-docker$ cat start.sh
#!/bin/bash
set -e

echo "========================================"
echo "  Azure DevOps Agent Startup"
echo "========================================"

if [ -z "$AZP_URL" ]; then echo "ERROR: AZP_URL not set"; exit 1; fi
if [ -z "$AZP_TOKEN" ]; then echo "ERROR: AZP_TOKEN not set"; exit 1; fi
if [ -z "$AZP_POOL" ]; then echo "ERROR: AZP_POOL not set"; exit 1; fi

if [ -z "$AZP_AGENT_NAME" ]; then
    export AZP_AGENT_NAME=$(hostname)
fi

echo "URL: $AZP_URL"
echo "Pool: $AZP_POOL"
echo "Agent: $AZP_AGENT_NAME"

echo "Checking agent configuration..."

if [ -f .agent ]; then
    echo "Agent already configured. Skipping configuration."
else
    echo "Configuring agent..."

    ./config.sh --unattended \
        --url "$AZP_URL" \
        --auth pat \
        --token "$AZP_TOKEN" \
        --pool "$AZP_POOL" \
        --agent "$AZP_AGENT_NAME" \
        --acceptTeeEula \
        --work "_work_docker"
fi

echo "Starting agent..."
exec ./run.sh

azureuser@aia-mi-vm:~/ado-agent-docker$ docker rm -f ado-agent-1 2>/dev/null || true && docker run -d --name ado-agent-1 --restart always -v /var/run/docker.sock:/var/run/docker.sock -e AZP_URL="https://dev.azure.com/soetintaunghz10/" -e AZP_TOKEN="***" -e AZP_POOL="azureagent" -e AZP_AGENT_NAME="vm-agent-docker-03" -e AZP_AGENT_DOWNGRADE_DISABLED=true ado-agent
```