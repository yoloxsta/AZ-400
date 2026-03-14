# Day 23 Part 2: Azure Database - Advanced Topics

## What You'll Learn

Advanced Azure Database concepts and services:
- ✅ Azure SQL Database Deep Dive
- ✅ Azure SQL High Availability & Disaster Recovery (HA & DR)
- ✅ Azure SQL Active Geo-Replication
- ✅ Azure SQL Failover Groups
- ✅ Azure SQL Managed Instance
- ✅ SQL Server on Azure VMs
- ✅ Azure Cosmos DB Deep Dive (Global Distribution)
- ✅ Azure Databricks Overview
- ✅ What, Why, How for each topic
- ✅ Labs via Azure Portal
- ✅ Test, Check, and Confirm

## Table of Contents

1. [Azure SQL Database - Deep Dive](#azure-sql-database---deep-dive)
2. [Azure SQL HA & DR Explained](#azure-sql-ha--dr-explained)
3. [Azure SQL Active Geo-Replication](#azure-sql-active-geo-replication)
4. [Azure SQL Failover Groups](#azure-sql-failover-groups)
5. [Azure SQL Managed Instance](#azure-sql-managed-instance)
6. [SQL Server on Azure VMs](#sql-server-on-azure-vms)
7. [Azure Cosmos DB - Deep Dive](#azure-cosmos-db---deep-dive)
8. [Azure Databricks](#azure-databricks)
9. [Choosing the Right Service](#choosing-the-right-service)

---

## Azure SQL Database - Deep Dive

### What is Azure SQL Database?

**Azure SQL Database** is a fully managed Platform-as-a-Service (PaaS) database engine.

**Key Point:** You get a DATABASE, not a server. Azure manages the server.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    AZURE SQL DATABASE                             │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Logical SQL Server                                       │  │
│  │  (NOT a real server - just a management endpoint)         │  │
│  │  Name: myserver.database.windows.net                      │  │
│  │                                                            │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │  │
│  │  │ Database 1 │  │ Database 2 │  │ Database 3 │         │  │
│  │  │ (myappdb)  │  │ (testdb)   │  │ (analyticsdb)│       │  │
│  │  │            │  │            │  │            │         │  │
│  │  │ Own DTUs   │  │ Own DTUs   │  │ Own DTUs   │         │  │
│  │  │ Own size   │  │ Own size   │  │ Own size   │         │  │
│  │  └────────────┘  └────────────┘  └────────────┘         │  │
│  │                                                            │  │
│  │  Shared:                                                   │  │
│  │  - Firewall rules                                         │  │
│  │  - Admin login                                            │  │
│  │  - Auditing policies                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Azure Manages:                                                  │
│  - Hardware, OS, patching                                       │
│  - Backups (automatic)                                          │
│  - High availability                                            │
│  - Monitoring                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Purchasing Models

**1. DTU Model (Database Transaction Unit)**

```
DTU = Bundled measure of CPU + Memory + I/O

┌──────────────────────────────────────────────────────────────┐
│  DTU Tiers                                                    │
│                                                               │
│  Basic:    5 DTUs    | 2 GB    | $5/month    | Dev/Test     │
│  Standard: 10-3000   | 250 GB  | $15+/month  | Production   │
│  Premium:  125-4000  | 1 TB    | $465+/month | High perf    │
│                                                               │
│  Simple: Pick a tier, get bundled resources                  │
│  Like: Buying a meal combo (burger + fries + drink)          │
└──────────────────────────────────────────────────────────────┘
```

**2. vCore Model (Virtual Core)**

```
vCore = Choose CPU, Memory, Storage separately

┌──────────────────────────────────────────────────────────────┐
│  vCore Tiers                                                  │
│                                                               │
│  General Purpose:  2-80 vCores  | Remote storage | $$       │
│  Business Critical: 2-128 vCores | Local SSD     | $$$      │
│  Hyperscale:       2-128 vCores | Distributed    | $$$$     │
│                                                               │
│  Flexible: Choose CPU, memory, storage independently         │
│  Like: Ordering à la carte (pick each item separately)       │
└──────────────────────────────────────────────────────────────┘
```

### Service Tiers Comparison

```
┌─────────────────────────────────────────────────────────────────┐
│                    SERVICE TIERS                                  │
│                                                                  │
│  General Purpose:                                               │
│  ├─ Standard availability (99.99%)                              │
│  ├─ Remote storage (Azure Premium Storage)                      │
│  ├─ 5-10ms I/O latency                                         │
│  ├─ Good for: Most workloads                                   │
│  └─ Cost: $$                                                    │
│                                                                  │
│  Business Critical:                                             │
│  ├─ High availability (99.99%) with read replicas              │
│  ├─ Local SSD storage                                          │
│  ├─ 1-2ms I/O latency                                          │
│  ├─ Built-in read replica (free)                               │
│  ├─ Good for: OLTP, low latency                                │
│  └─ Cost: $$$                                                   │
│                                                                  │
│  Hyperscale:                                                    │
│  ├─ Up to 100 TB database size                                 │
│  ├─ Near-instant backups                                       │
│  ├─ Fast restore (minutes, not hours)                          │
│  ├─ Up to 4 read replicas                                      │
│  ├─ Good for: Large databases, unpredictable workloads         │
│  └─ Cost: $$$$                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Azure SQL HA & DR Explained

### What is HA & DR?

**HA (High Availability):**
- Database stays running even if hardware fails
- Automatic failover within same region
- No data loss
- Minimal downtime (seconds)

**DR (Disaster Recovery):**
- Database recoverable if entire region goes down
- Data replicated to another region
- May have some data loss (RPO)
- Recovery takes minutes to hours (RTO)

### Visual: HA vs DR

```
┌─────────────────────────────────────────────────────────────────┐
│                    HIGH AVAILABILITY (HA)                         │
│                    Same Region                                   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  East US Region                                          │   │
│  │                                                           │   │
│  │  ┌──────────┐    Automatic     ┌──────────┐             │   │
│  │  │ Primary  │ ──Replication──→ │ Replica  │             │   │
│  │  │ Database │    (Sync)        │ Database │             │   │
│  │  └──────────┘                  └──────────┘             │   │
│  │       ↑                              ↑                   │   │
│  │  App connects                  If Primary fails,         │   │
│  │  here normally                 auto-failover here        │   │
│  │                                                           │   │
│  │  Downtime: 0-30 seconds                                  │   │
│  │  Data loss: NONE (synchronous replication)               │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    DISASTER RECOVERY (DR)                         │
│                    Cross Region                                  │
│                                                                  │
│  ┌────────────────────┐         ┌────────────────────┐         │
│  │  East US Region    │         │  West US Region    │         │
│  │                    │         │                    │         │
│  │  ┌──────────┐     │  Async  │  ┌──────────┐     │         │
│  │  │ Primary  │ ────│────────→│──│ Secondary│     │         │
│  │  │ Database │     │  Repli- │  │ Database │     │         │
│  │  └──────────┘     │  cation │  └──────────┘     │         │
│  │       ↑            │         │       ↑            │         │
│  │  App connects     │         │  If East US fails, │         │
│  │  here normally    │         │  failover here     │         │
│  └────────────────────┘         └────────────────────┘         │
│                                                                  │
│  Downtime: Minutes (manual) or seconds (auto failover group)   │
│  Data loss: Possible (async replication, RPO ~5 seconds)       │
└─────────────────────────────────────────────────────────────────┘
```

### HA Architecture by Tier

```
General Purpose HA:
┌──────────────────────────────────────────────────────────────┐
│  ┌──────────┐     ┌──────────────────┐                      │
│  │ Compute  │ ──→ │ Azure Premium    │                      │
│  │ Node     │     │ Storage          │                      │
│  └──────────┘     │ (3 copies)       │                      │
│       ↓            │ ┌──┐ ┌──┐ ┌──┐  │                      │
│  If node fails,   │ │C1│ │C2│ │C3│  │                      │
│  new node starts  │ └──┘ └──┘ └──┘  │                      │
│  (60-120 sec)     └──────────────────┘                      │
│                                                              │
│  Storage is separate from compute                           │
│  Data survives compute failure                              │
└──────────────────────────────────────────────────────────────┘

Business Critical HA:
┌──────────────────────────────────────────────────────────────┐
│  ┌──────────┐     ┌──────────┐     ┌──────────┐            │
│  │ Primary  │ ──→ │ Replica 1│ ──→ │ Replica 2│            │
│  │ Node     │sync │ Node     │sync │ Node     │            │
│  │ (R/W)    │     │ (R/O)    │     │ (R/O)    │            │
│  │ Local SSD│     │ Local SSD│     │ Local SSD│            │
│  └──────────┘     └──────────┘     └──────────┘            │
│       ↑                 ↑                                    │
│  App writes        App reads (free read replica)            │
│  here              can use this                             │
│                                                              │
│  Failover: <30 seconds                                      │
│  Data loss: NONE (synchronous)                              │
│  Bonus: Free read-only replica!                             │
└──────────────────────────────────────────────────────────────┘
```

### RPO and RTO Explained

```
RPO (Recovery Point Objective):
"How much data can I afford to lose?"

Timeline:
──────────────────────────────────────────→ Time
     ↑                    ↑           ↑
  Last backup         Disaster     Recovery
     │←── RPO ──→│
     │ (data loss) │

RPO = 0: No data loss (synchronous replication)
RPO = 5 sec: May lose last 5 seconds of data
RPO = 1 hour: May lose last 1 hour of data


RTO (Recovery Time Objective):
"How long can my app be down?"

Timeline:
──────────────────────────────────────────→ Time
              ↑                       ↑
           Disaster               App back online
              │←──── RTO ────→│
              │  (downtime)    │

RTO = 0: No downtime (instant failover)
RTO = 30 sec: App down for 30 seconds
RTO = 1 hour: App down for 1 hour
```

### HA & DR Options Summary

| Feature | General Purpose | Business Critical | Hyperscale |
|---------|----------------|-------------------|------------|
| Local HA | ✅ (storage redundancy) | ✅ (Always On replicas) | ✅ (compute + storage) |
| Failover time | 60-120 sec | <30 sec | <30 sec |
| Read replica (free) | ❌ | ✅ 1 replica | ✅ Up to 4 |
| Zone redundancy | ✅ (optional) | ✅ (optional) | ✅ (optional) |
| Geo-replication | ✅ | ✅ | ✅ |
| Failover groups | ✅ | ✅ | ✅ |
| RPO (local) | 0 | 0 | 0 |
| RPO (geo) | ~5 sec | ~5 sec | ~5 sec |

---


## Azure SQL Active Geo-Replication

### What is Active Geo-Replication?

**Active Geo-Replication** = Continuously copy your database to another region.

**Key Points:**
- Asynchronous replication (RPO ~5 seconds)
- Up to 4 secondary databases
- Secondaries are readable (offload read queries)
- Manual failover
- Database-level (not server-level)

### How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                ACTIVE GEO-REPLICATION                            │
│                                                                  │
│  ┌────────────────────┐         ┌────────────────────┐         │
│  │  East US            │         │  West Europe       │         │
│  │  PRIMARY            │  Async  │  SECONDARY         │         │
│  │                    │  Repli- │                    │         │
│  │  ┌──────────────┐ │  cation │  ┌──────────────┐ │         │
│  │  │ myappdb      │─│────────→│──│ myappdb      │ │         │
│  │  │ (Read/Write) │ │  ~5 sec │  │ (Read Only)  │ │         │
│  │  └──────────────┘ │  delay  │  └──────────────┘ │         │
│  │                    │         │                    │         │
│  │  Server:           │         │  Server:           │         │
│  │  sql-primary.      │         │  sql-secondary.    │         │
│  │  database.         │         │  database.         │         │
│  │  windows.net       │         │  windows.net       │         │
│  └────────────────────┘         └────────────────────┘         │
│                                                                  │
│  App writes → Primary (East US)                                 │
│  App reads  → Secondary (West Europe) - offload reads          │
│  Disaster   → Manual failover to Secondary                     │
└─────────────────────────────────────────────────────────────────┘
```

### Lab: Setup Active Geo-Replication

**Prerequisites:** You need the Azure SQL Database from Day 23 Lab 1.

### Step 1: Create Secondary Server in Another Region

1. Go to **"SQL servers"**
2. Click **"+ Create"**

**Basics:**
- **Resource group**: `rg-database-lab`
- **Server name**: `sqlserver-day23-secondary`
- **Location**: `West Europe` (different from primary!)
- **Authentication**: `SQL authentication`
- **Admin login**: `sqladmin`
- **Password**: `P@ssw0rd2026!` (same as primary)

Click **"Review + create"** → **"Create"**

**⏱️ Wait**: 1-2 minutes

### Step 2: Configure Geo-Replication

1. Go to **"SQL databases"** → **"myappdb"**
2. In left menu, click **"Replicas"** (under Data management)
3. Click **"+ Create replica"**

**Geo replica:**
- **Server**: Select **"sqlserver-day23-secondary"** (West Europe)
- **Want to use SQL elastic pool?**: `No`
- **Compute + storage**: `Basic` (same as primary for lab)

Click **"Review + create"** → **"Create"**

**⏱️ Wait**: 5-10 minutes

**✅ Result**: Geo-replication configured!

### Step 3: Verify Replication

1. Go to **"SQL databases"** → **"myappdb"** (primary)
2. Click **"Replicas"**
3. You should see:

```
Primary: myappdb (East US) - sqlserver-day23-demo
Secondary: myappdb (West Europe) - sqlserver-day23-secondary
Replication state: SEEDING → CATCH_UP → SYNCHRONIZED
```

**⏱️ Wait** until state shows **"SYNCHRONIZED"**

### Step 4: Test Read from Secondary

1. Go to **"SQL servers"** → **"sqlserver-day23-secondary"**
2. Click **"Networking"** (under Security)
3. Add your client IP to firewall
4. Click **"Save"**

5. Go to **"SQL databases"** → **"myappdb"** (on secondary server)
6. Click **"Query editor"**
7. Login with `sqladmin`

**Run query on secondary:**

```sql
-- This works (READ)
SELECT TOP 5 FirstName, LastName, EmailAddress 
FROM SalesLT.Customer;

-- This FAILS (WRITE - secondary is read-only)
INSERT INTO dbo.Employees (FirstName, LastName, Email, Department, Salary)
VALUES ('Test', 'User', 'test@company.com', 'IT', 60000);
```

**Expected Result:**
```
SELECT: ✅ Returns data (read works)
INSERT: ❌ Error: "Failed to update database because the database is read-only"
✅ Secondary is read-only as expected!
```

### Step 5: Test Manual Failover

1. Go to **"SQL databases"** → **"myappdb"** (primary in East US)
2. Click **"Replicas"**
3. Click on the secondary database
4. Click **"Failover"** (top menu)
5. Confirm failover

**⏱️ Wait**: 1-2 minutes

**What happens:**
```
Before Failover:
  East US: PRIMARY (Read/Write)
  West Europe: SECONDARY (Read Only)

After Failover:
  East US: SECONDARY (Read Only)     ← Was primary
  West Europe: PRIMARY (Read/Write)  ← Now primary!
```

### Step 6: Test, Check, and Confirm - Geo-Replication

**Test 1: Verify Replication Status**

1. Go to primary database → **"Replicas"**

**Expected Result:**
```
✅ Replication state: Synchronized
✅ Replication lag: <5 seconds
✅ Secondary region: West Europe
```

**Test 2: Verify Data on Secondary**

Run on secondary:
```sql
SELECT COUNT(*) AS TotalCustomers FROM SalesLT.Customer;
SELECT COUNT(*) AS TotalEmployees FROM dbo.Employees;
```

**Expected Result:**
```
✅ Same count as primary
✅ Data replicated correctly
```

**Test 3: Test Write on Primary, Read on Secondary**

On primary (East US):
```sql
INSERT INTO dbo.Employees (FirstName, LastName, Email, Department, Salary)
VALUES ('Geo', 'Test', 'geo@company.com', 'IT', 65000);
```

Wait 5 seconds, then on secondary (West Europe):
```sql
SELECT * FROM dbo.Employees WHERE FirstName = 'Geo';
```

**Expected Result:**
```
✅ Data appears on secondary within ~5 seconds
✅ Asynchronous replication working
```

**Test 4: Verify Failover**

After failover, on new primary (West Europe):
```sql
-- This should work now (write on new primary)
INSERT INTO dbo.Employees (FirstName, LastName, Email, Department, Salary)
VALUES ('Failover', 'Test', 'failover@company.com', 'IT', 70000);
```

**Expected Result:**
```
✅ Write succeeds on new primary
✅ Failover completed successfully
```

**✅ Result**: Active Geo-Replication fully tested!

---

## Azure SQL Failover Groups

### What is a Failover Group?

**Failover Group** = Automatic geo-failover for one or more databases.

**Key Difference from Geo-Replication:**

```
┌─────────────────────────────────────────────────────────────────┐
│  ACTIVE GEO-REPLICATION vs FAILOVER GROUP                       │
│                                                                  │
│  Active Geo-Replication:                                        │
│  ├─ Database-level                                              │
│  ├─ Manual failover only                                        │
│  ├─ App must change connection string after failover            │
│  ├─ Up to 4 secondaries                                        │
│  └─ More control, more work                                    │
│                                                                  │
│  Failover Group:                                                │
│  ├─ Server-level (multiple databases)                           │
│  ├─ Automatic OR manual failover                                │
│  ├─ App uses SAME connection string (no change needed!)         │
│  ├─ 1 secondary only                                            │
│  └─ Simpler, recommended for production                        │
└─────────────────────────────────────────────────────────────────┘
```

### How Failover Group Works

```
┌─────────────────────────────────────────────────────────────────┐
│                    FAILOVER GROUP                                │
│                    Name: myfailovergroup                         │
│                                                                  │
│  Read/Write Endpoint (ALWAYS points to primary):                │
│  myfailovergroup.database.windows.net                           │
│                                                                  │
│  Read-Only Endpoint (ALWAYS points to secondary):               │
│  myfailovergroup.secondary.database.windows.net                 │
│                                                                  │
│  ┌────────────────────┐         ┌────────────────────┐         │
│  │  East US            │         │  West Europe       │         │
│  │  PRIMARY SERVER     │  Auto   │  SECONDARY SERVER  │         │
│  │                    │  Repli- │                    │         │
│  │  ┌──────────────┐ │  cation │  ┌──────────────┐ │         │
│  │  │ Database 1   │─│────────→│──│ Database 1   │ │         │
│  │  │ Database 2   │─│────────→│──│ Database 2   │ │         │
│  │  │ Database 3   │─│────────→│──│ Database 3   │ │         │
│  │  └──────────────┘ │         │  └──────────────┘ │         │
│  └────────────────────┘         └────────────────────┘         │
│                                                                  │
│  AUTOMATIC FAILOVER:                                            │
│  If East US goes down:                                          │
│  1. Azure detects failure                                       │
│  2. Waits grace period (default 1 hour)                        │
│  3. Promotes West Europe to PRIMARY                             │
│  4. DNS updates automatically                                   │
│  5. App uses SAME connection string!                            │
│  6. No app code change needed!                                  │
└─────────────────────────────────────────────────────────────────┘
```

### The Magic: DNS-Based Failover

```
BEFORE Failover:
┌──────────────────────────────────────────────────────────────┐
│  myfailovergroup.database.windows.net                        │
│  DNS resolves to → sql-primary.database.windows.net (East US)│
│                                                               │
│  App connects to: myfailovergroup.database.windows.net       │
│  Actually goes to: East US (primary)                         │
└──────────────────────────────────────────────────────────────┘

AFTER Failover (East US down):
┌──────────────────────────────────────────────────────────────┐
│  myfailovergroup.database.windows.net                        │
│  DNS resolves to → sql-secondary.database.windows.net (West) │
│                                                               │
│  App connects to: myfailovergroup.database.windows.net       │
│  Actually goes to: West Europe (new primary)                 │
│                                                               │
│  ✅ SAME connection string!                                  │
│  ✅ No app code change!                                      │
│  ✅ Automatic!                                               │
└──────────────────────────────────────────────────────────────┘
```

### Lab: Setup Failover Group

**Prerequisites:** You need primary and secondary SQL servers from previous lab.

### Step 1: Create Failover Group

1. Go to **"SQL servers"** → **"sqlserver-day23-demo"** (primary)
2. In left menu, click **"Failover groups"** (under Data management)
3. Click **"+ Add group"**

**Failover group configuration:**
- **Failover group name**: `fg-day23-demo` (must be globally unique)
- **Server**: Select **"sqlserver-day23-secondary"** (West Europe)
- **Read/Write failover policy**: `Automatic`
- **Grace period (minutes)**: `60` (1 hour)
- **Read-only failover policy**: `Enabled`
- **Databases within the group**: Select **"myappdb"**

Click **"Create"**

**⏱️ Wait**: 5-10 minutes

**✅ Result**: Failover group created!

### Step 2: Note the Endpoints

After creation, go to **"Failover groups"** → **"fg-day23-demo"**

**Endpoints:**
```
Read/Write: fg-day23-demo.database.windows.net
Read-Only:  fg-day23-demo.secondary.database.windows.net
```

**These endpoints NEVER change, even after failover!**

### Step 3: Test Connection via Failover Group Endpoint

1. Go to **"SQL databases"** → **"myappdb"**
2. Click **"Query editor"**
3. Or use Azure Data Studio with:
   - **Server**: `fg-day23-demo.database.windows.net`
   - **User**: `sqladmin`
   - **Password**: `P@ssw0rd2026!`

```sql
-- Check which server you're connected to
SELECT @@SERVERNAME AS CurrentServer;
SELECT DB_NAME() AS CurrentDatabase;
```

**Expected Result:**
```
CurrentServer: sqlserver-day23-demo
CurrentDatabase: myappdb
✅ Connected to primary via failover group endpoint
```

### Step 4: Test Manual Failover

1. Go to **"SQL servers"** → **"sqlserver-day23-demo"**
2. Click **"Failover groups"** → **"fg-day23-demo"**
3. Click **"Failover"** (top menu)
4. Confirm: **"Yes"**

**⏱️ Wait**: 2-5 minutes

**What happens:**

```
Before:
  Primary: sqlserver-day23-demo (East US)
  Secondary: sqlserver-day23-secondary (West Europe)

After:
  Primary: sqlserver-day23-secondary (West Europe)    ← NEW primary
  Secondary: sqlserver-day23-demo (East US)           ← NEW secondary

Connection string: fg-day23-demo.database.windows.net
Still works! DNS automatically updated!
```

### Step 5: Verify After Failover

```sql
-- Connect using SAME endpoint
-- Server: fg-day23-demo.database.windows.net
SELECT @@SERVERNAME AS CurrentServer;
```

**Expected Result:**
```
CurrentServer: sqlserver-day23-secondary
✅ Now connected to West Europe (new primary)
✅ Same connection string worked!
```


### Step 6: Test, Check, and Confirm - Failover Group

**Test 1: Verify Failover Group Created**

1. Go to SQL server → **"Failover groups"**

**Expected Result:**
```
✅ Group name: fg-day23-demo
✅ Primary: sqlserver-day23-demo (East US)
✅ Secondary: sqlserver-day23-secondary (West Europe)
✅ Failover policy: Automatic
✅ Grace period: 60 minutes
✅ Databases: myappdb
```

**Test 2: Verify Endpoints**

```
✅ Read/Write: fg-day23-demo.database.windows.net
✅ Read-Only: fg-day23-demo.secondary.database.windows.net
```

**Test 3: Test Read/Write Endpoint**

Connect to `fg-day23-demo.database.windows.net`:
```sql
-- Write test
INSERT INTO dbo.Employees (FirstName, LastName, Email, Department, Salary)
VALUES ('Failover', 'GroupTest', 'fg@company.com', 'IT', 72000);

-- Read test
SELECT * FROM dbo.Employees WHERE FirstName = 'Failover';
```

**Expected Result:**
```
✅ Write succeeds
✅ Read returns data
✅ Connected to primary
```

**Test 4: Test Read-Only Endpoint**

Connect to `fg-day23-demo.secondary.database.windows.net`:
```sql
-- Read works
SELECT COUNT(*) FROM dbo.Employees;

-- Write fails
INSERT INTO dbo.Employees (FirstName, LastName, Email, Department, Salary)
VALUES ('ReadOnly', 'Test', 'ro@company.com', 'IT', 50000);
```

**Expected Result:**
```
✅ Read succeeds
❌ Write fails (read-only endpoint)
✅ Correctly routing to secondary
```

**Test 5: Test Failover**

1. Trigger manual failover
2. Wait 2-5 minutes
3. Connect to SAME endpoint: `fg-day23-demo.database.windows.net`
4. Run: `SELECT @@SERVERNAME`

**Expected Result:**
```
Before: sqlserver-day23-demo
After: sqlserver-day23-secondary
✅ Failover successful
✅ Same connection string works
✅ No app change needed
```

**Test 6: Verify Data After Failover**

```sql
SELECT COUNT(*) AS TotalEmployees FROM dbo.Employees;
SELECT COUNT(*) AS TotalCustomers FROM SalesLT.Customer;
```

**Expected Result:**
```
✅ Same data counts as before failover
✅ No data loss
✅ All tables intact
```

**Test 7: Failback (Return to Original)**

1. Go to NEW primary server → **"Failover groups"**
2. Click **"Failover"** again
3. Wait 2-5 minutes

**Expected Result:**
```
✅ Original primary restored
✅ Connection string still works
✅ No data loss
```

**✅ Result**: Failover Group fully tested!

### Best Practices for Failover Groups

```
┌──────────────────────────────────────────────────────────────┐
│  PRODUCTION BEST PRACTICES                                    │
│                                                               │
│  1. Always use failover group endpoint in app                │
│     ✅ fg-day23-demo.database.windows.net                    │
│     ❌ sqlserver-day23-demo.database.windows.net             │
│                                                               │
│  2. Set appropriate grace period                             │
│     Dev/Test: 60 minutes (avoid false failovers)             │
│     Production: 30-60 minutes                                │
│                                                               │
│  3. Use read-only endpoint for read queries                  │
│     Offload reporting to secondary                           │
│     Reduce load on primary                                   │
│                                                               │
│  4. Test failover regularly                                  │
│     Schedule quarterly failover tests                        │
│     Verify app handles failover gracefully                   │
│                                                               │
│  5. Monitor replication lag                                   │
│     Alert if lag > 30 seconds                                │
│     Investigate network issues                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Azure SQL Managed Instance

### What is SQL Managed Instance?

**SQL Managed Instance** = Near 100% compatibility with on-premises SQL Server.

**The Problem:**
```
On-Premises SQL Server has features that Azure SQL Database doesn't support:
- Cross-database queries
- SQL Server Agent jobs
- CLR integration
- Service Broker
- Linked servers
- Database Mail

Azure SQL Database: ~95% compatible with SQL Server
SQL Managed Instance: ~99% compatible with SQL Server
```

### Visual: Where Managed Instance Fits

```
┌─────────────────────────────────────────────────────────────────┐
│                    SQL SERVER OPTIONS IN AZURE                    │
│                                                                  │
│  More Control                                    Less Control   │
│  More Effort                                     Less Effort    │
│  ←─────────────────────────────────────────────────────────→    │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ SQL Server   │  │ SQL Managed  │  │ Azure SQL    │         │
│  │ on Azure VM  │  │ Instance     │  │ Database     │         │
│  │              │  │              │  │              │         │
│  │ IaaS         │  │ PaaS         │  │ PaaS         │         │
│  │              │  │              │  │              │         │
│  │ You manage:  │  │ You manage:  │  │ You manage:  │         │
│  │ - OS         │  │ - Databases  │  │ - Database   │         │
│  │ - SQL Server │  │ - Some       │  │ - Data       │         │
│  │ - Patching   │  │   settings   │  │ - Queries    │         │
│  │ - Backups    │  │              │  │              │         │
│  │ - HA/DR      │  │ Azure:       │  │ Azure:       │         │
│  │              │  │ - OS         │  │ - Everything │         │
│  │ Compat:      │  │ - Patching   │  │   else       │         │
│  │ 100%         │  │ - Backups    │  │              │         │
│  │              │  │ - HA         │  │ Compat:      │         │
│  │ Cost: $$$    │  │              │  │ ~95%         │         │
│  │              │  │ Compat:      │  │              │         │
│  │ Use when:    │  │ ~99%         │  │ Cost: $      │         │
│  │ Need full    │  │              │  │              │         │
│  │ control      │  │ Cost: $$     │  │ Use when:    │         │
│  │              │  │              │  │ New apps     │         │
│  │              │  │ Use when:    │  │ Simple needs │         │
│  │              │  │ Lift-and-    │  │              │         │
│  │              │  │ shift from   │  │              │         │
│  │              │  │ on-premises  │  │              │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

### Key Features of Managed Instance

```
┌──────────────────────────────────────────────────────────────┐
│  SQL MANAGED INSTANCE FEATURES                                │
│                                                               │
│  ✅ Cross-database queries (JOIN across databases)           │
│  ✅ SQL Server Agent (scheduled jobs)                        │
│  ✅ CLR integration (.NET code in SQL)                       │
│  ✅ Service Broker (messaging)                               │
│  ✅ Linked servers (connect to other servers)                │
│  ✅ Database Mail (send emails from SQL)                     │
│  ✅ Native backup/restore (from .bak files)                  │
│  ✅ VNet integration (private by default)                    │
│  ✅ Up to 100 databases per instance                         │
│  ✅ Up to 16 TB storage                                      │
│                                                               │
│  ❌ NOT supported:                                           │
│  - Filestream                                                │
│  - Some trace flags                                          │
│  - Windows authentication (use Azure AD)                     │
└──────────────────────────────────────────────────────────────┘
```

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Azure Virtual Network                                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Managed Instance Subnet (dedicated)                       │  │
│  │                                                             │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  SQL Managed Instance                                │  │  │
│  │  │  Name: mi-day23-demo                                 │  │  │
│  │  │                                                       │  │  │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │  │  │
│  │  │  │ DB 1     │ │ DB 2     │ │ DB 3     │            │  │  │
│  │  │  │ (appdb)  │ │ (testdb) │ │ (hrdb)   │            │  │  │
│  │  │  └──────────┘ └──────────┘ └──────────┘            │  │  │
│  │  │                                                       │  │  │
│  │  │  Features:                                           │  │  │
│  │  │  - SQL Agent ✅                                      │  │  │
│  │  │  - Cross-DB queries ✅                               │  │  │
│  │  │  - CLR ✅                                            │  │  │
│  │  │  - Service Broker ✅                                 │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                                                             │  │
│  │  Private IP only (no public endpoint by default)           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Access: VPN, ExpressRoute, or Public endpoint (optional)       │
└─────────────────────────────────────────────────────────────────┘
```

### When to Use Managed Instance

```
✅ USE Managed Instance when:
- Migrating from on-premises SQL Server
- Need cross-database queries
- Need SQL Agent jobs
- Need CLR integration
- Need Service Broker
- Need native backup/restore (.bak files)
- Need VNet isolation

❌ DON'T USE Managed Instance when:
- Building new cloud-native app (use Azure SQL Database)
- Need cheapest option (use Azure SQL Database Basic)
- Need serverless (use Azure SQL Database Serverless)
- Need Hyperscale (use Azure SQL Database Hyperscale)
```

### Cost Note

```
⚠️ SQL Managed Instance is EXPENSIVE for labs:
- Minimum: ~$350/month (4 vCores General Purpose)
- No free tier
- No Basic/Standard tier
- Deployment takes 4-6 hours

Recommendation for learning:
- Read and understand the concepts
- Use Azure SQL Database for hands-on labs
- Only deploy Managed Instance for production migration
```

---

## SQL Server on Azure VMs

### What is SQL Server on Azure VMs?

**SQL Server on Azure VMs** = Full SQL Server installed on Azure Virtual Machine.

**IaaS (Infrastructure as a Service)** - You manage everything.

### How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│  SQL SERVER ON AZURE VM                                          │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Azure Virtual Machine                                     │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  Windows Server 2022                                 │  │  │
│  │  │  ┌───────────────────────────────────────────────┐  │  │  │
│  │  │  │  SQL Server 2022                              │  │  │  │
│  │  │  │                                                │  │  │  │
│  │  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐     │  │  │  │
│  │  │  │  │ DB 1     │ │ DB 2     │ │ DB 3     │     │  │  │  │
│  │  │  │  └──────────┘ └──────────┘ └──────────┘     │  │  │  │
│  │  │  │                                                │  │  │  │
│  │  │  │  Full SQL Server features:                    │  │  │  │
│  │  │  │  - Everything from on-premises                │  │  │  │
│  │  │  │  - SSIS, SSRS, SSAS                          │  │  │  │
│  │  │  │  - Filestream                                 │  │  │  │
│  │  │  │  - Windows Authentication                     │  │  │  │
│  │  │  │  - Full OS access                             │  │  │  │
│  │  │  └───────────────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                                                             │  │
│  │  YOU manage: OS, SQL Server, patching, backups, HA/DR      │  │
│  │  Azure manages: Hardware, networking, power                 │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### SQL Server VM Images

```
Azure Marketplace provides pre-configured images:

┌──────────────────────────────────────────────────────────────┐
│  SQL Server Images                                            │
│                                                               │
│  SQL Server 2022 on Windows Server 2022                      │
│  ├─ Enterprise (full features)                               │
│  ├─ Standard (most features)                                 │
│  ├─ Web (web workloads only)                                 │
│  ├─ Developer (free, not for production)                     │
│  └─ Express (free, limited)                                  │
│                                                               │
│  SQL Server 2022 on Ubuntu 22.04                             │
│  ├─ Enterprise                                               │
│  ├─ Standard                                                 │
│  └─ Developer                                                │
│                                                               │
│  Licensing:                                                   │
│  - Pay-as-you-go (included in VM price)                      │
│  - Bring your own license (BYOL) - use existing license      │
└──────────────────────────────────────────────────────────────┘
```

### When to Use SQL Server on VM

```
✅ USE SQL Server on VM when:
- Need 100% SQL Server compatibility
- Need SSIS, SSRS, SSAS
- Need Filestream
- Need Windows Authentication
- Need full OS access
- Need specific SQL Server version
- Have existing SQL Server license (BYOL)
- Need features not in Managed Instance

❌ DON'T USE SQL Server on VM when:
- Don't want to manage OS and patching
- Want automatic backups and HA
- Building new cloud-native app
- Want lowest management overhead
```

### Cost Comparison

```
┌──────────────────────────────────────────────────────────────┐
│  COST COMPARISON (approximate monthly)                        │
│                                                               │
│  Azure SQL Database (Basic):     $5/month                    │
│  Azure SQL Database (S1):        $30/month                   │
│  Azure SQL Database (S3):        $150/month                  │
│                                                               │
│  SQL Managed Instance (4 vCore): $350/month                  │
│  SQL Managed Instance (8 vCore): $700/month                  │
│                                                               │
│  SQL Server on VM (B2s + SQL):   $75/month                   │
│  SQL Server on VM (D4s + SQL):   $400/month                  │
│  SQL Server on VM (BYOL):        VM cost only                │
│                                                               │
│  Cheapest → Most Expensive:                                  │
│  SQL Database < SQL on VM (BYOL) < MI < SQL on VM (PAYG)    │
└──────────────────────────────────────────────────────────────┘
```

---


## Azure Cosmos DB - Deep Dive

### What Makes Cosmos DB Special?

**Cosmos DB** is not just another NoSQL database. It's a globally distributed, multi-model database designed for planet-scale applications.

### Global Distribution

```
┌─────────────────────────────────────────────────────────────────┐
│                COSMOS DB GLOBAL DISTRIBUTION                     │
│                                                                  │
│                    ┌──────────┐                                  │
│                    │ East US  │ ← Primary Write Region          │
│                    │ (Write)  │                                  │
│                    └────┬─────┘                                  │
│                         │                                        │
│              ┌──────────┼──────────┐                            │
│              │          │          │                            │
│              ↓          ↓          ↓                            │
│        ┌──────────┐ ┌──────────┐ ┌──────────┐                 │
│        │ West     │ │ Japan    │ │ Australia│                 │
│        │ Europe   │ │ East     │ │ East     │                 │
│        │ (Read)   │ │ (Read)   │ │ (Read)   │                 │
│        └──────────┘ └──────────┘ └──────────┘                 │
│                                                                  │
│  User in Europe → Reads from West Europe (<10ms)                │
│  User in Japan → Reads from Japan East (<10ms)                  │
│  User in Australia → Reads from Australia East (<10ms)          │
│  All writes → Go to East US → Replicated to all regions        │
│                                                                  │
│  Multi-Region Write (optional):                                 │
│  Users can write to their nearest region                        │
│  Conflict resolution handles concurrent writes                  │
└─────────────────────────────────────────────────────────────────┘
```

### Consistency Levels

**Cosmos DB offers 5 consistency levels:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONSISTENCY LEVELS                             │
│                                                                  │
│  Strongest ←──────────────────────────────────→ Weakest         │
│  Slowest                                         Fastest        │
│  Most Expensive                                  Cheapest       │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────┐│
│  │ Strong   │ │ Bounded  │ │ Session  │ │Consistent│ │Event-││
│  │          │ │ Staleness│ │ (Default)│ │ Prefix   │ │ual   ││
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────┘│
│                                                                  │
│  Strong:                                                        │
│  - Always read latest write                                     │
│  - Like SQL database                                            │
│  - Highest latency, highest cost                                │
│  - Use: Financial transactions                                  │
│                                                                  │
│  Bounded Staleness:                                             │
│  - Reads may lag by K versions or T time                        │
│  - Guaranteed order                                             │
│  - Use: Leaderboards, stock tickers                             │
│                                                                  │
│  Session (DEFAULT - recommended):                               │
│  - Within a session, reads your own writes                      │
│  - Other sessions may see older data                            │
│  - Best balance of consistency and performance                  │
│  - Use: Most applications                                       │
│                                                                  │
│  Consistent Prefix:                                             │
│  - Reads never see out-of-order writes                          │
│  - May see older data                                           │
│  - Use: Social media feeds                                      │
│                                                                  │
│  Eventual:                                                      │
│  - No ordering guarantee                                        │
│  - Fastest, cheapest                                            │
│  - Use: Likes count, page views                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Request Units (RU) Explained

```
┌──────────────────────────────────────────────────────────────┐
│  REQUEST UNITS (RU)                                           │
│                                                               │
│  RU = Currency of Cosmos DB                                  │
│  Every operation costs RUs                                   │
│                                                               │
│  1 RU = Read a single 1 KB item by ID                       │
│                                                               │
│  Examples:                                                    │
│  ┌────────────────────────────────────────────────────┐     │
│  │ Operation                          │ Cost (approx) │     │
│  ├────────────────────────────────────┼───────────────┤     │
│  │ Read 1 KB item by ID              │ 1 RU          │     │
│  │ Read 1 KB item by query           │ ~3 RU         │     │
│  │ Write 1 KB item                   │ ~6 RU         │     │
│  │ Read 10 KB item by ID             │ ~10 RU        │     │
│  │ Query with filter (no index)      │ ~50+ RU       │     │
│  │ Cross-partition query             │ ~10+ RU       │     │
│  └────────────────────────────────────┴───────────────┘     │
│                                                               │
│  Provisioned Throughput:                                     │
│  - Set RU/s (e.g., 400 RU/s)                               │
│  - Pay fixed monthly cost                                    │
│  - Requests throttled if exceed limit                       │
│                                                               │
│  Serverless:                                                 │
│  - Pay per RU consumed                                      │
│  - No provisioning needed                                   │
│  - Best for dev/test and spiky workloads                    │
│                                                               │
│  Autoscale:                                                  │
│  - Set max RU/s (e.g., 4000 RU/s)                          │
│  - Scales between 10% and max                               │
│  - Pay for actual usage                                     │
│  - Best for production with variable load                   │
└──────────────────────────────────────────────────────────────┘
```

### Multiple APIs

```
┌──────────────────────────────────────────────────────────────┐
│  COSMOS DB APIs                                               │
│                                                               │
│  ┌──────────────┐                                            │
│  │ NoSQL API    │ ← Most popular, native Cosmos DB          │
│  │ (SQL-like)   │   Query: SELECT * FROM c WHERE c.age > 25│
│  └──────────────┘                                            │
│                                                               │
│  ┌──────────────┐                                            │
│  │ MongoDB API  │ ← Compatible with MongoDB drivers         │
│  │              │   Migrate from MongoDB easily             │
│  └──────────────┘                                            │
│                                                               │
│  ┌──────────────┐                                            │
│  │ Cassandra API│ ← Compatible with Apache Cassandra        │
│  │              │   CQL queries                             │
│  └──────────────┘                                            │
│                                                               │
│  ┌──────────────┐                                            │
│  │ Gremlin API  │ ← Graph database                          │
│  │              │   Relationships and traversals            │
│  └──────────────┘                                            │
│                                                               │
│  ┌──────────────┐                                            │
│  │ Table API    │ ← Compatible with Azure Table Storage     │
│  │              │   Key-value store                         │
│  └──────────────┘                                            │
│                                                               │
│  All APIs share the same underlying engine!                  │
│  Same global distribution, consistency, SLA                  │
└──────────────────────────────────────────────────────────────┘
```

### Lab: Cosmos DB Global Distribution

**Prerequisites:** Cosmos DB account from Day 23 Lab 4.

### Step 1: Add Read Region

1. Go to **"Azure Cosmos DB"** → **"cosmosdb-day23-demo"**
2. In left menu, click **"Replicate data globally"** (under Settings)
3. On the map, click on **"West Europe"** region
4. Click **"Save"**

**⏱️ Wait**: 5-10 minutes

**✅ Result**: Data now replicated to West Europe!

### Step 2: Verify Replication

1. Go to **"Replicate data globally"**
2. You should see:

```
Write Region: East US ✅
Read Region: West Europe ✅
```

### Step 3: Test Read from Different Region

1. Go to **"Data Explorer"**
2. Run query:

```sql
SELECT * FROM c
```

3. Check **"Query Stats"** tab:
   - **Request Charge**: Shows RU cost
   - **Activity ID**: Shows which region served the query

### Step 4: Test, Check, and Confirm - Cosmos DB Global

**Test 1: Verify Regions**

1. Go to **"Replicate data globally"**

**Expected Result:**
```
✅ Write region: East US
✅ Read region: West Europe
✅ Status: Online for both
```

**Test 2: Verify Data in Both Regions**

```sql
SELECT COUNT(1) AS total FROM c
```

**Expected Result:**
```
✅ Same count in both regions
✅ Data replicated correctly
```

**Test 3: Check Consistency Level**

1. Go to **"Default consistency"** (under Settings)

**Expected Result:**
```
✅ Default: Session
✅ Can change to: Strong, Bounded Staleness, Consistent Prefix, Eventual
```

**Test 4: Check RU Consumption**

1. Go to **"Metrics"** (under Monitoring)
2. Select: **"Total Request Units"**

**Expected Result:**
```
✅ RU consumption visible
✅ Low usage for lab
✅ No throttling (429 errors)
```

**Test 5: Remove Read Region (Cost Saving)**

1. Go to **"Replicate data globally"**
2. Click **"X"** next to West Europe
3. Click **"Save"**

**Expected Result:**
```
✅ Region removed
✅ Data still in East US
✅ Cost reduced
```

**✅ Result**: Cosmos DB global distribution tested!

---

## Azure Databricks

### What is Azure Databricks?

**Azure Databricks** = Unified analytics platform for big data and AI.

Built on **Apache Spark**, optimized for Azure.

### Why Databricks?

```
┌──────────────────────────────────────────────────────────────┐
│  TRADITIONAL DATA PROCESSING                                  │
│                                                               │
│  Problem: You have HUGE amounts of data                      │
│  - Millions of rows                                          │
│  - Terabytes of data                                         │
│  - Complex transformations                                   │
│  - Machine learning                                          │
│                                                               │
│  Regular database: Too slow for big data processing          │
│  Regular Python: Can't handle terabytes in memory            │
│                                                               │
│  Solution: Apache Spark (distributed processing)             │
│  - Splits data across many machines                          │
│  - Processes in parallel                                     │
│  - Handles petabytes of data                                 │
│  - 100x faster than traditional methods                      │
│                                                               │
│  Azure Databricks = Managed Apache Spark + Notebooks + AI    │
└──────────────────────────────────────────────────────────────┘
```

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    AZURE DATABRICKS                               │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Databricks Workspace                                      │  │
│  │                                                             │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │  │
│  │  │ Notebooks    │  │ Jobs         │  │ ML Models    │   │  │
│  │  │ (Code)       │  │ (Scheduled)  │  │ (AI/ML)      │   │  │
│  │  │              │  │              │  │              │   │  │
│  │  │ Python       │  │ ETL          │  │ Training     │   │  │
│  │  │ SQL          │  │ Pipelines    │  │ Inference    │   │  │
│  │  │ Scala        │  │ Reports      │  │ MLflow       │   │  │
│  │  │ R            │  │              │  │              │   │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │  │
│  │                                                             │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  Spark Cluster                                       │  │  │
│  │  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐      │  │  │
│  │  │  │ Driver │ │Worker 1│ │Worker 2│ │Worker 3│      │  │  │
│  │  │  │ Node   │ │ Node   │ │ Node   │ │ Node   │      │  │  │
│  │  │  └────────┘ └────────┘ └────────┘ └────────┘      │  │  │
│  │  │  Auto-scaling: 1-10 workers                         │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Data Sources:                                                   │
│  ├─ Azure Blob Storage                                          │
│  ├─ Azure Data Lake Storage                                     │
│  ├─ Azure SQL Database                                          │
│  ├─ Azure Cosmos DB                                             │
│  ├─ Azure Event Hubs                                            │
│  └─ External sources (S3, JDBC, etc.)                           │
└─────────────────────────────────────────────────────────────────┘
```

### Key Concepts

```
┌──────────────────────────────────────────────────────────────┐
│  DATABRICKS KEY CONCEPTS                                      │
│                                                               │
│  1. Workspace:                                               │
│     - Your Databricks environment                            │
│     - Contains notebooks, clusters, jobs                     │
│     - Like a project folder                                  │
│                                                               │
│  2. Notebook:                                                │
│     - Interactive code editor                                │
│     - Like Jupyter Notebook                                  │
│     - Supports Python, SQL, Scala, R                        │
│     - Run code cell by cell                                  │
│                                                               │
│  3. Cluster:                                                 │
│     - Group of VMs running Spark                             │
│     - Driver node + Worker nodes                             │
│     - Auto-scaling                                           │
│     - Auto-terminates when idle                              │
│                                                               │
│  4. Job:                                                     │
│     - Scheduled notebook execution                           │
│     - ETL pipelines                                          │
│     - Automated reports                                      │
│                                                               │
│  5. Delta Lake:                                              │
│     - Open-source storage layer                              │
│     - ACID transactions on data lake                         │
│     - Time travel (query old versions)                       │
│     - Schema enforcement                                     │
└──────────────────────────────────────────────────────────────┘
```

### Use Cases

```
┌──────────────────────────────────────────────────────────────┐
│  DATABRICKS USE CASES                                         │
│                                                               │
│  1. ETL (Extract, Transform, Load):                          │
│     Raw Data → Clean → Transform → Load to Database          │
│     Example: Process 1TB of log files daily                  │
│                                                               │
│  2. Data Analytics:                                          │
│     SQL queries on massive datasets                          │
│     Example: Analyze 1 billion transactions                  │
│                                                               │
│  3. Machine Learning:                                        │
│     Train ML models on big data                              │
│     Example: Recommendation engine                           │
│                                                               │
│  4. Real-Time Streaming:                                     │
│     Process data as it arrives                               │
│     Example: IoT sensor data processing                      │
│                                                               │
│  5. Data Lakehouse:                                          │
│     Combine data lake + data warehouse                       │
│     Example: Unified analytics platform                      │
└──────────────────────────────────────────────────────────────┘
```

### Lab: Create Databricks Workspace

### Step 1: Create Workspace

1. Search for **"Azure Databricks"**
2. Click **"+ Create"**

**Basics Tab:**
- **Subscription**: Your subscription
- **Resource group**: `rg-database-lab`
- **Workspace name**: `databricks-day23-demo`
- **Region**: `East US`
- **Pricing tier**: `Trial (Premium - 14 Days Free DBUs)`

Click **"Review + create"** → **"Create"**

**⏱️ Wait**: 3-5 minutes

### Step 2: Launch Workspace

1. Go to **"Azure Databricks"** → **"databricks-day23-demo"**
2. Click **"Launch Workspace"**
3. Databricks workspace opens in new tab

### Step 3: Create Cluster

1. In Databricks workspace, click **"Compute"** (left menu)
2. Click **"Create compute"**

**Cluster configuration:**
- **Cluster name**: `demo-cluster`
- **Cluster mode**: `Single Node` (cheapest for lab)
- **Databricks runtime version**: Latest LTS
- **Node type**: `Standard_DS3_v2` (or cheapest available)
- **Terminate after**: `30 minutes of inactivity`

Click **"Create Compute"**

**⏱️ Wait**: 5-10 minutes

### Step 4: Create Notebook and Run Code

1. Click **"Workspace"** (left menu)
2. Click **"Create"** → **"Notebook"**
3. **Name**: `Day23-Demo`
4. **Language**: `Python`
5. **Cluster**: `demo-cluster`

**Cell 1: Create sample data**

```python
# Create sample data
data = [
    (1, "John", "Engineering", 85000),
    (2, "Jane", "Marketing", 75000),
    (3, "Bob", "Engineering", 90000),
    (4, "Alice", "HR", 70000),
    (5, "Charlie", "Engineering", 95000),
    (6, "Diana", "Sales", 80000)
]

columns = ["id", "name", "department", "salary"]

# Create DataFrame
df = spark.createDataFrame(data, columns)

# Show data
df.show()
```

Click **Run** (Shift+Enter)

**Expected Output:**
```
+---+-------+-----------+------+
| id|   name| department|salary|
+---+-------+-----------+------+
|  1|   John|Engineering| 85000|
|  2|   Jane|  Marketing| 75000|
|  3|    Bob|Engineering| 90000|
|  4|  Alice|         HR| 70000|
|  5|Charlie|Engineering| 95000|
|  6|  Diana|      Sales| 80000|
+---+-------+-----------+------+
```

**Cell 2: SQL queries on DataFrame**

```python
# Register as temp view
df.createOrReplaceTempView("employees")

# Run SQL
result = spark.sql("""
    SELECT department, 
           COUNT(*) as count, 
           AVG(salary) as avg_salary,
           MAX(salary) as max_salary
    FROM employees 
    GROUP BY department 
    ORDER BY avg_salary DESC
""")

result.show()
```

**Expected Output:**
```
+-----------+-----+----------+----------+
| department|count|avg_salary|max_salary|
+-----------+-----+----------+----------+
|Engineering|    3|   90000.0|     95000|
|      Sales|    1|   80000.0|     80000|
|  Marketing|    1|   75000.0|     75000|
|         HR|    1|   70000.0|     70000|
+-----------+-----+----------+----------+
```

**Cell 3: Data visualization**

```python
# Create visualization
display(result)
```

Click the chart icon to create bar chart, pie chart, etc.

**Cell 4: Write to Delta Lake**

```python
# Write to Delta format
df.write.format("delta").mode("overwrite").save("/tmp/employees_delta")

# Read from Delta
delta_df = spark.read.format("delta").load("/tmp/employees_delta")
delta_df.show()

print(f"Total records: {delta_df.count()}")
```

**Expected Output:**
```
+---+-------+-----------+------+
| id|   name| department|salary|
+---+-------+-----------+------+
...
Total records: 6
```

### Step 5: Test, Check, and Confirm - Databricks

**Test 1: Verify Workspace**

1. Go to Azure Portal → **"Azure Databricks"**

**Expected Result:**
```
✅ Workspace: databricks-day23-demo
✅ Status: Active
✅ Pricing tier: Trial
✅ URL: Available
```

**Test 2: Verify Cluster**

1. In Databricks, go to **"Compute"**

**Expected Result:**
```
✅ Cluster: demo-cluster
✅ State: Running
✅ Runtime: Latest LTS
✅ Auto-terminate: 30 minutes
```

**Test 3: Verify Notebook Execution**

Run all cells in notebook.

**Expected Result:**
```
✅ All cells execute without errors
✅ DataFrame created with 6 rows
✅ SQL queries return correct results
✅ Delta Lake write/read works
```

**Test 4: Verify Delta Lake**

```python
# Check Delta table history
from delta.tables import DeltaTable
dt = DeltaTable.forPath(spark, "/tmp/employees_delta")
dt.history().show()
```

**Expected Result:**
```
✅ History shows write operation
✅ Version 0 available
✅ Delta format working
```

**✅ Result**: Databricks fully tested!

**⚠️ Important:** Terminate cluster when done to avoid charges!

1. Go to **"Compute"**
2. Click on cluster
3. Click **"Terminate"**

---


## Choosing the Right Service

### Decision Matrix

```
┌─────────────────────────────────────────────────────────────────┐
│                    WHICH SERVICE TO USE?                          │
│                                                                  │
│  "I need a relational database for a new app"                   │
│  → Azure SQL Database                                           │
│                                                                  │
│  "I need to migrate my on-premises SQL Server"                  │
│  → SQL Managed Instance (if need SQL Agent, cross-DB queries)   │
│  → Azure SQL Database (if simple migration)                     │
│                                                                  │
│  "I need 100% SQL Server compatibility"                         │
│  → SQL Server on Azure VM                                       │
│                                                                  │
│  "I need open-source database"                                  │
│  → PostgreSQL (advanced features, JSON)                         │
│  → MySQL (simple, web apps, WordPress)                          │
│                                                                  │
│  "I need global distribution and low latency"                   │
│  → Azure Cosmos DB                                              │
│                                                                  │
│  "I need fast caching"                                          │
│  → Azure Cache for Redis                                        │
│                                                                  │
│  "I need to process terabytes of data"                          │
│  → Azure Databricks                                             │
│                                                                  │
│  "I need automatic failover across regions"                     │
│  → Azure SQL Failover Groups                                    │
│  → Azure Cosmos DB (built-in multi-region)                      │
│                                                                  │
│  "I need the cheapest option"                                   │
│  → Azure SQL Database Basic ($5/month)                          │
│  → Cosmos DB Serverless (pay per request)                       │
└─────────────────────────────────────────────────────────────────┘
```

### Complete Comparison

| Feature | SQL Database | SQL MI | SQL on VM | PostgreSQL | MySQL | Cosmos DB | Redis | Databricks |
|---------|-------------|--------|-----------|------------|-------|-----------|-------|------------|
| Type | PaaS | PaaS | IaaS | PaaS | PaaS | PaaS | PaaS | PaaS |
| Model | Relational | Relational | Relational | Relational | Relational | NoSQL | Cache | Analytics |
| Compat | ~95% | ~99% | 100% | Native | Native | Multi-API | Native | Spark |
| HA | Built-in | Built-in | Manual | Built-in | Built-in | Built-in | Tier-based | Built-in |
| DR | Geo-rep/FG | Geo-rep/FG | Manual | Read replica | Read replica | Multi-region | Manual | N/A |
| Min Cost | $5/mo | $350/mo | $75/mo | $13/mo | $13/mo | $0 (serverless) | $16/mo | Pay per use |
| Max Size | 100 TB | 16 TB | Unlimited | 16 TB | 16 TB | Unlimited | 120 GB | Unlimited |
| Global | Geo-rep | Geo-rep | Manual | Read replica | Read replica | Native | No | No |

### Migration Paths

```
┌──────────────────────────────────────────────────────────────┐
│  FROM ON-PREMISES TO AZURE                                    │
│                                                               │
│  SQL Server → Azure SQL Database                             │
│  (Simple apps, no SQL Agent needed)                          │
│                                                               │
│  SQL Server → SQL Managed Instance                           │
│  (Complex apps, need SQL Agent, cross-DB queries)            │
│                                                               │
│  SQL Server → SQL Server on Azure VM                         │
│  (Need 100% compatibility, SSIS/SSRS/SSAS)                  │
│                                                               │
│  PostgreSQL → Azure Database for PostgreSQL                  │
│  (Direct migration, minimal changes)                         │
│                                                               │
│  MySQL → Azure Database for MySQL                            │
│  (Direct migration, minimal changes)                         │
│                                                               │
│  MongoDB → Azure Cosmos DB (MongoDB API)                     │
│  (Use existing MongoDB drivers)                              │
│                                                               │
│  Cassandra → Azure Cosmos DB (Cassandra API)                 │
│  (Use existing CQL queries)                                  │
│                                                               │
│  Hadoop/Spark → Azure Databricks                             │
│  (Managed Spark, better performance)                         │
└──────────────────────────────────────────────────────────────┘
```

---

## Summary

### What We Learned

**Azure SQL Database Deep Dive:**
- ✅ Purchasing models (DTU vs vCore)
- ✅ Service tiers (General Purpose, Business Critical, Hyperscale)
- ✅ Architecture and management

**High Availability & Disaster Recovery:**
- ✅ HA within a region (automatic)
- ✅ DR across regions (geo-replication)
- ✅ RPO and RTO concepts
- ✅ HA architecture by tier

**Active Geo-Replication:**
- ✅ Asynchronous replication to another region
- ✅ Up to 4 readable secondaries
- ✅ Manual failover
- ✅ Lab: Setup and test geo-replication

**Failover Groups:**
- ✅ Automatic geo-failover
- ✅ DNS-based endpoints (no app change needed)
- ✅ Grace period configuration
- ✅ Lab: Setup, failover, and failback

**SQL Managed Instance:**
- ✅ Near 100% SQL Server compatibility
- ✅ Cross-database queries, SQL Agent, CLR
- ✅ VNet integration (private by default)
- ✅ Best for lift-and-shift migrations

**SQL Server on Azure VMs:**
- ✅ Full SQL Server on VM (IaaS)
- ✅ 100% compatibility
- ✅ SSIS, SSRS, SSAS support
- ✅ BYOL licensing option

**Cosmos DB Deep Dive:**
- ✅ Global distribution with multi-region reads
- ✅ 5 consistency levels
- ✅ Request Units (RU) explained
- ✅ Multiple APIs (NoSQL, MongoDB, Cassandra, Gremlin, Table)
- ✅ Lab: Add read region and test

**Azure Databricks:**
- ✅ Managed Apache Spark
- ✅ Notebooks, clusters, jobs
- ✅ Delta Lake
- ✅ Lab: Create workspace, cluster, run code

---

## Cleanup

**Delete resources to avoid charges:**

```bash
# Delete resource group (deletes everything)
az group delete --name rg-database-lab --yes --no-wait
```

**Or via Portal:**
1. Go to **"Resource groups"** → **"rg-database-lab"**
2. Click **"Delete resource group"**
3. Type name to confirm
4. Click **"Delete"**

**⚠️ Important:** Make sure to:
- Terminate Databricks cluster
- Delete Cosmos DB read regions first
- Remove failover groups before deleting servers

---

## Quick Reference

### Service Endpoints

```
Azure SQL:     myserver.database.windows.net:1433
PostgreSQL:    myserver.postgres.database.azure.com:5432
MySQL:         myserver.mysql.database.azure.com:3306
Cosmos DB:     myaccount.documents.azure.com:443
Redis:         myredis.redis.cache.windows.net:6380
SQL MI:        myinstance.abc123.database.windows.net:1433
Failover Group: myfg.database.windows.net:1433
```

### Key Differences at a Glance

```
Need cheapest?          → Azure SQL Database Basic ($5/mo)
Need open source?       → PostgreSQL or MySQL
Need global?            → Cosmos DB
Need caching?           → Redis
Need big data?          → Databricks
Need SQL Server compat? → SQL MI or SQL on VM
Need auto-failover?     → Failover Groups
```

---

**🎉 Congratulations!** You've completed the advanced Azure Database guide covering HA/DR, geo-replication, failover groups, managed instances, Cosmos DB global distribution, and Databricks!

