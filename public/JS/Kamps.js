async function loadKampagnes() {
    try {
        const response = await fetch('/api/kamps', {
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Fehler beim Laden der Kampagnen');

        const kampagnes = await response.json();
        const select = document.getElementById('filterCampaign');

        select.innerHTML = '<option value="alle">Alle</option>';

        kampagnes.forEach(k => {
            const option = document.createElement('option');
            option.value = k.name;
            option.textContent = k.name;
            select.appendChild(option);
        });
    } catch (err) {
        console.error('Kampagnen konnten nicht geladen werden:', err);
    }
}

// Direkt nach Laden der Seite aufrufen
document.addEventListener('DOMContentLoaded', loadKampagnes);
