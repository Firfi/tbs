const toPairs = require('lodash/toPairs');
const fromPairs = require('lodash/fromPairs');
const lowerCase = require('lodash/lowerCase');
import { capitalizeFirstLetter } from '../../utils/string';

import R from 'ramda';

export const humanizeCommandString = s => capitalizeFirstLetter(lowerCase(s.slice(1))); // for options also

export const humanizeCommands = handlers => {
  const handlersToAdd = toPairs(handlers).filter(p => p[0].startsWith('/')); 
  return Object.assign(
    {},
    handlers,
    ...[humanizeCommandString, R.pipe(humanizeCommandString, lowerCase)].map( // not only for options but for kb typing on mobile phones
      f => fromPairs(handlersToAdd.map(p => [f(p[0]), p[1]]))
    )
  )
};

export const attachCommandHandlers = (commandHandlers) => {
  commandHandlers = humanizeCommands(commandHandlers);
  return async function(ctx, next) {
    const { convo } = ctx;
    const commandHandler = convo.message.isText() && commandHandlers[convo.message.content];
    if (commandHandler) {
      await commandHandler.bind(this)(ctx, next);
    } else {
      return await next();
    }
  }
};
