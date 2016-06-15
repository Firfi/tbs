import mongoose from '../storage/mongo';

const Speaker = mongoose.model('Speaker', new mongoose.Schema({
  id: String,
  name: String
}, {timestamps: true}));

export default Speaker;

export async function getSpeaker(id, initial) {
  const speaker = await Speaker.findOne({id});
  if (!speaker && initial) {
    initial.save();
    return initial;
  }
  return speaker;
}
