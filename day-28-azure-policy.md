# Day 28: Azure Policy - Governance & Compliance

## What You'll Learn

Control and enforce rules across your Azure environment:
- ✅ What is Azure Policy and why use it
- ✅ Policy vs RBAC (different things!)
- ✅ Built-in policies (ready to use)
- ✅ Custom policies (write your own rules)
- ✅ Policy effects (deny, audit, modify, etc.)
- ✅ Policy initiatives (group of policies)
- ✅ Compliance dashboard
- ✅ Remediation (fix existing resources)
- ✅ Complete test, check, and confirm

## Table of Contents

1. [What is Azure Policy?](#what-is-azure-policy)
2. [Why Use Azure Policy?](#why-use-azure-policy)
3. [Policy vs RBAC](#policy-vs-rbac)
4. [How Policy Works](#how-policy-works)
5. [Lab 1: Explore Built-in Policies](#lab-1-explore-built-in-policies)
6. [Lab 2: Assign a Policy - Allowed Locations](#lab-2-assign-a-policy---allowed-locations)
7. [Lab 3: Assign a Policy - Require Tags](#lab-3-assign-a-policy---require-tags)
8. [Lab 4: Audit Policy - Storage HTTPS](#lab-4-audit-policy---storage-https)
9. [Lab 5: Create Custom Policy](#lab-5-create-custom-policy)
10. [Lab 6: Policy Initiative (Group of Policies)](#lab-6-policy-initiative-group-of-policies)
11. [Lab 7: Remediation (Fix Existing Resources)](#lab-7-remediation-fix-existing-resources)
12. [Lab 8: Compliance Dashboard](#lab-8-compliance-dashboard)
13. [Cleanup](#cleanup)

---

## What is Azure Policy?

**Azure Policy** = Rules that control what people CAN and CANNOT do in Azure.

### Simple Explanation

```
Think of it like this:

🏢 Company Rules:
  "All employees must wear ID badges"
  "No food in the server room"
  "All laptops must have antivirus"

☁️ Azure Policy:
  "All resources must be in East US or West US"
  "All VMs must have tags"
  "No public IP addresses on databases"
  "All storage accounts must use HTTPS"

The rules are AUTOMATICALLY enforced.
You don't need to check manually!
```

### What Does Policy Do?

```
┌─────────────────────────────────────────────────────────────────┐
│  AZURE POLICY                                                    │
│                                                                  │
│  1. PREVENT bad configurations                                  │
│     ┌─────────────────────────────────────────────────────┐    │
│     │  Developer tries to create VM in Brazil South       │    │
│     │  Policy: "Only East US and West US allowed"         │    │
│     │  Result: ❌ DENIED! "Location not allowed"          │    │
│     └─────────────────────────────────────────────────────┘    │
│                                                                  │
│  2. AUDIT non-compliant resources                               │
│     ┌─────────────────────────────────────────────────────┐    │
│     │  Storage account without HTTPS                       │    │
│     │  Policy: "Audit storage without HTTPS"              │    │
│     │  Result: ⚠️ Flagged as non-compliant                │    │
│     │  (Not blocked, just reported)                        │    │
│     └─────────────────────────────────────────────────────┘    │
│                                                                  │
│  3. AUTO-FIX resources                                          │
│     ┌─────────────────────────────────────────────────────┐    │
│     │  VM created without "environment" tag                │    │
│     │  Policy: "Add default tag if missing"               │    │
│     │  Result: ✅ Tag automatically added!                 │    │
│     └─────────────────────────────────────────────────────┘    │
│                                                                  │
│  4. REPORT compliance status                                    │
│     ┌─────────────────────────────────────────────────────┐    │
│     │  Dashboard shows:                                    │    │
│     │  ├─ 85% resources compliant                         │    │
│     │  ├─ 12 resources non-compliant                      │    │
│     │  └─ 3 policies need attention                       │    │
│     └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Why Use Azure Policy?

### The Problem

```
❌ WITHOUT POLICY:

Scenario 1: Cost Explosion
  Developer creates 10 VMs with Standard_E64_v3 (64 cores, $$$)
  In Brazil South region (expensive!)
  Nobody notices until the $50,000 bill arrives
  Manager: "WHO DID THIS?!"

Scenario 2: Security Breach
  Developer creates storage account with public access
  Sensitive data exposed to the internet
  Hacker downloads customer data
  Company: "How did this happen?!"

Scenario 3: Compliance Failure
  Auditor: "Show me all resources have encryption enabled"
  You: "Uh... let me check 500 resources manually..."
  Auditor: "You FAILED the audit"

Scenario 4: Tag Chaos
  100 resources with no tags
  Finance: "Which team owns this $10,000/month VM?"
  Everyone: "Not mine!"
  Nobody knows who to charge
```

### The Solution

```
✅ WITH AZURE POLICY:

Scenario 1: Cost Control
  Policy: "Only allow Standard_B1s, B2s, D2s_v3"
  Policy: "Only allow East US and West US"
  Developer tries expensive VM → ❌ DENIED
  Bill stays under control ✅

Scenario 2: Security Enforcement
  Policy: "Storage accounts must disable public access"
  Policy: "All databases must have encryption"
  Developer tries public storage → ❌ DENIED
  Data stays secure ✅

Scenario 3: Compliance Reporting
  Policy: "Audit all resources without encryption"
  Dashboard: "98% compliant, 2% need fixing"
  Auditor: "Great, you PASSED" ✅

Scenario 4: Tag Enforcement
  Policy: "All resources MUST have 'owner' and 'environment' tags"
  Developer creates VM without tags → ❌ DENIED
  Or: Policy auto-adds default tags ✅
```

---

## Policy vs RBAC

```
⚠️ COMMON CONFUSION: Policy and RBAC are DIFFERENT things!

┌─────────────────────────────┬─────────────────────────────────┐
│  RBAC                        │  Azure Policy                   │
│  (Role-Based Access Control) │  (Governance Rules)             │
├─────────────────────────────┼─────────────────────────────────┤
│  WHO can do WHAT             │  WHAT is allowed to exist       │
│                              │                                 │
│  "Alice can create VMs"     │  "VMs must be in East US"       │
│  "Bob can only read"        │  "VMs must have tags"           │
│  "Carol can delete storage" │  "No public IPs on databases"   │
│                              │                                 │
│  Controls: People            │  Controls: Resources            │
│  Question: "Can this USER    │  Question: "Can this RESOURCE   │
│  perform this action?"       │  be created with this config?"  │
│                              │                                 │
│  Example:                    │  Example:                       │
│  Alice has VM Contributor    │  Policy: Only East US           │
│  → She CAN create VMs       │  Alice creates VM in West EU    │
│  → RBAC says YES             │  → Policy says NO!              │
│                              │                                 │
│  RBAC + Policy work together:│                                 │
│  RBAC: "Alice can create VMs"│                                 │
│  Policy: "Only in East US"   │                                 │
│  → Alice can create VMs,     │                                 │
│    but ONLY in East US       │                                 │
└─────────────────────────────┴─────────────────────────────────┘
```

---

## How Policy Works

### Policy Effects

```
┌─────────────────────────────────────────────────────────────────┐
│  POLICY EFFECTS (What happens when rule is violated)             │
│                                                                  │
│  1. Deny                                                        │
│     ❌ BLOCKS the resource creation/update                      │
│     "You cannot create this resource!"                          │
│     Use for: Hard rules that must never be broken               │
│     Example: "No resources outside East US"                     │
│                                                                  │
│  2. Audit                                                       │
│     ⚠️ ALLOWS but FLAGS as non-compliant                       │
│     "Resource created, but it's not compliant"                  │
│     Use for: Monitoring, gradual enforcement                    │
│     Example: "Flag VMs without backup enabled"                  │
│                                                                  │
│  3. Modify                                                      │
│     ✏️ AUTO-CHANGES the resource to be compliant                │
│     "Resource created, and I fixed it for you"                  │
│     Use for: Adding tags, enabling settings                     │
│     Example: "Add 'environment=dev' tag if missing"             │
│                                                                  │
│  4. Append                                                      │
│     ➕ ADDS properties to the resource                          │
│     "Resource created, and I added extra config"                │
│     Use for: Adding security settings                           │
│     Example: "Add IP restriction to all web apps"               │
│                                                                  │
│  5. AuditIfNotExists                                            │
│     ⚠️ Checks if a RELATED resource exists                     │
│     "VM exists but no backup policy? Flag it!"                  │
│     Use for: Checking dependent resources                       │
│     Example: "Audit VMs without antimalware extension"          │
│                                                                  │
│  6. DeployIfNotExists                                           │
│     🚀 AUTO-DEPLOYS a related resource                          │
│     "VM created without monitoring? I'll add it!"               │
│     Use for: Auto-configuring required settings                 │
│     Example: "Deploy diagnostic settings on all VMs"            │
│                                                                  │
│  7. Disabled                                                    │
│     ⏸️ Policy exists but is turned off                          │
│     Use for: Testing, temporary disable                         │
└─────────────────────────────────────────────────────────────────┘
```

### Policy Assignment Flow

```
┌──────────────────────────────────────────────────────────────────┐
│  HOW POLICY WORKS                                                 │
│                                                                   │
│  Step 1: Policy Definition (the rule)                            │
│  ┌──────────────────────────────────────┐                        │
│  │  "Allowed locations"                  │                        │
│  │  IF resource.location NOT IN          │                        │
│  │     [eastus, westus]                  │                        │
│  │  THEN deny                            │                        │
│  └──────────────────────────────────────┘                        │
│                    ↓                                              │
│  Step 2: Policy Assignment (where to apply)                      │
│  ┌──────────────────────────────────────┐                        │
│  │  Assign to:                           │                        │
│  │  ├─ Management Group (all subs)      │                        │
│  │  ├─ Subscription (one sub)           │                        │
│  │  └─ Resource Group (one RG)          │                        │
│  └──────────────────────────────────────┘                        │
│                    ↓                                              │
│  Step 3: Evaluation (Azure checks)                               │
│  ┌──────────────────────────────────────┐                        │
│  │  Every resource create/update:        │                        │
│  │  "Does this comply with the policy?"  │                        │
│  │  YES → ✅ Allow                       │                        │
│  │  NO  → ❌ Deny (or audit/modify)     │                        │
│  └──────────────────────────────────────┘                        │
│                    ↓                                              │
│  Step 4: Compliance Report                                       │
│  ┌──────────────────────────────────────┐                        │
│  │  Dashboard:                           │                        │
│  │  ├─ 95% compliant                    │                        │
│  │  ├─ 5 non-compliant resources        │                        │
│  │  └─ Remediation available            │                        │
│  └──────────────────────────────────────┘                        │
└──────────────────────────────────────────────────────────────────┘
```

### Scope (Where Policy Applies)

```
┌──────────────────────────────────────────────────────────────┐
│  POLICY SCOPE (Hierarchy)                                     │
│                                                               │
│  Management Group (highest - applies to ALL below)           │
│  └─ Subscription                                             │
│     └─ Resource Group                                        │
│        └─ Resource                                           │
│                                                               │
│  Example:                                                    │
│  Assign "Allowed locations" at Subscription level            │
│  → Applies to ALL resource groups in that subscription       │
│  → Applies to ALL resources in those groups                  │
│                                                               │
│  Assign "Require tags" at Resource Group level               │
│  → Applies ONLY to resources in that specific group          │
│                                                               │
│  You can also EXCLUDE specific resource groups:              │
│  "Apply to subscription EXCEPT rg-sandbox"                   │
│  → Sandbox group is exempt from the policy                   │
└──────────────────────────────────────────────────────────────┘
```

---

## Lab 1: Explore Built-in Policies

### What are Built-in Policies?

```
Azure provides 1000+ pre-built policies ready to use!
You don't need to write any code.

Categories:
  ├─ General (locations, tags, resource types)
  ├─ Compute (VM sizes, disk encryption)
  ├─ Storage (HTTPS, public access, encryption)
  ├─ Network (NSGs, public IPs, firewalls)
  ├─ SQL (auditing, encryption, firewall)
  ├─ Monitoring (diagnostics, log analytics)
  ├─ Security Center (security recommendations)
  └─ Many more...
```

### Step 1: Create Resource Group for Labs

```
1. Open Azure Portal
2. Search "Resource groups" → "+ Create"
3. Fill in:
   - Resource group: rg-day28-policy
   - Region: East US
4. Click "Review + create" → "Create"
```

### Step 2: Browse Built-in Policies

```
1. Search "Policy" in Azure Portal
2. Click "Policy" (Azure Policy service)
3. Left menu → "Definitions"
4. You'll see ALL available policy definitions

5. Filter by:
   - Definition type: Policy (not Initiative)
   - Category: General
   
6. Browse some popular policies:
   ├─ "Allowed locations"
   ├─ "Allowed resource types"
   ├─ "Not allowed resource types"
   ├─ "Require a tag on resources"
   └─ "Inherit a tag from the resource group"

7. Click on "Allowed locations" to see:
   - Description: What it does
   - Effect: Deny
   - Policy rule: The JSON logic
```

### Step 3: Understand Policy Definition Structure

```
Click on any policy → Click "Policy definition" (JSON view)

A policy definition has:
{
  "if": {
    // CONDITION: When does this policy apply?
    "field": "location",
    "notIn": "[parameters('listOfAllowedLocations')]"
  },
  "then": {
    // EFFECT: What happens?
    "effect": "deny"
  }
}

In plain English:
  IF the resource location is NOT IN the allowed list
  THEN deny the creation

That's it! Every policy is just IF → THEN logic.
```

### Step 4: Test, Check, and Confirm - Explore

**Test 1: Verify Policy Service**

```
1. Search "Policy" in Portal
2. Verify:
   ✅ Policy service opens
   ✅ Overview shows compliance summary
   ✅ Definitions shows available policies
```

**Test 2: Verify Built-in Policies Exist**

```
1. Policy → Definitions
2. Search "Allowed locations"
3. Verify:
   ✅ Policy found
   ✅ Type: Built-in
   ✅ Category: General
```

**Test 3: Verify Policy Categories**

```
1. Policy → Definitions → Filter by Category
2. Verify categories exist:
   ✅ General
   ✅ Compute
   ✅ Storage
   ✅ Network
   ✅ SQL
   ✅ Monitoring
```

**✅ Result**: Azure Policy service explored!

---

## Lab 2: Assign a Policy - Allowed Locations

### What We'll Do

```
Assign the "Allowed locations" policy to restrict where
resources can be created. Only East US and West US allowed!

Anyone trying to create a resource in another region → DENIED!
```

### Step 1: Assign the Policy

```
1. Go to "Policy" in Azure Portal
2. Left menu → "Assignments"
3. Click "+ Assign policy" (top button)
4. Fill in:

   Basics tab:
   - Scope: Click the "..." button
     - Select your Subscription
     - Select Resource group: rg-day28-policy
     - Click "Select"
   - Exclusions: Leave empty (no exclusions)
   - Policy definition: Click the "..." button
     - Search: "Allowed locations"
     - Select: "Allowed locations"
     - Click "Select"
   - Assignment name: Restrict-Locations (auto-filled)
   - Description: Only allow East US and West US
   - Policy enforcement: Enabled

   Parameters tab:
   - Allowed locations: Select:
     ✅ East US
     ✅ West US
     (Uncheck everything else)

   Remediation tab:
   - Leave defaults (no remediation for Deny policies)

   Non-compliance messages tab:
   - Non-compliance message: 
     "This location is not allowed. Please use East US or West US only."

5. Click "Review + create" → "Create"
```

**⏱️ Wait**: 5-15 minutes for policy to take effect

```
┌──────────────────────────────────────────────────────────────┐
│  WHAT WE JUST DID                                             │
│                                                               │
│  Policy: "Allowed locations"                                 │
│  Scope: rg-day28-policy                                      │
│  Allowed: East US, West US                                   │
│  Effect: Deny                                                │
│                                                               │
│  Now:                                                        │
│  Create VM in East US → ✅ Allowed                           │
│  Create VM in West US → ✅ Allowed                           │
│  Create VM in West Europe → ❌ DENIED!                       │
│  Create VM in Brazil South → ❌ DENIED!                      │
│  Create Storage in Japan → ❌ DENIED!                        │
└──────────────────────────────────────────────────────────────┘
```

### Step 2: Test the Policy (Try to Break It!)

```
1. Try to create a Storage Account in a BLOCKED region:
   - Search "Storage accounts" → "+ Create"
   - Resource group: rg-day28-policy
   - Name: stday28policytest
   - Region: West Europe ← BLOCKED!
   - Click "Review + create"

2. Expected result:
   ❌ "Validation failed"
   Error message: "This location is not allowed. 
   Please use East US or West US only."
   
   ✅ Policy BLOCKED the creation!

3. Now try an ALLOWED region:
   - Same settings but Region: East US ← ALLOWED!
   - Click "Review + create" → "Create"
   
   ✅ Resource created successfully!
```

### Step 3: Test, Check, and Confirm - Allowed Locations

**Test 1: Verify Policy Assignment**

```
1. Policy → Assignments
2. Verify:
   ✅ "Restrict-Locations" assignment exists
   ✅ Scope: rg-day28-policy
   ✅ Policy: Allowed locations
   ✅ Enforcement: Enabled
```

**Test 2: Verify Blocked Region**

```
1. Try creating any resource in West Europe
2. Verify:
   ✅ Validation fails
   ✅ Error mentions policy
   ✅ Custom message shown: "This location is not allowed..."
```

**Test 3: Verify Allowed Region**

```
1. Create resource in East US
2. Verify:
   ✅ Resource created successfully
   ✅ No policy error
```

**Test 4: Verify Compliance**

```
1. Policy → Compliance
2. Find "Restrict-Locations"
3. Verify:
   ✅ Compliance state shown
   ✅ Compliant resources listed
```

**✅ Result**: Location restriction policy working!

---

## Lab 3: Assign a Policy - Require Tags

### What We'll Do

```
Require ALL resources to have an "environment" tag.
No tag = No resource creation!

This is one of the most common policies in real companies.
```

### Step 1: Assign Tag Policy

```
1. Policy → Assignments → "+ Assign policy"
2. Fill in:

   Basics tab:
   - Scope: rg-day28-policy
   - Policy definition: Search "Require a tag on resources"
     Select: "Require a tag on resources"
   - Assignment name: Require-Environment-Tag

   Parameters tab:
   - Tag Name: environment

   Non-compliance messages tab:
   - Message: "All resources must have an 'environment' tag 
     (dev, staging, or prod)."

3. Click "Review + create" → "Create"
```

**⏱️ Wait**: 5-15 minutes

### Step 2: Test the Tag Policy

```
1. Try creating a Storage Account WITHOUT the tag:
   - Resource group: rg-day28-policy
   - Name: stday28notag
   - Region: East US
   - Tags: (leave empty - no tags!)
   - Click "Review + create"

2. Expected result:
   ❌ "Validation failed"
   "All resources must have an 'environment' tag"
   
   ✅ Policy BLOCKED creation without tag!

3. Now try WITH the tag:
   - Same settings
   - Tags tab: 
     Name: environment
     Value: dev
   - Click "Review + create" → "Create"
   
   ✅ Resource created with tag!
```

### Step 3: Test, Check, and Confirm - Tags

**Test 1: Verify Policy Assignment**

```
1. Policy → Assignments
2. Verify:
   ✅ "Require-Environment-Tag" exists
   ✅ Tag Name parameter: environment
```

**Test 2: Verify Blocked Without Tag**

```
1. Try creating resource without "environment" tag
2. Verify:
   ✅ Validation fails
   ✅ Custom error message shown
```

**Test 3: Verify Allowed With Tag**

```
1. Create resource with environment=dev tag
2. Verify:
   ✅ Resource created
   ✅ Tag visible on resource
```

**✅ Result**: Tag enforcement policy working!

---

## Lab 4: Audit Policy - Storage HTTPS

### What We'll Do

```
Instead of BLOCKING, this policy AUDITS (reports) storage accounts
that don't enforce HTTPS. Non-compliant resources are flagged
but NOT blocked.

Audit = "I'll let you do it, but I'm watching and reporting"
```

### Step 1: Assign Audit Policy

```
1. Policy → Assignments → "+ Assign policy"
2. Fill in:

   Basics tab:
   - Scope: rg-day28-policy
   - Policy definition: Search "Secure transfer"
     Select: "Secure transfer to storage accounts should be enabled"
   - Assignment name: Audit-Storage-HTTPS

   Parameters tab:
   - Effect: Audit (not Deny!)

   Non-compliance messages tab:
   - Message: "Storage account should require HTTPS. 
     Please enable 'Secure transfer required'."

3. Click "Review + create" → "Create"
```

### Step 2: Check Existing Resources

```
⏱️ Wait 15-30 minutes for initial compliance scan

1. Policy → Compliance
2. Find "Audit-Storage-HTTPS"
3. Click on it
4. You'll see:
   - Compliant resources (HTTPS enabled)
   - Non-compliant resources (HTTPS not enabled)
   
   Most modern storage accounts have HTTPS by default,
   so they should be compliant.
```

### Step 3: Understand Audit vs Deny

```
┌──────────────────────────────────────────────────────────────┐
│  AUDIT vs DENY                                                │
│                                                               │
│  Deny:                                                       │
│  ├─ BLOCKS resource creation                                 │
│  ├─ User sees error immediately                              │
│  ├─ Resource does NOT exist                                  │
│  └─ Use for: Hard rules (location, VM size)                  │
│                                                               │
│  Audit:                                                      │
│  ├─ ALLOWS resource creation                                 │
│  ├─ Flags as non-compliant in dashboard                      │
│  ├─ Resource EXISTS but is flagged                           │
│  └─ Use for: Gradual enforcement, monitoring                 │
│                                                               │
│  Common pattern:                                             │
│  1. Start with Audit (see what's non-compliant)             │
│  2. Fix existing resources                                   │
│  3. Switch to Deny (prevent new violations)                  │
│                                                               │
│  This is called "Audit first, Deny later"                    │
└──────────────────────────────────────────────────────────────┘
```

### Step 4: Test, Check, and Confirm - Audit

**Test 1: Verify Policy Assignment**

```
1. Policy → Assignments
2. Verify:
   ✅ "Audit-Storage-HTTPS" exists
   ✅ Effect: Audit
```

**Test 2: Verify Compliance Report**

```
1. Policy → Compliance
2. Click "Audit-Storage-HTTPS"
3. Verify:
   ✅ Compliance percentage shown
   ✅ Compliant/Non-compliant resources listed
   ✅ Resource details available
```

**Test 3: Verify Audit Doesn't Block**

```
1. Create a storage account (any config)
2. Verify:
   ✅ Resource created (NOT blocked)
   ✅ If non-compliant, appears in compliance report
   ✅ Audit only reports, doesn't prevent
```

**✅ Result**: Audit policy working!

---

## Lab 5: Create Custom Policy

### What We'll Do

```
Create your OWN policy rule from scratch!
Rule: "Deny VMs larger than Standard_B2s"
This prevents anyone from creating expensive VMs.
```

### Step 1: Understand Policy Rule Structure

```
Every policy rule is JSON with this structure:

{
  "if": {
    // CONDITION: When does this rule apply?
  },
  "then": {
    // EFFECT: What happens?
  }
}

Our rule in plain English:
  IF the resource is a Virtual Machine
  AND the VM size is NOT in our allowed list
  THEN deny it

In JSON:
  IF type == "Microsoft.Compute/virtualMachines"
  AND properties.hardwareProfile.vmSize NOT IN [B1s, B2s, D2s_v3]
  THEN deny
```

### Step 2: Create Custom Policy Definition

```
1. Policy → Definitions
2. Click "+ Policy definition" (top button)
3. Fill in:

   Definition location: Click "..."
   - Select your Subscription
   - Click "Select"

   Name: Restrict-VM-Sizes
   Description: Only allow small VM sizes to control costs.
                Allowed: Standard_B1s, Standard_B2s, Standard_D2s_v3
   Category: Click "Use existing" → Select "Compute"

   Policy rule: Delete the default content and paste:
```

```json
{
  "mode": "All",
  "policyRule": {
    "if": {
      "allOf": [
        {
          "field": "type",
          "equals": "Microsoft.Compute/virtualMachines"
        },
        {
          "not": {
            "field": "Microsoft.Compute/virtualMachines/hardwareProfile.vmSize",
            "in": "[parameters('allowedVmSizes')]"
          }
        }
      ]
    },
    "then": {
      "effect": "[parameters('effect')]"
    }
  },
  "parameters": {
    "allowedVmSizes": {
      "type": "Array",
      "metadata": {
        "displayName": "Allowed VM Sizes",
        "description": "List of allowed VM sizes"
      },
      "defaultValue": [
        "Standard_B1s",
        "Standard_B2s",
        "Standard_B1ms",
        "Standard_B2ms",
        "Standard_D2s_v3",
        "Standard_D2as_v4"
      ]
    },
    "effect": {
      "type": "String",
      "metadata": {
        "displayName": "Effect",
        "description": "Deny or Audit"
      },
      "allowedValues": [
        "Deny",
        "Audit",
        "Disabled"
      ],
      "defaultValue": "Deny"
    }
  }
}
```

```
4. Click "Save"
```

**Let's break down the policy rule:**

```
"allOf": [...]
  → ALL conditions must be true (AND logic)

"field": "type", "equals": "Microsoft.Compute/virtualMachines"
  → Only applies to VMs (not storage, not VNets, etc.)

"not": { "field": "...vmSize", "in": "[parameters('allowedVmSizes')]" }
  → VM size is NOT in the allowed list

"then": { "effect": "[parameters('effect')]" }
  → Deny (or Audit, configurable via parameter)

Result:
  Standard_B1s → ✅ Allowed (in list)
  Standard_B2s → ✅ Allowed (in list)
  Standard_E64_v3 → ❌ DENIED (not in list!)
  Standard_M128s → ❌ DENIED (not in list!)
```

### Step 3: Assign Custom Policy

```
1. Policy → Assignments → "+ Assign policy"
2. Fill in:

   Basics tab:
   - Scope: rg-day28-policy
   - Policy definition: Search "Restrict-VM-Sizes"
     (Your custom policy!)
   - Assignment name: Restrict-VM-Sizes

   Parameters tab:
   - Allowed VM Sizes: Leave defaults
     [Standard_B1s, Standard_B2s, Standard_B1ms, 
      Standard_B2ms, Standard_D2s_v3, Standard_D2as_v4]
   - Effect: Deny

   Non-compliance messages tab:
   - Message: "This VM size is not allowed. 
     Please use Standard_B1s, B2s, or D2s_v3 to control costs."

3. Click "Review + create" → "Create"
```

**⏱️ Wait**: 5-15 minutes

### Step 4: Test Custom Policy

```
1. Try creating a VM with a LARGE size:
   - Resource group: rg-day28-policy
   - Name: vm-expensive
   - Region: East US
   - Size: Standard_D8s_v3 (8 cores - NOT in allowed list!)
   - Click "Review + create"

2. Expected result:
   ❌ "Validation failed"
   "This VM size is not allowed. Please use Standard_B1s, B2s, or D2s_v3"
   
   ✅ Custom policy BLOCKED expensive VM!

3. Try with an ALLOWED size:
   - Same settings but Size: Standard_B1s ← ALLOWED!
   - Tags: environment = dev (required by Lab 3 policy!)
   - Click "Review + create" → "Create"
   
   ✅ VM created with allowed size!
```

### Step 5: Test, Check, and Confirm - Custom Policy

**Test 1: Verify Custom Policy Definition**

```
1. Policy → Definitions
2. Search "Restrict-VM-Sizes"
3. Verify:
   ✅ Definition exists
   ✅ Type: Custom
   ✅ Category: Compute
```

**Test 2: Verify Policy Assignment**

```
1. Policy → Assignments
2. Verify:
   ✅ "Restrict-VM-Sizes" assigned
   ✅ Effect: Deny
   ✅ Scope: rg-day28-policy
```

**Test 3: Verify Blocked VM**

```
1. Try creating Standard_D8s_v3 VM
2. Verify:
   ✅ Validation fails
   ✅ Custom error message shown
```

**Test 4: Verify Allowed VM**

```
1. Create Standard_B1s VM (with environment tag!)
2. Verify:
   ✅ VM created successfully
   ✅ Both policies satisfied (location + tag + size)
```

**✅ Result**: Custom policy working!

---

## Lab 6: Policy Initiative (Group of Policies)

### What is an Initiative?

```
Initiative = A GROUP of policies bundled together

┌──────────────────────────────────────────────────────────────┐
│  INITIATIVE (also called "Policy Set")                        │
│                                                               │
│  Without Initiative:                                         │
│  Assign policy 1... assign policy 2... assign policy 3...   │
│  10 policies = 10 separate assignments 😩                    │
│                                                               │
│  With Initiative:                                            │
│  Bundle 10 policies into 1 initiative                        │
│  1 assignment = all 10 policies applied! 😊                  │
│                                                               │
│  Example: "Company Security Standards"                       │
│  ├─ Policy 1: Allowed locations (East US, West US)          │
│  ├─ Policy 2: Require environment tag                        │
│  ├─ Policy 3: Restrict VM sizes                              │
│  ├─ Policy 4: Storage must use HTTPS                         │
│  ├─ Policy 5: No public IPs on databases                     │
│  └─ Policy 6: All VMs must have backup                       │
│                                                               │
│  Assign "Company Security Standards" once                    │
│  → All 6 policies enforced!                                  │
└──────────────────────────────────────────────────────────────┘
```

### Step 1: Create Custom Initiative

```
1. Policy → Definitions
2. Click "+ Initiative definition" (top button)
3. Fill in:

   Basics tab:
   - Definition location: Your Subscription
   - Name: Day28-Company-Standards
   - Description: Company-wide governance standards for all resources
   - Category: Create new → "Company Standards"

   Policies tab:
   Click "+ Add policy definition(s)" and add these:

   Policy 1: Search "Allowed locations"
   → Select "Allowed locations" → Click "Add"

   Policy 2: Search "Require a tag on resources"
   → Select "Require a tag on resources" → Click "Add"

   Policy 3: Search "Secure transfer"
   → Select "Secure transfer to storage accounts should be enabled"
   → Click "Add"

   Policy 4: Search "Allowed virtual machine size SKUs"
   → Select "Allowed virtual machine size SKUs" → Click "Add"

   You should now have 4 policies in the initiative.

   Initiative parameters tab:
   - You'll see parameters from all 4 policies
   - Configure:
     - Allowed locations: Set value → East US, West US
     - Tag Name: Set value → environment
     - Allowed virtual machine size SKUs: Set value →
       Standard_B1s, Standard_B2s, Standard_D2s_v3

   Policy parameters tab:
   - Map initiative parameters to policy parameters
   - Most should auto-map

4. Click "Save"
```

### Step 2: Assign the Initiative

```
1. Policy → Assignments → "+ Assign initiative"
2. Fill in:

   Basics tab:
   - Scope: rg-day28-policy
   - Initiative definition: Search "Day28-Company-Standards"
   - Assignment name: Company-Standards-Assignment

   Parameters tab:
   - Verify all parameters are set:
     ✅ Allowed locations: East US, West US
     ✅ Tag Name: environment
     ✅ Allowed VM sizes: B1s, B2s, D2s_v3

   Non-compliance messages tab:
   - Default message: "Resource does not comply with company standards."
   - You can also set per-policy messages:
     Click "+ Add non-compliance message"
     - Policy: Allowed locations
     - Message: "Only East US and West US regions are allowed."

3. Click "Review + create" → "Create"
```

**⏱️ Wait**: 5-15 minutes

### Step 3: Test the Initiative

```
Test 1: Try wrong location
  Create storage in West Europe → ❌ DENIED (location policy)

Test 2: Try without tag
  Create storage in East US, no tag → ❌ DENIED (tag policy)

Test 3: Try large VM
  Create Standard_E8_v3 VM → ❌ DENIED (VM size policy)

Test 4: Try everything correct
  Create storage in East US, with environment=dev tag
  → ✅ ALLOWED (all policies satisfied!)
```

### Step 4: Test, Check, and Confirm - Initiative

**Test 1: Verify Initiative Definition**

```
1. Policy → Definitions
2. Search "Day28-Company-Standards"
3. Verify:
   ✅ Type: Custom Initiative
   ✅ Contains 4 policies
   ✅ Category: Company Standards
```

**Test 2: Verify Initiative Assignment**

```
1. Policy → Assignments
2. Verify:
   ✅ "Company-Standards-Assignment" exists
   ✅ Type: Initiative
   ✅ Scope: rg-day28-policy
```

**Test 3: Verify All Policies Enforced**

```
1. Try violating each policy individually:
   ✅ Wrong location → Denied
   ✅ Missing tag → Denied
   ✅ Large VM → Denied
   ✅ All correct → Allowed
```

**Test 4: Verify Compliance**

```
1. Policy → Compliance
2. Click "Company-Standards-Assignment"
3. Verify:
   ✅ Overall compliance percentage
   ✅ Per-policy compliance breakdown
   ✅ Non-compliant resources listed (if any)
```

**✅ Result**: Policy initiative working!

---

## Lab 7: Remediation (Fix Existing Resources)

### What is Remediation?

```
Remediation = Automatically FIX existing non-compliant resources

┌──────────────────────────────────────────────────────────────┐
│  THE PROBLEM:                                                 │
│                                                               │
│  You assign a "Modify" policy to add tags                    │
│  But you already have 50 resources WITHOUT tags              │
│  Policy only applies to NEW resources by default!            │
│                                                               │
│  THE SOLUTION:                                               │
│  Remediation task = Go back and fix existing resources       │
│                                                               │
│  Before remediation:                                         │
│  ├─ Resource 1: No tag ❌                                    │
│  ├─ Resource 2: No tag ❌                                    │
│  └─ Resource 3: Has tag ✅                                   │
│                                                               │
│  After remediation:                                          │
│  ├─ Resource 1: Tag added ✅ (fixed!)                        │
│  ├─ Resource 2: Tag added ✅ (fixed!)                        │
│  └─ Resource 3: Has tag ✅ (already compliant)               │
└──────────────────────────────────────────────────────────────┘
```

### Step 1: Assign a Modify Policy (Auto-Add Tags)

```
1. Policy → Assignments → "+ Assign policy"
2. Fill in:

   Basics tab:
   - Scope: rg-day28-policy
   - Policy definition: Search "Inherit a tag from the resource group"
     Select: "Inherit a tag from the resource group"
   - Assignment name: Inherit-CostCenter-Tag

   Parameters tab:
   - Tag Name: costCenter

   Remediation tab:
   ⚠️ IMPORTANT for Modify policies:
   - Check "Create a remediation task"
   - Managed Identity:
     - Type: System assigned managed identity
     - Location: East US
   
   (Modify policies need a managed identity to make changes)

   Non-compliance messages tab:
   - Message: "Resource should inherit 'costCenter' tag from resource group."

3. Click "Review + create" → "Create"
```

### Step 2: Add Tag to Resource Group

```
1. Go to resource group: rg-day28-policy
2. Click "Tags" (left menu or top)
3. Add tag:
   - Name: costCenter
   - Value: IT-Department
4. Click "Apply"
```

### Step 3: Create a Resource (Test Auto-Tag)

```
1. Create a storage account:
   - Resource group: rg-day28-policy
   - Name: stday28inherit
   - Region: East US
   - Tags: environment = dev (required by earlier policy)
     (Do NOT add costCenter tag manually!)
   - Click "Create"

2. After creation, check the storage account's tags:
   - Go to stday28inherit → Tags
   
   Expected:
   ✅ environment: dev (you added this)
   ✅ costCenter: IT-Department (POLICY added this automatically!)
   
   The Modify policy inherited the tag from the resource group!
```

### Step 4: Run Remediation for Existing Resources

```
1. Policy → Compliance
2. Find "Inherit-CostCenter-Tag"
3. Click on it
4. You'll see non-compliant resources (created before the policy)

5. Click "Create Remediation Task" (top button)
6. Fill in:
   - Policy assignment: Inherit-CostCenter-Tag
   - Resources to remediate: All non-compliant resources
     (or select specific ones)
7. Click "Remediate"

⏱️ Wait: 5-10 minutes

8. Check remediation progress:
   Policy → Remediation → Remediation tasks
   Status should change to "Complete"
```

### Step 5: Verify Remediation

```
1. Go to previously existing resources in rg-day28-policy
2. Check their tags
3. Verify:
   ✅ costCenter: IT-Department tag now exists on ALL resources
   ✅ Tag was added by remediation task
   ✅ Existing resources are now compliant!
```

### Step 6: Test, Check, and Confirm - Remediation

**Test 1: Verify Modify Policy**

```
1. Policy → Assignments
2. Verify:
   ✅ "Inherit-CostCenter-Tag" exists
   ✅ Has managed identity (for making changes)
```

**Test 2: Verify Auto-Tag on New Resources**

```
1. Create new resource in rg-day28-policy
2. Verify:
   ✅ costCenter tag automatically added
   ✅ Value matches resource group tag
```

**Test 3: Verify Remediation Task**

```
1. Policy → Remediation → Remediation tasks
2. Verify:
   ✅ Task exists
   ✅ Status: Complete (or Evaluating)
   ✅ Resources remediated count shown
```

**Test 4: Verify Existing Resources Fixed**

```
1. Check tags on resources that existed before policy
2. Verify:
   ✅ costCenter tag now present
   ✅ All resources in rg-day28-policy have the tag
```

**✅ Result**: Remediation working!

---

## Lab 8: Compliance Dashboard

### What is the Compliance Dashboard?

```
Compliance Dashboard = See ALL policy compliance in one place

┌──────────────────────────────────────────────────────────────┐
│  COMPLIANCE DASHBOARD                                         │
│                                                               │
│  Overall Compliance: 87%                                     │
│  ████████████████████░░░                                     │
│                                                               │
│  By Policy:                                                  │
│  ├─ Allowed locations:        100% ✅ ████████████████████   │
│  ├─ Require environment tag:   90% ⚠️ ██████████████████░░  │
│  ├─ Restrict VM sizes:        100% ✅ ████████████████████   │
│  ├─ Storage HTTPS:             95% ⚠️ ███████████████████░  │
│  └─ Inherit costCenter tag:    75% ⚠️ ███████████████░░░░░  │
│                                                               │
│  Non-compliant resources: 8                                  │
│  ├─ 3 storage accounts without HTTPS                        │
│  ├─ 2 resources without environment tag                     │
│  └─ 3 resources without costCenter tag                      │
└──────────────────────────────────────────────────────────────┘
```

### Step 1: View Overall Compliance

```
1. Go to "Policy" in Azure Portal
2. Left menu → "Compliance"
3. You'll see:
   - Overall compliance percentage
   - List of all policy assignments
   - Compliance state for each
   - Number of non-compliant resources
```

### Step 2: Drill Down into Specific Policy

```
1. Click on any policy assignment (e.g., "Require-Environment-Tag")
2. You'll see:
   - Resource compliance: List of all evaluated resources
   - Compliant: Resources that have the tag
   - Non-compliant: Resources missing the tag
   - Exempt: Resources excluded from the policy
   
3. Click on a non-compliant resource to see:
   - Why it's non-compliant
   - Which policy rule it violates
   - Remediation options
```

### Step 3: View Compliance by Initiative

```
1. Policy → Compliance
2. Click "Company-Standards-Assignment" (the initiative)
3. You'll see:
   - Overall initiative compliance
   - Per-policy breakdown within the initiative
   - Click each policy to see specific non-compliant resources
```

### Step 4: Export Compliance Data

```
1. Policy → Compliance
2. Click "Download compliance report" (top button)
3. Select format: CSV
4. This gives you a spreadsheet with:
   - Every resource
   - Its compliance state
   - Which policies it violates
   - Useful for: Auditors, management reports, tracking
```

### Step 5: View Policy Events (Activity Log)

```
1. Policy → Compliance → Click any policy
2. Click "Events" or go to Activity Log
3. You'll see:
   - When policy was evaluated
   - Which resources were denied
   - Which resources were modified
   - Who triggered the evaluation
```

### Step 6: Test, Check, and Confirm - Dashboard

**Test 1: Verify Overall Compliance**

```
1. Policy → Compliance
2. Verify:
   ✅ Overall compliance percentage shown
   ✅ All policy assignments listed
   ✅ Each has compliance state
```

**Test 2: Verify Per-Policy Compliance**

```
1. Click each policy assignment
2. Verify:
   ✅ Resource list shown
   ✅ Compliant/Non-compliant counts
   ✅ Can drill down to specific resources
```

**Test 3: Verify Initiative Compliance**

```
1. Click initiative assignment
2. Verify:
   ✅ Overall initiative compliance
   ✅ Per-policy breakdown
   ✅ Can see which specific policy causes non-compliance
```

**Test 4: Verify Export**

```
1. Download compliance report
2. Verify:
   ✅ CSV file downloads
   ✅ Contains resource details
   ✅ Contains compliance states
```

**✅ Result**: Compliance dashboard fully explored!

---

## Complete Summary

```
┌─────────────────────────────────────────────────────────────────┐
│  DAY 28 - AZURE POLICY COMPLETE                                 │
│                                                                  │
│  Policies Assigned:                                             │
│  ├─ Allowed Locations (Deny)                                    │
│  │   Only East US and West US                                   │
│  │                                                               │
│  ├─ Require Environment Tag (Deny)                              │
│  │   All resources must have "environment" tag                  │
│  │                                                               │
│  ├─ Audit Storage HTTPS (Audit)                                 │
│  │   Flag storage without HTTPS                                 │
│  │                                                               │
│  ├─ Restrict VM Sizes (Deny) - Custom!                          │
│  │   Only B1s, B2s, D2s_v3 allowed                             │
│  │                                                               │
│  └─ Inherit CostCenter Tag (Modify)                             │
│      Auto-add tag from resource group                           │
│                                                                  │
│  Initiative:                                                    │
│  └─ Company Standards (4 policies bundled)                      │
│                                                                  │
│  Skills Learned:                                                │
│  ├─ Built-in policies (1000+ ready to use)                     │
│  ├─ Custom policies (write your own rules)                     │
│  ├─ Effects: Deny, Audit, Modify                               │
│  ├─ Initiatives (group policies together)                      │
│  ├─ Remediation (fix existing resources)                       │
│  └─ Compliance dashboard (monitor everything)                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Real-World Policy Examples

```
┌─────────────────────────────────────────────────────────────────┐
│  COMMON POLICIES IN PRODUCTION                                   │
│                                                                  │
│  Cost Control:                                                  │
│  ├─ Allowed VM sizes (prevent expensive VMs)                    │
│  ├─ Allowed locations (prevent expensive regions)               │
│  ├─ Require tags (track costs by team/project)                  │
│  └─ Not allowed resource types (block expensive services)       │
│                                                                  │
│  Security:                                                      │
│  ├─ Storage must use HTTPS                                      │
│  ├─ Storage must disable public access                          │
│  ├─ SQL must have auditing enabled                              │
│  ├─ VMs must have disk encryption                               │
│  ├─ Key Vault must have soft delete                             │
│  └─ No public IPs on certain resources                          │
│                                                                  │
│  Compliance:                                                    │
│  ├─ All resources must have tags                                │
│  ├─ Diagnostic settings must be enabled                         │
│  ├─ Backup must be enabled on VMs                               │
│  ├─ Network watcher must be enabled                             │
│  └─ Security Center must be standard tier                       │
│                                                                  │
│  Networking:                                                    │
│  ├─ NSGs must be attached to subnets                            │
│  ├─ No public IPs on VMs (use VPN/Bastion)                     │
│  ├─ VNets must use specific DNS servers                         │
│  └─ Subnets must have service endpoints                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Cleanup

### Remove Policy Assignments and Resources

```
⚠️ IMPORTANT: Remove policy assignments BEFORE deleting resources!
   Otherwise, policies may block deletion.

1. Remove Policy Assignments:
   - Policy → Assignments
   - Delete each assignment:
     - Click assignment → "Delete assignment" (top button)
     - Confirm
   - Delete ALL assignments:
     ✅ Restrict-Locations
     ✅ Require-Environment-Tag
     ✅ Audit-Storage-HTTPS
     ✅ Restrict-VM-Sizes
     ✅ Company-Standards-Assignment
     ✅ Inherit-CostCenter-Tag

2. Remove Custom Definitions:
   - Policy → Definitions
   - Find "Restrict-VM-Sizes" → Delete
   - Find "Day28-Company-Standards" initiative → Delete
   
   Note: You must delete assignments BEFORE definitions.
   A definition in use cannot be deleted.

3. Delete Resource Group:
   - Resource groups → rg-day28-policy
   - Delete resource group
   - Type name to confirm → Delete

4. Clean up Remediation Tasks:
   - Policy → Remediation
   - Delete any remaining remediation tasks
```

**⏱️ Wait**: 5-10 minutes

**✅ Result**: All policies and resources deleted!

---

## Quick Reference

### Policy Effects Summary

```
┌──────────────────┬──────────────────────────────────────────────┐
│  Effect            │  What It Does                                │
├──────────────────┼──────────────────────────────────────────────┤
│  Deny             │  Blocks resource creation/update             │
│  Audit            │  Allows but flags as non-compliant           │
│  Modify           │  Auto-changes resource properties            │
│  Append           │  Adds properties to resource                 │
│  AuditIfNotExists │  Audits if related resource missing          │
│  DeployIfNotExists│  Auto-deploys related resource               │
│  Disabled         │  Policy turned off                           │
└──────────────────┴──────────────────────────────────────────────┘
```

### Policy Rule Operators

```
Condition operators:
  equals, notEquals
  in, notIn
  contains, notContains
  like, notLike (wildcards: *)
  match, notMatch (regex-like)
  exists (true/false)
  greater, less, greaterOrEquals, lessOrEquals

Logical operators:
  allOf (AND - all conditions must be true)
  anyOf (OR - any condition can be true)
  not (negate a condition)
```

### Common Policy Fields

```
field: "type"                    → Resource type
field: "location"                → Azure region
field: "tags"                    → Resource tags
field: "tags['environment']"     → Specific tag value
field: "name"                    → Resource name
field: "kind"                    → Resource kind
field: "sku.name"                → SKU/pricing tier
```

### Useful Links

- [Azure Policy Documentation](https://learn.microsoft.com/azure/governance/policy/)
- [Built-in Policy Definitions](https://learn.microsoft.com/azure/governance/policy/samples/built-in-policies)
- [Policy Definition Structure](https://learn.microsoft.com/azure/governance/policy/concepts/definition-structure)
- [Remediation](https://learn.microsoft.com/azure/governance/policy/how-to/remediate-resources)
- [Azure Policy Samples (GitHub)](https://github.com/Azure/azure-policy)

---

**🎉 Congratulations!** You've completed Day 28 covering Azure Policy for governance, compliance, and resource control!