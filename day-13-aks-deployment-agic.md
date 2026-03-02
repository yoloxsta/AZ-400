# Day 13: AKS Deployment with AGIC & Public API Exposure

## What is AKS and AGIC?

**Azure Kubernetes Service (AKS)**: Managed Kubernetes service that simplifies deploying and managing containerized applications.

**Application Gateway Ingress Controller (AGIC)**: Kubernetes ingress controller that uses Azure Application Gateway as the ingress for AKS clusters.

## Why Use AKS with AGIC?

- **Managed Kubernetes**: Azure handles control plane
- **Enterprise Security**: WAF, SSL termination, DDoS protection
- **Scalability**: Auto-scaling for pods and nodes
- **Cost Optimization**: Pay only for worker nodes
- **Integration**: Native Azure services integration
- **AGIC Benefits**: Layer 7 load balancing, SSL offloading, URL-based routing

## Architecture Overview

### Internal API (AGIC)
```
Mobile App → Internet → Azure Application Gateway (Public IP)
                              ↓
                        AGIC (Ingress Controller)
                              ↓
                        AKS Cluster (Private)
                              ↓
                        Hello World API Service
```

### Complete Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Internet / Public                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTPS (443)
                         ↓
┌─────────────────────────────────────────────────────────────┐
│              Azure Application Gateway                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Public IP: 20.x.x.x                                 │  │
│  │  WAF: Enabled                                        │  │
│  │  SSL Certificate: *.yourdomain.com                   │  │
│  │  Backend Pool: AKS Internal IPs                      │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP (Internal)
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    Azure Virtual Network                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              AKS Cluster (Private)                   │  │
│  │  ┌────────────────────────────────────────────────┐ │  │
│  │  │  AGIC (Ingress Controller)                     │ │  │
│  │  │  - Watches Ingress resources                   │ │  │
│  │  │  - Configures App Gateway                      │ │  │
│  │  └────────────────────────────────────────────────┘ │  │
│  │                                                       │  │
│  │  ┌────────────────────────────────────────────────┐ │  │
│  │  │  Kubernetes Services                           │ │  │
│  │  │  ┌──────────────┐  ┌──────────────┐          │ │  │
│  │  │  │ hello-world  │  │   api-v2     │          │ │  │
│  │  │  │   Service    │  │   Service    │          │ │  │
│  │  │  └──────┬───────┘  └──────┬───────┘          │ │  │
│  │  │         │                  │                   │ │  │
│  │  │  ┌──────▼───────┐  ┌──────▼───────┐          │ │  │
│  │  │  │   Pod 1      │  │   Pod 1      │          │ │  │
│  │  │  │   Pod 2      │  │   Pod 2      │          │ │  │
│  │  │  │   Pod 3      │  │   Pod 3      │          │ │  │
│  │  │  └──────────────┘  └──────────────┘          │ │  │
│  │  └────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Public API Exposure Methods Comparison

| Method | Security | Cost | Complexity | Best For |
|--------|----------|------|------------|----------|
| **AGIC + Public IP** | ⭐⭐⭐⭐⭐ | $$$ | Medium | Production APIs |
| **API Management** | ⭐⭐⭐⭐⭐ | $$$$ | High | Enterprise APIs |
| **Load Balancer** | ⭐⭐⭐ | $$ | Low | Simple apps |
| **Ingress + Public IP** | ⭐⭐⭐ | $ | Low | Dev/Test |

### Recommended: AGIC + Application Gateway (Public)

**Why this is best:**
- ✅ WAF protection (SQL injection, XSS)
- ✅ SSL termination at gateway
- ✅ DDoS protection
- ✅ Rate limiting
- ✅ URL-based routing
- ✅ Health probes
- ✅ Auto-scaling
- ✅ Azure-native integration

## Lab 13: Deploy Hello World API to AKS with AGIC

### Prerequisites

```bash
# Install Azure CLI
az --version

# Install kubectl
kubectl version --client

# Install Helm
helm version

# Login to Azure
az login
az account set --subscription "your-subscription-id"
```


### Part 1: Create Hello World Application

1. **Create Application Directory**
   ```bash
   mkdir aks-hello-world
   cd aks-hello-world
   ```

2. **Create `app.js`**
   ```javascript
   const express = require('express');
   const app = express();
   const PORT = process.env.PORT || 3000;
   const VERSION = process.env.VERSION || '1.0.0';
   
   // Middleware
   app.use(express.json());
   
   // CORS for mobile apps
   app.use((req, res, next) => {
     res.header('Access-Control-Allow-Origin', '*');
     res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
     res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
     next();
   });
   
   // Logging middleware
   app.use((req, res, next) => {
     console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
     next();
   });
   
   // Routes
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
   
   // Mobile-specific endpoint
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
   
   // Error handling
   app.use((err, req, res, next) => {
     console.error(err.stack);
     res.status(500).json({
       error: 'Something went wrong!',
       message: err.message
     });
   });
   
   app.listen(PORT, () => {
     console.log(`Server running on port ${PORT}`);
     console.log(`Version: ${VERSION}`);
   });
   ```

3. **Create `package.json`**
   ```json
   {
     "name": "aks-hello-world",
     "version": "1.0.0",
     "description": "Hello World API for AKS",
     "main": "app.js",
     "scripts": {
       "start": "node app.js",
       "test": "echo \"No tests yet\" && exit 0"
     },
     "dependencies": {
       "express": "^4.18.2"
     },
     "engines": {
       "node": ">=18.0.0"
     }
   }
   ```

4. **Create `Dockerfile`**
   ```dockerfile
   FROM node:18-alpine
   
   # Create app directory
   WORKDIR /usr/src/app
   
   # Copy package files
   COPY package*.json ./
   
   # Install dependencies
   RUN npm ci --only=production
   
   # Copy app source
   COPY app.js .
   
   # Expose port
   EXPOSE 3000
   
   # Health check
   HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
     CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
   
   # Run app
   CMD [ "node", "app.js" ]
   ```

5. **Create `.dockerignore`**
   ```
   node_modules
   npm-debug.log
   .git
   .gitignore
   README.md
   .env
   ```

### Part 2: Build and Push Docker Image

1. **Create Azure Container Registry**
   ```bash
   # Variables
   RESOURCE_GROUP="rg-aks-demo"
   LOCATION="eastus"
   ACR_NAME="acraksdemo$(date +%s)"  # Must be globally unique
   
   # Create resource group
   az group create \
     --name $RESOURCE_GROUP \
     --location $LOCATION
   
   # Create ACR
   az acr create \
     --resource-group $RESOURCE_GROUP \
     --name $ACR_NAME \
     --sku Standard \
     --location $LOCATION
   
   # Get ACR login server
   ACR_LOGIN_SERVER=$(az acr show \
     --name $ACR_NAME \
     --query loginServer \
     --output tsv)
   
   echo "ACR Login Server: $ACR_LOGIN_SERVER"
   ```

2. **Build and Push Image**
   ```bash
   # Login to ACR
   az acr login --name $ACR_NAME
   
   # Build image
   docker build -t hello-world:v1 .
   
   # Tag image
   docker tag hello-world:v1 $ACR_LOGIN_SERVER/hello-world:v1
   docker tag hello-world:v1 $ACR_LOGIN_SERVER/hello-world:latest
   
   # Push image
   docker push $ACR_LOGIN_SERVER/hello-world:v1
   docker push $ACR_LOGIN_SERVER/hello-world:latest
   
   # Verify
   az acr repository list --name $ACR_NAME --output table
   az acr repository show-tags --name $ACR_NAME --repository hello-world --output table
   ```

### Part 3: Create AKS Cluster with AGIC

