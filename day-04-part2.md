# Day 4 Part 2: Advanced Azure Pipelines CI

## What You'll Learn

Building on Day 4 basics, this guide covers advanced CI concepts:
- ✅ Multi-stage pipelines
- ✅ Matrix builds (test multiple versions)
- ✅ Conditional execution
- ✅ Template reusability
- ✅ Caching dependencies
- ✅ Parallel jobs
- ✅ Code coverage
- ✅ Security scanning
- ✅ Docker builds
- ✅ Advanced triggers

---

## Part 1: Multi-Stage Pipelines

### What are Stages?

Stages organize your pipeline into major phases:
- Build stage
- Test stage
- Security scan stage
- Package stage

### Why Use Stages?

- ✅ Better organization
- ✅ Clear separation of concerns
- ✅ Can run in parallel or sequence
- ✅ Easier to understand pipeline flow
- ✅ Reusable across pipelines

### Lab 1: Create Multi-Stage Pipeline

Create `azure-pipelines-multistage.yml`:

```yaml
# Multi-stage CI pipeline
trigger:
  branches:
    include:
      - main
      - develop
      - feature/*

pool:
  vmImage: 'ubuntu-latest'

variables:
  nodeVersion: '18.x'
  buildConfiguration: 'Release'

stages:
# Stage 1: Build
- stage: Build
  displayName: 'Build Application'
  jobs:
  - job: BuildJob
    displayName: 'Build and Compile'
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: $(nodeVersion)
      displayName: 'Install Node.js'
    
    - script: |
        npm install
        npm run build
      displayName: 'Install dependencies and build'
    
    - task: CopyFiles@2
      inputs:
        Contents: |
          **/*.js
          package*.json
        TargetFolder: '$(Build.ArtifactStagingDirectory)'
      displayName: 'Copy files to staging'
    
    - task: PublishBuildArtifacts@1
      inputs:
        PathtoPublish: '$(Build.ArtifactStagingDirectory)'
        ArtifactName: 'build-output'
      displayName: 'Publish build artifacts'


# Stage 2: Test
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
      displayName: 'Install Node.js'
    
    - script: |
        npm install
        npm test -- --coverage
      displayName: 'Run unit tests with coverage'
    
    - task: PublishTestResults@2
      condition: succeededOrFailed()
      inputs:
        testResultsFormat: 'JUnit'
        testResultsFiles: '**/junit.xml'
        failTaskOnFailedTests: true
      displayName: 'Publish test results'
    
    - task: PublishCodeCoverageResults@1
      inputs:
        codeCoverageTool: 'Cobertura'
        summaryFileLocation: '$(System.DefaultWorkingDirectory)/coverage/cobertura-coverage.xml'
      displayName: 'Publish code coverage'

  - job: IntegrationTests
    displayName: 'Integration Tests'
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: $(nodeVersion)
    
    - script: |
        npm install
        npm run test:integration
      displayName: 'Run integration tests'

# Stage 3: Security Scan
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
        npm audit --audit-level=moderate
      displayName: 'Run npm audit'
      continueOnError: true

# Stage 4: Package
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
        buildType: 'current'
        downloadType: 'single'
        artifactName: 'build-output'
        downloadPath: '$(System.ArtifactsDirectory)'
    
    - task: ArchiveFiles@2
      inputs:
        rootFolderOrFile: '$(System.ArtifactsDirectory)/build-output'
        includeRootFolder: false
        archiveType: 'zip'
        archiveFile: '$(Build.ArtifactStagingDirectory)/app-$(Build.BuildId).zip'
      displayName: 'Create deployment package'
    
    - task: PublishBuildArtifacts@1
      inputs:
        PathtoPublish: '$(Build.ArtifactStagingDirectory)'
        ArtifactName: 'deployment-package'
      displayName: 'Publish deployment package'
```


### Understanding the Multi-Stage Pipeline

**Stage Dependencies:**
```yaml
dependsOn: Build  # This stage waits for Build to complete
```

**Conditional Stages:**
```yaml
condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
# Only runs on main branch AND if previous stages succeeded
```

**Parallel Stages:**
```yaml
- stage: SecurityScan
  dependsOn: Build  # Both Test and SecurityScan run in parallel after Build
- stage: Test
  dependsOn: Build
```

**Visual Flow:**
```
Build Stage
    ↓
    ├─→ Test Stage (parallel)
    └─→ Security Scan Stage (parallel)
    ↓
Package Stage (only on main branch)
```

---

## Part 2: Matrix Builds (Test Multiple Versions)

### What are Matrix Builds?

Test your code against multiple versions/configurations simultaneously.

### Why Use Matrix Builds?

- ✅ Test multiple Node.js versions
- ✅ Test multiple OS (Linux, Windows, macOS)
- ✅ Test multiple configurations
- ✅ Catch compatibility issues early

### Lab 2: Create Matrix Build

```yaml
# azure-pipelines-matrix.yml
trigger:
  branches:
    include:
      - main

strategy:
  matrix:
    Node_16_Ubuntu:
      nodeVersion: '16.x'
      vmImage: 'ubuntu-latest'
      displayName: 'Node 16 on Ubuntu'
    
    Node_18_Ubuntu:
      nodeVersion: '18.x'
      vmImage: 'ubuntu-latest'
      displayName: 'Node 18 on Ubuntu'
    
    Node_20_Ubuntu:
      nodeVersion: '20.x'
      vmImage: 'ubuntu-latest'
      displayName: 'Node 20 on Ubuntu'
    
    Node_18_Windows:
      nodeVersion: '18.x'
      vmImage: 'windows-latest'
      displayName: 'Node 18 on Windows'
    
    Node_18_macOS:
      nodeVersion: '18.x'
      vmImage: 'macOS-latest'
      displayName: 'Node 18 on macOS'

pool:
  vmImage: $(vmImage)

steps:
- task: NodeTool@0
  inputs:
    versionSpec: $(nodeVersion)
  displayName: 'Install Node.js $(nodeVersion)'

- script: |
    node --version
    npm --version
  displayName: 'Display versions'

- script: |
    npm install
  displayName: 'Install dependencies'

- script: |
    npm test
  displayName: 'Run tests on $(displayName)'

- script: |
    npm run build
  displayName: 'Build on $(displayName)'
```


