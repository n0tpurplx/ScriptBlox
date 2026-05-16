import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Auth endpoints available' });
});

export default router;
