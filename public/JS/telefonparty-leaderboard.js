async function renderLeaderboard(rawData) {
    let preparedData = await prepareData(rawData);
    const leaderboard = document.getElementById('leaderboard');
    leaderboard.innerHTML = '';
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

        const pointsDiv = document.createElement('div');
        pointsDiv.classList.add('entry-value');
        pointsDiv.textContent = user.points;

        entry.appendChild(rankDiv);
        entry.appendChild(nameDiv);
        entry.appendChild(pointsDiv);

        leaderboard.appendChild(entry);
    })
}

async function prepareData(rawData) {
    let data = JSON.parse(rawData);

    const users = data.users.map(user => ({
        name: user.name,
        points: user.termineneu // Passe das Feld ggf. an!
    }));

    users.sort((a, b) => b.points - a.points);

    return users;
}

