# Day 5: Azure Pipelines - Continuous Deployment (CD)

## What is Continuous Deployment?

CD automatically deploys applications to environments (dev, staging, production) after successful builds. It extends CI by automating the release process.

## Why Use CD?

- Faster time to market
- Reduced manual errors
- Consistent deployments
- Easy rollbacks
- Environment-specific configurations

## How Does CD Work?

1. CI pipeline completes
2. Artifacts created
3. CD pipeline triggers
4. Deploy to dev environment
5. Run tests
6. Deploy to staging (with approval)
7. Deploy to production (with approval)

## Lab 5: Create Multi-Stage Deployment Pipeline

### Part 1: Prepare Application for Deployment

1. **Create New Branch**
   ```bash
   git checkout main
   git pull
   git checkout -b feature/add-cd-pipeline
   ```

2. **Create `server.js`**
   ```javascript
   const http = require('http');
   const fs = require('fs');
   const path = require('path');
   
   const PORT = process.env.PORT || 3000;
   const ENV = process.env.ENVIRONMENT || 'development';
   
   const server = http.createServer((req, res) => {
     if (req.url === '/' || req.url === '/index.html') {
       fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
         if (err) {
           res.writeHead(500);
           res.end('Error loading page');
           return;
         }
         res.writeHead(200, { 'Content-Type': 'text/html' });
         res.end(data);
       });
     } else if (req.url === '/health') {
       res.writeHead(200, { 'Content-Type': 'application/json' });
       res.end(JSON.stringify({ 
         status: 'healthy', 
         environment: ENV,
         timestamp: new Date().toISOString()
       }));
     } else {
       res.writeHead(404);
       res.end('Not found');
     }
   });
   
   server.listen(PORT, () => {
     console.log(`Server running on port ${PORT} in ${ENV} environment`);
   });
   ```

3. **Update `package.json`**
   ```json
   {
     "name": "hello-devops",
     "version": "1.0.0",
     "description": "Azure DevOps Lab Application",
     "main": "server.js",
     "scripts": {
       "test": "jest",
       "start": "node server.js"
     },
     "devDependencies": {
       "jest": "^29.0.0"
     }
   }
   ```

4. **Update `index.html`**
   ```html
   <!DOCTYPE html>
   <html>
   <head>
       <title>Hello DevOps</title>
       <style>
           body {
               font-family: Arial, sans-serif;
               max-width: 800px;
               margin: 50px auto;
               padding: 20px;
               background: #f0f0f0;
           }
           .container {
               background: white;
               padding: 30px;
               border-radius: 8px;
               box-shadow: 0 2px 4px rgba(0,0,0,0.1);
           }
           h1 { color: #0078d4; }
       </style>
   </head>
   <body>
       <div class="container">
           <h1>Welcome to Azure DevOps Lab</h1>
           <p>Day 5: Continuous Deployment Pipeline</p>
           <p>Environment: <span id="env">Loading...</span></p>
       </div>
       <script>
           fetch('/health')
               .then(r => r.json())
               .then(data => {
                   document.getElementById('env').textContent = data.environment;
               });
       </script>
   </body>
   </html>
   ```

### Part 2: Create Multi-Stage Pipeline

