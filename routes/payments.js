import express from 'express';
import Stripe from 'stripe';
import User from '../models/User.js';
import Script from '../models/Script.js';
import Payment from '../models/Payment.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const SCRIPT_COINS_RATE = 100; // 100 SC = 1€

// Get script coins packages
router.get('/coins/packages', (req, res) => {
  const packages = [
    { id: 'small', coins: 500, priceEUR: 5.00, label: '500 ScriptCoins' },
    { id: 'medium', coins: 1200, priceEUR: 10.00, label: '1200 ScriptCoins (20% bonus)' },
    { id: 'large', coins: 3000, priceEUR: 20.00, label: '3000 ScriptCoins (50% bonus)' },
    { id: 'xlarge', coins: 6500, priceEUR: 40.00, label: '6500 ScriptCoins (62.5% bonus)' }
  ];
  res.json(packages);
});

// Create payment intent for coins
router.post('/coins/create-intent', authenticateToken, async (req, res) => {
  try {
    const { packageId } = req.body;

    const packages = {
      small: { coins: 500, price: 500 },
      medium: { coins: 1200, price: 1000 },
      large: { coins: 3000, price: 2000 },
      xlarge: { coins: 6500, price: 4000 }
    };

    if (!packages[packageId]) {
      return res.status(400).json({ message: 'Invalid package' });
    }

    const package_ = packages[packageId];

    const paymentIntent = await stripe.paymentIntents.create({
      amount: package_.price,
      currency: 'eur',
      metadata: {
        userId: req.user.id,
        paymentType: 'coins_purchase',
        coinsAmount: package_.coins
      }
    });

    const payment = new Payment({
      user: req.user.id,
      amount: package_.price / 100,
      currency: 'EUR',
      scriptCoinsAmount: package_.coins,
      paymentType: 'coins_purchase',
      stripePaymentId: paymentIntent.id,
      status: 'pending'
    });

    await payment.save();

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentId: payment._id
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create payment intent for script
router.post('/script/create-intent', authenticateToken, async (req, res) => {
  try {
    const { scriptId } = req.body;

    const script = await Script.findById(scriptId);
    if (!script) {
      return res.status(404).json({ message: 'Script not found' });
    }

    const user = await User.findById(req.user.id);

    // Check if user already owns the script
    if (user.purchasedScripts.includes(scriptId)) {
      return res.status(400).json({ message: 'You already own this script' });
    }

    // Check if user has enough coins
    if (user.scriptCoins < script.price) {
      return res.status(400).json({ 
        message: 'Insufficient ScriptCoins',
        required: script.price,
        available: user.scriptCoins
      });
    }

    // Deduct coins and add script to purchases
    user.scriptCoins -= script.price;
    user.purchasedScripts.push(scriptId);
    script.downloads += 1;

    const payment = new Payment({
      user: req.user.id,
      script: scriptId,
      amount: script.price / SCRIPT_COINS_RATE,
      currency: 'EUR',
      scriptCoinsAmount: script.price,
      paymentType: 'script_purchase',
      stripePaymentId: `internal_${Date.now()}`,
      status: 'completed',
      completedAt: Date.now()
    });

    await Promise.all([
      user.save(),
      script.save(),
      payment.save()
    ]);

    res.json({
      message: 'Script purchased successfully',
      coinsRemaining: user.scriptCoins,
      script
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Confirm payment
router.post('/confirm', authenticateToken, async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ message: 'Payment was not successful' });
    }

    const payment = await Payment.findOne({ stripePaymentId: paymentIntentId });
    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found' });
    }

    payment.status = 'completed';
    payment.completedAt = Date.now();
    await payment.save();

    const user = await User.findById(req.user.id);
    user.scriptCoins += payment.scriptCoinsAmount;
    await user.save();

    res.json({
      message: 'Payment confirmed successfully',
      coinsAdded: payment.scriptCoinsAmount,
      totalCoins: user.scriptCoins
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's payment history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user.id })
      .populate('script', 'title price')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Webhook for Stripe
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const payment = await Payment.findOne({ stripePaymentId: paymentIntent.id });

      if (payment) {
        payment.status = 'completed';
        payment.completedAt = Date.now();
        await payment.save();

        const user = await User.findById(payment.user);
        user.scriptCoins += payment.scriptCoinsAmount;
        await user.save();
      }
    }

    res.json({ received: true });
  } catch (error) {
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

export default router;
