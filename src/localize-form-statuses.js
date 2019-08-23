import i18next from 'i18next';

const statusContainer = document.querySelector('.message-container');

const setFormStatus = (statusKey, error) => {
  if (error) {
    const { message } = error;
    const errorText = message ? i18next.t(message) : error;
    statusContainer.textContent = errorText;
    return;
  }
  statusContainer.textContent = i18next.t(statusKey);
};

const formStatuses = {
  en: {
    clean: 'edit url',
    invalid: 'edit correct url',
    valid: 'this url is correct',
    alreadyAdded: 'this url is already added',
    processing: 'wait a few seconds',
    afterSucces: 'the feed is added',
    withoutFeed: 'This url doesnt have a rss-channel',
  },
};

const initFormStatus = () => {
  i18next.init({
    lng: 'en',
    resources: {
      en: {
        translation: formStatuses.en,
      },
    },
  }).then(setFormStatus('clean'));
};

export { initFormStatus, setFormStatus };
