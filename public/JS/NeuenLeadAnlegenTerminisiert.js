document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('userForm');
    const toast = document.getElementById('toast');

    async function fetchCredits() {
        try {
            const response = await fetch("/api/websocket/credits", {
                method: "GET",
                credentials: "include",
            });
            const data = await response.json();
            if (data.success) {
                console.log("GPNR:", data.gpnr, "Name:", data.name);
                return { gpnr: data.gpnr, name: data.name };
            } else {
                console.error("Fehler:", data.error);
                return {};
            }
        } catch (err) {
            console.error("Fetch-Fehler:", err);
            return {};
        }
    }

    const { gpnr, name } = await fetchCredits();



    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = Object.fromEntries(new FormData(form));
        let partner = localStorage.getItem('affiliate');

        let select = document.getElementById("termin-art");
        let status = select.options[select.selectedIndex].text;

        const input = document.getElementById('termin').value;
        const dateObj = new Date(input);
        const datetime = dateObj.toISOString();

        // Payload für dein Backend
        const data = {
            anrede: formData.anrede || null,
            titel: formData.titel?.trim() || null,
            vorname: formData.vorname?.trim(),
            nachname: formData.nachname?.trim(),
            geburtsdatum: formData.geburtsdatum || null,
            email: formData.email?.trim(),
            telefon: formData.telefon?.trim(),
            plz: formData.plz?.trim(),
            ort: formData.ort?.trim(),
            strasse: formData.strasse?.trim(),
            kampagne: null,
            partner: gpnr,
            status: status,
            terminisiert: datetime
        };

        // Einfache Validierung
        if (!data.vorname ||  !data.telefon) {
            alert('Bitte alle Pflichtfelder ausfüllen!');
            return;
        }

        try {
            const res = await fetch('/api/leads/addnew', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials:'include',
                body: JSON.stringify(data)
            });

            if (!res.ok) throw new Error('Serverfehler');

            const result = await res.json();

            if (result.success) {
                toast.classList.add('show');
                setTimeout(() => toast.classList.remove('show'), 4000);
                form.reset();
            } else {
                alert('Fehler: ' + (result.error || 'Unbekannter Fehler'));
            }
        } catch (err) {
            alert('Ein Fehler ist aufgetreten: ' + err.message);
        }
    });
});
