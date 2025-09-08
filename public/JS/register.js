document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById('registrationForm');
    if (!form) {
        console.error("Formular mit id='registrationForm' nicht gefunden!");
        return;
    }

    // Browser-Validation deaktivieren, damit iOS/Safari nicht refresht
    form.setAttribute("novalidate", "true");

    // Toast erstellen (einmalig)
    const toast = document.createElement('div');
    toast.id = 'toast';
    Object.assign(toast.style, {
        visibility: 'hidden',
        minWidth: '250px',
        maxWidth: '90%',
        backgroundColor: '#4CAF50',
        color: 'white',
        textAlign: 'center',
        borderRadius: '5px',
        padding: '12px 16px',
        position: 'fixed',
        zIndex: '1000',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: '17px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
        transition: 'visibility 0s, opacity 0.5s linear',
        opacity: '0',
        whiteSpace: 'normal',
        wordBreak: 'break-word'
    });
    document.body.appendChild(toast);

    function showToast(message, isError = false) {
        toast.textContent = message;
        toast.style.backgroundColor = isError ? '#f44336' : '#4CAF50';
        toast.style.visibility = 'visible';
        toast.style.opacity = '1';

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                toast.style.visibility = 'hidden';
                toast.style.backgroundColor = '#4CAF50';
            }, 500);
        }, 3000);
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        e.stopPropagation(); // extra-Schutz auf Mobile

        // Eigene Validierung
        if (!form.checkValidity()) {
            showToast("Bitte alle Felder korrekt ausfüllen.", true);
            return;
        }

        const formData = {
            gpnr: form.gpnr.value.trim(),
            vorname: form.vorname.value.trim(),
            nachname: form.nachname.value.trim(),
            telefon: form.telefon.value.trim(),
            email: form.email.value.trim(),
            fuehrungskraft: form.fuehrungskraftGpnr.value.trim() || null,
            passwort: form.passwort.value,
            role: "User"
        };

        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            let data;
            try {
                data = await res.json();
            } catch {
                throw new Error("Ungültige Server-Antwort (kein JSON)");
            }

            if (!res.ok) {
                showToast(`Fehler: ${data.error || 'Unbekannter Fehler'}`, true);
                return;
            }

            showToast(`Registrierung erfolgreich für GPNR: ${data.gpnr}`);
            form.reset();

        } catch (err) {
            console.error("Fehler beim Registrieren:", err);
            showToast("Interner Fehler bei der Registrierung.", true);
        }
    });
});
