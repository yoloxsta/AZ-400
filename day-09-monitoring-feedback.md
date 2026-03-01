# Day 9: Monitoring & Feedback Loops

## What is Monitoring in DevOps?

Monitoring tracks application performance, errors, and user behavior to provide feedback for continuous improvement.

## Why Monitor?

- Detect issues before users report them
- Understand application performance
- Track deployment success
- Measure business metrics
- Enable data-driven decisions

## Monitoring Types

1. **Infrastructure**: CPU, memory, disk
2. **Application**: Response time, errors
3. **Business**: User actions, conversions
4. **Logs**: Application and system logs

## Lab 9: Implement Monitoring & Feedback

### Part 1: Application Insights (Conceptual)

1. **What to Monitor**
   - Request rates and response times
   - Failure rates
   - Exceptions
   - Custom events
   - User sessions

2. **Add Logging to Application**
   Create `logger.js`:
   ```javascript
   class Logger {
     constructor(environment) {
       this.environment = environment;
     }
     
     info(message, data = {}) {
       console.log(JSON.stringify({
         level: 'INFO',
         timestamp: new Date().toISOString(),
         environment: this.environment,
         message,
         data
       }));
     }
     
     error(message, error = {}) {
       console.error(JSON.stringify({
         level: 'ERROR',
         timestamp: new Date().toISOString(),
         environment: this.environment,
         message,
         error: {
           message: error.message,
           stack: error.stack
         }
       }));
     }
     
     metric(name, value, tags = {}) {
       console.log(JSON.stringify({
         type: 'METRIC',
         timestamp: new Date().toISOString(),
         name,
         value,
         tags
       }));
     }
   }
   
   module.exports = Logger;
   ```

3. **Use Logger in Application**
   Update `server.js`:
   ```javascript
   const Logger = require('./logger');
   const logger = new Logger(process.env.ENVIRONMENT || 'development');
   
   const server = http.createServer((req, res) => {
     const startTime = Date.now();
     
     logger.info('Request received', {
       method: req.method,
       url: req.url,
       userAgent: req.headers['user-agent']
     });
     
     // ... handle request ...
     
     const duration = Date.now() - startTime;
     logger.metric('request_duration', duration, {
       endpoint: req.url,
       method: req.method
     });
   });
   ```

### Part 2: Pipeline Monitoring

1. **Add Health Check to Pipeline**
   ```yaml
   - stage: HealthCheck
     displayName: 'Post-Deployment Health Check'
     dependsOn: DeployProduction
     jobs:
     - job: HealthCheckJob
       pool:
         vmImage: 'ubuntu-latest'
       steps:
       - script: |
           echo "Checking application health..."
           # Simulate health check
           response=$(curl -s -o /dev/null -w "%{http_code}" http://your-app/health)
           if [ $response -eq 200 ]; then
             echo "Health check passed"
             exit 0
           else
             echo "Health check failed with status $response"
             exit 1
           fi
         displayName: 'Health check'
   ```

2. **Add Performance Testing**
   ```yaml
   - script: |
       npm install -g artillery
       artillery quick --count 10 --num 100 http://your-app
     displayName: 'Load test'
   ```

### Part 3: Deployment Tracking

1. **Create Deployment Annotations**
   ```yaml
   - script: |
       echo "Recording deployment..."
       echo "Version: $(Build.BuildNumber)"
       echo "Deployed by: $(Build.RequestedFor)"
       echo "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
     displayName: 'Record deployment metadata'
   ```

2. **Track Deployment Metrics**
   Create `deployment-metrics.js`:
   ```javascript
   const metrics = {
     deploymentFrequency: 0,
     leadTime: 0,
     mttr: 0, // Mean Time To Recovery
     changeFailureRate: 0
   };
   
   function recordDeployment(success, duration) {
     metrics.deploymentFrequency++;
     metrics.leadTime += duration;
     if (!success) {
       metrics.changeFailureRate++;
     }
   }
   
   module.exports = { metrics, recordDeployment };
   ```

### Part 4: Feedback Mechanisms

1. **Create Feedback Work Item Template**
   - Go to Boards → Work items
   - Create custom work item type: "Feedback"
   - Fields:
     - Source (User, Monitoring, Pipeline)
     - Severity
     - Environment
     - Description

2. **Automated Issue Creation**
   ```yaml
   - task: CreateWorkItem@1
     condition: failed()
     inputs:
       workItemType: 'Bug'
       title: 'Pipeline failure: $(Build.DefinitionName)'
       assignedTo: '$(Build.RequestedFor)'
       fieldMappings: |
         Description=Pipeline $(Build.BuildNumber) failed
         System.Tags=automated;pipeline-failure
   ```

3. **Notification Rules**
   - Project Settings → Notifications
   - Create subscription:
     - "A build fails"
     - "A deployment to production completes"
     - Send to: Team email/Slack

### Part 5: Dashboard Creation

1. **Create Dashboard**
   - Go to Overview → Dashboards
   - Click "New Dashboard"
   - Name: "DevOps Metrics"

2. **Add Widgets**
   - Build history
   - Deployment status
   - Test results trend
   - Code coverage
   - Work item chart
   - Sprint burndown

3. **Custom Query Widget**
   - Add "Query Results" widget
   - Query: Bugs created in last 7 days
   - Group by: Priority

### Part 6: Continuous Improvement

1. **Create Retrospective Template**
   Create `retrospective-template.md`:
   ```markdown
   # Sprint Retrospective
   
   Date: [Date]
   Sprint: [Number]
   
   ## What Went Well
   - 
   
   ## What Didn't Go Well
   - 
   
   ## Action Items
   - [ ] 
   
   ## Metrics
   - Deployment frequency: 
   - Lead time: 
   - MTTR: 
   - Change failure rate: 
   ```

2. **Track DORA Metrics**
   ```javascript
   // dora-metrics.js
   class DORAMetrics {
     calculateDeploymentFrequency(deployments, days) {
       return deployments / days;
     }
     
     calculateLeadTime(commitTime, deployTime) {
       return deployTime - commitTime;
     }
     
     calculateMTTR(incidents) {
       const totalTime = incidents.reduce((sum, i) => 
         sum + (i.resolvedAt - i.detectedAt), 0);
       return totalTime / incidents.length;
     }
     
     calculateChangeFailureRate(deployments, failures) {
       return (failures / deployments) * 100;
     }
   }
   
   module.exports = DORAMetrics;
   ```

### Verification
- [ ] Logging implemented
- [ ] Health checks added
- [ ] Deployment tracking configured
- [ ] Dashboard created
- [ ] Notification rules set
- [ ] Metrics tracked

## Key Concepts

- **Observability**: Understanding system state
- **Telemetry**: Automated data collection
- **SLI**: Service Level Indicator
- **SLO**: Service Level Objective
- **DORA Metrics**: DevOps performance metrics

## DORA Metrics Explained

1. **Deployment Frequency**: How often you deploy
   - Elite: Multiple times per day
   - High: Once per day to once per week

2. **Lead Time**: Commit to production time
   - Elite: Less than one hour
   - High: One day to one week

3. **MTTR**: Time to recover from failure
   - Elite: Less than one hour
   - High: Less than one day

4. **Change Failure Rate**: % of deployments causing failure
   - Elite: 0-15%
   - High: 16-30%

## Monitoring Tools

- **Azure Monitor**: Infrastructure and application
- **Application Insights**: Application performance
- **Log Analytics**: Log aggregation
- **Azure Dashboards**: Visualization
- **Grafana**: Custom dashboards

## Next Steps
Tomorrow we'll wrap up with advanced topics and best practices.
