# Day 37: Azure Monitoring & Alerts - Complete Guide

## What You'll Learn

Monitor your Azure resources and get alerted when things go wrong:
- ✅ What is Azure Monitor and why use it
- ✅ Metrics vs Logs (the two types of data)
- ✅ Azure Monitor, Log Analytics, Application Insights
- ✅ Create metric alerts (CPU, memory, disk)
- ✅ Create log alerts (KQL queries)
- ✅ Action Groups (email, SMS, webhook)
- ✅ Dashboards (visualize everything)
- ✅ Diagnostic Settings (collect logs)
- ✅ Complete test, check, and confirm

## Table of Contents

1. [What is Azure Monitor?](#what-is-azure-monitor)
2. [Why Monitoring Matters](#why-monitoring-matters)
3. [The Monitoring Ecosystem](#the-monitoring-ecosystem)
4. [Lab 1: Setup - Create Resources to Monitor](#lab-1-setup---create-resources-to-monitor)
5. [Lab 2: Explore Metrics (VM CPU, Disk, Network)](#lab-2-explore-metrics-vm-cpu-disk-network)
6. [Lab 3: Create Action Group (Email + SMS)](#lab-3-create-action-group-email--sms)
7. [Lab 4: Create Metric Alert (High CPU)](#lab-4-create-metric-alert-high-cpu)
8. [Lab 5: Trigger the Alert (Stress Test)](#lab-5-trigger-the-alert-stress-test)
9. [Lab 6: Log Analytics Workspace & Diagnostic Settings](#lab-6-log-analytics-workspace--diagnostic-settings)
10. [Lab 7: KQL Queries (Search Logs)](#lab-7-kql-queries-search-logs)
11. [Lab 8: Create Log Alert](#lab-8-create-log-alert)
12. [Lab 9: Create Dashboard](#lab-9-create-dashboard)
13. [Cleanup](#cleanup)

---

## What is Azure Monitor?

**Azure Monitor** = The central service that collects, analyzes, and acts on monitoring data from ALL your Azure resources.

### Simple Explanation

```
Think of it like this:

🏥 Hospital Monitoring:
  Patient has sensors: heart rate, blood pressure, oxygen
  Monitors display real-time data
  Alarms go off if something is wrong
  Doctors get paged immediately

☁️ Azure Monitoring:
  VM has sensors: CPU, memory, disk, network
  Azure Monitor displays real-time data
  Alerts fire if something is wrong
  You get email/SMS immediately

┌──────────────────────────────────────────────────────────────┐
│  AZURE MONITOR                                                │
│                                                               │
│  Collects:                                                   │
│  ├─ Metrics (numbers: CPU 85%, Memory 70%, Disk 90%)        │
│  ├─ Logs (text: "Error: Connection refused at 10:05 AM")    │
│  └─ Traces (app performance: Request took 2.5 seconds)      │
│                                                               │
│  Analyzes:                                                   │
│  ├─ Dashboards (visual charts and graphs)                   │
│  ├─ KQL queries (search and filter logs)                    │
│  └─ Workbooks (interactive reports)                          │
│                                                               │
│  Acts:                                                       │
│  ├─ Alerts (email, SMS, webhook when threshold crossed)     │
│  ├─ Autoscale (add VMs when CPU is high)                    │
│  └─ Automation (run script when alert fires)                │
└──────────────────────────────────────────────────────────────┘
```

---

## Why Monitoring Matters

```
┌─────────────────────────────────────────────────────────────────┐
│  WITHOUT MONITORING:                                             │
│                                                                  │
│  Monday 2 AM: VM disk is 95% full                               │
│  Monday 3 AM: Disk is 100% full, app crashes                   │
│  Monday 9 AM: Users complain "app is down!"                    │
│  Monday 9:30 AM: You find out from angry emails                │
│  Monday 10 AM: You start investigating                          │
│  Monday 11 AM: You find the disk issue                          │
│  Monday 12 PM: Fixed. 9 hours of downtime! 😱                  │
│                                                                  │
│  WITH MONITORING:                                               │
│                                                                  │
│  Monday 2 AM: VM disk hits 80%                                  │
│  Monday 2:01 AM: Alert fires → Email + SMS to you              │
│  Monday 2:05 AM: You see the alert on your phone               │
│  Monday 2:15 AM: You clean up disk or expand it                │
│  Monday 2:30 AM: Fixed. ZERO downtime! ✅                      │
│  Users never noticed anything.                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Monitoring Ecosystem

```
┌─────────────────────────────────────────────────────────────────┐
│  AZURE MONITORING ECOSYSTEM                                      │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  DATA SOURCES (what generates data)                        │  │
│  │  ├─ VMs (CPU, memory, disk, network)                      │  │
│  │  ├─ App Services (requests, errors, response time)        │  │
│  │  ├─ Databases (DTU, connections, deadlocks)               │  │
│  │  ├─ Storage (transactions, latency, capacity)             │  │
│  │  ├─ AKS (pod count, node CPU, container restarts)         │  │
│  │  └─ Any Azure resource                                    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                          ↓                                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  DATA STORES (where data is kept)                          │  │
│  │                                                             │  │
│  │  Metrics Database          Log Analytics Workspace         │  │
│  │  ├─ Numbers                ├─ Text logs                    │  │
│  │  ├─ Time-series            ├─ Events                       │  │
│  │  ├─ Auto-collected         ├─ Need Diagnostic Settings     │  │
│  │  ├─ 93 days retention      ├─ 30-730 days retention       │  │
│  │  └─ Free                   └─ Pay per GB ingested          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                          ↓                                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  TOOLS (how you use the data)                              │  │
│  │  ├─ Metrics Explorer (charts, graphs)                     │  │
│  │  ├─ Log Analytics (KQL queries)                           │  │
│  │  ├─ Alerts (notifications when thresholds crossed)        │  │
│  │  ├─ Dashboards (custom visual boards)                     │  │
│  │  ├─ Workbooks (interactive reports)                        │  │
│  │  └─ Application Insights (app performance)                │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Metrics vs Logs

```
┌─────────────────────────────┬─────────────────────────────────┐
│  METRICS                     │  LOGS                           │
├─────────────────────────────┼─────────────────────────────────┤
│  Numbers over time          │  Text events over time          │
│  "CPU was 85% at 10:05"    │  "Error: timeout at 10:05"      │
│  Auto-collected (free)      │  Need Diagnostic Settings       │
│  93 days retention          │  30-730 days retention          │
│  Fast queries               │  Complex queries (KQL)          │
│  Metrics Explorer           │  Log Analytics                  │
│                             │                                 │
│  Examples:                  │  Examples:                      │
│  ├─ CPU percentage          │  ├─ Error messages              │
│  ├─ Memory usage            │  ├─ Login attempts              │
│  ├─ Disk IOPS               │  ├─ API request details         │
│  ├─ Network bytes           │  ├─ Audit events                │
│  └─ Request count           │  └─ Diagnostic events           │
└─────────────────────────────┴─────────────────────────────────┘
```

---

## Lab 1: Setup - Create Resources to Monitor

### Step 1: Create Resource Group

```
1. Azure Portal → Search "Resource groups" → "+ Create"
2. Name: rg-day37-monitoring
3. Region: East US
4. Click "Review + create" → "Create"
```

### Step 2: Create a VM to Monitor

```
1. Search "Virtual machines" → "+ Create"
2. Fill in:
   - Resource group: rg-day37-monitoring
   - Name: vm-monitored
   - Region: East US
   - Image: Ubuntu Server 22.04 LTS
   - Size: Standard_B1s
   - Authentication: Password
   - Username: azureuser
   - Password: Day37Mon@2026
   - Public inbound ports: Allow SSH (22)
3. Click "Review + create" → "Create"
```

**⏱️ Wait**: 2-3 minutes

### Step 3: Install Stress Tool on VM

```bash
ssh azureuser@<VM-PUBLIC-IP>

# Install stress tool (we'll use this to trigger alerts)
sudo apt update
sudo apt install -y stress-ng

# Verify
stress-ng --version

exit
```

### Step 4: Test, Check, and Confirm

```
✅ VM: vm-monitored running
✅ stress-ng installed
✅ SSH access working
```

**✅ Result**: Setup complete!

---

## Lab 2: Explore Metrics (VM CPU, Disk, Network)

### What are Metrics?

```
Metrics = Numbers collected automatically from your resources.
No setup needed! Azure collects them by default.
```

### Step 1: Open Metrics Explorer

```
1. Go to vm-monitored
2. Left menu → "Metrics"
3. You're now in Metrics Explorer!
```

### Step 2: View CPU Metric

```
1. In Metrics Explorer:
   - Resource: vm-monitored (auto-selected)
   - Metric Namespace: Virtual Machine Host
   - Metric: Percentage CPU
   - Aggregation: Avg
   
2. You'll see a chart showing CPU usage over time
   (Probably low, ~1-5% since VM is idle)

3. Change time range (top right):
   - Last 1 hour
   - Last 24 hours
   - Last 7 days
```

### Step 3: View Multiple Metrics

```
1. Click "+ Add metric" (top of chart)
2. Add these one by one:

   Metric 2:
   - Metric: Network In Total
   - Aggregation: Sum
   
   Metric 3:
   - Metric: Disk Read Bytes
   - Aggregation: Sum

3. Now you see 3 metrics on one chart!
   (Or click "New chart" to see them separately)
```

### Step 4: Pin to Dashboard

```
1. After creating a nice chart
2. Click "Pin to dashboard" (top right of chart)
3. Select: Create new → Name: Day37-Monitoring
4. Click "Pin"

This saves the chart to a dashboard for quick access.
```

### Step 5: Test, Check, and Confirm

**Test 1: Metrics Available**

```
1. vm-monitored → Metrics
   ✅ Percentage CPU shows data
   ✅ Network In/Out shows data
   ✅ Disk Read/Write shows data
```

**Test 2: Chart Displays**

```
✅ Line chart visible with data points
✅ Can change time range
✅ Can add multiple metrics
```

**Test 3: Pin to Dashboard**

```
✅ Chart pinned to dashboard
✅ Dashboard accessible from Portal home
```

**✅ Result**: Metrics Explorer working!

---

## Lab 3: Create Action Group (Email + SMS)

### What is an Action Group?

```
Action Group = WHO gets notified and HOW when an alert fires

┌──────────────────────────────────────────────────────────────┐
│  ACTION GROUP                                                 │
│                                                               │
│  Alert fires → Action Group → Notifications + Actions        │
│                                                               │
│  Notifications (inform people):                              │
│  ├─ Email (send email to team)                               │
│  ├─ SMS (text message to phone)                              │
│  ├─ Push notification (Azure mobile app)                     │
│  └─ Voice call (phone call)                                  │
│                                                               │
│  Actions (do something):                                     │
│  ├─ Webhook (call a URL)                                     │
│  ├─ Azure Function (run code)                                │
│  ├─ Logic App (run workflow)                                 │
│  ├─ Automation Runbook (run script)                          │
│  └─ ITSM (create ticket in ServiceNow, etc.)                │
└──────────────────────────────────────────────────────────────┘
```

### Step 1: Create Action Group

```
1. Search "Monitor" in Azure Portal
2. Left menu → "Alerts"
3. Click "Action groups" (top menu)
4. Click "+ Create"
5. Fill in:

   Basics:
   - Subscription: Your subscription
   - Resource group: rg-day37-monitoring
   - Action group name: ag-devops-team
   - Display name: DevOps Team

   Notifications:
   - Click "+ Add notification"
   - Notification type: Email/SMS message/Push/Voice
   - Name: email-devops
   - Check: ✅ Email
   - Email: your-email@example.com
   - Check: ✅ SMS (optional)
   - Country code: Your country
   - Phone number: Your phone number
   - Click "OK"

   Actions:
   - (Skip for now, we'll just use notifications)

6. Click "Review + create" → "Create"
```

### Step 2: Test Action Group

```
1. Go to Monitor → Alerts → Action groups
2. Click "ag-devops-team"
3. Click "Test action group" (top button)
4. Select: Sample type → Metric alert
5. Check: ✅ email-devops
6. Click "Test"

7. Check your email:
   ✅ You should receive a test alert email!
   Subject: "Azure Monitor Test Notification"
   
8. Check your phone (if SMS enabled):
   ✅ SMS received with test alert
```

### Step 3: Test, Check, and Confirm

**Test 1: Action Group Created**

```
Monitor → Alerts → Action groups
  ✅ ag-devops-team exists
  ✅ Notifications: email-devops
```

**Test 2: Test Email Received**

```
✅ Test email received in inbox
✅ Subject contains "Azure Monitor"
```

**Test 3: Test SMS Received (if configured)**

```
✅ SMS received on phone
```

**✅ Result**: Action Group ready!

---

## Lab 4: Create Metric Alert (High CPU)

### What We'll Do

```
Create an alert that fires when VM CPU > 80% for 5 minutes.

VM CPU > 80% for 5 min → Alert fires → Email + SMS to you

This is the most common alert in production!
```

### Step 1: Create Alert Rule

```
1. Go to vm-monitored
2. Left menu → "Alerts"
3. Click "+ Create alert rule"
4. Fill in:

   Condition:
   - Signal name: Percentage CPU
   - Click "Percentage CPU"
   
   Alert logic:
   - Threshold: Static
   - Aggregation type: Average
   - Operator: Greater than
   - Threshold value: 80
   - Check every: 1 minute
   - Lookback period: 5 minutes
   
   (This means: If AVERAGE CPU > 80% over the last 5 minutes)
   
   Click "Next: Actions"

   Actions:
   - Click "+ Select action groups"
   - Select: ag-devops-team ✅
   - Click "Select"
   
   Click "Next: Details"

   Details:
   - Alert rule name: High-CPU-Alert
   - Description: VM CPU is above 80% for 5 minutes
   - Severity: 2 - Warning
   - Resource group: rg-day37-monitoring
   - Enable upon creation: ✅ Yes
   
5. Click "Review + create" → "Create"
```

### Step 2: Understand Severity Levels

```
┌──────────────────────────────────────────────────────────────┐
│  ALERT SEVERITY LEVELS                                        │
│                                                               │
│  Sev 0 - Critical:  System is DOWN                          │
│  Sev 1 - Error:     System is degraded                      │
│  Sev 2 - Warning:   Something needs attention               │
│  Sev 3 - Informational: FYI, not urgent                     │
│  Sev 4 - Verbose:   Detailed info, debugging                │
│                                                               │
│  Common mapping:                                             │
│  CPU > 95% for 10 min → Sev 1 (Error)                      │
│  CPU > 80% for 5 min → Sev 2 (Warning) ← Our alert        │
│  Disk > 90% → Sev 1 (Error)                                │
│  Disk > 80% → Sev 2 (Warning)                              │
│  VM stopped → Sev 0 (Critical)                              │
└──────────────────────────────────────────────────────────────┘
```

### Step 3: Test, Check, and Confirm

**Test 1: Alert Rule Created**

```
1. vm-monitored → Alerts → Alert rules
   ✅ High-CPU-Alert exists
   ✅ Status: Enabled
   ✅ Condition: CPU > 80%
   ✅ Action group: ag-devops-team
```

**Test 2: Alert Rule Details**

```
1. Click High-CPU-Alert
   ✅ Signal: Percentage CPU
   ✅ Threshold: 80
   ✅ Aggregation: Average
   ✅ Lookback: 5 minutes
   ✅ Severity: 2 - Warning
```

**✅ Result**: CPU alert rule created!

---

## Lab 5: Trigger the Alert (Stress Test)

### What We'll Do

```
Generate high CPU on the VM to trigger our alert!
Then verify we receive the email/SMS notification.
```

### Step 1: Start CPU Stress Test

```bash
# SSH into vm-monitored
ssh azureuser@<VM-PUBLIC-IP>

# Generate 100% CPU load for 10 minutes
stress-ng --cpu 1 --timeout 600s &

# Check CPU usage
top
# CPU should show ~100% usage
# Press 'q' to exit top

# Leave the stress running and exit SSH
# (stress continues in background)
exit
```

### Step 2: Watch Metrics

```
1. Go to vm-monitored → Metrics
2. Metric: Percentage CPU
3. Time range: Last 30 minutes
4. Watch the CPU spike to ~100%!

You should see:
  Before stress: ~1-5%
  During stress: ~95-100%
  
  ✅ CPU spike visible in metrics!
```

### Step 3: Wait for Alert to Fire

```
Alert condition: CPU > 80% for 5 minutes
Stress started: CPU at ~100%
Alert should fire: ~5-6 minutes after stress started

1. Go to Monitor → Alerts
2. Wait for the alert to appear
3. You should see:
   - Alert: High-CPU-Alert
   - Severity: 2 - Warning
   - State: Fired
   - Time: ~5 minutes after stress started
```

### Step 4: Check Email Notification

```
Check your email inbox:

Subject: "Azure Monitor Alert - High-CPU-Alert"
Body contains:
  - Alert name: High-CPU-Alert
  - Severity: Warning
  - Resource: vm-monitored
  - Condition: Percentage CPU > 80
  - Metric value: ~98%
  - Time fired

✅ Email notification received!
```

### Step 5: Check SMS Notification (if configured)

```
Check your phone:

SMS from Azure:
  "Azure Alert: High-CPU-Alert fired for vm-monitored.
   Percentage CPU: 98%. Severity: Warning"

✅ SMS notification received!
```

### Step 6: Stop the Stress Test

```bash
ssh azureuser@<VM-PUBLIC-IP>

# Kill the stress process
pkill stress-ng

# Verify CPU is back to normal
top
# CPU should drop back to ~1-5%

exit
```

### Step 7: Wait for Alert to Resolve

```
After CPU drops below 80%:
  Wait ~5 minutes
  Alert state changes: Fired → Resolved

1. Monitor → Alerts
2. High-CPU-Alert: State = Resolved ✅

3. Check email:
   New email: "Azure Monitor Alert - High-CPU-Alert - Resolved"
   ✅ Resolution notification received!
```

### Step 8: Test, Check, and Confirm

**Test 1: Alert Fired**

```
Monitor → Alerts
  ✅ High-CPU-Alert: Fired (or Resolved if stress stopped)
  ✅ Severity: 2 - Warning
```

**Test 2: Email Received**

```
✅ "Alert fired" email received
✅ Contains: resource name, metric value, severity
```

**Test 3: SMS Received**

```
✅ SMS alert received on phone (if configured)
```

**Test 4: Alert Resolved**

```
After stopping stress:
  ✅ Alert state: Resolved
  ✅ "Alert resolved" email received
```

**Test 5: Metrics Show Spike**

```
vm-monitored → Metrics → CPU
  ✅ Clear spike visible during stress period
  ✅ Drop back to normal after stress stopped
```

**✅ Result**: Alert fired, notification received, alert resolved!

---

## Lab 6: Log Analytics Workspace & Diagnostic Settings

### What is Log Analytics?

```
Log Analytics Workspace = A database for LOGS

Metrics are auto-collected, but LOGS need to be sent somewhere.
That somewhere is Log Analytics Workspace.

┌──────────────────────────────────────────────────────────────┐
│  LOG ANALYTICS                                                │
│                                                               │
│  VM → Diagnostic Settings → Log Analytics Workspace          │
│                                                               │
│  Logs stored:                                                │
│  ├─ Syslog (Linux system logs)                               │
│  ├─ Performance counters (detailed CPU, memory, disk)        │
│  ├─ Security events (login attempts)                         │
│  └─ Custom logs (your application logs)                      │
│                                                               │
│  Query with: KQL (Kusto Query Language)                      │
│  "Show me all errors in the last 24 hours"                   │
│  "Which VM had the most failed logins?"                      │
└──────────────────────────────────────────────────────────────┘
```

### Step 1: Create Log Analytics Workspace

```
1. Search "Log Analytics workspaces" → "+ Create"
2. Fill in:
   - Subscription: Your subscription
   - Resource group: rg-day37-monitoring
   - Name: law-day37
   - Region: East US
3. Click "Review + create" → "Create"
```

**⏱️ Wait**: 1-2 minutes

### Step 2: Enable Diagnostic Settings on VM

```
1. Go to vm-monitored
2. Left menu → "Diagnostic settings"
3. Click "+ Add diagnostic setting"
4. Fill in:
   - Diagnostic setting name: vm-diagnostics
   - Logs: (may not have log categories for VMs)
   - Metrics:
     ✅ AllMetrics
   - Destination:
     ✅ Send to Log Analytics workspace
     Workspace: law-day37
5. Click "Save"
```

### Step 3: Enable VM Insights (Richer Data)

```
1. Go to vm-monitored
2. Left menu → "Insights"
3. Click "Enable"
4. Select:
   - Log Analytics workspace: law-day37
   - Data collection rule: Create new
     - Name: dcr-day37
     - Click "Create"
5. Click "Configure"

⏱️ Wait: 5-10 minutes for agent to install and data to flow

VM Insights gives you:
  ├─ Detailed performance (CPU, memory, disk per process)
  ├─ Network connections (who connects to what)
  ├─ Process map (visual dependency map)
  └─ Much richer than basic metrics!
```

### Step 4: Test, Check, and Confirm

**Test 1: Workspace Created**

```
Log Analytics workspaces → law-day37
  ✅ Status: Active
  ✅ Region: East US
```

**Test 2: Diagnostic Settings**

```
vm-monitored → Diagnostic settings
  ✅ vm-diagnostics configured
  ✅ Sending to law-day37
```

**Test 3: VM Insights Enabled**

```
vm-monitored → Insights
  ✅ Shows performance data (after 5-10 min)
  ✅ CPU, memory, disk charts visible
```

**✅ Result**: Log Analytics and diagnostics configured!

---

## Lab 7: KQL Queries (Search Logs)

### What is KQL?

```
KQL = Kusto Query Language
The language used to search and analyze logs in Log Analytics.

Like SQL but for logs:
  SQL:  SELECT * FROM users WHERE age > 30
  KQL:  Perf | where CounterName == "% Processor Time" | where CounterValue > 80
```

### Step 1: Open Log Analytics

```
1. Go to law-day37 (Log Analytics workspace)
2. Left menu → "Logs"
3. Close the "Queries" popup (or browse example queries)
4. You'll see the query editor
```

### Step 2: Basic KQL Queries

**Query 1: See all available tables**

```kql
search *
| summarize count() by $table
| sort by count_ desc
```

```
This shows which tables have data.
Common tables:
  ├─ Perf (performance counters)
  ├─ Heartbeat (VM health check)
  ├─ Syslog (Linux system logs)
  ├─ InsightsMetrics (VM Insights data)
  └─ AzureMetrics (resource metrics)
```

**Query 2: VM Heartbeat (is VM alive?)**

```kql
Heartbeat
| where TimeGenerated > ago(1h)
| summarize LastHeartbeat = max(TimeGenerated) by Computer
| project Computer, LastHeartbeat, MinutesSinceLastBeat = datetime_diff('minute', now(), LastHeartbeat)
```

```
Expected:
  Computer: vm-monitored
  LastHeartbeat: 2026-03-28T10:05:00Z
  MinutesSinceLastBeat: 2
  ✅ VM is alive (heartbeat within last few minutes)
```

**Query 3: CPU Performance**

```kql
Perf
| where ObjectName == "Processor" and CounterName == "% Processor Time"
| where TimeGenerated > ago(1h)
| summarize AvgCPU = avg(CounterValue), MaxCPU = max(CounterValue) by bin(TimeGenerated, 5m), Computer
| sort by TimeGenerated desc
```

```
Shows CPU usage in 5-minute intervals.
If you ran the stress test, you'll see the spike!
```

**Query 4: High CPU Events**

```kql
Perf
| where ObjectName == "Processor" and CounterName == "% Processor Time"
| where CounterValue > 80
| where TimeGenerated > ago(24h)
| project TimeGenerated, Computer, CounterValue
| sort by TimeGenerated desc
```

```
Shows every time CPU was above 80%.
✅ You should see entries from the stress test!
```

**Query 5: Memory Usage**

```kql
InsightsMetrics
| where Name == "AvailableMB"
| where TimeGenerated > ago(1h)
| summarize AvgAvailableMB = avg(Val) by bin(TimeGenerated, 5m), Computer
| sort by TimeGenerated desc
```

**Query 6: Disk Usage**

```kql
InsightsMetrics
| where Name == "FreeSpacePercentage"
| where TimeGenerated > ago(1h)
| summarize AvgFreeSpace = avg(Val) by bin(TimeGenerated, 5m), Computer
| sort by TimeGenerated desc
```

### Step 3: Visualize Query Results

```
1. Run any query above
2. Click "Chart" tab (next to "Results")
3. Select chart type:
   - Line chart (for time series)
   - Bar chart (for comparisons)
   - Pie chart (for distributions)
4. Click "Pin to dashboard" to save the visualization
```

### Step 4: Test, Check, and Confirm

**Test 1: Queries Return Data**

```
Run Heartbeat query:
  ✅ vm-monitored appears
  ✅ Recent heartbeat timestamp
```

**Test 2: CPU Data Available**

```
Run CPU query:
  ✅ CPU percentage data shown
  ✅ Stress test spike visible (if ran Lab 5)
```

**Test 3: Chart Visualization**

```
Click "Chart" on query results:
  ✅ Line chart displays
  ✅ Can pin to dashboard
```

**✅ Result**: KQL queries working!

---

## Lab 8: Create Log Alert

### What We'll Do

```
Create an alert based on a LOG QUERY (not just a metric).
Alert when: More than 5 high-CPU events in 15 minutes.
```

### Step 1: Create Log Alert Rule

```
1. Go to Monitor → Alerts
2. Click "+ Create alert rule"
3. Fill in:

   Scope:
   - Select resource: law-day37 (Log Analytics workspace)

   Condition:
   - Signal type: Custom log search
   - Search query:
   
     Perf
     | where ObjectName == "Processor" and CounterName == "% Processor Time"
     | where CounterValue > 80
     | summarize HighCPUCount = count() by Computer
     | where HighCPUCount > 5
   
   - Measurement:
     - Measure: Table rows
     - Aggregation type: Count
     - Aggregation granularity: 15 minutes
   
   - Alert logic:
     - Operator: Greater than
     - Threshold: 0
     - Frequency of evaluation: 5 minutes

   Actions:
   - Select action group: ag-devops-team

   Details:
   - Alert rule name: High-CPU-Log-Alert
   - Description: More than 5 high CPU events in 15 minutes
   - Severity: 2 - Warning

4. Click "Review + create" → "Create"
```

### Step 2: Test, Check, and Confirm

**Test 1: Log Alert Created**

```
Monitor → Alerts → Alert rules
  ✅ High-CPU-Log-Alert exists
  ✅ Type: Log search
  ✅ Workspace: law-day37
```

**Test 2: Trigger (Run Stress Again)**

```
SSH into VM → stress-ng --cpu 1 --timeout 600s &
Wait 15 minutes
  ✅ Log alert fires (if enough high CPU data points)
  ✅ Email notification received
```

**✅ Result**: Log-based alert working!

---

## Lab 9: Create Dashboard

### What We'll Do

```
Create a monitoring dashboard that shows everything at a glance.
Like a "war room" screen for your infrastructure.
```

### Step 1: Create Dashboard

```
1. Azure Portal → Search "Dashboard"
2. Click "+ New dashboard" → "Blank dashboard"
3. Name: Day37-Monitoring-Dashboard
4. Click "Save"
```

### Step 2: Add Metric Charts

```
1. Click "Edit" (top of dashboard)
2. Click "+ Add" → "Metrics chart"
3. Configure:
   - Resource: vm-monitored
   - Metric: Percentage CPU
   - Aggregation: Avg
   - Time range: Last 1 hour
4. Click "Save to dashboard"

5. Repeat for:
   - Network In Total
   - Network Out Total
   - Disk Read Bytes
```

### Step 3: Add Log Query Results

```
1. Go to law-day37 → Logs
2. Run a query (e.g., Heartbeat summary)
3. Click "Pin to dashboard"
4. Select: Day37-Monitoring-Dashboard
5. Click "Pin"
```

### Step 4: Add Alert Summary

```
1. On dashboard → Edit → "+ Add"
2. Search for "Alerts summary" tile
3. Add it
4. Configure: Show alerts for rg-day37-monitoring
5. Save
```

### Step 5: Arrange Dashboard

```
1. Click "Edit"
2. Drag tiles to arrange them:
   
   ┌─────────────────┬─────────────────┐
   │  CPU Chart       │  Memory Chart   │
   ├─────────────────┼─────────────────┤
   │  Network In/Out  │  Disk I/O       │
   ├─────────────────┴─────────────────┤
   │  Alert Summary                     │
   ├───────────────────────────────────┤
   │  VM Heartbeat Status              │
   └───────────────────────────────────┘

3. Click "Save"
```

### Step 6: Share Dashboard

```
1. Click "Share" (top of dashboard)
2. Options:
   - Publish to dashboard gallery (org-wide)
   - Share with specific users/groups
   - Set permissions (read-only or edit)
3. Click "Publish" or "Share"
```

### Step 7: Test, Check, and Confirm

**Test 1: Dashboard Created**

```
✅ Day37-Monitoring-Dashboard exists
✅ Multiple tiles visible
```

**Test 2: Charts Show Data**

```
✅ CPU chart shows real-time data
✅ Network charts show traffic
✅ Alert summary shows alert count
```

**Test 3: Dashboard Accessible**

```
✅ Can access from Portal home → Dashboards
✅ Auto-refreshes with latest data
```

**✅ Result**: Monitoring dashboard created!

---

## Complete Summary

```
┌─────────────────────────────────────────────────────────────────┐
│  DAY 37 - MONITORING & ALERTS COMPLETE                           │
│                                                                  │
│  Metrics (Lab 2):                                               │
│  ├─ Explored CPU, Network, Disk metrics                         │
│  └─ Metrics Explorer with charts                                │
│                                                                  │
│  Action Group (Lab 3):                                          │
│  ├─ ag-devops-team                                              │
│  ├─ Email notification configured                               │
│  └─ SMS notification configured (optional)                      │
│                                                                  │
│  Metric Alert (Lab 4-5):                                        │
│  ├─ High-CPU-Alert (CPU > 80% for 5 min)                       │
│  ├─ Triggered with stress-ng                                    │
│  ├─ Email received when fired                                   │
│  └─ Email received when resolved                                │
│                                                                  │
│  Log Analytics (Lab 6):                                         │
│  ├─ law-day37 workspace                                         │
│  ├─ Diagnostic settings on VM                                   │
│  └─ VM Insights enabled                                         │
│                                                                  │
│  KQL Queries (Lab 7):                                           │
│  ├─ Heartbeat, CPU, Memory, Disk queries                       │
│  └─ Chart visualizations                                        │
│                                                                  │
│  Log Alert (Lab 8):                                             │
│  └─ High-CPU-Log-Alert (KQL-based)                              │
│                                                                  │
│  Dashboard (Lab 9):                                             │
│  └─ Day37-Monitoring-Dashboard with all charts                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Cleanup

```
1. Delete Alert Rules:
   - Monitor → Alerts → Alert rules
   - Delete: High-CPU-Alert
   - Delete: High-CPU-Log-Alert

2. Delete Action Group:
   - Monitor → Alerts → Action groups
   - Delete: ag-devops-team

3. Delete Resource Group:
   - Resource groups → rg-day37-monitoring → Delete
   - This deletes: VM, Log Analytics workspace, etc.

4. Delete Dashboard:
   - Dashboards → Day37-Monitoring-Dashboard → Delete
```

**⏱️ Wait**: 5-10 minutes

**✅ Result**: All resources deleted!

---

## Quick Reference

### Common Alert Thresholds (Production)

```
┌──────────────────────┬──────────┬──────────┬──────────────┐
│  Metric               │  Warning │  Critical│  Check Every │
├──────────────────────┼──────────┼──────────┼──────────────┤
│  CPU %                │  > 80%   │  > 95%   │  5 min       │
│  Memory %             │  > 85%   │  > 95%   │  5 min       │
│  Disk %               │  > 80%   │  > 90%   │  15 min      │
│  HTTP 5xx errors      │  > 5/min │  > 20/min│  1 min       │
│  Response time        │  > 2s    │  > 5s    │  1 min       │
│  VM heartbeat missing │  5 min   │  10 min  │  1 min       │
│  DB DTU %             │  > 80%   │  > 95%   │  5 min       │
└──────────────────────┴──────────┴──────────┴──────────────┘
```

### Essential KQL Queries

```kql
-- VM Heartbeat check
Heartbeat | summarize LastBeat=max(TimeGenerated) by Computer

-- High CPU events
Perf | where CounterName == "% Processor Time" | where CounterValue > 80

-- Failed logins (Linux)
Syslog | where Facility == "auth" | where SeverityLevel == "err"

-- Resource errors
AzureActivity | where Level == "Error" | where TimeGenerated > ago(24h)
```

### Useful Links

- [Azure Monitor Documentation](https://learn.microsoft.com/azure/azure-monitor/)
- [KQL Reference](https://learn.microsoft.com/azure/data-explorer/kusto/query/)
- [Alert Types](https://learn.microsoft.com/azure/azure-monitor/alerts/alerts-overview)
- [VM Insights](https://learn.microsoft.com/azure/azure-monitor/vm/vminsights-overview)
- [Log Analytics Pricing](https://azure.microsoft.com/pricing/details/monitor/)

---

**🎉 Congratulations!** You've completed Day 37 covering Azure Monitoring, Alerts, Log Analytics, KQL, and Dashboards!