const normalizeText = text => (text.match(/CDATA\[(.*?)\]/is) ? text.match(/CDATA\[(.*?)\]/is)[1] : text);
const getHtml = string => new DOMParser().parseFromString(string, 'text/html');

const getNews = (data) => {
  const newsTitleElement = data.querySelector('title');
  const titleTextContent = newsTitleElement.textContent;
  const normalizedTitle = normalizeText(titleTextContent);
  const linkElement = data.querySelector('link').nextSibling;
  const link = linkElement.textContent;
  const descriptionElement = data.querySelector('description');
  const description = descriptionElement.innerHTML;
  const normalizedDescription = normalizeText(description);
  return {
    title: normalizedTitle,
    link,
    description: normalizedDescription,
  };
};

export default (string) => {
  const html = getHtml(string);
  const feed = html.querySelector('channel');

  if (!feed) {
    throw new Error('feedNotFound');
  }

  const feedTitleElement = feed.querySelector('title');
  const feedTitle = feedTitleElement.textContent;
  const normalizedFeedTitle = normalizeText(feedTitle);

  const newsData = feed.querySelectorAll('item');

  return {
    title: normalizedFeedTitle,
    news: [...newsData].map(getNews),
  };
};
