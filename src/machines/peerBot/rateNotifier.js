const winston = require('winston');
import Promise from 'bluebird';
import { addRecord, popRecord, rateRecord, aspects, getSession, getSessionPromise, RATES,
  storeRateNotification, popRateNotifications, PeerRatingRateNotification, ratesForRecord } from './store.js';
import sender from '../../sender/index';
import TelegramConvo from '../../router/telegramConvo';
import { getConvo } from '../../router/convoSession';
import rootFsm from '../../machines/rootFsm.js';

export async function sendQueuedNotifications(telegramId) {
  const notificationsWithRecords = await popRateNotifications(telegramId);
  winston.debug(`got records/notifications for rate notifications from polling ${notificationsWithRecords.length}`);
  return await Promise.all(notificationsWithRecords.map(async ({ record, notification }) => {
    return await sendRateNotification(record, notification.ratedById);
  }));
}

export async function sendRateNotification(record, ratedByTelegramId) {
  // TODO actually not uid but chat id but we don't store it for now. session ? also user could close chat.
  winston.debug(`rates notification going for record ${record._id} and user ${record.fromId}`);
  const rates = ratesForRecord(record, ratedByTelegramId);
  return await sender.reply(record.fromId,
    `Your item have been rated: \n${rates.map(rate => `${rate.aspect}: ${rate.rate}`).join('\n')}`
  );
}

export async function notifyAboutRate(record, ratedByTelegramId) {
  const sessionKey = TelegramConvo.makeKey(record.chatId, record.fromId);
  const session = await getConvo(sessionKey);
  if (rootFsm.compositeState(session).endsWith('waitForRate')) { // TODO some lock, not this check
    return await storeRateNotification(record, ratedByTelegramId);
  } else {
    return await sendRateNotification(record, ratedByTelegramId);
  }
}
