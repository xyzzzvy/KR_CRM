document.addEventListener("DOMContentLoaded", async () => {
    if (!sessionStorage.getItem("telefonparty")) {
        // Noch nichts zu tun
        return;
    }

    if (sessionStorage.getItem("telefonparty") !== "true") {
    }

    // Socket global verfügbar machen (auch in DevTools)
    window.socket = null;

    async function fetchCredits() {
        try {
            const response = await fetch("/api/websocket/credits", {
                method: "GET",
                credentials: "include",
            });
            const data = await response.json();
            if (data.success) {
                console.log("GPNR:", data.gpnr, "Name:", data.name);
                return { gpnr: data.gpnr, name: data.name };
            } else {
                console.error("Fehler:", data.error);
                return {};
            }
        } catch (err) {
            console.error("Fetch-Fehler:", err);
            return {};
        }
    }

    const { gpnr, name } = await fetchCredits();
    console.log("Credits geladen:", gpnr, name);

    let reconnectInterval = 2000;

    function connectWebSocket(gpnr, name) {
        window.socket = new WebSocket("ws://dreamteam.academy:8080");

        window.socket.onopen = () => {
            console.log("🔗 Connected to WS");
            reconnectInterval = 2000;
            window.socket.send(
                JSON.stringify({ type: "join", id: gpnr, name: name })
            );
        };

        window.socket.onmessage = (event) => {
            console.log("Received message", event.data);
            const data = JSON.parse(event.data);
            if (data.type === "updateUsers") {
                if (window.location.href.includes('leaderboard')) {
                    renderLeaderboard(event.data);
                }
            }
        };

        window.socket.onclose = () => {
            console.log(
                `❌ Disconnected. Reconnecting in ${reconnectInterval}ms...`
            );
            setTimeout(() => connectWebSocket(gpnr, name), reconnectInterval);
            reconnectInterval = Math.min(reconnectInterval * 2, 30000);
        };

        window.socket.onerror = (err) => {
            console.error("WS Error:", err);
            // kein sofortiges close()
        };
    }

    connectWebSocket(gpnr, name);

    // User-Liste rendern
    function renderUsers(users) {
        const list = document.getElementById("userList");
        if (!list) return;
        list.innerHTML = "";
        users.forEach((u) => {
            const li = document.createElement("li");
            li.textContent = `${u.name} - Termine: ${u.termine}`;
            list.appendChild(li);
        });
    }

    // Neuen Termin senden
    window.addTermin = function addTermin() {
        if (window.socket && window.socket.readyState === WebSocket.OPEN) {
            window.socket.send(JSON.stringify({ type: "newTermin", id: gpnr }));
        } else {
            console.warn("Socket nicht verbunden");
        }
    };

    // Tab schließen / Logout
    window.addEventListener("beforeunload", () => {
        if (window.socket && window.socket.readyState === WebSocket.OPEN) {
            window.socket.close(1000, "User leaves");
        }
    });
});
