document.addEventListener('DOMContentLoaded', () => {
    // Prüfen, ob mobiles Gerät (inkl. iPhone, iPad, Android-Tablets usw.)
    const isMobile = /Mobi|Android|iPhone|iPad|iPod|Tablet/i.test(navigator.userAgent);

    // Falls mobil -> direkt raus aus der Funktion
    if (isMobile) {
        console.log("Anti-Cheat auf mobilen Geräten deaktiviert.");
        return;
    }

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

    //Anticheat();

    const encodedPassword = "QW50aWNoZWF0SGFzaGltMTIz";
    Object.defineProperty(window, '__anticheatRefreshWithPassword', {
        value: () => {
            clearInterval(anticheatInterval);

            const banOverlay = document.querySelector('body > div');
            if (banOverlay) {
                banOverlay.remove();
                document.body.style.pointerEvents = '';
                document.body.style.userSelect = '';
            }

            const overlay = document.createElement('div');
            overlay.style.position = 'fixed';
            overlay.style.top = 0;
            overlay.style.left = 0;
            overlay.style.width = '100vw';
            overlay.style.height = '100vh';
            overlay.style.backgroundColor = 'rgba(0,0,0,0.8)';
            overlay.style.display = 'flex';
            overlay.style.flexDirection = 'column';
            overlay.style.alignItems = 'center';
            overlay.style.justifyContent = 'center';
            overlay.style.zIndex = 1000000;
            overlay.style.pointerEvents = 'auto';

            const input = document.createElement('input');
            input.type = 'password';
            input.placeholder = 'Passwort eingeben...';
            input.style.fontSize = '1.5rem';
            input.style.padding = '0.5rem';
            input.style.marginBottom = '1rem';

            const button = document.createElement('button');
            button.innerText = 'Bestätigen';
            button.style.fontSize = '1.2rem';
            button.style.padding = '0.5rem 1rem';
            button.style.cursor = 'pointer';

            overlay.appendChild(input);
            overlay.appendChild(button);
            document.body.appendChild(overlay);

            const encodedPassword = "QW50aWNoZWF0SGFzaGltMTIz";
            const secretPassword = atob(encodedPassword);

            button.onclick = () => {
                if (input.value === secretPassword) {
                    localStorage.setItem("cheat", 0);
                    localStorage.setItem("flagged", "unflagged");
                    console.log('Anticheat zurückgesetzt und Seite wird neu geladen...');
                    window.location.reload();
                } else {
                    alert('Falsches Passwort!');
                    input.value = '';
                    input.focus();
                }
            };

            input.focus();
        },
        writable: false,
        configurable: false,
        enumerable: false
    });
});
