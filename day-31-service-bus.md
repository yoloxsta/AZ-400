# Day 31: Azure Service Bus - Enterprise Messaging

## What You'll Learn

Build reliable messaging between applications:
- ✅ What is Service Bus and why use it
- ✅ Queues (one sender → one receiver)
- ✅ Topics & Subscriptions (one sender → many receivers)
- ✅ Send and receive messages via Portal
- ✅ Send and receive messages via code (Python)
- ✅ Dead-letter queue (failed messages)
- ✅ Message sessions, scheduling, and TTL
- ✅ Service Bus vs Storage Queue vs Event Grid
- ✅ Complete test, check, and confirm

## Table of Contents

1. [What is Service Bus?](#what-is-service-bus)
2. [Why Use Service Bus?](#why-use-service-bus)
3. [Queues vs Topics](#queues-vs-topics)
4. [Lab 1: Create Service Bus Namespace](#lab-1-create-service-bus-namespace)
5. [Lab 2: Queues - Send and Receive Messages](#lab-2-queues---send-and-receive-messages)
6. [Lab 3: Queues with Code (Python)](#lab-3-queues-with-code-python)
7. [Lab 4: Topics and Subscriptions](#lab-4-topics-and-subscriptions)
8. [Lab 5: Topic Filters (Route Messages)](#lab-5-topic-filters-route-messages)
9. [Lab 6: Dead-Letter Queue](#lab-6-dead-letter-queue)
10. [Lab 7: Advanced Features](#lab-7-advanced-features)
11. [Cleanup](#cleanup)

---

## What is Service Bus?

**Azure Service Bus** = A messaging service that lets applications send messages to each other without being directly connected.

### Simple Explanation

```
Think of it like this:

📬 Post Office Analogy:

  Without Service Bus (direct call):
    You → Call friend → Friend must answer NOW
    If friend is busy → Call fails! ❌
    If friend's phone is off → Message lost! ❌

  With Service Bus (mailbox):
    You → Put letter in mailbox → Done!
    Friend picks up letter whenever ready
    If friend is busy → Letter waits in mailbox ✅
    If friend is on vacation → Letter still waits ✅
    Friend processes letter when available ✅

☁️ Azure:

  Without Service Bus:
    Order Service → calls → Payment Service directly
    If Payment Service is down → Order FAILS! ❌
    If Payment Service is slow → Order waits forever ❌

  With Service Bus:
    Order Service → sends message to Queue → Done!
    Payment Service picks up message when ready
    If Payment Service is down → Message waits safely ✅
    If Payment Service is slow → Messages queue up ✅
    Payment Service processes at its own pace ✅
```

### Visual

```
┌─────────────────────────────────────────────────────────────────┐
│  WITHOUT SERVICE BUS (Direct Communication)                      │
│                                                                  │
│  Order Service ──── direct call ────→ Payment Service           │
│       ↑                                      ↓                  │
│       │              If down: ❌ FAIL         │                  │
│       │              If slow: ⏳ WAIT         │                  │
│       └──────────── response ────────────────┘                  │
│                                                                  │
│  Problems:                                                      │
│  ├─ Tight coupling (both must be running)                       │
│  ├─ If receiver is down, sender fails                           │
│  ├─ If receiver is slow, sender waits                           │
│  └─ Can't handle traffic spikes                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  WITH SERVICE BUS (Message Queue)                                │
│                                                                  │
│  Order        ┌─────────────┐        Payment                   │
│  Service ───→ │  Queue      │ ───→  Service                    │
│  (sender)     │  ┌─┐┌─┐┌─┐ │       (receiver)                 │
│               │  │3││2││1│ │                                    │
│  "Send and    │  └─┘└─┘└─┘ │       "Process when               │
│   forget!"    └─────────────┘        ready!"                    │
│                                                                  │
│  Benefits:                                                      │
│  ├─ Loose coupling (independent)                                │
│  ├─ If receiver is down, messages wait safely                   │
│  ├─ If receiver is slow, messages queue up                      │
│  ├─ Handles traffic spikes (queue absorbs burst)                │
│  └─ Guaranteed delivery (messages don't get lost)               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Why Use Service Bus?

### Real-World Use Cases

```
┌─────────────────────────────────────────────────────────────────┐
│  REAL-WORLD USE CASES                                            │
│                                                                  │
│  1. ORDER PROCESSING                                            │
│     Customer places order → Message to queue                    │
│     Payment service processes when ready                        │
│     Inventory service updates stock                             │
│     Email service sends confirmation                            │
│                                                                  │
│  2. LOAD LEVELING                                               │
│     Black Friday: 10,000 orders per minute!                     │
│     Payment service can only handle 100/minute                  │
│     Queue absorbs the burst, payment processes steadily         │
│     No orders lost, no service crashes                          │
│                                                                  │
│  3. MICROSERVICES COMMUNICATION                                 │
│     Service A doesn't need to know about Service B              │
│     They communicate through messages                           │
│     Add/remove services without breaking others                 │
│                                                                  │
│  4. EVENT NOTIFICATION                                          │
│     "New user registered" → Topic                               │
│     Email service: sends welcome email                          │
│     Analytics service: updates dashboard                        │
│     CRM service: creates customer record                        │
│     Each service gets its own copy of the message!              │
│                                                                  │
│  5. SCHEDULED PROCESSING                                        │
│     "Send this email at 9 AM tomorrow"                          │
│     Schedule message for future delivery                        │
│     Service Bus delivers at the right time                      │
└─────────────────────────────────────────────────────────────────┘
```

### Service Bus vs Storage Queue vs Event Grid

```
┌──────────────────┬──────────────────┬──────────────────┬──────────────────┐
│                   │  Service Bus     │  Storage Queue   │  Event Grid      │
├──────────────────┼──────────────────┼──────────────────┼──────────────────┤
│  Purpose          │  Enterprise      │  Simple queue    │  Event routing   │
│                   │  messaging       │                  │                  │
│  Message size     │  256 KB (Std)    │  64 KB           │  1 MB            │
│                   │  100 MB (Prem)   │                  │                  │
│  Ordering         │  FIFO guaranteed │  Best effort     │  No ordering     │
│  Delivery         │  At-least-once   │  At-least-once   │  At-least-once   │
│                   │  or exactly-once │                  │                  │
│  Dead-letter      │  ✅ Yes          │  ❌ No           │  ✅ Yes          │
│  Topics/Subs      │  ✅ Yes          │  ❌ No           │  ✅ Yes          │
│  Sessions         │  ✅ Yes          │  ❌ No           │  ❌ No           │
│  Transactions     │  ✅ Yes          │  ❌ No           │  ❌ No           │
│  Scheduling       │  ✅ Yes          │  ❌ No           │  ❌ No           │
│  Cost             │  $$              │  $               │  $$              │
│  Best for         │  Business-       │  Simple async    │  React to        │
│                   │  critical msgs   │  processing      │  Azure events    │
└──────────────────┴──────────────────┴──────────────────┴──────────────────┘

💡 Rule of thumb:
   Simple queue, low cost → Storage Queue
   Enterprise features, guaranteed delivery → Service Bus
   React to Azure events (blob created, etc.) → Event Grid
```

---

## Queues vs Topics

```
┌─────────────────────────────────────────────────────────────────┐
│  QUEUE: One sender → One receiver                                │
│                                                                  │
│  Sender ───→ [Queue: msg3, msg2, msg1] ───→ Receiver           │
│                                                                  │
│  Each message is processed by ONE receiver only.                │
│  Once received, message is removed from queue.                  │
│  Like a to-do list: one person picks up each task.              │
│                                                                  │
│  Use for: Order processing, task distribution                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  TOPIC: One sender → Many receivers                              │
│                                                                  │
│                    ┌─ [Sub-A] ───→ Receiver A (Email)           │
│  Sender ───→ Topic─┤                                            │
│                    ├─ [Sub-B] ───→ Receiver B (Analytics)       │
│                    │                                             │
│                    └─ [Sub-C] ───→ Receiver C (CRM)             │
│                                                                  │
│  Each subscription gets its OWN COPY of the message.            │
│  Like a newspaper: every subscriber gets their own copy.        │
│                                                                  │
│  Use for: Event notification, fan-out scenarios                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Lab 1: Create Service Bus Namespace

### What is a Namespace?

```
Namespace = A container for all your Service Bus resources
            (queues, topics, subscriptions)

Like a post office that contains multiple mailboxes.

Namespace: sb-day31-demo
├─ Queue: order-queue
├─ Queue: payment-queue
├─ Topic: notifications
│   ├─ Subscription: email-sub
│   ├─ Subscription: sms-sub
│   └─ Subscription: analytics-sub
└─ Topic: events
    ├─ Subscription: audit-sub
    └─ Subscription: log-sub
```

### Step 1: Create Resource Group

```
1. Azure Portal → Search "Resource groups" → "+ Create"
2. Name: rg-day31-servicebus
3. Region: East US
4. Click "Review + create" → "Create"
```

### Step 2: Create Service Bus Namespace

```
1. Search "Service Bus" in Azure Portal
2. Click "+ Create"
3. Fill in:
   - Subscription: Your subscription
   - Resource group: rg-day31-servicebus
   - Namespace name: sb-day31-demo (must be globally unique)
   - Location: East US
   - Pricing tier: Standard
     (Basic = queues only, Standard = queues + topics, Premium = enterprise)
4. Click "Review + create" → "Create"
```

**⏱️ Wait**: 1-2 minutes

**Pricing tiers:**

```
┌──────────────────┬──────────────────┬──────────────────┐
│  Basic            │  Standard        │  Premium         │
├──────────────────┼──────────────────┼──────────────────┤
│  Queues only     │  Queues + Topics │  All features    │
│  256 KB messages │  256 KB messages │  100 MB messages │
│  No topics       │  Topics + Subs   │  Dedicated       │
│  No sessions     │  Sessions        │  VNet integration│
│  ~$0.05/million  │  ~$10/month base │  ~$668/month     │
│  Good for: test  │  Good for: prod  │  Good for: large │
└──────────────────┴──────────────────┴──────────────────┘

We use Standard for this lab (need Topics).
```

### Step 3: Get Connection String

```
1. Go to your namespace: sb-day31-demo
2. Left menu → "Shared access policies"
3. Click "RootManageSharedAccessKey"
4. Copy "Primary Connection String"
   
   It looks like:
   Endpoint=sb://sb-day31-demo.servicebus.windows.net/;
   SharedAccessKeyName=RootManageSharedAccessKey;
   SharedAccessKey=abc123...

   Save this! You'll need it for code labs.
```

### Step 4: Test, Check, and Confirm

**Test 1: Verify Namespace**

```
1. Search "Service Bus" → sb-day31-demo
2. Verify:
   ✅ Status: Active
   ✅ Location: East US
   ✅ Pricing tier: Standard
   ✅ Queues: 0 (none yet)
   ✅ Topics: 0 (none yet)
```

**Test 2: Verify Connection String**

```
1. Shared access policies → RootManageSharedAccessKey
2. Verify:
   ✅ Primary Connection String available
   ✅ Permissions: Manage, Send, Listen
```

**✅ Result**: Service Bus namespace ready!

---

## Lab 2: Queues - Send and Receive Messages

### What We'll Do

```
Create a queue and send/receive messages using Azure Portal.
No code needed! Just the Portal.

Order Service ───→ [order-queue] ───→ Payment Service
```

### Step 1: Create a Queue

```
1. Go to namespace: sb-day31-demo
2. Left menu → "Queues"
3. Click "+ Queue"
4. Fill in:
   - Name: order-queue
   - Max queue size: 1 GB
   - Message time to live: 14 days
   - Lock duration: 30 seconds
   - Enable dead lettering on message expiration: ✅ Yes
   - Enable sessions: No
   - Enable duplicate detection: No
5. Click "Create"
```

**Settings explained:**

```
Max queue size: How much data the queue can hold
  1 GB = ~4 million small messages

Message time to live (TTL): How long a message stays in queue
  14 days = if nobody reads it in 14 days, it expires
  Expired messages go to dead-letter queue (if enabled)

Lock duration: When a receiver reads a message, it's "locked"
  30 seconds = receiver has 30 seconds to process and complete
  If not completed, message becomes available again

Dead lettering: Where expired/failed messages go
  Like a "lost mail" box at the post office
```

### Step 2: Send Messages via Portal (Service Bus Explorer)

```
1. Go to namespace → Queues → order-queue
2. Left menu → "Service Bus Explorer"
3. Click "Send messages" tab
4. Content Type: application/json
5. Message body:

{
  "orderId": "ORD-001",
  "customer": "Alice",
  "product": "Laptop",
  "amount": 1299.99,
  "timestamp": "2026-03-28T10:00:00Z"
}

6. Click "Send"
   ✅ Message sent!

7. Send more messages:

Message 2:
{
  "orderId": "ORD-002",
  "customer": "Bob",
  "product": "Phone",
  "amount": 899.99,
  "timestamp": "2026-03-28T10:01:00Z"
}

Message 3:
{
  "orderId": "ORD-003",
  "customer": "Carol",
  "product": "Tablet",
  "amount": 599.99,
  "timestamp": "2026-03-28T10:02:00Z"
}

Click "Send" for each.
```

### Step 3: Check Queue Metrics

```
1. Go to order-queue → Overview
2. Check:
   - Active message count: 3
   - Dead-letter message count: 0
   - Scheduled message count: 0
   - Transfer message count: 0

   ✅ 3 messages waiting in the queue!
```

### Step 4: Receive Messages via Portal

```
1. Go to order-queue → Service Bus Explorer
2. Click "Receive messages" tab
3. Receive mode: 
   - Peek: Look at message WITHOUT removing it
   - Receive and delete: Read and REMOVE from queue

4. Click "Peek from start"
   You'll see all 3 messages!
   Messages are still in the queue (peek doesn't remove).

5. Click "Receive" (receive mode)
   - Max messages: 1
   - Click "Receive"
   
   You'll see ORD-001 (first message, FIFO order)
   This message is now LOCKED (30 seconds)
   
6. Click "Complete" to acknowledge
   Message is removed from queue permanently.
   
7. Check queue: Active messages = 2 (one was completed)
```

### Step 5: Receive Modes Explained

```
┌──────────────────────────────────────────────────────────────┐
│  RECEIVE MODES                                                │
│                                                               │
│  1. Peek-Lock (default, recommended):                        │
│     ├─ Receive message → Message is LOCKED                   │
│     ├─ Process the message                                   │
│     ├─ Complete → Message removed from queue ✅              │
│     ├─ Abandon → Message unlocked, available again           │
│     └─ If lock expires → Message available again             │
│                                                               │
│     Safe! If processing fails, message isn't lost.           │
│                                                               │
│  2. Receive and Delete:                                      │
│     ├─ Receive message → Message IMMEDIATELY deleted         │
│     ├─ Process the message                                   │
│     └─ If processing fails → Message is GONE! ❌             │
│                                                               │
│     Fast but risky! Use only when losing messages is OK.     │
│                                                               │
│  Best practice: Always use Peek-Lock!                        │
└──────────────────────────────────────────────────────────────┘
```

### Step 6: Test, Check, and Confirm

**Test 1: Verify Queue Created**

```
1. Namespace → Queues
   ✅ order-queue exists
   ✅ Status: Active
```

**Test 2: Verify Messages Sent**

```
1. order-queue → Overview
   ✅ Active messages: 2 (after receiving 1)
```

**Test 3: Verify Peek Works**

```
1. Service Bus Explorer → Peek
   ✅ Can see messages without removing them
   ✅ Messages still in queue after peek
```

**Test 4: Verify Receive and Complete**

```
1. Receive a message → Complete
   ✅ Message removed from queue
   ✅ Active count decreased by 1
```

**✅ Result**: Queue messaging working via Portal!

---

## Lab 3: Queues with Code (Python)

### What We'll Do

```
Send and receive messages using Python code.
This is how real applications use Service Bus.
```

### Step 1: Install the SDK

```bash
pip install azure-servicebus
```

### Step 2: Send Messages (Python)

Create file: `send_messages.py`

```python
from azure.servicebus import ServiceBusClient, ServiceBusMessage
import json

# Replace with YOUR connection string
CONNECTION_STR = "Endpoint=sb://sb-day31-demo.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=YOUR_KEY"
QUEUE_NAME = "order-queue"

def send_orders():
    """Send order messages to the queue"""
    
    orders = [
        {"orderId": "ORD-101", "customer": "Dave", "product": "Monitor", "amount": 349.99},
        {"orderId": "ORD-102", "customer": "Eve", "product": "Keyboard", "amount": 129.99},
        {"orderId": "ORD-103", "customer": "Frank", "product": "Mouse", "amount": 79.99},
        {"orderId": "ORD-104", "customer": "Grace", "product": "Headset", "amount": 199.99},
        {"orderId": "ORD-105", "customer": "Henry", "product": "Webcam", "amount": 89.99},
    ]
    
    # Create Service Bus client
    client = ServiceBusClient.from_connection_string(CONNECTION_STR)
    
    with client:
        # Get a sender for the queue
        sender = client.get_queue_sender(queue_name=QUEUE_NAME)
        
        with sender:
            for order in orders:
                # Create message
                message = ServiceBusMessage(
                    body=json.dumps(order),
                    content_type="application/json",
                    subject=f"order-{order['orderId']}",
                    application_properties={
                        "orderType": "product",
                        "priority": "normal"
                    }
                )
                
                # Send message
                sender.send_messages(message)
                print(f"✅ Sent: {order['orderId']} - {order['customer']} - ${order['amount']}")
    
    print(f"\n📨 Total {len(orders)} messages sent to '{QUEUE_NAME}'")

if __name__ == "__main__":
    send_orders()
```

```bash
# Run it
python send_messages.py

# Expected output:
# ✅ Sent: ORD-101 - Dave - $349.99
# ✅ Sent: ORD-102 - Eve - $129.99
# ✅ Sent: ORD-103 - Frank - $79.99
# ✅ Sent: ORD-104 - Grace - $199.99
# ✅ Sent: ORD-105 - Henry - $89.99
# 📨 Total 5 messages sent to 'order-queue'
```

### Step 3: Receive Messages (Python)

Create file: `receive_messages.py`

```python
from azure.servicebus import ServiceBusClient
import json

CONNECTION_STR = "Endpoint=sb://sb-day31-demo.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=YOUR_KEY"
QUEUE_NAME = "order-queue"

def process_orders():
    """Receive and process order messages from the queue"""
    
    client = ServiceBusClient.from_connection_string(CONNECTION_STR)
    
    with client:
        # Get a receiver for the queue
        receiver = client.get_queue_receiver(
            queue_name=QUEUE_NAME,
            max_wait_time=5  # Wait 5 seconds for messages
        )
        
        with receiver:
            print(f"🔄 Listening on '{QUEUE_NAME}'...\n")
            
            # Receive messages
            messages = receiver.receive_messages(
                max_message_count=10,
                max_wait_time=5
            )
            
            if not messages:
                print("📭 No messages in queue")
                return
            
            for msg in messages:
                # Parse message body
                body = json.loads(str(msg))
                
                print(f"📦 Processing: {body['orderId']}")
                print(f"   Customer: {body['customer']}")
                print(f"   Product: {body['product']}")
                print(f"   Amount: ${body['amount']}")
                
                # Simulate processing
                # In real app: charge payment, update inventory, etc.
                
                # Complete the message (remove from queue)
                receiver.complete_message(msg)
                print(f"   ✅ Completed!\n")
            
            print(f"📊 Processed {len(messages)} messages")

if __name__ == "__main__":
    process_orders()
```

```bash
# Run it
python receive_messages.py

# Expected output:
# 🔄 Listening on 'order-queue'...
#
# 📦 Processing: ORD-101
#    Customer: Dave
#    Product: Monitor
#    Amount: $349.99
#    ✅ Completed!
#
# 📦 Processing: ORD-102
#    Customer: Eve
#    ...
# 📊 Processed 5 messages
```

### Step 4: Verify Queue is Empty

```
1. Go to order-queue → Overview
2. Active messages: 0
   ✅ All messages received and completed!
```

### Step 5: Test, Check, and Confirm - Code

**Test 1: Send Messages**

```
Run send_messages.py
✅ 5 messages sent
✅ Check Portal: Active messages = 5 (or more)
```

**Test 2: Receive Messages**

```
Run receive_messages.py
✅ All messages received and processed
✅ Check Portal: Active messages = 0
```

**Test 3: Send Again, Receive Again**

```
Run send_messages.py → 5 messages sent
Run receive_messages.py → 5 messages received
✅ Repeatable! Queue works as expected.
```

**✅ Result**: Queue messaging with code working!

---

## Lab 4: Topics and Subscriptions

### What We'll Do

```
Create a Topic with 3 Subscriptions.
One message sent to the topic → 3 copies delivered!

                    ┌─ [email-sub] ───→ Email Service
Sender ───→ Topic ──┤
  "New              ├─ [sms-sub] ────→ SMS Service
   Order"           │
                    └─ [audit-sub] ──→ Audit Service

Each service gets its own copy of the message.
```

### Step 1: Create a Topic

```
1. Go to namespace: sb-day31-demo
2. Left menu → "Topics"
3. Click "+ Topic"
4. Fill in:
   - Name: order-notifications
   - Max topic size: 1 GB
   - Message time to live: 14 days
   - Enable duplicate detection: No
5. Click "Create"
```

### Step 2: Create Subscriptions

```
1. Click on topic: order-notifications
2. Left menu → "Subscriptions"
3. Click "+ Subscription"

   Subscription 1:
   - Name: email-sub
   - Max delivery count: 10
   - Lock duration: 30 seconds
   - Enable dead lettering on message expiration: Yes
   - Click "Create"

   Subscription 2:
   - Name: sms-sub
   - Max delivery count: 5
   - Lock duration: 30 seconds
   - Enable dead lettering on message expiration: Yes
   - Click "Create"

   Subscription 3:
   - Name: audit-sub
   - Max delivery count: 10
   - Lock duration: 30 seconds
   - Enable dead lettering on message expiration: Yes
   - Click "Create"
```

**Max delivery count:**
```
How many times Service Bus tries to deliver a message.
If a receiver fails to process after X attempts,
the message goes to the dead-letter queue.

email-sub: 10 attempts (important, retry more)
sms-sub: 5 attempts (less critical)
audit-sub: 10 attempts (important for compliance)
```

### Step 3: Send Message to Topic (Portal)

```
1. Go to topic: order-notifications
2. Left menu → "Service Bus Explorer"
3. Send a message:

{
  "orderId": "ORD-201",
  "customer": "Alice",
  "product": "Laptop",
  "amount": 1299.99,
  "event": "order_placed",
  "timestamp": "2026-03-28T14:00:00Z"
}

4. Click "Send"
```

### Step 4: Check All Subscriptions Received

```
1. Go to topic → Subscriptions
2. Check each subscription:

   email-sub: Active messages = 1 ✅
   sms-sub: Active messages = 1 ✅
   audit-sub: Active messages = 1 ✅

   ONE message sent → THREE copies delivered!
   Each subscription has its own independent copy.
```

### Step 5: Receive from Each Subscription (Portal)

```
1. Click email-sub → Service Bus Explorer
2. Peek → You see the order message
3. Receive → Complete
   email-sub: Active messages = 0

4. Click sms-sub → Service Bus Explorer
5. Peek → Same message (independent copy!)
6. Receive → Complete
   sms-sub: Active messages = 0

7. Click audit-sub → Service Bus Explorer
8. Peek → Same message (independent copy!)
9. Receive → Complete
   audit-sub: Active messages = 0

✅ Each subscription processed independently!
```

### Step 6: Send and Receive with Code

Create file: `topic_demo.py`

```python
from azure.servicebus import ServiceBusClient, ServiceBusMessage
import json

CONNECTION_STR = "Endpoint=sb://sb-day31-demo.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=YOUR_KEY"
TOPIC_NAME = "order-notifications"

def send_to_topic():
    """Send a message to the topic"""
    client = ServiceBusClient.from_connection_string(CONNECTION_STR)
    
    with client:
        sender = client.get_topic_sender(topic_name=TOPIC_NAME)
        with sender:
            order = {
                "orderId": "ORD-301",
                "customer": "Bob",
                "product": "Phone",
                "amount": 899.99,
                "event": "order_placed"
            }
            message = ServiceBusMessage(
                body=json.dumps(order),
                content_type="application/json"
            )
            sender.send_messages(message)
            print(f"✅ Sent to topic: {order['orderId']}")

def receive_from_subscription(sub_name):
    """Receive messages from a subscription"""
    client = ServiceBusClient.from_connection_string(CONNECTION_STR)
    
    with client:
        receiver = client.get_subscription_receiver(
            topic_name=TOPIC_NAME,
            subscription_name=sub_name,
            max_wait_time=5
        )
        with receiver:
            messages = receiver.receive_messages(max_message_count=10, max_wait_time=5)
            for msg in messages:
                body = json.loads(str(msg))
                print(f"  📬 [{sub_name}] Received: {body['orderId']} - {body['customer']}")
                receiver.complete_message(msg)

if __name__ == "__main__":
    # Send one message
    send_to_topic()
    
    print("\n📨 Receiving from all subscriptions:")
    # Each subscription gets its own copy!
    receive_from_subscription("email-sub")
    receive_from_subscription("sms-sub")
    receive_from_subscription("audit-sub")
```

```bash
python topic_demo.py

# Output:
# ✅ Sent to topic: ORD-301
#
# 📨 Receiving from all subscriptions:
#   📬 [email-sub] Received: ORD-301 - Bob
#   📬 [sms-sub] Received: ORD-301 - Bob
#   📬 [audit-sub] Received: ORD-301 - Bob
```

### Step 7: Test, Check, and Confirm - Topics

**Test 1: Verify Topic**

```
1. Namespace → Topics
   ✅ order-notifications exists
```

**Test 2: Verify Subscriptions**

```
1. Topic → Subscriptions
   ✅ email-sub, sms-sub, audit-sub exist
```

**Test 3: Verify Fan-Out**

```
1. Send 1 message to topic
2. Check all 3 subscriptions
   ✅ Each has 1 message (3 copies from 1 send)
```

**Test 4: Verify Independent Processing**

```
1. Complete message in email-sub
2. Check sms-sub and audit-sub
   ✅ Still have their messages (independent!)
```

**✅ Result**: Topics and subscriptions working!

---

## Lab 5: Topic Filters (Route Messages)

### What are Filters?

```
Filters = Rules that decide WHICH messages a subscription receives

Without filters:
  Every subscription gets EVERY message.

With filters:
  Subscriptions only get messages that match their filter.

┌──────────────────────────────────────────────────────────────┐
│  TOPIC FILTERS                                                │
│                                                               │
│  Topic: order-notifications                                  │
│                                                               │
│  Message: { "type": "email", "priority": "high" }           │
│                                                               │
│  email-sub (filter: type = 'email')     → ✅ Gets it!       │
│  sms-sub (filter: type = 'sms')         → ❌ Filtered out   │
│  audit-sub (filter: priority = 'high')  → ✅ Gets it!       │
│                                                               │
│  Only matching subscriptions receive the message!            │
└──────────────────────────────────────────────────────────────┘
```

### Filter Types

```
1. SQL Filter (most flexible):
   "priority = 'high' AND amount > 1000"
   Uses SQL-like syntax on message properties.

2. Correlation Filter (fastest):
   Match on specific properties like Subject, ContentType,
   or custom properties. Exact match only.

3. Boolean Filter:
   True = receive all messages (default)
   False = receive no messages
```

### Step 1: Create a New Topic with Filtered Subscriptions

```
1. Namespace → Topics → "+ Topic"
   - Name: order-events
   - Click "Create"

2. Click order-events → Subscriptions

   Subscription 1: high-value-orders
   - Name: high-value-orders
   - Click "Create"
   - Click on high-value-orders → "Filters" (left menu)
   - Delete the default "$Default" rule (True filter)
   - Click "+ Add filter"
     - Name: high-value-filter
     - Filter type: SQL Filter
     - SQL Expression: amount > 500
     - Click "Save"

   Subscription 2: low-value-orders
   - Name: low-value-orders
   - Click "Create"
   - Click on low-value-orders → Filters
   - Delete the default "$Default" rule
   - Click "+ Add filter"
     - Name: low-value-filter
     - Filter type: SQL Filter
     - SQL Expression: amount <= 500
     - Click "Save"

   Subscription 3: all-orders
   - Name: all-orders
   - Click "Create"
   - (Keep default True filter - receives everything)
```

### Step 2: Send Messages with Properties

```
Using Service Bus Explorer on the topic:

Message 1 (high value):
  Body: {"orderId": "ORD-401", "customer": "Alice", "product": "Laptop"}
  Custom Properties: Click "Add property"
    - Key: amount    Value: 1299  Type: long
  Click "Send"

Message 2 (low value):
  Body: {"orderId": "ORD-402", "customer": "Bob", "product": "Mouse"}
  Custom Properties:
    - Key: amount    Value: 79  Type: long
  Click "Send"

Message 3 (high value):
  Body: {"orderId": "ORD-403", "customer": "Carol", "product": "Monitor"}
  Custom Properties:
    - Key: amount    Value: 599  Type: long
  Click "Send"
```

### Step 3: Check Filtered Results

```
1. high-value-orders → Overview:
   Active messages: 2 (ORD-401 $1299, ORD-403 $599)
   ✅ Only orders > $500!

2. low-value-orders → Overview:
   Active messages: 1 (ORD-402 $79)
   ✅ Only orders <= $500!

3. all-orders → Overview:
   Active messages: 3 (all orders)
   ✅ Gets everything!

Filters routed messages to the right subscriptions!
```

### Step 4: Test, Check, and Confirm - Filters

**Test 1: Verify Filter Routing**

```
✅ high-value-orders: 2 messages (> $500)
✅ low-value-orders: 1 message (<= $500)
✅ all-orders: 3 messages (all)
```

**Test 2: Peek Messages**

```
1. high-value-orders → Service Bus Explorer → Peek
   ✅ Only ORD-401 and ORD-403 (high value)

2. low-value-orders → Service Bus Explorer → Peek
   ✅ Only ORD-402 (low value)
```

**✅ Result**: Topic filters routing messages correctly!

---

## Lab 6: Dead-Letter Queue

### What is Dead-Letter Queue (DLQ)?

```
Dead-Letter Queue = Where "failed" messages go

┌──────────────────────────────────────────────────────────────┐
│  DEAD-LETTER QUEUE                                            │
│                                                               │
│  Normal flow:                                                │
│  Sender → Queue → Receiver → Complete ✅                     │
│                                                               │
│  Failed flow:                                                │
│  Sender → Queue → Receiver → Fails! → Retry → Fails again! │
│                → After max retries → Dead-Letter Queue       │
│                                                               │
│  Messages go to DLQ when:                                    │
│  ├─ Max delivery count exceeded (too many failures)          │
│  ├─ Message TTL expired (nobody read it in time)             │
│  ├─ Filter evaluation fails                                  │
│  └─ Explicitly dead-lettered by receiver code                │
│                                                               │
│  DLQ is like a "problem inbox":                              │
│  "These messages couldn't be processed. Please investigate." │
└──────────────────────────────────────────────────────────────┘
```

### Step 1: Create a Queue with Low Max Delivery Count

```
1. Namespace → Queues → "+ Queue"
   - Name: dlq-test-queue
   - Max delivery count: 3 (low, for testing)
   - Enable dead lettering on message expiration: Yes
   - Click "Create"
```

### Step 2: Send a Message

```
1. dlq-test-queue → Service Bus Explorer
2. Send:
{
  "orderId": "ORD-DLQ-001",
  "customer": "Test",
  "note": "This message will be dead-lettered"
}
```

### Step 3: Simulate Failures (Abandon Message 3 Times)

```
1. Service Bus Explorer → Receive messages
2. Receive mode: Peek-Lock
3. Receive the message
4. Click "Abandon" (instead of Complete)
   → Message goes back to queue (delivery count: 1)

5. Receive again → Abandon again (delivery count: 2)
6. Receive again → Abandon again (delivery count: 3)

After 3 abandons (= max delivery count):
  Message automatically moves to Dead-Letter Queue!
```

### Step 4: Check Dead-Letter Queue

```
1. dlq-test-queue → Overview
   - Active messages: 0 (moved out!)
   - Dead-letter messages: 1 ← HERE!

2. Service Bus Explorer → Switch to "Dead-letter" sub-queue
   (There's a dropdown to switch between active and dead-letter)
3. Peek → You see the failed message!
   
   The message has extra properties:
   - DeadLetterReason: MaxDeliveryCountExceeded
   - DeadLetterErrorDescription: Message could not be consumed...
```

### Step 5: Process Dead-Letter Messages

```
In real applications, you would:
1. Read messages from DLQ
2. Investigate why they failed
3. Fix the issue
4. Re-send to the original queue
5. Or log and discard

Via Portal:
1. Service Bus Explorer → Dead-letter queue
2. Receive the message
3. Complete it (removes from DLQ)
```

### Step 6: Test, Check, and Confirm - DLQ

**Test 1: Verify Message in DLQ**

```
1. dlq-test-queue → Overview
   ✅ Active messages: 0
   ✅ Dead-letter messages: 1
```

**Test 2: Verify DLQ Reason**

```
1. Service Bus Explorer → Dead-letter → Peek
   ✅ DeadLetterReason: MaxDeliveryCountExceeded
   ✅ Original message body intact
```

**Test 3: Process DLQ Message**

```
1. Receive from DLQ → Complete
   ✅ Dead-letter messages: 0
   ✅ Message processed and removed
```

**✅ Result**: Dead-letter queue working!

---

## Lab 7: Advanced Features

### Feature 1: Scheduled Messages

```
Send a message now, but it's only available at a future time.

Use case: "Send reminder email at 9 AM tomorrow"
```

**Via Portal:**

```
1. order-queue → Service Bus Explorer
2. Send message:
   Body: {"reminder": "Follow up with customer", "orderId": "ORD-500"}
3. Before clicking Send:
   - Click "Advanced" or look for "Schedule" option
   - Set "Scheduled enqueue time" to 5 minutes from now
4. Click "Send"

5. Check queue:
   - Active messages: 0 (not available yet!)
   - Scheduled messages: 1 ← Waiting!

6. Wait 5 minutes...
   - Active messages: 1 (now available!)
   - Scheduled messages: 0
```

**Via Code:**

```python
from azure.servicebus import ServiceBusClient, ServiceBusMessage
from datetime import datetime, timedelta, timezone

CONNECTION_STR = "YOUR_CONNECTION_STRING"

client = ServiceBusClient.from_connection_string(CONNECTION_STR)
with client:
    sender = client.get_queue_sender(queue_name="order-queue")
    with sender:
        # Schedule message for 5 minutes from now
        scheduled_time = datetime.now(timezone.utc) + timedelta(minutes=5)
        
        message = ServiceBusMessage("Scheduled reminder!")
        
        # Schedule it
        sequence_number = sender.schedule_messages(message, scheduled_time)
        print(f"✅ Scheduled for {scheduled_time}")
        print(f"   Sequence number: {sequence_number}")
        
        # Can cancel with: sender.cancel_scheduled_messages(sequence_number)
```

### Feature 2: Message Sessions (Ordered Groups)

```
Sessions = Group related messages and process them in order

Without sessions:
  Messages from different orders can be mixed up.
  Order A msg1, Order B msg1, Order A msg2, Order B msg2...

With sessions:
  Group by session ID (e.g., order ID).
  Process all messages for one order together, in order.

┌──────────────────────────────────────────────────────────────┐
│  SESSIONS                                                     │
│                                                               │
│  Queue with sessions enabled:                                │
│                                                               │
│  Session "ORD-001": [msg1] → [msg2] → [msg3]               │
│  Session "ORD-002": [msg1] → [msg2]                         │
│  Session "ORD-003": [msg1] → [msg2] → [msg3] → [msg4]      │
│                                                               │
│  Receiver locks a SESSION (not just a message).              │
│  Processes all messages in that session in order.            │
│  Then moves to next session.                                 │
└──────────────────────────────────────────────────────────────┘

To use sessions:
  1. Create queue with "Enable sessions" = Yes
  2. Set SessionId on each message
  3. Receiver uses session receiver
```

### Feature 3: Message Properties

```
Messages can have custom properties (metadata):

┌──────────────────────────────────────────────────────────────┐
│  MESSAGE STRUCTURE                                            │
│                                                               │
│  System Properties (set by Service Bus):                     │
│  ├─ MessageId: Unique ID                                     │
│  ├─ SequenceNumber: Order in queue                           │
│  ├─ EnqueuedTimeUtc: When it was sent                        │
│  ├─ DeliveryCount: How many times delivered                  │
│  └─ ExpiresAtUtc: When it expires                            │
│                                                               │
│  User Properties (set by you):                               │
│  ├─ Subject: "order-placed"                                  │
│  ├─ ContentType: "application/json"                          │
│  ├─ CorrelationId: "session-123"                             │
│  └─ Custom: priority="high", region="us-east"               │
│                                                               │
│  Body:                                                       │
│  The actual message content (JSON, XML, text, binary)        │
└──────────────────────────────────────────────────────────────┘
```

### Step 1: Test, Check, and Confirm - Advanced

**Test 1: Scheduled Messages**

```
1. Send scheduled message (5 min future)
   ✅ Scheduled count: 1, Active count: 0
2. Wait 5 minutes
   ✅ Scheduled count: 0, Active count: 1
```

**Test 2: Message Properties**

```
1. Send message with custom properties
2. Peek message
   ✅ Custom properties visible
   ✅ System properties (MessageId, SequenceNumber) present
```

**✅ Result**: Advanced features explored!

---

## Complete Summary

```
┌─────────────────────────────────────────────────────────────────┐
│  DAY 31 - AZURE SERVICE BUS COMPLETE                             │
│                                                                  │
│  Namespace: sb-day31-demo (Standard tier)                       │
│                                                                  │
│  Queues:                                                        │
│  ├─ order-queue (send/receive via Portal and Python)            │
│  └─ dlq-test-queue (dead-letter queue testing)                  │
│                                                                  │
│  Topics:                                                        │
│  ├─ order-notifications                                         │
│  │   ├─ email-sub (all messages)                                │
│  │   ├─ sms-sub (all messages)                                  │
│  │   └─ audit-sub (all messages)                                │
│  └─ order-events                                                │
│      ├─ high-value-orders (SQL filter: amount > 500)            │
│      ├─ low-value-orders (SQL filter: amount <= 500)            │
│      └─ all-orders (default: all messages)                      │
│                                                                  │
│  Key Learnings:                                                 │
│  ├─ Queue = one sender → one receiver                           │
│  ├─ Topic = one sender → many receivers                         │
│  ├─ Filters route messages to right subscriptions               │
│  ├─ Dead-letter queue catches failed messages                   │
│  ├─ Peek-Lock = safe receive (recommended)                     │
│  ├─ Scheduled messages for future delivery                      │
│  └─ Sessions for ordered message groups                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Cleanup

### Delete All Resources

```
1. Delete Resource Group:
   - Resource groups → rg-day31-servicebus
   - Click "Delete resource group"
   - Type name to confirm → Delete

This deletes the namespace and all queues/topics inside it.
```

**⏱️ Wait**: 2-5 minutes

**✅ Result**: All resources deleted!

---

## Quick Reference

### Service Bus Concepts

```
Namespace → Container for queues and topics
Queue     → Point-to-point (1 sender → 1 receiver)
Topic     → Publish-subscribe (1 sender → many receivers)
Subscription → A receiver's "mailbox" on a topic
Filter    → Rules that route messages to subscriptions
Dead-letter → Where failed/expired messages go
Session   → Group related messages for ordered processing
```

### Python SDK Quick Reference

```python
# Install
pip install azure-servicebus

# Send to Queue
sender = client.get_queue_sender(queue_name="my-queue")
sender.send_messages(ServiceBusMessage("hello"))

# Receive from Queue
receiver = client.get_queue_receiver(queue_name="my-queue")
messages = receiver.receive_messages(max_message_count=10)
for msg in messages:
    receiver.complete_message(msg)  # or .abandon_message(msg)

# Send to Topic
sender = client.get_topic_sender(topic_name="my-topic")
sender.send_messages(ServiceBusMessage("hello"))

# Receive from Subscription
receiver = client.get_subscription_receiver(
    topic_name="my-topic", subscription_name="my-sub")
```

### Useful Links

- [Service Bus Documentation](https://learn.microsoft.com/azure/service-bus-messaging/)
- [Service Bus Python SDK](https://learn.microsoft.com/azure/service-bus-messaging/service-bus-python-how-to-use-queues)
- [Service Bus Pricing](https://azure.microsoft.com/pricing/details/service-bus/)
- [Service Bus Quotas](https://learn.microsoft.com/azure/service-bus-messaging/service-bus-quotas)
- [Dead-Letter Queues](https://learn.microsoft.com/azure/service-bus-messaging/service-bus-dead-letter-queues)

---

**🎉 Congratulations!** You've completed Day 31 covering Azure Service Bus with Queues, Topics, Subscriptions, Filters, and Dead-Letter Queues!