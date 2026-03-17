# Day 25: Azure Backup - Complete Guide

## What You'll Learn

Protect your Azure resources with backup and recovery:
- ✅ What is Azure Backup and why use it
- ✅ Recovery Services Vault (the backup center)
- ✅ VM Backup (full VM protection)
- ✅ Azure File Share Backup
- ✅ Azure Blob Backup
- ✅ Azure SQL Database Backup
- ✅ Disk Backup (Managed Disk snapshots)
- ✅ File Recovery from VM Backup (recover individual files)
- ✅ Recovery Services Vault Deep Dive (features, security, management)
- ✅ Restore operations (recover from disaster)
- ✅ Backup Policies (schedule, retention)
- ✅ Complete test, check, and confirm

## Table of Contents

1. [What is Azure Backup?](#what-is-azure-backup)
2. [Why Use Azure Backup?](#why-use-azure-backup)
3. [Architecture](#architecture)
4. [Lab 1: Create Recovery Services Vault](#lab-1-create-recovery-services-vault)
5. [Lab 2: VM Backup](#lab-2-vm-backup)
6. [Lab 3: VM Restore](#lab-3-vm-restore)
7. [Lab 4: Azure File Share Backup](#lab-4-azure-file-share-backup)
8. [Lab 5: Azure Blob Backup](#lab-5-azure-blob-backup)
9. [Lab 6: Azure SQL Database Backup](#lab-6-azure-sql-database-backup)
10. [Lab 7: Managed Disk Backup](#lab-7-managed-disk-backup)
11. [Lab 8: Backup Center (Monitor Everything)](#lab-8-backup-center-monitor-everything)
12. [Lab 9: File Recovery from VM Backup](#lab-9-file-recovery-from-vm-backup)
13. [Lab 10: Recovery Services Vault Deep Dive](#lab-10-recovery-services-vault-deep-dive)
14. [Cleanup](#cleanup)

---

## What is Azure Backup?

**Azure Backup** = A service that backs up (copies) your Azure resources so you can recover them if something goes wrong.

### Simple Explanation

```
Think of it like this:

📱 Your phone photos → iCloud/Google Photos backup
   If phone breaks → restore photos from backup

☁️ Your Azure VM → Azure Backup
   If VM breaks → restore VM from backup

☁️ Your Azure Files → Azure Backup
   If files deleted → restore files from backup

☁️ Your Azure SQL → Azure Backup
   If data corrupted → restore database from backup
```

### What Can You Backup?

```
┌─────────────────────────────────────────────────────────────────┐
│  AZURE BACKUP - What Can Be Protected?                           │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  1. Azure Virtual Machines                               │    │
│  │     Full VM backup (OS + data disks)                     │    │
│  │     Windows and Linux                                    │    │
│  │     Application-consistent snapshots                     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  2. Azure File Shares                                    │    │
│  │     SMB file shares                                      │    │
│  │     Share-level snapshots                                │    │
│  │     Individual file/folder restore                       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  3. Azure Blob Storage                                   │    │
│  │     Operational backup (continuous)                      │    │
│  │     Point-in-time restore                                │    │
│  │     Protect against accidental deletion                  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  4. Azure SQL Database                                   │    │
│  │     Automatic backups (built-in)                         │    │
│  │     Long-term retention (LTR)                            │    │
│  │     Point-in-time restore                                │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  5. Azure Managed Disks                                  │    │
│  │     Incremental snapshots                                │    │
│  │     Crash-consistent backup                              │    │
│  │     Fast restore                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  6. On-Premises (via MARS Agent)                         │    │
│  │     Files and folders                                    │    │
│  │     System state                                         │    │
│  │     Bare metal recovery                                  │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Why Use Azure Backup?

### The Problem

```
❌ WITHOUT BACKUP:

Scenario 1: Accidental Deletion
  Developer: "Oops, I deleted the production VM"
  Manager: "Do we have a backup?"
  Developer: "No..."
  Manager: "😱"
  Result: Days of rebuilding, data lost forever

Scenario 2: Ransomware Attack
  Hacker encrypts all your VMs and databases
  Hacker: "Pay $100,000 to get your data back"
  You: "We don't have backups..."
  Result: Pay ransom or lose everything

Scenario 3: Corrupted Data
  Bad deployment corrupts database
  You: "Can we go back to yesterday's data?"
  Team: "We never set up backups..."
  Result: Manual data recovery (if possible)

Scenario 4: Region Outage
  Azure region goes down
  You: "All our VMs are in that region!"
  Team: "No cross-region backups..."
  Result: Complete downtime until region recovers
```

### The Solution

```
✅ WITH AZURE BACKUP:

Scenario 1: Accidental Deletion
  Developer: "Oops, I deleted the production VM"
  Manager: "Restore from backup"
  Developer: Clicks restore → VM back in 30 minutes
  Result: ✅ No data loss!

Scenario 2: Ransomware Attack
  Hacker encrypts all your VMs
  You: "Restore all VMs from yesterday's backup"
  Result: ✅ Everything restored, no ransom paid!

Scenario 3: Corrupted Data
  Bad deployment corrupts database
  You: "Restore database to 2 hours ago"
  Result: ✅ Point-in-time restore, minimal data loss!

Scenario 4: Region Outage
  Azure region goes down
  You: "Restore VMs in another region from backup"
  Result: ✅ Cross-region recovery!
```

### Cost of NOT Having Backup vs Having Backup

```
┌─────────────────────────────┬─────────────────────────────────┐
│  Without Backup              │  With Azure Backup              │
├─────────────────────────────┼─────────────────────────────────┤
│  Data loss = permanent      │  Data loss = recoverable        │
│  Rebuild from scratch       │  Restore in minutes/hours       │
│  Downtime: days/weeks       │  Downtime: minutes/hours        │
│  Cost: $$$$$$ (lost data)   │  Cost: $ (backup storage)       │
│  Reputation damage          │  Business continuity            │
│  Compliance violations      │  Compliance met                 │
│  Customer trust lost        │  Customer trust maintained      │
└─────────────────────────────┴─────────────────────────────────┘

Azure Backup pricing example:
  VM backup (100 GB): ~$5/month
  Cost of losing that VM: $10,000+ (rebuild + lost data)
  
  💡 Backup is insurance. Cheap to have, expensive to not have.
```

---

## Architecture

### Recovery Services Vault

```
┌─────────────────────────────────────────────────────────────────┐
│  RECOVERY SERVICES VAULT                                         │
│  (The central place for all backups)                            │
│                                                                  │
│  Think of it as a "safe" that stores all your backup copies     │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                             │  │
│  │  Backup Items:                                             │  │
│  │  ├─ VM: web-server-01        (Daily, keep 30 days)        │  │
│  │  ├─ VM: api-server-01        (Daily, keep 30 days)        │  │
│  │  ├─ File Share: app-files    (Daily, keep 14 days)        │  │
│  │  ├─ SQL DB: production-db    (Every 4 hours, keep 7 days) │  │
│  │  └─ Disk: data-disk-01      (Daily, keep 7 days)         │  │
│  │                                                             │  │
│  │  Backup Policies:                                          │  │
│  │  ├─ DailyPolicy     (backup daily at 2 AM, keep 30 days) │  │
│  │  ├─ WeeklyPolicy    (backup weekly, keep 12 weeks)        │  │
│  │  └─ MonthlyPolicy   (backup monthly, keep 12 months)      │  │
│  │                                                             │  │
│  │  Features:                                                 │  │
│  │  ├─ Encryption (data encrypted at rest)                   │  │
│  │  ├─ Soft delete (deleted backups kept 14 days)            │  │
│  │  ├─ Cross-region restore (restore in another region)      │  │
│  │  └─ Alerts (notify on backup failures)                    │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### How Backup Works

```
┌──────────────────────────────────────────────────────────────────┐
│  BACKUP FLOW                                                      │
│                                                                   │
│  Step 1: Create Recovery Services Vault                          │
│  ┌──────────────────────────────────────┐                        │
│  │  Recovery Services Vault              │                        │
│  │  Name: rsv-day25-backup              │                        │
│  │  Region: East US                      │                        │
│  └──────────────────────────────────────┘                        │
│                    ↓                                              │
│  Step 2: Create Backup Policy                                    │
│  ┌──────────────────────────────────────┐                        │
│  │  Policy: DailyBackup                  │                        │
│  │  Schedule: Every day at 2:00 AM       │                        │
│  │  Retention: 30 days                   │                        │
│  └──────────────────────────────────────┘                        │
│                    ↓                                              │
│  Step 3: Enable Backup on Resource                               │
│  ┌──────────────────────────────────────┐                        │
│  │  VM: web-server-01                    │                        │
│  │  Policy: DailyBackup                  │                        │
│  │  Status: Protected ✅                 │                        │
│  └──────────────────────────────────────┘                        │
│                    ↓                                              │
│  Step 4: Backup Runs Automatically                               │
│  ┌──────────────────────────────────────┐                        │
│  │  2:00 AM → Snapshot VM               │                        │
│  │  2:15 AM → Transfer to Vault         │                        │
│  │  2:30 AM → Backup complete ✅        │                        │
│  └──────────────────────────────────────┘                        │
│                    ↓                                              │
│  Step 5: Restore When Needed                                     │
│  ┌──────────────────────────────────────┐                        │
│  │  "Restore VM from March 15 backup"   │                        │
│  │  → New VM created from backup        │                        │
│  │  → All data recovered ✅             │                        │
│  └──────────────────────────────────────┘                        │
└──────────────────────────────────────────────────────────────────┘
```

### Backup Types Explained

```
┌─────────────────────────────────────────────────────────────────┐
│  BACKUP TYPES                                                    │
│                                                                  │
│  1. FULL BACKUP                                                 │
│     ┌─────────────────────────────────────────────┐             │
│     │  Copies EVERYTHING every time                │             │
│     │  Day 1: [████████████] 100 GB               │             │
│     │  Day 2: [████████████] 100 GB               │             │
│     │  Day 3: [████████████] 100 GB               │             │
│     │  Total: 300 GB stored                        │             │
│     │  ✅ Simple  ❌ Uses lots of storage          │             │
│     └─────────────────────────────────────────────┘             │
│                                                                  │
│  2. INCREMENTAL BACKUP (Azure uses this!)                       │
│     ┌─────────────────────────────────────────────┐             │
│     │  First: Full copy, then only CHANGES         │             │
│     │  Day 1: [████████████] 100 GB (full)        │             │
│     │  Day 2: [██]           5 GB  (changes only) │             │
│     │  Day 3: [███]          8 GB  (changes only) │             │
│     │  Total: 113 GB stored                        │             │
│     │  ✅ Saves storage  ✅ Faster backups         │             │
│     └─────────────────────────────────────────────┘             │
│                                                                  │
│  3. SNAPSHOT                                                     │
│     ┌─────────────────────────────────────────────┐             │
│     │  Point-in-time copy of a disk                │             │
│     │  Like taking a photo of your disk            │             │
│     │  Instant creation                            │             │
│     │  ✅ Very fast  ✅ Good for quick restore     │             │
│     └─────────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────────┘

Azure VM Backup uses a 2-phase approach:
  Phase 1: Take snapshot (instant, stored locally)
  Phase 2: Transfer snapshot to vault (background)
  
  This means:
  - Fast backup (snapshot is instant)
  - Fast restore (from local snapshot if recent)
  - Durable (vault copy for long-term)
```

---

## Lab 1: Create Recovery Services Vault

### What is a Recovery Services Vault?

```
Recovery Services Vault = The "safe" where all backups are stored

Like a bank vault:
  - Bank vault stores money safely
  - Recovery Services Vault stores backups safely
  - Encrypted, access-controlled, redundant
```

### Step 1: Go to Azure Portal

```
1. Open https://portal.azure.com
2. Search "Recovery Services vaults" in top search bar
3. Click "Recovery Services vaults"
```

### Step 2: Create Resource Group

```
1. Search "Resource groups" in top search bar
2. Click "+ Create"
3. Fill in:
   - Subscription: Your subscription
   - Resource group: rg-day25-backup
   - Region: East US
4. Click "Review + create" → "Create"
```

### Step 3: Create Recovery Services Vault

```
1. Search "Recovery Services vaults" in top search bar
2. Click "+ Create"
3. Fill in:
   - Subscription: Your subscription
   - Resource group: rg-day25-backup
   - Vault name: rsv-day25-backup
   - Region: East US
4. Click "Review + create" → "Create"
```

**⏱️ Wait**: 1-2 minutes

### Step 4: Configure Vault Settings

```
1. Go to your vault: rsv-day25-backup
2. Left menu → "Properties"
3. Under "Backup Configuration":
   - Click "Update"
   - Storage replication type: Geo-redundant (GRS)
     (Copies backup to paired region for disaster recovery)
   - Click "Save"
4. Under "Security Settings":
   - Soft delete: Enabled (keeps deleted backups 14 days)
   - Click "Save"
```

**Storage Replication Types:**

```
┌─────────────────────────────┬─────────────────────────────────┐
│  LRS (Locally Redundant)     │  GRS (Geo-Redundant)            │
├─────────────────────────────┼─────────────────────────────────┤
│  3 copies in same region    │  6 copies (3 local + 3 remote)  │
│  Protects against:          │  Protects against:              │
│  - Disk failure             │  - Disk failure                 │
│  - Rack failure             │  - Rack failure                 │
│                             │  - Region failure               │
│  Cheaper                    │  More expensive                 │
│  Good for: dev/test         │  Good for: production           │
└─────────────────────────────┴─────────────────────────────────┘
```

### Step 5: Test, Check, and Confirm - Vault

**Test 1: Verify Vault Created**

```
1. Go to "Recovery Services vaults"
2. Verify rsv-day25-backup appears in the list
3. Click on it
4. Check:
   ✅ Status: Active
   ✅ Region: East US
   ✅ Resource group: rg-day25-backup
```

**Test 2: Verify Storage Replication**

```
1. In vault → Properties
2. Under "Backup Configuration"
3. Verify:
   ✅ Storage replication type: Geo-redundant
```

**Test 3: Verify Soft Delete**

```
1. In vault → Properties
2. Under "Security Settings"
3. Verify:
   ✅ Soft delete: Enabled
   ✅ Soft delete retention: 14 days
```

**✅ Result**: Recovery Services Vault ready!

---

## Lab 2: VM Backup

### What is VM Backup?

```
VM Backup = Complete copy of your virtual machine

What gets backed up:
  ├─ OS disk (Windows/Linux operating system)
  ├─ Data disks (all attached disks)
  ├─ VM configuration (size, network, etc.)
  └─ Application state (if app-consistent)

Backup Types:
  ├─ Application-consistent: App is aware of backup (best)
  │   Windows: Uses VSS (Volume Shadow Copy)
  │   Linux: Uses pre/post scripts
  ├─ File-system consistent: File system is clean
  └─ Crash-consistent: Like pulling the power plug
      (Still recoverable, but apps may need recovery)
```

### Step 1: Create a Test VM

```
1. Search "Virtual machines" in Azure Portal
2. Click "+ Create" → "Azure virtual machine"
3. Fill in:

   Basics tab:
   - Resource group: rg-day25-backup
   - Virtual machine name: vm-backup-test
   - Region: East US
   - Image: Ubuntu Server 22.04 LTS
   - Size: Standard_B1s (cheapest)
   - Authentication: Password
   - Username: azureuser
   - Password: Day25Backup@2026
   - Public inbound ports: Allow SSH (22)

   Disks tab:
   - OS disk type: Standard SSD
   - Click "Create and attach a new disk"
     - Name: vm-backup-test-data
     - Size: 32 GB
     - Type: Standard SSD
     - Click OK

   Leave other tabs as default

4. Click "Review + create" → "Create"
```

**⏱️ Wait**: 2-3 minutes

### Step 2: Add Test Data to VM

```
1. SSH into the VM:
   ssh azureuser@<VM-PUBLIC-IP>

2. Create test files on OS disk:
   echo "Important config file - $(date)" > ~/config.txt
   echo "Application data - $(date)" > ~/app-data.txt
   cat ~/config.txt

3. Mount and add data to data disk:
   # Find the data disk
   lsblk
   
   # Format the data disk (usually /dev/sdc)
   sudo mkfs.ext4 /dev/sdc
   
   # Mount it
   sudo mkdir /data
   sudo mount /dev/sdc /data
   
   # Create test data
   sudo bash -c 'echo "Database backup file - $(date)" > /data/database.sql'
   sudo bash -c 'echo "User uploads - $(date)" > /data/uploads.txt'
   
   # Verify
   ls -la /data/
   cat /data/database.sql

4. Exit SSH:
   exit
```

### Step 3: Enable Backup on VM

```
1. Go to your VM: vm-backup-test
2. Left menu → "Backup"
3. Fill in:
   - Recovery Services vault: rsv-day25-backup
   - Backup policy: Choose policy

4. Create a new backup policy:
   - Click "Create a new policy"
   - Policy name: DailyVM-30days
   - Backup schedule:
     - Frequency: Daily
     - Time: 2:00 AM
     - Timezone: Your timezone
   - Instant restore:
     - Retain instant recovery snapshot: 2 days
   - Retention range:
     - Daily backup points: 30 days
     - Weekly backup points: Enable → 12 weeks
     - Monthly backup points: Enable → 12 months
   - Click "OK"

5. Click "Enable backup"
```

**⏱️ Wait**: 1-2 minutes

**What this creates:**

```
┌──────────────────────────────────────────────────────────────┐
│  BACKUP CONFIGURATION                                         │
│                                                               │
│  VM: vm-backup-test                                          │
│  Vault: rsv-day25-backup                                     │
│  Policy: DailyVM-30days                                      │
│                                                               │
│  Schedule:                                                    │
│  ├─ Daily at 2:00 AM                                         │
│  ├─ Keep daily backups: 30 days                              │
│  ├─ Keep weekly backups: 12 weeks (Sunday)                   │
│  └─ Keep monthly backups: 12 months (1st of month)           │
│                                                               │
│  Example retention:                                          │
│  March 17 backup → kept until April 16 (30 days)            │
│  March 16 (Sunday) → kept until June 8 (12 weeks)           │
│  March 1 backup → kept until March 2027 (12 months)         │
└──────────────────────────────────────────────────────────────┘
```

### Step 4: Run First Backup (Manual)

Don't wait for scheduled backup. Run it now:

```
1. Go to VM: vm-backup-test
2. Left menu → "Backup"
3. Click "Backup now"
4. Retain backup till: Leave default (30 days from now)
5. Click "OK"
```

**⏱️ Wait**: 15-30 minutes for first backup

### Step 5: Monitor Backup Progress

```
1. Go to vault: rsv-day25-backup
2. Left menu → "Backup Jobs"
3. You should see:
   - Job: Backup
   - Item: vm-backup-test
   - Status: In progress → Completed

   Backup has 2 sub-tasks:
   ├─ Take Snapshot: ~5 minutes (fast, local)
   └─ Transfer data to vault: ~15-25 minutes (background)
```

### Step 6: Test, Check, and Confirm - VM Backup

**Test 1: Verify Backup Enabled**

```
1. Go to VM: vm-backup-test
2. Left menu → "Backup"
3. Verify:
   ✅ Backup status: Enabled
   ✅ Policy: DailyVM-30days
   ✅ Last backup status: Completed (or In progress)
```

**Test 2: Verify Backup in Vault**

```
1. Go to vault: rsv-day25-backup
2. Left menu → "Backup items"
3. Click "Azure Virtual Machine"
4. Verify:
   ✅ vm-backup-test listed
   ✅ Last backup status: Completed
   ✅ Latest restore point: Today's date
```

**Test 3: Verify Recovery Points**

```
1. In vault → Backup items → Azure Virtual Machine
2. Click "vm-backup-test"
3. Click "View all" under Restore Points
4. Verify:
   ✅ At least 1 restore point exists
   ✅ Type: Snapshot (instant) and/or Vault-standard
   ✅ Date: Today
```

**Test 4: Verify Backup Job**

```
1. In vault → Backup Jobs
2. Filter: Last 24 hours
3. Verify:
   ✅ Backup job for vm-backup-test
   ✅ Status: Completed
   ✅ Duration shown
```

**Test 5: Verify Backup Policy**

```
1. In vault → Left menu → "Backup policies"
2. Click "DailyVM-30days"
3. Verify:
   ✅ Schedule: Daily at 2:00 AM
   ✅ Instant restore: 2 days
   ✅ Daily retention: 30 days
   ✅ Weekly retention: 12 weeks
   ✅ Monthly retention: 12 months
```

**✅ Result**: VM backup configured and first backup completed!

---

## Lab 3: VM Restore

### What is VM Restore?

```
VM Restore = Recover your VM from a backup

Restore Options:
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  1. Create new VM                                               │
│     Original VM stays, new VM created from backup               │
│     Best for: Testing, creating copy                            │
│                                                                  │
│  2. Replace existing                                            │
│     Original VM's disks replaced with backup                    │
│     Best for: Recovering from corruption                        │
│     ⚠️ VM must be stopped first                                │
│                                                                  │
│  3. Restore disks                                               │
│     Only restore disks to storage account                       │
│     Best for: Custom restore, attach to different VM            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Step 1: Simulate Disaster (Delete Test Files)

```
1. SSH into VM:
   ssh azureuser@<VM-PUBLIC-IP>

2. Delete important files:
   rm ~/config.txt
   rm ~/app-data.txt
   ls ~/    ← Files are gone!

3. Delete data disk files:
   sudo rm /data/database.sql
   sudo rm /data/uploads.txt
   ls /data/    ← Files are gone!

4. Exit:
   exit

   😱 Oh no! Important files deleted!
   💡 But we have a backup!
```

### Step 2: Restore VM (Create New VM)

```
1. Go to vault: rsv-day25-backup
2. Left menu → "Backup items"
3. Click "Azure Virtual Machine"
4. Click "vm-backup-test"
5. Click "Restore VM" (top button)
6. Fill in:

   Restore point: Select the latest restore point
   
   Restore Configuration:
   - Restore Type: Create new virtual machine
   - Virtual machine name: vm-backup-restored
   - Resource group: rg-day25-backup
   - Virtual network: Select existing (same as original)
   - Subnet: default
   - Staging Location (Storage Account):
     - Click "Create new"
     - Name: stday25restore (must be globally unique)
     - Click OK

7. Click "Restore"
```

**⏱️ Wait**: 15-30 minutes

### Step 3: Monitor Restore Progress

```
1. Go to vault: rsv-day25-backup
2. Left menu → "Backup Jobs"
3. You should see:
   - Job: Restore
   - Item: vm-backup-test
   - Status: In progress → Completed
```

### Step 4: Verify Restored VM

```
1. Go to "Virtual machines"
2. Find: vm-backup-restored
3. Note the public IP
4. SSH into restored VM:
   ssh azureuser@<RESTORED-VM-IP>

5. Check OS disk files:
   cat ~/config.txt
   cat ~/app-data.txt
   
   Expected:
   Important config file - <original date>
   Application data - <original date>
   ✅ Files restored!

6. Check data disk:
   sudo mount /dev/sdc /data
   cat /data/database.sql
   cat /data/uploads.txt
   
   Expected:
   Database backup file - <original date>
   User uploads - <original date>
   ✅ Data disk files restored!

7. Exit:
   exit
```

### Step 5: Test, Check, and Confirm - VM Restore

**Test 1: Verify Restored VM Exists**

```
1. Go to "Virtual machines"
2. Verify:
   ✅ vm-backup-restored exists
   ✅ Status: Running
   ✅ Region: East US
   ✅ Resource group: rg-day25-backup
```

**Test 2: Verify Restored VM Configuration**

```
1. Click vm-backup-restored
2. Verify:
   ✅ Size matches original (Standard_B1s)
   ✅ OS: Ubuntu 22.04
   ✅ Disks: OS disk + Data disk (32 GB)
```

**Test 3: Verify Data Integrity**

```
1. SSH into vm-backup-restored
2. Verify:
   ✅ ~/config.txt exists with original content
   ✅ ~/app-data.txt exists with original content
   ✅ /data/database.sql exists with original content
   ✅ /data/uploads.txt exists with original content
   ✅ All data matches pre-deletion state
```

**Test 4: Verify Restore Job**

```
1. In vault → Backup Jobs
2. Verify:
   ✅ Restore job completed
   ✅ Duration shown
   ✅ No errors
```

**✅ Result**: VM successfully restored from backup!

---

## Lab 4: Azure File Share Backup

### What is File Share Backup?

```
File Share Backup = Protect your Azure File Shares (SMB shares)

Azure File Share:
  ├─ Shared storage accessible via SMB protocol
  ├─ Used for: shared configs, user files, application data
  └─ Mounted on VMs like a network drive

File Share Backup:
  ├─ Share-level snapshots (entire share)
  ├─ Individual file/folder restore (pick specific files)
  ├─ Fast restore (snapshot-based)
  └─ No agent needed (Azure-native)
```

### Step 1: Create Storage Account and File Share

```
1. Search "Storage accounts" in Azure Portal
2. Click "+ Create"
3. Fill in:
   - Resource group: rg-day25-backup
   - Storage account name: stday25files (must be globally unique)
   - Region: East US
   - Performance: Standard
   - Redundancy: LRS
4. Click "Review + create" → "Create"

5. Go to the storage account: stday25files
6. Left menu → "File shares"
7. Click "+ File share"
8. Fill in:
   - Name: app-files
   - Tier: Transaction optimized
9. Click "Create"
```

### Step 2: Upload Test Files

```
1. Click on file share: app-files
2. Click "+ Add directory"
   - Name: configs
   - Click OK
3. Click into "configs" directory
4. Click "Upload"
   - Create a local text file: app-config.txt
     Content: "database_host=mydb.azure.com"
   - Upload it
5. Go back to root of file share
6. Click "+ Add directory"
   - Name: logs
   - Click OK
7. Click into "logs" directory
8. Upload a file: app.log
   Content: "2026-03-17 Application started successfully"
```

### Step 3: Enable File Share Backup

```
1. Go to vault: rsv-day25-backup
2. Left menu → "Backup"
3. Where is your workload running? → Azure
4. What do you want to back up? → Azure File Share
5. Click "Backup"

6. Select storage account: stday25files
7. Select file shares: ✅ app-files
8. Backup policy:
   - Click "Create a new policy"
   - Policy name: DailyFileShare-14days
   - Schedule:
     - Frequency: Daily
     - Time: 3:00 AM
   - Retention:
     - Daily: 14 days
     - Weekly: Enable → 4 weeks
   - Click "OK"

9. Click "Enable backup"
```

### Step 4: Run First Backup

```
1. In vault → Backup items → Azure Storage (Azure Files)
2. Click "app-files"
3. Click "Backup now"
4. Retain backup till: Leave default
5. Click "OK"
```

**⏱️ Wait**: 2-5 minutes (file share backups are fast!)

### Step 5: Simulate Disaster and Restore

```
1. Go to storage account: stday25files
2. File shares → app-files → configs
3. Delete app-config.txt (click ... → Delete)
4. Go back → Delete the "logs" directory

   😱 Files and folders deleted!
```

**Restore files:**

```
1. Go to vault: rsv-day25-backup
2. Backup items → Azure Storage (Azure Files)
3. Click "app-files"
4. Click "Restore File Share" (top button)
5. Fill in:
   - Restore Point: Select latest
   - Restore Type: Choose one:
   
   Option A: Full Share Restore
   - Restore Location: Original location
   - In case of conflicts: Overwrite
   
   Option B: Individual File Restore
   - Click "Select files to restore"
   - Browse to configs/app-config.txt
   - Check the file
   - Click "Select"
   - Restore Location: Original location

6. Click "Restore"
```

**⏱️ Wait**: 2-5 minutes

### Step 6: Test, Check, and Confirm - File Share Backup

**Test 1: Verify Backup Enabled**

```
1. In vault → Backup items → Azure Storage (Azure Files)
2. Verify:
   ✅ app-files listed
   ✅ Last backup status: Completed
   ✅ Policy: DailyFileShare-14days
```

**Test 2: Verify Restore Point**

```
1. Click "app-files" in backup items
2. Click "View all" under Restore Points
3. Verify:
   ✅ At least 1 restore point
   ✅ Date: Today
```

**Test 3: Verify Files Restored**

```
1. Go to storage account: stday25files
2. File shares → app-files
3. Verify:
   ✅ configs/ directory exists
   ✅ configs/app-config.txt exists with original content
   ✅ logs/ directory exists
   ✅ logs/app.log exists with original content
```

**Test 4: Verify Backup Job**

```
1. In vault → Backup Jobs
2. Filter: Azure File Share
3. Verify:
   ✅ Backup job: Completed
   ✅ Restore job: Completed
```

**✅ Result**: File share backup and restore working!

---

## Lab 5: Azure Blob Backup

### What is Blob Backup?

```
Blob Backup = Protect your Azure Blob Storage containers

Two types:
┌─────────────────────────────┬─────────────────────────────────┐
│  Operational Backup          │  Vaulted Backup                 │
├─────────────────────────────┼─────────────────────────────────┤
│  Continuous (real-time)     │  Scheduled (periodic)           │
│  Point-in-time restore     │  Discrete recovery points       │
│  Data stays in storage acct│  Data copied to vault           │
│  Restore: last 1-365 days  │  Restore: from vault            │
│  Best for: accidental      │  Best for: long-term            │
│  deletion protection        │  retention, compliance          │
│  Cheaper                    │  More expensive                 │
│  Same region only           │  Cross-region possible          │
└─────────────────────────────┴─────────────────────────────────┘

We'll use Operational Backup (most common for blob protection)
```

### Step 1: Create Storage Account for Blobs

```
1. Search "Storage accounts" in Azure Portal
2. Click "+ Create"
3. Fill in:
   - Resource group: rg-day25-backup
   - Storage account name: stday25blobs (must be globally unique)
   - Region: East US
   - Performance: Standard
   - Redundancy: LRS
4. Click "Review + create" → "Create"
```

### Step 2: Create Container and Upload Blobs

```
1. Go to storage account: stday25blobs
2. Left menu → "Containers"
3. Click "+ Container"
   - Name: app-data
   - Access level: Private
   - Click "Create"
4. Click into "app-data" container
5. Click "Upload"
   - Upload test files:
     - report-2026-01.pdf (any small file)
     - report-2026-02.pdf
     - report-2026-03.pdf
   - Click "Upload"
```

### Step 3: Configure Blob Backup

```
1. Go to vault: rsv-day25-backup
2. Left menu → "Backup"
3. Where is your workload running? → Azure
4. What do you want to back up? → Azure Blobs (Azure Storage)
5. Click "Backup"

6. Click "+ Add" to select storage account
7. Select: stday25blobs
8. Backup policy:
   - Click "Create a new policy"
   - Policy name: BlobOperational-30days
   - Retention: 30 days
   - Click "Create"

9. Before clicking "Configure backup", you need to assign role:
   
   The vault needs permission to backup the storage account.
   Azure will show a message about missing roles.
   
   Click "Assign missing roles"
   Wait for role assignment to complete
   
10. Click "Configure backup"
```

**⏱️ Wait**: 5-10 minutes for backup configuration to take effect

### Step 4: Simulate Disaster and Restore

```
1. Go to storage account: stday25blobs
2. Containers → app-data
3. Delete report-2026-03.pdf (select → Delete)
4. Delete report-2026-02.pdf (select → Delete)

   😱 Reports deleted!
```

**Restore blobs:**

```
1. Go to vault: rsv-day25-backup
2. Backup items → Azure Storage (Azure Blobs)
3. Click "stday25blobs"
4. Click "Restore" (top button)
5. Fill in:
   - Restore point: Select a time BEFORE you deleted the files
     (e.g., 30 minutes ago)
   - Containers to restore:
     - Select "app-data"
   - Blob prefix (optional): Leave empty to restore all
6. Click "Validate"
7. After validation passes → Click "Restore"
```

**⏱️ Wait**: 5-15 minutes

### Step 5: Test, Check, and Confirm - Blob Backup

**Test 1: Verify Backup Configured**

```
1. In vault → Backup items → Azure Storage (Azure Blobs)
2. Verify:
   ✅ stday25blobs listed
   ✅ Backup status: Configured
   ✅ Policy: BlobOperational-30days
```

**Test 2: Verify Blobs Restored**

```
1. Go to storage account: stday25blobs
2. Containers → app-data
3. Verify:
   ✅ report-2026-01.pdf exists
   ✅ report-2026-02.pdf exists (restored!)
   ✅ report-2026-03.pdf exists (restored!)
```

**Test 3: Verify Restore Job**

```
1. In vault → Backup Jobs
2. Filter: Azure Blobs
3. Verify:
   ✅ Restore job: Completed
   ✅ No errors
```

**Test 4: Verify Point-in-Time Restore Capability**

```
1. Go to storage account: stday25blobs
2. Left menu → "Data protection"
3. Verify:
   ✅ Point-in-time restore: Enabled
   ✅ Retention: 30 days
```

**✅ Result**: Blob backup and point-in-time restore working!

---

## Lab 6: Azure SQL Database Backup

### What is SQL Database Backup?

```
SQL Database Backup = Protect your Azure SQL databases

Azure SQL has BUILT-IN automatic backups:
  ├─ Full backup: Weekly
  ├─ Differential backup: Every 12-24 hours
  ├─ Transaction log backup: Every 5-10 minutes
  └─ Point-in-time restore: Any second within retention

Default retention:
  ├─ Basic tier: 7 days
  ├─ Standard tier: 35 days
  └─ Premium tier: 35 days

Long-term retention (LTR):
  ├─ Keep backups for months/years
  ├─ Compliance requirements (keep 7 years)
  └─ Configured separately
```

### Step 1: Create Azure SQL Database

```
1. Search "SQL databases" in Azure Portal
2. Click "+ Create"
3. Fill in:

   Basics tab:
   - Resource group: rg-day25-backup
   - Database name: db-backup-test
   - Server: Create new
     - Server name: sql-day25-backup (must be globally unique)
     - Location: East US
     - Authentication: Use SQL authentication
     - Admin login: sqladmin
     - Password: Day25SQL@2026
     - Click "OK"
   - Want to use SQL elastic pool? No
   - Compute + storage: Click "Configure database"
     - Service tier: Basic (5 DTUs) ← Cheapest!
     - Click "Apply"

   Networking tab:
   - Connectivity method: Public endpoint
   - Allow Azure services: Yes
   - Add current client IP: Yes

4. Click "Review + create" → "Create"
```

**⏱️ Wait**: 3-5 minutes

### Step 2: Add Test Data

```
1. Go to database: db-backup-test
2. Left menu → "Query editor (preview)"
3. Login with: sqladmin / Day25SQL@2026
4. Run these queries:

-- Create table
CREATE TABLE Employees (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(100),
    Department NVARCHAR(50),
    Salary DECIMAL(10,2),
    HireDate DATE
);

-- Insert test data
INSERT INTO Employees (Name, Department, Salary, HireDate) VALUES
('Alice Johnson', 'Engineering', 95000.00, '2024-01-15'),
('Bob Smith', 'Marketing', 75000.00, '2024-03-20'),
('Carol Williams', 'Engineering', 105000.00, '2023-06-10'),
('David Brown', 'Sales', 85000.00, '2024-07-01'),
('Eve Davis', 'Engineering', 110000.00, '2023-01-05');

-- Verify data
SELECT * FROM Employees;

5. Note the current time (you'll need this for restore)
```

### Step 3: View Automatic Backups

```
1. Go to SQL server: sql-day25-backup
2. Left menu → "Backups"
3. You should see:
   - db-backup-test
   - Retention: 7 days (Basic tier default)
   - Earliest restore point: (shortly after creation)
   - Available LTR backups: None (not configured yet)
```

### Step 4: Configure Long-Term Retention (LTR)

```
1. In SQL server → Backups
2. Click "Retention policies" tab
3. Click on "db-backup-test"
4. Configure LTR:
   - Weekly backups: Enable → Keep for 4 weeks
   - Monthly backups: Enable → Keep for 12 months
   - Yearly backups: Enable → Keep for 1 year
     - Week of year: Week 1
   - Click "Apply"
```

**What this means:**

```
┌──────────────────────────────────────────────────────────────┐
│  SQL BACKUP RETENTION                                         │
│                                                               │
│  Short-term (automatic, built-in):                           │
│  ├─ Point-in-time restore: Last 7 days                       │
│  ├─ Full backup: Weekly                                      │
│  ├─ Differential: Every 12-24 hours                          │
│  └─ Transaction log: Every 5-10 minutes                      │
│                                                               │
│  Long-term retention (LTR, we just configured):              │
│  ├─ Weekly: Keep 1 backup per week for 4 weeks               │
│  ├─ Monthly: Keep 1 backup per month for 12 months           │
│  └─ Yearly: Keep 1 backup per year for 1 year                │
│                                                               │
│  Example:                                                    │
│  March 17 → can restore to any second in last 7 days         │
│  March 10 → weekly LTR backup available                      │
│  March 1 → monthly LTR backup available                      │
│  January 1 → yearly LTR backup available                     │
└──────────────────────────────────────────────────────────────┘
```

### Step 5: Simulate Disaster and Restore

```
1. Go to database: db-backup-test
2. Query editor → Login
3. Run destructive query:

-- Simulate disaster: delete all data
DELETE FROM Employees;

-- Verify data is gone
SELECT * FROM Employees;
-- Result: 0 rows 😱
```

**Restore database (Point-in-Time):**

```
1. Go to SQL server: sql-day25-backup
2. Left menu → "Backups"
3. Click "Available backups" tab
4. Find db-backup-test → Click "Restore"
5. Fill in:
   - Database name: db-backup-test-restored
   - Restore point: Select a time BEFORE you deleted the data
     (e.g., 10 minutes ago)
   - Click "Review + create" → "Create"
```

**⏱️ Wait**: 5-10 minutes

### Step 6: Verify Restored Database

```
1. Go to "SQL databases"
2. Click "db-backup-test-restored"
3. Query editor → Login (same credentials)
4. Run:

SELECT * FROM Employees;

Expected: All 5 employees restored!
✅ Alice Johnson, Bob Smith, Carol Williams, David Brown, Eve Davis
```

### Step 7: Test, Check, and Confirm - SQL Backup

**Test 1: Verify Automatic Backups**

```
1. Go to SQL server → Backups
2. Verify:
   ✅ db-backup-test has automatic backups
   ✅ Retention: 7 days
   ✅ Earliest restore point shown
```

**Test 2: Verify LTR Configuration**

```
1. In SQL server → Backups → Retention policies
2. Verify:
   ✅ Weekly: 4 weeks
   ✅ Monthly: 12 months
   ✅ Yearly: 1 year
```

**Test 3: Verify Restored Database**

```
1. Go to db-backup-test-restored
2. Query editor → Login
3. Run: SELECT COUNT(*) FROM Employees;
4. Verify:
   ✅ Count = 5 (all employees restored)
   ✅ Data matches original
```

**Test 4: Verify Point-in-Time Restore**

```
1. In restored database → Overview
2. Verify:
   ✅ Status: Online
   ✅ Server: sql-day25-backup
   ✅ Pricing tier: Basic
```

**Test 5: Compare Original and Restored**

```
-- Run on db-backup-test (original - data deleted)
SELECT COUNT(*) FROM Employees;
-- Result: 0

-- Run on db-backup-test-restored (restored)
SELECT COUNT(*) FROM Employees;
-- Result: 5

✅ Restore successful! Original has 0 rows, restored has 5 rows.
```

**✅ Result**: SQL database backup and point-in-time restore working!

---

## Lab 7: Managed Disk Backup

### What is Managed Disk Backup?

```
Managed Disk Backup = Protect individual Azure disks

When to use:
  ├─ Backup specific data disks (not entire VM)
  ├─ Faster backup than full VM backup
  ├─ Incremental snapshots (only changes)
  └─ Independent of VM (disk-level protection)

Disk Backup vs VM Backup:
┌─────────────────────────────┬─────────────────────────────────┐
│  VM Backup                   │  Disk Backup                    │
├─────────────────────────────┼─────────────────────────────────┤
│  Backs up entire VM         │  Backs up individual disk       │
│  OS + all data disks        │  Just the selected disk         │
│  Application-consistent     │  Crash-consistent               │
│  Slower (more data)         │  Faster (less data)             │
│  Restore: full VM           │  Restore: disk only             │
│  Best for: full protection  │  Best for: data disk protection │
└─────────────────────────────┴─────────────────────────────────┘
```

### Step 1: Create a Managed Disk

```
1. Search "Disks" in Azure Portal
2. Click "+ Create"
3. Fill in:
   - Resource group: rg-day25-backup
   - Disk name: disk-data-backup-test
   - Region: East US
   - Availability zone: None
   - Source type: None (empty disk)
   - Size: 32 GiB
   - Disk type: Standard SSD
4. Click "Review + create" → "Create"
```

### Step 2: Create Backup Vault for Disk Backup

```
Disk backup uses a "Backup vault" (different from Recovery Services vault!)

┌──────────────────────────────────────────────────────────────┐
│  Recovery Services Vault vs Backup Vault                      │
│                                                               │
│  Recovery Services Vault:                                    │
│  ├─ VM backup                                                │
│  ├─ File share backup                                        │
│  ├─ SQL in VM backup                                         │
│  └─ Older service (more features)                            │
│                                                               │
│  Backup Vault:                                               │
│  ├─ Disk backup                                              │
│  ├─ Blob backup (vaulted)                                    │
│  ├─ PostgreSQL backup                                        │
│  └─ Newer service (modern architecture)                      │
└──────────────────────────────────────────────────────────────┘

1. Search "Backup vaults" in Azure Portal
2. Click "+ Create"
3. Fill in:
   - Resource group: rg-day25-backup
   - Backup vault name: bv-day25-disk
   - Region: East US
   - Redundancy: Locally-redundant
4. Click "Review + create" → "Create"
```

**⏱️ Wait**: 1-2 minutes

### Step 3: Create Snapshot Resource Group

```
Disk backup stores snapshots in a separate resource group.

1. Search "Resource groups"
2. Click "+ Create"
3. Fill in:
   - Resource group: rg-day25-snapshots
   - Region: East US
4. Click "Review + create" → "Create"
```

### Step 4: Configure Disk Backup

```
1. Go to Backup vault: bv-day25-disk
2. Left menu → "Backup"
3. Datasource type: Azure Disks
4. Click "Continue"

5. Backup policy:
   - Click "Create a new policy"
   - Policy name: DailyDisk-7days
   - Schedule:
     - Frequency: Every 1 day
     - Time: 4:00 AM
   - Retention:
     - Default retention: 7 days
   - Click "Create"

6. Click "Add" to select disks
7. Select: disk-data-backup-test
8. Snapshot resource group: rg-day25-snapshots

9. Before configuring, assign roles:
   The vault needs "Disk Backup Reader" role on the disk
   and "Disk Snapshot Contributor" role on the snapshot RG.
   
   Click "Assign missing roles"
   Wait for role assignment (1-2 minutes)

10. Click "Validate"
11. After validation passes → Click "Configure backup"
```

### Step 5: Run First Disk Backup

```
1. In Backup vault → Backup instances
2. Click "disk-data-backup-test"
3. Click "Backup now"
4. Retention: Leave default (7 days)
5. Click "Backup"
```

**⏱️ Wait**: 5-10 minutes

### Step 6: Restore Disk from Backup

```
1. In Backup vault → Backup instances
2. Click "disk-data-backup-test"
3. Click "Restore" (top button)
4. Fill in:
   - Restore point: Select latest
   - Target resource group: rg-day25-backup
   - Restored disk name: disk-data-restored
5. Click "Validate"
6. After validation → Click "Restore"
```

**⏱️ Wait**: 5-10 minutes

### Step 7: Test, Check, and Confirm - Disk Backup

**Test 1: Verify Backup Configured**

```
1. In Backup vault → Backup instances
2. Verify:
   ✅ disk-data-backup-test listed
   ✅ Protection status: Protection configured
   ✅ Policy: DailyDisk-7days
```

**Test 2: Verify Backup Completed**

```
1. In Backup vault → Backup Jobs
2. Verify:
   ✅ Backup job: Completed
   ✅ Datasource: disk-data-backup-test
```

**Test 3: Verify Snapshot Created**

```
1. Go to resource group: rg-day25-snapshots
2. Verify:
   ✅ Snapshot resource exists
   ✅ Type: Microsoft.Compute/snapshots
   ✅ Size: 32 GiB
```

**Test 4: Verify Restored Disk**

```
1. Search "Disks" in Azure Portal
2. Verify:
   ✅ disk-data-restored exists
   ✅ Size: 32 GiB
   ✅ Resource group: rg-day25-backup
   ✅ Status: Unattached (ready to attach to VM)
```

**Test 5: Verify Restore Job**

```
1. In Backup vault → Backup Jobs
2. Verify:
   ✅ Restore job: Completed
   ✅ No errors
```

**✅ Result**: Managed disk backup and restore working!

---

## Lab 8: Backup Center (Monitor Everything)

### What is Backup Center?

```
Backup Center = Single dashboard to monitor ALL backups

┌─────────────────────────────────────────────────────────────────┐
│  BACKUP CENTER                                                   │
│  (One place to see everything)                                  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Overview Dashboard                                        │  │
│  │                                                             │  │
│  │  Protected Items:                                          │  │
│  │  ├─ VMs: 1 protected                                      │  │
│  │  ├─ File Shares: 1 protected                              │  │
│  │  ├─ Blobs: 1 protected                                    │  │
│  │  ├─ SQL DBs: 1 protected (auto)                           │  │
│  │  └─ Disks: 1 protected                                    │  │
│  │                                                             │  │
│  │  Backup Jobs (last 24h):                                   │  │
│  │  ├─ Completed: 5                                          │  │
│  │  ├─ In progress: 0                                        │  │
│  │  └─ Failed: 0                                             │  │
│  │                                                             │  │
│  │  Alerts:                                                   │  │
│  │  ├─ Critical: 0                                           │  │
│  │  ├─ Warning: 0                                            │  │
│  │  └─ Info: 3                                               │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Step 1: Open Backup Center

```
1. Search "Backup center" in Azure Portal
2. Click "Backup center"
3. You'll see the main dashboard
```

### Step 2: Explore Overview

```
1. Overview tab shows:
   - Backup instances by datasource type (pie chart)
   - Backup job status (success/failed)
   - Active alerts
   
2. Check each section:
   ✅ Backup instances: Shows all protected items
   ✅ Backup jobs: Shows recent job status
   ✅ Alerts: Shows any issues
```

### Step 3: View Backup Instances

```
1. Left menu → "Backup instances"
2. You should see ALL your protected items:
   
   ┌──────────────────────┬──────────────┬──────────────────┐
   │  Datasource           │  Type         │  Status           │
   ├──────────────────────┼──────────────┼──────────────────┤
   │  vm-backup-test       │  Azure VM     │  Protection OK    │
   │  app-files            │  File Share   │  Protection OK    │
   │  stday25blobs         │  Azure Blob   │  Protection OK    │
   │  disk-data-backup-test│  Azure Disk   │  Protection OK    │
   └──────────────────────┴──────────────┴──────────────────┘
```

### Step 4: View Backup Jobs

```
1. Left menu → "Backup Jobs"
2. Filter by:
   - Time range: Last 24 hours
   - Status: All
3. You should see all backup and restore jobs from today's labs
```

### Step 5: Configure Backup Reports

```
1. Left menu → "Backup reports"
2. This requires a Log Analytics workspace:
   
   a. Search "Log Analytics workspaces"
   b. Click "+ Create"
   c. Fill in:
      - Resource group: rg-day25-backup
      - Name: law-day25-backup
      - Region: East US
   d. Click "Review + create" → "Create"

3. Go back to vault: rsv-day25-backup
4. Left menu → "Diagnostic settings"
5. Click "+ Add diagnostic setting"
6. Fill in:
   - Name: backup-diagnostics
   - Logs: Check all categories
   - Destination: Send to Log Analytics workspace
   - Workspace: law-day25-backup
7. Click "Save"

8. Go back to Backup center → Backup reports
9. Select workspace: law-day25-backup
10. Reports will populate after data flows in (may take hours)
```

### Step 6: Configure Backup Alerts

```
1. Go to vault: rsv-day25-backup
2. Left menu → "Alerts"
3. You can see built-in alerts for:
   - Backup failures
   - Restore failures
   - Delete backup data

4. To create email notification:
   a. Left menu → "Alerts" → "Alert rules"
   b. Click "+ Create alert rule" (or use built-in alerts)
   c. For built-in alerts:
      - Go to vault → Properties
      - Under "Monitoring Settings"
      - Click "Update"
      - Notification for backup alerts: Enable
      - Email: your-email@example.com
      - Click "Save"
```

### Step 7: Test, Check, and Confirm - Backup Center

**Test 1: Verify All Backup Instances**

```
1. Backup center → Backup instances
2. Verify ALL items from today's labs:
   ✅ vm-backup-test (Azure VM)
   ✅ app-files (Azure File Share)
   ✅ stday25blobs (Azure Blob)
   ✅ disk-data-backup-test (Azure Disk)
```

**Test 2: Verify All Jobs Completed**

```
1. Backup center → Backup Jobs
2. Filter: Last 24 hours
3. Verify:
   ✅ All backup jobs: Completed
   ✅ All restore jobs: Completed
   ✅ No failed jobs
```

**Test 3: Verify Policies**

```
1. Backup center → Backup policies
2. Verify:
   ✅ DailyVM-30days (VM backup)
   ✅ DailyFileShare-14days (File share)
   ✅ BlobOperational-30days (Blob)
   ✅ DailyDisk-7days (Disk)
```

**Test 4: Verify Vaults**

```
1. Backup center → Vaults
2. Verify:
   ✅ rsv-day25-backup (Recovery Services vault)
   ✅ bv-day25-disk (Backup vault)
```

**Test 5: Verify Diagnostic Settings**

```
1. Go to vault → Diagnostic settings
2. Verify:
   ✅ backup-diagnostics configured
   ✅ Sending to law-day25-backup workspace
```

**✅ Result**: Backup Center monitoring all backups!

---

## Lab 9: File Recovery from VM Backup

### What is File Recovery?

```
File Recovery = Recover INDIVIDUAL files from a VM backup
               WITHOUT restoring the entire VM

┌─────────────────────────────────────────────────────────────────┐
│  VM RESTORE vs FILE RECOVERY                                     │
│                                                                  │
│  VM Restore (Lab 3):                                            │
│  ├─ Restores the ENTIRE VM (OS + all disks)                     │
│  ├─ Creates a new VM or replaces existing                       │
│  ├─ Takes 15-30 minutes                                         │
│  ├─ Good for: Complete disaster recovery                        │
│  └─ Overkill if you just need 1 file                            │
│                                                                  │
│  File Recovery (This Lab):                                      │
│  ├─ Recover SPECIFIC files/folders from backup                  │
│  ├─ Mounts backup as a drive on your machine                    │
│  ├─ Browse and copy only what you need                          │
│  ├─ Takes 2-5 minutes                                           │
│  └─ Perfect for: "I accidentally deleted config.txt"            │
│                                                                  │
│  Example:                                                       │
│  "I deleted /etc/nginx/nginx.conf on my web server"             │
│  → Don't restore entire VM!                                     │
│  → Use File Recovery to get just that one file                  │
└─────────────────────────────────────────────────────────────────┘
```

### How File Recovery Works

```
┌──────────────────────────────────────────────────────────────────┐
│  FILE RECOVERY FLOW                                               │
│                                                                   │
│  Step 1: Select recovery point from VM backup                    │
│  ┌──────────────────────────────────────┐                        │
│  │  Recovery Points:                     │                        │
│  │  ├─ March 17, 2:00 AM (today)        │                        │
│  │  ├─ March 16, 2:00 AM (yesterday)    │ ← Select this one     │
│  │  └─ March 15, 2:00 AM               │                        │
│  └──────────────────────────────────────┘                        │
│                    ↓                                              │
│  Step 2: Azure generates a script (executable)                   │
│  ┌──────────────────────────────────────┐                        │
│  │  Download script:                     │                        │
│  │  Windows: IaaSVMILRExeForWindows.exe │                        │
│  │  Linux: IaaSVMILRExeForLinux.sh      │                        │
│  └──────────────────────────────────────┘                        │
│                    ↓                                              │
│  Step 3: Run script on ANY machine                               │
│  ┌──────────────────────────────────────┐                        │
│  │  Script connects to Azure backup     │                        │
│  │  via iSCSI (secure connection)       │                        │
│  │  Mounts backup disks as local drives │                        │
│  └──────────────────────────────────────┘                        │
│                    ↓                                              │
│  Step 4: Browse and copy files                                   │
│  ┌──────────────────────────────────────┐                        │
│  │  Windows: Backup appears as E:\, F:\ │                        │
│  │  Linux: Backup mounted at /mnt/...   │                        │
│  │                                       │                        │
│  │  Browse → Find your file → Copy it   │                        │
│  └──────────────────────────────────────┘                        │
│                    ↓                                              │
│  Step 5: Unmount (cleanup)                                       │
│  ┌──────────────────────────────────────┐                        │
│  │  Click "Unmount Disks" in Portal     │                        │
│  │  Connection closed                    │                        │
│  └──────────────────────────────────────┘                        │
└──────────────────────────────────────────────────────────────────┘
```

### Prerequisites

```
You need a completed VM backup from Lab 2.
If you haven't done Lab 2, go back and complete it first.

The VM: vm-backup-test must have at least 1 recovery point.
```

### Step 1: Create Test Files on VM (If Not Already Done)

```
1. SSH into vm-backup-test:
   ssh azureuser@<VM-PUBLIC-IP>

2. Create important files:
   # Create application config
   mkdir -p ~/myapp/config
   echo "server_port=8080" > ~/myapp/config/server.conf
   echo "database_host=db.example.com" >> ~/myapp/config/server.conf
   echo "database_password=SuperSecret123" >> ~/myapp/config/server.conf
   
   # Create application logs
   mkdir -p ~/myapp/logs
   echo "[2026-03-17 10:00] Application started" > ~/myapp/logs/app.log
   echo "[2026-03-17 10:01] Connected to database" >> ~/myapp/logs/app.log
   echo "[2026-03-17 10:02] Processing 500 orders" >> ~/myapp/logs/app.log
   
   # Create a "database export"
   mkdir -p ~/myapp/data
   echo "id,name,email,amount" > ~/myapp/data/customers.csv
   echo "1,Alice,alice@example.com,5000" >> ~/myapp/data/customers.csv
   echo "2,Bob,bob@example.com,3200" >> ~/myapp/data/customers.csv
   echo "3,Carol,carol@example.com,7800" >> ~/myapp/data/customers.csv
   
   # Verify all files
   find ~/myapp -type f
   
   Expected:
   /home/azureuser/myapp/config/server.conf
   /home/azureuser/myapp/logs/app.log
   /home/azureuser/myapp/data/customers.csv

3. Exit SSH:
   exit
```

### Step 2: Run a Backup (Capture These Files)

```
1. Go to VM: vm-backup-test in Azure Portal
2. Left menu → "Backup"
3. Click "Backup now"
4. Retain backup till: Leave default
5. Click "OK"

⏱️ Wait: 15-30 minutes for backup to complete
   (Check vault → Backup Jobs for status)
```

### Step 3: Simulate Disaster (Delete Files)

```
1. SSH into vm-backup-test:
   ssh azureuser@<VM-PUBLIC-IP>

2. Accidentally delete important files:
   rm -rf ~/myapp/config/
   rm ~/myapp/data/customers.csv
   
   # Verify files are gone
   ls ~/myapp/config/
   # ls: cannot access '/home/azureuser/myapp/config/': No such file or directory
   
   ls ~/myapp/data/
   # (empty or no customers.csv)
   
   😱 Config and customer data deleted!
   💡 But we DON'T need to restore the entire VM
   💡 We just need those specific files back

3. Exit SSH:
   exit
```

### Step 4: Start File Recovery

```
1. Go to vault: rsv-day25-backup
2. Left menu → "Backup items"
3. Click "Azure Virtual Machine"
4. Click "vm-backup-test"
5. Click "File Recovery" (top menu button)

6. Select Recovery Point:
   - Step 1: Select recovery point
   - Choose the LATEST recovery point (the one from Step 2)
   - This is the backup that contains your deleted files

7. Download Script:
   - Step 2: Download script to browse and recover files
   - For Linux VM: Click "Download Executable"
   - A script file will download: IaaSVMILRExeForLinux.sh
   - Also note the PASSWORD shown on screen (you'll need it!)
   
   ⚠️ IMPORTANT: Copy the password! It's shown only once.
```

### Step 5: Run Recovery Script on the VM

```
1. Upload the script to your VM:
   scp IaaSVMILRExeForLinux.sh azureuser@<VM-PUBLIC-IP>:~/

2. SSH into the VM:
   ssh azureuser@<VM-PUBLIC-IP>

3. Make script executable and run it:
   chmod +x IaaSVMILRExeForLinux.sh
   sudo ./IaaSVMILRExeForLinux.sh

4. When prompted for password:
   Enter the password from the Portal (Step 4)

5. Script output:
   Connecting to recovery point...
   Mounting volumes...
   
   Successfully mounted the following volumes:
   /dev/sde1 on /mnt/restore-point/Volume1
   /dev/sde2 on /mnt/restore-point/Volume2
   
   ✅ Backup disks are now mounted as local folders!
```

### Step 6: Browse and Recover Files

```
1. Browse the mounted backup:
   # List mounted volumes
   ls /mnt/restore-point/
   
   # Find your files (the OS disk is usually Volume1)
   ls /mnt/restore-point/Volume1/home/azureuser/myapp/
   
   Expected:
   config/  data/  logs/
   
   ✅ All folders exist in the backup!

2. Verify the files are there:
   cat /mnt/restore-point/Volume1/home/azureuser/myapp/config/server.conf
   
   Expected:
   server_port=8080
   database_host=db.example.com
   database_password=SuperSecret123
   
   cat /mnt/restore-point/Volume1/home/azureuser/myapp/data/customers.csv
   
   Expected:
   id,name,email,amount
   1,Alice,alice@example.com,5000
   2,Bob,bob@example.com,3200
   3,Carol,carol@example.com,7800
   
   ✅ Files exist in backup with original content!

3. Copy files back to original location:
   # Restore config directory
   cp -r /mnt/restore-point/Volume1/home/azureuser/myapp/config/ ~/myapp/
   
   # Restore customers.csv
   cp /mnt/restore-point/Volume1/home/azureuser/myapp/data/customers.csv ~/myapp/data/
   
   # Verify restored files
   cat ~/myapp/config/server.conf
   cat ~/myapp/data/customers.csv
   
   ✅ Files restored to original location!

4. Exit SSH:
   exit
```

### Step 7: Unmount Recovery Disks

```
⚠️ IMPORTANT: Always unmount after recovery!

1. Go back to Azure Portal
2. In the File Recovery blade (where you downloaded the script)
3. Click "Unmount Disks" button
4. Confirm

   This disconnects the iSCSI connection and releases the recovery point.
   
   If you forget, Azure auto-unmounts after 12 hours.
```

### Step 8: Alternative - File Recovery on Windows VM

```
If your VM is Windows, the process is similar:

1. Download the .exe script from Portal
2. Run it on any Windows machine
3. Enter the password
4. Backup disks appear as new drive letters (E:\, F:\, etc.)
5. Open File Explorer → Browse the drives
6. Copy files you need
7. Go back to Portal → Click "Unmount Disks"

┌──────────────────────────────────────────────────────────────┐
│  WINDOWS FILE RECOVERY                                        │
│                                                               │
│  After running the script:                                   │
│                                                               │
│  This PC                                                     │
│  ├─ C:\ (your local disk)                                   │
│  ├─ D:\ (your local disk)                                   │
│  ├─ E:\ (backup OS disk) ← Browse here!                     │
│  │  ├─ Windows\                                              │
│  │  ├─ Users\                                                │
│  │  │  └─ azureuser\                                         │
│  │  │     └─ Documents\                                      │
│  │  │        └─ important-file.docx ← Copy this!            │
│  │  └─ Program Files\                                        │
│  └─ F:\ (backup data disk) ← Browse here!                   │
│     └─ data\                                                 │
│        └─ database.bak ← Copy this!                          │
└──────────────────────────────────────────────────────────────┘
```

### Step 9: Test, Check, and Confirm - File Recovery

**Test 1: Verify Files Restored on VM**

```
1. SSH into vm-backup-test
2. Check restored files:
   
   cat ~/myapp/config/server.conf
   ✅ Contains: server_port=8080, database_host, database_password
   
   cat ~/myapp/data/customers.csv
   ✅ Contains: 3 customer records (Alice, Bob, Carol)
   
   cat ~/myapp/logs/app.log
   ✅ Contains: Application log entries (was never deleted)
```

**Test 2: Verify File Content Matches Original**

```
1. On the VM:
   # Count lines in restored files
   wc -l ~/myapp/config/server.conf
   ✅ 3 lines (server_port, database_host, database_password)
   
   wc -l ~/myapp/data/customers.csv
   ✅ 4 lines (header + 3 records)
```

**Test 3: Verify Disks Unmounted**

```
1. In Azure Portal → vault → File Recovery
2. Verify:
   ✅ No active mount sessions
   ✅ "Unmount Disks" completed successfully
```

**Test 4: Verify Recovery Point Still Available**

```
1. In vault → Backup items → Azure Virtual Machine
2. Click vm-backup-test → View all restore points
3. Verify:
   ✅ Recovery point still exists (file recovery doesn't consume it)
   ✅ Can be used again for another file recovery or full restore
```

**Test 5: Verify No Impact on VM**

```
1. Go to VM: vm-backup-test
2. Verify:
   ✅ VM still running normally
   ✅ No restart required
   ✅ No downtime during file recovery
```

**✅ Result**: Individual file recovery from VM backup working!

---

## Lab 10: Recovery Services Vault Deep Dive

### What You'll Learn

```
Recovery Services Vault is the CORE of Azure Backup.
This lab explores all its features in detail.

┌─────────────────────────────────────────────────────────────────┐
│  RECOVERY SERVICES VAULT - COMPLETE FEATURES                     │
│                                                                  │
│  1. Backup Management                                           │
│     ├─ Backup items (what's protected)                          │
│     ├─ Backup policies (when and how long)                      │
│     ├─ Backup jobs (history and status)                         │
│     └─ Backup alerts (failure notifications)                    │
│                                                                  │
│  2. Security Features                                           │
│     ├─ Soft delete (recover deleted backups)                    │
│     ├─ Multi-user authorization (MUA)                           │
│     ├─ Immutable vault (cannot delete backups)                  │
│     ├─ Encryption (customer-managed keys)                       │
│     └─ Private endpoints (no public access)                     │
│                                                                  │
│  3. Disaster Recovery                                           │
│     ├─ Cross-region restore (CRR)                               │
│     ├─ Geo-redundant storage (GRS)                              │
│     └─ Azure Site Recovery (VM replication)                     │
│                                                                  │
│  4. Management                                                  │
│     ├─ RBAC (role-based access)                                 │
│     ├─ Diagnostic settings (logging)                            │
│     ├─ Tags (cost tracking)                                     │
│     └─ Resource move (between subscriptions)                    │
└─────────────────────────────────────────────────────────────────┘
```

### Step 1: Explore Vault Overview

```
1. Go to vault: rsv-day25-backup
2. Overview page shows:
   - Backup items count (by type)
   - Backup alerts
   - Backup jobs (last 24/48 hours)
   - Storage replication type
   
3. Click each tile to drill down:
   - Click backup items count → see all protected resources
   - Click alerts → see any issues
   - Click jobs → see backup/restore history
```

### Step 2: Soft Delete (Recover Deleted Backups)

```
What is Soft Delete?
  When you stop backup and delete data, the backup is NOT immediately gone.
  It's kept for 14 more days (soft deleted state).
  You can UNDO the deletion within 14 days!

┌──────────────────────────────────────────────────────────────┐
│  SOFT DELETE FLOW                                             │
│                                                               │
│  Day 0: Stop backup + Delete data                            │
│  ├─ Backup moves to "Soft deleted" state                     │
│  ├─ Data still exists (just hidden)                          │
│  └─ 14-day countdown starts                                  │
│                                                               │
│  Day 1-14: Can UNDO deletion                                 │
│  ├─ Go to Backup items → Show soft deleted items             │
│  ├─ Click "Undelete"                                         │
│  └─ Backup is restored!                                      │
│                                                               │
│  Day 15: Permanently deleted                                 │
│  └─ Data is gone forever                                     │
└──────────────────────────────────────────────────────────────┘

Lab: Test Soft Delete

1. Go to vault → Backup items → Azure Virtual Machine
2. Click "vm-backup-test"
3. Click "Stop backup"
4. Select "Retain backup data" (NOT delete!)
   - This stops future backups but keeps existing data
   - Click "Stop backup"

5. Verify backup stopped:
   ✅ Status shows "Backup stopped"
   ✅ Existing recovery points still available

6. Now let's test soft delete:
   - Click "Stop backup" again (if needed)
   - This time select "Delete backup data"
   - Type the item name: vm-backup-test
   - Reason: Testing soft delete
   - Click "Stop backup"

7. The backup data is now SOFT DELETED:
   - Go to vault → Backup items → Azure Virtual Machine
   - Click "Show soft deleted items" (toggle at top)
   - You should see vm-backup-test in soft deleted state

8. UNDO the deletion:
   - Click "vm-backup-test" (soft deleted)
   - Click "Undelete"
   - Confirm
   
   ✅ Backup data is restored!
   ✅ Status returns to "Backup stopped" (with data retained)

9. Re-enable backup:
   - Click "Resume backup"
   - Select policy: DailyVM-30days
   - Click "Resume backup"
   
   ✅ VM backup is active again!
```

### Step 3: Immutable Vault (Ransomware Protection)

```
What is Immutable Vault?
  Once enabled, backup data CANNOT be deleted before its retention expires.
  Even admins cannot delete it!
  
  This protects against:
  ├─ Ransomware (attacker can't delete backups)
  ├─ Malicious admin (insider threat)
  └─ Accidental deletion (human error)

┌──────────────────────────────────────────────────────────────┐
│  IMMUTABLE VAULT                                              │
│                                                               │
│  Without Immutability:                                       │
│  Admin: "Delete all backups" → ✅ Deleted                    │
│  Hacker: "Delete all backups" → ✅ Deleted                   │
│  😱 No recovery possible!                                    │
│                                                               │
│  With Immutability:                                          │
│  Admin: "Delete all backups" → ❌ DENIED                     │
│  Hacker: "Delete all backups" → ❌ DENIED                    │
│  ✅ Backups safe until retention expires!                     │
└──────────────────────────────────────────────────────────────┘

Lab: View Immutability Settings

1. Go to vault: rsv-day25-backup
2. Left menu → "Properties"
3. Under "Immutable vault":
   - Click "Update"
   - You'll see options:
     - Disabled (default)
     - Enabled (can be disabled later)
     - Enabled and locked (CANNOT be disabled - permanent!)
   
   ⚠️ For this lab, just VIEW the settings. Don't enable "locked"!
   
   - Select "Enabled" (reversible)
   - Click "Apply"

4. Verify:
   ✅ Immutable vault: Enabled
   ✅ This means backup data cannot be deleted early
   
5. Disable it (for lab cleanup later):
   - Click "Update" again
   - Select "Disabled"
   - Click "Apply"
```

### Step 4: Cross-Region Restore (CRR)

```
What is Cross-Region Restore?
  Restore your backups in a DIFFERENT Azure region.
  If East US goes down, restore in West US!

┌──────────────────────────────────────────────────────────────┐
│  CROSS-REGION RESTORE                                         │
│                                                               │
│  Normal Restore:                                             │
│  Backup in East US → Restore in East US                      │
│  ❌ If East US is down, can't restore!                       │
│                                                               │
│  Cross-Region Restore:                                       │
│  Backup in East US → Replicated to West US (GRS)            │
│  East US down → Restore in West US ✅                        │
│                                                               │
│  Requirements:                                               │
│  ├─ Vault must use GRS (Geo-Redundant Storage)              │
│  ├─ CRR must be enabled on the vault                        │
│  └─ Backup data replicates to paired region                 │
└──────────────────────────────────────────────────────────────┘

Lab: Enable Cross-Region Restore

1. Go to vault: rsv-day25-backup
2. Left menu → "Properties"
3. Under "Backup Configuration":
   - Click "Update"
   - Storage replication type: Geo-redundant (GRS)
     (Should already be GRS from Lab 1)
   - Cross Region Restore: Enable
   - Click "Save"

4. Verify CRR is enabled:
   ✅ Storage replication: Geo-redundant
   ✅ Cross Region Restore: Enabled

5. Test Cross-Region Restore (view only):
   - Left menu → "Backup items"
   - Click "Azure Virtual Machine"
   - At the top, toggle "Secondary Region"
   - You should see backup items available in the paired region
   
   Note: Data takes up to 24 hours to replicate to secondary region.
   You may not see data immediately.
   
   ✅ CRR configured! In a real disaster, you can restore in paired region.
```

### Step 5: RBAC (Who Can Do What)

```
What is Backup RBAC?
  Control who can manage backups using Azure roles.

┌──────────────────────────────────────────────────────────────┐
│  BACKUP RBAC ROLES                                            │
│                                                               │
│  Backup Contributor:                                         │
│  ├─ Create/manage vault                                      │
│  ├─ Create/modify backup policies                            │
│  ├─ Enable/disable backup                                    │
│  ├─ Trigger backup/restore                                   │
│  └─ ❌ Cannot delete vault or backup data                    │
│                                                               │
│  Backup Operator:                                            │
│  ├─ View backup status                                       │
│  ├─ Trigger backup                                           │
│  ├─ Trigger restore                                          │
│  └─ ❌ Cannot create/modify policies or delete               │
│                                                               │
│  Backup Reader:                                              │
│  ├─ View backup status                                       │
│  ├─ View policies                                            │
│  ├─ View jobs                                                │
│  └─ ❌ Cannot trigger backup/restore or modify anything      │
│                                                               │
│  Best Practice:                                              │
│  ├─ Admins: Backup Contributor                               │
│  ├─ Operators: Backup Operator                               │
│  ├─ Developers: Backup Reader                                │
│  └─ Nobody gets Owner/Contributor on vault directly          │
└──────────────────────────────────────────────────────────────┘

Lab: View and Assign Backup Roles

1. Go to vault: rsv-day25-backup
2. Left menu → "Access control (IAM)"
3. Click "Role assignments" tab
4. View current assignments:
   ✅ See who has access to this vault

5. To add a role (example):
   - Click "+ Add" → "Add role assignment"
   - Role: Backup Operator
   - Members: Select a user or group
   - Click "Review + assign"
   
   (Skip this if you don't have other users to assign)

6. Click "Roles" tab to see all available backup roles:
   - Search "backup"
   - You'll see: Backup Contributor, Backup Operator, Backup Reader
   ✅ All backup-specific roles available
```

### Step 6: Diagnostic Settings and Monitoring

```
Lab: Configure Complete Monitoring

1. Go to vault: rsv-day25-backup
2. Left menu → "Diagnostic settings"
3. If not already configured (from Lab 8):
   - Click "+ Add diagnostic setting"
   - Name: vault-diagnostics
   - Log categories: Select ALL
     ✅ CoreAzureBackup
     ✅ AddonAzureBackupJobs
     ✅ AddonAzureBackupAlerts
     ✅ AddonAzureBackupPolicy
     ✅ AddonAzureBackupStorage
     ✅ AddonAzureBackupProtectedInstance
   - Destination: Send to Log Analytics workspace
   - Workspace: law-day25-backup
   - Click "Save"

4. Verify:
   ✅ Diagnostic setting created
   ✅ All log categories selected
   ✅ Sending to Log Analytics workspace
```

### Step 7: Vault Security Checklist

```
Lab: Verify All Security Settings

Go through each setting and verify:

1. Properties → Backup Configuration:
   ✅ Storage replication: GRS (for production)
   ✅ Cross Region Restore: Enabled

2. Properties → Security Settings:
   ✅ Soft delete: Enabled (14 days)
   ✅ Soft delete for VMs: Enabled

3. Properties → Immutable vault:
   ✅ Reviewed (enable for production)

4. Access control (IAM):
   ✅ Appropriate roles assigned
   ✅ No unnecessary Owner/Contributor access

5. Diagnostic settings:
   ✅ All log categories enabled
   ✅ Sending to Log Analytics

6. Alerts:
   ✅ Email notifications configured
   ✅ Backup failure alerts enabled
```

### Step 8: Test, Check, and Confirm - Recovery Services Vault

**Test 1: Verify Soft Delete Works**

```
1. In vault → Properties → Security Settings
2. Verify:
   ✅ Soft delete: Enabled
   ✅ Retention: 14 days
   ✅ Tested: Deleted and undeleted backup successfully
```

**Test 2: Verify Cross-Region Restore**

```
1. In vault → Properties → Backup Configuration
2. Verify:
   ✅ Storage replication: Geo-redundant (GRS)
   ✅ Cross Region Restore: Enabled
```

**Test 3: Verify RBAC**

```
1. In vault → Access control (IAM) → Role assignments
2. Verify:
   ✅ Appropriate roles assigned
   ✅ Backup-specific roles used (not generic Owner)
```

**Test 4: Verify Diagnostics**

```
1. In vault → Diagnostic settings
2. Verify:
   ✅ Diagnostic setting configured
   ✅ All 6 log categories enabled
   ✅ Sending to Log Analytics workspace
```

**Test 5: Verify All Backup Items Active**

```
1. In vault → Backup items
2. Verify all items from today's labs:
   ✅ Azure Virtual Machine: vm-backup-test (active)
   ✅ Azure Storage (Azure Files): app-files (active)
   ✅ Azure Storage (Azure Blobs): stday25blobs (active)
```

**Test 6: Verify Backup Policies**

```
1. In vault → Backup policies
2. Verify:
   ✅ DailyVM-30days (daily, 30 days + weekly + monthly)
   ✅ DailyFileShare-14days (daily, 14 days + weekly)
   ✅ BlobOperational-30days (continuous, 30 days)
```

**Test 7: Verify Vault Health**

```
1. In vault → Overview
2. Verify:
   ✅ No critical alerts
   ✅ Recent backup jobs: Completed
   ✅ All backup items: Protected
```

**✅ Result**: Recovery Services Vault fully configured and verified!

---

## Complete Summary - What We Built

```
┌─────────────────────────────────────────────────────────────────┐
│  DAY 25 - AZURE BACKUP COMPLETE SETUP                            │
│                                                                  │
│  Recovery Services Vault: rsv-day25-backup                      │
│  ├─ VM Backup: vm-backup-test                                   │
│  │  ├─ Policy: DailyVM-30days                                   │
│  │  ├─ Schedule: Daily at 2:00 AM                               │
│  │  ├─ Retention: 30 days daily, 12 weeks, 12 months            │
│  │  ├─ ✅ Full VM Backup + Restore tested                       │
│  │  └─ ✅ File Recovery tested (individual files)               │
│  │                                                               │
│  ├─ File Share Backup: app-files                                │
│  │  ├─ Policy: DailyFileShare-14days                            │
│  │  ├─ Schedule: Daily at 3:00 AM                               │
│  │  ├─ Retention: 14 days daily, 4 weeks                        │
│  │  └─ ✅ Backup + Restore tested                               │
│  │                                                               │
│  ├─ Blob Backup: stday25blobs                                   │
│  │  ├─ Policy: BlobOperational-30days                           │
│  │  ├─ Type: Operational (continuous)                           │
│  │  ├─ Retention: 30 days point-in-time                         │
│  │  └─ ✅ Backup + Restore tested                               │
│  │                                                               │
│  └─ SQL Database: db-backup-test                                │
│     ├─ Auto backup: Built-in (7 days PITR)                     │
│     ├─ LTR: 4 weeks, 12 months, 1 year                         │
│     └─ ✅ Point-in-time restore tested                          │
│                                                                  │
│  Backup Vault: bv-day25-disk                                    │
│  └─ Disk Backup: disk-data-backup-test                          │
│     ├─ Policy: DailyDisk-7days                                  │
│     ├─ Schedule: Daily at 4:00 AM                               │
│     ├─ Retention: 7 days                                        │
│     └─ ✅ Backup + Restore tested                               │
│                                                                  │
│  Vault Security:                                                │
│  ├─ Soft delete: Enabled (14 days recovery)                     │
│  ├─ Cross-Region Restore: Enabled (GRS)                         │
│  ├─ Immutable vault: Reviewed                                   │
│  ├─ RBAC: Backup-specific roles                                 │
│  └─ Diagnostics: All logs to Log Analytics                      │
│                                                                  │
│  Monitoring:                                                     │
│  ├─ Backup Center: All items visible                            │
│  ├─ Log Analytics: Diagnostics configured                       │
│  └─ Alerts: Email notifications enabled                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Backup Best Practices

```
┌─────────────────────────────────────────────────────────────────┐
│  PRODUCTION BACKUP BEST PRACTICES                                │
│                                                                  │
│  1. 3-2-1 Rule:                                                 │
│     ├─ 3 copies of data                                         │
│     ├─ 2 different storage types                                │
│     └─ 1 offsite (different region)                             │
│                                                                  │
│  2. Test Restores Regularly:                                    │
│     ├─ Monthly: Test VM restore                                 │
│     ├─ Quarterly: Test full disaster recovery                   │
│     └─ Document restore procedures                              │
│                                                                  │
│  3. Retention Strategy:                                         │
│     ├─ Daily: 30 days (operational recovery)                    │
│     ├─ Weekly: 12 weeks (recent history)                        │
│     ├─ Monthly: 12 months (compliance)                          │
│     └─ Yearly: 7 years (legal requirements)                     │
│                                                                  │
│  4. Security:                                                   │
│     ├─ Enable soft delete (prevent accidental deletion)         │
│     ├─ Use GRS for production (cross-region protection)         │
│     ├─ Enable MFA for critical operations                       │
│     └─ Use RBAC (limit who can delete backups)                  │
│                                                                  │
│  5. Monitoring:                                                 │
│     ├─ Configure alerts for backup failures                     │
│     ├─ Review Backup Center weekly                              │
│     ├─ Enable diagnostic logging                                │
│     └─ Track backup costs                                       │
│                                                                  │
│  6. Cost Optimization:                                          │
│     ├─ Use LRS for dev/test, GRS for production                │
│     ├─ Adjust retention (don't keep longer than needed)         │
│     ├─ Use incremental backups (Azure default)                  │
│     └─ Review and clean up old backup items                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Cleanup

### Delete All Resources

```
1. Delete Backup Items First (IMPORTANT - must stop backup before deleting):

   a. Recovery Services Vault → Backup items → Azure Virtual Machine
      - Click vm-backup-test → "Stop backup"
      - Select "Delete backup data"
      - Type the item name to confirm
      - Click "Stop backup"

   b. Recovery Services Vault → Backup items → Azure Storage (Azure Files)
      - Click app-files → "Stop backup"
      - Select "Delete backup data"
      - Type the item name to confirm
      - Click "Stop backup"

   c. Recovery Services Vault → Backup items → Azure Storage (Azure Blobs)
      - Click stday25blobs → "Stop backup"
      - Select "Delete backup data"
      - Confirm

   d. Backup Vault → Backup instances
      - Click disk-data-backup-test → "Stop backup"
      - Confirm

2. Delete Vaults:
   - Delete rsv-day25-backup (Recovery Services vault)
   - Delete bv-day25-disk (Backup vault)
   
   Note: Vaults cannot be deleted while they contain backup items.
   If you get an error, ensure all backup items are removed first.

3. Delete SQL Resources:
   - Delete database: db-backup-test-restored
   - Delete database: db-backup-test
   - Delete SQL server: sql-day25-backup

4. Delete Resource Groups:
   - Search "Resource groups"
   - Delete: rg-day25-backup (this deletes everything in it)
   - Delete: rg-day25-snapshots
   - Click "Delete resource group"
   - Type the name to confirm
   - Click "Delete"
```

**⏱️ Wait**: 10-15 minutes for full cleanup

**⚠️ Important Cleanup Order:**
```
1. Stop all backups and delete backup data
2. Delete vaults (after backup items removed)
3. Delete resource groups (deletes remaining resources)

If you skip step 1, you cannot delete the vault!
```

**✅ Result**: All resources deleted!

---

## Quick Reference

### Backup Types Comparison

```
┌──────────────┬──────────────┬──────────────┬──────────────────┐
│  Resource     │  Vault Type   │  Backup Type  │  Restore Options │
├──────────────┼──────────────┼──────────────┼──────────────────┤
│  VM          │  Recovery     │  Scheduled    │  New VM          │
│              │  Services     │  (daily)      │  Replace disks   │
│              │              │              │  Restore disks   │
├──────────────┼──────────────┼──────────────┼──────────────────┤
│  File Share  │  Recovery     │  Scheduled    │  Full share      │
│              │  Services     │  (snapshot)   │  Individual files│
├──────────────┼──────────────┼──────────────┼──────────────────┤
│  Blob        │  Recovery     │  Continuous   │  Point-in-time   │
│              │  Services     │  (operational)│  Container level │
├──────────────┼──────────────┼──────────────┼──────────────────┤
│  SQL DB      │  Built-in     │  Automatic    │  Point-in-time   │
│              │  (no vault)   │  (continuous) │  New database    │
├──────────────┼──────────────┼──────────────┼──────────────────┤
│  Managed     │  Backup       │  Scheduled    │  New disk        │
│  Disk        │  Vault        │  (incremental)│                  │
└──────────────┴──────────────┴──────────────┴──────────────────┘
```

### Key Azure Backup Limits

```
VM Backup:
  - Max disks per VM: 32
  - Max disk size: 32 TB
  - Max backups per day: 1 scheduled + on-demand
  - Instant restore retention: 1-5 days

File Share Backup:
  - Max snapshots per share: 200
  - Max backups per day: 1 scheduled + on-demand

Blob Backup:
  - Operational retention: 1-365 days
  - Restore granularity: Container level

SQL Database:
  - PITR retention: 1-35 days
  - LTR: Up to 10 years
  - RPO: ~5-10 minutes (transaction log frequency)
```

### Useful Links

- [Azure Backup Documentation](https://learn.microsoft.com/azure/backup/)
- [Recovery Services Vault](https://learn.microsoft.com/azure/backup/backup-azure-recovery-services-vault-overview)
- [VM Backup](https://learn.microsoft.com/azure/backup/backup-azure-vms-introduction)
- [SQL Database Backup](https://learn.microsoft.com/azure/azure-sql/database/automated-backups-overview)
- [Backup Center](https://learn.microsoft.com/azure/backup/backup-center-overview)
- [Backup Pricing](https://azure.microsoft.com/pricing/details/backup/)

---

**🎉 Congratulations!** You've completed Day 25 covering Azure Backup for VMs, File Shares, Blobs, SQL Databases, and Managed Disks with complete backup and restore testing!