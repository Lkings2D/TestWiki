(function () {
    const searchInput = document.getElementById('wiki-search-input');
    const searchBtn = document.getElementById('wiki-search-btn');
    const suggestionsBox = document.getElementById('wiki-search-suggestions');

    const searchIndex = [];
    searchIndex._keys = new Set();
    let indexReady = false;

    function getRepoBasePath() {
        const host = window.location.hostname;
        if (!host.endsWith('github.io')) return '';

        const parts = window.location.pathname.split('/').filter(Boolean);
        if (parts.length === 0) return '';

        const rootFolders = new Set(['Mobs', 'Items', 'Halmgaard', 'Photos']);
        if (rootFolders.has(parts[0])) return '';

        return '/' + parts[0];
    }

    function buildMobHref(href, basePath) {
        if (!href) return '';
        if (href.startsWith('http')) return href;
        if (href.startsWith('/')) return basePath + href;
        if (href.startsWith('#')) return basePath + '/Mobs/index.html' + href;
        return basePath + '/Mobs/' + href.replace(/\/?$/, '/');
    }

    function normalizeLabel(name, type) {
        return `${name} (${type})`;
    }

    function addUniqueEntry(list, entry) {
        const key = `${entry.type.toLowerCase()}::${entry.name.toLowerCase()}`;
        if (list._keys.has(key)) return;
        list._keys.add(key);
        list.push(entry);
    }

    function parseItems(html, basePath) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const names = doc.querySelectorAll('table.wikitable td strong');
        names.forEach((node) => {
            const name = node.textContent.trim();
            if (!name) return;
            addUniqueEntry(searchIndex, {
                name,
                type: 'Item',
                href: basePath + '/Items/index.html?search=' + encodeURIComponent(name)
            });
        });
    }

    function parseMobs(html, basePath) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const links = doc.querySelectorAll('table.wikitable td a');
        links.forEach((link) => {
            const name = link.textContent.trim();
            if (!name) return;
            const href = buildMobHref(link.getAttribute('href'), basePath);
            if (!href) return;
            addUniqueEntry(searchIndex, {
                name,
                type: 'Mob',
                href
            });
        });
    }

    function buildIndex() {
        const basePath = getRepoBasePath();
        const itemsUrl = basePath + '/Items/index.html';
        const mobsUrl = basePath + '/Mobs/index.html';

        return Promise.all([
            fetch(itemsUrl, { cache: 'no-store' }).then(r => r.text()).then(html => parseItems(html, basePath)),
            fetch(mobsUrl, { cache: 'no-store' }).then(r => r.text()).then(html => parseMobs(html, basePath))
        ]).then(() => {
            indexReady = true;
        }).catch(() => {
            indexReady = false;
        });
    }

    function getMatches(query) {
        const normalized = query.toLowerCase();
        return searchIndex.filter(entry => entry.name.toLowerCase().includes(normalized));
    }

    function clearSuggestions() {
        if (!suggestionsBox) return;
        suggestionsBox.innerHTML = '';
        suggestionsBox.classList.remove('visible');
    }

    function renderSuggestions(query) {
        if (!suggestionsBox) return;
        const trimmed = query.trim();
        if (!trimmed || !indexReady) {
            clearSuggestions();
            return;
        }

        const matches = getMatches(trimmed).slice(0, 8);
        if (matches.length === 0) {
            clearSuggestions();
            return;
        }

        suggestionsBox.innerHTML = '';
        matches.forEach((entry) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'wiki-search-suggestion';
            btn.textContent = normalizeLabel(entry.name, entry.type);
            btn.addEventListener('click', () => {
                if (searchInput) searchInput.value = entry.name;
                if (entry.type === 'Item') {
                    navigateToItem(entry.name);
                    return;
                }
                window.location.href = entry.href;
            });
            suggestionsBox.appendChild(btn);
        });
        suggestionsBox.classList.add('visible');
    }

    function navigateToItem(name) {
        const targetQuery = name || (searchInput ? searchInput.value.trim() : '');
        if (!targetQuery) return;

        sessionStorage.setItem('itemsSearch', targetQuery);

        if (typeof loadContent === 'function') {
            loadContent('/Items/');
            // Wait for content to load, then highlight
            setTimeout(() => {
                if (typeof window.highlightItemOnItemsPage === 'function') {
                    window.highlightItemOnItemsPage();
                }
            }, 300);
        } else {
            window.location.href = getRepoBasePath() + '/Items/index.html?search=' + encodeURIComponent(targetQuery);
        }
    }

    function doSearch() {
        if (!indexReady) return;
        const query = searchInput ? searchInput.value.trim() : '';
        if (!query) return;

        const normalized = query.toLowerCase();
        let match = searchIndex.find(entry => entry.name.toLowerCase() === normalized);
        if (!match) {
            match = searchIndex.find(entry => entry.name.toLowerCase().includes(normalized));
        }
        if (!match) return;
        if (match.type === 'Item') {
            navigateToItem(match.name);
            return;
        }
        window.location.href = match.href;
    }

    function highlightItemOnItemsPage() {
        const params = new URLSearchParams(window.location.search);
        const paramQuery = params.get('search');
        const storedQuery = sessionStorage.getItem('itemsSearch');
        const query = paramQuery || storedQuery;
        if (!query) return;

        const path = window.location.pathname.toLowerCase();
        if (!path.includes('/items')) return;

        const rows = document.querySelectorAll('table.wikitable tr');
        let targetRow = null;

        rows.forEach((row) => {
            const strong = row.querySelector('td strong');
            if (!strong) return;
            const name = strong.textContent.trim();
            if (name.toLowerCase() === query.toLowerCase()) {
                targetRow = row;
            }
        });

        if (!targetRow) return;
        targetRow.classList.add('search-hit');
        targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => targetRow.classList.remove('search-hit'), 2500);
        if (storedQuery) sessionStorage.removeItem('itemsSearch');
    }

    if (searchInput && searchBtn && suggestionsBox) {
        searchBtn.addEventListener('click', doSearch);
        searchInput.addEventListener('input', (e) => renderSuggestions(e.target.value));
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                doSearch();
            }
        });
        document.addEventListener('click', (e) => {
            if (!suggestionsBox.contains(e.target) && e.target !== searchInput) {
                clearSuggestions();
            }
        });
        buildIndex();
    }

    // Run on page load
    window.addEventListener('load', highlightItemOnItemsPage);
    
    // Run immediately if DOM is already loaded (for SPA navigation)
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(highlightItemOnItemsPage, 100);
    }
    
    // Expose function for SPA compatibility
    window.highlightItemOnItemsPage = highlightItemOnItemsPage;
})();