1. **Create Virtual Network**
   ```bash
   # Variables
   VNET_NAME="vnet-aks"
   VNET_ADDRESS_PREFIX="10.0.0.0/16"
   AKS_SUBNET_NAME="subnet-aks"
   AKS_SUBNET_PREFIX="10.0.1.0/24"
   APPGW_SUBNET_NAME="subnet-appgw"
   APPGW_SUBNET_PREFIX="10.0.2.0/24"
   
   # Create VNet
   az network vnet create \
     --resource-group $RESOURCE_GROUP \
     --name $VNET_NAME \
     --address-prefixes $VNET_ADDRESS_PREFIX \
     --subnet-name $AKS_SUBNET_NAME \
     --subnet-prefix $AKS_SUBNET_PREFIX
   
   # Create Application Gateway subnet
   az network vnet subnet create \
     --resource-group $RESOURCE_GROUP \
     --vnet-name $VNET_NAME \
     --name $APPGW_SUBNET_NAME \
     --address-prefixes $APPGW_SUBNET_PREFIX
   
   # Get subnet IDs
   AKS_SUBNET_ID=$(az network vnet subnet show \
     --resource-group $RESOURCE_GROUP \
     --vnet-name $VNET_NAME \
     --name $AKS_SUBNET_NAME \
     --query id -o tsv)
   
   APPGW_SUBNET_ID=$(az network vnet subnet show \
     --resource-group $RESOURCE_GROUP \
     --vnet-name $VNET_NAME \
     --name $APPGW_SUBNET_NAME \
     --query id -o tsv)
   ```

2. **Create Application Gateway**
   ```bash
   # Variables
   APPGW_NAME="appgw-aks"
   PUBLIC_IP_NAME="pip-appgw"
   
   # Create public IP
   az network public-ip create \
     --resource-group $RESOURCE_GROUP \
     --name $PUBLIC_IP_NAME \
     --allocation-method Static \
     --sku Standard
   
   # Create Application Gateway
   az network application-gateway create \
     --name $APPGW_NAME \
     --resource-group $RESOURCE_GROUP \
     --location $LOCATION \
     --sku Standard_v2 \
     --capacity 2 \
     --vnet-name $VNET_NAME \
     --subnet $APPGW_SUBNET_NAME \
     --public-ip-address $PUBLIC_IP_NAME \
     --http-settings-cookie-based-affinity Disabled \
     --frontend-port 80 \
     --http-settings-port 80 \
     --http-settings-protocol Http
   
   # Get Application Gateway ID
   APPGW_ID=$(az network application-gateway show \
     --name $APPGW_NAME \
     --resource-group $RESOURCE_GROUP \
     --query id -o tsv)
   
   # Get Public IP
   PUBLIC_IP=$(az network public-ip show \
     --resource-group $RESOURCE_GROUP \
     --name $PUBLIC_IP_NAME \
     --query ipAddress -o tsv)
   
   echo "Application Gateway Public IP: $PUBLIC_IP"
   ```

3. **Create AKS Cluster with AGIC**
   ```bash
   # Variables
   AKS_NAME="aks-demo"
   
   # Create AKS cluster
   az aks create \
     --resource-group $RESOURCE_GROUP \
     --name $AKS_NAME \
     --location $LOCATION \
     --network-plugin azure \
     --vnet-subnet-id $AKS_SUBNET_ID \
     --enable-managed-identity \
     --node-count 2 \
     --node-vm-size Standard_DS2_v2 \
     --enable-addons ingress-appgw \
     --appgw-id $APPGW_ID \
     --attach-acr $ACR_NAME \
     --generate-ssh-keys
   
   # Get credentials
   az aks get-credentials \
     --resource-group $RESOURCE_GROUP \
     --name $AKS_NAME \
     --overwrite-existing
   
   # Verify connection
   kubectl get nodes
   kubectl get pods -n kube-system | grep ingress
   ```

### Part 4: Deploy Application to AKS

1. **Create Kubernetes Manifests Directory**
   ```bash
   mkdir k8s
   cd k8s
   ```

2. **Create `deployment.yaml`**
   ```yaml
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
           image: <ACR_LOGIN_SERVER>/hello-world:v1
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
             timeoutSeconds: 3
             failureThreshold: 3
           readinessProbe:
             httpGet:
               path: /api/ready
               port: 3000
             initialDelaySeconds: 5
             periodSeconds: 5
             timeoutSeconds: 3
             failureThreshold: 3
   ```

3. **Create `service.yaml`**
   ```yaml
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
   ```

4. **Create `ingress.yaml` (Internal - AGIC)**
   ```yaml
   apiVersion: networking.k8s.io/v1
   kind: Ingress
   metadata:
     name: hello-world-ingress
     annotations:
       kubernetes.io/ingress.class: azure/application-gateway
       appgw.ingress.kubernetes.io/backend-path-prefix: "/"
       appgw.ingress.kubernetes.io/ssl-redirect: "false"
       appgw.ingress.kubernetes.io/connection-draining: "true"
       appgw.ingress.kubernetes.io/connection-draining-timeout: "30"
       appgw.ingress.kubernetes.io/request-timeout: "30"
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
   ```

5. **Deploy to AKS**
   ```bash
   # Update deployment.yaml with your ACR login server
   sed -i "s|<ACR_LOGIN_SERVER>|$ACR_LOGIN_SERVER|g" deployment.yaml
   
   # Apply manifests
   kubectl apply -f deployment.yaml
   kubectl apply -f service.yaml
   kubectl apply -f ingress.yaml
   
   # Verify deployment
   kubectl get deployments
   kubectl get pods
   kubectl get services
   kubectl get ingress
   
   # Check pod logs
   kubectl logs -l app=hello-world --tail=50
   
   # Wait for ingress to get IP
   kubectl get ingress hello-world-ingress --watch
   ```

6. **Test Internal Access**
   ```bash
   # Get Application Gateway Public IP
   echo "Public IP: $PUBLIC_IP"
   
   # Test endpoints
   curl http://$PUBLIC_IP/
   curl http://$PUBLIC_IP/api/hello?name=Mobile
   curl http://$PUBLIC_IP/api/health
   
   # Test from mobile simulation
   curl -X POST http://$PUBLIC_IP/api/mobile/data \
     -H "Content-Type: application/json" \
     -d '{
       "deviceId": "device-123",
       "platform": "iOS",
       "data": {"key": "value"}
     }'
   ```

### Part 5: Expose API Publicly for Mobile Apps

Now we'll configure the Application Gateway to be accessible from the internet with proper security.

1. **Enable WAF on Application Gateway**
   ```bash
   # Upgrade to WAF SKU
   az network application-gateway waf-config set \
     --resource-group $RESOURCE_GROUP \
     --gateway-name $APPGW_NAME \
     --enabled true \
     --firewall-mode Prevention \
     --rule-set-type OWASP \
     --rule-set-version 3.2
   
   echo "WAF enabled on Application Gateway"
   ```

2. **Configure SSL Certificate (Production)**
   ```bash
   # Option 1: Use Azure Key Vault certificate
   # First, upload your SSL certificate to Key Vault
   
   KEYVAULT_NAME="kv-aks-demo"
   CERT_NAME="api-cert"
   
   # Create Key Vault
   az keyvault create \
     --name $KEYVAULT_NAME \
     --resource-group $RESOURCE_GROUP \
     --location $LOCATION
   
   # Import certificate (you need a .pfx file)
   # az keyvault certificate import \
   #   --vault-name $KEYVAULT_NAME \
   #   --name $CERT_NAME \
   #   --file /path/to/certificate.pfx \
   #   --password "cert-password"
   
   # Option 2: Use self-signed certificate (for testing)
   openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
     -keyout api-key.key \
     -out api-cert.crt \
     -subj "/CN=api.yourdomain.com/O=YourOrg"
   
   openssl pkcs12 -export \
     -out api-cert.pfx \
     -inkey api-key.key \
     -in api-cert.crt \
     -password pass:YourPassword123
   
   # Add SSL certificate to Application Gateway
   az network application-gateway ssl-cert create \
     --resource-group $RESOURCE_GROUP \
     --gateway-name $APPGW_NAME \
     --name api-ssl-cert \
     --cert-file api-cert.pfx \
     --cert-password "YourPassword123"
   ```

