import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import userRoutes from './routes/userRoutes.js';      // add .js if needed
import videoRoutes from './routes/videoRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import { OpenAI } from 'openai';
import { Mistral } from '@mistralai/mistralai';
import dotenv from 'dotenv';
import quizRoutes from './routes/quizRoutes.js';
import quizProgressRoutes from './routes/quizProgressRoutes.js';
import createDB from './utils/createDB.js'; // ✅ import it

dotenv.config();

const app = express();

// Middleware
app.use(express.json());  
app.use(cors());          
app.use('/uploads', express.static('uploads'));
app.use('/api/quiz/progress', quizProgressRoutes);

// Routes
app.use('/api/video', videoRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/documents', quizRoutes);

// DB + server setup
const PORT = process.env.PORT || 5000;


mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected');
    await createDB(); // 
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error('MongoDB connection error:', err));


  