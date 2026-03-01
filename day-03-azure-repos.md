# Day 3: Azure Repos - Git Version Control

## What is Azure Repos?

Azure Repos provides Git repositories for source control. It supports both Git (distributed) and TFVC (centralized), but Git is recommended.

## Why Use Azure Repos?

- Unlimited private Git repositories
- Pull requests with code review
- Branch policies for quality control
- Integration with Azure Boards
- Built-in CI/CD triggers

## How Does It Work?

Standard Git workflow:
1. Clone → 2. Branch → 3. Commit → 4. Push → 5. Pull Request → 6. Merge

## Lab 3: Working with Git Repositories

### Part 1: Initialize Repository

1. **Navigate to Repos**
   - Open `HelloDevOps` project
   - Click "Repos" → "Files"

2. **Initialize with README**
   - Click "Initialize" (if not done)
   - Check "Add a README"
   - Add .gitignore: Node
   - Click "Initialize"

3. **Clone Repository Locally**
   - Click "Clone" button (top right)
   - Copy HTTPS URL
   - Open terminal/command prompt:
   ```bash
   git clone [paste-url]
   cd HelloDevOps
   ```

### Part 2: Create and Work with Branches

1. **Create a Branch**
   ```bash
   git checkout -b feature/add-webapp
   ```

2. **Create a Simple Web App**
   - Create `index.html`:
   ```html
   <!DOCTYPE html>
   <html>
   <head>
       <title>Hello DevOps</title>
   </head>
   <body>
       <h1>Welcome to Azure DevOps Lab</h1>
       <p>Day 3: Learning Git with Azure Repos</p>
   </body>
   </html>
   ```

3. **Create `app.js`**:
   ```javascript
   console.log('Hello Azure DevOps!');
   
   function greet(name) {
       return `Hello, ${name}!`;
   }
   
   module.exports = { greet };
   ```

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "Add initial web app files #123"
   ```
   Note: #123 links commit to work item 123 (use your story ID)

5. **Push Branch**
   ```bash
   git push origin feature/add-webapp
   ```

### Part 3: Pull Requests

1. **Create Pull Request**
   - Go to Azure DevOps → Repos → Pull requests
   - Click "New pull request"
   - Source: `feature/add-webapp`
   - Target: `main`
   - Title: "Add initial web application"
   - Description: Add details
   - Link work items (right panel)
   - Add yourself as reviewer
   - Click "Create"

2. **Review Code**
   - Click "Files" tab
   - Add comments on specific lines
   - Click "Approve"

3. **Complete Pull Request**
   - Click "Complete"
   - Merge type: "Merge (no fast-forward)"
   - Check "Delete feature/add-webapp after merging"
   - Click "Complete merge"

### Part 4: Branch Policies

1. **Set Branch Policies**
   - Go to Repos → Branches
   - Hover over `main` branch
   - Click "..." → "Branch policies"

2. **Configure Policies**
   - Enable "Require a minimum number of reviewers"
     - Minimum: 1 reviewer
     - Check "Allow requestors to approve their own changes" (for lab)
   - Enable "Check for linked work items"
   - Enable "Check for comment resolution"
   - Click "Save"

3. **Test Policy**
   - Try to push directly to main (should fail):
   ```bash
   git checkout main
   git pull
   echo "test" > test.txt
   git add test.txt
   git commit -m "test"
   git push
   ```
   - You'll get an error - policies prevent direct push!

### Verification
- [ ] Repository cloned locally
- [ ] Created feature branch
- [ ] Added files and committed
- [ ] Created and completed pull request
- [ ] Branch policies configured
- [ ] Direct push to main blocked

## Key Concepts

- **Branch**: Isolated line of development
- **Pull Request (PR)**: Proposal to merge code
- **Code Review**: Team reviews changes before merge
- **Branch Policy**: Rules enforced on branches
- **Merge**: Combining branches

## Git Commands Reference

```bash
git clone [url]              # Copy repository
git checkout -b [branch]     # Create and switch branch
git add .                    # Stage all changes
git commit -m "[message]"    # Commit with message
git push origin [branch]     # Push to remote
git pull                     # Fetch and merge changes
git status                   # Check current state
git log                      # View commit history
```

## Next Steps
Tomorrow we'll create our first CI pipeline with Azure Pipelines.
