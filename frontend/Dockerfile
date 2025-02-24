FROM node:20-alpine

# Create app directory and set permissions
WORKDIR /app

# Install pnpm globally before switching to node user
RUN npm install -g pnpm && \
  chown -R node:node /app

# Switch to non-root user
USER node

# Copy package files with correct ownership
COPY --chown=node:node package*.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code with correct ownership
COPY --chown=node:node . .

EXPOSE 5173

# Start development server
CMD ["pnpm", "run", "dev", "--host"]