**What happens:**
- Pipeline creates 5 parallel jobs
- Each job runs on different Node version or OS
- All must pass for pipeline to succeed

**Result:**
```
✅ Node 16 on Ubuntu - Passed
✅ Node 18 on Ubuntu - Passed
✅ Node 20 on Ubuntu - Passed
✅ Node 18 on Windows - Passed
✅ Node 18 on macOS - Passed
```

---

## Part 3: Caching Dependencies

### Why Cache?

- ✅ Faster builds (skip npm install)
- ✅ Reduce network usage
- ✅ Save build minutes
- ✅ More reliable (less network failures)

### Lab 3: Add Caching

```yaml
# azure-pipelines-cache.yml
trigger:
  branches:
    include:
      - main

pool:
  vmImage: 'ubuntu-latest'

variables:
  npm_config_cache: $(Pipeline.Workspace)/.npm

steps:
- task: NodeTool@0
  inputs:
    versionSpec: '18.x'
  displayName: 'Install Node.js'

# Cache npm dependencies
- task: Cache@2
  inputs:
    key: 'npm | "$(Agent.OS)" | package-lock.json'
    restoreKeys: |
      npm | "$(Agent.OS)"
    path: $(npm_config_cache)
  displayName: 'Cache npm packages'

- script: |
    npm ci
  displayName: 'Install dependencies (with cache)'

- script: |
    npm test
  displayName: 'Run tests'

- script: |
    npm run build
  displayName: 'Build application'
```

**How caching works:**
1. First run: Downloads all packages, saves to cache
2. Second run: Restores from cache (much faster!)
3. If `package-lock.json` changes: Cache invalidated, downloads again

**Cache key explained:**
```yaml
key: 'npm | "$(Agent.OS)" | package-lock.json'
```
- `npm`: Cache identifier
- `$(Agent.OS)`: Different cache per OS
- `package-lock.json`: Invalidate when dependencies change


---

## Part 4: Pipeline Templates (Reusability)

### Why Templates?

- ✅ Reuse common steps across pipelines
- ✅ Maintain consistency
- ✅ Easier to update (change once, apply everywhere)
- ✅ Reduce duplication

### Lab 4: Create Reusable Templates

**Step 1: Create template file `templates/build-template.yml`**

```yaml
# templates/build-template.yml
parameters:
- name: nodeVersion
  type: string
  default: '18.x'
- name: buildConfiguration
  type: string
  default: 'Release'

steps:
- task: NodeTool@0
  inputs:
    versionSpec: ${{ parameters.nodeVersion }}
  displayName: 'Install Node.js ${{ parameters.nodeVersion }}'

- task: Cache@2
  inputs:
    key: 'npm | "$(Agent.OS)" | package-lock.json'
    restoreKeys: |
      npm | "$(Agent.OS)"
    path: $(Pipeline.Workspace)/.npm
  displayName: 'Cache npm'

- script: |
    npm ci
  displayName: 'Install dependencies'

- script: |
    npm run build
  displayName: 'Build application'
  env:
    NODE_ENV: ${{ parameters.buildConfiguration }}

- task: CopyFiles@2
  inputs:
    Contents: |
      **/*.js
      package*.json
    TargetFolder: '$(Build.ArtifactStagingDirectory)'
  displayName: 'Copy build output'
```

**Step 2: Create test template `templates/test-template.yml`**

```yaml
# templates/test-template.yml
parameters:
- name: nodeVersion
  type: string
  default: '18.x'

steps:
- task: NodeTool@0
  inputs:
    versionSpec: ${{ parameters.nodeVersion }}
  displayName: 'Install Node.js'

- script: |
    npm ci
  displayName: 'Install dependencies'

- script: |
    npm test -- --coverage --ci
  displayName: 'Run tests with coverage'

- task: PublishTestResults@2
  condition: succeededOrFailed()
  inputs:
    testResultsFormat: 'JUnit'
    testResultsFiles: '**/junit.xml'
    failTaskOnFailedTests: true
  displayName: 'Publish test results'

- task: PublishCodeCoverageResults@1
  condition: succeededOrFailed()
  inputs:
    codeCoverageTool: 'Cobertura'
    summaryFileLocation: '$(System.DefaultWorkingDirectory)/coverage/cobertura-coverage.xml'
  displayName: 'Publish code coverage'
```


**Step 3: Use templates in main pipeline**

```yaml
# azure-pipelines-with-templates.yml
trigger:
  branches:
    include:
      - main
      - develop

pool:
  vmImage: 'ubuntu-latest'

stages:
- stage: Build
  displayName: 'Build Stage'
  jobs:
  - job: BuildJob
    displayName: 'Build Application'
    steps:
    - template: templates/build-template.yml
      parameters:
        nodeVersion: '18.x'
        buildConfiguration: 'Release'

- stage: Test
  displayName: 'Test Stage'
  dependsOn: Build
  jobs:
  - job: TestNode16
    displayName: 'Test on Node 16'
    steps:
    - template: templates/test-template.yml
      parameters:
        nodeVersion: '16.x'
  
  - job: TestNode18
    displayName: 'Test on Node 18'
    steps:
    - template: templates/test-template.yml
      parameters:
        nodeVersion: '18.x'
  
  - job: TestNode20
    displayName: 'Test on Node 20'
    steps:
    - template: templates/test-template.yml
      parameters:
        nodeVersion: '20.x'
```

**Benefits:**
- ✅ Build and test logic defined once
- ✅ Easy to test multiple Node versions
- ✅ Update template = all pipelines updated
- ✅ Clean, readable main pipeline

---

## Part 5: Conditional Execution

### Why Conditionals?

- ✅ Skip steps based on branch
- ✅ Run only on specific conditions
- ✅ Save build time
- ✅ Different behavior for different scenarios

### Lab 5: Add Conditional Logic

