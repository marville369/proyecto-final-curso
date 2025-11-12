require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

const PORT = process.env.PORT || 8001;
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URL || 'mongodb://localhost:27017/gametracker';
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

app.use(express.json());

const corsOptions = {
  origin: Array.isArray(process.env.CORS_ORIGIN)
    ? process.env.CORS_ORIGIN
    : CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

if (NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    next();
  });
}
const gameSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  cover_image_url: { type: String, trim: true, default: '' },
  status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  created_date: { type: Date, default: Date.now }
}, { timestamps: true });

const reviewSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  game_id: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  review_text: { type: String, trim: true, default: '' },
  created_date: { type: Date, default: Date.now }
}, { timestamps: true });

const Game = mongoose.model('Game', gameSchema);
const Review = mongoose.model('Review', reviewSchema);

app.get('/api/', (req, res) => {
  res.json({
    message: ' GameTracker API funcionando!',
    environment: NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    uptime: process.uptime()
  });
});

app.get('/api/games', async (req, res) => {
  try {
    const games = await Game.find().sort({ created_date: -1 });
    res.json(games);
  } catch (err) {
    console.error('Error obteniendo juegos:', err);
    res.status(500).json({ error: 'Error al obtener juegos' });
  }
});

app.get('/api/games/:id', async (req, res) => {
  try {
    const game = await Game.findOne({ id: req.params.id });
    if (!game) return res.status(404).json({ error: 'Juego no encontrado' });
    res.json(game);
  } catch (err) {
    console.error('Error obteniendo juego:', err);
    res.status(500).json({ error: 'Error al obtener juego' });
  }
});

app.post('/api/games', async (req, res) => {
  try {
    const { title, description, cover_image_url, status } = req.body;
    if (!title || title.trim() === '') return res.status(400).json({ error: 'El título es obligatorio' });

    const game = new Game({
      id: Date.now().toString(),
      title: title.trim(),
      description: description ? description.trim() : '',
      cover_image_url: cover_image_url ? cover_image_url.trim() : '',
      status: status || 'pending'
    });

    const saved = await game.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error('Error creando juego:', err);
    res.status(500).json({ error: 'Error al crear juego' });
  }
});

app.put('/api/games/:id', async (req, res) => {
  try {
    const updates = req.body;
    if (updates.title) updates.title = updates.title.trim();
    if (updates.description !== undefined) updates.description = updates.description.trim();
    if (updates.cover_image_url !== undefined) updates.cover_image_url = updates.cover_image_url.trim();

    const game = await Game.findOneAndUpdate({ id: req.params.id }, { $set: updates }, { new: true, runValidators: true });
    if (!game) return res.status(404).json({ error: 'Juego no encontrado' });
    res.json(game);
  } catch (err) {
    console.error('Error actualizando juego:', err);
    res.status(500).json({ error: 'Error al actualizar juego' });
  }
});

app.delete('/api/games/:id', async (req, res) => {
  try {
    const game = await Game.findOneAndDelete({ id: req.params.id });
    if (!game) return res.status(404).json({ error: 'Juego no encontrado' });

    const deletedReviews = await Review.deleteMany({ game_id: req.params.id });
    res.json({ message: 'Juego eliminado exitosamente', deletedReviews: deletedReviews.deletedCount });
  } catch (err) {
    console.error('Error eliminando juego:', err);
    res.status(500).json({ error: 'Error al eliminar juego' });
  }
});

// Reseñas
app.get('/api/reviews', async (req, res) => {
  try {
    const reviews = await Review.find().sort({ created_date: -1 });
    res.json(reviews);
  } catch (err) {
    console.error('Error obteniendo reseñas:', err);
    res.status(500).json({ error: 'Error al obtener reseñas' });
  }
});

app.get('/api/reviews/game/:gameId', async (req, res) => {
  try {
    const reviews = await Review.find({ game_id: req.params.gameId }).sort({ created_date: -1 });
    res.json(reviews);
  } catch (err) {
    console.error('Error obteniendo reseñas del juego:', err);
    res.status(500).json({ error: 'Error al obtener reseñas del juego' });
  }
});

app.post('/api/reviews', async (req, res) => {
  try {
    const { game_id, rating, review_text } = req.body;
    if (!game_id) return res.status(400).json({ error: 'ID del juego es obligatorio' });
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'La calificación debe ser entre 1 y 5' });

    const gameExists = await Game.findOne({ id: game_id });
    if (!gameExists) return res.status(404).json({ error: 'Juego no encontrado' });

    const review = new Review({
      id: Date.now().toString(),
      game_id,
      rating: parseInt(rating, 10),
      review_text: review_text ? review_text.trim() : ''
    });

    const saved = await review.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error('Error creando reseña:', err);
    res.status(500).json({ error: 'Error al crear reseña' });
  }
});

app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada', path: req.originalUrl });
});

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('✅ Conectado a MongoDB');
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT} (env: ${NODE_ENV})`);
    });
  })
  .catch(err => {
    console.error('❌ Error MongoDB:', err);
    process.exit(1);
  });
  
process.on('SIGINT', async () => {
  console.log('Cerrando servidor...');
  await mongoose.connection.close();
  process.exit(0);
});
