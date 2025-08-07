// DOM Referenzen
const tbody = document.getElementById('leadsTableBody');
const filterCampaign = document.getElementById('filterCampaign');
const filterPLZ = document.getElementById('filterPLZ');
const filterStatus = document.getElementById('Status');
const filterBL = document.getElementById('BL');
const applyFilterBtn = document.getElementById('applyFilter');
const remainingLeadsDisplay = document.getElementById('remainingLeads');
const saveHint = document.getElementById('saveHint'); // "Bitte speichern"
const params = new URLSearchParams(window.location.search);
const mitarbeiterGpnr = params.get("gpnr");

const btnansichtmain = document.getElementById('orig');
const mit = document.getElementById('mit');
const logoutButton = document.getElementById('logout');

// Datum Filter Referenzen
const dateFilterSelect = document.getElementById("dateFilter");
const customStartInput = document.getElementById("customStart");
const customEndInput = document.getElementById("customEnd");

// Navigation
mit.addEventListener('click', () => {
    window.location.href = "Mitarbeiter.html";
});

logoutButton.addEventListener('click', () => {
    const apiBase = window.location.origin;
    window.location.href = apiBase + "/";
});

btnansichtmain.addEventListener('click', (e) => {
    e.preventDefault();
    console.log('Klick erkannt, Weiterleitung startet');
    window.location.href = window.location.origin + '/html/User.html';
});

let leads = [];
var updatedLeads = [];

async function fetchLeads() {
    try {
        const response = await fetch(`/api/leads/partnerFK/${mitarbeiterGpnr}`, {
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

    const maxToRender = 1000;
    const limitedData = data.slice(0, maxToRender);

    limitedData.forEach(({ lead, originalIndex }) => {
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

    if (data.length > maxToRender) {
        remainingLeadsDisplay.textContent = `${data.length} (zeige ${maxToRender})`;
    } else {
        remainingLeadsDisplay.textContent = data.length;
    }

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

    const dateFilter = dateFilterSelect.value;
    const customStart = customStartInput.value;
    const customEnd = customEndInput.value;

    let startDate = null;
    let endDate = new Date();

    switch (dateFilter) {
        case "24h":
            startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
            break;
        case "7d":
            startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            break;
        case "14d":
            startDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
            break;
        case "1m":
            startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 1);
            break;
        case "custom":
            if (!customStart || !customEnd) {
                alert("Bitte sowohl Start- als auch Enddatum angeben.");
                return;
            }
            startDate = new Date(customStart);
            endDate = new Date(customEnd);
            endDate.setHours(23, 59, 59, 999);
            break;
        default:
            break;
    }

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

            const dateMatch = (() => {
                if (!startDate) return true;
                const leadDate = new Date(lead.datum);
                return leadDate >= startDate && leadDate <= endDate;
            })();

            return kampagneMatch && plzMatch && statusMatch && blMatch && nameMatch && dateMatch;
        });

    renderLeads(filtered);
}

function formatDate(isoString) {
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

function toggleCustomDateInputs() {
    const selected = dateFilterSelect.value;
    const customDateInputs = document.getElementById("customDateInputs");
    customDateInputs.style.display = selected === "custom" ? "flex" : "none";
}

// Events
applyFilterBtn.addEventListener('click', e => {
    e.preventDefault();
    applyFilter();
});

fetchLeads();
