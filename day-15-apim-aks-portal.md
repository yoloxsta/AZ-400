# Day 15: Expose AKS API via Azure API Management (APIM) - Portal Guide

## What You'll Learn

Use Azure API Management instead of Front Door to expose your internal AKS API:
- ✅ Create Azure API Management instance
- ✅ Connect APIM to internal AGIC via VNet integration
- ✅ Configure API policies (rate limiting, authentication)
- ✅ Add subscription keys for mobile apps
- ✅ Monitor API usage and analytics
- ✅ All via Azure Portal (GUI)

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Mobile Applications                              │
│                  (iOS, Android, Web Apps)                           │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ HTTPS Request
                             │ Header: Ocp-Apim-Subscription-Key
                             ↓
┌─────────────────────────────────────────────────────────────────────┐
│                   Azure API Management (APIM)                        │
│                   Gateway: apim-aks-demo.azure-api.net              │
│                                                                      │
│   ┌──────────────────────────────────────────────────────────┐    │
│   │  Gateway Layer (Public Endpoint)                         │    │
│   │  - Subscription key validation                           │    │
│   │  - Rate limiting: 100 calls/min                         │    │
│   │  - Quota: 10,000 calls/day                              │    │
│   │  - CORS policy                                           │    │
│   │  - Response caching: 60 seconds                         │    │
│   └──────────────────────────────────────────────────────────┘    │
│                                                                      │
│   ┌──────────────────────────────────────────────────────────┐    │
│   │  Management Layer                                         │    │
│   │  - Developer Portal                                       │    │
│   │  - Analytics & Monitoring                                │    │
│   │  - Subscription Management                               │    │
│   └──────────────────────────────────────────────────────────┘    │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             │ VNet Integration (Premium Tier)
                             │ OR HTTP to Internal IP (Developer Tier)
                             ↓
┌─────────────────────────────────────────────────────────────────────┐
│                   Azure Virtual Network (Private)                    │
│                   Address Space: 10.0.0.0/16                        │
│                                                                      │
│   ┌──────────────────────────────────────────────────────────┐    │
│   │  Subnet: subnet-apim (10.0.3.0/24)                       │    │
│   │  - APIM Private Endpoint (Premium Tier Only)             │    │
│   └──────────────────────────────────────────────────────────┘    │
│                             │                                        │
│                             ↓                                        │
│   ┌──────────────────────────────────────────────────────────┐    │
│   │  Subnet: subnet-appgw (10.0.2.0/24)                      │    │
│   │                                                           │    │
│   │  ┌─────────────────────────────────────────────────┐    │    │
│   │  │  Application Gateway (Internal AGIC)            │    │    │
│   │  │  Private IP: 10.0.2.4                           │    │    │
│   │  │  NO Public IP ✅                                │    │    │
│   │  │  - Ingress Controller for AKS                   │    │    │
│   │  │  - Health probes                                │    │    │
│   │  └─────────────────────────────────────────────────┘    │    │
│   └──────────────────────────┬───────────────────────────────┘    │
│                               │                                     │
│                               ↓                                     │
│   ┌──────────────────────────────────────────────────────────┐    │
│   │  Subnet: subnet-aks (10.0.1.0/24)                        │    │
│   │                                                           │    │
│   │  ┌─────────────────────────────────────────────────┐    │    │
│   │  │  Azure Kubernetes Service (AKS)                 │    │    │
│   │  │                                                  │    │    │
│   │  │  ┌────────────────────────────────────────┐    │    │    │
│   │  │  │  Pod: hello-world-1                    │    │    │    │
│   │  │  │  Container: hello-world-api            │    │    │    │
│   │  │  └────────────────────────────────────────┘    │    │    │
│   │  │  ┌────────────────────────────────────────┐    │    │    │
│   │  │  │  Pod: hello-world-2                    │    │    │    │
│   │  │  └────────────────────────────────────────┘    │    │    │
│   │  │  ┌────────────────────────────────────────┐    │    │    │
│   │  │  │  Pod: hello-world-3                    │    │    │    │
│   │  │  └────────────────────────────────────────┘    │    │    │
│   │  │                                                  │    │    │
│   │  │  Service: hello-world-service (ClusterIP)      │    │    │
│   │  └─────────────────────────────────────────────────┘    │    │
│   └──────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────────┐
│                   Application Insights                               │
│                   - Request tracking                                 │
│                   - Performance monitoring                           │
│                   - Error logging                                    │
└─────────────────────────────────────────────────────────────────────┘
```

### Request Flow Diagram

```
┌──────────────┐
│  Mobile App  │
└──────┬───────┘
       │ 1. HTTPS Request
       │    GET /api/hello
       │    Header: Ocp-Apim-Subscription-Key: abc123...
       ↓
┌──────────────────────────────────────────────────────────┐
│  APIM Gateway (Public: apim-aks-demo.azure-api.net)     │
│                                                          │
│  Step 2: Validate Subscription Key                      │
│  ├─ Key exists? ✅                                      │
│  ├─ Key active? ✅                                      │
│  └─ Product access? ✅                                  │
│                                                          │
│  Step 3: Apply Policies                                 │
│  ├─ Rate limit check (100/min) ✅                       │
│  ├─ Quota check (10,000/day) ✅                         │
│  ├─ CORS headers added ✅                               │
│  └─ Check cache (60 sec) ⚠️ Miss                       │
│                                                          │
│  Step 4: Transform Request (if needed)                  │
│  └─ Add headers, modify body, etc.                      │
└──────┬───────────────────────────────────────────────────┘
       │ 5. Forward to Backend
       │    GET http://10.0.2.4/hello
       ↓
