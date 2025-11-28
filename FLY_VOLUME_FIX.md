# Fixing Fly.io Volume Mount Error

## The Problem
The error "machine has a volume mounted but app config does not specify a volume" means:
- Your machine has a volume attached
- But the volume name in `fly.toml` doesn't match the actual volume name

## Solution Options

### Option 1: Check and Use the Correct Volume Name

1. **List volumes for your app:**
```bash
flyctl volumes list -a insurance-system
```

2. **Check what volume is attached to the machine:**
```bash
flyctl machine status e8254d3c2347d8 -a insurance-system
```

3. **Update `fly.toml` with the correct volume name** (if different from `insurance_system_data`)

### Option 2: Remove the Volume (if you don't need persistent storage)

If you don't need the SQLite database to persist, you can remove the volume:

1. **Detach the volume from the machine:**
```bash
flyctl volumes detach <volume-id> -a insurance-system
```

2. **Remove the `[[mounts]]` section from `fly.toml`**

3. **Update environment variable** to use a non-persistent path:
```bash
flyctl secrets set SQLITE_STORAGE=/tmp/dev.sqlite
```

### Option 3: Create the Volume with the Correct Name

If the volume doesn't exist, create it:

```bash
flyctl volumes create insurance_system_data --size 3 --region iad -a insurance-system
```

## Current Configuration

The `fly.toml` now has:
```toml
[[mounts]]
  source = "insurance_system_data"
  destination = "/data"
```

Make sure:
1. The volume name `insurance_system_data` matches what's on Fly.io
2. Or update it to match the existing volume name
3. The environment variable `SQLITE_STORAGE=/data/dev.sqlite` is set

## After Fixing

Redeploy:
```bash
flyctl deploy -a insurance-system
```

