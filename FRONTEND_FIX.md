# Frontend Configuration Fix

## Issue
The frontend is not displaying properly when connecting to the production API.

## What Was Fixed

1. **Updated API Base URL** to automatically use production URL:
   - `web/src/services/api.js` - Now uses `https://insurance-system.fly.dev/api` in production
   - `web/src/services/realTimeService.js` - Socket.io now connects to production URL
   - `web/src/components/PublicVerification.jsx` - Updated to use production URL
   - `web/src/components/PublicClaims.jsx` - Updated to use production URL

## How It Works Now

- **Development**: Uses `/api` (relative URL, works with Vite proxy)
- **Production**: Automatically uses `https://insurance-system.fly.dev/api`

## To Use the Frontend

### Option 1: Run Locally (Development)
```bash
cd web
npm run dev
```
The frontend will use the Vite proxy to connect to your local backend, or if you set `VITE_API_URL`, it will use that.

### Option 2: Deploy Frontend (Production)

1. **Build the frontend:**
```bash
cd web
npm run build
```

2. **Deploy to a hosting service** (Vercel, Netlify, etc.):
   - The built files are in `web/dist/`
   - Set environment variable: `VITE_API_URL=https://insurance-system.fly.dev/api`
   - Or it will automatically use the production URL

### Option 3: Set Environment Variable Locally

Create `web/.env.local`:
```env
VITE_API_URL=https://insurance-system.fly.dev/api
```

Then run:
```bash
cd web
npm run dev
```

## Testing

After updating, test the frontend:
1. Open browser console (F12)
2. Check Network tab for API calls
3. Verify API calls are going to `https://insurance-system.fly.dev/api`
4. Check for any CORS errors

## Common Issues

1. **CORS Errors**: Already fixed - backend allows all origins in production
2. **404 on /api**: Fixed - added `/api` endpoint
3. **Frontend not loading**: Make sure you're accessing the frontend URL, not the API URL
4. **API calls failing**: Check browser console for specific error messages

