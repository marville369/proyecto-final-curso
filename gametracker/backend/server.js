const express = require('express');
const app = express();
const PORT = 8001;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'GameTracker Backend iniciado' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
