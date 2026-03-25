# Day 27: Azure Templates (ARM & Bicep) - Infrastructure as Code

## What You'll Learn

Deploy Azure resources using templates instead of clicking in Portal:
- ✅ What are ARM Templates and why they exist
- ✅ What is Bicep (the modern way)
- ✅ Template structure explained visually
- ✅ Deploy VM, Storage, VNet using templates
- ✅ Parameters, Variables, Outputs
- ✅ Template functions and expressions
- ✅ Linked/Nested templates (modular)
- ✅ Export templates from existing resources
- ✅ Complete test, check, and confirm

## Table of Contents

1. [What is a Template?](#what-is-a-template)
2. [Why Use Templates?](#why-use-templates)
3. [ARM Template vs Bicep](#arm-template-vs-bicep)
4. [Template Structure](#template-structure)
5. [Lab 1: Your First ARM Template (Storage Account)](#lab-1-your-first-arm-template-storage-account)
6. [Lab 2: Template with Parameters](#lab-2-template-with-parameters)
7. [Lab 3: Deploy a Virtual Network](#lab-3-deploy-a-virtual-network)
8. [Lab 4: Deploy a Complete VM](#lab-4-deploy-a-complete-vm)
9. [Lab 5: Your First Bicep Template](#lab-5-your-first-bicep-template)
10. [Lab 6: Bicep with Modules](#lab-6-bicep-with-modules)
11. [Lab 7: Export Template from Existing Resources](#lab-7-export-template-from-existing-resources)
12. [Lab 8: Deploy from Azure Portal using Templates](#lab-8-deploy-from-azure-portal-using-templates)
13. [Cleanup](#cleanup)

---

## What is a Template?

**Template** = A file that describes WHAT Azure resources to create, written in code instead of clicking buttons.

### Simple Explanation

```
Think of it like this:

🍕 Ordering Pizza:

  Manual (Azure Portal):
    1. Open pizza app
    2. Click "Large"
    3. Click "Pepperoni"
    4. Click "Extra cheese"
    5. Click "Order"
    → Every time you want pizza, click click click...

  Template (ARM/Bicep):
    File: my-pizza-order.json
    {
      "size": "large",
      "toppings": ["pepperoni", "extra cheese"]
    }
    → Just submit the file. Same pizza every time!

☁️ Creating Azure Resources:

  Manual (Azure Portal):
    1. Search "Storage accounts"
    2. Click "+ Create"
    3. Fill in name, region, SKU...
    4. Click tabs, configure settings...
    5. Click "Create"
    → Every time, click click click... easy to make mistakes!

  Template (ARM/Bicep):
    File: storage.json
    {
      "type": "Microsoft.Storage/storageAccounts",
      "name": "mystorageaccount",
      "location": "eastus",
      "sku": { "name": "Standard_LRS" }
    }
    → Deploy the file. Same result every time!
```

### What Does "Template" Mean in Azure?

```
┌─────────────────────────────────────────────────────────────────┐
│  "TEMPLATE" IN AZURE = A JSON or BICEP FILE THAT DESCRIBES     │
│  WHAT RESOURCES TO CREATE                                        │
│                                                                  │
│  Two formats:                                                   │
│                                                                  │
│  1. ARM Template (JSON format)                                  │
│     ┌─────────────────────────────────────────────┐             │
│     │  {                                           │             │
│     │    "$schema": "...",                         │             │
│     │    "resources": [                            │             │
│     │      {                                       │             │
│     │        "type": "Microsoft.Storage/...",      │             │
│     │        "name": "mystorage",                  │             │
│     │        "location": "eastus"                  │             │
│     │      }                                       │             │
│     │    ]                                         │             │
│     │  }                                           │             │
│     └─────────────────────────────────────────────┘             │
│     File extension: .json                                       │
│     Been around since 2014                                      │
│     Verbose but widely supported                                │
│                                                                  │
│  2. Bicep (Modern, simpler syntax)                              │
│     ┌─────────────────────────────────────────────┐             │
│     │  resource storage 'Microsoft.Storage/        │             │
│     │    storageAccounts@2023-01-01' = {           │             │
│     │    name: 'mystorage'                         │             │
│     │    location: 'eastus'                        │             │
│     │    sku: { name: 'Standard_LRS' }             │             │
│     │    kind: 'StorageV2'                         │             │
│     │  }                                           │             │
│     └─────────────────────────────────────────────┘             │
│     File extension: .bicep                                      │
│     Released 2021                                               │
│     Cleaner, easier to read                                     │
│     Compiles to ARM JSON behind the scenes                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Why Use Templates?

### The Problem with Manual (Portal) Deployment

```
❌ MANUAL DEPLOYMENT PROBLEMS:

1. Not Repeatable:
   You created a perfect setup in Dev environment
   Now create the SAME thing in Staging... and Production...
   Did you remember every setting? Every checkbox?
   → Probably not. Environments will be different!

2. Not Documented:
   New team member: "How was this VM configured?"
   You: "Uh... I clicked some things 6 months ago..."
   → No record of what was done!

3. Slow:
   Need to create 10 VMs with same config?
   Click, click, click × 10 = hours of work
   → Boring and error-prone!

4. No Version Control:
   "Who changed the VNet settings?"
   "When was the firewall rule added?"
   → No history, no audit trail!

5. Hard to Destroy and Recreate:
   "Delete everything and start fresh"
   → Which resources? In what order? Dependencies?
```

### The Solution with Templates

```
✅ TEMPLATE DEPLOYMENT BENEFITS:

1. Repeatable:
   Same template → Same result. Every time.
   Dev, Staging, Production = identical!

2. Documented:
   Template IS the documentation.
   Read the file = know exactly what's deployed.

3. Fast:
   Deploy 10 VMs? Change "count: 10" in template.
   One command = all resources created!

4. Version Controlled:
   Store templates in Git.
   See who changed what, when, and why.
   Roll back to previous version if needed.

5. Easy Cleanup:
   Delete the resource group = everything gone.
   Redeploy template = everything back!

┌─────────────────────────────┬─────────────────────────────────┐
│  Portal (Manual)             │  Templates (Code)               │
├─────────────────────────────┼─────────────────────────────────┤
│  Click, click, click        │  Write once, deploy many        │
│  Different every time       │  Same every time                │
│  No documentation           │  Template IS documentation      │
│  No version history         │  Git tracks all changes         │
│  Slow for multiple          │  Fast for any number            │
│  Hard to reproduce          │  Easy to reproduce              │
│  Good for: learning         │  Good for: production           │
└─────────────────────────────┴─────────────────────────────────┘
```

---

## ARM Template vs Bicep

```
┌─────────────────────────────┬─────────────────────────────────┐
│  ARM Template (JSON)         │  Bicep                          │
├─────────────────────────────┼─────────────────────────────────┤
│  Verbose (lots of code)     │  Concise (less code)            │
│  Hard to read               │  Easy to read                   │
│  Curly braces everywhere    │  Clean syntax                   │
│  String functions complex   │  Simple expressions             │
│  No IntelliSense (basic)    │  Full IntelliSense in VS Code   │
│  Direct deployment          │  Compiles to ARM JSON           │
│  Since 2014                 │  Since 2021                     │
│  Widely documented          │  Growing documentation          │
│  Used in Portal exports     │  Microsoft recommended          │
│                             │                                 │
│  Learn this FIRST           │  Learn this SECOND              │
│  (understand the basics)    │  (use for real projects)        │
└─────────────────────────────┴─────────────────────────────────┘

Same storage account in both:
```

**ARM Template (JSON) - 20 lines:**
```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "resources": [
    {
      "type": "Microsoft.Storage/storageAccounts",
      "apiVersion": "2023-01-01",
      "name": "mystorageday27",
      "location": "eastus",
      "sku": {
        "name": "Standard_LRS"
      },
      "kind": "StorageV2",
      "properties": {
        "minimumTlsVersion": "TLS1_2"
      }
    }
  ]
}
```

**Bicep - 9 lines:**
```bicep
resource storage 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: 'mystorageday27'
  location: 'eastus'
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    minimumTlsVersion: 'TLS1_2'
  }
}
```

```
Same result, half the code! That's why Bicep is the future.
But we'll learn BOTH because:
  - ARM JSON is what Portal exports
  - ARM JSON is in most existing documentation
  - Bicep compiles to ARM JSON
  - Understanding ARM helps you understand Bicep
```

---

## Template Structure

### ARM Template Structure (The 6 Sections)

```
┌─────────────────────────────────────────────────────────────────┐
│  ARM TEMPLATE STRUCTURE                                          │
│                                                                  │
│  {                                                              │
│    "$schema": "...",          ← 1. SCHEMA (required)            │
│    "contentVersion": "1.0",  ← 2. VERSION (required)           │
│    "parameters": { },        ← 3. PARAMETERS (input values)    │
│    "variables": { },         ← 4. VARIABLES (calculated values)│
│    "resources": [ ],         ← 5. RESOURCES (what to create)   │
│    "outputs": { }            ← 6. OUTPUTS (return values)      │
│  }                                                              │
│                                                                  │
│  Only $schema, contentVersion, and resources are REQUIRED.      │
│  The rest are optional but very useful.                         │
└─────────────────────────────────────────────────────────────────┘
```

### Each Section Explained

```
1. $schema (REQUIRED)
   Tells Azure which template version to use.
   Always use: "https://schema.management.azure.com/schemas/
                2019-04-01/deploymentTemplate.json#"
   Just copy-paste this. Never changes.

2. contentVersion (REQUIRED)
   YOUR version number. For tracking changes.
   Example: "1.0.0.0" → "1.1.0.0" → "2.0.0.0"

3. parameters (OPTIONAL)
   Values that change between deployments.
   Like function arguments.
   Example: environment name, VM size, location

4. variables (OPTIONAL)
   Calculated values used in the template.
   Like local variables in code.
   Example: storageName = "st" + environment + "001"

5. resources (REQUIRED)
   The actual Azure resources to create.
   This is the MAIN section.
   Example: Storage account, VM, VNet, etc.

6. outputs (OPTIONAL)
   Values returned after deployment.
   Like function return values.
   Example: Storage account connection string, VM IP address
```

### Visual Flow

```
┌──────────────────────────────────────────────────────────────┐
│  TEMPLATE DEPLOYMENT FLOW                                     │
│                                                               │
│  Parameters (input)                                          │
│  ┌─────────────────────┐                                     │
│  │ environment = "dev"  │                                     │
│  │ location = "eastus"  │                                     │
│  │ vmSize = "B1s"       │                                     │
│  └─────────┬───────────┘                                     │
│            ↓                                                  │
│  Variables (calculated)                                      │
│  ┌─────────────────────────────┐                             │
│  │ storageName = "stdev001"    │                             │
│  │ vnetName = "vnet-dev"       │                             │
│  └─────────┬───────────────────┘                             │
│            ↓                                                  │
│  Resources (created)                                         │
│  ┌─────────────────────────────┐                             │
│  │ Storage: stdev001            │                             │
│  │ VNet: vnet-dev               │                             │
│  │ VM: vm-dev-web               │                             │
│  └─────────┬───────────────────┘                             │
│            ↓                                                  │
│  Outputs (returned)                                          │
│  ┌─────────────────────────────┐                             │
│  │ storageEndpoint = "https://."│                             │
│  │ vmPrivateIP = "10.0.1.4"    │                             │
│  └─────────────────────────────┘                             │
│                                                               │
│  Same template with different parameters:                    │
│  environment = "prod" → stprod001, vnet-prod, vm-prod-web   │
└──────────────────────────────────────────────────────────────┘
```

---

## Lab 1: Your First ARM Template (Storage Account)

### What We'll Do

```
Create a Storage Account using an ARM template instead of Portal.
This is the simplest possible template to understand the basics.
```

### Step 1: Create Resource Group

```
1. Open Azure Portal
2. Search "Resource groups" → "+ Create"
3. Fill in:
   - Resource group: rg-day27-templates
   - Region: East US
4. Click "Review + create" → "Create"
```

### Step 2: Write the Template

Create a file on your computer: `storage-simple.json`

```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "resources": [
    {
      "type": "Microsoft.Storage/storageAccounts",
      "apiVersion": "2023-01-01",
      "name": "stday27simple",
      "location": "eastus",
      "sku": {
        "name": "Standard_LRS"
      },
      "kind": "StorageV2",
      "properties": {
        "minimumTlsVersion": "TLS1_2",
        "supportsHttpsTrafficOnly": true
      }
    }
  ]
}
```

**Let's break down every line:**

```
"$schema": "..."
  → Tells Azure this is an ARM template (always the same)

"contentVersion": "1.0.0.0"
  → Your version number (for your tracking)

"resources": [...]
  → Array of resources to create

"type": "Microsoft.Storage/storageAccounts"
  → What kind of resource (Storage Account)
  → Format: Provider/ResourceType

"apiVersion": "2023-01-01"
  → Which API version to use (determines available features)

"name": "stday27simple"
  → Name of the storage account (must be globally unique!)

"location": "eastus"
  → Azure region

"sku": { "name": "Standard_LRS" }
  → Pricing tier (Standard, Locally Redundant)

"kind": "StorageV2"
  → Storage account type (V2 is current)

"properties": { ... }
  → Additional settings
  → minimumTlsVersion: Security setting
  → supportsHttpsTrafficOnly: Only allow HTTPS
```

### Step 3: Deploy via Azure Portal

```
1. Search "Deploy a custom template" in Azure Portal
2. Click "Deploy a custom template"
3. Click "Build your own template in the editor"
4. Delete the default content
5. Paste your storage-simple.json content
6. Click "Save"
7. Fill in:
   - Subscription: Your subscription
   - Resource group: rg-day27-templates
8. Click "Review + create" → "Create"
```

**⏱️ Wait**: 1-2 minutes

### Step 4: Deploy via Azure CLI (Alternative)

```bash
# If you prefer CLI:
az deployment group create \
  --resource-group rg-day27-templates \
  --template-file storage-simple.json
```

### Step 5: Test, Check, and Confirm

**Test 1: Verify Storage Account Created**

```
1. Search "Storage accounts"
2. Find: stday27simple
3. Verify:
   ✅ Name: stday27simple
   ✅ Location: East US
   ✅ SKU: Standard_LRS
   ✅ Kind: StorageV2
   ✅ TLS: 1.2
```

**Test 2: Verify Deployment History**

```
1. Go to resource group: rg-day27-templates
2. Left menu → "Deployments"
3. Verify:
   ✅ Deployment listed (name starts with "template")
   ✅ Status: Succeeded
   ✅ Click it to see details (inputs, outputs, template)
```

**Test 3: Redeploy (Idempotent)**

```
Deploy the SAME template again:
1. "Deploy a custom template" → paste same JSON → Deploy

Result:
  ✅ No error! No duplicate created!
  ✅ ARM templates are IDEMPOTENT
  ✅ If resource exists with same config, nothing changes
  ✅ If config differs, it UPDATES the resource
```

**✅ Result**: First ARM template deployed!

---

## Lab 2: Template with Parameters

### What are Parameters?

```
Parameters = Values you provide at deployment time

Without parameters:
  Template has hardcoded values
  "name": "stday27simple"
  "location": "eastus"
  → Same name and location every time!

With parameters:
  Template has placeholders
  "name": "[parameters('storageName')]"
  "location": "[parameters('location')]"
  → Different values each deployment!

┌──────────────────────────────────────────────────────────────┐
│  PARAMETERS = FUNCTION ARGUMENTS                              │
│                                                               │
│  Like a function:                                            │
│  function createStorage(name, location, sku) {               │
│    // create storage with these values                       │
│  }                                                           │
│                                                               │
│  Call with different arguments:                              │
│  createStorage("stdev001", "eastus", "Standard_LRS")        │
│  createStorage("stprod001", "westus", "Standard_GRS")       │
│                                                               │
│  Same function, different results!                           │
│  Same template, different resources!                         │
└──────────────────────────────────────────────────────────────┘
```

### Step 1: Create Template with Parameters

Create file: `storage-params.json`

```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "storageName": {
      "type": "string",
      "minLength": 3,
      "maxLength": 24,
      "metadata": {
        "description": "Name of the storage account (must be globally unique)"
      }
    },
    "location": {
      "type": "string",
      "defaultValue": "eastus",
      "allowedValues": [
        "eastus",
        "westus",
        "westeurope",
        "southeastasia"
      ],
      "metadata": {
        "description": "Azure region for the storage account"
      }
    },
    "skuName": {
      "type": "string",
      "defaultValue": "Standard_LRS",
      "allowedValues": [
        "Standard_LRS",
        "Standard_GRS",
        "Standard_ZRS",
        "Premium_LRS"
      ],
      "metadata": {
        "description": "Storage account SKU"
      }
    },
    "environment": {
      "type": "string",
      "defaultValue": "dev",
      "allowedValues": [
        "dev",
        "staging",
        "prod"
      ],
      "metadata": {
        "description": "Environment tag"
      }
    }
  },
  "variables": {
    "storageDisplayName": "[concat('Storage-', parameters('environment'))]"
  },
  "resources": [
    {
      "type": "Microsoft.Storage/storageAccounts",
      "apiVersion": "2023-01-01",
      "name": "[parameters('storageName')]",
      "location": "[parameters('location')]",
      "tags": {
        "environment": "[parameters('environment')]",
        "displayName": "[variables('storageDisplayName')]",
        "createdBy": "ARM-Template"
      },
      "sku": {
        "name": "[parameters('skuName')]"
      },
      "kind": "StorageV2",
      "properties": {
        "minimumTlsVersion": "TLS1_2",
        "supportsHttpsTrafficOnly": true
      }
    }
  ],
  "outputs": {
    "storageId": {
      "type": "string",
      "value": "[resourceId('Microsoft.Storage/storageAccounts', parameters('storageName'))]"
    },
    "storagePrimaryEndpoint": {
      "type": "string",
      "value": "[reference(parameters('storageName')).primaryEndpoints.blob]"
    }
  }
}
```

**Key concepts in this template:**

```
PARAMETERS:
  [parameters('storageName')]  → Gets the value you provide
  "defaultValue": "eastus"    → Used if you don't provide a value
  "allowedValues": [...]      → Restricts to valid options
  "minLength"/"maxLength"     → Validates input length

VARIABLES:
  [concat('Storage-', parameters('environment'))]
  → Combines strings: "Storage-" + "dev" = "Storage-dev"

FUNCTIONS:
  [parameters('x')]     → Get parameter value
  [variables('x')]      → Get variable value
  [concat('a', 'b')]    → Combine strings: "ab"
  [resourceId(...)]     → Get resource ID
  [reference(...)]      → Get resource properties after creation

OUTPUTS:
  Returns values after deployment
  Useful for getting connection strings, IPs, etc.
```

### Step 2: Deploy with Parameters via Portal

```
1. Search "Deploy a custom template" in Azure Portal
2. Click "Build your own template in the editor"
3. Paste the storage-params.json content → Click "Save"
4. Now you see a FORM with your parameters!

   Fill in:
   - Subscription: Your subscription
   - Resource group: rg-day27-templates
   - Storage Name: stday27dev001 (your unique name)
   - Location: eastus (dropdown!)
   - Sku Name: Standard_LRS (dropdown!)
   - Environment: dev (dropdown!)

5. Click "Review + create" → "Create"
```

**Notice:** The Portal auto-generated a form from your parameters!
- `allowedValues` became dropdown menus
- `metadata.description` became help text
- `defaultValue` pre-filled the fields

### Step 3: Deploy Again for Production

```
Same template, different parameters:

1. "Deploy a custom template" → paste same JSON → Save
2. Fill in:
   - Resource group: rg-day27-templates
   - Storage Name: stday27prod001
   - Location: westus
   - Sku Name: Standard_GRS (geo-redundant for prod!)
   - Environment: prod
3. Click "Review + create" → "Create"
```

**Result:**
```
Two storage accounts from ONE template:
  stday27dev001  → East US, LRS, tagged "dev"
  stday27prod001 → West US, GRS, tagged "prod"
  
  ✅ Same template, different environments!
```

### Step 4: Deploy via CLI with Parameters

```bash
# Deploy for dev
az deployment group create \
  --resource-group rg-day27-templates \
  --template-file storage-params.json \
  --parameters storageName=stday27dev002 location=eastus skuName=Standard_LRS environment=dev

# Deploy for prod
az deployment group create \
  --resource-group rg-day27-templates \
  --template-file storage-params.json \
  --parameters storageName=stday27prod002 location=westus skuName=Standard_GRS environment=prod
```

### Step 5: Create Parameter File (Best Practice)

Instead of passing parameters on command line, use a parameter file:

Create file: `storage-params.dev.json`

```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "storageName": {
      "value": "stday27dev003"
    },
    "location": {
      "value": "eastus"
    },
    "skuName": {
      "value": "Standard_LRS"
    },
    "environment": {
      "value": "dev"
    }
  }
}
```

Create file: `storage-params.prod.json`

```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "storageName": {
      "value": "stday27prod003"
    },
    "location": {
      "value": "westus"
    },
    "skuName": {
      "value": "Standard_GRS"
    },
    "environment": {
      "value": "prod"
    }
  }
}
```

```bash
# Deploy dev using parameter file
az deployment group create \
  --resource-group rg-day27-templates \
  --template-file storage-params.json \
  --parameters @storage-params.dev.json

# Deploy prod using parameter file
az deployment group create \
  --resource-group rg-day27-templates \
  --template-file storage-params.json \
  --parameters @storage-params.prod.json
```

```
┌──────────────────────────────────────────────────────────────┐
│  PARAMETER FILES - BEST PRACTICE                              │
│                                                               │
│  Project structure:                                          │
│  ├─ templates/                                               │
│  │   ├─ storage.json          (template)                     │
│  │   ├─ storage.dev.json      (dev parameters)               │
│  │   ├─ storage.staging.json  (staging parameters)           │
│  │   └─ storage.prod.json     (prod parameters)              │
│  │                                                            │
│  │  One template + multiple parameter files                  │
│  │  = Multiple environments from same code!                  │
│  │                                                            │
│  ⚠️ NEVER put secrets in parameter files!                    │
│  Use Azure Key Vault references instead.                     │
└──────────────────────────────────────────────────────────────┘
```

### Step 6: Test, Check, and Confirm - Parameters

**Test 1: Verify Both Storage Accounts**

```
1. Search "Storage accounts"
2. Verify:
   ✅ stday27dev001 exists (East US, LRS)
   ✅ stday27prod001 exists (West US, GRS)
```

**Test 2: Verify Tags**

```
1. Click stday27dev001 → Overview → Tags
   ✅ environment: dev
   ✅ displayName: Storage-dev
   ✅ createdBy: ARM-Template

2. Click stday27prod001 → Overview → Tags
   ✅ environment: prod
   ✅ displayName: Storage-prod
   ✅ createdBy: ARM-Template
```

**Test 3: Verify Deployment Outputs**

```
1. Go to rg-day27-templates → Deployments
2. Click the latest deployment
3. Click "Outputs" tab
4. Verify:
   ✅ storageId: /subscriptions/.../storageAccounts/stday27prod001
   ✅ storagePrimaryEndpoint: https://stday27prod001.blob.core.windows.net/
```

**Test 4: Verify Deployment History**

```
1. rg-day27-templates → Deployments
2. Verify:
   ✅ Multiple deployments listed
   ✅ All status: Succeeded
   ✅ Click any → see Template, Parameters, Outputs
```

**✅ Result**: Parameterized template working for multiple environments!

---

## Lab 3: Deploy a Virtual Network

### Step 1: Create VNet Template

Create file: `vnet-template.json`

```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "vnetName": {
      "type": "string",
      "defaultValue": "vnet-day27",
      "metadata": {
        "description": "Name of the Virtual Network"
      }
    },
    "location": {
      "type": "string",
      "defaultValue": "[resourceGroup().location]",
      "metadata": {
        "description": "Location (defaults to resource group location)"
      }
    },
    "vnetAddressPrefix": {
      "type": "string",
      "defaultValue": "10.0.0.0/16"
    },
    "subnet1Name": {
      "type": "string",
      "defaultValue": "Subnet-Web"
    },
    "subnet1Prefix": {
      "type": "string",
      "defaultValue": "10.0.1.0/24"
    },
    "subnet2Name": {
      "type": "string",
      "defaultValue": "Subnet-App"
    },
    "subnet2Prefix": {
      "type": "string",
      "defaultValue": "10.0.2.0/24"
    },
    "subnet3Name": {
      "type": "string",
      "defaultValue": "Subnet-DB"
    },
    "subnet3Prefix": {
      "type": "string",
      "defaultValue": "10.0.3.0/24"
    }
  },
  "variables": {
    "nsgWebName": "[concat('nsg-', parameters('subnet1Name'))]",
    "nsgAppName": "[concat('nsg-', parameters('subnet2Name'))]",
    "nsgDbName": "[concat('nsg-', parameters('subnet3Name'))]"
  },
  "resources": [
    {
      "type": "Microsoft.Network/networkSecurityGroups",
      "apiVersion": "2023-05-01",
      "name": "[variables('nsgWebName')]",
      "location": "[parameters('location')]",
      "properties": {
        "securityRules": [
          {
            "name": "Allow-HTTP",
            "properties": {
              "priority": 100,
              "direction": "Inbound",
              "access": "Allow",
              "protocol": "Tcp",
              "sourcePortRange": "*",
              "destinationPortRange": "80",
              "sourceAddressPrefix": "*",
              "destinationAddressPrefix": "*"
            }
          },
          {
            "name": "Allow-HTTPS",
            "properties": {
              "priority": 110,
              "direction": "Inbound",
              "access": "Allow",
              "protocol": "Tcp",
              "sourcePortRange": "*",
              "destinationPortRange": "443",
              "sourceAddressPrefix": "*",
              "destinationAddressPrefix": "*"
            }
          }
        ]
      }
    },
    {
      "type": "Microsoft.Network/networkSecurityGroups",
      "apiVersion": "2023-05-01",
      "name": "[variables('nsgAppName')]",
      "location": "[parameters('location')]",
      "properties": {
        "securityRules": [
          {
            "name": "Allow-From-Web-Subnet",
            "properties": {
              "priority": 100,
              "direction": "Inbound",
              "access": "Allow",
              "protocol": "Tcp",
              "sourcePortRange": "*",
              "destinationPortRange": "8080",
              "sourceAddressPrefix": "[parameters('subnet1Prefix')]",
              "destinationAddressPrefix": "*"
            }
          }
        ]
      }
    },
    {
      "type": "Microsoft.Network/networkSecurityGroups",
      "apiVersion": "2023-05-01",
      "name": "[variables('nsgDbName')]",
      "location": "[parameters('location')]",
      "properties": {
        "securityRules": [
          {
            "name": "Allow-From-App-Subnet",
            "properties": {
              "priority": 100,
              "direction": "Inbound",
              "access": "Allow",
              "protocol": "Tcp",
              "sourcePortRange": "*",
              "destinationPortRange": "5432",
              "sourceAddressPrefix": "[parameters('subnet2Prefix')]",
              "destinationAddressPrefix": "*"
            }
          }
        ]
      }
    },
    {
      "type": "Microsoft.Network/virtualNetworks",
      "apiVersion": "2023-05-01",
      "name": "[parameters('vnetName')]",
      "location": "[parameters('location')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/networkSecurityGroups', variables('nsgWebName'))]",
        "[resourceId('Microsoft.Network/networkSecurityGroups', variables('nsgAppName'))]",
        "[resourceId('Microsoft.Network/networkSecurityGroups', variables('nsgDbName'))]"
      ],
      "tags": {
        "createdBy": "ARM-Template",
        "purpose": "Day 27 Lab"
      },
      "properties": {
        "addressSpace": {
          "addressPrefixes": [
            "[parameters('vnetAddressPrefix')]"
          ]
        },
        "subnets": [
          {
            "name": "[parameters('subnet1Name')]",
            "properties": {
              "addressPrefix": "[parameters('subnet1Prefix')]",
              "networkSecurityGroup": {
                "id": "[resourceId('Microsoft.Network/networkSecurityGroups', variables('nsgWebName'))]"
              }
            }
          },
          {
            "name": "[parameters('subnet2Name')]",
            "properties": {
              "addressPrefix": "[parameters('subnet2Prefix')]",
              "networkSecurityGroup": {
                "id": "[resourceId('Microsoft.Network/networkSecurityGroups', variables('nsgAppName'))]"
              }
            }
          },
          {
            "name": "[parameters('subnet3Name')]",
            "properties": {
              "addressPrefix": "[parameters('subnet3Prefix')]",
              "networkSecurityGroup": {
                "id": "[resourceId('Microsoft.Network/networkSecurityGroups', variables('nsgDbName'))]"
              }
            }
          }
        ]
      }
    }
  ],
  "outputs": {
    "vnetId": {
      "type": "string",
      "value": "[resourceId('Microsoft.Network/virtualNetworks', parameters('vnetName'))]"
    },
    "subnet1Id": {
      "type": "string",
      "value": "[resourceId('Microsoft.Network/virtualNetworks/subnets', parameters('vnetName'), parameters('subnet1Name'))]"
    }
  }
}
```

**New concepts in this template:**

```
1. [resourceGroup().location]
   → Gets the location of the resource group
   → No need to specify location separately!

