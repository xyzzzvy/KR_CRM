document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logout');
    const bestellen=document.getElementById('bestellen');
    logoutButton.addEventListener('click', async() => {
        const apiBase = window.location.origin;
        window.location.href = apiBase + "/";
    })

    bestellen.addEventListener('click', () => {
        const apiBase = window.location.origin;
        window.location.href = "Bestellungen.html";
    })

    const btn = document.getElementById("register");
    if (btn) {
        btn.addEventListener("click", () => {
            window.location.href = "register-page.html";
        });
    }

})