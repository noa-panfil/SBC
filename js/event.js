document.addEventListener("DOMContentLoaded", function() {
    const scriptURL = 'https://script.google.com/macros/s/AKfycbzITsNyS9MfkGyGVu83jwcQsKdSOHGzrj9MJGbMJMPXE-TbBgSfNNBkVZKmW7CpYok76A/exec'; 

    const params = new URLSearchParams(window.location.search);
    const eventId = params.get('id');
    
    let globalTeamsData = {}; 
    let allowedTeamsList = []; 
    let eventTitle = "";

    if (!eventId) { window.location.href = 'index.html'; return; }

    Promise.all([
        fetch('json/events.json').then(res => res.json()),
        fetch('json/teams.json').then(res => res.json())
    ]).then(([eventsData, teamsData]) => {
        
        const event = eventsData[eventId];
        globalTeamsData = teamsData;

        if (event) {
            eventTitle = event.title;

            document.title = `SBC - Inscription ${event.title}`;
            
            const elements = {
                'event-title': event.title,
                'event-date': event.date,
                'event-date-detail': event.date,
                'event-time': event.time,
                'event-loc': event.location,
                'event-desc': event.description
            };

            for (const [id, value] of Object.entries(elements)) {
                const el = document.getElementById(id);
                if (el) el.innerText = value;
            }

            const imgEl = document.getElementById('event-img');
            const bgEl = document.getElementById('event-bg');
            if (imgEl) imgEl.src = event.image;
            if (bgEl) bgEl.src = event.image;

            if (event.allowed_teams && event.allowed_teams.length > 0) {
                allowedTeamsList = event.allowed_teams;
            } else {
                allowedTeamsList = Object.keys(teamsData);
            }

            addParticipantRow();

        } else {
            document.querySelector('main').innerHTML = `<div class="text-center py-20"><h2 class="text-2xl font-bold text-gray-700">Événement introuvable</h2><a href="index.html" class="text-sbc underline mt-4 inline-block">Retour à l'accueil</a></div>`;
        }
    }).catch(err => {
        console.error("Erreur de chargement :", err);
        document.querySelector('main').innerHTML = `<div class="text-center py-20 text-red-500">Erreur de chargement des données.</div>`;
    });

    function addParticipantRow() {
        const container = document.getElementById('participants-container');
        const index = container.children.length + 1;

        const rowHtml = `
        <div class="participant-row bg-gray-50 p-4 rounded-lg border border-gray-200 relative animate-fade-in-up transition-all duration-300">
            ${index > 1 ? '<button type="button" onclick="this.parentElement.remove()" class="absolute top-2 right-2 text-red-400 hover:text-red-600 transition"><i class="fas fa-times"></i></button>' : ''}
            <p class="text-xs font-bold text-gray-400 uppercase mb-2">Joueur ${index}</p>
            <div class="space-y-3">
                <select class="team-select w-full bg-white border border-gray-300 rounded-lg p-2 text-sm focus:border-sbc focus:outline-none transition" required onchange="loadPlayers(this)">
                    <option value="" disabled selected>Choisir l'équipe</option>
                    ${allowedTeamsList.map(teamName => `<option value="${teamName}">${teamName}</option>`).join('')}
                </select>
                <select class="player-select w-full bg-white border border-gray-300 rounded-lg p-2 text-sm focus:border-sbc focus:outline-none disabled:bg-gray-100 disabled:text-gray-400 transition" required disabled>
                    <option value="" disabled selected>Choisir le joueur</option>
                </select>
            </div>
        </div>`;
        container.insertAdjacentHTML('beforeend', rowHtml);
    }

    const addBtn = document.getElementById('add-btn');
    if (addBtn) addBtn.addEventListener('click', addParticipantRow);

    window.loadPlayers = function(selectElement) {
        const teamName = selectElement.value;
        const playerSelect = selectElement.closest('.participant-row').querySelector('.player-select');
        
        playerSelect.innerHTML = '<option value="" disabled selected>Choisir le joueur</option>';
        playerSelect.disabled = true;

        let players = [];
        for (const [key, data] of Object.entries(globalTeamsData)) {
            if (data.name === teamName && data.players) {
                players = data.players;
                break;
            }
        }

        if (players.length > 0) {
            players.forEach(player => {
                const option = document.createElement('option');
                option.value = player.name; 
                option.text = player.name;
                playerSelect.appendChild(option);
            });
            playerSelect.disabled = false;
        } else {
            const option = document.createElement('option');
            option.text = "Aucun joueur trouvé";
            playerSelect.appendChild(option);
        }
    };

    const form = document.getElementById('eventForm');
    const resultDiv = document.getElementById('form-result');
    const btn = document.getElementById('submitBtn');

    if (form) {
        form.addEventListener('submit', async e => {
            e.preventDefault();
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Enregistrement...';

            const parentName = document.getElementById('parent-name').value;
            const parentEmail = document.getElementById('parent-email').value;
            const rows = document.querySelectorAll('.participant-row');
            
            const promises = Array.from(rows).map(row => {
                const team = row.querySelector('.team-select').value;
                const player = row.querySelector('.player-select').value;

                const formData = new FormData();
                formData.append('Événement', eventTitle);
                formData.append('Parent', parentName);
                formData.append('Email', parentEmail);
                formData.append('Équipes', team);
                formData.append('Joueurs', player);

                return fetch(scriptURL, { method: 'POST', body: formData });
            });

            try {
                await Promise.all(promises);
                
                btn.style.display = 'none';
                if(addBtn) addBtn.style.display = 'none';
                
                resultDiv.innerHTML = `
                    <div class="bg-green-100 text-green-700 p-6 rounded-lg border border-green-200 animate-fade-in-up text-center">
                        <div class="w-16 h-16 bg-green-200 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                            <i class="fas fa-check"></i>
                        </div>
                        <h3 class="font-bold text-xl mb-2">Inscription réussie !</h3>
                        <p>${rows.length} participant(s) ajouté(s) à la liste.</p>
                    </div>
                    <a href="index.html" class="block mt-6 text-center bg-sbc text-white py-3 rounded-lg font-bold hover:bg-sbc-dark transition shadow-md">Retour à l'accueil</a>
                `;
                resultDiv.classList.remove('hidden');

            } catch (error) {
                console.error('Erreur:', error);
                btn.disabled = false;
                btn.innerHTML = 'Réessayer';
                resultDiv.innerHTML = '<div class="bg-red-100 text-red-700 p-3 rounded border border-red-200 mt-2"><i class="fas fa-exclamation-triangle mr-2"></i> Erreur lors de l\'envoi. Vérifiez votre connexion.</div>';
                resultDiv.classList.remove('hidden');
            }
        });
    }
});