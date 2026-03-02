# Day 14: AKS Deployment with AGIC - Azure Portal (GUI)

## What You'll Learn

This is the **GUI version** of Day 13. You'll do everything through the Azure Portal instead of CLI:
- ✅ Create AKS cluster with AGIC using Azure Portal
- ✅ Deploy Hello World API via Portal
- ✅ Configure internal AGIC
- ✅ Expose to public for mobile apps
- ✅ All configurations through GUI

## Prerequisites

- Azure account with active subscription
- Web browser
- Basic understanding of Kubernetes concepts

## Architecture (Same as Day 13)

```
Mobile Apps → Azure Front Door → Internal AGIC → AKS → API
```

---

## Part 1: Create Resource Group

### Step 1: Navigate to Resource Groups

1. Open Azure Portal: https://portal.azure.com
2. In the search bar at top, type **"Resource groups"**
3. Click **"Resource groups"** from results

### Step 2: Create New Resource Group

1. Click **"+ Create"** button
2. Fill in the form:
   - **Subscription**: Select your subscription
   - **Resource group**: `rg-aks-demo`
   - **Region**: `East US` (or your preferred region)
3. Click **"Review + create"**
4. Click **"Create"**

**✅ Result**: Resource group created

---

## Part 2: Create Virtual Network

### Step 1: Navigate to Virtual Networks

1. In search bar, type **"Virtual networks"**
2. Click **"Virtual networks"**
3. Click **"+ Create"**

### Step 2: Basics Tab

1. **Subscription**: Select your subscription
2. **Resource group**: `rg-aks-demo`
3. **Name**: `vnet-aks`
4. **Region**: `East US` (same as resource group)
5. Click **"Next: IP Addresses"**

### Step 3: IP Addresses Tab

1. **IPv4 address space**: `10.0.0.0/16`
2. Click **"+ Add subnet"**

   **Subnet 1 - AKS:**
   - **Subnet name**: `subnet-aks`
   - **Subnet address range**: `10.0.1.0/24`
   - Click **"Add"**

3. Click **"+ Add subnet"** again

   **Subnet 2 - Application Gateway:**
   - **Subnet name**: `subnet-appgw`
   - **Subnet address range**: `10.0.2.0/24`
   - Click **"Add"**

4. Click **"Review + create"**
5. Click **"Create"**

**✅ Result**: VNet with 2 subnets created

---

## Part 3: Create Container Registry (ACR)

### Step 1: Navigate to Container Registries

1. Search for **"Container registries"**
2. Click **"Container registries"**
3. Click **"+ Create"**

### Step 2: Create ACR

1. **Basics Tab:**
   - **Subscription**: Your subscription
   - **Resource group**: `rg-aks-demo`
   - **Registry name**: `acraksdemo[uniquenumber]` (must be globally unique)
   - **Location**: `East US`
   - **SKU**: `Standard`

2. Click **"Review + create"**
3. Click **"Create"**
4. Wait for deployment (1-2 minutes)

### Step 3: Enable Admin User (for easy access)

1. Go to your ACR resource
2. In left menu, click **"Access keys"**
3. Toggle **"Admin user"** to **Enabled**
4. **Copy** the **Username** and **Password** (save for later)

**✅ Result**: Container registry ready

---

## Part 4: Create Application Gateway (Internal)

### Step 1: Navigate to Application Gateways

1. Search for **"Application gateways"**
2. Click **"Application gateways"**
3. Click **"+ Create"**

### Step 2: Basics Tab

1. **Subscription**: Your subscription
2. **Resource group**: `rg-aks-demo`
3. **Application gateway name**: `appgw-aks-internal`
4. **Region**: `East US`
5. **Tier**: `Standard V2`
6. **Enable autoscaling**: `No`
7. **Instance count**: `2`
8. **Availability zone**: `None`
9. **HTTP2**: `Disabled`
10. **Virtual network**: `vnet-aks`
11. **Subnet**: `subnet-appgw`
12. Click **"Next: Frontends"**

