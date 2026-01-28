function loadContent(folderPath, push = true) {
    // Ensure folderPath ends with '/' (e.g., '/Mobs/')
    if (!folderPath.endsWith('/')) folderPath += '/';

    const fetchUrl = folderPath + 'index.html'; // actual file to fetch

    fetch(fetchUrl, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } })
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.text();
        })
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            const fetchedBox = doc.querySelector('.wiki-content');
            const content = fetchedBox ? fetchedBox.innerHTML : doc.body.innerHTML;
            const title = doc.querySelector('title') ? doc.querySelector('title').innerText : document.title;

            document.querySelector('#main-content').innerHTML = content;
            document.title = title;

            if (push) history.pushState({ url: folderPath }, title, folderPath); // push folder path, not index.html

            window.scrollTo(0, 0);
        })
        .catch(error => console.error('Error loading content:', error));
}