2. dependsOn
   → "Create NSGs BEFORE the VNet"
   → ARM creates resources in parallel by default
   → dependsOn forces ordering

3. Multiple resources in one template
   → 3 NSGs + 1 VNet = 4 resources
   → All created in one deployment

4. Resource references
   → NSG ID referenced inside VNet subnet config
   → Links NSG to subnet

Deployment order:
  Step 1: Create 3 NSGs (in parallel)
  Step 2: Create VNet with subnets (after NSGs ready)
  
  ARM figures out the order from dependsOn!
```

### Step 2: Deploy VNet Template

```
1. "Deploy a custom template" in Portal
2. Paste vnet-template.json → Save
3. Fill in:
   - Resource group: rg-day27-templates
   - Vnet Name: vnet-day27
   - (leave other defaults)
4. Click "Review + create" → "Create"
```

**⏱️ Wait**: 1-2 minutes

### Step 3: Test, Check, and Confirm - VNet

**Test 1: Verify VNet Created**

```
1. Search "Virtual networks" → vnet-day27
2. Verify:
   ✅ Address space: 10.0.0.0/16
   ✅ Subnets: Subnet-Web, Subnet-App, Subnet-DB
   ✅ Tags: createdBy = ARM-Template
```

**Test 2: Verify NSGs**

```
1. Search "Network security groups"
2. Verify:
   ✅ nsg-Subnet-Web (allows HTTP 80, HTTPS 443)
   ✅ nsg-Subnet-App (allows 8080 from Web subnet only)
   ✅ nsg-Subnet-DB (allows 5432 from App subnet only)