```yaml
# azure-pipelines-conditional.yml
trigger:
  branches:
    include:
      - main
      - develop
      - feature/*

pool:
  vmImage: 'ubuntu-latest'

variables:
  isMain: $[eq(variables['Build.SourceBranch'], 'refs/heads/main')]
  isDevelop: $[eq(variables['Build.SourceBranch'], 'refs/heads/develop')]
  isFeature: $[startsWith(variables['Build.SourceBranch'], 'refs/heads/feature/')]

steps:
- task: NodeTool@0
  inputs:
    versionSpec: '18.x'
  displayName: 'Install Node.js'

- script: |
    npm install
  displayName: 'Install dependencies'

# Always run tests
- script: |
    npm test
  displayName: 'Run tests (all branches)'

# Only run on feature branches
- script: |
    npm run lint
  displayName: 'Run linting (feature branches only)'
  condition: eq(variables.isFeature, true)

# Only run on develop branch
- script: |
    npm run test:integration
  displayName: 'Run integration tests (develop only)'
  condition: eq(variables.isDevelop, true)

# Only run on main branch
- script: |
    npm run build
    npm run test:e2e
  displayName: 'Build and E2E tests (main only)'
  condition: eq(variables.isMain, true)

# Only publish artifacts on main
- task: PublishBuildArtifacts@1
  inputs:
    PathtoPublish: '$(Build.SourcesDirectory)'
    ArtifactName: 'production-build'
  displayName: 'Publish artifacts (main only)'
  condition: and(succeeded(), eq(variables.isMain, true))

# Run on failure
- script: |
    echo "Build failed! Sending notification..."
  displayName: 'Notify on failure'
  condition: failed()

# Always run (cleanup)
- script: |
    echo "Cleaning up..."
  displayName: 'Cleanup'
  condition: always()
```


**Common Conditions:**

```yaml
# Run only if previous steps succeeded
condition: succeeded()

# Run even if previous steps failed
condition: succeededOrFailed()

# Run only if previous steps failed
condition: failed()

# Always run (even on cancellation)
condition: always()

# Custom conditions
condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
condition: or(eq(variables.isMain, true), eq(variables.isDevelop, true))
condition: not(eq(variables.isFeature, true))
```

---

## Part 6: Code Coverage

### Why Code Coverage?

- ✅ Measure test quality
- ✅ Find untested code
- ✅ Track coverage trends
- ✅ Enforce minimum coverage

### Lab 6: Add Code Coverage

**Step 1: Update `package.json`**

```json
{
  "name": "hello-devops",
  "version": "1.0.0",
  "scripts": {
    "test": "jest",
    "test:coverage": "jest --coverage --coverageReporters=cobertura --coverageReporters=html"
  },
  "jest": {
    "coverageThreshold": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    },
    "collectCoverageFrom": [
      "**/*.js",
      "!**/node_modules/**",
      "!**/coverage/**",
      "!jest.config.js"
    ]
  },
  "devDependencies": {
    "jest": "^29.0.0"
  }
}
```

**Step 2: Create pipeline with coverage**

```yaml
# azure-pipelines-coverage.yml
trigger:
  branches:
    include:
      - main

pool:
  vmImage: 'ubuntu-latest'

steps:
- task: NodeTool@0
  inputs:
    versionSpec: '18.x'
  displayName: 'Install Node.js'

- script: |
    npm install
  displayName: 'Install dependencies'

- script: |
    npm run test:coverage
  displayName: 'Run tests with coverage'

- task: PublishTestResults@2
  condition: succeededOrFailed()
  inputs:
    testResultsFormat: 'JUnit'
    testResultsFiles: '**/junit.xml'
    failTaskOnFailedTests: true
    testRunTitle: 'Unit Tests'
  displayName: 'Publish test results'

- task: PublishCodeCoverageResults@1
  condition: succeededOrFailed()
  inputs:
    codeCoverageTool: 'Cobertura'
    summaryFileLocation: '$(System.DefaultWorkingDirectory)/coverage/cobertura-coverage.xml'
    reportDirectory: '$(System.DefaultWorkingDirectory)/coverage'
    failIfCoverageEmpty: true
  displayName: 'Publish code coverage'

# Fail if coverage below threshold
- script: |
    COVERAGE=$(grep -oP 'line-rate="\K[^"]+' coverage/cobertura-coverage.xml | head -1)
    COVERAGE_PERCENT=$(echo "$COVERAGE * 100" | bc)
    echo "Code coverage: $COVERAGE_PERCENT%"
    if (( $(echo "$COVERAGE_PERCENT < 80" | bc -l) )); then
      echo "Coverage is below 80%!"
      exit 1
    fi
  displayName: 'Check coverage threshold'
  condition: succeededOrFailed()
```


**View Coverage in Azure DevOps:**
1. Go to pipeline run
2. Click "Code Coverage" tab
3. See coverage percentage
4. View detailed report
5. See which lines are not covered

---

## Part 7: Docker Build in CI

### Why Docker in CI?

- ✅ Consistent build environment
- ✅ Easy deployment
- ✅ Test in production-like environment
- ✅ Build once, deploy anywhere

### Lab 7: Add Docker Build

**Step 1: Create `Dockerfile`**

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "app.js"]
```

**Step 2: Create Docker build pipeline**

```yaml
# azure-pipelines-docker.yml
trigger:
  branches:
    include:
      - main

pool:
  vmImage: 'ubuntu-latest'

variables:
  dockerRegistryServiceConnection: 'myDockerRegistry'
  imageRepository: 'hello-devops'
  containerRegistry: 'myregistry.azurecr.io'
  dockerfilePath: '$(Build.SourcesDirectory)/Dockerfile'
  tag: '$(Build.BuildId)'

stages:
- stage: Build
  displayName: 'Build and Test'
  jobs:
  - job: BuildJob
    displayName: 'Build Application'
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '18.x'
      displayName: 'Install Node.js'
    
    - script: |
        npm install
        npm test
      displayName: 'Install and test'

