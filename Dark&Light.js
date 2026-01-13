   const darkModeBtn = document.getElementById('dark-mode-btn');
        const body = document.body;

        // Check localStorage for dark mode preference
        if (localStorage.getItem('dark-mode') === 'enabled') {
            body.classList.add('dark-mode');
            darkModeBtn.textContent = '☀️ Light Mode';
        }

        darkModeBtn.addEventListener('click', () => {
            body.classList.toggle('dark-mode');
            
            if (body.classList.contains('dark-mode')) {
                localStorage.setItem('dark-mode', 'enabled');
                darkModeBtn.textContent = '☀️ Light Mode';
            } else {
                localStorage.setItem('dark-mode', 'disabled');
                darkModeBtn.textContent = '🌙 Dark Mode';
            }
        });