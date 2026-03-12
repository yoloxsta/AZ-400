# Day 20: Production Application Gateway with Custom Domain and HTTPS

## What You'll Learn

This is a complete real-world production setup guide covering:
- ✅ Buy a domain with wildcard support (*.sta.com)
- ✅ Configure Azure DNS Zone
- ✅ Create 3 VMs with nginx
- ✅ Set up 3 subdomains (app1.sta.com, app2.sta.com, app3.sta.com)
- ✅ Generate SSL certificates with Certbot (Let's Encrypt)
- ✅ Create Application Gateway with HTTPS
- ✅ Configure wildcard routing
- ✅ Test and verify everything

## Scenario

**Production setup:**
- Domain: `sta.com` (example - use your own domain)
- Subdomains: `app1.sta.com`, `app2.sta.com`, `app3.sta.com`
- 3 VMs running nginx with different content
- HTTPS with valid SSL certificates
- Application Gateway with wildcard routing
- All managed through Azure DNS

## Architecture

```
Internet (HTTPS)
    ↓
Domain Registrar (sta.com)
    ↓ (NS records point to Azure DNS)
Azure DNS Zone (sta.com)
    ├─ A record: *.sta.com → Application Gateway IP
    └─ A record: @ → Application Gateway IP
    ↓
Application Gateway (HTTPS Listener, Port 443)
    ├─ SSL Certificate (*.sta.com wildcard cert)
    ├─ app1.sta.com → VM 1 (Priority 10)
    ├─ app2.sta.com → VM 2 (Priority 20)
    └─ app3.sta.com → VM 3 (Priority 30)
    ↓
Backend VMs (HTTP, Port 80)
    ├─ VM 1: app1.sta.com content
    ├─ VM 2: app2.sta.com content
    └─ VM 3: app3.sta.com content
```

---

## Prerequisites

- ✅ Azure subscription
- ✅ Credit card for domain purchase
- ✅ Basic understanding of DNS
- ✅ SSH client

**Cost estimate:**
- Domain: $10-15/year
- Azure DNS: ~$0.50/month
- 3 VMs: ~$30-90/month (B1s instances)
- Application Gateway: ~$250/month
- **Total: ~$280-340/month + domain**

---

## Part 1: Buy a Domain

### Step 1: Choose a Domain Registrar

Popular options:
- **Namecheap** (recommended for beginners)
- **GoDaddy**
- **Google Domains** (now Squarespace Domains)
- **Cloudflare Registrar**
- **AWS Route 53**

**For this guide, we'll use Namecheap** (but steps are similar for others).

### Step 2: Search and Purchase Domain

1. Go to **https://www.namecheap.com**
2. Search for your domain: `sta.com` (or your preferred name)
3. Check availability
4. If available, click **"Add to Cart"**
5. **Important**: Check **"WhoisGuard"** (free privacy protection)
6. Proceed to checkout
7. Create account or login
8. Complete payment

**⏱️ Wait**: 5-10 minutes for domain registration

**✅ Result**: Domain purchased and registered

### Step 3: Verify Domain Ownership

1. Check your email for confirmation
2. Verify email address (click link in email)
3. Login to Namecheap dashboard
4. Go to **"Domain List"**
5. Verify your domain appears

**✅ Result**: Domain ownership verified

---

## Part 2: Create Azure DNS Zone

### Step 1: Create DNS Zone in Azure

1. Login to **Azure Portal**
2. Search for **"DNS zones"**
3. Click **"+ Create"**

**DNS Zone Configuration:**
- **Subscription**: Your subscription
- **Resource group**: Create new: `rg-dns-prod`
- **Name**: `sta.com` (your actual domain)
- **Resource group location**: `East US` (or your preferred region)
- Click **"Review + create"**
- Click **"Create"**

**⏱️ Wait**: 1-2 minutes

**✅ Result**: Azure DNS Zone created

### Step 2: Get Azure DNS Name Servers

1. Go to **"DNS zones"**
2. Click on **"sta.com"**
3. In **"Overview"**, you'll see **Name servers**:

**Example name servers:**
```
ns1-01.azure-dns.com
ns2-01.azure-dns.net
ns3-01.azure-dns.org
ns4-01.azure-dns.info
```

**Copy all 4 name servers** - you'll need them in the next step!

**✅ Result**: Azure DNS name servers obtained

---

## Part 3: Point Domain to Azure DNS

### Step 1: Update Name Servers at Domain Registrar

**For Namecheap:**

1. Login to **Namecheap**
2. Go to **"Domain List"**
3. Click **"Manage"** next to your domain
4. Find **"Nameservers"** section
5. Select **"Custom DNS"**
6. Enter Azure DNS name servers:
   ```
   ns1-01.azure-dns.com
   ns2-01.azure-dns.net
   ns3-01.azure-dns.org
   ns4-01.azure-dns.info
   ```
7. Click **"Save"** (green checkmark)

**For GoDaddy:**

1. Login to GoDaddy
2. Go to **"My Products"** → **"Domains"**
3. Click on your domain
4. Click **"Manage DNS"**
5. Scroll to **"Nameservers"**
6. Click **"Change"**
7. Select **"Custom"**
8. Enter Azure DNS name servers
9. Click **"Save"**

**⏱️ Wait**: 24-48 hours for DNS propagation (usually faster, 1-4 hours)

**✅ Result**: Domain now uses Azure DNS

### Step 2: Verify DNS Propagation

**Check name servers:**

```bash
# Check name servers
nslookup -type=NS sta.com

# Or use dig
dig NS sta.com

# Or use online tool
# https://www.whatsmydns.net/
```

**Expected output:**
```
sta.com nameserver = ns1-01.azure-dns.com
sta.com nameserver = ns2-01.azure-dns.net
sta.com nameserver = ns3-01.azure-dns.org
sta.com nameserver = ns4-01.azure-dns.info
```

**✅ Result**: DNS propagation verified

---

## Part 4: Create Virtual Network

### Step 1: Create VNet

1. Search for **"Virtual networks"**
2. Click **"+ Create"**

**VNet Configuration:**
- **Subscription**: Your subscription
- **Resource group**: `rg-dns-prod`
- **Name**: `vnet-prod`
- **Region**: `East US`
- Click **"Next: IP Addresses"**

**IP Addresses:**
- **IPv4 address space**: `10.0.0.0/16`
- Click **"+ Add subnet"**

**Subnet 1 - VMs:**
- **Subnet name**: `subnet-vms`
- **Subnet address range**: `10.0.1.0/24`
- Click **"Add"**

**Subnet 2 - Application Gateway:**
- Click **"+ Add subnet"**
- **Subnet name**: `subnet-appgw`
- **Subnet address range**: `10.0.2.0/24`
- Click **"Add"**

3. Click **"Review + create"**
4. Click **"Create"**

**⏱️ Wait**: 1-2 minutes

**✅ Result**: Virtual network created with 2 subnets

---

## Part 5: Create 3 Virtual Machines

We'll create 3 VMs with nginx, each serving different content.

### Step 1: Create VM 1

1. Search for **"Virtual machines"**
2. Click **"+ Create"** → **"Azure virtual machine"**

**Basics:**
- **Subscription**: Your subscription
- **Resource group**: `rg-dns-prod`
- **Virtual machine name**: `vm-app1`
- **Region**: `East US`
- **Availability options**: `No infrastructure redundancy required`
- **Image**: `Ubuntu Server 22.04 LTS - x64 Gen2`
- **Size**: `Standard_B1s` (1 vCPU, 1 GB RAM)
- **Authentication type**: `SSH public key`
- **Username**: `azureuser`
- **SSH public key source**: `Generate new key pair`
- **Key pair name**: `vm-app1-key`

**Inbound port rules:**
- **Public inbound ports**: `Allow selected ports`
- **Select inbound ports**: `HTTP (80), SSH (22)`

Click **"Next: Disks"** (keep defaults)
Click **"Next: Networking"**

**Networking:**
- **Virtual network**: `vnet-prod`
- **Subnet**: `subnet-vms (10.0.1.0/24)`
- **Public IP**: `(new) vm-app1-ip`
- **NIC network security group**: `Basic`
- **Public inbound ports**: `Allow selected ports`
- **Select inbound ports**: `HTTP (80), SSH (22)`

Click **"Review + create"**
Click **"Create"**

**Download SSH key** when prompted!

**⏱️ Wait**: 3-5 minutes

**✅ Result**: VM 1 created

### Step 2: Create VM 2 and VM 3

Repeat Step 1 with these changes:

**VM 2:**
- **Virtual machine name**: `vm-app2`
- **Key pair name**: `vm-app2-key`
- **Public IP**: `(new) vm-app2-ip`

**VM 3:**
- **Virtual machine name**: `vm-app3`
- **Key pair name**: `vm-app3-key`
- **Public IP**: `(new) vm-app3-ip`

**⏱️ Wait**: 3-5 minutes per VM

**✅ Result**: 3 VMs created

### Step 3: Note Down VM Public IPs

1. Go to **"Virtual machines"**
2. Click on each VM and note the **Public IP address**:

```
vm-app1: 20.x.x.1
vm-app2: 20.x.x.2
vm-app3: 20.x.x.3
```

**✅ Result**: VM IPs documented

---

## Part 6: Install and Configure nginx on VMs

### Step 1: SSH to VM 1

```bash
# SSH to VM 1 (use your actual IP)
ssh -i vm-app1-key.pem azureuser@20.x.x.1
```

### Step 2: Install nginx on VM 1

```bash
# Update packages
sudo apt update

# Install nginx
sudo apt install -y nginx

# Start nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

### Step 3: Create Custom Content for VM 1

```bash
# Create custom HTML for app1
sudo tee /var/www/html/index.html > /dev/null <<EOF
<!DOCTYPE html>
<html>
<head>
    <title>App1 - Production</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }
        .container {
            text-align: center;
            background: rgba(255,255,255,0.1);
            padding: 50px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
        }
        h1 { font-size: 3em; margin: 0; }
        p { font-size: 1.5em; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 App1 Production</h1>
        <p>app1.sta.com</p>
        <p>Server: VM 1</p>
    </div>
</body>
</html>
EOF

# Test
curl http://localhost
```

### Step 4: Configure nginx for app1.sta.com

```bash
# Create nginx config for app1
sudo tee /etc/nginx/sites-available/app1 > /dev/null <<EOF
server {
    listen 80;
    server_name app1.sta.com;
    
    root /var/www/html;
    index index.html;
    
    location / {
        try_files \$uri \$uri/ =404;
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/app1 /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### Step 5: Test VM 1

```bash
# Test with domain name
curl -H "Host: app1.sta.com" http://localhost

# Test health check
curl http://localhost/health
```

**✅ Result**: VM 1 configured with custom content

### Step 6: Repeat for VM 2 and VM 3

**SSH to VM 2:**
```bash
ssh -i vm-app2-key.pem azureuser@20.x.x.2
```

**Install nginx and create content for VM 2:**
```bash
# Install nginx
sudo apt update && sudo apt install -y nginx

# Create custom HTML for app2 (different color)
sudo tee /var/www/html/index.html > /dev/null <<EOF
<!DOCTYPE html>
<html>
<head>
    <title>App2 - Production</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }
        .container {
            text-align: center;
            background: rgba(255,255,255,0.1);
            padding: 50px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
        }
        h1 { font-size: 3em; margin: 0; }
        p { font-size: 1.5em; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎯 App2 Production</h1>
        <p>app2.sta.com</p>
        <p>Server: VM 2</p>
    </div>
</body>
</html>
EOF

# Configure nginx for app2
sudo tee /etc/nginx/sites-available/app2 > /dev/null <<EOF
server {
    listen 80;
    server_name app2.sta.com;
    
    root /var/www/html;
    index index.html;
    
    location / {
        try_files \$uri \$uri/ =404;
    }
    
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/app2 /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

**SSH to VM 3:**
```bash
ssh -i vm-app3-key.pem azureuser@20.x.x.3
```

**Install nginx and create content for VM 3:**
```bash
# Install nginx
sudo apt update && sudo apt install -y nginx

# Create custom HTML for app3 (different color)
sudo tee /var/www/html/index.html > /dev/null <<EOF
<!DOCTYPE html>
<html>
<head>
    <title>App3 - Production</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }
        .container {
            text-align: center;
            background: rgba(255,255,255,0.1);
            padding: 50px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
        }
        h1 { font-size: 3em; margin: 0; }
        p { font-size: 1.5em; }
    </style>
</head>
<body>
    <div class="container">
        <h1>⚡ App3 Production</h1>
        <p>app3.sta.com</p>
        <p>Server: VM 3</p>
    </div>
</body>
</html>
EOF

# Configure nginx for app3
sudo tee /etc/nginx/sites-available/app3 > /dev/null <<EOF
server {
    listen 80;
    server_name app3.sta.com;
    
    root /var/www/html;
    index index.html;
    
    location / {
        try_files \$uri \$uri/ =404;
    }
    
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/app3 /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

**✅ Result**: All 3 VMs configured with unique content

---

## Part 7: Generate SSL Certificates with Certbot

We'll use Certbot to generate free SSL certificates from Let's Encrypt.

### Important: Certificate Generation Strategy

**For Application Gateway, we need:**
- Wildcard certificate: `*.sta.com`
- Root domain certificate: `sta.com`

**We'll generate on VM 1 and export for Application Gateway.**

### Step 1: Install Certbot on VM 1

```bash
# SSH to VM 1
ssh -i vm-app1-key.pem azureuser@20.x.x.1

# Install Certbot
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# Verify installation
certbot --version
```

### Step 2: Generate Wildcard Certificate

**Important:** Wildcard certificates require DNS validation (not HTTP validation).

```bash
# Generate wildcard certificate
sudo certbot certonly \
  --manual \
  --preferred-challenges dns \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email \
  -d "*.sta.com" \
  -d "sta.com"
```

**Certbot will prompt you:**

```
Please deploy a DNS TXT record under the name:
_acme-challenge.sta.com

with the following value:
abc123def456ghi789jkl012mno345pqr678stu901vwx234yz

Before continuing, verify the TXT record has been deployed.
Press Enter to Continue
```

**DO NOT PRESS ENTER YET!** Keep this terminal open.

### Step 3: Add DNS TXT Record in Azure DNS

Open a new browser tab:

1. Go to **Azure Portal** → **DNS zones** → **sta.com**
2. Click **"+ Record set"**

**TXT Record Configuration:**
- **Name**: `_acme-challenge`
- **Type**: `TXT`
- **TTL**: `1` (1 hour)
- **TTL unit**: `Hours`
- **Value**: `abc123def456ghi789jkl012mno345pqr678stu901vwx234yz` (use actual value from Certbot)
- Click **"OK"**

**⏱️ Wait**: 2-5 minutes for DNS propagation

### Step 4: Verify TXT Record

**In a new terminal:**

```bash
# Check TXT record
nslookup -type=TXT _acme-challenge.sta.com

# Or use dig
dig TXT _acme-challenge.sta.com

# Expected output should show your TXT value
```

**Once verified, go back to Certbot terminal and press Enter.**

### Step 5: Complete Certificate Generation

Certbot will verify the DNS record and generate certificates:

```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/sta.com/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/sta.com/privkey.pem
```

**✅ Result**: SSL certificates generated!

### Step 6: Export Certificates for Application Gateway

Application Gateway requires certificates in PFX format.

```bash
# Create PFX file from certificates
sudo openssl pkcs12 -export \
  -out /tmp/sta.com.pfx \
  -inkey /etc/letsencrypt/live/sta.com/privkey.pem \
  -in /etc/letsencrypt/live/sta.com/fullchain.pem \
  -passout pass:YourSecurePassword123

# Change ownership
sudo chown azureuser:azureuser /tmp/sta.com.pfx

# Verify PFX file
ls -lh /tmp/sta.com.pfx
```

**Important:** Remember the password `YourSecurePassword123` - you'll need it for Application Gateway!

### Step 7: Download Certificate to Local Machine

**On your local machine:**

```bash
# Download PFX file
scp -i vm-app1-key.pem azureuser@20.x.x.1:/tmp/sta.com.pfx ./sta.com.pfx

# Verify download
ls -lh sta.com.pfx
```

**✅ Result**: SSL certificate ready for Application Gateway

### Step 8: Clean Up TXT Record (Optional)

After certificate generation, you can delete the TXT record:

1. Go to **Azure DNS** → **sta.com**
2. Find `_acme-challenge` TXT record
3. Click **"..."** → **"Delete"**

**Note:** Keep the TXT record if you plan to renew certificates soon.

---

## Part 8: Create Application Gateway

### Step 1: Create Application Gateway

1. Search for **"Application gateways"**
2. Click **"+ Create"**

**Basics:**
- **Subscription**: Your subscription
- **Resource group**: `rg-dns-prod`
- **Application gateway name**: `appgw-prod`
- **Region**: `East US`
- **Tier**: `Standard V2`
- **Enable autoscaling**: `No`
- **Instance count**: `2`
- **Availability zone**: `None`
- **HTTP2**: `Enabled`
- **Virtual network**: `vnet-prod`
- **Subnet**: `subnet-appgw (10.0.2.0/24)`
- Click **"Next: Frontends"**

**Frontends:**
- **Frontend IP address type**: `Public`
- **Public IP address**: Click **"Add new"**
  - **Name**: `appgw-prod-ip`
  - **SKU**: `Standard`
  - **Assignment**: `Static`
  - Click **"OK"**
- Click **"Next: Backends"**

**Backends:**

Click **"+ Add a backend pool"**

**Backend Pool 1:**
- **Name**: `pool-app1`
- **Add backend pool without targets**: `No`
- **Target type**: `Virtual machine`
- **Target**: Select `vm-app1` network interface
- Click **"Add"**

Click **"+ Add a backend pool"** again

**Backend Pool 2:**
- **Name**: `pool-app2`
- **Target type**: `Virtual machine`
- **Target**: Select `vm-app2` network interface
- Click **"Add"**

Click **"+ Add a backend pool"** again

**Backend Pool 3:**
- **Name**: `pool-app3`
- **Target type**: `Virtual machine`
- **Target**: Select `vm-app3` network interface
- Click **"Add"**

Click **"Next: Configuration"**

**Configuration:**

We'll create a basic rule first, then configure HTTPS later.

Click **"+ Add a routing rule"**

**Routing Rule:**
- **Rule name**: `rule-https`
- **Priority**: `100`

**Listener Tab:**
- **Listener name**: `listener-https`
- **Frontend IP**: `Public`
- **Protocol**: `HTTP` (we'll change to HTTPS later)
- **Port**: `80`
- **Listener type**: `Basic`
- Click **"Backend targets"** tab

**Backend Targets:**
- **Target type**: `Backend pool`
- **Backend target**: `pool-app1` (temporary)
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

Click **"Next: Tags"** (skip)
Click **"Next: Review + create"**
Click **"Create"**

**⏱️ Wait**: 15-20 minutes for Application Gateway to deploy

**✅ Result**: Application Gateway created

### Step 2: Get Application Gateway Public IP

1. Go to **"Application gateways"** → **"appgw-prod"**
2. In **"Overview"**, copy **"Frontend public IP address"**

Example: `52.x.x.x`

**✅ Result**: Application Gateway IP obtained

---

## Part 9: Configure Azure DNS Records

### Step 1: Add Wildcard A Record

1. Go to **"DNS zones"** → **"sta.com"**
2. Click **"+ Record set"**

**Wildcard A Record:**
- **Name**: `*` (asterisk for wildcard)
- **Type**: `A`
- **TTL**: `1`
- **TTL unit**: `Hours`
- **IP address**: `52.x.x.x` (Application Gateway public IP)
- Click **"OK"**

**This creates:** `*.sta.com` → Application Gateway IP

### Step 2: Add Root Domain A Record

1. Click **"+ Record set"** again

**Root A Record:**
- **Name**: `@` (@ represents root domain)
- **Type**: `A`
- **TTL**: `1`
- **TTL unit**: `Hours`
- **IP address**: `52.x.x.x` (Application Gateway public IP)
- Click **"OK"**

**This creates:** `sta.com` → Application Gateway IP

### Step 3: Verify DNS Records

```bash
# Check wildcard record
nslookup app1.sta.com
nslookup app2.sta.com
nslookup app3.sta.com

# Check root domain
nslookup sta.com

# All should return Application Gateway IP: 52.x.x.x
```

**⏱️ Wait**: 5-10 minutes for DNS propagation

**✅ Result**: DNS records configured

---

## Part 10: Upload SSL Certificate to Application Gateway

### Step 1: Navigate to SSL Certificates

1. Go to **"Application gateways"** → **"appgw-prod"**
2. In left menu, click **"Listeners"**
3. We'll upload certificate first, then modify listener

### Step 2: Upload Certificate

1. In left menu, click **"SSL settings"** → **"SSL certificates"**
2. Click **"+ Add"**

**SSL Certificate Configuration:**
- **Certificate name**: `cert-wildcard-sta`
- **PFX certificate file**: Click **"Browse"** → Select `sta.com.pfx`
- **Password**: `YourSecurePassword123` (the password you used when creating PFX)
- Click **"Add"**

**⏱️ Wait**: 1-2 minutes

**✅ Result**: SSL certificate uploaded

---

## Part 11: Configure HTTPS Listener

### Step 1: Edit Existing Listener

1. Go to **"Listeners"**
2. Click on **"listener-https"**
3. We'll convert it from HTTP to HTTPS

**Listener Configuration:**
- **Listener name**: `listener-https`
- **Frontend IP**: `Public`
- **Protocol**: Change to **`HTTPS`** ⚠️
- **Port**: Change to **`443`** ⚠️
- **Listener type**: Change to **`Multi site`** ⚠️
- **Host type**: **`Multiple/Wildcard`**
- **Host names**: Enter:
  ```
  *.sta.com
  sta.com
  ```
- **HTTPS settings**:
  - **Choose a certificate**: `cert-wildcard-sta`
  - **Cert name**: `cert-wildcard-sta` (auto-filled)
- **Error page url**: `No`
- Click **"Save"**

**⏱️ Wait**: 2-3 minutes

**✅ Result**: HTTPS listener configured with wildcard support

---

## Part 12: Configure Routing Rules for Each Subdomain

### Step 1: Edit Existing Rule

1. Go to **"Rules"**
2. Click on **"rule-https"**
3. Change priority and configure for app1

**Rule Configuration:**
- **Rule name**: `rule-app1`
- **Priority**: `10`
- **Listener**: `listener-https`
- Click **"Backend targets"** tab
- **Backend target**: `pool-app1`
- **Backend settings**: `http-settings`
- Click **"Update"**

### Step 2: Create Rule for app2

1. Click **"+ Add routing rule"**

**Rule Configuration:**
- **Rule name**: `rule-app2`
- **Priority**: `20`

**Listener Tab:**
- **Listener**: `listener-https`
- Click **"Backend targets"** tab

**Backend Targets:**
- **Target type**: `Backend pool`
- **Backend target**: `pool-app2`
- **Backend settings**: `http-settings`
- Click **"Add"**

### Step 3: Create Rule for app3

1. Click **"+ Add routing rule"**

**Rule Configuration:**
- **Rule name**: `rule-app3`
- **Priority**: `30`

**Listener Tab:**
- **Listener**: `listener-https`
- Click **"Backend targets"** tab

**Backend Targets:**
- **Target type**: `Backend pool`
- **Backend target**: `pool-app3`
- **Backend settings**: `http-settings`
- Click **"Add"**

**⏱️ Wait**: 3-5 minutes for all rules to be created

**✅ Result**: 3 routing rules configured

### Step 4: Verify Rules Configuration

1. Go to **"Rules"**
2. You should see:

| Rule Name | Listener | Priority | Backend Pool |
|-----------|----------|----------|--------------|
| rule-app1 | listener-https | 10 | pool-app1 |
| rule-app2 | listener-https | 20 | pool-app2 |
| rule-app3 | listener-https | 30 | pool-app3 |

**✅ Result**: All rules configured correctly

---

## Part 13: Test and Verify

### Step 1: Test HTTPS Access

**Open browser and test each subdomain:**

1. **Test app1:**
   - URL: `https://app1.sta.com`
   - Expected: Purple gradient page with "App1 Production"
   - Check SSL: Green padlock in browser

2. **Test app2:**
   - URL: `https://app2.sta.com`
   - Expected: Pink gradient page with "App2 Production"
   - Check SSL: Green padlock in browser

3. **Test app3:**
   - URL: `https://app3.sta.com`
   - Expected: Blue gradient page with "App3 Production"
   - Check SSL: Green padlock in browser

**✅ Expected:** All 3 subdomains work with HTTPS!

### Step 2: Test with curl

```bash
# Test app1
curl -I https://app1.sta.com

# Test app2
curl -I https://app2.sta.com

# Test app3
curl -I https://app3.sta.com

# Expected: HTTP/1.1 200 OK
```

### Step 3: Verify SSL Certificate

**In browser:**

1. Go to `https://app1.sta.com`
2. Click on **padlock icon** in address bar
3. Click **"Certificate"** or **"Connection is secure"**
4. Verify:
   - **Issued to**: `*.sta.com`
   - **Issued by**: `Let's Encrypt`
   - **Valid from**: (today's date)
   - **Valid until**: (90 days from today)

**With curl:**

```bash
# Check certificate details
curl -vI https://app1.sta.com 2>&1 | grep -A 10 "SSL certificate"

# Or use openssl
echo | openssl s_client -servername app1.sta.com -connect app1.sta.com:443 2>/dev/null | openssl x509 -noout -text
```

**✅ Result:** SSL certificate valid and trusted

### Step 4: Test Backend Health

1. Go to **"Application gateways"** → **"appgw-prod"**
2. Click **"Backend health"**
3. Verify all backends show **"Healthy"**:

```
pool-app1
  └─ vm-app1 (10.0.1.4): Healthy ✅

pool-app2
  └─ vm-app2 (10.0.1.5): Healthy ✅

pool-app3
  └─ vm-app3 (10.0.1.6): Healthy ✅
```

**✅ Result:** All backends healthy

### Step 5: Test from Different Locations

**Use online tools to test from multiple locations:**

1. **SSL Labs Test:**
   - Go to: https://www.ssllabs.com/ssltest/
   - Enter: `app1.sta.com`
   - Wait for analysis
   - Expected: Grade A or A+

2. **DNS Propagation:**
   - Go to: https://www.whatsmydns.net/
   - Enter: `app1.sta.com`
   - Type: `A`
   - Check: Should show Application Gateway IP worldwide

3. **HTTP vs HTTPS:**
   - Try: `http://app1.sta.com` (should fail or redirect)
   - Try: `https://app1.sta.com` (should work)

**✅ Result:** Production setup verified globally

---

## Part 14: Configure HTTP to HTTPS Redirect (Optional)

### Step 1: Create HTTP Listener

1. Go to **"Listeners"**
2. Click **"+ Add listener"**

**HTTP Listener:**
- **Listener name**: `listener-http-redirect`
- **Frontend IP**: `Public`
- **Protocol**: `HTTP`
- **Port**: `80`
- **Listener type**: `Multi site`
- **Host type**: `Multiple/Wildcard`
- **Host names**:
  ```
  *.sta.com
  sta.com
  ```
- Click **"Add"**

### Step 2: Create Redirect Rule

1. Go to **"Rules"**
2. Click **"+ Add routing rule"**

**Redirect Rule:**
- **Rule name**: `rule-http-to-https`
- **Priority**: `5` (higher priority than app rules)

**Listener Tab:**
- **Listener**: `listener-http-redirect`
- Click **"Backend targets"** tab

**Backend Targets:**
- **Target type**: `Redirection`
- **Redirection type**: `Permanent`
- **Redirection target**: `Listener`
- **Target listener**: `listener-https`
- **Include query string**: `Yes`
- **Include path**: `Yes`
- Click **"Add"**

**⏱️ Wait**: 2-3 minutes

**✅ Result:** HTTP to HTTPS redirect configured

### Step 3: Test Redirect

```bash
# Test HTTP redirect
curl -I http://app1.sta.com

# Expected output:
# HTTP/1.1 301 Moved Permanently
# Location: https://app1.sta.com/
```

**In browser:**
- Go to: `http://app1.sta.com`
- Should automatically redirect to: `https://app1.sta.com`

**✅ Result:** HTTP to HTTPS redirect working

---

## Part 15: Complete Architecture Overview

### Final Production Setup

```
┌─────────────────────────────────────────────────────────────┐
│                    Internet (Users)                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              Domain Registrar (Namecheap)                    │
│                   Domain: sta.com                            │
│              NS Records → Azure DNS                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                   Azure DNS Zone                             │
│                     sta.com                                  │
│                                                              │
│  DNS Records:                                                │
│    ├─ A: *.sta.com → 52.x.x.x (AppGW IP)                   │
│    └─ A: sta.com → 52.x.x.x (AppGW IP)                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│           Application Gateway (appgw-prod)                   │
│              Public IP: 52.x.x.x                             │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Listener: listener-https (Port 443, HTTPS)       │    │
│  │    - Protocol: HTTPS                               │    │
│  │    - Certificate: *.sta.com (Let's Encrypt)        │    │
│  │    - Host type: Multiple/Wildcard                  │    │
│  │    - Hosts: *.sta.com, sta.com                     │    │
│  └────────────────────┬───────────────────────────────┘    │
│                       │                                      │
│  ┌────────────────────▼───────────────────────────────┐    │
│  │  Routing Rules (by priority):                      │    │
│  │    ├─ rule-app1 (Priority 10) → pool-app1         │    │
│  │    ├─ rule-app2 (Priority 20) → pool-app2         │    │
│  │    └─ rule-app3 (Priority 30) → pool-app3         │    │
│  └─────────────────────────────────────────────────────┘    │
│                       │                                      │
│  ┌────────────────────▼───────────────────────────────┐    │
│  │  Backend Pools:                                    │    │
│  │    ├─ pool-app1 → vm-app1 (10.0.1.4)              │    │
│  │    ├─ pool-app2 → vm-app2 (10.0.1.5)              │    │
│  │    └─ pool-app3 → vm-app3 (10.0.1.6)              │    │
│  └─────────────────────────────────────────────────────┘    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                Virtual Network (vnet-prod)                   │
│                    10.0.0.0/16                               │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Subnet: subnet-vms (10.0.1.0/24)                  │    │
│  │                                                     │    │
│  │  ┌──────────────────────────────────────────────┐ │    │
│  │  │  VM 1 (vm-app1)                              │ │    │
│  │  │    - Private IP: 10.0.1.4                    │ │    │
│  │  │    - nginx: app1.sta.com                     │ │    │
│  │  │    - Content: Purple gradient                │ │    │
│  │  └──────────────────────────────────────────────┘ │    │
│  │                                                     │    │
│  │  ┌──────────────────────────────────────────────┐ │    │
│  │  │  VM 2 (vm-app2)                              │ │    │
│  │  │    - Private IP: 10.0.1.5                    │ │    │
│  │  │    - nginx: app2.sta.com                     │ │    │
│  │  │    - Content: Pink gradient                  │ │    │
│  │  └──────────────────────────────────────────────┘ │    │
│  │                                                     │    │
│  │  ┌──────────────────────────────────────────────┐ │    │
│  │  │  VM 3 (vm-app3)                              │ │    │
│  │  │    - Private IP: 10.0.1.6                    │ │    │
│  │  │    - nginx: app3.sta.com                     │ │    │
│  │  │    - Content: Blue gradient                  │ │    │
│  │  └──────────────────────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow

**Example: User visits https://app1.sta.com**

```
1. User's Browser
   ↓
   DNS Query: app1.sta.com
   ↓
2. Domain Registrar (Namecheap)
   ↓
   NS Records point to Azure DNS
   ↓
3. Azure DNS Zone (sta.com)
   ↓
   Wildcard A Record: *.sta.com → 52.x.x.x
   ↓
4. Application Gateway (52.x.x.x)
   ↓
   Listener: listener-https (Port 443)
   ↓
   SSL Termination: Decrypt HTTPS using *.sta.com certificate
   ↓
   Check Host Header: app1.sta.com
   ↓
5. Routing Rules (by priority)
   ↓
   Priority 10: rule-app1
   ↓
   Host matches: app1.sta.com ✅
   ↓
6. Backend Pool: pool-app1
   ↓
   Forward to: vm-app1 (10.0.1.4:80) via HTTP
   ↓
7. VM 1 (nginx)
   ↓
   Server name: app1.sta.com
   ↓
   Serve: /var/www/html/index.html (Purple gradient)
   ↓
8. Response back through Application Gateway
   ↓
   Encrypt with SSL
   ↓
9. User's Browser
   ↓
   Display: App1 Production page with HTTPS ✅
```

### Traffic Flow Summary

| User Request | DNS Resolution | AppGW Listener | Rule Match | Backend | VM Response |
|--------------|----------------|----------------|------------|---------|-------------|
| `https://app1.sta.com` | `*.sta.com` → 52.x.x.x | listener-https:443 | rule-app1 (P:10) | pool-app1 | vm-app1 (Purple) |
| `https://app2.sta.com` | `*.sta.com` → 52.x.x.x | listener-https:443 | rule-app2 (P:20) | pool-app2 | vm-app2 (Pink) |
| `https://app3.sta.com` | `*.sta.com` → 52.x.x.x | listener-https:443 | rule-app3 (P:30) | pool-app3 | vm-app3 (Blue) |
| `http://app1.sta.com` | `*.sta.com` → 52.x.x.x | listener-http-redirect:80 | rule-http-to-https (P:5) | Redirect | → `https://app1.sta.com` |

---

## Part 16: Monitoring and Maintenance

### Step 1: Enable Application Gateway Diagnostics

1. Go to **"Application gateways"** → **"appgw-prod"**
2. Click **"Diagnostic settings"**
3. Click **"+ Add diagnostic setting"**

**Diagnostic Setting:**
- **Name**: `appgw-diagnostics`
- **Logs**: Select all:
  - ☑️ ApplicationGatewayAccessLog
  - ☑️ ApplicationGatewayPerformanceLog
  - ☑️ ApplicationGatewayFirewallLog
- **Metrics**: ☑️ AllMetrics
- **Destination**: `Send to Log Analytics workspace`
- **Log Analytics workspace**: Create new or select existing
- Click **"Save"**

**✅ Result**: Diagnostics enabled

### Step 2: Set Up Alerts

1. Go to **"Alerts"**
2. Click **"+ Create"** → **"Alert rule"**

**Alert for Unhealthy Backend:**
- **Signal**: `Unhealthy Host Count`
- **Threshold**: `Greater than 0`
- **Action group**: Create email notification
- Click **"Create"**

**✅ Result**: Alerts configured

### Step 3: Certificate Renewal Plan

**Let's Encrypt certificates expire in 90 days.**

**Renewal process:**

1. **30 days before expiry**, SSH to VM 1:
   ```bash
   ssh -i vm-app1-key.pem azureuser@20.x.x.1
   ```

2. **Renew certificate:**
   ```bash
   # Renew certificate (will prompt for DNS TXT record again)
   sudo certbot renew --manual --preferred-challenges dns
   ```

3. **Add new TXT record** in Azure DNS (same as before)

4. **Export new PFX:**
   ```bash
   sudo openssl pkcs12 -export \
     -out /tmp/sta.com-renewed.pfx \
     -inkey /etc/letsencrypt/live/sta.com/privkey.pem \
     -in /etc/letsencrypt/live/sta.com/fullchain.pem \
     -passout pass:YourSecurePassword123
   ```

5. **Download to local machine:**
   ```bash
   scp -i vm-app1-key.pem azureuser@20.x.x.1:/tmp/sta.com-renewed.pfx ./
   ```

6. **Upload to Application Gateway:**
   - Go to **"SSL certificates"**
   - Click **"+ Add"**
   - Upload new PFX
   - Update listener to use new certificate

**✅ Result**: Certificate renewal process documented

### Step 4: Backup Configuration

**Export Application Gateway configuration:**

```bash
# Using Azure CLI
az network application-gateway show \
  --resource-group rg-dns-prod \
  --name appgw-prod \
  --output json > appgw-prod-backup.json
```

**✅ Result**: Configuration backed up

---

## Part 17: Troubleshooting

### Issue 1: DNS Not Resolving

**Symptoms:**
- `nslookup app1.sta.com` returns no results
- Browser shows "DNS_PROBE_FINISHED_NXDOMAIN"

**Solutions:**

1. **Check name servers:**
   ```bash
   nslookup -type=NS sta.com
   ```
   Should show Azure DNS name servers

2. **Check A records in Azure DNS:**
   - Verify `*.sta.com` A record exists
   - Verify IP matches Application Gateway

3. **Wait for propagation:**
   - DNS changes can take up to 48 hours
   - Usually 1-4 hours

4. **Clear DNS cache:**
   ```bash
   # Windows
   ipconfig /flushdns
   
   # Linux/Mac
   sudo systemd-resolve --flush-caches
   ```

### Issue 2: SSL Certificate Error

**Symptoms:**
- Browser shows "Your connection is not private"
- Certificate warning

**Solutions:**

1. **Check certificate in Application Gateway:**
   - Go to **"SSL certificates"**
   - Verify certificate is uploaded
   - Check expiry date

2. **Verify listener uses correct certificate:**
   - Go to **"Listeners"** → **"listener-https"**
   - Check certificate is selected

3. **Test certificate:**
   ```bash
   echo | openssl s_client -servername app1.sta.com -connect app1.sta.com:443
   ```

4. **Check certificate covers domain:**
   - Certificate should be for `*.sta.com`
   - Should include both wildcard and root domain

### Issue 3: Backend Unhealthy

**Symptoms:**
- Backend health shows "Unhealthy"
- 502 Bad Gateway error

**Solutions:**

1. **Check VM is running:**
   - Go to **"Virtual machines"**
   - Verify VM status is "Running"

2. **Check nginx is running:**
   ```bash
   ssh -i vm-app1-key.pem azureuser@20.x.x.1
   sudo systemctl status nginx
   ```

3. **Check health probe:**
   - Go to **"Health probes"**
   - Verify probe settings
   - Test: `curl http://10.0.1.4/health`

4. **Check NSG rules:**
   - Verify port 80 is allowed from Application Gateway subnet

### Issue 4: Wrong Backend Serving Content

**Symptoms:**
- `app1.sta.com` shows content from `app2.sta.com`
- Routing not working correctly

**Solutions:**

1. **Check routing rule priorities:**
   - Go to **"Rules"**
   - Verify priorities: 10, 20, 30
   - Lower number = higher priority

2. **Check listener configuration:**
   - Go to **"Listeners"** → **"listener-https"**
   - Verify host type is "Multiple/Wildcard"
   - Check hostnames include `*.sta.com`

3. **Check backend pool assignments:**
   - rule-app1 → pool-app1
   - rule-app2 → pool-app2
   - rule-app3 → pool-app3

4. **Test with curl:**
   ```bash
   curl -H "Host: app1.sta.com" https://52.x.x.x
   ```

### Issue 5: HTTP Not Redirecting to HTTPS

**Symptoms:**
- `http://app1.sta.com` doesn't redirect
- Shows error or times out

**Solutions:**

1. **Check HTTP listener exists:**
   - Go to **"Listeners"**
   - Verify `listener-http-redirect` on port 80

2. **Check redirect rule:**
   - Go to **"Rules"** → **"rule-http-to-https"**
   - Verify redirection type is "Permanent"
   - Check target listener is `listener-https`

3. **Test redirect:**
   ```bash
   curl -I http://app1.sta.com
   # Should return: HTTP/1.1 301 Moved Permanently
   ```

---

## Part 18: Cost Optimization

### Current Monthly Costs

| Resource | Configuration | Cost (USD/month) |
|----------|---------------|------------------|
| Domain | sta.com | ~$1.25 (annual $15) |
| Azure DNS | 1 zone, ~10 queries/month | ~$0.50 |
| Application Gateway V2 | 2 instances, Standard tier | ~$250 |
| VM 1 (B1s) | 1 vCPU, 1 GB RAM | ~$10 |
| VM 2 (B1s) | 1 vCPU, 1 GB RAM | ~$10 |
| VM 3 (B1s) | 1 vCPU, 1 GB RAM | ~$10 |
| Public IPs | 4 static IPs | ~$16 |
| Storage | OS disks (3x 30GB) | ~$15 |
| Bandwidth | Outbound data transfer | ~$5-20 |
| **Total** | | **~$317-332/month** |

### Optimization Tips

**1. Use Autoscaling:**
- Enable autoscaling on Application Gateway
- Scale down to 1 instance during low traffic
- Save ~$125/month during off-hours

**2. Use Reserved Instances:**
- Commit to 1 or 3 years
- Save up to 30-40% on VMs
- Save ~$10-15/month

**3. Deallocate VMs when not needed:**
```bash
# Stop VM (keeps IP, no compute charges)
az vm deallocate --resource-group rg-dns-prod --name vm-app1
```

**4. Use Azure Front Door instead:**
- Global load balancing
- Built-in CDN
- May be cheaper for global traffic

**5. Use App Service instead of VMs:**
- No VM management
- Auto-scaling included
- Potentially cheaper for small apps

---

## Part 19: Security Best Practices

### Step 1: Enable Web Application Firewall (WAF)

1. Go to **"Application gateways"** → **"appgw-prod"**
2. Click **"Web application firewall"**
3. **WAF tier**: Upgrade to `WAF V2`
4. **Firewall mode**: `Prevention`
5. **Rule set**: `OWASP 3.2`
6. Click **"Save"**

**Note:** This requires upgrading to WAF tier (~$375/month instead of $250)

### Step 2: Restrict VM Access

**Update NSG to only allow traffic from Application Gateway:**

1. Go to **"Network security groups"**
2. Find NSG for VMs
3. Edit inbound rule for port 80:
   - **Source**: `IP Addresses`
   - **Source IP**: `10.0.2.0/24` (Application Gateway subnet)
   - **Destination**: `Any`
   - **Port**: `80`
   - Click **"Save"**

4. Remove public IPs from VMs (optional):
   - VMs don't need public IPs if accessed only via Application Gateway
   - Save ~$12/month

### Step 3: Enable Azure DDoS Protection

1. Go to **"Virtual networks"** → **"vnet-prod"**
2. Click **"DDoS protection"**
3. Enable **"DDoS Protection Standard"**
4. Click **"Save"**

**Note:** Costs ~$2,944/month (expensive, only for high-value production)

### Step 4: Implement Rate Limiting

**In nginx on each VM:**

```bash
# Edit nginx config
sudo nano /etc/nginx/sites-available/app1

# Add rate limiting
http {
    limit_req_zone $binary_remote_addr zone=mylimit:10m rate=10r/s;
    
    server {
        location / {
            limit_req zone=mylimit burst=20;
            ...
        }
    }
}

# Reload nginx
sudo nginx -t && sudo systemctl reload nginx
```

---

## Summary

You've successfully built a complete production setup!

**What we accomplished:**
- ✅ Purchased domain with wildcard support
- ✅ Configured Azure DNS Zone
- ✅ Created 3 VMs with custom nginx content
- ✅ Generated SSL certificates with Let's Encrypt
- ✅ Created Application Gateway with HTTPS
- ✅ Configured wildcard routing (*.sta.com)
- ✅ Set up HTTP to HTTPS redirect
- ✅ Tested and verified everything

**Production URLs:**
- ✅ `https://app1.sta.com` → VM 1 (Purple gradient)
- ✅ `https://app2.sta.com` → VM 2 (Pink gradient)
- ✅ `https://app3.sta.com` → VM 3 (Blue gradient)
- ✅ All with valid SSL certificates
- ✅ All with automatic HTTP → HTTPS redirect

**Key learnings:**
- ✅ Domain registration and DNS management
- ✅ Azure DNS Zone configuration
- ✅ Wildcard DNS records (*.domain.com)
- ✅ SSL certificate generation with Certbot
- ✅ DNS validation for wildcard certificates
- ✅ PFX certificate export for Application Gateway
- ✅ HTTPS listener configuration
- ✅ Multiple/Wildcard host type usage
- ✅ Priority-based routing
- ✅ SSL termination at Application Gateway
- ✅ Backend health monitoring
- ✅ Certificate renewal process

**This is a production-ready setup used by real companies!** 🚀

**Next steps:**
- Set up monitoring and alerts
- Configure WAF for security
- Implement CI/CD for deployments
- Add more subdomains as needed
- Set up certificate auto-renewal
- Consider Azure Front Door for global distribution

Great job! You now have hands-on experience with a complete production Application Gateway setup! 🎉