```

**Test 3: Verify NSG-Subnet Association**

```
1. Click vnet-day27 → Subnets
2. Verify each subnet has its NSG:
   ✅ Subnet-Web → nsg-Subnet-Web
   ✅ Subnet-App → nsg-Subnet-App
   ✅ Subnet-DB → nsg-Subnet-DB
```

**Test 4: Verify Security Rules**

```
The NSG rules create a 3-tier architecture:

Internet → [HTTP/HTTPS] → Subnet-Web
Subnet-Web → [8080] → Subnet-App
Subnet-App → [5432] → Subnet-DB

✅ Web tier: Open to internet (HTTP/HTTPS)
✅ App tier: Only accessible from Web tier
✅ DB tier: Only accessible from App tier
✅ Real-world security pattern!
```

**✅ Result**: VNet with 3-tier security deployed from template!

---

## Lab 4: Deploy a Complete VM

### Step 1: Create VM Template

This template creates a complete VM with all dependencies:

Create file: `vm-template.json`

```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "vmName": {
      "type": "string",
      "defaultValue": "vm-day27-web",
      "metadata": {
        "description": "Name of the virtual machine"
      }
    },
    "adminUsername": {
      "type": "string",
      "defaultValue": "azureuser",
      "metadata": {
        "description": "Admin username"
      }
    },
    "adminPassword": {
      "type": "securestring",
      "metadata": {
        "description": "Admin password"
      }
    },
    "vmSize": {
      "type": "string",
      "defaultValue": "Standard_B1s",
      "allowedValues": [
        "Standard_B1s",
        "Standard_B2s",
        "Standard_D2s_v3"
      ]
    },
    "location": {
      "type": "string",
      "defaultValue": "[resourceGroup().location]"
    }
  },
  "variables": {
    "vnetName": "vnet-vm-day27",
    "subnetName": "subnet-web",
    "nsgName": "[concat('nsg-', parameters('vmName'))]",
    "publicIpName": "[concat('pip-', parameters('vmName'))]",
    "nicName": "[concat('nic-', parameters('vmName'))]",
    "subnetRef": "[resourceId('Microsoft.Network/virtualNetworks/subnets', variables('vnetName'), variables('subnetName'))]"
  },
  "resources": [
    {
      "type": "Microsoft.Network/networkSecurityGroups",
      "apiVersion": "2023-05-01",
      "name": "[variables('nsgName')]",
      "location": "[parameters('location')]",
      "properties": {
        "securityRules": [
          {
            "name": "Allow-SSH",
            "properties": {
              "priority": 100,
              "direction": "Inbound",
              "access": "Allow",
              "protocol": "Tcp",
              "sourcePortRange": "*",
              "destinationPortRange": "22",
              "sourceAddressPrefix": "*",
              "destinationAddressPrefix": "*"
            }
          },
          {
            "name": "Allow-HTTP",
            "properties": {
              "priority": 110,
              "direction": "Inbound",
              "access": "Allow",
              "protocol": "Tcp",
              "sourcePortRange": "*",
              "destinationPortRange": "80",
              "sourceAddressPrefix": "*",
              "destinationAddressPrefix": "*"
            }
          }
        ]
      }
    },
    {
      "type": "Microsoft.Network/publicIPAddresses",
      "apiVersion": "2023-05-01",
      "name": "[variables('publicIpName')]",
      "location": "[parameters('location')]",
      "sku": {
        "name": "Standard"
      },
      "properties": {
        "publicIPAllocationMethod": "Static"
      }
    },
    {
      "type": "Microsoft.Network/virtualNetworks",
      "apiVersion": "2023-05-01",
      "name": "[variables('vnetName')]",
      "location": "[parameters('location')]",
      "properties": {
        "addressSpace": {
          "addressPrefixes": ["10.1.0.0/16"]
        },
        "subnets": [
          {
            "name": "[variables('subnetName')]",
            "properties": {
              "addressPrefix": "10.1.1.0/24"
            }
          }
        ]
      }
    },
    {
      "type": "Microsoft.Network/networkInterfaces",
      "apiVersion": "2023-05-01",
      "name": "[variables('nicName')]",
      "location": "[parameters('location')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/publicIPAddresses', variables('publicIpName'))]",
        "[resourceId('Microsoft.Network/virtualNetworks', variables('vnetName'))]",
        "[resourceId('Microsoft.Network/networkSecurityGroups', variables('nsgName'))]"
      ],
      "properties": {
        "ipConfigurations": [
          {
            "name": "ipconfig1",
            "properties": {
              "privateIPAllocationMethod": "Dynamic",
              "publicIPAddress": {
                "id": "[resourceId('Microsoft.Network/publicIPAddresses', variables('publicIpName'))]"
              },
              "subnet": {
                "id": "[variables('subnetRef')]"
              }
            }
          }
        ],
        "networkSecurityGroup": {
          "id": "[resourceId('Microsoft.Network/networkSecurityGroups', variables('nsgName'))]"
        }
      }
    },
    {
      "type": "Microsoft.Compute/virtualMachines",
      "apiVersion": "2023-07-01",
      "name": "[parameters('vmName')]",
      "location": "[parameters('location')]",
      "dependsOn": [
        "[resourceId('Microsoft.Network/networkInterfaces', variables('nicName'))]"
      ],
      "properties": {
        "hardwareProfile": {
          "vmSize": "[parameters('vmSize')]"
        },
        "osProfile": {
          "computerName": "[parameters('vmName')]",
          "adminUsername": "[parameters('adminUsername')]",
          "adminPassword": "[parameters('adminPassword')]"
        },
        "storageProfile": {
          "imageReference": {
            "publisher": "Canonical",
            "offer": "0001-com-ubuntu-server-jammy",
            "sku": "22_04-lts-gen2",
            "version": "latest"
          },
          "osDisk": {
            "createOption": "FromImage",
            "managedDisk": {
              "storageAccountType": "Standard_LRS"
            }
          }
        },
        "networkProfile": {
          "networkInterfaces": [
            {
              "id": "[resourceId('Microsoft.Network/networkInterfaces', variables('nicName'))]"
            }
          ]
        }
      }
    }
  ],
  "outputs": {
    "publicIP": {
      "type": "string",
      "value": "[reference(variables('publicIpName')).ipAddress]"
    },
    "sshCommand": {
      "type": "string",
      "value": "[concat('ssh ', parameters('adminUsername'), '@', reference(variables('publicIpName')).ipAddress)]"
    }
  }
}
```

**What this template creates (5 resources):**

```
┌──────────────────────────────────────────────────────────────┐
│  VM TEMPLATE - RESOURCE DEPENDENCY CHAIN                      │
│                                                               │
│  Step 1 (parallel):                                          │
│  ├─ NSG (nsg-vm-day27-web)                                   │
│  ├─ Public IP (pip-vm-day27-web)                             │
│  └─ VNet (vnet-vm-day27)                                     │
│                                                               │
│  Step 2 (after Step 1):                                      │
│  └─ NIC (nic-vm-day27-web)                                   │
│      Needs: Public IP + VNet + NSG                           │
│                                                               │
│  Step 3 (after Step 2):                                      │
│  └─ VM (vm-day27-web)                                        │
│      Needs: NIC                                              │
│                                                               │
│  ARM reads dependsOn and creates in correct order!           │
└──────────────────────────────────────────────────────────────┘
```

**New concept: `securestring`**

```
"adminPassword": {
  "type": "securestring"    ← Special type!
}

