import mongoose from './index.js';

export default User = mongoose.model('User', {
  id: String, // unique ID in system in case we have multi-frontend. currently can be also telegram id
  telegramId: String, // can be stored in {providers: {telegram: ...}} as many people do but we can keep it simple
  createdAt: Date,
  updatedAt: Date
});
