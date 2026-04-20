# Day 39: Kafka on Azure (Event Hubs) - Complete Guide

## What You'll Learn

Stream data with Kafka on Azure:
- ✅ What is Kafka and why use it
- ✅ Kafka vs Service Bus vs Event Hubs
- ✅ Azure Event Hubs with Kafka protocol (managed Kafka)
- ✅ Create Event Hubs namespace (Kafka-enabled)
- ✅ Produce and consume messages (Portal + Python)
- ✅ Consumer Groups (multiple readers)
- ✅ Partitions (parallel processing)
- ✅ Real-world streaming patterns
- ✅ Complete test, check, and confirm

## Table of Contents

1. [What is Kafka?](#what-is-kafka)
2. [Why Kafka on Azure?](#why-kafka-on-azure)
3. [Kafka vs Service Bus vs Event Hubs](#kafka-vs-service-bus-vs-event-hubs)
4. [Lab 1: Create Event Hubs Namespace (Kafka-Enabled)](#lab-1-create-event-hubs-namespace-kafka-enabled)
5. [Lab 2: Create Event Hub (Kafka Topic)](#lab-2-create-event-hub-kafka-topic)
6. [Lab 3: Send Events via Portal](#lab-3-send-events-via-portal)
7. [Lab 4: Produce Messages with Python (Kafka Protocol)](#lab-4-produce-messages-with-python-kafka-protocol)
8. [Lab 5: Consume Messages with Python (Kafka Protocol)](#lab-5-consume-messages-with-python-kafka-protocol)
9. [Lab 6: Consumer Groups (Multiple Readers)](#lab-6-consumer-groups-multiple-readers)
10. [Lab 7: Partitions and Parallel Processing](#lab-7-partitions-and-parallel-processing)
11. [Cleanup](#cleanup)

---

## What is Kafka?

**Apache Kafka** = A distributed streaming platform for real-time data pipelines.

### Simple Explanation

```
Think of Kafka like a NEWSPAPER PRINTING PRESS:

📰 Newspaper:
  Writers (producers) write articles
  Press (Kafka) prints and distributes
  Readers (consumers) read at their own pace
  Old newspapers are kept for a while (retention)
  Multiple readers can read the same newspaper

☁️ Kafka:
  Apps (producers) send events/messages
  Kafka stores and distributes them
  Apps (consumers) read at their own pace
  Old messages kept for configured time (retention)
  Multiple consumers can read the same messages

Key difference from a Queue:
  Queue: Message read once, then GONE
  Kafka: Message read by MANY consumers, stays for retention period
```

### Kafka Concepts

```
┌─────────────────────────────────────────────────────────────────┐
│  KAFKA CONCEPTS                                                  │
│                                                                  │
│  1. TOPIC (= Event Hub in Azure)                                │
│     A named stream of messages                                  │
│     Like a "channel" or "category"                              │
│     Example: "orders", "user-events", "logs"                    │
│                                                                  │
│  2. PRODUCER                                                    │
│     App that SENDS messages to a topic                          │
│     Example: Order service sends "new order" events             │
│                                                                  │
│  3. CONSUMER                                                    │
│     App that READS messages from a topic                        │
│     Example: Analytics service reads order events               │
│                                                                  │
│  4. CONSUMER GROUP                                              │
│     A group of consumers that share the work                    │
│     Each message goes to ONE consumer in the group              │
│     Different groups each get ALL messages                      │
│                                                                  │
│  5. PARTITION                                                   │
│     A topic is split into partitions for parallelism            │
│     Like lanes on a highway (more lanes = more throughput)      │
│     Messages in a partition are ordered                         │
│                                                                  │
│  6. OFFSET                                                      │
│     Position of a consumer in a partition                       │
│     Like a bookmark: "I've read up to message #42"              │
│                                                                  │
│  7. RETENTION                                                   │
│     How long messages are kept (1-7 days default)               │
│     Unlike queues, messages are NOT deleted after reading       │
└─────────────────────────────────────────────────────────────────┘
```

### Visual

```
┌──────────────────────────────────────────────────────────────────┐
│  KAFKA FLOW                                                       │
│                                                                   │
│  Producers:                    Topic: "orders"                   │
│  ┌──────────┐                 ┌─────────────────────┐            │
│  │ Order    │──send──→       │ Partition 0:         │            │
│  │ Service  │                │ [msg1][msg2][msg3]   │            │
│  └──────────┘                │                      │            │
│  ┌──────────┐                │ Partition 1:         │            │
│  │ Payment  │──send──→       │ [msg4][msg5][msg6]   │            │
│  │ Service  │                └──────────┬───────────┘            │
│  └──────────┘                           │                        │
│                                         │ read                   │
│                              ┌──────────┴───────────┐            │
│  Consumers:                  │                       │            │
│  ┌──────────┐               ┌──────────┐  ┌──────────┐          │
│  │Analytics │←──read────────│Consumer  │  │Consumer  │          │
│  │ Group A  │               │Group A-1 │  │Group A-2 │          │
│  └──────────┘               └──────────┘  └──────────┘          │
│  ┌──────────┐                                                    │
│  │ Email    │←──read──── (gets ALL messages too, independently) │
│  │ Group B  │                                                    │
│  └──────────┘                                                    │
│                                                                   │
│  Group A: 2 consumers share partitions (parallel processing)    │
│  Group B: Gets its own copy of ALL messages (independent)       │
└──────────────────────────────────────────────────────────────────┘
```

---

## Why Kafka on Azure?

```
┌──────────────────────────────────────────────────────────────┐
│  KAFKA ON AZURE: TWO OPTIONS                                  │
│                                                               │
│  Option 1: Self-Managed Kafka on VMs/AKS                     │
│  ├─ Install Apache Kafka yourself                            │
│  ├─ Manage ZooKeeper, brokers, storage                       │
│  ├─ Handle scaling, patching, monitoring                     │
│  ├─ Full control but HIGH operational burden                 │
│  └─ ❌ Not recommended unless you need specific features    │
│                                                               │
│  Option 2: Azure Event Hubs with Kafka Protocol ✅           │
│  ├─ Fully managed by Microsoft                               │
│  ├─ Kafka-compatible API (use Kafka clients!)               │
│  ├─ No ZooKeeper, no brokers to manage                      │
│  ├─ Auto-scaling, built-in monitoring                        │
│  ├─ 99.99% SLA                                              │
│  └─ ✅ RECOMMENDED for most use cases                       │
│                                                               │
│  Event Hubs speaks Kafka protocol!                           │
│  Your Kafka code works with Event Hubs without changes.     │
│  Just change the connection string.                          │
└──────────────────────────────────────────────────────────────┘
```

### Real-World Use Cases

```
1. Real-Time Analytics:
   Website clicks → Kafka → Analytics dashboard
   Millions of events per second

2. Log Aggregation:
   100 servers → Kafka → Centralized log storage
   All logs in one place

3. Event-Driven Architecture:
   Order placed → Kafka → Payment, Inventory, Email, Analytics
   Each service processes independently

4. IoT Data Streaming:
   10,000 sensors → Kafka → Processing → Storage
   Continuous data flow

5. Change Data Capture (CDC):
   Database changes → Kafka → Data warehouse
   Keep systems in sync
```

---

## Kafka vs Service Bus vs Event Hubs

```
┌──────────────────┬──────────────────┬──────────────────┬──────────────────┐
│                   │  Kafka/Event Hubs│  Service Bus     │  Event Grid      │
├──────────────────┼──────────────────┼──────────────────┼──────────────────┤
│  Pattern          │  Event streaming │  Message queue   │  Event routing   │
│  Delivery         │  At-least-once   │  At-least-once   │  At-least-once   │
│                   │                  │  or exactly-once │                  │
│  Retention        │  1-90 days       │  Until consumed  │  24 hours        │
│  Replay           │  ✅ Yes (reread) │  ❌ No           │  ❌ No           │
│  Ordering         │  Per partition   │  FIFO (sessions) │  No ordering     │
│  Throughput       │  Millions/sec    │  Thousands/sec   │  Millions/sec    │
│  Consumer groups  │  ✅ Multiple     │  ❌ One reader   │  ✅ Multiple     │
│  Protocol         │  Kafka, AMQP    │  AMQP, HTTP      │  HTTP webhook    │
│  Best for         │  High-volume     │  Business msgs   │  React to events │
│                   │  streaming       │  guaranteed      │  (blob created)  │
│  Cost             │  $$              │  $$              │  $               │
└──────────────────┴──────────────────┴──────────────────┴──────────────────┘

💡 Rule of thumb:
   High-volume streaming, replay needed → Kafka / Event Hubs
   Business messages, guaranteed delivery → Service Bus
   React to Azure events → Event Grid
```

---

## Lab 1: Create Event Hubs Namespace (Kafka-Enabled)

### What is an Event Hubs Namespace?

```
Namespace = Container for Event Hubs (like Kafka cluster)
Event Hub = A topic (like Kafka topic)

Namespace: eh-day39-kafka
├─ Event Hub: orders (topic)
├─ Event Hub: user-events (topic)
└─ Event Hub: logs (topic)

Kafka protocol is enabled on Standard tier and above.
```

### Step 1: Create Resource Group

```
1. Azure Portal → Search "Resource groups" → "+ Create"
2. Name: rg-day39-kafka
3. Region: East US
4. Click "Review + create" → "Create"
```

### Step 2: Create Event Hubs Namespace

```
1. Search "Event Hubs" in Azure Portal
2. Click "+ Create"
3. Fill in:
   - Subscription: Your subscription
   - Resource group: rg-day39-kafka
   - Namespace name: eh-day39-kafka (must be globally unique)
   - Location: East US
   - Pricing tier: Standard ← MUST be Standard or above for Kafka!
     (Basic does NOT support Kafka protocol)
   - Throughput Units: 1 (auto-inflate: disabled for lab)
4. Click "Review + create" → "Create"
```

**⏱️ Wait**: 1-2 minutes

**Pricing tiers:**
```
┌──────────────────┬──────────────────┬──────────────────┐
│  Basic            │  Standard        │  Premium         │
├──────────────────┼──────────────────┼──────────────────┤
│  No Kafka!       │  ✅ Kafka support│  ✅ Kafka support│
│  1 consumer group│  20 consumer grps│  100 consumer grps│
│  1 day retention │  7 days retention│  90 days retention│
│  ~$11/month      │  ~$22/month      │  ~$700/month     │
│  Good for: test  │  Good for: prod  │  Good for: large │
└──────────────────┴──────────────────┴──────────────────┘
```

### Step 3: Get Connection String

```
1. Go to eh-day39-kafka
2. Left menu → "Shared access policies"
3. Click "RootManageSharedAccessKey"
4. Copy "Connection string–primary key"

   It looks like:
   Endpoint=sb://eh-day39-kafka.servicebus.windows.net/;
   SharedAccessKeyName=RootManageSharedAccessKey;
   SharedAccessKey=abc123...

   Save this! You'll need it for code labs.
```

### Step 4: Verify Kafka is Enabled

```
1. Go to eh-day39-kafka → Overview
2. Check:
   - Pricing tier: Standard (or above)
   - Kafka endpoint: eh-day39-kafka.servicebus.windows.net:9093
   
   ✅ Kafka protocol is automatically enabled on Standard tier!
   No extra configuration needed.
```

### Step 5: Test, Check, and Confirm

**Test 1: Namespace Created**

```
Event Hubs → eh-day39-kafka
  ✅ Status: Active
  ✅ Tier: Standard
  ✅ Location: East US
```

**Test 2: Connection String Available**

```
Shared access policies → RootManageSharedAccessKey
  ✅ Connection string available
  ✅ Permissions: Manage, Send, Listen
```

**Test 3: Kafka Endpoint**

```
✅ Kafka endpoint: eh-day39-kafka.servicebus.windows.net:9093
✅ Protocol: SASL_SSL
```

**✅ Result**: Kafka-enabled Event Hubs namespace ready!

---

## Lab 2: Create Event Hub (Kafka Topic)

### Step 1: Create Event Hub

```
1. Go to eh-day39-kafka
2. Left menu → "Event Hubs"
3. Click "+ Event Hub"
4. Fill in:
   - Name: orders
   - Partition count: 2 (for parallel processing)
   - Message retention: 1 day
   - Cleanup policy: Delete
5. Click "Create"
```

### Step 2: Create Second Event Hub

```
1. Click "+ Event Hub" again
2. Fill in:
   - Name: user-events
   - Partition count: 2
   - Message retention: 1 day
3. Click "Create"
```

### Step 3: Understand Partitions

```
┌──────────────────────────────────────────────────────────────┐
│  PARTITIONS EXPLAINED                                         │
│                                                               │
│  Topic: "orders" with 2 partitions                           │
│                                                               │
│  Partition 0: [order-1] [order-3] [order-5] [order-7]       │
│  Partition 1: [order-2] [order-4] [order-6] [order-8]       │
│                                                               │
│  Why partitions?                                             │
│  ├─ Parallelism: 2 consumers can read simultaneously        │
│  ├─ Throughput: More partitions = more throughput            │
│  ├─ Ordering: Messages in SAME partition are ordered         │
│  └─ Distribution: Messages spread across partitions          │
│                                                               │
│  How messages are distributed:                               │
│  ├─ With key: Same key → same partition (ordering!)         │
│  │   key="customer-123" always goes to partition 0           │
│  └─ Without key: Round-robin across partitions              │
└──────────────────────────────────────────────────────────────┘
```

### Step 4: Test, Check, and Confirm

**Test 1: Event Hubs Created**

```
eh-day39-kafka → Event Hubs
  ✅ orders (2 partitions, 1 day retention)
  ✅ user-events (2 partitions, 1 day retention)
```

**Test 2: Event Hub Details**

```
Click "orders":
  ✅ Partition count: 2
  ✅ Message retention: 1 day
  ✅ Consumer groups: $Default (auto-created)
```

**✅ Result**: Kafka topics (Event Hubs) created!

---

## Lab 3: Send Events via Portal

### Step 1: Send Test Events

```
1. Go to eh-day39-kafka → Event Hubs → orders
2. Left menu → "Generate data" (or "Send events" in some Portal versions)

   If "Generate data" is not available, skip to Lab 4
   (we'll use Python code instead)

3. If available:
   - Click "Send"
   - Event Hub sends sample events
   - Check "Process data" to see events arriving
```

### Step 2: View Metrics

```
1. Go to orders (Event Hub)
2. Left menu → "Overview"
3. Check metrics:
   - Incoming Messages: Shows count of messages sent
   - Outgoing Messages: Shows count of messages consumed
   - Incoming Bytes: Data volume

4. Or go to "Metrics" for detailed charts:
   - Metric: Incoming Messages
   - Aggregation: Sum
   - Time range: Last 1 hour
```

### Step 3: Test, Check, and Confirm

```
orders → Overview
  ✅ Metrics charts visible
  ✅ Incoming/Outgoing message counts shown
```

**✅ Result**: Event Hub metrics working!

---

## Lab 4: Produce Messages with Python (Kafka Protocol)

### Step 1: Install Kafka Python Library

```bash
pip install confluent-kafka
```

### Step 2: Create Kafka Producer

Create file: `kafka_producer.py`

```python
from confluent_kafka import Producer
import json
import time
import random

# ============================================
# CONFIGURATION
# ============================================
# Event Hubs Kafka endpoint
BOOTSTRAP_SERVERS = "eh-day39-kafka.servicebus.windows.net:9093"

# Connection string from Event Hubs
CONNECTION_STRING = "Endpoint=sb://eh-day39-kafka.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=YOUR_KEY_HERE"

# Extract the key from connection string
SASL_PASSWORD = CONNECTION_STRING

TOPIC = "orders"

# Kafka configuration for Azure Event Hubs
conf = {
    'bootstrap.servers': BOOTSTRAP_SERVERS,
    'security.protocol': 'SASL_SSL',
    'sasl.mechanism': 'PLAIN',
    'sasl.username': '$ConnectionString',
    'sasl.password': SASL_PASSWORD,
    'client.id': 'python-producer-day39',
}

# ============================================
# PRODUCER
# ============================================
def delivery_report(err, msg):
    """Callback for message delivery"""
    if err:
        print(f"  ❌ Delivery failed: {err}")
    else:
        print(f"  ✅ Delivered to partition {msg.partition()} offset {msg.offset()}")

def produce_orders():
    """Send order events to Kafka topic"""
    producer = Producer(conf)
    
    customers = ["Alice", "Bob", "Carol", "Dave", "Eve"]
    products = ["Laptop", "Phone", "Tablet", "Monitor", "Keyboard"]
    
    print(f"📤 Producing messages to topic: {TOPIC}\n")
    
    for i in range(10):
        order = {
            "orderId": f"ORD-{1000 + i}",
            "customer": random.choice(customers),
            "product": random.choice(products),
            "amount": round(random.uniform(50, 1500), 2),
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        }
        
        # Key determines partition (same customer → same partition → ordered)
        key = order["customer"]
        value = json.dumps(order)
        
        print(f"📦 Sending: {order['orderId']} - {order['customer']} - ${order['amount']}")
        
        producer.produce(
            topic=TOPIC,
            key=key,
            value=value,
            callback=delivery_report
        )
        
        # Trigger delivery callbacks
        producer.poll(0)
        time.sleep(0.5)
    
    # Wait for all messages to be delivered
    producer.flush()
    print(f"\n📊 Total: 10 messages produced to '{TOPIC}'")

if __name__ == "__main__":
    produce_orders()
```

### Step 3: Run the Producer

```bash
python kafka_producer.py

# Expected output:
# 📤 Producing messages to topic: orders
#
# 📦 Sending: ORD-1000 - Alice - $1234.56
#   ✅ Delivered to partition 0 offset 0
# 📦 Sending: ORD-1001 - Bob - $789.12
#   ✅ Delivered to partition 1 offset 0
# 📦 Sending: ORD-1002 - Carol - $456.78
#   ✅ Delivered to partition 0 offset 1
# ...
# 📊 Total: 10 messages produced to 'orders'
```

### Step 4: Verify in Portal

```
1. Go to eh-day39-kafka → Event Hubs → orders
2. Check Overview metrics:
   ✅ Incoming Messages: 10 (or more)
   ✅ Incoming Bytes: > 0
```

### Step 5: Test, Check, and Confirm

**Test 1: Producer Runs Without Errors**

```
python kafka_producer.py
  ✅ All 10 messages delivered
  ✅ Partition and offset shown for each
```

**Test 2: Portal Shows Messages**

```
orders → Overview
  ✅ Incoming Messages count increased
```

**✅ Result**: Kafka producer working!

---

## Lab 5: Consume Messages with Python (Kafka Protocol)

### Step 1: Create Kafka Consumer

Create file: `kafka_consumer.py`

```python
from confluent_kafka import Consumer, KafkaError
import json

# ============================================
# CONFIGURATION
# ============================================
BOOTSTRAP_SERVERS = "eh-day39-kafka.servicebus.windows.net:9093"
CONNECTION_STRING = "Endpoint=sb://eh-day39-kafka.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=YOUR_KEY_HERE"
SASL_PASSWORD = CONNECTION_STRING
TOPIC = "orders"

conf = {
    'bootstrap.servers': BOOTSTRAP_SERVERS,
    'security.protocol': 'SASL_SSL',
    'sasl.mechanism': 'PLAIN',
    'sasl.username': '$ConnectionString',
    'sasl.password': SASL_PASSWORD,
    'group.id': 'analytics-group',       # Consumer group name
    'auto.offset.reset': 'earliest',     # Start from beginning
    'client.id': 'python-consumer-day39',
}

# ============================================
# CONSUMER
# ============================================
def consume_orders():
    """Read order events from Kafka topic"""
    consumer = Consumer(conf)
    consumer.subscribe([TOPIC])
    
    print(f"📥 Consuming from topic: {TOPIC}")
    print(f"   Consumer group: analytics-group")
    print(f"   Waiting for messages...\n")
    
    message_count = 0
    total_amount = 0
    
    try:
        while True:
            msg = consumer.poll(timeout=5.0)
            
            if msg is None:
                if message_count > 0:
                    print(f"\n📊 Summary: {message_count} messages, Total: ${total_amount:.2f}")
                    print("   No more messages. Waiting... (Ctrl+C to stop)")
                continue
            
            if msg.error():
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    print(f"   Reached end of partition {msg.partition()}")
                    continue
                print(f"   ❌ Error: {msg.error()}")
                continue
            
            # Parse message
            order = json.loads(msg.value().decode('utf-8'))
            message_count += 1
            total_amount += order.get('amount', 0)
            
            print(f"📦 [{msg.partition()}:{msg.offset()}] "
                  f"{order['orderId']} - {order['customer']} - "
                  f"${order['amount']} - {order['product']}")
    
    except KeyboardInterrupt:
        print(f"\n\n📊 Final: {message_count} messages consumed, Total: ${total_amount:.2f}")
    finally:
        consumer.close()

if __name__ == "__main__":
    consume_orders()
```

### Step 2: Run the Consumer

```bash
python kafka_consumer.py

# Expected output:
# 📥 Consuming from topic: orders
#    Consumer group: analytics-group
#    Waiting for messages...
#
# 📦 [0:0] ORD-1000 - Alice - $1234.56 - Laptop
# 📦 [1:0] ORD-1001 - Bob - $789.12 - Phone
# 📦 [0:1] ORD-1002 - Carol - $456.78 - Tablet
# ...
#
# 📊 Summary: 10 messages, Total: $7890.12
#    No more messages. Waiting... (Ctrl+C to stop)
```

### Step 3: Run Producer and Consumer Together

```bash
# Terminal 1: Start consumer (waiting for messages)
python kafka_consumer.py

# Terminal 2: Send new messages
python kafka_producer.py

# Terminal 1 shows messages arriving in real-time!
# ✅ Real-time streaming working!
```

### Step 4: Verify Consumer Group Offset

```
1. Go to orders → Consumer groups
2. Click "$Default" or "analytics-group"
3. You'll see:
   - Partition 0: Offset X (how far consumer has read)
   - Partition 1: Offset Y
   
   ✅ Consumer group tracks its position!
```

### Step 5: Test, Check, and Confirm

**Test 1: Consumer Reads All Messages**

```
python kafka_consumer.py
  ✅ All 10 messages consumed
  ✅ Partition and offset shown
  ✅ Message content correct
```

**Test 2: Real-Time Streaming**

```
Run consumer first, then producer:
  ✅ Messages appear in consumer as producer sends them
  ✅ Real-time streaming confirmed
```

**Test 3: Consumer Group Offset**

```
orders → Consumer groups
  ✅ analytics-group shows current offset
  ✅ Offset advances as messages are consumed
```

**Test 4: Portal Metrics**

```
orders → Overview
  ✅ Outgoing Messages count increased
```

**✅ Result**: Kafka consumer working!

---

## Lab 6: Consumer Groups (Multiple Readers)

### What We'll Do

```
Create 2 consumer groups reading the SAME topic.
Each group gets ALL messages independently.

┌──────────────────────────────────────────────────────────────┐
│  CONSUMER GROUPS                                              │
│                                                               │
│  Topic: orders                                               │
│  [msg1] [msg2] [msg3] [msg4] [msg5]                        │
│                                                               │
│  Group A (analytics):                                        │
│  Reads: msg1, msg2, msg3, msg4, msg5 (ALL messages)        │
│                                                               │
│  Group B (email-notifications):                              │
│  Reads: msg1, msg2, msg3, msg4, msg5 (ALL messages too!)   │
│                                                               │
│  Each group is INDEPENDENT.                                  │
│  Each group has its own offset (bookmark).                   │
│  Adding Group B doesn't affect Group A.                      │
└──────────────────────────────────────────────────────────────┘
```

### Step 1: Create Consumer Group in Portal

```
1. Go to orders → Consumer groups
2. Click "+ Consumer group"
3. Name: email-notifications
4. Click "Create"

Now we have:
  ├─ $Default (auto-created)
  ├─ analytics-group (created by our consumer code)
  └─ email-notifications (just created)
```

### Step 2: Create Second Consumer

Create file: `kafka_consumer_email.py`

```python
from confluent_kafka import Consumer
import json

BOOTSTRAP_SERVERS = "eh-day39-kafka.servicebus.windows.net:9093"
CONNECTION_STRING = "YOUR_CONNECTION_STRING"
SASL_PASSWORD = CONNECTION_STRING

conf = {
    'bootstrap.servers': BOOTSTRAP_SERVERS,
    'security.protocol': 'SASL_SSL',
    'sasl.mechanism': 'PLAIN',
    'sasl.username': '$ConnectionString',
    'sasl.password': SASL_PASSWORD,
    'group.id': 'email-notifications',    # DIFFERENT group!
    'auto.offset.reset': 'earliest',
}

consumer = Consumer(conf)
consumer.subscribe(["orders"])

print("📧 Email Notification Consumer (group: email-notifications)")
print("   Waiting for orders...\n")

try:
    while True:
        msg = consumer.poll(5.0)
        if msg is None:
            continue
        if msg.error():
            continue
        order = json.loads(msg.value().decode('utf-8'))
        print(f"📧 Send email to {order['customer']}: "
              f"Your order {order['orderId']} for {order['product']} "
              f"(${order['amount']}) is confirmed!")
except KeyboardInterrupt:
    pass
finally:
    consumer.close()
```

### Step 3: Run Both Consumers + Producer

```bash
# Terminal 1: Analytics consumer
python kafka_consumer.py

# Terminal 2: Email consumer
python kafka_consumer_email.py

# Terminal 3: Send messages
python kafka_producer.py

# Terminal 1 shows: Analytics processing
# Terminal 2 shows: Email notifications
# BOTH get ALL messages!
```

### Step 4: Test, Check, and Confirm

**Test 1: Both Groups Receive All Messages**

```
analytics-group: Received 10 messages ✅
email-notifications: Received 10 messages ✅
Both groups got ALL messages independently!
```

**Test 2: Consumer Groups in Portal**

```
orders → Consumer groups
  ✅ $Default
  ✅ analytics-group (with offset)
  ✅ email-notifications (with offset)
```

**✅ Result**: Multiple consumer groups working!

---

## Lab 7: Partitions and Parallel Processing

### What We'll Do

```
Demonstrate how partitions enable parallel processing.
2 consumers in the SAME group share the partitions.

┌──────────────────────────────────────────────────────────────┐
│  PARALLEL PROCESSING WITH PARTITIONS                          │
│                                                               │
│  Topic: orders (2 partitions)                                │
│                                                               │
│  Consumer Group: "fast-processing"                           │
│  ├─ Consumer 1: Reads Partition 0                            │
│  └─ Consumer 2: Reads Partition 1                            │
│                                                               │
│  Result: 2x throughput! Each consumer handles half.          │
│                                                               │
│  Rule: Max consumers in a group = number of partitions       │
│  2 partitions → max 2 consumers (3rd would be idle)         │
└──────────────────────────────────────────────────────────────┘
```

### Step 1: Create Two Parallel Consumers

Create file: `kafka_consumer_parallel.py`

```python
from confluent_kafka import Consumer
import json
import sys

BOOTSTRAP_SERVERS = "eh-day39-kafka.servicebus.windows.net:9093"
CONNECTION_STRING = "YOUR_CONNECTION_STRING"
SASL_PASSWORD = CONNECTION_STRING

# Get consumer ID from command line
consumer_id = sys.argv[1] if len(sys.argv) > 1 else "1"

conf = {
    'bootstrap.servers': BOOTSTRAP_SERVERS,
    'security.protocol': 'SASL_SSL',
    'sasl.mechanism': 'PLAIN',
    'sasl.username': '$ConnectionString',
    'sasl.password': SASL_PASSWORD,
    'group.id': 'fast-processing',        # SAME group for both!
    'auto.offset.reset': 'latest',        # Only new messages
}

consumer = Consumer(conf)
consumer.subscribe(["orders"])

print(f"⚡ Consumer {consumer_id} (group: fast-processing)")
print(f"   Waiting for messages...\n")

try:
    while True:
        msg = consumer.poll(5.0)
        if msg is None:
            continue
        if msg.error():
            continue
        order = json.loads(msg.value().decode('utf-8'))
        print(f"⚡ Consumer {consumer_id} [P{msg.partition()}] "
              f"{order['orderId']} - {order['customer']}")
except KeyboardInterrupt:
    pass
finally:
    consumer.close()
```

### Step 2: Run Two Consumers in Same Group

```bash
# Terminal 1: Consumer 1
python kafka_consumer_parallel.py 1

# Terminal 2: Consumer 2
python kafka_consumer_parallel.py 2

# Terminal 3: Send messages
python kafka_producer.py
```

### Step 3: Observe Partition Assignment

```
Expected:
  Consumer 1: Gets messages from Partition 0
  Consumer 2: Gets messages from Partition 1

  ⚡ Consumer 1 [P0] ORD-1000 - Alice
  ⚡ Consumer 2 [P1] ORD-1001 - Bob
  ⚡ Consumer 1 [P0] ORD-1002 - Alice  (same key → same partition)
  ⚡ Consumer 2 [P1] ORD-1003 - Carol
  
  ✅ Work is SPLIT between consumers!
  ✅ Same customer always goes to same consumer (key-based)
```

### Step 4: Test, Check, and Confirm

**Test 1: Partitions Split Between Consumers**

```
Consumer 1: Only gets Partition 0 messages ✅
Consumer 2: Only gets Partition 1 messages ✅
No message processed by both (within same group) ✅
```

**Test 2: Key-Based Ordering**

```
Same customer (key) always goes to same partition:
  Alice → always Partition 0 ✅
  Bob → always Partition 1 ✅
  Ordering preserved per customer ✅
```

**✅ Result**: Parallel processing with partitions working!

---

## Complete Summary

```
┌─────────────────────────────────────────────────────────────────┐
│  DAY 39 - KAFKA ON AZURE COMPLETE                                │
│                                                                  │
│  Namespace: eh-day39-kafka (Standard tier, Kafka-enabled)       │
│                                                                  │
│  Topics (Event Hubs):                                           │
│  ├─ orders (2 partitions, 1 day retention)                      │
│  └─ user-events (2 partitions, 1 day retention)                 │
│                                                                  │
│  Consumer Groups:                                               │
│  ├─ analytics-group (reads all orders)                          │
│  ├─ email-notifications (reads all orders independently)        │
│  └─ fast-processing (2 consumers sharing partitions)            │
│                                                                  │
│  Key Learnings:                                                 │
│  ├─ Event Hubs = Managed Kafka (same protocol!)                │
│  ├─ Topic = Event Hub (named stream)                            │
│  ├─ Partitions = Parallel lanes (more = faster)                │
│  ├─ Consumer Groups = Independent readers                       │
│  ├─ Offsets = Bookmarks (track position)                        │
│  ├─ Retention = Messages kept (not deleted on read)             │
│  └─ Key = Determines partition (ordering guarantee)             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Cleanup

```
1. Delete Resource Group:
   - Resource groups → rg-day39-kafka → Delete
   - Type name to confirm → Delete
   - This deletes: Event Hubs namespace and all Event Hubs
```

**⏱️ Wait**: 2-5 minutes

**✅ Result**: All resources deleted!

---

## Quick Reference

### Kafka ↔ Event Hubs Mapping

```
┌──────────────────────┬──────────────────────┐
│  Kafka Term           │  Event Hubs Term      │
├──────────────────────┼──────────────────────┤
│  Cluster             │  Namespace            │
│  Topic               │  Event Hub            │
│  Partition           │  Partition            │
│  Consumer Group      │  Consumer Group       │
│  Offset              │  Offset               │
│  Broker              │  (managed by Azure)   │
│  ZooKeeper           │  (not needed!)        │
└──────────────────────┴──────────────────────┘
```

### Python Kafka Config for Event Hubs

```python
conf = {
    'bootstrap.servers': '<namespace>.servicebus.windows.net:9093',
    'security.protocol': 'SASL_SSL',
    'sasl.mechanism': 'PLAIN',
    'sasl.username': '$ConnectionString',
    'sasl.password': '<full-connection-string>',
    'group.id': '<your-group>',
}
```

### Useful Links

- [Event Hubs for Kafka](https://learn.microsoft.com/azure/event-hubs/event-hubs-for-kafka-ecosystem-overview)
- [Event Hubs Quickstart](https://learn.microsoft.com/azure/event-hubs/event-hubs-quickstart-kafka-enabled-event-hubs)
- [Event Hubs Pricing](https://azure.microsoft.com/pricing/details/event-hubs/)
- [Kafka Python Client](https://docs.confluent.io/kafka-clients/python/current/overview.html)
- [Event Hubs Quotas](https://learn.microsoft.com/azure/event-hubs/event-hubs-quotas)

---

**🎉 Congratulations!** You've completed Day 39 covering Kafka on Azure with Event Hubs, producers, consumers, consumer groups, and partitions!