securestring means:
  ✅ Value is NOT logged in deployment history
  ✅ Value is NOT shown in Portal
  ✅ Value is encrypted in transit
  ✅ Use for passwords, keys, connection strings
  
  Regular "string" → visible in deployment logs
  "securestring" → hidden everywhere
```

### Step 2: Deploy VM Template

```
1. "Deploy a custom template" in Portal
2. Paste vm-template.json → Save
3. Fill in:
   - Resource group: rg-day27-templates
   - Vm Name: vm-day27-web
   - Admin Username: azureuser
   - Admin Password: Day27Template@2026
   - Vm Size: Standard_B1s
4. Click "Review + create" → "Create"
```

**⏱️ Wait**: 3-5 minutes

### Step 3: Test, Check, and Confirm - VM

**Test 1: Verify All 5 Resources Created**

```
1. Go to rg-day27-templates
2. Verify these resources exist:
   ✅ nsg-vm-day27-web (Network Security Group)
   ✅ pip-vm-day27-web (Public IP)
   ✅ vnet-vm-day27 (Virtual Network)
   ✅ nic-vm-day27-web (Network Interface)
   ✅ vm-day27-web (Virtual Machine)
```

**Test 2: Verify Deployment Outputs**

```
1. rg-day27-templates → Deployments → Latest
2. Click "Outputs" tab
3. Verify:
   ✅ publicIP: 20.xxx.xxx.xxx
   ✅ sshCommand: ssh azureuser@20.xxx.xxx.xxx
