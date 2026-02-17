# ==============================================================================
# STAGE 1: Build Stage
# ==============================================================================
# This stage compiles the application. It will be discarded in the final image.

# FROM: Specifies the base image for this stage
# - oven/bun:1.1-alpine: Uses Bun runtime on Alpine Linux (small, secure)
# - AS builder: Names this stage "builder" so we can reference it later
FROM oven/bun:1.1-alpine AS builder

# WORKDIR: Sets the working directory inside the container
# - All subsequent commands will run from /app directory
# - Creates the directory if it doesn't exist
WORKDIR /app

# COPY: Copies files from host machine to container
# - Copy only package files first (not entire codebase)
# - This enables Docker layer caching: if package files haven't changed,
#   Docker reuses the cached layer and skips reinstalling dependencies
COPY package.json bun.lockb ./

# RUN: Executes a command during the build process
# - --mount=type=cache: Creates a persistent cache for dependencies
#   This cache survives across builds, speeding up subsequent builds
# - target=/root/.bun/install/cache: Where Bun stores downloaded packages
# - bun install: Installs dependencies
# - --frozen-lockfile: Ensures exact versions from bun.lockb (like npm ci)
#   Fails if package.json and lockfile are out of sync
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

# COPY: Now copy the entire source code
# - Done AFTER installing dependencies so code changes don't invalidate
#   the dependency installation cache layer
COPY . .

# RUN: Build the production-ready application
# - bun run build: Executes the "build" script from package.json
# - Outputs compiled/bundled files to /app/dist directory
RUN bun run build

# ==============================================================================
# STAGE 2: Production Stage
# ==============================================================================
# This stage creates the final, lightweight image that will run in production.

# FROM: Start a new stage with a different base image
# - nginx:1.27-alpine: Nginx web server on Alpine Linux (~50MB vs ~150MB)
# - AS production: Names this stage for the docker-compose target
# - This creates a fresh image without Bun or source code (smaller & more secure)
FROM nginx:1.27-alpine AS production

# COPY: Replace default Nginx configuration with our custom one
# - /etc/nginx/conf.d/default.conf: Nginx reads configs from this location
# - Our config handles SPA routing, security headers, compression, etc.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# COPY: Get the built application from the builder stage
# - --from=builder: Copy from the "builder" stage (not from host)
# - /app/dist: Where Vite outputs the built files
# - /usr/share/nginx/html: Default directory Nginx serves files from
# - Only the compiled assets are copied, not source code or node_modules
COPY --from=builder /app/dist /usr/share/nginx/html

# HEALTHCHECK: Tells Docker/orchestrators how to check if container is working
# - --interval=30s: Check every 30 seconds
# - --timeout=3s: Wait max 3 seconds for response
# - --start-period=5s: Grace period before first check (app startup time)
# - --retries=3: Mark unhealthy after 3 consecutive failures
# - CMD: The command to run (wget checks if nginx responds on port 80)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# RUN: Change ownership of files/directories to nginx user
# - Security best practice: don't run as root
# - nginx:nginx: user:group format
# - chown -R: Recursively change ownership
# - These directories need to be writable by nginx user:
#   - /usr/share/nginx/html: Serves files
#   - /var/cache/nginx: Nginx cache directory
#   - /var/log/nginx: Log files
#   - /etc/nginx/conf.d: Configuration files
#   - /var/run/nginx.pid: Process ID file
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# USER: Switch from root to nginx user for all subsequent commands
# - Security: If someone exploits the container, they only have nginx user
#   privileges, not root access
USER nginx

# EXPOSE: Documents which port the container listens on
# - 8080: Non-privileged port (ports < 1024 require root)
# - This is metadata only; doesn't actually publish the port
#   (that's done with -p flag or docker-compose ports)
EXPOSE 8080

# CMD: The default command to run when container starts
# - ["nginx", "-g", "daemon off;"]: JSON array format (exec form)
# - nginx: Start nginx web server
# - -g: Pass a global directive
# - daemon off: Run in foreground (required for Docker to track the process)
#   If nginx runs as daemon, Docker thinks container stopped
CMD ["nginx", "-g", "daemon off;"]
