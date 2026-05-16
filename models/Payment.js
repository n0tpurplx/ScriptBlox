import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  script: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Script',
    default: null
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'EUR'
  },
  scriptCoinsAmount: {
    type: Number,
    required: true
  },
  paymentType: {
    type: String,
    enum: ['script_purchase', 'coins_purchase'],
    required: true
  },
  stripePaymentId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    default: 'card'
  },
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  }
});

export default mongoose.model('Payment', paymentSchema);