```

**Test 3: SSH into VM**

```
Use the sshCommand from outputs:
  ssh azureuser@<PUBLIC-IP>
  Password: Day27Template@2026

  ✅ SSH connection successful!
  ✅ VM created entirely from template!
```

**Test 4: Verify Password Not Visible**

```
1. rg-day27-templates → Deployments → Latest
2. Click "Inputs" tab
3. Verify:
   ✅ adminPassword shows as "null" or hidden
   ✅ securestring parameter is NOT logged!
```

**✅ Result**: Complete VM with all networking deployed from template!

---

## Lab 5: Your First Bicep Template

### What is Bicep?

```
Bicep = A simpler language that compiles to ARM JSON

┌──────────────────────────────────────────────────────────────┐
│  BICEP WORKFLOW                                               │
│                                                               │
│  You write:     main.bicep (simple syntax)                   │
│       ↓                                                       │
│  Bicep compiles: main.json (ARM template)                    │
│       ↓                                                       │
│  Azure deploys:  Resources created                           │
│                                                               │
│  You never see the JSON! Bicep handles it.                   │
│  But understanding ARM JSON helps you understand Bicep.      │
└──────────────────────────────────────────────────────────────┘
```

### Step 1: Install Bicep

```bash
# Bicep is included with Azure CLI 2.20+
# Verify:
az bicep version

# If not installed:
az bicep install

