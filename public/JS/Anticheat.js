localStorage.setItem("cheat", 0);

Anticheat();

async function Anticheat() {
    const devtools = { isOpen: false };
    const threshold = 160;

    const blockUser = () => {
        // Versuch Fenster zu schließen
        window.close();

        // Wenn Fenster nicht geschlossen wird (typisch), Seite leeren und Overlay anzeigen
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
        overlay.innerText = 'Zugriff gesperrt!';
        document.body.appendChild(overlay);

        // Alles andere blockieren
        document.body.style.pointerEvents = 'none';
        document.body.style.userSelect = 'none';
    };

    const check = () => {
        const widthThreshold = window.outerWidth - window.innerWidth > threshold;
        const heightThreshold = window.outerHeight - window.innerHeight > threshold;

        let flag = sessionStorage.getItem("flagged");
        if (flag === "flagged") {
            blockUser();
            return;
        }

        if (widthThreshold || heightThreshold) {
            devtools.isOpen = true;
            sessionStorage.setItem("flagged", "flagged");

            let a = localStorage.getItem("cheat");
            localStorage.setItem("cheat", Number(a) + 1);

            blockUser();
        }
    };

    setInterval(check, 2000);
}
