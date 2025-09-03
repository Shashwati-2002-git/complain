# Complaint Management System

A full-stack complaint management application built with React (Frontend), Node.js/Express (Backend), and Python AI Service.

## 🏗️ Project Structure

```
complease/                  # Root project folder
├── frontend/              # React (JS) + TailwindCSS
│   ├── public/            # Static assets (icons, logo, etc.)
│   └── src/
│       ├── assets/        # Images, fonts, icons
│       ├── components/    # Reusable UI components (Navbar, Footer, etc.)
│       ├── pages/         # Pages
│       │   ├── Home.js
│       │   ├── Login.js
│       │   ├── Signup.js
│       │   ├── ResetPassword.js
│       │   ├── Dashboard.js
│       │   ├── ComplaintForm.js
│       │   ├── ComplaintList.js
│       │   └── Chatbot.js
│       ├── services/      # API calls (axios)
│       │   ├── authService.js
│       │   ├── complaintService.js
│       │   └── chatbotService.js
│       ├── context/       # React context (auth, complaints, chatbot state)
│       ├── utils/         # Helper functions (validators, formatters)
│       ├── App.js
│       └── index.js
├── backend/               # Node.js + Express + MongoDB
│   ├── src/
│   │   ├── config/        # DB connection, env config
│   │   │   ├── db.js
│   │   │   └── env.js
│   │   ├── controllers/   # Business logic
│   │   │   ├── authController.js
│   │   │   ├── complaintController.js
│   │   │   └── notificationController.js
│   │   ├── models/        # MongoDB models
│   │   │   ├── User.js
│   │   │   ├── Complaint.js
│   │   │   └── Notification.js
│   │   ├── routes/        # Express routes
│   │   │   ├── authRoutes.js
│   │   │   ├── complaintRoutes.js
│   │   │   └── notificationRoutes.js
│   │   ├── middleware/    # Middlewares
│   │   │   ├── authMiddleware.js
│   │   │   └── errorHandler.js
│   │   ├── services/      # Extra services (email, sms, etc.)
│   │   │   ├── emailService.js   # SendGrid
│   │   │   └── smsService.js     # Twilio
│   │   ├── utils/         # Utility functions
│   │   └── server.js      # Entry point
│   └── package.json
├── ai-service/            # Separate AI Service (Python)
│   ├── app/               
│   │   ├── chatbot/       # Rasa/Dialogflow integration
│   │   │   ├── rasa_connector.py
│   │   │   └── dialogflow_connector.py
│   │   ├── models/        # AI/ML Models
│   │   │   ├── classifier.py
│   │   │   └── sentiment.py
│   │   ├── api/           # REST API (Flask/FastAPI)
│   │   │   └── routes.py
│   │   ├── utils/         # Helpers (preprocessing, tokenization)
│   │   └── main.py        # App entry (Flask/FastAPI server)
│   ├── requirements.txt   # Python dependencies
├── docs/                  # Documentation (API docs, ER diagrams, etc.)
├── scripts/               # Development and deployment scripts
├── .env                   # Environment variables
├── package.json           # Root config (if needed for fullstack deploy)
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- MongoDB
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd complain
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Configure your .env file with database credentials
   npm run dev
   ```

3. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 📖 Documentation

- [User-Admin Coordination Guide](docs/USER_ADMIN_COORDINATION.md)
- [Demo Guide](frontend/DEMO_GUIDE.md)
- [Backend API Documentation](backend/README.md)

## 🛠️ Development

### Backend Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run seed` - Seed database with test data
- `npm run test` - Run tests

### Frontend Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🎯 Features

- **User Management**: Authentication, registration, profile management
- **Complaint System**: File, track, and manage complaints
- **Real-time Updates**: Live notifications and status updates
- **Admin Dashboard**: Manage complaints, users, and analytics
- **AI Integration**: Automatic categorization and prioritization
- **Mobile Responsive**: Works on all device sizes

## 🧪 Testing

Run tests for both frontend and backend:
```bash
# Backend tests
cd backend && npm test

# Frontend tests (if configured)
cd frontend && npm test
```

## 📊 Tech Stack

**Frontend:**
- React 18
- TypeScript
- Tailwind CSS
- Vite
- Lucide React (icons)

**Backend:**
- Node.js
- Express.js
- TypeScript
- MongoDB with Mongoose
- Socket.io (real-time)
- JWT Authentication
- Joi validation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.
