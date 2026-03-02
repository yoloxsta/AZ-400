# Day 11: Orchestration, Release Strategies & VM Deployment

## What is Orchestration Automation?

Orchestration is the automated coordination of multiple systems, services, and deployments across different environments. It manages the entire release lifecycle from build to production.

## Why Orchestration Matters?

- Coordinate complex multi-service deployments
- Ensure consistent deployment order
- Handle dependencies between services
- Enable advanced release strategies
- Automate rollback procedures
- Reduce human error

## Release Strategies Overview

1. **Blue-Green**: Two identical environments, instant switch
2. **Canary**: Gradual rollout to subset of users
3. **Rolling**: Sequential update of instances
4. **A/B Testing**: Feature comparison with traffic split
5. **Feature Flags**: Deploy disabled, enable selectively

## Lab 11: Complete Orchestration Solution

### Part 1: Prepare Application for VM Deployment

1. **Create Application Structure**
   ```bash
   git checkout main
   git pull
   git checkout -b feature/vm-deployment
   mkdir -p app
   cd app
   ```

2. **Create `app/server.js`**
   ```javascript
   const http = require('http');
   const fs = require('fs');
   const path = require('path');
   
   const PORT = process.env.PORT || 3000;
   const VERSION = process.env.APP_VERSION || '1.0.0';
   const ENVIRONMENT = process.env.ENVIRONMENT || 'production';
   const DEPLOYMENT_SLOT = process.env.DEPLOYMENT_SLOT || 'blue';
   
   // Health check endpoint
   const healthStatus = {
     status: 'healthy',
     version: VERSION,
     environment: ENVIRONMENT,
     slot: DEPLOYMENT_SLOT,
     uptime: 0,
     startTime: new Date().toISOString()
   };
   
   const server = http.createServer((req, res) => {
     const startTime = Date.now();
     
     // Logging
     console.log(JSON.stringify({
       timestamp: new Date().toISOString(),
       method: req.method,
       url: req.url,
       userAgent: req.headers['user-agent']
     }));
     
     // Routes
     if (req.url === '/' || req.url === '/index.html') {
       fs.readFile(path.join(__dirname, 'public', 'index.html'), (err, data) => {
         if (err) {
           res.writeHead(500, { 'Content-Type': 'text/plain' });
           res.end('Error loading page');
           return;
         }
         
         // Inject version info
         let html = data.toString();
         html = html.replace('{{VERSION}}', VERSION);
         html = html.replace('{{ENVIRONMENT}}', ENVIRONMENT);
         html = html.replace('{{SLOT}}', DEPLOYMENT_SLOT);
         
         res.writeHead(200, { 'Content-Type': 'text/html' });
         res.end(html);
       });
     }
     else if (req.url === '/health') {
       healthStatus.uptime = Math.floor((Date.now() - new Date(healthStatus.startTime).getTime()) / 1000);
       res.writeHead(200, { 'Content-Type': 'application/json' });
       res.end(JSON.stringify(healthStatus));
     }
     else if (req.url === '/ready') {
       // Readiness check - can handle traffic
       res.writeHead(200, { 'Content-Type': 'application/json' });
       res.end(JSON.stringify({ ready: true }));
     }
     else if (req.url === '/metrics') {
       const metrics = {
         requests: global.requestCount || 0,
         errors: global.errorCount || 0,
         avgResponseTime: global.avgResponseTime || 0
       };
       res.writeHead(200, { 'Content-Type': 'application/json' });
       res.end(JSON.stringify(metrics));
     }
     else {
       res.writeHead(404, { 'Content-Type': 'text/plain' });
       res.end('Not Found');
     }
     
     // Track metrics
     const duration = Date.now() - startTime;
     global.requestCount = (global.requestCount || 0) + 1;
     global.avgResponseTime = ((global.avgResponseTime || 0) + duration) / 2;
   });
   
   server.listen(PORT, () => {
     console.log(JSON.stringify({
       message: 'Server started',
       port: PORT,
       version: VERSION,
       environment: ENVIRONMENT,
       slot: DEPLOYMENT_SLOT,
       timestamp: new Date().toISOString()
     }));
   });
   
   // Graceful shutdown
   process.on('SIGTERM', () => {
     console.log('SIGTERM received, shutting down gracefully');
     healthStatus.status = 'shutting_down';
     
     server.close(() => {
       console.log('Server closed');
       process.exit(0);
     });
     
     // Force shutdown after 30 seconds
     setTimeout(() => {
       console.error('Forced shutdown');
       process.exit(1);
     }, 30000);
   });
   
   module.exports = server;
   ```

