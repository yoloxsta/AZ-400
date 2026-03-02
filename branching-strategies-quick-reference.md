# Branching Strategies Quick Reference

## Strategy Comparison at a Glance

| Strategy | Complexity | Best For | Release Frequency | Branch Lifetime |
|----------|-----------|----------|-------------------|-----------------|
| **Git Flow** | ⭐⭐⭐⭐ | Traditional releases | Monthly/Quarterly | Weeks |
| **GitHub Flow** | ⭐ | Web apps, SaaS | Continuous | Days |
| **Trunk-Based** | ⭐⭐⭐ | High-performing teams | Multiple/day | Hours |
| **GitLab Flow** | ⭐⭐ | Multiple environments | Weekly | Days |
| **Release Flow** | ⭐⭐⭐ | Enterprise products | Continuous | Months |

## Quick Commands

### Git Flow
```bash
# Feature
git checkout develop
git checkout -b feature/my-feature
# ... develop ...
git checkout develop
git merge --no-ff feature/my-feature

# Release
git checkout -b release/1.0.0
# ... prepare ...
git checkout main
git merge --no-ff release/1.0.0
git tag v1.0.0

# Hotfix
git checkout main
git checkout -b hotfix/1.0.1
# ... fix ...
git checkout main
git merge --no-ff hotfix/1.0.1
git checkout develop
git merge --no-ff hotfix/1.0.1
```

### GitHub Flow
```bash
# Simple workflow
git checkout main
git pull origin main
git checkout -b my-feature
# ... develop ...
git push origin my-feature
# Create PR → Review → Merge
```

### Trunk-Based Development
```bash
# Very short-lived
git checkout main
git pull origin main
git checkout -b quick-feature
# ... develop (< 1 day) ...
git push origin quick-feature
# Quick PR → Merge same day
```

### GitLab Flow
```bash
# Feature → Main → Staging → Production
git checkout main
git checkout -b feature/my-feature
# ... develop ...
# Merge to main
git checkout staging
git merge main
# Test in staging
git checkout production
git merge staging
```

### Release Flow
```bash
# Create release branch
git checkout -b release/2024.1
git tag v2024.1.0

# Continue on main
git checkout main
# ... new features ...

# Fix in release
git checkout release/2024.1
# ... fix ...
git tag v2024.1.1

# Cherry-pick to main
git checkout main
git cherry-pick <commit-hash>
```

## Decision Tree

```
Start Here
    |
    ├─ Need multiple versions in production?
    |  └─ YES → Release Flow
    |  └─ NO → Continue
    |
    ├─ Deploy multiple times per day?
    |  └─ YES → Trunk-Based Development
    |  └─ NO → Continue
    |
    ├─ Have multiple environments?
    |  └─ YES → GitLab Flow
    |  └─ NO → Continue
    |
    ├─ Scheduled releases?
    |  └─ YES → Git Flow
    |  └─ NO → GitHub Flow
```

## Branch Naming

```bash
# Good examples
feature/PROJ-123-user-authentication
bugfix/PROJ-456-fix-login-error
hotfix/PROJ-789-security-patch
release/2024.1.0
docs/update-api-documentation

# Bad examples
my-feature          # No type
fix-bug            # No ticket
PROJ-123           # No description
```

## Commit Messages

```bash
# Format
<type>(<scope>): <subject>

# Examples
feat(auth): add OAuth2 authentication
fix(api): handle null response
docs(readme): update installation steps
refactor(db): optimize query performance
test(auth): add login tests
```

## Merge Strategies

```bash
# Merge commit (preserves history)
git merge --no-ff feature/my-feature

# Squash (clean history)
git merge --squash feature/my-feature
git commit -m "feat: add feature"

# Rebase (linear history)
git rebase main
git checkout main
git merge feature/my-feature

# Fast-forward (simple)
git merge feature/my-feature
```

## Common Tasks

### Create Feature Branch
```bash
git checkout main  # or develop for Git Flow
git pull origin main
git checkout -b feature/my-feature
```

### Update Feature Branch
```bash
git checkout feature/my-feature
git fetch origin
git rebase origin/main  # or merge
```

### Clean Up Branches
```bash
# Delete local merged branches
git branch --merged main | grep -v "main" | xargs git branch -d

# Delete remote tracking branches
git fetch --prune

# Delete remote branch
git push origin --delete feature/my-feature
```

### View Branch Status
```bash
# List all branches
git branch -a

# Show branch with last commit
git branch -v

# Show unmerged branches
git branch --no-merged main

# Show merged branches
git branch --merged main
```

## Protection Rules

### Main Branch
- ✅ Require pull request
- ✅ Require 2 reviewers
- ✅ Require status checks
- ✅ No force push
- ✅ No deletion

### Develop Branch (Git Flow)
- ✅ Require pull request
- ✅ Require 1 reviewer
- ✅ Require status checks

### Feature Branches
- ⚠️ No protection needed
- ✅ Delete after merge

## Troubleshooting

### Merge Conflict
```bash
# During merge
git merge feature/my-feature
# CONFLICT!

# Resolve conflicts in files
# Then:
git add .
git commit -m "Merge feature/my-feature"
```

### Undo Last Commit
```bash
# Keep changes
git reset --soft HEAD~1

# Discard changes
git reset --hard HEAD~1
```

### Recover Deleted Branch
```bash
# Find commit
git reflog

# Recreate branch
git checkout -b feature/my-feature <commit-hash>
```

### Sync Fork
```bash
git remote add upstream <original-repo-url>
git fetch upstream
git checkout main
git merge upstream/main
```

## Best Practices

✅ **Do**:
- Keep branches short-lived
- Merge frequently
- Use descriptive names
- Write good commit messages
- Delete merged branches
- Pull before creating branch
- Run tests before pushing

❌ **Don't**:
- Push directly to main
- Let branches go stale
- Mix multiple features
- Commit broken code
- Force push to shared branches
- Ignore conflicts
- Skip code reviews

## Team Workflow Example

### Daily Routine
```bash
# Morning
git checkout main
git pull origin main

# Start work
git checkout -b feature/PROJ-123-my-task

# During day
git add .
git commit -m "feat: implement part 1"
# ... continue ...
git commit -m "feat: implement part 2"

# End of day
git push origin feature/PROJ-123-my-task

# Create PR before leaving
```

### Code Review
```bash
# Reviewer checks out branch
git fetch origin
git checkout feature/PROJ-123-my-task

# Test locally
npm install
npm test

# Leave comments in PR
# Approve or request changes
```

### After Merge
```bash
# Update local main
git checkout main
git pull origin main

# Delete feature branch
git branch -d feature/PROJ-123-my-task
git push origin --delete feature/PROJ-123-my-task
```

## Resources

- [Git Flow Original](https://nvie.com/posts/a-successful-git-branching-model/)
- [GitHub Flow Guide](https://guides.github.com/introduction/flow/)
- [Trunk-Based Development](https://trunkbaseddevelopment.com/)
- [GitLab Flow](https://docs.gitlab.com/ee/topics/gitlab_flow.html)
- [Release Flow](https://devblogs.microsoft.com/devops/release-flow-how-we-do-branching-on-the-vsts-team/)

---

**Quick Tip**: Start with GitHub Flow if unsure. It's simple and works for most teams. Evolve to more complex strategies as needed.
