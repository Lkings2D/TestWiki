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

            const mainContent = document.querySelector('#main-content');
            mainContent.innerHTML = content;
            document.title = title;

            normalizeRelativeImagePaths(mainContent, folderPath);

            if (push) {
                history.pushState({ url: folderPath }, title, folderPath); // push folder path, not index.html
            } else {
                history.replaceState({ url: folderPath }, title, folderPath); // replace current state
            }

            // Restore scroll position for /Mobs/ page, otherwise scroll to top
            if (folderPath === '/Mobs/') {
                const savedScrollPos = sessionStorage.getItem('mobsScrollPos');
                if (savedScrollPos !== null) {
                    const pos = parseInt(savedScrollPos);
                    requestAnimationFrame(() => {
                        window.scrollTo(0, pos);
                    });
                } else {
                    window.scrollTo(0, 0);
                }
                // Set up listener to save scroll position before leaving Mobs
                setupMobsScrollSaver();
            } else {
                window.scrollTo(0, 0);
            }
        })
        .catch(error => console.error('Error loading content:', error));
}

function setupMobsScrollSaver() {
    // Save scroll position whenever ANY link is clicked from Mobs page
    const mainContent = document.querySelector('#main-content');
    if (mainContent) {
        mainContent.addEventListener('click', function(e) {
            const link = e.target.closest('a');
            if (link) {
                const scrollPos = window.scrollY;
                console.log('Saving Mobs scroll position:', scrollPos);
                sessionStorage.setItem('mobsScrollPos', scrollPos);
            }
        });
    }
}

function normalizeRelativeImagePaths(container, folderPath) {
    if (!container) return;
    if (!folderPath.endsWith('/')) folderPath += '/';

    const images = container.querySelectorAll('img[src]');
    images.forEach((img) => {
        const src = img.getAttribute('src');
        if (!src) return;

        if (src.startsWith('images/')) {
            img.setAttribute('src', folderPath + src);
            return;
        }

        if (src.startsWith('./images/')) {
            img.setAttribute('src', folderPath + src.replace('./', ''));
            return;
        }
    });
}

// Handle browser back/forward buttons
window.addEventListener('popstate', function(event) {
    if (event.state && event.state.url) {
        loadContent(event.state.url, false);
    } else {
        // If no state, go to homepage
        loadContent('/', false);
    }
});

// Handle in-page anchor links inside loaded content
document.addEventListener('click', function(event) {
    const link = event.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href || !href.startsWith('#')) return;

    const target = document.querySelector(href);
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
