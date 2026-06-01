# Day 45: Azure Front Door + Custom Domain + NGINX Origin
## Complete Guide: Deploy Global HTTP/HTTPS Load Balancer with Custom Domain

> **🎯 Objective:** Expose an NGINX web server through Azure Front Door using custom domain `fd-lab.your-domain.com` with Azure-managed TLS certificate and HTTPS access.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Prerequisites](#2-prerequisites)
3. [Step-by-Step Implementation](#step-by-step-implementation)
4. [Troubleshooting](#troubleshooting)
5. [Summary](#summary)

---

## 1. Architecture Overview

### What is Azure Front Door?

Azure Front Door is a global, scalable entry-point that uses the Microsoft global edge network to create fast, secure, and widely scalable web applications.

| Feature | Description |
|---------|-------------|
| **Global Load Balancing** | Distributes traffic across regions |
| **SSL Termination** | Managed certificates for custom domains |
| **CDN Capabilities** | Content delivery at edge locations |
| **WAF Integration** | Web Application Firewall protection |
| **URL-Based Routing** | Route to different backends based on URL path |
| **Health Probes** | Automatic failover for high availability |

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Traffic Flow Architecture                            │
│                                                                             │
│  ┌─────────────┐                                                            │
│  │   Internet  │                                                            │
│  │    User     │                                                            │
│  └──────┬──────┘                                                            │
│         │                                                                   │
│         │ HTTPS (fd-lab.your-domain.com)                                       │
│         ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      Azure Front Door                                │   │
│  │                                                                      │   │
│  │   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐            │   │
│  │   │   Endpoint  │    │   Route     │    │   Domain    │            │   │
│  │   │  afd-lab-   │───▶│  nginx-     │───▶│  fd-lab.    │            │   │
│  │   │  endpoint   │    │  route      │    │  your-domain.  │            │   │
│  │   └─────────────┘    └─────────────┘    │  com        │            │   │
│  │          │                              └─────────────┘            │   │
│  │          │                                                          │   │
│  │          │           ┌─────────────────────────────────┐           │   │
│  │          └──────────▶│      Origin Group               │           │   │
│  │                      │      nginx-origin-group         │           │   │
│  │                      │                                 │           │   │
│  │                      │   ┌─────────────────────────┐   │           │   │
│  │                      │   │     nginx-origin        │   │           │   │
│  │                      │   │     (Priority: 1)       │   │           │   │
│  │                      │   │     (Weight: 1000)      │   │           │   │
│  │                      │   └─────────────────────────┘   │           │   │
│  │                      └─────────────────────────────────┘           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                   │
│         │ HTTP/HTTPS                                                       │
│         ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                          NGINX Server                                │   │
│  │                                                                      │   │
│  │   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐            │   │
│  │   │   Port 80   │    │  Port 443   │    │   Static    │            │   │
│  │   │   (HTTP)    │    │  (HTTPS)    │    │   Content   │            │   │
│  │   └─────────────┘    └─────────────┘    └─────────────┘            │   │
│  │                                                                      │   │
│  │   Response: "Welcome to nginx!"                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### DNS Configuration

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DNS Record Configuration                            │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                        CNAME Record                                   │  │
│  │                                                                       │  │
│  │   fd-lab.your-domain.com  ──────▶  afd-lab-endpoint-xxx.z02.azurefd.net │  │
│  │                                                                       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                        TXT Record (Validation)                        │  │
│  │                                                                       │  │
│  │   _dnsauth.fd-lab.your-domain.com  ───▶  "azure-validation-token"       │  │
│  │                                                                       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Prerequisites

### Required Resources

| Resource | Requirement |
|----------|-------------|
| Azure Subscription | Active subscription with contributor access |
| Domain Name | Domain hosted in DNS provider (Route53, Cloudflare, GoDaddy) |
| NGINX Server | Internet-accessible server with HTTP/HTTPS enabled |

### Verify NGINX is Running

```bash
# Test NGINX accessibility
curl http://<YOUR_NGINX_SERVER_IP>

# Expected response:
# <!DOCTYPE html>
# <html>
# <head>
# <title>Welcome to nginx!</title>
```

### Ports Required

| Port | Protocol | Purpose |
|------|----------|---------|
| 80 | HTTP | Front Door health probes |
| 443 | HTTPS | Secure traffic (optional) |

---

## Step-by-Step Implementation

### Step 1: Create Azure Front Door Profile

**Navigate via Azure Portal:**

```
Azure Portal
 └── Create a resource
      └── Networking
           └── Front Door and CDN profiles
```

**Configuration:**

| Setting | Value |
|---------|-------|
| Resource Group | `rg-frontdoor-lab` (create new) |
| Name | `afd-lab` |
| Tier | **Standard** (or Premium for WAF) |
| Endpoint Name | `afd-lab-endpoint` |
| Origin Name | `nginx-origin` |
| Origin Host | `<YOUR_NGINX_SERVER_IP>` |

**Click: Review + Create → Create**

> ⏱️ Deployment takes 2-5 minutes

---

### Step 2: Verify Front Door Endpoint

After deployment completes, test the default endpoint:

```bash
# Replace with your actual endpoint
curl https://afd-lab-endpoint-xxx.z02.azurefd.net
```

**Expected Output:**
```
Welcome to nginx!
```

**Record these values:**

| Property | Example Value |
|----------|---------------|
| Endpoint URL | `afd-lab-endpoint-egbdc3d3cyhggrg0.z02.azurefd.net` |
| Resource Group | `rg-frontdoor-lab` |
| Profile Name | `afd-lab` |

---

### Step 3: Add Custom Domain

**Navigate:**

```
Front Door Profile
 └── Settings
      └── Domains
           └── + Add
```

**Configuration:**

| Setting | Value |
|---------|-------|
| Domain Type | **Custom** |
| Domain Name | `fd-lab.your-domain.com` |
| DNS Provider | **Other / My DNS provider** |
| Minimum TLS Version | **TLS 1.2** |

**Click: Add**

---

### Step 4: Create DNS Validation Record

Azure will display validation token. Create TXT record in your DNS provider:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          TXT Record Details                                  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Name:     _dnsauth.fd-lab.your-domain.com                              │   │
│  │  Type:     TXT                                                       │   │
│  │  Value:    _ehkimny3riu4vft9utpp76ddu1m2nxx                          │   │
│  │  TTL:      300 (or default)                                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Example in AWS Route53:                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Name:     _dnsauth                                                  │   │
│  │  Type:     TXT - Simple routing                                      │   │
│  │  Value:    "_ehkimny3riu4vft9utpp76ddu1m2nxx"                        │   │
│  │  TTL:      300                                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Verify TXT record:**

```bash
# Linux/Mac
dig TXT _dnsauth.fd-lab.your-domain.com

# Windows PowerShell
nslookup -type=txt _dnsauth.fd-lab.your-domain.com
```

**Expected Output:**
```
_ehkimny3riu4vft9utpp76ddu1m2nxx
```

---

### Step 5: Create CNAME Record

Create CNAME record pointing to Front Door endpoint:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CNAME Record Details                                │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Name:     fd-lab.your-domain.com                                       │   │
│  │  Type:     CNAME                                                     │   │
│  │  Value:    afd-lab-endpoint-egbdc3d3cyhggrg0.z02.azurefd.net        │   │
│  │  TTL:      300 (or default)                                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Verify CNAME record:**

```bash
# Linux/Mac
dig CNAME fd-lab.your-domain.com

# Windows PowerShell
nslookup fd-lab.your-domain.com
```

**Expected Output:**
```
fd-lab.your-domain.com
  canonical name = afd-lab-endpoint-xxx.z02.azurefd.net
```

---

### Step 6: Enable Azure Managed Certificate

**Navigate:**

```
Front Door Profile
 └── Settings
      └── Domains
           └── fd-lab.your-domain.com
```

**Configuration:**

| Setting | Value |
|---------|-------|
| Certificate Type | **Azure Front Door managed** |

**Wait for:**

| State | Status |
|-------|--------|
| Validation State | ✅ Approved |
| Certificate State | ✅ Issued/Deployed |

> ⏱️ Certificate provisioning takes 5-15 minutes

---

### Step 7: Associate Custom Domain with Route

**Navigate:**

```
Front Door Profile
 └── Settings
      └── Front Door Manager
           └── Routes
                └── nginx-route (or create new)
```

**Update Route Configuration:**

| Setting | Value |
|---------|-------|
| Name | `nginx-route` |
| Endpoint | `afd-lab-endpoint` |
| Domains | ✅ `fd-lab.your-domain.com` |
| Patterns to match | `/*` |
| Accepted Protocols | ☑ HTTP ☑ HTTPS |
| Redirect | ☑ Redirect HTTP to HTTPS |
| Origin Group | `nginx-origin-group` |

**Click: Save**

---

### Step 8: Verify Complete Configuration

**Check Domain Status:**

```
Front Door Profile
 └── Settings
      └── Domains
           └── fd-lab.your-domain.com
```

**All checks should be green:**

| Property | Expected Status |
|----------|-----------------|
| Provisioning State | ✅ Succeeded |
| Validation State | ✅ Approved |
| Certificate State | ✅ Deployed |
| Endpoint Association | ✅ afd-lab-endpoint-xxx |

---

### Step 9: Wait for Global Propagation

> ⏱️ **Important:** Global propagation takes 5-60 minutes

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Propagation Timeline                                │
│                                                                             │
│  0-5 min    ┌──────────────────────────────────────────────────────────┐   │
│             │ DNS propagation starting                                   │   │
│             │ Edge nodes receiving configuration                        │   │
│             └──────────────────────────────────────────────────────────┘   │
│                                                                             │
│  5-15 min   ┌──────────────────────────────────────────────────────────┐   │
│             │ Most edge nodes configured                                 │   │
│             │ HTTPS working in some regions                              │   │
│             └──────────────────────────────────────────────────────────┘   │
│                                                                             │
│  15-30 min  ┌──────────────────────────────────────────────────────────┐   │
│             │ Global propagation complete                                │   │
│             │ All regions serving custom domain                          │   │
│             └──────────────────────────────────────────────────────────┘   │
│                                                                             │
│  30-60 min  ┌──────────────────────────────────────────────────────────┐   │
│             │ Full propagation (worst case)                              │   │
│             │ All PoPs synchronized                                      │   │
│             └──────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**During propagation you may see:**

```
Page not found

We weren't able to find your Azure Front Door Service configuration.
```

This is **normal** while edge nodes synchronize.

---

### Step 10: Final Validation

**Test Custom Domain:**

```bash
# Test HTTPS
curl -I https://fd-lab.your-domain.com

# Test HTTP redirect (should redirect to HTTPS)
curl -I http://fd-lab.your-domain.com
```

**Expected Response:**

```
HTTP/2 200
content-type: text/html
server: nginx

Welcome to nginx!
```

**Browser Test:**

Open in browser: `https://fd-lab.your-domain.com`

Expected: ✅ "Welcome to nginx!" page

---

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: Custom Domain Shows "Page not found"

**Symptoms:**
- Default Front Door endpoint works
- Custom domain returns 404

**Diagnosis:**

```bash
# Check DNS resolution
nslookup fd-lab.your-domain.com

# Check TXT validation
nslookup -type=txt _dnsauth.fd-lab.your-domain.com
```

**Solutions:**

| Check | Action |
|-------|--------|
| CNAME missing | Add CNAME record in DNS |
| TXT record missing | Add TXT validation record |
| Validation pending | Wait for Azure validation |
| Route not associated | Associate domain with route |
| Propagation pending | Wait 30-60 minutes |

---

#### Issue 2: Certificate Not Deployed

**Symptoms:**
- Domain validated
- HTTPS returns certificate error

**Solutions:**

1. Verify certificate type is "Azure Front Door managed"
2. Check domain validation is approved
3. Wait for certificate provisioning (5-15 min)
4. Check route has domain associated

---

#### Issue 3: Origin Unhealthy

**Symptoms:**
- Front Door returns 502/503 errors
- Health probe shows unhealthy

**Diagnosis:**

```bash
# Test origin directly
curl -I http://<NGINX_IP>

# Check origin status
curl http://<NGINX_IP>/health
```

**Solutions:**

| Check | Action |
|-------|--------|
| NGINX not running | Start NGINX: `sudo systemctl start nginx` |
| Firewall blocking | Open port 80/443 in firewall |
| Security group blocking | Update NSG/security group rules |
| Health probe path wrong | Configure correct health probe path |

---

### Diagnostic Commands

```bash
# Check DNS resolution
dig fd-lab.your-domain.com
dig CNAME fd-lab.your-domain.com
dig TXT _dnsauth.fd-lab.your-domain.com

# Test connectivity
curl -I https://fd-lab.your-domain.com
curl -I https://afd-lab-endpoint-xxx.z02.azurefd.net

# Check SSL certificate
openssl s_client -connect fd-lab.your-domain.com:443 -servername fd-lab.your-domain.com
```

---

## Summary

### What We Built

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Final Architecture                                  │
│                                                                             │
│   User Request                                                               │
│       │                                                                      │
│       │ https://fd-lab.your-domain.com                                         │
│       ▼                                                                      │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    Azure Front Door                                  │   │
│   │                                                                      │   │
│   │   ✅ Custom Domain: fd-lab.your-domain.com                             │   │
│   │   ✅ Azure Managed TLS Certificate                                   │   │
│   │   ✅ HTTPS Enabled with HTTP→HTTPS Redirect                         │   │
│   │   ✅ Global Edge Network                                             │   │
│   │   ✅ Health Probes                                                   │   │
│   │                                                                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│       │                                                                      │
│       │ Origin traffic                                                       │
│       ▼                                                                      │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    NGINX Origin Server                               │   │
│   │                                                                      │   │
│   │   ✅ Response: "Welcome to nginx!"                                   │   │
│   │   ✅ Port 80/443 accessible                                          │   │
│   │                                                                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Configuration Summary

| Component | Configuration |
|-----------|---------------|
| **Front Door Profile** | `afd-lab` (Standard tier) |
| **Endpoint** | `afd-lab-endpoint-xxx.z02.azurefd.net` |
| **Custom Domain** | `fd-lab.your-domain.com` |
| **Certificate** | Azure Front Door managed |
| **Origin** | NGINX server IP |
| **Routing** | `/*` → nginx-origin-group |
| **Protocol** | HTTPS with HTTP redirect |

### DNS Records Created

| Type | Name | Value |
|------|------|-------|
| CNAME | `fd-lab.your-domain.com` | `afd-lab-endpoint-xxx.z02.azurefd.net` |
| TXT | `_dnsauth.fd-lab.your-domain.com` | Azure validation token |

### Next Steps

- **Add WAF Protection**: Enable Web Application Firewall in Front Door Premium
- **Add Caching**: Configure caching rules for static content
- **Add Multiple Origins**: Configure multiple backends for high availability
- **Add URL Routing**: Route different paths to different origins
- **Add Health Probes**: Configure custom health check endpoints

---

> **Completed:** Your NGINX server is now accessible globally via Azure Front Door with custom domain and HTTPS!
