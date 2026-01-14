// Redirect any direct subpage access back to the main page
(function () {
    const mainPage = '/index.html'; // change if your main page URL is different
    const currentPath = window.location.pathname;

    // If the path is not the main page and not root "/", redirect to main page
    if (currentPath !== mainPage && currentPath !== '/') {
        window.location.replace(mainPage);
    }
})();
