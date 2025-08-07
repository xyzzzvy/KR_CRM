document.addEventListener('DOMContentLoaded', () => {
    const tbody = document.getElementById('ordersTableBody');
    const remainingOrdersSpan = document.getElementById('remainingOrders');
    const saveHintOrders = document.getElementById('saveHintOrders'); // Kann null sein
    // const saveOrdersButton = document.getElementById('saveOrdersButton'); // Nicht genutzt, daher auskommentiert

    const statusFilter = document.getElementById('statusFilter');
    const dateSort = document.getElementById('dateSort');

    const ORDERS_API = '/api/leadorders';

    let allOrders = [];

    async function getUserName(gpnr) {
        try {
            const res = await fetch(`/api/user/${encodeURIComponent(gpnr)}`, {
                credentials: 'include',
            });
            if (!res.ok) {
                console.warn(`User API Fehler für GPNR ${gpnr}: ${res.status}`);
                return 'Unbekannt';
            }
            const user = await res.json();
            return (user.vorname && user.nachname) ? `${user.vorname} ${user.nachname}` : 'Unbekannt';
        } catch (err) {
            console.error('Fehler beim Laden Username für GPNR', gpnr, err);
            return 'Unbekannt';
        }
    }

    async function fetchOrders() {
        try {
            const res = await fetch(ORDERS_API, { credentials: 'include' });
            if (!res.ok) throw new Error(`Fehler beim Laden der Bestellungen: ${res.status}`);
            const orders = await res.json();

            // Debug: Fehlende id in Orders prüfen
            orders.forEach(order => {
                if (order.id === undefined) {
                    console.warn('Order ohne id gefunden:', order);
                }
            });

            const ordersWithNames = await Promise.all(
                orders.map(async order => {
                    const name = await getUserName(order.gpnr);
                    return { ...order, name };
                })
            );

            allOrders = ordersWithNames;
            applyFiltersAndRender();
        } catch (error) {
            console.error(error);
            alert('Fehler beim Laden der Bestellungen');
        }
    }

    async function updateOrderStatus(id, newStatus) {
        if (!id) {
            alert('Ungültige Bestell-ID');
            throw new Error('Ungültige Bestell-ID');
        }

        try {
            const res = await fetch(`/orders/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ status: newStatus }),
            });

            if (!res.ok) throw new Error(`Update fehlgeschlagen: ${res.status}`);
            return await res.json();
        } catch (error) {
            alert('Fehler beim Aktualisieren des Status');
            console.error(error);
            throw error;
        }
    }

    function applyFiltersAndRender() {
        let filtered = allOrders;

        const status = statusFilter?.value;
        if (status && status !== 'alle') {
            filtered = filtered.filter(order => (order.status || '').toLowerCase() === status.toLowerCase());
        }

        filtered.sort((a, b) => {
            const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
            const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
            return dateSort?.value === 'asc' ? dateA - dateB : dateB - dateA;
        });

        renderOrders(filtered);
    }

    function renderOrders(orders) {
        tbody.innerHTML = '';

        orders.forEach(order => {
            const isErledigt = (order.status || '').toLowerCase() === 'erledigt';

            // Falls order.id fehlt, wird der Button nicht angezeigt
            const hasValidId = order.id !== undefined && order.id !== null && order.id !== '';

            const tr = document.createElement('tr');
            if (isErledigt) tr.classList.add('erledigt');

            tr.innerHTML = `
        <td>${order.name}</td>
        <td>${order.gpnr}</td>
        <td>${order.anzahl ?? '-'}</td>
        <td>${order.bundesland ?? order.bl ?? '-'}</td>
        <td>${order.plzrange ?? order.plz ?? '-'}</td>
        <td>${order.kampagne ?? '-'}</td>
        <td>${order.note ?? '-'}</td>
        <td>${order.status ?? '-'}</td>
        <td>${order.created_at ? new Date(order.created_at).toLocaleString('de-DE') : '-'}</td>
        <td>
          ${!isErledigt && hasValidId ? `<button class="complete-btn" data-id="${order.id}">Erledigt</button>` : ''}
        </td>
      `;
            tbody.appendChild(tr);
        });

        // EventListener erneuern
        const buttons = document.querySelectorAll('.complete-btn');
        buttons.forEach(button => {
            button.removeEventListener('click', handleCompleteClick);
            button.addEventListener('click', handleCompleteClick);
        });

        if (remainingOrdersSpan) remainingOrdersSpan.textContent = orders.length;
        if (saveHintOrders) saveHintOrders.style.display = orders.length > 0 ? 'block' : 'none';
    }

    async function handleCompleteClick(e) {
        const button = e.currentTarget;
        const id = button.dataset.id;
        if (!id) {
            alert('Ungültige Bestell-ID');
            return;
        }
        button.disabled = true;

        try {
            await updateOrderStatus(id, 'erledigt');
            const orderIndex = allOrders.findIndex(o => o.id == id);
            if (orderIndex !== -1) {
                allOrders[orderIndex].status = 'erledigt';
            }
            applyFiltersAndRender();
        } catch {
            button.disabled = false;
        }
    }

    statusFilter?.addEventListener('change', applyFiltersAndRender);
    dateSort?.addEventListener('change', applyFiltersAndRender);

    fetchOrders();
});
