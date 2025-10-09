# Complaint Management System - Backend

A comprehensive Node.js backend API for managing customer complaints with AI-powered classification, real-time updates, and advanced analytics.

## Features

- **User Management**: Registration, authentication, role-based access control
- **Complaint Management**: Create, track, update, and resolve complaints
- **AI Classification**: Automatic categorization, sentiment analysis, and priority assignment
- **Real-time Updates**: WebSocket support for live notifications and updates
- **Analytics Dashboard**: Comprehensive reporting and metrics
- **SLA Management**: Automatic tracking and breach notifications
- **Multi-role Support**: Different interfaces for users, agents, administrators, and analytics managers

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: Socket.IO
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate limiting
- **Email**: Nodemailer (for notifications)

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

## Installation

1. **Clone the repository and navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/complaint_management
   JWT_SECRET=your-super-secure-jwt-secret-key-here
   JWT_EXPIRES_IN=7d
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system

5. **Start the development server**
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users/profile` - Get current user profile
- `PATCH /api/users/profile` - Update user profile
- `PATCH /api/users/password` - Change password
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID (admin only)
- `PATCH /api/users/:id` - Update user (admin only)

### Complaints
- `GET /api/complaints` - Get complaints (filtered by role)
- `GET /api/complaints/:id` - Get complaint by ID
- `POST /api/complaints` - Create new complaint
- `PATCH /api/complaints/:id/status` - Update complaint status
- `PATCH /api/complaints/:id/assign` - Assign complaint to agent
- `POST /api/complaints/:id/updates` - Add comment/update
- `PATCH /api/complaints/:id/escalate` - Escalate complaint
- `POST /api/complaints/:id/feedback` - Submit feedback

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard analytics
- `GET /api/analytics/team-performance` - Get team performance metrics
- `GET /api/analytics/trends/category` - Get category trends
- `GET /api/analytics/sla-compliance` - Get SLA compliance report

### Admin
- `GET /api/admin/stats` - Get system statistics
- `GET /api/admin/users` - Get all users with admin access
- `PATCH /api/admin/users/bulk` - Bulk update users
- `GET /api/admin/complaints` - Get all complaints with admin access
- `PATCH /api/admin/complaints/bulk-assign` - Bulk assign complaints
- `PATCH /api/admin/complaints/bulk-close` - Bulk close complaints
- `GET /api/admin/config` - Get system configuration
- `PATCH /api/admin/config` - Update system configuration

### Notifications
- `GET /api/notifications` - Get user notifications
- `PATCH /api/notifications/:id/read` - Mark notification as read
- `PATCH /api/notifications/read-all` - Mark all notifications as read
- `GET /api/notifications/preferences` - Get notification preferences
- `PATCH /api/notifications/preferences` - Update notification preferences

## User Roles

### User (Customer)
- Create and track complaints
- View their own complaints
- Add comments and attachments
- Submit feedback for resolved complaints

### Agent (Support Staff)
- View assigned complaints
- Update complaint status
- Add internal and external comments
- Escalate complaints when needed
- View team dashboard

### Admin (Administrator)
- Full system access
- User management
- System configuration
- Advanced analytics
- Bulk operations

## AI Classification

The system includes an AI service that automatically:
- **Categorizes complaints** into predefined categories (Billing, Technical, Service, Product, General)
- **Analyzes sentiment** (Positive, Neutral, Negative)
- **Assigns priority** levels (Low, Medium, High, Urgent)
- **Extracts keywords** for better searchability

## Real-time Features

Using Socket.IO, the system provides:
- Live complaint updates
- Real-time notifications
- Typing indicators
- Status change notifications
- SLA breach alerts
- Assignment notifications

## Database Schema

### Users Collection
```javascript
{
  firstName: String,
  lastName: String,
  email: String (unique),
  password: String (hashed),
  role: String (user|agent|admin|analytics),
  department: String,
  isActive: Boolean,
  profile: Object,
  preferences: Object,
  createdAt: Date,
  updatedAt: Date
}
```

### Complaints Collection
```javascript
{
  userId: ObjectId (ref: User),
  title: String,
  description: String,
  category: String,
  priority: String,
  status: String,
  sentiment: String,
  assignedTo: ObjectId (ref: User),
  assignedTeam: String,
  slaTarget: Date,
  isEscalated: Boolean,
  escalationReason: String,
  feedback: Object,
  aiAnalysis: Object,
  metrics: Object,
  updates: Array,
  createdAt: Date,
  updatedAt: Date
}
```

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting to prevent abuse
- CORS configuration
- Helmet for security headers
- Input validation with Joi
- Role-based access control

## Error Handling

The API includes comprehensive error handling:
- Mongoose validation errors
- JWT authentication errors
- Database connection errors
- Custom business logic errors
- Detailed error messages in development
- Generic error messages in production

## Testing

Run the test suite:
```bash
npm test
```

## Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set production environment variables**
   ```env
   NODE_ENV=production
   MONGODB_URI=your-production-mongodb-uri
   JWT_SECRET=your-production-jwt-secret
   ```

3. **Start the production server**
   ```bash
   npm start
   ```

## API Documentation

For detailed API documentation, you can:
1. Import the API collection into Postman
2. Use tools like Swagger/OpenAPI (can be added)
3. Refer to the route files in `src/routes/`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please refer to the documentation or create an issue in the repository.
