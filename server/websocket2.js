import {
    getAllLeads,
    getLeadsByPartner,
    getUserInfo,
    LoginInfoChecker,
    checkIfUserAlreadyExists,
    registerUser,
    updateLeadsStatus,
    getLeadsByPartnerNext8DaysQC,
    getLeadsByPartnerNext8DaysVG,
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

export async function StartWebSocket() {
    if(wss!==null) return;
    wss = new WebSocketServer({ port: 8080 });
    await websockethandler(wss);
    console.log('WebSocket-Server gestartet:');
}

export async function StopWebSocket() {
    wss.close(() => {
        console.log('WebSocket-Server gestoppt');
    });
}


async function websockethandler(wss) {

    async function broadcastUsers() {
        const data = JSON.stringify({ type: "updateUsers",
            users: liveUsers.map(u => ({ name: u.name, termineneuQC:u.termineneuQC, termineneuVG:u.termineneuVG, terminealtQC:u.terminealtQC, terminealtVG:u.terminealtVG })) });
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
                    let val=(await getLeadsByPartnerNext8DaysQC(data.id)).length
                    let val2=(await getLeadsByPartnerNext8DaysVG(data.id)).length
                    user = { id: data.id, name: data.name, termineneuQC: 0, termineneuVG:0, terminealtQC: val, terminealtVG : val2, ws, disconnectTimeout: null };
                    liveUsers.push(user);
                }
                await broadcastUsers();
            }

            if (data.type === 'update') {
                const user = liveUsers.find(u => u.id === data.id);
                if (user) {
                    let val=(await getLeadsByPartnerNext8DaysQC(data.id)).length
                    let val2=(await getLeadsByPartnerNext8DaysVG(data.id)).length
                    user.termineneuQC = val - user.terminealtQC;
                    user.termineneuVG=val2 - user.terminealtVG;
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
            }, 120 * 60 * 1000);

            user.ws = null;
        });
    });
}
