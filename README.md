# Azure DevOps - 34 Day Learning Path

A comprehensive, hands-on guide to learning Azure DevOps from scratch. Each day includes theory (what, why, how) and practical labs.

## Overview

This learning path takes you from Azure DevOps basics to advanced CI/CD patterns in 34 days. Each day builds on the previous, with real-world labs and best practices.

## Prerequisites

- Microsoft/Azure account
- Basic understanding of Git
- Command line familiarity
- Text editor or IDE

## Learning Path

### Week 1: Foundations

- **[Day 1: Introduction to Azure DevOps](day-01-introduction.md)**
  - What is Azure DevOps?
  - Create organization and project
  - Explore the interface

- **[Day 2: Azure Boards](day-02-azure-boards.md)**
  - Work item tracking
  - Kanban boards
  - Agile planning

- **[Day 3: Azure Repos](day-03-azure-repos.md)**
  - Git version control
  - Branches and pull requests
  - Branch policies

- **[Day 4: Azure Pipelines - CI](day-04-azure-pipelines-ci.md)**
  - Continuous Integration
  - YAML pipelines
  - Automated builds and tests

- **[Day 5: Azure Pipelines - CD](day-05-azure-pipelines-cd.md)**
  - Continuous Deployment
  - Multi-stage pipelines
  - Environment approvals

### Week 2: Advanced Topics

- **[Day 6: Testing Strategies](day-06-testing-strategies.md)**
  - Unit and integration testing
  - Test automation
  - Code coverage

- **[Day 7: Azure Artifacts](day-07-azure-artifacts.md)**
  - Package management
  - Creating and publishing packages
  - Upstream sources

- **[Day 8: Security & Compliance](day-08-security-compliance.md)**
  - DevSecOps practices
  - Secret management
  - Vulnerability scanning

- **[Day 9: Monitoring & Feedback](day-09-monitoring-feedback.md)**
  - Application monitoring
  - DORA metrics
  - Continuous improvement

- **[Day 10: Advanced Topics](day-10-advanced-topics.md)**
  - Pipeline templates
  - Infrastructure as Code
  - GitOps patterns

### Week 3: Enterprise Deployment

- **[Day 11: Orchestration & Release Strategies](day-11-orchestration-release-strategies.md)** ⭐
  - Blue-Green deployment
  - Canary releases
  - VM deployment with full code
  - Automated rollback
  - Production-ready orchestration

- **[Day 12: Branching Strategies](day-12-branching-strategies.md)** ⭐
  - Git Flow (feature, develop, release, hotfix)
  - GitHub Flow (simple, continuous)
  - Trunk-Based Development (high frequency)
  - GitLab Flow (environment branches)
  - Release Flow (enterprise support)
  - Complete hands-on labs for each strategy

- **[Day 13: AKS Deployment with AGIC - CLI](day-13-aks-deployment-agic.md)** ⭐
  - Deploy Hello World API to Azure Kubernetes Service
  - Configure Application Gateway Ingress Controller (Internal)
  - Expose internal API publicly for mobile apps
  - Azure Front Door with Private Link
  - SSL/TLS configuration and DNS setup
  - API key authentication and rate limiting
  - Complete security implementation
  - Mobile developer documentation
  - **All via Azure CLI commands**

- **[Day 14: AKS Deployment with AGIC - Portal](day-14-aks-deployment-agic-portal.md)** ⭐
  - Same as Day 13 but using Azure Portal (GUI)
  - Step-by-step Portal navigation
  - Visual configuration walkthrough
  - Internal AGIC → Front Door → Public access
  - Perfect for learning and understanding
  - **All via Azure Portal interface**

### Week 4: API Gateway & Load Balancing

- **[Day 15: API Management with AKS - Portal](day-15-apim-aks-portal.md)** ⭐
  - Azure API Management integration with AKS
  - Internal AKS with private APIM
  - API policies and transformations
  - Rate limiting and caching
  - Developer portal configuration
  - **All via Azure Portal**

- **[Day 16: AKS with APIM Integration - Portal](day-16-aks-apim-integration-portal.md)** ⭐
  - Complete APIM + AKS integration
  - Virtual network integration
  - Private endpoint configuration
  - API versioning and revisions
  - OAuth 2.0 authentication
  - **Production-ready setup**

- **[Day 17: Traefik API Gateway with JWT](day-17-traefik-api-gateway-jwt.md)** ⭐
  - Traefik as Kubernetes Ingress Controller
  - JWT authentication and validation
  - Middleware configuration
  - TLS/SSL termination
  - Rate limiting and circuit breaker
  - **Complete security implementation**

