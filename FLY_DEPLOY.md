# Fly.io Deployment Instructions

## Quick Deploy

Since you already have the app deployed, you can redeploy with the new changes:

### Option 1: Using Fly CLI (if installed)
```bash
# Navigate to project directory
cd /Users/user/Desktop/Insurrance_Verification_System

# Deploy to Fly.io
flyctl deploy

# Or if using 'fly' command
fly deploy
```

### Option 2: Using GitHub Actions (if configured)
If you have GitHub Actions set up, the deployment will happen automatically when you push to main.

### Option 3: Manual Deploy via Fly.io Dashboard
1. Go to https://fly.io/dashboard
2. Select your app: `insurance-system`
3. Click "Deploy" or "Redeploy"
4. Connect to your GitHub repository if not already connected
5. Fly.io will build and deploy automatically

## Setting Environment Variables

Make sure these are set in Fly.io:

```bash
flyctl secrets set NODE_ENV=production
flyctl secrets set PORT=3000
flyctl secrets set JWT_SECRET=your_jwt_secret_here
flyctl secrets set JWT_REFRESH_SECRET=your_refresh_secret_here
flyctl secrets set DB_DIALECT=sqlite
flyctl secrets set USE_SQLITE=true
flyctl secrets set SQLITE_STORAGE=/data/dev.sqlite
```

Or via Fly.io dashboard:
1. Go to your app settings
2. Navigate to "Secrets"
3. Add each environment variable

## Verify Deployment

After deployment, test the API:
```bash
curl https://insurance-system.fly.dev/health
curl https://insurance-system.fly.dev/api/companies/public
```

## View Logs

```bash
flyctl logs
```

## Troubleshooting

If deployment fails:
1. Check logs: `flyctl logs`
2. Verify Dockerfile is correct
3. Ensure all environment variables are set
4. Check that port 3000 is exposed correctly

