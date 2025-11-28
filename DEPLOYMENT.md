# Deployment Guide for Fly.io

## Backend Deployment (Fly.io)

Your backend is deployed at: **https://insurance-system.fly.dev**

### Current Status
✅ Backend API is running and accessible
✅ API endpoints are responding correctly

### Configuration Updates Made

1. **CORS Configuration**: Updated to allow all origins in production
   - This fixes CORS errors when frontend makes requests
   - Location: `server/index.js`

### Environment Variables Needed on Fly.io

Set these environment variables in your Fly.io app:

```bash
fly secrets set NODE_ENV=production
fly secrets set PORT=3000
fly secrets set JWT_SECRET=your_super_secret_jwt_key_here
fly secrets set JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
fly secrets set DB_DIALECT=sqlite
fly secrets set USE_SQLITE=true
fly secrets set SQLITE_STORAGE=/data/dev.sqlite
```

Or if using MySQL:
```bash
fly secrets set DB_DIALECT=mysql
fly secrets set DB_HOST=your_mysql_host
fly secrets set DB_PORT=3306
fly secrets set DB_NAME=ivas_db
fly secrets set DB_USER=your_db_user
fly secrets set DB_PASSWORD=your_db_password
```

### Frontend Configuration

To connect your frontend to the deployed backend:

1. **Create `.env` file in `web/` directory:**
```env
VITE_API_URL=https://insurance-system.fly.dev/api
```

2. **Rebuild the frontend:**
```bash
cd web
npm run build
```

3. **Deploy frontend** (to Vercel, Netlify, or another service):
   - Set environment variable: `VITE_API_URL=https://insurance-system.fly.dev/api`
   - Or update `web/src/services/api.js` to use the production URL

### Testing the API

Test the deployed API:
```bash
curl https://insurance-system.fly.dev/health
curl https://insurance-system.fly.dev/api/companies/public
```

### Security Recommendations

1. **CORS**: Currently allows all origins. For better security, update `server/index.js` to specify your frontend domain:
```javascript
origin: process.env.NODE_ENV === 'production'
  ? ["https://your-frontend-domain.com"]  // Replace with your actual frontend URL
  : [...]
```

2. **Environment Variables**: Never commit `.env` files. Use Fly.io secrets.

3. **Database**: Use a managed database service (like Fly Postgres) for production instead of SQLite.

### Troubleshooting

**CORS Errors:**
- ✅ Fixed: CORS now allows all origins in production
- If you want to restrict, update the `origin` array in `server/index.js`

**Connection Errors:**
- Verify the API URL is correct: `https://insurance-system.fly.dev`
- Check Fly.io logs: `fly logs`

**Database Issues:**
- Ensure database migrations have run
- Check database connection in Fly.io logs

