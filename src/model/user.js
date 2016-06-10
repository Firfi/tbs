import mongoose from './index.js';

const UserSchema = mongoose.Schema({
  id: mongoose.Schema.Types.ObjectId, // unique ID in system in case we have multi-frontend. currently can be also telegram id
  telegramId: Number // can be stored in {providers: {telegram: ...}} as many people do but we can keep it simple
}, {
  timestamps: true
});

export const User = mongoose.model('User', UserSchema);


export async function getByTelegramId(telegramId) {
  if (!telegramId) throw new Error('telegramId not provided');
  let user = await User.findOne({telegramId});
  if (!user) {
    user = new User({
      telegramId
    });
    await user.save();
  }
  return user;
}
