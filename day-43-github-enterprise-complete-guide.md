# Day 43: GitHub Enterprise - Complete Guide
## Mastering GitHub for Enterprise Software Development

> **🎯 Objective:** Learn GitHub Enterprise features comprehensively - from source control management to CI/CD, security, and release management.

---

## Table of Contents

1. [GitHub Enterprise Overview](#1-github-enterprise-overview)
2. [Part A — Source Control Management (SCM)](#part-a--source-control-management-scm)
3. [Part B — Branch Strategy](#part-b--branch-strategy)
4. [Part C — Branch Protection & Policies](#part-c--branch-protection--policies)
5. [Part D — Pull Request Workflow](#part-d--pull-request-workflow)
6. [Part E — GitHub Actions (CI/CD)](#part-e--github-actions-cicd)
7. [Part F — Artifacts & Packages](#part-f--artifacts--packages)
8. [Part G — Software Release Process](#part-g--software-release-process)
9. [Part H — Tags & Releases](#part-h--tags--releases)
10. [Part I — Code Scanning & Security](#part-i--code-scanning--security)
11. [Part J — GitHub Enterprise Features](#part-j--github-enterprise-features)
12. [Part K — Repository Rulesets & Advanced Policies](#part-k--repository-rulesets--advanced-policies)
13. [Part L — GitHub Issues, Projects & Discussions](#part-l--github-issues-projects--discussions)
14. [Part M — Custom GitHub Actions](#part-m--custom-github-actions)
15. [Part N — GitHub Advanced Security (GHAS)](#part-n--github-advanced-security-ghas)
16. [Part O — GitHub API, Webhooks & Integrations](#part-o--github-api-webhooks--integrations)
17. [Part P — GitHub Copilot for Enterprise](#part-p--github-copilot-for-enterprise)
18. [Summary & Best Practices](#summary--best-practices)

---

## 1. GitHub Enterprise Overview

### What is GitHub Enterprise?

GitHub Enterprise is the enterprise-grade version of GitHub that organizations can host on their own infrastructure (GitHub Enterprise Server) or use as a cloud service (GitHub Enterprise Cloud).

### GitHub Enterprise vs GitHub.com

| Feature | GitHub.com | GitHub Enterprise Cloud | GitHub Enterprise Server |
|---------|------------|------------------------|-------------------------|
| **Hosting** | GitHub-hosted | GitHub-hosted | Self-hosted |
| **SAML SSO** | ❌ | ✅ | ✅ |
| **Advanced Security** | Limited | ✅ | ✅ |
| **Audit Logs** | Limited | ✅ | ✅ |
| **Compliance** | Standard | Enhanced | Full Control |
| **Custom Domain** | ❌ | ✅ | ✅ |
| **Self-hosted Runners** | ✅ | ✅ | ✅ |

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        GitHub Enterprise Architecture                         │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                          Organization                                │   │
│  │                                                                      │   │
│  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │   │
│  │   │   Team A    │  │   Team B    │  │   Team C    │                │   │
│  │   │             │  │             │  │             │                │   │
│  │   │  ┌───────┐  │  │  ┌───────┐  │  │  ┌───────┐  │                │   │
│  │   │  │ Repo1 │  │  │  │ Repo2 │  │  │  │ Repo3 │  │                │   │
│  │   │  └───────┘  │  │  └───────┘  │  │  └───────┘  │                │   │
│  │   │  ┌───────┐  │  │  ┌───────┐  │  │  ┌───────┐  │                │   │
│  │   │  │ Repo2 │  │  │  │ Repo3 │  │  │  │ Repo4 │  │                │   │
│  │   │  └───────┘  │  │  └───────┘  │  │  └───────┘  │                │   │
│  │   └─────────────┘  └─────────────┘  └─────────────┘                │   │
│  │                                                                      │   │
│  │   ┌──────────────────────────────────────────────────────────────┐  │   │
│  │   │                    GitHub Actions                             │  │   │
│  │   │  ┌────────────┐  ┌────────────┐  ┌────────────┐             │  │   │
│  │   │  │   CI/CD    │  │  Security  │  │  Releases  │             │  │   │
│  │   │  │ Pipelines  │  │  Scanning  │  │   & Deps   │             │  │   │
│  │   │  └────────────┘  └────────────┘  └────────────┘             │  │   │
│  │   └──────────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Part A — Source Control Management (SCM)

### A.1 Repository Structure

A well-organized repository structure is essential for maintainability.

```
my-project/
├── .github/
│   ├── workflows/           # GitHub Actions workflows
│   │   ├── ci.yml
│   │   ├── cd.yml
│   │   └── security.yml
│   ├── ISSUE_TEMPLATE/      # Issue templates
│   ├── PULL_REQUEST_TEMPLATE.md
│   ├── CODEOWNERS           # Code ownership
│   └── dependabot.yml       # Dependabot config
├── src/                     # Source code
├── tests/                   # Test files
├── docs/                    # Documentation
├── scripts/                 # Utility scripts
├── .gitignore               # Git ignore patterns
├── .dockerignore            # Docker ignore patterns
├── README.md                # Project README
├── LICENSE                  # License file
├── CHANGELOG.md             # Change history
├── Dockerfile               # Container definition
├── docker-compose.yml       # Multi-container setup
└── package.json / pom.xml   # Dependency management
```

### A.2 Creating a Repository

**Via GitHub UI:**

1. Navigate to your organization
2. Click **New repository**
3. Configure:
   - **Repository name**: `my-project` (use kebab-case)
   - **Description**: Brief description of the project
   - **Visibility**: Public / Private / Internal
   - **Initialize with**:
     - ✅ Add a README file
     - ✅ Add .gitignore (select template)
     - ✅ Choose a license (MIT, Apache 2.0, etc.)

**Via CLI:**

```bash
# Create repository using GitHub CLI
gh repo create my-org/my-project --private --clone

# Initialize with README
echo "# My Project" > README.md
git add README.md
git commit -m "Initial commit"
git push -u origin main
```

### A.3 Git Configuration Best Practices

```bash
# Configure user information
git config --global user.name "Your Name"
git config --global user.email "your.email@company.com"

# Configure line endings (Windows)
git config --global core.autocrlf true

# Configure line endings (Linux/Mac)
git config --global core.autocrlf input

# Configure default branch name
git config --global init.defaultBranch main

# Configure pull behavior
git config --global pull.rebase false

# View configuration
git config --global --list
```

### A.4 Essential .gitignore Patterns

Create `.gitignore`:

```gitignore
# Dependencies
node_modules/
vendor/
*.dll

# Build outputs
dist/
build/
target/
bin/
obj/

# IDE
.idea/
.vscode/
*.suo
*.user

# OS files
.DS_Store
Thumbs.db

# Environment files
.env
.env.local
.env.*.local

# Logs
*.log
logs/

# Secrets (NEVER commit these)
*.pem
*.key
secrets.json
credentials.json
```

### A.5 Commit Message Best Practices

Follow the **Conventional Commits** specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Types:**
| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Code style (formatting) |
| `refactor` | Code refactoring |
| `test` | Adding/updating tests |
| `chore` | Maintenance tasks |
| `ci` | CI/CD changes |
| `perf` | Performance improvement |

**Examples:**

```bash
# Feature commit
git commit -m "feat(auth): add OAuth2 login support"

# Bug fix commit
git commit -m "fix(api): resolve null pointer in user service"

# Breaking change
git commit -m "feat(api)!: change user API response format

BREAKING CHANGE: The user API now returns user object instead of array"

# With issue reference
git commit -m "fix(ui): resolve button alignment issue

Closes #123"
```

---

## Part B — Branch Strategy

### B.1 Git Flow Strategy

Best for: Projects with scheduled releases, multiple versions in production.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Git Flow Branching Model                           │
│                                                                             │
│  main (production)                                                          │
│    │                                                                        │
│    ├──────────────────────────────────────────────────────●                │
│    │                                                       │                │
│    │                           ┌───────────────────────●───┘ (release)      │
│    │                           │                       │                    │
│    │   develop                ●───────────────────────●                    │
│    │   (integration)          │                       │                    │
│    │                          │                       │                    │
│    │   feature/user-auth ─────●                       │                    │
│    │                          │                       │                    │
│    │   feature/api ───────────●                       │                    │
│    │                          │                       │                    │
│    │   hotfix/bug-123 ────────────────────────────────●────● (hotfix)      │
│    │                                                                        │
│    │                                                                        │
└────┴────────────────────────────────────────────────────────────────────────┘

Branch Types:
- main: Production-ready code
- develop: Integration branch
- feature/*: New features
- release/*: Release preparation
- hotfix/*: Production bug fixes
```

### B.2 GitHub Flow Strategy

Best for: Continuous deployment, web applications, single version.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          GitHub Flow Branching Model                         │
│                                                                             │
│  main (always deployable)                                                   │
│    │                                                                        │
│    ├────────────────────────────────────────────────────────────●           │
│    │                                                            │           │
│    │    feature/add-login ─────────────────────────────────────●           │
│    │                                                            │           │
│    │    feature/add-dashboard ────────────────●                │           │
│    │                                          │                │           │
│    │    hotfix/fix-login ──────────────────────────────────────●           │
│    │                                                           │            │
└────┴────────────────────────────────────────────────────────────────────────┘

Process:
1. Create branch from main
2. Make changes + commits
3. Open Pull Request
4. Review + Discussion
5. Merge to main
6. Deploy immediately
```

### B.3 Trunk-Based Development

Best for: Experienced teams, continuous deployment, feature flags.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Trunk-Based Development Model                          │
│                                                                             │
│  trunk (main)                                                               │
│    │                                                                        │
│    ├────●────────●────────●────────●────────●────────●                     │
│    │             │        │        │        │                             │
│    │   short-lived feature branches (max 1-2 days)                         │
│    │             │        │        │        │                             │
│    │             ●────────        ●────────                               │
│    │                                                                        │
│    │   Feature flags control incomplete features                           │
│    │                                                                        │
└────┴────────────────────────────────────────────────────────────────────────┘

Rules:
- All developers commit to trunk (main)
- Feature branches are short-lived (< 2 days)
- Use feature flags for incomplete work
- Automated testing on every commit
- Fast deployments
```

### B.4 Choosing Your Strategy

| Strategy | Use When | Pros | Cons |
|----------|----------|------|------|
| **Git Flow** | Scheduled releases, multiple versions | Clear separation, good for teams | Complex, slower |
| **GitHub Flow** | Continuous deployment, single version | Simple, fast, PR-focused | No release branches |
| **Trunk-Based** | Experienced teams, feature flags | Fastest, least branching overhead | Requires discipline |

### B.5 Branch Naming Conventions

```bash
# Feature branches
feature/ABC-123-add-user-authentication
feature/ABC-124-implement-dashboard

# Bug fix branches
fix/ABC-125-login-validation-error
bugfix/ABC-126-dashboard-crash

# Release branches
release/v1.2.0
release/2024.01

# Hotfix branches
hotfix/ABC-127-critical-security-patch
hotfix/v1.1.1

# Chore branches
chore/update-dependencies
chore/upgrade-node-version

# Documentation branches
docs/update-readme
docs/api-documentation
```

---

## Part C — Branch Protection & Policies

### C.1 Creating Branch Protection Rules

**Via GitHub UI:**

1. Go to repository → **Settings** → **Branches**
2. Click **Add branch protection rule**
3. Configure protection for `main` branch:

```
Branch name pattern: main

☑ Require a pull request before merging
  ☑ Require approvals: 2
  ☑ Dismiss stale pull request approvals when new commits are pushed
  ☑ Require review from Code Owners
  ☑ Require status checks to pass before merging
    ☑ Require branches to be up to date before merging
    Status checks: ci-test, security-scan
  ☑ Require conversation resolution before merging

☑ Require signed commits

☑ Require linear history

☑ Include administrators

☑ Restrict who can push to matching branches
  (Add teams/users)

☑ Allow force pushes (NOT recommended for main)

☑ Allow deletions (NOT recommended for main)
```

### C.2 CODEOWNERS File

Create `.github/CODEOWNERS`:

```
# CODEOWNERS - Define code ownership and required reviewers

# Default owners for everything
* @org/engineering-team

# Frontend code
/src/frontend/ @org/frontend-team @org/frontend-lead

# Backend code
/src/backend/ @org/backend-team @org/backend-lead

# Infrastructure
/infrastructure/ @org/devops-team @org/platform-team

# Kubernetes manifests
*.yaml @org/devops-team @org/platform-team

# Documentation
/docs/ @org/tech-writers
README.md @org/tech-writers

# Security-sensitive files
/security/ @org/security-team
.github/workflows/*.yml @org/devops-team @org/security-team

# Database migrations
/src/database/migrations/ @org/dba-team
```

### C.3 Required Status Checks

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Linter
        run: npm run lint

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Tests
        run: npm test

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Security Scan
        uses: github/codeql-action/analyze@v3
```

### C.4 Enforcing Branch Policies

**Example: Enterprise Branch Policy**

```yaml
# Required checks before merge
required_status_checks:
  strict: true
  contexts:
    - ci/lint
    - ci/test
    - ci/build
    - security/dependency-scan
    - security/code-scan

# Required approvals
required_pull_request_reviews:
  dismiss_stale_reviews: true
  require_code_owner_reviews: true
  required_approving_review_count: 2

# Other restrictions
enforce_admins: true
required_linear_history: true
allow_force_pushes: false
allow_deletions: false
```

---

## Part D — Pull Request Workflow

### D.1 Creating a Pull Request

**Step 1: Create Feature Branch**

```bash
# Update main branch
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/ABC-123-add-user-auth

# Make changes and commit
git add .
git commit -m "feat(auth): add user authentication"
git push origin feature/ABC-123-add-user-auth
```

**Step 2: Create PR via GitHub UI**

1. Go to repository on GitHub
2. Click **Compare & pull request** button
3. Configure PR:
   - **Base**: `main`
   - **Compare**: `feature/ABC-123-add-user-auth`
   - **Title**: `feat(auth): add user authentication`
   - **Description**:
```markdown
## Description
Implements user authentication with JWT tokens.

## Changes
- Added login/logout endpoints
- Implemented JWT token generation
- Added authentication middleware
- Updated user model

## Testing
- [ ] Unit tests added
- [ ] Integration tests added
- [ ] Manual testing completed

## Screenshots
(If applicable)

## Related Issues
Closes #123

## Checklist
- [x] Code follows style guidelines
- [x] Documentation updated
- [x] Tests pass locally
- [x] No new warnings
```

**Step 3: Create PR via CLI**

```bash
gh pr create \
  --title "feat(auth): add user authentication" \
  --body "Implements user authentication with JWT tokens. Closes #123." \
  --base main \
  --assignee @me \
  --label "enhancement,backend"
```

### D.2 Pull Request Template

Create `.github/PULL_REQUEST_TEMPLATE.md`:

```markdown
## Description
<!-- Provide a clear description of your changes -->

## Type of Change
<!-- Mark the relevant option with an 'x' -->
- [ ] 🐛 Bug fix (non-breaking change fixing an issue)
- [ ] ✨ New feature (non-breaking change adding functionality)
- [ ] 💥 Breaking change (fix or feature causing existing functionality to change)
- [ ] 📚 Documentation update
- [ ] 🔧 Chore (maintenance, dependencies, CI/CD)
- [ ] ♻️ Refactoring

## Testing
<!-- Describe how you tested your changes -->
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Screenshots (if applicable)
<!-- Add screenshots for UI changes -->

## Related Issues
<!-- Link related issues: Closes #123, Relates to #456 -->

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally
- [ ] Any dependent changes have been merged and published

## Additional Notes
<!-- Add any other context about the PR here -->
```

### D.3 Code Review Process

**As a Reviewer:**

1. **Check the PR description** - Understand what's being changed
2. **Review the code changes** - Look for:
   - Code quality and style
   - Logic correctness
   - Security vulnerabilities
   - Performance issues
   - Test coverage
3. **Run locally if needed**:
   ```bash
   gh pr checkout 123
   npm install
   npm test
   ```
4. **Leave feedback**:
   - Use comments for questions
   - Use suggestions for code changes
   - Approve or request changes

**Review Comments Examples:**

```markdown
# Suggestion format
```suggestion
const user = await User.findById(userId);
if (!user) {
  throw new NotFoundError('User not found');
}
```

# Question format
🤔 **Question**: Should we add validation for the email field here?

# Issue format
⚠️ **Issue**: This query is not optimized and may cause performance issues with large datasets.

# Security format
🔒 **Security**: Ensure this endpoint has proper authentication.
```

### D.4 Review Approval States

| State | Meaning | Effect |
|-------|---------|--------|
| **Approve** | Changes look good | Ready to merge (if other checks pass) |
| **Request Changes** | Changes required before merge | PR cannot be merged until changes addressed |
| **Comment** | Feedback without blocking | Does not block merge |

### D.5 Merging Strategies

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Merge Strategies                                     │
│                                                                             │
│  1. Merge Commit (Default)                                                  │
│     - Preserves all commit history                                          │
│     - Creates merge commit                                                  │
│     - Best for: Git Flow, complex history                                   │
│                                                                             │
│     main:    ●──────────────────────●                                       │
│                                    │                                        │
│     feature:      ●──●──●──────────●                                        │
│                  (merge commit created)                                     │
│                                                                             │
│  2. Squash and Merge                                                        │
│     - Combines all commits into one                                         │
│     - Cleaner history                                                       │
│     - Best for: GitHub Flow, feature branches                               │
│                                                                             │
│     main:    ●────────────────────────●                                     │
│                                        │                                    │
│     feature:      ●──●──●────────────●                                      │
│                  (squashed to single commit)                                │
│                                                                             │
│  3. Rebase and Merge                                                        │
│     - Replays commits on target                                             │
│     - Linear history                                                        │
│     - Best for: Clean linear history                                        │
│                                                                             │
│     main:    ●────────────────────────●──●──●                               │
│                                        │                                    │
│     feature:      ●──●──●────────────●                                      │
│                  (commits replayed linearly)                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```


---

## Part E — GitHub Actions (CI/CD)

### E.1 GitHub Actions Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GitHub Actions Architecture                          │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                          Workflow File (.yml)                        │   │
│  │                                                                      │   │
│  │  name: CI/CD Pipeline                                               │   │
│  │  on: [push, pull_request]                                           │   │
│  │                                                                      │   │
│  │  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐               │   │
│  │  │    Job 1    │──▶│    Job 2    │──▶│    Job 3    │               │   │
│  │  │   Build     │   │    Test     │   │   Deploy    │               │   │
│  │  └─────────────┘   └─────────────┘   └─────────────┘               │   │
│  │        │                 │                 │                        │   │
│  │        ▼                 ▼                 ▼                        │   │
│  │  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐               │   │
│  │  │   Step 1    │   │   Step 1    │   │   Step 1    │               │   │
│  │  │   Step 2    │   │   Step 2    │   │   Step 2    │               │   │
│  │  │   Step 3    │   │   Step 3    │   │   Step 3    │               │   │
│  │  └─────────────┘   └─────────────┘   └─────────────┘               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                           Runner                                      │   │
│  │                                                                       │   │
│  │   ┌─────────────────┐    ┌─────────────────┐                        │   │
│  │   │  GitHub-hosted  │    │  Self-hosted    │                        │   │
│  │   │  (ubuntu,       │    │  (your infra)   │                        │   │
│  │   │   windows, mac) │    │                 │                        │   │
│  │   └─────────────────┘    └─────────────────┘                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### E.2 Basic CI Workflow

Create `.github/workflows/ci.yml`:

```yaml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '18.x'

jobs:
  # Job 1: Lint and Test
  lint-and-test:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}

  # Job 2: Build
  build:
    runs-on: ubuntu-latest
    needs: lint-and-test
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: build
          path: dist/
          retention-days: 7
```

### E.3 CD Workflow with Environments

Create `.github/workflows/cd.yml`:

```yaml
name: CD Pipeline

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    # Use environment for protection rules
    environment: ${{ github.event.inputs.environment || 'staging' }}
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and push Docker image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: my-app
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest

      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/my-app \
            my-app=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG \
            -n production

      - name: Notify Slack
        if: always()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: |
            Deployment to ${{ github.event.inputs.environment }} completed!
            Repository: ${{ github.repository }}
            Commit: ${{ github.sha }}
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### E.4 Using Environments with Protection Rules

**Create Environments:**

1. Go to **Settings** → **Environments**
2. Click **New environment**
3. Name: `production`
4. Configure protection rules:
   - ☑ Required reviewers (add team members)
   - ☑ Wait timer (e.g., 5 minutes)
   - ☑ Deployment branches (only `main` and tags)

**Environment Secrets:**

Each environment can have its own secrets:
- `staging`: Non-production credentials
- `production`: Production credentials (with extra approval)

### E.5 Self-Hosted Runners

**Add Self-Hosted Runner:**

1. Go to **Settings** → **Actions** → **Runners**
2. Click **New self-hosted runner**
3. Select OS and architecture
4. Run the commands shown:

```bash
# Download runner
mkdir actions-runner && cd actions-runner
curl -o actions-runner-linux-x64-2.303.0.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.303.0/actions-runner-linux-x64-2.303.0.tar.gz

# Extract
tar xzf ./actions-runner-linux-x64-2.303.0.tar.gz

# Configure
./config.sh --url https://github.com/YOUR_ORG \
  --token YOUR_RUNNER_TOKEN \
  --labels docker,kubernetes,linux

# Run as service
sudo ./svc.sh install
sudo ./svc.sh start
```

**Use Self-Hosted Runner in Workflow:**

```yaml
jobs:
  build:
    runs-on: [self-hosted, linux, docker]
    steps:
      - uses: actions/checkout@v4
      - run: docker build -t my-app .
```

### E.6 Reusable Workflows

Create `.github/workflows/reusable-ci.yml`:

```yaml
name: Reusable CI

on:
  workflow_call:
    inputs:
      node-version:
        required: true
        type: string
      run-tests:
        required: false
        type: boolean
        default: true

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ inputs.node-version }}
      
      - run: npm ci
      
      - if: ${{ inputs.run-tests }}
        run: npm test
```

**Use Reusable Workflow:**

```yaml
name: CI

on: [push]

jobs:
  call-ci:
    uses: ./.github/workflows/reusable-ci.yml
    with:
      node-version: '18.x'
      run-tests: true
```

### E.7 Workflow Best Practices

| Practice | Description |
|----------|-------------|
| **Use caching** | Cache dependencies to speed up builds |
| **Use matrix builds** | Test multiple versions in parallel |
| **Use secrets** | Never hardcode credentials |
| **Use environments** | Separate secrets and add approvals |
| **Set timeouts** | Prevent runaway jobs |
| **Use concurrency** | Cancel duplicate runs |
| **Pin action versions** | Use SHA or specific version |

```yaml
# Example: Matrix build with caching
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [16.x, 18.x, 20.x]
      fail-fast: false
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - run: npm ci
      - run: npm test
```

---

## Part F — Artifacts & Packages

### F.1 Upload and Download Artifacts

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Build
        run: npm run build
      
      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: build-output
          path: dist/
          retention-days: 7
          if-no-files-found: error

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Download build artifact
        uses: actions/download-artifact@v4
        with:
          name: build-output
          path: dist/
      
      - name: Deploy
        run: aws s3 sync dist/ s3://my-bucket/
```

### F.2 GitHub Packages (npm)

**Configure package.json:**

```json
{
  "name": "@my-org/my-package",
  "version": "1.0.0",
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  }
}
```

**Create .npmrc:**

```
@my-org:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NPM_TOKEN}
```

**Publish Package Workflow:**

```yaml
name: Publish Package

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '18.x'
          registry-url: 'https://npm.pkg.github.com'
          scope: '@my-org'
      
      - run: npm ci
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### F.3 Docker Images in GitHub Packages

```yaml
name: Docker Build and Push

on:
  push:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=sha,prefix=
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
```

---

## Part G — Software Release Process

### G.1 Release Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Release Process Flow                                 │
│                                                                             │
│  1. Development                                                             │
│     └── Feature branches → Pull Requests → Merge to develop                │
│                                                                             │
│  2. Release Preparation                                                     │
│     └── Create release branch from develop                                  │
│     └── Update version, CHANGELOG, documentation                            │
│     └── Final testing and bug fixes                                         │
│                                                                             │
│  3. Release Approval                                                        │
│     └── QA sign-off                                                         │
│     └── Security review                                                     │
│     └── Stakeholder approval                                                │
│                                                                             │
│  4. Release Execution                                                       │
│     └── Merge release branch to main                                        │
│     └── Create tag (v1.2.0)                                                 │
│     └── Build and publish artifacts                                         │
│     └── Deploy to production                                                │
│                                                                             │
│  5. Post-Release                                                            │
│     └── Merge main back to develop                                          │
│     └── Update documentation                                                │
│     └── Notify stakeholders                                                 │
│     └── Monitor for issues                                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### G.2 Semantic Versioning

```
MAJOR.MINOR.PATCH

MAJOR - Breaking changes (incompatible API changes)
MINOR - New features (backward compatible)
PATCH - Bug fixes (backward compatible)

Examples:
1.0.0 → 1.0.1 (patch - bug fix)
1.0.1 → 1.1.0 (minor - new feature)
1.1.0 → 2.0.0 (major - breaking change)

Pre-release versions:
1.0.0-alpha.1
1.0.0-beta.2
1.0.0-rc.1
```

### G.3 CHANGELOG.md

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- New feature to be released

## [1.2.0] - 2024-01-15

### Added
- User authentication with OAuth2 support
- Dark mode theme option
- Export data to CSV feature

### Changed
- Improved search performance by 50%
- Updated dependencies to latest versions

### Fixed
- Login validation error on special characters
- Memory leak in dashboard component

### Security
- Fixed XSS vulnerability in comment form
- Updated encryption algorithm

## [1.1.0] - 2024-01-01

### Added
- Dashboard analytics feature
- Email notification system

### Fixed
- Broken image links in documentation

## [1.0.0] - 2023-12-15

### Added
- Initial release
- User management
- Basic reporting
```

### G.4 Automated Release Workflow

Create `.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

permissions:
  contents: write
  packages: write

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18.x'
          registry-url: 'https://npm.pkg.github.com'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Generate changelog
        id: changelog
        uses: metcalfc/changelog-generator@v4.0.1
        with:
          myToken: ${{ secrets.GITHUB_TOKEN }}

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          body: ${{ steps.changelog.outputs.changelog }}
          files: |
            dist/*.zip
            dist/*.tar.gz
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Publish to GitHub Packages
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## Part H — Tags & Releases

### H.1 Creating Tags

**Git Tags:**

```bash
# Annotated tag (recommended)
git tag -a v1.2.0 -m "Release version 1.2.0"

# Lightweight tag
git tag v1.2.0

# Tag specific commit
git tag -a v1.2.0 abc123 -m "Release version 1.2.0"

# Push tag to remote
git push origin v1.2.0

# Push all tags
git push --tags

# Delete local tag
git tag -d v1.2.0

# Delete remote tag
git push origin --delete v1.2.0
```

**Via GitHub UI:**

1. Go to repository
2. Click **Releases** → **Draft a new release**
3. Click **Choose a tag** → Type new tag name (e.g., `v1.2.0`)
4. Select target branch (usually `main`)
5. Fill release details:
   - **Release title**: `v1.2.0 - User Authentication`
   - **Description**: Release notes
6. Attach binaries if needed
7. Click **Publish release**

**Via GitHub CLI:**

```bash
# Create release with tag
gh release create v1.2.0 \
  --title "v1.2.0 - User Authentication" \
  --notes "## What's New
- Added user authentication
- Fixed login bugs
- Performance improvements" \
  --target main

# Create pre-release
gh release create v1.3.0-beta.1 \
  --title "v1.3.0 Beta 1" \
  --notes "Beta release for testing" \
  --prerelease

# Upload assets
gh release upload v1.2.0 ./dist/app.zip ./dist/app.tar.gz
```

### H.2 Release Types

| Type | Description | Use Case |
|------|-------------|----------|
| **Release** | Stable, production-ready | Official releases |
| **Pre-release** | For testing only | Alpha, Beta, RC |
| **Draft** | Not visible to users | Work in progress |

### H.3 Automated Release Notes

Use GitHub's auto-generated release notes:

```yaml
# In release workflow
- name: Create Release
  uses: softprops/action-gh-release@v1
  with:
    generate_release_notes: true
    # Or customize with:
    body_path: CHANGELOG.md
```

### H.4 Release Workflow with Artifacts

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Build artifacts
        run: |
          mkdir -p release
          npm run build
          zip -r release/app-${{ github.ref_name }}.zip dist/
          tar -czvf release/app-${{ github.ref_name }}.tar.gz dist/
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: release-artifacts
          path: release/

  release:
    needs: build
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
      
      - name: Download artifacts
        uses: actions/download-artifact@v4
        with:
          name: release-artifacts
          path: release/
      
      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          files: release/*
          generate_release_notes: true
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```


---

## Part I — Code Scanning & Security

### I.1 GitHub Security Features

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      GitHub Security Features                                │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     Code Scanning (CodeQL)                           │   │
│  │  - Automated security analysis                                       │   │
│  │  - Finds vulnerabilities and coding errors                          │   │
│  │  - Supports multiple languages                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Secret Scanning                                   │   │
│  │  - Detects leaked credentials                                        │   │
│  │  - Partner patterns (AWS, Azure, etc.)                              │   │
│  │  - Custom patterns                                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                  Dependabot Alerts                                   │   │
│  │  - Dependency vulnerability scanning                                 │   │
│  │  - Automated pull requests for updates                              │   │
│  │  - Security advisories                                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                   Security Overview                                  │   │
│  │  - Dashboard of security status                                      │   │
│  │  - Risk assessment                                                   │   │
│  │  - Compliance reporting                                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### I.2 CodeQL Code Scanning

**Enable CodeQL:**

1. Go to **Security** → **Code scanning**
2. Click **Set up code scanning**
3. Select **CodeQL Analysis**
4. Configure workflow

**Create `.github/workflows/codeql.yml`:**

```yaml
name: CodeQL Security Scan

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 6 * * 1'  # Weekly on Monday at 6 AM

jobs:
  analyze:
    name: Analyze Code
    runs-on: ubuntu-latest
    permissions:
      actions: read
      contents: read
      security-events: write

    strategy:
      fail-fast: false
      matrix:
        language: [javascript, python, typescript]
        # Supported: javascript, typescript, python, java, csharp, go, ruby, cpp

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: ${{ matrix.language }}
          queries: +security-and-quality

      - name: Autobuild
        uses: github/codeql-action/autobuild@v3

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3
        with:
          category: "/language:${{ matrix.language }}"
```

### I.3 Secret Scanning

**Enable Secret Scanning:**

1. Go to **Settings** → **Security** → **Code security and analysis**
2. Enable:
   - ☑ **Secret scanning**
   - ☑ **Push protection** (blocks commits with secrets)

**Custom Secret Patterns:**

Create `.github/custom-secret-patterns.yml`:

```yaml
patterns:
  - name: API Key
    pattern: 'api[_-]?key[_-]?[a-zA-Z0-9]{32}'
    description: Detects API keys in code
    
  - name: Database Connection String
    pattern: 'mysql://[a-zA-Z0-9]+:[^@]+@[a-zA-Z0-9.]+/[a-zA-Z0-9]+'
    description: Detects MySQL connection strings
```

### I.4 Dependabot Configuration

Create `.github/dependabot.yml`:

```yaml
version: 2

updates:
  # Enable version updates for npm
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "06:00"
    open-pull-requests-limit: 10
    reviewers:
      - "org/dependencies-team"
    labels:
      - "dependencies"
      - "automated"
    commit-message:
      prefix: "chore"
      include: "scope"
    groups:
      production-dependencies:
        dependency-type: "production"
      development-dependencies:
        dependency-type: "development"

  # Enable version updates for Docker
  - package-ecosystem: "docker"
    directory: "/"
    schedule:
      interval: "weekly"
    reviewers:
      - "org/devops-team"

  # Enable version updates for GitHub Actions
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```

### I.5 Security Policy (SECURITY.md)

Create `SECURITY.md`:

```markdown
# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.x     | :white_check_mark: |
| 1.x     | :x:                |

## Reporting a Vulnerability

We take security seriously. If you discover a vulnerability, please report it responsibly.

### How to Report

1. **DO NOT** open a public issue
2. Email security@example.com with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 7 days
- **Fix Timeline**: Depends on severity
  - Critical: 24-72 hours
  - High: 7 days
  - Medium: 14 days
  - Low: 30 days

### Disclosure Policy

- Do not disclose the vulnerability publicly until a fix is released
- We will credit you in our security advisories (if desired)

## Security Best Practices

When contributing to this project:

1. **Never commit secrets** - Use environment variables
2. **Keep dependencies updated** - Run `npm audit` regularly
3. **Follow secure coding guidelines**
4. **Report suspicious code** during reviews
```

### I.6 Security Advisory

When a vulnerability is found:

1. Go to **Security** → **Advisories**
2. Click **New advisory**
3. Fill in details:
   - CVE ID (request if needed)
   - Title and description
   - Severity (CVSS score)
   - Affected versions
   - Patched versions
   - Workarounds

### I.7 Security Workflow

Create `.github/workflows/security.yml`:

```yaml
name: Security

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 6 * * *'

jobs:
  dependency-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run npm audit
        run: npm audit --audit-level=high
        continue-on-error: true
      
      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  code-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          ignore-unfixed: true
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Upload Trivy results to GitHub Security
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-results.sarif'

  secret-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## Part J — GitHub Enterprise Features

### J.1 Organization Management

**Create Organization:**

1. Go to github.com/organizations/new
2. Configure:
   - **Organization name**: `my-company`
   - **Billing email**: billing@company.com
   - **Plan**: Enterprise

**Organization Settings:**

```
Settings
├── Member privileges
│   ├── Base permissions (Read/Write/Admin)
│   ├── Repository creation (Members/Owners)
│   └── Repository forking
├── Teams
│   ├── Create teams
│   ├── Add members
│   └── Set repository access
├── Security
│   ├── SAML single sign-on
│   ├── Two-factor authentication
│   └── IP allow list
└── Billing
    ├── Licenses
    └── Payment methods
```

### J.2 SAML Single Sign-On

**Configure SAML:**

1. Go to **Settings** → **Security** → **SAML single sign-on**
2. Enter Identity Provider (IdP) details:
   - **Sign-on URL**: `https://idp.company.com/sso`
   - **Issuer URL**: `https://idp.company.com`
   - **Public certificate**: (from IdP)
3. Test SAML configuration
4. Enable SAML enforcement

### J.3 Teams and Permissions

**Team Structure:**

```
Organization
├── Engineering
│   ├── Frontend Team
│   │   └── Members: 10
│   ├── Backend Team
│   │   └── Members: 15
│   └── DevOps Team
│       └── Members: 5
├── Product
│   └── Product Managers
│       └── Members: 3
└── Security
    └── Security Team
        └── Members: 4
```

**Create Teams:**

1. Go to **Teams** → **New team**
2. Configure:
   - **Team name**: `Frontend Team`
   - **Description**: `Frontend developers`
   - **Parent team**: `Engineering` (optional)
   - **Repository access**: Select repositories
   - **Permission level**: Read/Write/Admin/Maintain

**Team Permissions:**

| Permission | Description |
|------------|-------------|
| **Read** | View and clone repositories |
| **Write** | Push to repositories, manage issues/PRs |
| **Maintain** | Manage repository settings, teams |
| **Admin** | Full repository access |

### J.4 Audit Logs

**Access Audit Logs:**

1. Go to **Settings** → **Security** → **Audit log**
2. Filter by:
   - Date range
   - Event type
   - Actor
   - Repository

**Export Audit Logs:**

```bash
# Using GitHub CLI
gh api /orgs/my-org/audit-log \
  -H "Accept: application/vnd.github.v3+json" \
  -F per_page=100
```

**Key Audit Events:**

| Event | Description |
|-------|-------------|
| `repo.create` | Repository created |
| `repo.delete` | Repository deleted |
| `member.add` | Member added to organization |
| `member.remove` | Member removed |
| `team.create` | Team created |
| `oauth_access.create` | OAuth app authorized |
| `saml.sign_in` | SAML sign-in |
| `secret_scanning_alert.create` | Secret detected |

### J.5 GitHub Enterprise Server (Self-Hosted)

**Architecture:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    GitHub Enterprise Server                                  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        Primary Instance                              │   │
│  │                                                                      │   │
│  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │   │
│  │   │   Git       │  │   Web       │  │   API       │                │   │
│  │   │   Server    │  │   Server    │  │   Server    │                │   │
│  │   └─────────────┘  └─────────────┘  └─────────────┘                │   │
│  │                                                                      │   │
│  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │   │
│  │   │  Database   │  │   Redis     │  │   Storage   │                │   │
│  │   │  (MySQL)    │  │  (Cache)    │  │  (Files)    │                │   │
│  │   └─────────────┘  └─────────────┘  └─────────────┘                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      Replica Instance (HA)                           │   │
│  │   - Failover for high availability                                   │   │
│  │   - Read-only during failover                                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Installation Steps:**

1. Download GHES image from GitHub Enterprise website
2. Deploy to your infrastructure (VMware, AWS, Azure, GCP)
3. Configure via web interface:
   - License upload
   - DNS configuration
   - TLS certificates
   - SMTP settings
   - Authentication (SAML/LDAP)

### J.6 GitHub Actions for Enterprise

**Runner Groups:**

1. Go to **Settings** → **Actions** → **Runner groups**
2. Create runner group:
   - **Name**: `Production Runners`
   - **Visibility**: Selected organizations
   - **Access**: Selected repositories

**Self-Hosted Runner at Enterprise Level:**

```bash
# Configure runner for enterprise
./config.sh --url https://github.com/enterprises/my-enterprise \
  --token ENTERPRISE_RUNNER_TOKEN \
  --runnergroup "Production Runners"
```

### J.7 GitHub Packages for Enterprise

**Enable Package Registries:**

1. Go to **Settings** → **Packages**
2. Configure:
   - ☑ Enable npm registry
   - ☑ Enable Docker registry
   - ☑ Enable Maven registry
   - ☑ Enable NuGet registry

**Package Visibility:**

| Visibility | Access |
|------------|--------|
| **Public** | Anyone can download |
| **Internal** | Organization members only |
| **Private** | Explicitly granted access |

---

## Summary & Best Practices

### Complete Workflow Summary

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Complete Development Workflow                           │
│                                                                             │
│  1. START: Create Issue                                                     │
│     └── Describe feature/bug                                                │
│     └── Assign to team member                                               │
│                                                                             │
│  2. DEVELOP: Create Branch                                                  │
│     └── git checkout -b feature/ABC-123-feature                             │
│     └── Make changes, commit with conventional commits                      │
│                                                                             │
│  3. REVIEW: Open Pull Request                                               │
│     └── Create PR with template                                             │
│     └── Assign reviewers                                                    │
│     └── Link to issue (Closes #123)                                         │
│                                                                             │
│  4. VERIFY: CI Pipeline Runs                                                │
│     └── Lint, test, build                                                   │
│     └── Security scans                                                      │
│     └── All checks must pass                                                │
│                                                                             │
│  5. APPROVE: Code Review                                                    │
│     └── At least 2 approvals required                                       │
│     └── CODEOWNERS must review                                              │
│     └── Resolve all conversations                                           │
│                                                                             │
│  6. MERGE: Squash and Merge                                                 │
│     └── Clean commit history                                                │
│     └── Branch deleted automatically                                        │
│                                                                             │
│  7. RELEASE: Create Tag/Release                                             │
│     └── git tag -a v1.2.0 -m "Release 1.2.0"                                │
│     └── Push tag to trigger release workflow                                │
│                                                                             │
│  8. DEPLOY: CD Pipeline                                                     │
│     └── Build artifacts                                                     │
│     └── Deploy to staging (auto)                                            │
│     └── Deploy to production (with approval)                                │
│                                                                             │
│  9. MONITOR: Post-Release                                                   │
│     └── Monitor logs and metrics                                            │
│     └── Address any issues                                                  │
│     └── Update documentation                                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Best Practices Checklist

**Repository Setup:**
- [ ] Add comprehensive README.md
- [ ] Add LICENSE file
- [ ] Add .gitignore
- [ ] Add CONTRIBUTING.md
- [ ] Add CODEOWNERS
- [ ] Add PR template
- [ ] Add issue templates
- [ ] Add SECURITY.md

**Branch Protection & Rulesets:**
- [ ] Require PR before merging
- [ ] Require 2+ approvals
- [ ] Require CODEOWNERS review
- [ ] Require status checks
- [ ] Require signed commits
- [ ] Enforce for administrators
- [ ] Migrate from Branch Protection Rules → Rulesets (org-level)
- [ ] Create org-wide security baseline ruleset
- [ ] Enable Ruleset Insights to monitor bypass events
- [ ] Protect tags with tag ruleset (`v*`)

**Security & GHAS:**
- [ ] Enable secret scanning + push protection
- [ ] Enable Dependabot alerts + version updates
- [ ] Enable CodeQL on all repos
- [ ] Add Dependency Review Action to PR checks
- [ ] Configure SECURITY.md
- [ ] Generate and publish SBOM
- [ ] Enable Security Overview dashboard
- [ ] Set license allow/deny list in dependency review

**CI/CD & Actions:**
- [ ] Set up CI pipeline (lint, test, build)
- [ ] Set up CD pipeline with environment approvals
- [ ] Use reusable workflows across repos
- [ ] Build composite/JS custom actions for repeated tasks
- [ ] Pin all action versions to SHA or major tag
- [ ] Cache dependencies
- [ ] Use matrix builds for multi-version testing
- [ ] Set up Slack/Teams notifications on deploy

**Issues, Projects & Planning:**
- [ ] Add issue templates (bug, feature)
- [ ] Set up label taxonomy (priority, type, status)
- [ ] Create GitHub Project (V2) with sprint iterations
- [ ] Automate issue → project card via workflow
- [ ] Enable Discussions for RFCs and ADRs

**API & Integrations:**
- [ ] Use fine-grained PATs (not classic PATs)
- [ ] Verify webhook signatures with HMAC
- [ ] Use GitHub Apps for CI/CD integrations (not OAuth Apps)
- [ ] Export audit logs regularly for compliance

**Copilot:**
- [ ] Enable Copilot for Enterprise at org level
- [ ] Configure content exclusions for sensitive paths
- [ ] Create knowledge bases from internal docs
- [ ] Track acceptance rate monthly

**Documentation:**
- [ ] Keep README updated
- [ ] Maintain CHANGELOG
- [ ] Document API
- [ ] Add code comments
- [ ] Create architecture diagrams

### Key Commands Reference

```bash
# Repository
gh repo create my-org/my-repo --private
gh repo clone my-org/my-repo
gh repo delete my-org/my-repo

# Branches
git checkout -b feature/new-feature
git push origin feature/new-feature
gh pr create --title "Feature" --body "Description"

# Pull Requests
gh pr list
gh pr checkout 123
gh pr review 123 --approve
gh pr merge 123 --squash

# Releases
gh release create v1.2.0 --title "v1.2.0" --notes "Release notes"
gh release upload v1.2.0 ./dist/app.zip
gh release download v1.2.0

# Secrets
gh secret set AWS_ACCESS_KEY_ID
gh secret set MY_SECRET --env production      # env-scoped secret
gh secret list
gh secret delete OLD_SECRET

# Workflows
gh workflow run ci.yml
gh workflow run deploy.yml -f environment=staging
gh run list
gh run view <run-id>
gh run watch <run-id>
gh run cancel <run-id>

# Security
gh codeql database analyze
gh dependabot alerts list
gh api /orgs/MY-ORG/secret-scanning/alerts --jq '.[] | select(.state=="open")'

# Rulesets
gh api /orgs/MY-ORG/rulesets                          # list org rulesets
gh api /repos/MY-ORG/MY-REPO/rulesets                 # list repo rulesets

# API & Webhooks
gh api /repos/MY-ORG/MY-REPO/hooks                    # list webhooks
gh api /orgs/MY-ORG/audit-log --jq '.[].action'       # audit log events
gh api /repos/MY-ORG/MY-REPO/dependency-graph/sbom    # SBOM export

# Copilot
gh api /orgs/MY-ORG/copilot/usage --jq '.[].total_acceptances_count'
gh api /orgs/MY-ORG/copilot/billing/seats --jq '.seats[].assignee.login'

# Projects
gh project list --owner MY-ORG
gh project item-list 1 --owner MY-ORG

# Labels
gh label list
gh label create "priority: high" --color D93F0B
gh label clone source-repo --force                    # copy labels between repos
```

---

## Part K — Repository Rulesets & Advanced Policies

> **Note:** Repository Rulesets (2023+) are the **modern replacement** for Branch Protection Rules. They work at org-level and support more granular control.

### K.1 Rulesets vs Branch Protection Rules

| Feature | Branch Protection Rules | Repository Rulesets |
|---------|------------------------|---------------------|
| **Scope** | Per-repo only | Org-wide or per-repo |
| **Multiple rules** | One per pattern | Multiple rulesets |
| **Bypass list** | Admins only | Roles, teams, apps |
| **Status** | Active/Inactive | Active/Evaluate/Disabled |
| **Import/Export** | ❌ | ✅ |
| **Insights** | ❌ | ✅ |

### K.2 Creating a Repository Ruleset

**Via GitHub UI:**

1. Go to **Organization Settings** → **Repository** → **Rulesets**
2. Click **New ruleset** → **New branch ruleset**
3. Configure:

```
Ruleset name: main-protection
Enforcement status: Active

Target branches:
  ☑ Include by pattern: main
  ☑ Include by pattern: release/*

Bypass list:
  - Role: Repository admin
  - Team: release-managers

Rules:
  ☑ Restrict deletions
  ☑ Require linear history
  ☑ Require signed commits
  ☑ Require a pull request before merging
      Required approvals: 2
      Dismiss stale approvals: true
      Require code owner review: true
  ☑ Require status checks to pass
      Require branches to be up to date: true
      Status checks:
        - ci/test
        - ci/build
        - security/scan
  ☑ Block force pushes
```

### K.3 Org-Level Ruleset (applies to ALL repos)

```
Ruleset name: org-security-baseline
Target: All repositories
Target branches: main

Rules enforced org-wide:
  ☑ Require signed commits
  ☑ Block force pushes
  ☑ Require pull request (min 1 approval)
  ☑ Require status checks: security-scan
```

### K.4 Ruleset Insights

After enabling, navigate to:
**Organization** → **Insights** → **Repository Rulesets**

View:
- Which rules are being bypassed
- Who triggered bypasses
- Which repos are non-compliant

### K.5 Tag Protection Rulesets

```
Ruleset name: tag-protection
Target tags: v*

Rules:
  ☑ Restrict creations (only release-managers team)
  ☑ Restrict deletions
  ☑ Restrict updates
```

---

## Part L — GitHub Issues, Projects & Discussions

### L.1 Issue Templates

Create `.github/ISSUE_TEMPLATE/bug_report.yml`:

```yaml
name: Bug Report
description: File a bug report
title: "[Bug]: "
labels: ["bug", "triage"]
assignees:
  - octocat
body:
  - type: markdown
    attributes:
      value: "Thanks for reporting a bug!"

  - type: input
    id: contact
    attributes:
      label: Contact Details
      placeholder: ex. email@example.com
    validations:
      required: false

  - type: textarea
    id: what-happened
    attributes:
      label: What happened?
      description: Describe the bug clearly
      placeholder: Tell us what you see!
    validations:
      required: true

  - type: dropdown
    id: version
    attributes:
      label: Version
      options:
        - 1.0.2 (Default)
        - 1.0.3 (Edge)
    validations:
      required: true

  - type: textarea
    id: logs
    attributes:
      label: Relevant log output
      render: shell
```

Create `.github/ISSUE_TEMPLATE/feature_request.yml`:

```yaml
name: Feature Request
description: Suggest an idea for this project
title: "[Feature]: "
labels: ["enhancement"]
body:
  - type: textarea
    id: problem
    attributes:
      label: Problem description
      description: What problem does this solve?
    validations:
      required: true

  - type: textarea
    id: solution
    attributes:
      label: Proposed solution
    validations:
      required: true

  - type: textarea
    id: alternatives
    attributes:
      label: Alternatives considered
```

### L.2 Issue Labels Strategy

```bash
# Create standard labels via CLI
gh label create "priority: critical" --color "B60205" --description "Needs immediate attention"
gh label create "priority: high"     --color "D93F0B" --description "High priority"
gh label create "priority: medium"   --color "FBCA04" --description "Medium priority"
gh label create "priority: low"      --color "0E8A16" --description "Low priority"
gh label create "type: bug"          --color "EE0701" --description "Something isn't working"
gh label create "type: feature"      --color "84B6EB" --description "New feature request"
gh label create "type: docs"         --color "C5DEF5" --description "Documentation update"
gh label create "status: in-progress" --color "E4E669" --description "Work in progress"
gh label create "status: blocked"    --color "B60205" --description "Blocked by dependency"
```

### L.3 Milestones

```bash
# Create milestones
gh api /repos/ORG/REPO/milestones \
  --method POST \
  -f title="v2.0.0 Release" \
  -f description="Major release with new features" \
  -f due_on="2024-03-01T00:00:00Z"
```

### L.4 GitHub Projects (V2)

GitHub Projects V2 is a spreadsheet-like planning tool.

**Create Project:**
1. Go to **Organization** → **Projects** → **New project**
2. Choose template: **Board**, **Table**, or **Roadmap**

**Custom Fields:**
| Field | Type | Use |
|-------|------|-----|
| Status | Single select | Todo / In Progress / Done |
| Priority | Single select | Critical / High / Medium / Low |
| Sprint | Iteration | 2-week sprints |
| Story Points | Number | Effort estimation |
| Team | Text | Assigned team |

**Automate Project with Workflow:**

```yaml
name: Add to Project

on:
  issues:
    types: [opened]
  pull_request:
    types: [opened]

jobs:
  add-to-project:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/add-to-project@v0.5.0
        with:
          project-url: https://github.com/orgs/my-org/projects/1
          github-token: ${{ secrets.PROJECT_TOKEN }}
```

### L.5 GitHub Discussions

Enable in **Settings** → **General** → **Discussions**.

**Categories:**
- 📣 Announcements (org-only post)
- 💬 General (open discussion)
- 💡 Ideas (feature suggestions)
- 🙏 Q&A (question + answer format)
- 🙌 Show & Tell (share your work)

**Use in Enterprise for:**
- Inner-source RFC (Request for Comments) process
- Architecture decision records (ADRs)
- Team announcements without email
- Knowledge base / FAQ

---

## Part M — Custom GitHub Actions

### M.1 Types of Custom Actions

| Type | Language | Use Case |
|------|----------|----------|
| **JavaScript** | Node.js | Fast, no container needed |
| **Docker Container** | Any | Complex dependencies |
| **Composite** | YAML | Combine existing steps/actions |

### M.2 Composite Action

Create `.github/actions/deploy-to-aks/action.yml`:

```yaml
name: Deploy to AKS
description: Builds Docker image and deploys to Azure Kubernetes Service

inputs:
  image-name:
    description: Docker image name
    required: true
  tag:
    description: Docker image tag
    required: true
    default: latest
  namespace:
    description: Kubernetes namespace
    required: false
    default: default
  azure-credentials:
    description: Azure service principal credentials JSON
    required: true

outputs:
  deployment-url:
    description: URL of deployed application
    value: ${{ steps.get-url.outputs.url }}

runs:
  using: composite
  steps:
    - name: Azure Login
      uses: azure/login@v1
      with:
        creds: ${{ inputs.azure-credentials }}

    - name: Build Docker Image
      shell: bash
      run: |
        docker build -t ${{ inputs.image-name }}:${{ inputs.tag }} .

    - name: Push to ACR
      shell: bash
      run: |
        az acr login --name myacr
        docker push ${{ inputs.image-name }}:${{ inputs.tag }}

    - name: Deploy to AKS
      uses: azure/k8s-deploy@v4
      with:
        namespace: ${{ inputs.namespace }}
        images: ${{ inputs.image-name }}:${{ inputs.tag }}
        manifests: k8s/

    - name: Get Service URL
      id: get-url
      shell: bash
      run: |
        URL=$(kubectl get svc my-service -n ${{ inputs.namespace }} \
          -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
        echo "url=http://$URL" >> $GITHUB_OUTPUT
```

**Use the composite action:**

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to AKS
        uses: ./.github/actions/deploy-to-aks
        with:
          image-name: myacr.azurecr.io/my-app
          tag: ${{ github.sha }}
          namespace: production
          azure-credentials: ${{ secrets.AZURE_CREDENTIALS }}
```

### M.3 JavaScript Action

Create `action.yml`:

```yaml
name: Send Notification
description: Sends deployment notification to Teams/Slack

inputs:
  webhook-url:
    description: Webhook URL
    required: true
  message:
    description: Notification message
    required: true
  status:
    description: success or failure
    required: true

runs:
  using: node20
  main: dist/index.js
```

Create `src/index.js`:

```javascript
const core = require('@actions/core');
const github = require('@actions/github');
const axios = require('axios');

async function run() {
  try {
    const webhookUrl = core.getInput('webhook-url');
    const message = core.getInput('message');
    const status = core.getInput('status');
    const { repo, sha } = github.context;

    const color = status === 'success' ? '#00ff00' : '#ff0000';
    const emoji = status === 'success' ? '✅' : '❌';

    await axios.post(webhookUrl, {
      text: `${emoji} ${message}`,
      attachments: [{
        color,
        fields: [
          { title: 'Repository', value: `${repo.owner}/${repo.repo}` },
          { title: 'Commit', value: sha.substring(0, 7) },
          { title: 'Status', value: status }
        ]
      }]
    });

    core.setOutput('notification-sent', 'true');
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
```

### M.4 Publishing Actions to Marketplace

1. Action must be in **public** repository root (`action.yml`)
2. Add to `action.yml`:
```yaml
branding:
  icon: upload-cloud
  color: blue
```
3. Create a release with a semantic version tag (`v1.0.0`)
4. Go to **Releases** → **Publish this Action to the GitHub Marketplace**

### M.5 Action Versioning Best Practices

```yaml
# ✅ Pin to specific SHA (most secure)
uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683

# ✅ Pin to major version tag (balanced)
uses: actions/checkout@v4

# ❌ Avoid using @main or @master (unpredictable)
uses: actions/checkout@main
```

---

## Part N — GitHub Advanced Security (GHAS)

### N.1 GHAS Feature Overview

```
┌─────────────────────────────────────────────────────────────┐
│              GitHub Advanced Security (GHAS)                 │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   Code Scanning  │  │ Secret Scanning  │                  │
│  │   (CodeQL)       │  │ + Push Protect  │                  │
│  └─────────────────┘  └─────────────────┘                  │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │  Dependency      │  │  Security        │                  │
│  │  Review          │  │  Overview        │                  │
│  └─────────────────┘  └─────────────────┘                  │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   Supply Chain   │  │  License         │                  │
│  │   (SBOM)         │  │  Compliance      │                  │
│  └─────────────────┘  └─────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

### N.2 Enable GHAS at Organization Level

```bash
# Enable GHAS for all repos in org via API
gh api /orgs/MY-ORG \
  --method PATCH \
  -f advanced_security_enabled_for_new_repositories=true \
  -f secret_scanning_enabled_for_new_repositories=true \
  -f secret_scanning_push_protection_enabled_for_new_repositories=true \
  -f dependabot_alerts_enabled_for_new_repositories=true
```

### N.3 Dependency Review Action

Blocks PRs that introduce vulnerable dependencies:

```yaml
name: Dependency Review

on:
  pull_request:
    branches: [main]

permissions:
  contents: read
  pull-requests: write

jobs:
  dependency-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Dependency Review
        uses: actions/dependency-review-action@v4
        with:
          fail-on-severity: high
          allow-licenses: MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause
          deny-licenses: GPL-2.0, GPL-3.0, LGPL-2.0
          comment-summary-in-pr: always
```

### N.4 SBOM (Software Bill of Materials)

Generate SBOM for supply chain transparency:

```yaml
- name: Generate SBOM
  uses: anchore/sbom-action@v0
  with:
    image: ghcr.io/my-org/my-app:latest
    format: spdx-json
    output-file: sbom.spdx.json

- name: Upload SBOM
  uses: actions/upload-artifact@v4
  with:
    name: sbom
    path: sbom.spdx.json
```

Or via GitHub API:

```bash
# Download repo SBOM
gh api /repos/MY-ORG/MY-REPO/dependency-graph/sbom \
  --jq '.sbom' > sbom.json
```

### N.5 Secret Scanning — Push Protection

When push protection is enabled, GitHub **blocks the push** if secrets are detected:

```
remote: error: GH013: Repository rule violations found for refs/heads/main.
remote:
remote: - Push cannot contain secrets
remote:   —— GitHub Personal Access Token ————————————————————————
remote:    locations:
remote:      - commit: abc123def
remote:        path: config/settings.js:12
```

**Allow a bypass (with justification):**

```bash
# Developer can choose to bypass with reason:
# - Used in tests
# - False positive
# - Will fix later
```

**Monitor bypass events:**

```bash
gh api /orgs/MY-ORG/secret-scanning/alerts \
  --jq '.[] | select(.state=="open")'
```

### N.6 Security Overview Dashboard

Navigate to: **Organization** → **Security** → **Overview**

Shows:
- Repositories with critical/high alerts
- Secret scanning alert counts
- Dependabot alert summary
- CodeQL coverage percentage
- Teams most at risk

---

## Part O — GitHub API, Webhooks & Integrations

### O.1 GitHub REST API Basics

```bash
# Authenticate
export GH_TOKEN=ghp_your_token

# List repositories
gh api /orgs/MY-ORG/repos --jq '.[].name'

# Get repo details
gh api /repos/MY-ORG/MY-REPO

# Create an issue
gh api /repos/MY-ORG/MY-REPO/issues \
  --method POST \
  -f title="Bug: Login fails" \
  -f body="Steps to reproduce..." \
  -f '{"labels":["bug","priority: high"]}'

# List workflow runs
gh api /repos/MY-ORG/MY-REPO/actions/runs \
  --jq '.workflow_runs[] | {id:.id, status:.status, conclusion:.conclusion}'

# Trigger workflow dispatch
gh api /repos/MY-ORG/MY-REPO/actions/workflows/deploy.yml/dispatches \
  --method POST \
  -f ref=main \
  -f '{"inputs":{"environment":"production"}}'
```

### O.2 GitHub GraphQL API

```graphql
# Get open PRs with review status
query {
  repository(owner: "my-org", name: "my-repo") {
    pullRequests(states: OPEN, first: 10) {
      nodes {
        title
        number
        author {
          login
        }
        reviewDecision
        mergeable
        createdAt
        labels(first: 5) {
          nodes {
            name
          }
        }
      }
    }
  }
}
```

```bash
# Run GraphQL query via CLI
gh api graphql -f query='
  query {
    viewer {
      login
      repositories(first: 5) {
        nodes { name }
      }
    }
  }
'
```

### O.3 Webhooks

**Configure Webhook:**

1. Go to **Settings** → **Webhooks** → **Add webhook**
2. Configure:
   - **Payload URL**: `https://your-server.com/webhook`
   - **Content type**: `application/json`
   - **Secret**: (used to verify signature)
   - **Events**: Select specific events

**Webhook Events:**

| Event | Trigger |
|-------|---------|
| `push` | Code pushed to branch |
| `pull_request` | PR opened/closed/merged |
| `workflow_run` | Workflow completed |
| `release` | Release created/published |
| `issues` | Issue opened/closed |
| `security_advisory` | Security alert |
| `member` | Member added/removed |

**Verify webhook signature (Node.js):**

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(digest),
    Buffer.from(signature)
  );
}

app.post('/webhook', (req, res) => {
  const sig = req.headers['x-hub-signature-256'];
  if (!verifyWebhookSignature(req.rawBody, sig, process.env.WEBHOOK_SECRET)) {
    return res.status(401).send('Unauthorized');
  }

  const event = req.headers['x-github-event'];
  const payload = req.body;

  if (event === 'pull_request' && payload.action === 'merged') {
    console.log(`PR #${payload.number} merged into ${payload.repository.full_name}`);
    // trigger downstream actions
  }

  res.status(200).send('OK');
});
```

### O.4 GitHub Apps vs OAuth Apps vs PATs

| Type | Best For | Scope |
|------|----------|-------|
| **GitHub App** | Automation, CI/CD integrations | Per-installation permissions |
| **OAuth App** | User-facing integrations | User permissions |
| **PAT (Classic)** | Personal scripts | All repos for user |
| **Fine-grained PAT** | Scoped automation | Specific repos + permissions |

**Create Fine-Grained PAT:**

1. **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens**
2. Set:
   - **Expiration**: 90 days (max)
   - **Repository access**: Only selected repositories
   - **Permissions**: Read-only on contents, write on issues

### O.5 GitHub Actions: Calling External APIs

```yaml
jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - name: Post to Microsoft Teams
        run: |
          curl -H 'Content-Type: application/json' \
               -d '{
                 "@type": "MessageCard",
                 "summary": "Deployment complete",
                 "themeColor": "0076D7",
                 "sections": [{
                   "activityTitle": "✅ Deployed ${{ github.repository }}",
                   "facts": [
                     {"name": "Branch", "value": "${{ github.ref_name }}"},
                     {"name": "Commit", "value": "${{ github.sha }}"},
                     {"name": "Author", "value": "${{ github.actor }}"}
                   ]
                 }]
               }' \
               ${{ secrets.TEAMS_WEBHOOK_URL }}
```

---

## Part P — GitHub Copilot for Enterprise

### P.1 GitHub Copilot Tiers

| Feature | Copilot Individual | Copilot Business | Copilot Enterprise |
|---------|-------------------|------------------|-------------------|
| Code completion | ✅ | ✅ | ✅ |
| Chat in IDE | ✅ | ✅ | ✅ |
| CLI assistance | ✅ | ✅ | ✅ |
| Policy management | ❌ | ✅ | ✅ |
| Audit logs | ❌ | ✅ | ✅ |
| GitHub.com chat | ❌ | ❌ | ✅ |
| Repo-aware chat | ❌ | ❌ | ✅ |
| Custom models | ❌ | ❌ | ✅ |
| Knowledge bases | ❌ | ❌ | ✅ |

### P.2 Enable Copilot for Enterprise

1. **Enterprise Settings** → **Copilot** → **Policies**
2. Configure:
   - ☑ Enable GitHub Copilot
   - ☑ Allow/Block suggestions matching public code
   - ☑ Enable Copilot in github.com
   - Organization-level assignment (all members or selected)

### P.3 Copilot in GitHub Actions Workflows

```yaml
# Use Copilot to auto-generate PR summaries
name: Copilot PR Summary

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  summarize:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
    steps:
      - uses: actions/checkout@v4

      - name: Generate PR Summary with Copilot
        uses: github/copilot-pull-request-review@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

### P.4 Copilot Knowledge Bases

**For Enterprise:** Create custom knowledge bases from your internal docs.

1. Go to **Organization** → **Copilot** → **Knowledge bases**
2. **New knowledge base**
3. Index from:
   - Selected repositories
   - Specific paths (e.g., `/docs/**`)
4. Developers can ask: `@github What is our standard deployment process?`

### P.5 Copilot Policies & Exclusions

Exclude sensitive files from Copilot suggestions:

Create `.copilotignore`:

```gitignore
# Exclude sensitive directories
secrets/
credentials/
*.pem
*.key
config/production.yml

# Exclude vendor code
vendor/
node_modules/
```

**Org-level content exclusion (admin):**

1. **Organization Settings** → **Copilot** → **Content exclusion**
2. Add paths: `**/secrets/**`, `**/credentials/**`

### P.6 Measuring Copilot Impact

```bash
# Get Copilot usage metrics via API
gh api /orgs/MY-ORG/copilot/usage \
  --jq '.[] | {date:.day, suggestions:.total_suggestions_count, acceptances:.total_acceptances_count}'
```

Key metrics:
- **Acceptance rate** — % of suggestions accepted
- **Lines of code suggested** — Total AI-generated LOC
- **Active users** — Developers actively using Copilot

---

> **Completed:** You now have comprehensive knowledge of GitHub Enterprise for source control, CI/CD, security, and release management!
