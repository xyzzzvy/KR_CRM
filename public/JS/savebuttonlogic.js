document.addEventListener('DOMContentLoaded', () => {
    const savebutton = document.getElementById('savebutton');
    const saveHint = document.getElementById('saveHint');
    const bestellen = document.getElementById('bestellen');
    const mit = document.getElementById('mit');
    const logoutButton = document.getElementById('logout');
    const historybutton = document.getElementById('bestellhistory');
    const sicht=document.getElementById('sicht');
    const reg=document.getElementById('anlegen');
    const addnewleadbut=document.getElementById('addLead');
    const telparty=document.getElementById('telparty');
    const daten=document.getElementById('Daten');



    // Initialisiere updatedLeads, falls noch nicht vorhanden
    if (!window.updatedLeads) {
        window.updatedLeads = [];
    }
    daten.addEventListener('click', () => {
        window.location.href="edit-user-data.html"
    })

    addnewleadbut.addEventListener('click', () => {
        window.location.href="NeuenLeadanlegen.html"
    })

    telparty.addEventListener('click', () => {
        window.location.href="Telefonparty.html"
    })

    reg.addEventListener('click', () => {
        window.location.href = "register-page.html";
    });


    historybutton.addEventListener('click', () => {
        window.location.href = "Bestellübersicht.html";
    });

    sicht.addEventListener('click', () => {
        window.location.href="Tagesübersicht.html";
    })

    mit.addEventListener('click', () => {
        window.location.href = "Mitarbeiter.html";
    });

    // Logout-Event (wie gehabt)
    logoutButton.addEventListener('click', () => {
        const apiBase = window.location.origin;
        window.location.href = apiBase + "/";
    });

    bestellen.addEventListener('click', () => {
        const apiBase = window.location.origin;
        window.location.href = "Leads-bestellen.html";
    });

    // Toast erstellen & anhängen (einmalig)
    const toast = document.createElement('div');
    toast.id = 'toast';
    Object.assign(toast.style, {
        visibility: 'hidden',
        minWidth: '250px',
        backgroundColor: '#4CAF50',
        color: 'white',
        textAlign: 'center',
        borderRadius: '5px',
        padding: '16px',
        position: 'fixed',
        zIndex: '1000',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        fontSize: '17px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
        transition: 'visibility 0s, opacity 0.5s linear',
        opacity: '0'
    });
    document.body.appendChild(toast);

    function showToast(message) {
        toast.textContent = message;
        toast.style.visibility = 'visible';
        toast.style.opacity = '1';
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => (toast.style.visibility = 'hidden'), 500);
        }, 3000);
    }

    // Save-Button Event
    savebutton.addEventListener('click', async () => {
        if (!window.updatedLeads || window.updatedLeads.length === 0) {
            showToast("Keine Änderungen zum Speichern.");
            return;
        }

        try {
            const res = await fetch('/api/leads/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                    // Kein Authorization-Header nötig, Token im Cookie
                },
                credentials: 'include',
                body: JSON.stringify(window.updatedLeads)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Fehler beim Speichern');
            }

            showToast("Änderungen gespeichert.");
            window.updatedLeads = [];
            saveHint.style.display = 'none';
        } catch (error) {
            console.error('Fehler beim Speichern:', error);
            showToast('Speichern fehlgeschlagen: ' + error.message);
        }

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


        if (window.socket && window.socket.readyState === WebSocket.OPEN) {
            window.socket.send(JSON.stringify({ type: "update", id: gpnr }));
        } else {
            console.warn("Socket nicht verbunden");
        }



    });
});
