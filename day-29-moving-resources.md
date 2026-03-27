# Day 29: Moving Azure Resources Between Resource Groups & Subscriptions

## What You'll Learn

Reorganize your Azure resources by moving them:
- ✅ What is resource moving and why do it
- ✅ Move resources between Resource Groups
- ✅ Move resources between Subscriptions
- ✅ What CAN and CANNOT be moved
- ✅ Dependencies and what moves together
- ✅ Validation before moving
- ✅ Move VMs, Storage, VNets, and more
- ✅ Complete test, check, and confirm

## Table of Contents

1. [What is Resource Moving?](#what-is-resource-moving)
2. [Why Move Resources?](#why-move-resources)
3. [Rules and Limitations](#rules-and-limitations)
4. [Lab 1: Setup - Create Resources to Move](#lab-1-setup---create-resources-to-move)
5. [Lab 2: Move Storage Account to Another RG](#lab-2-move-storage-account-to-another-rg)
6. [Lab 3: Move Virtual Network](#lab-3-move-virtual-network)
7. [Lab 4: Move Virtual Machine (with Dependencies)](#lab-4-move-virtual-machine-with-dependencies)
8. [Lab 5: Move Resources Between Subscriptions](#lab-5-move-resources-between-subscriptions)
9. [Lab 6: What Cannot Be Moved](#lab-6-what-cannot-be-moved)
10. [Lab 7: Validate Before Moving](#lab-7-validate-before-moving)
11. [Troubleshooting](#troubleshooting)
12. [Cleanup](#cleanup)

---

## What is Resource Moving?

**Resource Moving** = Changing which Resource Group (or Subscription) a resource belongs to, WITHOUT recreating it.

### Simple Explanation

```
Think of it like this:

🏢 Office Analogy:
  You have 3 departments (Resource Groups):
  ├─ Marketing Department (rg-marketing)
  ├─ Engineering Department (rg-engineering)
  └─ Finance Department (rg-finance)

  A server was put in Marketing by mistake.
  It should be in Engineering.

  WITHOUT moving:
    Delete server from Marketing → Recreate in Engineering
    ❌ Downtime! Data loss! Reconfiguration!

  WITH moving:
    Move server from Marketing → Engineering
    ✅ No downtime! No data loss! Same configuration!
    Just changes the "department" label.

☁️ Azure:
  Resource Group = A folder/container for resources
  Moving = Changing which folder a resource is in
  The resource itself DOES NOT change!
  Same IP, same data, same configuration.
  Only the resource group assignment changes.
```

### What Actually Happens When You Move?

```
┌──────────────────────────────────────────────────────────────┐
│  WHAT CHANGES vs WHAT STAYS THE SAME                          │
│                                                               │
│  CHANGES:                                                    │
│  ├─ Resource Group (the "folder")                            │
│  └─ Resource ID (because RG name is in the ID)              │
│     Before: /subscriptions/.../rg-old/providers/.../myVM     │
│     After:  /subscriptions/.../rg-new/providers/.../myVM     │
│                                                               │
│  STAYS THE SAME:                                             │
│  ├─ Resource name (myVM is still myVM)                       │
│  ├─ Resource location/region (still East US)                 │
│  ├─ Resource configuration (same size, same settings)        │
│  ├─ Data (nothing is deleted or changed)                     │
│  ├─ IP addresses (public and private)                        │
│  ├─ DNS names                                                │
│  ├─ Tags                                                     │
│  └─ RBAC permissions on the resource itself                  │
│                                                               │
│  ⚠️ IMPORTANT:                                               │
│  The resource ID changes! If any scripts or apps use the     │
│  full resource ID, they need to be updated.                  │
└──────────────────────────────────────────────────────────────┘
```

---

## Why Move Resources?

### Common Reasons

```
┌─────────────────────────────────────────────────────────────────┐
│  WHY MOVE RESOURCES?                                             │
│                                                                  │
│  1. REORGANIZATION                                              │
│     "We restructured our teams. Resources need to match."       │
│     Before: All resources in one big rg-everything              │
│     After: rg-web-team, rg-api-team, rg-data-team              │
│                                                                  │
│  2. COST MANAGEMENT                                             │
│     "We need to track costs per project."                       │
│     Before: rg-shared (can't tell which project costs what)     │
│     After: rg-project-a, rg-project-b (clear cost per project) │
│                                                                  │
│  3. ENVIRONMENT SEPARATION                                      │
│     "Dev and Prod resources are mixed together!"                │
│     Before: rg-mixed (dev + prod in same group)                 │
│     After: rg-dev, rg-prod (clean separation)                   │
│                                                                  │
│  4. SUBSCRIPTION MIGRATION                                      │
│     "We're moving to a new subscription for billing."           │
│     Before: Resources in old-subscription                       │
│     After: Resources in new-subscription                        │
│                                                                  │
│  5. OWNERSHIP CHANGE                                            │
│     "Team A no longer owns this service. Team B does."          │
│     Move from rg-team-a to rg-team-b                            │
│                                                                  │
│  6. MISTAKE CORRECTION                                          │
│     "Someone created the VM in the wrong resource group!"       │
│     Move to the correct group                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Rules and Limitations

### What CAN Be Moved?

```
┌─────────────────────────────────────────────────────────────────┐
│  ✅ CAN BE MOVED (Common Resources)                             │
│                                                                  │
│  Compute:                                                       │
│  ├─ Virtual Machines (with all disks and NICs)                  │
│  ├─ Availability Sets                                           │
│  ├─ Managed Disks                                               │
│  └─ VM Scale Sets                                               │
│                                                                  │
│  Storage:                                                       │
│  ├─ Storage Accounts                                            │
│  └─ Managed Disks                                               │
│                                                                  │
│  Networking:                                                    │
│  ├─ Virtual Networks (with all subnets)                         │
│  ├─ Network Security Groups                                    │
│  ├─ Public IP Addresses                                         │
│  ├─ Network Interfaces                                          │
│  ├─ Load Balancers                                              │
│  └─ Application Gateways                                        │
│                                                                  │
│  Databases:                                                     │
│  ├─ Azure SQL (server + databases together)                     │
│  ├─ Cosmos DB                                                   │
│  └─ Azure Cache for Redis                                       │
│                                                                  │
│  Other:                                                         │
│  ├─ Key Vault                                                   │
│  ├─ App Service Plans + Web Apps                                │
│  ├─ Container Registry                                          │
│  └─ Log Analytics Workspace                                     │
└─────────────────────────────────────────────────────────────────┘
```

### What CANNOT Be Moved?

```
┌─────────────────────────────────────────────────────────────────┐
│  ❌ CANNOT BE MOVED (or has restrictions)                        │
│                                                                  │
│  Cannot move at all:                                            │
│  ├─ Azure Active Directory resources                            │
│  ├─ Azure Backup (Recovery Services vault with backups)         │
│  ├─ Azure Databricks workspace                                  │
│  └─ Classic deployment resources                                │
│                                                                  │
│  Can move but with restrictions:                                │
│  ├─ VMs with Managed Disks:                                     │
│  │   Must move VM + all disks + NIC together                    │
│  │                                                               │
│  ├─ Virtual Networks:                                           │
│  │   Must move all dependent resources together                 │
│  │   (VMs, NICs, NSGs that reference the VNet)                  │
│  │                                                               │
│  ├─ App Service:                                                │
│  │   Plan + all apps must move together                         │
│  │   Cannot move across regions                                 │
│  │                                                               │
│  ├─ Key Vault:                                                  │
│  │   Can move, but disk encryption references may break         │
│  │                                                               │
│  └─ SQL Server:                                                 │
│      Server + all databases must move together                  │
│      Cannot move just one database                              │
└─────────────────────────────────────────────────────────────────┘
```

### Key Rules

```
┌──────────────────────────────────────────────────────────────┐
│  RULES FOR MOVING RESOURCES                                   │
│                                                               │
│  Rule 1: Source and destination must be in same tenant       │
│  (Azure AD tenant, not region)                               │
│                                                               │
│  Rule 2: Destination RG must already exist                   │
│  (Azure won't create it for you)                             │
│                                                               │
│  Rule 3: Resources are LOCKED during move                    │
│  (Can't modify source or destination RG during move)         │
│  (Resources still RUN, just can't be changed)                │
│                                                               │
│  Rule 4: Moving doesn't change the resource's region         │
│  (VM in East US stays in East US after move)                 │
│  (To change region, you need a different process)            │
│                                                               │
│  Rule 5: Dependent resources may need to move together       │
│  (VM + NIC + Disk = must move as a group)                    │
│                                                               │
│  Rule 6: Resource locks must be removed first                │
│  (If resource has a Delete or ReadOnly lock, remove it)      │
│                                                               │
│  Rule 7: You need permissions on BOTH source and destination │
│  (Write access on source RG + Write access on destination RG)│
└──────────────────────────────────────────────────────────────┘
```

---

## Lab 1: Setup - Create Resources to Move

### What We'll Create

```
┌──────────────────────────────────────────────────────────────┐
│  SETUP: Create resources in rg-source, then move them        │
│                                                               │
│  rg-source (source resource group):                          │
│  ├─ stday29source (Storage Account)                          │
│  ├─ vnet-day29 (Virtual Network)                             │
│  │   └─ subnet-web (10.0.1.0/24)                            │
│  ├─ nsg-day29 (Network Security Group)                       │
│  ├─ pip-day29 (Public IP)                                    │
│  ├─ nic-day29 (Network Interface)                            │
│  └─ vm-day29 (Virtual Machine)                               │
│                                                               │
│  rg-destination (empty, waiting for resources):              │
│  └─ (empty)                                                  │
│                                                               │
│  rg-destination-2 (empty, for second move):                  │
│  └─ (empty)                                                  │
└──────────────────────────────────────────────────────────────┘
```

### Step 1: Create Resource Groups

```
1. Open Azure Portal
2. Search "Resource groups" → "+ Create"

   Create 3 resource groups:

   Group 1:
   - Name: rg-source
   - Region: East US
   - Click "Review + create" → "Create"

   Group 2:
   - Name: rg-destination
   - Region: East US
   - Click "Review + create" → "Create"

   Group 3:
   - Name: rg-destination-2
   - Region: East US
   - Click "Review + create" → "Create"
```

### Step 2: Create Storage Account

```
1. Search "Storage accounts" → "+ Create"
2. Fill in:
   - Resource group: rg-source
   - Name: stday29source (must be globally unique)
   - Region: East US
   - Performance: Standard
   - Redundancy: LRS
3. Click "Review + create" → "Create"
```

### Step 3: Upload Test Data to Storage

```
1. Go to stday29source
2. Left menu → "Containers"
3. Click "+ Container"
   - Name: test-data
   - Click "Create"
4. Click into "test-data"
5. Click "Upload"
   - Upload any small file (e.g., a text file)
   - Click "Upload"
```

### Step 4: Create Virtual Network

```
1. Search "Virtual networks" → "+ Create"
2. Fill in:
   - Resource group: rg-source
   - Name: vnet-day29
   - Region: East US
   - Address space: 10.0.0.0/16
   - Subnet: subnet-web, 10.0.1.0/24
3. Click "Review + create" → "Create"
```

### Step 5: Create Virtual Machine

```
1. Search "Virtual machines" → "+ Create" → "Azure virtual machine"
2. Fill in:

   Basics:
   - Resource group: rg-source
   - Name: vm-day29
   - Region: East US
   - Image: Ubuntu Server 22.04 LTS
   - Size: Standard_B1s
   - Authentication: Password
   - Username: azureuser
   - Password: Day29Move@2026
   - Public inbound ports: Allow SSH (22)

   Networking:
   - Virtual network: vnet-day29
   - Subnet: subnet-web
   - Public IP: Create new → pip-day29

3. Click "Review + create" → "Create"
```

**⏱️ Wait**: 2-3 minutes

### Step 6: Add Data to VM

```
1. SSH into the VM:
   ssh azureuser@<VM-PUBLIC-IP>

2. Create test data:
   echo "Important data before move - $(date)" > ~/before-move.txt
   echo "This file proves data survives the move" >> ~/before-move.txt
   cat ~/before-move.txt

3. Note the private IP:
   hostname -I
   # Expected: 10.0.1.4

4. Exit:
   exit
```

### Step 7: Verify All Resources in Source

```
1. Go to resource group: rg-source
2. Verify all resources:
   ✅ stday29source (Storage Account)
   ✅ vnet-day29 (Virtual Network)
   ✅ vm-day29 (Virtual Machine)
   ✅ vm-day29_OsDisk_xxx (Managed Disk)
   ✅ pip-day29 (Public IP)
   ✅ vm-day29-nic (Network Interface) 
   ✅ vm-day29-nsg (Network Security Group)

3. Note the resource count (should be ~7 resources)
```

### Step 8: Verify Destination is Empty

```
1. Go to rg-destination
2. Verify:
   ✅ 0 resources (empty)

3. Go to rg-destination-2
4. Verify:
   ✅ 0 resources (empty)
```

**✅ Result**: Setup complete! Ready to move resources.

---

## Lab 2: Move Storage Account to Another RG

### What We'll Do

```
Move stday29source from rg-source → rg-destination

This is the SIMPLEST move because:
  - Storage account has no dependencies
  - It moves by itself
  - Data stays intact
  - Connection strings stay the same
```

### Step 1: Start the Move

```
1. Go to resource group: rg-source
2. Find stday29source (Storage Account)
3. Check the checkbox next to it ☑️
4. Click "Move" (top menu) → "Move to another resource group"

   OR

1. Go to stday29source (click on it)
2. Click "Move" (top menu) → "Move to another resource group"
```

### Step 2: Configure the Move

```
1. Move resources blade opens:
   
   Source resource group: rg-source (auto-filled)
   
   Resources to move:
   ✅ stday29source (checked)
   
   Destination:
   - Resource group: Select "rg-destination"
   
   ☑️ "I understand that tools and scripts associated with 
       moved resources will not work until I update them to 
       use new resource IDs"
   
2. Click "Next: Review"
3. Azure validates the move (checks if it's possible)
4. After validation passes → Click "Move"
```

**⏱️ Wait**: 2-5 minutes

### Step 3: Monitor the Move

```
1. A notification appears: "Moving resources..."
2. You can also check:
   - Click the bell icon (notifications) in top bar
   - Or go to rg-source → Activity Log
   
3. Wait for: "Successfully moved resources"
```

### Step 4: Verify the Move

```
1. Go to rg-source:
   ✅ stday29source is GONE from here

2. Go to rg-destination:
   ✅ stday29source is HERE now!

3. Click on stday29source:
   ✅ Resource group shows: rg-destination
   ✅ Location: East US (unchanged!)
   ✅ All settings unchanged
```

### Step 5: Verify Data Survived

```
1. Go to stday29source → Containers → test-data
2. Verify:
   ✅ Your uploaded file is still there!
   ✅ Data was NOT deleted during move
   ✅ Container and blobs intact
```

### Step 6: Test, Check, and Confirm

**Test 1: Verify Resource Moved**

```
1. rg-source → Resources
   ✅ stday29source NOT listed (moved away)

2. rg-destination → Resources
   ✅ stday29source IS listed (moved here)
```

**Test 2: Verify Data Intact**

```
1. stday29source → Containers → test-data
   ✅ Files still exist
   ✅ No data loss
```

**Test 3: Verify Resource ID Changed**

```
1. Click stday29source → Properties
2. Resource ID now contains "rg-destination":
   /subscriptions/.../resourceGroups/rg-destination/providers/
   Microsoft.Storage/storageAccounts/stday29source
   ✅ Resource ID updated to new RG
```

**Test 4: Verify Settings Unchanged**

```
1. stday29source → Overview
   ✅ Location: East US (same)
   ✅ Performance: Standard (same)
   ✅ Redundancy: LRS (same)
   ✅ Name: stday29source (same)
```

**✅ Result**: Storage account moved successfully!

---

## Lab 3: Move Virtual Network

### What We'll Do

```
Move vnet-day29 from rg-source → rg-destination

⚠️ VNet has dependencies!
  VNet is connected to: NIC → VM
  
  But we can move the VNet separately IF no VNet peering exists.
  The NIC references the VNet, but they can be in different RGs.
```

### Step 1: Move the VNet

```
1. Go to resource group: rg-source
2. Check ☑️ vnet-day29
3. Click "Move" → "Move to another resource group"
4. Destination: rg-destination
5. Check the acknowledgment checkbox
6. Click "Next: Review" → Wait for validation → "Move"
```

**⏱️ Wait**: 2-5 minutes

### Step 2: Verify VNet Move

```
1. Go to rg-destination:
   ✅ vnet-day29 is here
   ✅ stday29source is also here (from Lab 2)

2. Go to rg-source:
   ✅ vnet-day29 is gone
   ✅ VM and related resources still here
```

### Step 3: Verify VM Still Works

```
The VM's NIC still references the VNet, even though they're
now in different resource groups. This is fine!

1. SSH into vm-day29:
   ssh azureuser@<VM-PUBLIC-IP>

2. Verify:
   hostname -I
   # Still 10.0.1.4 ✅

   cat ~/before-move.txt
   # Data still there ✅

3. Exit:
   exit

✅ VM still works even though VNet is in a different RG!
```

### Step 4: Test, Check, and Confirm

**Test 1: VNet in New RG**

```
1. rg-destination → Resources
   ✅ vnet-day29 listed
   ✅ Address space: 10.0.0.0/16 (unchanged)
   ✅ Subnets: subnet-web (unchanged)
```

**Test 2: VM Still Functional**

```
1. SSH to vm-day29 works ✅
2. Private IP unchanged ✅
3. Data intact ✅
```

**Test 3: Cross-RG Reference Works**

```
1. Go to vm-day29 → Networking
2. VNet shows: vnet-day29 (in rg-destination)
   ✅ Cross-resource-group reference works!
   ✅ Resources can reference each other across RGs
```

**✅ Result**: VNet moved, VM still works across RGs!

---

## Lab 4: Move Virtual Machine (with Dependencies)

### What We'll Do

```
Move vm-day29 and ALL its dependencies from rg-source → rg-destination

VM dependencies that MUST move together:
  ├─ vm-day29 (Virtual Machine)
  ├─ vm-day29_OsDisk_xxx (OS Disk)
  ├─ vm-day29-nic (Network Interface)
  ├─ vm-day29-nsg (Network Security Group)
  └─ pip-day29 (Public IP)

All of these must go together!
```

### Understanding VM Dependencies

```
┌──────────────────────────────────────────────────────────────┐
│  VM DEPENDENCY CHAIN                                          │
│                                                               │
│  Virtual Machine                                             │
│  ├─ OS Disk (MUST move with VM)                              │
│  ├─ Data Disks (MUST move with VM)                           │
│  ├─ Network Interface (MUST move with VM)                    │
│  │   ├─ Public IP (should move together)                     │
│  │   └─ NSG on NIC (should move together)                    │
│  └─ Extensions (move with VM automatically)                  │
│                                                               │
│  If you try to move VM without its disk:                     │
│  ❌ "Cannot move VM without its managed disks"               │
│                                                               │
│  If you try to move disk without its VM:                     │
│  ❌ "Disk is attached to VM, move them together"             │
│                                                               │
│  Azure will TELL you what needs to move together!            │
└──────────────────────────────────────────────────────────────┘
```

### Step 1: Select All VM Resources

```
1. Go to resource group: rg-source
2. Check ALL remaining resources:
   ☑️ vm-day29 (Virtual Machine)
   ☑️ vm-day29_OsDisk_xxx (Disk)
   ☑️ vm-day29-nic (Network Interface)
   ☑️ vm-day29-nsg (Network Security Group)
   ☑️ pip-day29 (Public IP)

   Select ALL of them!

3. Click "Move" → "Move to another resource group"
```

### Step 2: Configure the Move

```
1. Move resources blade:
   
   Resources to move:
   ✅ vm-day29
   ✅ vm-day29_OsDisk_xxx
   ✅ vm-day29-nic
   ✅ vm-day29-nsg
   ✅ pip-day29
   
   Destination: rg-destination
   
   ☑️ Acknowledge checkbox

2. Click "Next: Review"
3. Wait for validation...

   If validation fails:
   - It will tell you which resources are missing
   - Add the missing resources and try again
   
   If validation passes:
   - Click "Move"
```

**⏱️ Wait**: 5-10 minutes (VMs take longer to move)

```
⚠️ During the move:
  - VM continues to RUN (no downtime!)
  - But you can't modify the VM or its resources
  - Source and destination RGs are locked temporarily
  - After move completes, everything unlocks
```

### Step 3: Verify the Move

```
1. Go to rg-source:
   ✅ Should be EMPTY (0 resources)
   All resources have been moved!

2. Go to rg-destination:
   ✅ stday29source (from Lab 2)
   ✅ vnet-day29 (from Lab 3)
   ✅ vm-day29
   ✅ vm-day29_OsDisk_xxx
   ✅ vm-day29-nic
   ✅ vm-day29-nsg
   ✅ pip-day29
   
   All resources now in rg-destination!
```

### Step 4: Verify VM Still Works

```
1. Go to vm-day29 → Overview
   ✅ Status: Running
   ✅ Resource group: rg-destination
   ✅ Public IP: Same as before

2. SSH into the VM:
   ssh azureuser@<SAME-PUBLIC-IP>

3. Verify data:
   cat ~/before-move.txt
   # "Important data before move - <date>"
   ✅ Data survived the move!

4. Verify network:
   hostname -I
   # 10.0.1.4
   ✅ Private IP unchanged!

5. Verify internet:
   curl -s ifconfig.me
   # Shows public IP
   ✅ Internet connectivity works!

6. Exit:
   exit
```

### Step 5: Test, Check, and Confirm

**Test 1: Source RG Empty**

```
1. rg-source → Resources
   ✅ 0 resources (all moved)
```

**Test 2: All Resources in Destination**

```
1. rg-destination → Resources
   ✅ 7 resources total
   ✅ Storage, VNet, VM, Disk, NIC, NSG, Public IP
```

**Test 3: VM Running**

```
1. vm-day29 → Overview
   ✅ Status: Running
   ✅ No restart needed
   ✅ No downtime occurred
```

**Test 4: SSH Works**

```
1. ssh azureuser@<PUBLIC-IP>
   ✅ Connection successful
   ✅ Same IP as before
```

**Test 5: Data Intact**

```
1. cat ~/before-move.txt
   ✅ File exists with original content
   ✅ No data loss
```

**Test 6: Resource IDs Updated**

```
1. vm-day29 → Properties → Resource ID
   ✅ Contains "rg-destination" (not "rg-source")
```

**✅ Result**: VM and all dependencies moved successfully!

---

## Lab 5: Move Resources Between Subscriptions

### What is Cross-Subscription Move?

```
┌──────────────────────────────────────────────────────────────┐
│  CROSS-SUBSCRIPTION MOVE                                      │
│                                                               │
│  Same as moving between RGs, but across subscriptions!       │
│                                                               │
│  Subscription A                  Subscription B              │
│  ├─ rg-old                       ├─ rg-new                   │
│  │   └─ myVM ──── MOVE ────────→│   └─ myVM                 │
│  │                               │                            │
│                                                               │
│  Requirements:                                               │
│  ├─ Both subscriptions in same Azure AD tenant               │
│  ├─ You have permissions on both subscriptions               │
│  ├─ Destination RG must exist                                │
│  ├─ Resource provider must be registered in destination sub  │
│  └─ Subscription quotas must allow the resources             │
│                                                               │
│  ⚠️ If you only have ONE subscription, you can still        │
│  practice by moving between RGs (same concept).              │
└──────────────────────────────────────────────────────────────┘
```

### Step 1: Move Storage to Another Subscription (If Available)

```
If you have 2 subscriptions:

1. Go to stday29source in rg-destination
2. Click "Move" → "Move to another subscription"
3. Fill in:
   - Destination subscription: Select your other subscription
   - Destination resource group: Select or create one
   - Check acknowledgment
4. Click "Next: Review" → "Move"

If you only have 1 subscription:
  Skip this lab. The process is identical to moving between RGs,
  just with an extra "subscription" dropdown.
```

### Step 2: Move Between RGs (Alternative Practice)

```
Let's move the storage account one more time to practice:

1. Go to rg-destination → stday29source
2. Click "Move" → "Move to another resource group"
3. Destination: rg-destination-2
4. Check acknowledgment → Review → Move

⏱️ Wait: 2-5 minutes
```

### Step 3: Verify

```
1. rg-destination-2:
   ✅ stday29source is here now

2. rg-destination:
   ✅ stday29source is gone (moved to rg-destination-2)
   ✅ VM and other resources still here
```

### Step 4: Move It Back

```
Let's move it back to keep things organized:

1. rg-destination-2 → stday29source
2. Move → Move to another resource group
3. Destination: rg-destination
4. Move

Now everything is back in rg-destination.
```

### Step 5: Test, Check, and Confirm

**Test 1: Verify Multiple Moves**

```
1. stday29source → Activity Log
2. Verify:
   ✅ Multiple "Move" operations in history
   ✅ All succeeded
   ✅ Resource survived multiple moves
```

**Test 2: Verify Data After Multiple Moves**

```
1. stday29source → Containers → test-data
   ✅ Files still exist after 3 moves!
   ✅ Data is never affected by moves
```

**✅ Result**: Cross-RG moves work repeatedly!

---

## Lab 6: What Cannot Be Moved

### Step 1: Understand Move Limitations

```
Let's explore what happens when you try to move something
that can't be moved or has restrictions.
```

### Common Move Failures and Why

```
┌─────────────────────────────────────────────────────────────────┐
│  MOVE FAILURES YOU'LL ENCOUNTER                                  │
│                                                                  │
│  1. "Resource has a lock"                                       │
│     ┌─────────────────────────────────────────────────────┐    │
│     │  Error: Cannot move resource with active lock        │    │
│     │  Fix: Remove the lock → Move → Re-add lock          │    │
│     └─────────────────────────────────────────────────────┘    │
│                                                                  │
│  2. "Dependent resources must move together"                    │
│     ┌─────────────────────────────────────────────────────┐    │
│     │  Error: VM disk must move with the VM                │    │
│     │  Fix: Select ALL dependent resources                 │    │
│     └─────────────────────────────────────────────────────┘    │
│                                                                  │
│  3. "Resource provider not registered"                          │
│     ┌─────────────────────────────────────────────────────┐    │
│     │  Error: Microsoft.Compute not registered in          │    │
│     │  destination subscription                            │    │
│     │  Fix: Register the provider in destination sub       │    │
│     └─────────────────────────────────────────────────────┘    │
│                                                                  │
│  4. "Quota exceeded"                                            │
│     ┌─────────────────────────────────────────────────────┐    │
│     │  Error: Destination subscription doesn't have        │    │
│     │  enough quota for this VM size                       │    │
│     │  Fix: Request quota increase in destination          │    │
│     └─────────────────────────────────────────────────────┘    │
│                                                                  │
│  5. "Resource type doesn't support move"                        │
│     ┌─────────────────────────────────────────────────────┐    │
│     │  Error: This resource type cannot be moved           │    │
│     │  Fix: Recreate the resource in the destination       │    │
│     └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Step 2: Test Resource Lock Blocking Move

```
1. Add a lock to the storage account:
   - Go to stday29source
   - Left menu → "Locks"
   - Click "+ Add"
   - Lock name: prevent-move
   - Lock type: Delete
   - Click "OK"

2. Try to move the storage account:
   - Click "Move" → "Move to another resource group"
   - Destination: rg-destination-2
   - Click "Next: Review"
   
3. Expected result:
   ❌ Validation FAILS
   "Cannot move resource because it has a lock"
   
   ✅ Lock prevents the move!

4. Remove the lock:
   - stday29source → Locks
   - Delete the "prevent-move" lock
   
   Now the move would work again.
```

### Step 3: Check Move Support for Any Resource

```
Before moving, you can check if a resource type supports move:

1. Go to: https://learn.microsoft.com/azure/azure-resource-manager/
   management/move-support-resources
   
   This page lists EVERY Azure resource type and whether it
   supports move between RGs and subscriptions.

2. Or use Azure CLI:
   az resource list --resource-group rg-destination \
     --query "[].{Name:name, Type:type}" -o table
   
   Then check each type against the documentation.
```

### Step 4: Test, Check, and Confirm

**Test 1: Lock Blocks Move**

```
1. Add lock to resource
2. Try to move
   ✅ Validation fails with lock error
3. Remove lock
   ✅ Move would succeed now
```

**Test 2: Understand Limitations**

```
✅ Know which resources can't be moved
✅ Know about dependency requirements
✅ Know about lock restrictions
✅ Know where to check move support
```

**✅ Result**: Understand move limitations!

---

## Lab 7: Validate Before Moving

### What is Move Validation?

```
Validation = Check if a move will succeed BEFORE actually doing it

┌──────────────────────────────────────────────────────────────┐
│  VALIDATE MOVE (Dry Run)                                      │
│                                                               │
│  Like a "what if" check:                                     │
│  "Can I move these resources?"                               │
│  Azure checks everything without actually moving.            │
│                                                               │
│  Checks:                                                     │
│  ├─ Resource type supports move? ✅/❌                       │
│  ├─ Dependencies included? ✅/❌                             │
│  ├─ Locks present? ✅/❌                                     │
│  ├─ Permissions sufficient? ✅/❌                            │
│  ├─ Quotas available? ✅/❌                                  │
│  └─ Provider registered? ✅/❌                               │
│                                                               │
│  If all checks pass → Safe to move!                          │
│  If any check fails → Fix the issue first.                   │
└──────────────────────────────────────────────────────────────┘
```

### Step 1: Validate via Portal

```
The Portal validates automatically when you click "Next: Review":

1. Go to rg-destination → Select any resource
2. Click "Move" → "Move to another resource group"
3. Destination: rg-destination-2
4. Click "Next: Review"

5. Azure runs validation:
   - Spinner shows "Validating..."
   - Takes 10-30 seconds
   
   If valid:
   ✅ "Validation passed" → You can click "Move"
   (But click "Cancel" - we're just testing validation)
   
   If invalid:
   ❌ Error message explains what's wrong
```

### Step 2: Validate via CLI

```bash
# Validate move without actually moving
az resource invoke-action \
  --action validateMoveResources \
  --ids "/subscriptions/<sub-id>/resourceGroups/rg-destination" \
  --request-body '{
    "resources": [
      "/subscriptions/<sub-id>/resourceGroups/rg-destination/providers/Microsoft.Storage/storageAccounts/stday29source"
    ],
    "targetResourceGroup": "/subscriptions/<sub-id>/resourceGroups/rg-destination-2"
  }'

# If valid: Returns 204 (no content = success)
# If invalid: Returns error with details
```

### Step 3: Check Move Support via CLI

```bash
# List all resources in a group with their types
az resource list \
  --resource-group rg-destination \
  --query "[].{Name:name, Type:type, Location:location}" \
  --output table

# Output:
# Name              Type                                      Location
# ----------------  ----------------------------------------  --------
# stday29source     Microsoft.Storage/storageAccounts         eastus
# vnet-day29        Microsoft.Network/virtualNetworks         eastus
# vm-day29          Microsoft.Compute/virtualMachines         eastus
# ...
```

### Step 4: Test, Check, and Confirm

**Test 1: Portal Validation**

```
1. Start a move → Click "Next: Review"
2. Verify:
   ✅ Validation runs automatically
   ✅ Shows pass/fail result
   ✅ Can cancel without moving
```

**Test 2: Understand Validation Results**

```
✅ Know that validation happens before every move
✅ Know that validation checks dependencies, locks, permissions
✅ Know that you can validate via CLI too
```

**✅ Result**: Move validation understood!

---

## Moving Resources - Complete Flow

```
┌──────────────────────────────────────────────────────────────────┐
│  COMPLETE MOVE CHECKLIST                                          │
│                                                                   │
│  Before Moving:                                                  │
│  □ Check if resource type supports move                          │
│  □ Identify ALL dependent resources                              │
│  □ Remove any resource locks                                     │
│  □ Verify permissions on source AND destination                  │
│  □ Ensure destination RG exists                                  │
│  □ Check quotas in destination (for cross-sub moves)             │
│  □ Register resource providers in destination sub                │
│  □ Update any scripts/apps that use resource IDs                 │
│                                                                   │
│  During Moving:                                                  │
│  □ Resources are locked (can't modify)                           │
│  □ Resources continue to RUN (no downtime)                       │
│  □ Move takes 2-15 minutes typically                             │
│  □ Monitor via notifications or Activity Log                     │
│                                                                   │
│  After Moving:                                                   │
│  □ Verify resources in destination RG                            │
│  □ Verify data is intact                                         │
│  □ Verify connectivity (SSH, HTTP, etc.)                         │
│  □ Update resource IDs in scripts/apps                           │
│  □ Re-add resource locks if needed                               │
│  □ Update RBAC if RG-level permissions changed                   │
│  □ Update monitoring/alerts if they reference RG                 │
│  □ Verify billing shows in correct RG/sub                        │
└──────────────────────────────────────────────────────────────────┘
```

---

## Troubleshooting

### Issue 1: "Validation Failed"

```
Symptom: Move validation fails

Common causes and fixes:

1. Missing dependent resources:
   Error: "Resource X depends on resource Y"
   Fix: Include resource Y in the move

2. Resource lock:
   Error: "Resource has an active lock"
   Fix: Remove lock → Move → Re-add lock

3. Resource type not supported:
   Error: "Resource type does not support move"
   Fix: Recreate the resource in destination

4. Insufficient permissions:
   Error: "Authorization failed"
   Fix: Get Contributor role on both source and destination RGs
```

### Issue 2: Move Takes Too Long

```
Symptom: Move has been running for > 30 minutes

Normal durations:
  Storage Account: 2-5 minutes
  VNet: 2-5 minutes
  VM + dependencies: 5-15 minutes
  Large number of resources: 15-30 minutes

If stuck:
  1. Check Activity Log for errors
  2. Check notifications (bell icon)
  3. If failed, resources stay in source (safe)
  4. Try again after fixing the issue
```

### Issue 3: Resource ID Changed

```
Symptom: Scripts/apps stopped working after move

Cause: Resource ID includes the RG name, which changed

Fix:
  Before: /subscriptions/.../rg-source/providers/.../myVM
  After:  /subscriptions/.../rg-destination/providers/.../myVM

  Update all references to use the new resource ID.
  
  Tip: Use resource names instead of full IDs where possible.
  Names don't change during moves!
```

---

## Complete Summary

```
┌─────────────────────────────────────────────────────────────────┐
│  DAY 29 - MOVING RESOURCES COMPLETE                              │
│                                                                  │
│  What We Moved:                                                 │
│  ├─ Lab 2: Storage Account (simple, no dependencies)            │
│  │   rg-source → rg-destination ✅                              │
│  │                                                               │
│  ├─ Lab 3: Virtual Network (cross-RG references work)           │
│  │   rg-source → rg-destination ✅                              │
│  │                                                               │
│  ├─ Lab 4: VM + all dependencies (5 resources together)         │
│  │   rg-source → rg-destination ✅                              │
│  │                                                               │
│  └─ Lab 5: Storage between RGs (multiple moves)                 │
│     rg-destination → rg-destination-2 → rg-destination ✅       │
│                                                                  │
│  Key Learnings:                                                 │
│  ├─ Move = change RG, NOT recreate                              │
│  ├─ Data stays intact                                           │
│  ├─ No downtime (resources keep running)                        │
│  ├─ Resource ID changes (update scripts!)                       │
│  ├─ Dependent resources must move together                      │
│  ├─ Locks must be removed before moving                         │
│  ├─ Validation checks before actual move                        │
│  └─ Some resources can't be moved (check docs)                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Cleanup

### Delete All Resources

```
1. Delete resource groups (deletes everything inside):
   
   - Resource groups → rg-source → Delete
     (Should be empty, but delete anyway)
   
   - Resource groups → rg-destination → Delete
     Type name to confirm → Delete
   
   - Resource groups → rg-destination-2 → Delete
     Type name to confirm → Delete

All resources in these groups will be deleted.
```

**⏱️ Wait**: 5-10 minutes

**✅ Result**: All resources deleted!

---

## Quick Reference

### Move via Portal

```
Method 1: From Resource Group
  1. Go to resource group
  2. Check resources to move
  3. Click "Move" → Choose destination type
  4. Select destination → Review → Move

Method 2: From Individual Resource
  1. Go to the resource
  2. Click "Move" (top menu)
  3. Choose: Another resource group / Another subscription
  4. Select destination → Review → Move
```

### Move via CLI

```bash
# Move to another resource group
az resource move \
  --destination-group <destination-rg> \
  --ids <resource-id-1> <resource-id-2>

# Move to another subscription
az resource move \
  --destination-group <destination-rg> \
  --destination-subscription-id <sub-id> \
  --ids <resource-id-1>

# Get resource IDs
az resource list \
  --resource-group <rg-name> \
  --query "[].id" -o tsv
```

### Move Support Check

```
Full list of which resources support move:
https://learn.microsoft.com/azure/azure-resource-manager/
management/move-support-resources
```

### What Changes vs What Stays

```
┌──────────────────┬──────────────────────────────────────────┐
│  CHANGES          │  STAYS THE SAME                          │
├──────────────────┼──────────────────────────────────────────┤
│  Resource Group  │  Resource Name                           │
│  Resource ID     │  Location/Region                         │
│                  │  Configuration/Settings                  │
│                  │  Data                                    │
│                  │  IP Addresses                            │
│                  │  DNS Names                               │
│                  │  Tags                                    │
│                  │  Resource-level RBAC                     │
└──────────────────┴──────────────────────────────────────────┘
```

### Useful Links

- [Move Resources Documentation](https://learn.microsoft.com/azure/azure-resource-manager/management/move-resource-group-and-subscription)
- [Move Support by Resource Type](https://learn.microsoft.com/azure/azure-resource-manager/management/move-support-resources)
- [Move Checklist](https://learn.microsoft.com/azure/azure-resource-manager/management/move-resource-group-and-subscription#checklist-before-moving-resources)
- [Troubleshoot Moves](https://learn.microsoft.com/azure/azure-resource-manager/management/move-resource-group-and-subscription#troubleshoot)

---

**🎉 Congratulations!** You've completed Day 29 covering moving Azure resources between resource groups and subscriptions!