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
        let status = select.options[select.selectedIndex]?.text || null;

        const input = document.getElementById('termin').value;
        let datetime = null;
        if (input) {
            const dateObj = new Date(input);
            // Lokale Zeit als String im deutschen Format
            datetime = dateObj.toLocaleString('de-DE');
        }

        // Payload für das Backend
        const data = {
            anrede: formData.anrede || null,
            titel: formData.titel?.trim() || null,
            vorname: formData.vorname?.trim() || null,
            nachname: formData.nachname?.trim() || null,
            geburtsdatum: formData.geburtsdatum || null,
            email: formData.email?.trim() || null,
            telefon: formData.telefon?.trim() || null,
            plz: formData.plz?.trim() || null,
            ort: formData.ort?.trim() || null,
            strasse: formData.strasse?.trim() || null,
            kampagne: null,
            partner: gpnr || partner || null,
            status: status,
            terminisiert: datetime
        };

        // Validierung
        if (!data.vorname || !data.telefon) {
            alert('Bitte alle Pflichtfelder ausfüllen!');
            return;
        }

        try {
            const res = await fetch('/api/leads/addnewTerminisiert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(data)
            });

            if (!res.ok) throw new Error('Serverfehler');

            const result = await res.json();

            if (result.success) {
                toast.classList.add('show');
                setTimeout(() => toast.classList.remove('show'), 4000);
                form.reset();
                window.location.href="Tagesübersicht.html"
            } else {
                alert('Fehler: ' + (result.error || 'Unbekannter Fehler'));
            }
        } catch (err) {
            alert('Ein Fehler ist aufgetreten: ' + err.message);
        }
    });
});