- stage: Docker
  displayName: 'Build Docker Image'
  dependsOn: Build
  condition: succeeded()
  jobs:
  - job: DockerBuild
    displayName: 'Build and Push Docker Image'
    steps:
    - task: Docker@2
      displayName: 'Build Docker image'
      inputs:
        command: build
        repository: $(imageRepository)
        dockerfile: $(dockerfilePath)
        containerRegistry: $(dockerRegistryServiceConnection)
        tags: |
          $(tag)
          latest
    
    - task: Docker@2
      displayName: 'Push Docker image'
      inputs:
        command: push
        repository: $(imageRepository)
        containerRegistry: $(dockerRegistryServiceConnection)
        tags: |
          $(tag)
          latest
    
    # Scan image for vulnerabilities
    - task: AzureContainerRegistry@0
      displayName: 'Scan Docker image'
      inputs:
        azureSubscription: 'myAzureSubscription'
        azureContainerRegistry: $(containerRegistry)
        command: 'scan'
        repository: $(imageRepository)
        tag: $(tag)
```


---

## Part 8: Advanced Triggers

### Types of Triggers

1. **Branch triggers** - On push to branch
2. **Path triggers** - Only when specific files change
3. **Tag triggers** - On git tag creation
4. **PR triggers** - On pull request
5. **Scheduled triggers** - Run on schedule

### Lab 8: Advanced Trigger Configuration

```yaml
# azure-pipelines-triggers.yml

# Branch triggers
trigger:
  branches:
    include:
      - main
      - develop
      - release/*
    exclude:
      - feature/experimental/*
  paths:
    include:
      - src/*
      - package.json
    exclude:
      - docs/*
      - README.md
  tags:
    include:
      - v*
      - release-*

# PR triggers
pr:
  branches:
    include:
      - main
      - develop
  paths:
    include:
      - src/*
    exclude:
      - docs/*
  drafts: false  # Don't trigger on draft PRs

# Scheduled triggers (cron)
schedules:
- cron: "0 0 * * *"  # Every day at midnight
  displayName: 'Nightly build'
  branches:
    include:
      - main
  always: true  # Run even if no changes

- cron: "0 */6 * * *"  # Every 6 hours
  displayName: 'Integration tests'
  branches:
    include:
      - develop
  always: false  # Only if there are changes

pool:
  vmImage: 'ubuntu-latest'

steps:
- script: echo "Pipeline triggered!"
  displayName: 'Show trigger info'

- script: |
    echo "Build reason: $(Build.Reason)"
    echo "Source branch: $(Build.SourceBranch)"
    echo "Triggered by: $(Build.RequestedFor)"
  displayName: 'Display trigger details'
```

**Cron syntax:**
```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6) (Sunday=0)
│ │ │ │ │
* * * * *
```

**Examples:**
- `0 0 * * *` - Every day at midnight
- `0 */6 * * *` - Every 6 hours
- `0 9 * * 1-5` - 9 AM on weekdays
- `0 0 * * 0` - Every Sunday at midnight


---

## Part 9: Security Scanning

### Why Security Scanning?

- ✅ Find vulnerabilities early
- ✅ Prevent security issues in production
- ✅ Compliance requirements
- ✅ Dependency vulnerability detection

### Lab 9: Add Security Scanning

```yaml
# azure-pipelines-security.yml
trigger:
  branches:
    include:
      - main

pool:
  vmImage: 'ubuntu-latest'

stages:
- stage: Build
  displayName: 'Build and Test'
  jobs:
  - job: BuildJob
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '18.x'
    
    - script: |
        npm install
        npm test
      displayName: 'Build and test'

- stage: SecurityScan
  displayName: 'Security Scanning'
  dependsOn: Build
  jobs:
  # Job 1: Dependency scanning
  - job: DependencyScan
    displayName: 'Scan Dependencies'
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '18.x'
    
    - script: |
        npm install
      displayName: 'Install dependencies'
    
    # npm audit
    - script: |
        npm audit --audit-level=moderate
      displayName: 'Run npm audit'
      continueOnError: true
    
    # Generate audit report
    - script: |
        npm audit --json > audit-report.json
      displayName: 'Generate audit report'
      continueOnError: true
    
    - task: PublishBuildArtifacts@1
      inputs:
        PathtoPublish: 'audit-report.json'
        ArtifactName: 'security-reports'
      displayName: 'Publish audit report'

  # Job 2: OWASP Dependency Check
  - job: OWASPCheck
    displayName: 'OWASP Dependency Check'
    steps:
    - script: |
        # Download OWASP Dependency Check
        wget https://github.com/jeremylong/DependencyCheck/releases/download/v8.4.0/dependency-check-8.4.0-release.zip
        unzip dependency-check-8.4.0-release.zip
      displayName: 'Download OWASP tool'
    
    - script: |
        ./dependency-check/bin/dependency-check.sh \
          --project "HelloDevOps" \
          --scan . \
          --format HTML \
          --format JSON \
          --out ./owasp-report
      displayName: 'Run OWASP scan'
      continueOnError: true
    
    - task: PublishBuildArtifacts@1
      inputs:
        PathtoPublish: 'owasp-report'
        ArtifactName: 'owasp-reports'
      displayName: 'Publish OWASP report'

  # Job 3: Secret scanning
  - job: SecretScan
    displayName: 'Scan for Secrets'
    steps:
    - script: |
        # Install truffleHog (secret scanner)
        pip install truffleHog
      displayName: 'Install truffleHog'
    
    - script: |
        trufflehog filesystem . --json > secrets-report.json
      displayName: 'Scan for secrets'
      continueOnError: true
    
    - task: PublishBuildArtifacts@1
      inputs:
        PathtoPublish: 'secrets-report.json'
        ArtifactName: 'secret-scan-reports'
      displayName: 'Publish secret scan report'
```


---

## Part 10: Parallel Jobs

### Why Parallel Jobs?

- ✅ Faster pipeline execution
- ✅ Run independent tasks simultaneously
- ✅ Better resource utilization
- ✅ Reduce total build time

### Lab 10: Parallel Job Execution

```yaml
# azure-pipelines-parallel.yml
trigger:
  branches:
    include:
      - main

