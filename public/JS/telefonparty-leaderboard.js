function renderLeaderboard(rawData) {
    let preparedData = prepareData(rawData);
    const leaderboard = document.getElementById('leaderboard');

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

function prepareData(rawData) {
    if (!rawData || !Array.isArray(rawData)) return [];

    const users = rawData.users.map(user => ({
        name: user.name,
        points: user.termineneu
    }));

    users.sort((a, b) => b.points - a.points);

    return users;
}