- **[Day 18: Application Gateway - Path & Host Based Routing](day-18-application-gateway.md)** ⭐
  - Azure Application Gateway fundamentals
  - Path-based routing (`/api`, `/web`)
  - Host-based routing (multiple domains)
  - Health probes and backend pools
  - 4 VMs with nginx deployment
  - **Complete testing and verification**

- **[Day 19: Application Gateway - URL Rewrite & Wildcard](day-19-appgw-url-rewrite.md)** ⭐
  - URL rewrite rules (multiple paths to same backend)
  - Path-based routing with rewrites
  - Wildcard host routing (`*.domain.com`)
  - Multiple/Wildcard host type usage
  - Priority-based routing
  - **Production-ready patterns**

- **[Day 20: Production Application Gateway with HTTPS](day-20-appgw-production-https.md)** ⭐
  - Complete production setup from scratch
  - Domain purchase and Azure DNS configuration
  - SSL certificates with Let's Encrypt (Certbot)
  - Wildcard certificate generation
  - End-to-end HTTPS setup
  - HTTP to HTTPS redirect
  - Certificate renewal process
  - **Real-world production deployment**

- **[Day 21: Azure Storage - Complete Guide](day-21-azure-storage.md)** ⭐
  - All Azure Storage services (Blob, File, Queue, Table, Disk)
  - Storage account types and redundancy
  - Access tiers and lifecycle management
  - SMB file shares (Windows/Linux mounting)
  - Message queues for async processing
  - NoSQL Table Storage
  - Managed disks for VMs
  - Security, RBAC, and cost optimization
  - **Complete hands-on labs via Portal**

- **[Day 22: AKS with Traefik Ingress & Authentication](day-22-aks-traefik-auth.md)** ⭐
  - Complete Flask REST API application
  - Docker containerization and ACR
  - AKS cluster deployment
  - Traefik as public ingress controller
  - BasicAuth authentication middleware
  - Public and protected endpoints
  - Load balancing across pods
  - Production-ready security pattern
  - **Real-world application with full code**

### Week 5: Data & Database Services

- **[Day 23: Azure Database Services - Complete Guide](day-23-azure-database.md)** ⭐
  - Azure SQL Database (T-SQL, sample data, queries)
  - Azure Database for PostgreSQL (JSON, constraints)
  - Azure Database for MySQL (e-commerce schema)
  - Azure Cosmos DB NoSQL (documents, partition keys)
  - Azure Cache for Redis (caching, sessions, leaderboards)
  - Security, networking, and cost optimization
  - **Complete hands-on labs via Portal**

- **[Day 23 Part 2: Azure Database - Advanced Topics](day-23-part2-azure-database-advanced.md)** ⭐
  - Azure SQL HA & DR (RPO/RTO explained)
  - Active Geo-Replication (cross-region)
  - Failover Groups (automatic DNS failover)
  - SQL Managed Instance (lift-and-shift)
  - SQL Server on Azure VMs (full IaaS)
  - Cosmos DB Global Distribution & Consistency
  - Azure Databricks (Spark, notebooks, Delta Lake)
  - **Complete decision matrix for choosing services**

### Week 6: Backup, Recovery & Networking

- **[Day 25: Azure Backup - Complete Guide](day-25-azure-backup.md)** ⭐
  - Recovery Services Vault and Backup Vault
  - VM Backup (full VM protection + restore)
  - Azure File Share Backup (snapshot-based)
  - Azure Blob Backup (operational, point-in-time)
  - Azure SQL Database Backup (auto + LTR)
  - Managed Disk Backup (incremental snapshots)
  - File Recovery (individual files from VM backup)
  - Recovery Services Vault deep dive (soft delete, CRR, RBAC)
  - Backup Center (monitor everything)
  - **Complete backup + restore labs via Portal**

- **[Day 26: Azure VPN - Point-to-Site & Site-to-Site](day-26-azure-vpn.md)** ⭐ NEW
  - What is VPN and why use it
  - Point-to-Site VPN (laptop → Azure via certificate auth)
  - Site-to-Site VPN (office network → Azure via shared key)
  - VNet-to-VNet VPN (Azure ↔ Azure)
  - VPN Gateway setup and SKU selection
  - Certificate generation (Windows + Linux/Mac)
  - Complete connectivity testing (ping, SSH, HTTP via private IP)
  - VNet Peering vs VPN comparison
  - **Real-world production patterns and troubleshooting**

