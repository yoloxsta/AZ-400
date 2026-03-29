# Day 33: AKS Internal API → Public Access for Mobile Teams

## What You'll Learn

Deploy an internal API on AKS and securely expose it to mobile developers:
- ✅ Deploy simple app on AKS with Internal AGIC
- ✅ Why internal first? (security architecture)
- ✅ 5 Methods to expose internal API publicly
- ✅ Method chosen: Azure Front Door + Private Link
- ✅ API Key / Token authentication
- ✅ Give mobile teams a public URL with token
- ✅ Complete test, check, and confirm

## Table of Contents

1. [The Problem](#the-problem)
2. [5 Methods to Expose Internal API](#5-methods-to-expose-internal-api)
3. [Lab 1: Deploy App on AKS with Internal AGIC](#lab-1-deploy-app-on-aks-with-internal-agic)
4. [Lab 2: Verify Internal-Only Access](#lab-2-verify-internal-only-access)
5. [Lab 3: Method 1 - Azure Front Door + Private Link](#lab-3-method-1---azure-front-door--private-link)
6. [Lab 4: Method 2 - Azure API Management (APIM)](#lab-4-method-2---azure-api-management-apim)
7. [Lab 5: Method 3 - Application Gateway (Public) in Front](#lab-5-method-3---application-gateway-public-in-front)
8. [Lab 6: Add Token Authentication](#lab-6-add-token-authentication)
9. [Lab 7: Give Mobile Teams Access](#lab-7-give-mobile-teams-access)
10. [Cleanup](#cleanup)

---

## The Problem

```
┌──────────────────────────────────────────────────────────────────┐
│  THE SCENARIO                                                     │
│                                                                   │
│  You deployed an API on AKS with Internal AGIC.                  │
│  Internal = Private IP only (e.g., 10.0.1.50)                   │
│  Only accessible from within the VNet.                           │
│                                                                   │
│  Now mobile team says:                                           │
│  "We need a PUBLIC URL to call from our mobile app!"             │
│  "Our app runs on users' phones, not in your VNet!"             │
│  "Give us: https://api.yourcompany.com/v1/products"             │
│                                                                   │
│  The challenge:                                                  │
│  ├─ API is internal (private IP, no internet access)             │
│  ├─ Mobile apps need public URL                                  │
│  ├─ Must be SECURE (not just open to everyone)                   │
│  ├─ Need authentication (API key or token)                       │
│  └─ Need rate limiting (prevent abuse)                           │
│                                                                   │
│  ┌──────────┐         ┌──────────┐         ┌──────────┐        │
│  │ Mobile   │ ──?──→  │ ???      │ ──────→ │ Internal │        │
│  │ App      │         │ (bridge) │         │ AKS API  │        │
│  │ (public) │         │          │         │ (private)│        │
│  └──────────┘         └──────────┘         └──────────┘        │
│                                                                   │
│  What goes in the middle? That's what this day is about!        │
└──────────────────────────────────────────────────────────────────┘
```

### Why Internal First?

```
"Why not just make the API public directly?"

┌──────────────────────────────────────────────────────────────┐
│  WHY INTERNAL AGIC (not public)?                              │
│                                                               │
│  1. SECURITY: API not exposed to internet directly           │
│     Hackers can't find or attack it                          │
│     No public IP = invisible to port scanners                │
│                                                               │
│  2. CONTROL: You choose HOW it's exposed                     │
│     Add WAF (Web Application Firewall) in front              │
│     Add rate limiting, IP filtering                          │
│     Add authentication before traffic reaches API            │
│                                                               │
│  3. COMPLIANCE: Many regulations require this                │
│     PCI-DSS, HIPAA, SOC2 all prefer internal APIs           │
│     Public exposure through controlled gateway only          │
│                                                               │
│  4. ARCHITECTURE: Defense in depth                           │
│     Layer 1: Front Door / APIM (public, with WAF)           │
│     Layer 2: Internal App Gateway (private)                  │
│     Layer 3: AKS pods (private)                              │
│     Attacker must breach ALL layers!                         │
│                                                               │
│  Pattern:                                                    │
│  Internet → [Public Gateway + Auth] → [Internal AGIC] → AKS │
│             (controlled entry point)   (private)             │
└──────────────────────────────────────────────────────────────┘
```

---

## 5 Methods to Expose Internal API

```
┌─────────────────────────────────────────────────────────────────┐
│  5 METHODS: Internal API → Public Access                         │
│                                                                  │
│  ┌───┬──────────────────────┬────────┬────────┬──────────────┐  │
│  │ # │ Method               │ Cost   │ Effort │ Best For     │  │
│  ├───┼──────────────────────┼────────┼────────┼──────────────┤  │
│  │ 1 │ Azure Front Door     │ $$     │ Medium │ Global apps, │  │
│  │   │ + Private Link       │        │        │ CDN + WAF    │  │
│  ├───┼──────────────────────┼────────┼────────┼──────────────┤  │
│  │ 2 │ Azure API Management │ $$$    │ Medium │ API-first,   │  │
│  │   │ (APIM)               │        │        │ dev portal   │  │
│  ├───┼──────────────────────┼────────┼────────┼──────────────┤  │
│  │ 3 │ Public App Gateway   │ $$     │ Easy   │ Simple proxy │  │
│  │   │ in front             │        │        │ same region  │  │
│  ├───┼──────────────────────┼────────┼────────┼──────────────┤  │
│  │ 4 │ Azure Firewall       │ $$$    │ Hard   │ Enterprise   │  │
│  │   │ + NAT                │        │        │ full control │  │
│  ├───┼──────────────────────┼────────┼────────┼──────────────┤  │
│  │ 5 │ Nginx Reverse Proxy  │ $      │ Easy   │ Quick/cheap  │  │
│  │   │ VM                   │        │        │ dev/test     │  │
│  └───┴──────────────────────┴────────┴────────┴──────────────┘  │
│                                                                  │
│  We'll lab Method 1, 2, and 3 (most common in production).     │
└─────────────────────────────────────────────────────────────────┘
```

### Method Comparison Visual

```
METHOD 1: Azure Front Door + Private Link
┌──────────┐    ┌───────────┐    ┌──────────────┐    ┌─────┐
│ Mobile   │───→│ Front Door│───→│ Private Link │───→│ AKS │
│ App      │    │ (public)  │    │ (private)    │    │ API │
└──────────┘    │ +WAF +CDN │    └──────────────┘    └─────┘
                └───────────┘
Best: Global reach, CDN caching, WAF protection

METHOD 2: Azure API Management
┌──────────┐    ┌───────────┐    ┌──────────────┐    ┌─────┐
│ Mobile   │───→│ APIM      │───→│ Internal     │───→│ AKS │
│ App      │    │ (public)  │    │ App Gateway  │    │ API │
└──────────┘    │ +Auth     │    └──────────────┘    └─────┘
                │ +Throttle │
                │ +DevPortal│
                └───────────┘
Best: API management, developer portal, policies

METHOD 3: Public Application Gateway
┌──────────┐    ┌───────────┐    ┌──────────────┐    ┌─────┐
│ Mobile   │───→│ Public    │───→│ Internal     │───→│ AKS │
│ App      │    │ AppGW     │    │ App Gateway  │    │ API │
└──────────┘    │ (public)  │    │ (AGIC)       │    └─────┘
                └───────────┘    └──────────────┘
Best: Simple, same region, low cost
```

---

## Lab 1: Deploy App on AKS with Internal AGIC

### Step 1: Create Resource Group and AKS

```bash
# Create resource group
az group create --name rg-day33 --location eastus

# Create AKS with AGIC add-on (internal)
az aks create \
  --resource-group rg-day33 \
  --name aks-day33 \
  --node-count 2 \
  --node-vm-size Standard_B2s \
  --network-plugin azure \
  --enable-addons ingress-appgw \
  --appgw-name agic-day33 \
  --appgw-subnet-cidr "10.225.0.0/16" \
  --generate-ssh-keys \
  --enable-managed-identity
```

**⏱️ Wait**: 10-15 minutes

### Step 2: Connect to AKS

```bash
az aks get-credentials --resource-group rg-day33 --name aks-day33
kubectl get nodes
```

### Step 3: Deploy Simple API Application

Create file: `api-deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mobile-api
  labels:
    app: mobile-api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: mobile-api
  template:
    metadata:
      labels:
        app: mobile-api
    spec:
      containers:
      - name: api
        image: nginx:alpine
        ports:
        - containerPort: 80
        volumeMounts:
        - name: api-config
          mountPath: /usr/share/nginx/html
        - name: nginx-conf
          mountPath: /etc/nginx/conf.d
      volumes:
      - name: api-config
        configMap:
          name: api-responses
      - name: nginx-conf
        configMap:
          name: nginx-api-conf
---
apiVersion: v1
kind: Service
metadata:
  name: mobile-api-svc
spec:
  selector:
    app: mobile-api
  ports:
  - port: 80
    targetPort: 80
  type: ClusterIP
```

Create file: `api-configmap.yaml`

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nginx-api-conf
data:
  api.conf: |
    server {
        listen 80;
        location /health {
            return 200 '{"status":"healthy"}';
            add_header Content-Type application/json;
        }
        location /api/v1/products {
            return 200 '{"products":[{"id":1,"name":"Laptop","price":1299},{"id":2,"name":"Phone","price":899},{"id":3,"name":"Tablet","price":599}]}';
            add_header Content-Type application/json;
        }
        location /api/v1/users {
            return 200 '{"users":[{"id":1,"name":"Alice"},{"id":2,"name":"Bob"}]}';
            add_header Content-Type application/json;
        }
        location / {
            return 200 '{"service":"Mobile API","version":"1.0","endpoints":["/api/v1/products","/api/v1/users","/health"]}';
            add_header Content-Type application/json;
        }
    }
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: api-responses
data:
  index.html: |
    {"service":"Mobile API","version":"1.0"}
```

### Step 4: Create Internal Ingress (AGIC)

Create file: `ingress-internal.yaml`

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: mobile-api-ingress
  annotations:
    kubernetes.io/ingress.class: azure/application-gateway
    # THIS MAKES IT INTERNAL (private IP only!)
    appgw.ingress.kubernetes.io/use-private-ip: "true"
spec:
  rules:
  - http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: mobile-api-svc
            port:
              number: 80
```

**Key annotation:**
```
appgw.ingress.kubernetes.io/use-private-ip: "true"
  → This makes the Application Gateway use its PRIVATE IP
  → API is only accessible from within the VNet
  → NOT accessible from the internet!
```

### Step 5: Deploy Everything

```bash
kubectl apply -f api-configmap.yaml
kubectl apply -f api-deployment.yaml
kubectl apply -f ingress-internal.yaml

# Wait for pods
kubectl get pods -w
# Wait until 2/2 Running

# Get the internal IP
kubectl get ingress mobile-api-ingress
```

**Expected output:**
```
NAME                 CLASS   HOSTS   ADDRESS        PORTS
mobile-api-ingress   <none>  *       10.225.0.x     80

Note: The ADDRESS is a PRIVATE IP (10.x.x.x)
This is NOT accessible from the internet!
```

### Step 6: Test, Check, and Confirm - Internal Deployment

**Test 1: Verify Pods Running**

```bash
kubectl get pods
# ✅ 2 pods Running
```

**Test 2: Verify Internal IP**

```bash
kubectl get ingress
# ✅ ADDRESS: 10.225.0.x (private IP)
# ✅ NOT a public IP
```

**Test 3: Test from Inside the Cluster**

```bash
# Create a test pod
kubectl run test-curl --image=curlimages/curl --rm -it -- sh

# Inside the pod:
curl http://10.225.0.x/
# {"service":"Mobile API","version":"1.0","endpoints":[...]}

curl http://10.225.0.x/api/v1/products
# {"products":[{"id":1,"name":"Laptop",...}]}

curl http://10.225.0.x/health
# {"status":"healthy"}

exit
```

**Test 4: Verify NOT Accessible from Internet**

```
From your laptop:
  curl http://10.225.0.x
  → ❌ Can't reach (private IP, correct!)
  
  ✅ API is internal only!
```

**✅ Result**: Internal API deployed on AKS with AGIC!

---

## Lab 2: Verify Internal-Only Access

### Understanding What We Have

```
┌──────────────────────────────────────────────────────────────┐
│  CURRENT STATE                                                │
│                                                               │
│  AKS VNet                                                    │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                                                          │  │
│  │  App Gateway (Internal AGIC)                            │  │
│  │  Private IP: 10.225.0.x                                 │  │
│  │  Public IP: NONE                                        │  │
│  │       │                                                  │  │
│  │       ↓                                                  │  │
│  │  AKS Pods: mobile-api (x2)                              │  │
│  │  ClusterIP: mobile-api-svc                              │  │
│  │                                                          │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ✅ Accessible from: Inside VNet                             │
│  ❌ NOT accessible from: Internet, Mobile apps              │
│                                                               │
│  Mobile team: "We can't reach 10.225.0.x from our app!" 😩  │
│  You: "Let me set up a secure public entry point..." 💡     │
└──────────────────────────────────────────────────────────────┘
```

### Verify Internal App Gateway

```
1. Azure Portal → Search "Application gateways"
2. Find: agic-day33
3. Check:
   - Frontend IP configuration:
     ✅ Private IP: 10.225.0.x
     ✅ Public IP: May exist but ingress uses private
   - Backend pool:
     ✅ AKS pod IPs listed
```

**✅ Result**: Confirmed internal-only access.

---

## Lab 3: Method 1 - Azure Front Door + Private Link

### What is This Method?

```
Azure Front Door = Global load balancer + CDN + WAF
Private Link = Secure private connection to your internal service

┌──────────┐    ┌───────────────┐    ┌──────────────┐    ┌─────┐
│ Mobile   │───→│ Azure Front   │───→│ Private Link │───→│ AKS │
│ App      │    │ Door          │    │ Service      │    │ API │
│ (public) │    │               │    │ (private)    │    │     │
└──────────┘    │ Public URL    │    └──────────────┘    └─────┘
                │ WAF           │
                │ CDN           │
                │ SSL           │
                └───────────────┘

Mobile app calls: https://api-day33.azurefd.net/api/v1/products
Front Door routes to internal App Gateway via Private Link.
```

### Step 1: Create Private Link Service

```
First, we need a Private Link Service on the internal App Gateway.

1. Azure Portal → Search "Private Link"
2. Click "Private link services" → "+ Create"
3. Fill in:

   Basics:
   - Resource group: rg-day33
   - Name: pls-agic-day33
   - Region: East US

   Outbound settings:
   - Load balancer: Select the internal LB of the App Gateway
     (Azure creates an internal LB for AGIC automatically)
     Look for the LB in the MC_rg-day33_aks-day33_eastus resource group
   - Frontend IP: Select the private frontend IP
   - Source NAT subnet: Select a subnet
   
   Access security:
   - Visibility: Anyone with your alias
   - Auto-approval: Enable

4. Click "Review + create" → "Create"
```

**⏱️ Wait**: 2-3 minutes

### Step 2: Create Azure Front Door

```
1. Search "Front Door and CDN profiles" → "+ Create"
2. Select: "Azure Front Door" → "Custom create"
3. Fill in:

   Basics:
   - Resource group: rg-day33
   - Name: fd-day33-api
   - Tier: Standard (or Premium for WAF)

   Endpoint:
   - Name: api-day33
   - This creates: api-day33.azurefd.net

   Route:
   - Name: api-route
   - Domains: api-day33.azurefd.net
   - Patterns to match: /*
   - Origin group: Create new
     - Name: origin-internal-api
     - Add an origin:
       - Name: agic-origin
       - Origin type: Private Link Service
       - Private link: Select pls-agic-day33
       - Host header: (leave default)
     - Health probe: Enable
       - Path: /health
       - Protocol: HTTP
       - Interval: 30 seconds
   - Forwarding protocol: HTTP only

4. Click "Review + create" → "Create"
```

**⏱️ Wait**: 5-10 minutes

### Step 3: Approve Private Endpoint Connection

```
1. Go to your Private Link Service: pls-agic-day33
2. Left menu → "Private endpoint connections"
3. You should see a pending connection from Front Door
4. Select it → Click "Approve"
5. Wait 2-3 minutes for connection to establish
```

### Step 4: Test Front Door Access

```
curl https://api-day33.azurefd.net/
# {"service":"Mobile API","version":"1.0","endpoints":[...]}

curl https://api-day33.azurefd.net/api/v1/products
# {"products":[{"id":1,"name":"Laptop","price":1299},...]}

curl https://api-day33.azurefd.net/health
# {"status":"healthy"}

✅ PUBLIC URL working!
✅ Traffic flows: Internet → Front Door → Private Link → Internal AGIC → AKS
✅ Mobile team can use: https://api-day33.azurefd.net
```

### Step 5: Test, Check, and Confirm - Front Door

**Test 1: Front Door Endpoint**

```
curl https://api-day33.azurefd.net/
✅ API response received from public URL
```

**Test 2: All API Endpoints**

```
curl https://api-day33.azurefd.net/api/v1/products ✅
curl https://api-day33.azurefd.net/api/v1/users ✅
curl https://api-day33.azurefd.net/health ✅
```

**Test 3: Verify Private Link**

```
1. Private Link Service → Private endpoint connections
   ✅ Connection: Approved
   ✅ Status: Connected
```

**✅ Method 1 Result**: Front Door + Private Link working!

---

## Lab 4: Method 2 - Azure API Management (APIM)

### What is This Method?

```
APIM = Full API gateway with developer portal, policies, analytics

┌──────────┐    ┌───────────────┐    ┌──────────────┐    ┌─────┐
│ Mobile   │───→│ APIM          │───→│ Internal     │───→│ AKS │
│ App      │    │ (public)      │    │ AGIC         │    │ API │
└──────────┘    │               │    │ (10.225.0.x) │    └─────┘
                │ Auth (keys)   │    └──────────────┘
                │ Rate limiting │
                │ Caching       │
                │ Dev portal    │
                │ Analytics     │
                └───────────────┘

APIM must be in a VNet (or VNet-integrated) to reach internal AGIC.
```

### Step 1: Create APIM (Portal)

```
1. Search "API Management services" → "+ Create"
2. Fill in:
   - Resource group: rg-day33
   - Region: East US
   - Resource name: apim-day33 (globally unique)
   - Organization name: Day33 Lab
   - Admin email: your-email@example.com
   - Pricing tier: Developer (cheapest, no SLA)
     ⚠️ Developer tier takes 30-45 minutes to create!
     For faster lab, use Consumption tier (minutes, but limited)

   Virtual network:
   - Type: External
     (APIM gets public IP but can reach internal VNet resources)
   - Virtual network: Select the AKS VNet
   - Subnet: Create or select a subnet for APIM

3. Click "Review + create" → "Create"
```

**⏱️ Wait**: 30-45 minutes (Developer tier) or 5 minutes (Consumption)

### Step 2: Add API to APIM

```
1. Go to APIM: apim-day33
2. Left menu → "APIs"
3. Click "+ Add API" → "HTTP" (manual)
4. Fill in:
   - Display name: Mobile API
   - Name: mobile-api
   - Web service URL: http://10.225.0.x
     (the internal AGIC private IP!)
   - API URL suffix: v1
   - Click "Create"

5. Add operations:
   Click "+ Add operation"
   - Display name: Get Products
   - URL: GET /api/v1/products
   - Click "Save"

   Click "+ Add operation"
   - Display name: Get Users
   - URL: GET /api/v1/users
   - Click "Save"

   Click "+ Add operation"
   - Display name: Health Check
   - URL: GET /health
   - Click "Save"
```

### Step 3: Configure APIM Subscription Key

```
APIM automatically requires a subscription key (API key)!

1. Go to APIM → Subscriptions
2. You'll see built-in subscriptions
3. Click "+ Add subscription"
   - Name: mobile-team-key
   - Display name: Mobile Team
   - Scope: API → Mobile API
   - Click "Create"

4. Click on "mobile-team-key" → Show keys
5. Copy the Primary key
   Example: abc123def456ghi789...

Mobile team uses this key in their requests:
  Header: Ocp-Apim-Subscription-Key: abc123def456ghi789
```

### Step 4: Test APIM

```
# APIM public URL
APIM_URL="https://apim-day33.azure-api.net"

# Without key → 401 Unauthorized!
curl https://apim-day33.azure-api.net/v1/api/v1/products
# {"statusCode":401,"message":"Access denied..."}
# ✅ Blocked without key!

# With key → 200 OK!
curl -H "Ocp-Apim-Subscription-Key: abc123def456ghi789" \
  https://apim-day33.azure-api.net/v1/api/v1/products
# {"products":[{"id":1,"name":"Laptop",...}]}
# ✅ Works with key!
```

### Step 5: Add Rate Limiting Policy

```
1. APIM → APIs → Mobile API → All operations
2. Click "Inbound processing" → "+ Add policy"
3. Select "Limit call rate"
4. Configure:
   - Calls: 100
   - Renewal period: 60 (seconds)
   - This means: Max 100 calls per minute per subscription
5. Click "Save"

Now if mobile app sends > 100 requests/minute:
  → 429 Too Many Requests
  ✅ Rate limiting protects your API!
```

### Step 6: Test, Check, and Confirm - APIM

**Test 1: APIM Blocks Without Key**

```
curl https://apim-day33.azure-api.net/v1/api/v1/products
✅ 401 Unauthorized (no key)
```

**Test 2: APIM Allows With Key**

```
curl -H "Ocp-Apim-Subscription-Key: <key>" \
  https://apim-day33.azure-api.net/v1/api/v1/products
✅ 200 OK with product data
```

**Test 3: Rate Limiting**

```
Send 101 requests quickly:
✅ First 100: 200 OK
✅ 101st: 429 Too Many Requests
```

**✅ Method 2 Result**: APIM with auth + rate limiting working!

---

## Lab 5: Method 3 - Application Gateway (Public) in Front

### What is This Method?

```
Simplest method: Put a PUBLIC App Gateway in front of Internal AGIC.

┌──────────┐    ┌───────────────┐    ┌──────────────┐    ┌─────┐
│ Mobile   │───→│ Public        │───→│ Internal     │───→│ AKS │
│ App      │    │ App Gateway   │    │ AGIC         │    │ API │
└──────────┘    │ (20.x.x.x)   │    │ (10.225.0.x) │    └─────┘
                │ Public IP     │    │ Private IP   │
                └───────────────┘    └──────────────┘

Two App Gateways:
  1. Internal AGIC (already exists, managed by AKS)
  2. Public App Gateway (new, you create it)
  
Public AppGW forwards to Internal AGIC's private IP.
```

### Step 1: Create Public Application Gateway

```
1. Search "Application gateways" → "+ Create"
2. Fill in:

   Basics:
   - Resource group: rg-day33
   - Name: appgw-public-day33
   - Region: East US
   - Tier: Standard V2
   - Enable autoscaling: No
   - Instance count: 1
   - Virtual network: Select the AKS VNet
   - Subnet: Create new subnet for this AppGW
     Name: subnet-public-appgw
     Address range: 10.224.1.0/24

   Frontends:
   - Frontend IP: Public
   - Public IP: Create new → pip-appgw-public
   
   Backends:
   - Click "Add a backend pool"
   - Name: pool-internal-agic
   - Add target:
     - Target type: IP address or FQDN
     - Target: 10.225.0.x (Internal AGIC private IP!)
   - Click "Add"

   Configuration:
   - Click "+ Add a routing rule"
   - Rule name: rule-to-internal
   - Priority: 100
   
   Listener:
   - Listener name: listener-http
   - Frontend IP: Public
   - Port: 80
   - Protocol: HTTP
   
   Backend targets:
   - Target type: Backend pool
   - Backend target: pool-internal-agic
   - Backend settings: Add new
     - Name: settings-http
     - Protocol: HTTP
     - Port: 80
     - Click "Add"
   - Click "Add"

3. Click "Review + create" → "Create"
```

**⏱️ Wait**: 5-10 minutes

### Step 2: Test Public App Gateway

```
1. Get the public IP of appgw-public-day33
2. Test:

curl http://<PUBLIC-APPGW-IP>/
# {"service":"Mobile API","version":"1.0",...}

curl http://<PUBLIC-APPGW-IP>/api/v1/products
# {"products":[{"id":1,"name":"Laptop",...}]}

✅ Public access through App Gateway → Internal AGIC → AKS!
```

### Step 3: Test, Check, and Confirm

**Test 1: Public AppGW Reaches Internal API**

```
curl http://<PUBLIC-APPGW-IP>/api/v1/products
✅ Product data returned
```

**Test 2: Health Probe**

```
1. appgw-public-day33 → Backend health
   ✅ pool-internal-agic: Healthy
```

**✅ Method 3 Result**: Public App Gateway forwarding to Internal AGIC!

---

## Lab 6: Add Token Authentication

### Why Tokens?

```
Now we have a public URL, but ANYONE can call it!
We need authentication so only mobile team can access.

┌──────────────────────────────────────────────────────────────┐
│  AUTHENTICATION METHODS FOR APIs                              │
│                                                               │
│  1. API Key (Header)                                         │
│     Header: X-API-Key: abc123                                │
│     ✅ Simple, easy to implement                             │
│     ❌ Key can be stolen, no expiration                      │
│     Best for: Internal APIs, simple use cases                │
│                                                               │
│  2. APIM Subscription Key                                    │
│     Header: Ocp-Apim-Subscription-Key: abc123                │
│     ✅ Built into APIM, per-team keys                        │
│     ✅ Rate limiting, analytics per key                      │
│     Best for: When using APIM (Method 2)                     │
│                                                               │
│  3. JWT Token (Bearer Token)                                 │
│     Header: Authorization: Bearer eyJhbG...                  │
│     ✅ Industry standard, expiring tokens                    │
│     ✅ Contains user info (claims)                           │
│     Best for: User-level auth, OAuth2/OIDC                   │
│                                                               │
│  4. Azure AD Token (OAuth2)                                  │
│     Mobile app gets token from Azure AD                      │
│     Sends token to API                                       │
│     ✅ Enterprise-grade, MFA support                         │
│     Best for: Enterprise apps, B2B                           │
│                                                               │
│  5. Client Certificate (mTLS)                                │
│     Mobile app presents a certificate                        │
│     ✅ Very secure, no passwords                             │
│     ❌ Complex to manage certificates                        │
│     Best for: High-security, B2B                             │
│                                                               │
│  We'll implement: API Key + JWT Token                        │
└──────────────────────────────────────────────────────────────┘
```

### Step 1: Add API Key Validation in App

Update the API to check for an API key header.

Create file: `api-configmap-auth.yaml`

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nginx-api-conf
data:
  api.conf: |
    map $http_x_api_key $api_key_valid {
        default 0;
        "mobile-team-secret-key-2026" 1;
        "partner-team-key-2026" 1;
    }

    server {
        listen 80;

        # Health endpoint (no auth needed)
        location /health {
            return 200 '{"status":"healthy"}';
            add_header Content-Type application/json;
        }

        # All API endpoints require API key
        location /api/ {
            if ($api_key_valid = 0) {
                return 401 '{"error":"Unauthorized","message":"Valid X-API-Key header required"}';
            }
            
            # Products endpoint
            location /api/v1/products {
                if ($api_key_valid = 0) {
                    return 401 '{"error":"Unauthorized"}';
                }
                return 200 '{"products":[{"id":1,"name":"Laptop","price":1299},{"id":2,"name":"Phone","price":899},{"id":3,"name":"Tablet","price":599}]}';
                add_header Content-Type application/json;
            }

            # Users endpoint
            location /api/v1/users {
                if ($api_key_valid = 0) {
                    return 401 '{"error":"Unauthorized"}';
                }
                return 200 '{"users":[{"id":1,"name":"Alice"},{"id":2,"name":"Bob"}]}';
                add_header Content-Type application/json;
            }
        }

        location / {
            return 200 '{"service":"Mobile API","version":"1.0","auth":"X-API-Key header required for /api/* endpoints"}';
            add_header Content-Type application/json;
        }
    }
```

### Step 2: Apply Updated Config

```bash
kubectl apply -f api-configmap-auth.yaml

# Restart pods to pick up new config
kubectl rollout restart deployment mobile-api

# Wait for pods
kubectl get pods -w
```

### Step 3: Test API Key Authentication

```bash
# Get the public URL (use whichever method you set up)
PUBLIC_URL="http://<PUBLIC-APPGW-IP>"
# or
PUBLIC_URL="https://api-day33.azurefd.net"

# Without API key → 401!
curl $PUBLIC_URL/api/v1/products
# {"error":"Unauthorized","message":"Valid X-API-Key header required"}
# ✅ Blocked!

# With WRONG API key → 401!
curl -H "X-API-Key: wrong-key" $PUBLIC_URL/api/v1/products
# {"error":"Unauthorized"}
# ✅ Blocked!

# With CORRECT API key → 200!
curl -H "X-API-Key: mobile-team-secret-key-2026" $PUBLIC_URL/api/v1/products
# {"products":[{"id":1,"name":"Laptop","price":1299},...]}
# ✅ Authorized!

# Health endpoint (no key needed)
curl $PUBLIC_URL/health
# {"status":"healthy"}
# ✅ Health check works without key (for monitoring)
```

### Step 4: Test, Check, and Confirm - Auth

**Test 1: No Key = Blocked**

```
curl $PUBLIC_URL/api/v1/products
✅ 401 Unauthorized
```

**Test 2: Wrong Key = Blocked**

```
curl -H "X-API-Key: wrong" $PUBLIC_URL/api/v1/products
✅ 401 Unauthorized
```

**Test 3: Correct Key = Allowed**

```
curl -H "X-API-Key: mobile-team-secret-key-2026" $PUBLIC_URL/api/v1/products
✅ 200 OK with data
```

**Test 4: Health = No Key Needed**

```
curl $PUBLIC_URL/health
✅ 200 OK (monitoring works without key)
```

**✅ Result**: API Key authentication working!

---

## Lab 7: Give Mobile Teams Access

### What to Give Mobile Team

```
┌──────────────────────────────────────────────────────────────┐
│  MOBILE TEAM DOCUMENTATION                                    │
│                                                               │
│  API Base URL:                                               │
│  https://api-day33.azurefd.net  (Front Door)                │
│  or                                                          │
│  http://<PUBLIC-APPGW-IP>       (App Gateway)               │
│                                                               │
│  Authentication:                                             │
│  Header: X-API-Key: mobile-team-secret-key-2026             │
│                                                               │
│  Endpoints:                                                  │
│  ├─ GET /api/v1/products  (list products)                   │
│  ├─ GET /api/v1/users     (list users)                      │
│  └─ GET /health           (health check, no auth)           │
│                                                               │
│  Example Request:                                            │
│  curl -H "X-API-Key: mobile-team-secret-key-2026" \         │
│    https://api-day33.azurefd.net/api/v1/products             │
│                                                               │
│  Rate Limits:                                                │
│  100 requests per minute                                     │
│                                                               │
│  Errors:                                                     │
│  401 = Missing or invalid API key                            │
│  429 = Rate limit exceeded (wait and retry)                  │
│  503 = Service temporarily unavailable                       │
└──────────────────────────────────────────────────────────────┘
```

### Mobile App Code Examples

**iOS (Swift):**
```swift
let url = URL(string: "https://api-day33.azurefd.net/api/v1/products")!
var request = URLRequest(url: url)
request.setValue("mobile-team-secret-key-2026", forHTTPHeaderField: "X-API-Key")

URLSession.shared.dataTask(with: request) { data, response, error in
    // Handle response
}.resume()
```

**Android (Kotlin):**
```kotlin
val client = OkHttpClient()
val request = Request.Builder()
    .url("https://api-day33.azurefd.net/api/v1/products")
    .addHeader("X-API-Key", "mobile-team-secret-key-2026")
    .build()

client.newCall(request).execute().use { response ->
    // Handle response
}
```

**React Native (JavaScript):**
```javascript
const response = await fetch('https://api-day33.azurefd.net/api/v1/products', {
  headers: {
    'X-API-Key': 'mobile-team-secret-key-2026'
  }
});
const data = await response.json();
```

### Step 1: Test as Mobile Team Would

```bash
# Exactly what mobile team will do:
curl -H "X-API-Key: mobile-team-secret-key-2026" \
  https://api-day33.azurefd.net/api/v1/products

# Expected:
# {"products":[{"id":1,"name":"Laptop","price":1299},...]}
# ✅ Mobile team can access the API!
```

### Step 2: Test, Check, and Confirm - Mobile Access

**Test 1: Mobile Team Can Access**

```
With API key:
  GET /api/v1/products → ✅ 200 OK
  GET /api/v1/users → ✅ 200 OK
```

**Test 2: Unauthorized Users Blocked**

```
Without API key:
  GET /api/v1/products → ✅ 401 Unauthorized
```

**Test 3: Health Monitoring Works**

```
GET /health → ✅ 200 OK (no key needed)
```

**✅ Result**: Mobile team has secure public access!

---

## Complete Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  COMPLETE ARCHITECTURE                                            │
│                                                                   │
│  Mobile App (public internet)                                    │
│       │                                                           │
│       │ HTTPS + API Key header                                   │
│       ↓                                                           │
│  ┌─────────────────────────────────────┐                         │
│  │ Public Entry Point (choose one):     │                         │
│  │ ├─ Azure Front Door + Private Link  │                         │
│  │ ├─ Azure APIM (with subscription)   │                         │
│  │ └─ Public App Gateway               │                         │
│  └──────────────┬──────────────────────┘                         │
│                 │                                                  │
│                 │ Private network                                  │
│                 ↓                                                  │
│  ┌─────────────────────────────────────┐                         │
│  │ Internal AGIC (10.225.0.x)          │                         │
│  │ Application Gateway (private IP)     │                         │
│  └──────────────┬──────────────────────┘                         │
│                 │                                                  │
│                 ↓                                                  │
│  ┌─────────────────────────────────────┐                         │
│  │ AKS Pods (mobile-api x2)            │                         │
│  │ Validates X-API-Key header           │                         │
│  │ Returns JSON responses               │                         │
│  └─────────────────────────────────────┘                         │
│                                                                   │
│  Security layers:                                                │
│  Layer 1: Public gateway (WAF, rate limiting)                    │
│  Layer 2: API Key validation (app level)                         │
│  Layer 3: Internal network (not directly exposed)                │
└──────────────────────────────────────────────────────────────────┘
```

---

## Cleanup

```bash
# Delete everything
az group delete --name rg-day33 --yes --no-wait

# Also delete the MC_ resource group (AKS managed)
# It will be deleted automatically when rg-day33 is deleted
```

**⏱️ Wait**: 10-15 minutes

**✅ Result**: All resources deleted!

---

## Quick Reference

### Method Decision Tree

```
Need to expose internal API publicly?
│
├─ Need global CDN + WAF?
│   → Azure Front Door + Private Link (Method 1)
│
├─ Need API management + developer portal?
│   → Azure APIM (Method 2)
│
├─ Need simple proxy, same region?
│   → Public App Gateway (Method 3)
│
├─ Need full network control?
│   → Azure Firewall + NAT (Method 4)
│
└─ Quick dev/test only?
    → Nginx reverse proxy VM (Method 5)
```

### Authentication Decision Tree

```
Need API authentication?
│
├─ Simple, per-team access?
│   → API Key (X-API-Key header)
│
├─ Using APIM?
│   → APIM Subscription Key (built-in)
│
├─ User-level auth with expiring tokens?
│   → JWT Bearer Token
│
├─ Enterprise with Azure AD?
│   → OAuth2 / Azure AD Token
│
└─ Maximum security, B2B?
    → Client Certificate (mTLS)
```

### Useful Links

- [AGIC Internal Ingress](https://learn.microsoft.com/azure/application-gateway/ingress-controller-private-ip)
- [Azure Front Door + Private Link](https://learn.microsoft.com/azure/frontdoor/private-link)
- [APIM with Internal APIs](https://learn.microsoft.com/azure/api-management/api-management-using-with-internal-vnet)
- [App Gateway as Reverse Proxy](https://learn.microsoft.com/azure/application-gateway/overview)

---

**🎉 Congratulations!** You've completed Day 33 covering internal AKS API exposure to mobile teams with 3 methods and token authentication!