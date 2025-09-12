const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import models
const { User } = require('../src/models/User');
const { Complaint } = require('../src/models/Complaint');

const seedData = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('❌ MONGODB_URI not found in .env file');
    }

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear collections
    await Promise.all([User.deleteMany({}), Complaint.deleteMany({})]);
    console.log('🧹 Cleared existing data');

    // Create admin user
    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@complaint-system.com',
      password: 'Admin123!',
      role: 'admin',
      department: 'General',
      emailVerified: true,
      isActive: true
    });
    console.log('👑 Created admin user');

    // Create agents
    const agents = await User.insertMany([
      {
        firstName: 'Alex',
        lastName: 'Kumar',
        email: 'alex.kumar@complaint-system.com',
        password: 'Agent123!',
        role: 'agent',
        department: 'Technical',
        emailVerified: true,
        isActive: true
      },
      {
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@complaint-system.com',
        password: 'Agent123!',
        role: 'agent',
        department: 'Billing',
        emailVerified: true,
        isActive: true
      },
      {
        firstName: 'David',
        lastName: 'Park',
        email: 'david.park@complaint-system.com',
        password: 'Agent123!',
        role: 'agent',
        department: 'Technical',
        emailVerified: true,
        isActive: true
      },
      {
        firstName: 'Maria',
        lastName: 'Garcia',
        email: 'maria.garcia@complaint-system.com',
        password: 'Agent123!',
        role: 'agent',
        department: 'Customer Service',
        emailVerified: true,
        isActive: true
      }
    ]);
    console.log('👩‍💻 Created agent users');

    // Create users
    const users = await User.insertMany([
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'User123!',
        role: 'user',
        emailVerified: true,
        isActive: true,
        profile: { phone: '+1-555-0123', company: 'Acme Corp' }
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        password: 'User123!',
        role: 'user',
        emailVerified: true,
        isActive: true,
        profile: { phone: '+1-555-0456', company: 'Tech Solutions Inc' }
      },
      {
        firstName: 'Bob',
        lastName: 'Wilson',
        email: 'bob.wilson@example.com',
        password: 'User123!',
        role: 'user',
        emailVerified: true,
        isActive: true,
        profile: { phone: '+1-555-0789', company: 'Digital Dynamics' }
      }
    ]);
    console.log('🙋 Created regular users');

    // Create complaints
    await Complaint.insertMany([
      {
        userId: users[0]._id,
        title: 'Internet connection keeps dropping',
        description:
          'My internet connection has been unstable for the past 3 days. It drops every 2-3 hours and I have to restart my router.',
        category: 'Technical',
        priority: 'High',
        status: 'In Progress',
        sentiment: 'Negative',
        assignedTo: agents[0]._id,
        assignedTeam: 'Technical',
        slaTarget: new Date(Date.now() + 6 * 60 * 60 * 1000),
        isEscalated: false,
        aiAnalysis: {
          confidence: 0.85,
          suggestedCategory: 'Technical',
          suggestedPriority: 'High',
          keywords: ['internet', 'connection', 'dropping', 'unstable'],
          processedAt: new Date()
        },
        metrics: { reopenCount: 0 },
        updates: [
          {
            message: 'Complaint has been created and classified automatically.',
            author: 'System',
            authorId: admin._id,
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            type: 'status_change',
            isInternal: false
          },
          {
            message: 'Assigned to Tech Support Team. Agent Alex Kumar will handle this case.',
            author: 'System',
            authorId: admin._id,
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000),
            type: 'assignment',
            isInternal: false
          }
        ],
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
      }
    ]);
    console.log('📂 Created sample complaints');

    console.log('\n=== ✅ SEED DATA COMPLETE ===');
    console.log('\nTest Accounts Created:');
    console.log('Admin: admin@complaint-system.com / Admin123!');
    console.log('Agent (Technical): alex.kumar@complaint-system.com / Agent123!');
    console.log('Agent (Billing): sarah.johnson@complaint-system.com / Agent123!');
    console.log('Agent (Technical): david.park@complaint-system.com / Agent123!');
    console.log('Agent (Customer Service): maria.garcia@complaint-system.com / Agent123!');
    console.log('User: john.doe@example.com / User123!');
    console.log('User: jane.smith@example.com / User123!');
    console.log('User: bob.wilson@example.com / User123!');

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding data:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedData();
