import express from 'express';
import userRoutes from '../modules/user/user.routes';
import requisitonRoutes from '../modules/requisition/requisition.routes';
import approvalRoutes from '../modules/approval/approval.routes'; 
import driverRoutes from '../modules/driver/driver.routes';
import vehicleRoutes from '../modules/vehicle/vehicle.routes';
import subscriptionRoutes from '../modules/subscription/subscription.routes';
import tripRoutes from '../modules/trip/trip.routes';
import ticketRoutes from '../modules/ticket/ticket.routes';

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

router.use('/users', userRoutes);
router.use('/requisitions', requisitonRoutes);
router.use('/approvals', approvalRoutes);
router.use('/drivers', driverRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/trips', tripRoutes);

export default router;