# Verify:
az bicep version
# Output: Bicep CLI version 0.x.x
```

### Step 2: Create Bicep Template

Create file: `storage.bicep`

```bicep
// Parameters
@description('Name of the storage account')
@minLength(3)
@maxLength(24)
param storageName string

@description('Azure region')
param location string = resourceGroup().location

@description('Storage SKU')
@allowed([
  'Standard_LRS'
  'Standard_GRS'
  'Standard_ZRS'
])
param skuName string = 'Standard_LRS'

@description('Environment')
@allowed([
  'dev'
  'staging'
  'prod'
])
param environment string = 'dev'

// Variables
var displayName = 'Storage-${environment}'

// Resource
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageName
  location: location
  tags: {
    environment: environment
    displayName: displayName
    createdBy: 'Bicep'
  }
  sku: {
    name: skuName
  }
  kind: 'StorageV2'
  properties: {
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
  }
}

// Outputs
output storageId string = storageAccount.id
output blobEndpoint string = storageAccount.properties.primaryEndpoints.blob
```

**Compare with ARM JSON version:**

```
ARM JSON:  ~50 lines, lots of brackets and quotes
Bicep:     ~40 lines, clean and readable

Key differences:
  ARM:   "[parameters('storageName')]"
  Bicep: storageName

  ARM:   "[concat('Storage-', parameters('environment'))]"
  Bicep: 'Storage-${environment}'

  ARM:   "[reference(parameters('storageName')).primaryEndpoints.blob]"
  Bicep: storageAccount.properties.primaryEndpoints.blob

  ARM:   "dependsOn": [...]
  Bicep: Automatic! Bicep detects dependencies from references.
```

### Step 3: Deploy Bicep Template

```bash
# Deploy directly (Bicep compiles to ARM automatically)
az deployment group create \
  --resource-group rg-day27-templates \
  --template-file storage.bicep \
  --parameters storageName=stday27bicep001 environment=dev
```

**Or via Portal:**

```bash
# First compile Bicep to ARM JSON
az bicep build --file storage.bicep
# Creates: storage.json

# Then deploy the JSON via Portal as before
```

### Step 4: Create Bicep VM Template

Create file: `vm.bicep`

```bicep
@description('VM name')
param vmName string = 'vm-bicep-web'

@description('Admin username')
param adminUsername string = 'azureuser'

@description('Admin password')
@secure()
param adminPassword string

@description('VM size')
@allowed([
  'Standard_B1s'
  'Standard_B2s'
])
param vmSize string = 'Standard_B1s'

param location string = resourceGroup().location

// NSG
resource nsg 'Microsoft.Network/networkSecurityGroups@2023-05-01' = {
  name: 'nsg-${vmName}'
  location: location
  properties: {
    securityRules: [
      {
        name: 'Allow-SSH'
        properties: {
          priority: 100
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '22'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
        }
      }
      {
        name: 'Allow-HTTP'
        properties: {
          priority: 110
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '80'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
        }
      }
    ]
  }
}

// Public IP
resource publicIp 'Microsoft.Network/publicIPAddresses@2023-05-01' = {
  name: 'pip-${vmName}'
  location: location
  sku: {
    name: 'Standard'
  }
  properties: {
    publicIPAllocationMethod: 'Static'
  }
}

// VNet
resource vnet 'Microsoft.Network/virtualNetworks@2023-05-01' = {
  name: 'vnet-${vmName}'
  location: location
  properties: {
    addressSpace: {
      addressPrefixes: [
        '10.2.0.0/16'
      ]
    }
    subnets: [
      {
        name: 'subnet-web'
        properties: {
          addressPrefix: '10.2.1.0/24'
        }
      }
    ]
  }
}

// NIC - Bicep auto-detects dependencies! No dependsOn needed!
resource nic 'Microsoft.Network/networkInterfaces@2023-05-01' = {
  name: 'nic-${vmName}'
  location: location
  properties: {
    ipConfigurations: [
      {
        name: 'ipconfig1'
        properties: {
          privateIPAllocationMethod: 'Dynamic'
          publicIPAddress: {
            id: publicIp.id    // ← Reference = automatic dependency!
          }
          subnet: {
            id: vnet.properties.subnets[0].id  // ← Auto dependency!
          }
        }
      }
    ]
    networkSecurityGroup: {
      id: nsg.id    // ← Auto dependency!
    }
  }
}

// VM
resource vm 'Microsoft.Compute/virtualMachines@2023-07-01' = {
  name: vmName
  location: location
  properties: {
    hardwareProfile: {
      vmSize: vmSize
    }
    osProfile: {
      computerName: vmName
      adminUsername: adminUsername
      adminPassword: adminPassword
    }
    storageProfile: {
      imageReference: {
        publisher: 'Canonical'
        offer: '0001-com-ubuntu-server-jammy'
        sku: '22_04-lts-gen2'
        version: 'latest'
      }
      osDisk: {
        createOption: 'FromImage'
        managedDisk: {
          storageAccountType: 'Standard_LRS'
        }
      }
    }
    networkProfile: {
      networkInterfaces: [
        {
          id: nic.id    // ← Auto dependency!
        }
      ]
    }
  }
}

// Outputs
output publicIpAddress string = publicIp.properties.ipAddress
output sshCommand string = 'ssh ${adminUsername}@${publicIp.properties.ipAddress}'
```

**Key Bicep advantage: NO dependsOn needed!**

```
ARM JSON:
  "dependsOn": [
    "[resourceId('Microsoft.Network/publicIPAddresses', ...)]",
    "[resourceId('Microsoft.Network/virtualNetworks', ...)]",
    "[resourceId('Microsoft.Network/networkSecurityGroups', ...)]"
  ]
  → You manually list every dependency

Bicep:
  publicIPAddress: { id: publicIp.id }
  → Bicep sees you reference publicIp
  → Automatically adds dependency!
  → Less code, fewer mistakes!
```

### Step 5: Deploy Bicep VM

```bash
az deployment group create \
  --resource-group rg-day27-templates \
  --template-file vm.bicep \
  --parameters vmName=vm-bicep-web adminPassword=Day27Bicep@2026
```

**⏱️ Wait**: 3-5 minutes

### Step 6: Test, Check, and Confirm - Bicep

**Test 1: Verify Resources**

```
1. Go to rg-day27-templates
2. Verify Bicep-created resources:
   ✅ nsg-vm-bicep-web
   ✅ pip-vm-bicep-web
   ✅ vnet-vm-bicep-web
   ✅ nic-vm-bicep-web
   ✅ vm-bicep-web
```

**Test 2: Verify Outputs**

```bash
# Get deployment outputs
az deployment group show \
  --resource-group rg-day27-templates \
  --name vm \
  --query properties.outputs
```

```
✅ publicIpAddress: 20.xxx.xxx.xxx
✅ sshCommand: ssh azureuser@20.xxx.xxx.xxx
```

**Test 3: SSH into Bicep VM**

```
ssh azureuser@<PUBLIC-IP>
Password: Day27Bicep@2026

✅ VM created from Bicep template!
```

**✅ Result**: Bicep template working!

---

## Lab 6: Bicep with Modules

### What are Modules?

```
Modules = Reusable template pieces

┌──────────────────────────────────────────────────────────────┐
│  WITHOUT MODULES:                                             │
│  One giant file with everything                              │
│  main.bicep (500 lines) 😱                                   │
│                                                               │
│  WITH MODULES:                                               │
│  Small, focused files that you combine                       │
│  ├─ main.bicep (30 lines) - orchestrator                    │
│  ├─ modules/storage.bicep (20 lines)                        │
│  ├─ modules/vnet.bicep (30 lines)                           │
│  └─ modules/vm.bicep (50 lines)                             │
│                                                               │
│  Like functions in programming:                              │
│  main() calls createStorage(), createVnet(), createVm()     │
└──────────────────────────────────────────────────────────────┘
```

### Step 1: Create Module Files

Create file: `modules/storage.bicep`

```bicep
@description('Storage account name')
param name string

@description('Location')
param location string

@description('SKU name')
param skuName string = 'Standard_LRS'

@description('Tags')
param tags object = {}

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: name
  location: location
  tags: tags
  sku: {
    name: skuName
  }
  kind: 'StorageV2'
  properties: {
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
  }
}

output id string = storageAccount.id
output name string = storageAccount.name
output blobEndpoint string = storageAccount.properties.primaryEndpoints.blob
```

Create file: `modules/vnet.bicep`

```bicep
@description('VNet name')
param name string

