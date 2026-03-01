# Day 8: Security & Compliance in Azure DevOps

## What is DevSecOps?

DevSecOps integrates security practices into the DevOps process, making security a shared responsibility throughout the development lifecycle.

## Why Security Matters?

- Protect sensitive data
- Prevent vulnerabilities
- Comply with regulations
- Build customer trust
- Reduce security incidents

## Security Layers

1. Code security (secrets, vulnerabilities)
2. Pipeline security (permissions, approvals)
3. Infrastructure security (network, access)
4. Compliance (auditing, policies)

## Lab 8: Implement Security Best Practices

### Part 1: Secure Secrets Management

1. **Create Variable Group with Secrets**
   - Go to Pipelines → Library
   - Click "Variable group"
   - Name: `secure-config`
   - Add variables:
     - `API_KEY`: [value]
     - Click lock icon to make it secret
     - `DATABASE_PASSWORD`: [value] (secret)
   - Click "Save"

2. **Link to Azure Key Vault (Optional)**
   - In variable group settings
   - Toggle "Link secrets from an Azure key vault"
   - Select subscription and key vault
   - Authorize and select secrets

3. **Use Secrets in Pipeline**
   ```yaml
   variables:
   - group: secure-config
   
   steps:
   - script: |
       echo "Using API Key"
       # API_KEY is available but not printed
       echo "##vso[task.setvariable variable=mySecret;issecret=true]$(API_KEY)"
     displayName: 'Use secret safely'
     env:
       API_KEY: $(API_KEY)
   ```

### Part 2: Scan for Vulnerabilities

1. **Add Dependency Scanning**
   Create `.github/dependabot.yml` (if using GitHub) or use pipeline:
   ```yaml
   - script: |
       npm audit --audit-level=moderate
     displayName: 'Check for vulnerabilities'
     continueOnError: true
   ```

2. **Add OWASP Dependency Check**
   ```yaml
   - task: dependency-check-build-task@6
     inputs:
       projectName: 'HelloDevOps'
       scanPath: '$(Build.SourcesDirectory)'
       format: 'HTML'
     displayName: 'OWASP Dependency Check'
   ```

3. **Add Code Scanning**
   ```yaml
   - script: |
       npm install -g eslint
       eslint . --format json --output-file eslint-report.json
     displayName: 'Run ESLint'
     continueOnError: true
   ```

### Part 3: Branch Protection

1. **Configure Branch Policies**
   - Go to Repos → Branches
   - Click "..." on main → Branch policies
   - Enable:
     - Require minimum 2 reviewers
     - Check for linked work items
     - Check for comment resolution
     - Limit merge types (squash only)

2. **Add Build Validation**
   - In branch policies
   - Click "+" under Build validation
   - Select your CI pipeline
   - Policy requirement: Required
   - Build expiration: Immediately
   - Save

3. **Add Status Checks**
   - Require specific checks to pass
   - Security scans must succeed
   - Code coverage threshold met

### Part 4: Pipeline Permissions

1. **Restrict Pipeline Permissions**
   - Go to Project Settings → Pipelines → Settings
   - Disable "Allow pipelines to access all repositories"
   - Require explicit approval for resources

2. **Set Agent Pool Permissions**
   - Project Settings → Agent pools
   - Select pool → Security
   - Add users/groups with specific roles

3. **Environment Approvals**
   - Pipelines → Environments → Production
   - Add approvals and checks:
     - Required reviewers
     - Business hours only
     - Invoke Azure Function (for custom checks)

### Part 5: Audit and Compliance

1. **Enable Audit Logging**
   - Organization Settings → Auditing
   - Enable auditing
   - Review audit logs regularly

2. **Create Compliance Pipeline**
   ```yaml
   trigger: none
   
   schedules:
   - cron: "0 0 * * *"
     displayName: Daily compliance check
     branches:
       include:
       - main
   
   steps:
   - script: |
       echo "Checking compliance..."
       # Check for secrets in code
       git log -p | grep -i "password\|api_key\|secret" && exit 1 || exit 0
     displayName: 'Scan for exposed secrets'
   
   - script: |
       # Check license compliance
       npm install -g license-checker
       license-checker --production --onlyAllow "MIT;Apache-2.0;BSD"
     displayName: 'Check license compliance'
   ```

3. **Security Checklist**
   Create `SECURITY.md`:
   ```markdown
   # Security Policy
   
   ## Reporting Vulnerabilities
   Report to: security@example.com
   
   ## Security Measures
   - [ ] All secrets in Key Vault
   - [ ] Branch protection enabled
   - [ ] Required code reviews
   - [ ] Automated security scans
   - [ ] Regular dependency updates
   - [ ] Audit logging enabled
   ```

### Part 6: Secure Coding Practices

1. **Create `.gitignore`**
   ```
   node_modules/
   .env
   .env.local
   *.log
   .DS_Store
   secrets/
   *.key
   *.pem
   config/local.json
   ```

2. **Pre-commit Hook**
   Create `.git/hooks/pre-commit`:
   ```bash
   #!/bin/sh
   # Check for secrets
   if git diff --cached | grep -i "password\|api_key\|secret"; then
     echo "Error: Potential secret detected!"
     exit 1
   fi
   ```

3. **Environment Variables Template**
   Create `.env.example`:
   ```
   API_KEY=your_api_key_here
   DATABASE_URL=your_database_url
   SECRET_KEY=your_secret_key
   ```

### Verification
- [ ] Secrets stored securely
- [ ] Vulnerability scanning enabled
- [ ] Branch policies configured
- [ ] Pipeline permissions restricted
- [ ] Audit logging enabled
- [ ] Security checklist created

## Key Concepts

- **Secret**: Sensitive data (passwords, keys)
- **Vulnerability**: Security weakness
- **Branch Policy**: Rules for code changes
- **Audit Log**: Record of actions
- **Compliance**: Meeting security standards

## Security Best Practices

1. Never commit secrets to code
2. Use managed identities when possible
3. Rotate secrets regularly
4. Implement least privilege access
5. Enable multi-factor authentication
6. Regular security training
7. Automated security scanning
8. Keep dependencies updated

## Common Vulnerabilities

- **Hardcoded secrets**: Use Key Vault
- **SQL injection**: Use parameterized queries
- **XSS**: Sanitize user input
- **Outdated dependencies**: Regular updates
- **Weak authentication**: Use OAuth/OIDC

## Compliance Frameworks

- **GDPR**: Data protection
- **SOC 2**: Security controls
- **HIPAA**: Healthcare data
- **PCI DSS**: Payment card data

## Next Steps
Tomorrow we'll explore monitoring and feedback loops.