pool:
  vmImage: 'ubuntu-latest'

stages:
- stage: Build
  displayName: 'Build Stage'
  jobs:
  - job: BuildJob
    displayName: 'Build Application'
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '18.x'
    
    - script: |
        npm install
        npm run build
      displayName: 'Build'
    
    - task: PublishBuildArtifacts@1
      inputs:
        PathtoPublish: '$(Build.SourcesDirectory)'
        ArtifactName: 'build-output'

- stage: ParallelTests
  displayName: 'Parallel Testing'
  dependsOn: Build
  jobs:
  # All these jobs run in parallel
  - job: UnitTests
    displayName: 'Unit Tests'
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '18.x'
    - script: |
        npm install
        npm run test:unit
      displayName: 'Run unit tests'
  
  - job: IntegrationTests
    displayName: 'Integration Tests'
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '18.x'
    - script: |
        npm install
        npm run test:integration
      displayName: 'Run integration tests'
  
  - job: E2ETests
    displayName: 'E2E Tests'
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '18.x'
    - script: |
        npm install
        npm run test:e2e
      displayName: 'Run E2E tests'
  
  - job: LintCheck
    displayName: 'Linting'
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '18.x'
    - script: |
        npm install
        npm run lint
      displayName: 'Run linter'
  
  - job: SecurityScan
    displayName: 'Security Scan'
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '18.x'
    - script: |
        npm install
        npm audit
      displayName: 'Security audit'

- stage: Report
  displayName: 'Generate Reports'
  dependsOn: ParallelTests
  condition: always()
  jobs:
  - job: AggregateResults
    displayName: 'Aggregate Test Results'
    steps:
    - script: |
        echo "All parallel jobs completed"
        echo "Generating summary report..."
      displayName: 'Summary'
```

**Execution flow:**
```
Build Stage (1 job)
    ↓
Parallel Tests Stage (5 jobs running simultaneously)
    ├─ Unit Tests
    ├─ Integration Tests
    ├─ E2E Tests
    ├─ Linting
    └─ Security Scan
    ↓
Report Stage (1 job)
```

**Time savings:**
- Sequential: 5 jobs × 5 min = 25 minutes
- Parallel: max(5 min) = 5 minutes
- Savings: 20 minutes (80% faster!)


---

## Part 11: Complete Production Pipeline Example

### Lab 11: Full Production-Ready Pipeline

This combines everything we've learned:

```yaml
# azure-pipelines-production.yml
name: $(Date:yyyyMMdd)$(Rev:.r)

