import express from 'express';
import { userRoutes } from '@/modules/user/user.routes';
import { authRoutes } from './modules/auth/auth.routes';

const app = express();
app.use(express.json());

app.use('/users', userRoutes);
app.use('/auth', authRoutes);

app.get('/', (_req, res) => {
  res.send('API do agendamento online está no ar');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});