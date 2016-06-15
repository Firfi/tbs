const winston = require('winston');
import Promise from 'bluebird';
import { storeRateNotification, popRateNotifications, ratesForRecord } from '../../store.js';
import sender from '../../../../sender/index';
import TelegramConvo from '../../../../router/telegramConvo';
import { getConvo } from '../../../../router/convoSession';
import rootFsm from '../../../../machines/rootFsm.js';
import messages from './views/messages';
import speaker from '../../views/speaker';

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
  const _speaker = await speaker();
  return await sender.withSpeaker(_speaker).reply(record.fromId,
    `${messages().notifier.rated} \n${rates.map(rate => `${rate.aspect}: ${rate.rate}`).join('\n')}`
  );
}

export async function notifyAboutRate(record, ratedByTelegramId) {
  const sessionKey = TelegramConvo.makeKey(record.chatId, record.fromId);
  const session = await getConvo(sessionKey);
  if (rootFsm.compositeState(session).endsWith('rateWIP')) { // TODO some lock, not this check
    return await storeRateNotification(record, ratedByTelegramId);
  } else {
    return await sendRateNotification(record, ratedByTelegramId);
  }
}
