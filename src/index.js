// import 'bootstrap';
import './style.scss';
import validator from 'validator';
import { watch } from 'melanke-watchjs';
import axios from 'axios';
import { renderFeedsList, renderNewsList } from './renders';

const domparser = new DOMParser();
const getUrl = (url = '') => new URL(`https://cors-anywhere.herokuapp.com/${url}`);
const getTitle = text => (text.match(/CDATA\[(.*?)\]/is) ? text.match(/CDATA\[(.*?)\]/is)[1] : text);

const app = () => {
  const form = document.querySelector('.jumbotron');
  const input = form.querySelector('.form-control');
  const button = form.querySelector('.btn');
  const message = form.querySelector('.message-container');

  const state = {
    form: {
      status: 'clean',
      message: '',
      currentUrl: '',
    },
    feedsList: [],
    newsList: [],
  };

  const updateForm = {
    clean: () => {
      input.classList.remove('is-invalid');
      message.textContent = state.form.message;
    },
    invalid: () => {
      input.classList.add('is-invalid');
      button.disabled = true;
      message.textContent = state.form.message;
    },
    valid: () => {
      input.classList.remove('is-invalid');
      button.disabled = false;
      message.textContent = state.form.message;
    },
    lock: () => {
      input.setAttribute('readonly', 'readonly');
      button.disabled = true;
      message.textContent = state.form.message;
    },
    afterError: () => {
      input.classList.add('is-invalid');
      input.removeAttribute('readonly');
      button.disabled = false;
      message.textContent = state.form.message;
    },
    afterSucces: () => {
      input.classList.remove('is-invalid');
      input.removeAttribute('readonly');
      input.value = state.form.currentUrl;
      input.value = '';
      button.disabled = false;
      message.textContent = state.form.message;
    },
  };

  input.addEventListener('input', (evt) => {
    const currentUrl = evt.target.value;
    if (currentUrl === '') {
      state.form.status = 'clean';
      state.form.message = 'edit url';
      return;
    }

    if (state.feedsList.some(({ index }) => index === currentUrl)) {
      state.form.status = 'invalid';
      state.form.message = 'this url already added';
      return;
    }

    const urlIsValid = validator.isURL(String(currentUrl));

    state.form.status = urlIsValid ? 'valid' : 'invalid';
    state.form.message = urlIsValid ? 'this url is correct' : 'please, edit correct url';
    state.form.currentUrl = currentUrl;
  });

  const checkResponse = response => new Promise((resolve, reject) => {
    const { data } = response;
    const dataToHtml = domparser.parseFromString(data, 'text/html');
    const channel = dataToHtml.querySelector('channel');
    if (!channel) {
      reject(new Error('This url doesnt have a rss-channel'));
    }
    state.form.status = 'afterSucces';
    state.form.message = 'the feed is added';
    resolve(channel);
  });


  const updateFeedState = channel => new Promise((resolve) => {
    const channelTitle = channel.querySelector('title').textContent;
    const normalizedChannelTitle = getTitle(channelTitle);
    state.feedsList.push({ title: normalizedChannelTitle, index: state.form.currentUrl });
    state.form.currentUrl = '';
    resolve(channel);
  });

  const updateNewsState = channel => new Promise(() => {
    const news = channel.querySelectorAll('item');

    const newState = [...news].map((currentNews) => {
      const currentTitle = currentNews.querySelector('title').textContent;
      const normalizedCurrentTitle = getTitle(currentTitle);
      const link = currentNews.querySelector('link').nextSibling.textContent;
      return {
        title: normalizedCurrentTitle,
        link,
      };
    });
    state.newsList = [...state.newsList, ...newState];
  });

  button.addEventListener('click', () => {
    const url = getUrl(state.form.currentUrl);
    state.form.status = 'lock';
    state.form.message = 'wait a few seconds';

    axios.get(url)
      .then(checkResponse)
      .then(updateFeedState)
      .then(updateNewsState)
      .catch((error) => {
        state.form.status = 'afterError';
        state.form.message = error;
      });
  });

  watch(state.form, 'status', () => {
    updateForm[state.form.status]();
  });

  watch(state, 'feedsList', () => {
    renderFeedsList(state);
    renderNewsList(state);
  });
};
app();
