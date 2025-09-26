document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");

    const btn2 =document.getElementById("passs");
    btn2.addEventListener("click", () => {
        window.alert("Melden Sie sich an Direktor Soliman");
    });


    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const gpnr = document.getElementById("username").value;
        const password = document.getElementById("login_password").value;

        if (!gpnr || !password) {
            alert("Bitte Benutzername und Passwort eingeben.");
            return;
        }

        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",  // Cookie wird mitgesendet/empfangen
                body: JSON.stringify({ gpnr, password })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Nach erfolgreichem Login: Weiterleitungsseite abrufen
                sessionStorage.setItem("pr", gpnr);
                const roleResponse = await fetch("/requestpage", {
                    method: "GET",
                    credentials: "include"  // Cookie wird mitgesendet
                });

                const pageResult = await roleResponse.json();

                if (roleResponse.ok && pageResult.page) {
                    window.location.href = pageResult.page;
                } else {
                    alert(pageResult.error || "Weiterleitung fehlgeschlagen.");
                }
            } else {
                alert(result.error || "Login fehlgeschlagen.");
            }
        } catch (error) {
            console.error("Fehler beim Login:", error);
            alert("Serverfehler. Bitte später erneut versuchen.");
        }
    });
});