3. **Update Ingress for HTTPS**
   ```yaml
   # Create file: k8s/ingress-public.yaml
   apiVersion: networking.k8s.io/v1
   kind: Ingress
   metadata:
     name: hello-world-public
     annotations:
       kubernetes.io/ingress.class: azure/application-gateway
       appgw.ingress.kubernetes.io/ssl-redirect: "true"
       appgw.ingress.kubernetes.io/backend-protocol: "http"
       appgw.ingress.kubernetes.io/appgw-ssl-certificate: "api-ssl-cert"
       appgw.ingress.kubernetes.io/connection-draining: "true"
       appgw.ingress.kubernetes.io/connection-draining-timeout: "30"
       appgw.ingress.kubernetes.io/request-timeout: "30"
       # Rate limiting
       appgw.ingress.kubernetes.io/waf-policy-for-path: "/subscriptions/.../wafPolicies/api-waf-policy"
   spec:
     tls:
     - hosts:
       - api.yourdomain.com
       secretName: api-tls-secret
     rules:
     - host: api.yourdomain.com
       http:
         paths:
         - path: /api/*
           pathType: Prefix
           backend:
             service:
               name: hello-world
               port:
                 number: 80
   ```

4. **Apply Public Ingress**
   ```bash
   kubectl apply -f k8s/ingress-public.yaml
   
   # Verify
   kubectl get ingress hello-world-public
   kubectl describe ingress hello-world-public
   ```


### Part 6: Security Configuration for Mobile Access

1. **Create API Key Authentication**
   ```javascript
   // Update app.js with API key middleware
   
   const API_KEYS = process.env.API_KEYS ? 
     process.env.API_KEYS.split(',') : 
     ['demo-key-123', 'mobile-key-456'];
   
   // API Key middleware
   function apiKeyAuth(req, res, next) {
     const apiKey = req.headers['x-api-key'];
     
     if (!apiKey) {
       return res.status(401).json({ 
         error: 'API key required',
         message: 'Please provide X-API-Key header'
       });
     }
     
     if (!API_KEYS.includes(apiKey)) {
       return res.status(403).json({ 
         error: 'Invalid API key',
         message: 'The provided API key is not valid'
       });
     }
     
     next();
   }
   
   // Apply to mobile endpoints
   app.use('/api/mobile/*', apiKeyAuth);
   ```

2. **Create Kubernetes Secret for API Keys**
   ```bash
   # Create secret
   kubectl create secret generic api-keys \
     --from-literal=API_KEYS="mobile-ios-key-789,mobile-android-key-012"
   
   # Update deployment to use secret
   cat <<EOF > k8s/deployment-with-secrets.yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: hello-world
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
           image: $ACR_LOGIN_SERVER/hello-world:v1
           ports:
           - containerPort: 3000
           env:
           - name: VERSION
             value: "1.0.0"
           - name: API_KEYS
             valueFrom:
               secretKeyRef:
                 name: api-keys
                 key: API_KEYS
           resources:
             requests:
               memory: "128Mi"
               cpu: "100m"
             limits:
               memory: "256Mi"
               cpu: "200m"
   EOF
   
   kubectl apply -f k8s/deployment-with-secrets.yaml
   ```

3. **Configure Rate Limiting**
   ```yaml
   # Create file: k8s/rate-limit-policy.yaml
   apiVersion: v1
   kind: ConfigMap
   metadata:
     name: rate-limit-config
   data:
     nginx.conf: |
       limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
       limit_req zone=api_limit burst=20 nodelay;
   ```

4. **Setup CORS for Mobile Apps**
   ```javascript
   // Enhanced CORS configuration in app.js
   
   const cors = require('cors');
   
   const corsOptions = {
     origin: function (origin, callback) {
       // Allow requests with no origin (mobile apps, Postman)
       if (!origin) return callback(null, true);
       
       // Whitelist of allowed origins
       const allowedOrigins = [
         'https://yourmobileapp.com',
         'capacitor://localhost',  // Capacitor apps
         'ionic://localhost',      // Ionic apps
         'http://localhost:8100'   // Local development
       ];
       
       if (allowedOrigins.indexOf(origin) !== -1) {
         callback(null, true);
       } else {
         callback(new Error('Not allowed by CORS'));
       }
     },
     credentials: true,
     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
   };
   
   app.use(cors(corsOptions));
   ```

### Part 7: DNS Configuration

1. **Create DNS Record**
   ```bash
   # If using Azure DNS
   DNS_ZONE="yourdomain.com"
   DNS_RECORD="api"
   
   # Create A record pointing to Application Gateway public IP
   az network dns record-set a add-record \
     --resource-group $RESOURCE_GROUP \
     --zone-name $DNS_ZONE \
     --record-set-name $DNS_RECORD \
     --ipv4-address $PUBLIC_IP
   
   # Verify
   nslookup api.yourdomain.com
   ```

2. **Update Ingress with Custom Domain**
   ```yaml
   # Update k8s/ingress-public.yaml
   apiVersion: networking.k8s.io/v1
   kind: Ingress
   metadata:
     name: hello-world-public
     annotations:
       kubernetes.io/ingress.class: azure/application-gateway
       appgw.ingress.kubernetes.io/ssl-redirect: "true"
       cert-manager.io/cluster-issuer: "letsencrypt-prod"
   spec:
     tls:
     - hosts:
       - api.yourdomain.com
       secretName: api-tls-secret
     rules:
     - host: api.yourdomain.com
       http:
         paths:
         - path: /api/*
           pathType: Prefix
           backend:
             service:
               name: hello-world
               port:
                 number: 80
   ```

### Part 8: Monitoring and Logging

1. **Enable Application Insights**
   ```bash
   # Create Application Insights
   APPINSIGHTS_NAME="appi-aks-demo"
   
   az monitor app-insights component create \
     --app $APPINSIGHTS_NAME \
     --location $LOCATION \
     --resource-group $RESOURCE_GROUP \
     --application-type web
   
   # Get instrumentation key
   INSTRUMENTATION_KEY=$(az monitor app-insights component show \
     --app $APPINSIGHTS_NAME \
     --resource-group $RESOURCE_GROUP \
     --query instrumentationKey -o tsv)
   
   echo "Instrumentation Key: $INSTRUMENTATION_KEY"
   ```

2. **Update Application with App Insights**
   ```javascript
   // Add to app.js
   const appInsights = require('applicationinsights');
   
   if (process.env.APPINSIGHTS_INSTRUMENTATIONKEY) {
     appInsights.setup(process.env.APPINSIGHTS_INSTRUMENTATIONKEY)
       .setAutoDependencyCorrelation(true)
       .setAutoCollectRequests(true)
       .setAutoCollectPerformance(true)
       .setAutoCollectExceptions(true)
       .setAutoCollectDependencies(true)
       .setAutoCollectConsole(true)
       .setUseDiskRetryCaching(true)
       .start();
     
     console.log('Application Insights enabled');
   }
   ```

3. **Create Kubernetes Secret for App Insights**
   ```bash
   kubectl create secret generic appinsights \
     --from-literal=APPINSIGHTS_INSTRUMENTATIONKEY=$INSTRUMENTATION_KEY
   
   # Update deployment
   # Add to env section:
   # - name: APPINSIGHTS_INSTRUMENTATIONKEY
   #   valueFrom:
   #     secretKeyRef:
   #       name: appinsights
   #       key: APPINSIGHTS_INSTRUMENTATIONKEY
   ```

4. **Setup Log Analytics**
   ```bash
   # Enable Container Insights
   az aks enable-addons \
     --resource-group $RESOURCE_GROUP \
     --name $AKS_NAME \
     --addons monitoring
   
   # Query logs
   az monitor log-analytics query \
     --workspace <workspace-id> \
     --analytics-query "ContainerLog | where ContainerName == 'hello-world' | limit 100"
   ```

### Part 9: CI/CD Pipeline for AKS

