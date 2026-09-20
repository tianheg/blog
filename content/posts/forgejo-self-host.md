---
title: 'How to self-host Forgejo with docker on Ubuntu 24.04'
date: 2026-02-14T14:20:00+08:00
tags: ['技术', English]
---

I want to deploy [Forgejo](https://forgejo.org/) for about two years, never want to write a post about it. Now I finally deploy it. Why I want to self-host this GitHub alternative? Because I hate complexity, I donot like GitHub which has more 'features' but users donot benefit from them. I want something certain, I'm sure I own the data when I have a Forgejo instance. If I host my code on GitHub, I have to deal with the terible UX. I couldn't stand with it anymore.

Now let me show the way how I deploy Forgejo.

## Prepare the server

Use a Hetzner server(Ubuntu 24.04 LTS) deploy Forgejo. Donot forget to add SSH key.

### 1. Ubuntu initial setup

Edit local =~/.ssh/config=:

```ini
Host forgejo
  Hostname IP
  User root
  IdentityFile ~/.ssh/id_ed25519
```

Then run `ssh forgejo` login the server. Run below cmd to complete initial setup:

```bash
apt-get update && apt-get upgrade
## rm snapd, donot like it, never use it
apt autoremove snapd --purge -y
## install Docker
# https://docs.docker.com/engine/install/ubuntu/#install-using-the-repository
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
tee /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Signed-By: /etc/apt/keyrings/docker.asc
EOF

apt-get update
apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### 2. Create a git user

```bash
adduser \
  --system \
  --group \
  --disabled-password \
  --shell /bin/bash \
  --home /home/git \
  git
usermod -aG docker git
```

## Add a A DNS record

On the domain DNS manage site, mine is Cloudflare, add a A record to your domain that point to your server IPv4 IP.

## Write docker-compose.yml file

Prepare the folder:

```bash
mkdir -p ./forgejo
sudo chown -R git:git ./forgejo
mkdir -p ./conf
sudo chown -R git:git ./conf
id git
# uid=108(git) gid=110(git) groups=110(git),988(docker)
```

Create `Caddyfile`:

```ini
git.example.com {
    encode gzip zstd
    reverse_proxy localhost:3001 {
        header_up Host {host}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }
}
```

Setup port forward, so that SSH url will be `ssh://git@git.example.com/xxx/xxx.git` not `ssh://git@git.example.com:2222/xxx/xxx.git`:

```bash
vim forgejo-shell.sh
chmod +x /path_to/forgejo-shell.sh
usermod -s /abs_path_to/forgejo-shell.sh git
vim /etc/ssh/sshd_config
systemctl restart ssh
sudo -u git /path_to/forgejo-shell.sh
# enter forgejo container shell
ssh -T git@git.example.com
# run above cmd in local PC
# Hi there, youruser! You've successfully authenticated with the key named xxxxxx, but Forgejo does not provide shell access.
# If this is unexpected, please log in with password and setup Forgejo under another user.
```

```bash
# forgejo-shell.sh
#!/bin/sh
/usr/bin/docker exec -i --env SSH_ORIGINAL_COMMAND="$SSH_ORIGINAL_COMMAND" forgejo sh "$@"
```

```bash
# /etc/ssh/sshd_config
## add to bottom
Match User git
    AuthorizedKeysCommandUser git
    AuthorizedKeysCommand /usr/bin/docker exec -i forgejo /usr/local/bin/forgejo keys -u %u -t %t -k %k
```

Create `docker-compose.yml`:

```yaml
services:
  forgejo:
    image: codeberg.org/forgejo/forgejo:15-rootless
    container_name: forgejo
    user: 108:110
    environment:
      - USER_UID=108
      - USER_GID=110
      - FORGEJO__database__DB_TYPE=sqlite3
      - FORGEJO__server__SSH_PORT=22
      - FORGEJO__server__SSH_LISTEN_PORT=2222 # port forward
      - FORGEJO__repository__DEFAULT_REPO_UNITS=repo.code
      - FORGEJO__repository__DISABLE_MIGRATIONS=true
      - FORGEJO__repository__DISABLE_STARS=true
    restart: unless-stopped
    networks:
      - forgejo
    volumes:
      - ./forgejo:/var/lib/gitea
      - ./conf:/etc/gitea
      - /etc/localtime:/etc/localtime:ro
    ports:
      - "3000:3000"

  caddy:
    image: caddy:2-alpine
    container_name: caddy
    network_mode: 'host'
    restart: unless-stopped
    logging:
      driver: 'json-file'
      options:
        max-size: '10m'
        max-file: '10'
    volumes:
      - ./Caddyfile:/Caddyfile:ro
      - caddy_data:/data
    command: 'caddy run --config /Caddyfile --adapter caddyfile'

anubis:
    image: ghcr.io/techarohq/anubis:latest
    container_name: anubis
    restart: unless-stopped
    environment:
      BIND: ":3000"
      TARGET: "http://forgejo:3000"
      SERVE_ROBOTS_TXT: "true"
      TRUSTED_PROXIES: "127.0.0.1,::1"
    networks:
      - forgejo
    ports:
      - "3001:3000"

networks:
  forgejo:
    external: false

volumes:
  caddy_data:
  caddy_config:
```
## Backup Forgejo

I backup data to Hetzner Storagebox.

First, create SSH key, add pub key to Storagebox.

```bash
ssh-keygen -t ed25519 -f ~/.ssh/hetzner_storagebox
cat ~/.ssh/hetzner_storagebox.pub | ssh -p23 u000000@u000000.your-storagebox.de install-ssh-key
# type passwd
```

Note, if the key name is not id_ed25519, need add config in =~/.ssh/config=:

```ini
Host storagebox
  HostName u000000.your-storagebox.de
  User u000000
  Port 23
  IdentityFile ~/.ssh/hetzner_storagebox
```

Second, run below script.

```bash
#!/bin/bash

# Configuration
STORAGE_USER="u000000"
STORAGE_HOST="u000000.your-storagebox.de"
STORAGE_PORT="23"
REMOTE_DIR="."
LOCAL_BACKUP_DIR="/tmp"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] === Starting Forgejo backup process ==="

# need at /home/git
if [ "$PWD" != "/home/git" ]; then
    echo "Changing directory to /home/git"
    cd /home/git
fi

# Stop service
echo "Stopping Forgejo service (docker compose stop)..."
docker compose stop
if [ $? -eq 0 ]; then
    echo "Service stopped successfully."
else
    echo "WARNING: Failed to stop service, continuing anyway..."
fi

# Create timestamp and archive name
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
ARCHIVE_NAME="forgejo-backup-$TIMESTAMP.tar.gz"
ARCHIVE_PATH="$LOCAL_BACKUP_DIR/$ARCHIVE_NAME"

# Collect SSH forwarding config (needs sudo to read /etc/ssh/sshd_config)
sudo cp /etc/ssh/sshd_config ./sshd_config.backup 2>/dev/null || \
  echo "Warning: cannot copy /etc/ssh/sshd_config (run backup as root or add sudo)"

# Save current git user's shell setting for reference
getent passwd git | cut -d: -f7 > ./git-shell.backup 2>/dev/null || true

# Create compressed archive
tar -czf "$ARCHIVE_PATH" \
  ./forgejo \
  ./conf \
  ./Caddyfile \
  ./docker-compose.yaml \
  ./forgejo-shell.sh \
  ./sshd_config.backup \
  ./git-shell.backup

# Upload to Storage Box
echo "Uploading archive to $STORAGE_USER@$STORAGE_HOST:$REMOTE_DIR/ using rsync (port $STORAGE_PORT)..."
rsync -avh --delete -e "ssh -p$STORAGE_PORT" "$ARCHIVE_PATH" "$STORAGE_USER@$STORAGE_HOST:$REMOTE_DIR/"
RSYNC_EXIT=$?

# Clean up temp files
rm -f ./sshd_config.backup ./git-shell.backup

if [ $RSYNC_EXIT -eq 0 ]; then
    echo "Upload completed successfully."

    # Remove local archive if upload succeeded
    echo "Removing local archive: $ARCHIVE_PATH"
    rm "$ARCHIVE_PATH"
    if [ $? -eq 0 ]; then
        echo "Local archive removed."
    else
        echo "WARNING: Failed to remove local archive (permissions?)."
    fi

    echo "Backup successful: $ARCHIVE_NAME"
else
    echo "ERROR: Upload failed (rsync exit code: $RSYNC_EXIT). Keeping local archive at $ARCHIVE_PATH"
fi

# Start service
echo "Starting Forgejo service (docker compose start)..."
docker compose start
if [ $? -eq 0 ]; then
    echo "Service started successfully."
else
    echo "ERROR: Failed to start service. Please check manually."
    exit 1
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] === Backup process finished ==="
```

Two details in the config are easy to get wrong:

- **`REMOTE_DIR` must not be empty.** With `REMOTE_DIR=""` the rsync target becomes
  `user@host:/` — the StorageBox root, which is read-only — and the upload fails with
  `rsync: mkstemp "/.forgejo-backup-….tar.gz.XXXXXX" failed: Read-only file system (30)`.
  Keep it at `.` (or a real subdirectory).
- **Keep the collected SSH files at the archive root.** `sudo cp /etc/ssh/sshd_config
  /tmp/sshd_config.backup` would land as `tmp/sshd_config.backup` inside the archive
  (`tar` strips the leading `/`) and you would have to dig it out during a restore.
  Copying to `./sshd_config.backup` keeps it at the top level, which is where the
  restore script looks for it.

Because the archive is a single file, rsync's `--delete` does not prune the remote
directory, so older backups survive. The StorageBox root does accumulate over months
— keep an eye on the quota.

Third, make it backup repeatly. The script needs root — it runs `docker compose`
and reads `/etc/ssh/sshd_config` — so add the entry to root's crontab:

```bash
sudo crontab -e
## add below line to edit area
0 2 * * * /home/git/backup.sh >> /home/git/backup.log 2>&1
sudo crontab -l
```

## Restore Forgejo

The backup script above creates a complete snapshot of the Forgejo instance
(data, config, Caddyfile, compose file, SSH forwarding setup). When you need
to restore on a new machine or recover from data loss, the script below pulls
the latest backup from StorageBox and reinstates everything.

Place `forgejo-restore.sh` at `/home/git/`:

```bash
#!/bin/bash
# forgejo-restore.sh -- Restore Forgejo from Hetzner StorageBox backup
#
# Usage:
#   ./forgejo-restore.sh --list              # List available backups
#   ./forgejo-restore.sh                     # Restore latest backup
#   ./forgejo-restore.sh forgejo-backup-20260606-120000.tar.gz  # Specific file

set -euo pipefail

# ── Config (adjust before using) ──
STORAGE_USER="u000000"
STORAGE_HOST="u000000.your-storagebox.de"
STORAGE_PORT="23"
REMOTE_DIR="./backups/forgejo"
SSH_KEY="/home/git/.ssh/hetzner_storagebox"

# ── Colors ──
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
err()   { echo -e "${RED}[ERR]${NC}   $*"; }

confirm() { echo -en "${YELLOW}[?]${NC} $* [y/N] "; read -r resp; case "$resp" in y|Y|yes|Yes) return 0 ;; *) exit 1 ;; esac; }

check_prerequisites() {
    local missing=0
    command -v docker &>/dev/null || { err "Docker not found"; missing=1; }
    docker compose version &>/dev/null || { err "Docker Compose not found"; missing=1; }
    if ! ssh -i "$SSH_KEY" -p "$STORAGE_PORT" -o BatchMode=yes -o ConnectTimeout=5 \
         "$STORAGE_USER@$STORAGE_HOST" exit 2>/dev/null; then
        warn "Cannot reach StorageBox at $STORAGE_HOST:$STORAGE_PORT"; missing=1
    fi
    [ "$missing" -eq 1 ] && { err "Prerequisites not met. Aborting."; exit 1; }
    ok "Prerequisites check passed"
}

list_backups() {
    echo ""
    info "Available backups on StorageBox:"
    ssh -i "$SSH_KEY" -p "$STORAGE_PORT" -o BatchMode=yes \
        "$STORAGE_USER@$STORAGE_HOST" \
        "ls -lh $REMOTE_DIR/forgejo-backup-*.tar.gz 2>/dev/null || echo '(none)'"
}

fetch_backup() {
    local archive_name="$1" dest="$2"
    info "Downloading $archive_name..."
    rsync -avh --progress -e "ssh -i $SSH_KEY -p $STORAGE_PORT" \
        "$STORAGE_USER@$STORAGE_HOST:$REMOTE_DIR/$archive_name" "$dest"
}

restore() {
    local archive_path="$1"
    local restore_dir
    restore_dir="$(mktemp -d)"
    trap 'rm -rf "$restore_dir"' EXIT

    info "Extracting archive..."
    tar -xzf "$archive_path" -C "$restore_dir"

    # Detect compose filename
    local compose_file=""
    for f in docker-compose.yaml docker-compose.yml compose.yml; do
        [ -f "$restore_dir/$f" ] && compose_file="$f" && break
    done
    [ -z "$compose_file" ] && { err "No docker-compose file in backup"; exit 1; }

    # Stop existing
    docker compose down 2>/dev/null || true
    ok "Forgejo stopped"

    # Backup current data defensively
    local ts
    ts="$(date +%Y%m%d-%H%M%S)"
    if [ -d forgejo ] || [ -d conf ]; then
        confirm "Existing data found, proceed with restore?"
        mkdir -p "/tmp/forgejo-pre-restore-$ts"
        [ -d forgejo ] && cp -a forgejo "/tmp/forgejo-pre-restore-$ts/"
        [ -d conf ]    && cp -a conf    "/tmp/forgejo-pre-restore-$ts/"
        ok "Current data backed up to /tmp/forgejo-pre-restore-$ts/"
    fi

    # Restore core data
    [ -d "$restore_dir/forgejo" ] && cp -a "$restore_dir/forgejo" ./forgejo
    [ -d "$restore_dir/conf" ]    && cp -a "$restore_dir/conf"    ./conf
    [ -f "$restore_dir/Caddyfile" ] && cp "$restore_dir/Caddyfile" ./
    cp "$restore_dir/$compose_file" "./$compose_file"

    # Fix ownership (Forgejo container runs as uid=108/gid=110)
    chown -R 108:110 ./forgejo ./conf 2>/dev/null || \
        warn "Could not set ownership (run as root to fix)"

    ok "Data restored"

    # Restore forgejo-shell.sh if present
    if [ -f "$restore_dir/forgejo-shell.sh" ]; then
        cp "$restore_dir/forgejo-shell.sh" "/home/git/forgejo-shell.sh"
        chmod +x "/home/git/forgejo-shell.sh"
        chown git:git "/home/git/forgejo-shell.sh" 2>/dev/null || true
        ok "forgejo-shell.sh restored"
    fi

    # Start services
    docker compose up -d
    for i in $(seq 1 30); do
        sleep 2
        if curl -sf -o /dev/null "http://127.0.0.1:3000/api/healthz" 2>/dev/null; then
            ok "Forgejo is healthy"
            break
        fi
    done

    echo ""
    echo "================================================================"
    echo "  Data restore complete."
    echo ""
    echo "  SSH forwarding needs manual steps (requires root):"
    echo ""
    if [ -f "$restore_dir/sshd_config.backup" ]; then
        echo "  1. Append Match User git block to /etc/ssh/sshd_config:"
        echo "     sudo tee -a /etc/ssh/sshd_config < $restore_dir/sshd_config.backup"
    fi
    echo "  2. Set git user shell:"
    echo "     sudo usermod -s /home/git/forgejo-shell.sh git"
    echo "  3. Restart SSH:"
    echo "     sudo systemctl restart ssh"
    echo "  4. Verify:"
    echo "     ssh -T git@git.example.com"
    echo "================================================================"
}

main() {
    if [ "$1" = "--list" ] || [ "$1" = "-l" ]; then
        check_prerequisites; list_backups; return
    fi

    check_prerequisites

    if [ -n "${1:-}" ] && [ "${1#--}" = "$1" ]; then
        # Use local archive
        [ -f "$1" ] || { err "File not found: $1"; exit 1; }
        restore "$(realpath "$1")"
    else
        # Fetch latest from StorageBox
        local latest
        latest=$(ssh -i "$SSH_KEY" -p "$STORAGE_PORT" -o BatchMode=yes \
            "$STORAGE_USER@$STORAGE_HOST" \
            "ls -t $REMOTE_DIR/forgejo-backup-*.tar.gz 2>/dev/null | head -1" || true)
        [ -z "$latest" ] && { err "No backups found"; exit 1; }
        local temp_dir; temp_dir="$(mktemp -d)"
        fetch_backup "$(basename "$latest")" "$temp_dir"
        restore "$temp_dir/$(basename "$latest")"
        rm -rf "$temp_dir"
    fi
}

main "$@"
```

Usage:

```bash
# List available backups
./forgejo-restore.sh --list

# Restore the latest backup
./forgejo-restore.sh

# Restore a specific backup archive
./forgejo-restore.sh /path/to/forgejo-backup-20260606-120000.tar.gz
```

The script handles the full restore automatically:

| Step            | What it does                                          |
| --- | --- |
| Prerequisites   | Checks Docker, Docker Compose, StorageBox connectivity |
| Fetch           | Downloads the backup archive from StorageBox           |
| Extract         | Untars the archive to a temporary directory            |
| Stop            | Runs `docker compose down` to stop any running service |
| Defensive copy  | Backs up current `./forgejo` and `./conf` before overwriting |
| Restore data    | Copies forgejo/, conf/, Caddyfile, compose file back   |
| Restore shell   | Restores `forgejo-shell.sh` for SSH forwarding         |
| Fix ownership   | Sets `108:110` on data directories                     |
| Start           | Runs `docker compose up -d` and waits for health check |
| Print SSH steps | Shows the remaining root-required SSH config steps     |

After the script finishes, two SSH config steps are left for you to do manually
(because they need root), but the script tells you exactly what to run.

## Upgrade Forgejo

The compose file pins a rolling tag (`15-rootless`), so an upgrade is a pull plus
a container recreate — Forgejo runs the database migration on start. Patch
releases land every few weeks, and security fixes ship in them, so it is worth
doing this regularly.

### 1. Back up first

An upgrade is only reversible if you have a snapshot. The backup script from the
previous section produces a stop-consistent one:

```bash
sudo /home/git/backup.sh
```

It stops the stack, archives `forgejo/` + `conf/` + the compose/Caddy/SSH files,
uploads the archive to the StorageBox, and starts the stack again.

### 2. Flush the queues

Queues hold serialized data that Forgejo does not guarantee to be compatible
across versions, so drain them before switching images:

```bash
cd /home/git
docker exec forgejo forgejo manager flush-queues
```

### 3. Pull the new image and recreate

```bash
cd /home/git
docker compose pull forgejo
docker compose up -d forgejo
```

Because the tag is rolling, `pull` fetches the newest release of that series
(`15.0.2` → `15.0.9`). Only `forgejo` is recreated — Caddy and Anubis keep
running, and the health endpoint answers again within seconds.

### 4. Verify

```bash
docker exec forgejo forgejo --version            # forgejo version 15.0.9+...
curl -sf http://127.0.0.1:3000/api/healthz       # "status": "pass"
docker exec forgejo forgejo doctor check --all   # All done (checks: 28)
```

Then exercise the real entry points: open the web UI, push a commit, and run
`ssh -T git@git.example.com` from a machine with a registered key. `doctor check`
is cheap and catches most of what a migration can leave behind — run it before
you walk away.

### 5. Read the release notes for the versions you skipped

Each release page has a "things to know when upgrading" list. Patch releases are
usually uneventful, but minor and major ones are not: the 16.0 series, for
instance, centralizes the per-repository Git hooks and lets you delete the old
generated `hooks/` directories. Check the notes for every version between the old
and the new one before pulling.

### Rolling back

Restore the backup instead of downgrading the image. Forgejo stores the database
version inside the database and refuses to start when it is downgraded, so
changing the tag back to `15.0.2-rootless` will not save you once the migration
has run — you get an `Unexpected database version` error. Use the archive from
step 1 and follow the "Restore Forgejo" section above.

## Forgejo Actions runner

Forgejo **does not run workflows itself**. Actions is enabled by default, but a job
sits in the queue forever until a separate **Forgejo Runner** process — a small daemon
that polls the instance, starts job containers with Docker, and streams logs back —
picks it up. The runner has its own release line, independent from the Forgejo
version: Forgejo 15.0.9 works fine with runner 13.2.0.

Run it on a **separate machine**. The runner needs `/var/run/docker.sock` in order to
start job containers, which is equivalent to root on whatever host it runs on, and CI
jobs are bursty: one job that allocates all the memory will take the web server and the
database down with it if they share a box. A 2 vCPU / 4 GB instance is plenty.

### 1. Register the runner

Registration uses a shared secret rather than a Web UI token. Generate one and register
it against a scope — prefer your user over the whole instance, so the runner cannot
pick up jobs belonging to other owners:

```bash
SECRET=$(openssl rand -hex 20)
docker exec forgejo forgejo forgejo-cli actions register \
  --name forgejo-runner-helsinki \
  --scope youruser \
  --secret "$SECRET" \
  -w /var/lib/gitea
```

- `-w /var/lib/gitea` is the work path of the rootless image. Without it the command
  cannot find `app.ini` and exits.
- The command prints a UUID. You need that UUID plus `$SECRET` in the next step.
- The first 16 hex characters of the secret are the runner identifier, so when you
  rotate the secret, keep those 16 and change only the remaining 24.

### 2. Runner host: the project directory

Put the runner in `/opt/forgejo-runner`, **not** in `/root`:

```bash
mkdir -p /opt/forgejo-runner/data
cd /opt/forgejo-runner
```

`/root` is mode 700. The container has to read `/data/config.yml`, and any user that
cannot traverse `/root` fails with
`Error: invalid configuration: cannot open config file "/data/config.yml": permission denied`.
`/opt` sidesteps the whole question.

### 3. Docker Compose and the runner config

`docker-compose.yml`:

```yaml
services:
  runner:
    image: code.forgejo.org/forgejo/runner:13
    container_name: forgejo-runner
    user: "0:0"
    restart: unless-stopped
    environment:
      - DOCKER_HOST=unix:///var/run/docker.sock
    volumes:
      - ./data:/data
      - /var/run/docker.sock:/var/run/docker.sock
    command: sh -c "forgejo-runner daemon --config /data/config.yml"
```

`user: "0:0"` is needed because the daemon writes to `/data` and drives the Docker
socket. Mounting the socket already gives the container effective root on the host, so
running it as root adds no new exposure.

`data/config.yml`:

```yaml
runner:
  capacity: 1
  timeout: 1h
  fetch_interval: 3s
  labels:
    - "ubuntu-latest:docker://data.forgejo.org/oci/node:22-bookworm"
    - "ubuntu-24.04:docker://data.forgejo.org/oci/node:22-bookworm"
    - "python-3.13:docker://docker.io/library/python:3.13-bookworm"

server:
  connections:
    forgejo:
      url: https://git.example.com/
      uuid: <uuid from step 1>
      token: <secret from step 1>

container:
  options: "--memory=2g --cpus=1"
  privileged: false

cache:
  enabled: true
  dir: "/data/cache"
```

Four things in here matter more than they look:

- **`capacity: 1`** — one job at a time. Jobs cannot starve each other, and you get
  predictable resource use on a small machine.
- **`container.options`** is the only place resource limits can be set. Without it a
  job may allocate everything the host has. `--memory` is officially supported (runner
  ≥ 11.2.0); `--cpus` is not documented but works.
- **Label names cannot contain a colon.** `python:3.13:docker://…` is parsed as label
  `python` with scheme `3.13`, and the container crash-loops with
  `label "python" uses unknown scheme "3.13": expected a built-in scheme (host, docker, lxc)`.
  Write `python-3.13` instead — hyphens are fine, as `ubuntu-24.04` shows.
- **Never use the `host` scheme for `runs-on`.** Jobs in host mode run directly on the
  runner machine with no isolation and no resource limits at all.

### 4. Start it and read the log

```bash
docker compose up -d
docker logs forgejo-runner | tail -3
```

Expected:

```
runner: forgejo-runner-helsinki, with version: v13.2.0, with labels: [ubuntu-latest ubuntu-24.04 python-3.13], ephemeral: false, declared successfully
[poller] launched
```

### 5. Enable Actions on a repository

A minimal instance usually sets `DEFAULT_REPO_UNITS = repo.code`, so a new repository
has **no Actions unit**. Pushing a workflow file then does nothing at all — no error,
no run, and the runner log only shows poller activity. Enable it per repository:

```bash
curl -X PATCH https://git.example.com/api/v1/repos/youruser/yourrepo \
  -H "Authorization: token $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"has_actions": true}'
```

Changing `DEFAULT_REPO_UNITS` only affects repositories created afterwards, so existing
ones have to be switched on individually.

### 6. Verify end to end

Push a workflow to a repository that has Actions enabled:

```yaml
# .forgejo/workflows/smoke.yml
name: smoke
on: [push, workflow_dispatch]

jobs:
  hello:
    runs-on: ubuntu-latest
    steps:
      - name: show environment
        run: |
          echo "=== runner works ==="
          uname -a
          nproc
          free -m | head -2
```

Then check both sides — the runner log for pickup, the API for the result:

```bash
docker logs forgejo-runner | tail -3
# task 2 repo is youruser/yourrepo https://data.forgejo.org https://git.example.com/
# Cleaning up network for job hello, and network name is: WORKFLOW-…

curl -s -H "Authorization: token $TOKEN" \
  "https://git.example.com/api/v1/repos/youruser/yourrepo/actions/tasks" \
  | grep -o '"status":"[a-z]*"' | head -1
# "status":"success"
```

Job logs live on the **Forgejo** host, not on the runner, at
`/home/git/forgejo/actions_log/{owner}/{repo}/{run_index:02d}/{run_id}.log.zst`.
They are zstd-compressed, so read them with `zstd -dc`.

### 7. Harden the runner host

A fresh cloud image is permissive: `PermitRootLogin yes`, `PasswordAuthentication yes`,
no firewall, no swap. This host accepts SSH from the internet, so close that first.
Check what is actually in effect rather than what you think you configured:

```bash
sshd -T | grep -Ei 'permitrootlogin|passwordauthentication'
```

```bash
# Firewall — allow SSH before enabling, or you cut your own session
ufw allow 22/tcp
ufw default deny incoming
ufw default allow outgoing
ufw --force enable

# fail2ban
apt-get install -y fail2ban python3-systemd
# /etc/fail2ban/jail.local:
#   [DEFAULT]  backend = systemd / bantime = 1h / findtime = 10m / maxretry = 5
#   [sshd]     enabled = true / mode = aggressive / port = 22
#              journalmatch = _SYSTEMD_UNIT=ssh.service
fail2ban-client -t && systemctl restart fail2ban

# SSH
# /etc/ssh/sshd_config.d/99-hardening.conf:
#   PasswordAuthentication no
#   KbdInteractiveAuthentication no
#   PermitRootLogin prohibit-password
#   PubkeyAuthentication yes
sshd -t && systemctl reload ssh

# Swap — without it the OOM killer takes the runner and its containers out together
fallocate -l 1G /swapfile
chmod 600 /swapfile
mkswap /swapfile && swapon /swapfile
grep -q '^/swapfile' /etc/fstab || echo "/swapfile none swap sw 0 0" >> /etc/fstab
```

Three of these need more than the command:

**fail2ban is installed but not working by default on Ubuntu 24.04.** Two problems
stack up. The SSH daemon logs `Failed password` as `sshd-session`, not `sshd`, so a
match on `_COMM=sshd` finds nothing. On top of that, Debian's
`/etc/fail2ban/jail.d/defaults-debian.conf` overrides the — correct — match from the
filter file with `_SYSTEMD_UNIT=ssh.service + _COMM=sshd`, and **fail2ban treats `+`
as AND**, unlike journalctl where it means OR. You end up with a jail that reports
`Total failed: 0` while the log fills with brute-force attempts. Match on the unit
alone and let the filter's `_daemon = sshd(?:-session)?` regex do the discriminating:

```ini
[sshd]
journalmatch = _SYSTEMD_UNIT=ssh.service
```

Do not trust `systemctl is-active` for this — prove it bans. Six failed logins from
another host (maxretry is 5) should put that IP in the banned list:

```bash
ssh -o BatchMode=yes -o PubkeyAuthentication=no \
  -o PreferredAuthentications=password nobody@runner.example.com exit
fail2ban-client status sshd
fail2ban-client set sshd unbanip <that-ip>
```

**Drop-in files: the first value read wins.** OpenSSH reads
`/etc/ssh/sshd_config.d/*.conf` in glob order and keeps the **first** value it sees for
each parameter — a later file does not override an earlier one. So `99-hardening.conf`
wins over `99-pw.conf` no matter which one you meant. If you are unsure whether
hardening took effect, read the effective configuration instead of reasoning about
filenames:

```bash
sshd -T | grep -Ei 'permitrootlogin|passwordauthentication'
```

Delete the leftover temporary file anyway. A stale config that no longer does anything
is a trap for whoever debugs this next.

**Verify the firewall did not break CI.** UFW's default `deny (routed)` policy, mixed
with Docker's own forwarding rules, is a classic way to silently cut job containers off
from the network. Docker usually wins that ordering, but "usually" is not evidence —
put a network check in the smoke workflow and let it fail loudly:

```yaml
      - name: egress check
        run: |
          curl -sS -o /dev/null -w "forgejo:  %{http_code}\n" https://git.example.com/api/v1/version
          curl -sS -o /dev/null -w "registry: %{http_code}\n" https://registry-1.docker.io/v2/
```

No `|| true`: a job that reports `success` then proves the containers can still reach
the network. A `401` from the Docker registry is the expected answer — reachable, but
unauthenticated.

### What to back up on the runner host

Almost nothing, but do copy `data/config.yml` somewhere safe: it holds the UUID and
the secret. Everything else — the image, the job cache — is reproducible. Lose the
file and you register a new runner with a new secret against the same instance; no
Forgejo data is affected.

