# Day 4: Azure Pipelines - Continuous Integration (CI)

## What is Azure Pipelines?

Azure Pipelines automatically builds and tests code projects. It supports any language, platform, and cloud, using YAML or classic editor.

## Why Use CI?

- Catch bugs early
- Automated testing
- Consistent builds
- Fast feedback to developers
- Reduce integration problems

## How Does CI Work?

1. Developer pushes code
2. Pipeline triggers automatically
3. Code is built
4. Tests run
5. Results reported
6. Artifacts published

## Lab 4: Create Your First CI Pipeline

### Part 1: Prepare Application

1. **Create New Branch**
   ```bash
   git checkout main
   git pull
   git checkout -b feature/add-ci-pipeline
   ```

2. **Create `package.json`**
   ```json
   {
     "name": "hello-devops",
     "version": "1.0.0",
     "description": "Azure DevOps Lab Application",
     "main": "app.js",
     "scripts": {
       "test": "jest",
       "start": "node app.js"
     },
     "devDependencies": {
       "jest": "^29.0.0"
     }
   }
   ```

3. **Create Test File `app.test.js`**
   ```javascript
   const { greet } = require('./app');
   
   describe('Greet Function', () => {
     test('should return greeting with name', () => {
       expect(greet('Azure')).toBe('Hello, Azure!');
     });
     
     test('should return greeting with different name', () => {
       expect(greet('DevOps')).toBe('Hello, DevOps!');
     });
   });
   ```

4. **Commit and Push**
   ```bash
   git add .
   git commit -m "Add package.json and tests"
   git push origin feature/add-ci-pipeline
   ```

### Part 2: Create CI Pipeline

1. **Navigate to Pipelines**
   - Go to Pipelines → Pipelines
   - Click "Create Pipeline"

2. **Select Repository**
   - Choose "Azure Repos Git"
   - Select your `HelloDevOps` repository

3. **Configure Pipeline**
   - Choose "Starter pipeline"
   - Replace content with:

   ```yaml
   # azure-pipelines.yml
   trigger:
     branches:
       include:
         - main
         - feature/*
   
   pool:
     vmImage: 'ubuntu-latest'
   
   variables:
     buildConfiguration: 'Release'
   
   steps:
   - task: NodeTool@0
     inputs:
       versionSpec: '18.x'
     displayName: 'Install Node.js'
   
   - script: |
       npm install
     displayName: 'Install dependencies'
   
   - script: |
       npm test
     displayName: 'Run tests'
   
   - script: |
       echo "Build completed successfully!"
     displayName: 'Build summary'
   
   - task: PublishTestResults@2
     condition: succeededOrFailed()
     inputs:
       testResultsFormat: 'JUnit'
       testResultsFiles: '**/test-results.xml'
       failTaskOnFailedTests: true
     displayName: 'Publish test results'
   
   - task: PublishBuildArtifacts@1
     inputs:
       PathtoPublish: '$(Build.SourcesDirectory)'
       ArtifactName: 'drop'
       publishLocation: 'Container'
     displayName: 'Publish artifacts'
   ```

4. **Save and Run**
   - Click "Save and run"
   - Commit directly to `feature/add-ci-pipeline`
   - Click "Save and run"

5. **Watch Pipeline Execute**
   - Observe each step running
   - Check logs for each task
   - Wait for completion

### Part 3: Understand Pipeline Components

**Trigger**: When pipeline runs
```yaml
trigger:
  branches:
    include:
      - main
      - feature/*
```

**Pool**: Where pipeline runs
```yaml
pool:
  vmImage: 'ubuntu-latest'  # Microsoft-hosted agent
```

**Variables**: Reusable values
```yaml
variables:
  buildConfiguration: 'Release'
```

**Steps**: Tasks to execute
```yaml
steps:
- task: NodeTool@0  # Built-in task
- script: |         # Inline script
    npm install
```

### Part 4: Add Build Badge

1. **Get Badge Markdown**
   - Click "..." on pipeline
   - Select "Status badge"
   - Copy Markdown

2. **Update README**
   - Edit `README.md` in your repo
   - Add badge at top:
   ```markdown
   # Hello DevOps
   
   ![Build Status](badge-url-here)
   
   Azure DevOps learning project.
   ```

3. **Commit Changes**
   ```bash
   git add README.md
   git commit -m "Add build badge"
   git push
   ```

### Part 5: Create Pull Request and Merge

1. **Create PR**
   - Go to Repos → Pull requests
   - Create PR from `feature/add-ci-pipeline` to `main`

2. **Observe Pipeline**
   - Pipeline runs automatically on PR
   - Check status in PR page

3. **Complete PR**
   - Once pipeline succeeds, approve and complete

### Verification
- [ ] Pipeline YAML created
- [ ] Pipeline runs successfully
- [ ] Tests execute
- [ ] Artifacts published
- [ ] Build badge added
- [ ] Pipeline runs on PR

## Key Concepts

- **Pipeline**: Automated workflow
- **Trigger**: Event that starts pipeline
- **Agent**: Machine that runs pipeline
- **Job**: Collection of steps
- **Step**: Individual task or script
- **Artifact**: Output of build

## Pipeline YAML Structure

```yaml
trigger: [when to run]
pool: [where to run]
variables: [reusable values]
stages: [major phases]
  jobs: [units of work]
    steps: [individual tasks]
```

## Common Tasks

- `NodeTool@0`: Install Node.js
- `UsePythonVersion@0`: Install Python
- `PublishTestResults@2`: Publish test results
- `PublishBuildArtifacts@1`: Publish artifacts
- `CopyFiles@2`: Copy files
- `ArchiveFiles@2`: Create archive

## Next Steps
Tomorrow we'll explore continuous deployment (CD) and release pipelines.
