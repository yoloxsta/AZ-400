# Day 10: Advanced Topics & Best Practices

## What's Next?

After mastering the basics, explore advanced Azure DevOps patterns and practices for enterprise-scale implementations.

## Advanced Topics Overview

1. Multi-stage pipelines with gates
2. Infrastructure as Code (IaC)
3. GitOps workflows
4. Service connections
5. Extensions and marketplace

## Lab 10: Advanced Pipeline Patterns

### Part 1: Pipeline Templates

1. **Create Reusable Template**
   Create `templates/build-template.yml`:
   ```yaml
   parameters:
   - name: nodeVersion
     type: string
     default: '18.x'
   - name: runTests
     type: boolean
     default: true
   
   steps:
   - task: NodeTool@0
     inputs:
       versionSpec: ${{ parameters.nodeVersion }}
     displayName: 'Install Node.js ${{ parameters.nodeVersion }}'
   
   - script: npm install
     displayName: 'Install dependencies'
   
   - ${{ if eq(parameters.runTests, true) }}:
     - script: npm test
       displayName: 'Run tests'
   
   - script: npm run build
     displayName: 'Build application'
   ```

2. **Use Template in Pipeline**
   ```yaml
   trigger:
     - main
   
   stages:
   - stage: Build
     jobs:
     - job: BuildJob
       pool:
         vmImage: 'ubuntu-latest'
       steps:
       - template: templates/build-template.yml
         parameters:
           nodeVersion: '18.x'
           runTests: true
   ```

### Part 2: Matrix Strategy

1. **Test Multiple Versions**
   ```yaml
   strategy:
     matrix:
       Node16:
         nodeVersion: '16.x'
       Node18:
         nodeVersion: '18.x'
       Node20:
         nodeVersion: '20.x'
   
   steps:
   - task: NodeTool@0
     inputs:
       versionSpec: $(nodeVersion)
   - script: npm test
   ```

### Part 3: Deployment Gates

1. **Add Pre-Deployment Gate**
   - Go to Environment → Production
   - Approvals and checks → Add check
   - Select "Invoke Azure Function"
   - Configure function to check:
     - No active incidents
     - Business hours
     - Change approval exists

2. **Query Work Items Gate**
   ```yaml
   - task: QueryWorkItems@0
     inputs:
       queryId: 'your-query-id'
       maxThreshold: '0'
     displayName: 'Check for blocking bugs'
   ```

### Part 4: Infrastructure as Code

1. **Create ARM Template**
   Create `infrastructure/webapp.json`:
   ```json
   {
     "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
     "contentVersion": "1.0.0.0",
     "parameters": {
       "webAppName": {
         "type": "string"
       }
     },
     "resources": [
       {
         "type": "Microsoft.Web/sites",
         "apiVersion": "2021-02-01",
         "name": "[parameters('webAppName')]",
         "location": "[resourceGroup().location]",
         "properties": {
           "serverFarmId": "[resourceId('Microsoft.Web/serverfarms', 'myAppServicePlan')]"
         }
       }
     ]
   }
   ```

2. **Deploy with Pipeline**
   ```yaml
   - task: AzureResourceManagerTemplateDeployment@3
     inputs:
       deploymentScope: 'Resource Group'
       azureResourceManagerConnection: 'Azure-Connection'
       subscriptionId: 'your-subscription-id'
       action: 'Create Or Update Resource Group'
       resourceGroupName: 'myResourceGroup'
       location: 'East US'
       templateLocation: 'Linked artifact'
       csmFile: 'infrastructure/webapp.json'
       overrideParameters: '-webAppName myWebApp'
   ```

### Part 5: GitOps Pattern

1. **Separate Config Repository**
   - Create new repo: `app-config`
   - Store environment configs
   - Pipeline updates config
   - Separate pipeline deploys from config

2. **Config Update Pipeline**
   ```yaml
   trigger:
     branches:
       include:
         - main
   
   steps:
   - checkout: self
   - checkout: git://ProjectName/app-config
   
   - script: |
       cd app-config
       sed -i 's/version: .*/version: $(Build.BuildNumber)/' production/config.yaml
       git config user.email "pipeline@azuredevops.com"
       git config user.name "Azure Pipeline"
       git add .
       git commit -m "Update to version $(Build.BuildNumber)"
       git push
     displayName: 'Update config repository'
   ```

### Part 6: Service Connections

1. **Create Service Connection**
   - Project Settings → Service connections
   - New service connection
   - Types:
     - Azure Resource Manager
     - Docker Registry
     - Kubernetes
     - GitHub
     - npm

