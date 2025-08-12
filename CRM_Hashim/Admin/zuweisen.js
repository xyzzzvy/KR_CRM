const form = document.getElementById('beraterForm');
const openLeadsCountDisplay = document.getElementById('openLeadsCount');

const plzInput = document.getElementById('plz');
const kampagneSelect = document.getElementById('filterCampaignSender');
const statusSelect = document.getElementById('leadStatus');  // Status-Filter
const blSelect = document.getElementById('BLzuweisen');     // Neuer Bundesland-Filter
const anzahlLeadsInput = document.getElementById('anzahlLeads');

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

function getFilteredOpenLeads() {
    let offeneLeads = leads.filter(lead => lead.partner === 0);

    const plzFilter = plzInput.value.trim();
    if (plzFilter) {
        offeneLeads = offeneLeads.filter(lead => lead.plz.startsWith(plzFilter));
    }

    const kampagneFilter = kampagneSelect.value;
    if (kampagneFilter && kampagneFilter !== 'alle') {
        offeneLeads = offeneLeads.filter(lead => lead.kampagne === kampagneFilter);
    }

    const statusFilter = statusSelect.value;
    if (statusFilter && statusFilter !== 'alle') {
        offeneLeads = offeneLeads.filter(lead => lead.status === statusFilter);
    }

    const blFilter = blSelect.value;
    if (blFilter) {
        offeneLeads = offeneLeads.filter(lead => lead.bl === blFilter);
    }

    return offeneLeads;
}

function updateOpenLeadsCount() {
    const offeneLeads = getFilteredOpenLeads();
    openLeadsCountDisplay.textContent = offeneLeads.length;
}

anzahlLeadsInput.addEventListener('input', () => {
    let offeneLeadsCount = getFilteredOpenLeads().length;
    let currentValue = parseInt(anzahlLeadsInput.value, 10);

    if (isNaN(currentValue) || currentValue <= 0) {
        return;
    }

    if (currentValue > offeneLeadsCount) {
        anzahlLeadsInput.value = offeneLeadsCount;
    }
});

plzInput.addEventListener('input', updateOpenLeadsCount);
kampagneSelect.addEventListener('change', updateOpenLeadsCount);
statusSelect.addEventListener('change', updateOpenLeadsCount);
blSelect.addEventListener('change', updateOpenLeadsCount);

document.addEventListener('leadsLoaded', () => {
    updateOpenLeadsCount();
});

form.addEventListener('submit', async function (event) {
    event.preventDefault();

    const beraterName = document.getElementById('beraterName').value;
    const anzahlLeads = parseInt(anzahlLeadsInput.value, 10);

    if (!beraterName || isNaN(anzahlLeads) || anzahlLeads <= 0) {
        alert('Bitte gib einen gültigen Namen und eine Anzahl an.');
        return;
    }

    let gefilterteLeads = getFilteredOpenLeads();
    const zuzuweisendeLeads = gefilterteLeads.slice(0, anzahlLeads);

    if (zuzuweisendeLeads.length === 0) {
        alert('Keine passenden Leads gefunden.');
        return;
    }

    const leadIds = zuzuweisendeLeads.map(lead => lead.id);

    try {
        const response = await fetch('/assign-leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ partner: beraterName, leadIds: leadIds }),
        });

        if (!response.ok) {
            const text = await response.text();
            console.error('Fehler-Antwort:', text);
            throw new Error(`Server antwortete mit Status ${response.status}`);
        }

        await response.json();

        showToast(`${zuzuweisendeLeads.length} Leads wurden ---${beraterName}--- zugewiesen.`);

        form.reset();

        setTimeout(() => {
            window.location.reload();
        }, 3500);

    } catch (error) {
        alert('Fehler bei der Zuweisung: ' + error.message);
    }
});
