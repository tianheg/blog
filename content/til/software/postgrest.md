---
title: 'How to use PostgREST'
status: draft
date: 2025-06-15T19:22:54+08:00
header: DevOps
---

Set up PostgREST use docker, env:

```
PGRST_DB_URI=${DATABASE_URL}            # provided when you attach Railway Postgres
PGRST_DB_SCHEMAS=public                 # comma-separated list, e.g. "public,api"
PGRST_DB_ANON_ROLE=web_anon             # role used for unauthenticated requests
PGRST_SERVER_HOST=0.0.0.0               # listen on all interfaces
PGRST_SERVER_PORT=${PORT}               # Railway sets PORT automatically
```

Minimal SQL setup:

```sql
-- Anonymous, read-only role
CREATE ROLE web_anon NOLOGIN;
GRANT USAGE ON SCHEMA public TO web_anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO web_anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO web_anon;
```
