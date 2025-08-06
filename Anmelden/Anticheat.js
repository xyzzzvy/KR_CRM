localStorage.setItem("cheat", localStorage.getItem("cheat") || 0);

Anticheat();

async function Anticheat() {
    const devtools = { isOpen: false };
    const threshold = 160;

    const blockUser = () => {
        window.close();

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

            // Cheat count holen und erhöhen
            let cheatCount = Number(localStorage.getItem("cheat")) || 0;
            cheatCount++;
            localStorage.setItem("cheat", cheatCount);

            if (cheatCount > 1) {
                sessionStorage.setItem("flagged", "flagged");
                blockUser();
            } else {
                alert(`Warnung 1/1: Bitte benutze keine DevTools oder versuche nicht das Fenster zu manipulieren!`);
            }
        }
    };

    setInterval(check, 2000);
}
