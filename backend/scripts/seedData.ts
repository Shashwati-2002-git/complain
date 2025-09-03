import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../src/models/User';
import { Complaint } from '../src/models/Complaint';

// Load environment variables
dotenv.config();

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Complaint.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user
    const admin = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@complaint-system.com',
      password: 'Admin123!',
      role: 'admin',
      department: 'General',
      emailVerified: true,
      isActive: true
    });
    await admin.save();
    console.log('Created admin user');

    // Create agent users
    const agents = [
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
    ];

    const createdAgents = await User.insertMany(agents);
    console.log('Created agent users');

    // Create regular users
    const users = [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'User123!',
        role: 'user',
        emailVerified: true,
        isActive: true,
        profile: {
          phone: '+1-555-0123',
          company: 'Acme Corp'
        }
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        password: 'User123!',
        role: 'user',
        emailVerified: true,
        isActive: true,
        profile: {
          phone: '+1-555-0456',
          company: 'Tech Solutions Inc'
        }
      },
      {
        firstName: 'Bob',
        lastName: 'Wilson',
        email: 'bob.wilson@example.com',
        password: 'User123!',
        role: 'user',
        emailVerified: true,
        isActive: true,
        profile: {
          phone: '+1-555-0789',
          company: 'Digital Dynamics'
        }
      }
    ];

    const createdUsers = await User.insertMany(users);
    console.log('Created regular users');

    // Create sample complaints
    const complaints = [
      {
        userId: createdUsers[0]._id,
        title: 'Internet connection keeps dropping',
        description: 'My internet connection has been unstable for the past 3 days. It drops every 2-3 hours and I have to restart my router.',
        category: 'Technical',
        priority: 'High',
        status: 'In Progress',
        sentiment: 'Negative',
        assignedTo: createdAgents[0]._id, // Alex Kumar
        assignedTeam: 'Technical',
        slaTarget: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
        isEscalated: false,
        aiAnalysis: {
          confidence: 0.85,
          suggestedCategory: 'Technical',
          suggestedPriority: 'High',
          keywords: ['internet', 'connection', 'dropping', 'unstable'],
          processedAt: new Date()
        },
        metrics: {
          reopenCount: 0
        },
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
          },
          {
            message: 'I have investigated the issue and it appears to be related to your ISP. We are contacting them on your behalf.',
            author: 'Alex Kumar',
            authorId: createdAgents[0]._id,
            timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
            type: 'comment',
            isInternal: false
          }
        ],
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
      },
      {
        userId: createdUsers[0]._id,
        title: 'Billing discrepancy in last month invoice',
        description: 'I was charged twice for my monthly subscription. The amount $29.99 appears twice in my billing statement.',
        category: 'Billing',
        priority: 'Medium',
        status: 'Resolved',
        sentiment: 'Neutral',
        assignedTo: createdAgents[1]._id, // Sarah Johnson
        assignedTeam: 'Billing',
        slaTarget: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago (SLA met)
        isEscalated: false,
        aiAnalysis: {
          confidence: 0.92,
          suggestedCategory: 'Billing',
          suggestedPriority: 'Medium',
          keywords: ['billing', 'charged', 'subscription', 'duplicate'],
          processedAt: new Date()
        },
        metrics: {
          resolutionTime: 18,
          customerSatisfaction: 4,
          reopenCount: 0
        },
        feedback: {
          rating: 4,
          comment: 'Issue was resolved quickly and professionally.',
          submittedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
          submittedBy: createdUsers[0]._id
        },
        updates: [
          {
            message: 'Complaint has been created and classified automatically.',
            author: 'System',
            authorId: admin._id,
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            type: 'status_change',
            isInternal: false
          },
          {
            message: 'I have reviewed your billing and confirmed the duplicate charge. A refund of $29.99 has been processed.',
            author: 'Sarah Johnson',
            authorId: createdAgents[1]._id,
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
            type: 'comment',
            isInternal: false
          }
        ],
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
      },
      {
        userId: createdUsers[1]._id,
        title: 'Application crashes when uploading files',
        description: 'Every time I try to upload a file larger than 5MB, the application crashes and I lose all my work. This is very frustrating!',
        category: 'Technical',
        priority: 'Urgent',
        status: 'Escalated',
        sentiment: 'Negative',
        assignedTo: createdAgents[2]._id, // David Park
        assignedTeam: 'Technical',
        slaTarget: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago (SLA breached)
        isEscalated: true,
        escalationReason: 'SLA breach - critical issue affecting user productivity',
        escalatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        aiAnalysis: {
          confidence: 0.88,
          suggestedCategory: 'Technical',
          suggestedPriority: 'Urgent',
          keywords: ['application', 'crashes', 'uploading', 'files', 'frustrating'],
          processedAt: new Date()
        },
        metrics: {
          reopenCount: 0
        },
        updates: [
          {
            message: 'Complaint has been created and classified automatically.',
            author: 'System',
            authorId: admin._id,
            timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
            type: 'status_change',
            isInternal: false
          },
          {
            message: 'Complaint escalated: SLA breach - critical issue affecting user productivity',
            author: 'System',
            authorId: admin._id,
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            type: 'escalation',
            isInternal: false
          }
        ],
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      }
    ];

    await Complaint.insertMany(complaints);
    console.log('Created sample complaints');

    console.log('\n=== SEED DATA COMPLETE ===');
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
    console.log('\nDisconnected from MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('Error seeding data:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedData();