@description('Location')
param location string

@description('Address prefix')
param addressPrefix string = '10.0.0.0/16'

@description('Subnets')
param subnets array

@description('Tags')
param tags object = {}

resource virtualNetwork 'Microsoft.Network/virtualNetworks@2023-05-01' = {
  name: name
  location: location
  tags: tags
  properties: {
    addressSpace: {
      addressPrefixes: [
        addressPrefix
      ]
    }
    subnets: [for subnet in subnets: {
      name: subnet.name
      properties: {
        addressPrefix: subnet.prefix
      }
    }]
  }
}

output id string = virtualNetwork.id
output name string = virtualNetwork.name
```

### Step 2: Create Main Bicep File

Create file: `main.bicep`

```bicep
// ============================================
// MAIN TEMPLATE - Orchestrates all modules
// ============================================

@description('Environment name')
@allowed([
  'dev'
  'staging'
  'prod'
])
param environment string = 'dev'

@description('Location')
param location string = resourceGroup().location

// Variables
var prefix = 'day27-${environment}'
var tags = {
  environment: environment
  createdBy: 'Bicep-Modules'
  project: 'Day27'
}

// ============================================
// Module 1: Storage Account
// ============================================
module storage 'modules/storage.bicep' = {
  name: 'deploy-storage'
  params: {
    name: 'st${replace(prefix, '-', '')}001'
    location: location
    skuName: environment == 'prod' ? 'Standard_GRS' : 'Standard_LRS'
    tags: tags
  }
}

// ============================================
// Module 2: Virtual Network
// ============================================
module vnet 'modules/vnet.bicep' = {
  name: 'deploy-vnet'
  params: {
    name: 'vnet-${prefix}'
    location: location
    addressPrefix: '10.0.0.0/16'
    subnets: [
      {
        name: 'subnet-web'
        prefix: '10.0.1.0/24'
      }
      {
        name: 'subnet-app'
        prefix: '10.0.2.0/24'
      }
      {
        name: 'subnet-db'
        prefix: '10.0.3.0/24'
      }
    ]
    tags: tags
  }
}

// ============================================
// Outputs
// ============================================
output storageId string = storage.outputs.id
output storageBlobEndpoint string = storage.outputs.blobEndpoint
output vnetId string = vnet.outputs.id
```

**Key concepts:**

```
1. module keyword
   module storage 'modules/storage.bicep' = { ... }
   → Calls the storage module file
   → Passes parameters to it
   → Gets outputs from it

2. Conditional expression
   skuName: environment == 'prod' ? 'Standard_GRS' : 'Standard_LRS'
   → If prod, use GRS. Otherwise, use LRS.
   → Like a ternary operator in programming!

3. Loop in module
   subnets: [for subnet in subnets: { ... }]
   → Creates multiple subnets from an array
   → Like a for-each loop!

4. Module outputs
   storage.outputs.id
   → Access the output of a module
```

### Step 3: Deploy Modular Template

```bash
# Deploy for dev
az deployment group create \
  --resource-group rg-day27-templates \
  --template-file main.bicep \
  --parameters environment=dev

# Deploy for prod (different parameters, same modules!)
az deployment group create \
  --resource-group rg-day27-templates \
  --template-file main.bicep \
  --parameters environment=prod
```

### Step 4: Test, Check, and Confirm - Modules

**Test 1: Verify Dev Resources**

```
1. Go to rg-day27-templates
2. Verify:
   ✅ stday27dev001 (Storage, LRS)
   ✅ vnet-day27-dev (VNet with 3 subnets)
   ✅ Tags: environment=dev, createdBy=Bicep-Modules
```

**Test 2: Verify Prod Resources**

```
1. Verify:
   ✅ stday27prod001 (Storage, GRS!)
   ✅ vnet-day27-prod (VNet with 3 subnets)
   ✅ Tags: environment=prod, createdBy=Bicep-Modules
```

**Test 3: Verify Nested Deployments**

```
1. rg-day27-templates → Deployments
2. Click the main deployment
3. You'll see nested deployments:
   ✅ deploy-storage (from storage module)
   ✅ deploy-vnet (from vnet module)
   ✅ Each module is a separate deployment!
```

**✅ Result**: Modular Bicep templates working!

---

## Lab 7: Export Template from Existing Resources

### What is Template Export?

```
Template Export = Generate a template FROM existing resources

┌──────────────────────────────────────────────────────────────┐
│  USE CASE:                                                    │
│                                                               │
│  You created resources manually in Portal                    │
│  Now you want a template to recreate them                    │
│                                                               │
│  Solution: Export the template!                              │
│  Azure generates ARM JSON from your existing resources       │
│                                                               │
│  Manual resource → Export → ARM Template → Redeploy anywhere │
└──────────────────────────────────────────────────────────────┘
```

### Step 1: Export from Resource Group

```
1. Go to resource group: rg-day27-templates
2. Left menu → "Export template"
3. Wait for Azure to generate the template
4. You'll see:
   - Template tab: The ARM JSON for ALL resources in the group
   - Parameters tab: Auto-generated parameters

5. Options:
   - "Download" → Downloads as ZIP (template.json + parameters.json)
   - "Deploy" → Deploy this template to another resource group
   - "Add to library" → Save as Template Spec (reusable)
```

### Step 2: Export from Individual Resource

```
1. Go to any resource (e.g., a storage account)
2. Left menu → "Export template"
3. This exports ONLY that single resource
4. Cleaner and simpler than full resource group export

5. Click "Download" to save the template
```

### Step 3: Export from Deployment History

```
This is the BEST method - gives you the exact template used:

1. Go to resource group → "Deployments"
2. Click any successful deployment
3. Left menu → "Template"
4. You see the EXACT template that was used
5. Click "Download" to save

Why this is best:
  ✅ Exact template used (not reverse-engineered)
  ✅ Includes parameters as they were provided
  ✅ Clean and deployable
```

### Step 4: Clean Up Exported Template

```
Exported templates often need cleanup:

Common issues:
  1. Hardcoded values (should be parameters)
  2. Extra properties (Azure adds internal properties)
  3. Missing dependencies (dependsOn may be incomplete)
  4. API versions may be old

Best practice:
  Export → Review → Clean up → Test deploy → Use
  
  Don't use exported templates directly in production!
  Use them as a STARTING POINT, then refine.
```

### Step 5: Test, Check, and Confirm - Export

**Test 1: Verify Resource Group Export**

```
1. rg-day27-templates → Export template
2. Verify:
   ✅ Template generated (may take 30 seconds)
   ✅ All resources listed in the template
   ✅ Download works (ZIP file)
```

**Test 2: Verify Individual Resource Export**

```
1. Any storage account → Export template
2. Verify:
   ✅ Only that storage account in template
   ✅ Template is valid JSON
```

**Test 3: Verify Deployment History Export**

```
1. rg-day27-templates → Deployments → Any deployment → Template
2. Verify:
   ✅ Original template shown
   ✅ Parameters shown
   ✅ Can download
```

**✅ Result**: Template export working!

---

## Lab 8: Deploy from Azure Portal using Templates

### Method 1: Custom Template Deployment

```
This is what we've been using:

1. Search "Deploy a custom template"
2. Options:
   a. "Build your own template in the editor"
      → Paste your JSON
   
   b. "Load a GitHub quickstart template"
      → Choose from Microsoft's template library
      → Hundreds of pre-built templates!
   
   c. "Upload a template file"
      → Upload your .json file from disk

3. Fill in parameters → Deploy
```

### Method 2: Azure Quickstart Templates

```
Microsoft provides hundreds of ready-to-use templates!

1. Go to: https://github.com/Azure/azure-quickstart-templates
   or
   Search "Deploy a custom template" → "Load a GitHub quickstart template"

2. Popular templates:
   ├─ 101-vm-simple-linux (simple Linux VM)
   ├─ 101-vm-simple-windows (simple Windows VM)
   ├─ 101-storage-account-create (storage account)
   ├─ 201-web-app-sql-database (web app + SQL)
   ├─ 301-aks-cluster (AKS cluster)
   └─ Many more...

3. Each template has:
   ├─ azuredeploy.json (the template)
   ├─ azuredeploy.parameters.json (sample parameters)
   ├─ README.md (documentation)
   └─ "Deploy to Azure" button (one-click deploy!)
