# Day 23: Azure Database Services - Complete Guide

## What You'll Learn

This comprehensive guide covers ALL Azure Database services:
- ✅ Azure SQL Database (Relational - Microsoft SQL Server)
- ✅ Azure Database for PostgreSQL (Relational - Open Source)
- ✅ Azure Database for MySQL (Relational - Open Source)
- ✅ Azure Cosmos DB (NoSQL - Global Distribution)
- ✅ Azure Cache for Redis (In-Memory Cache)
- ✅ What, Why, How for each service
- ✅ Complete labs via Azure Portal
- ✅ Test, Check, and Confirm for every lab

## Table of Contents

1. [What is Azure Database?](#what-is-azure-database)
2. [Why Use Azure Database?](#why-use-azure-database)
3. [Azure Database Services Overview](#azure-database-services-overview)
4. [Lab 1: Azure SQL Database](#lab-1-azure-sql-database)
5. [Lab 2: Azure Database for PostgreSQL](#lab-2-azure-database-for-postgresql)
6. [Lab 3: Azure Database for MySQL](#lab-3-azure-database-for-mysql)
7. [Lab 4: Azure Cosmos DB (NoSQL)](#lab-4-azure-cosmos-db-nosql)
8. [Lab 5: Azure Cache for Redis](#lab-5-azure-cache-for-redis)
9. [Security & Best Practices](#security--best-practices)
10. [Cost Optimization](#cost-optimization)
11. [Cleanup](#cleanup)

---

## What is Azure Database?

**Azure Database** = Fully managed database services in the cloud.

**"Fully Managed" means:**
- ✅ Azure handles patching, backups, monitoring
- ✅ You don't manage the server OS
- ✅ Automatic high availability
- ✅ Built-in security
- ✅ You focus on your data, not infrastructure

### Self-Managed vs Fully Managed

```
Self-Managed (VM + Database):
┌──────────────────────────────────────┐
│  YOU manage:                          │
│  ├─ VM operating system              │
│  ├─ Database installation            │
│  ├─ Patching & updates               │
│  ├─ Backups                          │
│  ├─ High availability                │
│  ├─ Security                         │
│  ├─ Monitoring                       │
│  └─ Scaling                          │
│                                       │
│  Cost: VM + Storage + Your time       │
│  Effort: HIGH                         │
└──────────────────────────────────────┘

Fully Managed (Azure Database):
┌──────────────────────────────────────┐
│  AZURE manages:                       │
│  ├─ Server infrastructure            │
│  ├─ Database engine                  │
│  ├─ Patching & updates               │
│  ├─ Backups (automatic)              │
│  ├─ High availability                │
│  ├─ Security (encryption)            │
│  └─ Monitoring                       │
│                                       │
│  YOU manage:                          │
│  ├─ Database schema                  │
│  ├─ Data                             │
│  ├─ Queries                          │
│  └─ Application connection           │
│                                       │
│  Cost: Service fee only               │
│  Effort: LOW                          │
└──────────────────────────────────────┘
```

---

## Why Use Azure Database?

### Benefits

**1. No Server Management**
- No OS patching
- No database installation
- No hardware maintenance

**2. Automatic Backups**
- Point-in-time restore
- Up to 35 days retention
- Geo-redundant backups

**3. High Availability**
- 99.99% SLA
- Automatic failover
- Zone redundancy

**4. Security**
- Encryption at rest and in transit
- Azure AD authentication
- Firewall rules
- Private endpoints

**5. Scalability**
- Scale up/down in minutes
- Read replicas
- Auto-scaling options

**6. Global Distribution (Cosmos DB)**
- Multi-region writes
- <10ms latency globally
- Automatic replication

---

## Azure Database Services Overview

### Which Database Should I Use?

```
┌─────────────────────────────────────────────────────────────────┐
│                    DECISION TREE                                 │
│                                                                  │
│  What type of data?                                             │
│  ├─ Structured (tables, rows, columns)                          │
│  │   ├─ Need Microsoft SQL Server? → Azure SQL Database         │
│  │   ├─ Need PostgreSQL? → Azure Database for PostgreSQL        │
│  │   └─ Need MySQL? → Azure Database for MySQL                  │
│  │                                                               │
│  ├─ Semi-structured (JSON, documents)                           │
│  │   └─ Need global distribution? → Azure Cosmos DB             │
│  │                                                               │
│  └─ Need fast caching?                                          │
│      └─ In-memory speed? → Azure Cache for Redis                │
└─────────────────────────────────────────────────────────────────┘
```

### Comparison Table

| Feature | Azure SQL | PostgreSQL | MySQL | Cosmos DB | Redis |
|---------|-----------|------------|-------|-----------|-------|
| Type | Relational | Relational | Relational | NoSQL | Cache |
| Language | T-SQL | SQL | SQL | Multiple APIs | Commands |
| Max Size | 100 TB | 16 TB | 16 TB | Unlimited | 120 GB |
| Use Case | Enterprise | Open source | Web apps | Global apps | Caching |
| SLA | 99.99% | 99.99% | 99.99% | 99.999% | 99.9% |
| Cost | $$ | $ | $ | $$$ | $ |

### Real-World Use Cases

```
E-commerce Application:
├─ Azure SQL Database → Orders, customers, inventory
├─ Azure Cache for Redis → Shopping cart, session data
└─ Azure Cosmos DB → Product catalog (global)

Social Media Platform:
├─ Azure Database for PostgreSQL → User profiles, posts
├─ Azure Cache for Redis → Feed cache, notifications
└─ Azure Cosmos DB → Activity feed (global)

Enterprise Application:
├─ Azure SQL Database → Business data, reporting
├─ Azure Database for MySQL → WordPress, CMS
└─ Azure Cache for Redis → API response cache
```

---

## Lab 1: Azure SQL Database

### What is Azure SQL Database?

**Azure SQL Database** = Fully managed Microsoft SQL Server in the cloud.

**Why Azure SQL?**
- ✅ Most popular enterprise database
- ✅ T-SQL language (familiar to .NET developers)
- ✅ Advanced features (stored procedures, triggers, views)
- ✅ Built-in intelligence (auto-tuning)
- ✅ Compatible with SQL Server tools

**How it works:**

```
Your Application
    ↓
Connection String: Server=myserver.database.windows.net;Database=mydb;...
    ↓
Azure SQL Server (logical server - no VM)
    ↓
Azure SQL Database (your database)
    ↓
Data stored on Azure managed storage
```

### Step 1: Create SQL Server (Logical Server)

1. Login to **Azure Portal** (portal.azure.com)
2. Search for **"SQL databases"**
3. Click **"+ Create"**

**Basics Tab:**
- **Subscription**: Your subscription
- **Resource group**: Create new: `rg-database-lab`
- **Database name**: `myappdb`

**Server:**
- Click **"Create new"**
  - **Server name**: `sqlserver-day23-demo` (must be globally unique)
  - **Location**: `East US`
  - **Authentication method**: `Use SQL authentication`
  - **Server admin login**: `sqladmin`
  - **Password**: `P@ssw0rd2026!` (use strong password)
  - **Confirm password**: Same password
  - Click **"OK"**


**Workload environment**: `Development`
**Compute + storage**: Click **"Configure database"**
  - **Service tier**: `Basic`
  - **DTUs**: `5`
  - **Max storage**: `2 GB`
  - Click **"Apply"**

**Backup storage redundancy**: `Locally-redundant backup storage`

Click **"Next: Networking"**

**Networking Tab:**
- **Network connectivity**: `Public endpoint`
- **Firewall rules:**
  - **Allow Azure services and resources to access this server**: `Yes`
  - **Add current client IP address**: `Yes`

Click **"Next: Security"** (skip defaults)

Click **"Next: Additional settings"**

**Additional settings Tab:**
- **Use existing data**: `Sample`
  - This creates AdventureWorksLT sample database with data!

Click **"Review + create"**

Click **"Create"**

**⏱️ Wait**: 3-5 minutes

**✅ Result**: SQL Database created with sample data!

### Step 2: Connect to Database via Portal

1. Go to **"SQL databases"** → **"myappdb"**
2. In left menu, click **"Query editor (preview)"**
3. Login:
   - **Authentication type**: `SQL server authentication`
   - **Login**: `sqladmin`
   - **Password**: `P@ssw0rd2026!`
   - Click **"OK"**

**✅ Result**: Connected to database!

### Step 3: Run SQL Queries

**Query 1: List all tables**

```sql
SELECT TABLE_SCHEMA, TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_SCHEMA, TABLE_NAME;
```

Click **"Run"**

**Expected Result:**
```
TABLE_SCHEMA    TABLE_NAME
SalesLT         Address
SalesLT         Customer
SalesLT         CustomerAddress
SalesLT         Product
SalesLT         ProductCategory
SalesLT         ProductDescription
SalesLT         ProductModel
SalesLT         ProductModelProductDescription
SalesLT         SalesOrderDetail
SalesLT         SalesOrderHeader
```

**✅ 10 tables from AdventureWorksLT sample!**

**Query 2: Get customers**

```sql
SELECT TOP 10 
    CustomerID, 
    FirstName, 
    LastName, 
    EmailAddress, 
    CompanyName
FROM SalesLT.Customer
ORDER BY CustomerID;
```

Click **"Run"**

**Expected Result:**
```
CustomerID  FirstName   LastName    EmailAddress              CompanyName
1           Orlando     Gee         orlando0@adventure...     A Bike Store
2           Keith       Harris      keith0@adventure...       Progressive Sports
3           Donna       Carreras    donna0@adventure...       Advanced Bike Components
...
```

**✅ Customer data retrieved!**

**Query 3: Get products with prices**

```sql
SELECT TOP 10 
    ProductID, 
    Name, 
    Color, 
    ListPrice, 
    Size
FROM SalesLT.Product
WHERE ListPrice > 100
ORDER BY ListPrice DESC;
```

Click **"Run"**

**Expected Result:**
```
ProductID   Name                    Color   ListPrice   Size
749         Road-150 Red, 62        Red     3578.27     62
750         Road-150 Red, 44        Red     3578.27     44
751         Road-150 Red, 48        Red     3578.27     48
...
```

**✅ Product data with prices!**

**Query 4: Create your own table**

```sql
-- Create new table
CREATE TABLE dbo.Employees (
    EmployeeID INT PRIMARY KEY IDENTITY(1,1),
    FirstName NVARCHAR(50) NOT NULL,
    LastName NVARCHAR(50) NOT NULL,
    Email NVARCHAR(100),
    Department NVARCHAR(50),
    Salary DECIMAL(10,2),
    HireDate DATE DEFAULT GETDATE()
);

-- Insert data
INSERT INTO dbo.Employees (FirstName, LastName, Email, Department, Salary)
VALUES 
    ('John', 'Doe', 'john@company.com', 'Engineering', 85000),
    ('Jane', 'Smith', 'jane@company.com', 'Marketing', 75000),
    ('Bob', 'Johnson', 'bob@company.com', 'Engineering', 90000),
    ('Alice', 'Williams', 'alice@company.com', 'HR', 70000),
    ('Charlie', 'Brown', 'charlie@company.com', 'Engineering', 95000);

-- Query data
SELECT * FROM dbo.Employees;
```

Click **"Run"**

**Expected Result:**
```
EmployeeID  FirstName  LastName   Email                Department   Salary    HireDate
1           John       Doe        john@company.com     Engineering  85000.00  2026-03-14
2           Jane       Smith      jane@company.com     Marketing    75000.00  2026-03-14
3           Bob        Johnson    bob@company.com      Engineering  90000.00  2026-03-14
4           Alice      Williams   alice@company.com    HR           70000.00  2026-03-14
5           Charlie    Brown      charlie@company.com  Engineering  95000.00  2026-03-14
```

**✅ Custom table created with data!**

**Query 5: Aggregate queries**

```sql
-- Average salary by department
SELECT 
    Department,
    COUNT(*) AS EmployeeCount,
    AVG(Salary) AS AvgSalary,
    MIN(Salary) AS MinSalary,
    MAX(Salary) AS MaxSalary
FROM dbo.Employees
GROUP BY Department
ORDER BY AvgSalary DESC;
```

**Expected Result:**
```
Department    EmployeeCount  AvgSalary   MinSalary   MaxSalary
Engineering   3              90000.00    85000.00    95000.00
Marketing     1              75000.00    75000.00    75000.00
HR            1              70000.00    70000.00    70000.00
```

**✅ Aggregation working!**


### Step 4: Connect from External Tool (Optional)

**Connection String:**

1. Go to **"SQL databases"** → **"myappdb"**
2. In left menu, click **"Connection strings"**
3. Copy **ADO.NET** connection string:

```
Server=tcp:sqlserver-day23-demo.database.windows.net,1433;
Initial Catalog=myappdb;
Persist Security Info=False;
User ID=sqladmin;
Password={your_password};
MultipleActiveResultSets=False;
Encrypt=True;
TrustServerCertificate=False;
Connection Timeout=30;
```

**Connect with Azure Data Studio or SSMS:**
- **Server**: `sqlserver-day23-demo.database.windows.net`
- **Authentication**: `SQL Login`
- **User**: `sqladmin`
- **Password**: `P@ssw0rd2026!`
- **Database**: `myappdb`

### Step 5: Test, Check, and Confirm - Azure SQL

**Test 1: Verify Database Created**

1. Go to **"SQL databases"**
2. You should see **"myappdb"** listed
3. Click on it

**Expected Result:**
```
✅ Database name: myappdb
✅ Status: Online
✅ Server: sqlserver-day23-demo.database.windows.net
✅ Pricing tier: Basic
✅ Location: East US
```

**Test 2: Verify Server**

1. Go to **"SQL servers"**
2. Click on **"sqlserver-day23-demo"**
3. Check **"Overview"**

**Expected Result:**
```
✅ Server name: sqlserver-day23-demo.database.windows.net
✅ Status: Available
✅ Admin: sqladmin
✅ Databases: 1 (myappdb)
```

**Test 3: Verify Firewall Rules**

1. Go to SQL server → **"Networking"** (under Security)
2. Check firewall rules

**Expected Result:**
```
✅ Allow Azure services: Yes
✅ Your client IP: Listed
✅ Public endpoint: Enabled
```

**Test 4: Test Query Editor**

1. Go to database → **"Query editor"**
2. Login and run: `SELECT @@VERSION`

**Expected Result:**
```
Microsoft SQL Azure (RTM) - 12.0.2000.8
✅ Connected to Azure SQL Database
```

**Test 5: Test Sample Data**

```sql
SELECT COUNT(*) AS TotalCustomers FROM SalesLT.Customer;
SELECT COUNT(*) AS TotalProducts FROM SalesLT.Product;
SELECT COUNT(*) AS TotalOrders FROM SalesLT.SalesOrderHeader;
```

**Expected Result:**
```
TotalCustomers: 847
TotalProducts: 295
TotalOrders: 32
✅ Sample data loaded correctly
```

**Test 6: Test Custom Table**

```sql
SELECT COUNT(*) AS TotalEmployees FROM dbo.Employees;
SELECT * FROM dbo.Employees WHERE Department = 'Engineering';
```

**Expected Result:**
```
TotalEmployees: 5
✅ Custom table working
✅ Queries return correct data
```

**Test 7: Test Connection String**

Try connecting from your local machine using Azure Data Studio or any SQL client.

**Expected Result:**
```
✅ Connection successful
✅ Can browse tables
✅ Can run queries
✅ Data matches Portal query editor
```

**Test 8: Check Database Size**

1. Go to database → **"Overview"**
2. Check **"Database size"** and **"DTU usage"**

**Expected Result:**
```
✅ Size: ~30 MB (sample data)
✅ Max size: 2 GB
✅ DTU usage: Low
✅ Status: Online
```

**✅ Result**: Azure SQL Database fully tested and working!

---

## Lab 2: Azure Database for PostgreSQL

### What is Azure Database for PostgreSQL?

**PostgreSQL** = Most advanced open-source relational database.

**Why PostgreSQL?**
- ✅ Free and open source
- ✅ Advanced features (JSON, arrays, full-text search)
- ✅ Popular with Python, Node.js, Ruby developers
- ✅ PostGIS for geospatial data
- ✅ Strong community

**How it works:**

```
Your Application
    ↓
Connection String: host=myserver.postgres.database.azure.com;dbname=mydb;...
    ↓
Azure PostgreSQL Flexible Server
    ↓
PostgreSQL Database
    ↓
Data stored on Azure managed storage
```

### Step 1: Create PostgreSQL Flexible Server

1. Search for **"Azure Database for PostgreSQL flexible servers"**
2. Click **"+ Create"**

**Basics Tab:**
- **Subscription**: Your subscription
- **Resource group**: `rg-database-lab`
- **Server name**: `pgserver-day23-demo` (must be globally unique)
- **Region**: `East US`
- **PostgreSQL version**: `16`
- **Workload type**: `Development` (cheapest)

**Compute + storage:**
- Click **"Configure server"**
  - **Compute tier**: `Burstable`
  - **Compute size**: `Standard_B1ms` (1 vCore, 2 GB RAM)
  - **Storage size**: `32 GiB`
  - **Backup retention**: `7 days`
  - Click **"Save"**

**Authentication:**
- **Authentication method**: `PostgreSQL authentication only`
- **Admin username**: `pgadmin`
- **Password**: `P@ssw0rd2026!`

Click **"Next: Networking"**

**Networking Tab:**
- **Connectivity method**: `Public access (allowed IP addresses)`
- **Firewall rules:**
  - Check **"Allow public access from any Azure service within Azure to this server"**
  - Click **"+ Add current client IP address"**

Click **"Review + create"**

Click **"Create"**

**⏱️ Wait**: 5-10 minutes

**✅ Result**: PostgreSQL server created!

### Step 2: Connect to PostgreSQL

**Option 1: Azure Cloud Shell**

1. Open **Cloud Shell** (top bar icon in Portal)
2. Select **Bash**
3. Connect:

```bash
psql "host=pgserver-day23-demo.postgres.database.azure.com port=5432 dbname=postgres user=pgadmin password=P@ssw0rd2026! sslmode=require"
```

**Option 2: pgAdmin (Desktop Tool)**

1. Download **pgAdmin** (https://www.pgadmin.org/)
2. Add new server:
   - **Host**: `pgserver-day23-demo.postgres.database.azure.com`
   - **Port**: `5432`
   - **Username**: `pgadmin`
   - **Password**: `P@ssw0rd2026!`
   - **SSL mode**: `Require`

**✅ Result**: Connected to PostgreSQL!

### Step 3: Create Database and Tables

```sql
-- Create database
CREATE DATABASE appdb;

-- Connect to new database
\c appdb

-- Create tables
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE,
    department_id INTEGER REFERENCES departments(id),
    salary DECIMAL(10,2),
    hire_date DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true
);

-- Insert departments
INSERT INTO departments (name, location) VALUES
    ('Engineering', 'Building A'),
    ('Marketing', 'Building B'),
    ('HR', 'Building C'),
    ('Sales', 'Building D');

-- Insert employees
INSERT INTO employees (first_name, last_name, email, department_id, salary) VALUES
    ('John', 'Doe', 'john@company.com', 1, 85000),
    ('Jane', 'Smith', 'jane@company.com', 2, 75000),
    ('Bob', 'Johnson', 'bob@company.com', 1, 90000),
    ('Alice', 'Williams', 'alice@company.com', 3, 70000),
    ('Charlie', 'Brown', 'charlie@company.com', 1, 95000),
    ('Diana', 'Prince', 'diana@company.com', 4, 80000);
```

**✅ Result**: Database, tables, and data created!

### Step 4: Run Queries

**Query 1: Join tables**

```sql
SELECT 
    e.first_name,
    e.last_name,
    e.email,
    d.name AS department,
    e.salary
FROM employees e
JOIN departments d ON e.department_id = d.id
ORDER BY e.salary DESC;
```

**Expected Result:**
```
first_name  last_name  email                department    salary
Charlie     Brown      charlie@company.com  Engineering   95000.00
Bob         Johnson    bob@company.com      Engineering   90000.00
John        Doe        john@company.com     Engineering   85000.00
Diana       Prince     diana@company.com    Sales         80000.00
Jane        Smith      jane@company.com     Marketing     75000.00
Alice       Williams   alice@company.com    HR            70000.00
```

**Query 2: PostgreSQL-specific features (JSON)**

```sql
-- PostgreSQL supports JSON natively
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    price DECIMAL(10,2),
    metadata JSONB
);

INSERT INTO products (name, price, metadata) VALUES
    ('Laptop', 1200, '{"brand": "Dell", "ram": "16GB", "storage": "512GB SSD"}'),
    ('Mouse', 25, '{"brand": "Logitech", "wireless": true, "dpi": 4000}'),
    ('Keyboard', 75, '{"brand": "Corsair", "mechanical": true, "rgb": true}');

-- Query JSON data
SELECT name, price, metadata->>'brand' AS brand
FROM products;

-- Filter by JSON field
SELECT name, price
FROM products
WHERE metadata->>'brand' = 'Dell';
```

**Expected Result:**
```
name      price    brand
Laptop    1200.00  Dell
Mouse     25.00    Logitech
Keyboard  75.00    Corsair
```

**✅ PostgreSQL JSON support working!**


### Step 5: Test, Check, and Confirm - PostgreSQL

**Test 1: Verify Server Created**

1. Go to **"Azure Database for PostgreSQL flexible servers"**
2. Click on **"pgserver-day23-demo"**

**Expected Result:**
```
✅ Server name: pgserver-day23-demo.postgres.database.azure.com
✅ Status: Available
✅ PostgreSQL version: 16
✅ Compute tier: Burstable (B1ms)
✅ Location: East US
```

**Test 2: Verify Connection**

```bash
psql "host=pgserver-day23-demo.postgres.database.azure.com port=5432 dbname=appdb user=pgadmin sslmode=require" -c "SELECT version();"
```

**Expected Result:**
```
PostgreSQL 16.x on x86_64-pc-linux-gnu
✅ Connected successfully
```

**Test 3: Verify Tables**

```sql
\dt
```

**Expected Result:**
```
Schema  Name         Type   Owner
public  departments  table  pgadmin
public  employees    table  pgadmin
public  products     table  pgadmin
✅ 3 tables created
```

**Test 4: Verify Data**

```sql
SELECT COUNT(*) FROM departments;
SELECT COUNT(*) FROM employees;
SELECT COUNT(*) FROM products;
```

**Expected Result:**
```
departments: 4
employees: 6
products: 3
✅ All data present
```

**Test 5: Test Foreign Key Constraint**

```sql
-- Try inserting employee with invalid department
INSERT INTO employees (first_name, last_name, email, department_id, salary)
VALUES ('Test', 'User', 'test@company.com', 999, 50000);
```

**Expected Result:**
```
ERROR: insert or update on table "employees" violates foreign key constraint
✅ Foreign key constraint working correctly
```

**Test 6: Test Unique Constraint**

```sql
-- Try inserting duplicate email
INSERT INTO employees (first_name, last_name, email, department_id, salary)
VALUES ('Test', 'User', 'john@company.com', 1, 50000);
```

**Expected Result:**
```
ERROR: duplicate key value violates unique constraint "employees_email_key"
✅ Unique constraint working correctly
```

**Test 7: Check Server Parameters**

1. Go to server → **"Server parameters"** (under Settings)
2. Check key parameters:

**Expected Result:**
```
✅ max_connections: 50 (B1ms default)
✅ ssl: on
✅ timezone: UTC
```

**Test 8: Check Backups**

1. Go to server → **"Backup and restore"** (under Settings)

**Expected Result:**
```
✅ Backup retention: 7 days
✅ Automatic backups: Enabled
✅ Point-in-time restore: Available
```

**✅ Result**: PostgreSQL fully tested and working!

---

## Lab 3: Azure Database for MySQL

### What is Azure Database for MySQL?

**MySQL** = World's most popular open-source database.

**Why MySQL?**
- ✅ Most widely used database for web applications
- ✅ WordPress, Drupal, Joomla use MySQL
- ✅ Simple and fast
- ✅ Large community
- ✅ Compatible with MariaDB

**How it works:**

```
Your Application (WordPress, PHP, Node.js)
    ↓
Connection String: host=myserver.mysql.database.azure.com;database=mydb;...
    ↓
Azure MySQL Flexible Server
    ↓
MySQL Database
    ↓
Data stored on Azure managed storage
```

### Step 1: Create MySQL Flexible Server

1. Search for **"Azure Database for MySQL flexible servers"**
2. Click **"+ Create"**

**Basics Tab:**
- **Subscription**: Your subscription
- **Resource group**: `rg-database-lab`
- **Server name**: `mysqlserver-day23-demo` (must be globally unique)
- **Region**: `East US`
- **MySQL version**: `8.0`
- **Workload type**: `For development or hobby projects`

**Compute + storage:**
- Click **"Configure server"**
  - **Compute tier**: `Burstable`
  - **Compute size**: `Standard_B1ms` (1 vCore, 2 GB RAM)
  - **Storage size**: `20 GiB`
  - **Backup retention**: `7 days`
  - Click **"Save"**

**Authentication:**
- **Authentication method**: `MySQL authentication only`
- **Admin username**: `mysqladmin`
- **Password**: `P@ssw0rd2026!`

Click **"Next: Networking"**

**Networking Tab:**
- **Connectivity method**: `Public access (allowed IP addresses)`
- **Firewall rules:**
  - Check **"Allow public access from any Azure service within Azure to this server"**
  - Click **"+ Add current client IP address"**

Click **"Review + create"**

Click **"Create"**

**⏱️ Wait**: 5-10 minutes

**✅ Result**: MySQL server created!

### Step 2: Connect to MySQL

**Option 1: Azure Cloud Shell**

```bash
mysql -h mysqlserver-day23-demo.mysql.database.azure.com -u mysqladmin -p --ssl-mode=REQUIRED
```

Enter password when prompted.

**Option 2: MySQL Workbench (Desktop Tool)**

1. Download **MySQL Workbench** (https://dev.mysql.com/downloads/workbench/)
2. Add new connection:
   - **Hostname**: `mysqlserver-day23-demo.mysql.database.azure.com`
   - **Port**: `3306`
   - **Username**: `mysqladmin`
   - **Password**: `P@ssw0rd2026!`
   - **SSL**: `Required`

**✅ Result**: Connected to MySQL!

### Step 3: Create Database and Tables

```sql
-- Create database
CREATE DATABASE shopdb;

-- Use database
USE shopdb;

-- Create tables
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category_id INT,
    price DECIMAL(10,2) NOT NULL,
    stock INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(100),
    total_amount DECIMAL(10,2),
    status ENUM('pending', 'processing', 'shipped', 'delivered') DEFAULT 'pending',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert data
INSERT INTO categories (name, description) VALUES
    ('Electronics', 'Electronic devices and accessories'),
    ('Clothing', 'Apparel and fashion'),
    ('Books', 'Physical and digital books');

INSERT INTO products (name, category_id, price, stock) VALUES
    ('Laptop', 1, 1200.00, 15),
    ('Smartphone', 1, 800.00, 30),
    ('T-Shirt', 2, 25.00, 100),
    ('Jeans', 2, 60.00, 50),
    ('Python Book', 3, 45.00, 200),
    ('Azure Guide', 3, 55.00, 150);

INSERT INTO orders (customer_name, customer_email, total_amount, status) VALUES
    ('John Doe', 'john@email.com', 1225.00, 'delivered'),
    ('Jane Smith', 'jane@email.com', 85.00, 'shipped'),
    ('Bob Johnson', 'bob@email.com', 800.00, 'processing');
```

**✅ Result**: Database, tables, and data created!

### Step 4: Run Queries

**Query 1: Products with categories**

```sql
SELECT 
    p.name AS product,
    c.name AS category,
    p.price,
    p.stock
FROM products p
JOIN categories c ON p.category_id = c.id
ORDER BY p.price DESC;
```

**Expected Result:**
```
product       category      price     stock
Laptop        Electronics   1200.00   15
Smartphone    Electronics   800.00    30
Jeans         Clothing      60.00     50
Azure Guide   Books         55.00     150
Python Book   Books         45.00     200
T-Shirt       Clothing      25.00     100
```

**Query 2: Order summary**

```sql
SELECT 
    status,
    COUNT(*) AS order_count,
    SUM(total_amount) AS total_revenue
FROM orders
GROUP BY status;
```

**Expected Result:**
```
status       order_count  total_revenue
delivered    1            1225.00
processing   1            800.00
shipped      1            85.00
```

**Query 3: MySQL-specific ENUM usage**

```sql
-- Update order status
UPDATE orders SET status = 'delivered' WHERE id = 2;

-- Check status values
SELECT DISTINCT status FROM orders;
```

**✅ MySQL ENUM working!**

### Step 5: Test, Check, and Confirm - MySQL

**Test 1: Verify Server Created**

1. Go to **"Azure Database for MySQL flexible servers"**
2. Click on **"mysqlserver-day23-demo"**

**Expected Result:**
```
✅ Server name: mysqlserver-day23-demo.mysql.database.azure.com
✅ Status: Available
✅ MySQL version: 8.0
✅ Compute tier: Burstable (B1ms)
```

**Test 2: Verify Connection**

```bash
mysql -h mysqlserver-day23-demo.mysql.database.azure.com -u mysqladmin -p -e "SELECT VERSION();"
```

**Expected Result:**
```
VERSION()
8.0.x
✅ Connected successfully
```

**Test 3: Verify Database and Tables**

```sql
SHOW DATABASES;
USE shopdb;
SHOW TABLES;
```

**Expected Result:**
```
Databases: information_schema, mysql, performance_schema, shopdb, sys
Tables: categories, orders, products
✅ Database and tables present
```

**Test 4: Verify Data Integrity**

```sql
SELECT COUNT(*) FROM categories;
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM orders;
```

**Expected Result:**
```
categories: 3
products: 6
orders: 3
✅ All data present
```

**Test 5: Test Foreign Key**

```sql
-- Try invalid category
INSERT INTO products (name, category_id, price) VALUES ('Test', 999, 10.00);
```

**Expected Result:**
```
ERROR 1452: Cannot add or update a child row: a foreign key constraint fails
✅ Foreign key working
```

**Test 6: Check Server Parameters**

1. Go to server → **"Server parameters"**
2. Search for `max_connections`

**Expected Result:**
```
✅ max_connections: 151 (default)
✅ ssl: ON
✅ character_set_server: utf8mb4
```

**Test 7: Check Backups**

1. Go to server → **"Backup and restore"**

**Expected Result:**
```
✅ Backup retention: 7 days
✅ Automatic backups: Enabled
✅ Earliest restore point: Available
```

**✅ Result**: MySQL fully tested and working!

---

## Lab 4: Azure Cosmos DB (NoSQL)

### What is Azure Cosmos DB?

**Cosmos DB** = Globally distributed, multi-model NoSQL database.

**Why Cosmos DB?**
- ✅ Single-digit millisecond latency globally
- ✅ 99.999% availability SLA (highest in Azure)
- ✅ Automatic scaling
- ✅ Multiple APIs (SQL, MongoDB, Cassandra, Gremlin, Table)
- ✅ Schema-free (no fixed structure)

**How it works:**

```
Your Application
    ↓
Cosmos DB Account
    ↓
Database
    ↓
Container (like a table)
    ↓
Items (JSON documents)

Example Item:
{
    "id": "1",
    "name": "John Doe",
    "email": "john@email.com",
    "address": {
        "city": "Seattle",
        "state": "WA"
    },
    "tags": ["premium", "active"]
}
```

**Key Concepts:**

```
┌─────────────────────────────────────────────────────────────────┐
│  Cosmos DB Account                                               │
│  ├─ Database: "myapp"                                           │
│  │   ├─ Container: "users"                                      │
│  │   │   ├─ Partition Key: /country                             │
│  │   │   ├─ Item: {"id":"1", "name":"John", "country":"US"}    │
│  │   │   └─ Item: {"id":"2", "name":"Jane", "country":"UK"}    │
│  │   │                                                           │
│  │   └─ Container: "products"                                   │
│  │       ├─ Partition Key: /category                            │
│  │       ├─ Item: {"id":"1", "name":"Laptop", "category":"tech"}│
│  │       └─ Item: {"id":"2", "name":"Shirt", "category":"wear"}│
│  │                                                               │
│  └─ Throughput: 400 RU/s (Request Units per second)             │
└─────────────────────────────────────────────────────────────────┘
```

**Partition Key:**
- Determines how data is distributed
- Choose a property with many unique values
- Good: `/country`, `/category`, `/userId`
- Bad: `/status` (only few values like active/inactive)

### Step 1: Create Cosmos DB Account

1. Search for **"Azure Cosmos DB"**
2. Click **"+ Create"**
3. Select **"Azure Cosmos DB for NoSQL"** → Click **"Create"**

**Basics Tab:**
- **Subscription**: Your subscription
- **Resource group**: `rg-database-lab`
- **Account name**: `cosmosdb-day23-demo` (must be globally unique)
- **Location**: `East US`
- **Capacity mode**: `Serverless` (cheapest for lab, pay per request)

Click **"Next: Global Distribution"** (skip defaults)

Click **"Next: Networking"**

**Networking Tab:**
- **Connectivity method**: `All networks`

Click **"Review + create"**

Click **"Create"**

**⏱️ Wait**: 5-10 minutes

**✅ Result**: Cosmos DB account created!

### Step 2: Create Database and Container

1. Go to **"Azure Cosmos DB"** → **"cosmosdb-day23-demo"**
2. In left menu, click **"Data Explorer"**
3. Click **"New Container"**

**Add Container:**
- **Database id**: Create new: `appdb`
- **Container id**: `users`
- **Partition key**: `/country`

Click **"OK"**

**⏱️ Wait**: Few seconds

**✅ Result**: Database and container created!

### Step 3: Add Items (Documents)

1. In **Data Explorer**, expand **appdb** → **users**
2. Click **"Items"**
3. Click **"New Item"**

**Item 1:**
```json
{
    "id": "user-001",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@email.com",
    "country": "US",
    "age": 30,
    "address": {
        "city": "Seattle",
        "state": "WA",
        "zip": "98101"
    },
    "tags": ["premium", "active"],
    "createdAt": "2026-03-14T10:00:00Z"
}
```

Click **"Save"**

**Item 2:**
```json
{
    "id": "user-002",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@email.com",
    "country": "UK",
    "age": 25,
    "address": {
        "city": "London",
        "state": "England",
        "zip": "EC1A 1BB"
    },
    "tags": ["standard", "active"],
    "createdAt": "2026-03-14T10:05:00Z"
}
```

Click **"Save"**

**Item 3:**
```json
{
    "id": "user-003",
    "firstName": "Bob",
    "lastName": "Johnson",
    "email": "bob@email.com",
    "country": "US",
    "age": 35,
    "address": {
        "city": "New York",
        "state": "NY",
        "zip": "10001"
    },
    "tags": ["premium", "active"],
    "createdAt": "2026-03-14T10:10:00Z"
}
```

Click **"Save"**

**Item 4:**
```json
{
    "id": "user-004",
    "firstName": "Alice",
    "lastName": "Williams",
    "email": "alice@email.com",
    "country": "JP",
    "age": 28,
    "address": {
        "city": "Tokyo",
        "state": "Kanto",
        "zip": "100-0001"
    },
    "tags": ["standard", "new"],
    "createdAt": "2026-03-14T10:15:00Z"
}
```

Click **"Save"**

**✅ Result**: 4 items added!

### Step 4: Query Items

In **Data Explorer**, click **"New SQL Query"**

**Query 1: Get all items**

```sql
SELECT * FROM c
```

Click **"Execute Query"**

**Expected Result:** All 4 items returned

**Query 2: Filter by country**

```sql
SELECT c.firstName, c.lastName, c.email, c.country
FROM c
WHERE c.country = "US"
```

**Expected Result:**
```json
[
    {"firstName": "John", "lastName": "Doe", "email": "john@email.com", "country": "US"},
    {"firstName": "Bob", "lastName": "Johnson", "email": "bob@email.com", "country": "US"}
]
```

**✅ 2 US users returned!**

**Query 3: Filter by age**

```sql
SELECT c.firstName, c.lastName, c.age
FROM c
WHERE c.age > 28
ORDER BY c.age DESC
```

**Expected Result:**
```json
[
    {"firstName": "Bob", "lastName": "Johnson", "age": 35},
    {"firstName": "John", "lastName": "Doe", "age": 30}
]
```

**Query 4: Query nested objects**

```sql
SELECT c.firstName, c.address.city, c.address.state
FROM c
WHERE c.address.city = "Seattle"
```

**Expected Result:**
```json
[
    {"firstName": "John", "city": "Seattle", "state": "WA"}
]
```

**✅ Nested object query working!**

**Query 5: Query arrays**

```sql
SELECT c.firstName, c.tags
FROM c
WHERE ARRAY_CONTAINS(c.tags, "premium")
```

**Expected Result:**
```json
[
    {"firstName": "John", "tags": ["premium", "active"]},
    {"firstName": "Bob", "tags": ["premium", "active"]}
]
```

**✅ Array query working!**

**Query 6: Aggregate**

```sql
SELECT 
    c.country,
    COUNT(1) AS userCount,
    AVG(c.age) AS avgAge
FROM c
GROUP BY c.country
```

**Expected Result:**
```json
[
    {"country": "US", "userCount": 2, "avgAge": 32.5},
    {"country": "UK", "userCount": 1, "avgAge": 25},
    {"country": "JP", "userCount": 1, "avgAge": 28}
]
```

**✅ Aggregation working!**

### Step 5: Create Second Container (Products)

1. In **Data Explorer**, click **"New Container"**
2. **Database id**: Use existing: `appdb`
3. **Container id**: `products`
4. **Partition key**: `/category`
5. Click **"OK"**

Add items:

```json
{
    "id": "prod-001",
    "name": "Laptop Pro",
    "category": "electronics",
    "price": 1299.99,
    "specs": {
        "brand": "TechCorp",
        "ram": "16GB",
        "storage": "512GB SSD"
    },
    "inStock": true,
    "rating": 4.5
}
```

```json
{
    "id": "prod-002",
    "name": "Wireless Mouse",
    "category": "electronics",
    "price": 29.99,
    "specs": {
        "brand": "ClickMaster",
        "wireless": true,
        "dpi": 4000
    },
    "inStock": true,
    "rating": 4.2
}
```

```json
{
    "id": "prod-003",
    "name": "Azure DevOps Guide",
    "category": "books",
    "price": 49.99,
    "specs": {
        "author": "Cloud Expert",
        "pages": 450,
        "format": "paperback"
    },
    "inStock": true,
    "rating": 4.8
}
```

**✅ Result**: Products container with data!


### Step 6: Test, Check, and Confirm - Cosmos DB

**Test 1: Verify Account Created**

1. Go to **"Azure Cosmos DB"** → **"cosmosdb-day23-demo"**
2. Check **"Overview"**

**Expected Result:**
```
✅ Account name: cosmosdb-day23-demo
✅ API: NoSQL
✅ Status: Online
✅ Location: East US
✅ Capacity mode: Serverless
```

**Test 2: Verify Database and Containers**

1. In **Data Explorer**, expand tree

**Expected Result:**
```
appdb
├─ users (partition key: /country)
│  └─ Items: 4
└─ products (partition key: /category)
   └─ Items: 3

✅ 1 database, 2 containers
```

**Test 3: Verify Partition Key**

```sql
-- Query by partition key (fast - single partition)
SELECT * FROM c WHERE c.country = "US"
```

**Check Query Stats** (click "Query Stats" tab after running):

**Expected Result:**
```
✅ Request Charge: ~2.8 RU (low - efficient query)
✅ Documents returned: 2
✅ Query used partition key (single partition scan)
```

**Test 4: Cross-Partition Query**

```sql
-- Query without partition key (slower - cross partition)
SELECT * FROM c WHERE c.age > 25
```

**Check Query Stats:**

**Expected Result:**
```
✅ Request Charge: ~3.5 RU (slightly higher)
✅ Documents returned: 3
✅ Cross-partition query (scans all partitions)
```

**Test 5: Verify Item Structure**

1. Click on any item in Data Explorer
2. Check that all fields are present

**Expected Result:**
```
✅ id: Present
✅ firstName: Present
✅ country: Present (partition key)
✅ address: Nested object present
✅ tags: Array present
✅ _rid, _self, _etag, _ts: System properties present
```

**Test 6: Test Update Item**

1. Click on item `user-001`
2. Change `"age": 30` to `"age": 31`
3. Click **"Update"**
4. Query to verify:

```sql
SELECT c.firstName, c.age FROM c WHERE c.id = "user-001"
```

**Expected Result:**
```json
{"firstName": "John", "age": 31}
✅ Update successful
```

**Test 7: Test Delete Item**

1. Click on item `user-004`
2. Click **"Delete"**
3. Confirm deletion
4. Query to verify:

```sql
SELECT COUNT(1) AS total FROM c
```

**Expected Result:**
```json
{"total": 3}
✅ Item deleted (was 4, now 3)
```

**Test 8: Check Connection Strings**

1. Go to **"Keys"** (under Settings)
2. Note:
   - **URI**: `https://cosmosdb-day23-demo.documents.azure.com:443/`
   - **Primary Key**: Available
   - **Primary Connection String**: Available

**Expected Result:**
```
✅ URI accessible
✅ Keys available
✅ Connection strings generated
```

**Test 9: Test with Different Data Shapes**

Add item with completely different structure (schema-free):

```json
{
    "id": "user-005",
    "firstName": "Eve",
    "country": "DE",
    "age": 22,
    "hobbies": ["coding", "gaming", "reading"],
    "socialMedia": {
        "twitter": "@eve_dev",
        "github": "eve-codes"
    },
    "certifications": [
        {"name": "AZ-104", "year": 2025},
        {"name": "AZ-400", "year": 2026}
    ]
}
```

**Expected Result:**
```
✅ Item saved successfully
✅ Different structure from other items
✅ No schema migration needed
✅ This is the power of NoSQL!
```

**Test 10: Check Metrics**

1. Go to **"Metrics"** (under Monitoring)
2. Select metric: **"Total Request Units"**
3. View chart

**Expected Result:**
```
✅ Metrics available
✅ Shows RU consumption
✅ Low usage for lab
```

**✅ Result**: Cosmos DB fully tested and working!

---

## Lab 5: Azure Cache for Redis

### What is Azure Cache for Redis?

**Redis** = In-memory data store used as cache, message broker, and queue.

**Why Redis?**
- ✅ Extremely fast (sub-millisecond latency)
- ✅ Reduces database load
- ✅ Session management
- ✅ Real-time analytics
- ✅ Pub/Sub messaging

**How it works:**

```
Without Cache:
User → App → Database (slow, 50-200ms)
User → App → Database (same query again, still slow)

With Redis Cache:
User → App → Redis Cache (fast, <1ms) → Cache HIT → Return data
User → App → Redis Cache → Cache MISS → Database → Store in Redis → Return data
User → App → Redis Cache → Cache HIT → Return data (fast!)
```

**Visual:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    WITH REDIS CACHE                              │
│                                                                  │
│  Request 1: GET /api/products                                   │
│  ┌─────┐    ┌─────┐    ┌───────┐    ┌──────────┐              │
│  │ App │ →  │Redis│ →  │ MISS  │ →  │ Database │              │
│  └─────┘    └─────┘    └───────┘    └──────────┘              │
│                ↑                          │                     │
│                └──── Store result ────────┘                     │
│                      (cache for 5 min)                          │
│                                                                  │
│  Request 2: GET /api/products (within 5 min)                    │
│  ┌─────┐    ┌───────┐    ┌──────┐                              │
│  │ App │ →  │ Redis │ →  │ HIT! │ → Return cached data        │
│  └─────┘    └───────┘    └──────┘                              │
│              (< 1ms)      Database NOT called!                  │
│                                                                  │
│  Result: 100x faster response!                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Step 1: Create Azure Cache for Redis

1. Search for **"Azure Cache for Redis"**
2. Click **"+ Create"**

**Basics Tab:**
- **Subscription**: Your subscription
- **Resource group**: `rg-database-lab`
- **DNS name**: `redis-day23-demo` (must be globally unique)
- **Location**: `East US`
- **Cache SKU**: `Basic`
- **Cache size**: `C0 (250 MB)` (cheapest)

Click **"Next: Networking"**

**Networking Tab:**
- **Connectivity method**: `Public endpoint`

Click **"Next: Advanced"**

**Advanced Tab:**
- **Redis version**: `6`
- **Non-TLS port**: `Disabled` (security)

Click **"Review + create"**

Click **"Create"**

**⏱️ Wait**: 10-20 minutes (Redis takes longer to provision)

**✅ Result**: Redis cache created!

### Step 2: Get Connection Information

1. Go to **"Azure Cache for Redis"** → **"redis-day23-demo"**
2. In left menu, click **"Access keys"** (under Settings)
3. Note:
   - **Host name**: `redis-day23-demo.redis.cache.windows.net`
   - **Port**: `6380` (SSL)
   - **Primary key**: Copy this

**✅ Result**: Connection info ready!

### Step 3: Connect and Test with Console

1. Go to **"Azure Cache for Redis"** → **"redis-day23-demo"**
2. In left menu, click **"Console"** (under Overview section)
3. Redis console opens

**Command 1: Test connection**

```
PING
```

**Expected Result:**
```
PONG
✅ Connected!
```

**Command 2: Set and Get values**

```
SET greeting "Hello from Azure Redis!"
GET greeting
```

**Expected Result:**
```
OK
"Hello from Azure Redis!"
✅ String stored and retrieved!
```

**Command 3: Set with expiration**

```
SET session:user123 "John Doe" EX 300
GET session:user123
TTL session:user123
```

**Expected Result:**
```
OK
"John Doe"
(integer) 298
✅ Value expires in ~300 seconds (5 minutes)
```

**Command 4: Hash (like an object)**

```
HSET user:1 name "John Doe" email "john@email.com" age "30"
HGETALL user:1
HGET user:1 name
```

**Expected Result:**
```
(integer) 3
1) "name"
2) "John Doe"
3) "email"
4) "john@email.com"
5) "age"
6) "30"
"John Doe"
✅ Hash stored and retrieved!
```

**Command 5: List (like an array)**

```
RPUSH tasks "Buy groceries" "Write code" "Deploy app" "Review PR"
LRANGE tasks 0 -1
LLEN tasks
```

**Expected Result:**
```
(integer) 4
1) "Buy groceries"
2) "Write code"
3) "Deploy app"
4) "Review PR"
(integer) 4
✅ List with 4 items!
```

**Command 6: Set (unique values)**

```
SADD online_users "user1" "user2" "user3" "user1"
SMEMBERS online_users
SCARD online_users
```

**Expected Result:**
```
(integer) 3
1) "user1"
2) "user2"
3) "user3"
(integer) 3
✅ Set with 3 unique members (duplicate user1 ignored)
```

**Command 7: Sorted Set (leaderboard)**

```
ZADD leaderboard 100 "Alice" 85 "Bob" 95 "Charlie" 110 "Diana"
ZREVRANGE leaderboard 0 -1 WITHSCORES
ZRANK leaderboard "Charlie"
```

**Expected Result:**
```
1) "Diana"
2) "110"
3) "Alice"
4) "100"
5) "Charlie"
6) "95"
7) "Bob"
8) "85"
(integer) 1
✅ Sorted by score (leaderboard)!
```

**Command 8: Counter (atomic increment)**

```
SET page_views 0
INCR page_views
INCR page_views
INCR page_views
GET page_views
```

**Expected Result:**
```
OK
(integer) 1
(integer) 2
(integer) 3
"3"
✅ Atomic counter working!
```


### Step 4: Real-World Cache Patterns

**Pattern 1: Session Cache**

```
# Store user session (expires in 30 minutes)
SET session:abc123 '{"userId":"1","name":"John","role":"admin"}' EX 1800

# Get session
GET session:abc123

# Delete session (logout)
DEL session:abc123
```

**Pattern 2: API Response Cache**

```
# Cache API response (expires in 5 minutes)
SET cache:api:products '[{"id":1,"name":"Laptop"},{"id":2,"name":"Mouse"}]' EX 300

# Check if cached
EXISTS cache:api:products

# Get cached response
GET cache:api:products
```

**Pattern 3: Rate Limiting**

```
# Track API calls per user (reset every minute)
INCR ratelimit:user123
EXPIRE ratelimit:user123 60

# Check count
GET ratelimit:user123
# If > 100, reject request
```

### Step 5: Test, Check, and Confirm - Redis

**Test 1: Verify Cache Created**

1. Go to **"Azure Cache for Redis"** → **"redis-day23-demo"**
2. Check **"Overview"**

**Expected Result:**
```
✅ Name: redis-day23-demo
✅ Status: Running
✅ Host name: redis-day23-demo.redis.cache.windows.net
✅ SSL Port: 6380
✅ Redis version: 6
✅ SKU: Basic C0
```

**Test 2: Test PING**

In Redis Console:
```
PING
```

**Expected Result:**
```
PONG
✅ Redis responding
```

**Test 3: Test Data Persistence**

```
SET test_persist "This should persist"
GET test_persist
```

**Expected Result:**
```
"This should persist"
✅ Data stored
```

**Test 4: Test Expiration**

```
SET temp_key "I will expire" EX 10
GET temp_key
```

Wait 10 seconds:

```
GET temp_key
```

**Expected Result:**
```
First GET: "I will expire"
After 10 seconds: (nil)
✅ Expiration working correctly
```

**Test 5: Test Data Types**

```
# String
SET mystring "hello"
TYPE mystring

# Hash
HSET myhash field1 "value1"
TYPE myhash

# List
RPUSH mylist "item1"
TYPE mylist

# Set
SADD myset "member1"
TYPE myset

# Sorted Set
ZADD myzset 1 "member1"
TYPE myzset
```

**Expected Result:**
```
string
hash
list
set
zset
✅ All 5 data types working
```

**Test 6: Test Memory Usage**

```
INFO memory
```

**Expected Result:**
```
used_memory_human: ~1.5M
maxmemory_human: 250M
✅ Memory usage low
✅ 250 MB available
```

**Test 7: Test Key Operations**

```
# List all keys
KEYS *

# Count keys
DBSIZE

# Delete specific key
DEL temp_key

# Check if key exists
EXISTS greeting
```

**Expected Result:**
```
✅ Keys listed
✅ Key count correct
✅ Delete working
✅ EXISTS returns 1 (true) or 0 (false)
```

**Test 8: Check Metrics in Portal**

1. Go to **"Metrics"** (under Monitoring)
2. Select metric: **"Cache Hits"** and **"Cache Misses"**

**Expected Result:**
```
✅ Metrics available
✅ Cache hits showing
✅ Low latency (<1ms)
```

**Test 9: Test Connection String**

1. Go to **"Access keys"**
2. Copy **"Primary connection string (StackExchange.Redis)"**

**Format:**
```
redis-day23-demo.redis.cache.windows.net:6380,password=<key>,ssl=True,abortConnect=False
```

**Expected Result:**
```
✅ Connection string available
✅ SSL enabled
✅ Can use in application code
```

**Test 10: Performance Test**

```
# Set 100 keys
# (Run in Redis Console)
SET perf:1 "data1"
SET perf:2 "data2"
SET perf:3 "data3"
...

# Get keys
GET perf:1
GET perf:2
GET perf:3
```

**Expected Result:**
```
✅ Each operation: <1ms
✅ No errors
✅ Consistent performance
```

**✅ Result**: Redis Cache fully tested and working!

---

## Security & Best Practices

### Authentication Methods by Service

| Service | Auth Methods |
|---------|-------------|
| Azure SQL | SQL Auth, Azure AD |
| PostgreSQL | PostgreSQL Auth, Azure AD |
| MySQL | MySQL Auth, Azure AD |
| Cosmos DB | Keys, Azure AD, RBAC |
| Redis | Access Keys, Azure AD |

### Network Security

**For ALL database services:**

1. **Firewall Rules** (minimum)
   - Allow only specific IPs
   - Allow Azure services if needed

2. **Private Endpoints** (recommended for production)
   - Database accessible only from VNet
   - No public internet access
   - Uses Azure Private Link

3. **VNet Integration**
   - Database in your virtual network
   - No public IP

**Visual:**

```
Production Setup:
┌─────────────────────────────────────────────────────────────────┐
│  Azure Virtual Network                                           │
│  ┌──────────────────┐    ┌──────────────────┐                  │
│  │  App Subnet      │    │  Database Subnet │                  │
│  │  ┌────────────┐  │    │  ┌────────────┐  │                  │
│  │  │ App VM     │──│────│──│ Private    │  │                  │
│  │  │ or AKS     │  │    │  │ Endpoint   │  │                  │
│  │  └────────────┘  │    │  └──────┬─────┘  │                  │
│  └──────────────────┘    │         │         │                  │
│                          │  ┌──────┴─────┐  │                  │
│                          │  │ Database   │  │                  │
│                          │  │ (Private)  │  │                  │
│                          │  └────────────┘  │                  │
│                          └──────────────────┘                  │
│                                                                  │
│  ❌ No public internet access to database                       │
│  ✅ Only accessible from within VNet                            │
└─────────────────────────────────────────────────────────────────┘
```

### Encryption

**All Azure Database services provide:**
- ✅ Encryption at rest (AES-256)
- ✅ Encryption in transit (TLS/SSL)
- ✅ Transparent Data Encryption (TDE) for SQL
- ✅ Customer-managed keys (optional)

### Backup Best Practices

| Service | Auto Backup | Retention | Geo-Redundant |
|---------|-------------|-----------|---------------|
| Azure SQL | Yes | 7-35 days | Optional |
| PostgreSQL | Yes | 7-35 days | Optional |
| MySQL | Yes | 7-35 days | Optional |
| Cosmos DB | Yes | Continuous | Yes (multi-region) |
| Redis | Yes (Premium) | Configurable | No |

---

## Cost Optimization

### Cost Comparison (Approximate Monthly)

| Service | Cheapest Tier | Production Tier |
|---------|---------------|-----------------|
| Azure SQL | $5/month (Basic) | $75+/month (S1) |
| PostgreSQL | $13/month (B1ms) | $65+/month (GP) |
| MySQL | $13/month (B1ms) | $65+/month (GP) |
| Cosmos DB | $0 (Serverless, pay per use) | $24+/month (400 RU/s) |
| Redis | $16/month (C0 Basic) | $55+/month (C1 Standard) |

### Cost Saving Tips

**1. Use Serverless (Cosmos DB)**
- Pay only when queries run
- Perfect for dev/test
- No idle costs

**2. Use Burstable Tier (PostgreSQL/MySQL)**
- Cheapest compute option
- Good for low-traffic apps
- Can burst when needed

**3. Use Basic Tier (SQL/Redis)**
- Sufficient for development
- No SLA (dev/test only)
- Upgrade for production

**4. Reserved Capacity**
- Commit 1 or 3 years
- Save up to 65%
- Best for production workloads

**5. Right-Size Resources**
- Monitor DTU/vCore usage
- Scale down if underutilized
- Scale up only when needed

**6. Clean Up Unused Resources**
- Delete dev/test databases
- Stop servers when not in use (PostgreSQL/MySQL)
- Use automation for start/stop

---

## Summary

### What We Learned

```
┌─────────────────────────────────────────────────────────────────┐
│  Azure Database Services                                         │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐                   │
│  │ Azure SQL        │  │ PostgreSQL       │                   │
│  │ Enterprise       │  │ Open Source      │                   │
│  │ T-SQL            │  │ Advanced SQL     │                   │
│  │ .NET apps        │  │ Python/Node apps │                   │
│  └──────────────────┘  └──────────────────┘                   │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐                   │
│  │ MySQL            │  │ Cosmos DB        │                   │
│  │ Web Apps         │  │ NoSQL/Global     │                   │
│  │ WordPress/PHP    │  │ JSON Documents   │                   │
│  │ Simple & Fast    │  │ Multi-region     │                   │
│  └──────────────────┘  └──────────────────┘                   │
│                                                                  │
│  ┌──────────────────┐                                          │
│  │ Redis Cache      │                                          │
│  │ In-Memory        │                                          │
│  │ Sub-ms latency   │                                          │
│  │ Session/Cache    │                                          │
│  └──────────────────┘                                          │
└─────────────────────────────────────────────────────────────────┘
```

### Labs Completed

- ✅ Lab 1: Azure SQL Database (created tables, queries, sample data)
- ✅ Lab 2: PostgreSQL (JSON support, foreign keys, constraints)
- ✅ Lab 3: MySQL (e-commerce schema, ENUM types, joins)
- ✅ Lab 4: Cosmos DB (NoSQL documents, partition keys, array queries)
- ✅ Lab 5: Redis Cache (strings, hashes, lists, sets, sorted sets, expiration)

---

## Cleanup (Optional)

**To avoid charges, delete all resources:**

### Delete Individual Resources

```bash
# Delete SQL Database
az sql db delete --resource-group rg-database-lab --server sqlserver-day23-demo --name myappdb --yes

# Delete SQL Server
az sql server delete --resource-group rg-database-lab --name sqlserver-day23-demo --yes

# Delete PostgreSQL
az postgres flexible-server delete --resource-group rg-database-lab --name pgserver-day23-demo --yes

# Delete MySQL
az mysql flexible-server delete --resource-group rg-database-lab --name mysqlserver-day23-demo --yes

# Delete Cosmos DB
az cosmosdb delete --resource-group rg-database-lab --name cosmosdb-day23-demo --yes

# Delete Redis
az redis delete --resource-group rg-database-lab --name redis-day23-demo --yes
```

### Delete Resource Group (Deletes Everything)

1. Go to **"Resource groups"**
2. Select **"rg-database-lab"**
3. Click **"Delete resource group"**
4. Type resource group name to confirm
5. Click **"Delete"**

**⏱️ Wait**: 10-15 minutes

**✅ Result**: All database resources deleted!

---

## Quick Reference

### Connection Strings

**Azure SQL:**
```
Server=tcp:sqlserver-day23-demo.database.windows.net,1433;
Database=myappdb;User ID=sqladmin;Password={password};
Encrypt=True;TrustServerCertificate=False;
```

**PostgreSQL:**
```
host=pgserver-day23-demo.postgres.database.azure.com
port=5432 dbname=appdb user=pgadmin
password={password} sslmode=require
```

**MySQL:**
```
Server=mysqlserver-day23-demo.mysql.database.azure.com;
Port=3306;Database=shopdb;Uid=mysqladmin;
Pwd={password};SslMode=Required;
```

**Cosmos DB:**
```
AccountEndpoint=https://cosmosdb-day23-demo.documents.azure.com:443/;
AccountKey={key};
```

**Redis:**
```
redis-day23-demo.redis.cache.windows.net:6380,
password={key},ssl=True,abortConnect=False
```

### Default Ports

| Service | Port |
|---------|------|
| Azure SQL | 1433 |
| PostgreSQL | 5432 |
| MySQL | 3306 |
| Cosmos DB | 443 (HTTPS) |
| Redis | 6380 (SSL) |

### Useful Links

- [Azure SQL Documentation](https://docs.microsoft.com/azure/azure-sql/)
- [Azure PostgreSQL Documentation](https://docs.microsoft.com/azure/postgresql/)
- [Azure MySQL Documentation](https://docs.microsoft.com/azure/mysql/)
- [Azure Cosmos DB Documentation](https://docs.microsoft.com/azure/cosmos-db/)
- [Azure Cache for Redis Documentation](https://docs.microsoft.com/azure/azure-cache-for-redis/)

---

**🎉 Congratulations!** You've completed the comprehensive Azure Database guide covering all major database services!