### Week 7: Infrastructure as Code

- **[Day 27: Azure Templates (ARM & Bicep)](day-27-azure-templates.md)** ⭐
  - What are ARM Templates and Bicep (and why they exist)
  - Template structure (parameters, variables, resources, outputs)
  - Deploy Storage, VNet with NSGs, complete VM from templates
  - Bicep syntax (cleaner, auto-dependencies, modules)
  - Parameter files for multi-environment deployments
  - Export templates from existing resources
  - Template Specs, Quickstart Templates, Portal deployment
  - ARM functions cheat sheet
  - **Complete hands-on labs with test/check/confirm**

- **[Day 28: Azure Policy - Governance & Compliance](day-28-azure-policy.md)** ⭐
  - What is Azure Policy and how it works
  - Policy vs RBAC (different things!)
  - Policy effects (Deny, Audit, Modify, Append, DeployIfNotExists)
  - Built-in policies (Allowed locations, Require tags)
  - Custom policies (Restrict VM sizes)
  - Policy initiatives (group policies together)
  - Remediation (auto-fix existing resources)
  - Compliance dashboard and reporting
  - **Real-world governance patterns**

- **[Day 29: Moving Resources Between Resource Groups](day-29-moving-resources.md)** ⭐
  - What is resource moving and why do it
  - Move Storage Account, VNet, VM with dependencies
  - Cross-resource-group references (resources in different RGs)
  - Move between subscriptions
  - What CAN and CANNOT be moved
  - Resource locks blocking moves
  - Validation before moving (dry run)
  - **Complete move checklist and troubleshooting**

### Week 8: Advanced Networking & Messaging

- **[Day 30: VNet Peering & Gateway Transit](day-30-vnet-peering.md)** ⭐
  - What is VNet Peering and why use it
  - VNet Peering vs VPN Gateway comparison
  - Same-region peering (full mesh, 3 VNets)
  - Peering is NOT transitive (proven with lab)
  - Global peering (cross-region, East US ↔ West Europe)
  - Gateway Transit (Hub-and-Spoke topology)
  - Share VPN Gateway across peered VNets
  - **Complete connectivity testing with 4 VNets and 4 VMs**

- **[Day 31: Azure Service Bus - Enterprise Messaging](day-31-service-bus.md)** ⭐
  - What is Service Bus and why use it
  - Queues (one sender → one receiver, Portal + Python)
  - Topics & Subscriptions (one sender → many receivers)
  - SQL Filters (route messages by properties)
  - Dead-Letter Queue (handle failed messages)
  - Scheduled messages and sessions
  - Service Bus vs Storage Queue vs Event Grid
  - **Complete hands-on labs with real code**

- **[Day 32: Azure Load Balancer - Every Scenario](day-32-load-balancer.md)** ⭐ NEW
  - What is Load Balancer and all components explained
  - Same VNet, Same Subnet (standard setup)
  - Same VNet, Different Subnets (cross-subnet)
  - Same Region, Different VNets (IP-based + peering)
  - Different Regions (Cross-Region Global LB)
  - Internal Load Balancer (private IP only)
  - Complete "Can I?" matrix for every scenario
  - LB vs App Gateway vs Front Door comparison
  - **Every scenario tested with health probes and failover**

### Week 9: Production Architecture

- **[Day 33: AKS Internal API → Public Access for Mobile](day-33-aks-internal-to-public.md)** ⭐
  - Deploy app on AKS with Internal AGIC (private IP)
  - 5 methods to expose internal API publicly (comparison)
  - Method 1: Azure Front Door + Private Link
  - Method 2: Azure APIM (subscription keys, rate limiting)
  - Method 3: Public App Gateway in front of Internal AGIC
  - API Key authentication (X-API-Key header)
  - Mobile team documentation (iOS, Android, React Native)
  - Authentication method comparison (API Key, JWT, OAuth2, mTLS)
  - **Real-world production security architecture**

- **[Day 34: AI-Powered DevOps in Microsoft-Only Company](day-34-ai-devops-microsoft.md)** ⭐
  - Complete Microsoft AI ecosystem map for DevOps
  - GitHub Copilot (IDE AI assistant, autocomplete, chat)
  - GitHub Copilot Agent Mode (agentic multi-file coding)
  - Microsoft Copilot in Azure Portal (operations AI)
  - Azure OpenAI Service (build custom AI tools)
  - GitHub Copilot CLI (terminal AI)
  - AI in Azure DevOps pipelines
  - Copilot vs Kiro comparison
  - How to propose AI to your company (ROI, security, compliance)
  - **Every method compared with decision guide**

