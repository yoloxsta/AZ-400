```
trigger:
- master

pool:
  name: Default
  demands:
    - Agent.Name -equals ubuntu-arm64-agent-02

variables:
- group: devops-lab
- name: IMAGE_NAME
  value: cracky-app
- name: IMAGE_TAG
  value: $(Build.BuildId)

steps:
# Step 1: Login to Docker Hub
- script: |
    echo "$DOCKERHUB_PASSWORD" | docker login -u "$DOCKERHUB_USERNAME" --password-stdin
  displayName: 'Login to Docker Hub'
  env:
    DOCKERHUB_USERNAME: $(DOCKERHUB_USERNAME)
    DOCKERHUB_PASSWORD: $(DOCKERHUB_PASSWORD)

# Step 2: Build and push Docker image
- script: |
    docker build -t "$DOCKERHUB_USERNAME/$IMAGE_NAME:$IMAGE_TAG" .
    docker push "$DOCKERHUB_USERNAME/$IMAGE_NAME:$IMAGE_TAG"
  displayName: 'Build and push Docker image'

# Step 3: Update separate k8s repository
- script: |
    # Clone k8s repo using HTTPS with PAT
    git clone https://$(AZURE_DEVOPS_USERNAME):$(GIT_PAT)@dev.azure.com/soetintaung/devops-lab/_git/k8s k8s-repo
    cd k8s-repo
    
    # Checkout main branch
    git checkout main
    
    # Update deployment file
    sed -i "s|image: $DOCKERHUB_USERNAME/$IMAGE_NAME:[0-9.]*|image: $DOCKERHUB_USERNAME/$IMAGE_NAME:$IMAGE_TAG|g" example-deployment.yml
    
    # Configure git
    git config user.email "azure-pipelines@devops-lab.com"
    git config user.name "Azure Pipeline"
    
    # Add, commit and push
    git add example-deployment.yml
    git commit -m "Auto-update: Update image tag to $IMAGE_TAG"
    git push origin main
  displayName: 'Update k8s repository'
  env:
    DOCKERHUB_USERNAME: $(DOCKERHUB_USERNAME)
    IMAGE_NAME: $(IMAGE_NAME)
    IMAGE_TAG: $(IMAGE_TAG)
    AZURE_DEVOPS_USERNAME: $(AZURE_DEVOPS_USERNAME)  # Your Azure DevOps username
    GIT_PAT: $(GIT_PAT)  # Your Personal Access Token
```
###
```
# Multi-stage CI pipeline
trigger:
  branches:
    include:
      - main
      - feature/*

pool:
  name: Default
  demands:
    - Agent.Name -equals ubuntu-arm64-agent-02

variables:
  nodeVersion: '18.x'
  buildConfiguration: 'Release'

stages:

# -------------------------
# Stage 1: Build
# -------------------------
- stage: Build
  displayName: 'Build Application'

  jobs:
  - job: BuildJob
    displayName: 'Install and Build'

    steps:
    - checkout: self
      clean: true

    - task: NodeTool@0
      inputs:
        versionSpec: $(nodeVersion)
      displayName: 'Install Node.js'

    - script: |
        npm install
      displayName: 'Install dependencies'

    - script: |
        echo "Build completed successfully!"
      displayName: 'Build summary'

    - task: CopyFiles@2
      inputs:
        SourceFolder: '$(Build.SourcesDirectory)'
        Contents: |
          app.js
          package.json
          package-lock.json
        TargetFolder: '$(Build.ArtifactStagingDirectory)'
      displayName: 'Copy runtime files to artifact'

    - task: PublishBuildArtifacts@1
      inputs:
        PathtoPublish: '$(Build.ArtifactStagingDirectory)'
        ArtifactName: 'build-output'
        publishLocation: 'Container'
      displayName: 'Publish build artifacts'


# -------------------------
# Stage 2: Test
# -------------------------
- stage: Test
  displayName: 'Run Tests'
  dependsOn: Build

  jobs:
  - job: UnitTests
    displayName: 'Unit Tests'

    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: $(nodeVersion)

    - script: |
        npm install
        npm install --save-dev jest-junit
        npm test -- --reporters=default --reporters=jest-junit
      displayName: 'Run unit tests'

    - task: PublishTestResults@2
      condition: succeededOrFailed()
      inputs:
        testResultsFormat: 'JUnit'
        testResultsFiles: '**/junit.xml'
        failTaskOnFailedTests: false
      displayName: 'Publish test results'


# -------------------------
# Stage 3: Security Scan
# -------------------------
- stage: SecurityScan
  displayName: 'Security Scanning'
  dependsOn: Build

  jobs:
  - job: DependencyScan
    displayName: 'Dependency Vulnerability Scan'

    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: $(nodeVersion)

    - script: |
        npm install
        npm audit --audit-level=moderate || true
      displayName: 'Run npm audit'


# -------------------------
# Stage 4: Package
# -------------------------
- stage: Package
  displayName: 'Package Application'
  dependsOn:
    - Test
    - SecurityScan

  condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))

  jobs:
  - job: CreatePackage
    displayName: 'Create Deployment Package'

    steps:
    - task: DownloadBuildArtifacts@0
      inputs:
        buildType: current
        downloadType: single
        artifactName: build-output
        downloadPath: '$(Pipeline.Workspace)'

    - script: |
        sudo apt-get update
        sudo apt-get install -y zip
      displayName: 'Install zip utility'

    - task: ArchiveFiles@2
      inputs:
        rootFolderOrFile: '$(Pipeline.Workspace)/build-output'
        includeRootFolder: false
        archiveType: zip
        archiveFile: '$(Build.ArtifactStagingDirectory)/app-$(Build.BuildId).zip'

    - task: PublishBuildArtifacts@1
      inputs:
        PathtoPublish: '$(Build.ArtifactStagingDirectory)'
        ArtifactName: 'deployment-package'
        publishLocation: 'Container'
```
###
```
trigger:
  branches:
    include:
      - main

pool:
  name: 'azureagent'

variables:
  imageName: 'helloworldapp'
  acrName: 'soetintaung'
  tag: '$(Build.BuildId)'
  azureServiceConnection: 'azdo-devops-lab-sp'

stages:
- stage: BuildAndPush
  displayName: Build and Push Docker Image
  jobs:
  - job: BuildPush
    displayName: Build & Push
    steps:
    - task: AzureCLI@2
      displayName: Build and Push using AzureRM Service Connection
      inputs:
        azureSubscription: $(azureServiceConnection)
        scriptType: bash
        scriptLocation: inlineScript
        inlineScript: |
          echo "Logging in to ACR..."
          az acr login --name $(acrName)
          echo "Building Docker image..."
          docker build -t $(acrName).azurecr.io/$(imageName):$(tag) helloworld/
          echo "Pushing Docker image..."
          docker push $(acrName).azurecr.io/$(imageName):$(tag)
- stage: Deploy
  displayName: Deploy Docker Container
  dependsOn: BuildAndPush
  jobs:
  - job: Deploy
    displayName: Deploy Container
    steps:
    - script: |
        echo "Stopping old container if it exists..."
        if [ "$(docker ps -q -f name=helloworld)" ]; then
          docker stop helloworld
          docker rm helloworld
          sleep 2
        fi

        echo "Running new container..."
        docker run -d -p 8080:80 --name helloworld $(acrName).azurecr.io/helloworldapp:$(tag)
      displayName: 'Deploy Docker Container'

```
###
