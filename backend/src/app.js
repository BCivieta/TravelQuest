import userRoutes from './routes/userRoutes.js';
import mensajeRoutes from './routes/MensajeRoutes.js';
import conversationRoutes from './routes/conversationRoutes.js';


// Configurar rutas
app.use('/api/users', userRoutes);
app.use('/api/mensajes', mensajeRoutes);
app.use('/api/conversations', conversationRoutes); 