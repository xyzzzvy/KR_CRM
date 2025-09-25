document.addEventListener("DOMContentLoaded", async () => {
    if (!sessionStorage.getItem('telefonparty')) {
        // Noch nichts zu tun
    }
    else if (sessionStorage.getItem('telefonparty') === 'true') {
        let socket;

        async function fetchCredits() {
            try {
                const response = await fetch('/api/websocket/credits', {
                    method: 'GET',
                    credentials:"include"
                });
                const data = await response.json();
                if (data.success) {
                    const gpnr = data.gpnr;
                    const name = data.name;
                    console.log('GPNR:', gpnr, 'Name:', name);
                    return { gpnr, name };
                } else {
                    console.error('Fehler:', data.error);
                }
            } catch (err) {
                console.error('Fetch-Fehler:', err);
            }
        }


        let {gpnr,name}=await fetchCredits()

        console.log(gpnr)
        console.log(name)

        let reconnectInterval = 2000;

        // Verbindung aufbauen
        function connectWebSocket() {
            socket = new WebSocket("ws://localhost:8080");

            socket.onopen = () => {
                console.log("🔗 Connected to WS");
                reconnectInterval = 2000;
                socket.send(JSON.stringify({ type: 'join', id: gpnr, name: name }));
            };

            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === "updateUsers") {
                    renderUsers(data.users);
                }
            };

            socket.onclose = () => {
                console.log(`❌ Disconnected. Reconnecting in ${reconnectInterval}ms...`);
                setTimeout(connectWebSocket, reconnectInterval);
                // Exponentielles Backoff
                reconnectInterval = Math.min(reconnectInterval * 2, 30000);
            };

            socket.onerror = (err) => {
                console.error("WS Error:", err);
                socket.close();
            };
        }

        connectWebSocket();

        // User-Liste rendern
        function renderUsers(users) {
            const list = document.getElementById("userList");
            list.innerHTML = "";
            users.forEach(u => {
                const li = document.createElement("li");
                li.textContent = `${u.name} - Termine: ${u.termine}`;
                list.appendChild(li);
            });
        }

        // Neuen Termin senden
        function addTermin() {
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: 'newTermin', id: userId }));
            } else {
                console.warn("Socket nicht verbunden");
            }
        }

        // Tab schließen / Logout
        window.addEventListener("beforeunload", () => {
            if (socket.readyState === WebSocket.OPEN) {
                socket.close(1000, "User leaves");
            }
        });
    }
});
