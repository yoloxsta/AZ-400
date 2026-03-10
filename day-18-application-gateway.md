# Day 18: Azure Application Gateway - Path & Host Based Routing

## What You'll Learn

This guide shows you how to configure Azure Application Gateway with:
- ✅ Path-based routing (route by URL path)
- ✅ Host-based routing (route by hostname)
- ✅ Multiple backend VMs with nginx
- ✅ Health probes
- ✅ Complete testing and verification
- ✅ All via Azure Portal (GUI)

## What is Azure Application Gateway?

**Azure Application Gateway** is a Layer 7 (HTTP/HTTPS) load balancer that provides:
- URL-based routing
- SSL termination
- Web Application Firewall (WAF)
- Session affinity
- Custom health probes
- Autoscaling

## Architecture

```
Internet
    ↓
Azure Application Gateway (Public IP)
    ├─ Path-based routing
    │  ├─ /api/* → Backend Pool 1 (VM1, VM2)
    │  └─ /web/* → Backend Pool 2 (VM3, VM4)
    │
    └─ Host-based routing
       ├─ app1.example.com → Backend Pool 1
       └─ app2.example.com → Backend Pool 2
```

**What we'll build:**
- 1 VNet with 2 subnets
- 4 VMs running nginx (2 for API, 2 for Web)
- 1 Application Gateway with public IP
- Path-based rules (/api, /web)
- Host-based rules (different domains)

---

## Prerequisites

- Azure subscription
- Azure Portal access
- Basic understanding of networking
- ~2 hours for completion

---

## Part 1: Create Resource Group

### Step 1: Navigate to Resource Groups

1. Open Azure Portal: https://portal.azure.com
2. Search for **"Resource groups"**
3. Click **"+ Create"**

### Step 2: Create Resource Group

1. **Subscription**: Select your subscription
2. **Resource group**: `rg-appgw-demo`
3. **Region**: `East US`
4. Click **"Review + create"**
5. Click **"Create"**

**✅ Result**: Resource group created

---

## Part 2: Create Virtual Network

### Step 1: Navigate to Virtual Networks

1. Search for **"Virtual networks"**
2. Click **"+ Create"**

### Step 2: Basics Tab

1. **Subscription**: Your subscription
2. **Resource group**: `rg-appgw-demo`
3. **Name**: `vnet-appgw`
4. **Region**: `East US`
5. Click **"Next: IP Addresses"**

### Step 3: IP Addresses Tab

1. **IPv4 address space**: `10.0.0.0/16`
2. Click **"+ Add subnet"**

**Subnet 1 - Application Gateway:**
- **Name**: `subnet-appgw`
- **Subnet address range**: `10.0.1.0/24`
- Click **"Add"**

3. Click **"+ Add subnet"** again

**Subnet 2 - VMs:**
- **Name**: `subnet-vms`
- **Subnet address range**: `10.0.2.0/24`
- Click **"Add"**

4. Click **"Review + create"**
5. Click **"Create"**

**✅ Result**: VNet with 2 subnets created

---

## Part 3: Create Virtual Machines

We'll create 4 VMs with nginx:
- VM1 & VM2: API backend (will show "API Server")
- VM3 & VM4: Web backend (will show "Web Server")

### Step 1: Create VM1 (API Server 1)

1. Search for **"Virtual machines"**
2. Click **"+ Create"** → **"Azure virtual machine"**

**Basics Tab:**
1. **Subscription**: Your subscription
2. **Resource group**: `rg-appgw-demo`
3. **Virtual machine name**: `vm-api-1`
4. **Region**: `East US`
5. **Availability options**: `No infrastructure redundancy required`
6. **Security type**: `Standard`
7. **Image**: `Ubuntu Server 22.04 LTS - x64 Gen2`
8. **Size**: `Standard_B1s` (1 vCPU, 1 GB RAM)
9. **Authentication type**: `Password`
10. **Username**: `azureuser`
11. **Password**: `P@ssw0rd123!` (use a strong password!)
12. **Confirm password**: `P@ssw0rd123!`
13. **Public inbound ports**: `Allow selected ports`
14. **Select inbound ports**: `HTTP (80)`, `SSH (22)`

**Networking Tab:**
1. Click **"Next: Disks"** → Click **"Next: Networking"**
2. **Virtual network**: `vnet-appgw`
3. **Subnet**: `subnet-vms (10.0.2.0/24)`
4. **Public IP**: `(new) vm-api-1-ip`
5. **NIC network security group**: `Basic`
6. **Public inbound ports**: `Allow selected ports`
7. **Select inbound ports**: `HTTP (80)`, `SSH (22)`

**Advanced Tab:**
1. Click **"Next: Management"** → **"Next: Monitoring"** → **"Next: Advanced"**
2. **Custom data**: Paste this script:

```bash
#!/bin/bash
apt-get update
apt-get install -y nginx
cat > /var/www/html/index.html <<EOF
<!DOCTYPE html>
<html>
<head><title>API Server 1</title></head>
<body style="background-color:#e3f2fd;text-align:center;padding:50px;">
<h1>API Server 1</h1>
<p>Hostname: $(hostname)</p>
<p>IP Address: $(hostname -I)</p>
<p>This is the API backend</p>
</body>
</html>
EOF
systemctl restart nginx
```

3. Click **"Review + create"**
4. Click **"Create"**

**⏱️ Wait**: 3-5 minutes for VM to deploy


### Step 2: Create VM2 (API Server 2)

Repeat the same process with these changes:
- **Virtual machine name**: `vm-api-2`
- **Public IP**: `(new) vm-api-2-ip`
- **Custom data**: Change "API Server 1" to "API Server 2"

```bash
#!/bin/bash
apt-get update
apt-get install -y nginx
cat > /var/www/html/index.html <<EOF
<!DOCTYPE html>
<html>
<head><title>API Server 2</title></head>
<body style="background-color:#e3f2fd;text-align:center;padding:50px;">
<h1>API Server 2</h1>
<p>Hostname: $(hostname)</p>
<p>IP Address: $(hostname -I)</p>
<p>This is the API backend</p>
</body>
</html>
EOF
systemctl restart nginx
```

### Step 3: Create VM3 (Web Server 1)

Repeat with these changes:
- **Virtual machine name**: `vm-web-1`
- **Public IP**: `(new) vm-web-1-ip`
- **Custom data**: Change to "Web Server 1"

```bash
#!/bin/bash
apt-get update
apt-get install -y nginx
cat > /var/www/html/index.html <<EOF
<!DOCTYPE html>
<html>
<head><title>Web Server 1</title></head>
<body style="background-color:#fff3e0;text-align:center;padding:50px;">
<h1>Web Server 1</h1>
<p>Hostname: $(hostname)</p>
<p>IP Address: $(hostname -I)</p>
<p>This is the Web backend</p>
</body>
</html>
EOF
systemctl restart nginx
```

