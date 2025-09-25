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

import { WebSocketServer } from 'ws';
let liveUsers = []; // { id, name, termineneu, terminealt ,ws, disconnectTimeout }




const wss = new WebSocketServer({ port: 8080 });

function broadcastUsers() {
    const data = JSON.stringify({ type: "updateUsers", users: liveUsers.map(u => ({ name: u.name, termineneu: u.termineneu-u.terminealt })) });
    liveUsers.forEach(u => {
        if (u.ws && u.ws.readyState === WebSocket.OPEN)
            u.ws.send(data);
    });
}


wss.on('connection', (ws) => {

    ws.on('message', async (msg) => {
        const data = JSON.parse(msg);

        if (data.type === 'join') {
            let user = liveUsers.find(u => u.id === data.id);
            if (user) {
                if (user.disconnectTimeout) clearTimeout(user.disconnectTimeout);
                user.ws = ws;
                user.disconnectTimeout = null;
            } else {
                user = { id: data.id, name: data.name, termine: 0, terminealt: await getLeadsByPartnerNext8Days(data.id), ws, disconnectTimeout: null };
                liveUsers.push(user);
            }

            broadcastUsers();
        }


        if (data.type === 'update') {
            const user = liveUsers.find(u => u.id === data.id);
            if (user) {
                user.termineneu = (await (getLeadsByPartnerNext8Days(data.id))) - user.terminealt;
                broadcastUsers();
            }
        }
    });

    ws.on('close', () => {
        const user = liveUsers.find(u => u.ws === ws);
        if (!user) return;

        user.disconnectTimeout = setTimeout(async () => {
            try {
                liveUsers = liveUsers.filter(u => u.id !== user.id);
                broadcastUsers();
            } catch (err) {
                console.error('Fehler beim Entfernen des Users:', err);
            }
        }, 10 * 60 * 1000);

        user.ws = null;
    });
});



export async function gracefulShutdown() {
    wss.close(() => {
        end();
    });
}
