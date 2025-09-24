document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('userForm');
    const toast = document.getElementById('toast');

    // Affiliate aus URL speichern (wie gehabt)
    const urlParams = new URLSearchParams(window.location.search);
    const afId = urlParams.get('gpnr');
    if (afId != null) {
        localStorage.setItem('affiliate', afId);
    } else {
        localStorage.setItem('affiliate', 0);
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = Object.fromEntries(new FormData(form));
        let partner = localStorage.getItem('affiliate');

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
            partner: partner,
            status: null
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