### Step 3: Frontends Tab

1. **Frontend IP address type**: `Private` ⭐ (This makes it internal!)
2. **Private IP address**: `10.0.2.4` (or leave as dynamic)
3. Click **"Next: Backends"**

### Step 4: Backends Tab

1. Click **"Add a backend pool"**
2. **Name**: `backend-pool`
3. **Add backend pool without targets**: `Yes`
4. Click **"Add"**
5. Click **"Next: Configuration"**

### Step 5: Configuration Tab

1. Click **"Add a routing rule"**

   **Rule name**: `rule-http`
   
   **Listener tab:**
   - **Listener name**: `listener-http`
   - **Frontend IP**: `Private`
   - **Protocol**: `HTTP`
   - **Port**: `80`
   - **Listener type**: `Basic`
   
   **Backend targets tab:**
   - **Target type**: `Backend pool`
   - **Backend target**: `backend-pool`
   - **Backend settings**: Click **"Add new"**
     - **Backend settings name**: `http-settings`
     - **Backend protocol**: `HTTP`
     - **Backend port**: `80`
     - **Cookie-based affinity**: `Disable`
     - **Request time-out**: `20` seconds
     - Click **"Add"**
   
   - Click **"Add"**

2. Click **"Next: Tags"**
3. Click **"Next: Review + create"**
4. Click **"Create"**
5. Wait for deployment (5-10 minutes)

**✅ Result**: Internal Application Gateway created (NO public IP)

---

## Part 5: Create AKS Cluster with AGIC

### Step 1: Navigate to Kubernetes Services

1. Search for **"Kubernetes services"**
2. Click **"Kubernetes services"**
3. Click **"+ Create"** → **"Create a Kubernetes cluster"**

### Step 2: Basics Tab

1. **Subscription**: Your subscription
2. **Resource group**: `rg-aks-demo`
3. **Cluster preset configuration**: `Dev/Test`
4. **Kubernetes cluster name**: `aks-demo`
5. **Region**: `East US`
6. **Availability zones**: `None`
7. **AKS pricing tier**: `Free`
8. **Kubernetes version**: `1.28.x` (latest stable)
9. **Automatic upgrade**: `Disabled`
10. **Node security channel type**: `None`
11. **Authentication and Authorization**: `Local accounts with Kubernetes RBAC`
12. Click **"Next: Node pools"**

### Step 3: Node pools Tab

1. Keep default node pool:
   - **Name**: `agentpool`
   - **Node size**: `Standard_DS2_v2`
   - **Scale method**: `Manual`
   - **Node count**: `2`
2. Click **"Next: Networking"**

### Step 4: Networking Tab ⭐ Important

1. **Network configuration**: `Azure CNI`
2. **Virtual network**: `vnet-aks`
3. **Cluster subnet**: `subnet-aks`
4. **Kubernetes service address range**: `10.1.0.0/16`
5. **Kubernetes DNS service IP address**: `10.1.0.10`
6. **DNS name prefix**: `aks-demo-dns`
7. **Network policy**: `None`
8. **Load balancer**: `Standard`

   **Enable HTTP application routing**: `No`
   
   **Enable private cluster**: `No`

9. Click **"Next: Integrations"**

### Step 5: Integrations Tab ⭐ AGIC Setup

1. **Container registry**: Select `acraksdemo[your-number]`
2. **Container monitoring**: `Enabled` (recommended)
3. **Log Analytics workspace**: Create new or select existing

   **Application Gateway Ingress Controller:**
   - **Enable ingress controller**: `Yes` ⭐
   - **Application Gateway**: `Use existing`
   - **Select Application Gateway**: `appgw-aks-internal`
   - **Enable private ingress**: `Yes` ⭐ (keeps it internal)

4. Click **"Next: Advanced"**

### Step 6: Advanced Tab

1. Keep defaults
2. Click **"Next: Tags"**

### Step 7: Tags Tab

