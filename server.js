import express from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes.js';      
import videoRoutes from './routes/videoRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import { OpenAI } from 'openai';
import { Mistral } from '@mistralai/mistralai';
import quizRoutes from './routes/quizRoutes.js';
import quizProgressRoutes from './routes/quizProgressRoutes.js';
import connectToDB from './database/db.js';
import dotenv from "dotenv";

dotenv.config();

const app = express();


//connect to DB
connectToDB();

// Middleware
app.use(express.json());  
app.use(cors());          

// Routes
app.use('/api/video', videoRoutes);
app.use('/api/users', userRoutes);
app.use('/uploads', express.static('uploads'));
app.use('/api/quiz/progress', quizProgressRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/documents', quizRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT,()=>{
  console.log(`Server is now running on ${PORT}`);
  
})


  