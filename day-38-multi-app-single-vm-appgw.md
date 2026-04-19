# Day 38: 3 Dockerized Apps on 1 VM + Nginx Proxy + Application Gateway

## What You'll Learn

Deploy 3 web apps on a single VM with domain-based routing:
- ✅ 3 Docker containers (web1, web2, web3) on 1 VM
- ✅ Nginx reverse proxy (route by domain name)
- ✅ Application Gateway with host-based routing
- ✅ DNS: web1.stauat.com, web2.stauat.com, web3.stauat.com
- ✅ Complete test, check, and confirm

## Table of Contents

1. [Architecture](#architecture)
2. [Lab 1: Create VM and Install Docker + Nginx](#lab-1-create-vm-and-install-docker--nginx)
3. [Lab 2: Create 3 Docker Containers](#lab-2-create-3-docker-containers)
4. [Lab 3: Configure Nginx Reverse Proxy](#lab-3-configure-nginx-reverse-proxy)
5. [Lab 4: Test Nginx Proxy on VM](#lab-4-test-nginx-proxy-on-vm)
6. [Lab 5: Create Application Gateway](#lab-5-create-application-gateway)
7. [Lab 6: Configure DNS](#lab-6-configure-dns)
8. [Lab 7: Final Testing](#lab-7-final-testing)
9. [Cleanup](#cleanup)

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  COMPLETE ARCHITECTURE                                            │
│                                                                   │
│  Users:                                                          │
│  web1.stauat.com ──┐                                           │
│  web2.stauat.com ──┼──→ Application Gateway (public IP)       │
│  web3.stauat.com ──┘    Host-based routing                     │
│                              │                                    │
│                              ↓                                    │
│                     ┌─────────────────┐                          │
│                     │  VM (single)     │                          │
│                     │                  │                          │
│                     │  Nginx (port 80) │ ← Reverse proxy         │
│                     │  ├─ web1.* → :3001                        │
│                     │  ├─ web2.* → :3002                        │
│                     │  └─ web3.* → :3003                        │
│                     │                  │                          │
│                     │  Docker:         │                          │
│                     │  ├─ web1 (:3001) │ "Hello from Web1!"     │
│                     │  ├─ web2 (:3002) │ "Hello from Web2!"     │
│                     │  └─ web3 (:3003) │ "Hello from Web3!"     │
│                     └─────────────────┘                          │
│                                                                   │
│  Flow:                                                           │
│  Browser → web1.stauat.com                                     │
│    → DNS → Application Gateway public IP                         │
│    → AppGW sees Host: web1.stauat.com                          │
│    → Routes to VM:80                                             │
│    → Nginx sees Host: web1.stauat.com                          │
│    → Proxies to Docker container on port 3001                    │
│    → "Hello from Web1!" returned                                 │
└──────────────────────────────────────────────────────────────────┘
```

### Why This Architecture?

```
┌──────────────────────────────────────────────────────────────┐
│  WHY 3 APPS ON 1 VM?                                         │
│                                                               │
│  Cost saving: 1 VM instead of 3 VMs                          │
│  Simple: Small apps don't need separate VMs                  │
│  Docker: Isolation between apps (separate containers)        │
│  Nginx: Routes traffic to correct container by domain        │
│                                                               │
│  WHY APPLICATION GATEWAY?                                    │
│  ├─ WAF (Web Application Firewall) protection               │
│  ├─ SSL termination (HTTPS)                                  │
│  ├─ Host-based routing (multiple domains)                    │
│  ├─ Health probes (auto-detect if app is down)              │
│  └─ Production-grade load balancing                          │
│                                                               │
│  WHY NGINX ON VM?                                            │
│  ├─ Docker containers expose different ports (3001-3003)    │
│  ├─ Nginx consolidates to port 80                            │
│  ├─ Routes by Host header to correct container              │
│  └─ AppGW only needs to talk to VM:80                       │
└──────────────────────────────────────────────────────────────┘
```

---

## Lab 1: Create VM and Install Docker + Nginx

### Step 1: Create Resource Group

```
1. Azure Portal → Search "Resource groups" → "+ Create"
2. Name: rg-day38-multiapp
3. Region: East US
4. Click "Review + create" → "Create"
```

### Step 2: Create Virtual Network

```
1. Search "Virtual networks" → "+ Create"
2. Fill in:
   - Resource group: rg-day38-multiapp
   - Name: vnet-day38
   - Region: East US
   
   IP Addresses:
   - Address space: 10.0.0.0/16
   - Add subnet: subnet-vm, 10.0.1.0/24
   - Add subnet: subnet-appgw, 10.0.2.0/24
     (Application Gateway needs its own subnet!)

3. Click "Review + create" → "Create"
```

### Step 3: Create VM

```
1. Search "Virtual machines" → "+ Create"
2. Fill in:
   - Resource group: rg-day38-multiapp
   - Name: vm-multiapp
   - Region: East US
   - Image: Ubuntu Server 22.04 LTS
   - Size: Standard_B2s (2 vCPU, 4 GB - need more for 3 containers)
   - Authentication: Password
   - Username: azureuser
   - Password: Day38Multi@2026
   - Public inbound ports: Allow SSH (22) and HTTP (80)

   Networking:
   - Virtual network: vnet-day38
   - Subnet: subnet-vm
   - Public IP: Create new

3. Click "Review + create" → "Create"
```

**⏱️ Wait**: 2-3 minutes

### Step 4: Install Docker on VM

```bash
# SSH into VM
ssh azureuser@<VM-PUBLIC-IP>

# Install Docker
sudo apt update
sudo apt install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker azureuser

# Logout and login for group change
exit
ssh azureuser@<VM-PUBLIC-IP>

# Verify Docker
docker --version
docker-compose --version
```

### Step 5: Install Nginx on VM

```bash
# Install Nginx (as reverse proxy, NOT as web server)
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify Nginx
sudo nginx -t
curl http://localhost
# Should show default Nginx page
```

### Step 6: Test, Check, and Confirm

```
✅ VM running with public IP
✅ Docker installed and working
✅ Nginx installed and running
✅ curl http://localhost shows Nginx default page
```

**✅ Result**: VM ready!

---

## Lab 2: Create 3 Docker Containers

### Step 1: Create Web1 App

```bash
# SSH into VM
ssh azureuser@<VM-PUBLIC-IP>

# Create directory structure
mkdir -p ~/apps/web1 ~/apps/web2 ~/apps/web3

# Create Web1
cat > ~/apps/web1/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head><title>Web1 - stauat.com</title></head>
<body style="background:#1a1a2e;color:#e94560;font-family:Arial;text-align:center;padding:50px">
  <h1>🌐 Hello from Web1!</h1>
  <h2>web1.stauat.com</h2>
  <div style="background:#16213e;padding:20px;border-radius:10px;max-width:400px;margin:20px auto">
    <p><strong>Container:</strong> web1</p>
    <p><strong>Port:</strong> 3001</p>
    <p><strong>Domain:</strong> web1.stauat.com</p>
    <p><strong>Server:</strong> vm-multiapp</p>
  </div>
</body>
</html>
EOF
```

### Step 2: Create Web2 App

```bash
cat > ~/apps/web2/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head><title>Web2 - stauat.com</title></head>
<body style="background:#0f3460;color:#e94560;font-family:Arial;text-align:center;padding:50px">
  <h1>🚀 Hello from Web2!</h1>
  <h2>web2.stauat.com</h2>
  <div style="background:#16213e;padding:20px;border-radius:10px;max-width:400px;margin:20px auto">
    <p><strong>Container:</strong> web2</p>
    <p><strong>Port:</strong> 3002</p>
    <p><strong>Domain:</strong> web2.stauat.com</p>
    <p><strong>Server:</strong> vm-multiapp</p>
  </div>
</body>
</html>
EOF
```

### Step 3: Create Web3 App

```bash
cat > ~/apps/web3/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head><title>Web3 - stauat.com</title></head>
<body style="background:#533483;color:#e94560;font-family:Arial;text-align:center;padding:50px">
  <h1>⚡ Hello from Web3!</h1>
  <h2>web3.stauat.com</h2>
  <div style="background:#16213e;padding:20px;border-radius:10px;max-width:400px;margin:20px auto">
    <p><strong>Container:</strong> web3</p>
    <p><strong>Port:</strong> 3003</p>
    <p><strong>Domain:</strong> web3.stauat.com</p>
    <p><strong>Server:</strong> vm-multiapp</p>
  </div>
</body>
</html>
EOF
```

### Step 4: Create Docker Compose File

```bash
cat > ~/apps/docker-compose.yml << 'EOF'
version: '3'
services:
  web1:
    image: nginx:alpine
    container_name: web1
    ports:
      - "3001:80"
    volumes:
      - ./web1:/usr/share/nginx/html:ro
    restart: unless-stopped

  web2:
    image: nginx:alpine
    container_name: web2
    ports:
      - "3002:80"
    volumes:
      - ./web2:/usr/share/nginx/html:ro
    restart: unless-stopped

  web3:
    image: nginx:alpine
    container_name: web3
    ports:
      - "3003:80"
    volumes:
      - ./web3:/usr/share/nginx/html:ro
    restart: unless-stopped
EOF
```

### Step 5: Start All Containers

```bash
cd ~/apps
docker-compose up -d

# Verify all 3 containers running
docker ps
```

**Expected output:**
```
CONTAINER ID  IMAGE         PORTS                   NAMES
abc123        nginx:alpine  0.0.0.0:3001->80/tcp    web1
def456        nginx:alpine  0.0.0.0:3002->80/tcp    web2
ghi789        nginx:alpine  0.0.0.0:3003->80/tcp    web3
```

### Step 6: Test Each Container Directly

```bash
curl http://localhost:3001
# "Hello from Web1!" ✅

curl http://localhost:3002
# "Hello from Web2!" ✅

curl http://localhost:3003
# "Hello from Web3!" ✅
```

### Step 7: Test, Check, and Confirm

**Test 1: All 3 Containers Running**

```
docker ps
  ✅ web1: Running, port 3001
  ✅ web2: Running, port 3002
  ✅ web3: Running, port 3003
```

**Test 2: Each Container Responds**

```
curl localhost:3001 → "Hello from Web1!" ✅
curl localhost:3002 → "Hello from Web2!" ✅
curl localhost:3003 → "Hello from Web3!" ✅
```

**✅ Result**: 3 Docker containers running!

---

## Lab 3: Configure Nginx Reverse Proxy

### What is Nginx Reverse Proxy?

```
Nginx listens on port 80 and routes traffic based on the
Host header (domain name) to the correct Docker container.

Request: Host: web1.stauat.com → Nginx → localhost:3001 (web1)
Request: Host: web2.stauat.com → Nginx → localhost:3002 (web2)
Request: Host: web3.stauat.com → Nginx → localhost:3003 (web3)
```

### Step 1: Remove Default Nginx Config

```bash
# SSH into VM
ssh azureuser@<VM-PUBLIC-IP>

# Remove default site
sudo rm /etc/nginx/sites-enabled/default
```

### Step 2: Create Config for Web1

```bash
sudo bash -c 'cat > /etc/nginx/sites-available/web1.stauat.com << EOF
server {
    listen 80;
    server_name web1.stauat.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF'

# Enable the site
sudo ln -s /etc/nginx/sites-available/web1.stauat.com /etc/nginx/sites-enabled/
```

### Step 3: Create Config for Web2

```bash
sudo bash -c 'cat > /etc/nginx/sites-available/web2.stauat.com << EOF
server {
    listen 80;
    server_name web2.stauat.com;

    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF'

sudo ln -s /etc/nginx/sites-available/web2.stauat.com /etc/nginx/sites-enabled/
```

### Step 4: Create Config for Web3

```bash
sudo bash -c 'cat > /etc/nginx/sites-available/web3.stauat.com << EOF
server {
    listen 80;
    server_name web3.stauat.com;

    location / {
        proxy_pass http://127.0.0.1:3003;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF'

sudo ln -s /etc/nginx/sites-available/web3.stauat.com /etc/nginx/sites-enabled/
```

### Step 5: Add Default Server (Catch-All)

```bash
sudo bash -c 'cat > /etc/nginx/sites-available/default << EOF
server {
    listen 80 default_server;
    server_name _;

    location / {
        return 200 "Welcome to vm-multiapp. Use web1/web2/web3.stauat.com";
        add_header Content-Type text/plain;
    }

    location /health {
        return 200 "healthy";
        add_header Content-Type text/plain;
    }
}
EOF'

sudo ln -s /etc/nginx/sites-available/default /etc/nginx/sites-enabled/
```

### Step 6: Test and Reload Nginx

```bash
# Test configuration
sudo nginx -t
# nginx: configuration file /etc/nginx/nginx.conf test is successful ✅

# Reload Nginx
sudo systemctl reload nginx
```

### Step 7: Verify Nginx Config Files

```bash
ls -la /etc/nginx/sites-enabled/
# default
# web1.stauat.com
# web2.stauat.com
# web3.stauat.com
# ✅ All 4 configs enabled
```

### Step 8: Test, Check, and Confirm

```
sudo nginx -t → ✅ Configuration OK
ls /etc/nginx/sites-enabled/ → ✅ 4 files (default + 3 domains)
```

**✅ Result**: Nginx reverse proxy configured!

---

## Lab 4: Test Nginx Proxy on VM

### Step 1: Test with Host Header (from VM)

```bash
# Test web1
curl -H "Host: web1.stauat.com" http://localhost
# "Hello from Web1!" ✅

# Test web2
curl -H "Host: web2.stauat.com" http://localhost
# "Hello from Web2!" ✅

# Test web3
curl -H "Host: web3.stauat.com" http://localhost
# "Hello from Web3!" ✅

# Test default (no matching host)
curl http://localhost
# "Welcome to vm-multiapp..." ✅

# Test health
curl http://localhost/health
# "healthy" ✅
```

### Step 2: Test from Your Laptop (with Host Header)

```bash
# From your local machine (not the VM):
curl -H "Host: web1.stauat.com" http://<VM-PUBLIC-IP>
# "Hello from Web1!" ✅

curl -H "Host: web2.stauat.com" http://<VM-PUBLIC-IP>
# "Hello from Web2!" ✅

curl -H "Host: web3.stauat.com" http://<VM-PUBLIC-IP>
# "Hello from Web3!" ✅
```

### Step 3: Test, Check, and Confirm

**Test 1: Nginx Routes by Host Header**

```
curl -H "Host: web1.stauat.com" http://localhost → "Web1" ✅
curl -H "Host: web2.stauat.com" http://localhost → "Web2" ✅
curl -H "Host: web3.stauat.com" http://localhost → "Web3" ✅
```

**Test 2: Default Catch-All Works**

```
curl http://localhost → "Welcome to vm-multiapp..." ✅
```

**Test 3: Health Endpoint**

```
curl http://localhost/health → "healthy" ✅
```

**Test 4: External Access**

```
curl -H "Host: web1.stauat.com" http://<VM-PUBLIC-IP> → "Web1" ✅
```

**✅ Result**: Nginx proxy routing correctly by domain!

---

## Lab 5: Create Application Gateway

### What We'll Configure

```
Application Gateway with 3 listeners (one per domain):

┌──────────────────────────────────────────────────────────────┐
│  APPLICATION GATEWAY CONFIGURATION                            │
│                                                               │
│  Frontend: Public IP (20.x.x.x)                             │
│                                                               │
│  Listeners:                                                  │
│  ├─ listener-web1: web1.stauat.com:80                     │
│  ├─ listener-web2: web2.stauat.com:80                     │
│  └─ listener-web3: web3.stauat.com:80                     │
│                                                               │
│  Backend Pool:                                               │
│  └─ pool-vm: vm-multiapp (10.0.1.4)                         │
│     (All 3 listeners point to the SAME backend!)            │
│     (Nginx on the VM does the final routing)                │
│                                                               │
│  Routing Rules:                                              │
│  ├─ rule-web1: listener-web1 → pool-vm                      │
│  ├─ rule-web2: listener-web2 → pool-vm                      │
│  └─ rule-web3: listener-web3 → pool-vm                      │
│                                                               │
│  Health Probe:                                               │
│  └─ probe-health: GET /health → expects "healthy"           │
│                                                               │
│  AppGW preserves the Host header, so Nginx on the VM        │
│  sees web1.stauat.com and routes to the right container!  │
└──────────────────────────────────────────────────────────────┘
```

### Step 1: Create Application Gateway (Portal)

```
1. Search "Application gateways" → "+ Create"
2. Fill in:

   Basics tab:
   - Resource group: rg-day38-multiapp
   - Name: appgw-day38
   - Region: East US
   - Tier: Standard V2
   - Enable autoscaling: No
   - Instance count: 1
   - Virtual network: vnet-day38
   - Subnet: subnet-appgw (10.0.2.0/24)

   Frontends tab:
   - Frontend IP address type: Public
   - Public IP address: Create new → pip-appgw-day38

   Backends tab:
   - Click "+ Add a backend pool"
   - Name: pool-vm
   - Add target:
     - Target type: IP address or FQDN
     - Target: 10.0.1.4 (VM private IP)
       (Check VM → Networking → Private IP)
   - Click "Add"

   Configuration tab:
   We need to add 3 routing rules (one per domain).
   
   Click "+ Add a routing rule"
```

### Step 2: Add Routing Rule for Web1

```
In the "Add a routing rule" dialog:

   Rule name: rule-web1
   Priority: 100

   Listener tab:
   - Listener name: listener-web1
   - Frontend IP: Public
   - Port: 80
   - Protocol: HTTP
   - Listener type: Multi site ← IMPORTANT!
   - Host type: Single
   - Host name: web1.stauat.com
   
   Backend targets tab:
   - Target type: Backend pool
   - Backend target: pool-vm
   - Backend settings: Click "Add new"
     - Name: settings-http
     - Backend protocol: HTTP
     - Backend port: 80
     - Override with new host name: No ← IMPORTANT!
       (We want to PRESERVE the original Host header
        so Nginx on the VM sees web1.stauat.com)
     - Health probe: Create new
       - Name: probe-health
       - Protocol: HTTP
       - Host: 10.0.1.4
       - Path: /health
       - Interval: 30 seconds
       - Click "Add"
     - Click "Add" (save backend settings)
   
   Click "Add" (save routing rule)
```

### Step 3: Add Routing Rule for Web2

```
Click "+ Add a routing rule"

   Rule name: rule-web2
   Priority: 200

   Listener:
   - Listener name: listener-web2
   - Frontend IP: Public
   - Port: 80
   - Protocol: HTTP
   - Listener type: Multi site
   - Host name: web2.stauat.com

   Backend targets:
   - Backend target: pool-vm (same pool!)
   - Backend settings: settings-http (reuse existing)

   Click "Add"
```

### Step 4: Add Routing Rule for Web3

```
Click "+ Add a routing rule"

   Rule name: rule-web3
   Priority: 300

   Listener:
   - Listener name: listener-web3
   - Frontend IP: Public
   - Port: 80
   - Protocol: HTTP
   - Listener type: Multi site
   - Host name: web3.stauat.com

   Backend targets:
   - Backend target: pool-vm (same pool!)
   - Backend settings: settings-http (reuse existing)

   Click "Add"
```

### Step 5: Create Application Gateway

```
3. Click "Review + create" → "Create"
```

**⏱️ Wait**: 5-10 minutes

### Step 6: Get Application Gateway Public IP

```
1. Go to appgw-day38 → Overview
2. Note the Frontend public IP address
   Example: 20.xxx.xxx.xxx
   
   This is the IP all 3 domains will point to!
```

### Step 7: Test, Check, and Confirm

**Test 1: AppGW Created**

```
appgw-day38 → Overview
  ✅ Status: Running
  ✅ Frontend IP: 20.xxx.xxx.xxx
  ✅ Tier: Standard V2
```

**Test 2: Backend Health**

```
appgw-day38 → Backend health
  ✅ pool-vm: Healthy
  ✅ 10.0.1.4: Healthy (200 OK from /health)
```

**Test 3: Listeners**

```
appgw-day38 → Listeners
  ✅ listener-web1: web1.stauat.com:80
  ✅ listener-web2: web2.stauat.com:80
  ✅ listener-web3: web3.stauat.com:80
```

**Test 4: Rules**

```
appgw-day38 → Rules
  ✅ rule-web1: listener-web1 → pool-vm
  ✅ rule-web2: listener-web2 → pool-vm
  ✅ rule-web3: listener-web3 → pool-vm
```

**Test 5: Test with Host Header (before DNS)**

```bash
# From your laptop:
curl -H "Host: web1.stauat.com" http://<APPGW-PUBLIC-IP>
# "Hello from Web1!" ✅

curl -H "Host: web2.stauat.com" http://<APPGW-PUBLIC-IP>
# "Hello from Web2!" ✅

curl -H "Host: web3.stauat.com" http://<APPGW-PUBLIC-IP>
# "Hello from Web3!" ✅
```

**✅ Result**: Application Gateway routing by host header!

---

## Lab 6: Configure DNS

### Option A: Azure DNS Zone (If Domain is in Azure)

```
1. Search "DNS zones" → "+ Create"
2. Fill in:
   - Resource group: rg-day38-multiapp
   - Name: stauat.com
3. Click "Create"

4. Add DNS Records:
   Go to stauat.com DNS zone → "+ Record set"

   Record 1:
   - Name: web1
   - Type: A
   - IP address: <APPGW-PUBLIC-IP> (e.g., 20.xxx.xxx.xxx)
   - Click "OK"

   Record 2:
   - Name: web2
   - Type: A
   - IP address: <APPGW-PUBLIC-IP> (same IP!)
   - Click "OK"

   Record 3:
   - Name: web3
   - Type: A
   - IP address: <APPGW-PUBLIC-IP> (same IP!)
   - Click "OK"

5. Update nameservers at your domain registrar:
   Copy the 4 nameservers from Azure DNS zone
   Update at Namecheap/GoDaddy/etc.
```

### Option B: External DNS (Namecheap, GoDaddy, etc.)

```
1. Login to your domain registrar (e.g., Namecheap)
2. Go to DNS management for stauat.com
3. Add A records:

   Host: web1    Type: A    Value: <APPGW-PUBLIC-IP>
   Host: web2    Type: A    Value: <APPGW-PUBLIC-IP>
   Host: web3    Type: A    Value: <APPGW-PUBLIC-IP>

4. Save
5. Wait for DNS propagation (5-30 minutes)
```

### Option C: Test Without Real Domain (hosts file)

```
If you don't own stauat.com, use your local hosts file:

Windows: Edit C:\Windows\System32\drivers\etc\hosts
Mac/Linux: Edit /etc/hosts

Add these lines:
<APPGW-PUBLIC-IP>  web1.stauat.com
<APPGW-PUBLIC-IP>  web2.stauat.com
<APPGW-PUBLIC-IP>  web3.stauat.com

Example:
20.123.45.67  web1.stauat.com
20.123.45.67  web2.stauat.com
20.123.45.67  web3.stauat.com

Save the file. Now your browser resolves these domains locally!
```

### Step 1: Verify DNS Resolution

```bash
# Check DNS (after propagation or hosts file)
nslookup web1.stauat.com
# Address: 20.xxx.xxx.xxx (AppGW IP) ✅

nslookup web2.stauat.com
# Address: 20.xxx.xxx.xxx (AppGW IP) ✅

nslookup web3.stauat.com
# Address: 20.xxx.xxx.xxx (AppGW IP) ✅

# All 3 domains point to the SAME Application Gateway IP!
```

### Step 2: Test, Check, and Confirm

**Test 1: DNS Records**

```
nslookup web1.stauat.com → AppGW IP ✅
nslookup web2.stauat.com → AppGW IP ✅
nslookup web3.stauat.com → AppGW IP ✅
```

**Test 2: All 3 Point to Same IP**

```
✅ All 3 domains resolve to the same Application Gateway IP
✅ AppGW will route based on Host header
```

**✅ Result**: DNS configured!

---

## Lab 7: Final Testing

### Step 1: Test in Browser

```
Open your browser:

1. http://web1.stauat.com
   ✅ Shows: "🌐 Hello from Web1!"
   ✅ Domain: web1.stauat.com
   ✅ Port: 3001
   ✅ Dark blue background

2. http://web2.stauat.com
   ✅ Shows: "🚀 Hello from Web2!"
   ✅ Domain: web2.stauat.com
   ✅ Port: 3002
   ✅ Blue background

3. http://web3.stauat.com
   ✅ Shows: "⚡ Hello from Web3!"
   ✅ Domain: web3.stauat.com
   ✅ Port: 3003
   ✅ Purple background
```

### Step 2: Test with curl

```bash
curl http://web1.stauat.com
# Full HTML with "Hello from Web1!" ✅

curl http://web2.stauat.com
# Full HTML with "Hello from Web2!" ✅

curl http://web3.stauat.com
# Full HTML with "Hello from Web3!" ✅
```

### Step 3: Test Health Probe

```
1. appgw-day38 → Backend health
   ✅ pool-vm: Healthy
   ✅ All probes passing
```

### Step 4: Test Container Failure (Stop One Container)

```bash
# SSH into VM
ssh azureuser@<VM-PUBLIC-IP>

# Stop web2 container
docker stop web2

# Test:
curl -H "Host: web1.stauat.com" http://localhost
# "Hello from Web1!" ✅ (still works)

curl -H "Host: web2.stauat.com" http://localhost
# 502 Bad Gateway ❌ (web2 is down!)

curl -H "Host: web3.stauat.com" http://localhost
# "Hello from Web3!" ✅ (still works)

# Start web2 again
docker start web2

# Test again:
curl -H "Host: web2.stauat.com" http://localhost
# "Hello from Web2!" ✅ (back!)

exit
```

### Step 5: Complete Test, Check, and Confirm

**Test 1: All 3 Domains Work**

```
http://web1.stauat.com → "Hello from Web1!" ✅
http://web2.stauat.com → "Hello from Web2!" ✅
http://web3.stauat.com → "Hello from Web3!" ✅
```

**Test 2: Each Domain Shows Different Content**

```
web1 → Dark blue background, "Web1" ✅
web2 → Blue background, "Web2" ✅
web3 → Purple background, "Web3" ✅
```

**Test 3: Application Gateway Backend Healthy**

```
appgw-day38 → Backend health → pool-vm: Healthy ✅
```

**Test 4: Container Independence**

```
Stop web2 → web1 and web3 still work ✅
Start web2 → web2 works again ✅
```

**Test 5: Complete Flow Verified**

```
Browser → DNS → AppGW → VM:80 → Nginx → Docker container
  ✅ End-to-end flow working for all 3 domains!
```

**✅ Result**: 3 apps on 1 VM with domain-based routing fully working!

---

## Complete Architecture Recap

```
┌──────────────────────────────────────────────────────────────────┐
│  WHAT WE BUILT                                                    │
│                                                                   │
│  DNS:                                                            │
│  web1.stauat.com ──┐                                           │
│  web2.stauat.com ──┼──→ 20.xxx.xxx.xxx (AppGW Public IP)     │
│  web3.stauat.com ──┘                                           │
│                                                                   │
│  Application Gateway (appgw-day38):                              │
│  ├─ Listener: web1.stauat.com → rule-web1 → pool-vm          │
│  ├─ Listener: web2.stauat.com → rule-web2 → pool-vm          │
│  └─ Listener: web3.stauat.com → rule-web3 → pool-vm          │
│  (Preserves Host header!)                                        │
│                                                                   │
│  VM (vm-multiapp, 10.0.1.4):                                    │
│  Nginx (port 80):                                                │
│  ├─ Host: web1.stauat.com → proxy_pass localhost:3001         │
│  ├─ Host: web2.stauat.com → proxy_pass localhost:3002         │
│  └─ Host: web3.stauat.com → proxy_pass localhost:3003         │
│                                                                   │
│  Docker Containers:                                              │
│  ├─ web1 (port 3001) → "Hello from Web1!"                      │
│  ├─ web2 (port 3002) → "Hello from Web2!"                      │
│  └─ web3 (port 3003) → "Hello from Web3!"                      │
└──────────────────────────────────────────────────────────────────┘
```

---

## Cleanup

```
1. Delete Resource Group:
   - Resource groups → rg-day38-multiapp → Delete
   - Type name to confirm → Delete
   - This deletes: VM, VNet, AppGW, DNS zone, everything

2. Remove hosts file entries (if used Option C):
   Remove the 3 lines you added to hosts file

3. Remove DNS records (if used Option A or B):
   Delete the A records for web1, web2, web3
```

**⏱️ Wait**: 5-10 minutes

**✅ Result**: All resources deleted!

---

## Quick Reference

### Nginx Reverse Proxy Config Template

```nginx
server {
    listen 80;
    server_name YOUR-DOMAIN.com;

    location / {
        proxy_pass http://127.0.0.1:PORT;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Docker Compose Quick Reference

```yaml
version: '3'
services:
  app-name:
    image: nginx:alpine
    container_name: app-name
    ports:
      - "HOST_PORT:CONTAINER_PORT"
    volumes:
      - ./app-folder:/usr/share/nginx/html:ro
    restart: unless-stopped
```

### Useful Links

- [Application Gateway Multi-Site Hosting](https://learn.microsoft.com/azure/application-gateway/multiple-site-overview)
- [Nginx Reverse Proxy](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)
- [Docker Compose](https://docs.docker.com/compose/)

---

**🎉 Congratulations!** You've completed Day 38 deploying 3 dockerized apps on a single VM with Nginx reverse proxy and Application Gateway host-based routing!