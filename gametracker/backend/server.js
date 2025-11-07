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

app.get('/api/games', async (req, res) => {
  try {
    console.log('Obteniendo todos los juegos...'); 
  const games = await Game.find().sort({ created_date: -1 });
    console.log(`Se encontraron ${games.length} juegos`); 
    res.json(games);
  } catch (error) {
    console.error('Error obteniendo juegos:', error);
    res.status(500).json({ error: 'Error al obtener juegos' });
  }
});

app.get('/api/games/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Buscando juego con ID:', id); 
    
    const game = await Game.findOne({ id: id });
    if (!game) {
      return res.status(404).json({ error: 'Juego no encontrado' });
    }
    res.json(game);
  } catch (error) {
    console.error('Error obteniendo juego:', error);
    res.status(500).json({ error: 'Error al obtener juego' });
  }
});

app.put('/api/games/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    console.log('Actualizando juego ID:', id); 
    console.log('Datos a actualizar:', updates); 
    

    const game = await Game.findOneAndUpdate(
      { id: id }, 
      {
        $set: {
          ...updates,
          ...(updates.title && { title: updates.title.trim() }),
          ...(updates.description !== undefined && { description: updates.description.trim() }),
          ...(updates.cover_image_url !== undefined && { cover_image_url: updates.cover_image_url.trim() })
        }
      }, 
      { 
        new: true, 
        runValidators: true 
      }
    );
    
    if (!game) {
      return res.status(404).json({ error: 'Juego no encontrado' });
    }
    
    console.log('Juego actualizado:', game); // Para debug
    
    res.json(game);
  } catch (error) {
    console.error('Error actualizando juego:', error);
    res.status(500).json({ error: 'Error al actualizar juego' });
  }
});

app.delete('/api/games/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('Eliminando juego ID:', id);
    
    const game = await Game.findOne({ id: id });
    
    if (!game) {
      return res.status(404).json({ error: 'Juego no encontrado' });
    }
    
    await Game.findOneAndDelete({ id: id });
    
    const deletedReviews = await Review.deleteMany({ game_id: id });
    
    console.log(`Juego eliminado. Se eliminaron ${deletedReviews.deletedCount} reseñas asociadas`);
    
    res.json({ 
      message: 'Juego eliminado exitosamente',
      deletedReviews: deletedReviews.deletedCount
    });
  } catch (error) {
    console.error('Error eliminando juego:', error);
    res.status(500).json({ error: 'Error al eliminar juego' });
  }
});

