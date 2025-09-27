async function renderLeaderboard(rawData) {
    let preparedData = await prepareData(rawData);
    const leaderboard = document.getElementById('leaderboard');
    leaderboard.innerHTML = `
    <div class="leaderboard-entry header-entry">
        <div class="entry-value">RANK</div>
        <div class="entry-value">NAME</div>
        <div class="entry-value">QC ALT</div>
        <div class="entry-value">VG ALT</div>
        <div class="entry-value">QC NEU</div>
        <div class="entry-value">VG NEU</div>
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
        rankDiv.classList.add('entry-value');
        rankDiv.textContent = index + 1;

        const nameDiv = document.createElement('div');
        nameDiv.classList.add('entry-value');
        nameDiv.textContent = user.name;

        const qcNeuDiv = document.createElement('div');
        qcNeuDiv.classList.add('entry-value');
        qcNeuDiv.textContent = `${user.qc_neu+user.qc_alt}`;


        const vgNeuDiv = document.createElement('div');
        vgNeuDiv.classList.add('entry-value');
        vgNeuDiv.textContent = `${user.vg_neu+user.vg_alt}`;

        const qcAltDiv = document.createElement('div');
        qcAltDiv.classList.add('entry-value');
        qcAltDiv.textContent = `${user.qc_alt}`;


        const vgAltDiv = document.createElement('div');
        vgAltDiv.classList.add('entry-value');
        vgAltDiv.textContent = `${user.vg_alt}`;

        const summeDiv = document.createElement('div');
        summeDiv.classList.add('entry-value');
        summeDiv.classList.add('green-text');
        summeDiv.textContent = `Neue Termine: ${user.summe_termine}`;


        entry.appendChild(rankDiv);
        entry.appendChild(nameDiv);
        entry.appendChild(qcAltDiv);
        entry.appendChild(vgAltDiv);
        entry.appendChild(qcNeuDiv);
        entry.appendChild(vgNeuDiv);
        entry.appendChild(summeDiv);

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
        summe_termine: (user.termineneuQC+user.termineneuVG)
    }));

    users.sort((a, b) => b.points - a.points);

    return users;
}

