import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Admin endpoints available' });
});

export default router;
