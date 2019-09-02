import axios from 'axios';
import validator from 'validator';
import i18next from 'i18next';
import { flatten, some } from 'lodash';
import { watch } from 'melanke-watchjs';
import { renderFeedsList, renderNewsList } from './renders';
import i18nextInit from './i18next';
import parse from './parser';

const getUrl = (url = '') => new URL(`https://cors-anywhere.herokuapp.com/${url}`);
const isUrl = value => validator.isURL(String(value));
const isAddedLink = (linkList, checkedLink) => some(linkList, ({ link }) => link === checkedLink);

const validateLink = (link, linksList) => {
  if (link === '') {
    return 'clean';
  }

  if (isAddedLink(linksList, link)) {
    return 'alreadyAdded';
  }

  const isValidLink = isUrl(link);
  return isValidLink ? 'valid' : 'invalid';
};

export default () => {
  let timer;
  let errorMessage;
  const CHECK_INTERVAL = 5000;
  const form = document.querySelector('.jumbotron');
  const input = form.querySelector('.form-control');
  const button = form.querySelector('.btn');
  const newsContrainer = document.querySelector('.news-list');
  const modalTextContainer = document.querySelector('.modal-body');
  const statusContainer = document.querySelector('.message-container');

  const state = {
    form: {
      status: 'clean',
      currentUrl: '',
    },
    feedsList: [],
    newsList: [],
    textOfModal: '',
  };

  const setFormStatus = (statusKey = 'clean', error) => {
    if (error) {
      const { message } = error;
      const errorText = message ? i18next.t(message) : error;
      statusContainer.textContent = errorText;
      return;
    }
    statusContainer.innerHTML = i18next.t(statusKey);
  };

  const updateForm = {
    clean: () => {
      input.classList.remove('is-invalid');
      setFormStatus('clean');
    },
    invalid: () => {
      input.classList.add('is-invalid');
      button.disabled = true;
      setFormStatus('invalid');
    },
    valid: () => {
      input.classList.remove('is-invalid');
      button.disabled = false;
      setFormStatus('valid');
    },
    alreadyAdded: () => {
      input.classList.add('is-invalid');
      button.disabled = true;
      setFormStatus('alreadyAdded');
    },
    processing: () => {
      input.setAttribute('readonly', 'readonly');
      button.disabled = true;
      setFormStatus('processing');
    },
    afterError: () => {
      input.classList.add('is-invalid');
      input.removeAttribute('readonly');
      button.disabled = false;
      setFormStatus('afterError', errorMessage);
    },
    afterSucces: () => {
      input.classList.remove('is-invalid');
      input.removeAttribute('readonly');
      input.value = '';
      button.disabled = false;
      setFormStatus('afterSucces');
    },
  };

  const updateState = ({ title, news }) => {
    state.feedsList = [{ title, link: state.form.currentUrl }, ...state.feedsList];
    state.newsList = [...news, ...state.newsList];
    state.form.currentUrl = '';
    state.form.status = 'afterSucces';
  };

  const getNewNews = (newsList) => {
    const flattenNewsList = flatten(newsList);
    return flattenNewsList.filter(({ link }) => !isAddedLink(state.newsList, link));
  };

  const addNewNewsToState = (newNews) => {
    state.newsList = [...newNews, ...state.newsList];
  };

  const watchForUpdates = () => {
    if (timer) {
      clearTimeout(timer);
    }
    // eslint-disable-next-line no-use-before-define
    checkUpdates(CHECK_INTERVAL);
  };

  const processingResponses = (responses) => {
    Promise.all(responses)
      .then(responsesList => responsesList.map(response => response.data))
      .then(dataList => dataList.map(parse))
      .then(feedsList => feedsList.map(({ news }) => news))
      .then(getNewNews)
      .then(addNewNewsToState)
      .then(watchForUpdates);
  };

  const checkUpdates = (time) => {
    timer = setTimeout(() => {
      const activeFeeds = state.feedsList;
      const responses = activeFeeds.map(({ link }) => axios.get(getUrl(link)));
      processingResponses(responses);
    }, time);
  };

  const getCurrentNews = (target) => {
    const newsButton = target.closest('button');
    if (!newsButton) {
      return false;
    }
    const newsContainer = newsButton.closest('.list-group-item');
    const newsLink = newsContainer.querySelector('a');
    const newsLinkHref = newsLink.getAttribute('href');
    const currentNews = state.newsList.find(({ link }) => link === newsLinkHref);
    return currentNews.description;
  };

  const onRequestError = (error) => {
    state.form.status = 'afterError';
    errorMessage = error;
  };

  const startProcessing = (url) => {
    axios.get(url)
      .then(response => response.data)
      .then(parse)
      .then(updateState)
      .then(watchForUpdates)
      .catch(onRequestError);
  };

  const onSubmit = (evt) => {
    evt.preventDefault();
    const currentUrl = getUrl(state.form.currentUrl);
    state.form.status = 'processing';
    startProcessing(currentUrl);
  };

  input.addEventListener('input', ({ target: { value } }) => {
    const validationResult = validateLink(value, state.feedsList);
    state.form.status = validationResult;
    state.form.currentUrl = value;
  });

  newsContrainer.addEventListener('click', ({ target }) => {
    state.textOfModal = getCurrentNews(target);
  });

  form.addEventListener('submit', onSubmit);

  watch(state.form, 'status', () => {
    updateForm[state.form.status]();
  });

  watch(state, ['feedsList', 'newsList'], () => {
    renderFeedsList(state);
    renderNewsList(state);
  });

  watch(state, 'textOfModal', () => {
    modalTextContainer.innerHTML = state.textOfModal;
  });

  i18nextInit();
  setFormStatus();
};
