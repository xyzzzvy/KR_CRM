document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('leadForm');
    const toast = document.getElementById('toast');
    const faqButtons = document.querySelectorAll('.faq-question');
    const urlParams = new URLSearchParams(window.location.search);
    const afId = urlParams.get('gpnr');
    if(afId != null) {
        localStorage.setItem('affiliate', afId);
    }
    else {
        localStorage.setItem('affiliate',0);
    }
    console.log(afId);


    // Toggle FAQ-Antworten
    faqButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const answer = btn.nextElementSibling;
            answer.style.display = answer.style.display === 'block' ? 'none' : 'block';
        });
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = Object.fromEntries(new FormData(form));
        let partner=localStorage.getItem('affiliate');

        // Nur die Felder, die dein Backend erwartet
        const data = {
            vorname: formData.vorname?.trim(),
            nachname: formData.nachname?.trim(),
            telefon: formData.telefon?.trim(),
            plz: formData.plz?.trim(),
            ort: formData.ort?.trim(),
            strasse: formData.strasse?.trim(),
            kampagne: null,  // Falls benötigt, hier anpassen
            partner:partner,   // Falls benötigt, hier anpassen
            status: null     // Falls benötigt, hier anpassen
        };

        // Einfache Validierung
        if (!data.vorname || !data.nachname || !data.telefon || !data.plz || !data.ort || !data.strasse) {
            alert('Bitte alle Pflichtfelder ausfüllen!');
            return;
        }

        try {
            const res = await fetch('/api/leads/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
