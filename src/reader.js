const saved = document.querySelector('.saved');

(async () => {
  const parameters = await localforage.getItem('parameter');
  saved.innerHTML = parameters;
})();
