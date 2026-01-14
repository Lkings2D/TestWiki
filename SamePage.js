// Load HTML into the content box. When `push` is true we add a history entry.
        function loadContent(url, push = true) {
            fetch(url, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } })
                .then(response => {
                    if (!response.ok) throw new Error('Network response was not ok');
                    return response.text();
                })
                .then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    // Prefer copying only the inner `.content-box` from the fetched page
                    // to avoid duplicating headers, footers, or buttons (like dark-mode).
                    const fetchedBox = doc.querySelector('.content-box');
                    const content = fetchedBox ? fetchedBox.innerHTML : doc.body.innerHTML;
                    const title = doc.querySelector('title') ? doc.querySelector('title').innerText : document.title;
                    document.querySelector('.content-box').innerHTML = content;
                    document.title = title;
                    if (push) history.pushState({ url: url }, title, url);
                    window.scrollTo(0, 0);
                })
                .catch(error => console.error('Error loading content:', error));
        }

        // When user navigates via back/forward, reload the appropriate content.
        window.addEventListener('popstate', (event) => {
            const stateUrl = event.state && event.state.url;
            const urlToLoad = stateUrl || location.pathname;
            loadContent(urlToLoad, false);
        });

        // Replace initial history state so popstate has an initial URL to restore.
        window.addEventListener('load', () => {
            const initial = location.pathname + location.search + location.hash;
            history.replaceState({ url: initial }, document.title, initial);
        });