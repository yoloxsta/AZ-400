# Day 26: Azure VPN - Point-to-Site & Site-to-Site

## What You'll Learn

Connect your networks securely with Azure VPN:
- ✅ What is VPN and why use it
- ✅ Point-to-Site VPN (your laptop → Azure)
- ✅ Site-to-Site VPN (your office → Azure)
- ✅ VPN Gateway setup via Azure Portal
- ✅ Certificate-based authentication
- ✅ VNet-to-VNet connection (bonus)
- ✅ Complete test, check, and confirm

## Table of Contents

1. [What is VPN?](#what-is-vpn)
2. [Why Use Azure VPN?](#why-use-azure-vpn)
3. [VPN Types Explained](#vpn-types-explained)
4. [Architecture](#architecture)
5. [Lab 1: Create Virtual Network and VPN Gateway](#lab-1-create-virtual-network-and-vpn-gateway)
6. [Lab 2: Point-to-Site VPN (Laptop → Azure)](#lab-2-point-to-site-vpn-laptop--azure)
7. [Lab 3: Test Point-to-Site Connection](#lab-3-test-point-to-site-connection)
8. [Lab 4: Site-to-Site VPN (Simulated Office → Azure)](#lab-4-site-to-site-vpn-simulated-office--azure)
9. [Lab 5: Test Site-to-Site Connection](#lab-5-test-site-to-site-connection)
10. [Lab 6: VNet-to-VNet VPN (Azure ↔ Azure)](#lab-6-vnet-to-vnet-vpn-azure--azure)
11. [Troubleshooting](#troubleshooting)
12. [Cleanup](#cleanup)

---

## What is VPN?

**VPN** = Virtual Private Network = A secure, encrypted tunnel between two networks.

### Simple Explanation

```
Without VPN:
┌──────────┐                              ┌──────────────┐
│ Your     │ ──── Public Internet ──────→ │ Azure VMs    │
│ Laptop   │      (anyone can see!)       │ (private IP) │
└──────────┘                              └──────────────┘
❌ Can't reach private IPs (10.0.0.4)
❌ Data travels unencrypted
❌ Anyone on internet can intercept

With VPN:
┌──────────┐                              ┌──────────────┐
│ Your     │ ═══ Encrypted Tunnel ══════→ │ Azure VMs    │
│ Laptop   │     (nobody can see!)        │ (private IP) │
└──────────┘                              └──────────────┘
✅ Can reach private IPs (10.0.0.4)
✅ Data encrypted (AES-256)
✅ Like being on the same local network
```

### Real-World Analogy

```
Think of it like this:

Public Internet = Public highway
  Anyone can see your car (data)
  Anyone can follow you
  No privacy

VPN = Private underground tunnel
  Only you can use it
  Nobody can see inside
  Direct connection to destination

┌──────────────────────────────────────────────────────────────┐
│                                                               │
│  Your House ═══════ Underground Tunnel ═══════ Office        │
│  (Laptop)          (encrypted, private)        (Azure)       │
│                                                               │
│  Even though you're far away,                                │
│  it's like you're sitting IN the office network!             │
└──────────────────────────────────────────────────────────────┘
```

---

## Why Use Azure VPN?

### The Problem

```
❌ WITHOUT VPN:

Scenario 1: Developer needs to access Azure VM
  VM has private IP: 10.0.1.4
  Developer: "I can't reach 10.0.1.4 from my laptop!"
  Solution without VPN: Open VM to public internet 😱
  Risk: Anyone can try to hack your VM

Scenario 2: Office needs to connect to Azure
  Office network: 192.168.1.0/24
  Azure network: 10.0.0.0/16
  These are DIFFERENT private networks
  They can't talk to each other!
  Solution without VPN: Expose everything publicly 😱

Scenario 3: Two Azure VNets need to communicate
  VNet-A: 10.1.0.0/16 (East US)
  VNet-B: 10.2.0.0/16 (West US)
  Different regions, different networks
  Can't communicate by default!
```

### The Solution

```
✅ WITH AZURE VPN:

Scenario 1: Point-to-Site (P2S)
  Developer laptop ═══ VPN Tunnel ═══ Azure VNet
  Now developer can reach 10.0.1.4 directly!
  ✅ Secure, encrypted, no public exposure

Scenario 2: Site-to-Site (S2S)
  Office network ═══ VPN Tunnel ═══ Azure VNet
  Office users can reach Azure VMs by private IP!
  ✅ Like extending your office network to Azure

Scenario 3: VNet-to-VNet
  Azure VNet-A ═══ VPN Tunnel ═══ Azure VNet-B
  VMs in both VNets can communicate!
  ✅ Cross-region connectivity
```

---

## VPN Types Explained

### Three Types of Azure VPN

```
┌─────────────────────────────────────────────────────────────────┐
│  AZURE VPN TYPES                                                 │
│                                                                  │
│  1. POINT-TO-SITE (P2S)                                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Single device → Azure                                   │    │
│  │                                                           │    │
│  │  👤 Laptop ═══════════════════ Azure VNet                │    │
│  │                                                           │    │
│  │  Use case: Remote developer, work from home              │    │
│  │  Devices: 1 to ~128 connections                          │    │
│  │  Auth: Certificates or Azure AD                          │    │
│  │  Setup: Easy (install VPN client)                        │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  2. SITE-TO-SITE (S2S)                                         │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Entire network → Azure                                  │    │
│  │                                                           │    │
│  │  🏢 Office ═══════════════════ Azure VNet                │    │
│  │  Network                                                  │    │
│  │                                                           │    │
│  │  Use case: Connect office/datacenter to Azure            │    │
│  │  Devices: ALL devices on office network                  │    │
│  │  Auth: Shared key (PSK) or certificates                  │    │
│  │  Setup: Needs VPN device at office                       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  3. VNET-TO-VNET                                               │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Azure VNet → Azure VNet                                 │    │
│  │                                                           │    │
│  │  ☁️ VNet-A ═══════════════════ VNet-B ☁️                │    │
│  │  (East US)                     (West US)                 │    │
│  │                                                           │    │
│  │  Use case: Multi-region Azure setup                      │    │
│  │  Auth: Shared key                                        │    │
│  │  Setup: All in Azure Portal                              │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Comparison Table

```
┌──────────────────┬──────────────────┬──────────────────┬──────────────────┐
│                   │  Point-to-Site   │  Site-to-Site    │  VNet-to-VNet    │
├──────────────────┼──────────────────┼──────────────────┼──────────────────┤
│  Connection       │  Device → Azure  │  Network → Azure │  Azure → Azure   │
│  Users            │  Individual      │  Entire office   │  VMs in VNets    │
│  VPN device       │  Not needed      │  Required        │  Not needed      │
│  Always on?       │  No (connect     │  Yes (always     │  Yes (always     │
│                   │  when needed)    │  connected)      │  connected)      │
│  Max bandwidth    │  ~1 Gbps         │  ~1.25 Gbps      │  ~1.25 Gbps      │
│  Cost             │  Gateway only    │  Gateway + device│  2 Gateways      │
│  Setup time       │  30 min          │  1 hour          │  45 min          │
│  Best for         │  Remote workers  │  Office to Azure │  Multi-region    │
└──────────────────┴──────────────────┴──────────────────┴──────────────────┘
```

---

## Architecture

### Point-to-Site Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  POINT-TO-SITE VPN                                                │
│                                                                   │
│  Your Laptop                        Azure                        │
│  ┌──────────────┐                   ┌──────────────────────────┐ │
│  │ VPN Client   │                   │  VNet: 10.0.0.0/16       │ │
│  │              │                   │                           │ │
│  │ Gets IP from │  ═══ IPsec ═══   │  ┌──────────────────┐    │ │
│  │ address pool │  ═══ Tunnel ═══  │  │ VPN Gateway       │    │ │
│  │ 172.16.0.0/24│                   │  │ (GatewaySubnet)   │    │ │
│  │              │                   │  └──────────────────┘    │ │
│  └──────────────┘                   │          │                │ │
│                                      │          ↓                │ │
│  After connecting:                   │  ┌──────────────────┐    │ │
│  Laptop can reach:                   │  │ VM: 10.0.1.4     │    │ │
│  - 10.0.1.4 (VM)                    │  │ (web server)      │    │ │
│  - 10.0.2.4 (DB)                    │  └──────────────────┘    │ │
│  - Any IP in 10.0.0.0/16           │  ┌──────────────────┐    │ │
│                                      │  │ VM: 10.0.2.4     │    │ │
│                                      │  │ (database)        │    │ │
│                                      │  └──────────────────┘    │ │
│                                      └──────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### Site-to-Site Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  SITE-TO-SITE VPN                                                 │
│                                                                   │
│  Office Network                     Azure                        │
│  ┌──────────────────┐               ┌──────────────────────────┐ │
│  │ 192.168.1.0/24   │               │  VNet: 10.0.0.0/16       │ │
│  │                   │               │                           │ │
│  │ ┌──────────┐     │  ═══ IPsec    │  ┌──────────────────┐    │ │
│  │ │ VPN      │     │  ═══ Tunnel   │  │ VPN Gateway       │    │ │
│  │ │ Device   │─────│──═══════════──│──│ (GatewaySubnet)   │    │ │
│  │ │ (Router) │     │               │  └──────────────────┘    │ │
│  │ └──────────┘     │               │          │                │ │
│  │      │           │               │          ↓                │ │
│  │ ┌────┴─────┐     │               │  ┌──────────────────┐    │ │
│  │ │ Office   │     │               │  │ VM: 10.0.1.4     │    │ │
│  │ │ PCs      │     │               │  │ (web server)      │    │ │
│  │ │ 192.168. │     │               │  └──────────────────┘    │ │
│  │ │ 1.10-50  │     │               │  ┌──────────────────┐    │ │
│  │ └──────────┘     │               │  │ VM: 10.0.2.4     │    │ │
│  └──────────────────┘               │  │ (database)        │    │ │
│                                      │  └──────────────────┘    │ │
│  Office PCs can reach:              └──────────────────────────┘ │
│  - 10.0.1.4 (Azure VM)                                          │
│  - 10.0.2.4 (Azure DB)                                          │
│  Azure VMs can reach:                                            │
│  - 192.168.1.10 (Office PC)                                     │
└──────────────────────────────────────────────────────────────────┘
```

### VPN Gateway SKUs

```
┌──────────────────┬──────────┬──────────┬──────────┬──────────────┐
│  SKU              │  Max S2S │  Max P2S │  Bandwidth│  Cost/month  │
├──────────────────┼──────────┼──────────┼──────────┼──────────────┤
│  VpnGw1          │  30      │  250     │  650 Mbps │  ~$140       │
│  VpnGw2          │  30      │  500     │  1 Gbps   │  ~$360       │
│  VpnGw3          │  30      │  1000    │  1.25 Gbps│  ~$930       │
│  VpnGw1AZ        │  30      │  250     │  650 Mbps │  ~$182       │
│  (Zone redundant)│          │          │           │              │
├──────────────────┼──────────┼──────────┼──────────┼──────────────┤
│  Basic (legacy)  │  10      │  128     │  100 Mbps │  ~$27        │
│  ⚠️ Limited      │          │          │           │              │
└──────────────────┴──────────┴──────────┴──────────┴──────────────┘

For this lab: VpnGw1 (cheapest non-Basic, supports P2S + S2S)
```

---

## Lab 1: Create Virtual Network and VPN Gateway

### What We're Building

```
┌──────────────────────────────────────────────────────────────┐
│  STEP 1: Create the foundation                                │
│                                                               │
│  VNet: vnet-day26-vpn (10.0.0.0/16)                         │
│  ├─ GatewaySubnet: 10.0.255.0/27 (for VPN Gateway)          │
│  ├─ Subnet-Web: 10.0.1.0/24 (for web VMs)                   │
│  └─ Subnet-DB: 10.0.2.0/24 (for database VMs)               │
│                                                               │
│  VPN Gateway: vpngw-day26                                    │
│  ├─ SKU: VpnGw1                                              │
│  ├─ Public IP: pip-vpngw-day26                               │
│  └─ Takes 30-45 minutes to create!                           │
└──────────────────────────────────────────────────────────────┘
```

### Step 1: Create Resource Group

```
1. Open https://portal.azure.com
2. Search "Resource groups"
3. Click "+ Create"
4. Fill in:
   - Subscription: Your subscription
   - Resource group: rg-day26-vpn
   - Region: East US
5. Click "Review + create" → "Create"
```

### Step 2: Create Virtual Network

```
1. Search "Virtual networks"
2. Click "+ Create"
3. Fill in:

   Basics tab:
   - Resource group: rg-day26-vpn
   - Name: vnet-day26-vpn
   - Region: East US

   IP Addresses tab:
   - Address space: 10.0.0.0/16
   
   - Delete the "default" subnet if it exists
   
   - Click "+ Add subnet"
     - Name: Subnet-Web
     - Starting address: 10.0.1.0
     - Size: /24 (256 addresses)
     - Click "Add"
   
   - Click "+ Add subnet"
     - Name: Subnet-DB
     - Starting address: 10.0.2.0
     - Size: /24 (256 addresses)
     - Click "Add"

4. Click "Review + create" → "Create"
```

### Step 3: Add Gateway Subnet

```
⚠️ IMPORTANT: The VPN Gateway REQUIRES a special subnet named "GatewaySubnet"

1. Go to VNet: vnet-day26-vpn
2. Left menu → "Subnets"
3. Click "+ Gateway subnet" (special button at top)
4. Fill in:
   - Name: GatewaySubnet (auto-filled, cannot change!)
   - Address range: 10.0.255.0/27 (32 addresses, minimum for gateway)
5. Click "Save"

Why /27?
  /27 = 32 IP addresses
  VPN Gateway needs at least /27
  /27 is enough for most setups
  Use /26 or /25 if you plan ExpressRoute later
```

### Step 4: Create VPN Gateway

```
⚠️ This takes 30-45 minutes! Start it and continue reading.

1. Search "Virtual network gateways"
2. Click "+ Create"
3. Fill in:

   Basics tab:
   - Subscription: Your subscription
   - Name: vpngw-day26
   - Region: East US
   - Gateway type: VPN
   - SKU: VpnGw1
   - Generation: Generation1
   - Virtual network: vnet-day26-vpn
   - Gateway subnet address range: 10.0.255.0/27 (auto-filled)
   - Public IP address: Create new
     - Name: pip-vpngw-day26
     - SKU: Standard
     - Assignment: Static
   - Enable active-active mode: Disabled
   - Configure BGP: Disabled

4. Click "Review + create" → "Create"
```

**⏱️ Wait**: 30-45 minutes (this is normal for VPN Gateway!)

```
While waiting, understand what's being created:

┌──────────────────────────────────────────────────────────────┐
│  VPN GATEWAY COMPONENTS                                       │
│                                                               │
│  1. Two VM instances (hidden, managed by Azure)              │
│     ├─ Active instance (handles traffic)                     │
│     └─ Standby instance (failover)                           │
│                                                               │
│  2. Public IP address                                        │
│     └─ This is the "front door" of your VPN                  │
│        Clients connect to this IP                            │
│                                                               │
│  3. GatewaySubnet                                            │
│     └─ Where the gateway VMs live                            │
│        You never see these VMs directly                      │
│                                                               │
│  That's why it takes 30-45 minutes:                          │
│  Azure is deploying VMs, configuring networking,             │
│  setting up encryption, and testing failover.                │
└──────────────────────────────────────────────────────────────┘
```

### Step 5: Create Test VM

While the gateway deploys, create a VM to test connectivity:

```
1. Search "Virtual machines"
2. Click "+ Create" → "Azure virtual machine"
3. Fill in:

   Basics tab:
   - Resource group: rg-day26-vpn
   - Name: vm-vpn-web
   - Region: East US
   - Image: Ubuntu Server 22.04 LTS
   - Size: Standard_B1s
   - Authentication: Password
   - Username: azureuser
   - Password: Day26VPN@2026
   - Public inbound ports: Allow SSH (22)

   Networking tab:
   - Virtual network: vnet-day26-vpn
   - Subnet: Subnet-Web (10.0.1.0/24)
   - Public IP: Create new (for initial SSH access)

4. Click "Review + create" → "Create"
```

**⏱️ Wait**: 2-3 minutes

### Step 6: Install Web Server on VM

```
1. SSH into the VM:
   ssh azureuser@<VM-PUBLIC-IP>

2. Install nginx:
   sudo apt update
   sudo apt install -y nginx

3. Create a custom page:
   sudo bash -c 'cat > /var/www/html/index.html << EOF
   <html>
   <body style="background:#1a1a2e;color:#e94560;font-family:Arial;text-align:center;padding:50px">
   <h1>Day 26 - VPN Test Server</h1>
   <h2>Private IP: $(hostname -I | awk "{print \$1}")</h2>
   <h3>Hostname: $(hostname)</h3>
   <p>If you can see this page, VPN is working!</p>
   <p>This server is on a PRIVATE network (10.0.1.x)</p>
   <p>You reached it through the VPN tunnel!</p>
   </body>
   </html>
   EOF'

4. Verify nginx is running:
   curl localhost
   
   Expected: HTML page with "Day 26 - VPN Test Server"

5. Note the private IP:
   hostname -I
   Expected: 10.0.1.4 (or similar)

6. Exit SSH:
   exit
```

### Step 7: Test, Check, and Confirm - Foundation

**Test 1: Verify VNet**

```
1. Go to "Virtual networks" → vnet-day26-vpn
2. Verify:
   ✅ Address space: 10.0.0.0/16
   ✅ Subnets: GatewaySubnet, Subnet-Web, Subnet-DB
```

**Test 2: Verify VPN Gateway**

```
1. Go to "Virtual network gateways" → vpngw-day26
2. Verify:
   ✅ Status: Succeeded
   ✅ Gateway type: VPN
   ✅ SKU: VpnGw1
   ✅ Public IP: Note the IP address (e.g., 20.xxx.xxx.xxx)
```

**Test 3: Verify VM**

```
1. Go to "Virtual machines" → vm-vpn-web
2. Verify:
   ✅ Status: Running
   ✅ Private IP: 10.0.1.4 (in Subnet-Web)
   ✅ VNet: vnet-day26-vpn
```

**Test 4: Verify VM is NOT Reachable by Private IP (Yet)**

```
From your local machine (NOT through SSH):
  ping 10.0.1.4
  
  Expected: Request timed out / No response
  ✅ This is correct! You can't reach private IP without VPN
  
  After VPN setup, this WILL work!
```

**✅ Result**: Foundation ready for VPN configuration!

---

## Lab 2: Point-to-Site VPN (Laptop → Azure)

### What is Point-to-Site?

```
Point-to-Site = YOUR laptop connects directly to Azure VNet

┌──────────────────────────────────────────────────────────────┐
│  POINT-TO-SITE                                                │
│                                                               │
│  "Point" = Your single device (laptop/PC)                    │
│  "Site"  = Azure VNet                                        │
│                                                               │
│  Your Laptop ═══ Encrypted Tunnel ═══ Azure VNet             │
│  (the point)                          (the site)             │
│                                                               │
│  After connecting:                                           │
│  - Your laptop gets an IP from Azure (172.16.0.x)           │
│  - You can reach ALL private IPs in the VNet                │
│  - Traffic is encrypted (IPsec/IKEv2 or OpenVPN)            │
│  - Like being physically connected to the Azure network     │
└──────────────────────────────────────────────────────────────┘
```

### Authentication Methods

```
┌─────────────────────────────┬─────────────────────────────────┐
│  Certificate Auth            │  Azure AD Auth                  │
├─────────────────────────────┼─────────────────────────────────┤
│  Self-signed certificates   │  Azure Active Directory         │
│  Root cert on gateway       │  OpenVPN protocol only          │
│  Client cert on laptop      │  MFA supported                  │
│  Any VPN protocol           │  Easier user management         │
│  Good for: small teams      │  Good for: enterprise           │
│  We'll use this! ✅         │                                 │
└─────────────────────────────┴─────────────────────────────────┘
```

### Step 1: Generate Certificates

We need a Root certificate (uploaded to Azure) and a Client certificate (installed on your laptop).

**On Windows (PowerShell as Administrator):**

```powershell
# Generate Root Certificate
$rootCert = New-SelfSignedCertificate `
  -Type Custom `
  -KeySpec Signature `
  -Subject "CN=Day26VPNRootCert" `
  -KeyExportPolicy Exportable `
  -HashAlgorithm sha256 `
  -KeyLength 2048 `
  -CertStoreLocation "Cert:\CurrentUser\My" `
  -KeyUsageProperty Sign `
  -KeyUsage CertSign

# Generate Client Certificate (signed by root)
$clientCert = New-SelfSignedCertificate `
  -Type Custom `
  -DnsName "Day26VPNClientCert" `
  -KeySpec Signature `
  -Subject "CN=Day26VPNClientCert" `
  -KeyExportPolicy Exportable `
  -HashAlgorithm sha256 `
  -KeyLength 2048 `
  -CertStoreLocation "Cert:\CurrentUser\My" `
  -Signer $rootCert `
  -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.2")

# Export Root Certificate (public key only - for Azure)
$rootCertBase64 = [Convert]::ToBase64String(
  $rootCert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert)
)

# Display the root certificate (copy this for Azure Portal)
Write-Host "=== ROOT CERTIFICATE (copy this) ===" -ForegroundColor Green
Write-Host $rootCertBase64
Write-Host "=== END ===" -ForegroundColor Green
```

**⚠️ IMPORTANT: Copy the entire Base64 string! You'll paste it in Azure Portal.**

```
The output looks like:
MIIDKzCCAhOgAwIBAgIQe... (long string) ...==

Copy EVERYTHING between === ROOT CERTIFICATE === and === END ===
```

**On Linux/Mac (using OpenSSL):**

```bash
# Generate Root CA key and certificate
openssl genrsa -out rootCA.key 2048
openssl req -x509 -new -nodes -key rootCA.key -sha256 -days 365 \
  -out rootCA.pem -subj "/CN=Day26VPNRootCert"

# Generate Client key and certificate
openssl genrsa -out client.key 2048
openssl req -new -key client.key -out client.csr \
  -subj "/CN=Day26VPNClientCert"
openssl x509 -req -in client.csr -CA rootCA.pem -CAkey rootCA.key \
  -CAcreateserial -out client.pem -days 365 -sha256

# Export root cert as Base64 (for Azure Portal)
openssl x509 -in rootCA.pem -outform der | base64 -w 0
echo ""

# Create client PKCS12 (for VPN client)
openssl pkcs12 -export -out client.pfx -inkey client.key -in client.pem \
  -certfile rootCA.pem -passout pass:Day26VPN

# Copy the Base64 output for Azure Portal
```

### Step 2: Configure Point-to-Site on VPN Gateway

```
1. Go to "Virtual network gateways" → vpngw-day26
2. Left menu → "Point-to-site configuration"
3. Click "Configure now"
4. Fill in:

   Address pool: 172.16.0.0/24
   (This is the IP range for VPN clients)
   (Your laptop will get an IP like 172.16.0.2)

   Tunnel type: IKEv2 and OpenVPN (SSL)
   (IKEv2 for Windows/Mac, OpenVPN for Linux)

   Authentication type: Azure certificate

   Root certificates:
   - Name: Day26VPNRootCert
   - Public certificate data: 
     Paste the Base64 string from Step 1
     (Remove any "-----BEGIN CERTIFICATE-----" and "-----END CERTIFICATE-----" lines)
     (Paste ONLY the Base64 content)

5. Click "Save"
```

**⏱️ Wait**: 5-10 minutes for configuration to apply

```
What this configures:

┌──────────────────────────────────────────────────────────────┐
│  P2S CONFIGURATION                                            │
│                                                               │
│  VPN Gateway: vpngw-day26                                    │
│  ├─ Client address pool: 172.16.0.0/24                       │
│  │   (VPN clients get IPs from this range)                   │
│  │                                                            │
│  ├─ Tunnel type: IKEv2 + OpenVPN                             │
│  │   IKEv2: Built into Windows 10/11 and macOS              │
│  │   OpenVPN: Works on Linux, Windows, Mac                   │
│  │                                                            │
│  └─ Auth: Certificate-based                                  │
│      Root cert uploaded to Azure                             │
│      Client cert installed on laptop                         │
│      Only devices with valid client cert can connect         │
└──────────────────────────────────────────────────────────────┘
```

### Step 3: Download VPN Client

```
1. Still on "Point-to-site configuration" page
2. Click "Download VPN client" (top button)
3. A ZIP file downloads
4. Extract the ZIP file

   Inside you'll find:
   ├─ WindowsAmd64/    (for 64-bit Windows)
   │   └─ VpnClientSetupAmd64.exe
   ├─ WindowsX86/      (for 32-bit Windows)
   ├─ OpenVPN/          (for OpenVPN client)
   │   ├─ vpnconfig.ovpn
   │   └─ (certificate files)
   └─ Generic/          (for other clients)
```

### Step 4: Connect to VPN

**Windows (Native IKEv2):**

```
1. Run VpnClientSetupAmd64.exe from the downloaded ZIP
2. It installs a VPN connection in Windows
3. Go to Settings → Network & Internet → VPN
4. You'll see "vnet-day26-vpn" connection
5. Click "Connect"
6. Windows uses the client certificate automatically
7. Status: Connected ✅

After connecting:
  - Open CMD: ipconfig
  - You'll see a new adapter with IP 172.16.0.x
  - This is your VPN IP!
```

**Windows (OpenVPN):**

```
1. Install OpenVPN client: https://openvpn.net/community-downloads/
2. Copy vpnconfig.ovpn from the ZIP to:
   C:\Users\<you>\OpenVPN\config\
3. Right-click OpenVPN tray icon → Connect
4. Status: Connected ✅
```

**Mac (IKEv2):**

```
1. Open the ZIP → Generic folder
2. Find VpnSettings.xml → note the VPN server address
3. System Preferences → Network → "+"
4. Interface: VPN
5. VPN Type: IKEv2
6. Service Name: Azure-Day26-VPN
7. Server Address: (from VpnSettings.xml)
8. Remote ID: (same as server address)
9. Authentication Settings → Certificate
10. Select the client certificate
11. Click "Connect"
```

**Linux (OpenVPN):**

```bash
# Install OpenVPN
sudo apt install openvpn

# Copy the ovpn config from ZIP
# Edit vpnconfig.ovpn to add client cert paths:
# cert client.pem
# key client.key

# Connect
sudo openvpn --config vpnconfig.ovpn

# Status: Connected ✅
```

### Step 5: Test, Check, and Confirm - P2S Configuration

**Test 1: Verify P2S Configuration**

```
1. Go to VPN Gateway → Point-to-site configuration
2. Verify:
   ✅ Address pool: 172.16.0.0/24
   ✅ Tunnel type: IKEv2 and OpenVPN
   ✅ Authentication: Azure certificate
   ✅ Root certificate: Day26VPNRootCert (uploaded)
```

**Test 2: Verify VPN Client Downloaded**

```
1. Check downloaded ZIP contains:
   ✅ WindowsAmd64/VpnClientSetupAmd64.exe
   ✅ OpenVPN/vpnconfig.ovpn
   ✅ Generic/VpnSettings.xml
```

**Test 3: Verify VPN Connection Status**

```
After connecting:
1. Go to VPN Gateway → Point-to-site configuration
2. Check "Allocated IP addresses" section
3. Verify:
   ✅ Your connection appears in the list
   ✅ Allocated IP: 172.16.0.x
   ✅ Connection count: 1 (or more)
```

**✅ Result**: Point-to-Site VPN configured!

---

## Lab 3: Test Point-to-Site Connection

### Step 1: Verify VPN Connection on Your Machine

**Windows:**

```
1. Open Command Prompt
2. Run: ipconfig /all

3. Look for the VPN adapter:
   PPP adapter vnet-day26-vpn:
     IPv4 Address: 172.16.0.2
     ✅ You have a VPN IP!

4. Run: route print
   Look for route to 10.0.0.0:
   10.0.0.0    255.255.0.0    On-link    172.16.0.2
   ✅ Traffic to 10.0.0.0/16 goes through VPN!
```

**Linux/Mac:**

```bash
# Check VPN interface
ifconfig | grep -A 5 "tun\|ppp"

# Check routes
ip route | grep 10.0

# Expected:
# 10.0.0.0/16 via 172.16.0.1 dev tun0
# ✅ Route to Azure VNet through VPN tunnel
```

### Step 2: Ping Azure VM by Private IP

```
From your local machine (with VPN connected):

ping 10.0.1.4

Expected:
Reply from 10.0.1.4: bytes=32 time=15ms TTL=64
Reply from 10.0.1.4: bytes=32 time=14ms TTL=64
Reply from 10.0.1.4: bytes=32 time=16ms TTL=64

✅ You can reach the Azure VM by PRIVATE IP through VPN!

Note: If ping doesn't work, the VM's NSG might block ICMP.
Fix: Add inbound rule to allow ICMP on the VM's NSG.
```

### Step 3: Access Web Server by Private IP

```
1. Open your web browser (on your local machine)
2. Go to: http://10.0.1.4

Expected:
  Day 26 - VPN Test Server
  Private IP: 10.0.1.4
  Hostname: vm-vpn-web
  If you can see this page, VPN is working!

✅ You accessed an Azure VM web server using its PRIVATE IP!
✅ No public IP needed!
✅ Traffic encrypted through VPN tunnel!
```

### Step 4: SSH by Private IP

```
From your local machine (with VPN connected):

ssh azureuser@10.0.1.4

Expected:
  Welcome to Ubuntu 22.04...
  azureuser@vm-vpn-web:~$

✅ SSH to Azure VM using private IP through VPN!
```

### Step 5: Remove Public IP from VM (Security Hardening)

```
Now that VPN works, you don't need the public IP on the VM!

1. Go to VM: vm-vpn-web
2. Left menu → "Networking" → "Network settings"
3. Click on the Network Interface
4. Click on the IP configuration
5. Public IP address: Disassociate
6. Click "Save"

Now the VM is ONLY accessible through VPN:
  ✅ No public IP = No direct internet access to VM
  ✅ Only VPN users can reach it
  ✅ Much more secure!

Test: 
  - With VPN: ssh azureuser@10.0.1.4 → ✅ Works
  - Without VPN: ssh azureuser@10.0.1.4 → ❌ Can't reach
```

### Step 6: Test, Check, and Confirm - P2S Connection

**Test 1: Verify VPN Connected**

```
Windows: Settings → Network → VPN → Status: Connected ✅
Linux: ip addr show tun0 → Shows 172.16.0.x ✅
Mac: System Preferences → Network → VPN → Connected ✅
```

**Test 2: Verify Private IP Reachable**

```
ping 10.0.1.4
✅ Reply received (latency ~10-30ms typical)
```

**Test 3: Verify Web Access**

```
Browser: http://10.0.1.4
✅ "Day 26 - VPN Test Server" page loads
```

**Test 4: Verify SSH Access**

```
ssh azureuser@10.0.1.4
✅ SSH connection successful via private IP
```

**Test 5: Verify Connection in Azure Portal**

```
1. VPN Gateway → Point-to-site configuration
2. ✅ Connected clients: 1 (or more)
3. ✅ Allocated IP shown
```

**Test 6: Verify Without VPN (Disconnect First)**

```
1. Disconnect VPN
2. ping 10.0.1.4 → ❌ No response (correct!)
3. http://10.0.1.4 → ❌ Can't reach (correct!)
4. Reconnect VPN
5. ping 10.0.1.4 → ✅ Response (VPN working!)
```

**✅ Result**: Point-to-Site VPN fully working!

---

## Lab 4: Site-to-Site VPN (Simulated Office → Azure)

### What is Site-to-Site?

```
Site-to-Site = Connect an ENTIRE network to Azure

Real world:
  Your office has a VPN router (Cisco, Fortinet, etc.)
  That router connects to Azure VPN Gateway
  ALL office computers can reach Azure VMs

For this lab:
  We don't have a physical office router
  So we'll SIMULATE it using a second Azure VNet + VM
  This VM will act as our "office VPN device"

┌──────────────────────────────────────────────────────────────┐
│  WHAT WE'LL BUILD                                             │
│                                                               │
│  "Office" (simulated)              Azure (real)              │
│  VNet: 192.168.0.0/16             VNet: 10.0.0.0/16         │
│  ┌──────────────────┐             ┌──────────────────┐       │
│  │ vm-office         │             │ vm-vpn-web       │       │
│  │ 192.168.1.4      │             │ 10.0.1.4         │       │
│  └──────────────────┘             └──────────────────┘       │
│          │                                 │                  │
│  ┌──────────────────┐             ┌──────────────────┐       │
│  │ VPN Gateway       │═══ S2S ═══│ VPN Gateway       │       │
│  │ (office side)     │  Tunnel    │ vpngw-day26       │       │
│  └──────────────────┘             └──────────────────┘       │
│                                                               │
│  After setup:                                                │
│  vm-office (192.168.1.4) can ping vm-vpn-web (10.0.1.4)    │
│  vm-vpn-web (10.0.1.4) can ping vm-office (192.168.1.4)    │
└──────────────────────────────────────────────────────────────┘
```

### Step 1: Create "Office" Virtual Network

```
1. Search "Virtual networks"
2. Click "+ Create"
3. Fill in:

   Basics tab:
   - Resource group: rg-day26-vpn
   - Name: vnet-office-simulated
   - Region: East US (same region for lab simplicity)

   IP Addresses tab:
   - Address space: 192.168.0.0/16
   
   - Delete default subnet if exists
   
   - Click "+ Add subnet"
     - Name: Subnet-Office
     - Starting address: 192.168.1.0
     - Size: /24
     - Click "Add"

4. Click "Review + create" → "Create"
```

### Step 2: Add Gateway Subnet to Office VNet

```
1. Go to VNet: vnet-office-simulated
2. Left menu → "Subnets"
3. Click "+ Gateway subnet"
4. Address range: 192.168.255.0/27
5. Click "Save"
```

### Step 3: Create Office VPN Gateway

```
⚠️ Another 30-45 minute wait!

1. Search "Virtual network gateways"
2. Click "+ Create"
3. Fill in:
   - Name: vpngw-office
   - Region: East US
   - Gateway type: VPN
   - SKU: VpnGw1
   - Generation: Generation1
   - Virtual network: vnet-office-simulated
   - Public IP address: Create new
     - Name: pip-vpngw-office
   - Enable active-active mode: Disabled
   - Configure BGP: Disabled

4. Click "Review + create" → "Create"
```

**⏱️ Wait**: 30-45 minutes

### Step 4: Create Office Test VM

While gateway deploys:

```
1. Search "Virtual machines"
2. Click "+ Create" → "Azure virtual machine"
3. Fill in:
   - Resource group: rg-day26-vpn
   - Name: vm-office
   - Region: East US
   - Image: Ubuntu Server 22.04 LTS
   - Size: Standard_B1s
   - Username: azureuser
   - Password: Day26VPN@2026
   - Public inbound ports: Allow SSH (22)

   Networking tab:
   - Virtual network: vnet-office-simulated
   - Subnet: Subnet-Office (192.168.1.0/24)

4. Click "Review + create" → "Create"
```

### Step 5: Create Local Network Gateways

```
A Local Network Gateway represents the "other side" of the VPN.

Each side needs to know about the other side:
  - Azure side needs to know about Office (IP + address space)
  - Office side needs to know about Azure (IP + address space)
```

**Create Local Network Gateway for Office (on Azure side):**

```
1. Search "Local network gateways"
2. Click "+ Create"
3. Fill in:
   - Resource group: rg-day26-vpn
   - Region: East US
   - Name: lng-office
   - Endpoint: IP address
   - IP address: <PUBLIC IP of vpngw-office>
     (Find this: Virtual network gateways → vpngw-office → Overview → Public IP)
   - Address space: 192.168.0.0/16
     (This is the office network range)
4. Click "Review + create" → "Create"
```

**Create Local Network Gateway for Azure (on Office side):**

```
1. Search "Local network gateways"
2. Click "+ Create"
3. Fill in:
   - Resource group: rg-day26-vpn
   - Region: East US
   - Name: lng-azure
   - Endpoint: IP address
   - IP address: <PUBLIC IP of vpngw-day26>
     (Find this: Virtual network gateways → vpngw-day26 → Overview → Public IP)
   - Address space: 10.0.0.0/16
     (This is the Azure VNet range)
4. Click "Review + create" → "Create"
```

### Step 6: Create Site-to-Site Connections

Now connect the two gateways with a shared key.

**Connection 1: Azure → Office**

```
1. Go to "Virtual network gateways" → vpngw-day26
2. Left menu → "Connections"
3. Click "+ Add"
4. Fill in:
   - Name: azure-to-office
   - Connection type: Site-to-site (IPsec)
   - Virtual network gateway: vpngw-day26 (auto-selected)
   - Local network gateway: lng-office
   - Shared key (PSK): Day26SharedKey2026!
     ⚠️ MUST be the same on both sides!
   - IKE Protocol: IKEv2
5. Click "OK"
```

**Connection 2: Office → Azure**

```
1. Go to "Virtual network gateways" → vpngw-office
2. Left menu → "Connections"
3. Click "+ Add"
4. Fill in:
   - Name: office-to-azure
   - Connection type: Site-to-site (IPsec)
   - Virtual network gateway: vpngw-office (auto-selected)
   - Local network gateway: lng-azure
   - Shared key (PSK): Day26SharedKey2026!
     ⚠️ SAME key as Connection 1!
   - IKE Protocol: IKEv2
5. Click "OK"
```

**⏱️ Wait**: 5-10 minutes for connection to establish

### Step 7: Verify Connection Status

```
1. Go to vpngw-day26 → Connections
2. Check azure-to-office:
   Status should change from "Connecting" → "Connected"

3. Go to vpngw-office → Connections
4. Check office-to-azure:
   Status should change from "Connecting" → "Connected"

Both must show "Connected" ✅
```

```
┌──────────────────────────────────────────────────────────────┐
│  CONNECTION STATUS                                            │
│                                                               │
│  vpngw-day26 → Connections:                                  │
│  ┌────────────────────┬──────────┬──────────────────┐        │
│  │ Name                │ Status   │ Peer              │        │
│  ├────────────────────┼──────────┼──────────────────┤        │
│  │ azure-to-office    │Connected │ lng-office        │        │
│  └────────────────────┴──────────┴──────────────────┘        │
│                                                               │
│  vpngw-office → Connections:                                 │
│  ┌────────────────────┬──────────┬──────────────────┐        │
│  │ Name                │ Status   │ Peer              │        │
│  ├────────────────────┼──────────┼──────────────────┤        │
│  │ office-to-azure    │Connected │ lng-azure         │        │
│  └────────────────────┴──────────┴──────────────────┘        │
│                                                               │
│  ✅ Site-to-Site VPN tunnel is UP!                            │
└──────────────────────────────────────────────────────────────┘
```

### Step 8: Test, Check, and Confirm - S2S Configuration

**Test 1: Verify Both Gateways**

```
1. Virtual network gateways → vpngw-day26
   ✅ Status: Succeeded
   ✅ Public IP: noted

2. Virtual network gateways → vpngw-office
   ✅ Status: Succeeded
   ✅ Public IP: noted
```

**Test 2: Verify Local Network Gateways**

```
1. Local network gateways → lng-office
   ✅ IP: matches vpngw-office public IP
   ✅ Address space: 192.168.0.0/16

2. Local network gateways → lng-azure
   ✅ IP: matches vpngw-day26 public IP
   ✅ Address space: 10.0.0.0/16
```

**Test 3: Verify Connection Status**

```
1. vpngw-day26 → Connections → azure-to-office
   ✅ Status: Connected
   ✅ Data in/out: Shows bytes transferred

2. vpngw-office → Connections → office-to-azure
   ✅ Status: Connected
   ✅ Data in/out: Shows bytes transferred
```

**✅ Result**: Site-to-Site VPN tunnel established!

---

## Lab 5: Test Site-to-Site Connection

### Step 1: Test from Office VM → Azure VM

```
1. SSH into vm-office (use its public IP):
   ssh azureuser@<vm-office-PUBLIC-IP>

2. Ping Azure VM by PRIVATE IP:
   ping 10.0.1.4 -c 4

   Expected:
   PING 10.0.1.4 (10.0.1.4) 56(84) bytes of data.
   64 bytes from 10.0.1.4: icmp_seq=1 ttl=64 time=5.23 ms
   64 bytes from 10.0.1.4: icmp_seq=2 ttl=64 time=4.87 ms
   64 bytes from 10.0.1.4: icmp_seq=3 ttl=64 time=5.01 ms
   64 bytes from 10.0.1.4: icmp_seq=4 ttl=64 time=4.95 ms

   ✅ Office VM can reach Azure VM through VPN tunnel!

   Note: If ping fails, check NSG rules on both VMs.
   Add inbound rule: Allow ICMP from 10.0.0.0/16 and 192.168.0.0/16
```

### Step 2: Test Web Access from Office → Azure

```
1. Still on vm-office:
   curl http://10.0.1.4

   Expected:
   <html>
   <body>
   <h1>Day 26 - VPN Test Server</h1>
   <h2>Private IP: 10.0.1.4</h2>
   ...
   </body>
   </html>

   ✅ Office VM can access Azure web server through VPN!
```

### Step 3: Test from Azure VM → Office VM

```
1. SSH into vm-vpn-web (use private IP via P2S VPN, or public IP):
   ssh azureuser@10.0.1.4  (via VPN)
   or
   ssh azureuser@<vm-vpn-web-PUBLIC-IP>

2. Ping Office VM by PRIVATE IP:
   ping 192.168.1.4 -c 4

   Expected:
   64 bytes from 192.168.1.4: icmp_seq=1 ttl=64 time=5.15 ms
   64 bytes from 192.168.1.4: icmp_seq=2 ttl=64 time=4.92 ms

   ✅ Azure VM can reach Office VM through VPN tunnel!
   ✅ Bidirectional communication working!
```

### Step 4: Test SSH from Office → Azure (Private IP)

```
1. On vm-office:
   ssh azureuser@10.0.1.4

   Password: Day26VPN@2026

   Expected:
   Welcome to Ubuntu 22.04...
   azureuser@vm-vpn-web:~$

   ✅ SSH from Office to Azure using private IP!

2. Check hostname to confirm you're on the Azure VM:
   hostname
   Expected: vm-vpn-web

3. Exit back to office VM:
   exit
```

### Step 5: View Connection Metrics

```
1. Go to vpngw-day26 → Connections → azure-to-office
2. Left menu → "Metrics" (or check Overview)
3. View:
   - Data In (bytes received through tunnel)
   - Data Out (bytes sent through tunnel)
   - Tunnel Ingress/Egress Bytes
   
   ✅ Data flowing through the tunnel confirms it's working!

4. Go to vpngw-day26 → Overview
5. Check:
   - Connection status: Connected
   - Data transferred: Shows bytes in/out
```

### Step 6: Test, Check, and Confirm - S2S Connection

**Test 1: Office → Azure Ping**

```
From vm-office:
  ping 10.0.1.4 -c 4
  ✅ All 4 packets received
  ✅ Latency: < 10ms (same region)
```

**Test 2: Azure → Office Ping**

```
From vm-vpn-web:
  ping 192.168.1.4 -c 4
  ✅ All 4 packets received
  ✅ Bidirectional communication confirmed
```

**Test 3: Office → Azure HTTP**

```
From vm-office:
  curl http://10.0.1.4
  ✅ Web page received from Azure VM
```

**Test 4: Office → Azure SSH**

```
From vm-office:
  ssh azureuser@10.0.1.4
  ✅ SSH connection successful via private IP
  ✅ hostname shows: vm-vpn-web
```

**Test 5: Connection Metrics**

```
In Azure Portal:
  vpngw-day26 → Connections → azure-to-office
  ✅ Status: Connected
  ✅ Data In: > 0 bytes
  ✅ Data Out: > 0 bytes
```

**Test 6: Traceroute**

```
From vm-office:
  traceroute 10.0.1.4

  Expected:
  1  10.0.1.4  5.123 ms  4.987 ms  5.045 ms

  ✅ Direct route through VPN tunnel (1 hop)
  ✅ No public internet hops visible
```

**✅ Result**: Site-to-Site VPN fully working with bidirectional communication!

---

## Lab 6: VNet-to-VNet VPN (Azure ↔ Azure)

### What is VNet-to-VNet?

```
VNet-to-VNet = Connect two Azure VNets directly

┌──────────────────────────────────────────────────────────────┐
│  VNET-TO-VNET                                                 │
│                                                               │
│  Same as Site-to-Site but:                                   │
│  - Both sides are Azure VNets                                │
│  - No physical VPN device needed                             │
│  - Can be cross-region (East US ↔ West US)                   │
│  - Uses VPN Gateways on both sides                           │
│                                                               │
│  We already have this from Lab 4!                            │
│  vnet-day26-vpn ←→ vnet-office-simulated                    │
│  is essentially a VNet-to-VNet connection                    │
│                                                               │
│  But let's understand the DEDICATED VNet-to-VNet method:     │
└──────────────────────────────────────────────────────────────┘
```

### VNet-to-VNet vs VNet Peering

```
┌─────────────────────────────┬─────────────────────────────────┐
│  VNet-to-VNet VPN            │  VNet Peering                   │
├─────────────────────────────┼─────────────────────────────────┤
│  Uses VPN Gateways          │  No gateways needed             │
│  Encrypted (IPsec)          │  Not encrypted (Azure backbone) │
│  ~1.25 Gbps max             │  Network bandwidth (very fast)  │
│  Higher latency             │  Low latency                    │
│  Gateway cost (~$140/mo)    │  Data transfer cost only        │
│  Cross-region: Yes          │  Cross-region: Yes              │
│  Cross-subscription: Yes    │  Cross-subscription: Yes        │
│  Cross-tenant: Yes          │  Cross-tenant: Yes              │
│                             │                                 │
│  Best for:                  │  Best for:                      │
│  - Need encryption          │  - High bandwidth               │
│  - Transitive routing       │  - Low latency                  │
│  - Complex topologies       │  - Simple connectivity          │
└─────────────────────────────┴─────────────────────────────────┘

💡 For most Azure-to-Azure scenarios, VNet Peering is simpler and faster.
   Use VNet-to-VNet VPN when you need encryption or complex routing.
```

### Step 1: Create VNet-to-VNet Connection (Alternative Method)

```
We already have a working S2S connection between our two VNets.
Here's how to create a dedicated VNet-to-VNet connection type:

1. Go to "Virtual network gateways" → vpngw-day26
2. Left menu → "Connections"
3. Click "+ Add"
4. Fill in:
   - Name: vnet-to-vnet-test
   - Connection type: VNet-to-VNet
   - Second virtual network gateway: vpngw-office
   - Shared key (PSK): VNet2VNet2026!
5. Click "OK"

Note: This creates connections on BOTH sides automatically
(unlike S2S where you create each side manually)
```

**⏱️ Wait**: 5-10 minutes

### Step 2: Verify VNet-to-VNet Connection

```
1. Go to vpngw-day26 → Connections
2. Verify:
   ✅ vnet-to-vnet-test: Connected
   
3. Go to vpngw-office → Connections
4. Verify:
   ✅ Corresponding connection: Connected
```

### Step 3: Test, Check, and Confirm - VNet-to-VNet

**Test 1: Verify Connection**

```
1. vpngw-day26 → Connections
   ✅ vnet-to-vnet-test: Connected

2. vpngw-office → Connections
   ✅ Matching connection: Connected
```

**Test 2: Verify Connectivity**

```
From vm-office:
  ping 10.0.1.4 -c 4
  ✅ Packets received through VNet-to-VNet tunnel

From vm-vpn-web:
  ping 192.168.1.4 -c 4
  ✅ Bidirectional communication
```

**✅ Result**: VNet-to-VNet VPN working!

---

## Complete Summary - What We Built

```
┌─────────────────────────────────────────────────────────────────┐
│  DAY 26 - AZURE VPN COMPLETE SETUP                               │
│                                                                  │
│  VNet: vnet-day26-vpn (10.0.0.0/16)                            │
│  ├─ GatewaySubnet: 10.0.255.0/27                               │
│  ├─ Subnet-Web: 10.0.1.0/24                                    │
│  ├─ Subnet-DB: 10.0.2.0/24                                     │
│  └─ VPN Gateway: vpngw-day26 (VpnGw1)                          │
│                                                                  │
│  VNet: vnet-office-simulated (192.168.0.0/16)                   │
│  ├─ GatewaySubnet: 192.168.255.0/27                             │
│  ├─ Subnet-Office: 192.168.1.0/24                               │
│  └─ VPN Gateway: vpngw-office (VpnGw1)                         │
│                                                                  │
│  Point-to-Site VPN:                                             │
│  ├─ Client pool: 172.16.0.0/24                                  │
│  ├─ Auth: Certificate-based                                     │
│  ├─ Protocol: IKEv2 + OpenVPN                                   │
│  └─ ✅ Laptop → Azure VM via private IP                        │
│                                                                  │
│  Site-to-Site VPN:                                              │
│  ├─ Connection: azure-to-office ↔ office-to-azure              │
│  ├─ Auth: Shared key (PSK)                                      │
│  ├─ Protocol: IKEv2/IPsec                                       │
│  └─ ✅ Office network ↔ Azure network bidirectional            │
│                                                                  │
│  VNet-to-VNet:                                                  │
│  ├─ Direct Azure VNet connection                                │
│  └─ ✅ Cross-VNet communication                                │
│                                                                  │
│  VMs:                                                           │
│  ├─ vm-vpn-web (10.0.1.4) - nginx web server                   │
│  └─ vm-office (192.168.1.4) - simulated office PC              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Troubleshooting

### Issue 1: P2S Connection Fails

```
Symptom: VPN client can't connect

Solutions:
1. Certificate issue:
   - Verify root cert Base64 is correct in Portal
   - Ensure client cert is signed by the root cert
   - Check cert hasn't expired
   
2. Re-download VPN client:
   - After any P2S config change, re-download the client
   - Install the new client package

3. Check tunnel type:
   - Windows 10/11: IKEv2 works best
   - Linux: Use OpenVPN
   - Mac: IKEv2 or OpenVPN

4. Firewall blocking:
   - IKEv2 uses UDP 500 and 4500
   - OpenVPN uses TCP 443 or UDP 1194
   - Ensure your firewall allows these ports
```

### Issue 2: S2S Connection Stuck on "Connecting"

```
Symptom: Connection status stays "Connecting" (never "Connected")

Solutions:
1. Shared key mismatch:
   - MOST COMMON issue!
   - Verify EXACT same key on both sides
   - Check for extra spaces or wrong characters

2. Public IP wrong:
   - Verify Local Network Gateway IPs match actual gateway public IPs
   - If gateway was recreated, IP may have changed

3. Address space overlap:
   - VNet address spaces must NOT overlap
   - 10.0.0.0/16 and 192.168.0.0/16 are fine (no overlap)
   - 10.0.0.0/16 and 10.0.0.0/16 would fail (overlap!)

4. Check gateway status:
   - Both gateways must be "Succeeded"
   - If one is still deploying, connection can't establish
```

### Issue 3: Connected but Can't Ping

```
Symptom: VPN shows "Connected" but ping/SSH doesn't work

Solutions:
1. NSG (Network Security Group) blocking:
   - Check inbound rules on destination VM's NSG
   - Add rule: Allow ICMP from source network
   - Add rule: Allow SSH (22) from source network
   
   For Azure VM NSG:
   - Allow inbound from 192.168.0.0/16 (office network)
   - Allow inbound from 172.16.0.0/24 (P2S clients)
   
   For Office VM NSG:
   - Allow inbound from 10.0.0.0/16 (Azure network)

2. Route table issue:
   - Check effective routes on VM NIC
   - Verify route to remote network exists
   - VPN Gateway should add routes automatically

3. VM firewall:
   - Ubuntu: sudo ufw status (check if blocking)
   - Windows: Check Windows Firewall rules
```

### Issue 4: Slow VPN Performance

```
Symptom: VPN works but is slow

Solutions:
1. Check gateway SKU:
   - Basic: 100 Mbps max
   - VpnGw1: 650 Mbps max
   - Upgrade if needed

2. Check region:
   - Cross-region VPN has higher latency
   - Same-region: ~5ms
   - Cross-region: ~30-100ms

3. Check MTU:
   - VPN overhead reduces MTU
   - Try: ping -f -l 1400 10.0.1.4 (Windows)
   - Try: ping -M do -s 1400 10.0.1.4 (Linux)
```

### Useful Diagnostic Commands

```bash
# On Linux VM - check routes
ip route show

# Check if VPN traffic is flowing
sudo tcpdump -i any host 10.0.1.4

# Test specific port
nc -zv 10.0.1.4 80
nc -zv 10.0.1.4 22

# DNS resolution test
nslookup vm-vpn-web

# Check gateway connection in Portal
# Virtual network gateways → Connections → Click connection → "Troubleshoot"
```

---

## Real-World Production Tips

```
┌─────────────────────────────────────────────────────────────────┐
│  PRODUCTION VPN BEST PRACTICES                                   │
│                                                                  │
│  1. High Availability:                                          │
│     ├─ Use Active-Active VPN Gateway                            │
│     ├─ Two tunnels for redundancy                               │
│     └─ Zone-redundant SKU (VpnGw1AZ)                           │
│                                                                  │
│  2. Security:                                                   │
│     ├─ Use strong shared keys (32+ characters)                  │
│     ├─ Rotate keys periodically                                 │
│     ├─ Use Azure AD auth for P2S (instead of certs)            │
│     ├─ Enable DDoS protection on VNet                           │
│     └─ Use NSGs to restrict traffic                             │
│                                                                  │
│  3. Monitoring:                                                 │
│     ├─ Enable diagnostic logs on gateway                        │
│     ├─ Set up alerts for tunnel disconnection                   │
│     ├─ Monitor bandwidth usage                                  │
│     └─ Use Connection Monitor for end-to-end testing            │
│                                                                  │
│  4. Performance:                                                │
│     ├─ Choose appropriate SKU for bandwidth needs               │
│     ├─ Use ExpressRoute for > 1 Gbps (dedicated connection)    │
│     ├─ Enable BGP for dynamic routing                           │
│     └─ Consider Azure Virtual WAN for complex topologies        │
│                                                                  │
│  5. Cost:                                                       │
│     ├─ Gateway runs 24/7 (even if no traffic)                  │
│     ├─ Delete gateways when not needed (dev/test)              │
│     ├─ VpnGw1 is sufficient for most small/medium businesses   │
│     └─ Data transfer costs apply for cross-region               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Cleanup

### Delete All Resources

```
⚠️ VPN Gateways cost ~$140/month each! Delete when done!

1. Delete Connections first:
   - vpngw-day26 → Connections → Delete all connections
   - vpngw-office → Connections → Delete all connections

2. Delete VPN Gateways (takes 15-20 minutes each):
   - Virtual network gateways → vpngw-day26 → Delete
   - Virtual network gateways → vpngw-office → Delete
   ⏱️ Wait for both to complete

3. Delete Local Network Gateways:
   - Local network gateways → lng-office → Delete
   - Local network gateways → lng-azure → Delete

4. Delete Resource Group (deletes everything else):
   - Resource groups → rg-day26-vpn → Delete
   - Type the name to confirm
   - Click "Delete"

5. Remove VPN client from your machine:
   - Windows: Settings → Network → VPN → Remove
   - Mac: System Preferences → Network → Remove VPN
   - Linux: Remove OpenVPN config file

6. Delete certificates (optional):
   - Windows: certmgr.msc → Personal → Certificates
     Delete Day26VPNRootCert and Day26VPNClientCert
   - Linux/Mac: Delete .pem, .key, .pfx files
```

**⏱️ Wait**: 15-20 minutes for gateway deletion

**✅ Result**: All resources deleted!

---

## Quick Reference

### VPN Gateway Commands (Portal Locations)

```
Create VPN Gateway:
  Search "Virtual network gateways" → "+ Create"

Configure P2S:
  VPN Gateway → "Point-to-site configuration"

Create S2S Connection:
  VPN Gateway → "Connections" → "+ Add"

Create Local Network Gateway:
  Search "Local network gateways" → "+ Create"

View Connection Status:
  VPN Gateway → "Connections" → Check status

Download VPN Client:
  VPN Gateway → "Point-to-site configuration" → "Download VPN client"

Troubleshoot Connection:
  VPN Gateway → "Connections" → Click connection → "Troubleshoot"
```

### Key IP Ranges in This Lab

```
Azure VNet:           10.0.0.0/16
  Subnet-Web:         10.0.1.0/24
  Subnet-DB:          10.0.2.0/24
  GatewaySubnet:      10.0.255.0/27

Office VNet:          192.168.0.0/16
  Subnet-Office:      192.168.1.0/24
  GatewaySubnet:      192.168.255.0/27

P2S Client Pool:      172.16.0.0/24
```

### VPN Protocols

```
IKEv2:
  - Built into Windows 10/11 and macOS
  - Fast reconnection (good for mobile)
  - UDP 500 and 4500

OpenVPN:
  - Works on all platforms
  - TCP 443 (passes through most firewalls)
  - Needs OpenVPN client software

SSTP (Windows only):
  - TCP 443
  - Built into Windows
  - Good when IKEv2 is blocked
```

### Useful Links

- [Azure VPN Gateway Documentation](https://learn.microsoft.com/azure/vpn-gateway/)
- [Point-to-Site VPN](https://learn.microsoft.com/azure/vpn-gateway/point-to-site-about)
- [Site-to-Site VPN](https://learn.microsoft.com/azure/vpn-gateway/tutorial-site-to-site-portal)
- [VPN Gateway Pricing](https://azure.microsoft.com/pricing/details/vpn-gateway/)
- [VPN Gateway FAQ](https://learn.microsoft.com/azure/vpn-gateway/vpn-gateway-vpn-faq)
- [Supported VPN Devices](https://learn.microsoft.com/azure/vpn-gateway/vpn-gateway-about-vpn-devices)

---

**🎉 Congratulations!** You've completed Day 26 covering Azure VPN with Point-to-Site, Site-to-Site, and VNet-to-VNet connections!