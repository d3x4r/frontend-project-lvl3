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
  const currentNewsList = document.querySelector('.news-list');
  const newNewsList = document.createElement('ul');
  newNewsList.classList.add('list-group', 'col-9', 'p-0', 'news-list');

  state.newsList.forEach((currentNews) => {
    const listItem = document.createElement('li');
    const link = document.createElement('a');
    listItem.classList.add('list-group-item');
    link.textContent = currentNews.title;
    link.setAttribute('href', currentNews.link);

    listItem.append(link);

    newNewsList.append(listItem);
  });
  currentNewsList.replaceWith(newNewsList);
};

export { renderFeedsList, renderNewsList };
