import mongoose from '../model/index.js';

const Schema = mongoose.Schema({
  id: String,
  state: mongoose.Schema.Types.Mixed,
  locked: Boolean
}, {
  timestamps: true
});

const Convo = mongoose.model('Convo', Schema);

export async function getConvo(key) { // key is uid, uid:chatid, system:uid:chatid (where system is telegram/facebook) etc.
  if (!key) throw new Error('no key provided');
  let convo = await Convo.findOne({id: key});
  if (!convo) {
    convo = new Convo({locked: false, id: key});
    await convo.save();
  }
  return convo;
}
