# Complete Complaint Management System

A full-stack complaint management system with React frontend and Node.js backend, featuring AI-powered classification, real-time updates, and comprehensive analytics.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### 1. Setup Backend

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your MongoDB URI and other settings.

4. **Start MongoDB** (make sure it's running)

5. **Seed the database with sample data:**
   ```bash
   npx ts-node scripts/seedData.ts
   ```

6. **Start the backend server:**
   ```bash
   npm run dev
   ```
   Backend will run on http://localhost:5000

### 2. Setup Frontend

1. **Navigate to frontend directory:**
   ```bash
   cd ..  # if you're in backend directory
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   Frontend will run on http://localhost:5173

### 3. Access the Application

Open your browser and go to http://localhost:5173

#### Test Accounts:

**Admin:**
- Email: admin@complaint-system.com
- Password: Admin123!

**Agents:**
- Technical Support: alex.kumar@complaint-system.com / Agent123!
- Billing Support: sarah.johnson@complaint-system.com / Agent123!
- Customer Service: maria.garcia@complaint-system.com / Agent123!

**Regular Users:**
- john.doe@example.com / User123!
- jane.smith@example.com / User123!

## 🏗️ System Architecture

### Frontend (React + TypeScript)
```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── complaints/     # Complaint management
│   ├── dashboard/      # Role-based dashboards
│   ├── analytics/      # Charts and metrics
│   ├── common/         # Shared components
│   └── notifications/  # Notification system
├── contexts/           # React Context providers
├── services/           # API and utility services
└── types/             # TypeScript type definitions
```

### Backend (Node.js + TypeScript)
```
src/
├── routes/            # API endpoints
├── models/            # MongoDB schemas
├── middleware/        # Authentication, validation
├── services/          # Business logic
├── validators/        # Input validation
├── socket/           # WebSocket handlers
└── config/           # Database configuration
```

## 🎯 Key Features

### User Management
- **Role-based access control** (User, Agent, Admin)
- **JWT authentication** with refresh tokens
- **User profiles** with preferences
- **Department-based agent assignment**

### Complaint Lifecycle
1. **Creation** - Users submit complaints with descriptions
2. **AI Classification** - Automatic categorization and priority assignment
3. **Assignment** - Auto or manual assignment to agents
4. **Tracking** - Real-time status updates and communications
5. **Resolution** - Agent resolves with customer feedback
6. **Analytics** - Performance metrics and reporting

### AI-Powered Features
- **Smart Categorization** (Billing, Technical, Service, Product, General)
- **Sentiment Analysis** (Positive, Neutral, Negative)
- **Priority Assignment** (Low, Medium, High, Urgent)
- **Keyword Extraction** for better searchability

### Real-time Features
- **Live notifications** for status changes
- **Real-time chat** on complaint threads
- **Typing indicators** during conversations
- **SLA breach alerts** for time-sensitive issues

### Analytics & Reporting
- **Dashboard metrics** with charts and KPIs
- **Team performance** tracking
- **SLA compliance** monitoring
- **Customer satisfaction** analysis
- **Trend analysis** by category and time

## 🔧 API Endpoints

### Authentication
```
POST /api/auth/register    # Register new user
POST /api/auth/login       # User login
POST /api/auth/refresh     # Refresh token
```

### Complaints
```
GET    /api/complaints           # List complaints (filtered by role)
POST   /api/complaints           # Create new complaint
GET    /api/complaints/:id       # Get complaint details
PATCH  /api/complaints/:id/status # Update status
POST   /api/complaints/:id/updates # Add comment
PATCH  /api/complaints/:id/escalate # Escalate complaint
```

### Analytics
```
GET /api/analytics/dashboard      # Main dashboard data
GET /api/analytics/team-performance # Team metrics
GET /api/analytics/sla-compliance   # SLA reports
```

### Admin
```
GET   /api/admin/stats            # System statistics
GET   /api/admin/users            # User management
PATCH /api/admin/complaints/bulk  # Bulk operations
```

## 🎭 User Roles & Permissions

### 👤 Customer (User)
- Create and track personal complaints
- Add comments and attachments
- View complaint history
- Submit feedback for resolved issues

### 🛠️ Agent (Support Staff)
- View assigned complaints
- Update complaint status
- Communicate with customers
- Escalate complex issues
- Access team dashboard

### 👑 Administrator
- Full system access
- User and agent management
- System configuration
- Advanced analytics
- Bulk operations

## 🔒 Security Features

- **JWT Authentication** with secure token handling
- **Password hashing** using bcrypt
- **Role-based access control** for all endpoints
- **Rate limiting** to prevent API abuse
- **Input validation** using Joi schemas
- **CORS configuration** for cross-origin requests
- **Security headers** via Helmet middleware

## 📊 Database Schema

### Users
```javascript
{
  firstName: String,
  lastName: String,
  email: String (unique),
  password: String (hashed),
  role: 'user' | 'agent' | 'admin',
  department: String,
  isActive: Boolean,
  profile: {
    phone: String,
    company: String,
    // ... other profile fields
  },
  preferences: {
    emailNotifications: Boolean,
    language: String,
    // ... other preferences
  }
}
```

### Complaints
```javascript
{
  userId: ObjectId,
  title: String,
  description: String,
  category: 'Billing' | 'Technical' | 'Service' | 'Product' | 'General',
  priority: 'Low' | 'Medium' | 'High' | 'Urgent',
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed',
  sentiment: 'Positive' | 'Neutral' | 'Negative',
  assignedTo: ObjectId,
  slaTarget: Date,
  isEscalated: Boolean,
  aiAnalysis: {
    confidence: Number,
    keywords: [String],
    // ... AI analysis data
  },
  updates: [{
    message: String,
    author: String,
    timestamp: Date,
    type: String
  }],
  feedback: {
    rating: Number,
    comment: String,
    submittedAt: Date
  }
}
```

## 🔄 Real-time Events

### WebSocket Events
- `complaint_updated` - Status changes
- `new_message` - New comments added
- `complaint_assigned` - Assignment notifications
- `sla_breach_warning` - SLA alerts
- `complaint_escalated` - Escalation notifications

## 📈 Monitoring & Analytics

### Key Metrics
- **Total Complaints** by time period
- **Resolution Time** averages
- **Customer Satisfaction** ratings
- **SLA Compliance** rates
- **Agent Performance** metrics
- **Category Trends** over time

### Dashboard Views
- **User Dashboard** - Personal complaint tracking
- **Agent Dashboard** - Workload and assigned complaints
- **Admin Dashboard** - System-wide metrics and controls

## 🚀 Deployment

### Production Setup
1. **Build the frontend:**
   ```bash
   npm run build
   ```

2. **Build the backend:**
   ```bash
   cd backend && npm run build
   ```

3. **Set production environment variables**
4. **Deploy to your preferred hosting platform**

### Environment Variables
```env
NODE_ENV=production
MONGODB_URI=your-production-mongodb-uri
JWT_SECRET=your-secure-jwt-secret
FRONTEND_URL=your-frontend-domain
```

## 🧪 Testing

### Backend Tests
```bash
cd backend && npm test
```

### Frontend Tests
```bash
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the documentation
2. Search existing issues
3. Create a new issue with detailed information

## 🔮 Future Enhancements

- **Mobile app** (React Native)
- **Advanced AI** integration (GPT, sentiment analysis)
- **Multi-language** support
- **Advanced reporting** with custom filters
- **Integration APIs** for external systems
- **Automated testing** suite expansion
- **Performance optimization** and caching
- **Voice/video** communication features
