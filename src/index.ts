import express from 'express';

const app = express();
app.use(express.json());

app.get('/', (_req, res) => {
  res.send('API do agendamento online está no ar');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});