import mongoose from '../storage/mongo';

export default mongoose.model('File', new mongoose.Schema({
  telegramId: String,
  name: String
}, {timestamps: true}));