- **[Day 35: Azure Repos → Docker → ACR → VM (CI/CD Pipeline)](day-35-azure-repo-devops-docker-acr-vm.md)** ⭐
  - Create Azure DevOps Organization & Project (step by step)
  - Create Azure Repos and push code
  - Create Agent Pool & Self-Hosted Runner (full setup)
  - Microsoft-Hosted vs Self-Hosted agents explained
  - Create ACR, Deploy VM, install Docker
  - Service connections (Docker Registry, SSH)
  - Complete 2-stage pipeline (Build+Push → Deploy)
  - Auto-deploy on git push
  - **Every step with test, check, and confirm**

### Week 10: Security & Networking Deep Dive

- **[Day 36: Azure Endpoints - Private & Service Endpoints](day-36-endpoints.md)** ⭐
  - What is an Endpoint (simple explanation)
  - Service Endpoint vs Private Endpoint (comparison)
  - Service Endpoint lab (Storage, free, Azure backbone)
  - Private Endpoint lab (Storage, private IP in VNet)
  - Private Endpoint lab (Azure SQL, private access)
  - Private DNS Zones (how name resolution works)
  - Full lockdown (disable public access completely)
  - When to use which (decision guide)
  - **Complete labs with DNS verification and access testing**

- **[Day 37: Azure Monitoring & Alerts](day-37-monitoring-alerts.md)** ⭐
  - What is Azure Monitor (metrics, logs, traces)
  - Metrics Explorer (CPU, memory, disk, network charts)
  - Action Groups (email, SMS, webhook notifications)
  - Metric Alerts (CPU > 80% triggers email)
  - Stress test to trigger alert and verify notification
  - Log Analytics Workspace & Diagnostic Settings
  - KQL queries (Heartbeat, CPU, Memory, Disk)
  - Log-based alerts (KQL query alerts)
  - Custom monitoring dashboard
  - **Complete alert lifecycle: fire → notify → resolve**

- **[Day 38: 3 Apps on 1 VM + Nginx + Application Gateway](day-38-multi-app-single-vm-appgw.md)** ⭐
  - 3 Docker containers (web1, web2, web3) on single VM
  - Nginx reverse proxy (route by domain name)
  - Application Gateway with host-based routing (multi-site)
  - DNS: web1/web2/web3.maharuat.com → same AppGW IP
  - Docker Compose for container management
  - Container failure testing (stop one, others still work)
  - 3 DNS options (Azure DNS, external, hosts file)
  - **Complete end-to-end: Browser → DNS → AppGW → Nginx → Docker**

### Week 11: Streaming & Events

- **[Day 39: Kafka on Azure (Event Hubs)](day-39-kafka-azure.md)** ⭐
  - What is Kafka and all concepts explained
  - Azure Event Hubs with Kafka protocol (managed Kafka)
  - Kafka vs Service Bus vs Event Grid comparison
  - Produce messages with Python (confluent-kafka)
  - Consume messages with Python (real-time streaming)
  - Consumer Groups (multiple independent readers)
  - Partitions (parallel processing, key-based ordering)
  - Kafka ↔ Event Hubs term mapping
  - **Complete producer/consumer labs with real code**

- **[Day 39 Part 2: Self-Managed Kafka on VMs](day-39-part2-kafka-self-managed.md)** ⭐
  - Install Java, ZooKeeper, and Kafka on Azure VM
  - Kafka CLI tools (topics, producer, consumer, groups)
  - Produce and consume with Python
  - 3-broker cluster setup (3 VMs)
  - Replicated topics (replication-factor 2)
  - Failover testing (kill broker, verify no data loss)
  - Broker recovery (restart, auto-resync)
  - **Complete cluster with replication and failover**

### Week 12: Security & Secrets

- **[Day 40: Azure Key Vault - Secrets, Keys & Certificates](day-40-azure-key-vault.md)** ⭐
  - What is Key Vault and why use it (vs secrets in code)
  - Store and retrieve secrets (Portal + CLI)
  - Secret versions and rotation
  - Managed Identity (VM accesses Key Vault, no passwords!)
  - Python SDK (DefaultAzureCredential)
  - Encryption keys (RSA 2048)
  - SSL/TLS certificates (self-signed, auto-renew)
  - Key Vault in Azure DevOps Pipeline (AzureKeyVault@2)
  - Soft delete and recovery
  - RBAC roles for Key Vault
  - **Complete labs with 5 access methods**

