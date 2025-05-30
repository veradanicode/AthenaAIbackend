// models/Schedule.js
import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  task: String,
  time: String // or Date if exact time is needed
});

const Schedule = mongoose.model('Schedule', scheduleSchema);
export default Schedule;