┌──────────────────────────────────────────────────────────┐
│  Internal AGIC (Private IP: 10.0.2.4)                   │
│                                                          │
│  Step 6: Route to AKS Service                           │
│  └─ Ingress rule: /hello → hello-world-service:80      │
└──────┬───────────────────────────────────────────────────┘
       │ 7. Forward to Pod
       ↓
┌──────────────────────────────────────────────────────────┐
│  AKS Pod (hello-world-1)                                │
│                                                          │
│  Step 8: Process Request                                │
│  └─ Return: {"message": "Hello World!"}                │
└──────┬───────────────────────────────────────────────────┘
       │ 9. Response
       ↓
┌──────────────────────────────────────────────────────────┐
│  APIM Gateway                                            │
│                                                          │
│  Step 10: Apply Outbound Policies                       │
│  ├─ Cache response (60 sec) ✅                          │
│  ├─ Add custom headers ✅                               │
│  └─ Log to Application Insights ✅                      │
└──────┬───────────────────────────────────────────────────┘
       │ 11. Return to Client
       │     200 OK
       │     {"message": "Hello World!"}
       ↓
┌──────────────┐
│  Mobile App  │
└──────────────┘
```

### Security Layers

```
Layer 1: Internet (Public)
   ↓
Layer 2: APIM Gateway (Public Endpoint)
   ├─ Subscription Key Validation ✅
   ├─ Rate Limiting ✅
   ├─ IP Filtering (Optional) ⚠️
   └─ OAuth 2.0 (Optional) ⚠️
   ↓
Layer 3: VNet Boundary
   ├─ Network Security Groups ✅
   └─ Private Link (Premium) ✅
   ↓
Layer 4: Internal AGIC (Private)
   ├─ No Public IP ✅
   ├─ VNet Isolation ✅
   └─ Health Probes ✅
   ↓
Layer 5: AKS Network Policies
   ├─ Pod Security ✅
   ├─ Service Mesh (Optional) ⚠️
   └─ Network Policies ✅
   ↓
Layer 6: Application (Pod)
   └─ Business Logic ✅
```

**Key Difference from Day 14:**
- Day 14: Front Door (CDN + WAF focus, custom API keys)
- Day 15: APIM (API management + policies focus, subscription keys)

---

## Prerequisites

- Completed Day 14 (AKS with Internal AGIC deployed)
- Azure subscription
- Resource group: `rg-aks-demo`
- VNet: `vnet-aks` with subnets
- AKS cluster with internal AGIC running

---

## Part 1: Create Azure API Management Instance

### Step 1: Navigate to API Management

1. Open Azure Portal: https://portal.azure.com
2. In search bar, type **"API Management services"**
3. Click **"API Management services"**
4. Click **"+ Create"**

### Step 2: Basics Tab

1. **Subscription**: Select your subscription
2. **Resource group**: `rg-aks-demo`
3. **Region**: `East US` (same as your AKS)
4. **Resource name**: `apim-aks-demo`
5. **Organization name**: `Your Company Name`
6. **Administrator email**: `your-email@example.com`
7. **Pricing tier**: 
   - For testing: `Developer (No SLA)`
   - For production: `Standard` or `Premium`

**Note**: Premium tier required for VNet integration. For this lab, we'll use Developer tier and show both approaches.

8. Click **"Review + create"**
9. Click **"Create"**

**⏱️ Wait time**: 30-45 minutes (APIM takes time to provision)

**✅ Result**: APIM instance created

---

## Part 2: Create Subnet for APIM (Premium Tier Only)

**Note**: Skip this if using Developer tier. For Premium tier with VNet integration:

### Step 1: Add APIM Subnet to VNet

1. Go to **"Virtual networks"**
2. Click **"vnet-aks"**
3. In left menu, click **"Subnets"**
4. Click **"+ Subnet"**
5. Fill in:
   - **Name**: `subnet-apim`
   - **Subnet address range**: `10.0.3.0/24`
   - **Subnet delegation**: `Microsoft.ApiManagement/service`
6. Click **"Save"**

**✅ Result**: APIM subnet created

---

## Part 3: Configure APIM VNet Integration (Premium Tier)

**Note**: For Developer tier, skip to Part 4. For Premium tier:

### Step 1: Enable VNet Integration

1. Go to your APIM instance: `apim-aks-demo`
2. In left menu, click **"Virtual network"**
3. Click **"External"** (APIM accessible from internet, but can reach internal resources)
4. **Virtual network**: Select `vnet-aks`
5. **Subnet**: Select `subnet-apim`
6. Click **"Apply"**
7. Click **"Save"**

**⏱️ Wait time**: 15-20 minutes

**✅ Result**: APIM can now reach internal AGIC

---

## Part 4: Get Internal AGIC IP Address

### Step 1: Find AGIC Internal IP

1. Open **Cloud Shell** (top right in Portal)
2. Run command:
```bash
kubectl get ingress
```

3. Note the **ADDRESS** (e.g., `10.0.2.4`)

**Example output:**
```
NAME              CLASS    HOSTS   ADDRESS     PORTS   AGE
hello-ingress     <none>   *       10.0.2.4    80      1d
```

**✅ Result**: You have internal AGIC IP: `10.0.2.4`

---

## Part 5: Create API in APIM

### Step 1: Navigate to APIs

1. Go to your APIM instance: `apim-aks-demo`
2. In left menu, under **"APIs"**, click **"APIs"**
3. Click **"+ Add API"**
4. Select **"HTTP"** (manual API definition)

### Step 2: Create API

1. **Display name**: `Hello World API`
2. **Name**: `hello-world-api` (auto-filled)
3. **Web service URL**: 
   - **Developer tier**: `http://10.0.2.4` (internal AGIC IP)
   - **Premium tier with VNet**: `http://10.0.2.4`
   - **Without VNet**: Use public endpoint if available
