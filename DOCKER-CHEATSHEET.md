# 🐳 Docker Quick Reference - Workshop Cheat Sheet

## Essential Commands

### Building & Running

```bash
# Build and start with Docker Compose (recommended)
docker compose up -d

# Build and start with force rebuild
docker compose up -d --build

# Build only (no start)
docker compose build

# Manual build (without Compose)
docker build -t flag-finder-fun .

# Run manually (without Compose)
docker run -d -p 3000:8080 --name flag-finder-fun flag-finder-fun:latest
```

### Viewing & Debugging

```bash
# View running containers
docker ps

# View all containers (including stopped)
docker ps -a

# View logs (follow mode)
docker compose logs -f

# View logs for specific service
docker compose logs -f app

# View last 50 lines
docker logs --tail 50 flag-finder-fun

# Execute command in running container
docker exec -it flag-finder-fun sh

# Inspect container details
docker inspect flag-finder-fun

# View container resource usage
docker stats flag-finder-fun
```

### Stopping & Cleaning

```bash
# Stop containers
docker compose down

# Stop and remove volumes
docker compose down -v

# Stop manual container
docker stop flag-finder-fun

# Remove stopped container
docker rm flag-finder-fun

# Remove image
docker rmi flag-finder-fun:latest
```

### Cleaning Up Docker

```bash
# Remove all stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove everything unused (containers, images, networks, cache)
docker system prune -a

# See disk usage
docker system df
```

## Dockerfile Commands Reference

| Command | Purpose | Example |
|---------|---------|---------|
| `FROM` | Base image | `FROM node:18-alpine` |
| `WORKDIR` | Set working directory | `WORKDIR /app` |
| `COPY` | Copy files | `COPY package.json ./` |
| `RUN` | Execute command (build time) | `RUN npm install` |
| `CMD` | Default command (runtime) | `CMD ["nginx"]` |
| `EXPOSE` | Document port | `EXPOSE 8080` |
| `ENV` | Set environment variable | `ENV NODE_ENV=production` |
| `USER` | Switch user | `USER nginx` |
| `HEALTHCHECK` | Define health check | `HEALTHCHECK CMD wget ...` |

## Docker Compose Commands

```bash
# Start in foreground (see logs)
docker compose up

# Start in background (detached)
docker compose up -d

# Stop services
docker compose down

# Restart services
docker compose restart

# View service status
docker compose ps

# Run one-off command
docker compose run app sh

# Scale service (run multiple instances)
docker compose up -d --scale app=3
```

## Debugging Tips

### Container Won't Start
```bash
# Check logs for errors
docker compose logs

# Try running in foreground to see output
docker compose up

# Check if port is already in use
sudo lsof -i :3000
```

### Check Container Health
```bash
# View health status
docker inspect flag-finder-fun | grep -A 10 Health

# Manually run health check command
docker exec flag-finder-fun wget --spider http://localhost:8080/
```

### Access Container Filesystem
```bash
# Enter container shell
docker exec -it flag-finder-fun sh

# Copy file from container
docker cp flag-finder-fun:/etc/nginx/conf.d/default.conf ./nginx-backup.conf

# Copy file to container
docker cp ./myfile.txt flag-finder-fun:/tmp/
```

### Network Issues
```bash
# List Docker networks
docker network ls

# Inspect network
docker network inspect flag-finder-fun_default

# Test connectivity from inside container
docker exec flag-finder-fun ping google.com
```

## Environment Variables

### In docker-compose.yml
```yaml
services:
  app:
    environment:
      - NODE_ENV=production
      - API_URL=https://api.example.com
```

### From .env file
```yaml
services:
  app:
    env_file:
      - .env
```

### Pass at runtime
```bash
docker run -e API_URL=https://api.example.com myapp
```

## Multi-Stage Build Pattern

```dockerfile
# Stage 1: Build
FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Production
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
```

## Common Port Mappings

| Host Port | Container Port | Usage |
|-----------|----------------|-------|
| `3000:8080` | 3000 → 8080 | Access on localhost:3000 |
| `80:8080` | 80 → 8080 | Access on localhost:80 |
| `8080:8080` | 8080 → 8080 | Same port both sides |

## Volume Patterns

### Named Volume (persists data)
```yaml
services:
  db:
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Bind Mount (for development)
```yaml
services:
  app:
    volumes:
      - ./src:/app/src  # Hot reload during development
```

## Performance Tips

### Build Faster
```bash
# Use build cache
docker build -t myapp .

# Skip cache (clean build)
docker build --no-cache -t myapp .

# Use BuildKit (faster)
DOCKER_BUILDKIT=1 docker build -t myapp .
```

### Reduce Image Size
- ✅ Use Alpine Linux base images
- ✅ Multi-stage builds
- ✅ Combine RUN commands with `&&`
- ✅ Use `.dockerignore`
- ✅ Don't install dev dependencies in production

### Layer Caching Strategy
```dockerfile
# Good: Dependencies installed first
COPY package.json ./
RUN npm install
COPY . .

# Bad: Everything copied at once
COPY . .
RUN npm install
```

## Security Checklist

- ✅ Don't run as root (`USER nginx`)
- ✅ Use specific version tags (not `latest`)
- ✅ Scan images for vulnerabilities (`docker scan`)
- ✅ Use minimal base images (Alpine)
- ✅ Don't hardcode secrets
- ✅ Keep images up to date
- ✅ Use multi-stage builds
- ✅ Add security headers in nginx

## Troubleshooting

### "Cannot connect to Docker daemon"
```bash
# Start Docker service
sudo systemctl start docker

# Check status
sudo systemctl status docker
```

### "Port already in use"
```bash
# Find process using port
sudo lsof -i :3000

# Kill process
kill -9 <PID>
```

### "No space left on device"
```bash
# Clean up Docker resources
docker system prune -a --volumes
```

### Build fails with "timeout"
```bash
# Increase timeout
COMPOSE_HTTP_TIMEOUT=200 docker compose up
```

## Quick Stats

```bash
# Image sizes
docker images

# Container resource usage (live)
docker stats

# Disk usage by Docker
docker system df

# Detailed disk usage
docker system df -v
```

## Production Deployment Flow

```bash
# 1. Build with version tag
docker build -t myapp:v1.0.0 .

# 2. Tag for registry
docker tag myapp:v1.0.0 myregistry.com/myapp:v1.0.0

# 3. Push to registry
docker push myregistry.com/myapp:v1.0.0

# 4. Pull on production server
docker pull myregistry.com/myapp:v1.0.0

# 5. Deploy
docker run -d -p 80:8080 myregistry.com/myapp:v1.0.0
```

## Useful Aliases

Add to `~/.bashrc` or `~/.zshrc`:

```bash
# Docker shortcuts
alias d='docker'
alias dc='docker compose'
alias dcu='docker compose up -d'
alias dcd='docker compose down'
alias dcl='docker compose logs -f'
alias dps='docker ps'
alias dpsa='docker ps -a'
alias dclean='docker system prune -a'

# Quick container access
alias dsh='docker exec -it'
```

---

**Pro Tip**: Keep this cheat sheet handy! Bookmark it or print it out for quick reference during the workshop.

🐳 **Happy Dockering!**
