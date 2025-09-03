import mongoose, { Document, Schema } from 'mongoose';

export interface IComplaintUpdate extends Document {
  complaintId: mongoose.Types.ObjectId;
  message: string;
  author: string;
  authorId: mongoose.Types.ObjectId;
  timestamp: Date;
  type: 'status_change' | 'comment' | 'assignment' | 'escalation' | 'resolution';
  isInternal: boolean;
  attachments?: string[];
}

export interface IComplaint extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: 'Billing' | 'Technical' | 'Service' | 'Product' | 'General';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Open' | 'In Progress' | 'Under Review' | 'Resolved' | 'Closed' | 'Escalated';
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  assignedTo?: mongoose.Types.ObjectId;
  assignedTeam?: string;
  slaTarget: Date;
  responseTime?: number; // in hours
  resolutionTime?: number; // in hours
  isEscalated: boolean;
  escalationReason?: string;
  escalatedAt?: Date;
  tags: string[];
  attachments: string[];
  feedback?: {
    rating: number;
    comment: string;
    submittedAt: Date;
    submittedBy: mongoose.Types.ObjectId;
  };
  aiAnalysis: {
    confidence: number;
    suggestedCategory: string;
    suggestedPriority: string;
    keywords: string[];
    processedAt: Date;
  };
  metrics: {
    firstResponseTime?: number;
    resolutionTime?: number;
    customerSatisfaction?: number;
    reopenCount: number;
  };
  createdAt: Date;
  updatedAt: Date;
  updates: IComplaintUpdate[];
}

const complaintUpdateSchema = new Schema<IComplaintUpdate>({
  complaintId: {
    type: Schema.Types.ObjectId,
    ref: 'Complaint',
    required: true
  },
  message: {
    type: String,
    required: [true, 'Update message is required'],
    maxlength: [2000, 'Update message cannot exceed 2000 characters']
  },
  author: {
    type: String,
    required: [true, 'Author is required']
  },
  authorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  type: {
    type: String,
    enum: ['status_change', 'comment', 'assignment', 'escalation', 'resolution'],
    required: true
  },
  isInternal: {
    type: Boolean,
    default: false
  },
  attachments: [{
    type: String
  }]
}, {
  timestamps: true
});

const complaintSchema = new Schema<IComplaint>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  category: {
    type: String,
    enum: ['Billing', 'Technical', 'Service', 'Product', 'General'],
    required: [true, 'Category is required']
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    required: [true, 'Priority is required']
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Under Review', 'Resolved', 'Closed', 'Escalated'],
    default: 'Open'
  },
  sentiment: {
    type: String,
    enum: ['Positive', 'Neutral', 'Negative'],
    required: [true, 'Sentiment is required']
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedTeam: {
    type: String,
    enum: ['Billing Team', 'Tech Support Team', 'Customer Service Team', 'Product Team', 'General Support Team']
  },
  slaTarget: {
    type: Date,
    required: [true, 'SLA target is required']
  },
  responseTime: {
    type: Number // in hours
  },
  resolutionTime: {
    type: Number // in hours
  },
  isEscalated: {
    type: Boolean,
    default: false
  },
  escalationReason: {
    type: String,
    maxlength: [500, 'Escalation reason cannot exceed 500 characters']
  },
  escalatedAt: {
    type: Date
  },
  tags: [{
    type: String,
    trim: true
  }],
  attachments: [{
    type: String
  }],
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      maxlength: [1000, 'Feedback comment cannot exceed 1000 characters']
    },
    submittedAt: {
      type: Date
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  aiAnalysis: {
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      required: true
    },
    suggestedCategory: {
      type: String,
      required: true
    },
    suggestedPriority: {
      type: String,
      required: true
    },
    keywords: [{
      type: String
    }],
    processedAt: {
      type: Date,
      default: Date.now
    }
  },
  metrics: {
    firstResponseTime: Number, // in hours
    resolutionTime: Number, // in hours
    customerSatisfaction: Number, // 1-5 scale
    reopenCount: {
      type: Number,
      default: 0
    }
  },
  updates: [complaintUpdateSchema]
}, {
  timestamps: true
});

// Indexes for better query performance
complaintSchema.index({ userId: 1, status: 1 });
complaintSchema.index({ assignedTo: 1, status: 1 });
complaintSchema.index({ category: 1, priority: 1 });
complaintSchema.index({ createdAt: -1 });
complaintSchema.index({ slaTarget: 1, status: 1 });
complaintSchema.index({ isEscalated: 1 });

// Calculate metrics on save
complaintSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'Resolved' && !this.resolutionTime) {
    this.metrics.resolutionTime = (new Date().getTime() - this.createdAt.getTime()) / (1000 * 60 * 60); // hours
  }
  next();
});

export const ComplaintUpdate = mongoose.model<IComplaintUpdate>('ComplaintUpdate', complaintUpdateSchema);
export const Complaint = mongoose.model<IComplaint>('Complaint', complaintSchema);
