# AKS with AGIC Quick Reference

## Quick Commands

### AKS Cluster Management
```bash
# Create AKS cluster
az aks create --resource-group myRG --name myAKS --node-count 2

# Get credentials
az aks get-credentials --resource-group myRG --name myAKS

# Scale cluster
az aks scale --resource-group myRG --name myAKS --node-count 3

# Upgrade cluster
az aks upgrade --resource-group myRG --name myAKS --kubernetes-version 1.28.0

# Delete cluster
az aks delete --resource-group myRG --name myAKS
```

### kubectl Commands
```bash
# Get resources
kubectl get nodes
kubectl get pods
kubectl get services
kubectl get ingress

# Describe resources
kubectl describe pod <pod-name>
kubectl describe service <service-name>

# Logs
kubectl logs <pod-name>
kubectl logs -f <pod-name>  # Follow
kubectl logs -l app=myapp   # By label

# Execute commands
kubectl exec -it <pod-name> -- /bin/sh

# Apply manifests
kubectl apply -f deployment.yaml
kubectl apply -f .  # All files in directory

# Delete resources
kubectl delete pod <pod-name>
kubectl delete -f deployment.yaml
```

### Docker Commands
```bash
# Build image
docker build -t myapp:v1 .

# Tag image
docker tag myapp:v1 myacr.azurecr.io/myapp:v1

# Push to ACR
az acr login --name myacr
docker push myacr.azurecr.io/myapp:v1

# List images in ACR
az acr repository list --name myacr
az acr repository show-tags --name myacr --repository myapp
```

## Kubernetes Manifest Templates

### Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: myapp
        image: myacr.azurecr.io/myapp:v1
        ports:
        - containerPort: 3000
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
```

### Service
```yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 3000
  selector:
    app: myapp
```

### Ingress (AGIC)
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myapp-ingress
  annotations:
    kubernetes.io/ingress.class: azure/application-gateway
    appgw.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  rules:
  - host: api.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: myapp
            port:
              number: 80
```

## AGIC Annotations

```yaml
# SSL redirect
appgw.ingress.kubernetes.io/ssl-redirect: "true"

# Backend protocol
appgw.ingress.kubernetes.io/backend-protocol: "http"

# Connection draining
appgw.ingress.kubernetes.io/connection-draining: "true"
appgw.ingress.kubernetes.io/connection-draining-timeout: "30"

# Request timeout
appgw.ingress.kubernetes.io/request-timeout: "30"

# Backend path prefix
appgw.ingress.kubernetes.io/backend-path-prefix: "/"

# Health probe
appgw.ingress.kubernetes.io/health-probe-path: "/health"
appgw.ingress.kubernetes.io/health-probe-interval: "30"
appgw.ingress.kubernetes.io/health-probe-timeout: "5"

# Cookie affinity
appgw.ingress.kubernetes.io/cookie-based-affinity: "true"
```

## Troubleshooting

### Pod not starting
```bash
kubectl describe pod <pod-name>
kubectl logs <pod-name>
kubectl get events --sort-by='.lastTimestamp'
```

### Service not accessible
```bash
kubectl get endpoints <service-name>
kubectl describe service <service-name>
```

### Ingress not working
```bash
kubectl describe ingress <ingress-name>
kubectl logs -n kube-system -l app=ingress-appgw
az network application-gateway show-backend-health --resource-group myRG --name myAppGW
```

### Image pull errors
```bash
# Check if ACR is attached
az aks show --resource-group myRG --name myAKS --query "servicePrincipalProfile"

# Attach ACR
az aks update --resource-group myRG --name myAKS --attach-acr myacr
```

## Security Best Practices

1. **Use managed identities** instead of service principals
2. **Enable RBAC** on AKS cluster
3. **Use network policies** to restrict pod communication
4. **Scan images** for vulnerabilities
5. **Use secrets** for sensitive data
6. **Enable WAF** on Application Gateway
7. **Implement API authentication** (API keys, OAuth)
8. **Use private endpoints** when possible
9. **Enable audit logging**
10. **Regular security updates**

## Cost Optimization

1. **Right-size nodes** - Use appropriate VM sizes
2. **Use spot instances** for non-critical workloads
3. **Enable cluster autoscaler**
4. **Use Azure Reservations** for predictable workloads
5. **Delete unused resources**
6. **Use Azure Advisor** recommendations
7. **Monitor with Azure Cost Management**

## Monitoring

```bash
# Enable Container Insights
az aks enable-addons --resource-group myRG --name myAKS --addons monitoring

# View metrics
az monitor metrics list --resource <aks-resource-id>

# Query logs
az monitor log-analytics query --workspace <workspace-id> --analytics-query "ContainerLog | limit 100"
```

## Common Issues

| Issue | Solution |
|-------|----------|
| Pod CrashLoopBackOff | Check logs: `kubectl logs <pod>` |
| ImagePullBackOff | Verify ACR access, image name |
| Ingress no IP | Check AGIC logs, App Gateway |
| 502 Bad Gateway | Check pod health, backend pool |
| High latency | Check resource limits, scaling |

## Useful Links

- [AKS Documentation](https://docs.microsoft.com/azure/aks/)
- [AGIC Documentation](https://docs.microsoft.com/azure/application-gateway/ingress-controller-overview)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
