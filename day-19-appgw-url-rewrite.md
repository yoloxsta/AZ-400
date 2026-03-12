# Day 19: Application Gateway URL Rewrite - Multiple Paths to Same Backend

## What You'll Learn

This guide shows you how to create a new Application Gateway with URL rewrite to route multiple paths to the same backend:
- ✅ `/nginx` → rewrites to `/` on backend
- ✅ `/yolox` → rewrites to `/` on backend
- ✅ Both paths show the same nginx default page
- ✅ All via Azure Portal (step-by-step)

## Scenario

**You have:**
- 1 VM with nginx default page
- VM accessible at: `http://vm-ip/` (shows nginx page)

**You want:**
- `http://appgw-ip/nginx` → shows nginx page
- `http://appgw-ip/yolox` → shows nginx page
- Both paths rewrite to `/` on backend

## Architecture

```
Client Request: http://appgw-ip/nginx
    ↓
Application Gateway
    ↓
URL Rewrite: /nginx → /
    ↓
Backend VM: http://vm-ip/
    ↓
nginx default page

Client Request: http://appgw-ip/yolox
    ↓
Application Gateway
    ↓
URL Rewrite: /yolox → /
    ↓
Backend VM: http://vm-ip/
    ↓
nginx default page (same!)
```

---

## Prerequisites

- ✅ Azure subscription
- ✅ VM already created with nginx
- ✅ VM accessible at `http://vm-ip/`
- ✅ VM shows nginx default page

**Verify your VM:**
1. Get VM public IP
2. Open browser: `http://vm-ip/`
3. Should see nginx welcome page

---

## Part 1: Gather VM Information

Before creating Application Gateway, collect VM details.

### Step 1: Get VM Details

1. Go to **"Virtual machines"**
2. Click on your VM
3. Note down:
   - **Resource group**: (e.g., `rg-vm-demo`)
   - **Virtual network**: (e.g., `vnet-vm`)
   - **Subnet**: (e.g., `subnet-vms`)
   - **Private IP**: (e.g., `10.0.1.4`)
   - **Public IP**: (e.g., `20.x.x.x`)

### Step 2: Verify nginx is Running

```bash
# Test VM directly
curl http://<vm-public-ip>/

# Expected: nginx default welcome page HTML
```

**✅ Result**: VM information collected

---

## Part 2: Create Application Gateway Subnet

Application Gateway needs its own dedicated subnet.

### Step 1: Navigate to Virtual Network

1. Go to **"Virtual networks"**
2. Click on your VM's VNet (e.g., `vnet-vm`)

### Step 2: Add Subnet for Application Gateway

1. In left menu, click **"Subnets"**
2. Click **"+ Subnet"**

**Subnet Configuration:**
- **Name**: `subnet-appgw`
- **Subnet address range**: Choose available range (e.g., `10.0.2.0/24`)
  - Must not overlap with existing subnets
  - Must have at least /24 (256 IPs)
- **NAT Gateway**: `None`
- **Network security group**: `None`
- **Route table**: `None`
- Click **"Save"**

**✅ Result**: Application Gateway subnet created

---

## Part 3: Create Application Gateway

### Step 1: Navigate to Application Gateway

1. Search for **"Application gateways"**
2. Click **"+ Create"**

### Step 2: Basics Tab

1. **Subscription**: Your subscription
2. **Resource group**: Same as your VM (e.g., `rg-vm-demo`)
3. **Application gateway name**: `appgw-rewrite-demo`
4. **Region**: Same as your VM (e.g., `East US`)
5. **Tier**: `Standard V2`
6. **Enable autoscaling**: `No`
7. **Instance count**: `2`
8. **Availability zone**: `None`
9. **HTTP2**: `Enabled`
10. **Virtual network**: Select your VM's VNet
11. **Subnet**: Select `subnet-appgw` (created in Part 2)
12. Click **"Next: Frontends"**

### Step 3: Frontends Tab

1. **Frontend IP address type**: `Public`
2. **Public IP address**: Click **"Add new"**
   - **Name**: `appgw-public-ip`
   - **SKU**: `Standard`
   - **Assignment**: `Static`
   - Click **"OK"**
3. Click **"Next: Backends"**

### Step 4: Backends Tab

1. Click **"+ Add a backend pool"**

**Backend Pool:**
- **Name**: `pool-nginx`
- **Add backend pool without targets**: `No`
- **Target type**: `Virtual machine`
- **Target**: Select your VM's network interface
- Click **"Add"**

2. Click **"Next: Configuration"**

### Step 5: Configuration Tab - Create Basic Routing Rule

1. Click **"+ Add a routing rule"**

**Routing Rule:**
- **Rule name**: `rule-basic`
- **Priority**: `100`

**Listener Tab:**
- **Listener name**: `listener-http`
- **Frontend IP**: `Public`
- **Protocol**: `HTTP`
- **Port**: `80`
- **Listener type**: `Basic`
- **Error page url**: `No`
- Click **"Backend targets"** tab

**Backend targets Tab:**
- **Target type**: `Backend pool`
- **Backend target**: `pool-nginx`
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

3. Click **"Next: Tags"** (skip)
4. Click **"Next: Review + create"**
5. Click **"Create"**

**⏱️ Wait**: 15-20 minutes for Application Gateway to deploy

**✅ Result**: Application Gateway created with basic routing

---

## Part 4: Test Basic Access

### Step 1: Get Application Gateway Public IP

1. Go to **"Application gateways"**
2. Click on **"appgw-rewrite-demo"**
3. In **"Overview"**, copy **"Frontend public IP address"**

Example: `20.x.x.x`

### Step 2: Test Root Path

1. Open browser
2. Go to: `http://<appgw-public-ip>/`
3. **Expected**: nginx default welcome page

**✅ Result**: Basic routing working

---

## Part 5: Create URL Rewrite Set

Now we'll create rewrites for `/nginx` and `/yolox` to both rewrite to `/`.

### Step 1: Navigate to Rewrites

1. Go to **"Application gateways"** → **"appgw-rewrite-demo"**
2. In left menu, click **"Rewrites"**
3. Click **"+ Rewrite set"**

### Step 2: Create Rewrite Set

**Rewrite Set:**
- **Name**: `rewrite-to-root`

**Associated routing rules:**

**IMPORTANT - Critical Step for Path-Based Routing!**

When you see the routing rules list, you'll see 3 options:
- `test-rule` - Path-based rule (Default rewrite setting)
- `soetintaung` - Path-based rule (this is your `/nginx` path)
- `azureuser` - Path-based rule (this is your `/yolox` path)

**You MUST select ALL 3 checkboxes:**
- ☑️ **test-rule** (main routing rule)
- ☑️ **soetintaung** (`/nginx` path target)
- ☑️ **azureuser** (`/yolox` path target)

**Why select all 3?**
- ❌ Selecting only `test-rule` → Only `/nginx` works, `/yolox` fails
- ✅ Selecting all 3 → Both `/nginx` and `/yolox` work correctly

**This is because path-based routing requires explicit association with each path target, not just the main rule.**

Click **"Next: Rewrite rule configuration"**

### Step 3: Add First Rewrite Rule (/nginx → /)

1. Click **"+ Add rewrite rule"**

**Rewrite Rule 1:**
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

### Step 4: Add Second Rewrite Rule (/yolox → /)

1. Click **"+ Add rewrite rule"** again

**Rewrite Rule 2:**
- **Rewrite rule name**: `rule-yolox-to-root`
- **Rule sequence**: `200`

**Conditions:**
- Click **"+ Add condition"**
- **Type of variable to check**: `Server variable`
- **Server variable**: `uri_path`
- **Case-sensitive**: `No`
- **Operator**: `equal (=)`
- **Pattern to match**: `/yolox`
- Click **"OK"**

**Actions:**
- Click **"+ Add action"**
- **Rewrite type**: `URL`
- **Action type**: `Set`
- **Components**: `URL path`
- **URL path value**: `/`
- Click **"OK"**

2. Click **"Create"**

**⏱️ Wait**: 2-3 minutes

**✅ Result**: Rewrite set created with 2 rules

---

## Part 6: Associate Rewrite Set with Routing Rule

Now we need to link the rewrite set to our routing rule.

### Step 1: Edit Routing Rule

1. Go to **"Rules"**
2. Click on **"rule-basic"**
3. Click **"Backend targets"** tab

### Step 2: Enable Path-Based Routing

**Important:** You must enable path-based routing to use rewrites on specific paths.

1. **Check the box**: ☑️ **"Add multiple targets to create a path-based rule"**
   - This checkbox appears when editing an existing rule
   - It won't appear when creating a new rule

### Step 3: Add Path for /nginx

After checking the box, you'll see path configuration options.

**Path 1:**
- **Path**: `/nginx`
- **Target name**: `target-nginx`
- **Backend target**: `pool-nginx`
- **Backend settings**: `http-settings`
- **Rewrite set**: Select `rewrite-to-root`

### Step 4: Add Path for /yolox

1. Click **"Add new path"**

**Path 2:**
- **Path**: `/yolox`
- **Target name**: `target-yolox`
- **Backend target**: `pool-nginx`
- **Backend settings**: `http-settings`
- **Rewrite set**: Select `rewrite-to-root`

### Step 5: Configure Default Backend

**Default backend target** (for paths not matching /nginx or /yolox):
- **Backend target**: `pool-nginx`
- **Backend settings**: `http-settings`
- **Rewrite set**: `None` (no rewrite for default path)

### Step 6: Save Configuration

