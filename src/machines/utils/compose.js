const compose = require('koa-compose');
const isArray = require('lodash/isArray');

const bubbling = async function(ctx, next) {
  const { machina, client, action_ } = ctx;
  const eventPayload = machina.buildEventPayload(
    client,
    { inputType: action_, delegated: false, ticket: undefined, args: [ctx, next]}
  );
  machina.emit('nohandler', eventPayload);
};

const catchAll = async function(ctx, next) {
  try {
    await next();
  } catch(e) {
    console.error('Unhandled error', e);
    await ctx.convo.reply('Unhandled error occurred');
    // TODO it's so unexpected that we probably should clear whole user session
  }
};

const ignoreResetEvent = async function(ctx, next) {
  const { action_ } = ctx;
  if (action_ !== '_reset') {
    await next();
  }
};

export default (handler) => { // global wrapper for adding stuff to FSM
  handler = isArray(handler) ? handler : [handler];
  return async function (client, action_, convo) {
    await compose([catchAll, ignoreResetEvent, ...handler, bubbling])({client, action_, convo, machina: this})
  }
};
