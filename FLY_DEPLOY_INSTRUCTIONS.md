# Fly.io Deployment - Volume Issue Fix

## Problem
The machine has a volume mounted but the config doesn't match. 

## Solution Applied
Removed the `[[mounts]]` section from `fly.toml` to use temporary storage.

## Next Steps

### 1. Detach the Volume from the Machine
Run this command to detach the existing volume:
```bash
flyctl machine stop e8254d3c2347d8 -a insurance-system
flyctl machine remove e8254d3c2347d8 -a insurance-system --force
```

Or detach just the volume:
```bash
# First, list volumes to get the volume ID
flyctl volumes list -a insurance-system

# Then detach it (replace <volume-id> with actual ID)
flyctl volumes detach <volume-id> -a insurance-system
```

### 2. Update Environment Variable
Set SQLite to use temporary storage (data will be lost on restart):
```bash
flyctl secrets set SQLITE_STORAGE=/tmp/dev.sqlite -a insurance-system
```

### 3. Deploy Again
```bash
flyctl deploy -a insurance-system
```

## Alternative: Use Persistent Volume (Recommended for Production)

If you need persistent storage:

1. **Check existing volume name:**
```bash
flyctl volumes list -a insurance-system
flyctl machine status e8254d3c2347d8 -a insurance-system
```

2. **Update fly.toml with correct volume name:**
```toml
[[mounts]]
  source = "<actual-volume-name>"
  destination = "/data"
```

3. **Set environment variable:**
```bash
flyctl secrets set SQLITE_STORAGE=/data/dev.sqlite -a insurance-system
```

4. **Deploy:**
```bash
flyctl deploy -a insurance-system
```

## For Production: Use Managed Database

For production, consider using Fly Postgres instead of SQLite:
```bash
flyctl postgres create --name insurance-system-db
flyctl postgres attach insurance-system-db -a insurance-system
```

Then update your environment variables to use PostgreSQL instead of SQLite.