trigger:
  branches:
    include:
      - main
      - develop
      - release/*
  paths:
    exclude:
      - docs/*
      - README.md

pr:
  branches:
    include:
      - main
      - develop

pool:
  vmImage: 'ubuntu-latest'

variables:
  nodeVersion: '18.x'
  npm_config_cache: $(Pipeline.Workspace)/.npm
  isMain: $[eq(variables['Build.SourceBranch'], 'refs/heads/main')]
  isDevelop: $[eq(variables['Build.SourceBranch'], 'refs/heads/develop')]

stages:
# Stage 1: Build
- stage: Build
  displayName: 'Build Application'
  jobs:
  - job: BuildJob
    displayName: 'Compile and Package'
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: $(nodeVersion)
      displayName: 'Install Node.js'
    
    # Cache dependencies
    - task: Cache@2
      inputs:
        key: 'npm | "$(Agent.OS)" | package-lock.json'
        restoreKeys: |
          npm | "$(Agent.OS)"
        path: $(npm_config_cache)
      displayName: 'Cache npm packages'
    
    - script: |
        npm ci
      displayName: 'Install dependencies'
    
    - script: |
        npm run build
      displayName: 'Build application'
    
    - task: CopyFiles@2
      inputs:
        Contents: |
          **/*.js
          package*.json
          !node_modules/**
        TargetFolder: '$(Build.ArtifactStagingDirectory)'
      displayName: 'Copy build files'
    
    - task: PublishBuildArtifacts@1
      inputs:
        PathtoPublish: '$(Build.ArtifactStagingDirectory)'
        ArtifactName: 'build-output'
      displayName: 'Publish build artifacts'

# Stage 2: Quality Checks (Parallel)
- stage: Quality
  displayName: 'Quality Assurance'
  dependsOn: Build
  jobs:
  - job: UnitTests
    displayName: 'Unit Tests'
    steps:
    - template: templates/test-template.yml
      parameters:
        nodeVersion: $(nodeVersion)
  
  - job: CodeCoverage
    displayName: 'Code Coverage'
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: $(nodeVersion)
    
    - script: |
        npm ci
        npm run test:coverage
      displayName: 'Run tests with coverage'
    
    - task: PublishCodeCoverageResults@1
      inputs:
        codeCoverageTool: 'Cobertura'
        summaryFileLocation: '$(System.DefaultWorkingDirectory)/coverage/cobertura-coverage.xml'
      displayName: 'Publish coverage'
  
  - job: Linting
    displayName: 'Code Linting'
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: $(nodeVersion)
    
    - script: |
        npm ci
        npm run lint
      displayName: 'Run linter'

# Stage 3: Security Scanning
- stage: Security
  displayName: 'Security Scanning'
  dependsOn: Build
  jobs:
  - job: DependencyScan
    displayName: 'Dependency Vulnerabilities'
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: $(nodeVersion)
    
    - script: |
        npm ci
        npm audit --audit-level=moderate
      displayName: 'npm audit'
      continueOnError: true

# Stage 4: Integration Tests
- stage: Integration
  displayName: 'Integration Testing'
  dependsOn:
    - Quality
    - Security
  condition: succeeded()
  jobs:
  - job: IntegrationTests
    displayName: 'Run Integration Tests'
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: $(nodeVersion)
    
    - script: |
        npm ci
        npm run test:integration
      displayName: 'Integration tests'

# Stage 5: Package (Main branch only)
- stage: Package
  displayName: 'Create Deployment Package'
  dependsOn: Integration
  condition: and(succeeded(), eq(variables.isMain, true))
  jobs:
  - job: CreatePackage
    displayName: 'Package for Deployment'
    steps:
    - task: DownloadBuildArtifacts@0
      inputs:
        buildType: 'current'
        downloadType: 'single'
        artifactName: 'build-output'
        downloadPath: '$(System.ArtifactsDirectory)'
    
    - task: ArchiveFiles@2
      inputs:
        rootFolderOrFile: '$(System.ArtifactsDirectory)/build-output'
        includeRootFolder: false
        archiveType: 'zip'
        archiveFile: '$(Build.ArtifactStagingDirectory)/app-$(Build.BuildId).zip'
      displayName: 'Create ZIP package'
    
    - task: PublishBuildArtifacts@1
      inputs:
        PathtoPublish: '$(Build.ArtifactStagingDirectory)'
        ArtifactName: 'deployment-package'
      displayName: 'Publish deployment package'
```


**Pipeline execution flow:**

```
Build Stage
    ↓
    ├─→ Quality Stage (parallel)
    │   ├─ Unit Tests
    │   ├─ Code Coverage
    │   └─ Linting
    │
    └─→ Security Stage (parallel)
        └─ Dependency Scan
    ↓
Integration Stage
    ↓
Package Stage (main branch only)
```

**Features included:**
- ✅ Multi-stage pipeline
- ✅ Dependency caching
- ✅ Parallel jobs
- ✅ Code coverage
- ✅ Security scanning
- ✅ Conditional execution
- ✅ Template usage
- ✅ Artifact publishing
- ✅ Branch-specific behavior

---

## Part 12: Best Practices Summary

### Pipeline Design

1. **Use stages for organization**
   - Separate build, test, security, deploy
   - Clear pipeline flow
   - Easy to understand

2. **Leverage caching**
   - Cache npm/pip/maven dependencies
   - Faster builds
   - Reduced network usage

3. **Run jobs in parallel**
   - Independent tests run simultaneously
   - Faster feedback
   - Better resource usage

4. **Use templates**
   - Reusable components
   - Consistency across pipelines
   - Easier maintenance

5. **Implement proper triggers**
   - Branch-specific triggers
   - Path filters (don't rebuild for docs)
   - PR validation

### Testing Strategy

1. **Multiple test levels**
   - Unit tests (fast, many)
   - Integration tests (medium)
   - E2E tests (slow, few)

2. **Code coverage**
   - Measure test quality
   - Enforce minimum coverage
   - Track trends

3. **Matrix builds**
   - Test multiple versions
   - Test multiple OS
   - Catch compatibility issues

### Security

1. **Dependency scanning**
   - npm audit
   - OWASP Dependency Check
   - Regular scans

2. **Secret scanning**
   - Prevent credential leaks
   - Use Azure Key Vault
   - Never commit secrets

3. **Container scanning**
   - Scan Docker images
   - Check for vulnerabilities
   - Use trusted base images

### Performance

1. **Optimize build time**
   - Use caching
   - Parallel jobs
   - Incremental builds

2. **Fail fast**
   - Run quick tests first
   - Stop on critical failures
   - Save build minutes

3. **Resource management**
   - Use appropriate agent pools
   - Clean up after builds
   - Monitor usage


---

## Part 13: Troubleshooting Common Issues

### Issue 1: Pipeline Fails on npm install

**Symptoms:**
- `npm install` fails with network errors
- Timeout errors

**Solutions:**
```yaml
# Use npm ci instead of npm install
- script: |
    npm ci
  displayName: 'Install dependencies'

# Add retry logic
- script: |
    npm ci || npm ci || npm ci
  displayName: 'Install with retry'

# Use caching
- task: Cache@2
  inputs:
    key: 'npm | "$(Agent.OS)" | package-lock.json'
    path: $(npm_config_cache)
```

### Issue 2: Tests Pass Locally but Fail in Pipeline

**Symptoms:**
- Tests work on your machine
- Fail in Azure Pipelines

**Common causes:**
- Environment differences
- Missing environment variables
- Timezone issues
- File path differences (Windows vs Linux)

**Solutions:**
```yaml
# Set environment variables
- script: |
    npm test
  env:
    NODE_ENV: test
    TZ: UTC

# Use cross-platform paths
- script: |
    npm test
  displayName: 'Run tests'
  # Don't hardcode paths like C:\Users\...
```

### Issue 3: Build Takes Too Long

**Symptoms:**
- Pipeline runs for 30+ minutes
- Timeout errors

**Solutions:**
```yaml
# 1. Add caching
- task: Cache@2
  inputs:
    key: 'npm | "$(Agent.OS)" | package-lock.json'
    path: $(npm_config_cache)

# 2. Run jobs in parallel
jobs:
- job: Test1
- job: Test2
- job: Test3

# 3. Use npm ci instead of npm install
- script: npm ci

# 4. Skip unnecessary steps
- script: npm run build
  condition: eq(variables['Build.SourceBranch'], 'refs/heads/main')
```

### Issue 4: Artifacts Not Published

**Symptoms:**
- Artifacts tab is empty
- Can't download build output

**Solutions:**
```yaml
# Check path exists
- script: |
    ls -la $(Build.ArtifactStagingDirectory)
  displayName: 'List files'

# Use correct task
- task: PublishBuildArtifacts@1
  inputs:
    PathtoPublish: '$(Build.ArtifactStagingDirectory)'
    ArtifactName: 'drop'
    publishLocation: 'Container'

# Ensure files are copied first
- task: CopyFiles@2
  inputs:
    Contents: '**'
    TargetFolder: '$(Build.ArtifactStagingDirectory)'
```

### Issue 5: Code Coverage Not Showing

**Symptoms:**
- Coverage tab is empty
- No coverage report

**Solutions:**
```yaml
# 1. Generate coverage in correct format
- script: |
    npm test -- --coverage --coverageReporters=cobertura

# 2. Publish with correct path
- task: PublishCodeCoverageResults@1
  inputs:
    codeCoverageTool: 'Cobertura'
    summaryFileLocation: '$(System.DefaultWorkingDirectory)/coverage/cobertura-coverage.xml'

# 3. Check file exists
- script: |
    ls -la coverage/
  displayName: 'List coverage files'
```

---

## Part 14: Advanced YAML Techniques

### Using Variables

```yaml
# Define variables
variables:
  # Simple variable
  nodeVersion: '18.x'
  
  # Variable group (defined in Azure DevOps)
  - group: 'production-variables'
  
  # Computed variable
  isMain: $[eq(variables['Build.SourceBranch'], 'refs/heads/main')]
  
  # Template variable
  - template: variables/common-vars.yml

# Use variables
steps:
- script: echo $(nodeVersion)
- script: echo ${{ variables.nodeVersion }}  # Compile-time
- script: echo $(isMain)  # Runtime
```

### Using Parameters

```yaml
# Define parameters
parameters:
- name: environment
  type: string
  default: 'dev'
  values:
    - dev
    - staging
    - production

- name: runTests
  type: boolean
  default: true

- name: nodeVersions
  type: object
  default:
    - '16.x'
    - '18.x'
    - '20.x'

# Use parameters
steps:
- script: echo "Deploying to ${{ parameters.environment }}"

- ${{ if eq(parameters.runTests, true) }}:
  - script: npm test

- ${{ each version in parameters.nodeVersions }}:
  - script: echo "Testing Node ${{ version }}"
```

### Using Expressions

```yaml
# Comparison
condition: eq(variables['Build.SourceBranch'], 'refs/heads/main')
condition: ne(variables.isFeature, true)
condition: gt(variables.coveragePercent, 80)

# Logical operators
condition: and(succeeded(), eq(variables.isMain, true))
condition: or(failed(), canceled())
condition: not(eq(variables.skipTests, true))

# String functions
condition: startsWith(variables['Build.SourceBranch'], 'refs/heads/feature/')
condition: endsWith(variables.fileName, '.js')
condition: contains(variables.message, 'breaking change')

# Status functions
condition: succeeded()
condition: failed()
condition: succeededOrFailed()
condition: always()
```


---

## Part 15: Real-World Examples

### Example 1: Monorepo Pipeline

For projects with multiple apps in one repo:

```yaml
# azure-pipelines-monorepo.yml
trigger:
  branches:
    include:
      - main
  paths:
    include:
      - apps/*
      - packages/*

pool:
  vmImage: 'ubuntu-latest'

stages:
- stage: DetectChanges
  displayName: 'Detect Changed Apps'
  jobs:
  - job: DetectJob
    steps:
    - script: |
        # Detect which apps changed
        git diff --name-only HEAD~1 HEAD > changed-files.txt
        
        if grep -q "apps/frontend" changed-files.txt; then
          echo "##vso[task.setvariable variable=frontendChanged;isOutput=true]true"
        fi
        
        if grep -q "apps/backend" changed-files.txt; then
          echo "##vso[task.setvariable variable=backendChanged;isOutput=true]true"
        fi
      name: detectChanges
      displayName: 'Detect changes'

- stage: BuildFrontend
  displayName: 'Build Frontend'
  dependsOn: DetectChanges
  condition: eq(dependencies.DetectChanges.outputs['DetectJob.detectChanges.frontendChanged'], 'true')
  jobs:
  - job: BuildFrontendJob
    steps:
    - script: |
        cd apps/frontend
        npm ci
        npm run build
      displayName: 'Build frontend'

- stage: BuildBackend
  displayName: 'Build Backend'
  dependsOn: DetectChanges
  condition: eq(dependencies.DetectChanges.outputs['DetectJob.detectChanges.backendChanged'], 'true')
  jobs:
  - job: BuildBackendJob
    steps:
    - script: |
        cd apps/backend
        npm ci
        npm run build
      displayName: 'Build backend'
```

### Example 2: Multi-Language Pipeline

For projects with multiple languages:

```yaml
# azure-pipelines-multilang.yml
trigger:
  branches:
    include:
      - main

pool:
  vmImage: 'ubuntu-latest'

stages:
- stage: Build
  jobs:
  # Node.js app
  - job: BuildNodeApp
    displayName: 'Build Node.js App'
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '18.x'
    
    - script: |
        cd nodejs-app
        npm ci
        npm run build
      displayName: 'Build Node app'
  
  # Python app
  - job: BuildPythonApp
    displayName: 'Build Python App'
    steps:
    - task: UsePythonVersion@0
      inputs:
        versionSpec: '3.11'
    
    - script: |
        cd python-app
        pip install -r requirements.txt
        python -m pytest
      displayName: 'Build Python app'
  
  # .NET app
  - job: BuildDotNetApp
    displayName: 'Build .NET App'
    steps:
    - task: UseDotNet@2
      inputs:
        version: '7.x'
    
    - script: |
        cd dotnet-app
        dotnet restore
        dotnet build
        dotnet test
      displayName: 'Build .NET app'
```

### Example 3: Microservices Pipeline

For microservices architecture:

```yaml
# azure-pipelines-microservices.yml
trigger:
  branches:
    include:
      - main

pool:
  vmImage: 'ubuntu-latest'

variables:
  dockerRegistry: 'myregistry.azurecr.io'

stages:
- stage: BuildServices
  displayName: 'Build All Services'
  jobs:
  - job: BuildUserService
    displayName: 'User Service'
    steps:
    - template: templates/build-service.yml
      parameters:
        serviceName: 'user-service'
        servicePort: 3001
  
  - job: BuildOrderService
    displayName: 'Order Service'
    steps:
    - template: templates/build-service.yml
      parameters:
        serviceName: 'order-service'
        servicePort: 3002
  
  - job: BuildPaymentService
    displayName: 'Payment Service'
    steps:
    - template: templates/build-service.yml
      parameters:
        serviceName: 'payment-service'
        servicePort: 3003

- stage: IntegrationTests
  displayName: 'Integration Tests'
  dependsOn: BuildServices
  jobs:
  - job: TestServices
    steps:
    - script: |
        docker-compose up -d
        npm run test:integration
        docker-compose down
      displayName: 'Run integration tests'
```

**Template: `templates/build-service.yml`**

```yaml
# templates/build-service.yml
parameters:
- name: serviceName
  type: string
- name: servicePort
  type: number

steps:
- task: Docker@2
  displayName: 'Build ${{ parameters.serviceName }}'
  inputs:
    command: build
    dockerfile: 'services/${{ parameters.serviceName }}/Dockerfile'
    tags: |
      $(Build.BuildId)
      latest

- task: Docker@2
  displayName: 'Push ${{ parameters.serviceName }}'
  inputs:
    command: push
    containerRegistry: $(dockerRegistry)
    repository: ${{ parameters.serviceName }}
    tags: |
      $(Build.BuildId)
      latest

- script: |
    docker run -d -p ${{ parameters.servicePort }}:${{ parameters.servicePort }} \
      $(dockerRegistry)/${{ parameters.serviceName }}:$(Build.BuildId)
    sleep 5
    curl http://localhost:${{ parameters.servicePort }}/health
  displayName: 'Test ${{ parameters.serviceName }}'
```


---

## Part 16: Performance Optimization Tips

### 1. Optimize npm install

```yaml
# ❌ Slow
- script: npm install

# ✅ Fast
- script: npm ci  # Uses package-lock.json, faster and more reliable

# ✅ Even faster with cache
- task: Cache@2
  inputs:
    key: 'npm | "$(Agent.OS)" | package-lock.json'
    path: $(npm_config_cache)
- script: npm ci
```

### 2. Incremental Builds

```yaml
# Only build what changed
- script: |
    if git diff --name-only HEAD~1 HEAD | grep -q "src/"; then
      npm run build
    else
      echo "No source changes, skipping build"
    fi
```

### 3. Parallel Execution

```yaml
# ❌ Sequential (slow)
- script: npm run test:unit
- script: npm run test:integration
- script: npm run lint

# ✅ Parallel (fast)
jobs:
- job: UnitTests
  steps:
  - script: npm run test:unit
- job: IntegrationTests
  steps:
  - script: npm run test:integration
- job: Lint
  steps:
  - script: npm run lint
```

### 4. Fail Fast

```yaml
# Run quick checks first
stages:
- stage: QuickChecks
  jobs:
  - job: Lint
    steps:
    - script: npm run lint  # Fast, fails early
  
  - job: TypeCheck
    steps:
    - script: npm run type-check  # Fast

- stage: Tests
  dependsOn: QuickChecks  # Only run if quick checks pass
  jobs:
  - job: UnitTests
    steps:
    - script: npm test  # Slower
```

### 5. Selective Testing

```yaml
# Only run affected tests
- script: |
    # Get changed files
    CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD)
    
    # Run tests for changed files only
    if echo "$CHANGED_FILES" | grep -q "src/user"; then
      npm test -- src/user
    fi
```

---

## Summary

You've learned advanced CI concepts:

**Multi-Stage Pipelines:**
- ✅ Organize pipeline into stages
- ✅ Parallel and sequential execution
- ✅ Stage dependencies and conditions

**Matrix Builds:**
- ✅ Test multiple versions simultaneously
- ✅ Test multiple OS
- ✅ Catch compatibility issues

**Caching:**
- ✅ Speed up builds
- ✅ Reduce network usage
- ✅ More reliable builds

**Templates:**
- ✅ Reusable pipeline components
- ✅ Consistency across pipelines
- ✅ Easier maintenance

**Conditional Execution:**
- ✅ Branch-specific behavior
- ✅ Skip unnecessary steps
- ✅ Save build time

**Code Coverage:**
- ✅ Measure test quality
- ✅ Enforce coverage thresholds
- ✅ Track trends

**Security Scanning:**
- ✅ Dependency vulnerabilities
- ✅ Secret detection
- ✅ Container scanning

**Docker Integration:**
- ✅ Build Docker images
- ✅ Push to registry
- ✅ Scan for vulnerabilities

**Advanced Triggers:**
- ✅ Path-based triggers
- ✅ Scheduled builds
- ✅ PR validation

**Parallel Jobs:**
- ✅ Faster execution
- ✅ Better resource usage
- ✅ Independent task execution


---

## Key Takeaways

**Pipeline Design:**
- Use stages to organize major phases
- Run independent jobs in parallel
- Use templates for reusability
- Implement proper error handling

**Performance:**
- Cache dependencies
- Use npm ci instead of npm install
- Fail fast with quick checks first
- Optimize build steps

**Quality:**
- Multiple test levels (unit, integration, e2e)
- Code coverage enforcement
- Matrix builds for compatibility
- Linting and code quality checks

**Security:**
- Dependency scanning (npm audit)
- Secret scanning
- Container vulnerability scanning
- Regular security updates

**Best Practices:**
- Keep pipelines simple and readable
- Use meaningful stage/job names
- Add comments for complex logic
- Monitor pipeline performance
- Regular maintenance and updates

---

## Next Steps

**Practice:**
1. Create a multi-stage pipeline for your project
2. Add matrix builds to test multiple Node versions
3. Implement caching for faster builds
4. Add code coverage reporting
5. Set up security scanning

**Advanced Topics:**
- Self-hosted agents
- Pipeline decorators
- Custom tasks
- Pipeline as code best practices
- Advanced YAML techniques

**Resources:**
- Azure Pipelines documentation
- YAML schema reference
- Task marketplace
- Community templates
- Best practices guide

---

## Comparison: Day 4 vs Day 4 Part 2

**Day 4 (Basics):**
- ✅ Simple single-stage pipeline
- ✅ Basic triggers
- ✅ Simple test execution
- ✅ Artifact publishing
- ✅ Build badge

**Day 4 Part 2 (Advanced):**
- ✅ Multi-stage pipelines
- ✅ Matrix builds
- ✅ Caching
- ✅ Templates
- ✅ Conditional execution
- ✅ Code coverage
- ✅ Security scanning
- ✅ Docker builds
- ✅ Parallel jobs
- ✅ Advanced triggers
- ✅ Production-ready examples

You now have the knowledge to build production-ready CI pipelines! 🚀

