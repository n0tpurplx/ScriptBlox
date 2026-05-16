import express from 'express';
import Script from '../models/Script.js';
import User from '../models/User.js';
import { authenticateToken, authorize } from '../middleware/auth.js';

const router = express.Router();

// Upload script (requires authentication)
router.post('/upload', authenticateToken, async (req, res) => {
  try {
    const { title, description, code, category, price, tags, compatibility } = req.body;
    const user = await User.findById(req.user.id);

    const script = new Script({
      title,
      description,
      code,
      category,
      price,
      author: req.user.id,
      tags: tags || [],
      compatibility: compatibility || [],
      requiresVerification: !user.isTrusted,
      verificationStatus: user.isTrusted ? 'verified' : 'pending_review',
      status: user.isTrusted ? 'approved' : 'pending'
    });

    await script.save();
    user.uploadedScripts.push(script._id);
    await user.save();

    const populatedScript = await script.populate('author', '-password');

    res.status(201).json({
      message: user.isTrusted 
        ? 'Script uploaded and automatically approved!' 
        : 'Script uploaded. Awaiting moderator verification.',
      script: populatedScript
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all approved scripts
router.get('/', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    let query = { status: 'approved' };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const scripts = await Script.find(query)
      .populate('author', '-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Script.countDocuments(query);

    res.json({
      scripts,
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

// Get single script
router.get('/:id', async (req, res) => {
  try {
    const script = await Script.findById(req.params.id)
      .populate('author', '-password')
      .populate('reviews.user', 'username avatar');

    if (!script) {
      return res.status(404).json({ message: 'Script not found' });
    }

    res.json(script);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's uploaded scripts
router.get('/user/:userId', async (req, res) => {
  try {
    const scripts = await Script.find({ author: req.params.userId })
      .populate('author', '-password');

    res.json(scripts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add review
router.post('/:id/review', authenticateToken, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const script = await Script.findById(req.params.id);
    if (!script) {
      return res.status(404).json({ message: 'Script not found' });
    }

    const review = {
      user: req.user.id,
      rating,
      comment
    };

    script.reviews.push(review);

    // Calculate average rating
    const totalRating = script.reviews.reduce((sum, r) => sum + r.rating, 0);
    script.ratings = Math.round((totalRating / script.reviews.length) * 10) / 10;

    await script.save();

    res.json({
      message: 'Review added successfully',
      script
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update script
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const script = await Script.findById(req.params.id);

    if (!script) {
      return res.status(404).json({ message: 'Script not found' });
    }

    if (script.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only edit your own scripts' });
    }

    const { title, description, code, price, tags, compatibility } = req.body;

    script.title = title || script.title;
    script.description = description || script.description;
    script.code = code || script.code;
    script.price = price || script.price;
    script.tags = tags || script.tags;
    script.compatibility = compatibility || script.compatibility;
    script.updatedAt = Date.now();

    // If script was updated, it needs reverification
    if (code && script.status === 'approved') {
      const user = await User.findById(req.user.id);
      if (!user.isTrusted) {
        script.verificationStatus = 'pending_review';
        script.status = 'pending';
      }
    }

    await script.save();

    res.json({
      message: 'Script updated successfully',
      script
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete script
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const script = await Script.findById(req.params.id);

    if (!script) {
      return res.status(404).json({ message: 'Script not found' });
    }

    if (script.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own scripts' });
    }

    await User.findByIdAndUpdate(req.user.id, {
      $pull: { uploadedScripts: script._id }
    });

    await Script.findByIdAndDelete(req.params.id);

    res.json({ message: 'Script deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
