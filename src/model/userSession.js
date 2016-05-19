import mongoose from './index.js';

export default UserSession = mongoose.model('UserSession', { // actually, how about to just store it in user? user won't have many sessions I think.
  // if we store it in mongo. as an option - redis
  userId: String,
  route: [String], // [String] - array of nested sub bots/menus, or String - path string separated by '/'
  createdAt: Date,
  updatedAt: Date
});

// SIC! each bot can define own session models and use it, like

export const QuizSession = mongoose.model('QuizSession', {
  chatId: String,
  userIds: [String],
  answers: [Answer] // ... etc
});