1. Add tags (optional):
   - **Name**: `Environment`, **Value**: `Demo`
   - **Name**: `Project`, **Value**: `AKS-AGIC`
2. Click **"Next: Review + create"**

### Step 8: Review and Create

1. Review all settings
2. Click **"Create"**
3. Wait for deployment (10-15 minutes)

**✅ Result**: AKS cluster with AGIC addon created

---

## Part 6: Connect to AKS Cluster

### Step 1: Open Cloud Shell

1. In Azure Portal, click **Cloud Shell** icon (>_) at top right
2. Select **Bash**
3. If first time, create storage account

### Step 2: Get AKS Credentials

```bash
# Set variables
RESOURCE_GROUP="rg-aks-demo"
AKS_NAME="aks-demo"

# Get credentials
az aks get-credentials \
  --resource-group $RESOURCE_GROUP \
  --name $AKS_NAME \
  --overwrite-existing

# Verify connection
kubectl get nodes
```

**Expected output:**
```
NAME                                STATUS   ROLES   AGE   VERSION
aks-agentpool-12345678-vmss000000   Ready    agent   5m    v1.28.x
aks-agentpool-12345678-vmss000001   Ready    agent   5m    v1.28.x
```

### Step 3: Verify AGIC Installation

```bash
# Check AGIC pods
kubectl get pods -n kube-system | grep ingress

# Expected output:
# ingress-appgw-deployment-xxxxx   1/1     Running   0          5m
```

**✅ Result**: Connected to AKS cluster

---


## Part 7: Build and Push Docker Image (Portal + Cloud Shell)

### Step 1: Create Application Files in Cloud Shell

```bash
# Create directory
mkdir ~/aks-hello-world
cd ~/aks-hello-world

# Create app.js
cat > app.js << 'EOF'
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const VERSION = process.env.VERSION || '1.0.0';

app.use(express.json());

// CORS for mobile apps
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.get('/', (req, res) => {
  res.json({
    message: 'Hello World from AKS!',
    version: VERSION,
    timestamp: new Date().toISOString(),
    hostname: require('os').hostname()
  });
});

app.get('/api/hello', (req, res) => {
  const name = req.query.name || 'World';
  res.json({
    message: `Hello, ${name}!`,
    version: VERSION,
    pod: require('os').hostname()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/ready', (req, res) => {
  res.json({ ready: true });
});

app.post('/api/mobile/data', (req, res) => {
  const { deviceId, platform, data } = req.body;
  console.log('Mobile request:', { deviceId, platform });
  
  res.json({
    success: true,
    message: 'Data received',
    deviceId: deviceId,
    platform: platform,
    processedAt: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
EOF

# Create package.json
cat > package.json << 'EOF'
{
  "name": "aks-hello-world",
  "version": "1.0.0",
  "main": "app.js",
  "scripts": {
    "start": "node app.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}
EOF

# Create Dockerfile
cat > Dockerfile << 'EOF'
FROM node:18-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production
COPY app.js .
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
CMD [ "node", "app.js" ]
EOF
```

### Step 2: Build Image Using ACR Tasks (Portal)

**Option A: Using Cloud Shell**

```bash
# Get ACR name
ACR_NAME="acraksdemo[your-number]"

# Build and push using ACR
az acr build \
  --registry $ACR_NAME \
  --image hello-world:v1 \
  --file Dockerfile \
  .

# Verify
az acr repository list --name $ACR_NAME --output table
az acr repository show-tags --name $ACR_NAME --repository hello-world --output table
```

**Option B: Using Portal (ACR Tasks)**

1. Go to your **Container Registry** in Portal
2. In left menu, click **"Tasks"**
3. Click **"+ Quick task"**
4. Fill in:
   - **Task name**: `build-hello-world`
   - **OS**: `Linux`
   - **Architecture**: `amd64`
   - **Source location**: Upload files or use Git
   - **Dockerfile**: `Dockerfile`
   - **Image name**: `hello-world:v1`
