# Day 35: Azure Repos, Azure DevOps - Build Docker Image, Push to ACR, Deploy on Azure VM

## Overview

In this hands-on lab, we'll build a complete CI/CD pipeline using Azure Repos and Azure DevOps. We'll create a simple Hello World web application, containerize it with Docker, automate the build and push to Azure Container Registry (ACR), and deploy the container to an Azure Virtual Machine.

## Prerequisites

- Azure subscription with contributor access
- Azure DevOps organization
- Basic knowledge of Docker and Git
- SSH client (for key generation)

## Architecture

1. **Source Code**: Azure Repos
2. **CI/CD**: Azure DevOps Pipelines
3. **Container Registry**: Azure Container Registry (ACR)
4. **Deployment Target**: Azure Virtual Machine

## Step 1: Create the Hello World Application

Let's create a simple Node.js Express application that displays "Hello World".

### 1.1 Create Project Directory

```bash
mkdir hello-world-app
cd hello-world-app
```

### 1.2 Create app.js

```javascript
const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Hello World</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        h1 { color: #0078D4; }
      </style>
    </head>
    <body>
      <h1>Hello World from Azure VM!</h1>
      <p>Deployed via Azure DevOps Pipeline</p>
      <p>Container built and pushed to ACR</p>
    </body>
    </html>
  `);
});

