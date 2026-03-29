# Day 32: Azure Load Balancer - Every Scenario Explained & Lab

## What You'll Learn

Understand EVERY Load Balancer scenario with hands-on labs:
- ✅ What is Azure Load Balancer and why use it
- ✅ Standard LB vs Basic LB vs Application Gateway
- ✅ Scenario 1: Same VNet, Same Subnet (most common)
- ✅ Scenario 2: Same VNet, Different Subnets
- ✅ Scenario 3: Same Region, Different VNets (via peering)
- ✅ Scenario 4: Different Regions (Cross-Region LB)
- ✅ Complete "Can I do this?" matrix
- ✅ Test, check, and confirm every scenario

## Table of Contents

1. [What is a Load Balancer?](#what-is-a-load-balancer)
2. [Why Use a Load Balancer?](#why-use-a-load-balancer)
3. [LB Types and the "Can I?" Matrix](#lb-types-and-the-can-i-matrix)
4. [Lab 1: Setup - Create VMs](#lab-1-setup---create-vms)
5. [Lab 2: Same VNet, Same Subnet](#lab-2-same-vnet-same-subnet)
6. [Lab 3: Same VNet, Different Subnets](#lab-3-same-vnet-different-subnets)
7. [Lab 4: Same Region, Different VNets (Peered)](#lab-4-same-region-different-vnets-peered)
8. [Lab 5: Different Regions (Cross-Region LB)](#lab-5-different-regions-cross-region-lb)
9. [Lab 6: Internal Load Balancer](#lab-6-internal-load-balancer)
10. [Cleanup](#cleanup)

---

## What is a Load Balancer?

**Load Balancer** = Distributes incoming traffic across multiple VMs so no single VM gets overwhelmed.

### Simple Explanation

```
Without Load Balancer:
  All users → 1 VM
  1000 users → VM crashes! 💥

  User 1 ──→ ┌──────┐
  User 2 ──→ │ VM-1 │ ← Overloaded! 💥
  User 3 ──→ │      │
  ...        └──────┘
  User 1000→

With Load Balancer:
  All users → Load Balancer → Spread across 3 VMs
  1000 users → Each VM handles ~333 users ✅

  User 1 ──→ ┌────┐    ┌──────┐
  User 2 ──→ │    │───→│ VM-1 │ ~333 users
  User 3 ──→ │ LB │───→│ VM-2 │ ~333 users
  ...        │    │───→│ VM-3 │ ~333 users
  User 1000→ └────┘    └──────┘
```

### Load Balancer Components

```
┌─────────────────────────────────────────────────────────────────┐
│  LOAD BALANCER COMPONENTS                                        │
│                                                                  │
│  1. Frontend IP                                                 │
│     The IP address users connect to                             │
│     Public IP (internet-facing) or Private IP (internal)        │
│                                                                  │
│  2. Backend Pool                                                │
│     The group of VMs that receive traffic                       │
│     Can be VMs, VM Scale Sets, or IP addresses                  │
│                                                                  │
│  3. Health Probe                                                │
│     Checks if VMs are healthy                                   │
│     Unhealthy VM → LB stops sending traffic to it              │
│                                                                  │
│  4. Load Balancing Rule                                         │
│     Maps frontend port to backend port                          │
│     Example: Frontend port 80 → Backend port 80                │
│     Defines which backend pool and health probe to use          │
│                                                                  │
│  Flow:                                                          │
│  User → Frontend IP:80 → LB Rule → Health Check → Backend VM  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Why Use a Load Balancer?

```
┌─────────────────────────────────────────────────────────────────┐
│  WHY LOAD BALANCER?                                              │
│                                                                  │
│  1. HIGH AVAILABILITY                                           │
│     VM-1 goes down → LB sends traffic to VM-2 and VM-3        │
│     Users don't notice! Zero downtime.                          │
│                                                                  │
│  2. SCALABILITY                                                 │
│     Traffic increases → Add more VMs to backend pool            │
│     LB automatically distributes to new VMs                     │
│                                                                  │
│  3. PERFORMANCE                                                 │
│     Spread load evenly across VMs                               │
│     No single VM becomes a bottleneck                           │
│                                                                  │
│  4. HEALTH MONITORING                                           │
│     LB checks VM health every few seconds                       │
│     Unhealthy VM automatically removed from rotation            │
│     When VM recovers, automatically added back                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## LB Types and the "Can I?" Matrix

### Azure Load Balancer Types

```
┌──────────────────┬──────────────────┬──────────────────────────┐
│                   │  Standard LB     │  Basic LB (legacy)       │
├──────────────────┼──────────────────┼──────────────────────────┤
│  Backend pool    │  IP-based or     │  NIC-based only          │
│                  │  NIC-based       │  (same VNet only)        │
│  Cross-VNet      │  ✅ Yes (IP)     │  ❌ No                   │
│  Cross-Region    │  ✅ Yes (Global) │  ❌ No                   │
│  Availability    │  Zone-redundant  │  No zone support         │
│  zones           │                  │                          │
│  Health probes   │  HTTPS probe     │  HTTP/TCP only           │
│  SLA             │  99.99%          │  No SLA                  │
│  Cost            │  ~$18/month +    │  Free                    │
│                  │  data processing │                          │
│  Recommended     │  ✅ YES          │  ❌ Being retired        │
└──────────────────┴──────────────────┴──────────────────────────┘
```

### THE BIG QUESTION: "Can I attach VMs from...?"

```
┌─────────────────────────────────────────────────────────────────┐
│  "CAN I?" MATRIX - Standard Load Balancer                        │
│                                                                  │
│  ┌─────────────────────────────┬──────┬─────────────────────┐   │
│  │ Scenario                    │ Can? │ How?                │   │
│  ├─────────────────────────────┼──────┼─────────────────────┤   │
│  │ Same VNet, Same Subnet      │  ✅  │ NIC or IP backend   │   │
│  │                             │      │ (easiest)           │   │
│  ├─────────────────────────────┼──────┼─────────────────────┤   │
│  │ Same VNet, Different Subnet │  ✅  │ NIC or IP backend   │   │
│  │                             │      │ (same as above)     │   │
│  ├─────────────────────────────┼──────┼─────────────────────┤   │
│  │ Same Region, Different VNet │  ✅  │ IP-based backend    │   │
│  │ (with VNet Peering)         │      │ + VNet peering      │   │
│  ├─────────────────────────────┼──────┼─────────────────────┤   │
│  │ Same Region, Different VNet │  ❌  │ Must peer VNets     │   │
│  │ (NO peering)                │      │ first!              │   │
│  ├─────────────────────────────┼──────┼─────────────────────┤   │
│  │ Different Region            │  ✅  │ Cross-Region LB     │   │
│  │                             │      │ (Global tier)       │   │
│  ├─────────────────────────────┼──────┼─────────────────────┤   │
│  │ Different Subscription      │  ✅  │ IP-based backend    │   │
│  │ (same tenant)               │      │ + peering           │   │
│  └─────────────────────────────┴──────┴─────────────────────┘   │
│                                                                  │
│  KEY INSIGHT:                                                   │
│  Standard LB with IP-based backend pool can reach ANY VM        │
│  that has network connectivity (via VNet or peering).           │
│                                                                  │
│  The LB itself lives in ONE VNet, but its backend pool          │
│  can include IPs from peered VNets!                             │
└─────────────────────────────────────────────────────────────────┘
```

### Backend Pool Types

```
┌──────────────────────────────────────────────────────────────┐
│  BACKEND POOL TYPES                                           │
│                                                               │
│  1. NIC-based (traditional):                                 │
│     Add VMs by selecting their Network Interface              │
│     ✅ Same VNet only                                        │
│     ✅ Easy to set up                                        │
│     ❌ Cannot cross VNet boundaries                          │
│                                                               │
│  2. IP-based (modern, flexible):                             │
│     Add VMs by their IP address                              │
│     ✅ Same VNet                                             │
│     ✅ Different VNets (with peering)                        │
│     ✅ Different subscriptions                               │
│     ✅ Cross any boundary with connectivity                  │
│                                                               │
│  💡 Use IP-based for maximum flexibility!                    │
└──────────────────────────────────────────────────────────────┘
```

---

## Lab 1: Setup - Create VMs

### What We'll Build

```
┌──────────────────────────────────────────────────────────────┐
│  SETUP: VMs in different locations for all scenarios          │
│                                                               │
│  VNet-A (10.0.0.0/16) - East US                             │
│  ├─ Subnet-1 (10.0.1.0/24):                                 │
│  │   ├─ vm-a1 (10.0.1.4) - nginx "VM-A1 Subnet-1"         │
│  │   └─ vm-a2 (10.0.1.5) - nginx "VM-A2 Subnet-1"         │
│  └─ Subnet-2 (10.0.2.0/24):                                 │
│      └─ vm-a3 (10.0.2.4) - nginx "VM-A3 Subnet-2"         │
│                                                               │
│  VNet-B (10.1.0.0/16) - East US (different VNet!)           │
│  └─ Subnet-1 (10.1.1.0/24):                                 │
│      └─ vm-b1 (10.1.1.4) - nginx "VM-B1 VNet-B"           │
│                                                               │
│  VNet-C (10.2.0.0/16) - West Europe (different region!)     │
│  └─ Subnet-1 (10.2.1.0/24):                                 │
│      └─ vm-c1 (10.2.1.4) - nginx "VM-C1 West Europe"      │
└──────────────────────────────────────────────────────────────┘
```

### Step 1: Create Resource Group

```
1. Azure Portal → Search "Resource groups" → "+ Create"
2. Name: rg-day32-lb
3. Region: East US
4. Click "Review + create" → "Create"
```

### Step 2: Create VNet-A (East US, 2 Subnets)

```
1. Search "Virtual networks" → "+ Create"
2. Fill in:
   - Resource group: rg-day32-lb
   - Name: vnet-a
   - Region: East US
   
   IP Addresses:
   - Address space: 10.0.0.0/16
   - Delete default subnet
   - Add subnet: Subnet-1, 10.0.1.0/24
   - Add subnet: Subnet-2, 10.0.2.0/24

3. Click "Review + create" → "Create"
```

### Step 3: Create VNet-B (East US, Different VNet)

```
1. Virtual networks → "+ Create"
   - Resource group: rg-day32-lb
   - Name: vnet-b
   - Region: East US
   - Address space: 10.1.0.0/16
   - Subnet: Subnet-1, 10.1.1.0/24
2. Create
```

### Step 4: Create VNet-C (West Europe, Different Region)

```
1. Virtual networks → "+ Create"
   - Resource group: rg-day32-lb
   - Name: vnet-c
   - Region: West Europe ← DIFFERENT REGION!
   - Address space: 10.2.0.0/16
   - Subnet: Subnet-1, 10.2.1.0/24
2. Create
```

### Step 5: Create VMs

Create 5 VMs. For each VM use these common settings:
```
- Image: Ubuntu Server 22.04 LTS
- Size: Standard_B1s
- Authentication: Password
- Username: azureuser
- Password: Day32LB@2026
- Public inbound ports: Allow SSH (22) and HTTP (80)
```

**VM-A1:**
```
Name: vm-a1, Region: East US, VNet: vnet-a, Subnet: Subnet-1
Public IP: None (LB will provide access)
```

**VM-A2:**
```
Name: vm-a2, Region: East US, VNet: vnet-a, Subnet: Subnet-1
Public IP: None
```

**VM-A3:**
```
Name: vm-a3, Region: East US, VNet: vnet-a, Subnet: Subnet-2
Public IP: None
```

**VM-B1:**
```
Name: vm-b1, Region: East US, VNet: vnet-b, Subnet: Subnet-1
Public IP: Create new (for initial SSH setup)
```

**VM-C1:**
```
Name: vm-c1, Region: West Europe, VNet: vnet-c, Subnet: Subnet-1
Public IP: Create new (for initial SSH setup)
```

**⏱️ Wait**: 3-5 minutes for all VMs

### Step 6: Install nginx on All VMs

For VMs with public IPs (vm-b1, vm-c1), SSH directly.
For VMs without public IPs (vm-a1, vm-a2, vm-a3), use Azure Serial Console or Bastion.

**Using Azure Serial Console (for VMs without public IP):**
```
1. Go to vm-a1 → Left menu → "Serial console"
2. Login: azureuser / Day32LB@2026
3. Run commands below
```

**Or temporarily add public IPs, SSH, then remove them.**

**On each VM, run:**

```bash
sudo apt update && sudo apt install -y nginx
```

Then set a unique page for each:

```bash
# On vm-a1:
sudo bash -c 'echo "<h1>VM-A1</h1><p>VNet-A, Subnet-1 (10.0.1.4)</p><p>East US</p>" > /var/www/html/index.html'

# On vm-a2:
sudo bash -c 'echo "<h1>VM-A2</h1><p>VNet-A, Subnet-1 (10.0.1.5)</p><p>East US</p>" > /var/www/html/index.html'

# On vm-a3:
sudo bash -c 'echo "<h1>VM-A3</h1><p>VNet-A, Subnet-2 (10.0.2.4)</p><p>East US</p>" > /var/www/html/index.html'

# On vm-b1:
sudo bash -c 'echo "<h1>VM-B1</h1><p>VNet-B, Subnet-1 (10.1.1.4)</p><p>East US</p>" > /var/www/html/index.html'

# On vm-c1:
sudo bash -c 'echo "<h1>VM-C1</h1><p>VNet-C, Subnet-1 (10.2.1.4)</p><p>West Europe</p>" > /var/www/html/index.html'
```

### Step 7: Test, Check, and Confirm - Setup

**Test 1: Verify All VMs Running**

```
1. Virtual machines → Verify all 5 VMs: Running ✅
```

**Test 2: Verify nginx on VMs with Public IP**

```
curl http://<vm-b1-PUBLIC-IP>  → "VM-B1" ✅
curl http://<vm-c1-PUBLIC-IP>  → "VM-C1" ✅
```

**✅ Result**: All VMs ready for load balancing!

---

## Lab 2: Same VNet, Same Subnet

### Scenario

```
THE MOST COMMON SCENARIO

LB and VMs all in the same VNet and same Subnet.

┌──────────────────────────────────────────────────────────────┐
│  VNet-A (10.0.0.0/16) - Subnet-1 (10.0.1.0/24)             │
│                                                               │
│  Internet → [LB: 20.x.x.x] → vm-a1 (10.0.1.4)             │
│                              → vm-a2 (10.0.1.5)             │
│                                                               │
│  ✅ Works! This is the standard setup.                       │
└──────────────────────────────────────────────────────────────┘
```

### Step 1: Create Load Balancer

```
1. Search "Load balancers" → "+ Create"
2. Fill in:

   Basics:
   - Resource group: rg-day32-lb
   - Name: lb-same-subnet
   - Region: East US
   - SKU: Standard
   - Type: Public
   - Tier: Regional

   Frontend IP configuration:
   - Click "+ Add a frontend IP configuration"
   - Name: frontend-public
   - IP version: IPv4
   - Public IP address: Create new
     - Name: pip-lb-same-subnet
     - SKU: Standard
     - Click "OK"
   - Click "Add"

   Backend pools:
   - Click "+ Add a backend pool"
   - Name: pool-same-subnet
   - Virtual network: vnet-a
   - Backend Pool Configuration: NIC
   - Click "+ Add" → Select vm-a1 and vm-a2
   - Click "Add"

   Inbound rules:
   - Click "+ Add a load balancing rule"
   - Name: rule-http
   - Frontend IP: frontend-public
   - Backend pool: pool-same-subnet
   - Protocol: TCP
   - Port: 80
   - Backend port: 80
   - Health probe: Create new
     - Name: probe-http
     - Protocol: HTTP
     - Port: 80
     - Path: /
     - Interval: 5 seconds
     - Click "OK"
   - Session persistence: None
   - Idle timeout: 4 minutes
   - Click "Add"

3. Click "Review + create" → "Create"
```

**⏱️ Wait**: 2-3 minutes

### Step 2: Test Load Balancing

```
1. Go to lb-same-subnet → Overview
2. Note the Frontend public IP address (e.g., 20.x.x.x)

3. Open browser or use curl:
   curl http://<LB-PUBLIC-IP>

   Run multiple times:
   curl http://<LB-PUBLIC-IP>  → "VM-A1" or "VM-A2"
   curl http://<LB-PUBLIC-IP>  → "VM-A2" or "VM-A1"
   curl http://<LB-PUBLIC-IP>  → "VM-A1" or "VM-A2"

   ✅ Traffic alternates between VM-A1 and VM-A2!
   ✅ Load balancing working!
```

### Step 3: Test Health Probe (Stop One VM)

```
1. Go to vm-a1 → Click "Stop"
2. Wait 30 seconds (health probe detects failure)
3. curl http://<LB-PUBLIC-IP>  → Always "VM-A2"
   curl http://<LB-PUBLIC-IP>  → Always "VM-A2"
   
   ✅ LB detected vm-a1 is down, sends ALL traffic to vm-a2!

4. Start vm-a1 again → Click "Start"
5. Wait 30 seconds
6. curl http://<LB-PUBLIC-IP>  → "VM-A1" or "VM-A2" again
   
   ✅ vm-a1 is back, LB includes it again!
```

### Step 4: Test, Check, and Confirm

**Test 1: LB Created**

```
1. Load balancers → lb-same-subnet
   ✅ SKU: Standard
   ✅ Type: Public
   ✅ Frontend IP: 20.x.x.x
```

**Test 2: Backend Pool**

```
1. lb-same-subnet → Backend pools → pool-same-subnet
   ✅ vm-a1: Healthy
   ✅ vm-a2: Healthy
```

**Test 3: Load Distribution**

```
Run 10 requests:
  for i in {1..10}; do curl -s http://<LB-IP> | grep -o "VM-A[12]"; done
  
  ✅ Mix of VM-A1 and VM-A2 responses
```

**Test 4: Failover**

```
Stop vm-a1 → All traffic to vm-a2 ✅
Start vm-a1 → Traffic distributed again ✅
```

**✅ SCENARIO 1 RESULT: Same VNet, Same Subnet = ✅ WORKS!**

---

## Lab 3: Same VNet, Different Subnets

### Scenario

```
LB in VNet-A, backend VMs in DIFFERENT subnets of the same VNet.

┌──────────────────────────────────────────────────────────────┐
│  VNet-A (10.0.0.0/16)                                        │
│                                                               │
│  Subnet-1 (10.0.1.0/24):                                    │
│  ├─ vm-a1 (10.0.1.4)                                        │
│  └─ vm-a2 (10.0.1.5)                                        │
│                                                               │
│  Subnet-2 (10.0.2.0/24):                                    │
│  └─ vm-a3 (10.0.2.4) ← DIFFERENT SUBNET!                   │
│                                                               │
│  LB → vm-a1 + vm-a2 + vm-a3                                 │
│                                                               │
│  ✅ Works! Subnets don't matter within the same VNet.        │
└──────────────────────────────────────────────────────────────┘
```

### Step 1: Add vm-a3 to Existing Backend Pool

```
1. Go to lb-same-subnet → Backend pools → pool-same-subnet
2. Click "Edit" (or click on the pool)
3. Click "+ Add"
4. Select vm-a3 (from Subnet-2)
5. Click "Save"

That's it! vm-a3 is now in the backend pool alongside
vm-a1 and vm-a2, even though it's in a different subnet.
```

### Step 2: Test Cross-Subnet Load Balancing

```
curl http://<LB-PUBLIC-IP>  → "VM-A1" or "VM-A2" or "VM-A3"
curl http://<LB-PUBLIC-IP>  → "VM-A3" or "VM-A1" or "VM-A2"
curl http://<LB-PUBLIC-IP>  → "VM-A2" or "VM-A3" or "VM-A1"

✅ Traffic distributed across ALL 3 VMs!
✅ vm-a3 from Subnet-2 works perfectly!
```

### Step 3: Verify Health

```
1. lb-same-subnet → Backend pools → pool-same-subnet
2. Check health:
   ✅ vm-a1 (10.0.1.4, Subnet-1): Healthy
   ✅ vm-a2 (10.0.1.5, Subnet-1): Healthy
   ✅ vm-a3 (10.0.2.4, Subnet-2): Healthy
   
   All healthy regardless of subnet!
```

### Step 4: Test, Check, and Confirm

**Test 1: Backend Pool Has 3 VMs**

```
pool-same-subnet:
  ✅ vm-a1 (Subnet-1): Healthy
  ✅ vm-a2 (Subnet-1): Healthy
  ✅ vm-a3 (Subnet-2): Healthy
```

**Test 2: All 3 VMs Receive Traffic**

```
Run 15 requests:
  for i in {1..15}; do curl -s http://<LB-IP> | grep -o "VM-A[123]"; done
  
  ✅ VM-A1, VM-A2, and VM-A3 all appear
```

**Test 3: Subnet Doesn't Matter**

```
✅ VMs from Subnet-1 AND Subnet-2 both work
✅ LB doesn't care which subnet the VM is in
✅ As long as it's in the same VNet
```

**✅ SCENARIO 2 RESULT: Same VNet, Different Subnets = ✅ WORKS!**

---

## Lab 4: Same Region, Different VNets (Peered)

### Scenario

```
LB in VNet-A, but we want to include vm-b1 from VNet-B!

┌──────────────────────────────────────────────────────────────┐
│  VNet-A (10.0.0.0/16)          VNet-B (10.1.0.0/16)         │
│  ├─ vm-a1 (10.0.1.4)          ├─ vm-b1 (10.1.1.4)          │
│  └─ vm-a2 (10.0.1.5)          │                              │
│         │                       │                              │
│         └───── VNet Peering ────┘                              │
│                                                               │
│  LB (in VNet-A) → vm-a1 + vm-a2 + vm-b1                    │
│                                                               │
│  ✅ Works with IP-based backend pool + VNet peering!         │
│  ❌ Does NOT work with NIC-based backend pool!               │
└──────────────────────────────────────────────────────────────┘

KEY: Must use IP-based backend pool (not NIC-based)!
```

### Step 1: Create VNet Peering (A ↔ B)

```
1. Go to vnet-a → Peerings → "+ Add"
2. Fill in:
   - This VNet peering name: vnet-a-to-vnet-b
   - Remote VNet peering name: vnet-b-to-vnet-a
   - Virtual network: vnet-b
   - Allow traffic: Yes (both directions)
3. Click "Add"

⏱️ Wait: 30 seconds
Verify: Both sides show "Connected"
```

### Step 2: Create New LB with IP-Based Backend

```
We need a NEW load balancer with IP-based backend pool.
(The existing one uses NIC-based, which can't cross VNets.)

1. Search "Load balancers" → "+ Create"
2. Fill in:

   Basics:
   - Resource group: rg-day32-lb
   - Name: lb-cross-vnet
   - Region: East US
   - SKU: Standard
   - Type: Public
   - Tier: Regional

   Frontend IP:
   - "+ Add a frontend IP configuration"
   - Name: frontend-cross
   - Public IP: Create new → pip-lb-cross-vnet
   - Click "Add"

   Backend pools:
   - "+ Add a backend pool"
   - Name: pool-cross-vnet
   - Virtual network: vnet-a
   - Backend Pool Configuration: IP Address ← KEY SETTING!
   - Click "+ Add"
     - IP address: 10.0.1.4 (vm-a1)
     - Click "Add"
   - Click "+ Add"
     - IP address: 10.0.1.5 (vm-a2)
     - Click "Add"
   - Click "+ Add"
     - IP address: 10.1.1.4 (vm-b1 from VNet-B!) ← CROSS-VNET!
     - Click "Add"
   - Click "Add" (save pool)

   Inbound rules:
   - "+ Add a load balancing rule"
   - Name: rule-http-cross
   - Frontend: frontend-cross
   - Backend pool: pool-cross-vnet
   - Protocol: TCP, Port: 80, Backend port: 80
   - Health probe: Create new
     - Name: probe-http-cross
     - Protocol: HTTP, Port: 80, Path: /
     - Click "OK"
   - Click "Add"

3. Click "Review + create" → "Create"
```

**⏱️ Wait**: 2-3 minutes

### Step 3: Test Cross-VNet Load Balancing

```
1. Get lb-cross-vnet Frontend IP
2. Test:

curl http://<LB-CROSS-IP>  → "VM-A1" or "VM-A2" or "VM-B1"
curl http://<LB-CROSS-IP>  → "VM-B1" or "VM-A1" or "VM-A2"
curl http://<LB-CROSS-IP>  → "VM-A2" or "VM-B1" or "VM-A1"

✅ Traffic goes to VMs in BOTH VNet-A AND VNet-B!
✅ Cross-VNet load balancing working!
```

### Step 4: Verify Health Across VNets

```
1. lb-cross-vnet → Backend pools → pool-cross-vnet
2. Check:
   ✅ 10.0.1.4 (vm-a1, VNet-A): Healthy
   ✅ 10.0.1.5 (vm-a2, VNet-A): Healthy
   ✅ 10.1.1.4 (vm-b1, VNet-B): Healthy
   
   Health probes work across peered VNets!
```

### Step 5: What Happens WITHOUT Peering?

```
If you DELETE the VNet peering:

1. vnet-a → Peerings → Delete vnet-a-to-vnet-b

2. Check backend pool health:
   ✅ 10.0.1.4 (vm-a1): Healthy
   ✅ 10.0.1.5 (vm-a2): Healthy
   ❌ 10.1.1.4 (vm-b1): UNHEALTHY!
   
   Without peering, LB can't reach vm-b1!
   Health probe fails → LB stops sending traffic to it.

3. Re-create the peering to fix it:
   vnet-a → Peerings → "+ Add" → peer with vnet-b again
   
   After peering restored:
   ✅ 10.1.1.4 (vm-b1): Healthy again!
```

### Step 6: Test, Check, and Confirm

**Test 1: Cross-VNet Backend Pool**

```
pool-cross-vnet:
  ✅ 10.0.1.4 (VNet-A): Healthy
  ✅ 10.0.1.5 (VNet-A): Healthy
  ✅ 10.1.1.4 (VNet-B): Healthy
```

**Test 2: Traffic Reaches VNet-B**

```
Run 15 requests:
  ✅ VM-A1, VM-A2, and VM-B1 all appear in responses
  ✅ Cross-VNet load balancing confirmed
```

**Test 3: Peering Required**

```
Without peering: vm-b1 becomes unhealthy ❌
With peering: vm-b1 is healthy ✅
✅ Peering is REQUIRED for cross-VNet LB
```

**✅ SCENARIO 3 RESULT: Same Region, Different VNets = ✅ WORKS (with peering + IP backend)!**

---

## Lab 5: Different Regions (Cross-Region LB)

### Scenario

```
VMs in East US AND West Europe behind ONE load balancer!

┌──────────────────────────────────────────────────────────────┐
│  CROSS-REGION LOAD BALANCER (Global Tier)                     │
│                                                               │
│  This uses a special "Global" tier LB that sits in front     │
│  of regional LBs.                                            │
│                                                               │
│                    ┌─────────────┐                            │
│  Users ──────────→ │ Global LB   │                            │
│  (worldwide)       │ (Cross-Rgn) │                            │
│                    └──────┬──────┘                            │
│                     ┌─────┴─────┐                             │
│                     ↓           ↓                             │
│              ┌──────────┐ ┌──────────┐                       │
│              │Regional  │ │Regional  │                       │
│              │LB EastUS │ │LB WestEU │                       │
│              └────┬─────┘ └────┬─────┘                       │
│                   ↓            ↓                              │
│              vm-a1, vm-a2   vm-c1                             │
│              (East US)      (West Europe)                     │
│                                                               │
│  Global LB routes users to the NEAREST healthy region!       │
└──────────────────────────────────────────────────────────────┘
```

### Step 1: Create Regional LB in West Europe

```
We already have lb-same-subnet in East US.
Now create one in West Europe for vm-c1.

1. Search "Load balancers" → "+ Create"
2. Fill in:
   - Resource group: rg-day32-lb
   - Name: lb-westeu-regional
   - Region: West Europe
   - SKU: Standard
   - Type: Public
   - Tier: Regional

   Frontend IP:
   - Name: frontend-westeu
   - Public IP: Create new → pip-lb-westeu
   - Click "Add"

   Backend pools:
   - Name: pool-westeu
   - Virtual network: vnet-c
   - Backend Pool Configuration: NIC
   - Add: vm-c1
   - Click "Add"

   Inbound rules:
   - Name: rule-http-westeu
   - Frontend: frontend-westeu
   - Backend: pool-westeu
   - Port: 80, Backend port: 80
   - Health probe: Create new → probe-http-westeu, HTTP, 80, /
   - Click "Add"

3. Create
```

**⏱️ Wait**: 2-3 minutes

### Step 2: Create Cross-Region (Global) Load Balancer

```
1. Search "Load balancers" → "+ Create"
2. Fill in:

   Basics:
   - Resource group: rg-day32-lb
   - Name: lb-global
   - Region: East US (home region, but serves globally)
   - SKU: Standard
   - Type: Public
   - Tier: Global ← THIS IS THE KEY SETTING!

   Frontend IP:
   - Name: frontend-global
   - Public IP: Create new → pip-lb-global
   - Click "Add"

   Backend pools:
   - Name: pool-global
   - Click "+ Add"
   - Select: lb-same-subnet (East US regional LB)
   - Click "+ Add"
   - Select: lb-westeu-regional (West Europe regional LB)
   - Click "Add"

   Inbound rules:
   - Name: rule-global
   - Frontend: frontend-global
   - Backend: pool-global
   - Protocol: TCP, Port: 80, Backend port: 80
   - Click "Add"

3. Create
```

**⏱️ Wait**: 2-3 minutes

### Step 3: Test Cross-Region Load Balancing

```
1. Get lb-global Frontend IP (pip-lb-global)
2. Test:

curl http://<GLOBAL-LB-IP>

Responses will come from VMs in BOTH regions:
  → "VM-A1" (East US) or "VM-A2" (East US) or "VM-C1" (West Europe)

✅ Cross-region load balancing working!
✅ Users routed to nearest healthy region!
```

### Step 4: Test Regional Failover

```
1. Stop ALL VMs in East US (vm-a1, vm-a2):
   vm-a1 → Stop
   vm-a2 → Stop

2. Wait 30 seconds for health probes

3. curl http://<GLOBAL-LB-IP>
   → Always "VM-C1" (West Europe)
   
   ✅ East US is down → All traffic goes to West Europe!
   ✅ Automatic regional failover!

4. Start vm-a1 and vm-a2 again
5. Wait 30 seconds
6. Traffic distributed across both regions again ✅
```

### Step 5: Test, Check, and Confirm

**Test 1: Global LB Created**

```
lb-global:
  ✅ Tier: Global
  ✅ Backend: 2 regional LBs
```

**Test 2: Cross-Region Traffic**

```
✅ Responses from East US VMs
✅ Responses from West Europe VMs
✅ Both regions serving traffic
```

**Test 3: Regional Failover**

```
Stop East US VMs:
  ✅ All traffic to West Europe
Start East US VMs:
  ✅ Traffic distributed again
```

**✅ SCENARIO 4 RESULT: Different Regions = ✅ WORKS (with Global tier LB)!**

---

## Lab 6: Internal Load Balancer

### Scenario

```
Not all LBs need to be public!
Internal LB = Private IP only, for internal services.

┌──────────────────────────────────────────────────────────────┐
│  INTERNAL LOAD BALANCER                                       │
│                                                               │
│  VNet-A (10.0.0.0/16)                                       │
│                                                               │
│  Web Tier:                                                   │
│  ├─ vm-web-1 ──→ [Internal LB: 10.0.2.100] ──→ vm-api-1   │
│  └─ vm-web-2 ──→                              ──→ vm-api-2   │
│                                                               │
│  Web VMs call API VMs through internal LB.                   │
│  API VMs are NOT exposed to internet!                        │
│  Only accessible within the VNet.                            │
│                                                               │
│  Use for: Backend APIs, databases, microservices             │
└──────────────────────────────────────────────────────────────┘
```

### Step 1: Create Internal Load Balancer

```
1. Search "Load balancers" → "+ Create"
2. Fill in:

   Basics:
   - Resource group: rg-day32-lb
   - Name: lb-internal
   - Region: East US
   - SKU: Standard
   - Type: Internal ← NOT Public!
   - Tier: Regional

   Frontend IP:
   - Name: frontend-internal
   - Virtual network: vnet-a
   - Subnet: Subnet-2
   - IP address assignment: Static
   - IP address: 10.0.2.100 ← Choose a specific private IP
   - Click "Add"

   Backend pools:
   - Name: pool-internal
   - Virtual network: vnet-a
   - Backend Pool Configuration: NIC
   - Add: vm-a1, vm-a2
   - Click "Add"

   Inbound rules:
   - Name: rule-internal
   - Frontend: frontend-internal
   - Backend: pool-internal
   - Protocol: TCP, Port: 80, Backend port: 80
   - Health probe: Create new → probe-internal, HTTP, 80, /
   - Click "Add"

3. Create
```

### Step 2: Test Internal LB

```
Internal LB has NO public IP. You can only test from WITHIN the VNet.

1. SSH into vm-b1 (which has a public IP) or use Serial Console on vm-a3

2. From a VM in a peered VNet or same VNet:
   curl http://10.0.2.100

   Response: "VM-A1" or "VM-A2"
   ✅ Internal LB working!

3. From the internet:
   curl http://10.0.2.100
   ❌ Can't reach! (private IP, not routable from internet)
   ✅ Correct! Internal LB is private only.
```

### Step 3: Test, Check, and Confirm

**Test 1: Internal LB Created**

```
lb-internal:
  ✅ Type: Internal
  ✅ Frontend IP: 10.0.2.100 (private)
  ✅ No public IP
```

**Test 2: Accessible from VNet**

```
From VM in VNet-A:
  curl http://10.0.2.100 → "VM-A1" or "VM-A2" ✅
```

**Test 3: NOT Accessible from Internet**

```
From your laptop:
  curl http://10.0.2.100 → ❌ Can't reach
  ✅ Correct! Internal only.
```

**✅ SCENARIO 5 RESULT: Internal LB = ✅ WORKS (private IP, VNet only)!**

---

## Complete Scenario Summary

```
┌─────────────────────────────────────────────────────────────────┐
│  ALL SCENARIOS TESTED                                            │
│                                                                  │
│  ┌─────────────────────────────┬──────┬───────────────────────┐ │
│  │ Scenario                    │ Works│ Requirements          │ │
│  ├─────────────────────────────┼──────┼───────────────────────┤ │
│  │ Same VNet, Same Subnet      │  ✅  │ NIC or IP backend     │ │
│  │ (Lab 2)                     │      │ Standard LB           │ │
│  ├─────────────────────────────┼──────┼───────────────────────┤ │
│  │ Same VNet, Diff Subnet      │  ✅  │ NIC or IP backend     │ │
│  │ (Lab 3)                     │      │ Standard LB           │ │
│  ├─────────────────────────────┼──────┼───────────────────────┤ │
│  │ Same Region, Diff VNet      │  ✅  │ IP-based backend      │ │
│  │ (Lab 4)                     │      │ + VNet Peering        │ │
│  ├─────────────────────────────┼──────┼───────────────────────┤ │
│  │ Different Regions           │  ✅  │ Global tier LB        │ │
│  │ (Lab 5)                     │      │ + Regional LBs        │ │
│  ├─────────────────────────────┼──────┼───────────────────────┤ │
│  │ Internal (private)          │  ✅  │ Type: Internal        │ │
│  │ (Lab 6)                     │      │ Private IP frontend   │ │
│  ├─────────────────────────────┼──────┼───────────────────────┤ │
│  │ Diff VNet, NO peering       │  ❌  │ Must peer first!      │ │
│  │                             │      │                       │ │
│  ├─────────────────────────────┼──────┼───────────────────────┤ │
│  │ Basic LB, cross-VNet        │  ❌  │ Use Standard LB       │ │
│  │                             │      │                       │ │
│  └─────────────────────────────┴──────┴───────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Troubleshooting

### Issue 1: Backend VMs Show "Unhealthy"

```
Symptom: Health probe fails, VMs marked unhealthy

Fixes:
1. Check NSG rules:
   - VM's NSG must allow health probe traffic
   - Allow inbound HTTP (80) from AzureLoadBalancer service tag
   - Add rule: Source=AzureLoadBalancer, Port=80, Allow

2. Check nginx is running:
   ssh into VM → sudo systemctl status nginx
   If stopped: sudo systemctl start nginx

3. Check health probe path:
   Probe checks "/" by default
   Make sure nginx returns 200 on "/"
```

### Issue 2: Cross-VNet Backend Unhealthy

```
Symptom: VMs in peered VNet show unhealthy

Fixes:
1. Verify VNet peering is "Connected" (both sides)
2. Verify using IP-based backend (not NIC-based)
3. Check NSG on remote VNet allows traffic from LB VNet
4. Check no route tables blocking traffic
```

### Issue 3: All Traffic Goes to One VM

```
Symptom: LB always sends to same VM

Causes:
1. Session persistence enabled (sticky sessions)
   → Disable: LB rule → Session persistence: None
2. Only one VM healthy
   → Check backend pool health
3. Testing from same client IP
   → LB hash includes source IP by default
   → Test from different IPs or use "None" persistence
```

---

## Cleanup

### Delete All Resources

```
⚠️ Load Balancers cost money! Delete when done.

1. Delete Resource Group:
   - Resource groups → rg-day32-lb
   - Click "Delete resource group"
   - Type name to confirm → Delete

This deletes ALL LBs, VMs, VNets, and related resources.
```

**⏱️ Wait**: 5-10 minutes

**✅ Result**: All resources deleted!

---

## Quick Reference

### LB Decision Tree

```
Do you need to load balance?
├─ Between VMs in same VNet?
│   → Standard LB, NIC-based backend ✅
│
├─ Between VMs in different VNets (same region)?
│   → Standard LB, IP-based backend + VNet Peering ✅
│
├─ Between VMs in different regions?
│   → Cross-Region (Global) LB + Regional LBs ✅
│
├─ Internal only (no internet)?
│   → Internal LB (private IP frontend) ✅
│
├─ HTTP/HTTPS with URL routing?
│   → Use Application Gateway instead (Layer 7)
│
└─ Global HTTP with CDN?
    → Use Azure Front Door instead
```

### LB vs App Gateway vs Front Door

```
┌──────────────────┬──────────────────┬──────────────────┐
│  Load Balancer    │  App Gateway     │  Front Door      │
├──────────────────┼──────────────────┼──────────────────┤
│  Layer 4 (TCP)   │  Layer 7 (HTTP)  │  Layer 7 (HTTP)  │
│  IP + Port       │  URL path/host   │  Global + CDN    │
│  Regional/Global │  Regional        │  Global           │
│  Any TCP/UDP     │  HTTP/HTTPS only │  HTTP/HTTPS only │
│  Cheapest        │  Medium cost     │  Higher cost     │
│  No SSL offload  │  SSL offload     │  SSL offload     │
│  No WAF          │  WAF available   │  WAF available   │
└──────────────────┴──────────────────┴──────────────────┘
```

### Useful Links

- [Azure Load Balancer Documentation](https://learn.microsoft.com/azure/load-balancer/)
- [Standard vs Basic LB](https://learn.microsoft.com/azure/load-balancer/skus)
- [Cross-Region LB](https://learn.microsoft.com/azure/load-balancer/cross-region-overview)
- [IP-based Backend Pools](https://learn.microsoft.com/azure/load-balancer/backend-pool-management)
- [LB Pricing](https://azure.microsoft.com/pricing/details/load-balancer/)

---

**🎉 Congratulations!** You've completed Day 32 covering Azure Load Balancer in every scenario: same subnet, different subnets, different VNets, different regions, and internal!