import {
    getAllLeads,
    getLeadsByPartner,
    getUserInfo,
    LoginInfoChecker,
    checkIfUserAlreadyExists,
    registerUser,
    updateLeadsStatus,
    getLeadsByPartnerNext8Days,
    assignLeads,
    getAllUsers,
    addLead,
    getAllKampagnes,
    insertLeadOrder,
    getAllLeadOrders,
    updateOrderStatus,
    getAllUntergebene,
    getAllLeadOrdersBy,
    end
} from './database2.js';

import { WebSocketServer, WebSocket } from 'ws';
let liveUsers = [];

let wss = null;

export async function ManageWebSocket(start, ende) {
    const checkInterval = setInterval(async () => {
        const now = new Date();

        if (!wss && now >= start) {
            wss = new WebSocketServer({ port: 8080 });
            await websockethandler(wss);
            console.log('WebSocket-Server gestartet:', now);
        }

        if (wss && now >= ende) {
            wss.close(() => {
                console.log('WebSocket-Server gestoppt:', now);
            });
            clearInterval(checkInterval);
        }
    }, 1000);
}

async function websockethandler(wss) {

    async function broadcastUsers() {
        const data = JSON.stringify({ type: "updateUsers", users: liveUsers.map(u => ({ name: u.name, termineneu: u.termineneu })) });
        for (const u of liveUsers) {
            if (u.ws && u.ws.readyState === WebSocket.OPEN)
                await u.ws.send(data);
        }
    }

    wss.on('connection', async (ws) => {
        ws.on('message', async (msg) => {
            const data = JSON.parse(msg);

            if (data.type === 'join') {
                let user = liveUsers.find(u => u.id === data.id);
                if (user) {
                    if (user.disconnectTimeout) clearTimeout(user.disconnectTimeout);
                    user.ws = ws;
                    user.disconnectTimeout = null;
                } else {
                    user = { id: data.id, name: data.name, termineneu: 0, terminealt: await getLeadsByPartnerNext8Days(data.id).count, ws, disconnectTimeout: null };
                    liveUsers.push(user);
                }
                await broadcastUsers();
            }

            if (data.type === 'update') {
                const user = liveUsers.find(u => u.id === data.id);
                if (user) {
                    user.termineneu = (await getLeadsByPartnerNext8Days(data.id)) - user.terminealt;
                    await broadcastUsers();
                }
            }
        });

        ws.on('close', async () => {
            const user = liveUsers.find(u => u.ws === ws);
            if (!user) return;

            user.disconnectTimeout = setTimeout(async () => {
                try {
                    liveUsers = liveUsers.filter(u => u.id !== user.id);
                    await broadcastUsers();
                } catch (err) {
                    console.error('Fehler beim Entfernen des Users:', err);
                }
            }, 10 * 60 * 1000);

            user.ws = null;
        });
    });
}