```

### Method 3: Template Specs (Reusable Templates)

```
Template Specs = Store templates IN Azure for reuse

1. Search "Template specs" in Portal
2. Click "+ Create template spec"
3. Fill in:
   - Resource group: rg-day27-templates
   - Name: storage-template
   - Version: 1.0
   - Description: Standard storage account template
4. Paste your template JSON
5. Click "Create"

Now anyone in your organization can:
  1. Go to "Template specs"
  2. Find "storage-template"
  3. Click "Deploy"
  4. Fill in parameters
  5. Deploy!

Benefits:
  ✅ Centralized template library
  ✅ Version controlled
  ✅ RBAC (control who can deploy)
  ✅ No need to share JSON files
```

### Step 1: Deploy a Quickstart Template

```
1. Search "Deploy a custom template" in Portal
2. Click "Load a GitHub quickstart template"
3. In the dropdown, type: 101-storage-account-create
4. Select it
5. Click "Select template"
6. Fill in parameters:
   - Resource group: rg-day27-templates
   - Storage Account Type: Standard_LRS
   - Location: eastus
7. Click "Review + create" → "Create"

✅ Deployed a Microsoft quickstart template!
```

### Step 2: Create a Template Spec

```
1. Search "Template specs" in Portal
2. Click "+ Create template spec"
3. Fill in:
   Basics:
   - Resource group: rg-day27-templates
   - Name: standard-storage
   - Version: 1.0.0
   - Description: Company standard storage account
   
   Edit Template:
   - Paste your storage-params.json content
   
4. Click "Review + create" → "Create"
```

### Step 3: Deploy from Template Spec

```
1. Go to "Template specs"
2. Click "standard-storage"
3. Click version "1.0.0"
4. Click "Deploy"
5. Fill in parameters → Deploy

✅ Deployed from Template Spec!
```

### Step 4: Test, Check, and Confirm - Portal Deployment

**Test 1: Verify Quickstart Deployment**

```
1. rg-day27-templates → Deployments
2. Verify:
   ✅ Quickstart template deployment: Succeeded
   ✅ Storage account created
```

**Test 2: Verify Template Spec**

```
1. Search "Template specs"
2. Verify:
   ✅ standard-storage exists
   ✅ Version: 1.0.0
   ✅ Can click "Deploy" to use it
```

**✅ Result**: Multiple deployment methods working!

---

## ARM Template Functions Cheat Sheet

```
┌─────────────────────────────────────────────────────────────────┐
│  COMMONLY USED ARM TEMPLATE FUNCTIONS                            │
│                                                                  │
│  STRING FUNCTIONS:                                              │
│  ├─ concat('hello', 'world')     → "helloworld"                │
│  ├─ toLower('HELLO')             → "hello"                      │
│  ├─ toUpper('hello')             → "HELLO"                      │
│  ├─ replace('hello', 'l', 'r')   → "herro"                     │
│  ├─ substring('hello', 0, 3)     → "hel"                       │
│  └─ uniqueString(resourceGroup().id) → "abc123..." (unique)    │
│                                                                  │
│  RESOURCE FUNCTIONS:                                            │
│  ├─ resourceGroup().location     → "eastus"                     │
│  ├─ resourceGroup().name         → "rg-day27-templates"         │
│  ├─ subscription().subscriptionId → "xxxx-xxxx-xxxx"            │
│  ├─ resourceId('Type', 'name')   → Full resource ID             │
│  └─ reference('name')            → Resource properties          │
│                                                                  │
│  LOGICAL FUNCTIONS:                                             │
│  ├─ if(condition, trueVal, falseVal)                            │
│  │   if(equals(env,'prod'), 'GRS', 'LRS')                      │
│  ├─ equals('a', 'a')            → true                          │
│  ├─ not(equals('a','b'))        → true                          │
│  └─ and(cond1, cond2)           → true if both true             │
│                                                                  │
│  NUMERIC FUNCTIONS:                                             │
│  ├─ add(1, 2)                    → 3                            │
│  ├─ mul(2, 3)                    → 6                            │
│  └─ length('hello')             → 5                             │
│                                                                  │
│  ARRAY FUNCTIONS:                                               │
│  ├─ length(array)                → count of items               │
│  ├─ first(array)                 → first item                   │
│  └─ last(array)                  → last item                    │
│                                                                  │
│  DEPLOYMENT FUNCTIONS:                                          │
│  ├─ deployment().name            → deployment name              │
│  └─ environment().name           → "AzureCloud"                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Complete Summary

```
┌─────────────────────────────────────────────────────────────────┐
│  DAY 27 - AZURE TEMPLATES COMPLETE                               │
│                                                                  │
│  ARM Templates (JSON):                                          │
│  ├─ Lab 1: Simple storage account (basics)                      │
│  ├─ Lab 2: Parameters, variables, outputs                       │
│  ├─ Lab 3: VNet with NSGs (dependencies, multiple resources)    │
│  ├─ Lab 4: Complete VM (5 resources, securestring)              │
│  └─ ✅ Understand JSON structure and functions                  │
│                                                                  │
│  Bicep:                                                         │
│  ├─ Lab 5: Storage + VM in Bicep (cleaner syntax)              │
│  ├─ Lab 6: Modules (reusable, modular templates)               │
│  └─ ✅ Auto-dependencies, loops, conditions                    │
│                                                                  │
│  Practical Skills:                                              │
│  ├─ Lab 7: Export templates from existing resources             │
│  ├─ Lab 8: Deploy via Portal, Quickstarts, Template Specs      │
│  └─ ✅ Multiple deployment methods                              │
│                                                                  │
│  Key Takeaways:                                                 │
│  ├─ Templates = Infrastructure as Code                          │
│  ├─ ARM JSON = verbose but universal                            │
│  ├─ Bicep = modern, cleaner, recommended                       │
│  ├─ Parameters = reusable across environments                   │
│  ├─ Modules = reusable across projects                          │
│  └─ Idempotent = deploy same template safely                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Cleanup

### Delete All Resources

```
1. Delete Resource Group:
   - Search "Resource groups"
   - Click rg-day27-templates
   - Click "Delete resource group"
   - Type the name to confirm
   - Click "Delete"

2. Delete Template Specs (if created):
   - Search "Template specs"
   - Delete any template specs you created

This deletes ALL resources created in today's labs:
  - All storage accounts
  - All VNets and NSGs
  - All VMs and related resources
  - All deployment history
```

**⏱️ Wait**: 5-10 minutes

**✅ Result**: All resources deleted!

---

## Quick Reference

### ARM Template Skeleton

```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {},
  "variables": {},
  "resources": [],
  "outputs": {}
}
```

### Bicep Skeleton

```bicep
// Parameters
param name string
param location string = resourceGroup().location

// Variables
var prefix = 'myapp'

// Resources
resource myResource 'Microsoft.Type/resource@2023-01-01' = {
  name: name
  location: location
}

// Outputs
output id string = myResource.id
```

### Deployment Commands

```bash
# ARM Template
az deployment group create \
  --resource-group <rg-name> \
  --template-file <template.json> \
  --parameters <params.json>

# Bicep
az deployment group create \
  --resource-group <rg-name> \
  --template-file <template.bicep> \
  --parameters param1=value1

# Validate (dry run, no deployment)
az deployment group validate \
  --resource-group <rg-name> \
  --template-file <template.json>

# What-if (preview changes)
az deployment group what-if \
  --resource-group <rg-name> \
  --template-file <template.json>

# Compile Bicep to ARM JSON
az bicep build --file main.bicep

# Decompile ARM JSON to Bicep
az bicep decompile --file template.json
```

### Useful Links

- [ARM Template Documentation](https://learn.microsoft.com/azure/azure-resource-manager/templates/)
- [Bicep Documentation](https://learn.microsoft.com/azure/azure-resource-manager/bicep/)
- [Azure Quickstart Templates](https://github.com/Azure/azure-quickstart-templates)
- [ARM Template Functions](https://learn.microsoft.com/azure/azure-resource-manager/templates/template-functions)
- [Bicep Playground](https://aka.ms/bicepdemo)
- [Template Specs](https://learn.microsoft.com/azure/azure-resource-manager/templates/template-specs)

---

**🎉 Congratulations!** You've completed Day 27 covering Azure ARM Templates and Bicep for Infrastructure as Code!