export function isCommand(str) {
  return typeof str === 'string' && str.charAt(0) === '/';
}

export const attachCommandHandlers = (commandHandlers) => {
  return (stateHandlersMap) => {
    return Object.assign({}, stateHandlersMap, {
      async '*'(client, action_, convo) {
        const commandHandler = convo.message.isText() && isCommand(convo.message.content) &&
          commandHandlers[convo.message.content];
        if (commandHandler) {
          const commandHandler = commandHandlers[convo.message.content];
          await commandHandler.bind(this)(client, convo);
        } else {
          if (stateHandlersMap['*']) {
            return await stateHandlersMap['*'].bind(this)(client, action_, convo);
          }
        }
      }
    }) ; 
  }
}; 