2. **Use in Pipeline**
   ```yaml
   - task: Docker@2
     inputs:
       containerRegistry: 'MyDockerRegistry'
       command: 'buildAndPush'
       repository: 'myapp'
       tags: '$(Build.BuildNumber)'
   ```

### Part 7: Extensions

1. **Install Useful Extensions**
   - Organization Settings → Extensions
   - Browse marketplace:
     - WhiteSource Bolt (security)
     - SonarCloud (code quality)
     - Slack Notifications
     - GitVersion (versioning)

2. **Use Extension in Pipeline**
   ```yaml
   - task: SonarCloudPrepare@1
     inputs:
       SonarCloud: 'SonarCloud-Connection'
       organization: 'your-org'
       scannerMode: 'CLI'
   ```

### Part 8: Best Practices Summary

1. **Pipeline Design**
   - Use YAML over classic
   - Implement templates for reusability
   - Separate build and deploy
   - Use stages for environments
   - Implement proper error handling

2. **Security**
   - Never hardcode secrets
   - Use service connections
   - Implement least privilege
   - Regular security scans
   - Audit access regularly

3. **Testing**
   - Unit tests in CI
   - Integration tests in CD
   - Smoke tests after deployment
   - Performance tests regularly
   - Security tests automated

4. **Monitoring**
   - Track DORA metrics
   - Set up alerts
   - Create dashboards
   - Regular retrospectives
   - Continuous improvement

### Part 9: Real-World Scenario

**Complete Pipeline Example**:
```yaml
trigger:
  branches:
    include:
      - main
      - release/*

variables:
- group: production-secrets
- name: buildConfiguration
  value: 'Release'

stages:
- stage: Build
  jobs:
  - job: BuildAndTest
    pool:
      vmImage: 'ubuntu-latest'
    steps:
    - template: templates/build-template.yml
    - template: templates/test-template.yml
    - template: templates/security-scan-template.yml

- stage: DeployDev
  dependsOn: Build
  jobs:
  - deployment: DeployToDev
    environment: Development
    strategy:
      runOnce:
        deploy:
          steps:
          - template: templates/deploy-template.yml
            parameters:
              environment: 'dev'

- stage: DeployProd
  dependsOn: DeployDev
  condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
  jobs:
  - deployment: DeployToProduction
    environment: Production
    strategy:
      runOnce:
        preDeploy:
          steps:
          - task: QueryWorkItems@0
            inputs:
              queryId: 'blocking-bugs-query'
        deploy:
          steps:
          - template: templates/deploy-template.yml
            parameters:
              environment: 'prod'
        postDeploy:
          steps:
          - template: templates/health-check-template.yml
```

### Verification
- [ ] Templates created and used
- [ ] Matrix strategy implemented
- [ ] Deployment gates configured
- [ ] IaC implemented
- [ ] Service connections configured
- [ ] Extensions installed

## Key Concepts

- **Template**: Reusable pipeline code
- **Matrix**: Run job with multiple configurations
- **Gate**: Automated check before deployment
- **IaC**: Infrastructure as Code
- **GitOps**: Git as single source of truth

## Advanced Patterns

1. **Blue-Green Deployment**
   - Two identical environments
   - Deploy to inactive
   - Switch traffic
   - Instant rollback

2. **Canary Deployment**
   - Deploy to subset of users
   - Monitor metrics
   - Gradually increase
   - Rollback if issues

3. **Feature Flags**
   - Deploy code disabled
   - Enable for specific users
   - A/B testing
   - Safe rollout

## Resources

- [Azure DevOps Documentation](https://docs.microsoft.com/azure/devops)
- [YAML Schema Reference](https://docs.microsoft.com/azure/devops/pipelines/yaml-schema)
- [Marketplace Extensions](https://marketplace.visualstudio.com/azuredevops)
- [DevOps Best Practices](https://docs.microsoft.com/azure/devops/learn/)

## Congratulations!

You've completed the 10-day Azure DevOps learning path! You now have:
- Understanding of all Azure DevOps services
- Hands-on experience with CI/CD pipelines
- Knowledge of security and compliance
- Skills in monitoring and feedback
- Advanced patterns and best practices

## Next Steps

1. Build a real project using Azure DevOps
2. Contribute to open source projects
3. Get Azure DevOps certification
4. Explore advanced topics (Kubernetes, Terraform)
5. Share knowledge with your team