1. **Create Azure Pipeline `azure-pipelines-aks.yml`**
   ```yaml
   trigger:
     branches:
       include:
         - main
     paths:
       include:
         - app.js
         - Dockerfile
         - k8s/*
   
   variables:
     dockerRegistryServiceConnection: 'ACR-Connection'
     imageRepository: 'hello-world'
     containerRegistry: '<your-acr>.azurecr.io'
     dockerfilePath: 'Dockerfile'
     tag: '$(Build.BuildNumber)'
     kubernetesServiceConnection: 'AKS-Connection'
     namespace: 'default'
   
   stages:
   # Build and Push Docker Image
   - stage: Build
     displayName: 'Build and Push'
     jobs:
     - job: BuildJob
       displayName: 'Build Docker Image'
       pool:
         vmImage: 'ubuntu-latest'
       steps:
       - task: Docker@2
         displayName: 'Build and Push Image'
         inputs:
           command: buildAndPush
           repository: $(imageRepository)
           dockerfile: $(dockerfilePath)
           containerRegistry: $(dockerRegistryServiceConnection)
           tags: |
             $(tag)
             latest
       
       - task: PublishPipelineArtifact@1
         inputs:
           targetPath: 'k8s'
           artifact: 'manifests'
   
   # Deploy to AKS
   - stage: Deploy
     displayName: 'Deploy to AKS'
     dependsOn: Build
     jobs:
     - deployment: DeployAKS
       displayName: 'Deploy to AKS'
       environment: 'AKS-Production'
       pool:
         vmImage: 'ubuntu-latest'
       strategy:
         runOnce:
           deploy:
             steps:
             - download: current
               artifact: manifests
             
             - task: KubernetesManifest@0
               displayName: 'Deploy to Kubernetes'
               inputs:
                 action: 'deploy'
                 kubernetesServiceConnection: $(kubernetesServiceConnection)
                 namespace: $(namespace)
                 manifests: |
                   $(Pipeline.Workspace)/manifests/deployment.yaml
                   $(Pipeline.Workspace)/manifests/service.yaml
                   $(Pipeline.Workspace)/manifests/ingress-public.yaml
                 containers: |
                   $(containerRegistry)/$(imageRepository):$(tag)
             
             - task: Kubernetes@1
               displayName: 'Verify Deployment'
               inputs:
                 connectionType: 'Kubernetes Service Connection'
                 kubernetesServiceEndpoint: $(kubernetesServiceConnection)
                 namespace: $(namespace)
                 command: 'get'
                 arguments: 'pods -l app=hello-world'
   ```

2. **Create Service Connections**
   ```bash
   # In Azure DevOps:
   # 1. Project Settings → Service connections
   # 2. New service connection → Docker Registry
   #    - Registry type: Azure Container Registry
   #    - Name: ACR-Connection
   #    - Select your ACR
   
   # 3. New service connection → Kubernetes
   #    - Authentication method: Service Account
   #    - Name: AKS-Connection
   #    - Get kubeconfig from: az aks get-credentials
   ```

### Part 10: Mobile Developer Documentation

1. **Create API Documentation `API-DOCS.md`**
   ```markdown
   # Hello World API Documentation
   
   ## Base URL
   ```
   Production: https://api.yourdomain.com
   ```
   
   ## Authentication
   All requests require an API key in the header:
   ```
   X-API-Key: your-api-key-here
   ```
   
   ## Endpoints
   
   ### GET /api/hello
   Get a hello message.
   
   **Query Parameters:**
   - `name` (optional): Name to greet
   
   **Example Request:**
   ```bash
   curl -H "X-API-Key: mobile-ios-key-789" \
     "https://api.yourdomain.com/api/hello?name=John"
   ```
   
   **Example Response:**
   ```json
   {
     "message": "Hello, John!",
     "version": "1.0.0",
     "pod": "hello-world-7d8f9c-abc123"
   }
   ```
   
   ### POST /api/mobile/data
   Submit data from mobile app.
   
   **Request Body:**
   ```json
   {
     "deviceId": "device-123",
     "platform": "iOS",
     "data": {
       "key": "value"
     }
   }
   ```
   
   **Example Request:**
   ```bash
   curl -X POST \
     -H "X-API-Key: mobile-ios-key-789" \
     -H "Content-Type: application/json" \
     -d '{"deviceId":"device-123","platform":"iOS","data":{"key":"value"}}' \
     https://api.yourdomain.com/api/mobile/data
   ```
   
   **Example Response:**
   ```json
   {
     "success": true,
     "message": "Data received",
     "deviceId": "device-123",
     "platform": "iOS",
     "processedAt": "2024-03-15T10:30:00.000Z"
   }
   ```
   
   ### GET /api/health
   Health check endpoint.
   
   **Example Response:**
   ```json
   {
     "status": "healthy",
     "uptime": 3600,
     "timestamp": "2024-03-15T10:30:00.000Z"
   }
   ```
   
   ## Rate Limits
   - 100 requests per minute per API key
   - 1000 requests per hour per API key
   
   ## Error Codes
   - `401`: Missing or invalid API key
   - `429`: Rate limit exceeded
   - `500`: Internal server error
   
   ## CORS
   The API supports CORS for the following origins:
   - `capacitor://localhost`
   - `ionic://localhost`
   - `http://localhost:8100` (development)
   
   ## Support
   For API keys or support, contact: api-support@yourdomain.com
   ```

2. **Create Mobile SDK Example (React Native)**
   ```javascript
   // api-client.js
   const API_BASE_URL = 'https://api.yourdomain.com';
   const API_KEY = 'mobile-ios-key-789'; // Store securely!
   
   class APIClient {
     constructor() {
       this.baseURL = API_BASE_URL;
       this.apiKey = API_KEY;
     }
     
     async request(endpoint, options = {}) {
       const url = `${this.baseURL}${endpoint}`;
       const headers = {
         'Content-Type': 'application/json',
         'X-API-Key': this.apiKey,
         ...options.headers
       };
       
       try {
         const response = await fetch(url, {
           ...options,
           headers
         });
         
         if (!response.ok) {
           throw new Error(`HTTP ${response.status}: ${response.statusText}`);
         }
         
         return await response.json();
       } catch (error) {
         console.error('API request failed:', error);
         throw error;
       }
     }
     
     async getHello(name) {
       return this.request(`/api/hello?name=${encodeURIComponent(name)}`);
     }
     
     async submitData(deviceId, platform, data) {
       return this.request('/api/mobile/data', {
         method: 'POST',
         body: JSON.stringify({ deviceId, platform, data })
       });
     }
     
     async checkHealth() {
       return this.request('/api/health');
     }
   }
   
   export default new APIClient();
   ```

3. **Usage Example**
   ```javascript
   // In your React Native component
   import APIClient from './api-client';
   
   async function fetchData() {
     try {
       const result = await APIClient.getHello('Mobile User');
       console.log(result.message);
       
       await APIClient.submitData(
         'device-123',
         Platform.OS,
         { action: 'app_opened' }
       );
     } catch (error) {
       console.error('Failed to fetch data:', error);
     }
   }
   ```

### Part 11: Testing and Verification

1. **Test from Command Line**
   ```bash
   # Get public IP
   PUBLIC_IP=$(az network public-ip show \
     --resource-group $RESOURCE_GROUP \
     --name $PUBLIC_IP_NAME \
     --query ipAddress -o tsv)
   
   # Test without API key (should fail)
   curl http://$PUBLIC_IP/api/mobile/data
   
   # Test with API key
   curl -H "X-API-Key: mobile-ios-key-789" \
     http://$PUBLIC_IP/api/hello?name=Test
   
   # Test POST endpoint
   curl -X POST \
     -H "X-API-Key: mobile-ios-key-789" \
     -H "Content-Type: application/json" \
     -d '{"deviceId":"test-123","platform":"iOS","data":{"test":true}}' \
     http://$PUBLIC_IP/api/mobile/data
   ```

2. **Load Testing**
   ```bash
   # Install Apache Bench
   # Ubuntu: sudo apt-get install apache2-utils
   # Mac: brew install ab
   
   # Run load test
   ab -n 1000 -c 10 \
     -H "X-API-Key: mobile-ios-key-789" \
     http://$PUBLIC_IP/api/hello?name=LoadTest
   ```

3. **Monitor Application**
   ```bash
   # Watch pods
   kubectl get pods -w
   
   # Check logs
   kubectl logs -f -l app=hello-world
   
   # Check ingress
   kubectl describe ingress hello-world-public
   
   # Check Application Gateway
   az network application-gateway show \
     --resource-group $RESOURCE_GROUP \
     --name $APPGW_NAME \
     --query "operationalState"
   ```

### Verification Checklist

- [ ] AKS cluster created and running
- [ ] Application Gateway configured with public IP
- [ ] AGIC installed and working
- [ ] Docker image built and pushed to ACR
- [ ] Application deployed to AKS
- [ ] Service created and accessible
- [ ] Ingress configured with AGIC
- [ ] SSL certificate configured
- [ ] DNS record created
- [ ] API key authentication working
- [ ] CORS configured for mobile apps
- [ ] Rate limiting enabled
- [ ] Monitoring and logging configured
- [ ] CI/CD pipeline created
- [ ] API documentation provided
- [ ] Mobile SDK example created
- [ ] Load testing completed

## Architecture Summary

### What We Built

```
Mobile App (iOS/Android)
    ↓ HTTPS