3. **Create `app/public/index.html`**
   ```html
   <!DOCTYPE html>
   <html lang="en">
   <head>
       <meta charset="UTF-8">
       <meta name="viewport" content="width=device-width, initial-scale=1.0">
       <title>Azure DevOps Deployment</title>
       <style>
           * { margin: 0; padding: 0; box-sizing: border-box; }
           body {
               font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
               background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
               min-height: 100vh;
               display: flex;
               justify-content: center;
               align-items: center;
               padding: 20px;
           }
           .container {
               background: white;
               padding: 40px;
               border-radius: 10px;
               box-shadow: 0 10px 40px rgba(0,0,0,0.2);
               max-width: 600px;
               width: 100%;
           }
           h1 { color: #333; margin-bottom: 20px; }
           .info-grid {
               display: grid;
               grid-template-columns: 1fr 1fr;
               gap: 15px;
               margin: 20px 0;
           }
           .info-card {
               background: #f5f5f5;
               padding: 15px;
               border-radius: 5px;
               border-left: 4px solid #667eea;
           }
           .info-card label {
               display: block;
               font-size: 12px;
               color: #666;
               margin-bottom: 5px;
               text-transform: uppercase;
           }
           .info-card .value {
               font-size: 18px;
               font-weight: bold;
               color: #333;
           }
           .status {
               display: inline-block;
               padding: 5px 15px;
               border-radius: 20px;
               font-size: 14px;
               font-weight: bold;
           }
           .status.healthy { background: #4caf50; color: white; }
           .status.blue { background: #2196f3; color: white; }
           .status.green { background: #4caf50; color: white; }
           button {
               background: #667eea;
               color: white;
               border: none;
               padding: 10px 20px;
               border-radius: 5px;
               cursor: pointer;
               margin: 5px;
           }
           button:hover { background: #5568d3; }
           #metrics { margin-top: 20px; }
       </style>
   </head>
   <body>
       <div class="container">
           <h1>🚀 Azure DevOps Deployment</h1>
           <p>Day 11: Orchestration & Release Strategies</p>
           
           <div class="info-grid">
               <div class="info-card">
                   <label>Version</label>
                   <div class="value">{{VERSION}}</div>
               </div>
               <div class="info-card">
                   <label>Environment</label>
                   <div class="value">{{ENVIRONMENT}}</div>
               </div>
               <div class="info-card">
                   <label>Deployment Slot</label>
                   <div class="value">
                       <span class="status {{SLOT}}">{{SLOT}}</span>
                   </div>
               </div>
               <div class="info-card">
                   <label>Status</label>
                   <div class="value">
                       <span class="status healthy" id="status">Loading...</span>
                   </div>
               </div>
           </div>
           
           <div>
               <button onclick="checkHealth()">Check Health</button>
               <button onclick="getMetrics()">View Metrics</button>
           </div>
           
           <div id="metrics"></div>
       </div>
       
       <script>
           async function checkHealth() {
               try {
                   const response = await fetch('/health');
                   const data = await response.json();
                   document.getElementById('status').textContent = data.status;
                   document.getElementById('status').className = 'status ' + data.status;
                   alert('Health: ' + data.status + '\nUptime: ' + data.uptime + 's');
               } catch (error) {
                   alert('Health check failed: ' + error.message);
               }
           }
           
           async function getMetrics() {
               try {
                   const response = await fetch('/metrics');
                   const data = await response.json();
                   document.getElementById('metrics').innerHTML = `
                       <h3>Metrics</h3>
                       <p>Requests: ${data.requests}</p>
                       <p>Errors: ${data.errors}</p>
                       <p>Avg Response Time: ${data.avgResponseTime.toFixed(2)}ms</p>
                   `;
               } catch (error) {
                   alert('Failed to get metrics: ' + error.message);
               }
           }
           
           // Auto health check on load
           checkHealth();
       </script>
   </body>
   </html>
   ```

4. **Create `app/package.json`**
   ```json
   {
     "name": "azure-devops-app",
     "version": "1.0.0",
     "description": "Azure DevOps deployment demo",
     "main": "server.js",
     "scripts": {
       "start": "node server.js",
       "test": "jest",
       "dev": "nodemon server.js"
     },
     "keywords": ["azure", "devops", "deployment"],
     "author": "Your Name",
     "license": "MIT",
     "dependencies": {},
     "devDependencies": {
       "jest": "^29.0.0",
       "nodemon": "^3.0.0"
     }
   }
   ```

### Part 2: Deployment Scripts

1. **Create `scripts/deploy.sh`**
   ```bash
   #!/bin/bash
   
   # Deployment script for Linux VM
   set -e
   
   APP_NAME="azure-devops-app"
   APP_VERSION=$1
   DEPLOYMENT_SLOT=$2
   PORT=$3
   
   echo "========================================="
   echo "Deploying $APP_NAME"
   echo "Version: $APP_VERSION"
   echo "Slot: $DEPLOYMENT_SLOT"
   echo "Port: $PORT"
   echo "========================================="
   
   # Create deployment directory
   DEPLOY_DIR="/opt/$APP_NAME/$DEPLOYMENT_SLOT"
   sudo mkdir -p $DEPLOY_DIR
   
   # Extract application
   echo "Extracting application..."
   sudo unzip -o app-$APP_VERSION.zip -d $DEPLOY_DIR
   
   # Install dependencies
   echo "Installing dependencies..."
   cd $DEPLOY_DIR
   sudo npm install --production
   
   # Create systemd service
   echo "Creating systemd service..."
   sudo tee /etc/systemd/system/$APP_NAME-$DEPLOYMENT_SLOT.service > /dev/null <<EOF
   [Unit]
   Description=$APP_NAME $DEPLOYMENT_SLOT slot
   After=network.target
   
   [Service]
   Type=simple
   User=azureuser
   WorkingDirectory=$DEPLOY_DIR
   Environment="PORT=$PORT"
   Environment="APP_VERSION=$APP_VERSION"
   Environment="DEPLOYMENT_SLOT=$DEPLOYMENT_SLOT"
   Environment="ENVIRONMENT=production"
   ExecStart=/usr/bin/node $DEPLOY_DIR/server.js
   Restart=on-failure
   RestartSec=10
   StandardOutput=journal
   StandardError=journal
   SyslogIdentifier=$APP_NAME-$DEPLOYMENT_SLOT
   
   [Install]
   WantedBy=multi-user.target
   EOF
   
   # Reload systemd
   sudo systemctl daemon-reload
   
   # Start service
   echo "Starting service..."
   sudo systemctl enable $APP_NAME-$DEPLOYMENT_SLOT
   sudo systemctl restart $APP_NAME-$DEPLOYMENT_SLOT
   
   # Wait for service to be ready
   echo "Waiting for service to be ready..."
   sleep 5
   
   # Health check
   for i in {1..30}; do
       if curl -f http://localhost:$PORT/health > /dev/null 2>&1; then
           echo "✓ Service is healthy"
           exit 0
       fi
       echo "Waiting for service... ($i/30)"
       sleep 2
   done
   
   echo "✗ Service failed to start"
   sudo systemctl status $APP_NAME-$DEPLOYMENT_SLOT
   exit 1
   ```

