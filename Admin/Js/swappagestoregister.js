document.addEventListener("DOMContentLoaded", () => {
    const apiBase = window.location.origin;
    const btn = document.getElementById("register");
    if (btn) {
        btn.addEventListener("click", () => {
            window.location.href = apiBase + "/Admin/register-page.html";
        });
    }
});