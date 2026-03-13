# Day 21: Azure Storage - Complete Guide

## What You'll Learn

This comprehensive guide covers ALL Azure Storage services:
- ✅ Blob Storage (objects, files, images, videos)
- ✅ File Storage (SMB file shares)
- ✅ Queue Storage (messaging)
- ✅ Table Storage (NoSQL)
- ✅ Disk Storage (VM disks)
- ✅ Access tiers, lifecycle management, security
- ✅ All via Azure Portal with complete labs

## Table of Contents

1. [What is Azure Storage?](#what-is-azure-storage)
2. [Why Use Azure Storage?](#why-use-azure-storage)
3. [Storage Account Types](#storage-account-types)
4. [Blob Storage](#blob-storage)
5. [File Storage](#file-storage)
6. [Queue Storage](#queue-storage)
7. [Table Storage](#table-storage)
8. [Disk Storage](#disk-storage)
9. [Security & Access Control](#security--access-control)
10. [Cost Optimization](#cost-optimization)

---

## What is Azure Storage?

**Azure Storage** is Microsoft's cloud storage solution for modern data storage scenarios.

### Core Services

```
Azure Storage Account
    ├─ Blob Storage (Objects)
    │   ├─ Block Blobs (files, images, videos)
    │   ├─ Append Blobs (logs)
    │   └─ Page Blobs (VM disks)
    │
    ├─ File Storage (SMB shares)
    │   └─ Azure Files (network file shares)
    │
    ├─ Queue Storage (Messages)
    │   └─ Message queues for async processing
    │
    ├─ Table Storage (NoSQL)
    │   └─ Key-value store
    │
    └─ Disk Storage (Managed Disks)
        ├─ OS Disks
        └─ Data Disks
```

### Key Concepts

**Storage Account:**
- Container for all Azure Storage services
- Unique namespace: `https://<account-name>.blob.core.windows.net`
- Provides authentication and access control

**Redundancy:**
- LRS (Locally Redundant Storage) - 3 copies in one datacenter
- ZRS (Zone Redundant Storage) - 3 copies across availability zones
- GRS (Geo-Redundant Storage) - 6 copies across two regions
- GZRS (Geo-Zone Redundant Storage) - ZRS + GRS

---

## Why Use Azure Storage?

### Benefits

**1. Durability & Availability**
- 99.999999999% (11 9's) durability
- 99.9% to 99.99% availability SLA
- Automatic replication

**2. Scalability**
- Petabytes of data
- Millions of requests per second
- Auto-scaling

**3. Security**
- Encryption at rest (256-bit AES)
- Encryption in transit (HTTPS/TLS)
- Azure AD integration
- Shared Access Signatures (SAS)

**4. Cost-Effective**
- Pay only for what you use
- Multiple access tiers (Hot, Cool, Archive)
- Lifecycle management

**5. Global Access**
- CDN integration
- Geo-replication
- Low latency worldwide

### Use Cases

| Service | Use Case | Example |
|---------|----------|---------|
| Blob Storage | Unstructured data | Images, videos, backups, logs |
| File Storage | Shared file systems | Legacy apps, lift-and-shift |
| Queue Storage | Async messaging | Order processing, task queues |
| Table Storage | NoSQL data | IoT telemetry, user profiles |
| Disk Storage | VM storage | Operating systems, databases |

---

## Storage Account Types

### Performance Tiers

**Standard (HDD-based):**
- General-purpose v2 (recommended)
- Lower cost
- Good for most scenarios

**Premium (SSD-based):**
- Block blobs (high transaction rates)
- File shares (enterprise workloads)
- Page blobs (VM disks)

### Comparison

| Feature | Standard | Premium |
|---------|----------|---------|
| Storage | HDD | SSD |
| IOPS | Up to 20,000 | Up to 100,000+ |
| Latency | ~10ms | <1ms |
| Cost | Lower | Higher |
| Use Case | General | High-performance |

---

## Lab 1: Create Storage Account

### What We'll Build

```
Storage Account: mystoragelab123
    ├─ Blob Container: images
    ├─ File Share: documents
    ├─ Queue: orders
    └─ Table: customers
```

### Step 1: Create Storage Account

1. Login to **Azure Portal** (portal.azure.com)
2. Search for **"Storage accounts"**
3. Click **"+ Create"**

**Basics Tab:**
- **Subscription**: Your subscription
- **Resource group**: Create new: `rg-storage-lab`
- **Storage account name**: `mystoragelab123` (must be globally unique, lowercase, no special chars)
- **Region**: `East US` (or your preferred region)
- **Performance**: `Standard`
- **Redundancy**: `Locally-redundant storage (LRS)`

Click **"Next: Advanced"**

**Advanced Tab:**
- **Require secure transfer**: `Enabled` ✅
- **Allow Blob public access**: `Enabled` (for lab purposes)
- **Minimum TLS version**: `Version 1.2`
- **Enable storage account key access**: `Enabled`
- **Enable infrastructure encryption**: `Disabled` (optional)

Click **"Next: Networking"**

**Networking Tab:**
- **Network access**: `Enable public access from all networks`
- (For production, use private endpoints)

Click **"Next: Data protection"**

**Data Protection Tab:**
- **Enable soft delete for blobs**: `Enabled` (7 days)
- **Enable soft delete for containers**: `Enabled` (7 days)
- **Enable versioning**: `Disabled` (optional)

Click **"Next: Encryption"**

**Encryption Tab:**
- **Encryption type**: `Microsoft-managed keys (MMK)`
- (For production, consider customer-managed keys)

Click **"Next: Tags"** (skip)

Click **"Review + create"**

Click **"Create"**

**⏱️ Wait**: 1-2 minutes

**✅ Result**: Storage account created!

### Step 2: Verify Storage Account

1. Go to **"Storage accounts"**
2. Click on **"mystoragelab123"**
3. In **"Overview"**, note:
   - **Primary endpoint URLs**:
     - Blob: `https://mystoragelab123.blob.core.windows.net`
     - File: `https://mystoragelab123.file.core.windows.net`
     - Queue: `https://mystoragelab123.queue.core.windows.net`
     - Table: `https://mystoragelab123.table.core.windows.net`

### Step 3: Test, Check, and Confirm

**Test 1: Verify Storage Account Status**

1. In **"Overview"**, check:
   - **Status**: Should show green checkmark ✅
   - **Location**: `East US` (or your selected region)
   - **Performance**: `Standard`
   - **Replication**: `Locally-redundant storage (LRS)`

**Expected Result:**
```
✅ Status: Available
✅ Primary location: East US
✅ Performance: Standard
✅ Redundancy: LRS
```

**Test 2: Verify Endpoints are Accessible**

1. Copy the **Blob service endpoint**: `https://mystoragelab123.blob.core.windows.net`
2. Open in browser
3. You should see XML response:

**Expected Result:**
```xml
<Error>
  <Code>ResourceNotFound</Code>
  <Message>The specified resource does not exist.</Message>
</Error>
```

**✅ This is CORRECT!** It means the endpoint is accessible, but no container is specified.

**Test 3: Check Storage Account Keys**

1. In left menu, click **"Access keys"** (under Security + networking)
2. You should see:
   - **key1**: Shows/Hidden (click "Show" to reveal)
   - **key2**: Shows/Hidden
   - **Connection string**: Available for both keys

**Expected Result:**
```
✅ Two access keys available
✅ Connection strings generated
✅ Keys are hidden by default (security)
```

**Test 4: Verify Services are Enabled**

1. In left menu, check these sections exist:
   - ✅ **Containers** (Blob Storage)
   - ✅ **File shares** (File Storage)
   - ✅ **Queues** (Queue Storage)
   - ✅ **Tables** (Table Storage)

**Test 5: Check Monitoring**

1. Click **"Insights"** (under Monitoring)
2. You should see empty dashboards (no data yet)
3. This confirms monitoring is enabled

**✅ Result**: Storage account fully operational and ready to use!

---

## Blob Storage

### What is Blob Storage?

**Blob** = Binary Large Object

**Types of Blobs:**

1. **Block Blobs** (most common)
   - Files, images, videos, documents
   - Up to 190.7 TiB per blob
   - Optimized for streaming

2. **Append Blobs**
   - Log files
   - Append-only operations
   - Up to 195 GiB per blob

3. **Page Blobs**
   - VM disks (VHD files)
   - Random read/write
   - Up to 8 TiB per blob

### Access Tiers

| Tier | Use Case | Cost | Access Time |
|------|----------|------|-------------|
| Hot | Frequently accessed | Highest storage, lowest access | Immediate |
| Cool | Infrequently accessed (30+ days) | Lower storage, higher access | Immediate |
| Archive | Rarely accessed (180+ days) | Lowest storage, highest access | Hours (rehydration) |

### Container Structure

```
Storage Account
    └─ Container (like a folder)
        ├─ Blob 1 (file)
        ├─ Blob 2 (file)
        └─ Virtual Directory/
            └─ Blob 3 (file)
```

---

## Lab 2: Blob Storage - Upload & Manage Files

### Step 1: Create Blob Container

1. Go to **"Storage accounts"** → **"mystoragelab123"**
2. In left menu, click **"Containers"** (under Data storage)
3. Click **"+ Container"**

**Container Configuration:**
- **Name**: `images`
- **Public access level**: `Private (no anonymous access)`
- Click **"Create"**

**⏱️ Wait**: Few seconds

**✅ Result**: Container created

### Step 2: Upload Files

1. Click on **"images"** container
2. Click **"Upload"**

**Upload blob:**
- **Files**: Click **"Browse for files"**
  - Select an image file from your computer (e.g., `test-image.jpg`)
- **Blob type**: `Block blob`
- **Block size**: `4 MiB` (default)
- **Access tier**: `Hot`
- **Upload to folder**: Leave empty (or type `photos/` for virtual directory)
- Click **"Upload"**

**⏱️ Wait**: Few seconds

**✅ Result**: File uploaded!

### Step 3: View and Download Blob

1. Click on the uploaded file
2. In **"Overview"**, you'll see:
   - **URL**: `https://mystoragelab123.blob.core.windows.net/images/test-image.jpg`
   - **Size**: File size
   - **Last modified**: Timestamp
   - **Access tier**: Hot

3. Click **"Download"** to download the file
4. Try opening the URL in browser - should get **"Public access is not permitted"** (because container is private)

**✅ Result**: Blob properties viewed

### Step 4: Change Access Tier

1. Select the blob (checkbox)
2. Click **"Change tier"**
3. Select **"Cool"**
4. Click **"Save"**

**What happened:**
- Blob moved to Cool tier
- Lower storage cost
- Slightly higher access cost
- Still immediately accessible

**✅ Result**: Access tier changed

### Step 5: Generate SAS Token (Secure Access)

**SAS** = Shared Access Signature (temporary access to private blobs)

1. Click on the blob
2. Click **"Generate SAS"**

**SAS Configuration:**
- **Permissions**: `Read` ✅
- **Start time**: Now
- **Expiry time**: 1 hour from now
- **Allowed IP addresses**: Leave empty (or specify your IP)
- **Allowed protocols**: `HTTPS only`
- Click **"Generate SAS token and URL"**

3. Copy **"Blob SAS URL"**
4. Open in browser - image should display!

**What happened:**
- Generated temporary URL with access token
- URL works for 1 hour
- After expiry, URL becomes invalid

**✅ Result**: Secure temporary access created

### Step 6: Create Virtual Directory

1. Go back to **"images"** container
2. Click **"Upload"**
3. **Upload to folder**: Type `photos/vacation/`
4. Select another image
5. Click **"Upload"**

**What happened:**
- Created virtual directory structure: `images/photos/vacation/`
- Blob storage is flat, but simulates folders

**✅ Result**: Virtual directory created

### Step 7: Enable Public Access (Optional)

**Warning:** Only for lab/demo purposes!

1. Go to **"Storage accounts"** → **"mystoragelab123"**
2. Click **"Configuration"** (under Settings)
3. **Allow Blob public access**: `Enabled`
4. Click **"Save"**

5. Go to **"Containers"** → **"images"**
6. Click **"Change access level"**
7. Select **"Blob (anonymous read access for blobs only)"**
8. Click **"OK"**

9. Now try opening blob URL in browser - should work without SAS token!

### Step 8: Test, Check, and Confirm

**Test 1: Verify Container Exists**

1. Go to **"Containers"**
2. You should see **"images"** container listed
3. Click on it to view contents

**Expected Result:**
```
✅ Container: images
✅ Public access level: Blob (or Private)
✅ Files visible in list
```

**Test 2: Verify File Upload**

1. In **"images"** container, you should see your uploaded files
2. Check file properties:
   - **Name**: `test-image.jpg`
   - **Size**: Actual file size
   - **Last modified**: Recent timestamp
   - **Access tier**: Cool (if you changed it)

**Expected Result:**
```
✅ File uploaded successfully
✅ File size matches original
✅ Access tier shows correctly
```

**Test 3: Test SAS Token Access**

1. Generate new SAS token (as in Step 5)
2. Copy the **Blob SAS URL**
3. Open in **private/incognito browser window**
4. Image should display

**Expected Result:**
```
✅ Image displays in browser
✅ URL contains SAS token parameters (?sv=...&sig=...)
✅ Access works without authentication
```

**Test 4: Test SAS Token Expiry**

1. Wait until SAS token expires (or generate one with 1-minute expiry)
2. Try accessing the same URL after expiry
3. Should get error

**Expected Result:**
```xml
<Error>
  <Code>AuthenticationFailed</Code>
  <Message>Server failed to authenticate the request.</Message>
</Error>
```

**✅ This is CORRECT!** Token expired as expected.

**Test 5: Test Public Access (if enabled)**

1. Get blob URL without SAS token: `https://mystoragelab123.blob.core.windows.net/images/test-image.jpg`
2. Open in browser
3. If public access enabled: Image displays
4. If private: Error message

**Expected Result (Public):**
```
✅ Image displays without authentication
✅ No SAS token needed
```

**Expected Result (Private):**
```xml
<Error>
  <Code>PublicAccessNotPermitted</Code>
  <Message>Public access is not permitted on this storage account.</Message>
</Error>
```

**Test 6: Test Virtual Directory Structure**

1. In **"images"** container, navigate to `photos/vacation/`
2. You should see files uploaded to that path
3. Click breadcrumb to navigate back

**Expected Result:**
```
✅ Virtual directory structure visible
✅ Files organized in folders
✅ Navigation works correctly
```

**Test 7: Test Download**

1. Click on any blob
2. Click **"Download"**
3. File should download to your computer
4. Open file to verify it's not corrupted

**Expected Result:**
```
✅ File downloads successfully
✅ File opens correctly
✅ Content matches original
```

**Test 8: Verify Access Tier Change**

1. Click on blob you changed to Cool tier
2. In **"Overview"**, check **"Access tier"**
3. Should show **"Cool"**

**Expected Result:**
```
✅ Access tier: Cool
✅ Change reflected in properties
✅ No data loss during tier change
```

**✅ Result**: Blob Storage fully tested and working!

---

## Lab 3: Blob Lifecycle Management

### What is Lifecycle Management?

Automatically move blobs between tiers or delete them based on rules.

**Example Rules:**
- Move to Cool tier after 30 days
- Move to Archive tier after 90 days
- Delete after 365 days

### Step 1: Create Lifecycle Policy

1. Go to **"Storage accounts"** → **"mystoragelab123"**
2. In left menu, click **"Lifecycle management"** (under Data management)
3. Click **"+ Add rule"**

**Rule Configuration:**

**Details Tab:**
- **Rule name**: `move-to-cool-after-30-days`
- **Rule scope**: `Apply rule to all blobs in your storage account`
- **Blob type**: `Block blobs`
- **Blob subtype**: `Base blobs`
- Click **"Next"**

**Base blobs Tab:**
- **If**: `Base blobs were`
- **More than (days ago)**: `30`
- **Then**: `Move to cool storage`

- Click **"+ Add condition"**
- **If**: `Base blobs were`
- **More than (days ago)**: `90`
- **Then**: `Move to archive storage`

- Click **"+ Add condition"**
- **If**: `Base blobs were`
- **More than (days ago)**: `365`
- **Then**: `Delete the blob`

Click **"Add"**

**✅ Result**: Lifecycle policy created!

**What happens:**
- Day 0-29: Blob stays in Hot tier
- Day 30: Automatically moved to Cool tier
- Day 90: Automatically moved to Archive tier
- Day 365: Automatically deleted

### Step 2: View Lifecycle Policy

1. Go to **"Lifecycle management"**
2. You'll see your rule listed
3. Click on rule to edit or delete

### Step 3: Test, Check, and Confirm

**Test 1: Verify Lifecycle Rule Created**

1. Go to **"Lifecycle management"**
2. You should see rule: **"move-to-cool-after-30-days"**
3. Click on rule name to view details

**Expected Result:**
```
✅ Rule name: move-to-cool-after-30-days
✅ Status: Enabled
✅ Blob type: Block blobs
✅ Conditions: 3 rules configured
```

**Test 2: Verify Rule Conditions**

1. Click **"Edit"** on the rule
2. Check conditions:

**Expected Result:**
```
✅ Condition 1: Move to cool after 30 days
✅ Condition 2: Move to archive after 90 days
✅ Condition 3: Delete after 365 days
```

**Test 3: Simulate Lifecycle (Understanding)**

**Note:** Lifecycle policies run once per day, so you can't test immediately. Here's what will happen:

**Day 0 (Today):**
- Upload file: `test-image.jpg`
- Current tier: **Hot**
- Cost: $0.018 per GB/month

**Day 30:**
- Lifecycle policy runs
- File automatically moved to: **Cool**
- Cost: $0.01 per GB/month (44% savings!)

**Day 90:**
- File automatically moved to: **Archive**
- Cost: $0.002 per GB/month (89% savings!)

**Day 365:**
- File automatically deleted
- Cost: $0 (100% savings!)

**Test 4: Check Rule Scope**

1. In rule details, verify:
   - **Scope**: All blobs in storage account
   - **Filters**: None (applies to all)

**Expected Result:**
```
✅ Applies to all containers
✅ Applies to all blobs
✅ No prefix filter
```

**Test 5: Test with Specific Container (Optional)**

If you want to apply rule to specific container only:

1. Edit rule
2. Change **Rule scope** to: `Limit blobs with filters`
3. **Blob prefix**: `images/`
4. Click **"Update"**

**Expected Result:**
```
✅ Rule now applies only to "images" container
✅ Other containers unaffected
```

**Test 6: Verify Rule is Active**

1. Go to **"Lifecycle management"**
2. Check rule status toggle
3. Should be **Enabled** (blue toggle)

**Expected Result:**
```
✅ Rule status: Enabled
✅ Next run: Within 24 hours
✅ Rule will execute automatically
```

**Test 7: Monitor Lifecycle Actions (After 30+ Days)**

After 30 days, verify the policy worked:

1. Go to **"Containers"** → **"images"**
2. Click on old blob
3. Check **"Access tier"** in properties
4. Should show **"Cool"** (if 30+ days old)

**Expected Result (After 30 Days):**
```
✅ Old blobs moved to Cool tier
✅ Recent blobs still in Hot tier
✅ Automatic tier change logged
```

**Test 8: Cost Impact Verification**

1. Go to **"Cost analysis"** (under Cost Management)
2. Filter by **"Service name"**: `Storage`
3. Compare costs before and after lifecycle policy

**Expected Savings:**
```
Before: $18/month for 1TB Hot storage
After 30 days: $10/month (Cool tier)
After 90 days: $2/month (Archive tier)
Savings: Up to 89%!
```

**✅ Result**: Lifecycle management configured and will execute automatically!

---

## File Storage

### What is Azure File Storage?

**Azure Files** provides fully managed file shares in the cloud accessible via SMB (Server Message Block) protocol.

**Key Features:**
- SMB 2.1, 3.0, 3.1.1 support
- Mount on Windows, Linux, macOS
- Replace or supplement on-premises file servers
- Lift-and-shift legacy applications
- Shared access across multiple VMs

**Use Cases:**
- Replace on-premises file servers
- Shared application settings/configs
- Diagnostic logs and crash dumps
- Development tools and utilities
- Lift-and-shift applications

### SMB vs Blob Storage

| Feature | Azure Files (SMB) | Blob Storage |
|---------|-------------------|--------------|
| Protocol | SMB 2.1/3.0/3.1.1 | REST API |
| Access | File system mount | HTTP/HTTPS |
| Use Case | Legacy apps, shared files | Modern apps, objects |
| Structure | Hierarchical (folders) | Flat (virtual folders) |

---

## Lab 4: Azure File Storage - Create SMB File Share

### Step 1: Create File Share

1. Go to **"Storage accounts"** → **"mystoragelab123"**
2. In left menu, click **"File shares"** (under Data storage)
3. Click **"+ File share"**

**File share configuration:**
- **Name**: `documents`
- **Tier**: `Transaction optimized` (best for general purpose)
  - Options: Transaction optimized, Hot, Cool
- **Quota**: `5 GiB` (max size)
- Click **"Create"**

**⏱️ Wait**: Few seconds

**✅ Result**: File share created!

### Step 2: Upload Files to File Share

1. Click on **"documents"** file share
2. Click **"+ Add directory"**
   - **Name**: `reports`
   - Click **"OK"**

3. Click **"Upload"**
   - **Files**: Select a text file (e.g., `test-document.txt`)
   - Click **"Upload"**

4. Click on **"reports"** directory
5. Click **"Upload"**
   - Upload another file inside the directory
   - Click **"Upload"**

**✅ Result**: Files uploaded to file share

### Step 3: Mount File Share on Windows

**Get Connection String:**

1. Go to **"documents"** file share
2. Click **"Connect"** (top menu)
3. Select **"Windows"**
4. Copy the PowerShell script shown

**Example script:**
```powershell
$connectTestResult = Test-NetConnection -ComputerName mystoragelab123.file.core.windows.net -Port 445
if ($connectTestResult.TcpTestSucceeded) {
    cmd.exe /C "cmdkey /add:`"mystoragelab123.file.core.windows.net`" /user:`"Azure\mystoragelab123`" /pass:`"<storage-account-key>`""
    New-PSDrive -Name Z -PSProvider FileSystem -Root "\\mystoragelab123.file.core.windows.net\documents" -Persist
} else {
    Write-Error -Message "Unable to reach the Azure storage account via port 445."
}
```

**On Windows PC:**
1. Open **PowerShell as Administrator**
2. Paste and run the script
3. File share mounted as **Z:** drive
4. Open **File Explorer** → **Z:** drive
5. You can now access files like a local drive!

**✅ Result**: File share mounted on Windows


### Step 4: Mount File Share on Linux

**Get Connection String:**

1. Go to **"documents"** file share
2. Click **"Connect"**
3. Select **"Linux"**
4. Copy the bash script shown

**Example script:**
```bash
sudo mkdir /mnt/documents
if [ ! -d "/etc/smbcredentials" ]; then
    sudo mkdir /etc/smbcredentials
fi
if [ ! -f "/etc/smbcredentials/mystoragelab123.cred" ]; then
    sudo bash -c 'echo "username=mystoragelab123" >> /etc/smbcredentials/mystoragelab123.cred'
    sudo bash -c 'echo "password=<storage-account-key>" >> /etc/smbcredentials/mystoragelab123.cred'
fi
sudo chmod 600 /etc/smbcredentials/mystoragelab123.cred

sudo bash -c 'echo "//mystoragelab123.file.core.windows.net/documents /mnt/documents cifs nofail,credentials=/etc/smbcredentials/mystoragelab123.cred,dir_mode=0777,file_mode=0777,serverino,nosharesock,actimeo=30" >> /etc/fstab'
sudo mount -t cifs //mystoragelab123.file.core.windows.net/documents /mnt/documents -o credentials=/etc/smbcredentials/mystoragelab123.cred,dir_mode=0777,file_mode=0777,serverino,nosharesock,actimeo=30
```

**On Linux VM:**
1. SSH to your Linux VM
2. Install cifs-utils: `sudo apt-get install cifs-utils` (Ubuntu/Debian)
3. Paste and run the script
4. File share mounted at `/mnt/documents`
5. Access files: `ls /mnt/documents`

**✅ Result**: File share mounted on Linux

### Step 5: Create Snapshot (Backup)

**Snapshots** = Point-in-time read-only copies of file share

1. Go to **"documents"** file share
2. Click **"Snapshots"** (top menu)
3. Click **"+ Add snapshot"**
4. Click **"OK"**

**⏱️ Wait**: Few seconds

**✅ Result**: Snapshot created!

**To restore from snapshot:**
1. Click on the snapshot
2. Browse to file you want to restore
3. Click **"Restore"**
4. Choose **"Overwrite original file"** or **"Restore to alternate location"**

### Step 6: Test, Check, and Confirm

**Test 1: Verify File Share Created**

1. Go to **"File shares"**
2. You should see **"documents"** listed
3. Click on it

**Expected Result:**
```
✅ File share: documents
✅ Tier: Transaction optimized
✅ Quota: 5 GiB
✅ Used space: Shows actual usage
```

**Test 2: Verify Files Uploaded**

1. In **"documents"** file share, you should see:
   - `test-document.txt` (root level)
   - `reports/` directory
   - Files inside `reports/` directory

**Expected Result:**
```
✅ Files visible in file share
✅ Directory structure preserved
✅ File sizes correct
```

**Test 3: Test File Download**

1. Click on `test-document.txt`
2. Click **"Download"**
3. Open downloaded file
4. Verify content is correct

**Expected Result:**
```
✅ File downloads successfully
✅ Content matches original
✅ No corruption
```

**Test 4: Test Windows Mount (If You Have Windows)**

1. After running PowerShell script, open **File Explorer**
2. You should see **Z:** drive (or your chosen letter)
3. Navigate to Z:
4. You should see all files and folders

**Expected Result:**
```
✅ Z: drive appears in File Explorer
✅ Files accessible like local drive
✅ Can create/edit/delete files
✅ Changes sync to Azure immediately
```

**Test on Windows:**
```powershell
# Check if drive is mounted
Get-PSDrive -Name Z

# List files
dir Z:

# Create test file
echo "Test from Windows" > Z:\windows-test.txt

# Verify in Azure Portal
# Go to Portal → File shares → documents
# You should see windows-test.txt
```

**Expected Output:**
```
Name           Used (GB)     Free (GB) Provider      Root
----           ---------     --------- --------      ----
Z                   0.01          4.99 FileSystem    \\mystoragelab123.file.core.windows.net\documents

✅ Drive mounted successfully
```

**Test 5: Test Linux Mount (If You Have Linux VM)**

1. After running bash script, check mount:

```bash
# Verify mount
df -h | grep documents

# List files
ls -la /mnt/documents

# Create test file
echo "Test from Linux" | sudo tee /mnt/documents/linux-test.txt

# Read file
cat /mnt/documents/linux-test.txt
```

**Expected Output:**
```
//mystoragelab123.file.core.windows.net/documents  5.0G   64K  5.0G   1% /mnt/documents

✅ File share mounted at /mnt/documents
✅ Files accessible
✅ Read/write operations work
```

**Test 6: Verify Cross-Platform Sync**

1. Create file on Windows: `Z:\cross-platform-test.txt`
2. On Linux, check: `ls /mnt/documents/cross-platform-test.txt`
3. File should appear immediately!

**Expected Result:**
```
✅ File created on Windows visible on Linux
✅ File created on Linux visible on Windows
✅ Real-time synchronization works
✅ File created via Portal visible on both
```

**Test 7: Test Snapshot Functionality**

1. Go to **"Snapshots"** in file share
2. You should see snapshot with timestamp
3. Click on snapshot
4. Browse files (read-only view)

**Expected Result:**
```
✅ Snapshot created with timestamp
✅ Snapshot shows point-in-time copy
✅ Original files still editable
✅ Snapshot files read-only
```

**Test 8: Test Snapshot Restore**

1. Delete a file from file share: `test-document.txt`
2. Verify it's gone from main file share
3. Go to **"Snapshots"**
4. Click on snapshot
5. Find `test-document.txt`
6. Click **"Restore"**
7. Choose **"Overwrite original file"**
8. Go back to main file share
9. File should be restored!

**Expected Result:**
```
✅ File deleted from main share
✅ File still exists in snapshot
✅ Restore operation successful
✅ File reappears in main share
```

**Test 9: Test Connection String**

1. Go to **"Connect"** in file share
2. Copy connection string
3. Verify it contains:
   - Storage account name
   - File share name
   - Access key (hidden)

**Expected Format:**
```
\\mystoragelab123.file.core.windows.net\documents
```

**Test 10: Test Performance**

1. Copy a large file (100MB+) to mounted drive
2. Monitor upload speed
3. Should be fast (depends on internet connection)

**Expected Result:**
```
✅ Upload speed: 10-100 MB/s (varies)
✅ No errors during transfer
✅ File integrity maintained
```

**✅ Result**: File Storage fully tested and working across platforms!

---

## Queue Storage

### What is Azure Queue Storage?

**Azure Queue Storage** provides cloud messaging between application components.

**Key Features:**
- Store millions of messages
- Each message up to 64 KB
- Accessed via HTTP/HTTPS
- Asynchronous processing
- Decoupling application components

**Use Cases:**
- Order processing systems
- Background job queues
- Task scheduling
- Microservices communication
- Load leveling

### Queue Concepts

```
Queue: orders
    ├─ Message 1: {"orderId": "001", "amount": 100}
    ├─ Message 2: {"orderId": "002", "amount": 200}
    └─ Message 3: {"orderId": "003", "amount": 150}

Producer → Queue → Consumer
```

**Message Lifecycle:**
1. Producer adds message to queue
2. Consumer retrieves message (becomes invisible)
3. Consumer processes message
4. Consumer deletes message
5. If not deleted, message becomes visible again (after timeout)

---

## Lab 5: Queue Storage - Message Processing

### Step 1: Create Queue

1. Go to **"Storage accounts"** → **"mystoragelab123"**
2. In left menu, click **"Queues"** (under Data storage)
3. Click **"+ Queue"**

**Queue configuration:**
- **Name**: `orders`
- Click **"OK"**

**⏱️ Wait**: Few seconds

**✅ Result**: Queue created!


### Step 2: Add Messages to Queue

1. Click on **"orders"** queue
2. Click **"+ Add message"**

**Message 1:**
- **Message text**: `{"orderId": "001", "product": "Laptop", "amount": 1200}`
- **Expires in**: `7 days` (default)
- **Encode message body in Base64**: Leave unchecked
- Click **"OK"**

3. Add more messages:

**Message 2:**
```json
{"orderId": "002", "product": "Mouse", "amount": 25}
```

**Message 3:**
```json
{"orderId": "003", "product": "Keyboard", "amount": 75}
```

**✅ Result**: 3 messages added to queue

### Step 3: View Messages

1. Click **"Refresh"** to see message count
2. You'll see **"Approximate messages count: 3"**

**Note:** You can't directly view message content in Portal (security feature)

**✅ Result**: Messages in queue

### Step 4: Dequeue Message (Simulate Consumer)

**Using Azure Storage Explorer (Recommended):**

1. Download **Azure Storage Explorer** (free tool)
2. Connect to your storage account
3. Navigate to **Queues** → **orders**
4. Right-click → **Dequeue Message**
5. View message content
6. Click **"Delete"** to remove from queue

**Using Portal (Limited):**

1. In Portal, you can only see message count
2. To process messages, use:
   - Azure Functions
   - Logic Apps
   - Custom application code

**✅ Result**: Message dequeued

### Step 5: Test Message Visibility Timeout

**What is Visibility Timeout?**
- When message is retrieved, it becomes invisible to other consumers
- Default: 30 seconds
- If not deleted within timeout, message becomes visible again
- Prevents duplicate processing

**Test:**
1. Add a new message to queue
2. Dequeue it (don't delete)
3. Wait 30 seconds
4. Refresh - message appears again!

### Step 6: Test, Check, and Confirm

**Test 1: Verify Queue Created**

1. Go to **"Queues"**
2. You should see **"orders"** queue listed
3. Click on it

**Expected Result:**
```
✅ Queue name: orders
✅ Status: Active
✅ Approximate messages count: 3 (or your count)
```

**Test 2: Verify Messages Added**

1. In queue overview, check **"Approximate messages count"**
2. Should show number of messages you added
3. Click **"Refresh"** to update count

**Expected Result:**
```
✅ Message count: 3
✅ Count updates on refresh
✅ No errors in message addition
```

**Test 3: Test Message Format**

Messages should be in JSON format for easy processing:

**Good Format:**
```json
{"orderId": "001", "product": "Laptop", "amount": 1200}
```

**Bad Format:**
```
Order 001 Laptop 1200
```

**Why JSON?**
- Easy to parse in code
- Structured data
- Standard format

**Test 4: Test Queue Operations with Azure Storage Explorer**

**Download Azure Storage Explorer** (if not already):
- https://azure.microsoft.com/features/storage-explorer/

**Connect and Test:**

1. Open Azure Storage Explorer
2. Connect to your storage account
3. Navigate to **Queues** → **orders**
4. Right-click → **View Queue**

**Expected View:**
```
Message ID: abc123...
Insertion Time: 2026-03-13 10:30:00
Expiration Time: 2026-03-20 10:30:00
Dequeue Count: 0
Message Text: {"orderId": "001", "product": "Laptop", "amount": 1200}
```

**Test 5: Test Dequeue Message**

1. In Storage Explorer, right-click on message
2. Click **"Dequeue Message"**
3. Message becomes invisible (visibility timeout starts)
4. You can view message content
5. Click **"Delete"** to remove from queue

**Expected Result:**
```
✅ Message retrieved successfully
✅ Message content displayed
✅ Message invisible to other consumers
✅ Delete removes message permanently
```

**Test 6: Test Visibility Timeout**

1. Dequeue a message (don't delete)
2. Wait 30 seconds
3. Refresh queue view
4. Message reappears!

**Expected Result:**
```
✅ Message invisible for 30 seconds
✅ Message reappears after timeout
✅ Dequeue count incremented (was 0, now 1)
```

**Test 7: Test Message Expiry**

1. Add message with short expiry (1 hour)
2. Wait 1 hour
3. Message automatically deleted

**Expected Result:**
```
✅ Message expires after set time
✅ Automatic cleanup
✅ No manual deletion needed
```

**Test 8: Test Queue with Code (Python Example)**

```python
from azure.storage.queue import QueueClient

connection_string = "DefaultEndpointsProtocol=https;AccountName=mystoragelab123;AccountKey=<key>;EndpointSuffix=core.windows.net"
queue_client = QueueClient.from_connection_string(connection_string, "orders")

# Send message
queue_client.send_message('{"orderId": "004", "product": "Monitor", "amount": 300}')

# Receive message
messages = queue_client.receive_messages()
for message in messages:
    print(f"Message: {message.content}")
    # Process message
    queue_client.delete_message(message)
```

**Expected Output:**
```
Message: {"orderId": "004", "product": "Monitor", "amount": 300}
✅ Message sent successfully
✅ Message received successfully
✅ Message deleted after processing
```

**Test 9: Test Queue Metrics**

1. Go to **"Insights"** (under Monitoring)
2. View queue metrics:
   - Total requests
   - Success rate
   - Latency

**Expected Result:**
```
✅ Metrics available
✅ Success rate: 100%
✅ Low latency (<100ms)
```

**Test 10: Test Multiple Consumers (Concept)**

**Scenario:** Two applications reading from same queue

**Consumer 1:**
- Dequeues message 1 (becomes invisible)
- Processes for 20 seconds
- Deletes message

**Consumer 2:**
- Tries to dequeue at same time
- Gets message 2 (message 1 is invisible)
- No duplicate processing!

**Expected Result:**
```
✅ Messages distributed across consumers
✅ No duplicate processing
✅ Visibility timeout prevents conflicts
```

**Test 11: Test Poison Message Handling**

**Poison Message** = Message that fails processing repeatedly

1. Dequeue message (don't delete)
2. Wait for visibility timeout
3. Dequeue again (don't delete)
4. Repeat 5 times
5. Check **Dequeue Count** in Storage Explorer

**Expected Result:**
```
✅ Dequeue count: 5
✅ Message still in queue
✅ Can implement logic: if dequeue_count > 5, move to dead-letter queue
```

**Test 12: Test Queue URL Access**

Queue endpoint: `https://mystoragelab123.queue.core.windows.net/orders`

Try accessing in browser:

**Expected Result:**
```xml
<Error>
  <Code>AuthenticationFailed</Code>
  <Message>Server failed to authenticate the request.</Message>
</Error>
```

**✅ This is CORRECT!** Queues require authentication (unlike public blobs).

**✅ Result**: Queue Storage fully tested and working!

---

## Table Storage

### What is Azure Table Storage?

**Azure Table Storage** is a NoSQL key-value store for structured data.

**Key Features:**
- Schema-less design
- Billions of entities (rows)
- Terabytes of data
- Fast queries
- Low cost
- OData and LINQ queries

**Use Cases:**
- IoT telemetry data
- User profiles
- Device metadata
- Application logs
- Session state

### Table Concepts

```
Table: customers
    ├─ PartitionKey | RowKey | Name      | Email           | Age
    ├─ USA         | 001    | John Doe  | john@email.com  | 30
    ├─ USA         | 002    | Jane Doe  | jane@email.com  | 25
    └─ UK          | 001    | Bob Smith | bob@email.com   | 35
```

**Key Components:**
- **PartitionKey**: Logical grouping (for scalability)
- **RowKey**: Unique identifier within partition
- **Properties**: Custom columns (up to 252 properties)

**Best Practice:** Choose PartitionKey wisely for even distribution

---

## Lab 6: Table Storage - NoSQL Data

### Step 1: Create Table

1. Go to **"Storage accounts"** → **"mystoragelab123"**
2. In left menu, click **"Tables"** (under Data storage)
3. Click **"+ Table"**

**Table configuration:**
- **Table name**: `customers`
- Click **"OK"**

**⏱️ Wait**: Few seconds

**✅ Result**: Table created!


### Step 2: Add Entities (Rows)

**Note:** Azure Portal doesn't provide UI for adding table entities. Use one of these tools:

**Option 1: Azure Storage Explorer (Recommended)**

1. Download **Azure Storage Explorer**
2. Connect to your storage account
3. Navigate to **Tables** → **customers**
4. Click **"Add"**

**Entity 1:**
- **PartitionKey**: `USA`
- **RowKey**: `001`
- **Name** (String): `John Doe`
- **Email** (String): `john@email.com`
- **Age** (Int32): `30`
- Click **"Insert"**

**Entity 2:**
- **PartitionKey**: `USA`
- **RowKey**: `002`
- **Name**: `Jane Doe`
- **Email**: `jane@email.com`
- **Age**: `25`

**Entity 3:**
- **PartitionKey**: `UK`
- **RowKey**: `001`
- **Name**: `Bob Smith`
- **Email**: `bob@email.com`
- **Age**: `35`

**Option 2: Using Code (Python Example)**

```python
from azure.data.tables import TableServiceClient

connection_string = "DefaultEndpointsProtocol=https;AccountName=mystoragelab123;AccountKey=<key>;EndpointSuffix=core.windows.net"
table_service = TableServiceClient.from_connection_string(connection_string)
table_client = table_service.get_table_client("customers")

entity = {
    "PartitionKey": "USA",
    "RowKey": "001",
    "Name": "John Doe",
    "Email": "john@email.com",
    "Age": 30
}
table_client.create_entity(entity)
```

**✅ Result**: Entities added to table

### Step 3: Query Table

**Using Azure Storage Explorer:**

1. Open **customers** table
2. View all entities
3. Filter by PartitionKey: `PartitionKey eq 'USA'`
4. Sort by Age

**Query Examples:**
- All USA customers: `PartitionKey eq 'USA'`
- Specific customer: `PartitionKey eq 'USA' and RowKey eq '001'`
- Age filter: `Age gt 25` (greater than 25)

**✅ Result**: Table queried successfully

### Step 4: Update Entity

1. Select an entity
2. Click **"Edit"**
3. Change **Age** to `31`
4. Click **"Update"**

**✅ Result**: Entity updated

### Step 5: Delete Entity

1. Select an entity
2. Click **"Delete"**
3. Confirm deletion

### Step 6: Test, Check, and Confirm

**Test 1: Verify Table Created**

1. Go to **"Tables"**
2. You should see **"customers"** table listed
3. Click on it

**Expected Result:**
```
✅ Table name: customers
✅ Status: Active
✅ Ready for entities
```

**Test 2: Verify Entities Added (Using Storage Explorer)**

1. Open **Azure Storage Explorer**
2. Navigate to **Tables** → **customers**
3. You should see all entities

**Expected Result:**
```
PartitionKey | RowKey | Name       | Email           | Age
-------------|--------|------------|-----------------|----
USA          | 001    | John Doe   | john@email.com  | 30
USA          | 002    | Jane Doe   | jane@email.com  | 25
UK           | 001    | Bob Smith  | bob@email.com   | 35

✅ 3 entities visible
✅ All properties displayed
✅ Data types correct
```

**Test 3: Test Query by PartitionKey**

1. In Storage Explorer, click **"Query"**
2. Enter filter: `PartitionKey eq 'USA'`
3. Click **"Execute"**

**Expected Result:**
```
✅ Returns 2 entities (John and Jane)
✅ Bob (UK) not included
✅ Query executes fast (<100ms)
```

**Test 4: Test Query by RowKey**

Query: `PartitionKey eq 'USA' and RowKey eq '001'`

**Expected Result:**
```
✅ Returns 1 entity (John Doe)
✅ Exact match
✅ Fastest query type (uses both keys)
```

**Test 5: Test Query by Property**

Query: `Age gt 25`

**Expected Result:**
```
✅ Returns 2 entities (John: 30, Bob: 35)
✅ Jane (25) not included
✅ Property filter works
```

**Test 6: Test Entity Update**

1. Select John Doe entity
2. Change Age from 30 to 31
3. Click **"Update"**
4. Refresh table
5. Verify change

**Expected Result:**
```
Before: Age = 30
After:  Age = 31
✅ Update successful
✅ Change persisted
✅ Other properties unchanged
```

**Test 7: Test Entity Delete**

1. Select Jane Doe entity
2. Click **"Delete"**
3. Confirm
4. Refresh table

**Expected Result:**
```
Before: 3 entities
After:  2 entities (John and Bob remain)
✅ Delete successful
✅ Entity permanently removed
```

**Test 8: Test Add New Property (Schema-less)**

1. Add new entity with additional property:
   - PartitionKey: `USA`
   - RowKey: `003`
   - Name: `Alice Johnson`
   - Email: `alice@email.com`
   - Age: `28`
   - **City**: `New York` (new property!)

**Expected Result:**
```
✅ Entity added with new property
✅ Other entities don't need City property
✅ Schema-less design works
✅ No table alteration needed
```

**Test 9: Test Different Data Types**

Add entity with various types:
- String: `Name`
- Int32: `Age`
- Boolean: `IsActive` = true
- DateTime: `CreatedDate` = 2026-03-13
- Double: `Balance` = 1234.56

**Expected Result:**
```
✅ All data types supported
✅ Values stored correctly
✅ Type information preserved
```

**Test 10: Test Partition Distribution**

Check entity distribution:
- USA partition: 2-3 entities
- UK partition: 1 entity

**Expected Result:**
```
✅ Entities distributed across partitions
✅ Each partition can scale independently
✅ Good for performance
```

**Test 11: Test with Code (Python Example)**

```python
from azure.data.tables import TableServiceClient

connection_string = "DefaultEndpointsProtocol=https;AccountName=mystoragelab123;AccountKey=<key>;EndpointSuffix=core.windows.net"
table_service = TableServiceClient.from_connection_string(connection_string)
table_client = table_service.get_table_client("customers")

# Query entities
entities = table_client.query_entities("PartitionKey eq 'USA'")
for entity in entities:
    print(f"{entity['Name']}: {entity['Age']}")
```

**Expected Output:**
```
John Doe: 31
Alice Johnson: 28
✅ Query successful
✅ Data retrieved correctly
```

**Test 12: Test Performance**

1. Add 100 entities to table
2. Query by PartitionKey and RowKey
3. Measure response time

**Expected Result:**
```
✅ Insert: <10ms per entity
✅ Query (with both keys): <10ms
✅ Query (PartitionKey only): <50ms
✅ Query (property filter): <200ms
```

**Test 13: Test Table URL Access**

Table endpoint: `https://mystoragelab123.table.core.windows.net/customers`

Try accessing in browser:

**Expected Result:**
```xml
<Error>
  <Code>AuthenticationFailed</Code>
  <Message>Server failed to authenticate the request.</Message>
</Error>
```

**✅ This is CORRECT!** Tables require authentication.

**Test 14: Test Batch Operations (Concept)**

Table Storage supports batch operations:
- Insert multiple entities in one request
- All in same partition
- Up to 100 entities per batch
- Atomic operation (all or nothing)

**Expected Result:**
```
✅ Batch insert faster than individual
✅ Reduces transaction costs
✅ Maintains consistency
```

**✅ Result**: Table Storage fully tested and working!

---

## Disk Storage

### What is Azure Disk Storage?

**Azure Managed Disks** are block-level storage volumes managed by Azure for use with VMs.

**Disk Types:**

| Type | Performance | Use Case | IOPS | Throughput |
|------|-------------|----------|------|------------|
| Ultra Disk | Highest | Mission-critical | Up to 160,000 | Up to 4,000 MB/s |
| Premium SSD v2 | High | Production | Up to 80,000 | Up to 1,200 MB/s |
| Premium SSD | High | Production | Up to 20,000 | Up to 900 MB/s |
| Standard SSD | Moderate | Web servers | Up to 6,000 | Up to 750 MB/s |
| Standard HDD | Low | Backup, dev/test | Up to 2,000 | Up to 500 MB/s |

**Disk Roles:**
- **OS Disk**: Operating system (C: drive on Windows, / on Linux)
- **Data Disk**: Application data (D:, E:, etc.)
- **Temporary Disk**: Temporary storage (lost on VM stop/restart)

---

## Lab 7: Disk Storage - Attach Data Disk to VM

### Prerequisites

You need an existing VM. If you don't have one:

1. Create a simple VM (Ubuntu or Windows)
2. Use Standard B1s size (cheapest)
3. We'll attach a data disk to it

### Step 1: Create Managed Disk

1. Search for **"Disks"** in Azure Portal
2. Click **"+ Create"**

**Basics Tab:**
- **Subscription**: Your subscription
- **Resource group**: `rg-storage-lab`
- **Disk name**: `data-disk-01`
- **Region**: Same as your VM
- **Availability zone**: `None`
- **Source type**: `None (empty disk)`
- **Size**: Click **"Change size"**
  - Select **"Standard SSD"**
  - Size: **32 GiB** (E4)
  - Click **"OK"**

Click **"Review + create"**

Click **"Create"**

**⏱️ Wait**: 1-2 minutes

**✅ Result**: Managed disk created!


### Step 2: Attach Disk to VM

1. Go to **"Virtual machines"**
2. Select your VM
3. In left menu, click **"Disks"** (under Settings)
4. Click **"+ Create and attach a new disk"** or **"Attach existing disks"**

**If attaching existing disk:**
- **Disk name**: Select **"data-disk-01"**
- **LUN** (Logical Unit Number): `0` (auto-assigned)
- **Host caching**: `Read-only` (for data disks)

5. Click **"Save"**

**⏱️ Wait**: 1-2 minutes

**✅ Result**: Disk attached to VM!

### Step 3: Initialize Disk on Windows VM

**Connect to Windows VM:**

1. RDP to your Windows VM
2. Open **Disk Management** (diskmgmt.msc)
3. You'll see **"Initialize Disk"** dialog
4. Select **"GPT"** (GUID Partition Table)
5. Click **"OK"**

**Create Volume:**

1. Right-click on unallocated space
2. Select **"New Simple Volume"**
3. Click **"Next"** through wizard
4. **Drive letter**: `F:`
5. **File system**: `NTFS`
6. **Volume label**: `DataDisk`
7. Click **"Finish"**

**Test:**

1. Open **File Explorer**
2. You'll see **F: drive**
3. Create a test file: `F:\test.txt`

**✅ Result**: Disk initialized and ready on Windows!

### Step 4: Initialize Disk on Linux VM

**Connect to Linux VM:**

1. SSH to your Linux VM

**List disks:**
```bash
lsblk
```

**Output:**
```
NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINT
sda      8:0    0   30G  0 disk 
├─sda1   8:1    0 29.9G  0 part /
sdb      8:16   0   32G  0 disk 
```

**sdb** is your new data disk (32 GiB)

**Create partition:**
```bash
sudo fdisk /dev/sdb
```

Commands:
- Type `n` (new partition)
- Press `Enter` (default partition number)
- Press `Enter` (default first sector)
- Press `Enter` (default last sector)
- Type `w` (write changes)

**Format partition:**
```bash
sudo mkfs.ext4 /dev/sdb1
```

**Create mount point:**
```bash
sudo mkdir /mnt/data
```

**Mount disk:**
```bash
sudo mount /dev/sdb1 /mnt/data
```

**Make permanent (auto-mount on boot):**
```bash
# Get UUID
sudo blkid /dev/sdb1

# Edit fstab
sudo nano /etc/fstab

# Add line (replace UUID with your actual UUID):
UUID=your-uuid-here /mnt/data ext4 defaults 0 2

# Save and exit (Ctrl+X, Y, Enter)
```

**Test:**
```bash
df -h
sudo touch /mnt/data/test.txt
ls /mnt/data
```

**✅ Result**: Disk initialized and mounted on Linux!

### Step 5: Detach Disk

**When you need to detach:**

1. Go to VM → **"Disks"**
2. Find the data disk
3. Click **"X"** (Detach)
4. Click **"Save"**

**⏱️ Wait**: 1-2 minutes

**Note:** Detaching doesn't delete the disk. You can attach it to another VM.

### Step 7: Test, Check, and Confirm

**Test 1: Verify Disk Created**

1. Go to **"Disks"**
2. You should see **"data-disk-01"** listed
3. Click on it

**Expected Result:**
```
✅ Disk name: data-disk-01
✅ Status: Unattached (before attaching to VM)
✅ Size: 32 GiB
✅ Disk type: Standard SSD
✅ Disk state: Available
```

**Test 2: Verify Disk Attached to VM**

1. Go to VM → **"Disks"**
2. Under **"Data disks"**, you should see:
   - **Name**: data-disk-01
   - **LUN**: 0
   - **Host caching**: Read-only
   - **Size**: 32 GiB

**Expected Result:**
```
✅ Disk appears in VM's disk list
✅ LUN assigned (0, 1, 2, etc.)
✅ Status: Attached
```

**Test 3: Verify Disk Visible in Windows**

**On Windows VM:**

1. Open **Disk Management** (diskmgmt.msc)
2. You should see new disk (Disk 1 or 2)
3. Status: **Online**
4. Partition: **Healthy**

**Expected Result:**
```
Disk 1
  Online
  32 GB
  F: (DataDisk) NTFS
  Healthy (Primary Partition)

✅ Disk initialized
✅ Partition created
✅ Drive letter assigned
✅ File system: NTFS
```

**Test 4: Test Read/Write on Windows**

```powershell
# Create test file
echo "Test data from Windows" > F:\test.txt

# Read file
Get-Content F:\test.txt

# Create directory
mkdir F:\TestFolder

# List contents
dir F:\
```

**Expected Output:**
```
Test data from Windows

✅ File created successfully
✅ Directory created successfully
✅ Read/write operations work
```

**Test 5: Test Disk Performance on Windows**

```powershell
# Create 100MB test file
fsutil file createnew F:\testfile.dat 104857600

# Check file
dir F:\testfile.dat
```

**Expected Result:**
```
✅ File created: 100 MB
✅ Write speed: 60-500 MB/s (Standard SSD)
✅ No errors
```

**Test 6: Verify Disk Visible in Linux**

**On Linux VM:**

```bash
# List all disks
lsblk

# Check disk details
sudo fdisk -l /dev/sdb
```

**Expected Output:**
```
NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINT
sda      8:0    0   30G  0 disk 
├─sda1   8:1    0 29.9G  0 part /
sdb      8:16   0   32G  0 disk 
└─sdb1   8:17   0   32G  0 part /mnt/data

✅ Disk visible as /dev/sdb
✅ Partition created: /dev/sdb1
✅ Mounted at /mnt/data
```

**Test 7: Test Read/Write on Linux**

```bash
# Create test file
echo "Test data from Linux" | sudo tee /mnt/data/test.txt

# Read file
cat /mnt/data/test.txt

# Create directory
sudo mkdir /mnt/data/TestFolder

# List contents
ls -la /mnt/data/
```

**Expected Output:**
```
Test data from Linux

drwxr-xr-x 3 root root 4096 Mar 13 10:30 .
drwxr-xr-x 3 root root 4096 Mar 13 10:00 ..
drwxr-xr-x 2 root root 4096 Mar 13 10:30 TestFolder
-rw-r--r-- 1 root root   23 Mar 13 10:30 test.txt

✅ File created successfully
✅ Directory created successfully
✅ Permissions correct
```

**Test 8: Test Disk Persistence**

**On Windows:**
1. Create file: `F:\persistence-test.txt`
2. Restart VM
3. After restart, check if file still exists

**On Linux:**
1. Create file: `/mnt/data/persistence-test.txt`
2. Reboot VM: `sudo reboot`
3. After reboot, check: `ls /mnt/data/`

**Expected Result:**
```
✅ File persists after restart
✅ Disk auto-mounts on boot (if configured)
✅ No data loss
```

**Test 9: Test Disk Auto-Mount on Linux**

```bash
# Check fstab entry
cat /etc/fstab | grep data

# Verify mount on boot
sudo mount -a

# Check if mounted
df -h | grep data
```

**Expected Output:**
```
UUID=abc123... /mnt/data ext4 defaults 0 2

/dev/sdb1        32G  45M   30G   1% /mnt/data

✅ fstab entry exists
✅ Auto-mount configured
✅ Disk mounts on boot
```

**Test 10: Test Disk Performance**

**On Linux:**
```bash
# Write test
sudo dd if=/dev/zero of=/mnt/data/testfile bs=1M count=1024

# Read test
sudo dd if=/mnt/data/testfile of=/dev/null bs=1M
```

**Expected Output:**
```
1024+0 records in
1024+0 records out
1073741824 bytes (1.1 GB) copied, 15.2 s, 70.6 MB/s

✅ Write speed: 60-120 MB/s (Standard SSD)
✅ Read speed: 60-120 MB/s
✅ Performance as expected
```

**Test 11: Test Disk Detach**

1. Stop VM (required for safe detach)
2. Go to VM → **"Disks"**
3. Detach data disk
4. Go to **"Disks"** in Azure
5. Check disk status

**Expected Result:**
```
Before: Status = Attached to VM-name
After:  Status = Unattached
✅ Disk detached successfully
✅ Disk still exists (not deleted)
✅ Can attach to another VM
```

**Test 12: Test Disk Reattach to Different VM**

1. Create second VM (or use existing)
2. Go to **"Disks"** → **"data-disk-01"**
3. Click **"Change VM"**
4. Select different VM
5. Click **"Save"**

**Expected Result:**
```
✅ Disk attached to new VM
✅ Data preserved
✅ Files accessible on new VM
```

**Test 13: Test Disk Snapshot**

1. Go to **"Disks"** → **"data-disk-01"**
2. Click **"Create snapshot"**
3. Name: `data-disk-snapshot-01`
4. Click **"Review + create"**
5. Click **"Create"**

**Expected Result:**
```
✅ Snapshot created
✅ Point-in-time copy
✅ Can create new disk from snapshot
✅ Original disk unchanged
```

**Test 14: Test Disk Resize (Expand)**

1. Detach disk from VM
2. Go to **"Disks"** → **"data-disk-01"**
3. Click **"Size + performance"**
4. Change size: 32 GiB → 64 GiB
5. Click **"Save"**
6. Reattach to VM
7. Expand partition in OS

**Expected Result:**
```
Before: 32 GiB
After:  64 GiB
✅ Disk expanded
✅ No data loss
✅ Need to expand partition in OS
```

**Test 15: Verify Disk in Azure Portal**

1. Go to **"Disks"**
2. Click on **"data-disk-01"**
3. Check **"Overview"**:

**Expected Result:**
```
✅ Disk state: Attached (or Unattached)
✅ Owner VM: VM-name
✅ Size: 32 GiB
✅ IOPS: 500 (Standard SSD)
✅ Throughput: 60 MB/s
✅ Encryption: Enabled (default)
```

**✅ Result**: Disk Storage fully tested and working!

---

## Security & Access Control

### Authentication Methods

**1. Storage Account Keys (Shared Key)**
- Full access to storage account
- Two keys (primary and secondary)
- Rotate keys regularly
- **Use with caution!**

**2. Shared Access Signature (SAS)**
- Granular permissions
- Time-limited access
- Can restrict by IP, protocol
- **Recommended for temporary access**

**3. Azure Active Directory (Azure AD)**
- Identity-based access
- Role-based access control (RBAC)
- **Recommended for production**

**4. Anonymous Public Access**
- No authentication required
- Only for public content
- **Use sparingly!**

### RBAC Roles

| Role | Permissions | Use Case |
|------|-------------|----------|
| Storage Blob Data Owner | Full access to blobs | Admins |
| Storage Blob Data Contributor | Read, write, delete blobs | Applications |
| Storage Blob Data Reader | Read blobs only | Read-only access |
| Storage Queue Data Contributor | Read, write, delete messages | Queue processors |
| Storage Table Data Contributor | Read, write, delete entities | Table applications |


### Lab: Configure RBAC Access

**Scenario:** Grant a user read-only access to blob container

1. Go to **"Storage accounts"** → **"mystoragelab123"**
2. Go to **"Containers"** → **"images"**
3. Click **"Access Control (IAM)"** (left menu)
4. Click **"+ Add"** → **"Add role assignment"**

**Role Tab:**
- Select **"Storage Blob Data Reader"**
- Click **"Next"**

**Members Tab:**
- **Assign access to**: `User, group, or service principal`
- Click **"+ Select members"**
- Search for user email
- Click **"Select"**
- Click **"Next"**

**Review + assign Tab:**
- Click **"Review + assign"**

**✅ Result**: User can now read blobs without storage account key!

### Test, Check, and Confirm - RBAC

**Test 1: Verify Role Assignment**

1. Go to **"Containers"** → **"images"**
2. Click **"Access Control (IAM)"**
3. Click **"Role assignments"** tab
4. Search for the user you added

**Expected Result:**
```
✅ User listed under "Storage Blob Data Reader"
✅ Scope: Container (images)
✅ Status: Active
```

**Test 2: Test User Access (As Assigned User)**

1. Login to Azure Portal as the assigned user
2. Navigate to storage account
3. Go to **"Containers"** → **"images"**
4. Try to view blobs

**Expected Result:**
```
✅ User can see container
✅ User can list blobs
✅ User can download blobs
✅ User CANNOT upload/delete (read-only)
```

**Test 3: Test Upload Restriction**

1. As assigned user, try to upload file
2. Should get permission error

**Expected Result:**
```
❌ Error: "This request is not authorized to perform this operation"
✅ Read-only access enforced correctly
```

**Test 4: Test with Azure Storage Explorer**

1. Open Azure Storage Explorer as assigned user
2. Connect using Azure AD authentication
3. Navigate to container
4. Try operations

**Expected Result:**
```
✅ Can browse containers
✅ Can download blobs
❌ Cannot upload blobs
❌ Cannot delete blobs
```

**✅ Result**: RBAC access control working correctly!

### Encryption

**Encryption at Rest:**
- All data automatically encrypted (256-bit AES)
- Microsoft-managed keys (default)
- Customer-managed keys (optional)

**Encryption in Transit:**
- HTTPS/TLS required
- SMB 3.0 encryption for File shares

**Enable Secure Transfer:**

1. Go to **"Storage accounts"** → **"mystoragelab123"**
2. Click **"Configuration"** (under Settings)
3. **Secure transfer required**: `Enabled` ✅
4. Click **"Save"**

**✅ Result**: Only HTTPS connections allowed

### Test, Check, and Confirm - Encryption

**Test 1: Verify Secure Transfer Enabled**

1. Go to **"Configuration"**
2. Check **"Secure transfer required"**: Should be `Enabled`

**Expected Result:**
```
✅ Secure transfer: Enabled
✅ Only HTTPS allowed
✅ HTTP requests rejected
```

**Test 2: Test HTTP Access (Should Fail)**

Try accessing blob with HTTP (not HTTPS):
```
http://mystoragelab123.blob.core.windows.net/images/test.jpg
```

**Expected Result:**
```xml
<Error>
  <Code>HttpsRequired</Code>
  <Message>HTTPS is required to access this storage account.</Message>
</Error>

✅ HTTP blocked correctly
✅ Security enforced
```

**Test 3: Test HTTPS Access (Should Work)**

Try with HTTPS:
```
https://mystoragelab123.blob.core.windows.net/images/test.jpg
```

**Expected Result:**
```
✅ HTTPS works (with proper authentication)
✅ Secure connection established
✅ Data encrypted in transit
```

**Test 4: Verify Encryption at Rest**

1. Go to **"Encryption"** (under Security + networking)
2. Check encryption settings

**Expected Result:**
```
✅ Encryption type: Microsoft-managed keys
✅ Encryption enabled for all services
✅ 256-bit AES encryption
✅ Cannot be disabled
```

**✅ Result**: Encryption properly configured!

### Network Security

**Firewall Rules:**

1. Go to **"Storage accounts"** → **"mystoragelab123"**
2. Click **"Networking"** (under Security + networking)
3. **Public network access**: `Enabled from selected virtual networks and IP addresses`
4. **Firewall:**
   - **Address range**: Add your IP address
   - Click **"+ Add existing virtual network"** (if you have VNets)
5. Click **"Save"**

**Private Endpoints:**

For production, use private endpoints:
- Storage account accessible only from VNet
- No public internet access
- Uses Azure Private Link

**✅ Result**: Network security configured

### Test, Check, and Confirm - Network Security

**Test 1: Verify Firewall Rules**

1. Go to **"Networking"**
2. Check **"Firewalls and virtual networks"** tab
3. Verify settings

**Expected Result:**
```
✅ Public network access: Enabled from selected networks
✅ Your IP address: Listed in allowed IPs
✅ Virtual networks: Listed (if configured)
```

**Test 2: Test Access from Allowed IP**

1. From your computer (allowed IP), access storage:
```
https://mystoragelab123.blob.core.windows.net/images/test.jpg
```

**Expected Result:**
```
✅ Access granted
✅ Blob accessible
✅ No firewall block
```

**Test 3: Test Access from Blocked IP**

1. Use VPN or different network (not in allowed list)
2. Try accessing same URL

**Expected Result:**
```xml
<Error>
  <Code>AuthorizationFailure</Code>
  <Message>This request is not authorized to perform this operation.</Message>
</Error>

✅ Access blocked correctly
✅ Firewall working
```

**Test 4: Test Exception for Azure Services**

1. In **"Networking"**, check:
   - **Allow Azure services on the trusted services list to access this storage account**: `Enabled`

**Expected Result:**
```
✅ Azure services can access
✅ Other Azure resources (VMs, Functions) can connect
✅ External access still blocked
```

**Test 5: Verify Network Rules Applied**

1. Go to **"Networking"**
2. Check **"Resource instances"** tab
3. View connected resources

**Expected Result:**
```
✅ Rules applied successfully
✅ No errors in configuration
✅ Changes effective immediately
```

**✅ Result**: Network security fully tested and working!

---

## Cost Optimization

### Storage Cost Factors

**1. Storage Capacity**
- Amount of data stored
- Varies by tier (Hot > Cool > Archive)

**2. Transactions**
- Read, write, list operations
- Varies by tier (Archive > Cool > Hot)

**3. Data Transfer**
- Egress (outbound) data
- Ingress (inbound) is free

**4. Redundancy**
- LRS < ZRS < GRS < GZRS

### Cost Optimization Strategies

**1. Choose Right Access Tier**

| Scenario | Recommended Tier |
|----------|------------------|
| Frequently accessed | Hot |
| Accessed few times per month | Cool |
| Rarely accessed (backup) | Archive |

**2. Use Lifecycle Management**
- Automatically move to cooler tiers
- Delete old data
- Saves 50-90% on storage costs

**3. Choose Right Redundancy**
- Dev/test: LRS (cheapest)
- Production: ZRS or GRS
- Mission-critical: GZRS

**4. Monitor and Optimize**
- Use Azure Cost Management
- Review storage analytics
- Delete unused data

**5. Use Reserved Capacity**
- Commit to 1 or 3 years
- Save up to 38% on Blob storage

### Cost Comparison Example

**Scenario:** 1 TB of data, 10,000 write operations, 100,000 read operations per month

| Configuration | Monthly Cost (approx.) |
|---------------|------------------------|
| Hot + LRS | $18 |
| Cool + LRS | $10 |
| Archive + LRS | $2 |
| Hot + GRS | $36 |
| Cool + GRS | $20 |

**Note:** Prices vary by region and are approximate

### Monitor Costs

1. Go to **"Storage accounts"** → **"mystoragelab123"**
2. Click **"Cost analysis"** (under Cost Management)
3. View costs by:
   - Service (Blob, File, Queue, Table)
   - Resource
   - Time period

**✅ Result**: Cost optimization strategies understood

---

## Summary

### What We Learned

**Storage Services:**
- ✅ **Blob Storage**: Objects, files, images, videos
- ✅ **File Storage**: SMB file shares for legacy apps
- ✅ **Queue Storage**: Async messaging between components
- ✅ **Table Storage**: NoSQL key-value store
- ✅ **Disk Storage**: Managed disks for VMs

**Key Concepts:**
- ✅ Storage account types and redundancy
- ✅ Access tiers (Hot, Cool, Archive)
- ✅ Lifecycle management for cost optimization
- ✅ Security (RBAC, SAS, encryption)
- ✅ Network security (firewall, private endpoints)

**Labs Completed:**
1. ✅ Created storage account
2. ✅ Uploaded and managed blobs
3. ✅ Configured lifecycle policies
4. ✅ Created and mounted file shares
5. ✅ Worked with message queues
6. ✅ Stored NoSQL data in tables
7. ✅ Attached and initialized data disks


### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Azure Storage Account                     │
│                   mystoragelab123                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Blob Storage │  │ File Storage │  │Queue Storage │      │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤      │
│  │ Container:   │  │ Share:       │  │ Queue:       │      │
│  │ - images     │  │ - documents  │  │ - orders     │      │
│  │              │  │              │  │              │      │
│  │ Tiers:       │  │ Mount:       │  │ Messages:    │      │
│  │ - Hot        │  │ - Windows Z: │  │ - JSON data  │      │
│  │ - Cool       │  │ - Linux /mnt │  │              │      │
│  │ - Archive    │  │              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │Table Storage │  │ Disk Storage │                         │
│  ├──────────────┤  ├──────────────┤                         │
│  │ Table:       │  │ Managed Disk:│                         │
│  │ - customers  │  │ - data-disk  │                         │
│  │              │  │              │                         │
│  │ NoSQL:       │  │ Attached to: │                         │
│  │ - Key-Value  │  │ - VM         │                         │
│  │              │  │              │                         │
│  └──────────────┘  └──────────────┘                         │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                        Security                               │
│  - RBAC (Azure AD)                                           │
│  - SAS Tokens                                                │
│  - Encryption (at rest & in transit)                         │
│  - Firewall & Private Endpoints                              │
└─────────────────────────────────────────────────────────────┘
```

### Real-World Use Cases

**E-commerce Application:**
```
- Blob Storage: Product images, user uploads
- File Storage: Shared configuration files
- Queue Storage: Order processing queue
- Table Storage: User session data
- Disk Storage: Database VM disks
```

**Media Streaming Platform:**
```
- Blob Storage: Video files (Archive tier for old content)
- CDN: Content delivery
- Lifecycle: Move to Archive after 90 days
- Cost: 90% savings on old content
```

**IoT Solution:**
```
- Blob Storage: Device logs and telemetry
- Queue Storage: Device command queue
- Table Storage: Device metadata
- Real-time: Process messages from queue
```

### Best Practices

**1. Security:**
- ✅ Use Azure AD authentication (not storage keys)
- ✅ Enable secure transfer (HTTPS only)
- ✅ Use SAS tokens with minimal permissions
- ✅ Implement network restrictions
- ✅ Enable soft delete for blobs and containers

**2. Performance:**
- ✅ Choose right storage tier for access pattern
- ✅ Use Premium storage for high IOPS workloads
- ✅ Implement caching strategies
- ✅ Use CDN for frequently accessed content
- ✅ Partition Table Storage properly

**3. Cost:**
- ✅ Implement lifecycle management policies
- ✅ Use Cool/Archive tiers for infrequent access
- ✅ Delete unused data regularly
- ✅ Monitor costs with Azure Cost Management
- ✅ Consider reserved capacity for predictable workloads

**4. Reliability:**
- ✅ Choose appropriate redundancy (LRS/ZRS/GRS)
- ✅ Enable versioning for critical data
- ✅ Create regular snapshots
- ✅ Test disaster recovery procedures
- ✅ Monitor storage metrics and alerts

**5. Operations:**
- ✅ Use Azure Storage Explorer for management
- ✅ Implement monitoring and alerting
- ✅ Automate with Azure CLI/PowerShell
- ✅ Document storage account structure
- ✅ Tag resources for cost tracking

---

## Cleanup (Optional)

**To avoid charges, delete resources:**

### Delete Storage Account

1. Go to **"Storage accounts"**
2. Select **"mystoragelab123"**
3. Click **"Delete"**
4. Type storage account name to confirm
5. Click **"Delete"**

**⏱️ Wait**: 1-2 minutes

### Delete Resource Group

1. Go to **"Resource groups"**
2. Select **"rg-storage-lab"**
3. Click **"Delete resource group"**
4. Type resource group name to confirm
5. Click **"Delete"**

**⏱️ Wait**: 5-10 minutes

**✅ Result**: All resources deleted, no more charges!

---

## Complete End-to-End Testing

### Final Verification Checklist

**Storage Account:**
- ✅ Storage account created and accessible
- ✅ All service endpoints working
- ✅ Access keys available
- ✅ Monitoring enabled

**Blob Storage:**
- ✅ Container created
- ✅ Files uploaded successfully
- ✅ Access tiers working (Hot/Cool/Archive)
- ✅ SAS tokens generated and working
- ✅ Public/private access configured
- ✅ Virtual directories created
- ✅ Lifecycle policies active

**File Storage:**
- ✅ File share created
- ✅ Files uploaded
- ✅ Windows mount working (Z: drive)
- ✅ Linux mount working (/mnt/documents)
- ✅ Cross-platform sync working
- ✅ Snapshots created and restore tested

**Queue Storage:**
- ✅ Queue created
- ✅ Messages sent successfully
- ✅ Messages received and deleted
- ✅ Visibility timeout working
- ✅ Message expiry working
- ✅ JSON format validated

**Table Storage:**
- ✅ Table created
- ✅ Entities added with various data types
- ✅ Queries working (PartitionKey, RowKey, properties)
- ✅ Updates and deletes working
- ✅ Schema-less design validated
- ✅ Partition distribution correct

**Disk Storage:**
- ✅ Managed disk created
- ✅ Disk attached to VM
- ✅ Windows: Initialized, formatted, drive letter assigned
- ✅ Linux: Partitioned, formatted, mounted
- ✅ Read/write operations working
- ✅ Data persistence after reboot
- ✅ Detach/reattach working

**Security:**
- ✅ RBAC roles assigned and working
- ✅ Secure transfer (HTTPS) enforced
- ✅ Encryption at rest enabled
- ✅ Firewall rules configured
- ✅ Network access restricted

**Cost Optimization:**
- ✅ Lifecycle management configured
- ✅ Appropriate tiers selected
- ✅ Cost monitoring enabled
- ✅ Unused resources identified

### Integration Testing Scenarios

**Scenario 1: Web Application with Storage**

```
User uploads image → Blob Storage (Hot tier)
After 30 days → Lifecycle moves to Cool tier
After 90 days → Lifecycle moves to Archive tier
Application config → File Storage (shared across VMs)
Background jobs → Queue Storage (async processing)
User sessions → Table Storage (fast key-value lookup)
```

**Test:**
1. Upload image via web app
2. Verify in Blob Storage
3. Check lifecycle policy will apply
4. Verify app can read config from File Storage
5. Send job to Queue
6. Store session in Table

**Expected Result:**
```
✅ All components working together
✅ Data flows correctly
✅ No integration issues
```

**Scenario 2: Multi-VM Application**

```
VM 1 (Web Server) → Reads from File Storage
VM 2 (Worker) → Processes Queue messages
VM 3 (Database) → Uses Managed Disk for data
All VMs → Write logs to Blob Storage
```

**Test:**
1. Mount File Storage on VM 1
2. VM 2 processes queue messages
3. VM 3 reads/writes to data disk
4. All VMs upload logs to Blob

**Expected Result:**
```
✅ File share accessible from all VMs
✅ Queue processing working
✅ Disk performance adequate
✅ Logs centralized in Blob Storage
```

**Scenario 3: Disaster Recovery**

```
Primary Region: East US
Backup Strategy:
- Blob snapshots (daily)
- File share snapshots (daily)
- Disk snapshots (weekly)
- GRS replication (automatic)
```

**Test:**
1. Create snapshots of all services
2. Simulate data loss (delete file)
3. Restore from snapshot
4. Verify data integrity

**Expected Result:**
```
✅ Snapshots created successfully
✅ Restore working correctly
✅ No data loss
✅ RTO < 1 hour
```

### Performance Testing

**Blob Storage Performance:**
```bash
# Upload 100 files
for i in {1..100}; do
  az storage blob upload --account-name mystoragelab123 \
    --container-name images --name "test-$i.jpg" --file test.jpg
done

# Measure time
```

**Expected Result:**
```
✅ Upload speed: 10-50 MB/s
✅ 100 files in < 1 minute
✅ No throttling
```

**Queue Storage Performance:**
```python
# Send 1000 messages
import time
start = time.time()
for i in range(1000):
    queue_client.send_message(f'{{"id": {i}}}')
end = time.time()
print(f"Time: {end-start} seconds")
```

**Expected Result:**
```
✅ 1000 messages in < 10 seconds
✅ ~100 messages/second
✅ No errors
```

**Table Storage Performance:**
```python
# Insert 1000 entities
start = time.time()
for i in range(1000):
    entity = {"PartitionKey": "test", "RowKey": str(i), "Data": "test"}
    table_client.create_entity(entity)
end = time.time()
print(f"Time: {end-start} seconds")
```

**Expected Result:**
```
✅ 1000 entities in < 30 seconds
✅ ~30 entities/second
✅ Consistent performance
```

### Troubleshooting Common Issues

**Issue 1: Cannot Access Blob**
```
Error: PublicAccessNotPermitted
Solution: Enable public access or use SAS token
```

**Issue 2: File Share Won't Mount**
```
Error: Port 445 blocked
Solution: Check firewall, use VPN, or Azure Bastion
```

**Issue 3: Queue Messages Not Appearing**
```
Error: Messages invisible
Solution: Wait for visibility timeout (30 seconds)
```

**Issue 4: Table Query Slow**
```
Error: High latency
Solution: Use PartitionKey in query, avoid property-only filters
```

**Issue 5: Disk Not Visible in VM**
```
Error: Disk not showing
Solution: Initialize disk in Disk Management (Windows) or fdisk (Linux)
```

**✅ Result**: All testing complete! Azure Storage fully validated and production-ready!

---

## Next Steps

**Continue Learning:**
- **Day 22**: Azure Backup and Site Recovery
- **Day 23**: Azure Monitor and Log Analytics
- **Day 24**: Azure Cost Management

**Advanced Topics:**
- Azure Data Lake Storage Gen2
- Azure NetApp Files
- Azure HPC Cache
- Immutable storage (WORM)
- Object replication

**Certifications:**
- AZ-104: Azure Administrator
- AZ-204: Azure Developer
- AZ-305: Azure Solutions Architect

---

## Quick Reference

### Storage Account Endpoints

```
Blob:  https://<account>.blob.core.windows.net
File:  https://<account>.file.core.windows.net
Queue: https://<account>.queue.core.windows.net
Table: https://<account>.table.core.windows.net
```

### Common Azure CLI Commands

```bash
# Create storage account
az storage account create --name mystoragelab123 --resource-group rg-storage-lab --location eastus --sku Standard_LRS

# Upload blob
az storage blob upload --account-name mystoragelab123 --container-name images --name test.jpg --file ./test.jpg

# Create file share
az storage share create --name documents --account-name mystoragelab123

# Create queue
az storage queue create --name orders --account-name mystoragelab123

# Create table
az storage table create --name customers --account-name mystoragelab123
```

### Useful Links

- [Azure Storage Documentation](https://docs.microsoft.com/azure/storage/)
- [Azure Storage Explorer Download](https://azure.microsoft.com/features/storage-explorer/)
- [Storage Pricing Calculator](https://azure.microsoft.com/pricing/calculator/)
- [Storage Best Practices](https://docs.microsoft.com/azure/storage/common/storage-best-practices)

---

**🎉 Congratulations!** You've completed the comprehensive Azure Storage guide. You now understand all Azure Storage services and how to use them in real-world scenarios!

