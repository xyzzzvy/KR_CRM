document.addEventListener("DOMContentLoaded", () => {
    const apiBase = window.location.origin;
    const btn = document.getElementById("loginbutton");
    const btn2 = document.getElementById("Anmelden");

    if (btn) {
        btn.addEventListener("click", () => {
            window.location.href = apiBase + "/html/login-page.html";
        });
    }

    if (btn2) {
        btn2.addEventListener("click", () => {
            window.location.href = apiBase + "/anmelden";
        });
    }
});
