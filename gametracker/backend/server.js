const express = require('express');
const app = express();
const PORT = 8001;

app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
  
});
app.get('/', (req, res) => {
  res.json({ message: 'GameTracker Backend iniciado' });
});

app.post('/api/games', async (req, res) => {
  try {
    console.log('Datos recibidos:', req.body); 
    
    const { title, description, cover_image_url, status } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'El título es obligatorio' });
    }
    
    const game = new Game({
      id: Date.now().toString(),
      title: title.trim(),
      description: description ? description.trim() : '',
      cover_image_url: cover_image_url ? cover_image_url.trim() : '',
      status: status || 'pending',
      created_date: new Date()
    });
  
    const savedGame = await game.save();
    console.log('Juego creado:', savedGame);
    res.status(201).json(savedGame);
  } catch (error) {
    console.error('Error creando juego:', error);
    res.status(500).json({ error: 'Error al crear juego' });
  }
});


app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

mongoose.connect('mongodb://localhost:27017/gametracker')
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch(err => console.error('❌ Error MongoDB:', err));


const gameSchema = new mongoose.Schema({
  id: String,
  title: String,
  description: String,
  cover_image_url: String,
  status: String,
  created_date: { type: Date, default: Date.now }
});

const Game = mongoose.model('Game', gameSchema);

const reviewSchema = new mongoose.Schema({
  id: String,
  game_id: String,
  rating: Number,
  review_text: String,
  created_date: { type: Date, default: Date.now }
});

const Review = mongoose.model('Review', reviewSchema);


