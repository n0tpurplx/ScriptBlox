import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Scripts endpoints available' });
});

export default router;
