import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: /.+\@.+\..+/
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  scriptCoins: {
    type: Number,
    default: 0
  },
  role: {
    type: String,
    enum: ['user', 'trusted', 'moderator', 'admin'],
    default: 'user'
  },
  isTrusted: {
    type: Boolean,
    default: false
  },
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    default: ''
  },
  purchasedScripts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Script'
  }],
  uploadedScripts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Script'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Exclude password from queries
userSchema.methods.toJSON = function() {
  const { password, ...user } = this.toObject();
  return user;
};

export default mongoose.model('User', userSchema);