1. **Update `azure-pipelines.yml`**
   ```yaml
   trigger:
     branches:
       include:
         - main
   
   variables:
     buildConfiguration: 'Release'
   
   stages:
   # Build Stage
   - stage: Build
     displayName: 'Build and Test'
     jobs:
     - job: BuildJob
       displayName: 'Build Application'
       pool:
         vmImage: 'ubuntu-latest'
       steps:
       - task: NodeTool@0
         inputs:
           versionSpec: '18.x'
         displayName: 'Install Node.js'
       
       - script: npm install
         displayName: 'Install dependencies'
       
       - script: npm test
         displayName: 'Run unit tests'
       
       - task: ArchiveFiles@2
         inputs:
           rootFolderOrFile: '$(Build.SourcesDirectory)'
           includeRootFolder: false
           archiveType: 'zip'
           archiveFile: '$(Build.ArtifactStagingDirectory)/app-$(Build.BuildId).zip'
         displayName: 'Archive application'
       
       - task: PublishBuildArtifacts@1
         inputs:
           PathtoPublish: '$(Build.ArtifactStagingDirectory)'
           ArtifactName: 'drop'
         displayName: 'Publish artifacts'
   
   # Dev Deployment Stage
   - stage: DeployDev
     displayName: 'Deploy to Dev'
     dependsOn: Build
     condition: succeeded()
     jobs:
     - deployment: DeployDevJob
       displayName: 'Deploy to Development'
       environment: 'Development'
       pool:
         vmImage: 'ubuntu-latest'
       strategy:
         runOnce:
           deploy:
             steps:
             - download: current
               artifact: drop
               displayName: 'Download artifacts'
             
             - script: |
                 echo "Deploying to Development environment"
                 echo "Artifact: $(Pipeline.Workspace)/drop/app-$(Build.BuildId).zip"
               displayName: 'Simulate Dev deployment'
             
             - script: |
                 echo "Running smoke tests in Dev"
                 echo "Health check: PASSED"
               displayName: 'Run smoke tests'
   
   # Staging Deployment Stage
   - stage: DeployStaging
     displayName: 'Deploy to Staging'
     dependsOn: DeployDev
     condition: succeeded()
     jobs:
     - deployment: DeployStagingJob
       displayName: 'Deploy to Staging'
       environment: 'Staging'
       pool:
         vmImage: 'ubuntu-latest'
       strategy:
         runOnce:
           deploy:
             steps:
             - download: current
               artifact: drop
               displayName: 'Download artifacts'
             
             - script: |
                 echo "Deploying to Staging environment"
                 echo "Artifact: $(Pipeline.Workspace)/drop/app-$(Build.BuildId).zip"
               displayName: 'Simulate Staging deployment'
             
             - script: |
                 echo "Running integration tests in Staging"
                 echo "All tests: PASSED"
               displayName: 'Run integration tests'
   
   # Production Deployment Stage
   - stage: DeployProduction
     displayName: 'Deploy to Production'
     dependsOn: DeployStaging
     condition: succeeded()
     jobs:
     - deployment: DeployProductionJob
       displayName: 'Deploy to Production'
       environment: 'Production'
       pool:
         vmImage: 'ubuntu-latest'
       strategy:
         runOnce:
           deploy:
             steps:
             - download: current
               artifact: drop
               displayName: 'Download artifacts'
             
             - script: |
                 echo "Deploying to Production environment"
                 echo "Artifact: $(Pipeline.Workspace)/drop/app-$(Build.BuildId).zip"
               displayName: 'Deploy to Production'
             
             - script: |
                 echo "Running production smoke tests"
                 echo "Health check: PASSED"
               displayName: 'Verify deployment'
   ```

2. **Commit and Push**
   ```bash
   git add .
   git commit -m "Add multi-stage CD pipeline"
   git push origin feature/add-cd-pipeline
   ```

### Part 3: Configure Environments

1. **Create Environments**
   - Go to Pipelines → Environments
   - Click "Create environment"
   - Name: `Development`
   - Click "Create"
   - Repeat for `Staging` and `Production`

2. **Add Approvals to Production**
   - Click on `Production` environment
   - Click "..." → "Approvals and checks"
   - Click "Approvals"
   - Add yourself as approver
   - Instructions: "Review deployment before production"
   - Click "Create"

3. **Add Approvals to Staging (Optional)**
   - Repeat for `Staging` environment

### Part 4: Run Multi-Stage Pipeline

1. **Create Pull Request**
   - Create PR from `feature/add-cd-pipeline` to `main`
   - Complete the PR

2. **Watch Pipeline Execute**
   - Go to Pipelines → Pipelines
   - Click on running pipeline
   - Observe stages:
     - Build (runs automatically)
     - Deploy to Dev (runs after build)
     - Deploy to Staging (waits for approval if configured)
     - Deploy to Production (waits for approval)

3. **Approve Deployments**
   - When pipeline reaches Production stage
   - Click "Review"
   - Add comment: "Approved for production"
   - Click "Approve"

### Part 5: Add Environment Variables

1. **Create Variable Group**
   - Go to Pipelines → Library
   - Click "Variable group"
   - Name: `app-config`
   - Add variables:
     - `dev.port`: 3000
     - `staging.port`: 3001
     - `prod.port`: 80
   - Click "Save"

2. **Use Variables in Pipeline**
   ```yaml
   variables:
   - group: app-config
   
   - script: |
       echo "Port: $(dev.port)"
     displayName: 'Use variable'
   ```

### Verification
- [ ] Multi-stage pipeline created
- [ ] Environments configured
- [ ] Approvals set up
- [ ] Pipeline deploys to all stages
- [ ] Approval required for production
- [ ] Artifacts downloaded in each stage

## Key Concepts

- **Stage**: Major phase in pipeline (Build, Deploy)
- **Deployment Job**: Special job for deployments
- **Environment**: Deployment target (Dev, Staging, Prod)
- **Approval**: Manual gate before deployment
- **Strategy**: Deployment approach (runOnce, rolling, canary)

## Deployment Strategies

1. **runOnce**: Deploy once, simple
2. **rolling**: Deploy incrementally to servers
3. **canary**: Deploy to subset, then all
4. **blueGreen**: Deploy to new environment, switch traffic

## Stage Dependencies

```yaml
stages:
- stage: A
  jobs: [...]

- stage: B
  dependsOn: A          # Runs after A
  condition: succeeded() # Only if A succeeds

- stage: C
  dependsOn:            # Runs after both
    - A
    - B
```

## Next Steps
Tomorrow we'll explore Azure Test Plans and automated testing strategies.
