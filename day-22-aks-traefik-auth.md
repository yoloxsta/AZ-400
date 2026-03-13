# Day 22: AKS Deployment with Traefik Ingress & Authentication

## What You'll Learn

Deploy a real-world application on Azure Kubernetes Service (AKS) with:
- ✅ Complete Flask REST API application
- ✅ Docker containerization
- ✅ Azure Container Registry (ACR)
- ✅ AKS cluster deployment
- ✅ Traefik as public ingress controller
- ✅ BasicAuth authentication (backend protection)
- ✅ Public access with security
- ✅ Complete testing and verification

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Application Code](#application-code)
3. [Build and Push Docker Image](#build-and-push-docker-image)
4. [Create AKS Cluster](#create-aks-cluster)
5. [Install Traefik Ingress Controller](#install-traefik-ingress-controller)
6. [Deploy Application](#deploy-application)
7. [Configure Traefik Authentication](#configure-traefik-authentication)
8. [Testing and Verification](#testing-and-verification)
9. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### What We'll Build

```
Internet (Public)
    ↓
Azure Load Balancer (Public IP)
    ↓
Traefik Ingress Controller
    ├─ Public Endpoints: /, /health (No Auth)
    └─ Protected Endpoints: /api/* (BasicAuth Required)
        ↓
    Backend API Service (Private)
        ↓
    API Pods (3 replicas)
```

### Why This Architecture?

**Problem:** Backend API should not be directly exposed to the internet
**Solution:** Traefik acts as gateway with authentication

**Benefits:**
- ✅ Single public entry point
- ✅ Authentication at ingress level
- ✅ Backend remains private
- ✅ Easy to add rate limiting, SSL, etc.
- ✅ Production-ready pattern

### Components

| Component | Purpose | Access |
|-----------|---------|--------|
| Flask API | Backend application | Private (ClusterIP) |
| Traefik | Ingress controller | Public (LoadBalancer) |
| BasicAuth | Authentication middleware | Protects /api/* |
| ACR | Container registry | Private |
| AKS | Kubernetes cluster | Private |

---

## Application Code

### Project Structure

```
day22-app/
├── app.py              # Flask application
├── requirements.txt    # Python dependencies
├── Dockerfile         # Container image
├── .dockerignore      # Docker ignore file
└── README.md          # Documentation
```

### Flask Application (app.py)

Our application has 6 endpoints:

**Public Endpoints (No Auth):**
- `GET /` - API information
- `GET /health` - Health check

**Protected Endpoints (Require Auth):**
- `GET /api/info` - API details
- `GET /api/users` - User list
- `GET /api/products` - Product catalog
- `GET /api/stats` - Statistics

**Key Features:**
- Environment-aware (version, environment)
- Shows hostname (for load balancing verification)
- Production-ready with Gunicorn
- Health check for Kubernetes probes

### Why This Design?

**Real-World Pattern:**
- Public endpoints for health checks (monitoring)
- Protected endpoints for actual data (security)
- Hostname in response (verify load balancing)
- Version tracking (deployment verification)

---

## Lab 1: Build and Push Docker Image

### Step 1: Create Azure Container Registry

1. Login to **Azure Portal** (portal.azure.com)
2. Search for **"Container registries"**
3. Click **"+ Create"**

**Basics Tab:**
- **Subscription**: Your subscription
- **Resource group**: Create new: `rg-day22-aks`
- **Registry name**: `acrday22demo` (must be globally unique, lowercase, no special chars)
- **Location**: `East US`
- **SKU**: `Basic` (sufficient for lab)

Click **"Review + create"**

Click **"Create"**

**⏱️ Wait**: 1-2 minutes

**✅ Result**: ACR created!

### Step 2: Enable Admin Access (For Lab)

1. Go to **"Container registries"** → **"acrday22demo"**
2. In left menu, click **"Access keys"** (under Settings)
3. **Admin user**: Toggle to `Enabled`
4. Note down:
   - **Login server**: `acrday22demo.azurecr.io`
   - **Username**: `acrday22demo`
   - **Password**: (copy password1)

**✅ Result**: Admin access enabled

### Step 3: Build Docker Image Locally

**Prerequisites:** Docker installed on your machine

1. Navigate to application directory:
```bash
cd day22-app
```

2. Build Docker image:
```bash
docker build -t day22-demo-api:1.0.0 .
```

**⏱️ Wait**: 2-3 minutes

**Expected Output:**
```
[+] Building 45.2s (12/12) FINISHED
 => [internal] load build definition
 => => transferring dockerfile: 523B
 => [internal] load .dockerignore
 => [1/6] FROM python:3.11-slim
 => [2/6] WORKDIR /app
 => [3/6] COPY requirements.txt .
 => [4/6] RUN pip install --no-cache-dir -r requirements.txt
 => [5/6] COPY app.py .
 => [6/6] RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
 => exporting to image
 => => naming to docker.io/library/day22-demo-api:1.0.0
```

**✅ Result**: Docker image built!

### Step 4: Test Docker Image Locally

```bash
# Run container
docker run -d -p 5000:5000 --name day22-test day22-demo-api:1.0.0

# Test endpoints
curl http://localhost:5000
curl http://localhost:5000/health
curl http://localhost:5000/api/users

# Stop container
docker stop day22-test
docker rm day22-test
```

**Expected Response:**
```json
{
  "message": "Welcome to Day 22 Demo API",
  "version": "1.0.0",
  "environment": "production",
  "timestamp": "2026-03-13T10:30:00.123456"
}
```

**✅ Result**: Application working locally!


### Step 5: Login to Azure Container Registry

```bash
# Login to ACR
az acr login --name acrday22demo
```

**Expected Output:**
```
Login Succeeded
```

**Alternative (if az cli not available):**
```bash
docker login acrday22demo.azurecr.io
Username: acrday22demo
Password: <paste-password-from-portal>
```

**✅ Result**: Logged in to ACR

### Step 6: Tag and Push Image to ACR

```bash
# Tag image for ACR
docker tag day22-demo-api:1.0.0 acrday22demo.azurecr.io/day22-demo-api:1.0.0

# Push to ACR
docker push acrday22demo.azurecr.io/day22-demo-api:1.0.0
```

**⏱️ Wait**: 1-2 minutes

**Expected Output:**
```
The push refers to repository [acrday22demo.azurecr.io/day22-demo-api]
1.0.0: digest: sha256:abc123... size: 1234
```

**✅ Result**: Image pushed to ACR!

### Step 7: Verify Image in ACR

1. Go to **"Container registries"** → **"acrday22demo"**
2. In left menu, click **"Repositories"**
3. You should see **"day22-demo-api"**
4. Click on it
5. You should see tag **"1.0.0"**

**✅ Result**: Image available in ACR!

### Step 8: Test, Check, and Confirm - Docker & ACR

**Test 1: Verify Local Docker Image**

```bash
docker images | grep day22-demo-api
```

**Expected Output:**
```
day22-demo-api                           1.0.0    abc123def456   5 minutes ago   180MB
acrday22demo.azurecr.io/day22-demo-api   1.0.0    abc123def456   5 minutes ago   180MB
```

**✅ Both images present with same ID**

**Test 2: Verify Image Layers**

```bash
docker history day22-demo-api:1.0.0
```

**Expected Output:**
```
IMAGE          CREATED         CREATED BY                                      SIZE
abc123def456   5 minutes ago   CMD ["gunicorn" "--bind" "0.0.0.0:5000"...]    0B
def456ghi789   5 minutes ago   HEALTHCHECK &{["CMD-SHELL" "python -c..."]}     0B
...
```

**✅ All layers present**

**Test 3: Test Application Endpoints**

```bash
# Start container
docker run -d -p 5000:5000 --name test-app day22-demo-api:1.0.0

# Test all endpoints
curl http://localhost:5000
curl http://localhost:5000/health
curl http://localhost:5000/api/info
curl http://localhost:5000/api/users
curl http://localhost:5000/api/products
curl http://localhost:5000/api/stats

# Cleanup
docker stop test-app && docker rm test-app
```

**Expected Results:**
```
✅ / returns welcome message
✅ /health returns healthy status
✅ /api/info returns API details
✅ /api/users returns user list
✅ /api/products returns product list
✅ /api/stats returns statistics
```

**Test 4: Verify ACR Repository**

```bash
# List repositories
az acr repository list --name acrday22demo --output table

# Show tags
az acr repository show-tags --name acrday22demo --repository day22-demo-api --output table
```

**Expected Output:**
```
Result
----------------
day22-demo-api

Result
------
1.0.0
```

**✅ Repository and tag confirmed in ACR**

**Test 5: Pull Image from ACR**

```bash
# Remove local images
docker rmi day22-demo-api:1.0.0
docker rmi acrday22demo.azurecr.io/day22-demo-api:1.0.0

# Pull from ACR
docker pull acrday22demo.azurecr.io/day22-demo-api:1.0.0

# Run pulled image
docker run -d -p 5000:5000 --name acr-test acrday22demo.azurecr.io/day22-demo-api:1.0.0

# Test
curl http://localhost:5000/health

# Cleanup
docker stop acr-test && docker rm acr-test
```

**Expected Result:**
```json
{
  "status": "healthy",
  "hostname": "abc123def456",
  "version": "1.0.0"
}
```

**✅ Image pulls and runs from ACR successfully!**

---

## Lab 2: Create AKS Cluster

### Step 1: Create AKS Cluster

1. Search for **"Kubernetes services"**
2. Click **"+ Create"** → **"Create a Kubernetes cluster"**

**Basics Tab:**
- **Subscription**: Your subscription
- **Resource group**: `rg-day22-aks`
- **Cluster preset configuration**: `Dev/Test`
- **Kubernetes cluster name**: `aks-day22-cluster`
- **Region**: `East US`
- **Availability zones**: `None`
- **AKS pricing tier**: `Free`
- **Kubernetes version**: `1.28.x` (default)
- **Automatic upgrade**: `Disabled`
- **Node security channel type**: `None`
- **Authentication and Authorization**: `Local accounts with Kubernetes RBAC`

**Node pools:**
- **Node size**: Click **"Choose a size"**
  - Select **"B2s"** (2 vCPUs, 4 GB RAM) - cheapest option
  - Click **"Select"**
- **Scale method**: `Manual`
- **Node count**: `2`

Click **"Next: Node pools"** (skip)

Click **"Next: Networking"**

**Networking Tab:**
- **Network configuration**: `Azure CNI`
- **Bring your own Azure virtual network**: `No` (create new)
- **DNS name prefix**: `aks-day22-cluster-dns`
- **Network policy**: `None`
- **Load balancer**: `Standard`

Click **"Next: Integrations"**

**Integrations Tab:**
- **Container registry**: Select **"acrday22demo"**
- **Enable recommended alert rules**: `Unchecked` (to save costs)

Click **"Review + create"**

Click **"Create"**

**⏱️ Wait**: 5-10 minutes

**✅ Result**: AKS cluster created!

### Step 2: Connect to AKS Cluster

```bash
# Get credentials
az aks get-credentials --resource-group rg-day22-aks --name aks-day22-cluster

# Verify connection
kubectl get nodes
```

**Expected Output:**
```
NAME                                STATUS   ROLES   AGE   VERSION
aks-nodepool1-12345678-vmss000000   Ready    agent   5m    v1.28.x
aks-nodepool1-12345678-vmss000001   Ready    agent   5m    v1.28.x
```

**✅ Result**: Connected to AKS!


### Step 3: Verify AKS-ACR Integration

```bash
# Check if AKS can pull from ACR
az aks check-acr --resource-group rg-day22-aks --name aks-day22-cluster --acr acrday22demo.azurecr.io
```

**Expected Output:**
```
The ACR acrday22demo.azurecr.io is reachable from the AKS cluster aks-day22-cluster
```

**✅ Result**: AKS can pull images from ACR!

### Step 4: Test, Check, and Confirm - AKS Cluster

**Test 1: Verify Cluster Status**

```bash
kubectl cluster-info
```

**Expected Output:**
```
Kubernetes control plane is running at https://aks-day22-cluster-dns-abc123.hcp.eastus.azmk8s.io:443
CoreDNS is running at https://aks-day22-cluster-dns-abc123.hcp.eastus.azmk8s.io:443/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy
Metrics-server is running at https://aks-day22-cluster-dns-abc123.hcp.eastus.azmk8s.io:443/api/v1/namespaces/kube-system/services/https:metrics-server:/proxy
```

**✅ Cluster is running**

**Test 2: Check Node Status**

```bash
kubectl get nodes -o wide
```

**Expected Output:**
```
NAME                                STATUS   ROLES   AGE   VERSION   INTERNAL-IP   EXTERNAL-IP   OS-IMAGE             KERNEL-VERSION      CONTAINER-RUNTIME
aks-nodepool1-12345678-vmss000000   Ready    agent   10m   v1.28.x   10.224.0.4    <none>        Ubuntu 22.04.3 LTS   5.15.0-1052-azure   containerd://1.7.x
aks-nodepool1-12345678-vmss000001   Ready    agent   10m   v1.28.x   10.224.0.5    <none>        Ubuntu 22.04.3 LTS   5.15.0-1052-azure   containerd://1.7.x
```

**✅ 2 nodes ready**

**Test 3: Check System Pods**

```bash
kubectl get pods -n kube-system
```

**Expected Output:**
```
NAME                                  READY   STATUS    RESTARTS   AGE
coredns-abc123-xxxxx                  1/1     Running   0          10m
coredns-abc123-yyyyy                  1/1     Running   0          10m
metrics-server-abc123-xxxxx           1/1     Running   0          10m
...
```

**✅ All system pods running**

**Test 4: Check Namespaces**

```bash
kubectl get namespaces
```

**Expected Output:**
```
NAME              STATUS   AGE
default           Active   10m
kube-node-lease   Active   10m
kube-public       Active   10m
kube-system       Active   10m
```

**✅ Default namespaces present**

**Test 5: Test kubectl Commands**

```bash
# Get all resources
kubectl get all

# Check API versions
kubectl api-versions

# Check cluster capacity
kubectl top nodes
```

**Expected Result:**
```
✅ kubectl commands work
✅ API server responsive
✅ Cluster healthy
```

---

## Lab 3: Install Traefik Ingress Controller

### Step 1: Add Traefik Helm Repository

```bash
# Add Traefik Helm repo
helm repo add traefik https://traefik.github.io/charts

# Update repo
helm repo update
```

**Expected Output:**
```
"traefik" has been added to your repositories
Hang tight while we grab the latest from your chart repositories...
...Successfully got an update from the "traefik" chart repository
```

**✅ Result**: Traefik repo added!

### Step 2: Create Namespace for Traefik

```bash
kubectl create namespace traefik
```

**Expected Output:**
```
namespace/traefik created
```

**✅ Result**: Namespace created!

### Step 3: Install Traefik with Helm

```bash
helm install traefik traefik/traefik \
  --namespace traefik \
  --set service.type=LoadBalancer \
  --set ports.web.port=80 \
  --set ports.websecure.port=443
```

**⏱️ Wait**: 2-3 minutes

**Expected Output:**
```
NAME: traefik
LAST DEPLOYED: Thu Mar 13 10:45:00 2026
NAMESPACE: traefik
STATUS: deployed
REVISION: 1
```

**✅ Result**: Traefik installed!

### Step 4: Wait for External IP

```bash
# Watch for external IP (press Ctrl+C when IP appears)
kubectl get svc -n traefik --watch
```

**Expected Output:**
```
NAME      TYPE           CLUSTER-IP     EXTERNAL-IP      PORT(S)                      AGE
traefik   LoadBalancer   10.0.123.45    20.123.45.67     80:30080/TCP,443:30443/TCP   2m
```

**⏱️ Wait**: 2-5 minutes for Azure to provision Load Balancer

**✅ Result**: Traefik has public IP!

### Step 5: Save Traefik Public IP

```bash
# Get Traefik external IP
export TRAEFIK_IP=$(kubectl get svc traefik -n traefik -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

# Display IP
echo "Traefik Public IP: $TRAEFIK_IP"
```

**Expected Output:**
```
Traefik Public IP: 20.123.45.67
```

**✅ Result**: Public IP saved!

### Step 6: Test Traefik Dashboard (Optional)

```bash
# Port forward to access dashboard
kubectl port-forward -n traefik $(kubectl get pods -n traefik -l app.kubernetes.io/name=traefik -o name) 9000:9000
```

Open browser: `http://localhost:9000/dashboard/`

**✅ Result**: Traefik dashboard accessible!

### Step 7: Test, Check, and Confirm - Traefik

**Test 1: Verify Traefik Pods**

```bash
kubectl get pods -n traefik
```

**Expected Output:**
```
NAME                       READY   STATUS    RESTARTS   AGE
traefik-abc123-xxxxx       1/1     Running   0          5m
```

**✅ Traefik pod running**

**Test 2: Verify Traefik Service**

```bash
kubectl get svc -n traefik
```

**Expected Output:**
```
NAME      TYPE           CLUSTER-IP     EXTERNAL-IP    PORT(S)                      AGE
traefik   LoadBalancer   10.0.123.45    20.123.45.67   80:30080/TCP,443:30443/TCP   5m
```

**✅ LoadBalancer service with external IP**

**Test 3: Check Traefik Logs**

```bash
kubectl logs -n traefik -l app.kubernetes.io/name=traefik --tail=20
```

**Expected Output:**
```
time="2026-03-13T10:45:00Z" level=info msg="Configuration loaded from flags."
time="2026-03-13T10:45:00Z" level=info msg="Traefik version 2.10.x built on..."
time="2026-03-13T10:45:01Z" level=info msg="Starting provider *kubernetes.Provider"
```

**✅ No errors in logs**

**Test 4: Test Traefik HTTP Endpoint**

```bash
curl http://$TRAEFIK_IP
```

**Expected Output:**
```
404 page not found
```

**✅ This is CORRECT!** Traefik is running but no routes configured yet.

**Test 5: Check Traefik Configuration**

```bash
kubectl describe deployment traefik -n traefik
```

**Expected Result:**
```
✅ Deployment healthy
✅ 1/1 replicas ready
✅ No errors
```

**Test 6: Verify Azure Load Balancer**

1. Go to Azure Portal
2. Search for **"Load balancers"**
3. You should see a load balancer created by AKS
4. Check **"Frontend IP configuration"** - should show public IP

**Expected Result:**
```
✅ Load balancer created
✅ Public IP assigned
✅ Backend pool configured
```

---

## Lab 4: Deploy Application

### Step 1: Create Application Namespace

```bash
kubectl create namespace day22-app
```

**Expected Output:**
```
namespace/day22-app created
```

**✅ Result**: Namespace created!

### Step 2: Create Deployment YAML

Create file: `deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: day22-demo-api
  namespace: day22-app
  labels:
    app: day22-demo-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: day22-demo-api
  template:
    metadata:
      labels:
        app: day22-demo-api
    spec:
      containers:
      - name: api
        image: acrday22demo.azurecr.io/day22-demo-api:1.0.0
        ports:
        - containerPort: 5000
          name: http
        env:
        - name: APP_VERSION
          value: "1.0.0"
        - name: ENVIRONMENT
          value: "production"
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: day22-demo-api
  namespace: day22-app
  labels:
    app: day22-demo-api
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 5000
    protocol: TCP
    name: http
  selector:
    app: day22-demo-api
```

**✅ Result**: Deployment YAML created!


### Step 3: Deploy Application

```bash
kubectl apply -f deployment.yaml
```

**Expected Output:**
```
deployment.apps/day22-demo-api created
service/day22-demo-api created
```

**✅ Result**: Application deployed!

### Step 4: Verify Deployment

```bash
# Check pods
kubectl get pods -n day22-app

# Check service
kubectl get svc -n day22-app
```

**Expected Output:**
```
NAME                              READY   STATUS    RESTARTS   AGE
day22-demo-api-abc123-xxxxx       1/1     Running   0          1m
day22-demo-api-abc123-yyyyy       1/1     Running   0          1m
day22-demo-api-abc123-zzzzz       1/1     Running   0          1m

NAME             TYPE        CLUSTER-IP    EXTERNAL-IP   PORT(S)   AGE
day22-demo-api   ClusterIP   10.0.234.56   <none>        80/TCP    1m
```

**✅ Result**: 3 pods running, service created!

### Step 5: Test Application Internally

```bash
# Port forward to test
kubectl port-forward -n day22-app svc/day22-demo-api 8080:80
```

In another terminal:
```bash
curl http://localhost:8080
curl http://localhost:8080/health
curl http://localhost:8080/api/users
```

**Expected Response:**
```json
{
  "message": "Welcome to Day 22 Demo API",
  "version": "1.0.0",
  "environment": "production"
}
```

**✅ Result**: Application working internally!

### Step 6: Test, Check, and Confirm - Application Deployment

**Test 1: Verify All Pods Running**

```bash
kubectl get pods -n day22-app -o wide
```

**Expected Output:**
```
NAME                              READY   STATUS    RESTARTS   AGE   IP           NODE
day22-demo-api-abc123-xxxxx       1/1     Running   0          3m    10.244.1.5   aks-nodepool1-...-000000
day22-demo-api-abc123-yyyyy       1/1     Running   0          3m    10.244.2.5   aks-nodepool1-...-000001
day22-demo-api-abc123-zzzzz       1/1     Running   0          3m    10.244.1.6   aks-nodepool1-...-000000
```

**✅ 3 pods running on different nodes (load balanced)**

**Test 2: Check Pod Logs**

```bash
kubectl logs -n day22-app -l app=day22-demo-api --tail=10
```

**Expected Output:**
```
[2026-03-13 10:50:00 +0000] [1] [INFO] Starting gunicorn 21.2.0
[2026-03-13 10:50:00 +0000] [1] [INFO] Listening at: http://0.0.0.0:5000 (1)
[2026-03-13 10:50:00 +0000] [1] [INFO] Using worker: sync
[2026-03-13 10:50:00 +0000] [7] [INFO] Booting worker with pid: 7
[2026-03-13 10:50:00 +0000] [8] [INFO] Booting worker with pid: 8
```

**✅ No errors, application started successfully**

**Test 3: Test Health Probes**

```bash
kubectl describe pod -n day22-app -l app=day22-demo-api | grep -A 5 "Liveness\|Readiness"
```

**Expected Output:**
```
Liveness:   http-get http://:5000/health delay=10s timeout=1s period=10s #success=1 #failure=3
Readiness:  http-get http://:5000/health delay=5s timeout=1s period=5s #success=1 #failure=3
```

**✅ Health probes configured correctly**

**Test 4: Test Service Endpoints**

```bash
kubectl get endpoints -n day22-app
```

**Expected Output:**
```
NAME             ENDPOINTS                                      AGE
day22-demo-api   10.244.1.5:5000,10.244.1.6:5000,10.244.2.5:5000   5m
```

**✅ Service has 3 endpoints (one per pod)**

**Test 5: Test Load Balancing**

```bash
# Port forward
kubectl port-forward -n day22-app svc/day22-demo-api 8080:80 &

# Make multiple requests
for i in {1..10}; do
  curl -s http://localhost:8080/health | jq -r '.hostname'
done

# Kill port forward
pkill -f "port-forward"
```

**Expected Output:**
```
day22-demo-api-abc123-xxxxx
day22-demo-api-abc123-yyyyy
day22-demo-api-abc123-zzzzz
day22-demo-api-abc123-xxxxx
day22-demo-api-abc123-yyyyy
...
```

**✅ Requests distributed across all 3 pods**

**Test 6: Test Resource Limits**

```bash
kubectl describe pod -n day22-app -l app=day22-demo-api | grep -A 5 "Limits\|Requests"
```

**Expected Output:**
```
Limits:
  cpu:     200m
  memory:  256Mi
Requests:
  cpu:     100m
  memory:  128Mi
```

**✅ Resource limits configured**

**Test 7: Test Pod Restart on Failure**

```bash
# Delete one pod
kubectl delete pod -n day22-app -l app=day22-demo-api --field-selector=status.phase=Running | head -1

# Watch pods
kubectl get pods -n day22-app --watch
```

**Expected Result:**
```
✅ Deleted pod terminates
✅ New pod automatically created
✅ Always 3 pods running (self-healing)
```

---

## Lab 5: Configure Traefik Authentication

### Step 1: Create BasicAuth Secret

First, generate password hash:

```bash
# Install htpasswd (if not available)
# Ubuntu/Debian: sudo apt-get install apache2-utils
# macOS: brew install httpd
# Windows: Use online generator or WSL

# Generate password hash
htpasswd -nb admin secure123
```

**Expected Output:**
```
admin:$apr1$abc123$def456ghi789jkl012mno345
```

Copy the entire output (username:hash)

Create file: `auth-secret.yaml`

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: traefik-basic-auth
  namespace: day22-app
type: Opaque
stringData:
  users: |
    admin:$apr1$abc123$def456ghi789jkl012mno345
```

**Note:** Replace the hash with your generated hash!

Apply secret:

```bash
kubectl apply -f auth-secret.yaml
```

**Expected Output:**
```
secret/traefik-basic-auth created
```

**✅ Result**: Auth secret created!

### Step 2: Create Traefik Middleware for Authentication

Create file: `traefik-middleware.yaml`

```yaml
apiVersion: traefik.containo.us/v1alpha1
kind: Middleware
metadata:
  name: basic-auth
  namespace: day22-app
spec:
  basicAuth:
    secret: traefik-basic-auth
    removeHeader: false
```

Apply middleware:

```bash
kubectl apply -f traefik-middleware.yaml
```

**Expected Output:**
```
middleware.traefik.containo.us/basic-auth created
```

**✅ Result**: Middleware created!

### Step 3: Create Ingress with Authentication

Create file: `ingress.yaml`

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: day22-demo-api
  namespace: day22-app
  annotations:
    kubernetes.io/ingress.class: traefik
    # Apply auth middleware only to /api/* paths
    traefik.ingress.kubernetes.io/router.middlewares: day22-app-basic-auth@kubernetescrd
spec:
  rules:
  - http:
      paths:
      # Public endpoints (no auth)
      - path: /
        pathType: Exact
        backend:
          service:
            name: day22-demo-api
            port:
              number: 80
      - path: /health
        pathType: Exact
        backend:
          service:
            name: day22-demo-api
            port:
              number: 80
      # Protected endpoints (with auth)
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: day22-demo-api
            port:
              number: 80
```

**Wait!** This applies auth to ALL paths. We need separate ingress rules.

Let me create the correct version:

Create file: `ingress-public.yaml`

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: day22-demo-api-public
  namespace: day22-app
  annotations:
    kubernetes.io/ingress.class: traefik
    traefik.ingress.kubernetes.io/router.priority: "10"
spec:
  rules:
  - http:
      paths:
      - path: /
        pathType: Exact
        backend:
          service:
            name: day22-demo-api
            port:
              number: 80
      - path: /health
        pathType: Exact
        backend:
          service:
            name: day22-demo-api
            port:
              number: 80
```

Create file: `ingress-protected.yaml`

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: day22-demo-api-protected
  namespace: day22-app
  annotations:
    kubernetes.io/ingress.class: traefik
    traefik.ingress.kubernetes.io/router.middlewares: day22-app-basic-auth@kubernetescrd
    traefik.ingress.kubernetes.io/router.priority: "20"
spec:
  rules:
  - http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: day22-demo-api
            port:
              number: 80
```

Apply both ingress rules:

```bash
kubectl apply -f ingress-public.yaml
kubectl apply -f ingress-protected.yaml
```

**Expected Output:**
```
ingress.networking.k8s.io/day22-demo-api-public created
ingress.networking.k8s.io/day22-demo-api-protected created
```

**✅ Result**: Ingress rules created with selective authentication!


### Step 4: Verify Ingress Configuration

```bash
# Check ingress resources
kubectl get ingress -n day22-app

# Describe ingress
kubectl describe ingress -n day22-app
```

**Expected Output:**
```
NAME                         CLASS    HOSTS   ADDRESS        PORTS   AGE
day22-demo-api-public        <none>   *       20.123.45.67   80      1m
day22-demo-api-protected     <none>   *       20.123.45.67   80      1m
```

**✅ Result**: Both ingress rules active!

### Step 5: Test, Check, and Confirm - Authentication

**Test 1: Verify Secret Created**

```bash
kubectl get secret traefik-basic-auth -n day22-app
```

**Expected Output:**
```
NAME                  TYPE     DATA   AGE
traefik-basic-auth    Opaque   1      5m
```

**✅ Secret exists**

**Test 2: Verify Middleware Created**

```bash
kubectl get middleware -n day22-app
```

**Expected Output:**
```
NAME         AGE
basic-auth   5m
```

**✅ Middleware exists**

**Test 3: Check Middleware Configuration**

```bash
kubectl describe middleware basic-auth -n day22-app
```

**Expected Output:**
```
Name:         basic-auth
Namespace:    day22-app
Spec:
  Basic Auth:
    Remove Header:  false
    Secret:         traefik-basic-auth
```

**✅ Middleware configured correctly**

**Test 4: Verify Ingress Rules**

```bash
kubectl get ingress -n day22-app -o yaml | grep -A 10 "annotations\|priority"
```

**Expected Result:**
```
✅ Public ingress: No auth middleware, priority 10
✅ Protected ingress: Has auth middleware, priority 20
✅ Both point to same service
```

---

## Lab 6: Testing and Verification

### Complete End-to-End Testing

**Get Traefik Public IP:**

```bash
export TRAEFIK_IP=$(kubectl get svc traefik -n traefik -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
echo "Traefik IP: $TRAEFIK_IP"
```

### Test 1: Public Endpoints (No Authentication Required)

**Test Root Endpoint:**

```bash
curl http://$TRAEFIK_IP/
```

**Expected Response:**
```json
{
  "message": "Welcome to Day 22 Demo API",
  "version": "1.0.0",
  "environment": "production",
  "timestamp": "2026-03-13T11:00:00.123456",
  "endpoints": {
    "health": "/health",
    "info": "/api/info",
    "users": "/api/users",
    "products": "/api/products"
  }
}
```

**✅ Public endpoint works without authentication!**

**Test Health Endpoint:**

```bash
curl http://$TRAEFIK_IP/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "hostname": "day22-demo-api-abc123-xxxxx",
  "version": "1.0.0"
}
```

**✅ Health check works without authentication!**

### Test 2: Protected Endpoints (Authentication Required)

**Test Without Authentication (Should Fail):**

```bash
curl http://$TRAEFIK_IP/api/info
```

**Expected Response:**
```
401 Unauthorized
```

**✅ Authentication required! This is CORRECT!**

**Test With Wrong Credentials (Should Fail):**

```bash
curl -u wronguser:wrongpass http://$TRAEFIK_IP/api/info
```

**Expected Response:**
```
401 Unauthorized
```

**✅ Wrong credentials rejected! This is CORRECT!**

**Test With Correct Credentials (Should Work):**

```bash
curl -u admin:secure123 http://$TRAEFIK_IP/api/info
```

**Expected Response:**
```json
{
  "api_name": "Day 22 Demo API",
  "version": "1.0.0",
  "environment": "production",
  "hostname": "day22-demo-api-abc123-xxxxx",
  "timestamp": "2026-03-13T11:00:00.123456",
  "description": "This endpoint is protected by Traefik BasicAuth"
}
```

**✅ Authentication successful! Protected endpoint accessible!**

### Test 3: All Protected Endpoints

**Test Users Endpoint:**

```bash
curl -u admin:secure123 http://$TRAEFIK_IP/api/users
```

**Expected Response:**
```json
{
  "total": 3,
  "users": [
    {"id": 1, "name": "John Doe", "email": "john@example.com", "role": "admin"},
    {"id": 2, "name": "Jane Smith", "email": "jane@example.com", "role": "user"},
    {"id": 3, "name": "Bob Johnson", "email": "bob@example.com", "role": "user"}
  ],
  "served_by": "day22-demo-api-abc123-xxxxx"
}
```

**✅ Users endpoint works with auth!**

**Test Products Endpoint:**

```bash
curl -u admin:secure123 http://$TRAEFIK_IP/api/products
```

**Expected Response:**
```json
{
  "total": 4,
  "products": [
    {"id": 1, "name": "Laptop", "price": 1200, "stock": 15},
    {"id": 2, "name": "Mouse", "price": 25, "stock": 100},
    {"id": 3, "name": "Keyboard", "price": 75, "stock": 50},
    {"id": 4, "name": "Monitor", "price": 300, "stock": 30}
  ],
  "served_by": "day22-demo-api-abc123-yyyyy"
}
```

**✅ Products endpoint works with auth!**

**Test Stats Endpoint:**

```bash
curl -u admin:secure123 http://$TRAEFIK_IP/api/stats
```

**Expected Response:**
```json
{
  "total_endpoints": 6,
  "protected_endpoints": 4,
  "public_endpoints": 2,
  "uptime": "Available",
  "hostname": "day22-demo-api-abc123-zzzzz",
  "timestamp": "2026-03-13T11:00:00.123456"
}
```

**✅ Stats endpoint works with auth!**

### Test 4: Load Balancing Verification

**Test Multiple Requests:**

```bash
echo "Testing load balancing across pods..."
for i in {1..10}; do
  echo "Request $i:"
  curl -s -u admin:secure123 http://$TRAEFIK_IP/api/info | jq -r '.hostname'
done
```

**Expected Output:**
```
Request 1:
day22-demo-api-abc123-xxxxx
Request 2:
day22-demo-api-abc123-yyyyy
Request 3:
day22-demo-api-abc123-zzzzz
Request 4:
day22-demo-api-abc123-xxxxx
...
```

**✅ Requests distributed across all 3 pods!**

### Test 5: Browser Testing

**Open in Browser:**

1. **Public Endpoint:** `http://<TRAEFIK_IP>/`
   - Should display JSON response immediately
   - No authentication prompt

2. **Protected Endpoint:** `http://<TRAEFIK_IP>/api/users`
   - Browser shows authentication dialog
   - Enter username: `admin`
   - Enter password: `secure123`
   - Should display JSON response

**✅ Browser authentication works!**

### Test 6: Response Time Testing

```bash
# Test response time
time curl -s -u admin:secure123 http://$TRAEFIK_IP/api/users > /dev/null
```

**Expected Result:**
```
real    0m0.150s
user    0m0.010s
sys     0m0.005s
```

**✅ Response time < 200ms (good performance)**

### Test 7: Concurrent Requests

```bash
# Test concurrent requests
for i in {1..20}; do
  curl -s -u admin:secure123 http://$TRAEFIK_IP/api/users &
done
wait
echo "All requests completed"
```

**Expected Result:**
```
✅ All 20 requests succeed
✅ No errors
✅ Load distributed across pods
```

### Test 8: Invalid Path Testing

```bash
# Test non-existent path
curl http://$TRAEFIK_IP/nonexistent
```

**Expected Response:**
```
404 page not found
```

**✅ Proper 404 handling**

### Test 9: Health Check from External Monitoring

```bash
# Simulate monitoring tool
while true; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://$TRAEFIK_IP/health)
  echo "$(date): Health check status: $STATUS"
  sleep 5
done
```

**Expected Output:**
```
Thu Mar 13 11:00:00 2026: Health check status: 200
Thu Mar 13 11:00:05 2026: Health check status: 200
Thu Mar 13 11:00:10 2026: Health check status: 200
```

**✅ Continuous health monitoring works!**

### Test 10: Pod Failure Resilience

```bash
# Delete one pod
kubectl delete pod -n day22-app -l app=day22-demo-api | head -1

# Immediately test endpoint
curl -u admin:secure123 http://$TRAEFIK_IP/api/users
```

**Expected Result:**
```
✅ Request still succeeds
✅ Routed to healthy pods
✅ No downtime
✅ New pod automatically created
```


### Complete Verification Checklist

**Infrastructure:**
- ✅ ACR created and accessible
- ✅ Docker image built and pushed
- ✅ AKS cluster running with 2 nodes
- ✅ AKS-ACR integration working
- ✅ Traefik installed with public IP

**Application:**
- ✅ 3 application pods running
- ✅ Service created (ClusterIP)
- ✅ Health probes working
- ✅ Load balancing across pods
- ✅ Resource limits configured

**Security:**
- ✅ BasicAuth secret created
- ✅ Middleware configured
- ✅ Public endpoints accessible without auth
- ✅ Protected endpoints require auth
- ✅ Wrong credentials rejected
- ✅ Correct credentials accepted

**Networking:**
- ✅ Traefik has public IP
- ✅ Ingress rules configured
- ✅ Public access working
- ✅ Backend remains private (ClusterIP)
- ✅ Load balancer distributing traffic

**Functionality:**
- ✅ All endpoints responding correctly
- ✅ JSON responses valid
- ✅ Hostname shows different pods
- ✅ Health checks passing
- ✅ No errors in logs

---

## Troubleshooting

### Issue 1: Traefik External IP Stuck in Pending

**Symptom:**
```bash
kubectl get svc -n traefik
NAME      TYPE           CLUSTER-IP     EXTERNAL-IP   PORT(S)
traefik   LoadBalancer   10.0.123.45    <pending>     80:30080/TCP
```

**Solution:**
```bash
# Check Azure Load Balancer provisioning
az network lb list --resource-group MC_rg-day22-aks_aks-day22-cluster_eastus --output table

# Wait 5-10 minutes for Azure to provision
# If still pending after 10 minutes, check AKS events:
kubectl get events -n traefik --sort-by='.lastTimestamp'
```

### Issue 2: 401 Unauthorized on Public Endpoints

**Symptom:**
```bash
curl http://$TRAEFIK_IP/
# Returns: 401 Unauthorized
```

**Solution:**
Check ingress priority and middleware:
```bash
# Verify public ingress has NO middleware
kubectl get ingress day22-demo-api-public -n day22-app -o yaml | grep middleware

# Should return nothing. If it shows middleware, edit:
kubectl edit ingress day22-demo-api-public -n day22-app
# Remove middleware annotation
```

### Issue 3: Pods Not Starting

**Symptom:**
```bash
kubectl get pods -n day22-app
NAME                              READY   STATUS             RESTARTS   AGE
day22-demo-api-abc123-xxxxx       0/1     ImagePullBackOff   0          2m
```

**Solution:**
```bash
# Check pod events
kubectl describe pod -n day22-app -l app=day22-demo-api

# Common causes:
# 1. ACR integration issue
az aks check-acr --resource-group rg-day22-aks --name aks-day22-cluster --acr acrday22demo.azurecr.io

# 2. Wrong image name
kubectl get deployment day22-demo-api -n day22-app -o yaml | grep image:

# 3. Image doesn't exist in ACR
az acr repository show-tags --name acrday22demo --repository day22-demo-api
```

### Issue 4: Authentication Not Working

**Symptom:**
```bash
curl -u admin:secure123 http://$TRAEFIK_IP/api/users
# Returns: 401 Unauthorized
```

**Solution:**
```bash
# 1. Verify secret exists
kubectl get secret traefik-basic-auth -n day22-app

# 2. Check secret content
kubectl get secret traefik-basic-auth -n day22-app -o yaml

# 3. Regenerate password hash
htpasswd -nb admin secure123

# 4. Update secret
kubectl delete secret traefik-basic-auth -n day22-app
kubectl apply -f auth-secret.yaml

# 5. Restart Traefik
kubectl rollout restart deployment traefik -n traefik
```

### Issue 5: 404 Not Found on All Endpoints

**Symptom:**
```bash
curl http://$TRAEFIK_IP/
# Returns: 404 page not found
```

**Solution:**
```bash
# Check ingress resources
kubectl get ingress -n day22-app

# Check ingress details
kubectl describe ingress -n day22-app

# Verify service exists
kubectl get svc day22-demo-api -n day22-app

# Check Traefik logs
kubectl logs -n traefik -l app.kubernetes.io/name=traefik --tail=50
```

### Issue 6: Slow Response Times

**Symptom:**
Response time > 1 second

**Solution:**
```bash
# Check pod resources
kubectl top pods -n day22-app

# Check node resources
kubectl top nodes

# Increase replicas if needed
kubectl scale deployment day22-demo-api -n day22-app --replicas=5

# Increase resource limits
kubectl edit deployment day22-demo-api -n day22-app
# Increase CPU and memory limits
```

### Issue 7: Health Checks Failing

**Symptom:**
```bash
kubectl get pods -n day22-app
NAME                              READY   STATUS    RESTARTS   AGE
day22-demo-api-abc123-xxxxx       0/1     Running   5          5m
```

**Solution:**
```bash
# Check pod logs
kubectl logs -n day22-app day22-demo-api-abc123-xxxxx

# Test health endpoint directly
kubectl exec -n day22-app day22-demo-api-abc123-xxxxx -- curl localhost:5000/health

# Adjust probe timings if needed
kubectl edit deployment day22-demo-api -n day22-app
# Increase initialDelaySeconds
```

### Common Commands for Debugging

```bash
# View all resources
kubectl get all -n day22-app

# Check pod logs
kubectl logs -n day22-app -l app=day22-demo-api --tail=50

# Check events
kubectl get events -n day22-app --sort-by='.lastTimestamp'

# Describe pod
kubectl describe pod -n day22-app -l app=day22-demo-api

# Execute command in pod
kubectl exec -it -n day22-app <pod-name> -- /bin/sh

# Port forward for testing
kubectl port-forward -n day22-app svc/day22-demo-api 8080:80

# Check Traefik configuration
kubectl get ingressroute,middleware -n day22-app

# View Traefik logs
kubectl logs -n traefik -l app.kubernetes.io/name=traefik -f
```

---

## Summary

### What We Built

**Complete Production-Ready Setup:**

1. **Application:**
   - Flask REST API with 6 endpoints
   - Dockerized and pushed to ACR
   - Deployed on AKS with 3 replicas
   - Health checks and resource limits

2. **Infrastructure:**
   - Azure Container Registry (ACR)
   - AKS cluster with 2 nodes
   - Traefik ingress controller
   - Azure Load Balancer with public IP

3. **Security:**
   - Backend service private (ClusterIP)
   - Public endpoints accessible without auth
   - Protected endpoints require BasicAuth
   - Credentials stored in Kubernetes secret

4. **Networking:**
   - Single public entry point (Traefik)
   - Path-based routing (/, /health, /api/*)
   - Load balancing across pods
   - High availability (3 replicas)

### Architecture Benefits

**Security:**
- ✅ Backend not directly exposed
- ✅ Authentication at ingress level
- ✅ Selective protection (public + protected endpoints)
- ✅ Credentials managed securely

**Scalability:**
- ✅ Horizontal pod autoscaling ready
- ✅ Load balancing built-in
- ✅ Multiple replicas for high availability
- ✅ Easy to add more nodes

**Maintainability:**
- ✅ Infrastructure as code (YAML)
- ✅ Easy to update (kubectl apply)
- ✅ Version tracking (container tags)
- ✅ Health monitoring built-in

**Cost Optimization:**
- ✅ Shared load balancer (one public IP)
- ✅ Efficient resource usage
- ✅ Auto-scaling capabilities
- ✅ Pay only for what you use

### Real-World Applications

**This Pattern Works For:**

1. **Microservices API Gateway**
   - Multiple backend services
   - Single entry point
   - Centralized authentication

2. **SaaS Applications**
   - Public landing page
   - Protected API endpoints
   - User authentication

3. **Mobile App Backend**
   - Public health checks
   - Protected user data APIs
   - Token-based auth (can extend)

4. **Internal Tools**
   - Protected admin interfaces
   - Public status pages
   - Team access control

### Next Steps

**Enhancements You Can Add:**

1. **HTTPS/TLS:**
   - Add cert-manager
   - Configure Let's Encrypt
   - Enable HTTPS on Traefik

2. **Advanced Authentication:**
   - JWT tokens instead of BasicAuth
   - OAuth2/OIDC integration
   - Azure AD authentication

3. **Monitoring:**
   - Prometheus metrics
   - Grafana dashboards
   - Application Insights

4. **Rate Limiting:**
   - Traefik rate limit middleware
   - Per-user quotas
   - DDoS protection

5. **CI/CD:**
   - Azure DevOps pipeline
   - GitHub Actions
   - Automated deployments

6. **Database:**
   - Azure Database for PostgreSQL
   - Connection from pods
   - Secret management

---

## Cleanup (Optional)

**To avoid charges, delete all resources:**

### Delete AKS Resources

```bash
# Delete application
kubectl delete namespace day22-app

# Delete Traefik
helm uninstall traefik -n traefik
kubectl delete namespace traefik
```

### Delete Azure Resources

```bash
# Delete AKS cluster
az aks delete --resource-group rg-day22-aks --name aks-day22-cluster --yes --no-wait

# Delete ACR
az acr delete --resource-group rg-day22-aks --name acrday22demo --yes

# Delete resource group
az group delete --name rg-day22-aks --yes --no-wait
```

**⏱️ Wait**: 10-15 minutes

**✅ Result**: All resources deleted!

---

## Quick Reference

### Useful Commands

```bash
# Get Traefik IP
kubectl get svc traefik -n traefik -o jsonpath='{.status.loadBalancer.ingress[0].ip}'

# Test public endpoint
curl http://<TRAEFIK_IP>/

# Test protected endpoint
curl -u admin:secure123 http://<TRAEFIK_IP>/api/users

# Scale application
kubectl scale deployment day22-demo-api -n day22-app --replicas=5

# Update image
kubectl set image deployment/day22-demo-api -n day22-app api=acrday22demo.azurecr.io/day22-demo-api:2.0.0

# View logs
kubectl logs -n day22-app -l app=day22-demo-api -f

# Restart deployment
kubectl rollout restart deployment day22-demo-api -n day22-app
```

### Credentials

- **ACR**: Check Azure Portal → Access keys
- **BasicAuth**: admin / secure123
- **AKS**: Managed by Azure AD

### Endpoints

- **Public**: `http://<TRAEFIK_IP>/` and `/health`
- **Protected**: `http://<TRAEFIK_IP>/api/*`

---

**🎉 Congratulations!** You've deployed a production-ready application on AKS with Traefik ingress and authentication!

