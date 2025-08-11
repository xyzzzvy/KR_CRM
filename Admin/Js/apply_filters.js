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
        renderLeads(leads.map((lead, index) => ({ lead, originalIndex: index })), leads.length);
        updatedLeads = [];
        document.dispatchEvent(new Event('leadsLoaded'));
    } catch (error) {
        console.error('Fehler beim Laden der Leads:', error);
        tbody.innerHTML = '<tr><td colspan="9">Fehler beim Laden der Leads</td></tr>';
        remainingLeadsDisplay.textContent = '0';
        saveHint.style.display = 'none';
    } finally {
        hideLoadingToast();
    }
}

function renderLeads(data, totalCount = null) {
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
                  <option value="QC fixiert" ${lead.status === 'QC fixiert' ? 'selected' : ''}>QC fixiert</option>
                  <option value="VG fixiert" ${lead.status === 'VG fixiert' ? 'selected' : ''}>VG fixiert</option>
                  <option value="QC durchgeführt" ${lead.status === 'QC durchgeführt' ? 'selected' : ''}>QC durchgeführt</option>
                  <option value="VG durchgeführt" ${lead.status === 'VG durchgeführt' ? 'selected' : ''}>VG durchgeführt</option>
                  <option value="Vg positiv erledigt" ${lead.status === 'Vg positiv erledigt' ? 'selected' : ''}>Vg positiv erledigt</option>
                  <option value="Vg negativ erledigt" ${lead.status === 'Vg negativ erledigt' ? 'selected' : ''}>Vg negativ erledigt</option>
            </select>
          </td>
          <td>${lead.terminisiert ? formatDate(lead.terminisiert) : ''}</td>
        `;
        tbody.appendChild(tr);
    });

    if (totalCount !== null && totalCount > maxToRender) {
        remainingLeadsDisplay.textContent = `${totalCount} (zeige ${maxToRender})`;
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
    showLoadingToast('Filter wird angewendet…');

    setTimeout(() => {
        const kampagne = filterCampaign.value;
        const plz = filterPLZ.value.trim();
        const status = filterStatus.value;
        const bl = filterBL.value;
        const gpnr = gpnrInput ? gpnrInput.value.trim() : '';
        const nameInput = document.getElementById('nameFilter');
        const name = nameInput ? nameInput.value.trim().toLowerCase() : '';

        // Datumsauswahl
        const dateFilter = document.getElementById('dateFilter').value;
        let dateFrom = null;
        let dateTo = null;
        const now = new Date();

        if (dateFilter === '24h') {
            dateFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            dateTo = new Date(); // Aktuelles Datum als Enddatum
        } else if (dateFilter === '7d') {
            dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            dateTo = new Date(); // Aktuelles Datum als Enddatum
        } else if (dateFilter === '14d') {
            dateFrom = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
            dateTo = new Date(); // Aktuelles Datum als Enddatum
        } else if (dateFilter === '1m') {
            dateFrom = new Date(now);
            dateFrom.setMonth(dateFrom.getMonth() - 1);
            dateTo = new Date(); // Aktuelles Datum als Enddatum
        } else if (dateFilter === 'custom') {
            const customStart = document.getElementById('customStart').value;
            const customEnd = document.getElementById('customEnd').value;
            dateFrom = customStart ? new Date(customStart) : null;
            dateTo = customEnd ? new Date(customEnd) : null;
        }

        // Termin-Filter - KORRIGIERTE VERSION
        const terminFilter = document.getElementById('terminisiertFilter').value;
        let terminFrom = null;
        let terminTo = new Date(); // Standardmäßig aktuelles Datum als Enddatum

        if (terminFilter === '24h') {
            terminFrom = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        } else if (terminFilter === '7d') {
            terminFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (terminFilter === '14d') {
            terminFrom = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        } else if (terminFilter === '1m') {
            terminFrom = new Date(now);
            terminFrom.setMonth(terminFrom.getMonth() - 1);
        } else if (terminFilter === 'custom') {
            const customTerminStart = document.getElementById('customTerminStart').value;
            const customTerminEnd = document.getElementById('customTerminEnd').value;
            terminFrom = customTerminStart ? new Date(customTerminStart) : null;
            terminTo = customTerminEnd ? new Date(customTerminEnd) : new Date(); // Fallback auf aktuelles Datum
        }

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

                // Lead-Datum Filter
                const leadDate = new Date(lead.datum);
                const fromMatch = !dateFrom || leadDate >= dateFrom;
                const toMatch = !dateTo || leadDate <= dateTo;

                // Termin-Datum Filter - KORRIGIERTE VERSION
                const terminDate = lead.terminisiert ? new Date(lead.terminisiert) : null;
                const terminFromMatch = !terminFrom || (terminDate && terminDate >= terminFrom);
                // WICHTIG: terminTo ist jetzt immer gesetzt (entweder custom oder aktuelles Datum)
                const terminToMatch = terminDate && terminDate <= terminTo;

                return kampagneMatch && plzMatch && statusMatch && blMatch && gpnrMatch && nameMatch &&
                    fromMatch && toMatch && terminFromMatch && terminToMatch;
            });

        renderLeads(filtered, filtered.length);
        hideLoadingToast();
    }, 150);
}

function toggleCustomDateInputs() {
    const dateFilter = document.getElementById('dateFilter').value;
    const customInputs = document.getElementById('customDateInputs');
    customInputs.style.display = dateFilter === 'custom' ? 'block' : 'none';
}

function toggleCustomTerminDateInputs() {
    const terminFilter = document.getElementById('terminisiertFilter').value;
    const customTerminInputs = document.getElementById('customTerminDateInputs');
    customTerminInputs.style.display = terminFilter === 'custom' ? 'block' : 'none';
}

function formatDate(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date)) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

// Event Listener für Filter-Button
applyFilterBtn.addEventListener('click', e => {
    e.preventDefault();
    applyFilter();
});

// Event Listener für Datumsauswahl (toggle custom inputs)
document.getElementById('dateFilter').addEventListener('change', toggleCustomDateInputs);
document.getElementById('terminisiertFilter').addEventListener('change', toggleCustomTerminDateInputs);

// Initiale Daten laden
fetchLeads();