1. Click **"Update"**
2. **⏱️ Wait**: 2-3 minutes for configuration to apply

**✅ Result**: Rewrite set associated with routing rule

---

## Part 7: Test URL Rewrites

### Test Case 1: Access /nginx

1. Open browser
2. Go to: `http://<appgw-public-ip>/nginx`
3. **Expected**: nginx default welcome page

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
Sends to backend: http://vm-ip/
    ↓
nginx serves: Default welcome page
```

**✅ Expected Result**: nginx default page displayed

### Test Case 2: Access /yolox

1. Go to: `http://<appgw-public-ip>/yolox`
2. **Expected**: nginx default welcome page (same as /nginx!)

**What happened:**
```
Client → http://appgw-ip/yolox
    ↓
Application Gateway receives: /yolox
    ↓
Rewrite rule matches: /yolox
    ↓
Rewrites URL to: /
    ↓
Sends to backend: http://vm-ip/
    ↓
nginx serves: Default welcome page
```

**✅ Expected Result**: nginx default page displayed (same content)

### Test Case 3: Access Root Path

1. Go to: `http://<appgw-public-ip>/`
2. **Expected**: nginx default welcome page (no rewrite needed)

**What happened:**
```
Client → http://appgw-ip/
    ↓
Application Gateway receives: /
    ↓
No rewrite rule matches (default path)
    ↓
Sends to backend: http://vm-ip/
    ↓
nginx serves: Default welcome page
```

**✅ Expected Result**: nginx default page displayed

### Test Case 4: Access Other Path