### Step 4: Create VM4 (Web Server 2)

Repeat with these changes:
- **Virtual machine name**: `vm-web-2`
- **Public IP**: `(new) vm-web-2-ip`
- **Custom data**: Change to "Web Server 2"

```bash
#!/bin/bash
apt-get update
apt-get install -y nginx
cat > /var/www/html/index.html <<EOF
<!DOCTYPE html>
<html>
<head><title>Web Server 2</title></head>
<body style="background-color:#fff3e0;text-align:center;padding:50px;">
<h1>Web Server 2</h1>
<p>Hostname: $(hostname)</p>
<p>IP Address: $(hostname -I)</p>
<p>This is the Web backend</p>
</body>
</html>
EOF
systemctl restart nginx
```

**⏱️ Wait**: 10-15 minutes for all VMs to deploy

### Step 5: Verify VMs

1. Go to **"Virtual machines"**
2. Check all 4 VMs are **"Running"**
3. Note down private IP addresses:

```
vm-api-1: 10.0.2.x
vm-api-2: 10.0.2.x
vm-web-1: 10.0.2.x
vm-web-2: 10.0.2.x
```

### Step 6: Test VMs Directly

For each VM:
1. Go to VM overview page
2. Copy **Public IP address**
3. Open in browser: `http://<public-ip>`
4. Verify nginx page shows correct server name

**Expected:**
- vm-api-1: Blue page "API Server 1"
- vm-api-2: Blue page "API Server 2"
- vm-web-1: Orange page "Web Server 1"
- vm-web-2: Orange page "Web Server 2"

**✅ Result**: 4 VMs running nginx with custom pages

---

## Part 4: Create Application Gateway

### Step 1: Navigate to Application Gateway

1. Search for **"Application gateways"**
2. Click **"+ Create"**

### Step 2: Basics Tab

1. **Subscription**: Your subscription
2. **Resource group**: `rg-appgw-demo`
3. **Application gateway name**: `appgw-demo`
4. **Region**: `East US`
5. **Tier**: `Standard V2`
6. **Enable autoscaling**: `No`
7. **Instance count**: `2`
8. **Availability zone**: `None`
9. **HTTP2**: `Enabled`
10. **Virtual network**: `vnet-appgw`
11. **Subnet**: `subnet-appgw (10.0.1.0/24)`

### Step 3: Frontends Tab

1. Click **"Next: Frontends"**
2. **Frontend IP address type**: `Public`
3. **Public IP address**: Click **"Add new"**
   - **Name**: `appgw-public-ip`
   - **SKU**: `Standard`
   - **Assignment**: `Static`
   - Click **"OK"**

### Step 4: Backends Tab

1. Click **"Next: Backends"**
2. Click **"+ Add a backend pool"**

**Backend Pool 1 - API Servers:**
- **Name**: `pool-api`
- **Add backend pool without targets**: `No`
- **Target type**: `Virtual machine`
- **Target**: Select `vm-api-1` (network interface)
- Click **"Add"** to add another target
- **Target type**: `Virtual machine`
- **Target**: Select `vm-api-2` (network interface)
- Click **"Add"**

3. Click **"+ Add a backend pool"** again

**Backend Pool 2 - Web Servers:**
- **Name**: `pool-web`
- **Add backend pool without targets**: `No`
- **Target type**: `Virtual machine`
- **Target**: Select `vm-web-1` (network interface)
- Click **"Add"** to add another target
- **Target type**: `Virtual machine`
- **Target**: Select `vm-web-2` (network interface)
- Click **"Add"**

### Step 5: Configuration Tab

1. Click **"Next: Configuration"**
2. Click **"+ Add a routing rule"**

**Routing Rule 1 - Default:**
- **Rule name**: `rule-default`
- **Priority**: `100`

**Listener Tab:**
- **Listener name**: `listener-http`
- **Frontend IP**: `Public`
- **Protocol**: `HTTP`
- **Port**: `80`
- **Listener type**: `Basic`
- **Error page url**: `No`

**Backend targets Tab:**
- Click **"Backend targets"** tab
- **Target type**: `Backend pool`
- **Backend target**: `pool-api`
- **Backend settings**: Click **"Add new"**
  - **Backend settings name**: `http-settings`
  - **Backend protocol**: `HTTP`
  - **Backend port**: `80`
  - **Cookie-based affinity**: `Disable`
  - **Connection draining**: `Disable`
  - **Request time-out (seconds)**: `20`
  - **Override with new host name**: `No`
  - Click **"Add"**
- Click **"Add"**

3. Click **"Next: Tags"** (skip tags)
4. Click **"Next: Review + create"**
5. Click **"Create"**

**⏱️ Wait**: 15-20 minutes for Application Gateway to deploy

**✅ Result**: Application Gateway created with basic routing

---

## Part 5: Test Basic Routing

### Step 1: Get Application Gateway Public IP

1. Go to **"Application gateways"**
2. Click on **"appgw-demo"**
3. In **"Overview"**, copy **"Frontend public IP address"**

Example: `20.x.x.x`

### Step 2: Test Basic Access

1. Open browser
2. Go to: `http://<appgw-public-ip>`
3. Refresh multiple times

**Expected Result:**
- You should see either "API Server 1" or "API Server 2"
- Refreshing should load balance between both servers
- Blue background (API servers)

**✅ Result**: Basic routing working, load balancing between API servers

---

## Part 6: Configure Path-Based Routing

Now we'll add path-based routing:
- `/api/*` → API backend pool
- `/web/*` → Web backend pool

### Step 1: Navigate to Application Gateway

1. Go to **"Application gateways"** → **"appgw-demo"**
2. In left menu, click **"Rules"**
3. Click on **"rule-default"**

### Step 2: Modify Listener (No changes needed)

1. **Listener** tab should show:
   - Listener name: `listener-http`
   - Protocol: HTTP
   - Port: 80
2. Click **"Backend targets"** tab

### Step 3: Change to Path-based Routing

1. **Target type**: Change from `Backend pool` to `Redirection`... wait, we need to do this differently.

Let's create a new routing rule with path-based routing:

### Step 4: Create Path-Based Routing Rule

1. Go back to **"Rules"**
2. Click **"+ Add routing rule"**

**Routing Rule - Path-based:**
- **Rule name**: `rule-path-based`
- **Priority**: `50` (lower number = higher priority)