2. **Create `scripts/rollback.sh`**
   ```bash
   #!/bin/bash
   
   # Rollback script
   set -e
   
   APP_NAME="azure-devops-app"
   CURRENT_SLOT=$1
   PREVIOUS_VERSION=$2
   
   echo "========================================="
   echo "Rolling back $APP_NAME"
   echo "Current Slot: $CURRENT_SLOT"
   echo "Previous Version: $PREVIOUS_VERSION"
   echo "========================================="
   
   # Stop current service
   echo "Stopping current service..."
   sudo systemctl stop $APP_NAME-$CURRENT_SLOT
   
   # Restore previous version
   DEPLOY_DIR="/opt/$APP_NAME/$CURRENT_SLOT"
   BACKUP_DIR="/opt/$APP_NAME/backups/$PREVIOUS_VERSION"
   
   if [ -d "$BACKUP_DIR" ]; then
       echo "Restoring from backup..."
       sudo rm -rf $DEPLOY_DIR
       sudo cp -r $BACKUP_DIR $DEPLOY_DIR
   else
       echo "✗ Backup not found: $BACKUP_DIR"
       exit 1
   fi
   
   # Restart service
   echo "Restarting service..."
   sudo systemctl start $APP_NAME-$CURRENT_SLOT
   
   # Health check
   sleep 5
   PORT=$(sudo systemctl show -p Environment $APP_NAME-$CURRENT_SLOT | grep -oP 'PORT=\K\d+')
   
   if curl -f http://localhost:$PORT/health > /dev/null 2>&1; then
       echo "✓ Rollback successful"
       exit 0
   else
       echo "✗ Rollback failed"
       exit 1
   fi
   ```

3. **Create `scripts/switch-traffic.sh`**
   ```bash
   #!/bin/bash
   
   # Traffic switching script for Blue-Green deployment
   set -e
   
   NEW_SLOT=$1
   NEW_PORT=$2
   
   echo "========================================="
   echo "Switching traffic to $NEW_SLOT slot"
   echo "Port: $NEW_PORT"
   echo "========================================="
   
   # Update nginx configuration
   sudo tee /etc/nginx/sites-available/default > /dev/null <<EOF
   upstream app_backend {
       server localhost:$NEW_PORT;
   }
   
   server {
       listen 80;
       server_name _;
       
       location / {
           proxy_pass http://app_backend;
           proxy_http_version 1.1;
           proxy_set_header Upgrade \$http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host \$host;
           proxy_cache_bypass \$http_upgrade;
           proxy_set_header X-Real-IP \$remote_addr;
           proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
       }
       
       location /health {
           proxy_pass http://app_backend/health;
           access_log off;
       }
   }
   EOF
   
   # Test nginx configuration
   sudo nginx -t
   
   # Reload nginx
   echo "Reloading nginx..."
   sudo systemctl reload nginx
   
   echo "✓ Traffic switched to $NEW_SLOT slot"
   ```

4. **Create `scripts/canary-deploy.sh`**
   ```bash
   #!/bin/bash
   
   # Canary deployment script
   set -e
   
   CANARY_PORT=$1
   STABLE_PORT=$2
   CANARY_WEIGHT=$3  # Percentage (e.g., 10 for 10%)
   
   echo "========================================="
   echo "Canary Deployment"
   echo "Canary Port: $CANARY_PORT (Weight: $CANARY_WEIGHT%)"
   echo "Stable Port: $STABLE_PORT (Weight: $((100-CANARY_WEIGHT))%)"
   echo "========================================="
   
   # Update nginx for weighted load balancing
   sudo tee /etc/nginx/sites-available/default > /dev/null <<EOF
   upstream app_backend {
       server localhost:$STABLE_PORT weight=$((100-CANARY_WEIGHT));
       server localhost:$CANARY_PORT weight=$CANARY_WEIGHT;
   }
   
   server {
       listen 80;
       server_name _;
       
       location / {
           proxy_pass http://app_backend;
           proxy_http_version 1.1;
           proxy_set_header Upgrade \$http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host \$host;
           proxy_cache_bypass \$http_upgrade;
       }
   }
   EOF
   
   sudo nginx -t
   sudo systemctl reload nginx
   
   echo "✓ Canary deployment configured: $CANARY_WEIGHT% traffic to canary"
   ```

