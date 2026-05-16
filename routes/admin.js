import express from 'express';
import User from '../models/User.js';
import Script from '../models/Script.js';
import { authenticateToken, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get pending scripts for verification
router.get('/scripts/pending', authenticateToken, authorize(['moderator', 'admin']), async (req, res) => {
  try {
    const scripts = await Script.find({ status: 'pending' })
      .populate('author', '-password')
      .sort({ createdAt: -1 });

    res.json(scripts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Approve script
router.post('/scripts/:id/approve', authenticateToken, authorize(['moderator', 'admin']), async (req, res) => {
  try {
    const script = await Script.findByIdAndUpdate(
      req.params.id,
      {
        status: 'approved',
        verificationStatus: 'verified',
        verifiedBy: req.user.id,
        updatedAt: Date.now()
      },
      { new: true }
    ).populate('author', '-password');

    if (!script) {
      return res.status(404).json({ message: 'Script not found' });
    }

    res.json({
      message: 'Script approved successfully',
      script
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reject script
router.post('/scripts/:id/reject', authenticateToken, authorize(['moderator', 'admin']), async (req, res) => {
  try {
    const { reason } = req.body;

    const script = await Script.findByIdAndUpdate(
      req.params.id,
      {
        status: 'rejected',
        verificationStatus: 'rejected',
        rejectionReason: reason,
        verifiedBy: req.user.id,
        updatedAt: Date.now()
      },
      { new: true }
    ).populate('author', '-password');

    if (!script) {
      return res.status(404).json({ message: 'Script not found' });
    }

    res.json({
      message: 'Script rejected successfully',
      script
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Make user trusted
router.post('/users/:userId/trust', authenticateToken, authorize(['admin']), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      {
        isTrusted: true,
        role: 'trusted',
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User marked as trusted',
      user: user.toJSON()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Revoke trusted status
router.post('/users/:userId/revoke-trust', authenticateToken, authorize(['admin']), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      {
        isTrusted: false,
        role: 'user',
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Trusted status revoked',
      user: user.toJSON()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Assign moderator role
router.post('/users/:userId/moderator', authenticateToken, authorize(['admin']), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      {
        role: 'moderator',
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User promoted to moderator',
      user: user.toJSON()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all users
router.get('/users', authenticateToken, authorize(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments();

    res.json({
      users,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get platform statistics
router.get('/statistics', authenticateToken, authorize(['admin']), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const trustedUsers = await User.countDocuments({ isTrusted: true });
    const totalScripts = await Script.countDocuments();
    const approvedScripts = await Script.countDocuments({ status: 'approved' });
    const pendingScripts = await Script.countDocuments({ status: 'pending' });
    const totalRevenue = await User.aggregate([
      { $group: { _id: null, totalCoins: { $sum: '$scriptCoins' } } }
    ]);

    res.json({
      totalUsers,
      trustedUsers,
      totalScripts,
      approvedScripts,
      pendingScripts,
      estimatedRevenue: (totalRevenue[0]?.totalCoins || 0) / 100
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
