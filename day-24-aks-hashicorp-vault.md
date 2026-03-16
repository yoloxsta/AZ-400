# Day 24: Bonus Lab - AKS with HashiCorp Vault

## What You'll Learn

Deploy a real-world application on AKS that fetches secrets from HashiCorp Vault:
- ✅ What is HashiCorp Vault and why use it
- ✅ Install Vault on AKS with Helm
- ✅ Store secrets in Vault (DB passwords, API keys)
- ✅ Deploy app that reads secrets from Vault
- ✅ Vault Agent Injector (auto-inject secrets into pods)
- ✅ Complete test, check, and confirm
- ✅ Real-world production patterns

## Table of Contents

1. [What is HashiCorp Vault?](#what-is-hashicorp-vault)
2. [Why Use Vault?](#why-use-vault)
3. [Architecture](#architecture)
4. [Lab 1: Create AKS Cluster](#lab-1-create-aks-cluster)
5. [Lab 2: Install Vault on AKS](#lab-2-install-vault-on-aks)
6. [Lab 3: Store Secrets in Vault](#lab-3-store-secrets-in-vault)
7. [Lab 4: Deploy Application with Vault Secrets](#lab-4-deploy-application-with-vault-secrets)
8. [Lab 5: Testing and Verification](#lab-5-testing-and-verification)
9. [Troubleshooting](#troubleshooting)
10. [Cleanup](#cleanup)

---

## What is HashiCorp Vault?

**HashiCorp Vault** = A tool for securely storing and accessing secrets.

**Secrets** = Anything you want to control access to:
- Database passwords
- API keys
- Certificates
- Encryption keys
- Cloud credentials

### The Problem

```
❌ BAD: Secrets in code or environment variables

# In your code (TERRIBLE)
DB_PASSWORD = "super_secret_123"

# In Kubernetes YAML (BAD - base64 is NOT encryption)
apiVersion: v1
kind: Secret
data:
  password: c3VwZXJfc2VjcmV0XzEyMw==    ← Just base64 encoded!
                                            Anyone can decode this!

# Decode: echo "c3VwZXJfc2VjcmV0XzEyMw==" | base64 -d
# Output: super_secret_123
# 😱 Not secure at all!
```

### The Solution

```
✅ GOOD: Secrets in Vault

┌─────────────────────────────────────────────────────────────────┐
│  HashiCorp Vault                                                 │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Encrypted Storage                                         │  │
│  │                                                             │  │
│  │  secret/myapp/database                                     │  │
│  │  ├─ username: "dbadmin"          ← Encrypted at rest       │  │
│  │  ├─ password: "P@ssw0rd2026!"    ← Encrypted at rest       │  │
│  │  └─ host: "mydb.database.azure.com"                        │  │
│  │                                                             │  │
│  │  secret/myapp/api-keys                                     │  │
│  │  ├─ stripe_key: "sk_live_..."    ← Encrypted at rest       │  │
│  │  └─ sendgrid_key: "SG...."       ← Encrypted at rest       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Features:                                                       │
│  ✅ Encrypted at rest AND in transit                            │
│  ✅ Access control (who can read what)                          │
│  ✅ Audit logging (who accessed what, when)                     │
│  ✅ Secret rotation (auto-change passwords)                     │
│  ✅ Dynamic secrets (generate on-demand)                        │
│  ✅ Lease & expiration (secrets auto-expire)                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Why Use Vault?

### Kubernetes Secrets vs Vault

```
┌─────────────────────────────┬─────────────────────────────────┐
│  Kubernetes Secrets          │  HashiCorp Vault                │
├─────────────────────────────┼─────────────────────────────────┤
│  Base64 encoded (NOT        │  AES-256 encrypted              │
│  encrypted!)                │  (real encryption)              │
│                             │                                 │
│  Stored in etcd             │  Encrypted backend storage      │
│  (may be unencrypted)       │  (always encrypted)             │
│                             │                                 │
│  No audit log               │  Full audit logging             │
│  (who read what?)           │  (every access logged)          │
│                             │                                 │
│  No rotation                │  Auto-rotation                  │
│  (manual update)            │  (change passwords on schedule) │
│                             │                                 │
│  No dynamic secrets         │  Dynamic secrets                │
│  (static values)            │  (generate DB creds on-demand)  │
│                             │                                 │
│  No lease/expiration        │  Lease & TTL                    │
│  (secrets live forever)     │  (secrets auto-expire)          │
│                             │                                 │
│  RBAC only                  │  Fine-grained policies          │
│  (namespace level)          │  (path-level access control)    │
│                             │                                 │
│  Free                       │  Free (open source)             │
│  (built into K8s)           │  or Enterprise (paid)           │
└─────────────────────────────┴─────────────────────────────────┘
```

### Real-World Use Cases

```
1. Database Credentials:
   App → Vault → Get DB password → Connect to database
   Vault rotates password every 24 hours automatically

2. API Keys:
   App → Vault → Get Stripe API key → Process payment
   Different keys for dev/staging/production

3. TLS Certificates:
   App → Vault → Get SSL certificate → Serve HTTPS
   Vault auto-renews before expiry

4. Cloud Credentials:
   CI/CD → Vault → Get Azure credentials → Deploy to Azure
   Short-lived tokens (expire in 1 hour)
```

---

## Architecture

### What We'll Build

```
┌─────────────────────────────────────────────────────────────────┐
│                         AKS CLUSTER                              │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  vault namespace                                           │  │
│  │                                                             │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  Vault Server Pod                                    │  │  │
│  │  │  ┌─────────────────────────────────────────────┐    │  │  │
│  │  │  │  HashiCorp Vault                             │    │  │  │
│  │  │  │                                               │    │  │  │
│  │  │  │  Secrets:                                     │    │  │  │
│  │  │  │  ├─ secret/myapp/config                      │    │  │  │
│  │  │  │  │  ├─ db_host                               │    │  │  │
│  │  │  │  │  ├─ db_user                               │    │  │  │
│  │  │  │  │  └─ db_password                           │    │  │  │
│  │  │  │  └─ secret/myapp/api-keys                    │    │  │  │
│  │  │  │     ├─ api_key                               │    │  │  │
│  │  │  │     └─ api_secret                            │    │  │  │
│  │  │  └─────────────────────────────────────────────┘    │  │  │
│  │  │                                                       │  │  │
│  │  │  Vault Agent Injector Pod                            │  │  │
│  │  │  (Watches for pods that need secrets)                │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  myapp namespace                                           │  │
│  │                                                             │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  Application Pod                                     │  │  │
│  │  │  ┌───────────────┐  ┌───────────────────────────┐  │  │  │
│  │  │  │ Vault Agent   │  │ App Container              │  │  │  │
│  │  │  │ (sidecar)     │  │                            │  │  │  │
│  │  │  │               │  │ Reads secrets from:        │  │  │  │
│  │  │  │ Fetches       │→ │ /vault/secrets/config      │  │  │  │
│  │  │  │ secrets from  │  │                            │  │  │  │
│  │  │  │ Vault server  │  │ App never talks to Vault   │  │  │  │
│  │  │  │               │  │ directly!                  │  │  │  │
│  │  │  └───────────────┘  └───────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### How Vault Agent Injector Works

```
Step 1: App pod is created with special annotations
┌──────────────────────────────────────────────────────────────┐
│  Pod YAML:                                                    │
│  annotations:                                                │
│    vault.hashicorp.com/agent-inject: "true"                  │
│    vault.hashicorp.com/role: "myapp"                         │
│    vault.hashicorp.com/agent-inject-secret-config:           │
│      "secret/data/myapp/config"                              │
└──────────────────────────────────────────────────────────────┘
                              ↓

Step 2: Vault Agent Injector sees the annotations
┌──────────────────────────────────────────────────────────────┐
│  Injector: "This pod needs secrets! Let me add a sidecar"   │
└──────────────────────────────────────────────────────────────┘
                              ↓

Step 3: Injector adds Vault Agent sidecar to the pod
┌──────────────────────────────────────────────────────────────┐
│  Pod now has 2 containers:                                    │
│  1. vault-agent (sidecar) - fetches secrets                  │
│  2. app (your application) - reads secrets from file         │
└──────────────────────────────────────────────────────────────┘
                              ↓

Step 4: Vault Agent authenticates with Vault server
┌──────────────────────────────────────────────────────────────┐
│  Agent → Vault: "I'm pod in 'myapp' namespace, role 'myapp'"│
│  Vault → Agent: "OK, here's a token"                        │
└──────────────────────────────────────────────────────────────┘
                              ↓

Step 5: Vault Agent fetches secrets and writes to shared volume
┌──────────────────────────────────────────────────────────────┐
│  Agent writes to: /vault/secrets/config                      │
│  Content:                                                    │
│  db_host=mydb.database.azure.com                            │
│  db_user=dbadmin                                            │
│  db_password=P@ssw0rd2026!                                  │
└──────────────────────────────────────────────────────────────┘
                              ↓

Step 6: App reads secrets from file
┌──────────────────────────────────────────────────────────────┐
│  App reads: /vault/secrets/config                            │
│  App connects to database using the credentials              │
│  App NEVER talks to Vault directly!                          │
└──────────────────────────────────────────────────────────────┘
```

---

## Lab 1: Create AKS Cluster

### Step 1: Create Resource Group and AKS

```bash
# Create resource group
az group create --name rg-day24-vault --location eastus

# Create AKS cluster
az aks create \
  --resource-group rg-day24-vault \
  --name aks-day24-vault \
  --node-count 2 \
  --node-vm-size Standard_B2s \
  --generate-ssh-keys \
  --enable-managed-identity
```

**⏱️ Wait**: 5-10 minutes

### Step 2: Connect to AKS

```bash
# Get credentials
az aks get-credentials --resource-group rg-day24-vault --name aks-day24-vault

# Verify
kubectl get nodes
```

**Expected Output:**
```
NAME                                STATUS   ROLES   AGE   VERSION
aks-nodepool1-12345678-vmss000000   Ready    agent   5m    v1.28.x
aks-nodepool1-12345678-vmss000001   Ready    agent   5m    v1.28.x
```


### Step 3: Test, Check, and Confirm - AKS

**Test 1: Verify Nodes**

```bash
kubectl get nodes -o wide
```

**Expected Result:**
```
✅ 2 nodes in Ready state
✅ Kubernetes version: 1.28.x
✅ OS: Ubuntu
```

**Test 2: Verify System Pods**

```bash
kubectl get pods -n kube-system
```

**Expected Result:**
```
✅ coredns pods running
✅ metrics-server running
✅ All system pods healthy
```

**✅ Result**: AKS cluster ready!

---

## Lab 2: Install Vault on AKS

### Step 1: Add HashiCorp Helm Repository

```bash
# Add Helm repo
helm repo add hashicorp https://helm.releases.hashicorp.com

# Update repos
helm repo update
```

**Expected Output:**
```
"hashicorp" has been added to your repositories
...Successfully got an update from the "hashicorp" chart repository
```

### Step 2: Install Vault with Helm

```bash
# Create namespace
kubectl create namespace vault

# Install Vault in dev mode (for lab - NOT for production)
helm install vault hashicorp/vault \
  --namespace vault \
  --set "server.dev.enabled=true" \
  --set "injector.enabled=true" \
  --set "server.dev.devRootToken=root"
```

**⏱️ Wait**: 2-3 minutes

**Expected Output:**
```
NAME: vault
LAST DEPLOYED: ...
NAMESPACE: vault
STATUS: deployed
```

**Note:** Dev mode means:
- Vault is automatically unsealed
- Root token is "root"
- Data stored in memory (lost on restart)
- For lab/learning only, NOT production

### Step 3: Verify Vault Installation

```bash
# Check pods
kubectl get pods -n vault
```

**Expected Output:**
```
NAME                                    READY   STATUS    RESTARTS   AGE
vault-0                                 1/1     Running   0          2m
vault-agent-injector-abc123-xxxxx       1/1     Running   0          2m
```

**Two pods:**
- `vault-0` = Vault server (stores secrets)
- `vault-agent-injector` = Watches for pods that need secrets

### Step 4: Test, Check, and Confirm - Vault Installation

**Test 1: Verify Vault Pod**

```bash
kubectl get pods -n vault -l app.kubernetes.io/name=vault
```

**Expected Result:**
```
NAME      READY   STATUS    RESTARTS   AGE
vault-0   1/1     Running   0          3m
✅ Vault server running
```

**Test 2: Verify Vault Agent Injector**

```bash
kubectl get pods -n vault -l app.kubernetes.io/name=vault-agent-injector
```

**Expected Result:**
```
NAME                                    READY   STATUS    RESTARTS   AGE
vault-agent-injector-abc123-xxxxx       1/1     Running   0          3m
✅ Injector running
```

**Test 3: Check Vault Status**

```bash
kubectl exec -n vault vault-0 -- vault status
```

**Expected Output:**
```
Key             Value
---             -----
Seal Type       shamir
Initialized     true
Sealed          false
...
```

**✅ Vault is initialized and unsealed!**

**Test 4: Check Vault Service**

```bash
kubectl get svc -n vault
```

**Expected Output:**
```
NAME                       TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)
vault                      ClusterIP   10.0.xxx.xxx   <none>        8200/TCP,8201/TCP
vault-agent-injector-svc   ClusterIP   10.0.xxx.xxx   <none>        443/TCP
vault-internal             ClusterIP   None           <none>        8200/TCP,8201/TCP
```

**✅ Vault services running!**

**Test 5: Test Vault Login**

```bash
kubectl exec -n vault vault-0 -- vault login root
```

**Expected Output:**
```
Success! You are now authenticated.
Token: root
...
```

**✅ Vault authentication working!**

---

## Lab 3: Store Secrets in Vault

### Step 1: Enable KV Secrets Engine

```bash
# KV v2 is already enabled at secret/ in dev mode
# Verify:
kubectl exec -n vault vault-0 -- vault secrets list
```

**Expected Output:**
```
Path          Type         Description
----          ----         -----------
cubbyhole/    cubbyhole    per-token private secret storage
identity/     identity     identity store
secret/       kv           key/value secret storage
sys/          system       system endpoints
```

**✅ `secret/` path is available (KV v2)!**

### Step 2: Store Application Secrets

```bash
# Store database credentials
kubectl exec -n vault vault-0 -- vault kv put \
  secret/myapp/config \
  db_host="mydb.database.azure.com" \
  db_port="5432" \
  db_name="appdb" \
  db_user="dbadmin" \
  db_password="P@ssw0rd2026!"

# Store API keys
kubectl exec -n vault vault-0 -- vault kv put \
  secret/myapp/api-keys \
  api_key="sk_live_abc123def456" \
  api_secret="whsec_xyz789" \
  environment="production"
```

**Expected Output:**
```
===== Secret Path =====
secret/data/myapp/config

====== Metadata ======
Key                Value
---                -----
created_time       2026-03-14T10:00:00.000000Z
version            1
```

**✅ Secrets stored!**

### Step 3: Verify Secrets

```bash
# Read database config
kubectl exec -n vault vault-0 -- vault kv get secret/myapp/config

# Read API keys
kubectl exec -n vault vault-0 -- vault kv get secret/myapp/api-keys
```

**Expected Output:**
```
===== Secret Path =====
secret/data/myapp/config

====== Data ======
Key            Value
---            -----
db_host        mydb.database.azure.com
db_name        appdb
db_password    P@ssw0rd2026!
db_port        5432
db_user        dbadmin
```

**✅ Secrets readable!**

### Step 4: Configure Kubernetes Authentication

This allows pods to authenticate with Vault using their Kubernetes service account.

```bash
# Enable Kubernetes auth method
kubectl exec -n vault vault-0 -- vault auth enable kubernetes

# Configure Kubernetes auth
kubectl exec -n vault vault-0 -- vault write \
  auth/kubernetes/config \
  kubernetes_host="https://$KUBERNETES_PORT_443_TCP_ADDR:443"
```

**Expected Output:**
```
Success! Enabled kubernetes auth method at: kubernetes/
Success! Data written to: auth/kubernetes/config
```

### Step 5: Create Vault Policy

A policy defines what secrets a role can access.

```bash
# Create policy that allows reading myapp secrets
kubectl exec -n vault vault-0 -- /bin/sh -c 'vault policy write myapp-policy - <<EOF
path "secret/data/myapp/config" {
  capabilities = ["read"]
}
path "secret/data/myapp/api-keys" {
  capabilities = ["read"]
}
EOF'
```

**Expected Output:**
```
Success! Uploaded policy: myapp-policy
```

### Step 6: Create Vault Role

A role binds a Kubernetes service account to a Vault policy.

```bash
# Create role for myapp
kubectl exec -n vault vault-0 -- vault write \
  auth/kubernetes/role/myapp \
  bound_service_account_names=myapp-sa \
  bound_service_account_namespaces=myapp \
  policies=myapp-policy \
  ttl=24h
```

**Expected Output:**
```
Success! Data written to: auth/kubernetes/role/myapp
```

**What this means:**

```
┌──────────────────────────────────────────────────────────────┐
│  VAULT ROLE: myapp                                            │
│                                                               │
│  Who can use this role?                                      │
│  ├─ Service Account: myapp-sa                                │
│  └─ Namespace: myapp                                         │
│                                                               │
│  What can they access?                                       │
│  └─ Policy: myapp-policy                                     │
│      ├─ READ secret/data/myapp/config                        │
│      └─ READ secret/data/myapp/api-keys                      │
│                                                               │
│  How long?                                                   │
│  └─ Token TTL: 24 hours (auto-expires)                       │
└──────────────────────────────────────────────────────────────┘
```

### Step 7: Test, Check, and Confirm - Secrets

**Test 1: Verify Secrets Stored**

```bash
kubectl exec -n vault vault-0 -- vault kv get -format=json secret/myapp/config | jq '.data.data'
```

**Expected Result:**
```json
{
  "db_host": "mydb.database.azure.com",
  "db_name": "appdb",
  "db_password": "P@ssw0rd2026!",
  "db_port": "5432",
  "db_user": "dbadmin"
}
✅ All secrets present
```

**Test 2: Verify Policy**

```bash
kubectl exec -n vault vault-0 -- vault policy read myapp-policy
```

**Expected Result:**
```
path "secret/data/myapp/config" {
  capabilities = ["read"]
}
path "secret/data/myapp/api-keys" {
  capabilities = ["read"]
}
✅ Policy correct
```

**Test 3: Verify Role**

```bash
kubectl exec -n vault vault-0 -- vault read auth/kubernetes/role/myapp
```

**Expected Result:**
```
Key                                 Value
---                                 -----
bound_service_account_names         [myapp-sa]
bound_service_account_namespaces    [myapp]
policies                            [myapp-policy]
token_ttl                           24h
✅ Role configured correctly
```

**Test 4: Verify Auth Method**

```bash
kubectl exec -n vault vault-0 -- vault auth list
```

**Expected Result:**
```
Path           Type          Description
----           ----          -----------
kubernetes/    kubernetes    n/a
token/         token         token based credentials
✅ Kubernetes auth enabled
```

**✅ Result**: Vault secrets and authentication configured!

---


## Lab 4: Deploy Application with Vault Secrets

### Step 1: Create Application Namespace and Service Account

```bash
# Create namespace
kubectl create namespace myapp

# Create service account
kubectl create serviceaccount myapp-sa -n myapp
```

**Expected Output:**
```
namespace/myapp created
serviceaccount/myapp-sa created
```

### Step 2: Create Application Code

Create a simple Python app that reads secrets from the file Vault Agent writes.

Create file: `vault-app.py`

```python
from flask import Flask, jsonify
import os
import socket

app = Flask(__name__)

def read_vault_secret(path):
    """Read secret from Vault Agent injected file"""
    try:
        with open(path, 'r') as f:
            content = f.read().strip()
        # Parse key=value pairs
        secrets = {}
        for line in content.split('\n'):
            if '=' in line:
                key, value = line.split('=', 1)
                secrets[key.strip()] = value.strip()
        return secrets
    except FileNotFoundError:
        return {"error": f"Secret file not found: {path}"}
    except Exception as e:
        return {"error": str(e)}

@app.route('/')
def home():
    return jsonify({
        'message': 'Day 24 - Vault Demo App',
        'hostname': socket.gethostname(),
        'endpoints': {
            'health': '/health',
            'secrets_status': '/secrets/status',
            'db_config': '/secrets/db-config',
            'api_keys': '/secrets/api-keys'
        }
    })

@app.route('/health')
def health():
    return jsonify({'status': 'healthy', 'hostname': socket.gethostname()})

@app.route('/secrets/status')
def secrets_status():
    """Check if secrets are available"""
    config_exists = os.path.exists('/vault/secrets/config')
    apikeys_exists = os.path.exists('/vault/secrets/api-keys')
    return jsonify({
        'vault_secrets_injected': config_exists and apikeys_exists,
        'config_file': config_exists,
        'api_keys_file': apikeys_exists,
        'hostname': socket.gethostname()
    })

@app.route('/secrets/db-config')
def db_config():
    """Show database config (mask password)"""
    secrets = read_vault_secret('/vault/secrets/config')
    if 'db_password' in secrets:
        secrets['db_password'] = '****MASKED****'
    return jsonify({
        'source': 'HashiCorp Vault',
        'path': 'secret/myapp/config',
        'data': secrets,
        'hostname': socket.gethostname()
    })

@app.route('/secrets/api-keys')
def api_keys():
    """Show API keys (masked)"""
    secrets = read_vault_secret('/vault/secrets/api-keys')
    for key in secrets:
        if 'key' in key.lower() or 'secret' in key.lower():
            secrets[key] = secrets[key][:8] + '****MASKED****'
    return jsonify({
        'source': 'HashiCorp Vault',
        'path': 'secret/myapp/api-keys',
        'data': secrets,
        'hostname': socket.gethostname()
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

### Step 3: Create Dockerfile

Create file: `Dockerfile`

```dockerfile
FROM python:3.11-slim
WORKDIR /app
RUN pip install --no-cache-dir flask gunicorn
COPY vault-app.py app.py
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser
EXPOSE 5000
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "app:app"]
```

### Step 4: Build and Push Image

**Option A: Use Azure Container Registry**

```bash
# Create ACR (if not exists)
az acr create --resource-group rg-day24-vault --name acrday24vault --sku Basic

# Build and push
az acr build --registry acrday24vault --image vault-demo-app:1.0.0 .

# Attach ACR to AKS
az aks update --resource-group rg-day24-vault --name aks-day24-vault --attach-acr acrday24vault
```

**Option B: Use a simple nginx image for testing (no build needed)**

For simplicity, we'll use a pre-built Python image and ConfigMap for the app code.

```bash
# Create ConfigMap with app code
kubectl create configmap vault-app-code \
  --from-file=app.py=vault-app.py \
  -n myapp
```

### Step 5: Create Deployment with Vault Annotations

Create file: `vault-app-deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vault-demo-app
  namespace: myapp
  labels:
    app: vault-demo-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: vault-demo-app
  template:
    metadata:
      labels:
        app: vault-demo-app
      annotations:
        # ═══════════════════════════════════════════════════════
        # VAULT ANNOTATIONS - This is where the magic happens!
        # ═══════════════════════════════════════════════════════

        # Enable Vault Agent injection
        vault.hashicorp.com/agent-inject: "true"

        # Vault role to use for authentication
        vault.hashicorp.com/role: "myapp"

        # Secret 1: Database config
        # "config" = filename at /vault/secrets/config
        vault.hashicorp.com/agent-inject-secret-config: "secret/data/myapp/config"

        # Template for config file (key=value format)
        vault.hashicorp.com/agent-inject-template-config: |
          {{- with secret "secret/data/myapp/config" -}}
          db_host={{ .Data.data.db_host }}
          db_port={{ .Data.data.db_port }}
          db_name={{ .Data.data.db_name }}
          db_user={{ .Data.data.db_user }}
          db_password={{ .Data.data.db_password }}
          {{- end }}

        # Secret 2: API keys
        # "api-keys" = filename at /vault/secrets/api-keys
        vault.hashicorp.com/agent-inject-secret-api-keys: "secret/data/myapp/api-keys"

        # Template for api-keys file
        vault.hashicorp.com/agent-inject-template-api-keys: |
          {{- with secret "secret/data/myapp/api-keys" -}}
          api_key={{ .Data.data.api_key }}
          api_secret={{ .Data.data.api_secret }}
          environment={{ .Data.data.environment }}
          {{- end }}
    spec:
      serviceAccountName: myapp-sa
      containers:
      - name: app
        image: python:3.11-slim
        command: ["/bin/sh", "-c"]
        args:
          - |
            pip install flask gunicorn -q &&
            cp /app-code/app.py /tmp/app.py &&
            cd /tmp &&
            gunicorn --bind 0.0.0.0:5000 --workers 2 app:app
        ports:
        - containerPort: 5000
        volumeMounts:
        - name: app-code
          mountPath: /app-code
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        readinessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
      volumes:
      - name: app-code
        configMap:
          name: vault-app-code
---
apiVersion: v1
kind: Service
metadata:
  name: vault-demo-app
  namespace: myapp
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 5000
  selector:
    app: vault-demo-app
```

### Step 6: Understanding the Annotations

```
┌─────────────────────────────────────────────────────────────────┐
│  VAULT ANNOTATIONS EXPLAINED                                     │
│                                                                  │
│  vault.hashicorp.com/agent-inject: "true"                       │
│  └─ "Hey Vault Injector, this pod needs secrets!"               │
│                                                                  │
│  vault.hashicorp.com/role: "myapp"                              │
│  └─ "Use the 'myapp' role to authenticate with Vault"           │
│     (This role allows reading secret/myapp/*)                   │
│                                                                  │
│  vault.hashicorp.com/agent-inject-secret-config:                │
│    "secret/data/myapp/config"                                   │
│  └─ "Fetch this secret and write to /vault/secrets/config"      │
│     ├─ "config" = filename                                      │
│     └─ "secret/data/myapp/config" = Vault path                  │
│                                                                  │
│  vault.hashicorp.com/agent-inject-template-config: |            │
│    {{- with secret "secret/data/myapp/config" -}}               │
│    db_host={{ .Data.data.db_host }}                              │
│    ...                                                           │
│    {{- end }}                                                    │
│  └─ "Format the secret file like this"                          │
│     (Go template syntax)                                        │
│                                                                  │
│  RESULT:                                                         │
│  File /vault/secrets/config contains:                           │
│  db_host=mydb.database.azure.com                                │
│  db_port=5432                                                   │
│  db_name=appdb                                                  │
│  db_user=dbadmin                                                │
│  db_password=P@ssw0rd2026!                                      │
└─────────────────────────────────────────────────────────────────┘
```

### Step 7: Deploy Application

```bash
kubectl apply -f vault-app-deployment.yaml
```

**Expected Output:**
```
deployment.apps/vault-demo-app created
service/vault-demo-app created
```

### Step 8: Wait for Pods to Start

```bash
# Watch pods (Ctrl+C when all Running)
kubectl get pods -n myapp --watch
```

**Expected Output:**
```
NAME                              READY   STATUS    RESTARTS   AGE
vault-demo-app-abc123-xxxxx       2/2     Running   0          2m
vault-demo-app-abc123-yyyyy       2/2     Running   0          2m
```

**Note:** `2/2` means 2 containers per pod:
1. `vault-agent` (sidecar - injected by Vault)
2. `app` (your application)

### Step 9: Get External IP

```bash
kubectl get svc -n myapp
```

**Expected Output:**
```
NAME             TYPE           CLUSTER-IP    EXTERNAL-IP    PORT(S)
vault-demo-app   LoadBalancer   10.0.xxx.xx   20.xxx.xx.xx   80:30xxx/TCP
```

**⏱️ Wait**: 2-5 minutes for Azure to assign public IP

```bash
export APP_IP=$(kubectl get svc vault-demo-app -n myapp -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
echo "App IP: $APP_IP"
```

### Step 10: Test, Check, and Confirm - Deployment

**Test 1: Verify Pods Running**

```bash
kubectl get pods -n myapp -o wide
```

**Expected Result:**
```
NAME                              READY   STATUS    RESTARTS   AGE
vault-demo-app-abc123-xxxxx       2/2     Running   0          3m
vault-demo-app-abc123-yyyyy       2/2     Running   0          3m
✅ 2 pods running with 2/2 containers each
```

**Test 2: Verify Vault Agent Sidecar**

```bash
kubectl describe pod -n myapp -l app=vault-demo-app | grep "Container ID" -A 2
```

**Expected Result:**
```
Containers:
  vault-agent:
    Container ID: ...
  vault-agent-init:
    Container ID: ...
  app:
    Container ID: ...
✅ Vault agent containers present
```

**Test 3: Verify Secret Files Exist in Pod**

```bash
# Get pod name
POD=$(kubectl get pods -n myapp -l app=vault-demo-app -o jsonpath='{.items[0].metadata.name}')

# Check secret files
kubectl exec -n myapp $POD -c app -- ls -la /vault/secrets/
```

**Expected Output:**
```
-rw-r--r-- 1 vault vault  config
-rw-r--r-- 1 vault vault  api-keys
✅ Secret files injected by Vault Agent!
```

**Test 4: Read Secret File Content**

```bash
kubectl exec -n myapp $POD -c app -- cat /vault/secrets/config
```

**Expected Output:**
```
db_host=mydb.database.azure.com
db_port=5432
db_name=appdb
db_user=dbadmin
db_password=P@ssw0rd2026!
✅ Secrets from Vault are in the file!
```

**Test 5: Read API Keys File**

```bash
kubectl exec -n myapp $POD -c app -- cat /vault/secrets/api-keys
```

**Expected Output:**
```
api_key=sk_live_abc123def456
api_secret=whsec_xyz789
environment=production
✅ API keys from Vault!
```

**✅ Result**: Application deployed with Vault secrets!

---

## Lab 5: Testing and Verification

### Get Application IP

```bash
export APP_IP=$(kubectl get svc vault-demo-app -n myapp -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
echo "App URL: http://$APP_IP"
```

### Test 1: Home Endpoint

```bash
curl http://$APP_IP/
```

**Expected Response:**
```json
{
  "message": "Day 24 - Vault Demo App",
  "hostname": "vault-demo-app-abc123-xxxxx",
  "endpoints": {
    "health": "/health",
    "secrets_status": "/secrets/status",
    "db_config": "/secrets/db-config",
    "api_keys": "/secrets/api-keys"
  }
}
```

**✅ App is running!**

### Test 2: Health Check

```bash
curl http://$APP_IP/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "hostname": "vault-demo-app-abc123-xxxxx"
}
```

**✅ Health check passing!**

### Test 3: Secrets Status

```bash
curl http://$APP_IP/secrets/status
```

**Expected Response:**
```json
{
  "vault_secrets_injected": true,
  "config_file": true,
  "api_keys_file": true,
  "hostname": "vault-demo-app-abc123-xxxxx"
}
```

**✅ Vault secrets are injected into the pod!**

### Test 4: Database Config (Masked)

```bash
curl http://$APP_IP/secrets/db-config
```

**Expected Response:**
```json
{
  "source": "HashiCorp Vault",
  "path": "secret/myapp/config",
  "data": {
    "db_host": "mydb.database.azure.com",
    "db_port": "5432",
    "db_name": "appdb",
    "db_user": "dbadmin",
    "db_password": "****MASKED****"
  },
  "hostname": "vault-demo-app-abc123-xxxxx"
}
```

**✅ Database config from Vault! Password is masked in API response!**

### Test 5: API Keys (Masked)

```bash
curl http://$APP_IP/secrets/api-keys
```

**Expected Response:**
```json
{
  "source": "HashiCorp Vault",
  "path": "secret/myapp/api-keys",
  "data": {
    "api_key": "sk_live_a****MASKED****",
    "api_secret": "whsec_xy****MASKED****",
    "environment": "production"
  },
  "hostname": "vault-demo-app-abc123-xxxxx"
}
```

**✅ API keys from Vault! Sensitive values masked!**

### Test 6: Load Balancing

```bash
echo "Testing load balancing..."
for i in {1..6}; do
  echo "Request $i:"
  curl -s http://$APP_IP/health | jq -r '.hostname'
done
```

**Expected Output:**
```
Request 1: vault-demo-app-abc123-xxxxx
Request 2: vault-demo-app-abc123-yyyyy
Request 3: vault-demo-app-abc123-xxxxx
Request 4: vault-demo-app-abc123-yyyyy
...
✅ Requests distributed across pods
✅ Both pods have Vault secrets
```


### Test 7: Update Secret in Vault

```bash
# Update password in Vault
kubectl exec -n vault vault-0 -- vault kv put \
  secret/myapp/config \
  db_host="mydb.database.azure.com" \
  db_port="5432" \
  db_name="appdb" \
  db_user="dbadmin" \
  db_password="NewP@ssw0rd2026!"
```

Wait 30 seconds (Vault Agent refreshes periodically), then:

```bash
# Check if pod has new secret
POD=$(kubectl get pods -n myapp -l app=vault-demo-app -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n myapp $POD -c app -- cat /vault/secrets/config
```

**Expected Output:**
```
db_host=mydb.database.azure.com
db_port=5432
db_name=appdb
db_user=dbadmin
db_password=NewP@ssw0rd2026!
✅ Secret updated automatically! No pod restart needed!
```

### Test 8: Verify Secret Isolation

```bash
# Try to access secrets from a pod WITHOUT Vault annotations
kubectl run test-pod --image=busybox -n myapp --rm -it --restart=Never -- ls /vault/secrets/
```

**Expected Output:**
```
ls: /vault/secrets/: No such file or directory
✅ Pods without Vault annotations cannot access secrets!
```

### Test 9: Verify Vault Audit

```bash
kubectl exec -n vault vault-0 -- vault kv get -format=json secret/myapp/config | jq '.data.metadata'
```

**Expected Result:**
```json
{
  "created_time": "2026-03-14T10:00:00.000000Z",
  "custom_metadata": null,
  "deletion_time": "",
  "destroyed": false,
  "version": 2
}
✅ Version tracking (was 1, now 2 after update)
```

### Test 10: Pod Restart Test

```bash
# Delete a pod
kubectl delete pod -n myapp -l app=vault-demo-app --field-selector=status.phase=Running | head -1

# Wait for new pod
kubectl get pods -n myapp --watch

# Test new pod has secrets
curl http://$APP_IP/secrets/status
```

**Expected Result:**
```json
{
  "vault_secrets_injected": true,
  "config_file": true,
  "api_keys_file": true
}
✅ New pod automatically gets secrets from Vault!
```

### Complete Verification Checklist

```
Infrastructure:
✅ AKS cluster running with 2 nodes
✅ Vault server running in vault namespace
✅ Vault Agent Injector running

Vault Configuration:
✅ KV secrets engine enabled
✅ Secrets stored (db config + api keys)
✅ Kubernetes auth enabled
✅ Policy created (myapp-policy)
✅ Role created (myapp → myapp-sa → myapp-policy)

Application:
✅ 2 pods running with 2/2 containers (app + vault-agent)
✅ Secret files exist at /vault/secrets/
✅ App reads secrets from files
✅ Secrets masked in API responses
✅ Load balancing working

Security:
✅ Secrets encrypted in Vault
✅ Pods authenticate via service account
✅ Policy restricts access to specific paths
✅ Secrets auto-refresh on update
✅ Pods without annotations cannot access secrets
```

---

## How It All Connects

```
┌─────────────────────────────────────────────────────────────────┐
│  THE COMPLETE FLOW                                               │
│                                                                  │
│  1. You store secrets in Vault                                  │
│     kubectl exec vault-0 -- vault kv put secret/myapp/config ...│
│                              ↓                                   │
│  2. You create a Vault policy                                   │
│     "myapp-policy can READ secret/myapp/*"                      │
│                              ↓                                   │
│  3. You create a Vault role                                     │
│     "myapp role = myapp-sa service account + myapp-policy"      │
│                              ↓                                   │
│  4. You deploy app with Vault annotations                       │
│     vault.hashicorp.com/agent-inject: "true"                    │
│     vault.hashicorp.com/role: "myapp"                           │
│                              ↓                                   │
│  5. Vault Injector sees annotations                             │
│     "This pod needs secrets! Adding sidecar..."                 │
│                              ↓                                   │
│  6. Vault Agent sidecar authenticates with Vault                │
│     "I'm myapp-sa in myapp namespace, role myapp"               │
│     Vault: "OK, here's a token with myapp-policy"              │
│                              ↓                                   │
│  7. Vault Agent fetches secrets                                 │
│     GET secret/data/myapp/config → writes /vault/secrets/config │
│     GET secret/data/myapp/api-keys → writes /vault/secrets/api-keys│
│                              ↓                                   │
│  8. App reads secrets from files                                │
│     open('/vault/secrets/config') → db_password=P@ssw0rd2026!   │
│                              ↓                                   │
│  9. App uses secrets                                            │
│     Connect to database, call APIs, etc.                        │
│                              ↓                                   │
│  10. Vault Agent keeps secrets fresh                            │
│      Periodically re-fetches (if secret changes in Vault,      │
│      file is updated automatically)                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Troubleshooting

### Issue 1: Pod Stuck in Init (0/2)

**Symptom:**
```
vault-demo-app-abc123-xxxxx   0/2   Init:0/1   0   5m
```

**Solution:**
```bash
# Check init container logs
kubectl logs -n myapp <pod-name> -c vault-agent-init

# Common causes:
# 1. Wrong role name in annotation
# 2. Service account doesn't match role
# 3. Vault server not reachable

# Fix: Verify role and service account match
kubectl exec -n vault vault-0 -- vault read auth/kubernetes/role/myapp
```

### Issue 2: Secret File Empty

**Symptom:** `/vault/secrets/config` exists but is empty

**Solution:**
```bash
# Check Vault Agent logs
kubectl logs -n myapp <pod-name> -c vault-agent

# Common causes:
# 1. Wrong secret path in annotation
# 2. Template syntax error
# 3. Policy doesn't allow reading the path

# Fix: Test secret path directly
kubectl exec -n vault vault-0 -- vault kv get secret/myapp/config
```

### Issue 3: 403 Permission Denied

**Symptom:** Vault Agent logs show "permission denied"

**Solution:**
```bash
# Check policy
kubectl exec -n vault vault-0 -- vault policy read myapp-policy

# Ensure path matches (note: KV v2 uses secret/data/ prefix)
# Policy path: secret/data/myapp/config
# Annotation path: secret/data/myapp/config
# They must match!
```

### Issue 4: Vault Not Reachable

**Symptom:** "connection refused" in Vault Agent logs

**Solution:**
```bash
# Check Vault service
kubectl get svc -n vault

# Check Vault pod
kubectl get pods -n vault

# Verify Vault is running
kubectl exec -n vault vault-0 -- vault status
```

### Useful Debug Commands

```bash
# View all containers in pod
kubectl describe pod -n myapp <pod-name>

# Vault Agent init logs
kubectl logs -n myapp <pod-name> -c vault-agent-init

# Vault Agent sidecar logs
kubectl logs -n myapp <pod-name> -c vault-agent

# App container logs
kubectl logs -n myapp <pod-name> -c app

# Check secret files
kubectl exec -n myapp <pod-name> -c app -- cat /vault/secrets/config

# Check Vault server logs
kubectl logs -n vault vault-0
```

---

## Real-World Production Considerations

### Dev Mode vs Production Mode

```
┌─────────────────────────────┬─────────────────────────────────┐
│  Dev Mode (This Lab)         │  Production Mode                │
├─────────────────────────────┼─────────────────────────────────┤
│  Auto-unsealed              │  Manual unseal (Shamir keys)    │
│  Data in memory             │  Data on persistent storage     │
│  Root token: "root"         │  Root token: Generated once     │
│  Single server              │  HA cluster (3+ servers)        │
│  No TLS                     │  TLS enabled                    │
│  No audit logging           │  Audit logging enabled          │
│  No backup                  │  Regular backups                │
│                             │                                 │
│  ✅ Good for learning       │  ✅ Good for production         │
│  ❌ NOT for production      │  ❌ More complex setup          │
└─────────────────────────────┴─────────────────────────────────┘
```

### Production Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  PRODUCTION VAULT ON AKS                                         │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Vault HA Cluster (3 pods)                                 │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐               │  │
│  │  │ vault-0  │  │ vault-1  │  │ vault-2  │               │  │
│  │  │ (Active) │  │ (Standby)│  │ (Standby)│               │  │
│  │  └──────────┘  └──────────┘  └──────────┘               │  │
│  │                                                             │  │
│  │  Storage: Azure Storage Account or Consul                  │  │
│  │  Auto-unseal: Azure Key Vault                              │  │
│  │  TLS: Enabled                                              │  │
│  │  Audit: Enabled (logs to Azure Monitor)                    │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Cleanup

### Delete All Resources

```bash
# Delete app namespace
kubectl delete namespace myapp

# Delete Vault
helm uninstall vault -n vault
kubectl delete namespace vault

# Delete AKS cluster
az aks delete --resource-group rg-day24-vault --name aks-day24-vault --yes --no-wait

# Delete ACR (if created)
az acr delete --resource-group rg-day24-vault --name acrday24vault --yes

# Delete resource group
az group delete --name rg-day24-vault --yes --no-wait
```

**⏱️ Wait**: 10-15 minutes

**✅ Result**: All resources deleted!

---

## Quick Reference

### Vault Commands

```bash
# Store secret
vault kv put secret/myapp/config key=value

# Read secret
vault kv get secret/myapp/config

# Delete secret
vault kv delete secret/myapp/config

# List secrets
vault kv list secret/myapp/

# Create policy
vault policy write myapp-policy policy.hcl

# Create role
vault write auth/kubernetes/role/myapp ...

# Check status
vault status
```

### Key Vault Annotations

```yaml
# Enable injection
vault.hashicorp.com/agent-inject: "true"

# Set role
vault.hashicorp.com/role: "myapp"

# Inject secret (filename = last part)
vault.hashicorp.com/agent-inject-secret-<filename>: "<vault-path>"

# Custom template
vault.hashicorp.com/agent-inject-template-<filename>: |
  {{- with secret "<vault-path>" -}}
  key={{ .Data.data.key }}
  {{- end }}
```

### Useful Links

- [HashiCorp Vault Documentation](https://developer.hashicorp.com/vault/docs)
- [Vault Helm Chart](https://developer.hashicorp.com/vault/docs/platform/k8s/helm)
- [Vault Agent Injector](https://developer.hashicorp.com/vault/docs/platform/k8s/injector)
- [Vault on AKS Guide](https://learn.hashicorp.com/tutorials/vault/kubernetes-azure-aks)

---

**🎉 Congratulations!** You've completed the bonus lab deploying a real-world application on AKS with HashiCorp Vault for secret management!