4. **API URL suffix**: `api`
5. **Products**: Select `Unlimited` (for testing)
6. Click **"Create"**

**✅ Result**: API created in APIM

---

## Part 6: Add API Operations

### Step 1: Add GET Operation

1. In your API, click **"+ Add operation"**
2. Fill in:
   - **Display name**: `Get Hello`
   - **Name**: `get-hello` (auto-filled)
   - **URL**: 
     - Method: `GET`
     - Path: `/hello`
3. Click **"Save"**

### Step 2: Test Operation (Internal)

1. Click on **"Get Hello"** operation
2. Click **"Test"** tab
3. Click **"Send"**

**Expected result** (if VNet integration works):
```
HTTP/1.1 200 OK
{
  "message": "Hello World!",
  "timestamp": "2026-03-02T..."
}
```

**If you get error**: VNet integration not working or AGIC not reachable.

**✅ Result**: API operation configured

---

## Part 7: Configure Subscription Keys

### Step 1: Create Product

1. In left menu, click **"Products"**
2. Click **"+ Add"**
3. Fill in:
   - **Display name**: `Mobile Apps`
   - **Id**: `mobile-apps` (auto-filled)
   - **Description**: `API access for mobile applications`
   - **Requires subscription**: ✅ Checked
   - **Requires approval**: ✅ Checked (for production)
   - **Subscription limit**: `Unlimited`
   - **State**: `Published`
4. Click **"Create"**

### Step 2: Add API to Product

1. Click on **"Mobile Apps"** product
2. Click **"APIs"**
3. Click **"+ Add"**
4. Select **"Hello World API"**
5. Click **"Select"**

**✅ Result**: API requires subscription key

### Step 3: Create Subscriptions

1. In left menu, click **"Subscriptions"**
2. Click **"+ Add subscription"**

**For iOS:**
3. Fill in:
   - **Name**: `iOS App Subscription`
   - **Display name**: `iOS App`
   - **Scope**: `Product`
   - **Product**: `Mobile Apps`
   - **State**: `Active`
4. Click **"Create"**
5. Click **"Show"** next to **Primary key**
6. Copy the key (e.g., `abc123...`)

**For Android:**
7. Click **"+ Add subscription"** again
8. Fill in:
   - **Name**: `Android App Subscription`
   - **Display name**: `Android App`
   - **Scope**: `Product`
   - **Product**: `Mobile Apps`
9. Click **"Create"**
10. Copy the Android key

**✅ Result**: Subscription keys created for iOS and Android

---

## Part 8: Configure API Policies

### Step 1: Add Rate Limiting

1. Go to **"APIs"** → **"Hello World API"**
2. Click **"All operations"**
3. In **"Inbound processing"**, click **"</>** (code editor)
4. Add policy inside `<inbound>` section:

```xml
<inbound>
    <base />
    <rate-limit calls="100" renewal-period="60" />
    <quota calls="10000" renewal-period="86400" />
</inbound>
```

5. Click **"Save"**

**What this does:**
- Rate limit: 100 calls per minute
- Quota: 10,000 calls per day

### Step 2: Add CORS Policy

1. In same policy editor, add after rate-limit:

```xml
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
        <allowed-headers>
            <header>*</header>
        </allowed-headers>
    </cors>
</inbound>
```

2. Click **"Save"**

### Step 3: Add Response Caching (Optional)

1. Add in `<outbound>` section:

```xml
<outbound>
    <base />
    <cache-store duration="60" />
</outbound>
```

**✅ Result**: API policies configured

---

## Part 9: Test API with Subscription Key

### Step 1: Get APIM Gateway URL

1. Go to your APIM instance overview
2. Note the **Gateway URL** (e.g., `https://apim-aks-demo.azure-api.net`)

### Step 2: Test with curl

```bash
# Without subscription key (should fail)
curl https://apim-aks-demo.azure-api.net/api/hello

# Expected: 401 Unauthorized
# {"statusCode":401,"message":"Access denied due to missing subscription key"}

# With subscription key (should work)
curl -H "Ocp-Apim-Subscription-Key: abc123..." \
  https://apim-aks-demo.azure-api.net/api/hello

# Expected: 200 OK
# {"message":"Hello World!","timestamp":"..."}
```

### Step 3: Test in Portal

1. Go to **"APIs"** → **"Hello World API"** → **"Get Hello"**
2. Click **"Test"** tab
3. **Subscription**: Select `iOS App Subscription`
4. Click **"Send"**

**Expected**: 200 OK with response

**✅ Result**: API accessible with subscription key

---

## Part 10: Comprehensive Test Cases

### Test Case 1: ✅ Valid Subscription Key (iOS)

**Purpose**: Verify iOS app can access API with valid subscription key

**Steps:**
1. Get iOS subscription key from APIM
2. Make request with key

**Request:**
```bash
curl -v -H "Ocp-Apim-Subscription-Key: <ios-key>" \
  https://apim-aks-demo.azure-api.net/api/hello
```

**Expected Response:**
```
HTTP/1.1 200 OK
Content-Type: application/json
Ocp-Apim-Trace-Location: ...

{
  "message": "Hello World!",
  "timestamp": "2026-03-02T21:00:00Z"
}
```

**Verification:**
- [ ] Status code: 200 OK
- [ ] Response contains message
- [ ] Response time < 500ms
- [ ] APIM analytics shows request

**✅ PASS** if all checks pass

