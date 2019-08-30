import i18next from 'i18next';

const formStatuses = {
  en: {
    clean: 'edit url',
    invalid: 'edit correct url',
    valid: 'this url is correct',
    alreadyAdded: 'this url is already added',
    processing: 'wait a few seconds',
    afterSucces: 'the feed is added',
    feedNotFound: 'This url doesnt have a rss-channel',
  },
};

export default () => {
  i18next.init({
    fallbackLng: 'en',
    resources: {
      en: {
        translation: formStatuses.en,
      },
    },
  });
};
