// DOM Referenzen
const tbody = document.getElementById('leadsTableBody');
const filterCampaign = document.getElementById('filterCampaign');
const filterPLZ = document.getElementById('filterPLZ');
const filterStatus = document.getElementById('Status');
const filterBL = document.getElementById('BL');
const applyFilterBtn = document.getElementById('applyFilter');
const remainingLeadsDisplay = document.getElementById('remainingLeads');
const saveHint = document.getElementById('saveHint'); // "Bitte speichern"
const partnerGpnr = localStorage.getItem("pr");



let leads = [];
var updatedLeads = [];

async function fetchLeads() {
    try {
        const response = await fetch(`/api/leads/partner/${partnerGpnr}`, {
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
        saveHint.style.display = 'none';
    } catch (error) {
        console.error('Fehler beim Laden der Leads:', error);
        tbody.innerHTML = '<tr><td colspan="8">Fehler beim Laden der Leads</td></tr>';
        remainingLeadsDisplay.textContent = '0';
        saveHint.style.display = 'none';
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
    const kampagne = filterCampaign.value;
    const plz = filterPLZ.value.trim();
    const status = filterStatus.value;
    const bl = filterBL.value;
    const nameInput = document.getElementById('nameFilter');
    const name = nameInput ? nameInput.value.trim().toLowerCase() : '';

    const filtered = leads
        .map((lead, index) => ({ lead, originalIndex: index }))
        .filter(({ lead }) => {
            const kampagneMatch = kampagne === 'alle' || lead.kampagne === kampagne;
            const plzMatch = plz === '' || lead.plz.startsWith(plz);
            const statusMatch = status === 'alle' || lead.status === status;
            const blMatch = bl === '' || lead.bl === bl;
            const nameMatch =
                name === '' ||
                lead.name.toLowerCase().includes(name) ||
                lead.telefon.replace(/\s+/g, '').includes(name);
            return kampagneMatch && plzMatch && statusMatch && blMatch && nameMatch;
        });

    renderLeads(filtered);
}

applyFilterBtn.addEventListener('click', e => {
    e.preventDefault();
    applyFilter();
});

function formatDate(isoString) {
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Monate sind 0-basiert
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}


fetchLeads();
