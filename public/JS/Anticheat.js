document.addEventListener('DOMContentLoaded', () => {
    localStorage.setItem("cheat", localStorage.getItem("cheat") || 0);
    localStorage.setItem("flagged", localStorage.getItem("flagged") || "unflagged");

    let anticheatInterval;

    function blockUser() {
        document.body.innerHTML = '';
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = 0;
        overlay.style.left = 0;
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.backgroundColor = 'black';
        overlay.style.zIndex = 99999;
        overlay.style.color = 'white';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.fontSize = '2rem';
        overlay.innerText = 'Zugriff gesperrt! Bitte +43 690 10187491 Kontaktieren oder Dir. Soliman';
        document.body.appendChild(overlay);

        document.body.style.pointerEvents = 'none';
        document.body.style.userSelect = 'none';
    }

    function Anticheat() {
        const devtools = { isOpen: false };
        const threshold = 160;

        function check() {
            const widthThreshold = window.outerWidth - window.innerWidth > threshold;
            const heightThreshold = window.outerHeight - window.innerHeight > threshold;

            let flag = localStorage.getItem("flagged");
            if (flag === "flagged") {
                blockUser();
                return;
            }

            if (widthThreshold || heightThreshold) {
                devtools.isOpen = true;

                localStorage.setItem("cheat", 1);
                localStorage.setItem("flagged", "flagged");
                blockUser();
            }
        }

        anticheatInterval = setInterval(check, 1000);
    }

    Anticheat();

    // Kill-Switch zum Refreshen: Reset + Redirect (Seite neu laden, danach startet Anticheat neu)
    Object.defineProperty(window, '__anticheatRefresh', {
        value: () => {
            clearInterval(anticheatInterval);
            localStorage.setItem("cheat", 0);
            localStorage.setItem("flagged", "unflagged");
            console.log('Anticheat zurückgesetzt und Seite wird neu geladen...');
            window.location.href = 'indexpage.html'; // anpassen falls nötig
        },
        writable: false,
        configurable: false,
        enumerable: false
    });
});
