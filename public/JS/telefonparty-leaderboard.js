async function renderLeaderboard(rawData) {
    let preparedData = await prepareData(rawData);
    const leaderboard = document.getElementById('leaderboard');
    leaderboard.innerHTML = `
    <div class="leaderboard-entry header-entry">
        <div>RANK</div>
        <div class="entry-value">NAME</div>
        <div class="entry-value">QC NEU</div>
        <div class="entry-value">QC ALT</div>
        <div class="entry-value">VG NEU</div>
        <div class="entry-value">VG ALT</div>
        <div class="entry-value">NEUE TERMINE</div>
    </div>
    `;

    if(preparedData.length === 0) {
        console.log('No data found');
        return;
    }

    preparedData.forEach((user, index) => {
        const entry = document.createElement('div');
        entry.classList.add('leaderboard-entry');

        const rankDiv = document.createElement('div');
        rankDiv.classList.add('rank');
        rankDiv.textContent = index + 1;

        const nameDiv = document.createElement('div');
        nameDiv.classList.add('entry-value');
        nameDiv.textContent = user.name;

        const qcNeuDiv = document.createElement('div');
        qcNeuDiv.classList.add('entry-value');
        qcNeuDiv.textContent = `QC Neu: ${user.qc_neu}`;

        const qcAltDiv = document.createElement('div');
        qcAltDiv.classList.add('entry-value');
        qcAltDiv.textContent = `QC Alt: ${user.qc_alt}`;

        const vgNeuDiv = document.createElement('div');
        vgNeuDiv.classList.add('entry-value');
        vgNeuDiv.textContent = `VG Neu: ${user.vg_neu}`;

        const vgAltDiv = document.createElement('div');
        vgAltDiv.classList.add('entry-value');
        vgAltDiv.textContent = `VG Alt: ${user.vg_alt}`;

        const summeDiv = document.createElement('div');
        summeDiv.classList.add('entry-value');
        summeDiv.classList.add('green-text');
        summeDiv.textContent = `Neue Termine: ${user.summe_termine}`;

        // Append everything to the entry
        entry.appendChild(rankDiv);
        entry.appendChild(nameDiv);
        entry.appendChild(qcNeuDiv);
        entry.appendChild(qcAltDiv);
        entry.appendChild(vgNeuDiv);
        entry.appendChild(vgAltDiv);
        entry.appendChild(summeDiv);

        // Add the entry to the leaderboard
        leaderboard.appendChild(entry);
    });

}

async function prepareData(rawData) {
    let data = JSON.parse(rawData);

    const users = data.users.map(user => ({
        name: user.name,
        qc_neu: user.termineneuQC,
        qc_alt: user.terminealtQC,
        vg_neu: user.termineneuVG,
        vg_alt: user.terminealtVG,
        summe_termine: (user.user.termineneuQC - user.terminealtQC) + (user.termineneuVG - user.terminealtVG)
    }));

    users.sort((a, b) => b.points - a.points);

    return users;
}