app.listen(port, () => {
  console.log(`Hello World app listening at http://localhost:${port}`);
});
```

### 1.3 Create package.json

```json
{
  "name": "hello-world-app",
  "version": "1.0.0",
  "description": "Simple Hello World app",
  "main": "app.js",
  "scripts": {
    "start": "node app.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}
```

### 1.4 Create Dockerfile

```dockerfile
# Use Node.js Alpine image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
```

## Step 2: Push Code to Azure Repos

### 2.1 Create Azure Repos Repository

1. Go to Azure DevOps portal (dev.azure.com)
2. Select your organization
3. Create a new project or use existing
4. Go to Repos > Files
5. Click "Initialize" if empty, or create new repo

### 2.2 Push Code

```bash
# Initialize git if not already
git init

# Add all files
git add .

# Commit
git commit -m "Add Hello World Node.js app with Dockerfile"

# Add remote (replace with your repo URL)
git remote add origin https://dev.azure.com/YOUR_ORG/YOUR_PROJECT/_git/hello-world-app

# Push
git push -u origin main
```

## Step 3: Create Azure Container Registry

### 3.1 Create ACR via Portal

1. Go to Azure Portal
2. Search for "Container registries"
3. Click "Create"
4. Fill details:
   - Subscription: Your subscription
   - Resource group: Create new or use existing
   - Registry name: Unique name (e.g., myacr2024)
   - Location: East US
   - SKU: Basic
5. Click "Review + create" > "Create"

### 3.2 Note the Login Server

After creation, go to the ACR resource > Overview > Login server (e.g., myacr2024.azurecr.io)

## Step 4: Create Azure Virtual Machine

### 4.1 Create VM via Portal

1. Go to Azure Portal
2. Search for "Virtual machines"
3. Click "Create" > "Azure virtual machine"
4. Fill details:
   - Subscription: Your subscription
   - Resource group: Same as ACR or new
   - VM name: hello-world-vm
   - Region: East US
   - Image: Ubuntu 2204 LTS
   - Size: Standard_B1s (1 vCPU, 1 GiB RAM) - cheapest
   - Authentication: SSH public key
   - Username: azureuser
   - SSH public key: Generate new or use existing
   - Public inbound ports: Allow SSH (22) and HTTP (80)
5. Click "Review + create" > "Create"

### 4.2 Generate SSH Key (if needed)

```bash
# Generate SSH key pair
ssh-keygen -t rsa -b 2048 -f ~/.ssh/azure-vm-key

# Copy public key for VM creation
cat ~/.ssh/azure-vm-key.pub
```

### 4.3 Install Docker on VM

After VM is created, connect via SSH:

```bash
ssh -i ~/.ssh/azure-vm-key azureuser@<VM_PUBLIC_IP>
```

Install Docker:

```bash
# Update packages
sudo apt update

# Install Docker
sudo apt install -y docker.io

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group (optional)
sudo usermod -aG docker $USER

# Logout and login again for group changes
exit
```

## Step 5: Create Azure DevOps Pipeline

### 5.1 Create Service Connection for ACR

1. In Azure DevOps > Project Settings > Service connections
2. Click "New service connection" > "Docker Registry"
3. Select "Azure Container Registry"
4. Fill details:
   - Subscription: Your subscription
   - Azure container registry: Select your ACR
   - Service connection name: acr-connection
5. Click "Save"

### 5.2 Create Pipeline

1. Go to Pipelines > New Pipeline
2. Select "Azure Repos Git"
3. Select your repository
4. Choose "Starter pipeline"
5. Replace the YAML with:

```yaml
trigger:
- main

pool:
  vmImage: ubuntu-latest

variables:
  acrName: 'myacr2024'  # Replace with your ACR name

steps:
- task: Docker@2
  displayName: 'Build and Push Docker Image'
  inputs:
    containerRegistry: 'acr-connection'
    repository: 'hello-world'
    command: 'buildAndPush'
    Dockerfile: '**/Dockerfile'
    tags: |
      $(Build.BuildId)
      latest

- task: SSH@0
  displayName: 'Deploy to Azure VM'
  inputs:
    sshEndpoint: 'vm-ssh-connection'
    runOptions: 'inline'
    inline: |
      # Login to ACR
      sudo docker login $(acrName).azurecr.io -u $(acrUsername) -p $(acrPassword)
      
      # Pull the latest image
      sudo docker pull $(acrName).azurecr.io/hello-world:latest
      
      # Stop and remove existing container if running
      sudo docker stop hello-world-app || true
      sudo docker rm hello-world-app || true
      
      # Run the new container
      sudo docker run -d --name hello-world-app -p 80:3000 $(acrName).azurecr.io/hello-world:latest
      
      # Verify
      sudo docker ps
    failOnStdErr: false
```

### 5.3 Create SSH Service Connection

1. In Azure DevOps > Project Settings > Service connections
2. Click "New service connection" > "SSH"
3. Fill details:
   - Host name: Your VM's public IP
   - Port: 22
   - Username: azureuser
   - Private key: Paste the private key content (`cat ~/.ssh/azure-vm-key`)
   - Service connection name: vm-ssh-connection
4. Click "Save"

### 5.4 Add ACR Credentials as Variables

In the pipeline, we need ACR username and password.

For ACR, the username is the ACR name, password is from ACR > Access keys > password.

Go to Pipeline > Edit > Variables > Add:

- acrUsername: myacr2024 (your ACR name)
- acrPassword: (secret) paste the password from ACR access keys

## Step 6: Run the Pipeline

1. Save and run the pipeline
2. Monitor the build and deployment
3. Once complete, access your VM's public IP in browser
4. You should see the Hello World page

## Step 7: Verify Deployment

```bash
# SSH to VM
ssh -i ~/.ssh/azure-vm-key azureuser@<VM_PUBLIC_IP>

# Check running containers
sudo docker ps

# Check app logs
sudo docker logs hello-world-app

# Test locally
curl http://localhost
```

## Troubleshooting

### Common Issues

1. **SSH Connection Failed**: Check VM public IP, SSH key, and firewall rules
2. **Docker Pull Failed**: Verify ACR credentials and network access
3. **Port 80 Not Accessible**: Ensure NSG allows port 80 inbound
4. **App Not Starting**: Check container logs with `docker logs`

### Security Notes

- In production, use managed identity instead of access keys
- Restrict SSH access to specific IPs
- Use Azure Key Vault for secrets

## What You Learned

- Setting up Azure Repos for source control
- Creating Azure DevOps CI/CD pipelines
- Building and pushing Docker images to ACR
- Deploying containers to Azure VMs
- Using SSH for remote deployment automation

## Next Steps

- Add automated testing to the pipeline
- Implement blue-green deployments
- Use Azure Container Instances instead of VMs
- Add monitoring with Azure Application Insights

---

**Congratulations!** You've successfully implemented a complete CI/CD pipeline with Azure DevOps, ACR, and VM deployment. 🎉