**Listener Tab:**
- **Listener name**: `listener-path-based`
- **Frontend IP**: `Public`
- **Protocol**: `HTTP`
- **Port**: `8080` (we'll use different port for now)
- **Listener type**: `Basic`
- Click **"Backend targets"** tab

**Backend targets Tab:**
- **Target type**: `Backend pool`
- **Backend target**: `pool-api` (default)
- **Backend settings**: `http-settings`
- **Path-based routing**: Click **"Add multiple targets to create a path-based rule"**


**Wait!** Let me correct the approach. We need to configure path-based routing properly.

### Step 5: Correct Approach - Update Existing Rule

1. Go to **"Rules"**
2. Click on **"rule-default"**
3. Click **"Backend targets"** tab
4. Check **"Add multiple targets to create a path-based rule"**

**Path-based rule 1:**
- **Path**: `/api/*`
- **Target name**: `target-api`
- **Backend target**: `pool-api`
- **Backend settings**: `http-settings`

5. Click **"Add new path"**

**Path-based rule 2:**
- **Path**: `/web/*`
- **Target name**: `target-web`
- **Backend target**: `pool-web`
- **Backend settings**: `http-settings`

6. **Default backend target** (for paths not matching above):
   - **Backend target**: `pool-api`
   - **Backend settings**: `http-settings`

7. Click **"Update"**

**⏱️ Wait**: 2-3 minutes for configuration to apply

**✅ Result**: Path-based routing configured

---

## Part 7: Test Path-Based Routing

### Step 1: Test API Path

1. Open browser
2. Go to: `http://<appgw-public-ip>/api/`
3. Refresh multiple times

**Expected:**
- Blue page showing "API Server 1" or "API Server 2"
- Load balances between both API servers

### Step 2: Test Web Path

1. Go to: `http://<appgw-public-ip>/web/`
2. Refresh multiple times

**Expected:**
- Orange page showing "Web Server 1" or "Web Server 2"
- Load balances between both Web servers

### Step 3: Test Default Path

1. Go to: `http://<appgw-public-ip>/`
2. Should route to default backend (API pool)

**✅ Result**: Path-based routing working!

**What we proved:**
- ✅ `/api/*` routes to API backend pool
- ✅ `/web/*` routes to Web backend pool
- ✅ Load balancing works within each pool
- ✅ Default path routes to API pool

---

## Part 8: Configure Host-Based Routing

Now we'll add host-based routing using different hostnames.

### Step 1: Create New Listener for Host 1

1. Go to **"Application gateways"** → **"appgw-demo"**
2. In left menu, click **"Listeners"**
3. Click **"+ Add listener"**

**Listener for app1.example.com:**
- **Listener name**: `listener-app1`
- **Frontend IP**: `Public`
- **Protocol**: `HTTP`
- **Port**: `81` (different port for testing)
- **Listener type**: `Multi site`
- **Host type**: `Single`
- **Host name**: `app1.example.com`
- **Error page url**: `No`
- Click **"Add"**

### Step 2: Create New Listener for Host 2

1. Click **"+ Add listener"** again

**Listener for app2.example.com:**
- **Listener name**: `listener-app2`
- **Frontend IP**: `Public`
- **Protocol**: `HTTP`
- **Port**: `82` (different port for testing)
- **Listener type**: `Multi site`
- **Host type**: `Single`
- **Host name**: `app2.example.com`
- **Error page url**: `No`
- Click **"Add"**

### Step 3: Create Routing Rule for Host 1

1. Go to **"Rules"**
2. Click **"+ Add routing rule"**

**Routing Rule for app1:**
- **Rule name**: `rule-app1`
- **Priority**: `200`

**Listener Tab:**
- **Listener**: Select `listener-app1`
- Click **"Backend targets"** tab

**Backend targets Tab:**
- **Target type**: `Backend pool`
- **Backend target**: `pool-api`
- **Backend settings**: `http-settings`
- Click **"Add"**

### Step 4: Create Routing Rule for Host 2

1. Click **"+ Add routing rule"** again

**Routing Rule for app2:**
- **Rule name**: `rule-app2`
- **Priority**: `300`

**Listener Tab:**
- **Listener**: Select `listener-app2`
- Click **"Backend targets"** tab

**Backend targets Tab:**
- **Target type**: `Backend pool`
- **Backend target**: `pool-web`
- **Backend settings**: `http-settings`
- Click **"Add"**

**⏱️ Wait**: 2-3 minutes for configuration to apply

**✅ Result**: Host-based routing configured

---

## Part 9: Test Host-Based Routing

Since we don't own `app1.example.com` and `app2.example.com`, we'll use curl with Host header or modify hosts file.

### Method 1: Using curl (Recommended)

**Test app1.example.com (should route to API pool):**

```bash
# Windows PowerShell
curl -H "Host: app1.example.com" http://<appgw-public-ip>:81

# Linux/Mac
curl -H "Host: app1.example.com" http://<appgw-public-ip>:81
```

**Expected:**
- Blue page showing "API Server 1" or "API Server 2"

**Test app2.example.com (should route to Web pool):**

```bash
# Windows PowerShell
curl -H "Host: app2.example.com" http://<appgw-public-ip>:82

# Linux/Mac
curl -H "Host: app2.example.com" http://<appgw-public-ip>:82
```

**Expected:**
- Orange page showing "Web Server 1" or "Web Server 2"

### Method 2: Modify Hosts File (For Browser Testing)

**Windows:**
1. Open Notepad as Administrator
2. Open file: `C:\Windows\System32\drivers\etc\hosts`
3. Add these lines:
```
<appgw-public-ip> app1.example.com
<appgw-public-ip> app2.example.com
```
4. Save file

**Linux/Mac:**
```bash
sudo nano /etc/hosts

# Add these lines:
<appgw-public-ip> app1.example.com
<appgw-public-ip> app2.example.com
```

**Test in browser:**
1. Go to: `http://app1.example.com:81`
   - Should show API servers (blue)
2. Go to: `http://app2.example.com:82`
   - Should show Web servers (orange)

**✅ Result**: Host-based routing working!

**What we proved:**
- ✅ `app1.example.com` routes to API backend pool
- ✅ `app2.example.com` routes to Web backend pool
- ✅ Different hostnames route to different backends

---

## Part 10: Configure Health Probes

Health probes check if backend servers are healthy.

### Step 1: Create Health Probe for API

1. Go to **"Application gateways"** → **"appgw-demo"**
2. In left menu, click **"Health probes"**
3. Click **"+ Add"**

**Health Probe for API:**
- **Name**: `probe-api`
- **Protocol**: `HTTP`
- **Host**: Leave empty (uses backend server hostname)
- **Pick host name from backend settings**: `Yes`
- **Pick port from backend settings**: `Yes`
- **Path**: `/`
- **Interval (seconds)**: `30`
- **Timeout (seconds)**: `30`
- **Unhealthy threshold**: `3`
- Click **"Add"**

### Step 2: Create Health Probe for Web

1. Click **"+ Add"** again

**Health Probe for Web:**
- **Name**: `probe-web`
- **Protocol**: `HTTP`
- **Host**: Leave empty
- **Pick host name from backend settings**: `Yes`
- **Pick port from backend settings**: `Yes`
- **Path**: `/`
- **Interval (seconds)**: `30`
- **Timeout (seconds)**: `30`
- **Unhealthy threshold**: `3`
- Click **"Add"**

### Step 3: Update Backend Settings to Use Probes

1. Go to **"Backend settings"**
2. Click on **"http-settings"**
3. **Custom probe**: Select `probe-api`
4. Click **"Save"**

**Note:** For production, you'd create separate backend settings for each pool with appropriate probes.

### Step 4: Check Backend Health

1. Go to **"Backend health"**
2. Wait 1-2 minutes for health check to complete
3. Verify all backend servers show **"Healthy"**

**Expected:**
```
pool-api
  ├─ vm-api-1: Healthy ✅
  └─ vm-api-2: Healthy ✅

pool-web
  ├─ vm-web-1: Healthy ✅
  └─ vm-web-2: Healthy ✅
```

**✅ Result**: Health probes configured and all backends healthy

---

## Part 11: Complete Test Cases

### Test Case 1: Path-Based Routing - API Path

```bash
# Test /api/ path
curl http://<appgw-public-ip>/api/

# Expected: Blue page with "API Server 1" or "API Server 2"
# Refresh multiple times to see load balancing
```

**✅ Expected Result:**
- Routes to API backend pool
- Load balances between vm-api-1 and vm-api-2
- Blue background

### Test Case 2: Path-Based Routing - Web Path

```bash
# Test /web/ path
curl http://<appgw-public-ip>/web/

# Expected: Orange page with "Web Server 1" or "Web Server 2"
# Refresh multiple times to see load balancing
```

**✅ Expected Result:**
- Routes to Web backend pool
- Load balances between vm-web-1 and vm-web-2
- Orange background

### Test Case 3: Path-Based Routing - Default Path

```bash
# Test default path (no /api or /web)
curl http://<appgw-public-ip>/

# Expected: Routes to default backend (API pool)
```

**✅ Expected Result:**
- Routes to default backend (API pool)
- Blue background

### Test Case 4: Host-Based Routing - app1.example.com

```bash
# Test app1.example.com
curl -H "Host: app1.example.com" http://<appgw-public-ip>:81

# Expected: API servers (blue)
```

**✅ Expected Result:**
- Routes to API backend pool
- Blue background

### Test Case 5: Host-Based Routing - app2.example.com

```bash
# Test app2.example.com
curl -H "Host: app2.example.com" http://<appgw-public-ip>:82

# Expected: Web servers (orange)
```

**✅ Expected Result:**
- Routes to Web backend pool
- Orange background

### Test Case 6: Load Balancing Verification

```bash
# Make 10 requests to /api/
for i in {1..10}; do
  curl -s http://<appgw-public-ip>/api/ | grep "<h1>"
done

# Expected: Mix of "API Server 1" and "API Server 2"
```

**✅ Expected Result:**
- Requests distributed between both API servers
- Roughly 50/50 distribution

### Test Case 7: Backend Health Check

1. Go to Application Gateway → **"Backend health"**
2. Verify all 4 VMs show **"Healthy"**

**✅ Expected Result:**
- All backend servers healthy
- No unhealthy servers

### Test Case 8: Simulate Backend Failure

1. Go to **"Virtual machines"**
2. Select **"vm-api-1"**
3. Click **"Stop"**
4. Wait 2-3 minutes
5. Go to Application Gateway → **"Backend health"**
6. Verify vm-api-1 shows **"Unhealthy"**
7. Test: `curl http://<appgw-public-ip>/api/`
8. Should only show "API Server 2" (vm-api-1 is down)
9. Start vm-api-1 again
10. Wait 2-3 minutes
11. Verify vm-api-1 shows **"Healthy"** again

**✅ Expected Result:**
- Application Gateway detects unhealthy backend
- Routes traffic only to healthy backends
- Automatically recovers when backend is healthy again

---

## Part 12: Verification Checklist

### Infrastructure Verification

```
✅ Resource Group: rg-appgw-demo
✅ VNet: vnet-appgw (10.0.0.0/16)
   ├─ subnet-appgw (10.0.1.0/24)
   └─ subnet-vms (10.0.2.0/24)
✅ VMs: 4 VMs running nginx
   ├─ vm-api-1 (API Server 1)
   ├─ vm-api-2 (API Server 2)
   ├─ vm-web-1 (Web Server 1)
   └─ vm-web-2 (Web Server 2)
✅ Application Gateway: appgw-demo
   ├─ Frontend: Public IP
   ├─ Backend Pools: pool-api, pool-web
   ├─ Listeners: 3 listeners
   └─ Rules: 3 routing rules
```

### Routing Verification

```
✅ Path-based routing:
   ├─ /api/* → pool-api (vm-api-1, vm-api-2)
   └─ /web/* → pool-web (vm-web-1, vm-web-2)

✅ Host-based routing:
   ├─ app1.example.com:81 → pool-api
   └─ app2.example.com:82 → pool-web

✅ Load balancing:
   ├─ API pool: Distributes between 2 VMs
   └─ Web pool: Distributes between 2 VMs

✅ Health probes:
   ├─ probe-api: Monitoring API servers
   └─ probe-web: Monitoring Web servers
```

### Functional Verification

1. **Path-based routing works**: ✅
2. **Host-based routing works**: ✅
3. **Load balancing works**: ✅
4. **Health probes detect failures**: ✅
5. **All backends healthy**: ✅

---

## Part 13: Understanding Application Gateway Components

### Frontend Configuration

**What it is:**
- Public IP address where clients connect
- Entry point for all traffic

**In our setup:**
- 1 public IP address
- Listens on ports 80, 81, 82

### Listeners

**What they are:**
- Define how Application Gateway receives traffic
- Specify protocol, port, and hostname

**In our setup:**
- `listener-http`: Port 80, basic listener
- `listener-app1`: Port 81, multi-site for app1.example.com
- `listener-app2`: Port 82, multi-site for app2.example.com

### Backend Pools

**What they are:**
- Collection of backend servers
- Can contain VMs, VM scale sets, IPs, or FQDNs

**In our setup:**
- `pool-api`: vm-api-1, vm-api-2
- `pool-web`: vm-web-1, vm-web-2

### Backend Settings

**What they are:**
- Configuration for backend communication
- Protocol, port, timeout, health probe

**In our setup:**
- `http-settings`: HTTP, port 80, 20s timeout

### Routing Rules

**What they are:**
- Connect listeners to backend pools
- Define routing logic (path-based, host-based)

**In our setup:**
- `rule-default`: Path-based routing (/api, /web)
- `rule-app1`: Host-based routing (app1.example.com)
- `rule-app2`: Host-based routing (app2.example.com)

### Health Probes

**What they are:**
- Monitor backend server health
- Remove unhealthy servers from rotation

**In our setup:**
- `probe-api`: Checks API servers every 30s
- `probe-web`: Checks Web servers every 30s

---

## Part 14: Traffic Flow Diagrams

### Path-Based Routing Flow

```
Client Request: http://appgw-ip/api/test
    ↓
Application Gateway (Port 80)
    ↓
Listener: listener-http
    ↓
Routing Rule: rule-default
    ↓
Path Match: /api/* → target-api
    ↓
Backend Pool: pool-api
    ↓
Load Balancer: Round-robin
    ├─→ vm-api-1 (10.0.2.x) ✅
    └─→ vm-api-2 (10.0.2.x) ✅
    ↓
Response: "API Server 1" or "API Server 2"
```

### Host-Based Routing Flow

```
Client Request: http://app1.example.com:81
    ↓
Application Gateway (Port 81)
    ↓
Listener: listener-app1 (matches app1.example.com)
    ↓
Routing Rule: rule-app1
    ↓
Backend Pool: pool-api
    ↓
Load Balancer: Round-robin
    ├─→ vm-api-1 ✅
    └─→ vm-api-2 ✅
    ↓
Response: "API Server 1" or "API Server 2"
```

### Health Probe Flow

```
Every 30 seconds:

Application Gateway
    ↓
Health Probe: probe-api
    ↓
Check: GET http://vm-api-1/
    ├─ Response 200 OK → Healthy ✅
    └─ No response/Error → Unhealthy ❌
    ↓
Update Backend Health Status
    ↓
Route traffic only to healthy backends
```

---

## Part 15: Troubleshooting

### Issue 1: Cannot Access Application Gateway

**Symptoms:**
- Browser shows "Cannot connect"
- Timeout errors

**Solutions:**

1. **Check Application Gateway status:**
   - Go to Application Gateway → Overview
   - Verify **Operational state**: Running

2. **Check NSG rules:**
   - Go to subnet-appgw → Network security group
   - Verify inbound rule allows port 80, 81, 82

3. **Check public IP:**
   - Verify public IP is assigned
   - Try ping (may not work if ICMP blocked)

### Issue 2: 502 Bad Gateway Error

**Symptoms:**
- Application Gateway returns 502 error
- Backend servers not responding

**Solutions:**

1. **Check backend health:**
   - Go to Application Gateway → Backend health
   - Verify backends show "Healthy"

2. **Check VM NSG:**
   - Go to each VM → Networking
   - Verify inbound rule allows port 80

3. **Check nginx is running:**
   - SSH to VM: `ssh azureuser@<vm-public-ip>`
   - Check nginx: `sudo systemctl status nginx`
   - Restart if needed: `sudo systemctl restart nginx`

4. **Test VM directly:**
   - Access VM public IP: `http://<vm-public-ip>`
   - Should show nginx page

### Issue 3: Path-Based Routing Not Working

**Symptoms:**
- All paths route to same backend
- /api and /web show same servers

**Solutions:**

1. **Check routing rule configuration:**
   - Go to Rules → rule-default
   - Verify path-based routing is enabled
   - Check paths: /api/*, /web/*

2. **Check priority:**
   - Lower priority number = higher priority
   - Ensure path-based rule has correct priority

3. **Clear browser cache:**
   - Browser may cache responses
   - Try incognito/private mode


### Issue 4: Host-Based Routing Not Working

**Symptoms:**
- Different hostnames route to same backend
- Host header not recognized

**Solutions:**

1. **Check listener type:**
   - Go to Listeners
   - Verify listener type is "Multi site"
   - Check hostname is correct

2. **Test with curl:**
   ```bash
   curl -H "Host: app1.example.com" http://<appgw-ip>:81
   ```

3. **Check hosts file (if using browser):**
   - Verify hosts file has correct entries
   - Windows: `C:\Windows\System32\drivers\etc\hosts`
   - Linux/Mac: `/etc/hosts`

### Issue 5: Load Balancing Not Working

**Symptoms:**
- Always routes to same backend server
- No distribution

**Solutions:**

1. **Check backend pool:**
   - Verify both VMs are in pool
   - Check both VMs are healthy

2. **Disable session affinity:**
   - Go to Backend settings
   - Set "Cookie-based affinity" to "Disable"

3. **Test multiple times:**
   - Make 10+ requests
   - Should see distribution

### Issue 6: Health Probe Showing Unhealthy

**Symptoms:**
- Backend health shows "Unhealthy"
- Traffic not routed to backend

**Solutions:**

1. **Check VM is running:**
   - Go to Virtual machines
   - Verify VM status is "Running"

2. **Check nginx is running:**
   ```bash
   ssh azureuser@<vm-ip>
   sudo systemctl status nginx
   sudo systemctl restart nginx
   ```

3. **Check health probe path:**
   - Go to Health probes
   - Verify path exists on backend (usually `/`)

4. **Check NSG allows traffic:**
   - Verify VM NSG allows port 80 from Application Gateway subnet

---

## Part 16: Cost Breakdown

| Resource | Tier/Size | Cost (USD/month) |
|----------|-----------|------------------|
| Application Gateway V2 | 2 instances | ~$250 |
| Public IP (Static) | Standard | ~$4 |
| VM (4x Standard_B1s) | 1 vCPU, 1 GB RAM each | ~$30 x 4 = $120 |
| VNet | Standard | ~$0 |
| Managed Disks (4x 30GB) | Standard HDD | ~$2 x 4 = $8 |
| **Total** | | **~$382/month** |

**Cost Optimization Tips:**
- Use Basic tier Application Gateway (~$125/month) for dev/test
- Reduce VM count (use 2 VMs instead of 4)
- Use B1ls VMs (~$4/month each) for testing
- Stop VMs when not in use
- Use autoscaling for Application Gateway

**Dev/Test Cost:**
- Application Gateway Basic: ~$125/month
- 2x B1ls VMs: ~$8/month
- Total: ~$133/month

---

## Part 17: Production Recommendations

### 1. Enable WAF (Web Application Firewall)

```
Application Gateway → Web application firewall
- Enable WAF
- Mode: Prevention
- Rule set: OWASP 3.2
```

### 2. Enable SSL/TLS

```
- Upload SSL certificate
- Create HTTPS listener (port 443)
- Redirect HTTP to HTTPS
```

### 3. Enable Autoscaling

```
Application Gateway → Configuration
- Enable autoscaling
- Minimum instances: 2
- Maximum instances: 10
```

### 4. Configure Custom Health Probes

```
- Create dedicated health check endpoints
- Path: /health or /api/health
- Return 200 OK when healthy
```

### 5. Enable Diagnostics

```
Application Gateway → Diagnostic settings
- Enable logs
- Send to Log Analytics workspace
- Monitor access logs, firewall logs
```

### 6. Use VM Scale Sets

Instead of individual VMs:
- Create VM Scale Sets
- Enable autoscaling
- Automatic health monitoring
- Easier management

### 7. Implement Connection Draining

```
Backend settings → Connection draining
- Enable: Yes
- Timeout: 60 seconds
```

### 8. Configure Custom Error Pages

```
Listeners → Error page URL
- Upload custom 502 error page
- Upload custom 403 error page
```

---

## Part 18: Cleanup

### Delete All Resources

**Option 1: Delete Resource Group (Recommended)**

1. Go to **"Resource groups"**
2. Select **"rg-appgw-demo"**
3. Click **"Delete resource group"**
4. Type resource group name to confirm
5. Click **"Delete"**

**⏱️ Wait**: 10-15 minutes for all resources to be deleted

**Option 2: Delete Individual Resources**

If you want to keep some resources:

1. **Delete Application Gateway** (takes 10 min)
   - Go to Application gateways → appgw-demo → Delete

2. **Delete VMs** (takes 5 min each)
   - Go to Virtual machines → Select VM → Delete

3. **Delete Public IPs**
   - Go to Public IP addresses → Delete each

4. **Delete Network Interfaces**
   - Go to Network interfaces → Delete each

5. **Delete VNet**
   - Go to Virtual networks → vnet-appgw → Delete

6. **Delete Resource Group**
   - Go to Resource groups → rg-appgw-demo → Delete

---

## Summary

You've successfully created and tested Azure Application Gateway with path-based and host-based routing!

**What we built:**
- ✅ 1 VNet with 2 subnets
- ✅ 4 VMs running nginx (2 API, 2 Web)
- ✅ 1 Application Gateway with public IP
- ✅ Path-based routing (/api, /web)
- ✅ Host-based routing (app1, app2)
- ✅ Health probes
- ✅ Load balancing

**Architecture:**
```
Internet → Application Gateway → Path/Host Routing → Backend Pools → VMs
```

**Key learnings:**
- ✅ Path-based routing routes by URL path
- ✅ Host-based routing routes by hostname
- ✅ Health probes monitor backend health
- ✅ Load balancing distributes traffic
- ✅ Application Gateway is Layer 7 load balancer
- ✅ Supports multiple routing methods simultaneously


**Routing capabilities:**
- ✅ Path-based: `/api/*` → API pool, `/web/*` → Web pool
- ✅ Host-based: `app1.example.com` → API pool, `app2.example.com` → Web pool
- ✅ Default routing: Unmatched paths → Default pool
- ✅ Priority-based: Lower number = higher priority

**Testing results:**
- ✅ Path-based routing works correctly
- ✅ Host-based routing works correctly
- ✅ Load balancing distributes traffic evenly
- ✅ Health probes detect unhealthy backends
- ✅ Traffic automatically reroutes to healthy backends

**Cost: ~$382/month** (or ~$133/month for dev/test)

**Use cases:**
- ✅ Microservices routing (different paths to different services)
- ✅ Multi-tenant applications (different domains to different backends)
- ✅ API Gateway functionality
- ✅ Blue-green deployments
- ✅ A/B testing
- ✅ Geographic routing

**Comparison with other solutions:**

| Feature | App Gateway | Azure Load Balancer | Traffic Manager | APIM |
|---------|-------------|---------------------|-----------------|------|
| Layer | Layer 7 (HTTP) | Layer 4 (TCP/UDP) | DNS-based | Layer 7 (HTTP) |
| Path routing | ✅ Yes | ❌ No | ❌ No | ✅ Yes |
| Host routing | ✅ Yes | ❌ No | ❌ No | ✅ Yes |
| SSL termination | ✅ Yes | ❌ No | ❌ No | ✅ Yes |
| WAF | ✅ Yes | ❌ No | ❌ No | ❌ No |
| Cost | ~$250/month | ~$20/month | ~$0.50/month | ~$50-2,800/month |
| Best for | Web apps | Any TCP/UDP | Global routing | API management |

**Next steps:**
- Enable WAF for security
- Configure SSL/TLS certificates
- Set up autoscaling
- Implement monitoring and alerts
- Use VM Scale Sets for backends
- Configure custom error pages
- Enable connection draining

Great job! You now understand Azure Application Gateway with path-based and host-based routing! 🚀


---

## Part 19: URL Rewrite - Access /nginx Instead of /

### What is URL Rewrite?

**URL Rewrite** allows you to modify the URL before sending to backend:
- Client requests: `http://appgw-ip/nginx`
- Application Gateway rewrites to: `/`
- Backend receives: `http://backend-vm/`

**Why use it?**
- ✅ Friendly URLs for clients
- ✅ Backend doesn't need to change
- ✅ Hide backend URL structure
- ✅ Support legacy applications

### Architecture

```
Client Request: http://appgw-ip/nginx
    ↓
Application Gateway
    ↓
URL Rewrite: /nginx → /
    ↓
Backend VM: Receives request for /
    ↓
nginx serves: /var/www/html/index.html
    ↓
Response: Default nginx page
```

---

### Step 1: Create New VM for URL Rewrite Demo

1. Go to **"Virtual machines"**
2. Click **"+ Create"** → **"Azure virtual machine"**

**Basics Tab:**
- **Resource group**: `rg-appgw-demo`
- **Virtual machine name**: `vm-nginx-demo`
- **Region**: `East US`
- **Image**: `Ubuntu Server 22.04 LTS`
- **Size**: `Standard_B1s`
- **Username**: `azureuser`
- **Password**: `P@ssw0rd123!`
- **Public inbound ports**: `HTTP (80)`, `SSH (22)`

**Networking Tab:**
- **Virtual network**: `vnet-appgw`
- **Subnet**: `subnet-vms`
- **Public IP**: `(new) vm-nginx-demo-ip`

**Advanced Tab - Custom data:**

```bash
#!/bin/bash
apt-get update
apt-get install -y nginx
# Keep default nginx page (no custom HTML)
systemctl restart nginx
```

3. Click **"Review + create"** → **"Create"**
4. **⏱️ Wait**: 3-5 minutes

### Step 2: Verify Default nginx Page

1. Go to VM overview
2. Copy **Public IP address**
3. Open browser: `http://<vm-public-ip>`
4. **Expected**: Default nginx welcome page

**✅ Result**: VM with default nginx page running

---

### Step 3: Create Backend Pool for nginx Demo

1. Go to **"Application gateways"** → **"appgw-demo"**
2. In left menu, click **"Backend pools"**
3. Click **"+ Add"**

**Backend Pool:**
- **Name**: `pool-nginx-demo`
- **Add backend pool without targets**: `No`
- **Target type**: `Virtual machine`
- **Target**: Select `vm-nginx-demo` (network interface)
- Click **"Add"**

**✅ Result**: New backend pool created

---

### Step 4: Create Rewrite Set

This is the key part - creating URL rewrite rules!

1. In Application Gateway, click **"Rewrites"** in left menu
2. Click **"+ Rewrite set"**

**Rewrite Set:**
- **Name**: `rewrite-nginx`
- **Associated routing rules**: Select `rule-default` (or create new rule)
- Click **"Next: Rewrite rule configuration"**

**Rewrite Rule:**
- Click **"+ Add rewrite rule"**
- **Rewrite rule name**: `rule-nginx-to-root`
- **Rule sequence**: `100`

**Conditions:**
- Click **"+ Add condition"**
- **Type of variable to check**: `Server variable`
- **Server variable**: `uri_path`
- **Case-sensitive**: `No`
- **Operator**: `equal (=)`
- **Pattern to match**: `/nginx`
- Click **"OK"**

**Actions:**
- Click **"+ Add action"**
- **Rewrite type**: `URL`
- **Action type**: `Set`
- **Components**: `URL path`
- **URL path value**: `/`
- Click **"OK"**

3. Click **"Create"**

**⏱️ Wait**: 2-3 minutes for configuration to apply

**✅ Result**: URL rewrite rule created

---

### Step 5: Create Routing Rule for /nginx Path

Now we need to route `/nginx` to our new backend pool.

1. Go to **"Rules"**
2. Click on **"rule-default"**
3. Click **"Backend targets"** tab
4. In the path-based routing section, click **"Add new path"**

**New Path:**
- **Path**: `/nginx`
- **Target name**: `target-nginx-demo`
- **Backend target**: `pool-nginx-demo`
- **Backend settings**: `http-settings`
- **Rewrite set**: Select `rewrite-nginx`

5. Click **"Update"**

**⏱️ Wait**: 2-3 minutes

**✅ Result**: Routing rule configured with URL rewrite

---

### Step 6: Test URL Rewrite

**Test 1: Access via /nginx (should work)**

1. Open browser
2. Go to: `http://<appgw-public-ip>/nginx`
3. **Expected**: Default nginx welcome page

**What happened:**
```
Client → http://appgw-ip/nginx
    ↓
Application Gateway receives: /nginx
    ↓
Rewrite rule matches: /nginx
    ↓
Rewrites URL to: /
    ↓
Sends to backend: http://vm-nginx-demo/
    ↓
nginx serves: Default welcome page
```

**Test 2: Access root directly (should fail or route to different backend)**

1. Go to: `http://<appgw-public-ip>/`
2. **Expected**: Routes to default backend (API pool), not nginx demo

**✅ Result**: URL rewrite working!

---

### Step 7: Verify Rewrite in Backend Health

1. Go to **"Backend health"**
2. Find `pool-nginx-demo`
3. Verify `vm-nginx-demo` shows **"Healthy"**

**✅ Result**: Backend is healthy and receiving rewritten requests

---

### Step 8: Advanced URL Rewrite Examples

#### Example 1: Rewrite with Query String Preservation

**Scenario**: `/nginx?page=1` → `/?page=1`

The rewrite we created automatically preserves query strings!

**Test:**
```bash
curl "http://<appgw-ip>/nginx?test=123"
```

**Expected**: Query string preserved in backend request

#### Example 2: Rewrite Multiple Paths

Add another rewrite rule for `/app` → `/`:

1. Go to **"Rewrites"** → **"rewrite-nginx"**
2. Click **"+ Add rewrite rule"**

**Rewrite Rule:**
- **Name**: `rule-app-to-root`
- **Rule sequence**: `200`

**Condition:**
- **Server variable**: `uri_path`
- **Operator**: `equal (=)`
- **Pattern**: `/app`

**Action:**
- **Rewrite type**: `URL`
- **Action type**: `Set`
- **Components**: `URL path`
- **URL path value**: `/`

3. Click **"OK"** → **"Save"**

Now both `/nginx` and `/app` rewrite to `/`!


#### Example 3: Rewrite with Regex Pattern

**Scenario**: `/nginx/*` → `/*` (strip /nginx prefix)

1. Create new rewrite rule
2. **Condition:**
   - **Server variable**: `uri_path`
   - **Operator**: `Wildcard`
   - **Pattern**: `/nginx/*`

3. **Action:**
   - **Rewrite type**: `URL`
   - **Action type**: `Set`
   - **Components**: `URL path`
   - **URL path value**: `{var_uri_path_1}` (captures everything after /nginx/)

**Example:**
- `/nginx/page1` → `/page1`
- `/nginx/api/users` → `/api/users`

#### Example 4: Rewrite Request Headers

You can also rewrite request headers!

**Add header action:**
- **Rewrite type**: `Request header`
- **Action type**: `Set`
- **Header name**: `X-Original-Path`
- **Header value**: `{var_uri_path}`

This adds a header showing the original path before rewrite.

---

### Step 9: Complete URL Rewrite Test Cases

#### Test Case 1: Basic Rewrite

```bash
# Request /nginx
curl http://<appgw-ip>/nginx

# Expected: Default nginx welcome page
# Backend receives: /
```

**✅ Expected**: Success, shows nginx page

#### Test Case 2: Query String Preservation

```bash
# Request with query string
curl "http://<appgw-ip>/nginx?page=1&sort=asc"

# Expected: Query string preserved
# Backend receives: /?page=1&sort=asc
```

**✅ Expected**: Query string preserved

#### Test Case 3: Non-matching Path

```bash
# Request path that doesn't match rewrite rule
curl http://<appgw-ip>/other

# Expected: Routes to default backend (no rewrite)
```

**✅ Expected**: No rewrite, routes normally

#### Test Case 4: Verify Backend Receives Rewritten URL

SSH to backend VM and check nginx access logs:

```bash
# SSH to VM
ssh azureuser@<vm-nginx-demo-ip>

# Check nginx access logs
sudo tail -f /var/log/nginx/access.log

# Make request from another terminal
curl http://<appgw-ip>/nginx

# In logs, you should see:
# "GET / HTTP/1.1" (not "GET /nginx HTTP/1.1")
```

**✅ Expected**: Logs show `/` not `/nginx`

---

### Step 10: Understanding URL Rewrite Components

#### Server Variables Available

You can use these variables in rewrite rules:

| Variable | Description | Example |
|----------|-------------|---------|
| `uri_path` | Request URI path | `/nginx/page1` |
| `query_string` | Query string | `page=1&sort=asc` |
| `http_host` | Host header | `example.com` |
| `http_method` | HTTP method | `GET`, `POST` |
| `http_user_agent` | User agent | `Mozilla/5.0...` |
| `client_ip` | Client IP address | `1.2.3.4` |
| `server_port` | Server port | `80`, `443` |

#### Rewrite Types

1. **URL Rewrite**
   - Modify URL path
   - Modify query string
   - Invisible to client

2. **Request Header Rewrite**
   - Add/modify/delete request headers
   - Sent to backend

3. **Response Header Rewrite**
   - Add/modify/delete response headers
   - Sent to client

#### Operators

- `equal (=)`: Exact match
- `not equal (!=)`: Not equal
- `greater than (>)`: Numeric comparison
- `less than (<)`: Numeric comparison
- `Wildcard`: Pattern matching with `*`
- `Regular expression`: Regex pattern

---

### Step 11: Real-World Use Cases

#### Use Case 1: API Versioning

**Scenario**: Route `/v1/api` → `/api` on backend

```
Condition: uri_path = /v1/api
Action: Set URL path = /api
```

**Result:**
- Client: `http://appgw-ip/v1/api/users`
- Backend: `http://backend/api/users`

#### Use Case 2: Legacy Application Support

**Scenario**: Old URLs `/old-app/*` → `/new-app/*`

```
Condition: uri_path wildcard /old-app/*
Action: Set URL path = /new-app/{var_uri_path_1}
```

**Result:**
- Client: `http://appgw-ip/old-app/page1`
- Backend: `http://backend/new-app/page1`

#### Use Case 3: Remove File Extensions

**Scenario**: `/page.html` → `/page`

```
Condition: uri_path wildcard *.html
Action: Set URL path = {var_uri_path_without_extension}
```

#### Use Case 4: Add Security Headers

**Scenario**: Add security headers to all responses

```
Action: Set response header
Header name: X-Frame-Options
Header value: DENY
```

---

### Step 12: Troubleshooting URL Rewrite

#### Issue 1: Rewrite Not Working

**Symptoms:**
- Accessing `/nginx` returns 404
- Backend receives `/nginx` instead of `/`

**Solutions:**

1. **Check rewrite set is associated with routing rule:**
   - Go to Rules → rule-default
   - Verify rewrite set is selected

2. **Check condition pattern:**
   - Go to Rewrites → rewrite-nginx
   - Verify pattern matches exactly: `/nginx`
   - Check case-sensitive setting

3. **Check rule sequence:**
   - Lower sequence number = higher priority
   - Ensure no conflicting rules

4. **Test with curl verbose:**
   ```bash
   curl -v http://<appgw-ip>/nginx
   ```

#### Issue 2: Query String Lost

**Symptoms:**
- Query parameters not passed to backend

**Solution:**
- URL rewrite automatically preserves query strings
- If lost, check backend settings
- Verify backend application handles query strings

#### Issue 3: Infinite Redirect Loop

**Symptoms:**
- Browser shows "Too many redirects"

**Solution:**
- Check you're not rewriting to same path
- Verify condition doesn't match rewritten URL
- Example: Don't rewrite `/nginx` → `/nginx`

#### Issue 4: Backend Returns 404

**Symptoms:**
- Rewrite works but backend returns 404

**Solutions:**

1. **Check backend path exists:**
   ```bash
   ssh azureuser@<vm-ip>
   ls -la /var/www/html/
   ```

2. **Check nginx configuration:**
   ```bash
   sudo nginx -t
   sudo cat /etc/nginx/sites-enabled/default
   ```

3. **Check nginx logs:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

---

### Step 13: Verification Checklist for URL Rewrite

```
✅ VM created: vm-nginx-demo
✅ Default nginx page accessible directly
✅ Backend pool created: pool-nginx-demo
✅ Rewrite set created: rewrite-nginx
✅ Rewrite rule created: rule-nginx-to-root
✅ Condition configured: uri_path = /nginx
✅ Action configured: Set URL path = /
✅ Routing rule updated with rewrite set
✅ Backend health shows healthy
✅ Test: /nginx shows nginx page
✅ Test: Query strings preserved
✅ Test: Backend logs show / not /nginx
```

---

### Step 14: Complete Flow Diagram

```
Client Browser
    ↓
Request: http://appgw-ip/nginx?page=1
    ↓
Application Gateway (Public IP)
    ↓
Listener: listener-http (Port 80)
    ↓
Routing Rule: rule-default
    ↓
Path Match: /nginx → target-nginx-demo
    ↓
Rewrite Set: rewrite-nginx
    ↓
Rewrite Rule: rule-nginx-to-root
    ↓
Condition Check: uri_path = /nginx ✅
    ↓
Action: Rewrite URL path to /
    ↓
Modified Request: http://backend/?page=1
    ↓
Backend Pool: pool-nginx-demo
    ↓
Backend VM: vm-nginx-demo
    ↓
nginx receives: GET /?page=1 HTTP/1.1
    ↓
nginx serves: /var/www/html/index.html
    ↓
Response: Default nginx welcome page
    ↓
Application Gateway
    ↓
Client Browser: Displays nginx page
```

---

### Step 15: Summary of Part 19

**What we accomplished:**
- ✅ Created VM with default nginx page
- ✅ Configured URL rewrite in Application Gateway
- ✅ Client accesses `/nginx` → Backend receives `/`
- ✅ Query strings preserved automatically
- ✅ Tested and verified rewrite functionality

**Key concepts learned:**
- ✅ URL rewrite modifies requests before sending to backend
- ✅ Rewrite sets contain multiple rewrite rules
- ✅ Conditions determine when rewrite applies
- ✅ Actions define what to rewrite
- ✅ Rewrites are invisible to client
- ✅ Backend sees rewritten URL, not original

**URL Rewrite vs Redirect:**

| Feature | URL Rewrite | Redirect |
|---------|-------------|----------|
| Client sees | Original URL | New URL |
| Browser URL bar | No change | Changes |
| HTTP status | 200 OK | 301/302 |
| Backend receives | Rewritten URL | N/A |
| Use case | Internal routing | External routing |
| Performance | Faster (1 request) | Slower (2 requests) |

**Example:**
- **Rewrite**: Client requests `/nginx`, sees `/nginx` in browser, backend gets `/`
- **Redirect**: Client requests `/nginx`, browser redirects to `/`, client sees `/`

**When to use URL Rewrite:**
- ✅ Hide backend URL structure
- ✅ Support legacy URLs
- ✅ API versioning
- ✅ Friendly URLs for clients
- ✅ Backend can't be modified

**When to use Redirect:**
- ✅ Permanent URL changes (SEO)
- ✅ HTTP to HTTPS
- ✅ Old domain to new domain
- ✅ Client should see new URL

**Cost impact:**
- URL rewrite is included in Application Gateway
- No additional cost
- Same pricing as before (~$382/month)

Great job! You now understand URL rewrite in Azure Application Gateway! 🚀

