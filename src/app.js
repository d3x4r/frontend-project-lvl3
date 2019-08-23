import axios from 'axios';
import validator from 'validator';
import { flatten, some } from 'lodash';
import { watch } from 'melanke-watchjs';
import { renderFeedsList, renderNewsList } from './renders';
import { initFormStatus, setFormStatus } from './localize-form-statuses';
import parseString from './string-parser';

const getUrl = (url = '') => new URL(`https://cors-anywhere.herokuapp.com/${url}`);
const normalizeText = text => (text.match(/CDATA\[(.*?)\]/is) ? text.match(/CDATA\[(.*?)\]/is)[1] : text);

export default () => {
  let timer;
  let errorMessage;
  const form = document.querySelector('.jumbotron');
  const input = form.querySelector('.form-control');
  const button = form.querySelector('.btn');
  const newsContrainer = document.querySelector('.news-list');
  const modalTextContainer = document.querySelector('.modal-body');

  const isAddedLink = (linkList, checkedLink) => some(linkList, ({ link }) => link === checkedLink);

  initFormStatus();

  const state = {
    form: {
      status: 'clean',
      currentUrl: '',
    },
    feedsList: [],
    newsList: [],
    textOfModal: '',
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
      input.value = state.form.currentUrl;
      input.value = '';
      button.disabled = false;
      setFormStatus('afterSucces');
    },
  };

  const validateLink = ({ target: { value } }) => {
    if (value === '') {
      state.form.status = 'clean';
      return;
    }

    if (isAddedLink(state.feedsList, value)) {
      state.form.status = 'alreadyAdded';
      return;
    }

    const isValidUrl = validator.isURL(String(value));

    state.form.status = isValidUrl ? 'valid' : 'invalid';
    state.form.currentUrl = value;
  };

  const getFeed = (stringXml) => {
    const html = parseString(stringXml);
    const feed = html.querySelector('channel');
    if (!feed) {
      throw new Error('withoutFeed');
    }
    return feed;
  };

  const addFeedToState = (feed) => {
    const feedTitleElement = feed.querySelector('title');
    const feedTitle = feedTitleElement.textContent;
    const normalizedFeedTitle = normalizeText(feedTitle);
    const feedItem = {
      title: normalizedFeedTitle,
      link: state.form.currentUrl,
    };
    state.feedsList = [feedItem, ...state.feedsList];
    state.form.currentUrl = '';
    state.form.status = 'afterSucces';
  };

  const getNews = (news) => {
    const newsTitleElement = news.querySelector('title');
    const title = newsTitleElement.textContent;
    const normalizedTitle = normalizeText(title);
    const link = news.querySelector('link').nextSibling;
    const linkHref = link.textContent;
    const descriptionElement = news.querySelector('description');
    const description = descriptionElement.innerHTML;
    const normalizedDescription = normalizeText(description);
    return {
      title: normalizedTitle,
      link: linkHref,
      description: normalizedDescription,
    };
  };

  const getNewsList = (feed) => {
    const news = feed.querySelectorAll('item');
    return [...news].map(getNews);
  };

  const addNewsToState = (feed) => {
    const newsList = getNewsList(feed);
    state.newsList = [...newsList, ...state.newsList];
  };

  const updateState = (feed) => {
    addFeedToState(feed);
    addNewsToState(feed);
  };

  const addNewNewsToState = (newsList) => {
    const flattenNewsList = flatten(newsList);
    const addedNews = flattenNewsList
      .filter(({ link }) => !isAddedLink(state.newsList, link));
    state.newsList = [...addedNews, ...state.newsList];
  };

  const watchForUpdates = () => {
    if (timer) {
      clearTimeout(timer);
    }
    // eslint-disable-next-line no-use-before-define
    checkUpdates(5000);
  };

  const checkUpdates = (time) => {
    timer = setTimeout(() => {
      const activeFeeds = state.feedsList;
      const listOfUpdatedData = activeFeeds.map(({ link }) => axios.get(getUrl(link)));

      Promise.all(listOfUpdatedData)
        .then(updatedData => updatedData.map(({ data }) => getFeed(data)))
        .then(feedsList => feedsList.map(feed => getNewsList(feed)))
        .then(addNewNewsToState)
        .then(watchForUpdates);
    }, time);
  };

  const showCurrentNews = ({ target }) => {
    const showNewsButton = target.closest('button');
    if (!showNewsButton) {
      return;
    }
    const newsContainer = showNewsButton.closest('.list-group-item');
    const newsLink = newsContainer.querySelector('a');
    const newsLinkHref = newsLink.getAttribute('href');
    const currentNews = state.newsList.find(({ link }) => link === newsLinkHref);
    state.textOfModal = currentNews.description;
  };

  const onRequestError = (error) => {
    state.form.status = 'afterError';
    errorMessage = error;
  };

  const sendRequest = (url) => {
    axios.get(url)
      .then(response => response.data)
      .then(getFeed)
      .then(updateState)
      .then(watchForUpdates)
      .catch(onRequestError);
  };

  const onSubmit = (evt) => {
    evt.preventDefault();
    const currentUrl = getUrl(state.form.currentUrl);
    sendRequest(currentUrl);
    state.form.status = 'processing';
  };

  input.addEventListener('input', validateLink);
  newsContrainer.addEventListener('click', showCurrentNews);
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
};
