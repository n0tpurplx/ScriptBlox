import mongoose from 'mongoose';

const scriptSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['game', 'farm', 'utility', 'admin', 'other']
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  verificationStatus: {
    type: String,
    enum: ['pending_review', 'verified', 'rejected'],
    default: 'pending_review'
  },
  requiresVerification: {
    type: Boolean,
    default: true
  },
  rejectionReason: {
    type: String,
    default: null
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  downloads: {
    type: Number,
    default: 0
  },
  ratings: {
    type: Number,
    default: 0
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [String],
  version: {
    type: String,
    default: '1.0.0'
  },
  compatibility: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Script', scriptSchema);
