import express from 'express';
import { userRoutes } from '@/modules/user/user.routes';
import { authRoutes } from '@/modules/auth/auth.routes';
import { approvalRoutes } from '@/modules/approval/approval.routes';
import { chairRoutes } from '@/modules/chair/chair.routes';
import { scheduleRoutes } from './modules/schedule/schedule.routes';
import { appointmentRoutes } from './modules/appointment/appointment.routes';
import { roleRoutes } from './modules/role/role.routes';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes';

const app = express();
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/approvals', approvalRoutes);
app.use('/chairs', chairRoutes);
app.use('/schedules', scheduleRoutes);
app.use('/appointments', appointmentRoutes);
app.use('/roles', roleRoutes);
app.use('/dashboard', dashboardRoutes);

app.get('/', (_req, res) => {
  res.send('API do agendamento online está no ar');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
