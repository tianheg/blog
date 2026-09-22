fetch('./style.css')
  .then((response) => {
    if (!response.ok) {
      throw new Error('Network response was not OK');
    }
    return response.text();
  })
  .then((result) => {
    const scssFile = document.getElementById('scssFile');
    const preElem = document.createElement('pre');
    const codeElem = document.createElement('code');
    codeElem.innerHTML = result;
    preElem.appendChild(codeElem);
    scssFile.appendChild(preElem);
  });
