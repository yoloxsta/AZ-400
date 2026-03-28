# Day 30: VNet Peering & Gateway Transit

## What You'll Learn

Connect Azure Virtual Networks together:
- ✅ What is VNet Peering and why use it
- ✅ VNet Peering vs VPN Gateway (when to use which)
- ✅ Same-region peering
- ✅ Global peering (cross-region)
- ✅ Gateway Transit (share VPN gateway across VNets)
- ✅ Hub-and-Spoke network topology
- ✅ Complete test, check, and confirm

## Table of Contents

1. [What is VNet Peering?](#what-is-vnet-peering)
2. [Why Use VNet Peering?](#why-use-vnet-peering)
3. [VNet Peering vs VPN Gateway](#vnet-peering-vs-vpn-gateway)
4. [How Peering Works](#how-peering-works)
5. [Lab 1: Setup - Create 3 VNets with VMs](#lab-1-setup---create-3-vnets-with-vms)
6. [Lab 2: VNet Peering (VNet-A ↔ VNet-B)](#lab-2-vnet-peering-vnet-a--vnet-b)
7. [Lab 3: Test Peering Connectivity](#lab-3-test-peering-connectivity)
8. [Lab 4: Peering is NOT Transitive](#lab-4-peering-is-not-transitive)
9. [Lab 5: Complete the Mesh (VNet-B ↔ VNet-C)](#lab-5-complete-the-mesh-vnet-b--vnet-c)
10. [Lab 6: Global Peering (Cross-Region)](#lab-6-global-peering-cross-region)
11. [Lab 7: Gateway Transit (Hub-and-Spoke)](#lab-7-gateway-transit-hub-and-spoke)
12. [Cleanup](#cleanup)

---

## What is VNet Peering?

**VNet Peering** = Connecting two Azure Virtual Networks so they can talk to each other using private IPs.

### Simple Explanation

```
Without Peering:
  VNet-A (10.0.0.0/16) and VNet-B (10.1.0.0/16)
  are like two separate buildings with no door between them.
  
  VM in VNet-A: "I want to talk to VM in VNet-B"
  Azure: "Sorry, you can't. They're separate networks."

With Peering:
  VNet-A ←── Peering ──→ VNet-B
  Now there's a direct connection between the buildings!
  
  VM in VNet-A: "I want to talk to VM in VNet-B"
  Azure: "Sure! Go through the peering connection."
  
  VM-A (10.0.1.4) ←→ VM-B (10.1.1.4)
  Direct, fast, private communication!
```

### Visual

```
┌─────────────────────────────────────────────────────────────────┐
│  VNET PEERING                                                    │
│                                                                  │
│  Before Peering:                                                │
│  ┌──────────────┐          ┌──────────────┐                     │
│  │ VNet-A       │          │ VNet-B       │                     │
│  │ 10.0.0.0/16  │   ❌    │ 10.1.0.0/16  │                     │
│  │              │ No link  │              │                     │
│  │ VM: 10.0.1.4 │          │ VM: 10.1.1.4 │                     │
│  └──────────────┘          └──────────────┘                     │
│  Can't communicate!                                             │
│                                                                  │
│  After Peering:                                                 │
│  ┌──────────────┐          ┌──────────────┐                     │
│  │ VNet-A       │══════════│ VNet-B       │                     │
│  │ 10.0.0.0/16  │ Peering  │ 10.1.0.0/16  │                     │
│  │              │ (fast!)  │              │                     │
│  │ VM: 10.0.1.4 │←────────→│ VM: 10.1.1.4 │                     │
│  └──────────────┘          └──────────────┘                     │
│  Direct private communication! ✅                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Why Use VNet Peering?

### The Problem

```
❌ WITHOUT PEERING:

Scenario 1: Microservices in different VNets
  Web app in VNet-Web needs to call API in VNet-API
  They can't communicate!
  Workaround: Expose API publicly → 😱 Security risk!

Scenario 2: Shared services
  Database in VNet-Shared needs to be accessed by
  VNet-Dev, VNet-Staging, VNet-Prod
  Each VNet is isolated!
  Workaround: Put everything in one VNet → 😱 No isolation!

Scenario 3: Multi-region
  VNet in East US needs to talk to VNet in West US
  Different regions = different networks
  Workaround: Route through public internet → 😱 Slow and insecure!
```

### The Solution

```
✅ WITH PEERING:

Scenario 1: Microservices
  VNet-Web ══ Peering ══ VNet-API
  Web app calls API using private IP. Fast and secure!

Scenario 2: Shared services (Hub-and-Spoke)
  VNet-Dev ══╗
  VNet-Stg ══╬══ VNet-Shared (hub)
  VNet-Prod ═╝
  All environments access shared database. Isolated but connected!

Scenario 3: Multi-region (Global Peering)
  VNet-EastUS ══ Global Peering ══ VNet-WestUS
  Cross-region communication over Azure backbone. Fast and private!
```

---

## VNet Peering vs VPN Gateway

```
┌─────────────────────────────┬─────────────────────────────────┐
│  VNet Peering                │  VPN Gateway (VNet-to-VNet)     │
├─────────────────────────────┼─────────────────────────────────┤
│  No gateway needed          │  Requires VPN Gateway ($140/mo) │
│  Azure backbone network     │  Encrypted IPsec tunnel         │
│  Very low latency (~1ms)    │  Higher latency (~5-10ms)       │
│  High bandwidth (network)   │  Limited bandwidth (~1.25 Gbps) │
│  NOT encrypted by default   │  Always encrypted (IPsec)       │
│  NOT transitive             │  Can be transitive with BGP     │
│  Setup: 2 minutes           │  Setup: 30-45 minutes           │
│  Cost: Data transfer only   │  Cost: Gateway + data transfer  │
│  Same or cross-region       │  Same or cross-region           │
│  Same or cross-subscription │  Same or cross-subscription     │
│  Same or cross-tenant       │  Same tenant only               │
│                             │                                 │
│  Best for:                  │  Best for:                      │
│  - High bandwidth needs     │  - Need encryption              │
│  - Low latency needs        │  - On-premises connectivity     │
│  - Simple connectivity      │  - Transitive routing           │
│  - Cost-sensitive           │  - Complex topologies           │
└─────────────────────────────┴─────────────────────────────────┘

💡 Rule of thumb:
   Azure-to-Azure? → Use VNet Peering (faster, cheaper)
   Need encryption? → Use VPN Gateway (or add your own encryption)
   Need on-premises? → Use VPN Gateway (peering is Azure-only)
```

---

## How Peering Works

### Key Concepts

```
┌──────────────────────────────────────────────────────────────┐
│  PEERING KEY CONCEPTS                                         │
│                                                               │
│  1. TWO-WAY SETUP (but each direction is separate)           │
│     VNet-A → VNet-B (peering link 1)                         │
│     VNet-B → VNet-A (peering link 2)                         │
│     Both links needed for communication!                     │
│     Azure Portal creates both automatically.                 │
│                                                               │
│  2. NON-OVERLAPPING ADDRESS SPACES                           │
│     VNet-A: 10.0.0.0/16 ✅                                  │
│     VNet-B: 10.1.0.0/16 ✅ (different range)                │
│     VNet-C: 10.0.0.0/16 ❌ (overlaps with A!)              │
│                                                               │
│  3. NOT TRANSITIVE                                           │
│     A ══ B ══ C                                              │
│     A can talk to B ✅                                       │
│     B can talk to C ✅                                       │
│     A can talk to C ❌ (not directly peered!)               │
│     Fix: Peer A↔C directly, or use Gateway Transit          │
│                                                               │
│  4. PEERING STATUS                                           │
│     Initiated: One side created, waiting for other           │
│     Connected: Both sides created, traffic flows!            │
│     Disconnected: One side deleted, broken                   │
└──────────────────────────────────────────────────────────────┘
```

### Peering Settings Explained

```
┌──────────────────────────────────────────────────────────────┐
│  PEERING SETTINGS                                             │
│                                                               │
│  Allow traffic to remote VNet: ✅ (default)                  │
│  → VMs in this VNet can reach VMs in peered VNet             │
│                                                               │
│  Allow traffic from remote VNet: ✅ (default)                │
│  → VMs in peered VNet can reach VMs in this VNet             │
│                                                               │
│  Allow gateway transit: ☐ (off by default)                   │
│  → Share this VNet's VPN gateway with peered VNet            │
│  → Only the VNet WITH the gateway enables this               │
│                                                               │
│  Use remote gateway: ☐ (off by default)                      │
│  → Use the peered VNet's VPN gateway                         │
│  → Only the VNet WITHOUT a gateway enables this              │
│                                                               │
│  Allow forwarded traffic: ☐ (off by default)                 │
│  → Allow traffic that didn't originate from peered VNet      │
│  → Needed for NVA (Network Virtual Appliance) scenarios      │
└──────────────────────────────────────────────────────────────┘
```

---

## Lab 1: Setup - Create 3 VNets with VMs

### What We'll Build

```
┌──────────────────────────────────────────────────────────────┐
│  THREE VNETS WITH VMs                                         │
│                                                               │
│  VNet-A (10.0.0.0/16) - East US                             │
│  └─ VM-A (10.0.1.4) - "Web Server"                          │
│                                                               │
│  VNet-B (10.1.0.0/16) - East US                             │
│  └─ VM-B (10.1.1.4) - "API Server"                          │
│                                                               │
│  VNet-C (10.2.0.0/16) - East US                             │
│  └─ VM-C (10.2.1.4) - "Database Server"                     │
│                                                               │
│  Currently: No peering. VMs can't talk to each other.        │
│  Goal: Connect them with peering!                            │
└──────────────────────────────────────────────────────────────┘
```

### Step 1: Create Resource Group

```
1. Azure Portal → Search "Resource groups" → "+ Create"
2. Name: rg-day30-peering
3. Region: East US
4. Click "Review + create" → "Create"
```

### Step 2: Create VNet-A

```
1. Search "Virtual networks" → "+ Create"
2. Fill in:
   - Resource group: rg-day30-peering
   - Name: vnet-a
   - Region: East US
   
   IP Addresses tab:
   - Address space: 10.0.0.0/16
   - Delete default subnet
   - Add subnet:
     Name: subnet-web
     Address range: 10.0.1.0/24
   
3. Click "Review + create" → "Create"
```

### Step 3: Create VNet-B

```
1. Search "Virtual networks" → "+ Create"
2. Fill in:
   - Resource group: rg-day30-peering
   - Name: vnet-b
   - Region: East US
   
   IP Addresses tab:
   - Address space: 10.1.0.0/16
   - Delete default subnet
   - Add subnet:
     Name: subnet-api
     Address range: 10.1.1.0/24
   
3. Click "Review + create" → "Create"
```

### Step 4: Create VNet-C

```
1. Search "Virtual networks" → "+ Create"
2. Fill in:
   - Resource group: rg-day30-peering
   - Name: vnet-c
   - Region: East US
   
   IP Addresses tab:
   - Address space: 10.2.0.0/16
   - Delete default subnet
   - Add subnet:
     Name: subnet-db
     Address range: 10.2.1.0/24
   
3. Click "Review + create" → "Create"
```

### Step 5: Create VM-A (in VNet-A)

```
1. Search "Virtual machines" → "+ Create" → "Azure virtual machine"
2. Fill in:
   Basics:
   - Resource group: rg-day30-peering
   - Name: vm-a
   - Region: East US
   - Image: Ubuntu Server 22.04 LTS
   - Size: Standard_B1s
   - Authentication: Password
   - Username: azureuser
   - Password: Day30Peer@2026
   - Public inbound ports: Allow SSH (22)

   Networking:
   - Virtual network: vnet-a
   - Subnet: subnet-web
   - Public IP: Create new

3. Click "Review + create" → "Create"
```

### Step 6: Create VM-B (in VNet-B)

```
Same as VM-A but:
   - Name: vm-b
   - Virtual network: vnet-b
   - Subnet: subnet-api
```

### Step 7: Create VM-C (in VNet-C)

```
Same as VM-A but:
   - Name: vm-c
   - Virtual network: vnet-c
   - Subnet: subnet-db
```

**⏱️ Wait**: 3-5 minutes for all VMs

### Step 8: Install Web Servers and Configure

```
SSH into each VM and set up:

VM-A:
  ssh azureuser@<VM-A-PUBLIC-IP>
  sudo apt update && sudo apt install -y nginx
  sudo bash -c 'echo "<h1>VM-A (Web) - 10.0.1.4</h1><p>VNet-A</p>" > /var/www/html/index.html'
  exit

VM-B:
  ssh azureuser@<VM-B-PUBLIC-IP>
  sudo apt update && sudo apt install -y nginx
  sudo bash -c 'echo "<h1>VM-B (API) - 10.1.1.4</h1><p>VNet-B</p>" > /var/www/html/index.html'
  exit

VM-C:
  ssh azureuser@<VM-C-PUBLIC-IP>
  sudo apt update && sudo apt install -y nginx
  sudo bash -c 'echo "<h1>VM-C (DB) - 10.2.1.4</h1><p>VNet-C</p>" > /var/www/html/index.html'
  exit
```

### Step 9: Verify VMs Can't Talk (Before Peering)

```
SSH into VM-A:
  ssh azureuser@<VM-A-PUBLIC-IP>

Try to reach VM-B:
  ping 10.1.1.4 -c 3 -W 2
  # Result: 100% packet loss ❌
  
  curl --connect-timeout 3 http://10.1.1.4
  # Result: Connection timed out ❌

Try to reach VM-C:
  ping 10.2.1.4 -c 3 -W 2
  # Result: 100% packet loss ❌

exit

✅ Confirmed: VMs in different VNets CANNOT communicate!
```

### Step 10: Test, Check, and Confirm - Setup

**Test 1: Verify 3 VNets**

```
1. Search "Virtual networks"
2. Verify:
   ✅ vnet-a (10.0.0.0/16)
   ✅ vnet-b (10.1.0.0/16)
   ✅ vnet-c (10.2.0.0/16)
   ✅ No overlapping address spaces
```

**Test 2: Verify 3 VMs**

```
1. Search "Virtual machines"
2. Verify:
   ✅ vm-a (10.0.1.4 in vnet-a)
   ✅ vm-b (10.1.1.4 in vnet-b)
   ✅ vm-c (10.2.1.4 in vnet-c)
```

**Test 3: Verify No Connectivity**

```
From VM-A:
  ping 10.1.1.4 → ❌ No response
  ping 10.2.1.4 → ❌ No response
  ✅ Correct! No peering yet.
```

**✅ Result**: Setup complete! Ready for peering.

---

## Lab 2: VNet Peering (VNet-A ↔ VNet-B)

### What We'll Do

```
Create peering between VNet-A and VNet-B:

  VNet-A (10.0.0.0/16) ══════ VNet-B (10.1.0.0/16)
  VM-A (10.0.1.4)      Peer   VM-B (10.1.1.4)

After peering:
  VM-A can reach VM-B by private IP ✅
  VM-B can reach VM-A by private IP ✅
```

### Step 1: Create Peering from VNet-A to VNet-B

```
1. Go to "Virtual networks" → vnet-a
2. Left menu → "Peerings"
3. Click "+ Add"
4. Fill in:

   This virtual network:
   - Peering link name: vnet-a-to-vnet-b
   - Traffic to remote virtual network: Allow
   - Traffic forwarded from remote virtual network: Allow
   - Virtual network gateway or Route Server: None

   Remote virtual network:
   - Peering link name: vnet-b-to-vnet-a
   - Subscription: Your subscription
   - Virtual network: vnet-b
   - Traffic to remote virtual network: Allow
   - Traffic forwarded from remote virtual network: Allow
   - Virtual network gateway or Route Server: None

5. Click "Add"
```

**⏱️ Wait**: 30 seconds - 1 minute

```
What just happened:

Azure created TWO peering links automatically:
  1. vnet-a → vnet-b (on VNet-A side)
  2. vnet-b → vnet-a (on VNet-B side)

Both must be "Connected" for traffic to flow.
```

### Step 2: Verify Peering Status

```
1. Go to vnet-a → Peerings
2. Verify:
   ✅ vnet-a-to-vnet-b: Peering status = Connected

3. Go to vnet-b → Peerings
4. Verify:
   ✅ vnet-b-to-vnet-a: Peering status = Connected

Both must show "Connected"!
If one shows "Initiated", the other side isn't set up yet.
```

### Step 3: Test, Check, and Confirm - Peering Created

**Test 1: Verify Peering Status**

```
1. vnet-a → Peerings
   ✅ vnet-a-to-vnet-b: Connected

2. vnet-b → Peerings
   ✅ vnet-b-to-vnet-a: Connected
```

**Test 2: Verify Peering Settings**

```
1. Click on vnet-a-to-vnet-b
2. Verify:
   ✅ Traffic to remote VNet: Allowed
   ✅ Traffic from remote VNet: Allowed
   ✅ Gateway transit: None
```

**✅ Result**: Peering created between VNet-A and VNet-B!

---

## Lab 3: Test Peering Connectivity

### Step 1: Test VM-A → VM-B

```
1. SSH into VM-A:
   ssh azureuser@<VM-A-PUBLIC-IP>

2. Ping VM-B:
   ping 10.1.1.4 -c 4

   Expected:
   PING 10.1.1.4 (10.1.1.4) 56(84) bytes of data.
   64 bytes from 10.1.1.4: icmp_seq=1 ttl=64 time=1.23 ms
   64 bytes from 10.1.1.4: icmp_seq=2 ttl=64 time=0.98 ms
   64 bytes from 10.1.1.4: icmp_seq=3 ttl=64 time=1.05 ms
   64 bytes from 10.1.1.4: icmp_seq=4 ttl=64 time=1.01 ms

   ✅ VM-A can reach VM-B! Peering works!
   Notice: ~1ms latency (very fast, Azure backbone)

   Note: If ping fails, check NSG rules on VM-B.
   Add inbound rule: Allow ICMP from 10.0.0.0/16
```

### Step 2: Test HTTP Access

```
Still on VM-A:

curl http://10.1.1.4

Expected:
<h1>VM-B (API) - 10.1.1.4</h1><p>VNet-B</p>

✅ VM-A can access VM-B's web server via private IP!
```

### Step 3: Test VM-B → VM-A

```
1. SSH into VM-B:
   ssh azureuser@<VM-B-PUBLIC-IP>

2. Ping VM-A:
   ping 10.0.1.4 -c 4

   Expected:
   64 bytes from 10.0.1.4: icmp_seq=1 ttl=64 time=1.15 ms
   ✅ Bidirectional communication!

3. HTTP:
   curl http://10.0.1.4

   Expected:
   <h1>VM-A (Web) - 10.0.1.4</h1><p>VNet-A</p>
   ✅ VM-B can access VM-A's web server!

4. Exit:
   exit
```

### Step 4: Verify Routes

```
1. Go to VM-A → Networking → Network Interface
2. Click on the NIC → "Effective routes"
3. You should see:

   Source    Address Prefix    Next Hop
   Default  10.0.0.0/16       VNet (local)
   Default  10.1.0.0/16       VNet peering    ← NEW!

   ✅ Route to VNet-B (10.1.0.0/16) via VNet peering!
   Azure automatically added this route.
```

### Step 5: Test, Check, and Confirm - Connectivity

**Test 1: Ping A → B**

```
From VM-A: ping 10.1.1.4
✅ Response received (~1ms)
```

**Test 2: Ping B → A**

```
From VM-B: ping 10.0.1.4
✅ Response received (~1ms)
```

**Test 3: HTTP A → B**

```
From VM-A: curl http://10.1.1.4
✅ "VM-B (API) - 10.1.1.4" received
```

**Test 4: HTTP B → A**

```
From VM-B: curl http://10.0.1.4
✅ "VM-A (Web) - 10.0.1.4" received
```

**Test 5: SSH A → B (via private IP)**

```
From VM-A:
  ssh azureuser@10.1.1.4
  Password: Day30Peer@2026
  
  hostname
  # vm-b ✅
  
  exit
```

**Test 6: Effective Routes**

```
VM-A NIC → Effective routes
✅ 10.1.0.0/16 → VNet peering
```

**✅ Result**: VNet peering connectivity fully working!

---

## Lab 4: Peering is NOT Transitive

### What Does "Not Transitive" Mean?

```
┌──────────────────────────────────────────────────────────────┐
│  NOT TRANSITIVE = Can't hop through a peered VNet            │
│                                                               │
│  Current setup:                                              │
│  VNet-A ══ Peered ══ VNet-B          VNet-C (not peered)    │
│                                                               │
│  A → B: ✅ Works (directly peered)                           │
│  B → A: ✅ Works (directly peered)                           │
│  A → C: ❌ Fails (not peered)                               │
│  B → C: ❌ Fails (not peered)                               │
│                                                               │
│  Even if we peer B↔C:                                        │
│  VNet-A ══ VNet-B ══ VNet-C                                  │
│                                                               │
│  A → B: ✅ Works                                             │
│  B → C: ✅ Works                                             │
│  A → C: ❌ STILL FAILS!                                     │
│                                                               │
│  A can't "hop through" B to reach C.                         │
│  That's what "not transitive" means.                         │
│                                                               │
│  To fix: Peer A↔C directly                                   │
│  OR use Gateway Transit (Lab 7)                              │
└──────────────────────────────────────────────────────────────┘
```

### Step 1: Verify A Cannot Reach C

```
1. SSH into VM-A:
   ssh azureuser@<VM-A-PUBLIC-IP>

2. Try to reach VM-C:
   ping 10.2.1.4 -c 3 -W 2
   # Result: 100% packet loss ❌

   curl --connect-timeout 3 http://10.2.1.4
   # Result: Connection timed out ❌

3. But VM-B works:
   ping 10.1.1.4 -c 3
   # Result: ✅ Works!

4. Exit:
   exit

✅ Confirmed: A can reach B, but NOT C (not peered)
```

### Step 2: Verify B Cannot Reach C

```
1. SSH into VM-B:
   ssh azureuser@<VM-B-PUBLIC-IP>

2. Try to reach VM-C:
   ping 10.2.1.4 -c 3 -W 2
   # Result: 100% packet loss ❌

3. But VM-A works:
   ping 10.0.1.4 -c 3
   # Result: ✅ Works!

4. Exit:
   exit

✅ Confirmed: B can reach A, but NOT C (not peered)
```

### Step 3: Test, Check, and Confirm - Not Transitive

**Test 1: A → C Fails**

```
From VM-A: ping 10.2.1.4
❌ No response (correct - not peered)
```

**Test 2: B → C Fails**

```
From VM-B: ping 10.2.1.4
❌ No response (correct - not peered)
```

**Test 3: C → A Fails**

```
From VM-C: ping 10.0.1.4
❌ No response (correct - not peered)
```

**Test 4: A ↔ B Still Works**

```
From VM-A: ping 10.1.1.4 ✅
From VM-B: ping 10.0.1.4 ✅
```

**✅ Result**: Confirmed peering is NOT transitive!

---

## Lab 5: Complete the Mesh (VNet-B ↔ VNet-C)

### What We'll Do

```
Add peering between VNet-B and VNet-C:

  Before:
  VNet-A ══ VNet-B          VNet-C
  
  After:
  VNet-A ══ VNet-B ══ VNet-C
  
  A↔B: ✅  B↔C: ✅  A↔C: ❌ (still not transitive!)
  
  To make A↔C work, we also need A↔C peering:
  VNet-A ══ VNet-B ══ VNet-C
     ╚═══════════════════╝
  
  This is called a "full mesh" topology.
```

### Step 1: Create Peering B ↔ C

```
1. Go to "Virtual networks" → vnet-b
2. Left menu → "Peerings"
3. Click "+ Add"
4. Fill in:

   This virtual network:
   - Peering link name: vnet-b-to-vnet-c

   Remote virtual network:
   - Peering link name: vnet-c-to-vnet-b
   - Virtual network: vnet-c

   (Leave all traffic settings as Allow)

5. Click "Add"
```

### Step 2: Create Peering A ↔ C

```
1. Go to "Virtual networks" → vnet-a
2. Left menu → "Peerings"
3. Click "+ Add"
4. Fill in:

   This virtual network:
   - Peering link name: vnet-a-to-vnet-c

   Remote virtual network:
   - Peering link name: vnet-c-to-vnet-a
   - Virtual network: vnet-c

5. Click "Add"
```

### Step 3: Verify All Peerings

```
1. vnet-a → Peerings:
   ✅ vnet-a-to-vnet-b: Connected
   ✅ vnet-a-to-vnet-c: Connected

2. vnet-b → Peerings:
   ✅ vnet-b-to-vnet-a: Connected
   ✅ vnet-b-to-vnet-c: Connected

3. vnet-c → Peerings:
   ✅ vnet-c-to-vnet-b: Connected
   ✅ vnet-c-to-vnet-a: Connected
```

### Step 4: Test Full Mesh Connectivity

```
SSH into VM-A:
  ssh azureuser@<VM-A-PUBLIC-IP>

Test A → B:
  ping 10.1.1.4 -c 2
  ✅ Works!

Test A → C:
  ping 10.2.1.4 -c 2
  ✅ NOW WORKS! (directly peered)

  curl http://10.2.1.4
  <h1>VM-C (DB) - 10.2.1.4</h1><p>VNet-C</p>
  ✅ Can access VM-C web server!

exit
```

```
SSH into VM-C:
  ssh azureuser@<VM-C-PUBLIC-IP>

Test C → A:
  ping 10.0.1.4 -c 2
  ✅ Works!

Test C → B:
  ping 10.1.1.4 -c 2
  ✅ Works!

exit
```

### Step 5: Test, Check, and Confirm - Full Mesh

**Test 1: All Pairs Work**

```
A → B: ✅  |  B → A: ✅
A → C: ✅  |  C → A: ✅
B → C: ✅  |  C → B: ✅

All 6 directions working!
```

**Test 2: HTTP All Pairs**

```
From VM-A:
  curl http://10.1.1.4 → "VM-B (API)" ✅
  curl http://10.2.1.4 → "VM-C (DB)" ✅

From VM-B:
  curl http://10.0.1.4 → "VM-A (Web)" ✅
  curl http://10.2.1.4 → "VM-C (DB)" ✅

From VM-C:
  curl http://10.0.1.4 → "VM-A (Web)" ✅
  curl http://10.1.1.4 → "VM-B (API)" ✅
```

**Test 3: Effective Routes on VM-A**

```
VM-A NIC → Effective routes:
  10.0.0.0/16 → VNet (local)
  10.1.0.0/16 → VNet peering (to VNet-B)
  10.2.0.0/16 → VNet peering (to VNet-C)
  ✅ Routes to both peered VNets!
```

**✅ Result**: Full mesh peering working!

---

## Lab 6: Global Peering (Cross-Region)

### What is Global Peering?

```
Global Peering = Peering between VNets in DIFFERENT Azure regions

┌──────────────────────────────────────────────────────────────┐
│  GLOBAL PEERING                                               │
│                                                               │
│  Regular Peering:                                            │
│  VNet-A (East US) ══ VNet-B (East US)                        │
│  Same region. Very low latency (~1ms).                       │
│                                                               │
│  Global Peering:                                             │
│  VNet-A (East US) ══ VNet-D (West Europe)                    │
│  Different regions! Higher latency (~70ms).                  │
│  But still uses Azure backbone (not public internet).        │
│                                                               │
│  Use cases:                                                  │
│  ├─ Disaster recovery (replicate to another region)          │
│  ├─ Multi-region applications                                │
│  └─ Global data access                                       │
└──────────────────────────────────────────────────────────────┘
```

### Step 1: Create VNet in Another Region

```
1. Search "Virtual networks" → "+ Create"
2. Fill in:
   - Resource group: rg-day30-peering
   - Name: vnet-d-westeu
   - Region: West Europe ← DIFFERENT REGION!
   
   IP Addresses:
   - Address space: 10.3.0.0/16
   - Subnet: subnet-global, 10.3.1.0/24

3. Click "Review + create" → "Create"
```

### Step 2: Create VM in West Europe

```
1. Search "Virtual machines" → "+ Create"
2. Fill in:
   - Resource group: rg-day30-peering
   - Name: vm-d
   - Region: West Europe ← DIFFERENT REGION!
   - Image: Ubuntu 22.04 LTS
   - Size: Standard_B1s
   - Username: azureuser
   - Password: Day30Peer@2026
   
   Networking:
   - Virtual network: vnet-d-westeu
   - Subnet: subnet-global

3. Click "Review + create" → "Create"
```

**⏱️ Wait**: 2-3 minutes

```
Setup nginx:
  ssh azureuser@<VM-D-PUBLIC-IP>
  sudo apt update && sudo apt install -y nginx
  sudo bash -c 'echo "<h1>VM-D (Global) - 10.3.1.4</h1><p>VNet-D West Europe</p>" > /var/www/html/index.html'
  exit
```

### Step 3: Create Global Peering (VNet-A ↔ VNet-D)

```
1. Go to "Virtual networks" → vnet-a
2. Left menu → "Peerings"
3. Click "+ Add"
4. Fill in:

   This virtual network:
   - Peering link name: vnet-a-to-vnet-d-global

   Remote virtual network:
   - Peering link name: vnet-d-to-vnet-a-global
   - Virtual network: vnet-d-westeu

5. Click "Add"

Note: Azure Portal shows this is a "Global" peering
because the VNets are in different regions.
```

### Step 4: Test Global Peering

```
SSH into VM-A:
  ssh azureuser@<VM-A-PUBLIC-IP>

Ping VM-D (West Europe):
  ping 10.3.1.4 -c 4

  Expected:
  64 bytes from 10.3.1.4: icmp_seq=1 ttl=64 time=70.23 ms
  64 bytes from 10.3.1.4: icmp_seq=2 ttl=64 time=69.87 ms
  64 bytes from 10.3.1.4: icmp_seq=3 ttl=64 time=70.15 ms

  ✅ Global peering works!
  Notice: ~70ms latency (cross-Atlantic, East US → West Europe)
  Compare: ~1ms for same-region peering

HTTP test:
  curl http://10.3.1.4
  <h1>VM-D (Global) - 10.3.1.4</h1><p>VNet-D West Europe</p>
  ✅ Cross-region HTTP access!

exit
```

### Step 5: Compare Latency

```
From VM-A:

Same-region peering (VNet-B, East US):
  ping 10.1.1.4 -c 4
  Average: ~1ms ← Very fast!

Global peering (VNet-D, West Europe):
  ping 10.3.1.4 -c 4
  Average: ~70ms ← Slower (cross-Atlantic)

┌──────────────────────────────────────────────────────────────┐
│  LATENCY COMPARISON                                           │
│                                                               │
│  Same region (East US → East US):     ~1-2 ms               │
│  Cross-region (East US → West US):    ~30-40 ms             │
│  Cross-continent (East US → West EU): ~70-80 ms             │
│  Cross-world (East US → SE Asia):     ~200+ ms              │
│                                                               │
│  All through Azure backbone (not public internet)            │
│  Still faster and more reliable than internet routing        │
└──────────────────────────────────────────────────────────────┘
```

### Step 6: Test, Check, and Confirm - Global Peering

**Test 1: Peering Status**

```
1. vnet-a → Peerings
   ✅ vnet-a-to-vnet-d-global: Connected

2. vnet-d-westeu → Peerings
   ✅ vnet-d-to-vnet-a-global: Connected
```

**Test 2: Cross-Region Ping**

```
From VM-A: ping 10.3.1.4
✅ Response received (~70ms)
```

**Test 3: Cross-Region HTTP**

```
From VM-A: curl http://10.3.1.4
✅ "VM-D (Global) - 10.3.1.4" received
```

**Test 4: Reverse Direction**

```
From VM-D: ping 10.0.1.4
✅ Response received (bidirectional)
```

**✅ Result**: Global peering working across regions!

---

## Lab 7: Gateway Transit (Hub-and-Spoke)

### What is Gateway Transit?

```
Gateway Transit = Share one VPN Gateway across multiple peered VNets

┌──────────────────────────────────────────────────────────────┐
│  THE PROBLEM:                                                 │
│                                                               │
│  You have 3 VNets that need VPN access to on-premises.      │
│  Without Gateway Transit:                                    │
│  ├─ VNet-A needs its own VPN Gateway ($140/mo)              │
│  ├─ VNet-B needs its own VPN Gateway ($140/mo)              │
│  └─ VNet-C needs its own VPN Gateway ($140/mo)              │
│  Total: $420/month! 😱                                       │
│                                                               │
│  THE SOLUTION:                                               │
│  With Gateway Transit:                                       │
│  ├─ VNet-Hub has ONE VPN Gateway ($140/mo)                  │
│  ├─ VNet-A uses Hub's gateway (free!)                       │
│  ├─ VNet-B uses Hub's gateway (free!)                       │
│  └─ VNet-C uses Hub's gateway (free!)                       │
│  Total: $140/month! ✅                                       │
│                                                               │
│  Hub-and-Spoke Topology:                                     │
│                                                               │
│       VNet-A (spoke)                                         │
│          ║                                                    │
│  VNet-B ═╬═ VNet-Hub (has VPN Gateway)═══ On-Premises       │
│          ║                                                    │
│       VNet-C (spoke)                                         │
│                                                               │
│  All spokes use the Hub's gateway to reach on-premises!     │
└──────────────────────────────────────────────────────────────┘
```

### What We'll Build

```
For this lab, we'll demonstrate Gateway Transit concept
using VNet-A as the Hub (with a VPN Gateway) and VNet-B
as a Spoke (using the Hub's gateway).

┌──────────────────────────────────────────────────────────────┐
│  GATEWAY TRANSIT SETUP                                        │
│                                                               │
│  VNet-A (Hub)                    VNet-B (Spoke)              │
│  ┌──────────────────┐           ┌──────────────────┐        │
│  │ 10.0.0.0/16      │           │ 10.1.0.0/16      │        │
│  │                   │           │                   │        │
│  │ VM-A (10.0.1.4)  │══ Peer ══│ VM-B (10.1.1.4)  │        │
│  │                   │           │                   │        │
│  │ VPN Gateway       │           │ (no gateway)      │        │
│  │ (GatewaySubnet)   │           │ Uses Hub's GW     │        │
│  └──────────────────┘           └──────────────────┘        │
│         ║                                                     │
│    VPN Tunnel                                                │
│         ║                                                     │
│  On-Premises / Other Network                                 │
│                                                               │
│  VNet-B reaches on-premises THROUGH VNet-A's gateway!       │
└──────────────────────────────────────────────────────────────┘
```

### Step 1: Add Gateway Subnet to VNet-A (Hub)

```
1. Go to "Virtual networks" → vnet-a
2. Left menu → "Subnets"
3. Click "+ Gateway subnet"
4. Address range: 10.0.255.0/27
5. Click "Save"
```

### Step 2: Create VPN Gateway on VNet-A (Hub)

```
⚠️ This takes 30-45 minutes!

1. Search "Virtual network gateways" → "+ Create"
2. Fill in:
   - Name: vpngw-hub
   - Region: East US
   - Gateway type: VPN
   - SKU: VpnGw1
   - Generation: Generation1
   - Virtual network: vnet-a
   - Public IP: Create new → pip-vpngw-hub

3. Click "Review + create" → "Create"
```

**⏱️ Wait**: 30-45 minutes

### Step 3: Update Peering - Enable Gateway Transit

```
After VPN Gateway is created:

1. Go to vnet-a → Peerings
2. Click on "vnet-a-to-vnet-b" (existing peering)
3. Update settings:
   
   ✅ Allow gateway transit: ENABLE this!
   (This shares VNet-A's gateway with VNet-B)
   
4. Click "Save"

5. Go to vnet-b → Peerings
6. Click on "vnet-b-to-vnet-a" (existing peering)
7. Update settings:
   
   ✅ Use remote gateway: ENABLE this!
   (This tells VNet-B to use VNet-A's gateway)
   
8. Click "Save"
```

```
What we just configured:

┌──────────────────────────────────────────────────────────────┐
│  GATEWAY TRANSIT SETTINGS                                     │
│                                                               │
│  On VNet-A (Hub) peering to VNet-B:                          │
│  ☑️ Allow gateway transit = YES                              │
│  "I'm sharing my VPN gateway with VNet-B"                    │
│                                                               │
│  On VNet-B (Spoke) peering to VNet-A:                        │
│  ☑️ Use remote gateway = YES                                 │
│  "I'm using VNet-A's VPN gateway"                            │
│                                                               │
│  Result:                                                     │
│  VNet-B's traffic to on-premises goes through                │
│  VNet-A's VPN gateway. No gateway needed on VNet-B!         │
└──────────────────────────────────────────────────────────────┘
```

### Step 4: Verify Gateway Transit

```
1. Go to vnet-a → Peerings → vnet-a-to-vnet-b
   ✅ Gateway transit: Enabled

2. Go to vnet-b → Peerings → vnet-b-to-vnet-a
   ✅ Use remote gateway: Enabled

3. Check VM-B's effective routes:
   Go to VM-B → Networking → NIC → Effective routes
   
   You should see routes from the VPN Gateway:
   ✅ 10.0.0.0/16 → VNet peering
   ✅ Any VPN-learned routes from the gateway
   
   VNet-B now has routes from VNet-A's gateway!
```

### Step 5: Understand Hub-and-Spoke Benefits

```
┌──────────────────────────────────────────────────────────────┐
│  HUB-AND-SPOKE BENEFITS                                       │
│                                                               │
│  1. Cost Savings:                                            │
│     One gateway shared by all spokes                         │
│     Instead of one gateway per VNet                          │
│                                                               │
│  2. Centralized Connectivity:                                │
│     All on-premises traffic goes through Hub                 │
│     Easy to manage and monitor                               │
│                                                               │
│  3. Centralized Security:                                    │
│     Put firewall (NVA) in Hub                                │
│     All spoke traffic passes through it                      │
│                                                               │
│  4. Spoke Isolation:                                         │
│     Spokes don't talk to each other by default               │
│     (peering is not transitive)                              │
│     Add peering between spokes only if needed                │
│                                                               │
│  5. Scalable:                                                │
│     Add new spokes easily                                    │
│     Just peer to Hub and enable "Use remote gateway"         │
│                                                               │
│  Real-world example:                                         │
│  ┌─────────────────────────────────────────────────┐        │
│  │  Hub VNet:                                       │        │
│  │  ├─ VPN Gateway (on-premises connectivity)      │        │
│  │  ├─ Azure Firewall (security)                   │        │
│  │  ├─ Azure Bastion (secure VM access)            │        │
│  │  └─ Shared services (DNS, AD, monitoring)       │        │
│  │                                                   │        │
│  │  Spoke VNets:                                    │        │
│  │  ├─ Spoke-Dev (development workloads)           │        │
│  │  ├─ Spoke-Staging (staging workloads)           │        │
│  │  ├─ Spoke-Prod (production workloads)           │        │
│  │  └─ Spoke-Data (databases, analytics)           │        │
│  └─────────────────────────────────────────────────┘        │
└──────────────────────────────────────────────────────────────┘
```

### Step 6: Test, Check, and Confirm - Gateway Transit

**Test 1: Verify VPN Gateway**

```
1. Virtual network gateways → vpngw-hub
   ✅ Status: Succeeded
   ✅ VNet: vnet-a
   ✅ SKU: VpnGw1
```

**Test 2: Verify Gateway Transit Settings**

```
1. vnet-a → Peerings → vnet-a-to-vnet-b
   ✅ Allow gateway transit: Enabled

2. vnet-b → Peerings → vnet-b-to-vnet-a
   ✅ Use remote gateway: Enabled
```

**Test 3: Verify Effective Routes on Spoke**

```
1. VM-B → Networking → NIC → Effective routes
   ✅ Route to 10.0.0.0/16 via VNet peering
   ✅ Gateway-learned routes visible (if VPN connected)
```

**Test 4: Peering Still Works**

```
From VM-A: ping 10.1.1.4 ✅
From VM-B: ping 10.0.1.4 ✅
(Peering connectivity unaffected by gateway transit)
```

**Test 5: Verify Only Hub Has Gateway**

```
1. vnet-a → Subnets
   ✅ GatewaySubnet exists (10.0.255.0/27)

2. vnet-b → Subnets
   ✅ No GatewaySubnet (uses Hub's gateway)
   ✅ Cost savings!
```

**✅ Result**: Gateway Transit configured!

---

## Complete Summary

```
┌─────────────────────────────────────────────────────────────────┐
│  DAY 30 - VNET PEERING & GATEWAY TRANSIT COMPLETE                │
│                                                                  │
│  VNets Created:                                                 │
│  ├─ vnet-a (10.0.0.0/16) - East US - Hub                       │
│  ├─ vnet-b (10.1.0.0/16) - East US - Spoke                     │
│  ├─ vnet-c (10.2.0.0/16) - East US                             │
│  └─ vnet-d-westeu (10.3.0.0/16) - West Europe                  │
│                                                                  │
│  Peerings:                                                      │
│  ├─ vnet-a ↔ vnet-b (same region, gateway transit)              │
│  ├─ vnet-a ↔ vnet-c (same region)                               │
│  ├─ vnet-b ↔ vnet-c (same region)                               │
│  └─ vnet-a ↔ vnet-d (global, cross-region)                      │
│                                                                  │
│  Key Learnings:                                                 │
│  ├─ Peering = fast, private, Azure backbone                     │
│  ├─ NOT transitive (A↔B↔C ≠ A↔C)                              │
│  ├─ Non-overlapping address spaces required                     │
│  ├─ Two-way setup (both sides needed)                           │
│  ├─ Global peering works cross-region (~70ms)                   │
│  ├─ Gateway Transit shares VPN gateway                          │
│  └─ Hub-and-Spoke = production best practice                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Troubleshooting

### Issue 1: Peering Status "Initiated" (Not Connected)

```
Symptom: One side shows "Initiated" instead of "Connected"

Cause: Only one side of the peering was created

Fix:
  When creating via Portal, both sides are created automatically.
  If using CLI, you must create both sides manually.
  
  Check both VNets → Peerings → Both should show "Connected"
```

### Issue 2: Peering Created but Can't Ping

```
Symptom: Peering shows "Connected" but ping fails

Causes and fixes:

1. NSG blocking ICMP:
   - Check NSG on destination VM
   - Add inbound rule: Allow ICMP from peered VNet range
   - Example: Allow ICMP from 10.0.0.0/16

2. NSG blocking the port:
   - For HTTP: Allow port 80 from peered range
   - For SSH: Allow port 22 from peered range

3. VM firewall:
   - Ubuntu: sudo ufw status
   - If active, allow the traffic

4. Wrong IP address:
   - Verify the private IP of the destination VM
   - Check: VM → Networking → Private IP
```

### Issue 3: Address Space Overlap

```
Symptom: "Cannot create peering - address spaces overlap"

Cause: Both VNets use the same or overlapping IP ranges

Example:
  VNet-A: 10.0.0.0/16 (10.0.0.0 - 10.0.255.255)
  VNet-B: 10.0.0.0/16 (10.0.0.0 - 10.0.255.255)
  ❌ Same range! Can't peer!

Fix:
  Use different address spaces:
  VNet-A: 10.0.0.0/16
  VNet-B: 10.1.0.0/16
  VNet-C: 10.2.0.0/16
  ✅ No overlap!
  
  If VNets already have resources, you may need to recreate
  with different address spaces.
```

### Issue 4: Gateway Transit Fails

```
Symptom: "Use remote gateway" option is grayed out

Causes:
1. Hub VNet doesn't have a VPN Gateway yet
   → Create the gateway first, then enable transit

2. Hub peering doesn't have "Allow gateway transit" enabled
   → Enable it on the Hub side first

3. Spoke already has its own gateway
   → Can't use remote gateway if you have a local one
   → Remove spoke's gateway first
```

---

## Cleanup

### Delete All Resources

```
⚠️ VPN Gateway costs ~$140/month! Delete when done!

1. Delete VPN Gateway first (takes 15-20 minutes):
   - Virtual network gateways → vpngw-hub → Delete
   - ⏱️ Wait for deletion to complete

2. Delete Resource Group (deletes everything else):
   - Resource groups → rg-day30-peering
   - Click "Delete resource group"
   - Type name to confirm → Delete
```

**⏱️ Wait**: 15-20 minutes for gateway, then 5-10 for RG

**✅ Result**: All resources deleted!

---

## Quick Reference

### Create Peering via Portal

```
1. Go to VNet → Peerings → "+ Add"
2. Name both sides of the peering
3. Select remote VNet
4. Configure traffic settings
5. Click "Add"
(Creates both sides automatically)
```

### Create Peering via CLI

```bash
# Create peering A → B
az network vnet peering create \
  --resource-group rg-day30-peering \
  --name vnet-a-to-vnet-b \
  --vnet-name vnet-a \
  --remote-vnet vnet-b \
  --allow-vnet-access

# Create peering B → A (must create both sides!)
az network vnet peering create \
  --resource-group rg-day30-peering \
  --name vnet-b-to-vnet-a \
  --vnet-name vnet-b \
  --remote-vnet vnet-a \
  --allow-vnet-access

# Check peering status
az network vnet peering show \
  --resource-group rg-day30-peering \
  --vnet-name vnet-a \
  --name vnet-a-to-vnet-b \
  --query peeringState
```

### Gateway Transit via CLI

```bash
# Enable gateway transit on Hub
az network vnet peering update \
  --resource-group rg-day30-peering \
  --vnet-name vnet-a \
  --name vnet-a-to-vnet-b \
  --set allowGatewayTransit=true

# Enable use remote gateway on Spoke
az network vnet peering update \
  --resource-group rg-day30-peering \
  --vnet-name vnet-b \
  --name vnet-b-to-vnet-a \
  --set useRemoteGateways=true
```

### Peering Limits

```
Max peerings per VNet: 500
Max address prefixes advertised: 4000 (Standard peering)
Peering setup time: < 1 minute
Data transfer cost: Same region = free, Cross-region = charged
```

### Useful Links

- [VNet Peering Documentation](https://learn.microsoft.com/azure/virtual-network/virtual-network-peering-overview)
- [Hub-and-Spoke Topology](https://learn.microsoft.com/azure/architecture/reference-architectures/hybrid-networking/hub-spoke)
- [Gateway Transit](https://learn.microsoft.com/azure/vpn-gateway/vpn-gateway-peering-gateway-transit)
- [Peering Pricing](https://azure.microsoft.com/pricing/details/virtual-network/)

---

**🎉 Congratulations!** You've completed Day 30 covering VNet Peering, Global Peering, and Gateway Transit with Hub-and-Spoke topology!