# Day 39 Part 2: Self-Managed Apache Kafka on Azure VMs

## What You'll Learn

Install and run real Apache Kafka on Azure VMs from scratch:
- ✅ Install Java, ZooKeeper, and Kafka on VM
- ✅ Create topics, produce and consume messages
- ✅ Kafka CLI tools (kafka-topics, kafka-console-producer, etc.)
- ✅ Multi-broker cluster (3 VMs)
- ✅ Produce/consume with Python
- ✅ Complete test, check, and confirm

## Table of Contents

1. [Architecture](#architecture)
2. [Lab 1: Create VM and Install Java](#lab-1-create-vm-and-install-java)
3. [Lab 2: Install and Start ZooKeeper](#lab-2-install-and-start-zookeeper)
4. [Lab 3: Install and Start Kafka](#lab-3-install-and-start-kafka)
5. [Lab 4: Create Topics and Test with CLI](#lab-4-create-topics-and-test-with-cli)
6. [Lab 5: Produce and Consume with Python](#lab-5-produce-and-consume-with-python)
7. [Lab 6: Multi-Broker Cluster (3 VMs)](#lab-6-multi-broker-cluster-3-vms)
8. [Lab 7: Test Cluster Replication and Failover](#lab-7-test-cluster-replication-and-failover)
9. [Cleanup](#cleanup)

---

## Architecture

### Single Broker (Labs 1-5)

```
┌──────────────────────────────────────────────────────────────┐
│  SINGLE BROKER SETUP                                          │
│                                                               │
│  VM: vm-kafka-1 (Standard_B2s)                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                                                          │  │
│  │  Java 17 (OpenJDK)                                      │  │
│  │       │                                                  │  │
│  │  ZooKeeper (port 2181)                                  │  │
│  │  └─ Manages Kafka cluster metadata                      │  │
│  │       │                                                  │  │
│  │  Kafka Broker (port 9092)                               │  │
│  │  ├─ Topic: orders (2 partitions)                        │  │
│  │  └─ Topic: user-events (2 partitions)                   │  │
│  │                                                          │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  Producer → :9092 → Kafka → Consumer                         │
└──────────────────────────────────────────────────────────────┘
```

### Multi-Broker Cluster (Labs 6-7)

```
┌──────────────────────────────────────────────────────────────┐
│  3-BROKER KAFKA CLUSTER                                       │
│                                                               │
│  vm-kafka-1 (10.0.1.4)    vm-kafka-2 (10.0.1.5)            │
│  ├─ ZooKeeper :2181        ├─ Kafka Broker 2 :9092           │
│  └─ Kafka Broker 1 :9092   └─ (connects to ZK on vm-1)      │
│                                                               │
│  vm-kafka-3 (10.0.1.6)                                      │
│  └─ Kafka Broker 3 :9092                                     │
│     (connects to ZK on vm-1)                                 │
│                                                               │
│  Topic: orders (3 partitions, replication-factor 2)          │
│  ├─ Partition 0: Leader=Broker1, Replica=Broker2             │
│  ├─ Partition 1: Leader=Broker2, Replica=Broker3             │
│  └─ Partition 2: Leader=Broker3, Replica=Broker1             │
│                                                               │
│  If Broker 2 dies → Replicas take over! No data loss!       │
└──────────────────────────────────────────────────────────────┘
```

---

## Lab 1: Create VM and Install Java

### Step 1: Create Resource Group and VNet

```
1. Azure Portal → Resource groups → "+ Create"
   - Name: rg-day39-kafka-vm
   - Region: East US
   - Create

2. Virtual networks → "+ Create"
   - Resource group: rg-day39-kafka-vm
   - Name: vnet-kafka
   - Region: East US
   - Address space: 10.0.0.0/16
   - Subnet: subnet-kafka, 10.0.1.0/24
   - Create
```

### Step 2: Create VM

```
1. Virtual machines → "+ Create"
   - Resource group: rg-day39-kafka-vm
   - Name: vm-kafka-1
   - Region: East US
   - Image: Ubuntu Server 22.04 LTS
   - Size: Standard_B2s (2 vCPU, 4 GB RAM)
     ⚠️ Kafka needs at least 2 GB RAM!
   - Authentication: Password
   - Username: azureuser
   - Password: Day39Kafka@2026
   - Public inbound ports: Allow SSH (22)
   
   Networking:
   - Virtual network: vnet-kafka
   - Subnet: subnet-kafka
   - Public IP: Create new

2. Click "Review + create" → "Create"
```

**⏱️ Wait**: 2-3 minutes

### Step 3: Open Kafka Port in NSG

```
1. Go to vm-kafka-1 → Networking → Network settings
2. Click on the NSG (Network Security Group)
3. Add inbound rule:
   - Source: Any
   - Destination port: 9092
   - Protocol: TCP
   - Action: Allow
   - Name: Allow-Kafka
   - Click "Add"

4. Add another rule:
   - Destination port: 2181
   - Name: Allow-ZooKeeper
   - Click "Add"
```

### Step 4: Install Java

```bash
# SSH into VM
ssh azureuser@<VM-PUBLIC-IP>

# Update packages
sudo apt update && sudo apt upgrade -y

# Install Java 17 (Kafka requires Java 8+)
sudo apt install -y openjdk-17-jdk

# Verify Java
java -version
# openjdk version "17.0.x" ✅

# Set JAVA_HOME
echo 'export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64' >> ~/.bashrc
source ~/.bashrc

echo $JAVA_HOME
# /usr/lib/jvm/java-17-openjdk-amd64 ✅
```

### Step 5: Test, Check, and Confirm

```
✅ VM running: vm-kafka-1
✅ Java installed: java -version shows 17.x
✅ JAVA_HOME set
✅ NSG: ports 9092 and 2181 open
```

**✅ Result**: VM ready for Kafka!

---

## Lab 2: Install and Start ZooKeeper

### What is ZooKeeper?

```
ZooKeeper = The "manager" of the Kafka cluster

┌──────────────────────────────────────────────────────────────┐
│  ZOOKEEPER                                                    │
│                                                               │
│  What it does:                                               │
│  ├─ Tracks which brokers are alive                           │
│  ├─ Stores topic/partition metadata                          │
│  ├─ Manages leader election (which broker leads a partition) │
│  └─ Stores consumer group offsets (older Kafka versions)     │
│                                                               │
│  Think of it as:                                             │
│  Kafka brokers = Workers                                     │
│  ZooKeeper = Manager who assigns work and tracks workers     │
│                                                               │
│  Note: Kafka 3.x+ has KRaft mode (no ZooKeeper needed)     │
│  But ZooKeeper is still widely used and good to learn.       │
└──────────────────────────────────────────────────────────────┘
```

### Step 1: Download Kafka (Includes ZooKeeper)

```bash
# SSH into vm-kafka-1
ssh azureuser@<VM-PUBLIC-IP>

# Download Kafka (includes ZooKeeper)
cd /opt
sudo wget https://downloads.apache.org/kafka/3.7.0/kafka_2.13-3.7.0.tgz

# If the above URL doesn't work, use mirror:
# sudo wget https://archive.apache.org/dist/kafka/3.7.0/kafka_2.13-3.7.0.tgz

# Extract
sudo tar -xzf kafka_2.13-3.7.0.tgz
sudo mv kafka_2.13-3.7.0 kafka

# Set ownership
sudo chown -R azureuser:azureuser /opt/kafka

# Add Kafka to PATH
echo 'export PATH=$PATH:/opt/kafka/bin' >> ~/.bashrc
source ~/.bashrc

# Verify
ls /opt/kafka/bin/
# kafka-topics.sh, kafka-console-producer.sh, etc. ✅
```

### Step 2: Configure ZooKeeper

```bash
# View default ZooKeeper config
cat /opt/kafka/config/zookeeper.properties

# Key settings (defaults are fine for single node):
# dataDir=/tmp/zookeeper
# clientPort=2181
# maxClientCnxns=0

# Create data directory
mkdir -p /tmp/zookeeper
```

### Step 3: Start ZooKeeper

```bash
# Start ZooKeeper in background
/opt/kafka/bin/zookeeper-server-start.sh -daemon /opt/kafka/config/zookeeper.properties

# Wait 5 seconds
sleep 5

# Verify ZooKeeper is running
echo "ruok" | nc localhost 2181
# Response: imok ✅ (means "I'm OK")

# Check process
ps aux | grep zookeeper | grep -v grep
# Should show ZooKeeper Java process ✅

# Check port
ss -tlnp | grep 2181
# LISTEN  0  50  *:2181  ✅
```

### Step 4: Test, Check, and Confirm

**Test 1: ZooKeeper Running**

```
echo "ruok" | nc localhost 2181
  ✅ Response: "imok"
```

**Test 2: Port Listening**

```
ss -tlnp | grep 2181
  ✅ Port 2181 listening
```

**Test 3: Process Running**

```
ps aux | grep zookeeper
  ✅ Java process running
```

**✅ Result**: ZooKeeper running!

---

## Lab 3: Install and Start Kafka

### Step 1: Configure Kafka Broker

```bash
# Edit Kafka broker config
nano /opt/kafka/config/server.properties
```

**Key settings to verify/change:**

```properties
# Broker ID (unique per broker in cluster)
broker.id=0

# Listeners (what address Kafka listens on)
# For single VM, use the private IP:
listeners=PLAINTEXT://0.0.0.0:9092

# Advertised listeners (what clients connect to)
# Use the VM's PRIVATE IP for internal access:
advertised.listeners=PLAINTEXT://10.0.1.4:9092
# Or use PUBLIC IP if clients are external:
# advertised.listeners=PLAINTEXT://<VM-PUBLIC-IP>:9092

# ZooKeeper connection
zookeeper.connect=localhost:2181

# Log directory (where Kafka stores data)
log.dirs=/tmp/kafka-logs

# Default partitions for new topics
num.partitions=2

# Default replication factor
default.replication.factor=1

# Log retention (how long to keep messages)
log.retention.hours=168  # 7 days
```

Save and exit (Ctrl+X, Y, Enter in nano).

### Step 2: Start Kafka Broker

```bash
# Start Kafka in background
/opt/kafka/bin/kafka-server-start.sh -daemon /opt/kafka/config/server.properties

# Wait 10 seconds for startup
sleep 10

# Verify Kafka is running
/opt/kafka/bin/kafka-broker-api-versions.sh --bootstrap-server localhost:9092 | head -5
# Should show API versions ✅

# Check process
ps aux | grep kafka.Kafka | grep -v grep
# Should show Kafka Java process ✅

# Check port
ss -tlnp | grep 9092
# LISTEN  0  50  *:9092  ✅
```

### Step 3: Verify Kafka Connected to ZooKeeper

```bash
# Check ZooKeeper for Kafka broker registration
echo "ls /brokers/ids" | /opt/kafka/bin/zookeeper-shell.sh localhost:2181 2>/dev/null | tail -1
# [0] ✅ (broker.id=0 is registered)
```

### Step 4: Test, Check, and Confirm

**Test 1: Kafka Running**

```
ss -tlnp | grep 9092
  ✅ Port 9092 listening
```

**Test 2: Kafka Process**

```
ps aux | grep kafka.Kafka
  ✅ Kafka Java process running
```

**Test 3: Broker Registered in ZooKeeper**

```
ZooKeeper shows broker ID [0]
  ✅ Kafka connected to ZooKeeper
```

**✅ Result**: Kafka broker running!

---

## Lab 4: Create Topics and Test with CLI

### Step 1: Create a Topic

```bash
# Create "orders" topic with 2 partitions
/opt/kafka/bin/kafka-topics.sh --create \
  --bootstrap-server localhost:9092 \
  --topic orders \
  --partitions 2 \
  --replication-factor 1

# Output: Created topic orders. ✅
```

### Step 2: Create Another Topic

```bash
# Create "user-events" topic
/opt/kafka/bin/kafka-topics.sh --create \
  --bootstrap-server localhost:9092 \
  --topic user-events \
  --partitions 2 \
  --replication-factor 1

# Output: Created topic user-events. ✅
```

### Step 3: List Topics

```bash
/opt/kafka/bin/kafka-topics.sh --list \
  --bootstrap-server localhost:9092

# Output:
# orders
# user-events
# ✅ Both topics exist
```

### Step 4: Describe Topic

```bash
/opt/kafka/bin/kafka-topics.sh --describe \
  --bootstrap-server localhost:9092 \
  --topic orders

# Output:
# Topic: orders  TopicId: xxx  PartitionCount: 2  ReplicationFactor: 1
#   Partition: 0  Leader: 0  Replicas: 0  Isr: 0
#   Partition: 1  Leader: 0  Replicas: 0  Isr: 0
# ✅ 2 partitions, leader is broker 0
```

### Step 5: Produce Messages (CLI)

```bash
# Start console producer (type messages, press Enter to send)
/opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server localhost:9092 \
  --topic orders

# Type these messages (press Enter after each):
{"orderId":"ORD-001","customer":"Alice","product":"Laptop","amount":1299}
{"orderId":"ORD-002","customer":"Bob","product":"Phone","amount":899}
{"orderId":"ORD-003","customer":"Carol","product":"Tablet","amount":599}
{"orderId":"ORD-004","customer":"Dave","product":"Monitor","amount":349}
{"orderId":"ORD-005","customer":"Eve","product":"Keyboard","amount":129}

# Press Ctrl+C to exit producer
```

### Step 6: Consume Messages (CLI)

```bash
# Start console consumer (reads from beginning)
/opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic orders \
  --from-beginning

# Output (all 5 messages):
# {"orderId":"ORD-001","customer":"Alice","product":"Laptop","amount":1299}
# {"orderId":"ORD-002","customer":"Bob","product":"Phone","amount":899}
# {"orderId":"ORD-003","customer":"Carol","product":"Tablet","amount":599}
# {"orderId":"ORD-004","customer":"Dave","product":"Monitor","amount":349}
# {"orderId":"ORD-005","customer":"Eve","product":"Keyboard","amount":129}
# ✅ All messages consumed!

# Press Ctrl+C to exit consumer
```

### Step 7: Real-Time Test (Two Terminals)

```bash
# Terminal 1: Start consumer (waiting for messages)
/opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic orders

# Terminal 2: Start producer (send messages)
/opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server localhost:9092 \
  --topic orders

# Type in Terminal 2:
Hello from real-time Kafka!

# Terminal 1 immediately shows:
# Hello from real-time Kafka!
# ✅ Real-time streaming!
```

### Step 8: Consumer with Group

```bash
# Consumer with group ID (tracks offset)
/opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic orders \
  --group my-app-group \
  --from-beginning

# After reading all messages, press Ctrl+C

# Check consumer group offset
/opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --group my-app-group \
  --describe

# Output:
# GROUP         TOPIC    PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG
# my-app-group  orders   0          3               3               0
# my-app-group  orders   1          2               2               0
# ✅ LAG=0 means consumer has read all messages!
```

### Step 9: Test, Check, and Confirm

**Test 1: Topics Created**

```
kafka-topics.sh --list
  ✅ orders
  ✅ user-events
```

**Test 2: Produce and Consume**

```
Produce 5 messages → Consume 5 messages
  ✅ All messages received
  ✅ Content matches
```

**Test 3: Real-Time Streaming**

```
Producer sends → Consumer receives immediately
  ✅ Real-time confirmed
```

**Test 4: Consumer Group Offset**

```
kafka-consumer-groups.sh --describe
  ✅ Offset tracked
  ✅ LAG = 0 (all consumed)
```

**✅ Result**: Kafka CLI tools working!

---

## Lab 5: Produce and Consume with Python

### Step 1: Install Python Kafka Library

```bash
sudo apt install -y python3-pip
pip3 install confluent-kafka
```

### Step 2: Create Python Producer

```bash
cat > ~/kafka_producer.py << 'PYEOF'
from confluent_kafka import Producer
import json, time, random

conf = {'bootstrap.servers': 'localhost:9092'}
producer = Producer(conf)

customers = ["Alice", "Bob", "Carol", "Dave", "Eve"]
products = ["Laptop", "Phone", "Tablet", "Monitor", "Keyboard"]

print("📤 Producing 10 orders...\n")

for i in range(10):
    order = {
        "orderId": f"ORD-{2000+i}",
        "customer": random.choice(customers),
        "product": random.choice(products),
        "amount": round(random.uniform(50, 1500), 2),
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
    producer.produce("orders", key=order["customer"], value=json.dumps(order))
    print(f"  📦 {order['orderId']} - {order['customer']} - ${order['amount']}")
    time.sleep(0.3)

producer.flush()
print("\n✅ 10 messages produced!")
PYEOF
```

### Step 3: Create Python Consumer

```bash
cat > ~/kafka_consumer.py << 'PYEOF'
from confluent_kafka import Consumer
import json

conf = {
    'bootstrap.servers': 'localhost:9092',
    'group.id': 'python-group',
    'auto.offset.reset': 'earliest',
}

consumer = Consumer(conf)
consumer.subscribe(["orders"])

print("📥 Consuming from 'orders'...\n")

try:
    while True:
        msg = consumer.poll(5.0)
        if msg is None:
            print("  No more messages. Ctrl+C to stop.")
            continue
        if msg.error():
            continue
        order = json.loads(msg.value().decode('utf-8'))
        print(f"  📦 [P{msg.partition()}:{msg.offset()}] "
              f"{order['orderId']} - {order['customer']} - ${order['amount']}")
except KeyboardInterrupt:
    pass
finally:
    consumer.close()
    print("\n✅ Consumer stopped.")
PYEOF
```

### Step 4: Run Producer and Consumer

```bash
# Terminal 1: Run consumer
python3 ~/kafka_consumer.py

# Terminal 2: Run producer
python3 ~/kafka_producer.py

# Terminal 1 shows messages arriving in real-time!
```

### Step 5: Test, Check, and Confirm

**Test 1: Python Producer**

```
python3 kafka_producer.py
  ✅ 10 messages produced
```

**Test 2: Python Consumer**

```
python3 kafka_consumer.py
  ✅ All messages consumed with partition/offset
```

**Test 3: Real-Time**

```
Run consumer first, then producer:
  ✅ Messages appear in consumer as producer sends
```

**✅ Result**: Python Kafka client working!

---

## Lab 6: Multi-Broker Cluster (3 VMs)

### Step 1: Create 2 More VMs

```
Create vm-kafka-2 and vm-kafka-3 in Azure Portal:

VM 2:
  - Name: vm-kafka-2
  - Resource group: rg-day39-kafka-vm
  - Region: East US
  - Image: Ubuntu 22.04 LTS
  - Size: Standard_B2s
  - VNet: vnet-kafka, Subnet: subnet-kafka
  - Username: azureuser, Password: Day39Kafka@2026

VM 3:
  - Name: vm-kafka-3
  - Same settings as VM 2

⏱️ Wait for both VMs to be created.

Note the private IPs:
  vm-kafka-1: 10.0.1.4
  vm-kafka-2: 10.0.1.5
  vm-kafka-3: 10.0.1.6
  (Verify in Portal → VM → Networking → Private IP)
```

### Step 2: Install Java and Kafka on VM-2 and VM-3

```bash
# SSH into vm-kafka-2
ssh azureuser@<VM-2-PUBLIC-IP>

# Install Java
sudo apt update && sudo apt install -y openjdk-17-jdk

# Download and extract Kafka
cd /opt
sudo wget https://downloads.apache.org/kafka/3.7.0/kafka_2.13-3.7.0.tgz
sudo tar -xzf kafka_2.13-3.7.0.tgz
sudo mv kafka_2.13-3.7.0 kafka
sudo chown -R azureuser:azureuser /opt/kafka
echo 'export PATH=$PATH:/opt/kafka/bin' >> ~/.bashrc
source ~/.bashrc

exit

# Repeat EXACT same steps for vm-kafka-3
ssh azureuser@<VM-3-PUBLIC-IP>
# ... same commands ...
exit
```

### Step 3: Configure Kafka Broker on VM-2

```bash
ssh azureuser@<VM-2-PUBLIC-IP>

# Edit Kafka config
nano /opt/kafka/config/server.properties
```

**Change these settings on VM-2:**

```properties
# UNIQUE broker ID (different from VM-1!)
broker.id=1

# Listen on all interfaces
listeners=PLAINTEXT://0.0.0.0:9092

# Advertise this VM's private IP
advertised.listeners=PLAINTEXT://10.0.1.5:9092

# Connect to ZooKeeper on VM-1
zookeeper.connect=10.0.1.4:2181

# Log directory
log.dirs=/tmp/kafka-logs
```

Save and exit.

### Step 4: Configure Kafka Broker on VM-3

```bash
ssh azureuser@<VM-3-PUBLIC-IP>

nano /opt/kafka/config/server.properties
```

**Change these settings on VM-3:**

```properties
# UNIQUE broker ID
broker.id=2

listeners=PLAINTEXT://0.0.0.0:9092
advertised.listeners=PLAINTEXT://10.0.1.6:9092

# Same ZooKeeper (on VM-1)
zookeeper.connect=10.0.1.4:2181

log.dirs=/tmp/kafka-logs
```

Save and exit.

### Step 5: Start Kafka on VM-2 and VM-3

```bash
# On VM-2:
ssh azureuser@<VM-2-PUBLIC-IP>
/opt/kafka/bin/kafka-server-start.sh -daemon /opt/kafka/config/server.properties
sleep 10
ss -tlnp | grep 9092
# ✅ Port 9092 listening
exit

# On VM-3:
ssh azureuser@<VM-3-PUBLIC-IP>
/opt/kafka/bin/kafka-server-start.sh -daemon /opt/kafka/config/server.properties
sleep 10
ss -tlnp | grep 9092
# ✅ Port 9092 listening
exit
```

### Step 6: Verify 3-Broker Cluster

```bash
# On VM-1 (where ZooKeeper runs):
ssh azureuser@<VM-1-PUBLIC-IP>

# Check all brokers registered
echo "ls /brokers/ids" | /opt/kafka/bin/zookeeper-shell.sh localhost:2181 2>/dev/null | tail -1
# [0, 1, 2] ✅ All 3 brokers registered!

# Describe cluster
/opt/kafka/bin/kafka-metadata.sh --snapshot /tmp/kafka-logs/__cluster_metadata-0/00000000000000000000.log --cluster-id 2>/dev/null || \
/opt/kafka/bin/kafka-broker-api-versions.sh --bootstrap-server localhost:9092 | grep "id" | head -5
```

### Step 7: Create Replicated Topic

```bash
# Create topic with replication factor 2 (data on 2 of 3 brokers)
/opt/kafka/bin/kafka-topics.sh --create \
  --bootstrap-server localhost:9092 \
  --topic orders-replicated \
  --partitions 3 \
  --replication-factor 2

# Describe the topic
/opt/kafka/bin/kafka-topics.sh --describe \
  --bootstrap-server localhost:9092 \
  --topic orders-replicated

# Output:
# Topic: orders-replicated  PartitionCount: 3  ReplicationFactor: 2
#   Partition: 0  Leader: 0  Replicas: 0,1  Isr: 0,1
#   Partition: 1  Leader: 1  Replicas: 1,2  Isr: 1,2
#   Partition: 2  Leader: 2  Replicas: 2,0  Isr: 2,0
#
# ✅ 3 partitions spread across 3 brokers
# ✅ Each partition has 2 replicas (replication-factor 2)
# ✅ Isr (In-Sync Replicas) = all replicas are in sync
```

### Step 8: Test, Check, and Confirm

**Test 1: All 3 Brokers Online**

```
ZooKeeper shows: [0, 1, 2]
  ✅ 3 brokers registered
```

**Test 2: Replicated Topic**

```
kafka-topics.sh --describe orders-replicated
  ✅ 3 partitions
  ✅ Replication factor: 2
  ✅ Leaders spread across brokers
```

**Test 3: Produce to Cluster**

```bash
/opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server 10.0.1.4:9092,10.0.1.5:9092,10.0.1.6:9092 \
  --topic orders-replicated

# Type messages and press Enter
Test message 1
Test message 2
Test message 3
# Ctrl+C
```

**Test 4: Consume from Cluster**

```bash
/opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server 10.0.1.4:9092,10.0.1.5:9092,10.0.1.6:9092 \
  --topic orders-replicated \
  --from-beginning

# ✅ All messages received
```

**✅ Result**: 3-broker Kafka cluster running!

---

## Lab 7: Test Cluster Replication and Failover

### Step 1: Produce Messages to Cluster

```bash
# On VM-1:
/opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server localhost:9092 \
  --topic orders-replicated

# Send 5 messages:
Before failover - message 1
Before failover - message 2
Before failover - message 3
Before failover - message 4
Before failover - message 5
# Ctrl+C
```

### Step 2: Kill One Broker (Simulate Failure)

```bash
# On VM-2: Stop Kafka (simulate crash)
ssh azureuser@<VM-2-PUBLIC-IP>
/opt/kafka/bin/kafka-server-stop.sh
exit

# Back on VM-1: Check topic status
/opt/kafka/bin/kafka-topics.sh --describe \
  --bootstrap-server localhost:9092 \
  --topic orders-replicated

# Output:
# Partition: 0  Leader: 0  Replicas: 0,1  Isr: 0     ← Broker 1 removed from ISR!
# Partition: 1  Leader: 2  Replicas: 1,2  Isr: 2     ← Leader changed from 1 to 2!
# Partition: 2  Leader: 2  Replicas: 2,0  Isr: 2,0
#
# ✅ Kafka detected broker 1 is down
# ✅ Leadership transferred to surviving brokers
# ✅ Cluster still works with 2 of 3 brokers!
```

### Step 3: Verify Data Still Available

```bash
# Consume messages (should still work!)
/opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic orders-replicated \
  --from-beginning

# ✅ All 5 messages still available!
# ✅ No data loss even though broker 1 is down!
# (Because replication-factor=2, data exists on another broker)
```

### Step 4: Produce While Broker is Down

```bash
# Send new messages (cluster still accepts writes!)
/opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server localhost:9092 \
  --topic orders-replicated

After failover - message 6
After failover - message 7
# Ctrl+C

# Consume all messages
/opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic orders-replicated \
  --from-beginning

# ✅ All 7 messages (5 before + 2 after failover)
# ✅ Cluster continues to work with 2 brokers!
```

### Step 5: Restart Failed Broker

```bash
# On VM-2: Start Kafka again
ssh azureuser@<VM-2-PUBLIC-IP>
/opt/kafka/bin/kafka-server-start.sh -daemon /opt/kafka/config/server.properties
sleep 15
exit

# On VM-1: Check topic status
/opt/kafka/bin/kafka-topics.sh --describe \
  --bootstrap-server localhost:9092 \
  --topic orders-replicated

# ✅ Broker 1 back in ISR (In-Sync Replicas)
# ✅ Data automatically replicated to recovered broker
# ✅ Cluster fully healthy again!
```

### Step 6: Test, Check, and Confirm

**Test 1: Failover Works**

```
Stop broker 1 → Cluster still works ✅
Messages still readable ✅
Can still produce new messages ✅
```

**Test 2: No Data Loss**

```
All messages before and after failover available ✅
Replication protected the data ✅
```

**Test 3: Recovery Works**

```
Restart broker 1 → Rejoins cluster ✅
Data re-synced automatically ✅
ISR back to full ✅
```

**✅ Result**: Kafka cluster failover and recovery working!

---

## Cleanup

```
1. Stop Kafka and ZooKeeper on all VMs:

   # On each VM:
   /opt/kafka/bin/kafka-server-stop.sh
   /opt/kafka/bin/zookeeper-server-stop.sh  # Only on VM-1

2. Delete Resource Group:
   - Azure Portal → Resource groups → rg-day39-kafka-vm → Delete
   - Type name to confirm → Delete
   - This deletes all 3 VMs and networking
```

**⏱️ Wait**: 5-10 minutes

**✅ Result**: All resources deleted!

---

## Quick Reference

### Kafka CLI Commands

```bash
# TOPICS
kafka-topics.sh --create --bootstrap-server localhost:9092 --topic NAME --partitions 2 --replication-factor 1
kafka-topics.sh --list --bootstrap-server localhost:9092
kafka-topics.sh --describe --bootstrap-server localhost:9092 --topic NAME
kafka-topics.sh --delete --bootstrap-server localhost:9092 --topic NAME

# PRODUCE
kafka-console-producer.sh --bootstrap-server localhost:9092 --topic NAME

# CONSUME
kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic NAME --from-beginning
kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic NAME --group GROUP

# CONSUMER GROUPS
kafka-consumer-groups.sh --bootstrap-server localhost:9092 --list
kafka-consumer-groups.sh --bootstrap-server localhost:9092 --group GROUP --describe

# CLUSTER
zookeeper-shell.sh localhost:2181
# Then: ls /brokers/ids
```

### Start/Stop Commands

```bash
# Start ZooKeeper
/opt/kafka/bin/zookeeper-server-start.sh -daemon /opt/kafka/config/zookeeper.properties

# Start Kafka
/opt/kafka/bin/kafka-server-start.sh -daemon /opt/kafka/config/server.properties

# Stop Kafka (stop Kafka BEFORE ZooKeeper!)
/opt/kafka/bin/kafka-server-stop.sh

# Stop ZooKeeper
/opt/kafka/bin/zookeeper-server-stop.sh
```

### Multi-Broker Config Differences

```
VM-1: broker.id=0, advertised.listeners=PLAINTEXT://10.0.1.4:9092, zookeeper.connect=localhost:2181
VM-2: broker.id=1, advertised.listeners=PLAINTEXT://10.0.1.5:9092, zookeeper.connect=10.0.1.4:2181
VM-3: broker.id=2, advertised.listeners=PLAINTEXT://10.0.1.6:9092, zookeeper.connect=10.0.1.4:2181
```

### Useful Links

- [Apache Kafka Documentation](https://kafka.apache.org/documentation/)
- [Kafka Quickstart](https://kafka.apache.org/quickstart)
- [Kafka Downloads](https://kafka.apache.org/downloads)
- [Confluent Kafka Python](https://docs.confluent.io/kafka-clients/python/current/overview.html)

---

**🎉 Congratulations!** You've completed Day 39 Part 2 installing and running self-managed Apache Kafka on Azure VMs with a 3-broker cluster, replication, and failover testing!