---

### Test Case 2: ✅ Valid Subscription Key (Android)

**Purpose**: Verify Android app can access API with valid subscription key

**Steps:**
1. Get Android subscription key from APIM
2. Make request with key

**Request:**
```bash
curl -v -H "Ocp-Apim-Subscription-Key: <android-key>" \
  https://apim-aks-demo.azure-api.net/api/hello
```

**Expected Response:**
```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "message": "Hello World!",
  "timestamp": "2026-03-02T21:00:00Z"
}
```

**Verification:**
- [ ] Status code: 200 OK
- [ ] Response contains message
- [ ] Different key from iOS works
- [ ] APIM tracks Android subscription separately

**✅ PASS** if all checks pass

---

### Test Case 3: ❌ Missing Subscription Key

**Purpose**: Verify API rejects requests without subscription key

**Steps:**
1. Make request without subscription key header

**Request:**
```bash
curl -v https://apim-aks-demo.azure-api.net/api/hello
```

**Expected Response:**
```
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "statusCode": 401,
  "message": "Access denied due to missing subscription key. Make sure to include subscription key when making requests to an API."
}
```

**Verification:**
- [ ] Status code: 401 Unauthorized
- [ ] Error message mentions missing key
- [ ] Request blocked at APIM (doesn't reach AKS)
- [ ] APIM analytics shows failed request

**✅ PASS** if request is rejected

---

### Test Case 4: ❌ Invalid Subscription Key

**Purpose**: Verify API rejects requests with invalid subscription key

**Steps:**
1. Make request with fake/invalid key

**Request:**
```bash
curl -v -H "Ocp-Apim-Subscription-Key: invalid-key-12345" \
  https://apim-aks-demo.azure-api.net/api/hello
```

**Expected Response:**
```
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "statusCode": 401,
  "message": "Access denied due to invalid subscription key. Make sure to provide a valid key for an active subscription."
}
```

**Verification:**
- [ ] Status code: 401 Unauthorized
- [ ] Error message mentions invalid key
- [ ] Request blocked at APIM
- [ ] APIM logs show invalid key attempt

**✅ PASS** if request is rejected

---

### Test Case 5: ❌ Suspended Subscription

**Purpose**: Verify API rejects requests from suspended subscriptions

**Steps:**
1. Suspend iOS subscription in APIM
2. Make request with suspended key

**Setup:**
1. Go to APIM → **"Subscriptions"**
2. Click iOS subscription
3. Change **State** to `Suspended`
4. Click **"Save"**

**Request:**
```bash
curl -v -H "Ocp-Apim-Subscription-Key: <ios-key>" \
  https://apim-aks-demo.azure-api.net/api/hello
```

**Expected Response:**
```
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "statusCode": 403,
  "message": "Subscription is suspended."
}
```

**Verification:**
- [ ] Status code: 403 Forbidden
- [ ] Error mentions suspended subscription
- [ ] Request blocked at APIM

**Cleanup:**
1. Reactivate subscription: State → `Active`

**✅ PASS** if request is rejected

---

### Test Case 6: ❌ Rate Limit Exceeded

**Purpose**: Verify rate limiting policy works (100 calls/min)

**Steps:**
1. Make 101 requests within 1 minute

**Request:**
```bash
# Make 101 requests rapidly
for i in {1..101}; do
  curl -H "Ocp-Apim-Subscription-Key: <ios-key>" \
    https://apim-aks-demo.azure-api.net/api/hello
  echo "Request $i"
done
```

**Expected Response (after 100 requests):**
```
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
Retry-After: 60

{
  "statusCode": 429,
  "message": "Rate limit is exceeded. Try again in 60 seconds."
}
```

**Verification:**
- [ ] First 100 requests: 200 OK
- [ ] Request 101: 429 Too Many Requests
- [ ] Retry-After header present
- [ ] After 60 seconds, requests work again

**✅ PASS** if rate limit enforced

---

### Test Case 7: ❌ Quota Exceeded

**Purpose**: Verify quota policy works (10,000 calls/day)

**Steps:**
1. Make 10,001 requests in one day (simulate)

**Note**: For testing, temporarily reduce quota:
1. Go to API policy
2. Change: `<quota calls="10" renewal-period="60" />`
3. Make 11 requests

**Request:**
```bash
# Make 11 requests
for i in {1..11}; do
  curl -H "Ocp-Apim-Subscription-Key: <ios-key>" \
    https://apim-aks-demo.azure-api.net/api/hello
  echo "Request $i"
done
```

**Expected Response (after 10 requests):**
```
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "statusCode": 403,
  "message": "Quota exceeded. Maximum allowed: 10, used: 10."
}
```

**Verification:**
- [ ] First 10 requests: 200 OK
- [ ] Request 11: 403 Forbidden
- [ ] Error mentions quota exceeded

**Cleanup:**
1. Restore original quota: `<quota calls="10000" renewal-period="86400" />`

**✅ PASS** if quota enforced

---

### Test Case 8: ✅ CORS Headers

**Purpose**: Verify CORS policy allows cross-origin requests

**Steps:**
1. Make request with Origin header

**Request:**
```bash
curl -v -H "Origin: https://example.com" \
  -H "Ocp-Apim-Subscription-Key: <ios-key>" \
  https://apim-aks-demo.azure-api.net/api/hello
```

**Expected Response Headers:**
```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST
Access-Control-Allow-Headers: *
```

**Verification:**
- [ ] Status code: 200 OK
- [ ] Access-Control-Allow-Origin header present
- [ ] Access-Control-Allow-Methods header present
- [ ] Browser can make cross-origin requests

**✅ PASS** if CORS headers present

---

### Test Case 9: ✅ Response Caching

**Purpose**: Verify response caching works (60 seconds)

**Steps:**
1. Make first request (cache miss)
2. Make second request within 60 seconds (cache hit)
3. Wait 60 seconds
4. Make third request (cache miss)

**Request 1:**
```bash
curl -v -H "Ocp-Apim-Subscription-Key: <ios-key>" \
  https://apim-aks-demo.azure-api.net/api/hello
```

**Expected Response 1:**
```
HTTP/1.1 200 OK
X-Cache: Miss
```

**Request 2 (within 60 seconds):**
```bash
curl -v -H "Ocp-Apim-Subscription-Key: <ios-key>" \
  https://apim-aks-demo.azure-api.net/api/hello
```

**Expected Response 2:**
```
HTTP/1.1 200 OK
X-Cache: Hit
```

**Verification:**
- [ ] First request: X-Cache: Miss
- [ ] Second request: X-Cache: Hit
- [ ] Response time faster on cache hit
- [ ] After 60 seconds, cache miss again

**✅ PASS** if caching works

---

### Test Case 10: ✅ Application Insights Logging

**Purpose**: Verify requests are logged to Application Insights

**Steps:**
1. Make request with subscription key
2. Check Application Insights

**Request:**
```bash
curl -H "Ocp-Apim-Subscription-Key: <ios-key>" \
  https://apim-aks-demo.azure-api.net/api/hello
```

**Verification in Application Insights:**
1. Go to Application Insights: `appi-aks-demo`
2. Click **"Logs"**
3. Run query:
```kusto
requests
| where timestamp > ago(5m)
| where url contains "hello"
| project timestamp, name, resultCode, duration, customDimensions
```

**Expected Results:**
- [ ] Request appears in logs
- [ ] Result code: 200
- [ ] Duration logged
- [ ] Custom dimensions include subscription info

**✅ PASS** if request logged

---

### Test Case 11: ✅ Developer Portal Access

**Purpose**: Verify mobile developers can access developer portal

**Steps:**
1. Get developer portal URL
2. Access portal
3. View API documentation

**Steps:**
1. Go to APIM → **"Developer portal"** → **"Portal overview"**
2. Copy **Developer portal URL**
3. Open in browser

**Verification:**
- [ ] Portal loads successfully
- [ ] APIs are listed
- [ ] Documentation is visible
- [ ] Try it console works
- [ ] Subscription keys can be viewed

**✅ PASS** if portal accessible

---

### Test Case 12: ✅ Multiple Concurrent Requests

**Purpose**: Verify API handles concurrent requests

**Steps:**
1. Make 10 concurrent requests

**Request:**
```bash
# Make 10 concurrent requests
for i in {1..10}; do
  curl -H "Ocp-Apim-Subscription-Key: <ios-key>" \
    https://apim-aks-demo.azure-api.net/api/hello &
done
wait
```

**Expected Response:**
- All 10 requests return 200 OK
- No timeouts
- No errors

**Verification:**
- [ ] All requests succeed
- [ ] Response times consistent
- [ ] No 500 errors
- [ ] AKS pods handle load

**✅ PASS** if all requests succeed

---

### Test Case 13: ✅ VNet Connectivity (Premium Tier Only)

**Purpose**: Verify APIM can reach internal AGIC via VNet

**Steps:**
1. Check APIM VNet integration status
2. Test connectivity

**Verification:**
1. Go to APIM → **"Virtual network"**
2. Status should be: `Connected`
3. Make API request
4. Check it reaches AKS pods

**Request:**
```bash
curl -H "Ocp-Apim-Subscription-Key: <ios-key>" \
  https://apim-aks-demo.azure-api.net/api/hello
```

**Verification:**
- [ ] APIM VNet status: Connected
- [ ] Request reaches internal AGIC (10.0.2.4)
- [ ] Response from AKS pod
- [ ] No public IP exposure

**✅ PASS** if VNet connectivity works

---

### Test Case 14: ❌ Wrong HTTP Method

**Purpose**: Verify API rejects unsupported HTTP methods

**Steps:**
1. Make POST request (if only GET is configured)

**Request:**
```bash
curl -X POST -H "Ocp-Apim-Subscription-Key: <ios-key>" \
  https://apim-aks-demo.azure-api.net/api/hello
```

**Expected Response:**
```
HTTP/1.1 405 Method Not Allowed
Content-Type: application/json

{
  "statusCode": 405,
  "message": "Method not allowed"
}
```

**Verification:**
- [ ] Status code: 405 Method Not Allowed
- [ ] Only configured methods work

**✅ PASS** if wrong method rejected

---

### Test Case 15: ✅ Health Check

**Purpose**: Verify APIM and backend are healthy

**Steps:**
1. Check APIM health
2. Check backend health

**APIM Health:**
1. Go to APIM → **"Overview"**
2. Check **Status**: Should be `Online`

**Backend Health:**
```bash
# Check AKS pods
kubectl get pods
# All pods should be Running

# Check AGIC
kubectl get ingress
# Should show ADDRESS
```

**Verification:**
- [ ] APIM status: Online
- [ ] AKS pods: Running
- [ ] AGIC: Healthy
- [ ] API responds to requests

**✅ PASS** if all components healthy

---

## Part 11: Test Results Summary

### Expected Test Results

| Test Case | Expected Result | Status |
|-----------|----------------|--------|
| 1. Valid iOS Key | 200 OK | ✅ PASS |
| 2. Valid Android Key | 200 OK | ✅ PASS |
| 3. Missing Key | 401 Unauthorized | ✅ PASS |
| 4. Invalid Key | 401 Unauthorized | ✅ PASS |
| 5. Suspended Subscription | 403 Forbidden | ✅ PASS |
| 6. Rate Limit Exceeded | 429 Too Many Requests | ✅ PASS |
| 7. Quota Exceeded | 403 Forbidden | ✅ PASS |
| 8. CORS Headers | Headers present | ✅ PASS |
| 9. Response Caching | Cache hit/miss | ✅ PASS |
| 10. App Insights Logging | Logs present | ✅ PASS |
| 11. Developer Portal | Portal accessible | ✅ PASS |
| 12. Concurrent Requests | All succeed | ✅ PASS |
| 13. VNet Connectivity | Connected | ✅ PASS |
| 14. Wrong HTTP Method | 405 Not Allowed | ✅ PASS |
| 15. Health Check | All healthy | ✅ PASS |

### Test Execution Checklist

**Before Testing:**
- [ ] APIM instance created and online
- [ ] API configured in APIM
- [ ] Subscriptions created (iOS, Android)
- [ ] Policies applied (rate limit, quota, CORS)
- [ ] Application Insights connected
- [ ] AKS cluster running
- [ ] Internal AGIC healthy

**During Testing:**
- [ ] Run all 15 test cases
- [ ] Document results
- [ ] Take screenshots of failures
- [ ] Check Application Insights logs

**After Testing:**
- [ ] All tests pass
- [ ] No errors in logs
- [ ] Performance acceptable
- [ ] Ready for mobile developers

---

## Part 12: Verification and Confirmation

### Final Verification Steps

#### 1. Infrastructure Verification

```bash
# Check APIM status
az apim show --name apim-aks-demo --resource-group rg-aks-demo --query provisioningState

# Expected: "Succeeded"

# Check AKS status
az aks show --name aks-cluster --resource-group rg-aks-demo --query provisioningState

# Expected: "Succeeded"

# Check pods
kubectl get pods

# Expected: All Running

# Check ingress
kubectl get ingress

# Expected: ADDRESS assigned
```

#### 2. API Verification

```bash
# Test with valid key
curl -H "Ocp-Apim-Subscription-Key: <key>" \
  https://apim-aks-demo.azure-api.net/api/hello

# Expected: 200 OK with JSON response

# Test without key
curl https://apim-aks-demo.azure-api.net/api/hello

# Expected: 401 Unauthorized
```

#### 3. Policy Verification

**Check in Portal:**
1. Go to APIM → **"APIs"** → **"Hello World API"**
2. Click **"All operations"**
3. Verify policies:
   - [ ] Rate limit: 100 calls/min
   - [ ] Quota: 10,000 calls/day
   - [ ] CORS: Enabled
   - [ ] Caching: 60 seconds

#### 4. Monitoring Verification

**Application Insights:**
1. Go to Application Insights: `appi-aks-demo`
2. Click **"Live Metrics"**
3. Make API request
4. Verify request appears in real-time

**APIM Analytics:**
1. Go to APIM → **"Analytics"**
2. Verify data:
   - [ ] Request count
   - [ ] Response times
   - [ ] Error rates
   - [ ] Subscription usage

#### 5. Security Verification

**Checklist:**
- [ ] Subscription keys required
- [ ] Invalid keys rejected
- [ ] Rate limiting works
- [ ] Quota enforcement works
- [ ] CORS configured
- [ ] HTTPS only (no HTTP)
- [ ] Internal AGIC (no public IP)
- [ ] VNet isolation (Premium tier)

#### 6. Mobile Developer Readiness

**Provide to mobile developers:**
- [ ] API endpoint URL
- [ ] Subscription keys (iOS, Android)
- [ ] Header name: `Ocp-Apim-Subscription-Key`
- [ ] Developer portal URL
- [ ] API documentation
- [ ] Code examples (Swift, Kotlin)
- [ ] Rate limits and quotas
- [ ] Support contact

---

## Part 13: Confirmation Checklist

### ✅ Complete Deployment Checklist

**Infrastructure:**
- [ ] Resource group created: `rg-aks-demo`
- [ ] VNet created: `vnet-aks` (10.0.0.0/16)
- [ ] Subnets created:
  - [ ] subnet-aks (10.0.1.0/24)
  - [ ] subnet-appgw (10.0.2.0/24)
  - [ ] subnet-apim (10.0.3.0/24) - Premium only
- [ ] AKS cluster running
- [ ] Internal AGIC deployed (10.0.2.4)
- [ ] APIM instance created: `apim-aks-demo`
- [ ] Application Insights created: `appi-aks-demo`

**APIM Configuration:**
- [ ] API created: `Hello World API`
- [ ] Operation added: `GET /hello`
- [ ] Product created: `Mobile Apps`
- [ ] Subscriptions created:
  - [ ] iOS App Subscription
  - [ ] Android App Subscription
- [ ] Policies configured:
  - [ ] Rate limiting (100/min)
  - [ ] Quota (10,000/day)
  - [ ] CORS
  - [ ] Caching (60 sec)
- [ ] VNet integration (Premium tier)
- [ ] Application Insights connected
- [ ] Developer portal published

**Testing:**
- [ ] All 15 test cases executed
- [ ] All tests passed
- [ ] No errors in logs
- [ ] Performance acceptable (<500ms)

**Documentation:**
- [ ] API documentation complete
- [ ] Mobile developer guide ready
- [ ] Code examples provided
- [ ] Support process defined

**Security:**
- [ ] Subscription keys required
- [ ] Rate limiting enforced
- [ ] Quota enforced
- [ ] HTTPS only
- [ ] Internal AGIC (no public IP)
- [ ] Monitoring enabled

**Ready for Production:**
- [ ] All tests pass
- [ ] Monitoring configured
- [ ] Alerts set up (optional)
- [ ] Backup plan defined
- [ ] Rollback plan defined
- [ ] Mobile developers notified

---

### 🎯 Success Criteria

**Your deployment is successful if:**

1. ✅ APIM instance is online and accessible
2. ✅ API responds with valid subscription key (200 OK)
3. ✅ API rejects requests without key (401)
4. ✅ API rejects requests with invalid key (401)
5. ✅ Rate limiting works (429 after 100 requests)
6. ✅ Quota enforcement works (403 after limit)
7. ✅ CORS headers present
8. ✅ Response caching works
9. ✅ Application Insights logs requests
10. ✅ Developer portal accessible
11. ✅ Internal AGIC reachable from APIM
12. ✅ AKS pods healthy and responding
13. ✅ No public IP on AGIC
14. ✅ VNet integration working (Premium tier)
15. ✅ Mobile developers have all information

**If all criteria met: 🎉 DEPLOYMENT SUCCESSFUL!**

---

### Step 1: Add Custom Domain

1. In APIM, click **"Custom domains"**
2. Click **"+ Add"**
3. Fill in:
   - **Type**: `Gateway`
   - **Hostname**: `api.yourdomain.com`
   - **Certificate**: Upload or use Key Vault
4. Click **"Add"**

### Step 2: Update DNS

1. Go to your DNS provider
2. Add CNAME record:
   - **Name**: `api`
   - **Value**: `apim-aks-demo.azure-api.net`
   - **TTL**: `3600`

**✅ Result**: API accessible via custom domain

---

## Part 11: Enable Application Insights

### Step 1: Create Application Insights

1. Search for **"Application Insights"**
2. Click **"+ Create"**
3. Fill in:
   - **Resource group**: `rg-aks-demo`
   - **Name**: `appi-aks-demo`
   - **Region**: `East US`
4. Click **"Review + create"** → **"Create"**

### Step 2: Connect to APIM

1. Go to APIM instance
2. In left menu, click **"Application Insights"**
3. Click **"+ Add"**
4. Select **"appi-aks-demo"**
5. Click **"Create"**

### Step 3: Enable Logging

1. Go to **"APIs"** → **"Hello World API"**
2. Click **"Settings"** tab
3. Scroll to **"Diagnostics Logs"**
4. **Application Insights**: ✅ Enabled
5. **Destination**: Select `appi-aks-demo`
6. **Sampling**: `100%` (for testing)
7. Click **"Save"**

**✅ Result**: API calls logged to Application Insights

---

## Part 12: Monitor API Usage

### Step 1: View Analytics

1. In APIM, click **"Analytics"**
2. View:
   - **Timeline**: Requests over time
   - **Geography**: Requests by location
   - **APIs**: Most called APIs
   - **Operations**: Most called operations
   - **Products**: Usage by product
   - **Subscriptions**: Usage by subscription

### Step 2: View in Application Insights

1. Go to Application Insights: `appi-aks-demo`
2. Click **"Logs"**
3. Run query:

```kusto
requests
| where timestamp > ago(1h)
| where url contains "hello"
| project timestamp, name, resultCode, duration
| order by timestamp desc
```

**✅ Result**: API usage monitored

---

## Part 13: Configure Developer Portal

### Step 1: Enable Developer Portal

1. In APIM, click **"Developer portal"** (top menu)
2. Click **"Publish"**
3. Click **"Publish website"**

**⏱️ Wait**: 2-3 minutes

### Step 2: Access Developer Portal

1. Click **"Developer portal"** → **"Portal overview"**
2. Click **"Developer portal URL"**
3. Portal opens in new tab

### Step 3: Customize Portal (Optional)

1. In APIM, click **"Developer portal"** → **"Portal overview"**
2. Click **"Edit"**
3. Customize:
   - Logo
   - Colors
   - Content
   - Pages
4. Click **"Publish"**

**✅ Result**: Developer portal available for mobile developers

---

## Part 14: Share with Mobile Developers

### What to Give Mobile Developers:

**1. API Endpoint:**
```
https://apim-aks-demo.azure-api.net/api/hello
```

**2. Subscription Keys:**
```
iOS: abc123def456... (Primary key from iOS subscription)
Android: xyz789uvw012... (Primary key from Android subscription)
```

**3. Header Name:**
```
Ocp-Apim-Subscription-Key
```

**4. Developer Portal:**
```
https://apim-aks-demo.developer.azure-api.net
```

**5. Example Code:**

**iOS (Swift):**
```swift
let url = URL(string: "https://apim-aks-demo.azure-api.net/api/hello")!
var request = URLRequest(url: url)
request.setValue("abc123def456...", forHTTPHeaderField: "Ocp-Apim-Subscription-Key")

URLSession.shared.dataTask(with: request) { data, response, error in
    // Handle response
}.resume()
```

**Android (Kotlin):**
```kotlin
val request = Request.Builder()
    .url("https://apim-aks-demo.azure-api.net/api/hello")
    .addHeader("Ocp-Apim-Subscription-Key", "xyz789uvw012...")
    .build()
```

**✅ Result**: Mobile developers have everything they need

---

## Part 15: Security Best Practices

### Step 1: Enable IP Filtering (Optional)

1. In APIM, click **"APIs"** → **"Hello World API"**
2. Click **"All operations"**
3. In policy editor, add:

```xml
<inbound>
    <base />
    <ip-filter action="allow">
        <address>203.0.113.0/24</address>
    </ip-filter>
</inbound>
```

### Step 2: Enable OAuth 2.0 (Advanced)

1. In APIM, click **"OAuth 2.0 + OpenID Connect"**
2. Click **"+ Add"**
3. Configure with Azure AD or other provider

### Step 3: Enable Mutual TLS (Advanced)

1. In APIM, click **"Security"** → **"Client certificates"**
2. Upload client certificate
3. Require certificate in API policy

**✅ Result**: Enhanced security configured

---

## Part 16: Comparison - APIM vs Front Door

| Feature | Azure APIM | Azure Front Door |
|---------|-----------|------------------|
| **Primary Purpose** | API Management | CDN + WAF |
| **Subscription Keys** | ✅ Built-in | ❌ Manual |
| **Rate Limiting** | ✅ Built-in | ⚠️ Via WAF rules |
| **API Policies** | ✅ Rich policies | ❌ Limited |
| **Developer Portal** | ✅ Built-in | ❌ None |
| **Analytics** | ✅ Detailed | ⚠️ Basic |
| **Caching** | ✅ API-level | ✅ CDN-level |
| **Transformation** | ✅ Request/Response | ❌ None |
| **Versioning** | ✅ Built-in | ❌ Manual |
| **Cost** | $$$ Higher | $$ Lower |
| **Best For** | API management | Content delivery |

---

## Part 17: Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│              Mobile Apps (iOS/Android)                   │
└────────────────────────┬────────────────────────────────┘
                         │
                         │ HTTPS + Subscription Key
                         ↓
┌─────────────────────────────────────────────────────────┐
│         Azure API Management (Public)                    │
│         Gateway: apim-aks-demo.azure-api.net            │
│         - Subscription key validation                    │
│         - Rate limiting (100/min)                        │
│         - Quota (10,000/day)                            │
│         - CORS enabled                                   │
│         - Caching (60 sec)                              │
│         - Analytics & monitoring                         │
└────────────────────────┬────────────────────────────────┘
                         │
                         │ VNet Integration (Premium)
                         │ OR HTTP to internal IP
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
│  │  │  Hello World API                     │     │    │
│  │  │  - 3 pods                            │     │    │
│  │  │  - ClusterIP service                 │     │    │
│  │  └──────────────────────────────────────┘     │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## Part 18: Troubleshooting

### Issue: 401 Unauthorized

**Cause**: Missing or invalid subscription key

**Solution**:
1. Check header name: `Ocp-Apim-Subscription-Key`
2. Verify subscription key is correct
3. Check subscription is active in APIM

### Issue: 500 Internal Server Error

**Cause**: APIM cannot reach internal AGIC

**Solution**:
1. Check VNet integration (Premium tier)
2. Verify AGIC IP address is correct
3. Test connectivity from APIM subnet to AGIC subnet
4. Check NSG rules allow traffic

### Issue: 429 Too Many Requests

**Cause**: Rate limit exceeded

**Solution**:
1. Check rate limit policy (100/min)
2. Increase limit if needed
3. Implement retry logic in mobile app

### Issue: CORS Error

**Cause**: CORS policy not configured

**Solution**:
1. Add CORS policy in APIM
2. Allow origin: `*` or specific domains
3. Allow methods: GET, POST, etc.

---

## Part 19: Cost Estimation

| Resource | Tier | Cost (USD/month) |
|----------|------|------------------|
| APIM Developer | No SLA | ~$50 |
| APIM Standard | 99.95% SLA | ~$700 |
| APIM Premium | 99.99% SLA + VNet | ~$2,800 |
| Application Insights | Standard | ~$10 |
| AKS (from Day 14) | 2 nodes | ~$140 |
| AGIC (from Day 14) | Standard V2 | ~$125 |
| **Total (Developer)** | | **~$325/month** |
| **Total (Premium)** | | **~$3,075/month** |

---

## Part 20: Verification Checklist

### Infrastructure
- [ ] APIM instance created
- [ ] VNet integration configured (Premium) or HTTP access (Developer)
- [ ] API created in APIM
- [ ] Operations added
- [ ] Subscription keys created

### Policies
- [ ] Rate limiting enabled (100/min)
- [ ] Quota enabled (10,000/day)
- [ ] CORS configured
- [ ] Caching enabled (optional)

### Security
- [ ] Subscription keys required
- [ ] Products configured
- [ ] Subscriptions approved
- [ ] IP filtering (optional)

### Monitoring
- [ ] Application Insights connected
- [ ] Logging enabled
- [ ] Analytics working
- [ ] Alerts configured (optional)

### Testing
- [ ] API accessible via APIM gateway
- [ ] Subscription key validation working
- [ ] Rate limiting working
- [ ] Mobile apps can call API

---

## Summary

You've successfully exposed your internal AKS API via Azure API Management!

**What we built:**
- Azure APIM instance with subscription keys
- API policies (rate limiting, CORS, caching)
- VNet integration to internal AGIC (Premium) or HTTP access (Developer)
- Developer portal for mobile developers
- Application Insights monitoring
- Complete security and analytics

**Architecture:**
```
Mobile Apps → APIM (Public) → VNet/HTTP → Internal AGIC → AKS → API
```

**Key benefits of APIM over Front Door:**
- ✅ Built-in subscription key management
- ✅ Rich API policies (rate limiting, transformation)
- ✅ Developer portal
- ✅ Detailed analytics
- ✅ API versioning and products

**Next steps:**
- Configure OAuth 2.0 for user authentication
- Add more APIs to APIM
- Implement API versioning
- Set up alerts and monitoring
- Deploy to production with Premium tier

Great job! You now have enterprise-grade API management! 🚀
