# IVAS Setup and Installation Guide

## Prerequisites

### System Requirements
- Node.js 16+ and npm
- MySQL 8.0+
- Expo CLI (`npm install -g @expo/cli`)
- Git

### Development Tools
- VS Code (recommended)
- MySQL Workbench or similar database tool
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

## Backend Setup

### 1. Database Configuration

1. **Install MySQL** and create a database:
```sql
CREATE DATABASE ivas_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'ivas_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON ivas_db.* TO 'ivas_user'@'localhost';
FLUSH PRIVILEGES;
```

2. **Configure Environment Variables**:
```bash
cd server
cp env.example .env
```

Edit `.env` file with your database credentials:
```env
NODE_ENV=development
PORT=3000
CLIENT_URL=http://localhost:19006

DB_HOST=localhost
DB_PORT=3306
DB_NAME=ivas_db
DB_USER=ivas_user
DB_PASSWORD=your_secure_password

JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here_change_this_in_production
JWT_REFRESH_EXPIRES_IN=7d
```

### 2. Install Dependencies and Setup Database

```bash
cd server
npm install

# Run database migrations
npm run db:migrate

# Seed the database with initial data
npm run db:seed
```

### 3. Start the Backend Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

## Mobile App Setup

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Configure API Endpoint

Update the API base URL in `mobile/src/services/api.js`:
```javascript
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api'  // Development
  : 'https://your-production-api.com/api';  // Production
```

### 3. Start the Mobile App

```bash
# Start Expo development server
expo start

# Or use npm scripts
npm start
```

## Default Login Credentials

After running the database seeder, you can use these default accounts:

### Admin Account
- **Username**: `admin`
- **Password**: `admin123`
- **Role**: Admin (full system access)

### Company Account
- **Username**: `lic_manager`
- **Password**: `company123`
- **Role**: Company (Liberia Insurance Corporation)

### Officer Account
- **Username**: `officer1`
- **Password**: `officer123`
- **Role**: Security Officer

## Testing the System

### 1. Backend API Testing

Test the API endpoints using curl or Postman:

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Get companies (requires authentication)
curl -X GET http://localhost:3000/api/companies \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Mobile App Testing

1. **Install Expo Go** on your mobile device
2. **Scan the QR code** from the Expo development server
3. **Login** with one of the default accounts
4. **Test verification** using the sample policy numbers:
   - `LIC-AUTO-001-2023` (Valid)
   - `FIC-AUTO-002-2023` (Valid)
   - `FAKE-POLICY-001` (Fake)

## Production Deployment

### Backend Deployment (AWS/Heroku)

1. **Set up production environment variables**:
```env
NODE_ENV=production
PORT=3000
CLIENT_URL=https://your-app-domain.com

DB_HOST=your-production-db-host
DB_PORT=3306
DB_NAME=ivas_production
DB_USER=your-production-user
DB_PASSWORD=your-secure-production-password

JWT_SECRET=your-super-secure-production-jwt-secret
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-super-secure-production-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d
```

2. **Deploy to your chosen platform**:
```bash
# For Heroku
git add .
git commit -m "Deploy to production"
git push heroku main

# For AWS EC2
# Upload files and run:
npm install --production
npm run db:migrate
npm start
```

### Mobile App Deployment

1. **Build for production**:
```bash
cd mobile

# For Android
expo build:android

# For iOS
expo build:ios
```

2. **Submit to app stores**:
```bash
# Submit to Google Play Store
expo upload:android

# Submit to Apple App Store
expo upload:ios
```

## Security Considerations

### 1. Environment Variables
- Never commit `.env` files to version control
- Use strong, unique passwords for production
- Rotate JWT secrets regularly

### 2. Database Security
- Use SSL connections in production
- Implement database backups
- Use connection pooling
- Regular security updates

### 3. API Security
- Enable HTTPS in production
- Implement rate limiting
- Use CORS properly
- Regular security audits

## Troubleshooting

### Common Issues

1. **Database Connection Error**:
   - Check MySQL service is running
   - Verify credentials in `.env`
   - Ensure database exists

2. **Mobile App Can't Connect**:
   - Check API_BASE_URL in `api.js`
   - Ensure backend server is running
   - Check network connectivity

3. **Authentication Issues**:
   - Verify JWT_SECRET is set
   - Check token expiration
   - Clear app storage and re-login

### Logs and Debugging

- **Backend logs**: Check console output or log files
- **Mobile logs**: Use Expo CLI logs or React Native debugger
- **Database logs**: Check MySQL error logs

## Support and Maintenance

### Regular Maintenance Tasks
- Update dependencies regularly
- Monitor system performance
- Backup database regularly
- Review audit logs
- Update security patches

### Monitoring
- Set up health check endpoints
- Monitor API response times
- Track error rates
- Monitor database performance

## API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

### Company Endpoints
- `GET /api/companies` - List companies (Admin)
- `POST /api/companies/register` - Register company
- `PUT /api/companies/:id/approve` - Approve company (Admin)

### Policy Endpoints
- `GET /api/policies` - List policies
- `POST /api/policies` - Create policy
- `POST /api/policies/sync` - Sync policies

### Verification Endpoints
- `POST /api/verifications/verify` - Verify document
- `GET /api/verifications` - List verifications

### Report Endpoints
- `GET /api/reports/dashboard` - Dashboard statistics
- `GET /api/reports/verifications` - Verification reports

## License

This project is licensed under the MIT License - see the LICENSE file for details.
