# Day 40 Part 3: Key Vault with Private Endpoint (Production Setup)

## What You'll Learn

Lock down Key Vault so it's only accessible from your VNet:
- ✅ Why Private Endpoint for Key Vault
- ✅ Create Key Vault with Private Endpoint (Portal)
- ✅ Private DNS Zone for Key Vault
- ✅ Disable public access completely
- ✅ Access from VM via private IP
- ✅ Access from AKS via private IP
- ✅ Complete test, check, and confirm

## Table of Contents

1. [Why Private Endpoint for Key Vault?](#why-private-endpoint-for-key-vault)
2. [Lab 1: Create VNet and Key Vault](#lab-1-create-vnet-and-key-vault)
3. [Lab 2: Create Private Endpoint for Key Vault](#lab-2-create-private-endpoint-for-key-vault)
4. [Lab 3: Disable Public Access](#lab-3-disable-public-access)
5. [Lab 4: Test Access from VM (Private)](#lab-4-test-access-from-vm-private)
6. [Lab 5: AKS with Private Key Vault](#lab-5-aks-with-private-key-vault)
7. [Cleanup](#cleanup)

---

## Why Private Endpoint for Key Vault?

```
┌──────────────────────────────────────────────────────────────────┐
│  THE PROBLEM: Key Vault with Public Access                        │
│                                                                   │
│  Default setup (Day 40 Part 1):                                  │
│  Key Vault URL: https://kv-day40.vault.azure.net                 │
│  Resolves to: PUBLIC IP (52.x.x.x)                              │
│                                                                   │
│  Your VM (10.0.1.4) ──→ Internet ──→ Key Vault (52.x.x.x)     │
│  Your AKS pod ──→ Internet ──→ Key Vault (52.x.x.x)            │
│  Hacker ──→ Internet ──→ Key Vault (52.x.x.x) ⚠️              │
│                                                                   │
│  Even though Key Vault has authentication,                       │
│  the traffic goes through the PUBLIC INTERNET.                   │
│  The endpoint is VISIBLE to anyone who scans.                    │
│  Compliance teams don't like this!                               │
│                                                                   │
│  THE SOLUTION: Private Endpoint                                  │
│                                                                   │
│  Key Vault gets a PRIVATE IP in YOUR VNet.                       │
│  URL still: https://kv-day40.vault.azure.net                     │
│  But resolves to: PRIVATE IP (10.0.2.5)                         │
│                                                                   │
│  Your VM (10.0.1.4) ──→ VNet ──→ Key Vault (10.0.2.5) ✅      │
│  Your AKS pod ──→ VNet ──→ Key Vault (10.0.2.5) ✅             │
│  Hacker ──→ Internet ──→ ❌ No public IP to connect to!        │
│                                                                   │
│  Traffic NEVER leaves your VNet!                                 │
│  Key Vault is INVISIBLE from the internet!                       │
└──────────────────────────────────────────────────────────────────┘
```

```
┌──────────────────────────────────────────────────────────────┐
│  BEFORE (Public)          vs    AFTER (Private Endpoint)      │
│                                                               │
│  nslookup kv.vault.azure.net    nslookup kv.vault.azure.net │
│  → 52.168.x.x (public)         → 10.0.2.5 (private!)       │
│                                                               │
│  Traffic: VM → Internet → KV    Traffic: VM → VNet → KV     │
│  Visible: Yes (public IP)       Visible: No (private only)  │
│  Compliance: ⚠️ Risky           Compliance: ✅ Approved      │
└──────────────────────────────────────────────────────────────┘
```

---

## Lab 1: Create VNet and Key Vault

### Step 1: Create Resource Group

```
1. Azure Portal → Resource groups → "+ Create"
2. Name: rg-day40-kv-private
3. Region: East US
4. Click "Review + create" → "Create"
```

### Step 2: Create Virtual Network

```
1. Search "Virtual networks" → "+ Create"
2. Fill in:
   - Resource group: rg-day40-kv-private
   - Name: vnet-kv-private
   - Region: East US
   
   IP Addresses:
   - Address space: 10.0.0.0/16
   - Add subnet: subnet-vms, 10.0.1.0/24
   - Add subnet: subnet-endpoints, 10.0.2.0/24

3. Click "Review + create" → "Create"
```

### Step 3: Create Key Vault

```
1. Search "Key vaults" → "+ Create"
2. Fill in:

   Basics:
   - Resource group: rg-day40-kv-private
   - Key vault name: kv-day40-private (globally unique)
   - Region: East US
   - Pricing tier: Standard

   Access configuration:
   - Permission model: Azure role-based access control (RBAC)

   Networking:
   ⚠️ FOR NOW, select: All networks
   (We'll add Private Endpoint and disable public access in next labs)
   (If we disable public now, we can't add secrets from Portal!)

3. Click "Review + create" → "Create"
```

**⏱️ Wait**: 1-2 minutes

### Step 4: Assign Yourself Access and Add Secrets

```
1. Go to kv-day40-private → Access control (IAM)
2. "+ Add" → "Add role assignment"
3. Role: Key Vault Administrator → Next
4. Members: Select your user → Select
5. Click "Review + assign"

⏱️ Wait 1-2 minutes for role to propagate

6. Go to kv-day40-private → Secrets
7. Add secrets:

   "+ Generate/Import":
   - Name: db-host, Value: mydb.database.azure.com → Create
   - Name: db-password, Value: PrivateSecret@2026 → Create
   - Name: api-key, Value: sk_private_abc123 → Create
```

### Step 5: Verify Current DNS (Public)

```
From your laptop (command prompt or terminal):

nslookup kv-day40-private.vault.azure.net

Result:
  Name: kv-day40-private.vault.azure.net
  Address: 52.x.x.x  ← PUBLIC IP

✅ Currently resolves to public IP (this will change!)
```

### Step 6: Test, Check, and Confirm

```
✅ VNet: vnet-kv-private with 2 subnets
✅ Key Vault: kv-day40-private with 3 secrets
✅ DNS: Resolves to public IP (for now)
```

**✅ Result**: Setup complete!

---

## Lab 2: Create Private Endpoint for Key Vault

### Step 1: Create Private Endpoint via Portal

```
1. Go to kv-day40-private
2. Left menu → "Networking"
3. Click "Private endpoint connections" tab
4. Click "+ Create private endpoint"
5. Fill in:

   ═══════════════════════════════════════════════════
   BASICS TAB:
   ═══════════════════════════════════════════════════
   - Subscription: Your subscription
   - Resource group: rg-day40-kv-private
   - Name: pe-keyvault
   - Network Interface Name: pe-keyvault-nic
   - Region: East US

   ═══════════════════════════════════════════════════
   RESOURCE TAB:
   ═══════════════════════════════════════════════════
   - Connection method: Connect to an Azure resource in my directory
   - Subscription: Your subscription
   - Resource type: Microsoft.KeyVault/vaults
   - Resource: kv-day40-private
   - Target sub-resource: vault

   ═══════════════════════════════════════════════════
   VIRTUAL NETWORK TAB:
   ═══════════════════════════════════════════════════
   - Virtual network: vnet-kv-private
   - Subnet: subnet-endpoints (10.0.2.0/24)
   - Private IP configuration: Dynamically allocate IP address

   ═══════════════════════════════════════════════════
   DNS TAB:
   ═══════════════════════════════════════════════════
   - Integrate with private DNS zone: ✅ Yes
   - Private DNS zone: (auto-creates)
     privatelink.vaultcore.azure.net
   - Resource group: rg-day40-kv-private

6. Click "Review + create" → "Create"
```

**⏱️ Wait**: 1-2 minutes

### Step 2: Verify Private Endpoint Created

```
1. Go to pe-keyvault → Overview
2. Note:
   - Private IP address: 10.0.2.4 (or similar)
   - Connection status: Approved
   - Subnet: subnet-endpoints

3. Go to pe-keyvault → DNS configuration
   You'll see:
   ┌──────────────────────────────────────────────────────┐
   │ FQDN                              IP Address          │
   │ kv-day40-private.vault.azure.net  10.0.2.4           │
   └──────────────────────────────────────────────────────┘
   
   ✅ Key Vault now has a private IP!
```

### Step 3: Verify Private DNS Zone

```
1. Search "Private DNS zones" in Portal
2. Click "privatelink.vaultcore.azure.net"
3. Overview → You'll see:

   A Record:
   Name: kv-day40-private
   Type: A
   Value: 10.0.2.4
   
   ✅ DNS record maps Key Vault name to private IP

4. Left menu → "Virtual network links"
   ✅ Link to vnet-kv-private exists
   ✅ VMs in this VNet will resolve to private IP
```

### Step 4: Verify Connection on Key Vault Side

```
1. Go to kv-day40-private → Networking
2. Click "Private endpoint connections" tab
3. Verify:
   ✅ pe-keyvault: Connection state = Approved
   ✅ Private endpoint: pe-keyvault
```

### Step 5: Test, Check, and Confirm

**Test 1: Private Endpoint Created**

```
pe-keyvault → Overview
  ✅ Private IP: 10.0.2.x
  ✅ Connection status: Approved
  ✅ Subnet: subnet-endpoints
```

**Test 2: Private DNS Zone**

```
privatelink.vaultcore.azure.net
  ✅ A record: kv-day40-private → 10.0.2.4
  ✅ VNet link: vnet-kv-private
```

**Test 3: Key Vault Shows Connection**

```
kv-day40-private → Networking → Private endpoint connections
  ✅ pe-keyvault: Approved
```

**✅ Result**: Private Endpoint for Key Vault created!

---

## Lab 3: Disable Public Access

### Step 1: Disable Public Network Access

```
Now that we have a Private Endpoint, we can disable public access.

1. Go to kv-day40-private → Networking
2. "Firewalls and virtual networks" tab
3. Change:
   - Public network access: Disabled ← SELECT THIS!
4. Click "Apply" (or "Save")

⚠️ After this:
  ✅ From VNet (via private endpoint): Can access Key Vault
  ❌ From internet: CANNOT access Key Vault
  ❌ From Azure Portal: CANNOT browse secrets!
     (Portal accesses via internet too)
```

### Step 2: Understand What Changed

```
┌──────────────────────────────────────────────────────────────┐
│  BEFORE: Public access enabled                                │
│                                                               │
│  Your laptop → Internet → kv-day40-private (52.x.x.x) ✅   │
│  VM in VNet → Private EP → kv-day40-private (10.0.2.4) ✅   │
│  Hacker → Internet → kv-day40-private (52.x.x.x) ⚠️        │
│                                                               │
│  AFTER: Public access disabled                               │
│                                                               │
│  Your laptop → Internet → ❌ BLOCKED                         │
│  VM in VNet → Private EP → kv-day40-private (10.0.2.4) ✅   │
│  Hacker → Internet → ❌ BLOCKED                              │
│  Azure Portal → Internet → ❌ BLOCKED (can't browse secrets)│
│                                                               │
│  Only resources in the VNet can reach Key Vault!             │
└──────────────────────────────────────────────────────────────┘
```

### Step 3: Verify Public Access Blocked

```
From your laptop:

az keyvault secret list --vault-name kv-day40-private
# Error: "Public network access is disabled and request is not
#  from a trusted service nor via an approved private link."
# ❌ Blocked! ✅ This is correct!
```

### Step 4: If You Need Portal Access for Management

```
Option A: Allow your IP temporarily
  1. kv-day40-private → Networking
  2. Change to: "Allow public access from specific virtual networks and IP addresses"
  3. Add your client IP address ✅
  4. Save
  5. Do your management work
  6. Change back to "Disabled"

Option B: Use a VM inside the VNet
  SSH into a VM in the VNet → use az CLI from there
  (This is the production-recommended approach)
```

### Step 5: Test, Check, and Confirm

**Test 1: Public Access Disabled**

```
kv-day40-private → Networking
  ✅ Public network access: Disabled
```

**Test 2: Internet Access Blocked**

```
From laptop:
  az keyvault secret list --vault-name kv-day40-private
  ❌ Error: Public network access is disabled
  ✅ Correct! Fully locked down.
```

**✅ Result**: Key Vault public access disabled!

---

## Lab 4: Test Access from VM (Private)

### Step 1: Create Test VM in the VNet

```
1. Search "Virtual machines" → "+ Create"
2. Fill in:
   - Resource group: rg-day40-kv-private
   - Name: vm-kv-test
   - Region: East US
   - Image: Ubuntu 22.04 LTS
   - Size: Standard_B1s
   - Username: azureuser
   - Password: Day40Priv@2026
   - Public inbound ports: Allow SSH (22)

   Networking:
   - Virtual network: vnet-kv-private
   - Subnet: subnet-vms (10.0.1.0/24)

3. Click "Review + create" → "Create"
```

**⏱️ Wait**: 2-3 minutes

### Step 2: Test DNS Resolution from VM

```bash
# SSH into VM
ssh azureuser@<VM-PUBLIC-IP>

# Resolve Key Vault DNS
nslookup kv-day40-private.vault.azure.net

# Expected:
# Name: kv-day40-private.privatelink.vaultcore.azure.net
# Address: 10.0.2.4
#
# ✅ Resolves to PRIVATE IP (10.0.2.4)!
# ✅ NOT the public IP!
# ✅ Private DNS Zone is working!
```

### Step 3: Access Key Vault from VM

```bash
# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login (use device code since VM has no browser)
az login --use-device-code
# Follow the instructions to authenticate

# Read secrets from Key Vault
az keyvault secret show --vault-name kv-day40-private --name db-password --query value -o tsv
# PrivateSecret@2026 ✅

az keyvault secret show --vault-name kv-day40-private --name db-host --query value -o tsv
# mydb.database.azure.com ✅

az keyvault secret show --vault-name kv-day40-private --name api-key --query value -o tsv
# sk_private_abc123 ✅

# List all secrets
az keyvault secret list --vault-name kv-day40-private --query "[].name" -o tsv
# api-key
# db-host
# db-password
# ✅ All secrets accessible via private endpoint!

exit
```

### Step 4: Verify Traffic Goes Through Private IP

```bash
# SSH into VM again
ssh azureuser@<VM-PUBLIC-IP>

# Trace the connection
# Install traceroute
sudo apt install -y traceroute

# Trace to Key Vault
traceroute kv-day40-private.vault.azure.net

# Expected: Direct connection (1-2 hops within Azure)
# NOT going through public internet!
# ✅ Traffic stays in VNet

exit
```

### Step 5: Test, Check, and Confirm

**Test 1: DNS Resolves to Private IP**

```
From VM:
  nslookup kv-day40-private.vault.azure.net
  ✅ Address: 10.0.2.4 (private!)
```

**Test 2: Secrets Accessible from VM**

```
From VM:
  az keyvault secret show --vault-name kv-day40-private --name db-password
  ✅ PrivateSecret@2026 returned
```

**Test 3: All Secrets Listed**

```
From VM:
  az keyvault secret list --vault-name kv-day40-private
  ✅ 3 secrets listed
```

**Test 4: NOT Accessible from Internet**

```
From laptop (outside VNet):
  az keyvault secret list --vault-name kv-day40-private
  ❌ Blocked (public access disabled)
  ✅ Correct!
```

**✅ Result**: Key Vault accessible only via Private Endpoint!

---

## Lab 5: AKS with Private Key Vault

### What We'll Do

```
Create AKS in the SAME VNet as the Key Vault Private Endpoint.
AKS pods access Key Vault via private IP (never internet).

┌──────────────────────────────────────────────────────────────┐
│  vnet-kv-private (10.0.0.0/16)                               │
│                                                               │
│  subnet-vms (10.0.1.0/24):                                  │
│  └─ vm-kv-test                                               │
│                                                               │
│  subnet-endpoints (10.0.2.0/24):                             │
│  └─ pe-keyvault (10.0.2.4) → Key Vault                      │
│                                                               │
│  subnet-aks (10.0.3.0/24):                                   │
│  └─ AKS nodes → pods → read from 10.0.2.4 (private!)       │
│                                                               │
│  All in same VNet = AKS can reach Key Vault via private IP!  │
└──────────────────────────────────────────────────────────────┘
```

### Step 1: Add AKS Subnet

```
1. Go to vnet-kv-private → Subnets
2. Click "+ Subnet"
3. Name: subnet-aks
4. Address range: 10.0.3.0/24
5. Click "Save"
```

### Step 2: Create AKS in the VNet

```
1. Search "Kubernetes services" → "+ Create" → "Create Kubernetes cluster"
2. Fill in:

   Basics:
   - Resource group: rg-day40-kv-private
   - Cluster name: aks-kv-private
   - Region: East US
   - Node size: Standard_B2s
   - Node count: 2

   Networking:
   - Network configuration: Azure CNI
   - Virtual network: vnet-kv-private ← SAME VNET!
   - Cluster subnet: subnet-aks (10.0.3.0/24)

   Security:
   - Enable OIDC: ✅ Yes
   - Enable Workload Identity: ✅ Yes
   - Enable secret store CSI driver: ✅ Yes

3. Click "Review + create" → "Create"
```

**⏱️ Wait**: 5-10 minutes

### Step 3: Connect and Verify DNS from AKS

```bash
# Get credentials
az aks get-credentials --resource-group rg-day40-kv-private --name aks-kv-private

# Verify nodes
kubectl get nodes

# Test DNS resolution from inside a pod
kubectl run dns-test --image=busybox --rm -it --restart=Never -- nslookup kv-day40-private.vault.azure.net

# Expected:
# Name: kv-day40-private.privatelink.vaultcore.azure.net
# Address: 10.0.2.4
# ✅ AKS pod resolves Key Vault to PRIVATE IP!
```

### Step 4: Deploy App with Key Vault Secrets (Same as Part 2)

```
Follow the same steps from Day 40 Part 2:
  1. Create Managed Identity (id-kv-reader-private)
  2. Assign "Key Vault Secrets User" role on kv-day40-private
  3. Create Federated Credential
  4. Create Service Account
  5. Create SecretProviderClass (pointing to kv-day40-private)
  6. Deploy app with CSI volume

The ONLY difference: Key Vault traffic goes through private IP!
Your app code and YAML are IDENTICAL to Part 2.
The private endpoint is transparent to the application.
```

### Step 5: Test, Check, and Confirm

**Test 1: AKS in Same VNet**

```
aks-kv-private → Networking
  ✅ VNet: vnet-kv-private
  ✅ Subnet: subnet-aks
```

**Test 2: DNS Resolution from Pod**

```
kubectl run dns-test --image=busybox --rm -it -- nslookup kv-day40-private.vault.azure.net
  ✅ Resolves to 10.0.2.4 (private IP)
  ✅ NOT public IP
```

**Test 3: Key Vault Still Has No Public Access**

```
kv-day40-private → Networking
  ✅ Public access: Disabled
  ✅ Private endpoint: pe-keyvault (Approved)
```

**✅ Result**: AKS accessing Key Vault via Private Endpoint!

---

## Complete Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  PRODUCTION SETUP: Key Vault with Private Endpoint               │
│                                                                   │
│  vnet-kv-private (10.0.0.0/16)                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                                                              │  │
│  │  subnet-endpoints (10.0.2.0/24):                            │  │
│  │  └─ pe-keyvault (10.0.2.4)                                 │  │
│  │     └─ Connected to: kv-day40-private                       │  │
│  │                                                              │  │
│  │  subnet-vms (10.0.1.0/24):                                  │  │
│  │  └─ vm-kv-test                                              │  │
│  │     nslookup kv-day40-private... → 10.0.2.4 ✅             │  │
│  │                                                              │  │
│  │  subnet-aks (10.0.3.0/24):                                  │  │
│  │  └─ AKS pods                                                │  │
│  │     nslookup kv-day40-private... → 10.0.2.4 ✅             │  │
│  │     CSI Driver → 10.0.2.4 → fetches secrets ✅             │  │
│  │                                                              │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Private DNS Zone: privatelink.vaultcore.azure.net               │
│  └─ kv-day40-private → 10.0.2.4                                 │
│                                                                   │
│  Key Vault: kv-day40-private                                     │
│  ├─ Public access: DISABLED                                      │
│  ├─ Private endpoint: pe-keyvault (10.0.2.4)                    │
│  └─ Only accessible from vnet-kv-private                         │
│                                                                   │
│  Internet → ❌ BLOCKED (no public access)                        │
│  VNet → ✅ ALLOWED (via private endpoint)                        │
└──────────────────────────────────────────────────────────────────┘
```

---

## Cleanup

```
1. Delete AKS (if created):
   - Kubernetes services → aks-kv-private → Delete

2. Delete Resource Group:
   - Resource groups → rg-day40-kv-private → Delete
   - Type name to confirm → Delete

3. Purge Key Vault:
   - Key vaults → "Manage deleted vaults"
   - Find kv-day40-private → Purge
   
4. Delete Private DNS Zone (if not auto-deleted):
   - Private DNS zones → privatelink.vaultcore.azure.net → Delete
```

**⏱️ Wait**: 10-15 minutes

**✅ Result**: All resources deleted!

---

## Quick Reference

### Public vs Private Key Vault

```
┌─────────────────────────────┬─────────────────────────────────┐
│  Public (Day 40 Part 1)      │  Private (This Part 3)          │
├─────────────────────────────┼─────────────────────────────────┤
│  DNS → Public IP (52.x.x.x)│  DNS → Private IP (10.0.2.x)   │
│  Traffic via internet       │  Traffic via VNet only           │
│  Visible to internet        │  Invisible from internet        │
│  Auth protects access       │  Auth + network protects access │
│  Good for: dev/test         │  Good for: production           │
│  Cost: Free                 │  Cost: ~$7.30/month             │
│  Setup: Easy                │  Setup: Medium                  │
│  Compliance: ⚠️             │  Compliance: ✅                 │
└─────────────────────────────┴─────────────────────────────────┘
```

### Useful Links

- [Key Vault Private Endpoint](https://learn.microsoft.com/azure/key-vault/general/private-link-service)
- [Private DNS Zones](https://learn.microsoft.com/azure/dns/private-dns-overview)
- [AKS with Private Key Vault](https://learn.microsoft.com/azure/aks/csi-secrets-store-driver)

---

**🎉 Congratulations!** You've completed Day 40 Part 3 setting up Key Vault with Private Endpoint for production-grade security!