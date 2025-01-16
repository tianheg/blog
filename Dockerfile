# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install required system dependencies
RUN apk add --no-cache \
    curl \
    bash \
    git \
    build-base \
    hugo

# Install Pagefind and Hugo 
ENV PAGEFIND_VERSION=1.0.4

# Install Pagefind
RUN curl -L https://github.com/CloudCannon/pagefind/releases/download/v${PAGEFIND_VERSION}/pagefind_extended-v${PAGEFIND_VERSION}-x86_64-unknown-linux-musl.tar.gz | tar -xz -C /usr/local/bin \
    && chmod +x /usr/local/bin/pagefind_extended

# Copy package files
COPY package*.json ./

# Install Node.js dependencies only
RUN npm install

# Copy the rest of the application
COPY . .

# Now run the build after all files are copied
RUN npm run all

# Deploy stage
FROM nginx:alpine

# Copy the generated static files from builder
COPY --from=builder /app/public /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
