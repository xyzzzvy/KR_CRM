// DOM Referenzen
const tbody = document.getElementById('leadsTableBody');
const filterCampaign = document.getElementById('filterCampaign');
const filterPLZ = document.getElementById('filterPLZ');
const filterStatus = document.getElementById('Status');
const filterBL = document.getElementById('BL');
const applyFilterBtn = document.getElementById('applyFilter');
const remainingLeadsDisplay = document.getElementById('remainingLeads');
const saveHint = document.getElementById('saveHint');
const gpnrInput = document.getElementById('GPNR');

// Lade-Toast erstellen (einmalig)
const loadingToast = document.createElement('div');
loadingToast.id = 'loadingToast';
Object.assign(loadingToast.style, {
    visibility: 'hidden',
    minWidth: '250px',
    backgroundColor: '#333',
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
    transition: 'visibility 0s, opacity 0.3s ease',
    opacity: '0'
});
document.body.appendChild(loadingToast);

function showLoadingToast(message = 'Bitte warten…') {
    loadingToast.textContent = message;
    loadingToast.style.visibility = 'visible';
    loadingToast.style.opacity = '1';
}

function hideLoadingToast() {
    loadingToast.style.opacity = '0';
    setTimeout(() => {
        loadingToast.style.visibility = 'hidden';
    }, 300);
}

var leads = [];
var updatedLeads = [];

async function fetchLeads() {
    try {
        showLoadingToast('Leads werden geladen…');

        const response = await fetch('/api/leads', {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Fehler beim Laden der Leads');
        }

        leads = await response.json();
        renderLeads(leads.map((lead, index) => ({ lead, originalIndex: index })));
        updatedLeads = [];
        document.dispatchEvent(new Event('leadsLoaded'));
    } catch (error) {
        console.error('Fehler beim Laden der Leads:', error);
        tbody.innerHTML = '<tr><td colspan="8">Fehler beim Laden der Leads</td></tr>';
        remainingLeadsDisplay.textContent = '0';
        saveHint.style.display = 'none';
    } finally {
        hideLoadingToast();
    }
}

function renderLeads(data) {
    tbody.innerHTML = '';

    data.forEach(({ lead, originalIndex }) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${lead.id}</td>
          <td>${formatDate(lead.datum)}</td>
          <td>${lead.kampagne}</td>
          <td><a href="#">${lead.name.replace(/\n/g, '<br>')}<br>${lead.telefon}</a></td>
          <td>${lead.bl}</td>
          <td>
            ${lead.plz}<br>
            <small style="color: gray; font-style: italic;">${lead.adresse ? lead.adresse : ''}</small>
          </td>
          <td>${lead.partner}</td>
          <td>
            <select class="status-select" data-index="${originalIndex}">
              <option value="offen" ${lead.status === 'offen' ? 'selected' : ''}>offen</option>
              <option value="n.err" ${lead.status === 'n.err' ? 'selected' : ''}>n.err</option>
              <option value="erreicht" ${lead.status === 'erreicht' ? 'selected' : ''}>erreicht</option>
              <option value="fixiert" ${lead.status === 'fixiert' ? 'selected' : ''}>fixiert</option>
              <option value="erledigt" ${lead.status === 'erledigt' ? 'selected' : ''}>erledigt</option>
            </select>
          </td>
        `;
        tbody.appendChild(tr);
    });

    remainingLeadsDisplay.textContent = data.length;

    document.querySelectorAll('.status-select').forEach(select => {
        select.addEventListener('change', function () {
            const originalIndex = parseInt(this.dataset.index);
            leads[originalIndex].status = this.value;

            const leadId = leads[originalIndex].id;
            const idx = updatedLeads.findIndex(l => l.id === leadId);
            if (idx !== -1) {
                updatedLeads[idx].status = this.value;
            } else {
                updatedLeads.push({ id: leadId, status: this.value });
            }

            if (updatedLeads.length > 0) {
                saveHint.style.display = 'block';
            }
        });
    });
}

function applyFilter() {
    showLoadingToast('Filter wird angewendet…');

    setTimeout(() => {
        const kampagne = filterCampaign.value;
        const plz = filterPLZ.value.trim();
        const status = filterStatus.value;
        const bl = filterBL.value;
        const gpnr = gpnrInput ? gpnrInput.value.trim() : '';
        const nameInput = document.getElementById('nameFilter');
        const name = nameInput ? nameInput.value.trim().toLowerCase() : '';

        const filtered = leads
            .map((lead, index) => ({ lead, originalIndex: index }))
            .filter(({ lead }) => {
                const kampagneMatch = kampagne === 'alle' || lead.kampagne === kampagne;
                const plzMatch = plz === '' || lead.plz.startsWith(plz);
                const statusMatch = status === 'alle' || lead.status === status;
                const blMatch = bl === '' || lead.bl === bl;
                const gpnrMatch = gpnr === '' || (lead.partner != null && lead.partner.toString().startsWith(gpnr));
                const nameMatch =
                    name === '' ||
                    lead.name.toLowerCase().includes(name) ||
                    lead.telefon.replace(/\s+/g, '').includes(name);
                return kampagneMatch && plzMatch && statusMatch && blMatch && gpnrMatch && nameMatch;
            });

        renderLeads(filtered);
        hideLoadingToast();
    }, 150); // Simuliere minimales Delay für saubere Anzeige
}

applyFilterBtn.addEventListener('click', e => {
    e.preventDefault();
    applyFilter();
});

function formatDate(isoString) {
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

fetchLeads();
