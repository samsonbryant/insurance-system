# Deploy to Fly.io from GitHub Dashboard

## Steps to Redeploy from GitHub

### 1. Access Fly.io Dashboard
Go to: https://fly.io/dashboard/samson-bryant

### 2. Select Your App
- Click on **"insurance-system"** app

### 3. Connect GitHub Repository (if not already connected)
- Go to **Settings** → **Source**
- Click **"Connect GitHub Repository"**
- Select repository: `samsonbryant/insurance-system`
- Authorize Fly.io to access your repository

### 4. Configure Deployment Settings
- Go to **Settings** → **Source**
- Ensure:
  - **Branch**: `main`
  - **Dockerfile path**: `Dockerfile` (or leave default)
  - **Build context**: `.` (root directory)

### 5. Handle the Volume Issue
Before deploying, you need to remove the volume from the existing machine:

**Option A: Via Dashboard**
1. Go to **Machines** tab
2. Find machine `e8254d3c2347d8`
3. Click on it → **Stop** the machine
4. Click **Remove** to delete the machine
5. A new machine will be created on next deploy

**Option B: Via CLI** (if you have flyctl installed)
```bash
flyctl machine remove e8254d3c2347d8 -a insurance-system --force
```

### 6. Deploy
- Go to **Overview** tab
- Click **"Deploy"** or **"Redeploy"** button
- Or go to **Releases** tab → Click **"Deploy latest release"**

### 7. Monitor Deployment
- Watch the deployment progress in the **Monitoring** tab
- Check logs if there are any errors

## Environment Variables to Set

Make sure these are configured in **Settings** → **Secrets**:

```
NODE_ENV=production
PORT=3000
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
DB_DIALECT=sqlite
USE_SQLITE=true
SQLITE_STORAGE=/tmp/dev.sqlite
```

## Current Configuration

- ✅ `fly.toml` - Updated (no volume mount)
- ✅ `Dockerfile` - Ready for deployment
- ✅ CORS - Fixed for production
- ✅ All changes pushed to GitHub

## Troubleshooting

If deployment fails:
1. Check **Logs** tab for error messages
2. Verify environment variables are set
3. Ensure the machine volume is removed
4. Check that GitHub repository is connected correctly

## After Successful Deployment

Test the API:
```bash
curl https://insurance-system.fly.dev/health
curl https://insurance-system.fly.dev/api/companies/public
```

