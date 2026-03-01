# Day 1: Introduction to Azure DevOps

## What is Azure DevOps?

Azure DevOps is a suite of development tools provided by Microsoft for planning, developing, delivering, and maintaining software. It includes:

- Azure Boards (work tracking)
- Azure Repos (source control)
- Azure Pipelines (CI/CD)
- Azure Test Plans (testing)
- Azure Artifacts (package management)

## Why Azure DevOps?

- End-to-end DevOps lifecycle management
- Integrates with popular tools (GitHub, Jenkins, etc.)
- Cloud-based and scalable
- Supports any language, platform, and cloud
- Free tier available for small teams

## How Does It Work?

Azure DevOps follows the DevOps lifecycle:
1. Plan → 2. Develop → 3. Build → 4. Test → 5. Deploy → 6. Monitor → (repeat)

## Lab 1: Getting Started

### Prerequisites
- Microsoft account or Azure account
- Web browser

### Steps

1. **Create Azure DevOps Account**
   - Go to https://dev.azure.com
   - Sign in with Microsoft account
   - Click "Start free"

2. **Create Your First Organization**
   - Organization name: `[yourname]-devops-lab`
   - Region: Choose closest to you
   - Click "Continue"

3. **Create Your First Project**
   - Project name: `HelloDevOps`
   - Visibility: Private
   - Version control: Git
   - Work item process: Agile
   - Click "Create project"

4. **Explore the Interface**
   - Navigate through each service (Boards, Repos, Pipelines, etc.)
   - Familiarize yourself with the left navigation menu

### Verification
- [ ] Organization created successfully
- [ ] Project "HelloDevOps" is visible
- [ ] Can access all five services

## Key Concepts

- **Organization**: Top-level container for projects
- **Project**: Contains repos, pipelines, boards, etc.
- **Service**: Individual tools (Boards, Repos, Pipelines, etc.)

## Next Steps
Tomorrow we'll dive into Azure Boards for work item tracking and agile planning.
