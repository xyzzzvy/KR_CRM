localStorage.setItem("cheat", 0);

Anticheat();

async function Anticheat(){
    const devtools = { isOpen: false };
    const threshold = 160;
    const check = () => {
        const widthThreshold = window.outerWidth - window.innerWidth > threshold;
        const heightThreshold = window.outerHeight - window.innerHeight > threshold;

        let flag = sessionStorage.getItem("flagged");
        if (flag === "flagged") {
            // Fenster schließen statt redirect
            window.close();
            return; // Sicherheitshalber Stoppen
        }

        if (widthThreshold || heightThreshold) {
            devtools.isOpen = true;
            sessionStorage.setItem("flagged", "flagged");

            // Cheat zählen
            let a = localStorage.getItem("cheat");
            localStorage.setItem("cheat", Number(a) + 1);

            // Fenster schließen
            window.close();
        }
    };
    setInterval(check, 2000);
}