1. Go to: `http://<appgw-public-ip>/other`
2. **Expected**: 404 error (path doesn't exist on backend)

**What happened:**
```
Client → http://appgw-ip/other
    ↓
Application Gateway receives: /other
    ↓
No rewrite rule matches
    ↓
Sends to backend: http://vm-ip/other
    ↓
nginx returns: 404 Not Found
```

**✅ Expected Result**: 404 error

---

## Part 8: Verify Configuration

### Step 1: Check Backend Health

1. Go to **"Application gateways"** → **"appgw-rewrite-demo"**
2. Click **"Backend health"**
3. Verify your VM shows **"Healthy"**

**Expected:**
```
pool-nginx
  └─ vm-nginx: Healthy ✅
```

### Step 2: Check Rewrite Set

1. Go to **"Rewrites"**
2. Click on **"rewrite-to-root"**
3. Verify 2 rules exist:
   - `rule-nginx-to-root` (sequence 100)
   - `rule-yolox-to-root` (sequence 200)

### Step 3: Check Routing Rule

1. Go to **"Rules"**
2. Click on **"rule-basic"**
3. Verify path-based routing is enabled
4. Verify 2 paths configured:
   - `/nginx` → pool-nginx (with rewrite)
   - `/yolox` → pool-nginx (with rewrite)

**✅ Result**: All configuration verified

---

## Part 9: Test with curl

### Test All Paths

```bash
# Get Application Gateway IP
APPGW_IP="<your-appgw-public-ip>"

# Test /nginx
echo "Testing /nginx:"
curl http://$APPGW_IP/nginx | grep -i "welcome to nginx"

# Test /yolox
echo "Testing /yolox:"
curl http://$APPGW_IP/yolox | grep -i "welcome to nginx"

# Test root /
echo "Testing /:"
curl http://$APPGW_IP/ | grep -i "welcome to nginx"

# Test non-existent path
echo "Testing /other (should fail):"
curl -I http://$APPGW_IP/other
```

**Expected Output:**
```
Testing /nginx:
<title>Welcome to nginx!</title>

Testing /yolox:
<title>Welcome to nginx!</title>

Testing /:
<title>Welcome to nginx!</title>

Testing /other (should fail):
HTTP/1.1 404 Not Found
```

**✅ Result**: All tests passed

---

## Part 10: Verify Backend Receives Rewritten URL

Let's verify that the backend actually receives `/` and not `/nginx` or `/yolox`.

### Step 1: SSH to VM

```bash
ssh azureuser@<vm-public-ip>
```

### Step 2: Check nginx Access Logs

```bash
# Watch nginx access logs in real-time
sudo tail -f /var/log/nginx/access.log
```

### Step 3: Make Requests from Another Terminal

Open another terminal and make requests:

```bash
# Request /nginx
curl http://<appgw-ip>/nginx

# Request /yolox
curl http://<appgw-ip>/yolox
```

### Step 4: Observe Logs

In the SSH terminal watching logs, you should see:

```
10.0.2.x - - [11/Mar/2026:10:30:00 +0000] "GET / HTTP/1.1" 200 615
10.0.2.x - - [11/Mar/2026:10:30:05 +0000] "GET / HTTP/1.1" 200 615
```

**Notice:**
- Logs show `GET /` (not `GET /nginx` or `GET /yolox`)
- This proves the URL rewrite is working!
- Backend receives `/` for both `/nginx` and `/yolox` requests

**✅ Result**: Backend receives rewritten URL

---

## Part 11: Add More Rewrite Rules (Optional)

You can add more paths that rewrite to `/`.

### Example: Add /app Path

1. Go to **"Rewrites"** → **"rewrite-to-root"**
2. Click **"+ Add rewrite rule"**

**Rewrite Rule 3:**
- **Rewrite rule name**: `rule-app-to-root`
- **Rule sequence**: `300`

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

### Add Path to Routing Rule

1. Go to **"Rules"** → **"rule-basic"**
2. Click **"Backend targets"** tab
3. Click **"Add new path"**

**Path 3:**
- **Path**: `/app`
- **Target name**: `target-app`
- **Backend target**: `pool-nginx`
- **Backend settings**: `http-settings`
- **Rewrite set**: `rewrite-to-root`

4. Click **"Update"**

**Now you have 3 paths all showing the same nginx page:**
- `http://appgw-ip/nginx` → `/`
- `http://appgw-ip/yolox` → `/`
- `http://appgw-ip/app` → `/`

---

## Part 12: Understanding the Configuration

### Visual Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Internet                             │
│                    (Client Browser)                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│           Application Gateway (Public IP)                    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Listener: listener-http (Port 80)                 │    │
│  └────────────────────┬───────────────────────────────┘    │
│                       │                                      │
│  ┌────────────────────▼───────────────────────────────┐    │
│  │  Routing Rule: rule-basic (Path-based)             │    │
│  │                                                     │    │
│  │  ┌─────────────────────────────────────────────┐  │    │
│  │  │ Path: /nginx                                │  │    │
│  │  │ Target: soetintaung                         │  │    │
│  │  │ Rewrite Set: rewrite-to-root ✅             │  │    │
│  │  └─────────────────────────────────────────────┘  │    │
│  │                                                     │    │
│  │  ┌─────────────────────────────────────────────┐  │    │
│  │  │ Path: /yolox                                │  │    │
│  │  │ Target: azureuser                           │  │    │
│  │  │ Rewrite Set: rewrite-to-root ✅             │  │    │
│  │  └─────────────────────────────────────────────┘  │    │
│  │                                                     │    │
│  │  ┌─────────────────────────────────────────────┐  │    │
│  │  │ Default Path: /                             │  │    │
│  │  │ No rewrite                                  │  │    │
│  │  └─────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────┘    │
│                       │                                      │
│  ┌────────────────────▼───────────────────────────────┐    │
│  │  Rewrite Set: rewrite-to-root                      │    │
│  │                                                     │    │
│  │  Rule 1: /nginx → /                                │    │
│  │  Rule 2: /yolox → /                                │    │
│  └─────────────────────────────────────────────────────┘    │
│                       │                                      │
│  ┌────────────────────▼───────────────────────────────┐    │
│  │  Backend Pool: pool-nginx                          │    │
│  └─────────────────────────────────────────────────────┘    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                    VM with nginx                             │
│              (Receives request for /)                        │
│                                                              │
│  /var/www/html/index.html (nginx default page)              │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow for /nginx

```
1. Client Request
   http://appgw-ip/nginx
   ↓
2. Application Gateway
   Listener: listener-http (Port 80)
   ↓
3. Routing Rule: rule-basic
   Matches path: /nginx
   Target: soetintaung
   ↓
4. Rewrite Set: rewrite-to-root
   Associated with: soetintaung ✅
   ↓
5. Rewrite Rule: rule-nginx-to-root
   Condition: uri_path = /nginx ✅ MATCH
   Action: Rewrite to /
   ↓
6. Modified Request
   http://vm-ip/
   ↓
7. Backend Pool: pool-nginx
   ↓
8. VM nginx
   Serves: /var/www/html/index.html
   ↓
9. Response
   nginx default welcome page
```

### Request Flow for /yolox

```
1. Client Request
   http://appgw-ip/yolox
   ↓
2. Application Gateway
   Listener: listener-http (Port 80)
   ↓
3. Routing Rule: rule-basic
   Matches path: /yolox
   Target: azureuser
   ↓
4. Rewrite Set: rewrite-to-root
   Associated with: azureuser ✅
   ↓
5. Rewrite Rule: rule-yolox-to-root
   Condition: uri_path = /yolox ✅ MATCH
   Action: Rewrite to /
   ↓
6. Modified Request
   http://vm-ip/
   ↓
7. Backend Pool: pool-nginx
   ↓
8. VM nginx
   Serves: /var/www/html/index.html
   ↓
9. Response
   nginx default welcome page (same as /nginx!)
```

### What We Built

```
Application Gateway (appgw-rewrite-demo)
    ↓
Frontend: Public IP (20.x.x.x)
    ↓
Listener: listener-http (Port 80)
    ↓
Routing Rule: rule-basic (Path-based)
    ├─ Path: /nginx → Rewrite to / → pool-nginx
    ├─ Path: /yolox → Rewrite to / → pool-nginx
    └─ Default: / → No rewrite → pool-nginx
    ↓
Rewrite Set: rewrite-to-root
    ├─ Rule 1: /nginx → /
    └─ Rule 2: /yolox → /
    ↓
Backend Pool: pool-nginx
    └─ VM with nginx
    ↓
nginx serves: /var/www/html/index.html
```

### Key Points

1. **Same Backend, Different Paths:**
   - Both `/nginx` and `/yolox` route to same backend
   - Both rewrite to `/`
   - Backend sees identical requests

2. **Rewrite is Invisible to Client:**
   - Client sees: `http://appgw-ip/nginx`
   - Backend receives: `http://vm-ip/`
   - Client doesn't know about rewrite

3. **One Rewrite Set, Multiple Rules:**
   - `rewrite-to-root` contains 2 rules
   - Each rule handles one path
   - Can add more rules easily

4. **Path-Based Routing Required:**
   - Must enable path-based routing
   - Each path can have different rewrite
   - Default path can have no rewrite

### Why This is Useful

**Use Case 1: Friendly URLs**
- Client: `/products` → Backend: `/api/v1/products`
- Client: `/users` → Backend: `/api/v1/users`

**Use Case 2: Multi-Tenant**
- Client: `/tenant1` → Backend: `/` (with header: X-Tenant: tenant1)
- Client: `/tenant2` → Backend: `/` (with header: X-Tenant: tenant2)

**Use Case 3: Legacy Support**
- Client: `/old-path` → Backend: `/new-path`
- Client: `/legacy` → Backend: `/modern`

**Use Case 4: Your Scenario**
- Client: `/nginx` → Backend: `/`
- Client: `/yolox` → Backend: `/`
- Same content, different URLs

---

## Part 13: Troubleshooting

### Issue 1: /nginx Works but /yolox Doesn't Work

**Symptoms:**
- `/nginx` returns nginx page ✅
- `/yolox` returns 404 or error ❌

**Root Cause:**
You only selected `test-rule` when associating the rewrite set, not all 3 path targets.

**Solution:**

1. Go to **"Rewrites"** → **"rewrite-to-root"**
2. Check **"Associated routing rules"**
3. You should see all 3 selected:
   - ☑️ test-rule
   - ☑️ soetintaung (`/nginx`)
   - ☑️ azureuser (`/yolox`)
4. If only `test-rule` is selected, click **"Edit"**
5. Select all 3 checkboxes
6. Click **"Save"**
7. Wait 2-3 minutes
8. Test again

**Why this happens:**
- Path-based routing requires explicit association with each path target
- Selecting only the main rule doesn't automatically apply to all paths
- Each path target needs its own association

**✅ Fix**: Select all 3 routing rules/paths when creating rewrite set

### Issue 2: /nginx Returns 404

**Symptoms:**
- Accessing `/nginx` returns 404
- Root `/` works fine

**Solutions:**

1. **Check path-based routing is enabled:**
   - Go to Rules → rule-basic
   - Verify checkbox is checked: "Add multiple targets to create a path-based rule"

2. **Check path is configured:**
   - Verify `/nginx` path exists in routing rule
   - Check path spelling (case-sensitive if configured)

3. **Check rewrite set is associated:**
   - Verify rewrite set is selected for `/nginx` path
   - Check rewrite set name matches

4. **Wait for configuration to apply:**
   - Changes take 2-3 minutes
   - Refresh browser (clear cache)

### Issue 3: /nginx Shows Different Content

**Symptoms:**
- `/nginx` shows different page than `/`
- Rewrite not working

**Solutions:**

1. **Check rewrite rule condition:**
   - Go to Rewrites → rewrite-to-root
   - Verify pattern matches: `/nginx`
   - Check operator is `equal (=)`

2. **Check rewrite rule action:**
   - Verify URL path value is: `/`
   - Check action type is: `Set`

3. **Check backend logs:**
   ```bash
   ssh azureuser@<vm-ip>
   sudo tail -f /var/log/nginx/access.log
   ```
   - Should show `GET /` not `GET /nginx`

### Issue 4: Both Paths Don't Work

**Symptoms:**
- Neither `/nginx` nor `/yolox` work
- Root `/` works

**Solutions:**

1. **Check Application Gateway status:**
   - Go to Overview
   - Verify Operational state: Running

2. **Check backend health:**
   - Go to Backend health
   - Verify VM is Healthy

3. **Check routing rule priority:**
   - Lower priority number = higher priority
   - Ensure no conflicting rules

4. **Recreate rewrite set:**
   - Delete rewrite set
   - Create new one
   - Re-associate with routing rule

### Issue 5: Configuration Changes Not Applied

**Symptoms:**
- Made changes but still seeing old behavior

**Solutions:**

1. **Wait longer:**
   - Configuration changes take 2-3 minutes
   - Some changes take up to 5 minutes

2. **Clear browser cache:**
   - Use incognito/private mode
   - Or clear browser cache

3. **Check for errors:**
   - Go to Activity log
   - Look for failed operations

4. **Verify changes saved:**
   - Go back to configuration
   - Verify changes are present

---

## Part 14: Cost Breakdown

| Resource | Tier/Size | Cost (USD/month) |
|----------|-----------|------------------|
| Application Gateway V2 | 2 instances | ~$250 |
| Public IP (Static) | Standard | ~$4 |
| VM (existing) | Already running | $0 (no additional cost) |
| VNet | Standard | ~$0 |
| **Total Additional Cost** | | **~$254/month** |

**Note:** This assumes your VM is already running. Application Gateway is the only new cost.

**Cost Optimization:**
- Use Basic tier for dev/test (~$125/month)
- Reduce to 1 instance for testing
- Stop Application Gateway when not in use
- Use autoscaling in production

---

## Part 15: Cleanup

### Delete Application Gateway Only (Keep VM)

If you want to keep your VM but remove Application Gateway:

1. Go to **"Application gateways"**
2. Select **"appgw-rewrite-demo"**
3. Click **"Delete"**
4. Type application gateway name to confirm
5. Click **"Delete"**

**⏱️ Wait**: 10-15 minutes

### Delete Everything

If you want to delete everything:

1. Go to **"Resource groups"**
2. Select your resource group
3. Click **"Delete resource group"**
4. Type resource group name to confirm
5. Click **"Delete"**

**⏱️ Wait**: 15-20 minutes

---

## Summary

You've successfully created Application Gateway with multiple URL rewrites!

**What we built:**
- ✅ New Application Gateway from scratch
- ✅ Connected to existing VM with nginx
- ✅ URL rewrite: `/nginx` → `/`
- ✅ URL rewrite: `/yolox` → `/`
- ✅ Both paths show same nginx page
- ✅ All via Azure Portal

**Architecture:**
```
Internet
    ↓
Application Gateway (Public IP)
    ├─ /nginx → Rewrite to / → VM
    ├─ /yolox → Rewrite to / → VM
    └─ / → No rewrite → VM
    ↓
VM with nginx (shows same page for all)
```

**Key learnings:**
- ✅ Multiple paths can rewrite to same backend path
- ✅ One rewrite set can contain multiple rules
- ✅ Path-based routing must be enabled for rewrites
- ✅ Rewrites are invisible to client
- ✅ Backend sees rewritten URL, not original
- ✅ Same backend can serve multiple friendly URLs


**Testing results:**
- ✅ `http://appgw-ip/nginx` → Shows nginx page
- ✅ `http://appgw-ip/yolox` → Shows nginx page (same!)
- ✅ `http://appgw-ip/` → Shows nginx page
- ✅ Backend logs show `GET /` for all requests
- ✅ URL rewrite working correctly

**Configuration summary:**
- 1 Application Gateway
- 1 Backend pool (pool-nginx)
- 1 Routing rule (rule-basic) with path-based routing
- 1 Rewrite set (rewrite-to-root) with 2 rules
- 2 URL rewrites (/nginx → /, /yolox → /)

**Cost: ~$254/month** (Application Gateway only, VM already running)

**Real-world applications:**
- ✅ Friendly URLs for marketing campaigns
- ✅ Multiple entry points to same application
- ✅ A/B testing with different URLs
- ✅ Regional URLs (e.g., /us, /eu → same backend)
- ✅ Product-specific URLs (e.g., /product1, /product2 → same app)

**Next steps:**
- Add more rewrite rules for additional paths
- Configure SSL/TLS certificates
- Enable WAF for security
- Set up custom health probes
- Configure autoscaling
- Add monitoring and alerts

Great job! You now understand how to create Application Gateway with multiple URL rewrites to the same backend! 🚀

---

## Part 16: Host-Based Routing on Port 80 (Production Style)

Now let's add host-based routing on port 80 so you can access different backends using domain names without port numbers.

**Goal:**
- `http://app1.example.com` → VM 1 (no port number needed!)
- `http://app2.example.com` → VM 2 (no port number needed!)
- `http://appgw-ip/nginx` → Still works (path-based routing)
- `http://appgw-ip/yolox` → Still works (path-based routing)

**All on port 80!**

### Architecture

```
Port 80 (HTTP)
    ├─ Host: app1.example.com → VM 1 (Priority 50)
    ├─ Host: app2.example.com → VM 2 (Priority 60)
    └─ Path-based: /nginx, /yolox → VM (Priority 100)
```

**How it works:**
- Application Gateway checks rules by priority (lower number = higher priority)
- Host-based rules (50, 60) are checked first
- If no host match, falls back to path-based rule (100)

---

### Prerequisites

Before starting, you need:
- ✅ 2 VMs with nginx (or use same VM for testing)
- ✅ Application Gateway already created (from Part 1-15)
- ✅ Path-based routing already working

**If you only have 1 VM:**
- You can use the same VM for both app1 and app2 (for testing)
- In production, you'd use different VMs

---

### Step 1: Create Backend Pools for Host-Based Routing

We need separate backend pools for each domain.

1. Go to **"Application gateways"** → **"appgw-rewrite-demo"**
2. Click **"Backend pools"**
3. Click **"+ Add"**

**Backend Pool 1:**
- **Name**: `pool-app1`
- **Add backend pool without targets**: `No`
- **Target type**: `Virtual machine`
- **Target**: Select VM 1 (or your existing VM)
- Click **"Add"**

4. Click **"+ Add"** again

**Backend Pool 2:**
- **Name**: `pool-app2`
- **Add backend pool without targets**: `No`
- **Target type**: `Virtual machine`
- **Target**: Select VM 2 (or same VM for testing)
- Click **"Add"**

**⏱️ Wait**: 1-2 minutes

**✅ Result**: 2 new backend pools created

---

### Step 2: Important - Understanding Port 80 Listener Limitation

**You already have a listener on port 80!**

Your existing configuration:
- **Listener name**: `test-linsten`
- **Port**: `80`
- **Listener type**: `Basic`
- **Associated rule**: `test-rule` (path-based routing)

**Problem:**
- Azure Application Gateway allows only ONE listener per port
- You cannot create additional listeners on port 80
- Your existing `test-linsten` is already using port 80

**Solution Options:**

**Option A: Use Different Ports for Host-Based Routing** (Recommended for learning)
- Keep port 80 for path-based routing (`/nginx`, `/yolox`)
- Use port 81 for `app1.example.com`
- Use port 82 for `app2.example.com`
- URLs: `http://app1.example.com:81`, `http://app2.example.com:82`

**Option B: Convert Existing Listener to Multi-Site** (Advanced)
- Change `test-linsten` from Basic to Multi-site
- Add multiple hostnames to same listener
- More complex configuration
- Risk of breaking existing path-based routing

**Option C: Use Multiple Frontend IPs** (Production approach)
- Add a second public IP to Application Gateway
- Create new listener on port 80 with different frontend IP
- More expensive but cleanly separates traffic

**For this guide, we'll use Option A (different ports) because:**
- ✅ Keeps your existing path-based routing working
- ✅ Easy to understand and test
- ✅ No risk of breaking current configuration
- ✅ Can test host-based routing independently

**If you want production-style port 80 for everything, see "Option B Alternative" at the end of this part.**

---

### Step 3: Create Multi-Site Listener for app1.example.com (Port 81)

Since port 80 is taken, we'll use port 81 for the first domain.

1. Go to **"Listeners"**
2. Click **"+ Add listener"**

**Listener Configuration:**
- **Listener name**: `listener-app1`
- **Frontend IP**: `Public`
- **Protocol**: `HTTP`
- **Port**: `81` ⚠️ (Not 80!)
- **Listener type**: `Multi site` ⚠️ (Important!)
- **Host type**: `Single`
- **Host name**: `app1.example.com`
- **Error page url**: `No`
- Click **"Add"**

**⏱️ Wait**: 1-2 minutes

**✅ Result**: Multi-site listener created for app1.example.com on port 81

---

### Step 4: Create Multi-Site Listener for app2.example.com (Port 82)

1. Click **"+ Add listener"** again

**Listener Configuration:**
- **Listener name**: `listener-app2`
- **Frontend IP**: `Public`
- **Protocol**: `HTTP`
- **Port**: `82` ⚠️ (Not 80!)
- **Listener type**: `Multi site` ⚠️ (Important!)
- **Host type**: `Single`
- **Host name**: `app2.example.com`
- **Error page url**: `No`
- Click **"Add"**

**⏱️ Wait**: 1-2 minutes

**✅ Result**: Multi-site listener created for app2.example.com on port 82

---

### Step 5: Open Ports 81 and 82 in NSG (If Needed)

If your Application Gateway subnet has a Network Security Group (NSG), you need to allow ports 81 and 82.

1. Go to **"Network security groups"**
2. Find the NSG associated with your Application Gateway subnet
3. Click **"Inbound security rules"**
4. Click **"+ Add"**

**Rule for Port 81:**
- **Source**: `Any`
- **Source port ranges**: `*`
- **Destination**: `Any`
- **Service**: `Custom`
- **Destination port ranges**: `81`
- **Protocol**: `TCP`
- **Action**: `Allow`
- **Priority**: `310`
- **Name**: `Allow-HTTP-81`
- Click **"Add"**

5. Click **"+ Add"** again

**Rule for Port 82:**
- **Source**: `Any`
- **Source port ranges**: `*`
- **Destination**: `Any`
- **Service**: `Custom`
- **Destination port ranges**: `82`
- **Protocol**: `TCP`
- **Action**: `Allow`
- **Priority**: `320`
- **Name**: `Allow-HTTP-82`
- Click **"Add"**

**Note:** If you don't have an NSG, skip this step. Application Gateway allows all ports by default.

**✅ Result**: Ports 81 and 82 are open

---

### Step 6: Create Routing Rule for app1.example.com

Now we'll create a routing rule. Priority doesn't matter as much here since different ports don't conflict.

1. Go to **"Rules"**
2. Click **"+ Add routing rule"**

**Routing Rule:**
- **Rule name**: `rule-app1`
- **Priority**: `50` (or any available number)

**Listener Tab:**
- **Listener**: Select `listener-app1`
- Click **"Backend targets"** tab

**Backend Targets Tab:**
- **Target type**: `Backend pool`
- **Backend target**: `pool-app1`
- **Backend settings**: `http-settings` (reuse existing)
- Click **"Add"**

**⏱️ Wait**: 2-3 minutes

**✅ Result**: Routing rule created for app1.example.com on port 81

---

### Step 7: Create Routing Rule for app2.example.com

1. Click **"+ Add routing rule"** again

**Routing Rule:**
- **Rule name**: `rule-app2`
- **Priority**: `60` (or any available number)

**Listener Tab:**
- **Listener**: Select `listener-app2`
- Click **"Backend targets"** tab

**Backend Targets Tab:**
- **Target type**: `Backend pool`
- **Backend target**: `pool-app2`
- **Backend settings**: `http-settings` (reuse existing)
- Click **"Add"**

**⏱️ Wait**: 2-3 minutes

**✅ Result**: Routing rule created for app2.example.com on port 82

---

### Step 8: Verify Configuration

Let's check that all rules are configured correctly.

1. Go to **"Rules"**
2. You should see 3 rules:

| Rule Name | Type | Listener | Port | Priority |
|-----------|------|----------|------|----------|
| rule-app1 | Basic | listener-app1 | 81 | 50 |
| rule-app2 | Basic | listener-app2 | 82 | 60 |
| test-rule | Path-based | test-linsten | 80 | 100 |

**Port separation:**
- Port 80: Path-based routing (`/nginx`, `/yolox`)
- Port 81: Host-based routing for `app1.example.com`
- Port 82: Host-based routing for `app2.example.com`

**✅ Result**: All rules configured on separate ports

---

### Step 9: Configure DNS or Hosts File

Since we're using custom domains, we need to point them to the Application Gateway IP.

**Option 1: Edit Hosts File (For Testing)**

This is the easiest way for testing.

**On Windows:**
1. Open Notepad as Administrator
2. Open file: `C:\Windows\System32\drivers\etc\hosts`
3. Add these lines:
   ```
   <appgw-public-ip> app1.example.com
   <appgw-public-ip> app2.example.com
   ```
4. Save file

**On Linux/Mac:**
```bash
sudo nano /etc/hosts

# Add these lines:
<appgw-public-ip> app1.example.com
<appgw-public-ip> app2.example.com
```

**Option 2: Configure Real DNS (For Production)**

If you own a domain:
1. Go to your DNS provider
2. Create A records:
   - `app1.example.com` → `<appgw-public-ip>`
   - `app2.example.com` → `<appgw-public-ip>`

**✅ Result**: Domains point to Application Gateway

---

### Step 10: Test Host-Based Routing

Now let's test that host-based routing works on ports 81 and 82.

**Test 1: Access app1.example.com on Port 81**

```bash
# Using curl with Host header
curl -H "Host: app1.example.com" http://<appgw-public-ip>:81

# Or if hosts file is configured:
curl http://app1.example.com:81
```

**Expected:**
- nginx page from VM 1
- Port 81 required in URL

**Test 2: Access app2.example.com on Port 82**

```bash
# Using curl with Host header
curl -H "Host: app2.example.com" http://<appgw-public-ip>:82

# Or if hosts file is configured:
curl http://app2.example.com:82
```

**Expected:**
- nginx page from VM 2
- Port 82 required in URL

**Test 3: Verify Path-Based Routing Still Works on Port 80**

```bash
# Test /nginx path
curl http://<appgw-public-ip>/nginx

# Test /yolox path
curl http://<appgw-public-ip>/yolox
```

**Expected:**
- Both paths still work on port 80
- URL rewrite still applies
- No port number needed for path-based routing

**✅ Result**: All routing types work on their respective ports!

---

### Step 11: Test from Browser

**Test 1: Open Browser**

1. Open browser
2. Go to: `http://app1.example.com:81`
3. **Expected**: nginx page from VM 1

**Test 2: Test Second Domain**

1. Go to: `http://app2.example.com:82`
2. **Expected**: nginx page from VM 2

**Test 3: Test Path-Based Routing**

1. Go to: `http://<appgw-public-ip>/nginx`
2. **Expected**: nginx page with URL rewrite (no port needed)

**Notice:**
- Host-based routing requires port numbers (81, 82)
- Path-based routing uses default port 80 (no port needed)
- Both routing types work independently

---

### Step 12: Understanding Port-Based Separation

**How Application Gateway Processes Requests:**

```
Request arrives
    ↓
Check which port?
    ↓
Port 80 → test-linsten (Basic listener)
    ├─ Path: /nginx → Rewrite to / → pool-nginx
    ├─ Path: /yolox → Rewrite to / → pool-nginx
    └─ Default: / → pool-nginx
    ↓
Port 81 → listener-app1 (Multi-site listener)
    └─ Host: app1.example.com → pool-app1
    ↓
Port 82 → listener-app2 (Multi-site listener)
    └─ Host: app2.example.com → pool-app2
```

**Example Requests:**

**Request 1:** `http://app1.example.com:81`
```
Port: 81
Host: app1.example.com
    ↓
listener-app1 (Port 81)
    Host matches "app1.example.com" ✅
    → Route to pool-app1
```

**Request 2:** `http://app2.example.com:82`
```
Port: 82
Host: app2.example.com
    ↓
listener-app2 (Port 82)
    Host matches "app2.example.com" ✅
    → Route to pool-app2
```

**Request 3:** `http://<appgw-ip>/nginx`
```
Port: 80 (default)
Path: /nginx
    ↓
test-linsten (Port 80)
    Path matches "/nginx" ✅
    → Rewrite to "/"
    → Route to pool-nginx
```

**Key Points:**
- Different ports = different listeners = no conflicts
- Port 80 handles path-based routing
- Ports 81, 82 handle host-based routing
- Each listener operates independently

---

### Step 13: Configure nginx for Virtual Hosts (Optional)

If you want different content for each domain on the same VM, configure nginx virtual hosts.

**SSH to VM:**
```bash
ssh azureuser@<vm-ip>
```

**Create Virtual Host for app1.example.com:**

```bash
sudo nano /etc/nginx/sites-available/app1
```

**Add this configuration:**
```nginx
server {
    listen 80;
    server_name app1.example.com;
    
    root /var/www/app1;
    index index.html;
    
    location / {
        try_files $uri $uri/ =404;
    }
}
```

**Create Virtual Host for app2.example.com:**

```bash
sudo nano /etc/nginx/sites-available/app2
```

**Add this configuration:**
```nginx
server {
    listen 80;
    server_name app2.example.com;
    
    root /var/www/app2;
    index index.html;
    
    location / {
        try_files $uri $uri/ =404;
    }
}
```

**Enable Virtual Hosts:**

```bash
# Create directories
sudo mkdir -p /var/www/app1
sudo mkdir -p /var/www/app2

# Create content
echo "<h1>Welcome to App1!</h1>" | sudo tee /var/www/app1/index.html
echo "<h1>Welcome to App2!</h1>" | sudo tee /var/www/app2/index.html

# Enable sites
sudo ln -s /etc/nginx/sites-available/app1 /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/app2 /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

**Test Virtual Hosts:**

```bash
# Test app1
curl -H "Host: app1.example.com" http://localhost
# Expected: Welcome to App1!

# Test app2
curl -H "Host: app2.example.com" http://localhost
# Expected: Welcome to App2!
```

**Now test through Application Gateway:**

```bash
# Test app1
curl http://app1.example.com
# Expected: Welcome to App1!

# Test app2
curl http://app2.example.com
# Expected: Welcome to App2!
```

**✅ Result**: Different content for each domain!

---

### Step 14: Complete Architecture

**Final Configuration:**

```
Internet
    ↓
Application Gateway (Public IP)
    ↓
┌─────────────────────────────────────────────────────┐
│ Listeners:                                          │
│   ├─ test-linsten (Port 80, Basic)                 │
│   ├─ listener-app1 (Port 81, Multi-site)           │
│   └─ listener-app2 (Port 82, Multi-site)           │
└─────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────┐
│ Routing Rules:                                      │
│   ├─ test-rule (Port 80, Path-based)                │
│   │   ├─ Path: /nginx → Rewrite to / → pool-nginx  │
│   │   ├─ Path: /yolox → Rewrite to / → pool-nginx  │
│   │   └─ Default: / → pool-nginx                    │
│   ├─ rule-app1 (Port 81)                            │
│   │   └─ Host: app1.example.com → pool-app1        │
│   └─ rule-app2 (Port 82)                            │
│       └─ Host: app2.example.com → pool-app2        │
└─────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────┐
│ Backend Pools:                                      │
│   ├─ pool-app1 → VM 1                               │
│   ├─ pool-app2 → VM 2                               │
│   └─ pool-nginx → VM (original)                     │
└─────────────────────────────────────────────────────┘
```

**Routing Summary:**

| Request | Port | Matches Rule | Backend | Result |
|---------|------|--------------|---------|--------|
| `http://app1.example.com:81` | 81 | rule-app1 | pool-app1 | VM 1 content |
| `http://app2.example.com:82` | 82 | rule-app2 | pool-app2 | VM 2 content |
| `http://appgw-ip/nginx` | 80 | test-rule | pool-nginx | Rewrite to / |
| `http://appgw-ip/yolox` | 80 | test-rule | pool-nginx | Rewrite to / |
| `http://appgw-ip/` | 80 | test-rule | pool-nginx | No rewrite |

**Port separation keeps everything clean!** ✅

---

### Step 15: Troubleshooting Host-Based Routing

**Issue 1: app1.example.com Returns 502 Bad Gateway**

**Symptoms:**
- `http://app1.example.com` returns 502 error
- Direct VM access works

**Solutions:**

1. **Check backend health:**
   - Go to Backend health
   - Verify pool-app1 shows Healthy
   - If unhealthy, check VM is running and nginx is active

2. **Check listener configuration:**
   - Go to Listeners → listener-app1
   - Verify hostname is exactly: `app1.example.com`
   - Check port is: `80`
   - Verify listener type is: `Multi site`

3. **Check routing rule:**
   - Go to Rules → rule-app1
   - Verify listener is: `listener-app1`
   - Check backend pool is: `pool-app1`

**Issue 2: Host-Based Routing Not Working, Falls Back to Path-Based**

**Symptoms:**
- `http://app1.example.com:81` shows same content as `http://appgw-ip/`
- Host header not being checked

**Solutions:**

1. **Check listener type:**
   - Must be `Multi site`, not `Basic`
   - Basic listeners don't check Host header
   - Go to Listeners → listener-app1 → Verify type is Multi-site

2. **Check hostname configuration:**
   - Verify hostname is exactly: `app1.example.com`
   - Check for typos or extra spaces

3. **Check hosts file or DNS:**
   - Verify domain points to Application Gateway IP
   - Test with curl: `curl -H "Host: app1.example.com" http://<appgw-ip>:81`

**Issue 3: Cannot Access on Port 81 or 82**

**Symptoms:**
- Connection timeout or refused
- Works on port 80 but not 81/82

**Solutions:**

1. **Check NSG rules:**
   - Verify ports 81 and 82 are allowed in NSG
   - Check both inbound and outbound rules
   - Priority should be lower than any deny rules

2. **Check listener is created:**
   - Go to Listeners
   - Verify listener-app1 (port 81) and listener-app2 (port 82) exist

3. **Check Application Gateway status:**
   - Go to Overview
   - Verify Operational state: Running
   - Wait 5 minutes after creating listeners

**Issue 4: Path-Based Routing Stopped Working**

**Symptoms:**
- `/nginx` and `/yolox` return 404
- Host-based routing works

**Solutions:**

1. **Check test-rule still exists:**
   - Go to Rules
   - Verify test-rule is present
   - Check it's still associated with test-linsten (port 80)

2. **Check path-based routing is enabled:**
   - Go to Rules → test-rule
   - Verify checkbox is checked: "Add multiple targets to create a path-based rule"

3. **Check rewrite set association:**
   - Verify rewrite set is still associated with path targets
   - Should have all 3 selected: test-rule, soetintaung, azureuser

---

### Step 16: Option B - Convert to Port 80 (Advanced Alternative)

**Warning:** This is an advanced configuration that modifies your existing listener. Only do this if you understand the risks.

**Goal:** Get everything working on port 80 without port numbers.

**Approach:** Delete existing basic listener and create new multi-site listeners on port 80.

#### Step 16.1: Backup Current Configuration

Before making changes, document your current setup:

1. Go to **"Rules"** → Take screenshot
2. Go to **"Listeners"** → Take screenshot
3. Go to **"Backend pools"** → Take screenshot

#### Step 16.2: Delete Existing Routing Rule

1. Go to **"Rules"**
2. Select **"test-rule"**
3. Click **"Delete"**
4. Confirm deletion
5. **⏱️ Wait**: 2-3 minutes

**Note:** This will temporarily break your path-based routing!

#### Step 16.3: Delete Existing Listener

1. Go to **"Listeners"**
2. Select **"test-linsten"**
3. Click **"Delete"**
4. Confirm deletion
5. **⏱️ Wait**: 2-3 minutes

**Now port 80 is free!**

#### Step 16.4: Create Multi-Site Listener for app1 on Port 80

1. Click **"+ Add listener"**

**Listener Configuration:**
- **Listener name**: `listener-app1-80`
- **Frontend IP**: `Public`
- **Protocol**: `HTTP`
- **Port**: `80` ✅
- **Listener type**: `Multi site`
- **Host type**: `Single`
- **Host name**: `app1.example.com`
- Click **"Add"**

#### Step 16.5: Create Multi-Site Listener for app2 on Port 80

1. Click **"+ Add listener"**

**Listener Configuration:**
- **Listener name**: `listener-app2-80`
- **Frontend IP**: `Public`
- **Protocol**: `HTTP`
- **Port**: `80` ✅
- **Listener type**: `Multi site`
- **Host type**: `Single`
- **Host name**: `app2.example.com`
- Click **"Add"**

#### Step 16.6: Create Basic Listener for Default Traffic on Port 80

1. Click **"+ Add listener"**

**Listener Configuration:**
- **Listener name**: `listener-default-80`
- **Frontend IP**: `Public`
- **Protocol**: `HTTP`
- **Port**: `80` ✅
- **Listener type**: `Basic`
- Click **"Add"**

**⏱️ Wait**: 3-5 minutes for all listeners to be created

#### Step 16.7: Create Routing Rules

Now create 3 routing rules with proper priorities:

**Rule 1: app1 (Highest Priority)**

1. Go to **"Rules"** → **"+ Add routing rule"**
- **Rule name**: `rule-app1-80`
- **Priority**: `10`
- **Listener**: `listener-app1-80`
- **Backend target**: `pool-app1`
- **Backend settings**: `http-settings`
- Click **"Add"**

**Rule 2: app2**

2. **"+ Add routing rule"**
- **Rule name**: `rule-app2-80`
- **Priority**: `20`
- **Listener**: `listener-app2-80`
- **Backend target**: `pool-app2`
- **Backend settings**: `http-settings`
- Click **"Add"**

**Rule 3: Default with Path-Based Routing (Lowest Priority)**

3. **"+ Add routing rule"**
- **Rule name**: `rule-default-80`
- **Priority**: `100`
- **Listener**: `listener-default-80`
- **Backend target**: `pool-nginx`
- **Backend settings**: `http-settings`
- Click **"Add"**

**⏱️ Wait**: 2-3 minutes

#### Step 16.8: Enable Path-Based Routing on Default Rule

1. Go to **"Rules"** → **"rule-default-80"**
2. Click **"Backend targets"** tab
3. Check: ☑️ **"Add multiple targets to create a path-based rule"**
4. Add paths:
   - **Path**: `/nginx`
   - **Target name**: `target-nginx`
   - **Backend pool**: `pool-nginx`
   - **Backend settings**: `http-settings`
   - **Rewrite set**: `rewrite-to-root`
5. Click **"Add new path"**
   - **Path**: `/yolox`
   - **Target name**: `target-yolox`
   - **Backend pool**: `pool-nginx`
   - **Backend settings**: `http-settings`
   - **Rewrite set**: `rewrite-to-root`
6. Click **"Update"**

**⏱️ Wait**: 3-5 minutes

#### Step 16.9: Update Rewrite Set Associations

1. Go to **"Rewrites"** → **"rewrite-to-root"**
2. Click **"Edit"**
3. Select all path targets:
   - ☑️ rule-default-80
   - ☑️ target-nginx
   - ☑️ target-yolox
4. Click **"Save"**

**⏱️ Wait**: 2-3 minutes

#### Step 16.10: Test Everything on Port 80

**Test host-based routing:**
```bash
# Test app1 (no port number!)
curl http://app1.example.com

# Test app2 (no port number!)
curl http://app2.example.com
```

**Test path-based routing:**
```bash
# Test /nginx
curl http://<appgw-ip>/nginx

# Test /yolox
curl http://<appgw-ip>/yolox
```

**Expected Results:**
- ✅ `http://app1.example.com` → VM 1 (no port!)
- ✅ `http://app2.example.com` → VM 2 (no port!)
- ✅ `http://appgw-ip/nginx` → Rewrite to /
- ✅ `http://appgw-ip/yolox` → Rewrite to /

**All on port 80!** 🎉

#### Step 16.11: Final Configuration on Port 80

```
Port 80 (HTTP)
    ├─ listener-app1-80 (Multi-site: app1.example.com) → rule-app1-80 (Priority 10)
    ├─ listener-app2-80 (Multi-site: app2.example.com) → rule-app2-80 (Priority 20)
    └─ listener-default-80 (Basic: all other traffic) → rule-default-80 (Priority 100)
        ├─ Path: /nginx → Rewrite to / → pool-nginx
        ├─ Path: /yolox → Rewrite to / → pool-nginx
        └─ Default: / → pool-nginx
```

**Routing Logic:**
1. Check app1.example.com (Priority 10) → pool-app1
2. Check app2.example.com (Priority 20) → pool-app2
3. Fall back to path-based routing (Priority 100) → pool-nginx

**This is production-ready!** ✅

---

### Summary of Part 16

**What we added:**
- ✅ Host-based routing on ports 81 and 82
- ✅ 2 multi-site listeners (app1, app2)
- ✅ 2 new routing rules for host-based routing
- ✅ Path-based routing still works on port 80
- ✅ All routing types working independently

**Final routing configuration:**
- Port 80: Path-based routing (`/nginx`, `/yolox`)
- Port 81: Host-based routing (`app1.example.com`)
- Port 82: Host-based routing (`app2.example.com`)

**URLs:**
- `http://app1.example.com:81` → VM 1
- `http://app2.example.com:82` → VM 2
- `http://appgw-ip/nginx` → VM with rewrite
- `http://appgw-ip/yolox` → VM with rewrite

**Key learnings:**
- ✅ Only one listener allowed per port
- ✅ Existing Basic listener on port 80 prevents adding Multi-site listeners
- ✅ Using different ports (81, 82) avoids conflicts
- ✅ Each port operates independently
- ✅ Option B shows how to convert everything to port 80 (advanced)

**For production without port numbers:**
- Follow Option B (Step 16) to convert to port 80
- Or use a load balancer in front to handle port mapping
- Or use multiple frontend IPs (not covered in this guide)

Great job! You now understand both approaches for host-based routing with Application Gateway! 🚀



---

## Part 17: Wildcard Example Usage in Application Gateway (Multiple/Wildcard Host Type)

This section shows the BEST production approach: using **Multiple/Wildcard** host type to handle multiple domains on port 80 without needing separate listeners.

**Goal:**
- Use ONE listener on port 80 for multiple domains
- `http://app1.example.com` → VM 1 (no port number!)
- `http://app2.example.com` → VM 2 (no port number!)
- `http://appgw-ip/nginx` → Still works (path-based routing)
- `http://appgw-ip/yolox` → Still works (path-based routing)
- All on port 80 with ONE multi-site listener!

### Why This Approach is Better

**Previous approaches:**
- ❌ Different ports (81, 82) - requires port numbers in URLs
- ❌ Delete and recreate listeners - risky, breaks existing config

**This approach:**
- ✅ Edit existing listener to Multi-site with Multiple/Wildcard
- ✅ All traffic on port 80 (production-ready)
- ✅ No port numbers needed
- ✅ Keeps existing path-based routing working
- ✅ Uses routing rule priorities to differentiate traffic

---

### Prerequisites

Before starting:
- ✅ Application Gateway already created (from Part 1-15)
- ✅ Path-based routing working (`/nginx`, `/yolox`)
- ✅ Existing listener `test-linsten` on port 80 (Basic type)
- ✅ 2 VMs with nginx (or use same VM for testing)
- ✅ Backend pools created: `pool-app1`, `pool-app2` (from Part 16 Step 1)

**If you haven't created backend pools yet:**

1. Go to **"Backend pools"** → **"+ Add"**
2. Create `pool-app1` pointing to VM 1
3. Create `pool-app2` pointing to VM 2 (or same VM for testing)

---

### Architecture

```
Port 80 (HTTP) - ONE Multi-site Listener
    ↓
Listener: test-linsten (Multi-site, Multiple hosts)
    ├─ app1.example.com
    ├─ app2.example.com
    └─ (default/IP traffic)
    ↓
Routing Rules (by priority):
    ├─ rule-app1 (Priority 10) → Checks Host: app1.example.com → pool-app1
    ├─ rule-app2 (Priority 20) → Checks Host: app2.example.com → pool-app2
    └─ test-rule (Priority 100) → Path-based routing → pool-nginx
```

---

### Step 1: Edit Existing Listener to Multi-Site

We'll convert your existing `test-linsten` from Basic to Multi-site.

1. Go to **"Application gateways"** → **"appgw-rewrite-demo"**
2. Click **"Listeners"**
3. Click on **"test-linsten"**
4. You'll see the listener configuration

**Current configuration:**
- **Listener name**: `test-linsten`
- **Port**: `80`
- **Listener type**: `Basic` ← We'll change this!

5. Change **Listener type** from `Basic` to **`Multi site`**

**New options appear:**
- **Host type**: Select **`Multiple/Wildcard`** ⚠️ (Important!)
- **Host names**: Enter the following (one per line or comma-separated):
  ```
  app1.example.com
  app2.example.com
  ```

**What this means:**
- This ONE listener now responds to both `app1.example.com` AND `app2.example.com`
- It also responds to direct IP traffic (for path-based routing)
- All on port 80!

6. Click **"Save"** or **"Update"**

**⏱️ Wait**: 2-3 minutes for changes to apply

**✅ Result**: Listener converted to Multi-site with multiple hostnames

---

### Step 2: Create Routing Rule for app1.example.com

Now we'll create a routing rule that checks the Host header and routes to the correct backend.

1. Go to **"Rules"**
2. Click **"+ Add routing rule"**

**Routing Rule Configuration:**
- **Rule name**: `rule-app1`
- **Priority**: `10` ⚠️ (Lower than existing test-rule's 100)

**Listener Tab:**
- **Listener**: Select **`test-linsten`** (the one we just edited)
- Click **"Backend targets"** tab

**Backend Targets Tab:**
- **Target type**: `Backend pool`
- **Backend target**: `pool-app1`
- **Backend settings**: `http-settings` (reuse existing)

**HTTP settings:**
- **Override with new host name**: `No`
- **Host name override**: Leave empty
- **Pick host name from backend target**: `No`

3. Click **"Add"**

**⏱️ Wait**: 2-3 minutes

**✅ Result**: Routing rule created for app1.example.com

---

### Step 3: Create Routing Rule for app2.example.com

1. Click **"+ Add routing rule"** again

**Routing Rule Configuration:**
- **Rule name**: `rule-app2`
- **Priority**: `20` ⚠️ (Lower than test-rule's 100, higher than rule-app1's 10)

**Listener Tab:**
- **Listener**: Select **`test-linsten`** (same listener!)
- Click **"Backend targets"** tab

**Backend Targets Tab:**
- **Target type**: `Backend pool`
- **Backend target**: `pool-app2`
- **Backend settings**: `http-settings` (reuse existing)

2. Click **"Add"**

**⏱️ Wait**: 2-3 minutes

**✅ Result**: Routing rule created for app2.example.com

---

### Step 4: Verify Routing Rules Configuration

Let's check that all rules are configured correctly with proper priorities.

1. Go to **"Rules"**
2. You should see 3 rules:

| Rule Name | Listener | Priority | Type | Target |
|-----------|----------|----------|------|--------|
| rule-app1 | test-linsten | 10 | Basic | pool-app1 |
| rule-app2 | test-linsten | 20 | Basic | pool-app2 |
| test-rule | test-linsten | 100 | Path-based | pool-nginx |

**Priority order (lower number = checked first):**
1. **Priority 10**: `rule-app1` - Checks for `app1.example.com` first
2. **Priority 20**: `rule-app2` - Checks for `app2.example.com` second
3. **Priority 100**: `test-rule` - Falls back to path-based routing

**Important:** All 3 rules use the SAME listener (`test-linsten`) but different priorities!

**✅ Result**: All rules configured correctly

---

### Step 5: Configure DNS or Hosts File

Point your domains to the Application Gateway IP.

**Option 1: Edit Hosts File (For Testing)**

**On Windows:**
1. Open Notepad as Administrator
2. Open file: `C:\Windows\System32\drivers\etc\hosts`
3. Add these lines:
   ```
   <appgw-public-ip> app1.example.com
   <appgw-public-ip> app2.example.com
   ```
4. Save file

**On Linux/Mac:**
```bash
sudo nano /etc/hosts

# Add these lines:
<appgw-public-ip> app1.example.com
<appgw-public-ip> app2.example.com
```

**Option 2: Configure Real DNS (For Production)**

If you own a domain:
1. Go to your DNS provider
2. Create A records:
   - `app1.example.com` → `<appgw-public-ip>`
   - `app2.example.com` → `<appgw-public-ip>`

**✅ Result**: Domains point to Application Gateway

---

### Step 6: Test Host-Based Routing on Port 80

Now let's test that everything works on port 80 without port numbers!

**Test 1: Access app1.example.com**

```bash
# Using curl with Host header
curl -H "Host: app1.example.com" http://<appgw-public-ip>

# Or if hosts file is configured:
curl http://app1.example.com
```

**Expected:**
- nginx page from VM 1
- No port number needed! ✅

**Test 2: Access app2.example.com**

```bash
# Using curl with Host header
curl -H "Host: app2.example.com" http://<appgw-public-ip>

# Or if hosts file is configured:
curl http://app2.example.com
```

**Expected:**
- nginx page from VM 2
- No port number needed! ✅

**Test 3: Verify Path-Based Routing Still Works**

```bash
# Test /nginx path
curl http://<appgw-public-ip>/nginx

# Test /yolox path
curl http://<appgw-public-ip>/yolox
```

**Expected:**
- Both paths still work on port 80
- URL rewrite still applies
- No port number needed ✅

**✅ Result**: All routing types work on port 80!

---

### Step 7: Test from Browser

**Test 1: Open Browser**

1. Open browser
2. Go to: `http://app1.example.com`
3. **Expected**: nginx page from VM 1

**Test 2: Test Second Domain**

1. Go to: `http://app2.example.com`
2. **Expected**: nginx page from VM 2

**Test 3: Test Path-Based Routing**

1. Go to: `http://<appgw-public-ip>/nginx`
2. **Expected**: nginx page with URL rewrite

**Notice:**
- No port numbers needed! ✅
- Clean, production-style URLs ✅
- Both host-based and path-based routing work together on port 80 ✅

---

### Step 8: Understanding How It Works

**Request Processing Flow:**

```
Request arrives on port 80
    ↓
Listener: test-linsten (Multi-site, Multiple hosts)
    ↓
Check routing rules by priority (lowest number first)
    ↓
Priority 10: rule-app1
    ├─ Check: Host header = "app1.example.com"?
    ├─ YES → Route to pool-app1 ✅ STOP
    └─ NO → Continue to next rule
    ↓
Priority 20: rule-app2
    ├─ Check: Host header = "app2.example.com"?
    ├─ YES → Route to pool-app2 ✅ STOP
    └─ NO → Continue to next rule
    ↓
Priority 100: test-rule (path-based)
    ├─ Check: Path = "/nginx"?
    ├─ YES → Rewrite to "/" → Route to pool-nginx ✅ STOP
    ├─ Check: Path = "/yolox"?
    ├─ YES → Rewrite to "/" → Route to pool-nginx ✅ STOP
    └─ Default → Route to pool-nginx ✅
```

**Example Requests:**

**Request 1:** `http://app1.example.com/`
```
Host: app1.example.com
Path: /
Port: 80
    ↓
Listener: test-linsten (matches port 80)
    ↓
Priority 10: rule-app1
    Host matches "app1.example.com" ✅
    → Route to pool-app1
    → STOP (don't check other rules)
```

**Request 2:** `http://app2.example.com/`
```
Host: app2.example.com
Path: /
Port: 80
    ↓
Listener: test-linsten (matches port 80)
    ↓
Priority 10: rule-app1
    Host matches "app1.example.com" ❌
    → Continue
    ↓
Priority 20: rule-app2
    Host matches "app2.example.com" ✅
    → Route to pool-app2
    → STOP
```

**Request 3:** `http://<appgw-ip>/nginx`
```
Host: <appgw-ip> (or no Host header)
Path: /nginx
Port: 80
    ↓
Listener: test-linsten (matches port 80)
    ↓
Priority 10: rule-app1
    Host matches "app1.example.com" ❌
    → Continue
    ↓
Priority 20: rule-app2
    Host matches "app2.example.com" ❌
    → Continue
    ↓
Priority 100: test-rule
    Path matches "/nginx" ✅
    → Rewrite to "/"
    → Route to pool-nginx
    → STOP
```

**Key Points:**
- ONE listener handles all traffic on port 80
- Multiple/Wildcard host type allows multiple hostnames
- Priority determines which rule is checked first
- First matching rule wins, others are skipped
- Host-based rules (10, 20) checked before path-based (100)

---

### Step 9: Wildcard Pattern Examples

You can also use wildcard patterns in the Multiple/Wildcard host type.

**Example 1: Match all subdomains**

Edit listener `test-linsten`:
- **Host names**:
  ```
  *.example.com
  ```

**Result:** Matches ANY subdomain:
- `app1.example.com` ✅
- `app2.example.com` ✅
- `api.example.com` ✅
- `test.example.com` ✅
- `anything.example.com` ✅

**Example 2: Mix specific and wildcard**

Edit listener `test-linsten`:
- **Host names**:
  ```
  app1.example.com
  app2.example.com
  *.dev.example.com
  *.staging.example.com
  ```

**Result:**
- `app1.example.com` ✅ (specific)
- `app2.example.com` ✅ (specific)
- `test.dev.example.com` ✅ (wildcard match)
- `api.dev.example.com` ✅ (wildcard match)
- `app1.staging.example.com` ✅ (wildcard match)

**Example 3: Multiple domains**

Edit listener `test-linsten`:
- **Host names**:
  ```
  app1.example.com
  app2.example.com
  app1.mycompany.com
  app2.mycompany.com
  ```

**Result:** Handles multiple domains on same listener!

---

### Step 10: Configure nginx Virtual Hosts (Optional)

If you want different content for each domain on the same VM, configure nginx virtual hosts.

**SSH to VM:**
```bash
ssh azureuser@<vm-ip>
```

**Create Virtual Host for app1.example.com:**

```bash
sudo nano /etc/nginx/sites-available/app1
```

**Add this configuration:**
```nginx
server {
    listen 80;
    server_name app1.example.com;
    
    root /var/www/app1;
    index index.html;
    
    location / {
        try_files $uri $uri/ =404;
    }
}
```

**Create Virtual Host for app2.example.com:**

```bash
sudo nano /etc/nginx/sites-available/app2
```

**Add this configuration:**
```nginx
server {
    listen 80;
    server_name app2.example.com;
    
    root /var/www/app2;
    index index.html;
    
    location / {
        try_files $uri $uri/ =404;
    }
}
```

**Enable Virtual Hosts:**

```bash
# Create directories
sudo mkdir -p /var/www/app1
sudo mkdir -p /var/www/app2

# Create content
echo "<h1>Welcome to App1!</h1>" | sudo tee /var/www/app1/index.html
echo "<h1>Welcome to App2!</h1>" | sudo tee /var/www/app2/index.html

# Enable sites
sudo ln -s /etc/nginx/sites-available/app1 /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/app2 /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

**Test Virtual Hosts:**

```bash
# Test app1
curl -H "Host: app1.example.com" http://localhost
# Expected: Welcome to App1!

# Test app2
curl -H "Host: app2.example.com" http://localhost
# Expected: Welcome to App2!
```

**Now test through Application Gateway:**

```bash
# Test app1
curl http://app1.example.com
# Expected: Welcome to App1!

# Test app2
curl http://app2.example.com
# Expected: Welcome to App2!
```

**✅ Result**: Different content for each domain!

---

### Step 11: Complete Architecture

**Final Configuration:**

```
Internet (Port 80)
    ↓
Application Gateway (Public IP)
    ↓
┌─────────────────────────────────────────────────────────────┐
│ Listener: test-linsten (Port 80, Multi-site)               │
│   Host type: Multiple/Wildcard                              │
│   Hostnames:                                                │
│     - app1.example.com                                      │
│     - app2.example.com                                      │
│     - (also accepts direct IP traffic)                      │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│ Routing Rules (by priority):                                │
│   ├─ rule-app1 (Priority 10)                                │
│   │   └─ Host: app1.example.com → pool-app1                │
│   ├─ rule-app2 (Priority 20)                                │
│   │   └─ Host: app2.example.com → pool-app2                │
│   └─ test-rule (Priority 100, Path-based)                   │
│       ├─ Path: /nginx → Rewrite to / → pool-nginx          │
│       ├─ Path: /yolox → Rewrite to / → pool-nginx          │
│       └─ Default: / → pool-nginx                            │
└─────────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────────┐
│ Backend Pools:                                              │
│   ├─ pool-app1 → VM 1                                       │
│   ├─ pool-app2 → VM 2                                       │
│   └─ pool-nginx → VM (original)                             │
└─────────────────────────────────────────────────────────────┘
```

**Routing Summary:**

| Request | Port | Host Header | Path | Matches Rule | Priority | Backend | Result |
|---------|------|-------------|------|--------------|----------|---------|--------|
| `http://app1.example.com` | 80 | app1.example.com | / | rule-app1 | 10 | pool-app1 | VM 1 content |
| `http://app2.example.com` | 80 | app2.example.com | / | rule-app2 | 20 | pool-app2 | VM 2 content |
| `http://appgw-ip/nginx` | 80 | (IP or none) | /nginx | test-rule | 100 | pool-nginx | Rewrite to / |
| `http://appgw-ip/yolox` | 80 | (IP or none) | /yolox | test-rule | 100 | pool-nginx | Rewrite to / |
| `http://appgw-ip/` | 80 | (IP or none) | / | test-rule | 100 | pool-nginx | No rewrite |

**All on port 80 - no port numbers needed!** ✅

---

### Step 12: Troubleshooting

**Issue 1: app1.example.com Returns 502 Bad Gateway**

**Symptoms:**
- `http://app1.example.com` returns 502 error
- Direct VM access works

**Solutions:**

1. **Check backend health:**
   - Go to Backend health
   - Verify pool-app1 shows Healthy
   - If unhealthy, check VM is running and nginx is active

2. **Check routing rule:**
   - Go to Rules → rule-app1
   - Verify listener is: `test-linsten`
   - Check backend pool is: `pool-app1`
   - Verify priority is lower than test-rule (e.g., 10 vs 100)

3. **Check listener configuration:**
   - Go to Listeners → test-linsten
   - Verify type is: `Multi site`
   - Check host type is: `Multiple/Wildcard`
   - Verify `app1.example.com` is in the host names list

**Issue 2: Host-Based Routing Not Working, Falls Back to Path-Based**

**Symptoms:**
- `http://app1.example.com` shows same content as `http://appgw-ip/`
- Host header not being checked

**Solutions:**

1. **Check listener type:**
   - Must be `Multi site`, not `Basic`
   - Basic listeners don't check Host header
   - Go to Listeners → test-linsten → Verify type

2. **Check host names are configured:**
   - Go to Listeners → test-linsten
   - Verify `app1.example.com` and `app2.example.com` are listed
   - Check for typos or extra spaces

3. **Check priority:**
   - Host-based rules must have lower priority number than path-based
   - rule-app1: 10 ✅
   - rule-app2: 20 ✅
   - test-rule: 100 ✅

4. **Test with curl:**
   ```bash
   # Test with explicit Host header
   curl -H "Host: app1.example.com" http://<appgw-ip>
   ```

**Issue 3: Path-Based Routing Stopped Working**

**Symptoms:**
- `/nginx` and `/yolox` return 404
- Host-based routing works

**Solutions:**

1. **Check test-rule priority:**
   - Must be higher number (lower priority) than host-based rules
   - Should be: 100 or higher

2. **Check path-based routing is enabled:**
   - Go to Rules → test-rule
   - Verify checkbox is checked: "Add multiple targets to create a path-based rule"

3. **Check rewrite set association:**
   - Verify rewrite set is still associated with path targets
   - Should have all 3 selected: test-rule, soetintaung, azureuser

**Issue 4: Both Domains Show Same Content**

**Symptoms:**
- `app1.example.com` and `app2.example.com` show identical content
- Both route to same backend

**Solutions:**

1. **Check backend pools:**
   - Verify pool-app1 and pool-app2 point to different VMs
   - Or if same VM, check nginx virtual hosts are configured

2. **Check routing rules:**
   - rule-app1 should use pool-app1
   - rule-app2 should use pool-app2
   - Verify in Rules section

3. **If using same VM, configure nginx virtual hosts:**
   - See Step 10 for nginx virtual host configuration
   - Verify nginx is serving different content based on Host header

**Issue 5: Wildcard Not Matching**

**Symptoms:**
- Wildcard pattern `*.example.com` not matching subdomains

**Solutions:**

1. **Check wildcard syntax:**
   - Must be: `*.example.com` (asterisk at beginning)
   - Not: `example.com.*` or `*example.com`

2. **Check listener host type:**
   - Must be: `Multiple/Wildcard`
   - Not: `Single`

3. **Test with curl:**
   ```bash
   # Test subdomain
   curl -H "Host: test.example.com" http://<appgw-ip>
   ```

---

### Step 13: Comparison of Approaches

Let's compare all three approaches we've covered:

| Feature | Approach 1: Different Ports | Approach 2: Delete & Recreate | Approach 3: Multiple/Wildcard |
|---------|----------------------------|-------------------------------|-------------------------------|
| **Port 80 for all traffic** | ❌ No (uses 81, 82) | ✅ Yes | ✅ Yes |
| **Port numbers in URLs** | ❌ Required | ✅ Not needed | ✅ Not needed |
| **Risk to existing config** | ✅ Low (keeps existing) | ❌ High (deletes listener) | ✅ Low (edits existing) |
| **Number of listeners** | 3 (one per port) | 3 (one per host + default) | 1 (handles all) |
| **Complexity** | ✅ Simple | ❌ Complex | ✅ Moderate |
| **Production-ready** | ❌ No (port numbers) | ✅ Yes | ✅ Yes (BEST!) |
| **Wildcard support** | ❌ No | ✅ Yes | ✅ Yes |
| **Ease of adding new hosts** | ❌ Need new port | ❌ Need new listener | ✅ Just add to list |

**Recommendation:** Use **Approach 3 (Multiple/Wildcard)** for production!

---

### Summary of Part 17

**What we built:**
- ✅ ONE Multi-site listener on port 80 handling multiple domains
- ✅ Multiple/Wildcard host type for flexible hostname matching
- ✅ Host-based routing without port numbers
- ✅ Path-based routing still working
- ✅ All traffic on port 80 (production-ready!)

**Configuration:**
- 1 Listener: `test-linsten` (Multi-site, Multiple/Wildcard)
- 3 Routing rules: `rule-app1` (10), `rule-app2` (20), `test-rule` (100)
- 3 Backend pools: `pool-app1`, `pool-app2`, `pool-nginx`

**URLs (all on port 80):**
- `http://app1.example.com` → VM 1 ✅
- `http://app2.example.com` → VM 2 ✅
- `http://appgw-ip/nginx` → VM with rewrite ✅
- `http://appgw-ip/yolox` → VM with rewrite ✅

**Key learnings:**
- ✅ Multiple/Wildcard host type allows multiple hostnames on ONE listener
- ✅ Priority determines routing order (lower number = higher priority)
- ✅ Host-based rules checked before path-based rules
- ✅ Wildcard patterns (`*.example.com`) supported
- ✅ No need for multiple listeners or different ports
- ✅ Production-ready with clean URLs

**Advantages over other approaches:**
- ✅ No port numbers needed (port 80 for everything)
- ✅ Easy to add new domains (just edit listener host names)
- ✅ Low risk (edits existing listener, doesn't delete)
- ✅ Supports wildcards for flexible matching
- ✅ Fewer listeners to manage (1 instead of 3)

**This is the BEST approach for production Application Gateway configuration!** 🚀

Great job! You now understand how to use Multiple/Wildcard host type for production-ready Application Gateway configuration! 🎉