5. Click **"Run"**
6. Wait for build to complete
7. Go to **"Repositories"** to verify image

**✅ Result**: Docker image built and pushed to ACR

---

## Part 8: Deploy Application to AKS (Portal + Cloud Shell)

### Step 1: Create Kubernetes Manifests

```bash
# Create k8s directory
mkdir ~/k8s
cd ~/k8s

# Get ACR login server
ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --query loginServer -o tsv)

# Create deployment.yaml
cat > deployment.yaml << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hello-world
  labels:
    app: hello-world
spec:
  replicas: 3
  selector:
    matchLabels:
      app: hello-world
  template:
    metadata:
      labels:
        app: hello-world
    spec:
      containers:
      - name: hello-world
        image: ${ACR_LOGIN_SERVER}/hello-world:v1
        ports:
        - containerPort: 3000
          name: http
        env:
        - name: VERSION
          value: "1.0.0"
        - name: PORT
          value: "3000"
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
EOF

# Create service.yaml
cat > service.yaml << 'EOF'
apiVersion: v1
kind: Service
metadata:
  name: hello-world
  labels:
    app: hello-world
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
    name: http
  selector:
    app: hello-world
EOF

# Create ingress.yaml (Internal AGIC)
cat > ingress.yaml << 'EOF'
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: hello-world-ingress
  annotations:
    kubernetes.io/ingress.class: azure/application-gateway
    appgw.ingress.kubernetes.io/use-private-ip: "true"
    appgw.ingress.kubernetes.io/backend-path-prefix: "/"
    appgw.ingress.kubernetes.io/connection-draining: "true"
    appgw.ingress.kubernetes.io/connection-draining-timeout: "30"
spec:
  rules:
  - http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: hello-world
            port:
              number: 80
      - path: /api/*
        pathType: Prefix
        backend:
          service:
            name: hello-world
            port:
              number: 80
EOF
```

### Step 2: Deploy to AKS

```bash
# Apply manifests
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f ingress.yaml

# Verify deployment
kubectl get deployments
kubectl get pods
kubectl get services
kubectl get ingress

# Watch ingress (wait for ADDRESS)
kubectl get ingress hello-world-ingress --watch
```

### Step 3: View in Portal

1. Go to **Kubernetes services** in Portal
2. Click your **aks-demo** cluster
3. In left menu, click **"Workloads"**
4. You'll see:
   - **Deployments**: hello-world
   - **Pods**: hello-world-xxxxx (3 pods)
5. Click **"Services and ingresses"**
6. You'll see:
   - **Service**: hello-world
   - **Ingress**: hello-world-ingress

**✅ Result**: Application deployed to AKS

---

## Part 9: Test Internal Access

### Step 1: Get Application Gateway Private IP

**Via Portal:**
1. Go to **Application gateways**
2. Click **appgw-aks-internal**
3. In **Overview**, find **Frontend private IP address**: `10.0.2.4`

**Via Cloud Shell:**
```bash
# Get private IP
APPGW_PRIVATE_IP=$(az network application-gateway show \
  --resource-group $RESOURCE_GROUP \
  --name appgw-aks-internal \
  --query "frontendIPConfigurations[0].privateIPAddress" -o tsv)

echo "Application Gateway Private IP: $APPGW_PRIVATE_IP"
```

### Step 2: Test from Cloud Shell (within VNet)

```bash
# Test endpoints
curl http://$APPGW_PRIVATE_IP/
curl http://$APPGW_PRIVATE_IP/api/hello?name=Portal
curl http://$APPGW_PRIVATE_IP/api/health

# Test mobile endpoint
curl -X POST http://$APPGW_PRIVATE_IP/api/mobile/data \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"test-123","platform":"iOS","data":{"test":true}}'
```

**✅ Result**: Internal API working (accessible only within VNet)

---

## Part 10: Expose to Public Using Azure Front Door (Portal)

Now let's expose the internal AGIC to the public for mobile apps.

### Step 1: Create Azure Front Door

