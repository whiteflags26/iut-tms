import express from 'express';
import userRoutes from '../modules/user/user.routes';
import requisitonRoutes from '../modules/requisition/requisition.routes';
import approvalRoutes from '../modules/approval/approval.routes'; 
import driverRoutes from '../modules/driver/driver.routes';
import vehicleRoutes from '../modules/vehicle/vehicle.routes';

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

router.use('/users', userRoutes);
router.use('/requisitions', requisitonRoutes);
router.use('/approvals', approvalRoutes);
router.use('/drivers', driverRoutes);
router.use('/vehicles', vehicleRoutes);

export default router;