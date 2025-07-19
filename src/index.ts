import express from 'express';
import { userRoutes } from '@/modules/user/user.routes';

const app = express();
app.use(express.json());

app.get('/', (_req, res) => {
  res.send('API do agendamento online está no ar');
});

app.use('/users', userRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});