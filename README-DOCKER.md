# 🐳 Containerization Workshop: Docker Best Practices

> A hands-on guide to containerizing a modern React application using Docker

## 📚 Table of Contents

- [What is Containerization?](#what-is-containerization)
- [What We Built](#what-we-built)
- [Project Structure](#project-structure)
- [Understanding Each Component](#understanding-each-component)
- [Real-World Applications](#real-world-applications)
- [Getting Started](#getting-started)
- [Workshop Exercises](#workshop-exercises)
- [Best Practices Implemented](#best-practices-implemented)
- [Common Pitfalls & Solutions](#common-pitfalls--solutions)
- [Further Learning](#further-learning)

---

## 🤔 What is Containerization?

**Containerization** is the process of packaging an application and its dependencies together in an isolated environment called a **container**.

### Key Concepts

**Container vs Virtual Machine**
- **Virtual Machine**: Includes entire OS (GBs of space)
- **Container**: Shares host OS kernel (MBs of space)
- **Result**: Containers are lighter, faster, and more efficient

**Benefits of Containerization**
1. **"Works on My Machine" Problem Solved**: Same environment everywhere (dev, staging, production)
2. **Isolation**: Each container runs independently
3. **Portability**: Run anywhere Docker is installed
4. **Consistency**: Same dependencies across all environments
5. **Scalability**: Easy to spin up multiple instances

---

## 🏗️ What We Built

We containerized a **Vite + React** application using modern best practices:

```
📦 Docker Setup
├── Dockerfile (multi-stage build)
├── docker-compose.yml (orchestration)
├── nginx.conf (web server config)
└── .dockerignore (build optimization)
```

### Architecture Overview

```
┌─────────────────────────────────────────────┐
│         STAGE 1: Builder                     │
│  ┌────────────────────────────────────┐     │
│  │  Base: Bun Alpine Linux            │     │
│  │  - Install dependencies            │     │
│  │  - Build React app                 │     │
│  │  - Output: /dist folder            │     │
│  └────────────────────────────────────┘     │
└─────────────────────────────────────────────┘
                    ↓
        (Only /dist is copied)
                    ↓
┌─────────────────────────────────────────────┐
│         STAGE 2: Production                  │
│  ┌────────────────────────────────────┐     │
│  │  Base: Nginx Alpine Linux          │     │
│  │  - Copy built files from Stage 1   │     │
│  │  - Configure Nginx                 │     │
│  │  - Run as non-root user            │     │
│  │  - Final image: ~50MB              │     │
│  └────────────────────────────────────┘     │
└─────────────────────────────────────────────┘
```

**Result**: Build artifacts only, no source code, no build tools → Secure & Small!

---

## 📁 Project Structure

```
flag-finder-fun/
├── Dockerfile              # Multi-stage build definition
├── docker-compose.yml      # Container orchestration
├── nginx.conf             # Web server configuration
├── .dockerignore          # Files to exclude from build
├── package.json           # Node dependencies
├── bun.lockb             # Dependency lock file
└── src/                  # Application source code
```

---

## 🔍 Understanding Each Component

### 1. `.dockerignore`

**Purpose**: Tells Docker which files to exclude from the build context

**Why It Matters**:
- Speeds up builds (smaller context to upload)
- Reduces image size
- Prevents sensitive files from entering the image

**What We Exclude**:
```
node_modules/     # Will be installed fresh in container
.git/            # Not needed in production
dist/            # Will be generated during build
.env             # Sensitive environment variables
```

**Real-World**: Essential for CI/CD pipelines where build speed matters

---

### 2. `Dockerfile`

**Purpose**: Instructions for building a Docker image

#### Multi-Stage Build Explained

**Stage 1: Builder**
```dockerfile
FROM oven/bun:1.1-alpine AS builder
```
- Uses Bun runtime to build the app
- Installs dependencies and compiles code
- This stage will be **discarded** in final image

**Why This Matters**:
- Build tools (Node, npm, TypeScript) are **NOT** in production image
- Reduces attack surface (fewer installed packages)
- Smaller image size (50MB vs 500MB+)

**Stage 2: Production**
```dockerfile
FROM nginx:1.27-alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
```
- Fresh start with only nginx
- Copies **only** the built files from Stage 1
- No source code, no build tools

#### Key Dockerfile Concepts

**Layer Caching**
```dockerfile
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile
COPY . .          # Copy source AFTER installing deps
```
- If `package.json` hasn't changed, Docker reuses cached layer
- Source code changes don't trigger dependency reinstall
- **Massive** build speed improvement

**Build Cache Mounts**
```dockerfile
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile
```
- Persists downloaded packages between builds
- Even faster rebuilds (packages cached locally)

**Security: Non-Root User**
```dockerfile
USER nginx
```
- Container runs as `nginx` user, not `root`
- If container is compromised, attacker has limited privileges
- **Production requirement** for security compliance

**Real-World**: Multi-stage builds are standard in enterprise environments

---

### 3. `nginx.conf`

**Purpose**: Configure Nginx web server for serving the React SPA

#### Why Nginx for Frontend Apps?

1. **Production-grade HTTP server** (battle-tested, high-performance)
2. **Tiny memory footprint** (1-2MB RAM)
3. **Built-in features**: compression, caching, security headers
4. **SPA routing support** (required for React Router, etc.)

#### Key Configurations

**Security Headers**
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
```
- Protects against common attacks (clickjacking, XSS, MIME sniffing)
- **Real-World**: Required for PCI compliance, HIPAA, SOC2

**Gzip Compression**
```nginx
gzip on;
gzip_comp_level 6;
```
- Reduces file sizes by 70-90%
- Faster page loads, lower bandwidth costs
- **Real-World**: Can save thousands in CDN costs

**SPA Routing**
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```
- `/about` → serves `index.html` → React Router handles it
- **Without this**: Refreshing any route gives 404 error

**Aggressive Caching**
```nginx
location ~* \.(js|css|png|jpg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```
- Built files have unique hashes (`app.abc123.js`)
- Safe to cache forever (new deploy = new filename)
- **Real-World**: Critical for CDN performance

---

### 4. `docker-compose.yml`

**Purpose**: Define and run multi-container Docker applications

**Why Docker Compose?**
- Alternative to long `docker run` commands
- Easy to share and version control
- One command to start everything: `docker compose up`

**What It Defines**:
```yaml
services:
  app:
    build: ./Dockerfile        # How to build
    ports: "3000:8080"        # Port mapping
    restart: unless-stopped    # Auto-restart policy
    healthcheck: ...          # Health monitoring
```

**Real-World Use**:
- Local development environments
- Integration testing (app + database + redis)
- Small production deployments

**Enterprise Alternative**: Kubernetes (for orchestrating 100s of containers)

---

## 🌍 Real-World Applications

### How This Setup is Used in Production

#### Scenario 1: Startup (1-10 containers)
```bash
# Simple deployment on single server
docker compose up -d
```
- Use Docker Compose on a VPS/EC2 instance
- Add Nginx reverse proxy for HTTPS
- Set up automated backups

#### Scenario 2: Growing Company (10-100 containers)
```bash
# Deploy to AWS ECS / Google Cloud Run
docker build -t myapp:v1.0.0 .
docker push myregistry/myapp:v1.0.0
```
- Push images to Docker registry (Docker Hub, ECR, GCR)
- Use managed container services (AWS ECS, Cloud Run)
- Add load balancers, auto-scaling

#### Scenario 3: Enterprise (1000+ containers)
```bash
# Deploy to Kubernetes
kubectl apply -f deployment.yaml
```
- Kubernetes for complex orchestration
- Service mesh (Istio) for microservices
- GitOps workflows (ArgoCD, Flux)

### CI/CD Integration

**Typical Workflow**:
```yaml
# .github/workflows/deploy.yml
- Build Docker image
- Run tests inside container
- Push to registry
- Deploy to production
```

**Popular Tools**:
- GitHub Actions
- GitLab CI
- Jenkins
- CircleCI

---

## 🚀 Getting Started

### Prerequisites
```bash
# Check if Docker is installed
docker --version

# Check if Docker Compose is installed
docker compose version
```

### Quick Start

**1. Build and Run**
```bash
# Build image and start container
docker compose up -d

# View logs
docker compose logs -f

# Check status
docker compose ps
```

**2. Access Application**
Open browser to: http://localhost:3000

**3. Stop Application**
```bash
docker compose down
```

### Manual Docker Commands (Without Compose)

```bash
# Build image
docker build -t flag-finder-fun .

# Run container
docker run -d \
  -p 3000:8080 \
  --name flag-finder-fun \
  flag-finder-fun:latest

# View logs
docker logs -f flag-finder-fun

# Stop and remove
docker stop flag-finder-fun
docker rm flag-finder-fun
```

---

## 🎯 Workshop Exercises

### Exercise 1: Understanding Layers
```bash
# View image layers and size
docker history flag-finder-fun:latest

# Notice: How many layers? Which are the largest?
```

### Exercise 2: Build Without Cache
```bash
# Normal build (uses cache)
docker build -t test1 .

# Build without cache
docker build --no-cache -t test2 .

# Compare build times!
```

### Exercise 3: Inspect Running Container
```bash
# Start container
docker compose up -d

# Enter container shell (explore the filesystem)
docker exec -it flag-finder-fun sh

# Inside container:
ls /usr/share/nginx/html    # Your app files
cat /etc/nginx/conf.d/default.conf  # Nginx config
ps aux                      # See nginx process running as 'nginx' user
exit
```

### Exercise 4: Test Health Check
```bash
# Check container health status
docker inspect flag-finder-fun | grep -A 10 Health

# Manually trigger health check
docker exec flag-finder-fun wget --spider http://localhost:8080/
```

### Exercise 5: Modify and Rebuild
```bash
# 1. Change something in src/
# 2. Rebuild
docker compose up -d --build

# Notice: Dependency installation is cached!
```

### Exercise 6: Compare Image Sizes
```bash
# Our multi-stage image
docker images flag-finder-fun

# Compare to single-stage (build without stages)
# You'd see ~500MB vs ~50MB difference!
```

---

## ✅ Best Practices Implemented

| Practice | Why It Matters | Real-World Impact |
|----------|----------------|-------------------|
| **Multi-stage builds** | Smaller images | 90% size reduction |
| **Layer caching** | Faster builds | 10x faster rebuilds |
| **Build cache mounts** | Persist dependencies | 5x faster CI/CD |
| **Non-root user** | Security | Required for compliance |
| **Health checks** | Reliability | Auto-recovery in production |
| **Specific version tags** | Reproducibility | Avoid "latest" surprises |
| **.dockerignore** | Build efficiency | Faster uploads to registry |
| **Nginx for static files** | Performance | Handle 10k+ req/sec |
| **Security headers** | Protection | Prevent common attacks |
| **Gzip compression** | Bandwidth | 70-90% reduction |
| **Immutable caching** | Speed | Instant repeat visits |
| **SPA routing** | Functionality | React Router compatibility |

---

## ⚠️ Common Pitfalls & Solutions

### Issue 1: "Works in Dev, Breaks in Container"
**Cause**: Hard-coded `localhost` or missing environment variables

**Solution**:
```javascript
// Bad
const API_URL = 'http://localhost:3000';

// Good
const API_URL = process.env.VITE_API_URL || 'http://localhost:3000';
```

### Issue 2: Large Image Sizes
**Cause**: Not using multi-stage builds, including dev dependencies

**Solution**:
- Use multi-stage builds ✅
- Use Alpine base images ✅
- Add comprehensive `.dockerignore` ✅

### Issue 3: Slow Builds
**Cause**: Poor layer ordering, no caching

**Solution**:
```dockerfile
# Copy package.json BEFORE source code
COPY package.json ./
RUN npm install
COPY . .    # This comes AFTER install
```

### Issue 4: Container Won't Start (Port 80 Permission Denied)
**Cause**: Non-root user can't bind to privileged ports (<1024)

**Solution**:
```nginx
# Use port 8080 instead of 80
listen 8080;
```

### Issue 5: SPA Routes Return 404
**Cause**: Nginx doesn't know about client-side routing

**Solution**:
```nginx
location / {
    try_files $uri $uri/ /index.html;  # Fallback to index.html
}
```

---

## 📖 Further Learning

### Next Steps

**1. Add a Database**
```yaml
services:
  app:
    # ... existing config
  
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_PASSWORD: secret
```

**2. Multi-Environment Setup**
```bash
# docker-compose.prod.yml
docker compose -f docker-compose.yml -f docker-compose.prod.yml up
```

**3. Secrets Management**
```bash
# Don't hardcode secrets!
docker secret create db_password secret.txt
```

**4. Add HTTPS with Certbot**
```bash
# Use Let's Encrypt for free SSL certificates
```

### Resources

**Official Documentation**
- [Docker Docs](https://docs.docker.com/)
- [Docker Compose Docs](https://docs.docker.com/compose/)
- [Nginx Docs](https://nginx.org/en/docs/)

**Best Practices**
- [Docker Best Practices by Snyk](https://snyk.io/blog/10-docker-image-security-best-practices/)
- [12-Factor App Methodology](https://12factor.net/)
- [OWASP Docker Security](https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html)

**Advanced Topics**
- Kubernetes fundamentals
- Docker security scanning (Trivy, Snyk)
- CI/CD pipelines with Docker
- Multi-architecture builds (ARM64 + AMD64)

---

## 🎓 Workshop Takeaways

### What You Learned

1. ✅ **Containerization fundamentals** (what, why, how)
2. ✅ **Multi-stage builds** (production-grade optimization)
3. ✅ **Docker layer caching** (developer experience)
4. ✅ **Security best practices** (non-root, headers, minimal images)
5. ✅ **Production configuration** (Nginx, compression, caching)
6. ✅ **Container orchestration** (Docker Compose basics)
7. ✅ **Real-world patterns** (how companies actually do this)

### Skills Gained

- Build optimized Docker images
- Configure production web servers
- Debug container issues
- Apply security best practices
- Understand cloud deployment patterns

### Why This Matters for Your Career

**DevOps Skills in Demand**:
- 73% of companies use containers in production [(CNCF Survey)](https://www.cncf.io/)
- Docker is #1 most wanted skill on developer job postings

**What Recruiters Look For**:
- ✅ Docker on resume
- ✅ Understanding of CI/CD
- ✅ Cloud platform knowledge (AWS, GCP, Azure)
- ✅ Security awareness

---

## 🤝 Contributing to This Workshop

Found something unclear? Have suggestions?

1. Fork this repo
2. Make improvements
3. Submit a pull request

Let's make this the best containerization workshop! 

---

## 📝 License

This workshop material is open source and available for educational purposes.

---

**Happy Containerizing!**

*Remember: The best way to learn is by doing. Experiment, break things, and rebuild!*
