import express from 'express';
import userRoutes from '../modules/user/user.routes';
const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

router.use('/users', userRoutes);

export default router;