1. Search for **"Front Door and CDN profiles"**
2. Click **"Front Door and CDN profiles"**
3. Click **"+ Create"**

### Step 2: Compare Offerings

1. Select **"Azure Front Door"**
2. Click **"Continue to create a Front Door"**

### Step 3: Basics Tab

1. **Subscription**: Your subscription
2. **Resource group**: `rg-aks-demo`
3. **Name**: `fd-mobile-api`
4. **Tier**: `Premium` (required for Private Link)
5. **Endpoint name**: `mobile-api-[random]`
6. **Origin type**: `Custom`
7. Click **"+ Add an origin"**

### Step 4: Add Origin (Internal AGIC)

1. **Add an origin:**
   - **Name**: `internal-agic`
   - **Origin type**: `Custom`
   - **Host name**: `10.0.2.4` (your App Gateway private IP)
   - **Origin host header**: `10.0.2.4`
   - **HTTP port**: `80`
   - **HTTPS port**: `443`
   - **Priority**: `1`
   - **Weight**: `1000`
   - **Enable this origin**: `Yes`
   
   **Private Link:**
   - **Enable private link service**: `Yes` ⭐
   - **Region**: `East US`
   - **Private link resource**: Select your Application Gateway
   - **Request message**: `Front Door to Internal AGIC`
   
2. Click **"Add"**

### Step 5: Add Route

1. **Add a route:**
   - **Name**: `api-route`
   - **Domains**: Use default endpoint
   - **Patterns to match**: `/api/*`
   - **Accepted protocols**: `HTTP and HTTPS`
   - **Redirect**: `HTTPS only`
   - **Origin group**: Select the group with internal-agic
   - **Origin path**: Leave empty
   - **Forwarding protocol**: `HTTP only`
   - **Caching**: `Disabled` (for now)
   - **Rules engine**: None

2. Click **"Add"**

### Step 6: Security (WAF)

1. **WAF policy**: Click **"Create new"**
   - **Policy name**: `MobileAPIWAF`
   - **Policy mode**: `Prevention`
   - **Managed rules**: Enable **Microsoft_DefaultRuleSet 2.1**
   - Click **"Create"**

2. Click **"Review + create"**
3. Click **"Create"**
4. Wait for deployment (5-10 minutes)

### Step 7: Approve Private Endpoint Connection

1. Go to **Application Gateway** → **appgw-aks-internal**
2. In left menu, click **"Private endpoint connections"**
3. You'll see a pending connection from Front Door
4. Select the connection
5. Click **"Approve"**
6. Add approval message: `Approved for Front Door`
7. Click **"Yes"**

**✅ Result**: Front Door connected to internal AGIC via Private Link

---

## Part 11: Configure Custom Domain (Portal)

### Step 1: Add Custom Domain to Front Door

1. Go to your **Front Door** profile
2. In left menu, click **"Domains"**
3. Click **"+ Add"**
4. Fill in:
   - **Domain type**: `Non-Azure validated domain`
   - **Custom domain**: `api.yourdomain.com`
   - **DNS management**: `All other DNS services`
5. Click **"Add"**

### Step 2: Validate Domain

1. Front Door will show a **TXT record** to add to your DNS
2. Go to your DNS provider (e.g., GoDaddy, Cloudflare, Azure DNS)
3. Add the TXT record:
   - **Name**: `_dnsauth.api`
   - **Type**: `TXT`
   - **Value**: (provided by Front Door)
4. Wait for DNS propagation (5-30 minutes)
5. In Front Door, click **"Validate"**

### Step 3: Associate Domain with Endpoint

1. In Front Door, go to **"Endpoint manager"**
2. Click your endpoint
3. Click **"+ Add a route"**
4. Select your custom domain
5. Click **"Associate"**

### Step 4: Enable HTTPS

1. In **Domains**, click your custom domain
2. **HTTPS**: Select **"Front Door managed"**
3. **Minimum TLS version**: `1.2`
4. Click **"Update"**
5. Wait for certificate provisioning (10-30 minutes)

