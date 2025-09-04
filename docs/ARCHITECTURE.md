# Project Structure Documentation

## 📁 Directory Structure

The complaint management system has been restructured for better organization and maintainability:

```
complaint-management-system/
├── README.md                    # Main project documentation
├── package.json                 # Root package.json for workspace management
├── .gitignore                   # Git ignore rules
├── backend/                     # Node.js/Express backend
│   ├── src/
│   │   ├── config/             # Database and app configuration
│   │   ├── middleware/         # Express middleware (auth, error handling)
│   │   ├── models/             # Database models (User, Complaint)
│   │   ├── routes/             # API route definitions
│   │   ├── services/           # Business logic services (AI, etc.)
│   │   ├── socket/             # Socket.io handlers for real-time features
│   │   ├── validators/         # Input validation schemas
│   │   └── server.ts           # Application entry point
│   ├── scripts/                # Database seeding and utility scripts
│   ├── package.json            # Backend dependencies
│   ├── tsconfig.json           # TypeScript configuration
│   ├── .env.example            # Environment variables template
│   └── README.md               # Backend-specific documentation
├── frontend/                   # React + TypeScript frontend
│   ├── src/
│   │   ├── components/         # React components organized by feature
│   │   │   ├── analytics/      # Analytics and reporting components
│   │   │   ├── auth/           # Authentication components
│   │   │   ├── chatbot/        # AI chatbot components
│   │   │   ├── common/         # Shared/reusable components
│   │   │   ├── complaints/     # Complaint management components
│   │   │   ├── dashboard/      # Dashboard components
│   │   │   ├── home/           # Landing page components
│   │   │   └── notifications/  # Notification components
│   │   ├── contexts/           # React context providers
│   │   ├── services/           # API communication services
│   │   ├── main.tsx            # Application entry point
│   │   ├── App.tsx             # Main app component
│   │   └── index.css           # Global styles
│   ├── public/                 # Static assets
│   ├── package.json            # Frontend dependencies
│   ├── vite.config.ts          # Vite configuration
│   ├── tailwind.config.js      # Tailwind CSS configuration
│   └── tsconfig.json           # TypeScript configuration
├── docs/                       # Project documentation
│   ├── USER_ADMIN_COORDINATION.md     # User-admin workflow guide
│   ├── DEMO_GUIDE.md                  # Demo and testing guide
│   ├── FRONTEND_README.md             # Frontend-specific documentation
│   └── ARCHITECTURE.md               # System architecture (this file)
└── scripts/                    # Development and deployment scripts
    ├── setup.js                # Cross-platform setup script
    ├── setup.sh                # Unix setup script
    ├── setup.bat               # Windows setup script
    └── dev-start.bat           # Windows development startup script
```

## 🏗️ Architecture Overview

### Backend Architecture
- **RESTful API** using Express.js and TypeScript
- **MongoDB** with Mongoose ODM for data persistence
- **Socket.io** for real-time features
- **JWT** authentication with middleware protection
- **Joi** validation for request data
- **AI Service** integration for complaint categorization

### Frontend Architecture
- **React 18** with TypeScript for type safety
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Context API** for state management
- **Component-based** architecture with feature organization

## 🔄 Data Flow

```
User Interface (React) 
    ↕ HTTP/WebSocket
API Gateway (Express)
    ↕ Mongoose
Database (MongoDB)
```

## 🚀 Development Workflow

### 1. Initial Setup
```bash
# Install root dependencies
npm install

# Setup both frontend and backend
npm run setup

# Or run the platform-specific setup script
# Windows: scripts/setup.bat
# Unix/Linux: scripts/setup.sh
```

### 2. Development
```bash
# Start both frontend and backend in development mode
npm run dev

# Or start them separately
npm run dev:backend
npm run dev:frontend
```

### 3. Building
```bash
# Build both applications
npm run build

# Or build separately
npm run build:backend
npm run build:frontend
```

## 📦 Package Management

The project uses npm workspaces for efficient dependency management:

- **Root package.json**: Contains scripts for managing both applications
- **Backend package.json**: Backend-specific dependencies
- **Frontend package.json**: Frontend-specific dependencies

## 🛠️ Development Tools

### Backend Tools
- **TypeScript**: Type checking and compilation
- **Nodemon**: Automatic server restart during development
- **ESLint**: Code linting
- **Jest**: Unit testing framework

### Frontend Tools
- **Vite**: Fast development server and bundler
- **ESLint**: Code linting
- **TypeScript**: Type checking
- **Tailwind CSS**: Utility-first CSS framework

## 🔧 Configuration Files

### Backend
- `tsconfig.json`: TypeScript compiler options
- `.env`: Environment variables (not committed)
- `.env.example`: Environment variables template

### Frontend
- `vite.config.ts`: Vite bundler configuration
- `tailwind.config.js`: Tailwind CSS configuration
- `tsconfig.json`: TypeScript compiler options

## 📚 Documentation Organization

Documentation is organized in the `docs/` directory:

- **README.md**: Main project overview and setup
- **USER_ADMIN_COORDINATION.md**: Workflow between users and admins
- **DEMO_GUIDE.md**: Demo scenarios and testing guide
- **ARCHITECTURE.md**: This file - technical architecture details

## 🔒 Security Considerations

- Environment variables for sensitive data
- JWT token-based authentication
- Input validation on all API endpoints
- CORS configuration for cross-origin requests
- Helmet.js for security headers

## 🧪 Testing Strategy

- Unit tests for backend business logic
- Integration tests for API endpoints
- Component tests for React components
- End-to-end tests for critical user flows

## 📈 Scalability Considerations

- Modular component architecture
- Service-based backend organization
- Database indexing for performance
- Socket.io for real-time scalability
- Stateless API design for horizontal scaling