### Part 3: Azure Pipeline for VM Deployment

1. **Create `azure-pipelines-vm.yml`**
   ```yaml
   trigger:
     branches:
       include:
         - main
   
   variables:
     vmImageName: 'ubuntu-latest'
     appVersion: '$(Build.BuildNumber)'
     
   stages:
   # ============================================
   # STAGE 1: BUILD
   # ============================================
   - stage: Build
     displayName: 'Build Application'
     jobs:
     - job: BuildJob
       displayName: 'Build and Package'
       pool:
         vmImage: $(vmImageName)
       steps:
       - task: NodeTool@0
         inputs:
           versionSpec: '18.x'
         displayName: 'Install Node.js'
       
       - script: |
           cd app
           npm install
           npm test
         displayName: 'Install dependencies and test'
       
       - task: ArchiveFiles@2
         inputs:
           rootFolderOrFile: '$(Build.SourcesDirectory)/app'
           includeRootFolder: false
           archiveType: 'zip'
           archiveFile: '$(Build.ArtifactStagingDirectory)/app-$(appVersion).zip'
           replaceExistingArchive: true
         displayName: 'Archive application'
       
       - task: CopyFiles@2
         inputs:
           SourceFolder: '$(Build.SourcesDirectory)/scripts'
           Contents: '**'
           TargetFolder: '$(Build.ArtifactStagingDirectory)/scripts'
         displayName: 'Copy deployment scripts'
       
       - task: PublishBuildArtifacts@1
         inputs:
           PathtoPublish: '$(Build.ArtifactStagingDirectory)'
           ArtifactName: 'drop'
         displayName: 'Publish artifacts'
   
   # ============================================
   # STAGE 2: DEPLOY TO BLUE SLOT (STAGING)
   # ============================================
   - stage: DeployBlue
     displayName: 'Deploy to Blue Slot'
     dependsOn: Build
     condition: succeeded()
     variables:
       deploymentSlot: 'blue'
       appPort: '3001'
     jobs:
     - deployment: DeployBlueSlot
       displayName: 'Deploy to Blue Environment'
       environment: 'VM-Blue'
       pool:
         vmImage: $(vmImageName)
       strategy:
         runOnce:
           deploy:
             steps:
             - download: current
               artifact: drop
             
             - task: CopyFilesOverSSH@0
               inputs:
                 sshEndpoint: 'VM-SSH-Connection'
                 sourceFolder: '$(Pipeline.Workspace)/drop'
                 contents: '**'
                 targetFolder: '/tmp/deployment'
                 cleanTargetFolder: true
               displayName: 'Copy files to VM'
             
             - task: SSH@0
               inputs:
                 sshEndpoint: 'VM-SSH-Connection'
                 runOptions: 'inline'
                 inline: |
                   cd /tmp/deployment
                   chmod +x scripts/deploy.sh
                   ./scripts/deploy.sh $(appVersion) $(deploymentSlot) $(appPort)
               displayName: 'Deploy to Blue slot'
             
             - task: SSH@0
               inputs:
                 sshEndpoint: 'VM-SSH-Connection'
                 runOptions: 'inline'
                 inline: |
                   # Health check
                   curl -f http://localhost:$(appPort)/health || exit 1
                   echo "Blue slot is healthy"
               displayName: 'Health check Blue slot'
   
   # ============================================
   # STAGE 3: SMOKE TESTS ON BLUE
   # ============================================
   - stage: SmokeTestBlue
     displayName: 'Smoke Test Blue Slot'
     dependsOn: DeployBlue
     jobs:
     - job: SmokeTest
       displayName: 'Run Smoke Tests'
       pool:
         vmImage: $(vmImageName)
       steps:
       - task: SSH@0
         inputs:
           sshEndpoint: 'VM-SSH-Connection'
           runOptions: 'inline'
           inline: |
             echo "Running smoke tests on Blue slot..."
             
             # Test health endpoint
             response=$(curl -s http://localhost:3001/health)
             echo "Health response: $response"
             
             # Test main page
             status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/)
             if [ $status -eq 200 ]; then
               echo "✓ Main page test passed"
             else
               echo "✗ Main page test failed"
               exit 1
             fi
             
             # Test metrics endpoint
             curl -f http://localhost:3001/metrics || exit 1
             echo "✓ All smoke tests passed"
         displayName: 'Smoke tests'
   
   # ============================================
   # STAGE 4: SWITCH TRAFFIC (BLUE-GREEN)
   # ============================================
   - stage: SwitchTraffic
     displayName: 'Switch Traffic to Blue'
     dependsOn: SmokeTestBlue
     jobs:
     - deployment: SwitchToBlue
       displayName: 'Switch Production Traffic'
       environment: 'Production'
       pool:
         vmImage: $(vmImageName)
       strategy:
         runOnce:
           deploy:
             steps:
             - download: current
               artifact: drop
             
             - task: SSH@0
               inputs:
                 sshEndpoint: 'VM-SSH-Connection'
                 runOptions: 'inline'
                 inline: |
                   cd /tmp/deployment/scripts
                   chmod +x switch-traffic.sh
                   ./switch-traffic.sh blue 3001
               displayName: 'Switch traffic to Blue'
             
             - script: |
                 echo "Waiting for traffic switch to stabilize..."
                 sleep 10
               displayName: 'Wait for stabilization'
             
             - task: SSH@0
               inputs:
                 sshEndpoint: 'VM-SSH-Connection'
                 runOptions: 'inline'
                 inline: |
                   # Verify production is serving Blue slot
                   response=$(curl -s http://localhost/health)
                   echo "Production health: $response"
                   
                   version=$(echo $response | grep -oP '"version":"\K[^"]+')
                   if [ "$version" == "$(appVersion)" ]; then
                     echo "✓ Production is serving correct version"
                   else
                     echo "✗ Version mismatch"
                     exit 1
                   fi
               displayName: 'Verify production'
   
   # ============================================
   # STAGE 5: MONITOR AND VALIDATE
   # ============================================
   - stage: Monitor
     displayName: 'Monitor Production'
     dependsOn: SwitchTraffic
     jobs:
     - job: MonitorJob
       displayName: 'Monitor Metrics'
       pool:
         vmImage: $(vmImageName)
       steps:
       - task: SSH@0
         inputs:
           sshEndpoint: 'VM-SSH-Connection'
           runOptions: 'inline'
           inline: |
             echo "Monitoring production for 2 minutes..."
             
             for i in {1..12}; do
               echo "Check $i/12"
               
               # Get metrics
               metrics=$(curl -s http://localhost/metrics)
               echo "Metrics: $metrics"
               
               # Check health
               health=$(curl -s http://localhost/health)
               status=$(echo $health | grep -oP '"status":"\K[^"]+')
               
               if [ "$status" != "healthy" ]; then
                 echo "✗ Unhealthy status detected!"
                 exit 1
               fi
               
               sleep 10
             done
             
             echo "✓ Monitoring completed successfully"
         displayName: 'Monitor production'
   
   # ============================================
   # STAGE 6: CLEANUP OLD SLOT
   # ============================================
   - stage: Cleanup
     displayName: 'Cleanup Green Slot'
     dependsOn: Monitor
     condition: succeeded()
     jobs:
     - job: CleanupJob
       displayName: 'Stop Green Slot'
       pool:
         vmImage: $(vmImageName)
       steps:
       - task: SSH@0
         inputs:
           sshEndpoint: 'VM-SSH-Connection'
           runOptions: 'inline'
           inline: |
             echo "Stopping Green slot..."
             sudo systemctl stop azure-devops-app-green || true
             echo "✓ Green slot stopped"
         displayName: 'Stop old slot'
   ```

