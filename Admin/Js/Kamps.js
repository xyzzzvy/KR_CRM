async function loadKampagnes() {
    try {
        const response = await fetch('/api/kamps', {
           credentials: "include"
        });

        if (!response.ok) throw new Error('Fehler beim Laden der Kampagnen');

        const kampagnes = await response.json();

        // IDs der beiden Kampagnen-Selects
        const selectIds = ['filterCampaign', 'filterCampaignSender'];

        for (const id of selectIds) {
            const select = document.getElementById(id);
            if (!select) continue;

            // Reset mit "Alle"
            select.innerHTML = '<option value="alle">Alle</option>';

            kampagnes.forEach(k => {
                const option = document.createElement('option');
                option.value = k.name;
                option.textContent = k.name;
                select.appendChild(option);
            });
        }

    } catch (err) {
        console.error('Kampagnen konnten nicht geladen werden:', err);
    }
}
document.addEventListener('DOMContentLoaded', loadKampagnes);
