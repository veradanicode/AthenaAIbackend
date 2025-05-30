import mongoose from 'mongoose';

const quizProgressSchema = new mongoose.Schema({
  score: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const QuizProgress = mongoose.model('QuizProgress', quizProgressSchema);
export default QuizProgress;