2. **Create Canary Deployment Pipeline `azure-pipelines-canary.yml`**
   ```yaml
   trigger: none  # Manual trigger only
   
   parameters:
   - name: canaryPercentage
     displayName: 'Canary Traffic Percentage'
     type: number
     default: 10
     values:
     - 10
     - 25
     - 50
     - 75
     - 100
   
   variables:
     vmImageName: 'ubuntu-latest'
     appVersion: '$(Build.BuildNumber)'
     stablePort: '3000'
     canaryPort: '3002'
   
   stages:
   # Build stage (same as before)
   - stage: Build
     displayName: 'Build Application'
     jobs:
     - job: BuildJob
       displayName: 'Build'
       pool:
         vmImage: $(vmImageName)
       steps:
       - task: ArchiveFiles@2
         inputs:
           rootFolderOrFile: '$(Build.SourcesDirectory)/app'
           archiveFile: '$(Build.ArtifactStagingDirectory)/app-$(appVersion).zip'
       - publish: $(Build.ArtifactStagingDirectory)
         artifact: drop
   
   # Deploy Canary
   - stage: DeployCanary
     displayName: 'Deploy Canary (${{ parameters.canaryPercentage }}%)'
     dependsOn: Build
     jobs:
     - deployment: DeployCanarySlot
       environment: 'Canary'
       pool:
         vmImage: $(vmImageName)
       strategy:
         runOnce:
           deploy:
             steps:
             - download: current
               artifact: drop
             
             - task: SSH@0
               inputs:
                 sshEndpoint: 'VM-SSH-Connection'
                 runOptions: 'inline'
                 inline: |
                   cd /tmp/deployment
                   ./scripts/deploy.sh $(appVersion) canary $(canaryPort)
               displayName: 'Deploy Canary'
             
             - task: SSH@0
               inputs:
                 sshEndpoint: 'VM-SSH-Connection'
                 runOptions: 'inline'
                 inline: |
                   cd /tmp/deployment/scripts
                   ./canary-deploy.sh $(canaryPort) $(stablePort) ${{ parameters.canaryPercentage }}
               displayName: 'Configure Canary Traffic'
   
   # Monitor Canary
   - stage: MonitorCanary
     displayName: 'Monitor Canary'
     dependsOn: DeployCanary
     jobs:
     - job: MonitorJob
       displayName: 'Monitor Metrics'
       pool:
         vmImage: $(vmImageName)
       steps:
       - task: SSH@0
         inputs:
           sshEndpoint: 'VM-SSH-Connection'
           runOptions: 'inline'
           inline: |
             echo "Monitoring canary deployment..."
             
             for i in {1..30}; do
               # Get metrics from both
               stable_metrics=$(curl -s http://localhost:$(stablePort)/metrics)
               canary_metrics=$(curl -s http://localhost:$(canaryPort)/metrics)
               
               echo "Stable: $stable_metrics"
               echo "Canary: $canary_metrics"
               
               # Compare error rates
               stable_errors=$(echo $stable_metrics | grep -oP '"errors":\K\d+')
               canary_errors=$(echo $canary_metrics | grep -oP '"errors":\K\d+')
               
               if [ $canary_errors -gt $((stable_errors * 2)) ]; then
                 echo "✗ Canary error rate too high!"
                 exit 1
               fi
               
               sleep 10
             done
             
             echo "✓ Canary monitoring passed"
         displayName: 'Monitor canary'
   
   # Promote or Rollback
   - stage: Decision
     displayName: 'Promote or Rollback'
     dependsOn: MonitorCanary
     jobs:
     - job: PromoteJob
       displayName: 'Promote Canary to 100%'
       pool:
         vmImage: $(vmImageName)
       steps:
       - task: SSH@0
         inputs:
           sshEndpoint: 'VM-SSH-Connection'
           runOptions: 'inline'
           inline: |
             cd /tmp/deployment/scripts
             ./canary-deploy.sh $(canaryPort) $(stablePort) 100
             echo "✓ Canary promoted to 100%"
         displayName: 'Promote canary'
   ```

