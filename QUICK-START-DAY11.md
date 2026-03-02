# Day 11 Quick Start Guide

## Prerequisites

1. **Azure VM** (Ubuntu 20.04 or later)
2. **Azure DevOps** project
3. **SSH access** to VM
4. **Basic knowledge** from Days 1-10

## 5-Minute Setup

### Step 1: Prepare Your VM

```bash
# SSH to your VM
ssh azureuser@<your-vm-ip>

# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install nginx
sudo apt-get install -y nginx

# Create directories
sudo mkdir -p /opt/azure-devops-app/{blue,green,canary}
sudo chown -R $USER:$USER /opt/azure-devops-app
```

### Step 2: Test Application Locally

```bash
# Clone the example app
cd ~
mkdir test-app && cd test-app

# Copy server.js and package.json from example-app/
# Then run:
npm install
PORT=3000 APP_VERSION=1.0.0 DEPLOYMENT_SLOT=blue node server.js

# Test in another terminal:
curl http://localhost:3000/health
```

### Step 3: Configure Azure DevOps

1. **Create SSH Service Connection**
   - Project Settings → Service connections
   - New → SSH
   - Name: `VM-SSH-Connection`
   - Host: Your VM IP
   - Username: azureuser
   - Private Key: Your SSH key

2. **Create Environments**
   - Pipelines → Environments
   - Create: `VM-Blue`, `VM-Green`, `Production`

### Step 4: Deploy

1. **Copy files to your repo**
   ```bash
   # In your local repo
   cp -r example-app/* .
   git add .
   git commit -m "Add Day 11 deployment app"
   git push
   ```

2. **Create pipeline**
   - Pipelines → New pipeline
   - Select your repo
   - Use `azure-pipelines-vm.yml`
   - Run pipeline

### Step 5: Verify

```bash
# On your VM
curl http://localhost/health

# Should return:
# {"status":"healthy","version":"1.0.0",...}
```

## Common Commands

### Check Service Status
```bash
sudo systemctl status azure-devops-app-blue
sudo systemctl status azure-devops-app-green
```

### View Logs
```bash
sudo journalctl -u azure-devops-app-blue -f
```

### Manual Deployment
```bash
cd /tmp/deployment/scripts
./deploy.sh 1.0.0 blue 3001
```

### Switch Traffic
```bash
./switch-traffic.sh blue 3001
```

### Rollback
```bash
./rollback.sh blue 1.0.0
```

## Troubleshooting

### Port Already in Use
```bash
sudo netstat -tulpn | grep 3001
sudo kill <pid>
```

### Service Won't Start
```bash
sudo systemctl status azure-devops-app-blue
sudo journalctl -u azure-devops-app-blue -n 50
```

### Nginx Issues
```bash
sudo nginx -t
sudo systemctl restart nginx
sudo tail -f /var/log/nginx/error.log
```

## What's Next?

1. Try Blue-Green deployment
2. Test Canary deployment
3. Practice rollback
4. Add monitoring
5. Implement feature flags

## Full Documentation

See [day-11-orchestration-release-strategies.md](day-11-orchestration-release-strategies.md) for complete details.
