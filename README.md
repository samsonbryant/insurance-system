# Insurance Verification and Authentication System (IVAS)

A comprehensive mobile-first application for verifying insurance documents in Liberia, built with React Native and Node.js.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- MySQL 8.0+
- Expo CLI
- Git

### Backend Setup
```bash
cd server
npm install
cp env.example .env
# Configure your database credentials in .env
npm run db:migrate
npm run db:seed
npm run dev
```

### Mobile App Setup
```bash
cd mobile
npm install
expo start
```

### Default Login Credentials
- **Admin**: `admin` / `admin123`
- **Company**: `lic_manager` / `company123`
- **Officer**: `officer1` / `officer123`

## 📱 Features

### 🔐 Multi-Role Authentication
- **Admin**: System oversight, company management, user administration
- **Insurance Company**: Policy management, data synchronization, reporting
- **Security Officer**: Document verification, incident reporting

### 📄 Document Verification
- Real-time verification against insurance databases
- QR code scanning capabilities
- Fake document detection with confidence scoring
- GPS location tracking
- Offline verification support

### 🔄 Data Synchronization
- Automated policy data sync from insurance companies
- Manual data upload (CSV/JSON)
- Real-time API integrations
- Scheduled batch processing

### 📊 Comprehensive Reporting
- Role-specific dashboards
- Verification statistics
- Audit trail logging
- Export capabilities (CSV, PDF)

### 🛡️ Security Features
- JWT-based authentication
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Rate limiting and input validation
- Comprehensive audit logging

## 🏗️ Architecture

### Frontend (Mobile)
- **Framework**: React Native with Expo
- **Navigation**: React Navigation
- **State Management**: Redux Toolkit
- **UI Components**: React Native Elements + Paper
- **Camera/Scanning**: React Native Vision Camera

### Backend (API Server)
- **Framework**: Node.js with Express.js
- **Database**: MySQL with Sequelize ORM
- **Authentication**: JWT with refresh tokens
- **Security**: Helmet, CORS, Rate limiting
- **Real-time**: Socket.io for notifications

### Database Schema
- **Users**: Authentication and role management
- **Companies**: Insurance company registrations
- **Policies**: Insurance policy data with SHA-256 hashing
- **Verifications**: Document verification logs
- **AuditLogs**: System activity tracking

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/profile` - Get user profile

### Companies
- `GET /api/companies` - List companies (Admin)
- `POST /api/companies/register` - Register company
- `PUT /api/companies/:id/approve` - Approve company

### Policies
- `GET /api/policies` - List policies
- `POST /api/policies` - Create policy
- `POST /api/policies/sync` - Sync policies

### Verification
- `POST /api/verifications/verify` - Verify document
- `GET /api/verifications` - List verifications

### Reports
- `GET /api/reports/dashboard` - Dashboard statistics
- `GET /api/reports/verifications` - Verification reports

## 🚀 Deployment

### Backend (Production)
1. Set up production environment variables
2. Deploy to AWS EC2, Heroku, or similar
3. Configure MySQL database
4. Enable HTTPS

### Mobile App
1. Build with Expo EAS Build
2. Submit to App Store and Google Play
3. Configure deep linking

## 📋 User Workflows

### Admin Workflow
1. Login → Dashboard → Manage Companies
2. Approve company registrations
3. Assign API keys and sync schedules
4. Monitor system health and reports

### Company Workflow
1. Register company details
2. Admin approves registration
3. Upload policy data or configure API
4. Monitor verification reports

### Officer Workflow
1. Login → Verify Document screen
2. Scan QR code or enter details manually
3. System verifies against database
4. Flag fake documents and log incidents

## 🔒 Security Implementation

- **Authentication**: JWT tokens with refresh mechanism
- **Authorization**: Role-based access control
- **Data Protection**: SHA-256 hashing for policy verification
- **Audit Trail**: Comprehensive logging of all actions
- **Rate Limiting**: Protection against abuse
- **Input Validation**: Sanitization of all inputs

## 📈 Performance Features

- **Caching**: Redis integration for improved performance
- **Pagination**: Efficient data loading
- **Offline Support**: Local storage for critical data
- **Real-time Updates**: Socket.io for live notifications
- **Optimized Queries**: Database indexing and optimization

## 🧪 Testing

### Backend Testing
```bash
cd server
npm test
npm run test:watch
```

### Mobile Testing
- Unit tests with Jest
- Integration tests with React Native Testing Library
- E2E tests with Detox

## 📚 Documentation

- [Setup Guide](SETUP.md) - Detailed installation instructions
- [API Documentation](docs/API.md) - Complete API reference
- [Deployment Guide](docs/DEPLOYMENT.md) - Production deployment
- [Security Guide](docs/SECURITY.md) - Security best practices

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

For technical support:
- Email: support@ivas.gov.lr
- Phone: +231-123-456-7890
- Documentation: [docs/](docs/)

## 🏛️ Government of Liberia

Developed for the Government of Liberia
- Ministry of Finance
- Insurance Commission
- © 2023 All rights reserved