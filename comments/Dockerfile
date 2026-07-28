# Stage 1: Build
FROM golang:1.24-alpine AS builder

WORKDIR /src
COPY go.mod main.go ./
RUN CGO_ENABLED=0 GOOS=linux go build -o /comments .

# Stage 2: Runtime
FROM alpine:3.21
RUN apk add --no-cache ca-certificates
EXPOSE 8080
COPY --from=builder /comments /comments
CMD ["/comments"]
