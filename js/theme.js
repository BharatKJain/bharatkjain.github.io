let theme = localStorage.getItem("theme")
if (theme == null) {
    setTheme('light');
}
else {
    setTheme(theme);
}
const onClick = () => {
    let theme = localStorage.getItem("theme")
    theme = theme === 'light'
        ? 'dark'
        : 'light'

    setTheme(theme)
}

function setTheme(mode) {
    if (mode == 'light') {
        document.getElementById('theme-style').href = '/styles/light-mode.css'
    }
    else {
        document.getElementById('theme-style').href = '/styles/dark-mode.css'
    }

    document.firstElementChild
        .setAttribute('data-theme', mode)

    document
        .querySelector('#theme-toggle')
        ?.setAttribute('aria-label', mode)

    localStorage.setItem('theme', mode)
}


window.onload = () => {
    document
        .querySelector('#theme-toggle')
        .addEventListener('click', onClick)
}

window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', ({ matches: isDark }) => {
        theme = isDark ? 'dark' : 'light'
        setTheme(theme)
    })
