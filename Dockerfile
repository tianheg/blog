# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install required system dependencies
RUN apk add --no-cache \
    curl \
    bash \
    git \
    build-base

# Install Pagefind and Hugo 
ENV PAGEFIND_VERSION=1.0.4
ENV HUGO_VERSION=0.141.0
RUN curl -L https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_linux-amd64.tar.gz | tar -xz -C /usr/local/bin hugo
RUN wget -q https://github.com/CloudCannon/pagefind/releases/download/v${PAGEFIND_VERSION}/pagefind_extended-v${PAGEFIND_VERSION}-x86_64-unknown-linux-musl.tar.gz -O - | tar -xz -C /usr/local/bin

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm install && npm run all

# Copy the rest of the application
COPY . .

# Deploy stage
FROM nginx:alpine

# Copy the generated static files from builder
COPY --from=builder /app/public /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
