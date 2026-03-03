# Day 16: AKS with APIM Integration - Complete Portal Guide

## What You'll Learn

Based on the Terraform configuration from [HoussemDellai's AKS Course](https://github.com/HoussemDellai/aks-course/tree/main/230_aks_ingress_apim/terraform), this guide shows you how to:
- ✅ Create complete AKS infrastructure via Azure Portal
- ✅ Deploy NGINX Ingress Controller
- ✅ Integrate Azure API Management with AKS
- ✅ Configure VNet integration for APIM
- ✅ Deploy sample application
- ✅ Test end-to-end connectivity
- ✅ All via GUI/Portal (no Terraform needed!)

## Architecture

```
Internet
    ↓
Azure API Management Developer (Public Gateway, NOT in VNet)
    ↓
Azure Internal Routing (Same region/subscription)
    ↓
NGINX Ingress Controller (Internal LoadBalancer: 10.0.x.x - NO PUBLIC IP)
    ↓
AKS Cluster (subnet-aks: 10.0.0.0/22)
    ↓
Sample Application Pods
```

**Key Components:**
- VNet with 1 subnet (AKS only - no APIM subnet needed!)
- AKS cluster with system node pool
- **NGINX Ingress Controller (Internal LoadBalancer - NOT exposed to internet!)**
- Azure API Management (Developer tier - cheaper!)
- Sample app deployment

**Important Architecture Notes:**
- ✅ NGINX Ingress is INTERNAL ONLY (no public IP)
- ✅ APIM Developer tier does NOT join VNet
- ✅ APIM reaches internal NGINX via Azure's internal routing
- ✅ Works because same region + subscription
- ✅ Much cheaper than Premium tier (~$50 vs ~$2,800/month)
- ✅ Backend stays secure (not exposed to internet)

**This matches the original Terraform repo architecture:**
- Original repo: https://github.com/HoussemDellai/aks-course/tree/main/230_aks_ingress_apim
- Uses Developer tier APIM (not Premium)
- Uses internal NGINX Ingress Controller
- No public IP on NGINX LoadBalancer

---

## Prerequisites

- Azure subscription
- Azure Portal access
- Basic understanding of Kubernetes
- Completed Day 14 or Day 15 (recommended)

---

## Part 1: Create Resource Group

### Step 1: Navigate to Resource Groups

1. Open Azure Portal: https://portal.azure.com
2. Search for **"Resource groups"**
3. Click **"+ Create"**

### Step 2: Create Resource Group

1. **Subscription**: Select your subscription
2. **Resource group**: `rg-aks-apim-demo`
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
2. **Resource group**: `rg-aks-apim-demo`
3. **Name**: `vnet-aks-apim`
4. **Region**: `East US`
5. Click **"Next: IP Addresses"**

### Step 3: IP Addresses Tab

1. **IPv4 address space**: `10.0.0.0/16`
2. Click **"+ Add subnet"**

**Subnet 1 - AKS (Only subnet needed!):**
- **Name**: `subnet-aks`
- **Subnet address range**: `10.0.0.0/22` (1024 IPs for AKS)
- Click **"Add"**

**Note**: We don't need subnet-apim because Developer tier APIM doesn't join VNet!

3. Click **"Review + create"**
4. Click **"Create"**

**✅ Result**: VNet with 1 subnet created

---

## Part 3: Create AKS Cluster

### Step 1: Navigate to Kubernetes Services

1. Search for **"Kubernetes services"**
2. Click **"+ Create"** → **"Create a Kubernetes cluster"**

### Step 2: Basics Tab

1. **Subscription**: Your subscription
2. **Resource group**: `rg-aks-apim-demo`
3. **Cluster preset configuration**: `Dev/Test`
4. **Kubernetes cluster name**: `aks-apim-cluster`
5. **Region**: `East US`
6. **Availability zones**: `None` (for simplicity)
7. **AKS pricing tier**: `Free`
8. **Kubernetes version**: Latest stable (e.g., `1.28.x`)
9. **Automatic upgrade**: `Disabled`
10. **Node security channel type**: `None`
11. **Authentication and Authorization**: `Local accounts with Kubernetes RBAC`

### Step 3: Node Pools Tab

**Default node pool (system):**
1. **Node pool name**: `systempool`
2. **Mode**: `System`
3. **OS SKU**: `Ubuntu Linux`
4. **Availability zones**: `None`
5. **Enable Azure Spot instances**: Unchecked
6. **Node size**: Click **"Choose a size"**
   - Select: `Standard_DS2_v2` (2 vCPUs, 7 GB RAM)
   - Click **"Select"**
7. **Scale method**: `Manual`
8. **Node count**: `2`
9. **Max pods per node**: `30`

### Step 4: Networking Tab

1. **Network configuration**: `Azure CNI`
2. **Virtual network**: Select `vnet-aks-apim`
3. **Cluster subnet**: Select `subnet-aks`
4. **Kubernetes service address range**: `10.1.0.0/16`
5. **Kubernetes DNS service IP address**: `10.1.0.10`
6. **DNS name prefix**: `aks-apim-cluster-dns`
7. **Network policy**: `None` (or `Calico` for advanced)
8. **Load balancer**: `Standard`
9. **Enable HTTP application routing**: Unchecked

### Step 5: Integrations Tab

1. **Container registry**: `None` (we'll create later if needed)
2. **Azure Monitor**: Unchecked (for simplicity)
3. **Azure Policy**: Unchecked

### Step 6: Advanced Tab

1. **Enable cluster autoscaler**: Unchecked
2. **Enable virtual nodes**: Unchecked

### Step 7: Review + Create

1. Click **"Review + create"**
2. Wait for validation
3. Click **"Create"**

**⏱️ Wait time**: 5-10 minutes

**✅ Result**: AKS cluster created

---

## Part 4: Connect to AKS Cluster

### Step 1: Get Credentials

1. Go to your AKS cluster: `aks-apim-cluster`
2. Click **"Connect"** (top menu)
3. Select **"Azure CLI"** tab
4. Copy the commands:

```bash
# Login to Azure
az login

# Set subscription
az account set --subscription <your-subscription-id>

# Get credentials
az aks get-credentials --resource-group rg-aks-apim-demo --name aks-apim-cluster
```

### Step 2: Open Cloud Shell

1. Click **Cloud Shell** icon (top right in Portal)
2. Select **Bash**
3. Paste and run the commands above

### Step 3: Verify Connection

```bash
# Check nodes
kubectl get nodes

# Expected output:
# NAME                                STATUS   ROLES   AGE   VERSION
# aks-systempool-12345678-vmss000000  Ready    agent   5m    v1.28.x
# aks-systempool-12345678-vmss000001  Ready    agent   5m    v1.28.x
```

**✅ Result**: Connected to AKS cluster

---

## Part 5: Install NGINX Ingress Controller

### Step 1: Add Helm Repository

```bash
# Add NGINX Ingress Helm repo
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
```

### Step 2: Install NGINX Ingress (INTERNAL ONLY)

```bash
# Create namespace
kubectl create namespace ingress-nginx

# Install NGINX Ingress Controller (INTERNAL - NO PUBLIC IP!)
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --set controller.replicaCount=2 \
  --set controller.nodeSelector."kubernetes\.io/os"=linux \
  --set controller.service.type=LoadBalancer \
  --set controller.service.annotations."service\.beta\.kubernetes\.io/azure-load-balancer-internal"="true" \
  --set controller.service.annotations."service\.beta\.kubernetes\.io/azure-load-balancer-internal-subnet"="subnet-aks"
```

**What this does:**
- Creates NGINX Ingress Controller
- 2 replicas for HA
- **Internal LoadBalancer ONLY (no public IP!)**
- Uses subnet-aks
- Gets private IP from 10.0.0.0/22 range
- **NOT accessible from internet directly**

**Critical Setting:**
- `service.beta.kubernetes.io/azure-load-balancer-internal: "true"` ← This makes it INTERNAL!
- Without this annotation, you'd get a PUBLIC IP (not what we want!)

### Step 3: Verify Installation

```bash
# Check pods
kubectl get pods -n ingress-nginx

# Expected: 2 pods running

# Check service (IMPORTANT!)
kubectl get svc -n ingress-nginx

# Expected output:
# NAME                                 TYPE           CLUSTER-IP     EXTERNAL-IP   PORT(S)
# ingress-nginx-controller             LoadBalancer   10.1.x.x       10.0.0.100    80:xxxxx/TCP,443:xxxxx/TCP
#
# ✅ EXTERNAL-IP should be INTERNAL (10.0.x.x) - NOT a public IP!
# ❌ If you see a public IP like 20.x.x.x, something is wrong!
```

### Step 4: Get Internal IP

```bash
# Get the internal IP
kubectl get svc ingress-nginx-controller -n ingress-nginx -o jsonpath='{.status.loadBalancer.ingress[0].ip}'

# Example output: 10.0.0.100 (INTERNAL IP - not accessible from internet!)
```

**Save this IP!** You'll need it for APIM configuration.

**Verify it's internal:**
- IP should be in range 10.0.0.0/22 (your subnet-aks range)
- Should NOT be a public IP (20.x.x.x, 40.x.x.x, etc.)
- Should NOT be accessible from your local machine (only from Azure network)

**✅ Result**: NGINX Ingress Controller installed with INTERNAL IP ONLY

---

## Part 6: Deploy Sample Application

### Step 1: Create Deployment YAML

In Cloud Shell, create a file:

```bash
cat <<EOF > sample-app.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sample-app
  namespace: default
spec:
  replicas: 3
  selector:
    matchLabels:
      app: sample-app
  template:
    metadata:
      labels:
        app: sample-app
    spec:
      containers:
      - name: sample-app
        image: mcr.microsoft.com/azuredocs/aks-helloworld:v1
        ports:
        - containerPort: 80
        env:
        - name: TITLE
          value: "Welcome to AKS with APIM!"
---
apiVersion: v1
kind: Service
metadata:
  name: sample-app-service
  namespace: default
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 80
  selector:
    app: sample-app
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: sample-app-ingress
  namespace: default
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
  rules:
  - http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: sample-app-service
            port:
              number: 80
EOF
```

### Step 2: Deploy Application

```bash
# Apply the configuration
kubectl apply -f sample-app.yaml

# Verify deployment
kubectl get deployments
kubectl get pods
kubectl get svc
kubectl get ingress
```

### Step 3: Test Internal Access (From Azure Network Only!)

```bash
# Get NGINX Ingress IP
INGRESS_IP=$(kubectl get svc ingress-nginx-controller -n ingress-nginx -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

echo "NGINX Ingress Internal IP: $INGRESS_IP"

# Test from Cloud Shell (within Azure network)
curl http://$INGRESS_IP

# Expected: HTML response with "Welcome to AKS with APIM!"
```

**Important Notes:**
- ✅ This works from Cloud Shell (inside Azure network)
- ❌ This will NOT work from your local machine (NGINX is internal only!)
- ✅ Only APIM can reach this IP (via Azure internal routing)
- ✅ This is the security benefit - backend not exposed to internet!

**If curl fails:**
- Check if NGINX IP is internal (10.0.x.x)
- Check if pods are running: `kubectl get pods`
- Check ingress: `kubectl get ingress`

**✅ Result**: Sample app deployed and accessible INTERNALLY ONLY (not from internet!)

---

## Part 7: Create Azure API Management

### Step 1: Navigate to API Management

1. Search for **"API Management services"**
2. Click **"+ Create"**

### Step 2: Basics Tab

1. **Subscription**: Your subscription
2. **Resource group**: `rg-aks-apim-demo`
3. **Region**: `East US`
4. **Resource name**: `apim-aks-integration`
5. **Organization name**: `Your Company`
6. **Administrator email**: `your-email@example.com`
7. **Pricing tier**: **Developer (No SLA)** ← Cheaper option!

**Why Developer tier:**
- ✅ Much cheaper (~$50/month vs ~$2,800)
- ✅ Can reach internal NGINX via Azure internal routing
- ✅ Perfect for testing and learning
- ✅ All API management features
- ❌ No SLA (not for production)
- ❌ No VNet integration (but doesn't need it!)

8. Click **"Review + create"**
9. Click **"Create"**

**⏱️ Wait time**: 30-45 minutes

**✅ Result**: APIM Developer tier instance created

---

## Part 8: How Developer Tier APIM Reaches Internal NGINX

**Critical Concept - This is the key to understanding this architecture!**

Even though Developer tier APIM is NOT in the VNet, it can still reach internal NGINX!

### Architecture Flow:

```
Internet (Public)
    ↓
APIM Developer (Public Gateway: apim-aks-integration.azure-api.net)
    ↓
Azure Internal Backbone Network (Microsoft's internal routing)
    ↓
Internal NGINX LoadBalancer (10.0.x.x - PRIVATE IP, NOT PUBLIC!)
    ↓
AKS Pods
```

### How It Works:

**Traditional Approach (Premium tier):**
- APIM joins VNet via VNet integration
- Direct network path to internal resources
- Costs ~$2,800/month
- Guaranteed connectivity

**Our Approach (Developer tier):**
- APIM stays public (not in VNet)
- Uses Azure's internal backbone network
- Can reach internal IPs in same region/subscription
- Costs ~$50/month (98% cheaper!)

**Requirements for this to work:**
- ✅ Same Azure region (East US)
- ✅ Same subscription
- ✅ No NSG blocking traffic
- ✅ Internal IP is routable within Azure
- ✅ NGINX has internal LoadBalancer (not public)

**Why this works:**
- Azure's internal network routing between services
- Resources in same region can communicate via internal IPs
- No VNet peering needed
- No public IP exposure on NGINX
- APIM acts as the only public entry point

**Security Benefits:**
- ✅ NGINX is NOT exposed to internet (internal IP only)
- ✅ AKS backend is protected
- ✅ Only APIM can reach NGINX (via Azure internal routing)
- ✅ APIM provides authentication, rate limiting, etc.
- ✅ Single public entry point (APIM gateway)

**Note**: This is not officially documented by Microsoft but is widely used and works reliably when resources are in the same region and subscription. For production with SLA requirements, consider Standard or Premium tier.

**✅ Result**: APIM can reach internal NGINX without VNet integration, keeping backend secure!

---

## Part 9: Create API in APIM

### Step 1: Navigate to APIs

1. Go to APIM: `apim-aks-integration`
2. In left menu, click **"APIs"**
3. Click **"+ Add API"**
4. Select **"HTTP"**

### Step 2: Create API

1. **Display name**: `AKS Sample API`
2. **Name**: `aks-sample-api`
3. **Web service URL**: `http://10.0.0.100` (your NGINX Ingress INTERNAL IP)
   - ⚠️ Use HTTP (not HTTPS) unless you configured SSL on NGINX
   - ⚠️ This is the INTERNAL IP (10.0.x.x), not a public IP!
   - ⚠️ Replace 10.0.0.100 with your actual NGINX internal IP
4. **API URL suffix**: `aks`
5. Click **"Create"**

**Important:**
- The backend URL points to NGINX's INTERNAL IP
- APIM will reach this via Azure's internal routing
- This IP is NOT accessible from internet
- Only APIM can reach it (via Azure internal network)

### Step 3: Add Operation

1. Click on **"AKS Sample API"**
2. Click **"+ Add operation"**
3. Fill in:
   - **Display name**: `Get Hello`
   - **Name**: `get-hello`
   - **URL**: 
     - Method: `GET`
     - Path: `/`
4. Click **"Save"**

**✅ Result**: API created in APIM

---

## Part 10: Test APIM to Internal NGINX Connection

### Step 1: Test in Portal

1. Go to **"APIs"** → **"AKS Sample API"** → **"Get Hello"**
2. Click **"Test"** tab
3. Click **"Send"**

**Expected Response:**
```
HTTP/1.1 200 OK
Content-Type: text/html

<!DOCTYPE html>
<html>
...
Welcome to AKS with APIM!
...
</html>
```

**What just happened:**
- ✅ APIM (public) reached NGINX (internal 10.0.x.x) via Azure internal routing
- ✅ NGINX routed to AKS pods
- ✅ Response returned through APIM
- ✅ Backend stayed secure (not exposed to internet)

### Step 2: Test via Gateway URL (Public Access)

1. Go to APIM **"Overview"**
2. Copy **Gateway URL** (e.g., `https://apim-aks-integration.azure-api.net`)
3. Test with curl from your local machine:

```bash
curl https://apim-aks-integration.azure-api.net/aks/
```

**Expected**: HTML response from AKS app

**This proves:**
- ✅ Public can access APIM gateway
- ✅ APIM can reach internal NGINX
- ✅ NGINX is NOT directly accessible from internet
- ✅ APIM is the only public entry point

**✅ Result**: APIM successfully connects to internal NGINX via Azure internal routing!

---

## Part 11: Add Subscription Keys

### Step 1: Create Product

1. In APIM, click **"Products"**
2. Click **"+ Add"**
3. Fill in:
   - **Display name**: `AKS API Product`
   - **Id**: `aks-api-product`
   - **Description**: `Access to AKS APIs`
   - **Requires subscription**: ✅ Checked
   - **Requires approval**: ✅ Checked
   - **State**: `Published`
4. Click **"Create"**

### Step 2: Add API to Product

1. Click on **"AKS API Product"**
2. Click **"APIs"**
3. Click **"+ Add"**
4. Select **"AKS Sample API"**
5. Click **"Select"**

### Step 3: Create Subscription

1. Click **"Subscriptions"**
2. Click **"+ Add subscription"**
3. Fill in:
   - **Name**: `Mobile App Subscription`
   - **Display name**: `Mobile App`
   - **Scope**: `Product`
   - **Product**: `AKS API Product`
4. Click **"Create"**
5. Click **"Show"** to see the key
6. Copy the subscription key

**✅ Result**: Subscription key created

---

## Part 12: Configure API Policies

### Step 1: Add Rate Limiting

1. Go to **"APIs"** → **"AKS Sample API"**
2. Click **"All operations"**
3. In **"Inbound processing"**, click **"</>** (code editor)
4. Add policy:

```xml
<policies>
    <inbound>
        <base />
        <rate-limit calls="100" renewal-period="60" />
        <quota calls="10000" renewal-period="86400" />
        <cors allow-credentials="false">
            <allowed-origins>
                <origin>*</origin>
            </allowed-origins>
            <allowed-methods>
                <method>GET</method>
                <method>POST</method>
            </allowed-methods>
        </cors>
    </inbound>
    <backend>
        <base />
    </backend>
    <outbound>
        <base />
    </outbound>
    <on-error>
        <base />
    </on-error>
</policies>
```

5. Click **"Save"**

**✅ Result**: Policies configured

---

## Part 13: Test with Subscription Key

### Step 1: Test Without Key (Should Fail)

```bash
curl https://apim-aks-integration.azure-api.net/aks/
```

**Expected:**
```json
{
  "statusCode": 401,
  "message": "Access denied due to missing subscription key"
}
```

### Step 2: Test With Key (Should Work)

```bash
curl -H "Ocp-Apim-Subscription-Key: <your-key>" \
  https://apim-aks-integration.azure-api.net/aks/
```

**Expected:** HTML response from AKS app

**✅ Result**: Subscription key validation working

---

## Part 14: Architecture Verification

### Verify Complete Flow

```
1. Internet Request (from anywhere)
   ↓
2. APIM Gateway (Public: apim-aks-integration.azure-api.net)
   - Validates subscription key ✅
   - Applies rate limiting ✅
   - Applies CORS ✅
   ↓
3. Azure Internal Routing (Microsoft's backbone network)
   - APIM reaches internal NGINX ✅
   - No VNet integration needed ✅
   ↓
4. NGINX Ingress (Internal IP: 10.0.0.100 - NOT PUBLIC!)
   - Routes to service ✅
   - NOT accessible from internet ✅
   ↓
5. AKS Service (ClusterIP: sample-app-service)
   - Load balances to pods ✅
   ↓
6. AKS Pods (3 replicas)
   - Returns response ✅
   ↓
7. Response flows back through APIM to internet
```

**Security Verification:**
- ✅ NGINX has NO public IP (internal only)
- ✅ AKS backend is protected
- ✅ Only APIM can reach NGINX (via Azure internal routing)
- ✅ Public can only access via APIM gateway
- ✅ APIM enforces authentication, rate limiting, etc.

### Verification Commands

```bash
# Check AKS nodes
kubectl get nodes

# Check NGINX Ingress
kubectl get svc -n ingress-nginx

# Check sample app
kubectl get pods
kubectl get svc
kubectl get ingress

# Check APIM connectivity
curl -H "Ocp-Apim-Subscription-Key: <key>" \
  https://apim-aks-integration.azure-api.net/aks/
```

**✅ Result**: All components verified

---

## Part 15: Monitoring and Logging

### Step 1: Enable Application Insights

1. Create Application Insights:
   - Search **"Application Insights"**
   - Click **"+ Create"**
   - Resource group: `rg-aks-apim-demo`
   - Name: `appi-aks-apim`
   - Region: `East US`
   - Click **"Review + create"** → **"Create"**

2. Connect to APIM:
   - Go to APIM → **"Application Insights"**
   - Click **"+ Add"**
   - Select `appi-aks-apim`
   - Click **"Create"**

3. Enable logging:
   - Go to **"APIs"** → **"AKS Sample API"** → **"Settings"**
   - **Application Insights**: ✅ Enabled
   - **Sampling**: `100%`
   - Click **"Save"**

### Step 2: View Logs

1. Go to Application Insights: `appi-aks-apim`
2. Click **"Logs"**
3. Run query:

```kusto
requests
| where timestamp > ago(1h)
| project timestamp, name, url, resultCode, duration
| order by timestamp desc
```

**✅ Result**: Monitoring enabled

---

## Part 16: Cost Breakdown

| Resource | Tier/Size | Cost (USD/month) |
|----------|-----------|------------------|
| AKS Cluster | 2 x Standard_DS2_v2 | ~$140 |
| NGINX Ingress (LoadBalancer) | Internal | ~$25 |
| **APIM Developer** | **No SLA** | **~$50** |
| VNet | Standard | ~$0 |
| Application Insights | Standard | ~$10 |
| **Total** | | **~$225/month** |

**Cost Comparison:**
- **With Developer tier (this guide)**: ~$225/month ✅
- **With Premium tier (VNet integration)**: ~$2,975/month
- **Savings**: ~$2,750/month (92% cheaper!)

**Trade-offs:**
- ✅ Much cheaper
- ✅ All API management features
- ✅ Can reach internal NGINX
- ❌ No SLA (not for production)
- ❌ No VNet integration (uses Azure internal routing instead)
- ❌ Single unit only

**Recommendation:**
- **Learning/Testing**: Developer tier (this guide)
- **Production**: Upgrade to Standard (~$700/month) or Premium (~$2,800/month)

---

## Part 17: Troubleshooting

### Issue: APIM Cannot Reach NGINX Ingress

**Symptoms:**
- APIM test returns timeout or connection error
- 502 Bad Gateway

**Solutions:**

1. **Verify same region:**
```bash
# Check APIM region
az apim show --name apim-aks-integration --resource-group rg-aks-apim-demo --query location

# Check AKS region
az aks show --name aks-apim-cluster --resource-group rg-aks-apim-demo --query location

# Must be the same! (e.g., "eastus")
```

2. **Check NGINX Ingress IP:**
```bash
kubectl get svc -n ingress-nginx
# Verify IP is in subnet-aks range (10.0.0.x)
# Verify TYPE is LoadBalancer
# Verify EXTERNAL-IP is assigned (internal IP)
```

3. **Test from Cloud Shell (same Azure network):**
```bash
INGRESS_IP=$(kubectl get svc ingress-nginx-controller -n ingress-nginx -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
curl http://$INGRESS_IP
# Should return HTML response
```

4. **Verify APIM backend URL:**
   - Go to APIM → APIs → AKS Sample API → Settings
   - Backend URL should be: `http://10.0.0.100` (your NGINX IP)
   - Must use HTTP (not HTTPS) unless you configured SSL

5. **Check NSG rules:**
   - Ensure no NSG blocking traffic
   - Port 80/443 should be allowed

**Important**: Developer tier APIM relies on Azure's internal routing. If it doesn't work:
- Verify same region
- Verify same subscription
- Try Standard or Premium tier with VNet integration

### Issue: NGINX Ingress Gets Public IP Instead of Internal

**Symptoms:**
- NGINX Ingress EXTERNAL-IP is a public IP (20.x.x.x, 40.x.x.x, etc.)
- NOT an internal IP (10.0.x.x)

**This is WRONG! NGINX should be internal only!**

**Solution:**
```bash
# Check service annotations
kubectl get svc ingress-nginx-controller -n ingress-nginx -o yaml | grep annotations -A 5

# Should see:
# service.beta.kubernetes.io/azure-load-balancer-internal: "true"
# service.beta.kubernetes.io/azure-load-balancer-internal-subnet: "subnet-aks"

# If missing or wrong, delete and reinstall:
helm uninstall ingress-nginx -n ingress-nginx
kubectl delete namespace ingress-nginx

# Then reinstall with correct annotations (see Part 5, Step 2)
# The key annotation is:
# --set controller.service.annotations."service\.beta\.kubernetes\.io/azure-load-balancer-internal"="true"
```

**Verify after reinstall:**
```bash
kubectl get svc -n ingress-nginx
# EXTERNAL-IP should be 10.0.x.x (internal), NOT a public IP!
```

### Issue: Pods Not Starting

**Solutions:**
```bash
# Check pod status
kubectl get pods

# Describe pod
kubectl describe pod <pod-name>

# Check logs
kubectl logs <pod-name>

# Check events
kubectl get events --sort-by='.lastTimestamp'
```

### Issue: Subscription Key Not Working

**Solutions:**
1. Verify subscription is active:
   - APIM → **"Subscriptions"** → Check state

2. Verify API is in product:
   - APIM → **"Products"** → **"AKS API Product"** → **"APIs"**

3. Check header name:
   - Must be: `Ocp-Apim-Subscription-Key`

### Issue: Azure Internal Routing Not Working

**Symptoms:**
- APIM cannot reach internal NGINX even though everything is configured correctly

**Possible Causes:**
- Different Azure regions
- Different subscriptions
- NSG blocking traffic
- Firewall rules

**Solutions:**

1. **Verify connectivity from another VM in same region:**
```bash
# Create a test VM in same region
# Try curl to NGINX internal IP
curl http://10.0.0.100
```

2. **Check Azure Service Tags:**
   - Ensure ApiManagement service tag can reach VirtualNetwork

3. **Upgrade to Standard/Premium tier:**
   - If internal routing doesn't work, upgrade to Standard or Premium
   - Configure VNet integration (Premium only)
   - Guaranteed connectivity

---

## Part 18: Cleanup

### Delete Resources

**Option 1: Delete Resource Group (Deletes Everything)**
```bash
az group delete --name rg-aks-apim-demo --yes --no-wait
```

**Option 2: Delete Individual Resources**
1. Delete APIM (takes 30 min)
2. Delete AKS cluster (takes 5 min)
3. Delete VNet
4. Delete Resource Group

---

## Summary

You've successfully created a complete AKS + APIM integration using Azure Portal with Developer tier!

**What we built:**
- ✅ VNet with 1 subnet (AKS only - no APIM subnet!)
- ✅ AKS cluster with 2 nodes
- ✅ **NGINX Ingress Controller (INTERNAL LoadBalancer - NO PUBLIC IP!)**
- ✅ Sample application (3 replicas)
- ✅ Azure APIM Developer tier (no VNet integration needed!)
- ✅ API with subscription keys
- ✅ Rate limiting and CORS policies
- ✅ Application Insights monitoring

**Architecture:**
```
Internet → APIM Developer (Public) → Azure Internal Routing → NGINX Ingress (INTERNAL 10.0.x.x) → AKS → App
```

**Key learnings:**
- ✅ NGINX Ingress is INTERNAL ONLY (not exposed to internet)
- ✅ Developer tier APIM can reach internal NGINX via Azure's internal routing
- ✅ No VNet integration needed (saves ~$2,750/month!)
- ✅ Same region + subscription required
- ✅ Backend stays secure (only APIM can reach it)
- ✅ Perfect for learning and testing
- ✅ Matches original Terraform repo architecture

**Cost: ~$225/month** (vs ~$2,975 with Premium tier)

**Next steps:**
- Add more APIs
- Configure OAuth 2.0
- Set up CI/CD pipeline
- Add custom domain
- Upgrade to Standard/Premium for production

**Production Recommendation:**
- This setup is great for learning/testing
- For production, upgrade to Standard (~$700/month) or Premium (~$2,800/month)
- Premium tier provides VNet integration and SLA

Great job! You now have a cost-effective AKS + APIM integration! 🚀
