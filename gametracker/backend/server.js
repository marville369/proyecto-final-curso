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
