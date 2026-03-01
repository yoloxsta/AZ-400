# Day 7: Azure Artifacts - Package Management

## What is Azure Artifacts?

Azure Artifacts is a package management service that allows you to create, host, and share packages (npm, NuGet, Maven, Python, Universal).

## Why Use Azure Artifacts?

- Host private packages
- Share code across teams
- Version control for packages
- Integrate with CI/CD pipelines
- Upstream sources (proxy for public registries)

## How Does It Work?

1. Create feed (package repository)
2. Publish packages to feed
3. Consume packages from feed
4. Manage versions and permissions

## Lab 7: Create and Use Package Feeds

### Part 1: Create Azure Artifacts Feed

1. **Navigate to Artifacts**
   - Go to Artifacts in Azure DevOps
   - Click "Create Feed"

2. **Configure Feed**
   - Name: `hello-devops-packages`
   - Visibility: Organization
   - Upstream sources: Check "Include packages from common public sources"
   - Click "Create"

3. **Connect to Feed**
   - Click "Connect to feed"
   - Select "npm"
   - Copy the registry URL

### Part 2: Create and Publish npm Package

1. **Create New Branch**
   ```bash
   git checkout main
   git pull
   git checkout -b feature/create-package
   ```

2. **Create Package Directory**
   ```bash
   mkdir packages
   cd packages
   mkdir math-utils
   cd math-utils
   ```

3. **Create `package.json`**
   ```json
   {
     "name": "@yourorg/math-utils",
     "version": "1.0.0",
     "description": "Math utility functions",
     "main": "index.js",
     "scripts": {
       "test": "jest"
     },
     "keywords": ["math", "utilities"],
     "author": "Your Name",
     "license": "MIT"
   }
   ```

4. **Create `index.js`**
   ```javascript
   function add(a, b) {
     return a + b;
   }
   
   function multiply(a, b) {
     return a * b;
   }
   
   function factorial(n) {
     if (n <= 1) return 1;
     return n * factorial(n - 1);
   }
   
   module.exports = { add, multiply, factorial };
   ```

5. **Setup Authentication**
   ```bash
   # Create .npmrc in package directory
   echo "registry=https://pkgs.dev.azure.com/[org]/_packaging/[feed]/npm/registry/" > .npmrc
   echo "always-auth=true" >> .npmrc
   ```

6. **Publish Package**
   ```bash
   npm install
   npm publish
   ```

### Part 3: Consume Package

1. **In Another Project**
   ```bash
   cd ../..
   npm config set registry https://pkgs.dev.azure.com/[org]/_packaging/[feed]/npm/registry/
   npm install @yourorg/math-utils
   ```

2. **Use Package**
   Create `use-package.js`:
   ```javascript
   const { add, multiply, factorial } = require('@yourorg/math-utils');
   
   console.log('5 + 3 =', add(5, 3));
   console.log('5 * 3 =', multiply(5, 3));
   console.log('5! =', factorial(5));
   ```

### Part 4: Automate Package Publishing

1. **Add to Pipeline**
   ```yaml
   - stage: PublishPackage
     displayName: 'Publish to Artifacts'
     dependsOn: Build
     condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
     jobs:
     - job: Publish
       pool:
         vmImage: 'ubuntu-latest'
       steps:
       - task: NodeTool@0
         inputs:
           versionSpec: '18.x'
       
       - task: npmAuthenticate@0
         inputs:
           workingFile: 'packages/math-utils/.npmrc'
       
       - script: |
           cd packages/math-utils
           npm version patch
           npm publish
         displayName: 'Publish package'
   ```

### Part 5: Upstream Sources

1. **Configure Upstream**
   - In your feed settings
   - Click "Upstream sources"
   - Add npmjs.org as upstream
   - This allows your feed to proxy public packages

2. **Benefits**
   - Single source for all packages
   - Cache public packages
   - Control what's available
   - Offline capability

### Verification
- [ ] Feed created
- [ ] Package published
- [ ] Package consumed in another project
- [ ] Pipeline publishes automatically
- [ ] Upstream sources configured

## Key Concepts

- **Feed**: Repository for packages
- **Package**: Versioned code artifact
- **Upstream Source**: Proxy to public registries
- **Scope**: Package namespace (@org/package)
- **Semantic Versioning**: Major.Minor.Patch

## Package Types

- **npm**: JavaScript/Node.js
- **NuGet**: .NET
- **Maven**: Java
- **Python**: Python packages
- **Universal**: Any file type

## Versioning Best Practices

- **Major** (1.0.0): Breaking changes
- **Minor** (0.1.0): New features, backward compatible
- **Patch** (0.0.1): Bug fixes

## Commands Reference

```bash
npm publish              # Publish package
npm version patch        # Increment patch version
npm version minor        # Increment minor version
npm version major        # Increment major version
npm unpublish [pkg]@[v]  # Remove version
```

## Next Steps
Tomorrow we'll explore security and compliance in Azure DevOps.
