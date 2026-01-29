// Redirect any direct subpage access back to the main page
(function () {
    const mainPage = '/index.html'; // change if your main page URL is different
    const currentPath = window.location.pathname;
    const currentHash = window.location.hash || '';

    // Minimize flash of raw content during redirect
    try {
        document.documentElement.style.backgroundColor = '#0b1220';
        document.documentElement.style.visibility = 'hidden';
    } catch (e) {
        // no-op
    }

    // If the path is not the main page and not root "/", redirect to main page
    if (currentPath !== mainPage && currentPath !== '/') {
        const redirectUrl = `${mainPage}?spa=${encodeURIComponent(currentPath)}${currentHash}`;
        window.location.replace(redirectUrl);
    }
})();
