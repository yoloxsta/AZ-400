# Day 40: Azure Key Vault - Secrets, Keys & Certificates

## What You'll Learn

Securely manage secrets, keys, and certificates:
- ✅ What is Key Vault and why use it
- ✅ Secrets (passwords, connection strings, API keys)
- ✅ Keys (encryption keys)
- ✅ Certificates (SSL/TLS)
- ✅ Access Policies vs RBAC
- ✅ Access from VM with Managed Identity
- ✅ Access from code (Python)
- ✅ Soft delete and purge protection
- ✅ Key Vault in Azure DevOps Pipeline
- ✅ Complete test, check, and confirm

## Table of Contents

1. [What is Key Vault?](#what-is-key-vault)
2. [Why Use Key Vault?](#why-use-key-vault)
3. [Lab 1: Create Key Vault](#lab-1-create-key-vault)
4. [Lab 2: Store and Retrieve Secrets](#lab-2-store-and-retrieve-secrets)
5. [Lab 3: Secret Versions and Rotation](#lab-3-secret-versions-and-rotation)
6. [Lab 4: Access from VM with Managed Identity](#lab-4-access-from-vm-with-managed-identity)
7. [Lab 5: Access from Python Code](#lab-5-access-from-python-code)
8. [Lab 6: Keys (Encryption)](#lab-6-keys-encryption)
9. [Lab 7: Certificates](#lab-7-certificates)
10. [Lab 8: Key Vault in Azure DevOps Pipeline](#lab-8-key-vault-in-azure-devops-pipeline)
11. [Lab 9: Soft Delete and Purge Protection](#lab-9-soft-delete-and-purge-protection)
12. [Cleanup](#cleanup)

---

## What is Key Vault?

**Azure Key Vault** = A secure store for secrets, encryption keys, and certificates.

### Simple Explanation

```
Think of it like this:

🔐 Physical Vault (bank):
  Store: Cash, jewelry, documents
  Access: Only authorized people with keys
  Audit: Camera records who opens the vault
  Protection: Fireproof, waterproof, theft-proof

☁️ Azure Key Vault:
  Store: Passwords, API keys, connection strings, certificates
  Access: Only authorized apps/users with permissions
  Audit: Logs record every access
  Protection: Encrypted, backed up, replicated

┌──────────────────────────────────────────────────────────────┐
│  KEY VAULT STORES 3 THINGS                                    │
│                                                               │
│  1. SECRETS                                                  │
│     Any text value you want to protect                       │
│     ├─ Database passwords                                    │
│     ├─ API keys (Stripe, SendGrid, etc.)                    │
│     ├─ Connection strings                                    │
│     └─ Any sensitive configuration                           │
│                                                               │
│  2. KEYS                                                     │
│     Cryptographic keys for encryption/decryption             │
│     ├─ RSA keys (2048, 3072, 4096 bit)                      │
│     ├─ EC keys (P-256, P-384, P-521)                        │
│     └─ Used for: Encrypt data, sign tokens, wrap keys       │
│                                                               │
│  3. CERTIFICATES                                             │
│     SSL/TLS certificates                                     │
│     ├─ Self-signed certificates                              │
│     ├─ CA-signed certificates                                │
│     ├─ Auto-renewal with supported CAs                       │
│     └─ Used for: HTTPS, code signing                         │
└──────────────────────────────────────────────────────────────┘
```

---

## Why Use Key Vault?

```
┌─────────────────────────────────────────────────────────────────┐
│  ❌ WITHOUT KEY VAULT (BAD PRACTICES)                            │
│                                                                  │
│  1. Secrets in code:                                            │
│     DB_PASSWORD = "super_secret_123"  ← In source code! 😱     │
│     Anyone with repo access sees it                             │
│                                                                  │
│  2. Secrets in environment variables:                           │
│     export DB_PASSWORD="super_secret_123"                       │
│     Visible in process list, logs, crash dumps                  │
│                                                                  │
│  3. Secrets in config files:                                    │
│     appsettings.json: { "password": "super_secret_123" }       │
│     Committed to Git, visible to everyone                       │
│                                                                  │
│  4. Secrets in Azure DevOps variables:                          │
│     Better, but still visible to pipeline admins                │
│     No audit trail, no rotation, no versioning                  │
│                                                                  │
│  Problems:                                                      │
│  ├─ Secrets leaked in Git history                               │
│  ├─ No audit (who accessed what, when?)                         │
│  ├─ No rotation (same password for years)                       │
│  ├─ No versioning (can't roll back)                             │
│  └─ Compliance violations (PCI-DSS, HIPAA, SOC2)               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  ✅ WITH KEY VAULT                                               │
│                                                                  │
│  1. Secrets in Key Vault:                                       │
│     App reads from Key Vault at runtime                         │
│     No secrets in code, config, or environment                  │
│                                                                  │
│  2. Access control:                                             │
│     Only authorized apps/users can read secrets                 │
│     Managed Identity (no passwords to manage!)                  │
│                                                                  │
│  3. Audit logging:                                              │
│     Every access logged (who, what, when)                       │
│     Send to Log Analytics for monitoring                        │
│                                                                  │
│  4. Versioning:                                                 │
│     Every secret change creates a new version                   │
│     Can roll back to previous version                           │
│                                                                  │
│  5. Rotation:                                                   │
│     Change secrets without redeploying apps                     │
│     Apps always get the latest version                          │
│                                                                  │
│  6. Compliance:                                                 │
│     FIPS 140-2 Level 2 (Standard) or Level 3 (Premium)         │
│     Meets PCI-DSS, HIPAA, SOC2 requirements                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Lab 1: Create Key Vault

### Step 1: Create Resource Group

```
1. Azure Portal → Resource groups → "+ Create"
2. Name: rg-day40-keyvault
3. Region: East US
4. Click "Review + create" → "Create"
```

### Step 2: Create Key Vault

```
1. Search "Key vaults" → "+ Create"
2. Fill in:

   Basics:
   - Subscription: Your subscription
   - Resource group: rg-day40-keyvault
   - Key vault name: kv-day40-demo (must be globally unique)
   - Region: East US
   - Pricing tier: Standard
     (Standard: Software-protected keys
      Premium: HSM-protected keys, ~$1/key/month)

   Access configuration:
   - Permission model: Azure role-based access control (RBAC)
     ← RECOMMENDED over Access Policies!
   
   Networking:
   - Public access: All networks
     (For lab. In production, use Private Endpoint!)

   Recovery:
   - Soft delete: Enabled (default, can't disable)
   - Days to retain: 90
   - Purge protection: Disabled (for lab cleanup)
     (In production: ENABLE purge protection!)

3. Click "Review + create" → "Create"
```

**⏱️ Wait**: 1-2 minutes

### Step 3: Assign Yourself Access

```
With RBAC, you need a role to manage secrets:

1. Go to kv-day40-demo
2. Left menu → "Access control (IAM)"
3. Click "+ Add" → "Add role assignment"
4. Role: Key Vault Administrator
   (This gives full access to secrets, keys, certificates)
5. Members: Select your user account
6. Click "Review + assign"

⏱️ Wait: 1-2 minutes for role to propagate
```

### Step 4: Test, Check, and Confirm

**Test 1: Key Vault Created**

```
Key vaults → kv-day40-demo
  ✅ Status: Active
  ✅ Region: East US
  ✅ Pricing: Standard
  ✅ Soft delete: Enabled
```

**Test 2: RBAC Configured**

```
kv-day40-demo → Access control (IAM) → Role assignments
  ✅ Your user: Key Vault Administrator
```

**Test 3: Vault URI**

```
kv-day40-demo → Overview
  ✅ Vault URI: https://kv-day40-demo.vault.azure.net/
```

**✅ Result**: Key Vault ready!

---

## Lab 2: Store and Retrieve Secrets

### Step 1: Create Secrets via Portal

```
1. Go to kv-day40-demo
2. Left menu → "Secrets"
3. Click "+ Generate/Import"
4. Fill in:

   Secret 1:
   - Upload options: Manual
   - Name: db-password
   - Secret value: P@ssw0rd2026!
   - Content type: text/plain (optional, for your reference)
   - Set activation date: (leave empty)
   - Set expiration date: (leave empty for now)
   - Enabled: Yes
   - Click "Create"

   Secret 2:
   - Name: api-key-stripe
   - Secret value: sk_live_abc123def456ghi789
   - Click "Create"

   Secret 3:
   - Name: db-connection-string
   - Secret value: Server=mydb.database.windows.net;Database=appdb;User=admin;Password=P@ssw0rd2026!
   - Click "Create"
```

### Step 2: Retrieve Secrets via Portal

```
1. Go to Secrets → Click "db-password"
2. Click on the CURRENT VERSION (the long ID)
3. Click "Show Secret Value"
4. You'll see: P@ssw0rd2026!
   ✅ Secret retrieved!

5. Note the Secret Identifier (URL):
   https://kv-day40-demo.vault.azure.net/secrets/db-password/abc123...
   This URL uniquely identifies this secret version.
```

### Step 3: Retrieve Secrets via Azure CLI

```bash
# Login to Azure CLI
az login

# Get secret value
az keyvault secret show \
  --vault-name kv-day40-demo \
  --name db-password \
  --query value -o tsv

# Output: P@ssw0rd2026! ✅

# Get all secrets (names only, not values)
az keyvault secret list \
  --vault-name kv-day40-demo \
  --query "[].name" -o tsv

# Output:
# db-password
# api-key-stripe
# db-connection-string
```

### Step 4: Test, Check, and Confirm

**Test 1: Secrets Created**

```
kv-day40-demo → Secrets
  ✅ db-password
  ✅ api-key-stripe
  ✅ db-connection-string
```

**Test 2: Secret Value Readable**

```
Click db-password → Show Secret Value
  ✅ P@ssw0rd2026! displayed
```

**Test 3: CLI Access**

```
az keyvault secret show --vault-name kv-day40-demo --name db-password
  ✅ Value returned
```

**✅ Result**: Secrets stored and retrievable!

---

## Lab 3: Secret Versions and Rotation

### What are Versions?

```
Every time you UPDATE a secret, Key Vault creates a NEW VERSION.
Old versions are kept! You can roll back.

db-password:
  Version 1: P@ssw0rd2026!        (created March 1)
  Version 2: NewP@ssw0rd2026!     (created March 15)  ← CURRENT
  Version 3: RotatedP@ss2026!     (created April 1)   ← LATEST

Apps that request "db-password" get the LATEST version.
Apps that request a specific version ID get THAT version.
```

### Step 1: Update a Secret (Create New Version)

```
1. Go to Secrets → db-password
2. Click "+ New Version"
3. Secret value: NewP@ssw0rd2026!
4. Click "Create"

Now db-password has 2 versions!
```

### Step 2: View All Versions

```
1. Go to Secrets → db-password
2. You'll see 2 versions listed:
   - Version abc123... (CURRENT) ← NewP@ssw0rd2026!
   - Version def456... (older)   ← P@ssw0rd2026!

3. Click each to see its value
   ✅ Both versions accessible!
```

### Step 3: Set Expiration Date

```
1. Go to Secrets → api-key-stripe
2. Click current version
3. Click "Edit"
4. Set expiration date: 90 days from now
5. Click "Save"

When the secret expires:
  ├─ It's NOT deleted (still exists)
  ├─ It's marked as "expired"
  ├─ Apps can still read it (unless you configure otherwise)
  └─ You get a notification (if configured)
```

### Step 4: Test, Check, and Confirm

**Test 1: Multiple Versions**

```
db-password → Versions
  ✅ 2 versions listed
  ✅ Latest version is current
  ✅ Old version still accessible
```

**Test 2: Latest Version Returned by Default**

```
az keyvault secret show --vault-name kv-day40-demo --name db-password --query value -o tsv
  ✅ Returns: NewP@ssw0rd2026! (latest version)
```

**Test 3: Specific Version Accessible**

```
Click old version → Show Secret Value
  ✅ P@ssw0rd2026! (original value)
```

**✅ Result**: Secret versioning working!

---

## Lab 4: Access from VM with Managed Identity

### What is Managed Identity?

```
┌──────────────────────────────────────────────────────────────┐
│  MANAGED IDENTITY                                             │
│                                                               │
│  Problem: VM needs to read secrets from Key Vault            │
│  Old way: Store Key Vault password on the VM 😱              │
│           (Secret to access secrets? Chicken-and-egg!)       │
│                                                               │
│  New way: Managed Identity                                   │
│  Azure gives the VM an IDENTITY (like a user account)        │
│  You grant that identity access to Key Vault                 │
│  VM authenticates automatically (no passwords!)              │
│                                                               │
│  VM: "Hey Key Vault, I'm vm-day40, give me db-password"     │
│  Key Vault: "Let me check... yes, vm-day40 has access. Here."│
│  VM: Gets the secret. No password needed!                    │
└──────────────────────────────────────────────────────────────┘
```

### Step 1: Create VM with Managed Identity

```
1. Virtual machines → "+ Create"
2. Fill in:
   - Resource group: rg-day40-keyvault
   - Name: vm-day40
   - Region: East US
   - Image: Ubuntu 22.04 LTS
   - Size: Standard_B1s
   - Username: azureuser
   - Password: Day40KV@2026
   - Public inbound ports: Allow SSH (22)

   Management tab:
   - Identity → System assigned managed identity: ✅ On
     ← THIS IS THE KEY SETTING!

3. Click "Review + create" → "Create"
```

**⏱️ Wait**: 2-3 minutes

### Step 2: Grant VM Access to Key Vault

```
1. Go to kv-day40-demo → Access control (IAM)
2. Click "+ Add" → "Add role assignment"
3. Role: Key Vault Secrets User
   (Can READ secrets, but NOT create/delete)
4. Members: 
   - Assign access to: Managed identity
   - Click "+ Select members"
   - Managed identity: Virtual machine
   - Select: vm-day40
   - Click "Select"
5. Click "Review + assign"
```

### Step 3: Read Secret from VM

```bash
# SSH into VM
ssh azureuser@<VM-PUBLIC-IP>

# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login with Managed Identity (no password needed!)
az login --identity

# Output: Shows subscription info
# ✅ Logged in with Managed Identity!

# Read secret from Key Vault
az keyvault secret show \
  --vault-name kv-day40-demo \
  --name db-password \
  --query value -o tsv

# Output: NewP@ssw0rd2026!
# ✅ Secret retrieved using Managed Identity!

# Read another secret
az keyvault secret show \
  --vault-name kv-day40-demo \
  --name api-key-stripe \
  --query value -o tsv

# Output: sk_live_abc123def456ghi789 ✅

exit
```

### Step 4: Test, Check, and Confirm

**Test 1: Managed Identity Enabled**

```
vm-day40 → Identity
  ✅ System assigned: On
  ✅ Object ID: shown
```

**Test 2: RBAC Role Assigned**

```
kv-day40-demo → Access control → Role assignments
  ✅ vm-day40: Key Vault Secrets User
```

**Test 3: Secret Retrieved from VM**

```
From VM:
  az login --identity → ✅ Success
  az keyvault secret show ... → ✅ Secret value returned
  No password needed! ✅
```

**✅ Result**: Managed Identity access to Key Vault working!

---

## Lab 5: Access from Python Code

### Step 1: Install Python SDK on VM

```bash
ssh azureuser@<VM-PUBLIC-IP>

pip3 install azure-identity azure-keyvault-secrets
```

### Step 2: Create Python Script

```bash
cat > ~/read_secrets.py << 'PYEOF'
from azure.identity import DefaultAzureCredential
from azure.keyvault.secrets import SecretClient

# Key Vault URL
vault_url = "https://kv-day40-demo.vault.azure.net/"

# Authenticate (uses Managed Identity on VM, or az login locally)
credential = DefaultAzureCredential()
client = SecretClient(vault_url=vault_url, credential=credential)

print("🔐 Reading secrets from Key Vault...\n")

# Read secrets
secrets_to_read = ["db-password", "api-key-stripe", "db-connection-string"]

for secret_name in secrets_to_read:
    secret = client.get_secret(secret_name)
    # Mask the value for display
    masked = secret.value[:4] + "****" if len(secret.value) > 4 else "****"
    print(f"  📌 {secret_name}")
    print(f"     Value: {masked}")
    print(f"     Version: {secret.properties.version[:8]}...")
    print(f"     Created: {secret.properties.created_on}")
    print(f"     Enabled: {secret.properties.enabled}")
    print()

print("✅ All secrets retrieved successfully!")

# Example: Use secret in your app
db_password = client.get_secret("db-password").value
print(f"\n🔗 Connecting to database with password: {'*' * len(db_password)}")
print("   (In real app, you'd use this to connect to your database)")
PYEOF
```

### Step 3: Run the Script

```bash
python3 ~/read_secrets.py

# Output:
# 🔐 Reading secrets from Key Vault...
#
#   📌 db-password
#      Value: NewP****
#      Version: abc12345...
#      Created: 2026-03-28 10:00:00
#      Enabled: True
#
#   📌 api-key-stripe
#      Value: sk_l****
#      Version: def67890...
#      Created: 2026-03-28 10:01:00
#      Enabled: True
#
#   📌 db-connection-string
#      Value: Serv****
#      Version: ghi11111...
#      Created: 2026-03-28 10:02:00
#      Enabled: True
#
# ✅ All secrets retrieved successfully!

exit
```

### Step 4: Test, Check, and Confirm

**Test 1: Python SDK Works**

```
python3 read_secrets.py
  ✅ All 3 secrets retrieved
  ✅ Version info shown
  ✅ No password in code!
```

**Test 2: DefaultAzureCredential Works**

```
✅ Uses Managed Identity on VM automatically
✅ No connection string or password in code
✅ Secure by design
```

**✅ Result**: Python access to Key Vault working!

---

## Lab 6: Keys (Encryption)

### What are Keys?

```
Keys = Cryptographic keys for encrypting/decrypting data

You don't store the key in your app.
You ask Key Vault to encrypt/decrypt FOR you.
The key never leaves Key Vault!

App: "Key Vault, encrypt this data with my key"
KV:  "Here's the encrypted data"
App: Stores encrypted data in database

App: "Key Vault, decrypt this data"
KV:  "Here's the decrypted data"
```

### Step 1: Create a Key

```
1. Go to kv-day40-demo → Keys
2. Click "+ Generate/Import"
3. Fill in:
   - Options: Generate
   - Name: app-encryption-key
   - Key type: RSA
   - RSA key size: 2048
   - Enabled: Yes
4. Click "Create"
```

### Step 2: View Key Details

```
1. Click "app-encryption-key"
2. Click current version
3. You'll see:
   - Key Identifier (URL)
   - Key type: RSA
   - Key operations: Encrypt, Decrypt, Sign, Verify, Wrap, Unwrap
   
   ⚠️ You CANNOT see the private key!
   Key Vault keeps it secure. You can only USE it.
```

### Step 3: Test, Check, and Confirm

**Test 1: Key Created**

```
kv-day40-demo → Keys
  ✅ app-encryption-key exists
  ✅ Type: RSA 2048
  ✅ Status: Enabled
```

**✅ Result**: Encryption key created!

---

## Lab 7: Certificates

### What are Certificates?

```
Certificates = SSL/TLS certificates for HTTPS

Key Vault can:
  ├─ Store certificates you already have
  ├─ Generate self-signed certificates
  ├─ Request certificates from CAs (DigiCert, GlobalSign)
  └─ Auto-renew certificates before they expire!
```

### Step 1: Create Self-Signed Certificate

```
1. Go to kv-day40-demo → Certificates
2. Click "+ Generate/Import"
3. Fill in:
   - Method: Generate
   - Certificate Name: app-ssl-cert
   - Type of CA: Self-signed certificate
   - Subject: CN=app.example.com
   - DNS Names: app.example.com (click "Add")
   - Validity Period: 12 months
   - Content Type: PKCS #12
   - Lifetime Action:
     - Action: Auto-renew
     - Days before expiry: 30
4. Click "Create"
```

**⏱️ Wait**: 30 seconds

### Step 2: View Certificate

```
1. Click "app-ssl-cert"
2. Click current version
3. You'll see:
   - Subject: CN=app.example.com
   - Thumbprint: ABC123...
   - Expiry: 12 months from now
   - Status: Enabled
   
4. You can download:
   - Certificate (public key) → for clients
   - PFX (private key + cert) → for servers
```

### Step 3: Test, Check, and Confirm

**Test 1: Certificate Created**

```
kv-day40-demo → Certificates
  ✅ app-ssl-cert exists
  ✅ Subject: CN=app.example.com
  ✅ Status: Enabled
  ✅ Auto-renew: 30 days before expiry
```

**✅ Result**: Certificate management working!

---

## Lab 8: Key Vault in Azure DevOps Pipeline

### What We'll Do

```
Use Key Vault secrets in an Azure DevOps pipeline.
Pipeline reads secrets from Key Vault at runtime.
No secrets stored in pipeline variables!
```

### Step 1: Create Service Connection

```
1. Azure DevOps → Project Settings → Service connections
2. "+ New service connection" → "Azure Resource Manager"
3. Select: Service principal (automatic)
4. Scope: Subscription
5. Name: azure-connection
6. Grant access to all pipelines: ✅
7. Click "Save"
```

### Step 2: Grant Pipeline Access to Key Vault

```
1. Go to kv-day40-demo → Access control (IAM)
2. "+ Add" → "Add role assignment"
3. Role: Key Vault Secrets User
4. Members: Select the service principal created by Azure DevOps
   (Search for your project name or service connection name)
5. Click "Review + assign"
```

### Step 3: Pipeline YAML

```yaml
trigger:
  - main

pool:
  vmImage: 'ubuntu-latest'

steps:
# Step 1: Read secrets from Key Vault
- task: AzureKeyVault@2
  inputs:
    azureSubscription: 'azure-connection'
    KeyVaultName: 'kv-day40-demo'
    SecretsFilter: 'db-password,api-key-stripe'
    RunAsPreJob: true
  displayName: 'Get secrets from Key Vault'

# Step 2: Use secrets (they become pipeline variables)
- script: |
    echo "Database password length: ${#DB_PASSWORD}"
    echo "API key starts with: $(echo $API_KEY_STRIPE | cut -c1-4)****"
    echo "✅ Secrets loaded from Key Vault!"
    
    # In real pipeline, use these for deployment:
    # docker run -e DB_PASSWORD=$(db-password) myapp
  displayName: 'Use secrets in pipeline'
  env:
    DB_PASSWORD: $(db-password)
    API_KEY_STRIPE: $(api-key-stripe)
```

```
How it works:
  1. AzureKeyVault@2 task reads secrets from Key Vault
  2. Secrets become pipeline variables: $(db-password)
  3. Variables are MASKED in logs (shown as ***)
  4. Use them in subsequent steps

✅ No secrets in pipeline YAML!
✅ No secrets in variable groups!
✅ Secrets come from Key Vault at runtime!
```

### Step 4: Test, Check, and Confirm

**Test 1: Pipeline Reads Secrets**

```
Run pipeline:
  ✅ AzureKeyVault task: Succeeded
  ✅ Secrets loaded as variables
  ✅ Values masked in logs (shown as ***)
```

**✅ Result**: Key Vault in pipeline working!

---