- **[Day 40 Part 2: Key Vault + AKS (CSI Driver)](day-40-part2-keyvault-aks.md)** ⭐
  - AKS with Secrets Store CSI Driver
  - Workload Identity (pod authenticates to Key Vault)
  - SecretProviderClass (define which secrets to fetch)
  - Deploy app that reads secrets from /mnt/secrets/
  - Auto-refresh when secrets change in Key Vault
  - Zero secrets in YAML, code, or environment variables
  - **Complete end-to-end demo with verification**

- **[Day 40 Part 3: Key Vault with Private Endpoint](day-40-part3-keyvault-private-endpoint.md)** ⭐ NEW
  - Why Private Endpoint for Key Vault (production security)
  - Create Private Endpoint via Portal (step by step)
  - Private DNS Zone (privatelink.vaultcore.azure.net)
  - Disable public access completely
  - Access from VM via private IP (10.0.2.x)
  - AKS in same VNet accessing Key Vault privately
  - **Full lockdown: internet blocked, VNet only**

### Bonus Labs

- **[Day 24: AKS with HashiCorp Vault](day-24-aks-hashicorp-vault.md)** ⭐
  - What is HashiCorp Vault and why use it
  - Kubernetes Secrets vs Vault comparison
  - Install Vault on AKS with Helm
  - Store secrets (DB passwords, API keys)
  - Vault Agent Injector sidecar pattern
  - Deploy Flask app with Vault-injected secrets
  - Secret rotation and auto-refresh
  - Complete troubleshooting guide
  - **Real-world production patterns**

- **[Day 35: Azure Repos, Azure DevOps - Docker Build & ACR Deploy to VM](day-35-azure-repo-devops-docker-acr-vm.md)** ⭐
  - Create simple Hello World Node.js app
  - Containerize with Docker
  - Push code to Azure Repos
  - Azure DevOps pipeline to build and push to ACR
  - Deploy container to Azure VM via SSH
  - Complete CI/CD workflow
  - **Step-by-step with full automation**

## How to Use This Guide

1. **Follow sequentially**: Each day builds on previous knowledge
2. **Complete all labs**: Hands-on practice is essential
3. **Take notes**: Document your learnings
4. **Experiment**: Try variations of the labs
5. **Review**: Revisit concepts as needed

## What You'll Build

Throughout this course, you'll build:
- A complete CI/CD pipeline
- Automated testing framework
- Package management system
- Security scanning pipeline
- Monitoring dashboard
- Kubernetes deployments with multiple ingress controllers
- Application Gateway with advanced routing
- Production HTTPS setup with Let's Encrypt
- Multi-domain hosting with wildcard certificates
- Complete Azure Storage solutions (Blob, File, Queue, Table, Disk)
- Real-world REST API with authentication and load balancing
- HashiCorp Vault secret management on AKS
- Complete backup and disaster recovery solutions
- Secure VPN connections (Point-to-Site, Site-to-Site)
- Infrastructure as Code with ARM Templates and Bicep
- Azure Policy governance and compliance enforcement
- VNet Peering and Hub-and-Spoke network topologies
- Enterprise messaging with Azure Service Bus

## Time Commitment

- **Theory**: 30-45 minutes per day
- **Labs**: 1-2 hours per day
- **Total**: ~2-3 hours per day

## Tips for Success

- Set up a dedicated learning environment
- Complete labs in order
- Don't skip the verification steps
- Join Azure DevOps community forums
- Practice with real projects

## Additional Resources

- [Azure DevOps Documentation](https://docs.microsoft.com/azure/devops)
- [Azure DevOps Labs](https://azuredevopslabs.com)
- [Microsoft Learn](https://docs.microsoft.com/learn/azure/devops)
- [Azure DevOps Blog](https://devblogs.microsoft.com/devops)

## Certification Path

After completing this course, consider:
- AZ-400: Designing and Implementing Microsoft DevOps Solutions
- GitHub Actions certification
- Kubernetes certifications (CKA, CKAD)

## Contributing

Found an issue or want to improve the content? Feel free to contribute!

## License

This learning material is provided for educational purposes.

---

**Ready to start?** Begin with [Day 1: Introduction to Azure DevOps](day-01-introduction.md)

Good luck on your Azure DevOps journey! 🚀