Internet
    ↓
Azure Application Gateway (Public IP)
    ├─ WAF Protection
    ├─ SSL Termination
    ├─ Rate Limiting
    └─ Health Probes
    ↓ HTTP (Internal)
AGIC (Ingress Controller)
    ↓
Kubernetes Service (ClusterIP)
    ↓
Pods (3 replicas)
    └─ Hello World API
```

### Security Layers

1. **Network**: VNet isolation, NSG rules
2. **Application Gateway**: WAF, DDoS protection
3. **Authentication**: API key validation
4. **Authorization**: Rate limiting
5. **Transport**: SSL/TLS encryption
6. **Application**: Input validation, CORS

### Why This Approach is Best

✅ **Security**: Multiple layers of protection
✅ **Scalability**: Auto-scaling at pod and node level
✅ **Reliability**: Health probes, multiple replicas
✅ **Performance**: CDN-ready, caching at gateway
✅ **Cost**: Pay only for what you use
✅ **Maintainability**: Kubernetes declarative config
✅ **Monitoring**: Built-in Azure Monitor integration

## Alternative Approaches

### Option 2: Azure API Management

```yaml
Mobile App → API Management → AKS
```

**Pros:**
- Advanced API features (throttling, caching, transformation)
- Developer portal
- API versioning
- Analytics

**Cons:**
- Higher cost
- More complex setup
- Overkill for simple APIs

### Option 3: Azure Front Door

```yaml
Mobile App → Front Door → Application Gateway → AKS
```

**Pros:**
- Global load balancing
- CDN integration
- Better for multi-region

**Cons:**
- Highest cost
- Most complex
- Unnecessary for single region

## Cost Estimation

| Resource | Monthly Cost (USD) |
|----------|-------------------|
| AKS (2 nodes) | ~$140 |
| Application Gateway | ~$125 |
| Public IP | ~$4 |
| ACR | ~$5 |
| Bandwidth | ~$20 |
| **Total** | **~$294/month** |

## Best Practices

1. **Always use HTTPS** in production
2. **Implement API key rotation** every 90 days
3. **Enable WAF** on Application Gateway
4. **Use managed identities** instead of service principals
5. **Implement rate limiting** per API key
6. **Monitor API usage** with Application Insights
7. **Set up alerts** for high error rates
8. **Use separate environments** (dev, staging, prod)
9. **Implement proper logging** for debugging
10. **Regular security scans** of container images

## Troubleshooting

### Issue: Ingress not getting IP
```bash
# Check AGIC pods
kubectl get pods -n kube-system | grep ingress

# Check AGIC logs
kubectl logs -n kube-system -l app=ingress-appgw

# Verify Application Gateway
az network application-gateway show \
  --resource-group $RESOURCE_GROUP \
  --name $APPGW_NAME
```

### Issue: 502 Bad Gateway
```bash
# Check pod health
kubectl get pods
kubectl describe pod <pod-name>

# Check service endpoints
kubectl get endpoints hello-world

# Check Application Gateway backend health
az network application-gateway show-backend-health \
  --resource-group $RESOURCE_GROUP \
  --name $APPGW_NAME
```

### Issue: API key not working
```bash
# Check secret
kubectl get secret api-keys -o yaml

# Check pod environment
kubectl exec -it <pod-name> -- env | grep API_KEYS

# Check logs
kubectl logs <pod-name>
```

## Next Steps

1. **Add API versioning** (/api/v1/, /api/v2/)
2. **Implement OAuth2** for user authentication
3. **Add caching layer** (Redis)
4. **Setup multi-region** deployment
5. **Implement GraphQL** endpoint
6. **Add WebSocket** support
7. **Setup CI/CD** for mobile apps
8. **Implement feature flags**
9. **Add A/B testing** capability
10. **Setup disaster recovery**

## Congratulations!

You've successfully:
- ✅ Deployed a Hello World API to AKS
- ✅ Configured AGIC with Application Gateway
- ✅ Exposed API publicly with security
- ✅ Implemented API key authentication
- ✅ Configured SSL and DNS
- ✅ Set up monitoring and logging
- ✅ Created CI/CD pipeline
- ✅ Provided mobile developer documentation

Your API is now ready for mobile app integration! 🚀📱


---

## IMPORTANT: Internal vs Public AGIC Clarification

### What We Built in This Lab

The setup in this lab uses **AGIC with a PUBLIC Application Gateway**. Here's the clarification:

### Scenario 1: Internal AGIC (Private Only)

```
┌─────────────────────────────────────────────────────────┐
│              Azure Virtual Network (Private)             │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │     Application Gateway (NO Public IP)         │    │
│  │     Private IP: 10.0.2.4                       │    │
│  └──────────────────┬─────────────────────────────┘    │
│                     │                                    │
│                     ↓ (Internal only)                    │
│  ┌────────────────────────────────────────────────┐    │
│  │              AKS Cluster                       │    │
│  │  ┌──────────────────────────────────────┐     │    │
│  │  │  AGIC (Ingress Controller)           │     │    │
│  │  └──────────────────────────────────────┘     │    │
│  │  ┌──────────────────────────────────────┐     │    │
│  │  │  Hello World Service & Pods          │     │    │
│  │  └──────────────────────────────────────┘     │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  VM / Azure Function (in same VNet)           │    │
│  │  Can access: http://10.0.2.4/api              │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘

Access: Only from within VNet or via VPN/ExpressRoute
Use Case: Internal APIs, microservices communication
```

### Scenario 2: Public AGIC (What We Built)

```
┌─────────────────────────────────────────────────────────┐
│                    Internet / Public                     │
│                                                          │
│              Mobile Apps, Web Browsers                   │
└────────────────────────┬────────────────────────────────┘
                         │
                         │ HTTPS (443)
                         ↓
┌─────────────────────────────────────────────────────────┐
│              Azure Virtual Network                       │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │     Application Gateway (WITH Public IP)       │    │
│  │     Public IP: 20.x.x.x                        │    │
│  │     Private IP: 10.0.2.4                       │    │
│  │     WAF: Enabled                               │    │
│  └──────────────────┬─────────────────────────────┘    │
│                     │                                    │
│                     ↓ (Internal communication)           │
│  ┌────────────────────────────────────────────────┐    │
│  │              AKS Cluster                       │    │
│  │  ┌──────────────────────────────────────┐     │    │
│  │  │  AGIC (Ingress Controller)           │     │    │
│  │  └──────────────────────────────────────┘     │    │
│  │  ┌──────────────────────────────────────┐     │    │
│  │  │  Hello World Service & Pods          │     │    │
│  │  └──────────────────────────────────────┘     │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘

Access: From anywhere on the internet
Use Case: Public APIs for mobile apps, external partners
```

## Key Differences

| Aspect | Internal AGIC | Public AGIC (Our Lab) |
|--------|---------------|----------------------|
| **Public IP** | ❌ No | ✅ Yes |
| **Internet Access** | ❌ No | ✅ Yes |
| **Access From** | VNet only | Anywhere |
| **Use Case** | Internal APIs | Mobile apps, public APIs |
| **Security** | Network isolation | WAF + Authentication |
| **Cost** | Lower (no public IP) | Higher (public IP + bandwidth) |
| **DNS** | Internal DNS | Public DNS required |
| **SSL** | Optional | Required |

## How to Convert Between Scenarios

### Convert Public → Internal (Remove Public Access)

```bash
# Remove public IP from Application Gateway
az network application-gateway frontend-ip delete \
  --resource-group $RESOURCE_GROUP \
  --gateway-name $APPGW_NAME \
  --name appGatewayFrontendIP

# Application Gateway now only has private IP
# Accessible only from within VNet
```

### Convert Internal → Public (Add Public Access)

```bash
# This is what we did in the lab!