3. **Create Rollback Pipeline `azure-pipelines-rollback.yml`**
   ```yaml
   trigger: none  # Manual only
   
   parameters:
   - name: targetEnvironment
     displayName: 'Environment to Rollback'
     type: string
     default: 'production'
     values:
     - production
     - staging
   
   - name: previousVersion
     displayName: 'Version to Rollback To'
     type: string
   
   variables:
     vmImageName: 'ubuntu-latest'
   
   stages:
   - stage: Rollback
     displayName: 'Rollback to Previous Version'
     jobs:
     - deployment: RollbackJob
       displayName: 'Execute Rollback'
       environment: 'Production-Rollback'
       pool:
         vmImage: $(vmImageName)
       strategy:
         runOnce:
           deploy:
             steps:
             - task: SSH@0
               inputs:
                 sshEndpoint: 'VM-SSH-Connection'
                 runOptions: 'inline'
                 inline: |
                   echo "========================================="
                   echo "ROLLBACK INITIATED"
                   echo "Environment: ${{ parameters.targetEnvironment }}"
                   echo "Target Version: ${{ parameters.previousVersion }}"
                   echo "========================================="
                   
                   # Determine current slot
                   current_slot=$(curl -s http://localhost/health | grep -oP '"slot":"\K[^"]+')
                   echo "Current slot: $current_slot"
                   
                   # Execute rollback
                   cd /tmp/deployment/scripts
                   chmod +x rollback.sh
                   ./rollback.sh $current_slot ${{ parameters.previousVersion }}
               displayName: 'Execute rollback script'
             
             - task: SSH@0
               inputs:
                 sshEndpoint: 'VM-SSH-Connection'
                 runOptions: 'inline'
                 inline: |
                   echo "Verifying rollback..."
                   
                   # Wait for service
                   sleep 10
                   
                   # Check health
                   health=$(curl -s http://localhost/health)
                   version=$(echo $health | grep -oP '"version":"\K[^"]+')
                   status=$(echo $health | grep -oP '"status":"\K[^"]+')
                   
                   echo "Current version: $version"
                   echo "Status: $status"
                   
                   if [ "$status" == "healthy" ]; then
                     echo "✓ Rollback successful"
                   else
                     echo "✗ Rollback failed"
                     exit 1
                   fi
               displayName: 'Verify rollback'
             
             - script: |
                 echo "Creating incident report..."
                 echo "Rollback completed at $(date)"
                 echo "Previous version: ${{ parameters.previousVersion }}"
               displayName: 'Create incident report'
   ```

### Part 4: VM Setup and Configuration

1. **Create VM Setup Script `scripts/vm-setup.sh`**
   ```bash
   #!/bin/bash
   
   # VM initial setup script
   # Run this once on a new VM
   
   set -e
   
   echo "========================================="
   echo "Setting up Azure DevOps VM"
   echo "========================================="
   
   # Update system
   echo "Updating system..."
   sudo apt-get update
   sudo apt-get upgrade -y
   
   # Install Node.js
   echo "Installing Node.js..."
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install nginx
   echo "Installing nginx..."
   sudo apt-get install -y nginx
   
   # Install other tools
   sudo apt-get install -y curl wget unzip git
   
   # Create application directories
   echo "Creating application directories..."
   sudo mkdir -p /opt/azure-devops-app/{blue,green,canary,backups}
   sudo chown -R $USER:$USER /opt/azure-devops-app
   
   # Create deployment directory
   sudo mkdir -p /tmp/deployment
   sudo chown -R $USER:$USER /tmp/deployment
   
   # Configure firewall
   echo "Configuring firewall..."
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw --force enable
   
   # Start nginx
   sudo systemctl enable nginx
   sudo systemctl start nginx
   
   # Create log directory
   sudo mkdir -p /var/log/azure-devops-app
   sudo chown -R $USER:$USER /var/log/azure-devops-app
   
   echo "========================================="
   echo "✓ VM setup completed"
   echo "========================================="
   echo "Node version: $(node --version)"
   echo "npm version: $(npm --version)"
   echo "nginx version: $(nginx -v 2>&1)"
   ```

