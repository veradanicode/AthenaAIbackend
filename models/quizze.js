// models/Quiz.js
import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
  
  userId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  required: true
},

  questions: [
    {
      question: String,
      options: [String],
      correctAnswer: String,
      selectedAnswer: String,
      isCorrect: Boolean
    }
  ],
  score: Number,
 status: {
    type: String,
    enum: ['in-progress', 'completed'],
    default: 'in-progress'
  },  startedAt: Date,
  completedAt: Date


});

export default mongoose.model('Quiz', quizSchema);
