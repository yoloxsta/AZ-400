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

