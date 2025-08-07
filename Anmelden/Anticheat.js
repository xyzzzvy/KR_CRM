document.addEventListener('DOMContentLoaded', ()=>{
    localStorage.setItem("cheat", localStorage.getItem("cheat") || 0);
    localStorage.setItem("flagged", localStorage.getItem("flagged") || "unflagged");

   // Anticheat();
    async function Anticheat() {
        const devtools = { isOpen: false };
        const threshold = 160;

        const blockUser = () => {
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
        };

        const check = () => {
            const widthThreshold = window.outerWidth - window.innerWidth > threshold;
            const heightThreshold = window.outerHeight - window.innerHeight > threshold;

            let flag = localStorage.getItem("flagged");
            if (flag === "flagged") {
                blockUser();
                return;
            }

            if (widthThreshold || heightThreshold) {
                devtools.isOpen = true;

                // sofort blockieren beim ersten Verstoß
                localStorage.setItem("cheat", 1);
                localStorage.setItem("flagged", "flagged");
                blockUser();
            }
        };

        setInterval(check, 1000);
    }

})