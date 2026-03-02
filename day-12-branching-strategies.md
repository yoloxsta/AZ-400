# Day 12: Branching Strategies for Source Control

## What are Branching Strategies?

Branching strategies are systematic approaches to organizing code development using Git branches. They define how teams create, merge, and manage branches throughout the software development lifecycle.

## Why Branching Strategies Matter?

- **Parallel Development**: Multiple features developed simultaneously
- **Code Stability**: Keep main branch always deployable
- **Release Management**: Control what goes to production
- **Collaboration**: Clear workflow for team members
- **Risk Mitigation**: Isolate experimental changes
- **Continuous Delivery**: Enable automated deployments

## Common Branching Strategies

1. **Git Flow**: Feature branches, develop, release, hotfix
2. **GitHub Flow**: Simple feature branches to main
3. **Trunk-Based Development**: Short-lived branches, frequent merges
4. **GitLab Flow**: Environment branches (production, staging)
5. **Release Flow**: Microsoft's approach with release branches

## Strategy Comparison

| Strategy | Complexity | Team Size | Release Frequency | Best For |
|----------|-----------|-----------|-------------------|----------|
| Git Flow | High | Large | Scheduled | Traditional releases |
| GitHub Flow | Low | Small-Medium | Continuous | Web apps, SaaS |
| Trunk-Based | Medium | Any | Very High | CI/CD, DevOps |
| GitLab Flow | Medium | Medium-Large | Regular | Multiple environments |
| Release Flow | Medium | Large | Continuous | Enterprise products |

## Lab 12: Implement All Branching Strategies

### Prerequisites

```bash
# Verify Git installation
git --version

# Configure Git (if not done)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Create lab directory
mkdir branching-strategies-lab
cd branching-strategies-lab
```

---

## Part 1: Git Flow Strategy

### What is Git Flow?