**✅ Result**: Custom domain configured with HTTPS

---

## Part 12: Test Public Access

### Step 1: Get Front Door Endpoint

**Via Portal:**
1. Go to your **Front Door** profile
2. In **Overview**, copy the **Endpoint hostname**
   - Example: `mobile-api-abc123.z01.azurefd.net`

### Step 2: Test Endpoints

```bash
# Set Front Door endpoint
FRONTDOOR_ENDPOINT="mobile-api-abc123.z01.azurefd.net"

# Test from anywhere (public internet)
curl https://$FRONTDOOR_ENDPOINT/api/hello?name=Mobile

# Test with custom domain (after DNS propagation)
curl https://api.yourdomain.com/api/hello?name=Mobile

# Test mobile endpoint
curl -X POST https://$FRONTDOOR_ENDPOINT/api/mobile/data \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"mobile-123","platform":"iOS","data":{"test":true}}'
```

### Step 3: Test from Browser

1. Open browser
2. Navigate to: `https://[your-frontdoor-endpoint]/api/hello?name=Browser`
3. You should see JSON response

**✅ Result**: API accessible from public internet!

---

## Part 13: Monitor and Manage (Portal)

### Step 1: View AKS Insights

1. Go to **Kubernetes services** → **aks-demo**
2. In left menu, click **"Insights"**
3. View:
   - **Cluster**: Overall health
   - **Nodes**: Node performance
   - **Controllers**: Deployment status
   - **Containers**: Pod metrics

### Step 2: View Application Gateway Metrics

1. Go to **Application gateways** → **appgw-aks-internal**
2. In left menu, click **"Metrics"**
3. Add metrics:
   - **Total Requests**
   - **Failed Requests**
   - **Response Status**
   - **Backend Response Time**

### Step 3: View Front Door Analytics

1. Go to **Front Door** profile
2. In left menu, click **"Analytics"**
3. View:
   - **Traffic by domain**
   - **Traffic by location**
   - **Top URLs**
   - **Response codes**

### Step 4: View Logs

1. Go to **Front Door** → **Diagnostic settings**
2. Click **"+ Add diagnostic setting"**
3. Configure:
   - **Name**: `fd-logs`
   - **Logs**: Select all
   - **Destination**: Send to Log Analytics workspace
4. Click **"Save"**

### Step 5: Set Up Alerts

1. Go to **Front Door** → **Alerts**
2. Click **"+ Create"** → **"Alert rule"**
3. Configure alert:
   - **Condition**: `Total Requests > 1000`
   - **Action**: Send email
   - **Alert rule name**: `High Traffic Alert`
4. Click **"Create alert rule"**

**✅ Result**: Monitoring configured

---

## Part 14: Security Configuration (Portal)

### Step 1: Configure WAF Rules

1. Go to **Front Door** → **WAF policies**
2. Click your **MobileAPIWAF** policy
3. In left menu, click **"Managed rules"**
4. Review and customize rules:
   - **Microsoft_DefaultRuleSet**: Enabled
   - **Microsoft_BotManagerRuleSet**: Add if needed
5. Click **"Save"**

### Step 2: Add Custom WAF Rules

1. In WAF policy, click **"Custom rules"**
2. Click **"+ Add custom rule"**
3. **Rule 1: Rate Limiting**
   - **Name**: `RateLimitRule`
   - **Rule type**: `Rate limit`
   - **Priority**: `100`
   - **Rate limit duration**: `1 minute`
   - **Rate limit threshold**: `100`
   - **Action**: `Block`
4. Click **"Add"**

### Step 3: Configure IP Restrictions (Optional)

1. In WAF policy, click **"Custom rules"**
2. **Rule 2: IP Whitelist** (if needed)
   - **Name**: `IPWhitelist`
   - **Rule type**: `Match`
   - **Match condition**: `Remote address`
   - **Operation**: `Does not match`
   - **IP addresses**: Add allowed IPs
   - **Action**: `Block`

