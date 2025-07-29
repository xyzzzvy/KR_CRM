document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logout');

    logoutButton.addEventListener('click', async() => {
        const apiBase = window.location.origin;
        window.location.href = apiBase + "/";
    })

})