2. **Create Service Connection in Azure DevOps**
   
   Manual steps:
   - Go to Project Settings → Service connections
   - Click "New service connection"
   - Select "SSH"
   - Fill in:
     - Connection name: `VM-SSH-Connection`
     - Host: Your VM IP address
     - Port: 22
     - Username: azureuser (or your VM user)
     - Password or Private Key
   - Click "Verify and save"

### Part 5: Complete Deployment Workflow

1. **Create `deployment-workflow.md`**
   ```markdown
   # Deployment Workflow Guide
   
   ## Blue-Green Deployment Process
   
   ### Step 1: Initial State
   - Green slot: Running v1.0.0 on port 3000
   - Nginx: Routing traffic to port 3000
   - Blue slot: Inactive
   
   ### Step 2: Deploy to Blue
   ```bash
   # Pipeline deploys v1.1.0 to Blue slot (port 3001)
   ./scripts/deploy.sh 1.1.0 blue 3001
   ```
   
   ### Step 3: Test Blue Slot
   ```bash
   # Run smoke tests
   curl http://localhost:3001/health
   curl http://localhost:3001/
   ```
   
   ### Step 4: Switch Traffic
   ```bash
   # Update nginx to route to Blue (3001)
   ./scripts/switch-traffic.sh blue 3001
   ```
   
   ### Step 5: Monitor
   - Watch metrics for 5-10 minutes
   - Check error rates
   - Verify user experience
   
   ### Step 6: Cleanup
   ```bash
   # Stop Green slot
   sudo systemctl stop azure-devops-app-green
   ```
   
   ## Canary Deployment Process
   
   ### Phase 1: 10% Traffic
   ```bash
   ./scripts/canary-deploy.sh 3002 3000 10
   ```
   - Monitor for 30 minutes
   - Compare metrics between canary and stable
   
   ### Phase 2: 25% Traffic
   ```bash
   ./scripts/canary-deploy.sh 3002 3000 25
   ```
   - Monitor for 30 minutes
   
   ### Phase 3: 50% Traffic
   ```bash
   ./scripts/canary-deploy.sh 3002 3000 50
   ```
   - Monitor for 30 minutes
   
   ### Phase 4: 100% Traffic
   ```bash
   ./scripts/canary-deploy.sh 3002 3000 100
   ```
   - Canary becomes new stable
   
   ## Rollback Process
   
   ### Automatic Rollback Triggers
   - Error rate > 5%
   - Response time > 2x baseline
   - Health check failures
   - Critical bugs reported
   
   ### Manual Rollback
   ```bash
   # Execute rollback script
   ./scripts/rollback.sh blue 1.0.0
   
   # Or use Azure Pipeline
   # Run: azure-pipelines-rollback.yml
   # Parameters:
   #   - targetEnvironment: production
   #   - previousVersion: 1.0.0
   ```
   
   ### Rollback Verification
   1. Check service status
   2. Verify version
   3. Run smoke tests
   4. Monitor metrics
   5. Create incident report
   ```

2. **Create Monitoring Script `scripts/monitor.sh`**
   ```bash
   #!/bin/bash
   
   # Continuous monitoring script
   
   STABLE_PORT=${1:-3000}
   CANARY_PORT=${2:-3002}
   DURATION=${3:-300}  # 5 minutes default
   
   echo "Monitoring for $DURATION seconds..."
   echo "Stable: localhost:$STABLE_PORT"
   echo "Canary: localhost:$CANARY_PORT"
   
   start_time=$(date +%s)
   
   while true; do
       current_time=$(date +%s)
       elapsed=$((current_time - start_time))
       
       if [ $elapsed -ge $DURATION ]; then
           echo "Monitoring completed"
           break
       fi
       
       # Get metrics
       stable_health=$(curl -s http://localhost:$STABLE_PORT/health 2>/dev/null || echo '{"status":"down"}')
       canary_health=$(curl -s http://localhost:$CANARY_PORT/health 2>/dev/null || echo '{"status":"down"}')
       
       stable_status=$(echo $stable_health | grep -oP '"status":"\K[^"]+')
       canary_status=$(echo $canary_health | grep -oP '"status":"\K[^"]+')
       
       timestamp=$(date '+%Y-%m-%d %H:%M:%S')
       echo "[$timestamp] Stable: $stable_status | Canary: $canary_status"
       
       # Alert if unhealthy
       if [ "$canary_status" != "healthy" ]; then
           echo "⚠️  ALERT: Canary is unhealthy!"
       fi
       
       sleep 10
   done
   ```

### Part 6: Testing the Complete Solution

1. **Commit All Files**
   ```bash
   git add .
   git commit -m "Add orchestration and deployment solution"
   git push origin feature/vm-deployment
   ```

2. **Create Pull Request and Merge**

3. **Setup VM**
   ```bash
   # SSH to your VM
   ssh azureuser@<vm-ip>
   
   # Run setup script
   curl -o vm-setup.sh https://raw.githubusercontent.com/yourrepo/main/scripts/vm-setup.sh
   chmod +x vm-setup.sh
   ./vm-setup.sh
   ```

