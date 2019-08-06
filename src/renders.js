const renderFeedsList = (state) => {
  const currentFeedList = document.querySelector('.feed-list');

  const newFeedList = document.createElement('ul');
  newFeedList.classList.add('list-group', 'col-3', 'feed-list');

  state.feedsList.forEach((currentElement) => {
    const listItem = document.createElement('li');
    listItem.classList.add('list-group-item');
    listItem.textContent = currentElement.title;
    newFeedList.append(listItem);
  });
  currentFeedList.replaceWith(newFeedList);
};

const renderNewsList = (state) => {
  const currentNewsList = document.querySelector('.news-list__container');
  const newNewsList = document.createElement('ul');
  newNewsList.classList.add('list-group', 'news-list__container');

  state.newsList.forEach((currentNews) => {
    const listItem = document.createElement('li');
    const link = document.createElement('a');
    const button = document.createElement('button');

    listItem.classList.add('list-group-item');
    link.classList.add('d-block', 'mb-3');
    link.textContent = currentNews.title;
    link.setAttribute('href', currentNews.link);
    button.textContent = 'Read description';
    button.classList.add('btn', 'btn-info');

    button.setAttribute('type', 'button');
    button.dataset.toggle = 'modal';
    button.dataset.target = '#news-modal';

    listItem.append(link, button);

    newNewsList.append(listItem);
  });
  currentNewsList.replaceWith(newNewsList);
};

export { renderFeedsList, renderNewsList };
