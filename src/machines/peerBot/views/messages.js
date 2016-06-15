import t from '../../views/messages';

export default () => ({
  firstAspect: t('peer.firstAspect'),
  secondAspect: t('peer.secondAspect'),
  thirdAspect: t('peer.thirdAspect'),
  rateDisplayName(n) {
    return t(`peer.rate.${n}.displayName`);
  }
})