4. **Run Blue-Green Deployment**
   - Go to Pipelines → Run pipeline
   - Select `azure-pipelines-vm.yml`
   - Watch deployment progress
   - Verify each stage

5. **Test Canary Deployment**
   - Run `azure-pipelines-canary.yml`
   - Set canary percentage: 10%
   - Monitor metrics
   - Gradually increase to 100%

6. **Test Rollback**
   - Run `azure-pipelines-rollback.yml`
   - Specify previous version
   - Verify rollback success

### Verification Checklist
- [ ] Application deployed to VM
- [ ] Blue-Green deployment works
- [ ] Traffic switching successful
- [ ] Canary deployment configured
- [ ] Monitoring scripts running
- [ ] Rollback tested and working
- [ ] Health checks passing
- [ ] Nginx routing correctly

## Key Concepts

### Orchestration
- **Coordination**: Managing multiple deployments
- **Dependencies**: Ensuring correct order
- **State Management**: Tracking deployment status
- **Error Handling**: Automated recovery

### Blue-Green Deployment
- **Zero Downtime**: Instant switch
- **Easy Rollback**: Switch back to old version
- **Testing**: Test new version before switch
- **Cost**: Requires double resources

### Canary Deployment
- **Gradual Rollout**: Minimize risk
- **Monitoring**: Compare metrics
- **Flexible**: Adjust percentage
- **Safe**: Easy to abort

### Rollback Strategies
- **Automated**: Based on metrics
- **Manual**: Human decision
- **Backup**: Keep previous versions
- **Fast**: Minimize downtime

## Architecture Diagram

```
┌─────────────────────────────────────────┐
│         Azure DevOps Pipeline           │
│  ┌────────┐  ┌────────┐  ┌──────────┐  │
│  │ Build  │→ │ Deploy │→ │ Monitor  │  │
│  └────────┘  └────────┘  └──────────┘  │
└─────────────────┬───────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────┐
│              Target VM                   │
│  ┌──────────────────────────────────┐   │
│  │          Nginx (Port 80)         │   │
│  │     (Load Balancer/Router)       │   │
│  └────┬──────────────────────┬──────┘   │
│       │                      │           │
│  ┌────▼─────┐          ┌────▼─────┐    │
│  │  Blue    │          │  Green   │    │
│  │ Port 3001│          │ Port 3000│    │
│  │ v1.1.0   │          │ v1.0.0   │    │
│  └──────────┘          └──────────┘    │
│                                         │
│  ┌──────────┐                          │
│  │  Canary  │                          │
│  │ Port 3002│                          │
│  │ v1.2.0   │                          │
│  └──────────┘                          │
└─────────────────────────────────────────┘
```

## Deployment Comparison

| Strategy | Downtime | Risk | Complexity | Cost | Rollback |
|----------|----------|------|------------|------|----------|
| Blue-Green | None | Low | Medium | High | Instant |
| Canary | None | Very Low | High | Medium | Gradual |
| Rolling | Minimal | Medium | Medium | Low | Slow |
| Recreate | Yes | High | Low | Low | Slow |

## Best Practices

### Deployment
1. Always test in staging first
2. Use health checks
3. Implement graceful shutdown
4. Keep deployment scripts idempotent
5. Version everything

### Monitoring
1. Track key metrics (latency, errors, traffic)
2. Set up alerts
3. Compare canary vs stable
4. Monitor for at least 30 minutes
5. Have rollback plan ready

### Rollback
1. Keep previous versions
2. Automate rollback triggers
3. Test rollback regularly
4. Document rollback procedures
5. Create post-mortem reports

### Security
1. Use SSH keys, not passwords
2. Limit service connection permissions
3. Rotate credentials regularly
4. Audit deployment logs
5. Implement least privilege

## Troubleshooting

### Deployment Fails
```bash
# Check service status
sudo systemctl status azure-devops-app-blue

# Check logs
sudo journalctl -u azure-devops-app-blue -n 50

# Check port availability
sudo netstat -tulpn | grep 3001
```

### Health Check Fails
```bash
# Test locally
curl -v http://localhost:3001/health

# Check application logs
tail -f /var/log/azure-devops-app/app.log

# Verify environment variables
sudo systemctl show azure-devops-app-blue | grep Environment
```

### Traffic Not Switching
```bash
# Check nginx configuration
sudo nginx -t

# Check nginx logs
sudo tail -f /var/log/nginx/error.log

# Reload nginx
sudo systemctl reload nginx
```

## Next Steps

1. **Add More Environments**
   - Development
   - QA
   - Staging
   - Production

2. **Implement Feature Flags**
   - LaunchDarkly
   - Azure App Configuration
   - Custom solution

3. **Add Performance Testing**
   - Load testing with Artillery
   - Stress testing
   - Baseline metrics

4. **Enhance Monitoring**
   - Application Insights
   - Custom dashboards
   - Alerting rules

5. **Implement GitOps**
   - Config in Git
   - Automated sync
   - Audit trail

## Congratulations!

You've implemented a complete orchestration and deployment solution with:
- ✅ Blue-Green deployment
- ✅ Canary deployment
- ✅ Automated rollback
- ✅ Health monitoring
- ✅ Traffic management
- ✅ Production-ready pipelines

This is enterprise-grade DevOps! 🚀