Git Flow uses multiple branch types:
- **main**: Production-ready code
- **develop**: Integration branch for features
- **feature/***: New features
- **release/***: Release preparation
- **hotfix/***: Emergency production fixes

### Why Use Git Flow?

- Clear separation of concerns
- Supports scheduled releases
- Handles hotfixes elegantly
- Good for versioned products

### How Git Flow Works

```
main ──────●────────●────────●──────
           │        │        │
           │    release/1.0  │
           │        │        │
develop ───●────●───●────●───●──────
           │    │        │
      feature/A │   feature/B
                │
           hotfix/1.0.1
```

### Lab 1.1: Setup Git Flow Repository

1. **Initialize Repository**
   ```bash
   mkdir gitflow-demo
   cd gitflow-demo
   git init
   
   # Create initial commit
   echo "# Git Flow Demo" > README.md
   git add README.md
   git commit -m "Initial commit"
   ```

2. **Create Develop Branch**
   ```bash
   # Create develop branch from main
   git checkout -b develop
   
   # Add development configuration
   echo "Development environment" > config.dev.txt
   git add config.dev.txt
   git commit -m "Add development config"
   
   # Push both branches
   git checkout main
   git push -u origin main
   git checkout develop
   git push -u origin develop
   ```

### Lab 1.2: Feature Development

1. **Create Feature Branch**
   ```bash
   # Always branch from develop
   git checkout develop
   git pull origin develop
   
   # Create feature branch
   git checkout -b feature/user-authentication
   
   # Develop the feature
   mkdir src
   cat > src/auth.js << 'EOF'
   // User Authentication Module
   class Authentication {
     constructor() {
       this.users = [];
     }
     
     register(username, password) {
       const user = { username, password, id: Date.now() };
       this.users.push(user);
       return user;
     }
     
     login(username, password) {
       const user = this.users.find(u => 
         u.username === username && u.password === password
       );
       return user ? { success: true, user } : { success: false };
     }
   }
   
   module.exports = Authentication;
   EOF
   
   git add src/auth.js
   git commit -m "feat: add user authentication module"
   ```

2. **Add Tests**
   ```bash
   cat > src/auth.test.js << 'EOF'
   const Authentication = require('./auth');
   
   describe('Authentication', () => {
     let auth;
     
     beforeEach(() => {
       auth = new Authentication();
     });
     
     test('should register new user', () => {
       const user = auth.register('john', 'password123');
       expect(user.username).toBe('john');
     });
     
     test('should login with correct credentials', () => {
       auth.register('john', 'password123');
       const result = auth.login('john', 'password123');
       expect(result.success).toBe(true);
     });
     
     test('should fail login with wrong credentials', () => {
       auth.register('john', 'password123');
       const result = auth.login('john', 'wrongpassword');
       expect(result.success).toBe(false);
     });
   });
   EOF
   
   git add src/auth.test.js
   git commit -m "test: add authentication tests"
   ```

3. **Push Feature Branch**
   ```bash
   git push -u origin feature/user-authentication
   ```

4. **Create Pull Request to Develop**
   - Go to Azure Repos → Pull Requests
   - Create PR: `feature/user-authentication` → `develop`
   - Title: "Add user authentication"
   - Add reviewers
   - Complete PR after approval

### Lab 1.3: Create Another Feature (Parallel Development)

```bash
# Switch back to develop
git checkout develop
git pull origin develop

# Create another feature
git checkout -b feature/user-profile

# Add profile functionality
cat > src/profile.js << 'EOF'
// User Profile Module
class UserProfile {
  constructor(user) {
    this.user = user;
    this.bio = '';
    this.avatar = '';
  }
  
  updateBio(bio) {
    this.bio = bio;
  }
  
  updateAvatar(avatar) {
    this.avatar = avatar;
  }
  
  getProfile() {
    return {
      username: this.user.username,
      bio: this.bio,
      avatar: this.avatar
    };
  }
}

module.exports = UserProfile;
EOF

git add src/profile.js
git commit -m "feat: add user profile management"
git push -u origin feature/user-profile
```

### Lab 1.4: Release Branch

1. **Create Release Branch**
   ```bash
   # When ready to release, branch from develop
   git checkout develop
   git pull origin develop
   
   # Create release branch
   git checkout -b release/1.0.0
   
   # Update version
   cat > VERSION << 'EOF'
   1.0.0
   EOF
   
   git add VERSION
   git commit -m "chore: bump version to 1.0.0"
   ```

2. **Release Preparation**
   ```bash
   # Update changelog
   cat > CHANGELOG.md << 'EOF'
   # Changelog
   
   ## [1.0.0] - 2024-03-15
   
   ### Added
   - User authentication module
   - User profile management
   - Initial release
   
   ### Security
   - Password-based authentication
   EOF
   
   git add CHANGELOG.md
   git commit -m "docs: add changelog for v1.0.0"
   
   # Bug fixes only on release branch
   # No new features!
   ```

3. **Merge to Main and Develop**
   ```bash
   # Merge to main
   git checkout main
   git pull origin main
   git merge --no-ff release/1.0.0 -m "Release version 1.0.0"
   git tag -a v1.0.0 -m "Version 1.0.0"
   git push origin main --tags
   
   # Merge back to develop
   git checkout develop
   git pull origin develop
   git merge --no-ff release/1.0.0 -m "Merge release 1.0.0 back to develop"
   git push origin develop
   
   # Delete release branch
   git branch -d release/1.0.0
   git push origin --delete release/1.0.0
   ```

### Lab 1.5: Hotfix Branch

1. **Create Hotfix**
   ```bash
   # Critical bug found in production!
   git checkout main
   git pull origin main
   
   # Create hotfix branch
   git checkout -b hotfix/1.0.1
   
   # Fix the bug
   cat > src/auth.js << 'EOF'
   // User Authentication Module
   class Authentication {
     constructor() {
       this.users = [];
     }
     
     register(username, password) {
       // FIX: Validate username
       if (!username || username.length < 3) {
         throw new Error('Username must be at least 3 characters');
       }
       
       const user = { username, password, id: Date.now() };
       this.users.push(user);
       return user;
     }
     
     login(username, password) {
       const user = this.users.find(u => 
         u.username === username && u.password === password
       );
       return user ? { success: true, user } : { success: false };
     }
   }
   
   module.exports = Authentication;
   EOF
   
   git add src/auth.js
   git commit -m "fix: add username validation"
   
   # Update version
   echo "1.0.1" > VERSION
   git add VERSION
   git commit -m "chore: bump version to 1.0.1"
   ```

2. **Merge Hotfix**
   ```bash
   # Merge to main
   git checkout main
   git merge --no-ff hotfix/1.0.1 -m "Hotfix 1.0.1"
   git tag -a v1.0.1 -m "Version 1.0.1 - Hotfix"
   git push origin main --tags
   
   # Merge to develop
   git checkout develop
   git merge --no-ff hotfix/1.0.1 -m "Merge hotfix 1.0.1 to develop"
   git push origin develop
   
   # Delete hotfix branch
   git branch -d hotfix/1.0.1
   git push origin --delete hotfix/1.0.1
   ```

### Git Flow Summary

```bash
# Feature workflow
git checkout develop
git checkout -b feature/my-feature
# ... develop ...
git push origin feature/my-feature
# Create PR to develop

# Release workflow
git checkout develop
git checkout -b release/1.0.0
# ... prepare release ...
git checkout main
git merge release/1.0.0
git tag v1.0.0
git checkout develop
git merge release/1.0.0

# Hotfix workflow
git checkout main
git checkout -b hotfix/1.0.1
# ... fix bug ...
git checkout main
git merge hotfix/1.0.1
git tag v1.0.1
git checkout develop
git merge hotfix/1.0.1
```

---

## Part 2: GitHub Flow Strategy

### What is GitHub Flow?

Simplified workflow:
- **main**: Always deployable
- **feature branches**: All work happens here
- Pull requests for review
- Deploy from main

### Why Use GitHub Flow?

- Simple and easy to understand
- Continuous deployment friendly
- Fast iteration
- Good for web applications

### How GitHub Flow Works

```
main ──●────●────●────●────●────●──
       │    │    │    │    │    │
   feature/A │    │    │    │    │
            │    │    │    │    │
        feature/B │    │    │    │
                 │    │    │    │
             feature/C │    │    │
                      │    │    │
                  feature/D │    │
                           │    │
                       feature/E │
```

### Lab 2.1: Setup GitHub Flow

1. **Initialize Repository**
   ```bash
   cd ..
   mkdir github-flow-demo
   cd github-flow-demo
   git init
   
   # Create main branch with initial code
   cat > app.js << 'EOF'
   // Simple Express App
   const express = require('express');
   const app = express();
   const PORT = process.env.PORT || 3000;
   
   app.get('/', (req, res) => {
     res.json({ message: 'Hello World', version: '1.0.0' });
   });
   
   app.listen(PORT, () => {
     console.log(`Server running on port ${PORT}`);
   });
   
   module.exports = app;
   EOF
   
   cat > package.json << 'EOF'
   {
     "name": "github-flow-demo",
     "version": "1.0.0",
     "main": "app.js",
     "scripts": {
       "start": "node app.js",
       "test": "jest"
     },
     "dependencies": {
       "express": "^4.18.0"
     }
   }
   EOF
   
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git push -u origin main
   ```

2. **Configure Branch Protection**
   - Go to Azure Repos → Branches
   - Click on main → Branch policies
   - Enable:
     - Require pull request reviews (1 reviewer)
     - Require status checks to pass
     - No direct pushes to main

### Lab 2.2: Feature Development (GitHub Flow)

1. **Create Feature Branch**
   ```bash
   # Always branch from main
   git checkout main
   git pull origin main
   
   # Create feature branch (descriptive name)
   git checkout -b add-user-endpoint
   ```

2. **Implement Feature**
   ```bash
   # Add new endpoint
   cat > app.js << 'EOF'
   const express = require('express');
   const app = express();
   const PORT = process.env.PORT || 3000;
   
   app.use(express.json());
   
   // In-memory user storage
   const users = [];
   
   app.get('/', (req, res) => {
     res.json({ message: 'Hello World', version: '1.0.0' });
   });
   
   // New user endpoints
   app.get('/users', (req, res) => {
     res.json(users);
   });
   
   app.post('/users', (req, res) => {
     const user = {
       id: users.length + 1,
       name: req.body.name,
       email: req.body.email
     };
     users.push(user);
     res.status(201).json(user);
   });
   
   app.listen(PORT, () => {
     console.log(`Server running on port ${PORT}`);
   });
   
   module.exports = app;
   EOF
   
   git add app.js
   git commit -m "Add user endpoints (GET and POST)"
   ```

3. **Add Tests**
   ```bash
   cat > app.test.js << 'EOF'
   const request = require('supertest');
   const app = require('./app');
   
   describe('User API', () => {
     test('GET /users returns empty array', async () => {
       const response = await request(app).get('/users');
       expect(response.status).toBe(200);
       expect(Array.isArray(response.body)).toBe(true);
     });
     
     test('POST /users creates new user', async () => {
       const response = await request(app)
         .post('/users')
         .send({ name: 'John Doe', email: 'john@example.com' });
       
       expect(response.status).toBe(201);
       expect(response.body.name).toBe('John Doe');
     });
   });
   EOF
   
   git add app.test.js
   git commit -m "Add tests for user endpoints"
   ```

4. **Push and Create PR**
   ```bash
   git push -u origin add-user-endpoint
   ```
   
   - Create PR to main
   - Request review
   - Wait for CI to pass
   - Merge after approval
   - Delete branch after merge

### Lab 2.3: Quick Iteration

```bash
# Another feature
git checkout main
git pull origin main
git checkout -b improve-error-handling

# Make changes
cat > app.js << 'EOF'
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const users = [];

app.get('/', (req, res) => {
  res.json({ message: 'Hello World', version: '1.1.0' });
});

app.get('/users', (req, res) => {
  res.json(users);
});

app.post('/users', (req, res) => {
  // Error handling
  if (!req.body.name || !req.body.email) {
    return res.status(400).json({ 
      error: 'Name and email are required' 
    });
  }
  
  const user = {
    id: users.length + 1,
    name: req.body.name,
    email: req.body.email
  };
  users.push(user);
  res.status(201).json(user);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
EOF

git add app.js
git commit -m "Add error handling and validation"
git push -u origin improve-error-handling
# Create PR, review, merge
```

### GitHub Flow Summary

```bash
# Simple workflow
git checkout main
git pull origin main
git checkout -b my-feature
# ... develop and test ...
git push origin my-feature
# Create PR, review, merge to main
# Deploy main to production
```

---

## Part 3: Trunk-Based Development

### What is Trunk-Based Development?

- Single main branch (trunk)
- Very short-lived feature branches (< 1 day)
- Frequent commits to main
- Feature flags for incomplete features
- Continuous integration

### Why Use Trunk-Based Development?

- Fastest feedback loop
- Reduces merge conflicts
- Enables true CI/CD
- Forces small, incremental changes
- Best for high-performing teams

### How Trunk-Based Works

```
main ──●─●─●─●─●─●─●─●─●─●─●─●──
       │ │ │ │ │ │ │ │ │ │ │ │
    feature branches (hours, not days)
```

### Lab 3.1: Setup Trunk-Based Development

1. **Initialize Repository**
   ```bash
   cd ..
   mkdir trunk-based-demo
   cd trunk-based-demo
   git init
   
   # Create feature flag system
   cat > featureFlags.js << 'EOF'
   // Feature Flag System
   class FeatureFlags {
     constructor() {
       this.flags = {
         newUserInterface: false,
         advancedSearch: false,
         darkMode: false
       };
     }
     
     isEnabled(flagName) {
       return this.flags[flagName] || false;
     }
     
     enable(flagName) {
       this.flags[flagName] = true;
     }
     
     disable(flagName) {
       this.flags[flagName] = false;
     }
   }
   
   module.exports = new FeatureFlags();
   EOF
   
   git add .
   git commit -m "Add feature flag system"
   git branch -M main
   git push -u origin main
   ```

2. **Configure for Trunk-Based**
   - Set up CI to run on every commit
   - Require all tests to pass
   - Keep build time under 10 minutes
   - Enable automatic deployment to dev

### Lab 3.2: Short-Lived Feature Branch

1. **Create Quick Feature**
   ```bash
   git checkout main
   git pull origin main
   
   # Create short-lived branch
   git checkout -b add-dark-mode
   
   # Implement behind feature flag
   cat > app.js << 'EOF'
   const express = require('express');
   const featureFlags = require('./featureFlags');
   const app = express();
   
   app.get('/', (req, res) => {
     const theme = featureFlags.isEnabled('darkMode') ? 'dark' : 'light';
     res.json({ 
       message: 'Hello World',
       theme: theme
     });
   });
   
   app.get('/api/features', (req, res) => {
     res.json({
       darkMode: featureFlags.isEnabled('darkMode')
     });
   });
   
   module.exports = app;
   EOF
   
   git add app.js
   git commit -m "Add dark mode (behind feature flag)"
   
   # Push immediately (same day!)
   git push -u origin add-dark-mode
   ```

2. **Quick Review and Merge**
   ```bash
   # Create PR
   # Get quick review (< 1 hour)
   # Merge to main
   
   # After merge
   git checkout main
   git pull origin main
   git branch -d add-dark-mode
   ```

3. **Enable Feature Gradually**
   ```bash
   # In production, enable for specific users
   # No code deployment needed!
   
   # Enable for 10% of users
   featureFlags.enable('darkMode', { percentage: 10 });
   
   # Monitor metrics
   # If good, increase to 50%, then 100%
   ```

### Lab 3.3: Direct Commits to Main (Advanced Teams)

```bash
# For very small changes, commit directly
git checkout main
git pull origin main

# Small fix
echo "# Documentation" > DOCS.md
git add DOCS.md
git commit -m "docs: add documentation file"
git push origin main

# CI runs automatically
# Auto-deploys if tests pass
```

### Trunk-Based Best Practices

1. **Keep branches short-lived** (< 1 day)
2. **Use feature flags** for incomplete features
3. **Commit frequently** (multiple times per day)
4. **Run tests locally** before pushing
5. **Fast CI pipeline** (< 10 minutes)
6. **Automated deployment** to dev/staging
7. **Pair programming** for complex changes

---

## Part 4: GitLab Flow Strategy

### What is GitLab Flow?

Combines feature branches with environment branches:
- **main**: Latest development
- **production**: Production environment
- **staging**: Staging environment
- **feature/***: Feature development

### Why Use GitLab Flow?

- Clear environment mapping
- Supports multiple environments
- Simple release process
- Good for continuous delivery

### How GitLab Flow Works

```
feature/A ──●──●──┐
                  ↓
main ──────●──────●──────●──────●──
                  │              │
                  ↓              ↓
staging ──────────●──────────────●──
                  │              │
                  ↓              ↓
production ───────●──────────────●──
```

### Lab 4.1: Setup GitLab Flow

1. **Initialize Repository**
   ```bash
   cd ..
   mkdir gitlab-flow-demo
   cd gitlab-flow-demo
   git init
   
   # Create initial app
   cat > app.js << 'EOF'
   const express = require('express');
   const app = express();
   
   const ENV = process.env.NODE_ENV || 'development';
   
   app.get('/', (req, res) => {
     res.json({ 
       message: 'GitLab Flow Demo',
       environment: ENV,
       version: '1.0.0'
     });
   });
   
   app.get('/health', (req, res) => {
     res.json({ status: 'healthy', environment: ENV });
   });
   
   module.exports = app;
   EOF
   
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git push -u origin main
   ```

2. **Create Environment Branches**
   ```bash
   # Create staging branch
   git checkout -b staging
   git push -u origin staging
   
   # Create production branch
   git checkout -b production
   git push -u origin production
   
   # Back to main
   git checkout main
   ```

### Lab 4.2: Feature to Staging to Production

1. **Develop Feature**
   ```bash
   git checkout main
   git pull origin main
   
   # Create feature
   git checkout -b feature/add-metrics
   
   cat > app.js << 'EOF'
   const express = require('express');
   const app = express();
   
   const ENV = process.env.NODE_ENV || 'development';
   let requestCount = 0;
   
   // Middleware to count requests
   app.use((req, res, next) => {
     requestCount++;
     next();
   });
   
   app.get('/', (req, res) => {
     res.json({ 
       message: 'GitLab Flow Demo',
       environment: ENV,
       version: '1.1.0'
     });
   });
   
   app.get('/health', (req, res) => {
     res.json({ status: 'healthy', environment: ENV });
   });
   
   app.get('/metrics', (req, res) => {
     res.json({ 
       requests: requestCount,
       uptime: process.uptime()
     });
   });
   
   module.exports = app;
   EOF
   
   git add app.js
   git commit -m "feat: add metrics endpoint"
   git push -u origin feature/add-metrics
   ```

2. **Merge to Main**
   ```bash
   # Create PR: feature/add-metrics → main
   # Review and merge
   
   git checkout main
   git pull origin main
   ```

3. **Deploy to Staging**
   ```bash
   # Merge main to staging
   git checkout staging
   git pull origin staging
   git merge main -m "Deploy v1.1.0 to staging"
   git push origin staging
   
   # Pipeline deploys to staging environment
   # Run tests in staging
   ```

4. **Deploy to Production**
   ```bash
   # After staging validation
   git checkout production
   git pull origin production
   git merge staging -m "Deploy v1.1.0 to production"
   git push origin production
   
   # Pipeline deploys to production
   ```

### Lab 4.3: Hotfix in GitLab Flow

```bash
# Hotfix goes to production first
git checkout production
git pull origin production

# Create hotfix branch
git checkout -b hotfix/critical-bug

# Fix the bug
cat > app.js << 'EOF'
const express = require('express');
const app = express();

const ENV = process.env.NODE_ENV || 'development';
let requestCount = 0;

app.use((req, res, next) => {
  requestCount++;
  next();
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'GitLab Flow Demo',
    environment: ENV,
    version: '1.1.1'
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', environment: ENV });
});

app.get('/metrics', (req, res) => {
  // FIX: Handle division by zero
  const avgResponseTime = requestCount > 0 ? 
    process.uptime() / requestCount : 0;
    
  res.json({ 
    requests: requestCount,
    uptime: process.uptime(),
    avgResponseTime: avgResponseTime
  });
});

module.exports = app;
EOF

git add app.js
git commit -m "fix: handle division by zero in metrics"

# Merge to production
git checkout production
git merge hotfix/critical-bug
git push origin production

# Merge back to staging
git checkout staging
git merge production
git push origin staging

# Merge back to main
git checkout main
git merge staging
git push origin main

# Delete hotfix branch
git branch -d hotfix/critical-bug
```

---

## Part 5: Release Flow (Microsoft)

### What is Release Flow?

Microsoft's strategy for large-scale products:
- **main**: Always releasable
- **release/***: Long-lived release branches
- **feature/***: Short-lived feature branches
- Cherry-pick fixes to release branches

### Why Use Release Flow?

- Support multiple versions simultaneously
- Selective bug fixes to old versions
- Good for enterprise software
- Handles long support cycles

### How Release Flow Works

```
main ──────●────●────●────●────●────●──
           │    │    │    │    │    │
      feature/A │    │    │    │    │
                │    │    │    │    │
           feature/B │    │    │    │
                     │    │    │    │
release/2024.1 ──────●────●────●────●──
                     │    │    │
                  cherry-pick fixes
```

### Lab 5.1: Setup Release Flow

1. **Initialize Repository**
   ```bash
   cd ..
   mkdir release-flow-demo
   cd release-flow-demo
   git init
   
   cat > app.js << 'EOF'
   const VERSION = '2024.1.0';
   
   class Application {
     getVersion() {
       return VERSION;
     }
     
     getFeatures() {
       return ['feature-a', 'feature-b'];
     }
   }
   
   module.exports = Application;
   EOF
   
   git add .
   git commit -m "Initial release 2024.1.0"
   git branch -M main
   git push -u origin main
   ```

2. **Create Release Branch**
   ```bash
   # Create release branch for 2024.1
   git checkout -b release/2024.1
   git push -u origin release/2024.1
   
   # Tag the release
   git tag -a v2024.1.0 -m "Release 2024.1.0"
   git push origin v2024.1.0
   ```

### Lab 5.2: Continue Development on Main

```bash
# Switch to main for new features
git checkout main

# Add new feature
cat > app.js << 'EOF'
const VERSION = '2024.2.0';

class Application {
  getVersion() {
    return VERSION;
  }
  
  getFeatures() {
    return ['feature-a', 'feature-b', 'feature-c'];
  }
  
  // New feature
  getAdvancedFeatures() {
    return ['advanced-analytics', 'ai-insights'];
  }
}

module.exports = Application;
EOF

git add app.js
git commit -m "feat: add advanced features for 2024.2"
git push origin main
```

### Lab 5.3: Fix Bug in Release Branch

```bash
# Bug found in 2024.1 release
git checkout release/2024.1

# Fix the bug
cat > app.js << 'EOF'
const VERSION = '2024.1.1';

class Application {
  getVersion() {
    return VERSION;
  }
  
  getFeatures() {
    return ['feature-a', 'feature-b'];
  }
  
  // FIX: Add validation
  validateFeature(feature) {
    const features = this.getFeatures();
    return features.includes(feature);
  }
}

module.exports = Application;
EOF

git add app.js
git commit -m "fix: add feature validation"

# Tag the patch
git tag -a v2024.1.1 -m "Release 2024.1.1 - Bug fix"
git push origin release/2024.1 --tags
```

### Lab 5.4: Cherry-Pick Fix to Main

```bash
# Get the commit hash
COMMIT_HASH=$(git log -1 --format="%H")

# Switch to main
git checkout main

# Cherry-pick the fix
git cherry-pick $COMMIT_HASH

# Resolve conflicts if any
git push origin main
```

---

## Part 6: Branch Policy Configuration

### Lab 6.1: Configure Branch Policies in Azure DevOps

1. **Main Branch Protection**
   ```yaml
   # Go to Azure Repos → Branches → main → Branch policies
   
   Policies to Enable:
   ✓ Require a minimum number of reviewers: 2
   ✓ Allow requestors to approve their own changes: NO
   ✓ Prohibit the most recent pusher from approving: YES
   ✓ Reset reviewer votes when new changes are pushed: YES
   ✓ Check for linked work items: Required
   ✓ Check for comment resolution: Required
   ✓ Limit merge types: Squash merge only
   
   Build Validation:
   ✓ Add build policy: CI Pipeline (Required)
   ✓ Build expiration: Immediately
   ✓ Display name: "CI Build"
   ```

2. **Develop Branch Protection (Git Flow)**
   ```yaml
   Policies for develop:
   ✓ Require minimum 1 reviewer
   ✓ Check for linked work items: Optional
   ✓ Build validation: Required
   ```

3. **Create Branch Policy Script**
   ```bash
   # Create script to set policies via Azure CLI
   cat > set-branch-policies.sh << 'EOF'
   #!/bin/bash
   
   ORG="your-org"
   PROJECT="your-project"
   REPO="your-repo"
   
   # Set main branch policies
   az repos policy approver-count create \
     --organization "https://dev.azure.com/$ORG" \
     --project "$PROJECT" \
     --repository-id "$REPO" \
     --branch "main" \
     --minimum-approver-count 2 \
     --creator-vote-counts false \
     --blocking true
   
   # Add build validation
   az repos policy build create \
     --organization "https://dev.azure.com/$ORG" \
     --project "$PROJECT" \
     --repository-id "$REPO" \
     --branch "main" \
     --build-definition-id <build-id> \
     --blocking true \
     --enabled true
   EOF
   
   chmod +x set-branch-policies.sh
   ```

---

## Part 7: Branching Strategy Decision Matrix

### Lab 7.1: Choose Your Strategy

Create a decision document:

```bash
cat > BRANCHING_STRATEGY.md << 'EOF'
# Branching Strategy Decision

## Team Profile
- Team Size: [Small/Medium/Large]
- Experience Level: [Junior/Mixed/Senior]
- Release Frequency: [Daily/Weekly/Monthly/Quarterly]
- Product Type: [Web App/Mobile/Enterprise/Library]

## Decision Matrix

### Choose Git Flow If:
- [ ] Scheduled releases (monthly/quarterly)
- [ ] Multiple versions in production
- [ ] Need formal release process
- [ ] Large team (10+ developers)
- [ ] Traditional software product

### Choose GitHub Flow If:
- [ ] Continuous deployment
- [ ] Web application/SaaS
- [ ] Small to medium team
- [ ] Simple workflow preferred
- [ ] Single production version

### Choose Trunk-Based If:
- [ ] Very frequent releases (multiple per day)
- [ ] Experienced team
- [ ] Strong CI/CD culture
- [ ] Microservices architecture
- [ ] High test coverage

### Choose GitLab Flow If:
- [ ] Multiple environments
- [ ] Regular releases (weekly)
- [ ] Need environment branches
- [ ] Medium complexity
- [ ] Clear deployment pipeline

### Choose Release Flow If:
- [ ] Enterprise software
- [ ] Long-term support needed
- [ ] Multiple versions supported
- [ ] Large organization
- [ ] Complex release cycles

## Our Decision: [Strategy Name]

### Reasoning:
1. [Reason 1]
2. [Reason 2]
3. [Reason 3]

### Implementation Plan:
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Success Metrics:
- Deployment frequency
- Lead time for changes
- Change failure rate
- Time to restore service
EOF
```

---

## Part 8: Advanced Branching Techniques

### Lab 8.1: Branch Naming Conventions

```bash
# Create naming convention guide
cat > BRANCH_NAMING.md << 'EOF'
# Branch Naming Conventions

## Format
`<type>/<ticket-id>-<short-description>`

## Types
- feature/  : New features
- bugfix/   : Bug fixes
- hotfix/   : Emergency fixes
- release/  : Release preparation
- docs/     : Documentation
- refactor/ : Code refactoring
- test/     : Test additions

## Examples
✓ feature/PROJ-123-user-authentication
✓ bugfix/PROJ-456-fix-login-error
✓ hotfix/PROJ-789-critical-security-patch
✓ release/2024.1.0
✓ docs/PROJ-234-api-documentation
✓ refactor/PROJ-567-optimize-database-queries

✗ my-feature (no type)
✗ fix-bug (no ticket)
✗ PROJ-123 (no description)
EOF
```

### Lab 8.2: Commit Message Standards

```bash
cat > COMMIT_STANDARDS.md << 'EOF'
# Commit Message Standards

## Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

## Types
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Formatting
- refactor: Code restructuring
- test: Adding tests
- chore: Maintenance

## Examples

```
feat(auth): add OAuth2 authentication

Implement OAuth2 flow for Google and GitHub providers.
Includes token refresh and user profile fetching.

Closes #123
```

```
fix(api): handle null response in user endpoint

Added null check before accessing user properties
to prevent TypeError.

Fixes #456
```

## Rules
1. Use imperative mood ("add" not "added")
2. Don't capitalize first letter
3. No period at the end
4. Reference tickets in footer
5. Keep subject under 50 characters
6. Wrap body at 72 characters
EOF
```

### Lab 8.3: Merge Strategies

```bash
# Create merge strategy guide
cat > MERGE_STRATEGIES.md << 'EOF'
# Merge Strategies

## 1. Merge Commit (--no-ff)
```bash
git merge --no-ff feature/my-feature
```
**Pros**: Preserves history, shows feature boundaries
**Cons**: Cluttered history
**Use**: Git Flow, GitLab Flow

## 2. Squash Merge
```bash
git merge --squash feature/my-feature
git commit -m "feat: add my feature"
```
**Pros**: Clean history, single commit per feature
**Cons**: Loses detailed history
**Use**: GitHub Flow, Trunk-Based

## 3. Rebase and Merge
```bash
git checkout feature/my-feature
git rebase main
git checkout main
git merge feature/my-feature
```
**Pros**: Linear history, no merge commits
**Cons**: Rewrites history
**Use**: Trunk-Based Development

## 4. Fast-Forward (default)
```bash
git merge feature/my-feature
```
**Pros**: Simplest, linear history
**Cons**: No feature boundaries
**Use**: Small changes, hotfixes

## Our Standard
- Features: Squash merge
- Hotfixes: Fast-forward
- Releases: Merge commit (--no-ff)
EOF
```

---

## Part 9: Automation and Tooling

### Lab 9.1: Git Hooks for Branch Validation

```bash
# Create pre-push hook
cat > .git/hooks/pre-push << 'EOF'
#!/bin/bash

# Get current branch
current_branch=$(git symbolic-ref --short HEAD)

# Protected branches
protected_branches=("main" "develop" "production")

# Check if pushing to protected branch
for branch in "${protected_branches[@]}"; do
  if [ "$current_branch" = "$branch" ]; then
    echo "❌ Direct push to $branch is not allowed!"
    echo "Please create a pull request instead."
    exit 1
  fi
done

echo "✓ Pre-push validation passed"
exit 0
EOF

chmod +x .git/hooks/pre-push
```

### Lab 9.2: Branch Cleanup Script

```bash
cat > cleanup-branches.sh << 'EOF'
#!/bin/bash

echo "Cleaning up merged branches..."

# Update from remote
git fetch --prune

# Get current branch
current_branch=$(git branch --show-current)

# Delete merged local branches
git branch --merged main | \
  grep -v "main" | \
  grep -v "develop" | \
  grep -v "production" | \
  grep -v "$current_branch" | \
  xargs -r git branch -d

# Delete remote tracking branches that are gone
git branch -vv | \
  grep ': gone]' | \
  awk '{print $1}' | \
  xargs -r git branch -D

echo "✓ Cleanup complete"
EOF

chmod +x cleanup-branches.sh
```

### Lab 9.3: Branch Status Dashboard

```bash
cat > branch-status.sh << 'EOF'
#!/bin/bash

echo "========================================="
echo "Branch Status Dashboard"
echo "========================================="

# Current branch
echo "Current Branch: $(git branch --show-current)"
echo ""

# Branch list with last commit
echo "All Branches:"
git for-each-ref --sort=-committerdate refs/heads/ \
  --format='%(refname:short)|%(committerdate:relative)|%(authorname)' | \
  column -t -s '|'

echo ""

# Unmerged branches
echo "Unmerged to main:"
git branch --no-merged main | sed 's/^/  /'

echo ""

# Stale branches (> 30 days)
echo "Stale Branches (>30 days):"
git for-each-ref --sort=-committerdate refs/heads/ \
  --format='%(refname:short) %(committerdate:relative)' | \
  grep -E 'months?|years?' | \
  sed 's/^/  /'

echo "========================================="
EOF

chmod +x branch-status.sh
```

---

## Part 10: Best Practices Summary

### Verification Checklist

- [ ] Chosen appropriate branching strategy
- [ ] Configured branch policies
- [ ] Set up naming conventions
- [ ] Implemented commit standards
- [ ] Created merge strategy guidelines
- [ ] Set up automation (hooks, scripts)
- [ ] Documented workflow
- [ ] Trained team members
- [ ] Established review process
- [ ] Set up CI/CD integration

### Key Takeaways

1. **No One-Size-Fits-All**
   - Choose based on team, product, and release cycle
   - Can evolve as team matures

2. **Consistency is Key**
   - Document your strategy
   - Enforce with automation
   - Regular team training

3. **Keep It Simple**
   - Start simple, add complexity only when needed
   - Simpler strategies have higher adoption

4. **Measure Success**
   - Track DORA metrics
   - Monitor merge conflicts
   - Measure deployment frequency

5. **Continuous Improvement**
   - Regular retrospectives
   - Adjust based on pain points
   - Stay flexible

### Common Pitfalls to Avoid

❌ **Don't**:
- Mix strategies inconsistently
- Create too many long-lived branches
- Skip code reviews
- Ignore branch policies
- Let branches become stale
- Forget to delete merged branches
- Push directly to protected branches

✅ **Do**:
- Keep branches short-lived
- Merge frequently
- Use descriptive names
- Write good commit messages
- Automate enforcement
- Clean up regularly
- Document exceptions

## Next Steps

1. **Implement Your Strategy**
   - Choose one strategy
   - Set up branch policies
   - Train your team

2. **Integrate with CI/CD**
   - Automate builds on branches
   - Deploy from specific branches
   - Set up automated tests

3. **Monitor and Adjust**
   - Track metrics
   - Gather team feedback
   - Refine process

4. **Advanced Topics**
   - Monorepo strategies
   - Microservices branching
   - Cross-repo dependencies

## Congratulations!

You've mastered all major branching strategies:
- ✅ Git Flow (complex, scheduled releases)
- ✅ GitHub Flow (simple, continuous deployment)
- ✅ Trunk-Based Development (advanced, very frequent)
- ✅ GitLab Flow (environment-based)
- ✅ Release Flow (enterprise, long-term support)

You can now choose and implement the right strategy for any team! 🎉
