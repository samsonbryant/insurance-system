# IVAS Web Portal

Modern web portal for the Insurance Verification & Authentication System.

## Features

- 🎨 Modern, responsive UI built with React and Tailwind CSS
- 🔐 Role-based authentication and access control
- 📊 Real-time dashboard updates
- 📱 Fully responsive design
- 🚀 Fast development with Vite
- 🔄 Real-time notifications via Socket.IO

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend server running on port 3000

### Installation

```bash
cd web
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:3002`

### Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
web/
├── src/
│   ├── components/     # Reusable components
│   ├── context/       # React contexts (Auth, etc.)
│   ├── pages/         # Page components
│   ├── routes/        # Route configurations
│   ├── services/      # API and services
│   ├── store/         # Redux store
│   └── App.jsx        # Main app component
```

## User Roles

- **Admin**: Full system access
- **CBL**: Central Bank oversight
- **Insurer**: Insurance company management
- **Insured**: Policy holder access
- **Company**: Company management
- **Officer**: Document verification

## Environment Variables

Create a `.env` file:

```
VITE_API_URL=http://localhost:3000/api
```

## License

Proprietary - Insurance Verification & Authentication System