### Step 4: Enable DDoS Protection

1. Go to **Virtual network** → **vnet-aks**
2. In left menu, click **"DDoS protection"**
3. Select **"Enable"**
4. Choose **"DDoS Protection Standard"** (additional cost)
5. Click **"Save"**

**✅ Result**: Security configured

---

## Part 15: Add API Key Authentication (Portal + Code)

### Step 1: Create Key Vault

1. Search for **"Key vaults"**
2. Click **"+ Create"**
3. Fill in:
   - **Resource group**: `rg-aks-demo`
   - **Key vault name**: `kv-aks-demo-[random]`
   - **Region**: `East US`
   - **Pricing tier**: `Standard`
4. Click **"Review + create"** → **"Create"**

### Step 2: Add API Keys to Key Vault

1. Go to your Key Vault
2. In left menu, click **"Secrets"**
3. Click **"+ Generate/Import"**
4. Add secrets:
   - **Name**: `mobile-ios-key`
   - **Value**: `ios-key-123456789`
   - Click **"Create"**
   
   Repeat for:
   - **Name**: `mobile-android-key`
   - **Value**: `android-key-987654321`

### Step 3: Grant AKS Access to Key Vault

1. In Key Vault, click **"Access policies"**
2. Click **"+ Create"**
3. **Permissions**:
   - **Secret permissions**: `Get`, `List`
4. **Principal**: Search for your AKS cluster's managed identity
5. Click **"Review + create"** → **"Create"**

### Step 4: Create Kubernetes Secret

```bash
# In Cloud Shell
kubectl create secret generic api-keys \
  --from-literal=API_KEYS="ios-key-123456789,android-key-987654321"

# Verify
kubectl get secrets
```

### Step 5: Update Deployment to Use Secret

```bash
# Update deployment
kubectl edit deployment hello-world

# Add under env section:
# - name: API_KEYS
#   valueFrom:
#     secretKeyRef:
#       name: api-keys
#       key: API_KEYS

# Or apply updated manifest
kubectl apply -f deployment.yaml
```

**✅ Result**: API key authentication configured

---

## Part 16: Verification Checklist

### Infrastructure
- [ ] Resource group created
- [ ] Virtual network with 2 subnets
- [ ] Container registry created
- [ ] Internal Application Gateway (no public IP)
- [ ] AKS cluster with AGIC addon
- [ ] Front Door with Private Link

### Application
- [ ] Docker image built and pushed
- [ ] Deployment with 3 replicas
- [ ] Service (ClusterIP)
- [ ] Ingress (internal AGIC)
- [ ] Pods running and healthy

### Public Access
- [ ] Front Door configured
- [ ] Private Link approved
- [ ] Custom domain added
- [ ] HTTPS enabled
- [ ] WAF configured

### Security
- [ ] API keys in Key Vault
- [ ] Kubernetes secrets created
- [ ] WAF rules enabled
- [ ] Rate limiting configured
- [ ] Monitoring and alerts set up

### Testing
- [ ] Internal access working (within VNet)
- [ ] Public access working (via Front Door)
- [ ] Custom domain resolving
- [ ] HTTPS working
- [ ] API key authentication working

---

## Architecture Summary (What We Built)