# Create public IP
az network public-ip create \
  --resource-group $RESOURCE_GROUP \
  --name $PUBLIC_IP_NAME \
  --allocation-method Static \
  --sku Standard

# Add public IP to Application Gateway
az network application-gateway frontend-ip create \
  --resource-group $RESOURCE_GROUP \
  --gateway-name $APPGW_NAME \
  --name appGatewayPublicFrontendIP \
  --public-ip-address $PUBLIC_IP_NAME
```

## Real-World Scenario: Hybrid Approach

Many organizations use BOTH:

```
┌─────────────────────────────────────────────────────────┐
│                    Internet                              │
└────────────────────────┬────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────┐
│  Public Application Gateway (for mobile apps)           │
│  Public IP: 20.x.x.x                                    │
│  Routes: /api/mobile/*, /api/public/*                   │
└────────────────────────┬────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────┐
│              Azure Virtual Network                       │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Internal Application Gateway (for internal)   │    │
│  │  Private IP: 10.0.2.4                          │    │
│  │  Routes: /api/internal/*, /admin/*             │    │
│  └──────────────────┬─────────────────────────────┘    │
│                     │                                    │
│                     ↓                                    │
│  ┌────────────────────────────────────────────────┐    │
│  │              AKS Cluster                       │    │
│  │                                                │    │
│  │  ┌──────────────┐  ┌──────────────┐          │    │
│  │  │ Public API   │  │ Internal API │          │    │
│  │  │ Service      │  │ Service      │          │    │
│  │  └──────────────┘  └──────────────┘          │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### Implementing Hybrid Approach

1. **Create Two Ingress Resources**

```yaml
# public-ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: public-api-ingress
  annotations:
    kubernetes.io/ingress.class: azure/application-gateway
    appgw.ingress.kubernetes.io/ssl-redirect: "true"
    appgw.ingress.kubernetes.io/use-private-ip: "false"  # Use public IP
spec:
  rules:
  - host: api.yourdomain.com
    http:
      paths:
      - path: /api/mobile/*
        pathType: Prefix
        backend:
          service:
            name: mobile-api-service
            port:
              number: 80
---
# internal-ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: internal-api-ingress
  annotations:
    kubernetes.io/ingress.class: azure/application-gateway
    appgw.ingress.kubernetes.io/use-private-ip: "true"  # Use private IP only
spec:
  rules:
  - http:
      paths:
      - path: /api/internal/*
        pathType: Prefix
        backend:
          service:
            name: internal-api-service
            port:
              number: 80
```

2. **Apply Both Ingresses**

```bash
kubectl apply -f public-ingress.yaml
kubectl apply -f internal-ingress.yaml

# Verify
kubectl get ingress
```

## Security Considerations

### Internal AGIC Security
- ✅ Network isolation (no internet exposure)
- ✅ VNet peering for cross-VNet access
- ✅ Private endpoints
- ❌ No WAF (less critical for internal)
- ❌ No public DDoS protection needed

### Public AGIC Security (Our Lab)
- ✅ WAF enabled (OWASP rules)
- ✅ DDoS protection
- ✅ SSL/TLS termination
- ✅ API key authentication
- ✅ Rate limiting
- ✅ IP whitelisting (optional)
- ✅ Geo-filtering (optional)

## When to Use Each

### Use Internal AGIC When:
- ✅ Microservices communication
- ✅ Internal admin panels
- ✅ Backend APIs (not for mobile)
- ✅ Database access layers
- ✅ Internal tools and dashboards
- ✅ Cost is a major concern

### Use Public AGIC When:
- ✅ Mobile app APIs (like our scenario!)
- ✅ Public REST APIs
- ✅ Partner integrations
- ✅ Customer-facing services
- ✅ Need WAF protection
- ✅ Need global access

## Cost Comparison

### Internal AGIC
```
Application Gateway (no public IP): ~$125/month
AKS (2 nodes): ~$140/month
ACR: ~$5/month
Total: ~$270/month
```

### Public AGIC (Our Lab)
```
Application Gateway (with public IP): ~$125/month
Public IP: ~$4/month
AKS (2 nodes): ~$140/month
ACR: ~$5/month
Bandwidth (outbound): ~$20/month
Total: ~$294/month
```

**Difference: Only ~$24/month for public access!**

## Summary

### What We Built in This Lab:
✅ **Public AGIC** - Application Gateway with public IP
✅ Accessible from internet (mobile apps)
✅ WAF enabled for security
✅ SSL/TLS configured
✅ API key authentication
✅ Perfect for mobile app backends

### If You Need Internal Only:
- Remove the public IP from Application Gateway
- Use `appgw.ingress.kubernetes.io/use-private-ip: "true"`
- Access only via VPN or VNet peering
- Lower cost, higher security (network isolation)

### Best Practice:
Use **both** - public for mobile/external, internal for microservices!

---

## Quick Decision Tree

```
Do you need internet access?
├─ YES → Public AGIC (this lab) ✅
│   ├─ Mobile apps? → YES ✅
│   ├─ External partners? → YES ✅
│   └─ Public APIs? → YES ✅
│
└─ NO → Internal AGIC
    ├─ Microservices? → YES ✅
    ├─ Admin panels? → YES ✅
    └─ Internal tools? → YES ✅
```

**For your mobile dev scenario: Public AGIC is the correct choice!** ✅


---

## Part 12: Exposing Internal AGIC to Public (For Mobile Apps)

### The Scenario

You have:
- ✅ AKS cluster with internal AGIC
- ✅ Application Gateway with **private IP only** (10.0.2.4)
- ✅ APIs working internally within VNet

You need:
- ✅ Mobile apps to access these APIs from the internet
- ✅ Keep internal architecture secure
- ✅ Add public access layer

### Architecture: Internal AGIC + Public Exposure

```
┌─────────────────────────────────────────────────────────┐
│                    Internet / Mobile Apps                │
└────────────────────────┬────────────────────────────────┘
                         │
                         │ HTTPS
                         ↓
┌─────────────────────────────────────────────────────────┐
│              PUBLIC EXPOSURE LAYER                       │
│         (Choose ONE of these methods)                    │
│                                                          │
│  Option 1: Azure Front Door                             │
│  Option 2: Azure API Management                         │
│  Option 3: Public Load Balancer                         │
│  Option 4: Azure Application Gateway (Public)           │
└────────────────────────┬────────────────────────────────┘
                         │
                         │ Private Link / VNet Integration
                         ↓
┌─────────────────────────────────────────────────────────┐
│              Azure Virtual Network (Private)             │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Application Gateway (Internal AGIC)           │    │
│  │  Private IP: 10.0.2.4                          │    │
│  │  NO Public IP                                  │    │
│  └──────────────────┬─────────────────────────────┘    │
│                     │                                    │
│                     ↓                                    │
│  ┌────────────────────────────────────────────────┐    │
│  │              AKS Cluster                       │    │
│  │  ┌──────────────────────────────────────┐     │    │
│  │  │  AGIC (Ingress Controller)           │     │    │
│  │  └──────────────────────────────────────┘     │    │
│  │  ┌──────────────────────────────────────┐     │    │
│  │  │  Hello World API Service             │     │    │
│  │  └──────────────────────────────────────┘     │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## Method Comparison

| Method | Security | Cost | Complexity | Best For |
|--------|----------|------|------------|----------|
| **Azure Front Door** | ⭐⭐⭐⭐⭐ | $$$$ | Medium | Global apps, CDN |
| **API Management** | ⭐⭐⭐⭐⭐ | $$$$ | High | Enterprise APIs |
| **Public Load Balancer** | ⭐⭐⭐ | $ | Low | Simple exposure |
| **Public App Gateway** | ⭐⭐⭐⭐ | $$$ | Medium | WAF needed |

---

## Method 1: Azure Front Door (RECOMMENDED) ⭐

**Best for:** Global mobile apps, CDN, DDoS protection

### Why Azure Front Door?
- ✅ Global load balancing
- ✅ Built-in DDoS protection
- ✅ WAF capabilities
- ✅ SSL offloading
- ✅ CDN integration
- ✅ Private Link to internal AGIC
- ✅ No need to expose AGIC publicly

### Step 1: Create Azure Front Door

```bash
# Variables
FRONTDOOR_NAME="fd-mobile-api"
BACKEND_ADDRESS="10.0.2.4"  # Internal AGIC private IP

# Create Front Door
az afd profile create \
  --profile-name $FRONTDOOR_NAME \
  --resource-group $RESOURCE_GROUP \
  --sku Premium_AzureFrontDoor

# Get Front Door ID
FRONTDOOR_ID=$(az afd profile show \
  --profile-name $FRONTDOOR_NAME \
  --resource-group $RESOURCE_GROUP \
  --query id -o tsv)

echo "Front Door created: $FRONTDOOR_ID"
```

### Step 2: Create Private Link to Internal AGIC

```bash
# Enable Private Link on Application Gateway
az network application-gateway private-link add \
  --gateway-name $APPGW_NAME \
  --resource-group $RESOURCE_GROUP \
  --name appgw-private-link \
  --frontend-ip appGatewayFrontendIP \
  --subnet $APPGW_SUBNET_NAME

# Create Private Endpoint for Front Door
az network private-endpoint create \
  --name pe-frontdoor-to-appgw \
  --resource-group $RESOURCE_GROUP \
  --vnet-name $VNET_NAME \
  --subnet $APPGW_SUBNET_NAME \
  --private-connection-resource-id $APPGW_ID \
  --group-id appGatewayFrontendIP \
  --connection-name frontdoor-to-appgw
```

### Step 3: Configure Front Door Backend

```bash
# Create origin group
az afd origin-group create \
  --profile-name $FRONTDOOR_NAME \
  --resource-group $RESOURCE_GROUP \
  --origin-group-name api-backend \
  --probe-request-type GET \
  --probe-protocol Http \
  --probe-interval-in-seconds 30 \
  --probe-path /api/health \
  --sample-size 4 \
  --successful-samples-required 3 \
  --additional-latency-in-milliseconds 50

# Add origin (internal AGIC)
az afd origin create \
  --profile-name $FRONTDOOR_NAME \
  --resource-group $RESOURCE_GROUP \
  --origin-group-name api-backend \
  --origin-name internal-agic \
  --host-name $BACKEND_ADDRESS \
  --origin-host-header $BACKEND_ADDRESS \
  --priority 1 \
  --weight 1000 \
  --enabled-state Enabled \
  --http-port 80 \
  --https-port 443
```

### Step 4: Configure Front Door Endpoint

```bash
# Create endpoint
az afd endpoint create \
  --profile-name $FRONTDOOR_NAME \
  --resource-group $RESOURCE_GROUP \
  --endpoint-name mobile-api \
  --enabled-state Enabled

# Create route
az afd route create \
  --profile-name $FRONTDOOR_NAME \
  --resource-group $RESOURCE_GROUP \
  --endpoint-name mobile-api \
  --route-name api-route \
  --origin-group api-backend \
  --supported-protocols Http Https \
  --https-redirect Enabled \
  --forwarding-protocol HttpOnly \
  --patterns-to-match "/api/*"

# Get Front Door endpoint
FRONTDOOR_ENDPOINT=$(az afd endpoint show \
  --profile-name $FRONTDOOR_NAME \
  --resource-group $RESOURCE_GROUP \
  --endpoint-name mobile-api \
  --query hostName -o tsv)

echo "Front Door Endpoint: https://$FRONTDOOR_ENDPOINT"
```

### Step 5: Configure Custom Domain

```bash
# Add custom domain
az afd custom-domain create \
  --profile-name $FRONTDOOR_NAME \
  --resource-group $RESOURCE_GROUP \
  --custom-domain-name api-yourdomain-com \
  --host-name api.yourdomain.com \
  --minimum-tls-version TLS12

# Associate with endpoint
az afd route update \
  --profile-name $FRONTDOOR_NAME \
  --resource-group $RESOURCE_GROUP \
  --endpoint-name mobile-api \
  --route-name api-route \
  --custom-domains api-yourdomain-com
```

### Step 6: Enable WAF on Front Door

```bash
# Create WAF policy
az network front-door waf-policy create \
  --name MobileAPIWAF \
  --resource-group $RESOURCE_GROUP \
  --sku Premium_AzureFrontDoor \
  --mode Prevention

# Enable managed rules
az network front-door waf-policy managed-rules add \
  --policy-name MobileAPIWAF \
  --resource-group $RESOURCE_GROUP \
  --type Microsoft_DefaultRuleSet \
  --version 2.1

# Apply to Front Door
az afd security-policy create \
  --profile-name $FRONTDOOR_NAME \
  --resource-group $RESOURCE_GROUP \
  --security-policy-name api-waf \
  --domains api-yourdomain-com \
  --waf-policy /subscriptions/.../MobileAPIWAF
```

### Test Front Door

```bash
# Test via Front Door
curl https://$FRONTDOOR_ENDPOINT/api/hello?name=Mobile

# Test with custom domain
curl https://api.yourdomain.com/api/hello?name=Mobile
```

---

## Method 2: Azure API Management (APIM)

**Best for:** Enterprise APIs, advanced features, monetization

### Why APIM?
- ✅ API gateway features (throttling, caching, transformation)
- ✅ Developer portal
- ✅ API versioning
- ✅ Subscription keys
- ✅ Analytics and monitoring
- ✅ VNet integration to internal AGIC

### Step 1: Create APIM Instance

```bash
# Create APIM (takes 30-45 minutes!)
APIM_NAME="apim-mobile-api"
PUBLISHER_EMAIL="admin@yourdomain.com"
PUBLISHER_NAME="Your Company"

az apim create \
  --name $APIM_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --publisher-email $PUBLISHER_EMAIL \
  --publisher-name "$PUBLISHER_NAME" \
  --sku-name Developer \
  --enable-managed-identity true

echo "APIM creation started (this takes 30-45 minutes)..."
```

### Step 2: Configure VNet Integration

```bash
# Create subnet for APIM
az network vnet subnet create \
  --resource-group $RESOURCE_GROUP \
  --vnet-name $VNET_NAME \
  --name subnet-apim \
  --address-prefixes 10.0.3.0/24

# Enable VNet integration (Internal mode)
az apim update \
  --name $APIM_NAME \
  --resource-group $RESOURCE_GROUP \
  --virtual-network Internal \
  --vnet-name $VNET_NAME \
  --subnet subnet-apim
```

### Step 3: Add Backend (Internal AGIC)

```bash
# Add backend
az apim backend create \
  --resource-group $RESOURCE_GROUP \
  --service-name $APIM_NAME \
  --backend-id internal-agic-backend \
  --url "http://10.0.2.4" \
  --protocol http \
  --description "Internal AGIC"
```

### Step 4: Create API

```bash
# Create API
az apim api create \
  --resource-group $RESOURCE_GROUP \
  --service-name $APIM_NAME \
  --api-id mobile-api \
  --path api \
  --display-name "Mobile API" \
  --protocols https \
  --service-url "http://10.0.2.4"

# Add operation
az apim api operation create \
  --resource-group $RESOURCE_GROUP \
  --service-name $APIM_NAME \
  --api-id mobile-api \
  --url-template "/hello" \
  --method GET \
  --display-name "Get Hello"
```

### Step 5: Configure Policies

```xml
<!-- Create file: apim-policy.xml -->
<policies>
    <inbound>
        <base />
        <!-- Rate limiting -->
        <rate-limit calls="100" renewal-period="60" />
        
        <!-- API key validation -->
        <check-header name="X-API-Key" failed-check-httpcode="401" failed-check-error-message="API key required" />
        
        <!-- CORS for mobile -->
        <cors allow-credentials="true">
            <allowed-origins>
                <origin>capacitor://localhost</origin>
                <origin>ionic://localhost</origin>
            </allowed-origins>
            <allowed-methods>
                <method>GET</method>
                <method>POST</method>
            </allowed-methods>
            <allowed-headers>
                <header>*</header>
            </allowed-headers>
        </cors>
        
        <!-- Forward to internal AGIC -->
        <set-backend-service backend-id="internal-agic-backend" />
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

```bash
# Apply policy
az apim api policy create \
  --resource-group $RESOURCE_GROUP \
  --service-name $APIM_NAME \
  --api-id mobile-api \
  --xml-file apim-policy.xml
```

### Step 6: Get APIM Gateway URL

```bash
# Get gateway URL
APIM_GATEWAY=$(az apim show \
  --name $APIM_NAME \
  --resource-group $RESOURCE_GROUP \
  --query gatewayUrl -o tsv)

echo "APIM Gateway: $APIM_GATEWAY"

# Test
curl "$APIM_GATEWAY/api/hello?name=Mobile" \
  -H "Ocp-Apim-Subscription-Key: your-subscription-key"
```

---

## Method 3: Public Load Balancer (Simple)

**Best for:** Simple scenarios, cost-effective

### Step 1: Create Public Load Balancer

```bash
# Create public IP
az network public-ip create \
  --resource-group $RESOURCE_GROUP \
  --name pip-lb-mobile \
  --sku Standard \
  --allocation-method Static

# Create load balancer
az network lb create \
  --resource-group $RESOURCE_GROUP \
  --name lb-mobile-api \
  --sku Standard \
  --public-ip-address pip-lb-mobile \
  --frontend-ip-name LoadBalancerFrontEnd \
  --backend-pool-name BackendPool

# Get public IP
LB_PUBLIC_IP=$(az network public-ip show \
  --resource-group $RESOURCE_GROUP \
  --name pip-lb-mobile \
  --query ipAddress -o tsv)

echo "Load Balancer Public IP: $LB_PUBLIC_IP"
```

### Step 2: Create Health Probe

```bash
az network lb probe create \
  --resource-group $RESOURCE_GROUP \
  --lb-name lb-mobile-api \
  --name health-probe \
  --protocol http \
  --port 80 \
  --path /api/health
```

### Step 3: Create Load Balancing Rule

```bash
az network lb rule create \
  --resource-group $RESOURCE_GROUP \
  --lb-name lb-mobile-api \
  --name http-rule \
  --protocol tcp \
  --frontend-port 80 \
  --backend-port 80 \
  --frontend-ip-name LoadBalancerFrontEnd \
  --backend-pool-name BackendPool \
  --probe-name health-probe
```

### Step 4: Add Internal AGIC to Backend Pool

```bash
# Get AGIC private IP
AGIC_PRIVATE_IP="10.0.2.4"

# Create NIC for backend
az network nic create \
  --resource-group $RESOURCE_GROUP \
  --name nic-lb-backend \
  --vnet-name $VNET_NAME \
  --subnet $APPGW_SUBNET_NAME \
  --private-ip-address $AGIC_PRIVATE_IP

# Add to backend pool
az network nic ip-config address-pool add \
  --resource-group $RESOURCE_GROUP \
  --nic-name nic-lb-backend \
  --ip-config-name ipconfig1 \
  --lb-name lb-mobile-api \
  --address-pool BackendPool
```

### Test Load Balancer

```bash
curl http://$LB_PUBLIC_IP/api/hello?name=Mobile
```

---

## Method 4: Second Application Gateway (Public)

**Best for:** Need WAF, already familiar with App Gateway

### Architecture

```
Internet → Public App Gateway → Internal App Gateway (AGIC) → AKS
```

### Step 1: Create Public Application Gateway

```bash
# Create public IP
az network public-ip create \
  --resource-group $RESOURCE_GROUP \
  --name pip-appgw-public \
  --sku Standard \
  --allocation-method Static

# Create subnet for public App Gateway
az network vnet subnet create \
  --resource-group $RESOURCE_GROUP \
  --vnet-name $VNET_NAME \
  --name subnet-appgw-public \
  --address-prefixes 10.0.4.0/24

# Create public Application Gateway
az network application-gateway create \
  --name appgw-public \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku WAF_v2 \
  --capacity 2 \
  --vnet-name $VNET_NAME \
  --subnet subnet-appgw-public \
  --public-ip-address pip-appgw-public \
  --http-settings-cookie-based-affinity Disabled \
  --frontend-port 80 \
  --http-settings-port 80 \
  --http-settings-protocol Http

# Get public IP
PUBLIC_APPGW_IP=$(az network public-ip show \
  --resource-group $RESOURCE_GROUP \
  --name pip-appgw-public \
  --query ipAddress -o tsv)

echo "Public App Gateway IP: $PUBLIC_APPGW_IP"
```

### Step 2: Configure Backend Pool (Internal AGIC)

```bash
# Add internal AGIC as backend
az network application-gateway address-pool create \
  --gateway-name appgw-public \
  --resource-group $RESOURCE_GROUP \
  --name internal-agic-pool \
  --servers 10.0.2.4
```

### Step 3: Configure Routing Rules

```bash
# Create backend HTTP settings
az network application-gateway http-settings create \
  --gateway-name appgw-public \
  --resource-group $RESOURCE_GROUP \
  --name internal-agic-settings \
  --port 80 \
  --protocol Http \
  --cookie-based-affinity Disabled \
  --timeout 30

# Create rule
az network application-gateway rule create \
  --gateway-name appgw-public \
  --resource-group $RESOURCE_GROUP \
  --name api-rule \
  --http-listener appGatewayHttpListener \
  --rule-type Basic \
  --address-pool internal-agic-pool \
  --http-settings internal-agic-settings
```

### Test Public App Gateway

```bash
curl http://$PUBLIC_APPGW_IP/api/hello?name=Mobile
```

---

## Comparison Summary

### Front Door (RECOMMENDED) ⭐
```
Cost: ~$35/month + bandwidth
Setup Time: 15 minutes
Security: ⭐⭐⭐⭐⭐
Features: Global LB, CDN, WAF, DDoS
Best for: Global mobile apps
```

### API Management
```
Cost: ~$50/month (Developer) to $2,800/month (Premium)
Setup Time: 45 minutes (creation time)
Security: ⭐⭐⭐⭐⭐
Features: API gateway, portal, analytics
Best for: Enterprise APIs, monetization
```

### Load Balancer
```
Cost: ~$20/month
Setup Time: 5 minutes
Security: ⭐⭐⭐
Features: Basic load balancing
Best for: Simple scenarios, cost-sensitive
```

### Public App Gateway
```
Cost: ~$125/month
Setup Time: 10 minutes
Security: ⭐⭐⭐⭐
Features: WAF, SSL, routing
Best for: Already using App Gateway
```

## Mobile Developer Documentation Update

Update your API documentation with the public endpoint:

```markdown
# Mobile API Documentation

## Base URL
```
Production: https://api.yourdomain.com
(via Azure Front Door → Internal AGIC → AKS)
```

## Architecture
Your request flows through:
1. Azure Front Door (public, global)
2. Private Link
3. Internal Application Gateway (AGIC)
4. AKS Cluster
5. Your API pods

## Security Layers
- Layer 1: Front Door WAF
- Layer 2: Private Link (no public exposure of internal network)
- Layer 3: API Key authentication
- Layer 4: Rate limiting
- Layer 5: Application-level validation
```

## Final Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Mobile Apps (iOS/Android)                   │
└────────────────────────┬────────────────────────────────┘
                         │
                         │ HTTPS
                         ↓
┌─────────────────────────────────────────────────────────┐
│         Azure Front Door (Public)                        │
│         - Global endpoint                                │
│         - WAF enabled                                    │
│         - DDoS protection                                │
│         - SSL termination                                │
└────────────────────────┬────────────────────────────────┘
                         │
                         │ Private Link
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
│  │  │  Hello World API (3 pods)            │     │    │
│  │  └──────────────────────────────────────┘     │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## Benefits of This Approach

✅ **Internal AGIC stays private** - No public IP on App Gateway
✅ **Secure** - Multiple security layers
✅ **Scalable** - Global distribution with Front Door
✅ **Cost-effective** - Only pay for Front Door, not public App Gateway
✅ **Flexible** - Easy to add more backends
✅ **Best practice** - Separation of concerns

## Recommended Solution

**For mobile apps: Use Azure Front Door** ⭐

```bash
# Quick setup
1. Create Front Door
2. Configure Private Link to internal AGIC
3. Add custom domain
4. Enable WAF
5. Give endpoint to mobile developers
```

**Total cost: ~$305/month**
- Internal AGIC: ~$270/month
- Front Door: ~$35/month

This is the best balance of security, performance, and cost! 🚀
