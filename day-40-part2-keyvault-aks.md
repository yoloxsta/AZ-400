# Day 40 Part 2: Azure Key Vault + AKS - Deploy App with Secrets

## What You'll Learn

Deploy an app on AKS that reads secrets from Azure Key Vault:
- ✅ Create Key Vault with secrets
- ✅ Create AKS with Key Vault CSI Driver
- ✅ Workload Identity (pod authenticates to Key Vault)
- ✅ SecretProviderClass (mount secrets into pod)
- ✅ Deploy app that reads secrets from Key Vault
- ✅ Complete test, check, and confirm

## Table of Contents

1. [Architecture](#architecture)
2. [Lab 1: Create Key Vault and Secrets](#lab-1-create-key-vault-and-secrets)
3. [Lab 2: Create AKS with CSI Driver](#lab-2-create-aks-with-csi-driver)
4. [Lab 3: Configure Workload Identity](#lab-3-configure-workload-identity)
5. [Lab 4: Create SecretProviderClass](#lab-4-create-secretproviderclass)
6. [Lab 5: Deploy Application](#lab-5-deploy-application)
7. [Lab 6: Test and Verify](#lab-6-test-and-verify)
8. [Cleanup](#cleanup)

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  HOW IT WORKS                                                     │
│                                                                   │
│  ┌─────────────────┐         ┌─────────────────┐                │
│  │ Azure Key Vault  │         │ AKS Cluster      │                │
│  │                  │         │                   │                │
│  │ Secrets:         │         │ Pod:              │                │
│  │ ├─ db-host       │◄────── │ ├─ App container  │                │
│  │ ├─ db-user       │  reads │ │   reads from    │                │
│  │ ├─ db-password   │  via   │ │   /mnt/secrets/ │                │
│  │ └─ api-key       │  CSI   │ ├─ CSI volume     │                │
│  │                  │ driver │ │   (mounted)     │                │
│  └─────────────────┘         │ └─ Service Account│                │
│                               │   (Workload ID)  │                │
│                               └─────────────────┘                │
│                                                                   │
│  Flow:                                                           │
│  1. Pod starts with a Service Account                            │
│  2. Service Account has Workload Identity (federated credential) │
│  3. CSI Driver uses that identity to authenticate to Key Vault   │
│  4. CSI Driver fetches secrets and mounts as files in the pod    │
│  5. App reads secrets from /mnt/secrets/db-password (file)       │
│  6. No secrets in YAML, no secrets in environment variables!     │
└──────────────────────────────────────────────────────────────────┘
```

### What is CSI Driver?

```
CSI = Container Storage Interface

Secrets Store CSI Driver:
  A Kubernetes plugin that mounts secrets from external stores
  (Key Vault, HashiCorp Vault, etc.) as FILES inside your pod.

Without CSI Driver:
  You put secrets in Kubernetes Secrets (base64, not encrypted!)
  Or hardcode in YAML (terrible!)

With CSI Driver:
  Secrets live in Key Vault (encrypted, audited, versioned)
  CSI Driver fetches them and mounts as files
  Pod reads files like: cat /mnt/secrets/db-password
  App never sees Key Vault directly!
```

---

## Lab 1: Create Key Vault and Secrets

### Step 1: Create Resource Group

```
1. Azure Portal → Search "Resource groups" → "+ Create"
2. Fill in:
   - Subscription: Your subscription
   - Resource group: rg-day40-aks-kv
   - Region: East US
3. Click "Review + create" → "Create"
```

### Step 2: Create Key Vault

```
1. Search "Key vaults" in Azure Portal → "+ Create"
2. Fill in:

   Basics:
   - Subscription: Your subscription
   - Resource group: rg-day40-aks-kv
   - Key vault name: kv-day40-aks (must be globally unique)
   - Region: East US
   - Pricing tier: Standard

   Access configuration:
   - Permission model: Azure role-based access control (RBAC)

   Networking:
   - Public access: All networks (for lab)

3. Click "Review + create" → "Create"
```

**⏱️ Wait**: 1-2 minutes

### Step 3: Assign Yourself Admin Access

```
1. Go to kv-day40-aks
2. Left menu → "Access control (IAM)"
3. Click "+ Add" → "Add role assignment"
4. Role: Search "Key Vault Administrator" → Select it → Next
5. Members: Click "+ Select members" → Select your user → Select
6. Click "Review + assign" → "Review + assign"

⏱️ Wait: 1-2 minutes for role to propagate
```

### Step 4: Store Secrets via Portal

```
1. Go to kv-day40-aks → Left menu → "Secrets"
2. Click "+ Generate/Import" for each secret:

   Secret 1:
   - Name: db-host
   - Secret value: mydb.database.azure.com
   - Click "Create"

   Secret 2:
   - Name: db-user
   - Secret value: appadmin
   - Click "Create"

   Secret 3:
   - Name: db-password
   - Secret value: SuperSecret@2026
   - Click "Create"

   Secret 4:
   - Name: api-key
   - Secret value: sk_live_abc123xyz789
   - Click "Create"

   Secret 5:
   - Name: app-env
   - Secret value: production
   - Click "Create"
```

### Step 5: Verify Secrets

```
1. Go to kv-day40-aks → Secrets
2. Verify all 5 secrets listed:
   ✅ api-key
   ✅ app-env
   ✅ db-host
   ✅ db-password
   ✅ db-user

3. Click "db-password" → Click current version → "Show Secret Value"
   ✅ SuperSecret@2026
```

### Step 6: Test, Check, and Confirm

**Test 1: Key Vault Created**

```
Key vaults → kv-day40-aks
  ✅ Status: Active
  ✅ Permission model: RBAC
```

**Test 2: All Secrets Stored**

```
kv-day40-aks → Secrets
  ✅ 5 secrets listed
  ✅ Each secret value readable
```

**✅ Result**: Key Vault with secrets ready!

---

## Lab 2: Create AKS with CSI Driver

### Step 1: Create AKS Cluster via Portal

```
1. Search "Kubernetes services" in Azure Portal → "+ Create" → "Create Kubernetes cluster"
2. Fill in:

   ═══════════════════════════════════════════════════
   BASICS TAB:
   ═══════════════════════════════════════════════════
   - Subscription: Your subscription
   - Resource group: rg-day40-aks-kv
   - Cluster preset configuration: Dev/Test
   - Kubernetes cluster name: aks-day40-kv
   - Region: East US
   - Kubernetes version: (leave default, latest stable)
   - Node size: Standard_B2s
   - Node count: 2

   ═══════════════════════════════════════════════════
   AUTHENTICATION TAB:
   ═══════════════════════════════════════════════════
   - Authentication method: Local accounts with Kubernetes RBAC
   (leave defaults)

   ═══════════════════════════════════════════════════
   NETWORKING TAB:
   ═══════════════════════════════════════════════════
   - Network configuration: (leave default Azure CNI or Kubenet)
   (leave defaults)

   ═══════════════════════════════════════════════════
   INTEGRATIONS TAB:  ← IMPORTANT!
   ═══════════════════════════════════════════════════
   
   Azure Container Registry:
   - (Skip for now, not needed for this lab)
   
   Service mesh - Istio:
   - Enable Istio: ❌ No (not needed)
   
   Azure Policy:
   - Azure Policy: ❌ No (not needed for this lab)

   ═══════════════════════════════════════════════════
   SECURITY TAB:  ← VERY IMPORTANT!
   ═══════════════════════════════════════════════════
   
   Microsoft Defender for Cloud:
   - (leave default)
   
   OpenID Connect (OIDC):
   - Enable OIDC: ✅ YES  ← MUST ENABLE!
     (Required for Workload Identity)
   
   Workload Identity:
   - Enable Workload Identity: ✅ YES  ← MUST ENABLE!
     (Allows pods to authenticate to Azure services)
     (Note: Requires OIDC to be enabled first)
   
   Image Cleaner:
   - Enable Image Cleaner: ❌ No (optional)
   
   Azure Key Vault:
   - Enable secret store CSI driver: ✅ YES  ← MUST ENABLE!
     (This installs the CSI Driver that mounts Key Vault secrets)
   
   Container Network Security (ACNS):
   - Enable: ❌ No (not needed)

3. Click "Review + create" → "Create"
```

**⏱️ Wait**: 5-10 minutes

```
┌──────────────────────────────────────────────────────────────┐
│  WHAT WE ENABLED AND WHY                                      │
│                                                               │
│  SECURITY TAB:                                               │
│                                                               │
│  ✅ Enable OIDC                                              │
│     Enables OpenID Connect issuer for the cluster.           │
│     This lets Azure verify "this pod is really from AKS".    │
│     Required for Workload Identity to work.                  │
│                                                               │
│  ✅ Enable Workload Identity                                 │
│     Allows pods to authenticate to Azure services            │
│     (like Key Vault) using a Kubernetes Service Account.     │
│     No passwords or credentials stored in pods!              │
│     Requires OIDC to be enabled.                             │
│                                                               │
│  ✅ Enable secret store CSI driver (Azure Key Vault)         │
│     Installs the Secrets Store CSI Driver on the cluster.    │
│     Installs the Azure Key Vault provider.                   │
│     This is what mounts Key Vault secrets as files in pods.  │
│                                                               │
│  INTEGRATIONS TAB:                                           │
│  (We skipped everything here for this lab)                   │
│  In production you might also enable:                        │
│  ├─ Azure Container Registry (for private images)            │
│  ├─ Azure Policy (governance)                                │
│  └─ Istio (service mesh)                                     │
└──────────────────────────────────────────────────────────────┘
```

### Step 2: Connect to AKS

```bash
# Get credentials (this is CLI, needed for kubectl)
az aks get-credentials --resource-group rg-day40-aks-kv --name aks-day40-kv

kubectl get nodes
# NAME                                STATUS   ROLES   AGE   VERSION
# aks-nodepool1-xxxxx-vmss000000      Ready    agent   5m    v1.28.x
# aks-nodepool1-xxxxx-vmss000001      Ready    agent   5m    v1.28.x
# ✅ 2 nodes ready
```

### Step 3: Verify CSI Driver Installed

```bash
# Check CSI driver pods
kubectl get pods -n kube-system -l app=secrets-store-csi-driver

# Expected:
# NAME                                     READY   STATUS    RESTARTS   AGE
# secrets-store-csi-driver-xxxxx           3/3     Running   0          5m
# secrets-store-csi-driver-yyyyy           3/3     Running   0          5m
# ✅ CSI driver running on each node

# Check Azure Key Vault provider pods
kubectl get pods -n kube-system -l app=secrets-store-provider-azure

# Expected:
# NAME                                          READY   STATUS    RESTARTS   AGE
# aks-secrets-store-provider-azure-xxxxx        1/1     Running   0          5m
# aks-secrets-store-provider-azure-yyyyy        1/1     Running   0          5m
# ✅ Azure KV provider running on each node
```

### Step 4: Test, Check, and Confirm

**Test 1: AKS Running**

```
kubectl get nodes
  ✅ 2 nodes Ready
```

**Test 2: CSI Driver Installed**

```
kubectl get pods -n kube-system -l app=secrets-store-csi-driver
  ✅ CSI driver pods running
```

**Test 3: Azure KV Provider Installed**

```
kubectl get pods -n kube-system -l app=secrets-store-provider-azure
  ✅ Azure provider pods running
```

**✅ Result**: AKS with CSI Driver ready!

---

## Lab 3: Configure Workload Identity

### What is Workload Identity?

```
Workload Identity = A way for a Kubernetes pod to authenticate
to Azure services (like Key Vault) WITHOUT storing any credentials.

Old way (bad):
  Store Key Vault credentials in Kubernetes Secret → 😱

New way (Workload Identity):
  1. Create a Managed Identity in Azure
  2. Create a Kubernetes Service Account
  3. Federate them together
  4. Pod uses the Service Account → Azure trusts it → Access granted!
  No credentials stored anywhere!
```

### Step 1: Get Cluster Info

```
You can find these values in the Portal:

1. OIDC Issuer URL:
   Go to aks-day40-kv → Overview → Properties
   Or: aks-day40-kv → Left menu → "Security" → "OIDC Issuer"
   Copy the OIDC Issuer URL

2. Tenant ID:
   Go to Azure Active Directory → Overview → Tenant ID
   Or: Any resource → Properties → Directory ID

3. Identity Client ID:
   Go to id-kv-reader (Managed Identity) → Overview → Client ID

Then set them in your terminal for the next steps:
```

```bash
# Set these values (replace with YOUR values from Portal)
export AKS_OIDC_ISSUER="https://eastus.oic.prod-aks.azure.com/xxxxx/"
export TENANT_ID="your-tenant-id"
export IDENTITY_CLIENT_ID="your-identity-client-id"
```

### Step 2: Create User-Assigned Managed Identity via Portal

```
1. Search "Managed Identities" in Azure Portal → "+ Create"
2. Fill in:
   - Subscription: Your subscription
   - Resource group: rg-day40-aks-kv
   - Region: East US
   - Name: id-kv-reader
3. Click "Review + create" → "Create"

4. After creation, go to id-kv-reader → Overview
5. Copy the "Client ID" → Save it! You'll need it.
   Example: 12345678-abcd-efgh-ijkl-123456789012
```

### Step 3: Grant Identity Access to Key Vault via Portal

```
1. Go to kv-day40-aks → Access control (IAM)
2. Click "+ Add" → "Add role assignment"
3. Role: Search "Key Vault Secrets User" → Select it → Next
4. Members:
   - Assign access to: Managed identity
   - Click "+ Select members"
   - Managed identity type: User-assigned managed identity
   - Select: id-kv-reader
   - Click "Select"
5. Click "Review + assign" → "Review + assign"

✅ Now id-kv-reader can READ secrets from Key Vault
```

**Then get the values needed for next steps (CLI needed for these):**

```bash
# Get OIDC issuer URL (from AKS)
export AKS_OIDC_ISSUER=$(az aks show \
  --resource-group rg-day40-aks-kv \
  --name aks-day40-kv \
  --query "oidcIssuerProfile.issuerUrl" -o tsv)

# Get Tenant ID
export TENANT_ID=$(az account show --query tenantId -o tsv)

# Get Identity Client ID (you copied this from Portal, or use CLI)
export IDENTITY_CLIENT_ID=$(az identity show \
  --name id-kv-reader \
  --resource-group rg-day40-aks-kv \
  --query clientId -o tsv)

echo "OIDC Issuer: $AKS_OIDC_ISSUER"
echo "Tenant ID: $TENANT_ID"
echo "Identity Client ID: $IDENTITY_CLIENT_ID"
```

### Step 4: Create Kubernetes Service Account

```bash
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ServiceAccount
metadata:
  name: kv-workload-sa
  namespace: default
  annotations:
    azure.workload.identity/client-id: "$IDENTITY_CLIENT_ID"
  labels:
    azure.workload.identity/use: "true"
EOF

# ✅ Service Account created with Workload Identity annotation
```

### Step 5: Create Federated Credential

```bash
# Link the Kubernetes Service Account to the Azure Managed Identity
az identity federated-credential create \
  --name fed-cred-kv \
  --identity-name id-kv-reader \
  --resource-group rg-day40-aks-kv \
  --issuer $AKS_OIDC_ISSUER \
  --subject system:serviceaccount:default:kv-workload-sa \
  --audience api://AzureADTokenExchange
```

```
What this does:
  "When a pod in AKS uses service account 'kv-workload-sa',
   Azure should trust it as the managed identity 'id-kv-reader',
   which has access to Key Vault."

  Pod → Service Account → Federated Credential → Managed Identity → Key Vault
  No passwords anywhere in this chain!
```

### Step 6: Test, Check, and Confirm

**Test 1: Managed Identity Created**

```
1. Search "Managed Identities" → id-kv-reader
   ✅ Status: Active
   ✅ Client ID shown
   ✅ Resource group: rg-day40-aks-kv
```

**Test 2: Role Assignment**

```
1. kv-day40-aks → Access control (IAM) → Role assignments
   ✅ id-kv-reader: Key Vault Secrets User
```

**Test 3: Service Account**

```bash
kubectl get sa kv-workload-sa -o yaml | grep azure.workload.identity
  ✅ client-id annotation present
  ✅ use: "true" label present
```

**Test 4: Federated Credential**

```bash
az identity federated-credential show --name fed-cred-kv --identity-name id-kv-reader --resource-group rg-day40-aks-kv
  ✅ Federated credential exists
```

**✅ Result**: Workload Identity configured!

---

## Lab 4: Create SecretProviderClass

### What is SecretProviderClass?

```
SecretProviderClass = Tells the CSI Driver WHICH secrets to fetch
                      and from WHERE (which Key Vault).

It's a Kubernetes custom resource that says:
  "Go to Key Vault 'kv-day40-aks' and fetch these secrets:
   db-host, db-user, db-password, api-key, app-env"
```

### Step 1: Create SecretProviderClass

```bash
cat <<EOF | kubectl apply -f -
apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: kv-secrets
  namespace: default
spec:
  provider: azure
  parameters:
    usePodIdentity: "false"
    useVMManagedIdentity: "false"
    clientID: "$IDENTITY_CLIENT_ID"
    keyvaultName: "kv-day40-aks"
    tenantId: "$TENANT_ID"
    objects: |
      array:
        - |
          objectName: db-host
          objectType: secret
        - |
          objectName: db-user
          objectType: secret
        - |
          objectName: db-password
          objectType: secret
        - |
          objectName: api-key
          objectType: secret
        - |
          objectName: app-env
          objectType: secret
EOF
```

### Step 2: Verify SecretProviderClass

```bash
kubectl get secretproviderclass

# NAME         AGE
# kv-secrets   10s
# ✅ Created

kubectl describe secretproviderclass kv-secrets
# Shows: provider=azure, keyvaultName=kv-day40-aks, 5 objects
```

### Step 3: Test, Check, and Confirm

```
kubectl get secretproviderclass kv-secrets
  ✅ SecretProviderClass exists
  ✅ Provider: azure
  ✅ 5 secrets configured
```

**✅ Result**: SecretProviderClass ready!

---

## Lab 5: Deploy Application

### Step 1: Create Application Deployment

```bash
cat <<'EOF' | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kv-demo-app
  namespace: default
spec:
  replicas: 2
  selector:
    matchLabels:
      app: kv-demo-app
  template:
    metadata:
      labels:
        app: kv-demo-app
    spec:
      serviceAccountName: kv-workload-sa
      containers:
      - name: app
        image: nginx:alpine
        ports:
        - containerPort: 80
        volumeMounts:
        - name: secrets-store
          mountPath: "/mnt/secrets"
          readOnly: true
        command: ["/bin/sh", "-c"]
        args:
          - |
            # Create a page that shows secrets are loaded (masked)
            cat > /usr/share/nginx/html/index.html << HTMLEOF
            <html>
            <head><title>KV Demo App</title></head>
            <body style="background:#1a1a2e;color:#e94560;font-family:Arial;text-align:center;padding:30px">
              <h1>Key Vault + AKS Demo</h1>
              <h2>Secrets loaded from Azure Key Vault!</h2>
              <div style="background:#16213e;padding:20px;border-radius:10px;max-width:500px;margin:20px auto;text-align:left">
                <p><strong>DB Host:</strong> $(cat /mnt/secrets/db-host)</p>
                <p><strong>DB User:</strong> $(cat /mnt/secrets/db-user)</p>
                <p><strong>DB Password:</strong> $(cat /mnt/secrets/db-password | head -c 4)****</p>
                <p><strong>API Key:</strong> $(cat /mnt/secrets/api-key | head -c 8)****</p>
                <p><strong>Environment:</strong> $(cat /mnt/secrets/app-env)</p>
              </div>
              <p style="color:#0f3460">Hostname: $(hostname)</p>
              <p style="color:#0f3460">Secrets mounted at: /mnt/secrets/</p>
            </body>
            </html>
            HTMLEOF
            # Start nginx
            nginx -g 'daemon off;'
      volumes:
      - name: secrets-store
        csi:
          driver: secrets-store.csi.k8s.io
          readOnly: true
          volumeAttributes:
            secretProviderClass: "kv-secrets"
---
apiVersion: v1
kind: Service
metadata:
  name: kv-demo-app
  namespace: default
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 80
  selector:
    app: kv-demo-app
EOF
```

**Key parts explained:**

```
serviceAccountName: kv-workload-sa
  → Uses the service account with Workload Identity
  → This is how the pod authenticates to Key Vault

volumeMounts:
  mountPath: "/mnt/secrets"
  → Secrets will appear as files at /mnt/secrets/
  → /mnt/secrets/db-host contains "mydb.database.azure.com"
  → /mnt/secrets/db-password contains "SuperSecret@2026"

volumes:
  csi:
    driver: secrets-store.csi.k8s.io
    secretProviderClass: "kv-secrets"
  → Uses the CSI driver to fetch secrets
  → References our SecretProviderClass
```

### Step 2: Wait for Pods

```bash
# Watch pods start
kubectl get pods -w

# Expected (wait for 2/2 Running):
# NAME                           READY   STATUS    RESTARTS   AGE
# kv-demo-app-xxxxx-aaaaa        1/1     Running   0          30s
# kv-demo-app-xxxxx-bbbbb        1/1     Running   0          30s

# If pods are stuck in ContainerCreating, check events:
kubectl describe pod -l app=kv-demo-app
```

### Step 3: Get External IP

```bash
kubectl get svc kv-demo-app

# NAME          TYPE           CLUSTER-IP    EXTERNAL-IP    PORT(S)
# kv-demo-app   LoadBalancer   10.0.xxx.xx   20.xxx.xx.xx   80:30xxx/TCP

# ⏱️ Wait 2-3 minutes for Azure to assign public IP
export APP_IP=$(kubectl get svc kv-demo-app -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
echo "App URL: http://$APP_IP"
```

### Step 4: Test, Check, and Confirm

**Test 1: Pods Running**

```bash
kubectl get pods -l app=kv-demo-app
  ✅ 2 pods Running (1/1)
```

**Test 2: Secrets Mounted in Pod**

```bash
POD=$(kubectl get pods -l app=kv-demo-app -o jsonpath='{.items[0].metadata.name}')

# List secret files
kubectl exec $POD -- ls /mnt/secrets/
# api-key
# app-env
# db-host
# db-password
# db-user
# ✅ All 5 secrets mounted as files!

# Read a secret
kubectl exec $POD -- cat /mnt/secrets/db-host
# mydb.database.azure.com ✅

kubectl exec $POD -- cat /mnt/secrets/db-password
# SuperSecret@2026 ✅
```

**Test 3: Web Page Shows Secrets**

```bash
curl http://$APP_IP

# Shows HTML with:
# DB Host: mydb.database.azure.com
# DB User: appadmin
# DB Password: Supe****
# API Key: sk_live_****
# Environment: production
# ✅ Secrets loaded from Key Vault!
```

**Test 4: Open in Browser**

```
http://<APP-EXTERNAL-IP>

✅ "Key Vault + AKS Demo"
✅ "Secrets loaded from Azure Key Vault!"
✅ DB Host, DB User shown
✅ Password and API Key masked
```

**✅ Result**: App deployed with Key Vault secrets!

---

## Lab 6: Test and Verify

### Test 1: Update Secret in Key Vault

```bash
# Update db-password in Key Vault
az keyvault secret set --vault-name kv-day40-aks --name db-password --value "RotatedPassword@2026"

# CSI Driver auto-refreshes (default: every 2 minutes)
# Wait 2-3 minutes, then check:

POD=$(kubectl get pods -l app=kv-demo-app -o jsonpath='{.items[0].metadata.name}')
kubectl exec $POD -- cat /mnt/secrets/db-password
# RotatedPassword@2026 ✅
# Secret updated WITHOUT redeploying the pod!
```

### Test 2: Verify No Secrets in YAML

```bash
# Check deployment YAML - no secrets anywhere!
kubectl get deployment kv-demo-app -o yaml | grep -i "password\|secret\|key" | grep -v "secretProviderClass\|secrets-store\|serviceAccount"
# (Should return nothing - no hardcoded secrets!)
# ✅ No secrets in Kubernetes YAML!
```

### Test 3: Verify No Kubernetes Secrets Created

```bash
kubectl get secrets
# Only default service account token
# No application secrets stored in Kubernetes!
# ✅ Secrets only in Key Vault, not in K8s!
```

### Test 4: Load Balancing

```bash
# Hit the app multiple times
for i in {1..6}; do
  curl -s http://$APP_IP | grep "Hostname"
done

# Shows different hostnames (different pods)
# ✅ Load balancing across 2 pods
# ✅ Both pods have Key Vault secrets
```

### Test 5: Pod Restart (Secrets Survive)

```bash
# Delete a pod (Kubernetes recreates it)
kubectl delete pod $POD

# Wait for new pod
kubectl get pods -w

# Check new pod has secrets
NEW_POD=$(kubectl get pods -l app=kv-demo-app -o jsonpath='{.items[0].metadata.name}')
kubectl exec $NEW_POD -- cat /mnt/secrets/db-host
# mydb.database.azure.com ✅
# New pod automatically gets secrets from Key Vault!
```

### Complete Verification Checklist

```
Infrastructure:
  ✅ Key Vault: kv-day40-aks with 5 secrets
  ✅ AKS: 2 nodes with CSI Driver
  ✅ Managed Identity: id-kv-reader with Key Vault Secrets User role
  ✅ Workload Identity: Federated credential linked

Kubernetes:
  ✅ Service Account: kv-workload-sa with Workload Identity
  ✅ SecretProviderClass: kv-secrets (5 secrets configured)
  ✅ Deployment: 2 pods running
  ✅ Service: LoadBalancer with public IP

Secrets:
  ✅ Mounted at /mnt/secrets/ in each pod
  ✅ All 5 secrets readable as files
  ✅ No secrets in Kubernetes YAML
  ✅ No Kubernetes Secrets created
  ✅ Auto-refresh when Key Vault secret changes
  ✅ New pods automatically get secrets
```

---

## How It All Connects

```
┌──────────────────────────────────────────────────────────────────┐
│  THE COMPLETE CHAIN                                               │
│                                                                   │
│  1. You store secrets in Key Vault                               │
│     az keyvault secret set --name db-password --value "xxx"      │
│                                                                   │
│  2. You create a Managed Identity                                │
│     id-kv-reader → has "Key Vault Secrets User" role             │
│                                                                   │
│  3. You create a K8s Service Account with Workload Identity      │
│     kv-workload-sa → annotated with identity client ID           │
│                                                                   │
│  4. You federate them                                            │
│     "When pod uses kv-workload-sa, trust it as id-kv-reader"    │
│                                                                   │
│  5. SecretProviderClass says WHAT to fetch                       │
│     "Fetch db-host, db-user, db-password from kv-day40-aks"     │
│                                                                   │
│  6. Pod mounts the CSI volume                                    │
│     volumes: csi: secretProviderClass: kv-secrets                │
│                                                                   │
│  7. CSI Driver does the work                                     │
│     Pod starts → CSI authenticates via Workload Identity         │
│     → Fetches secrets from Key Vault                             │
│     → Mounts as files at /mnt/secrets/                           │
│                                                                   │
│  8. App reads files                                              │
│     cat /mnt/secrets/db-password → "SuperSecret@2026"            │
│                                                                   │
│  ZERO secrets in code, YAML, or environment variables!           │
└──────────────────────────────────────────────────────────────────┘
```

---

## Cleanup

```
1. Delete AKS Cluster:
   - Search "Kubernetes services" → aks-day40-kv → Delete
   - Type cluster name to confirm → Delete

2. Delete Resource Group (deletes everything):
   - Resource groups → rg-day40-aks-kv → Delete
   - Type name to confirm → Delete

3. Purge Key Vault (after soft delete):
   - Search "Key vaults" → "Manage deleted vaults"
   - Find kv-day40-aks → "Purge"
   
   Or wait 90 days for auto-purge.
```

**⏱️ Wait**: 10-15 minutes

**✅ Result**: All resources deleted!

---

## Quick Reference

### Required Components

```
1. Key Vault (with secrets)
2. AKS (with --enable-addons azure-keyvault-secrets-provider
         --enable-oidc-issuer --enable-workload-identity)
3. Managed Identity (with Key Vault Secrets User role)
4. Federated Credential (links K8s SA to Managed Identity)
5. Kubernetes Service Account (with workload identity annotation)
6. SecretProviderClass (defines which secrets to fetch)
7. Pod with CSI volume mount
```

### Useful Links

- [Secrets Store CSI Driver](https://learn.microsoft.com/azure/aks/csi-secrets-store-driver)
- [Workload Identity](https://learn.microsoft.com/azure/aks/workload-identity-overview)
- [Key Vault Provider for CSI](https://azure.github.io/secrets-store-csi-driver-provider-azure/)

---

**🎉 Congratulations!** You've completed Day 40 Part 2 deploying an AKS app that reads secrets from Azure Key Vault using CSI Driver and Workload Identity — zero secrets in code!