```
┌─────────────────────────────────────────────────────────┐
│              Mobile Apps (iOS/Android)                   │
└────────────────────────┬────────────────────────────────┘
                         │
                         │ HTTPS
                         ↓
┌─────────────────────────────────────────────────────────┐
│         Azure Front Door (Public)                        │
│         Endpoint: mobile-api-xxx.azurefd.net            │
│         Custom Domain: api.yourdomain.com               │
│         - WAF enabled                                    │
│         - DDoS protection                                │
│         - SSL termination                                │
└────────────────────────┬────────────────────────────────┘
                         │
                         │ Private Link (Secure)
                         ↓
┌─────────────────────────────────────────────────────────┐
│              Azure Virtual Network (Private)             │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Application Gateway (Internal AGIC)           │    │
│  │  Private IP: 10.0.2.4                          │    │
│  │  NO Public IP ✅                               │    │
│  └──────────────────┬─────────────────────────────┘    │
│                     │                                    │
│                     ↓                                    │
│  ┌────────────────────────────────────────────────┐    │
│  │              AKS Cluster                       │    │
│  │  ┌──────────────────────────────────────┐     │    │
│  │  │  AGIC (Ingress Controller)           │     │    │
│  │  └──────────────────────────────────────┘     │    │
│  │  ┌──────────────────────────────────────┐     │    │
│  │  │  Hello World API                     │     │    │
│  │  │  - 3 pods                            │     │    │
│  │  │  - ClusterIP service                 │     │    │
│  │  │  - Health checks                     │     │    │
│  │  └──────────────────────────────────────┘     │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## Cost Breakdown (Monthly)

| Resource | Cost (USD/month) |
|----------|------------------|
| AKS (2 nodes, Standard_DS2_v2) | ~$140 |
| Application Gateway (Standard V2) | ~$125 |
| Azure Front Door (Premium) | ~$35 |
| Container Registry (Standard) | ~$20 |
| Key Vault | ~$1 |
| Log Analytics | ~$10 |
| Bandwidth | ~$20 |
| **Total** | **~$351/month** |

---

## Troubleshooting (Portal)

### Issue: Pods not starting

**Check in Portal:**
1. Go to **AKS** → **Workloads** → **Pods**
2. Click failing pod
3. View **Events** and **Logs** tabs

**Check in Cloud Shell:**
```bash
kubectl describe pod <pod-name>
kubectl logs <pod-name>
```

### Issue: Ingress not getting configured

**Check in Portal:**
1. Go to **AKS** → **Services and ingresses**
2. Check ingress status
3. Go to **Application Gateway** → **Backend health**

**Check in Cloud Shell:**
```bash
kubectl describe ingress hello-world-ingress
kubectl logs -n kube-system -l app=ingress-appgw
```

### Issue: Front Door not connecting

**Check in Portal:**
1. Go to **Application Gateway** → **Private endpoint connections**
2. Verify connection is **Approved**
3. Go to **Front Door** → **Origins**
4. Check origin health status

### Issue: Custom domain not working

**Check in Portal:**
1. Go to **Front Door** → **Domains**
2. Verify domain validation status
3. Check DNS records at your DNS provider
4. Wait for DNS propagation (up to 48 hours)

---

## Next Steps

1. **Add more environments** (dev, staging, prod)
2. **Implement CI/CD** with Azure DevOps
3. **Add monitoring dashboards**
4. **Configure auto-scaling**
5. **Add more API endpoints**
6. **Implement OAuth2** authentication
7. **Add caching layer** (Redis)
8. **Setup disaster recovery**

---

## Comparison: CLI (Day 13) vs Portal (Day 14)

| Aspect | CLI (Day 13) | Portal (Day 14) |
|--------|-------------|-----------------|
| **Speed** | ⚡ Faster | 🐢 Slower |
| **Automation** | ✅ Easy to script | ❌ Manual |
| **Learning Curve** | Steeper | Gentler |
| **Visibility** | Less visual | More visual |
| **Best For** | Automation, DevOps | Learning, one-time setup |
| **Repeatability** | ✅ Excellent | ❌ Manual |

**Recommendation**: 
- Use **Portal** for learning and understanding
- Use **CLI** for automation and production

---

## Congratulations! 🎉

You've successfully:
- ✅ Created AKS cluster with internal AGIC using Portal
- ✅ Deployed Hello World API
- ✅ Exposed internal API to public via Front Door
- ✅ Configured security (WAF, API keys)
- ✅ Set up monitoring and alerts
- ✅ Made API accessible for mobile apps

Your API is now ready for mobile developers! 📱🚀

**Public Endpoint**: `https://api.yourdomain.com/api/hello`

**Give this to mobile developers** with API documentation!
