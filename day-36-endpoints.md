# Day 36: Azure Endpoints - Private Endpoints & Service Endpoints

## What You'll Learn

Secure your Azure resources with endpoints:
- ✅ What is an Endpoint (simple explanation)
- ✅ Service Endpoint vs Private Endpoint (the two types)
- ✅ Why endpoints matter (security)
- ✅ Service Endpoint lab (Storage Account)
- ✅ Private Endpoint lab (Storage Account)
- ✅ Private Endpoint lab (Azure SQL)
- ✅ Private DNS Zones (name resolution)
- ✅ When to use which
- ✅ Complete test, check, and confirm

## Table of Contents

1. [What is an Endpoint?](#what-is-an-endpoint)
2. [Why Do You Need Endpoints?](#why-do-you-need-endpoints)
3. [Service Endpoint vs Private Endpoint](#service-endpoint-vs-private-endpoint)
4. [Lab 1: Setup](#lab-1-setup)
5. [Lab 2: Service Endpoint for Storage](#lab-2-service-endpoint-for-storage)
6. [Lab 3: Private Endpoint for Storage](#lab-3-private-endpoint-for-storage)
7. [Lab 4: Private Endpoint for Azure SQL](#lab-4-private-endpoint-for-azure-sql)
8. [Lab 5: Private DNS Zones](#lab-5-private-dns-zones)
9. [Lab 6: Disable Public Access (Full Lockdown)](#lab-6-disable-public-access-full-lockdown)
10. [When to Use Which](#when-to-use-which)
11. [Cleanup](#cleanup)

---

## What is an Endpoint?

**Endpoint** = The "door" through which you access an Azure service.

### Simple Explanation

```
Every Azure service has an address (endpoint) you connect to:

Storage Account: https://mystorageaccount.blob.core.windows.net
SQL Database:    mystorageaccount.database.windows.net
Key Vault:       https://mykeyvault.vault.azure.net

By default, these are PUBLIC endpoints:
  → Accessible from ANYWHERE on the internet
  → Anyone who knows the URL can TRY to connect
  → Protected only by authentication (keys, passwords)

┌──────────────────────────────────────────────────────────────┐
│  THE PROBLEM WITH PUBLIC ENDPOINTS                            │
│                                                               │
│  Your Storage Account: mystorageaccount.blob.core.windows.net│
│                                                               │
│  ✅ Your VM (10.0.1.4) → Internet → Storage (public IP)     │
│  ✅ Your office → Internet → Storage (public IP)             │
│  ⚠️ Hacker → Internet → Storage (public IP)                 │
│  ⚠️ Anyone → Internet → Storage (public IP)                 │
│                                                               │
│  Traffic goes through the PUBLIC INTERNET!                   │
│  Even from your own Azure VM to your own Storage Account!   │
│                                                               │
│  Problems:                                                   │
│  ├─ Traffic leaves Azure backbone (goes to internet)         │
│  ├─ Exposed to DDoS, man-in-the-middle                      │
│  ├─ Anyone can attempt to connect                            │
│  └─ Compliance issues (data over public internet)            │
└──────────────────────────────────────────────────────────────┘
```

### The Solution: Endpoints

```
┌──────────────────────────────────────────────────────────────┐
│  TWO SOLUTIONS                                                │
│                                                               │
│  1. SERVICE ENDPOINT:                                        │
│     Keep the public URL, but route traffic through           │
│     Azure backbone (not internet). Restrict access           │
│     to specific VNets only.                                  │
│                                                               │
│     VM (10.0.1.4) ──Azure backbone──→ Storage (public IP)   │
│     Hacker ──Internet──→ Storage ❌ BLOCKED                  │
│                                                               │
│  2. PRIVATE ENDPOINT:                                        │
│     Give the service a PRIVATE IP in YOUR VNet.              │
│     No public access at all.                                 │
│                                                               │
│     VM (10.0.1.4) ──VNet──→ Storage (10.0.2.5 private!)    │
│     Hacker ──Internet──→ ❌ No public IP to connect to      │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Why Do You Need Endpoints?

```
┌─────────────────────────────────────────────────────────────────┐
│  WHY ENDPOINTS MATTER                                            │
│                                                                  │
│  1. SECURITY                                                    │
│     Without: VM → Internet → Storage (data travels publicly)   │
│     With:    VM → Azure backbone → Storage (private path)      │
│     Data never leaves Azure's network!                          │
│                                                                  │
│  2. COMPLIANCE                                                  │
│     Many regulations require:                                   │
│     ├─ PCI-DSS: No sensitive data over public internet          │
│     ├─ HIPAA: Healthcare data must be private                   │
│     ├─ SOC2: Restrict access to authorized networks             │
│     └─ Company policy: "No public endpoints"                    │
│                                                                  │
│  3. REDUCE ATTACK SURFACE                                       │
│     Public endpoint = Visible to the entire internet            │
│     Private endpoint = Invisible, only your VNet can see it    │
│     Less visible = Less attackable                              │
│                                                                  │
│  4. NETWORK CONTROL                                             │
│     Control exactly which VNets/subnets can access              │
│     Use NSGs to further restrict traffic                        │
│     Full audit trail of who accessed what                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Service Endpoint vs Private Endpoint

```
┌─────────────────────────────┬─────────────────────────────────┐
│  Service Endpoint            │  Private Endpoint               │
├─────────────────────────────┼─────────────────────────────────┤
│  Traffic stays on Azure     │  Traffic stays on Azure         │
│  backbone (not internet)    │  backbone (not internet)        │
│                             │                                 │
│  Service keeps PUBLIC IP    │  Service gets PRIVATE IP        │
│  (still has public address) │  (IP in YOUR VNet)              │
│                             │                                 │
│  Access restricted to       │  Access via private IP only     │
│  specific VNets/subnets     │  (like any VM in your VNet)    │
│                             │                                 │
│  Free                       │  ~$7.30/month + data            │
│                             │                                 │
│  Configured on SUBNET       │  Creates a NIC in your VNet    │
│  (enable on subnet)         │  (gets its own IP address)     │
│                             │                                 │
│  Source IP: Public IP of    │  Source IP: Private IP of       │
│  the VNet (NAT'd)          │  the VM (original)              │
│                             │                                 │
│  DNS: Same public URL       │  DNS: Needs Private DNS Zone   │
│  (no DNS changes)           │  (resolves to private IP)      │
│                             │                                 │
│  Works with: Storage, SQL,  │  Works with: Almost ALL Azure  │
│  Key Vault, Service Bus,    │  services (100+ supported)     │
│  Cosmos DB, etc.            │                                 │
│                             │                                 │
│  Good for: Quick security   │  Good for: Full lockdown,      │
│  improvement, free          │  compliance, zero public access │
│                             │                                 │
│  ⚠️ Public IP still exists │  ✅ Can disable public access   │
│  (just restricted)          │  completely                     │
└─────────────────────────────┴─────────────────────────────────┘
```

### Visual Comparison

```
DEFAULT (No Endpoint):
  VM (10.0.1.4) ──→ Internet ──→ Storage (52.x.x.x public)
  ❌ Traffic goes through public internet

SERVICE ENDPOINT:
  VM (10.0.1.4) ──→ Azure Backbone ──→ Storage (52.x.x.x public)
  ✅ Traffic stays on Azure backbone
  ⚠️ Storage still has public IP (but restricted to your VNet)

PRIVATE ENDPOINT:
  VM (10.0.1.4) ──→ VNet ──→ Storage (10.0.2.5 PRIVATE)
  ✅ Traffic stays in your VNet
  ✅ Storage has private IP (no public exposure)
  ✅ Can disable public access completely
```

---

## Lab 1: Setup

### Step 1: Create Resource Group

```
1. Azure Portal → Search "Resource groups" → "+ Create"
2. Name: rg-day36-endpoints
3. Region: East US
4. Click "Review + create" → "Create"
```

### Step 2: Create Virtual Network

```
1. Search "Virtual networks" → "+ Create"
2. Fill in:
   - Resource group: rg-day36-endpoints
   - Name: vnet-day36
   - Region: East US
   
   IP Addresses:
   - Address space: 10.0.0.0/16
   - Delete default subnet
   - Add subnet: subnet-vms, 10.0.1.0/24
   - Add subnet: subnet-endpoints, 10.0.2.0/24

3. Click "Review + create" → "Create"
```

### Step 3: Create Test VM

```
1. Search "Virtual machines" → "+ Create"
2. Fill in:
   - Resource group: rg-day36-endpoints
   - Name: vm-test
   - Region: East US
   - Image: Ubuntu Server 22.04 LTS
   - Size: Standard_B1s
   - Authentication: Password
   - Username: azureuser
   - Password: Day36End@2026
   - Public inbound ports: Allow SSH (22)
   
   Networking:
   - Virtual network: vnet-day36
   - Subnet: subnet-vms (10.0.1.0/24)
   - Public IP: Create new

3. Click "Review + create" → "Create"
```

### Step 4: Create Storage Account

```
1. Search "Storage accounts" → "+ Create"
2. Fill in:
   - Resource group: rg-day36-endpoints
   - Name: stday36endpoint (globally unique)
   - Region: East US
   - Performance: Standard
   - Redundancy: LRS
3. Click "Review + create" → "Create"
```

### Step 5: Upload Test Data to Storage

```
1. Go to stday36endpoint → Containers → "+ Container"
   - Name: test-data
   - Access level: Private
   - Click "Create"
2. Click into test-data → Upload a small text file
```

### Step 6: Test, Check, and Confirm - Setup

```
1. VNet: vnet-day36 with 2 subnets ✅
2. VM: vm-test running in subnet-vms ✅
3. Storage: stday36endpoint with test-data container ✅
```

**✅ Result**: Setup complete!

---

## Lab 2: Service Endpoint for Storage

### What We'll Do

```
Enable Service Endpoint on subnet-vms for Storage.
Then restrict the Storage Account to only accept traffic
from that subnet.

Before: VM → Internet → Storage (public path)
After:  VM → Azure backbone → Storage (private path, restricted)
```

### Step 1: Check Current Access (Before Service Endpoint)

```bash
# SSH into vm-test
ssh azureuser@<VM-PUBLIC-IP>

# Try to resolve storage DNS
nslookup stday36endpoint.blob.core.windows.net
# Returns: PUBLIC IP (e.g., 52.x.x.x)
# ✅ Storage resolves to public IP

# Try to list blobs (install Azure CLI first)
curl -s https://stday36endpoint.blob.core.windows.net/test-data?restype=container&comp=list
# Returns: AuthenticationFailed (expected, no auth)
# But the point is: the connection REACHES the storage
# ✅ Storage is reachable from internet

exit
```

### Step 2: Enable Service Endpoint on Subnet

```
1. Go to vnet-day36 → Subnets
2. Click "subnet-vms"
3. Under "Service endpoints":
   - Click the dropdown
   - Select: Microsoft.Storage ✅
4. Click "Save"

⏱️ Wait: 30 seconds

What this does:
  subnet-vms now has a "fast lane" to Azure Storage.
  Traffic from this subnet to Storage goes through
  Azure backbone instead of public internet.
```

### Step 3: Restrict Storage to VNet Only

```
1. Go to stday36endpoint
2. Left menu → "Networking"
3. Under "Firewalls and virtual networks":
   - Public network access: Enabled from selected virtual networks and IP addresses
   - Virtual networks: Click "+ Add existing virtual network"
     - Virtual network: vnet-day36
     - Subnets: subnet-vms ✅
     - Click "Add"
   - Firewall (IP addresses): Add your current IP
     (so you can still access from Portal)
     Check "Add your client IP address" ✅
4. Click "Save"

⏱️ Wait: 30 seconds
```

### Step 4: Test Service Endpoint

```bash
# SSH into vm-test (in subnet-vms)
ssh azureuser@<VM-PUBLIC-IP>

# DNS still resolves to public IP
nslookup stday36endpoint.blob.core.windows.net
# Returns: 52.x.x.x (public IP, same as before)
# ✅ DNS unchanged (Service Endpoint doesn't change DNS)

# But traffic now goes through Azure backbone!
# The storage account accepts traffic from this subnet.

exit
```

```
From a DIFFERENT network (e.g., a VM NOT in subnet-vms):
  Access to stday36endpoint → ❌ BLOCKED
  "This request is not authorized to perform this operation"
  
  ✅ Storage only accepts traffic from subnet-vms!
```

### Step 5: Verify Service Endpoint

```
1. Go to vnet-day36 → Subnets → subnet-vms
2. Verify:
   ✅ Service endpoints: Microsoft.Storage

3. Go to stday36endpoint → Networking
4. Verify:
   ✅ Virtual networks: vnet-day36/subnet-vms
   ✅ Public access: Selected networks only
```

### Step 6: Test, Check, and Confirm

**Test 1: Service Endpoint Enabled**

```
vnet-day36 → Subnets → subnet-vms
  ✅ Service endpoints: Microsoft.Storage
```

**Test 2: Storage Restricted**

```
stday36endpoint → Networking
  ✅ Access: Selected virtual networks
  ✅ vnet-day36/subnet-vms listed
```

**Test 3: DNS Unchanged**

```
nslookup stday36endpoint.blob.core.windows.net
  ✅ Still resolves to public IP
  (Service Endpoint doesn't change DNS)
```

**Test 4: Access from Allowed Subnet**

```
From vm-test (in subnet-vms):
  ✅ Can access storage
```

**Test 5: Access from Other Networks Blocked**

```
From outside the VNet:
  ❌ Access denied (unless IP is in firewall list)
```

**✅ Result**: Service Endpoint working!

---

## Lab 3: Private Endpoint for Storage

### What We'll Do

```
Create a Private Endpoint for the Storage Account.
This gives Storage a PRIVATE IP in your VNet.

Before: Storage only has public IP (52.x.x.x)
After:  Storage also has private IP (10.0.2.x)

VM → 10.0.2.x (private, never leaves VNet!)
```

### Step 1: Create Private Endpoint

```
1. Go to stday36endpoint
2. Left menu → "Networking"
3. Click "Private endpoint connections" tab
4. Click "+ Private endpoint"
5. Fill in:

   Basics:
   - Resource group: rg-day36-endpoints
   - Name: pe-storage-day36
   - Network Interface Name: pe-storage-day36-nic
   - Region: East US

   Resource:
   - Target sub-resource: blob
     (Storage has multiple sub-resources: blob, file, table, queue)
     (We're creating endpoint for blob storage)

   Virtual Network:
   - Virtual network: vnet-day36
   - Subnet: subnet-endpoints (10.0.2.0/24)
   - Private IP configuration: Dynamically allocate IP address

   DNS:
   - Integrate with private DNS zone: Yes
   - Private DNS zone: (auto-creates)
     privatelink.blob.core.windows.net
   
6. Click "Review + create" → "Create"
```

**⏱️ Wait**: 1-2 minutes

### Step 2: Check the Private IP

```
1. Go to pe-storage-day36 (the private endpoint)
2. Overview → Note the Private IP address
   Example: 10.0.2.4

3. Or go to: pe-storage-day36 → DNS configuration
   You'll see:
   stday36endpoint.blob.core.windows.net → 10.0.2.4
   
   ✅ Storage now has a private IP in your VNet!
```

### Step 3: Test DNS Resolution (Private vs Public)

```bash
# SSH into vm-test
ssh azureuser@<VM-PUBLIC-IP>

# Resolve storage DNS
nslookup stday36endpoint.blob.core.windows.net

# Expected output:
# Name: stday36endpoint.privatelink.blob.core.windows.net
# Address: 10.0.2.4
#
# ✅ DNS now resolves to PRIVATE IP (10.0.2.4)!
# ✅ Not the public IP anymore!
# ✅ This is because of the Private DNS Zone

exit
```

```
From OUTSIDE the VNet (your laptop):
  nslookup stday36endpoint.blob.core.windows.net
  # Still resolves to public IP (52.x.x.x)
  # ✅ Only VMs in the VNet see the private IP
```

### Step 4: Understand What Happened

```
┌──────────────────────────────────────────────────────────────┐
│  WHAT PRIVATE ENDPOINT CREATED                                │
│                                                               │
│  1. Network Interface (NIC):                                 │
│     pe-storage-day36-nic                                     │
│     IP: 10.0.2.4 (in subnet-endpoints)                      │
│     This NIC is the "door" to the storage account            │
│                                                               │
│  2. Private DNS Zone:                                        │
│     privatelink.blob.core.windows.net                        │
│     Record: stday36endpoint → 10.0.2.4                       │
│     Linked to: vnet-day36                                    │
│                                                               │
│  3. DNS Resolution Flow:                                     │
│     VM asks: "Where is stday36endpoint.blob.core...?"        │
│     Azure DNS: "Check private DNS zone first"                │
│     Private DNS: "It's at 10.0.2.4"                          │
│     VM connects to: 10.0.2.4 (private, in VNet!)            │
│                                                               │
│  Traffic flow:                                               │
│  VM (10.0.1.4) → VNet → NIC (10.0.2.4) → Storage           │
│  Never leaves the VNet! Never touches the internet!          │
└──────────────────────────────────────────────────────────────┘
```

### Step 5: Test, Check, and Confirm

**Test 1: Private Endpoint Created**

```
1. stday36endpoint → Networking → Private endpoint connections
   ✅ pe-storage-day36: Approved
   ✅ Connection state: Approved
```

**Test 2: Private IP Assigned**

```
1. pe-storage-day36 → Overview
   ✅ Private IP: 10.0.2.x
   ✅ Subnet: subnet-endpoints
```

**Test 3: DNS Resolves to Private IP (from VNet)**

```
From vm-test:
  nslookup stday36endpoint.blob.core.windows.net
  ✅ Address: 10.0.2.4 (private!)
```

**Test 4: DNS Resolves to Public IP (from outside)**

```
From your laptop:
  nslookup stday36endpoint.blob.core.windows.net
  ✅ Address: 52.x.x.x (public, as expected)
```

**Test 5: Private DNS Zone**

```
1. Search "Private DNS zones"
2. Find: privatelink.blob.core.windows.net
   ✅ Record: stday36endpoint → 10.0.2.4
   ✅ Virtual network link: vnet-day36
```

**✅ Result**: Private Endpoint for Storage working!

---

## Lab 4: Private Endpoint for Azure SQL

### Step 1: Create Azure SQL Database

```
1. Search "SQL databases" → "+ Create"
2. Fill in:
   - Resource group: rg-day36-endpoints
   - Database name: db-day36-test
   - Server: Create new
     - Server name: sql-day36-endpoint (globally unique)
     - Location: East US
     - Authentication: SQL authentication
     - Admin login: sqladmin
     - Password: Day36SQL@2026
     - Click "OK"
   - Compute + storage: Basic (5 DTUs, cheapest)
   
   Networking:
   - Connectivity method: No access
     (We'll add private endpoint only!)
   
3. Click "Review + create" → "Create"
```

**⏱️ Wait**: 3-5 minutes

### Step 2: Create Private Endpoint for SQL

```
1. Go to SQL server: sql-day36-endpoint
2. Left menu → "Networking"
3. Click "Private endpoint connections" tab
4. Click "+ Private endpoint"
5. Fill in:

   Basics:
   - Name: pe-sql-day36
   - Region: East US

   Resource:
   - Target sub-resource: sqlServer

   Virtual Network:
   - Virtual network: vnet-day36
   - Subnet: subnet-endpoints

   DNS:
   - Integrate with private DNS zone: Yes
   - Zone: privatelink.database.windows.net

6. Click "Review + create" → "Create"
```

**⏱️ Wait**: 1-2 minutes

### Step 3: Test SQL Private Endpoint

```bash
# SSH into vm-test
ssh azureuser@<VM-PUBLIC-IP>

# Resolve SQL DNS
nslookup sql-day36-endpoint.database.windows.net

# Expected:
# Name: sql-day36-endpoint.privatelink.database.windows.net
# Address: 10.0.2.5 (private IP!)
# ✅ SQL resolves to private IP!

# Install SQL tools and test connection
sudo apt install -y mssql-tools unixodbc-dev
# (Accept license terms)

# Connect to SQL via private endpoint
sqlcmd -S sql-day36-endpoint.database.windows.net -U sqladmin -P 'Day36SQL@2026' -Q "SELECT 'Private Endpoint Works!' AS Result"

# Expected:
# Result
# -------------------------
# Private Endpoint Works!
# ✅ Connected via private endpoint!

exit
```

### Step 4: Test, Check, and Confirm

**Test 1: SQL Private Endpoint**

```
sql-day36-endpoint → Networking → Private endpoint connections
  ✅ pe-sql-day36: Approved
```

**Test 2: DNS Resolution**

```
From vm-test:
  nslookup sql-day36-endpoint.database.windows.net
  ✅ Resolves to 10.0.2.x (private)
```

**Test 3: SQL Connection**

```
From vm-test:
  sqlcmd -S sql-day36-endpoint.database.windows.net ...
  ✅ Connection successful via private IP
```

**Test 4: No Public Access**

```
From outside VNet:
  SQL connection → ❌ Connection refused
  ✅ SQL only accessible via private endpoint
```

**✅ Result**: Private Endpoint for SQL working!

---

## Lab 5: Private DNS Zones

### What is a Private DNS Zone?

```
┌──────────────────────────────────────────────────────────────┐
│  PRIVATE DNS ZONE EXPLAINED                                   │
│                                                               │
│  Problem:                                                    │
│  Storage URL: stday36endpoint.blob.core.windows.net          │
│  This normally resolves to PUBLIC IP (52.x.x.x)             │
│  But we want VMs to connect to PRIVATE IP (10.0.2.4)        │
│                                                               │
│  Solution: Private DNS Zone                                  │
│  A special DNS zone that overrides public DNS                │
│  ONLY for VMs in linked VNets                                │
│                                                               │
│  Zone: privatelink.blob.core.windows.net                     │
│  Record: stday36endpoint → 10.0.2.4                          │
│  Linked to: vnet-day36                                       │
│                                                               │
│  How it works:                                               │
│  1. VM asks DNS: "Where is stday36endpoint.blob...?"         │
│  2. Azure DNS checks: "Is there a private DNS zone?"         │
│  3. Yes! Zone says: "stday36endpoint → 10.0.2.4"            │
│  4. VM connects to 10.0.2.4 (private!)                       │
│                                                               │
│  From outside VNet:                                          │
│  1. Laptop asks DNS: "Where is stday36endpoint.blob...?"     │
│  2. Public DNS: "52.x.x.x" (no private zone applies)        │
│  3. Laptop connects to 52.x.x.x (public)                    │
│                                                               │
│  ✅ Same URL, different IP depending on where you are!       │
└──────────────────────────────────────────────────────────────┘
```

### Step 1: View Private DNS Zones

```
1. Azure Portal → Search "Private DNS zones"
2. You should see zones auto-created by Private Endpoints:
   ├─ privatelink.blob.core.windows.net (for Storage)
   └─ privatelink.database.windows.net (for SQL)
```

### Step 2: Explore Storage DNS Zone

```
1. Click "privatelink.blob.core.windows.net"
2. Overview → You'll see DNS records:
   
   Name: stday36endpoint
   Type: A
   Value: 10.0.2.4
   
   ✅ This record maps the storage name to private IP

3. Left menu → "Virtual network links"
4. You'll see:
   ✅ Link to vnet-day36
   ✅ Auto-registration: Disabled (for private endpoints)
   
   This link means: VMs in vnet-day36 use this DNS zone
```

### Step 3: Explore SQL DNS Zone

```
1. Click "privatelink.database.windows.net"
2. Overview → DNS records:
   
   Name: sql-day36-endpoint
   Type: A
   Value: 10.0.2.5
   
   ✅ SQL server maps to private IP

3. Virtual network links:
   ✅ Link to vnet-day36
```

### Step 4: Link DNS Zone to Another VNet (If Needed)

```
If you have another VNet that also needs to resolve private IPs:

1. Go to the Private DNS zone
2. Left menu → "Virtual network links"
3. Click "+ Add"
4. Fill in:
   - Link name: link-to-other-vnet
   - Virtual network: Select the other VNet
   - Enable auto registration: No
5. Click "OK"

Now VMs in that VNet also resolve to private IPs!
```

### Step 5: Test, Check, and Confirm

**Test 1: DNS Zones Exist**

```
Private DNS zones:
  ✅ privatelink.blob.core.windows.net
  ✅ privatelink.database.windows.net
```

**Test 2: A Records Correct**

```
blob zone: stday36endpoint → 10.0.2.4 ✅
sql zone: sql-day36-endpoint → 10.0.2.5 ✅
```

**Test 3: VNet Links**

```
Both zones linked to vnet-day36 ✅
```

**Test 4: Resolution from VM**

```
From vm-test:
  nslookup stday36endpoint.blob.core.windows.net → 10.0.2.4 ✅
  nslookup sql-day36-endpoint.database.windows.net → 10.0.2.5 ✅
```

**✅ Result**: Private DNS Zones understood!

---

## Lab 6: Disable Public Access (Full Lockdown)

### What We'll Do

```
Now that we have Private Endpoints, we can COMPLETELY
disable public access. No one on the internet can reach
the storage account at all!

Before: Public access restricted to VNet (Service Endpoint)
After:  Public access DISABLED (Private Endpoint only)
```

### Step 1: Disable Public Access on Storage

```
1. Go to stday36endpoint → Networking
2. Under "Firewalls and virtual networks":
   - Public network access: Disabled
3. Click "Save"

Now:
  ✅ From vm-test (via private endpoint): Can access
  ❌ From internet: Cannot access AT ALL
  ❌ From Azure Portal: Cannot browse blobs!
     (Portal accesses via internet too)
```

### Step 2: Test Full Lockdown

```bash
# From vm-test (inside VNet):
ssh azureuser@<VM-PUBLIC-IP>

nslookup stday36endpoint.blob.core.windows.net
# → 10.0.2.4 (private IP) ✅

# Install Azure CLI to test
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
az login --use-device-code

# List blobs
az storage blob list --account-name stday36endpoint --container-name test-data --auth-mode login -o table
# ✅ Works! (via private endpoint)

exit
```

```
From your laptop (internet):
  az storage blob list --account-name stday36endpoint --container-name test-data
  # ❌ "Public network access is disabled"
  # ✅ Correct! Fully locked down.
```

### Step 3: Re-enable Portal Access (Optional)

```
If you need Portal access for management:

1. stday36endpoint → Networking
2. Public network access: Enabled from selected virtual networks and IP addresses
3. Add your client IP address ✅
4. Save

Now Portal works again, but only from your IP.
```

### Step 4: Test, Check, and Confirm

**Test 1: Public Access Disabled**

```
stday36endpoint → Networking
  ✅ Public network access: Disabled
```

**Test 2: Private Endpoint Still Works**

```
From vm-test:
  az storage blob list ... → ✅ Works
```

**Test 3: Internet Access Blocked**

```
From laptop:
  az storage blob list ... → ❌ Blocked
  ✅ Full lockdown confirmed
```

**✅ Result**: Storage fully locked down with Private Endpoint only!

---

## When to Use Which

```
┌──────────────────────────────────────────────────────────────────┐
│  DECISION GUIDE                                                   │
│                                                                   │
│  Need to secure Azure service access?                            │
│  │                                                                │
│  ├─ Quick, free, basic security?                                 │
│  │   → SERVICE ENDPOINT                                          │
│  │   ✅ Free                                                     │
│  │   ✅ Easy (enable on subnet + restrict service)               │
│  │   ⚠️ Public IP still exists                                  │
│  │   Best for: Dev/test, quick security improvement              │
│  │                                                                │
│  ├─ Full lockdown, compliance, no public access?                 │
│  │   → PRIVATE ENDPOINT                                          │
│  │   ✅ Private IP in your VNet                                  │
│  │   ✅ Can disable public access completely                     │
│  │   ✅ Works with 100+ Azure services                           │
│  │   💰 ~$7.30/month per endpoint                               │
│  │   Best for: Production, compliance, enterprise                │
│  │                                                                │
│  └─ Both?                                                        │
│      → You CAN use both together!                                │
│      Service Endpoint for general VNet access                    │
│      Private Endpoint for specific critical services             │
│                                                                   │
│  Common pattern in production:                                   │
│  ├─ Storage Account: Private Endpoint (sensitive data)           │
│  ├─ SQL Database: Private Endpoint (critical data)               │
│  ├─ Key Vault: Private Endpoint (secrets)                        │
│  ├─ Service Bus: Service Endpoint (less sensitive)               │
│  └─ Cosmos DB: Private Endpoint (customer data)                  │
└──────────────────────────────────────────────────────────────────┘
```

### Supported Services

```
SERVICE ENDPOINTS support:
  ├─ Azure Storage
  ├─ Azure SQL Database
  ├─ Azure Cosmos DB
  ├─ Azure Key Vault
  ├─ Azure Service Bus
  ├─ Azure Event Hubs
  ├─ Azure App Service
  └─ ~15 services total

PRIVATE ENDPOINTS support:
  ├─ Azure Storage (blob, file, table, queue)
  ├─ Azure SQL Database
  ├─ Azure Cosmos DB
  ├─ Azure Key Vault
  ├─ Azure Service Bus
  ├─ Azure Event Hubs
  ├─ Azure Container Registry
  ├─ Azure Kubernetes Service
  ├─ Azure App Service
  ├─ Azure Functions
  ├─ Azure Cache for Redis
  ├─ Azure Search
  ├─ Azure Monitor
  └─ 100+ services total
```

---

## Complete Summary

```
┌─────────────────────────────────────────────────────────────────┐
│  DAY 36 - ENDPOINTS COMPLETE                                     │
│                                                                  │
│  Service Endpoint (Lab 2):                                      │
│  ├─ Enabled on subnet-vms for Microsoft.Storage                 │
│  ├─ Storage restricted to VNet only                             │
│  ├─ Traffic via Azure backbone (not internet)                   │
│  ├─ Free, easy to set up                                        │
│  └─ ⚠️ Public IP still exists                                  │
│                                                                  │
│  Private Endpoint - Storage (Lab 3):                            │
│  ├─ pe-storage-day36 in subnet-endpoints                        │
│  ├─ Private IP: 10.0.2.4                                       │
│  ├─ DNS: stday36endpoint → 10.0.2.4 (from VNet)               │
│  └─ ✅ Can disable public access completely                    │
│                                                                  │
│  Private Endpoint - SQL (Lab 4):                                │
│  ├─ pe-sql-day36 in subnet-endpoints                            │
│  ├─ Private IP: 10.0.2.5                                       │
│  ├─ DNS: sql-day36-endpoint → 10.0.2.5 (from VNet)            │
│  └─ ✅ SQL only accessible via private endpoint                │
│                                                                  │
│  Private DNS Zones (Lab 5):                                     │
│  ├─ privatelink.blob.core.windows.net                           │
│  └─ privatelink.database.windows.net                            │
│                                                                  │
│  Full Lockdown (Lab 6):                                         │
│  └─ Public access disabled, private endpoint only               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Cleanup

```
1. Delete Resource Group:
   - Resource groups → rg-day36-endpoints → Delete
   - Type name to confirm → Delete

2. Delete Private DNS Zones (if not auto-deleted):
   - Search "Private DNS zones"
   - Delete: privatelink.blob.core.windows.net
   - Delete: privatelink.database.windows.net

Note: Private DNS zones may be in a different resource group
or may persist after RG deletion. Check and delete manually.
```

**⏱️ Wait**: 5-10 minutes

**✅ Result**: All resources deleted!

---

## Quick Reference

### Service Endpoint Setup

```
1. VNet → Subnets → Select subnet
2. Service endpoints → Add Microsoft.Storage (or other)
3. Save

4. Storage → Networking → Selected virtual networks
5. Add the VNet/subnet
6. Save
```

### Private Endpoint Setup

```
1. Go to the Azure service (Storage, SQL, etc.)
2. Networking → Private endpoint connections
3. "+ Private endpoint"
4. Select: Resource, VNet, Subnet
5. Enable Private DNS zone integration
6. Create

7. (Optional) Disable public access on the service
```

### Useful Links

- [Service Endpoints](https://learn.microsoft.com/azure/virtual-network/virtual-network-service-endpoints-overview)
- [Private Endpoints](https://learn.microsoft.com/azure/private-link/private-endpoint-overview)
- [Private DNS Zones](https://learn.microsoft.com/azure/dns/private-dns-overview)
- [Private Link Pricing](https://azure.microsoft.com/pricing/details/private-link/)

---

**🎉 Congratulations!** You've completed Day 36 covering Azure Service Endpoints, Private Endpoints, Private DNS Zones, and full lockdown patterns!