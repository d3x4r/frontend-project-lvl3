import axios from 'axios';
import flatten from 'lodash.flatten';
import validator from 'validator';
import { watch } from 'melanke-watchjs';
import { renderFeedsList, renderNewsList } from './renders';
import 'bootstrap/js/dist/modal';
import './style.scss';

const domparser = new DOMParser();
const getUrl = (url = '') => new URL(`https://cors-anywhere.herokuapp.com/${url}`);
const normalizeText = text => (text.match(/CDATA\[(.*?)\]/is) ? text.match(/CDATA\[(.*?)\]/is)[1] : text);

const app = () => {
  let timer;
  const form = document.querySelector('.jumbotron');
  const input = form.querySelector('.form-control');
  const button = form.querySelector('.btn');
  const statusMessage = form.querySelector('.message-container');
  const newsContrainer = document.querySelector('.news-list');
  const modalTextContainer = document.querySelector('.modal-body');

  const state = {
    form: {
      status: 'clean',
      message: '',
      currentUrl: '',
    },
    feedsList: [],
    newsList: [],
    textOfModal: '',
  };

  const updateForm = {
    clean: () => {
      input.classList.remove('is-invalid');
      statusMessage.textContent = state.form.message;
    },
    invalid: () => {
      input.classList.add('is-invalid');
      button.disabled = true;
      statusMessage.textContent = state.form.message;
    },
    valid: () => {
      input.classList.remove('is-invalid');
      button.disabled = false;
      statusMessage.textContent = state.form.message;
    },
    lock: () => {
      input.setAttribute('readonly', 'readonly');
      button.disabled = true;
      statusMessage.textContent = state.form.message;
    },
    afterError: () => {
      input.classList.add('is-invalid');
      input.removeAttribute('readonly');
      button.disabled = false;
      statusMessage.textContent = state.form.message;
    },
    afterSucces: () => {
      input.classList.remove('is-invalid');
      input.removeAttribute('readonly');
      input.value = state.form.currentUrl;
      input.value = '';
      button.disabled = false;
      statusMessage.textContent = state.form.message;
    },
  };

  input.addEventListener('input', (evt) => {
    const currentUrl = evt.target.value;
    if (currentUrl === '') {
      state.form.status = 'clean';
      state.form.message = 'edit url';
      return;
    }
    const isEqualLink = ({ link }) => link === currentUrl;
    if (state.feedsList.some(isEqualLink)) {
      state.form.status = 'invalid';
      state.form.message = 'this url is already added';
      return;
    }

    const isValidUrl = validator.isURL(String(currentUrl));

    state.form.status = isValidUrl ? 'valid' : 'invalid';
    state.form.message = isValidUrl ? 'this url is correct' : 'please, edit correct url';
    state.form.currentUrl = currentUrl;
  });

  const checkResponse = response => new Promise((resolve, reject) => {
    const { data } = response;
    const html = domparser.parseFromString(data, 'text/html');
    const feed = html.querySelector('channel');
    if (!feed) {
      reject(new Error('This url doesnt have a rss-channel'));
    }
    state.form.status = 'afterSucces';
    state.form.message = 'the feed is added';
    resolve(feed);
  });

  const updateFeedsState = feed => new Promise((resolve) => {
    const feedTitle = feed.querySelector('title');
    const feedTitleText = feedTitle.textContent;
    const normalizedFeedTitleText = normalizeText(feedTitleText);
    const feedItem = {
      title: normalizedFeedTitleText,
      link: state.form.currentUrl,
    };
    state.feedsList = [feedItem, ...state.feedsList];
    state.form.currentUrl = '';
    resolve(feed);
  });

  const getNewsList = (feed) => {
    const news = feed.querySelectorAll('item');

    return [...news].map((currentNews) => {
      const title = currentNews.querySelector('title');
      const titleText = title.textContent;
      const normalizedTitle = normalizeText(titleText);
      const link = currentNews.querySelector('link').nextSibling;
      const linkHref = link.textContent;
      const description = currentNews.querySelector('description');
      const descriptionContent = description.innerHTML;
      const normalizeDescription = normalizeText(descriptionContent);
      return {
        title: normalizedTitle,
        link: linkHref,
        description: normalizeDescription,
      };
    });
  };

  const checkUpdates = (time) => {
    timer = setTimeout(() => {
      const activeFeeds = state.feedsList;
      const promisesOfUpdatedFeeds = activeFeeds.map(({ link }) => axios.get(getUrl(link)));

      Promise.all(promisesOfUpdatedFeeds)
        .then(updatedFeeds => updatedFeeds.map((feed) => {
          const htmlFeed = domparser.parseFromString(feed.data, 'text/html');
          return getNewsList(htmlFeed);
        }))
        .then((newsList) => {
          const flattenNewsList = flatten(newsList);
          const newNewsList = flattenNewsList.filter((newNews) => {
            const isEqualLink = ({ link }) => link === newNews.link;
            return !state.newsList.some(isEqualLink);
          });
          state.newsList = [...newNewsList, ...state.newsList];
        })
        .then(checkUpdates(5000));
    }, time);
  };

  const updateNewsState = feed => new Promise(() => {
    const newsList = getNewsList(feed);

    state.newsList = [...newsList, ...state.newsList];

    if (timer) {
      clearTimeout(timer);
    }
    checkUpdates(5000);
  });

  newsContrainer.addEventListener('click', (evt) => {
    const descriptionButton = evt.target.closest('button');
    if (!descriptionButton) {
      return;
    }
    const newsContainer = descriptionButton.closest('.list-group-item');
    const newsLink = newsContainer.querySelector('a');
    const newsLinkHref = newsLink.getAttribute('href');
    const currentNews = state.newsList.find(({ link }) => link === newsLinkHref);
    state.textOfModal = currentNews.description;
  });

  button.addEventListener('click', () => {
    const url = getUrl(state.form.currentUrl);
    state.form.status = 'lock';
    state.form.message = 'wait a few seconds';

    axios.get(url)
      .then(checkResponse)
      .then(updateFeedsState)
      .then(updateNewsState)
      .catch((error) => {
        state.form.status = 'afterError';
        state.form.message = error;
      });
  });

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
app();
