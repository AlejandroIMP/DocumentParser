#imagen base
FROM node:22-alpine

# Install pnpm using npm (more reliable than corepack in this case)
RUN npm install -g pnpm

# Directorio de trabajo
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Create necessary directories and set permissions
RUN mkdir -p /app/public/uploads /app/public/outputs && \
  chown -R node:node /app/public


# Exponer el puerto
EXPOSE 5000

# Use non-root user for security
USER node

# Start the application
CMD ["pnpm", "run", "dev"]

