export function isCommand(str) {
  return typeof str === 'string' && str.charAt(0) === '/';
}

export const attachCommandHandlers = (commandHandlers) => {
  return async function(ctx, next) {
    const { convo } = ctx;
    const commandHandler = convo.message.isText() && isCommand(convo.message.content) &&
      commandHandlers[convo.message.content];
    if (commandHandler) {
      await commandHandler.bind(this)(ctx, next);
    } else {
      return await next();
    }
  }
};
