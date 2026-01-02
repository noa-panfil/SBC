document.addEventListener("DOMContentLoaded", function() {
    // 👇👇👇 COLLE TA NOUVELLE URL GOOGLE SCRIPT ICI 👇👇👇
    const scriptURL = 'https://script.google.com/macros/s/AKfycbwENCN404_x47WxpErXTDLic6Oai8fCdAgQrAvVxB94PwQnDgA7FdHCT_UBO8jc5ag9fA/exec'; 

    const params = new URLSearchParams(window.location.search);
    const eventId = params.get('id');
    
    let allowedTeamsList = []; 
    let eventRoles = [];
    let eventTitle = "";
    let isBenevoleMode = false;
    let currentCounts = {}; // Déplacer currentCounts ici pour qu'il soit global au scope

    // Si pas d'ID, retour forcé à l'accueil
    if (!eventId) { window.location.href = 'index.html'; return; }

    // 1. CHARGEMENT DES DONNÉES
    // Correction : J'ai mis les chemins relatifs simples. 
    // Si tes fichiers json sont dans un dossier "json", remets "json/events.json"
    Promise.all([
        fetch('json/events.json').then(res => {
            if (!res.ok) throw new Error("Fichier events.json introuvable");
            return res.json();
        }),
        fetch('json/teams.json').then(res => {
            if (!res.ok) throw new Error("Fichier teams.json introuvable");
            return res.json();
        })
    ]).then(async ([eventsData, teamsData]) => {
        
        const event = eventsData[eventId];
        globalTeamsData = teamsData;

        if (event) {
            eventTitle = event.title;
            // Détection du mode (bénévole ou joueur)
            isBenevoleMode = (event.mode === "benevole");

            document.title = `SBC - Inscription ${event.title}`;
            
            // Remplissage des infos de la page
            const elements = { 
                'event-title': event.title, 
                'event-date': event.date, 
                'event-date-detail': event.date, // Correction ID doublon
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

            // --- BRANCHE : BÉNÉVOLE OU JOUEUR ? ---
            if (isBenevoleMode) {
                // MODE BÉNÉVOLE
                document.querySelector('h2.text-2xl.font-bold.text-gray-800').innerText = "Je participe !";
                document.querySelector('p.text-gray-500').innerText = "Merci de votre aide. Choisissez votre mission ci-dessous.";
                
                // Masquer le bouton "Ajouter un autre joueur"
                const addBtn = document.getElementById('add-btn');
                // if(addBtn) addBtn.style.display = 'none'; // MODIF: On laisse le bouton affiché !
                if(addBtn) {
                    addBtn.innerHTML = '<i class="fas fa-plus-circle"></i> Ajouter une autre mission';
                }

                // Renommer les champs parents
                const lblParent = document.querySelector('label[for="parent-name"]') || document.querySelectorAll('label')[0];
                if(lblParent) lblParent.innerText = "Votre Nom & Prénom";

                // Récupérer les comptes depuis Google Sheets
                eventRoles = event.roles || [];
                // let currentCounts = {}; // SUPPRIMÉ ICI (déjà fait plus haut)
                
                // AJOUT : Loader
                const container = document.getElementById('participants-container');
                container.innerHTML = `<div id="missions-loader" class="text-center p-4 text-sbc font-bold animate-pulse"><i class="fas fa-spinner fa-spin mr-2"></i> Chargement des places...</div>`;

                try {
                    // On demande à Google : "Combien d'inscrits pour cet event ?"
                    const response = await fetch(`${scriptURL}?event=${encodeURIComponent(event.title)}`);
                    currentCounts = await response.json();
                } catch (e) {
                    console.error("Erreur lecture quotas", e);
                }

                // RETRAIT : Loader
                const loader = document.getElementById('missions-loader');
                if(loader) loader.remove();

                addBenevoleRow(currentCounts);

            } else {
                // MODE CLASSIQUE (JOUEURS)
                if (event.allowed_teams && event.allowed_teams.length > 0) {
                    allowedTeamsList = event.allowed_teams;
                } else {
                    allowedTeamsList = Object.keys(teamsData);
                }
                addParticipantRow();
            }

        } else {
            document.querySelector('main').innerHTML = `<div class="text-center py-20"><h2 class="text-2xl font-bold">Événement introuvable</h2><a href="index.html" class="text-sbc underline mt-4 inline-block">Retour à l'accueil</a></div>`;
        }
    }).catch(err => {
        console.error("Erreur critique :", err);
        document.querySelector('main').innerHTML = `<div class="text-center py-20 text-red-500">
            <h2 class="text-xl font-bold">Erreur de chargement</h2>
            <p>Impossible de lire les fichiers de données (events.json ou teams.json).</p>
            <p class="text-sm mt-2">Vérifiez qu'ils sont bien à la racine du site.</p>
        </div>`;
    });

    // --- FONCTION LIGNE JOUEUR ---
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

    // --- FONCTION LIGNE BÉNÉVOLE (Mise à jour avec Orange) ---
    function addBenevoleRow(counts) {
        const container = document.getElementById('participants-container');
        const index = container.children.length + 1; // Pour savoir si c'est le 1er ou non

        let optionsHtml = `<option value="" disabled selected>Choisir une mission</option>`;
        
        eventRoles.forEach(roleObj => {
            const roleName = roleObj.name;
            const max = roleObj.max;
            const current = counts[roleName] || 0;
            const remaining = max - current;
            
            if (remaining <= 0) {
                optionsHtml += `<option value="${roleName}" disabled class="bg-gray-100 text-gray-400">🔴 ${roleName} (COMPLET)</option>`;
            } 
            else if (remaining <= (max / 2)) {
                optionsHtml += `<option value="${roleName}">🟠 ${roleName} (${remaining} places)</option>`;
            } 
            else {
                optionsHtml += `<option value="${roleName}">🟢 ${roleName} (${remaining} places)</option>`;
            }
        });

        const rowHtml = `
        <div class="participant-row bg-yellow-50 p-4 rounded-lg border border-yellow-200 relative animate-fade-in-up">
            ${index > 1 ? '<button type="button" onclick="this.parentElement.remove()" class="absolute top-2 right-2 text-red-500 hover:text-red-700 transition"><i class="fas fa-times"></i></button>' : ''}
            <p class="text-xs font-bold text-yellow-600 uppercase mb-2"><i class="fas fa-hand-holding-heart mr-1"></i> Votre Mission</p>
            <div class="space-y-3">
                <select class="role-select w-full bg-white border border-yellow-300 rounded-lg p-2 text-sm focus:border-sbc focus:outline-none" required>
                    ${optionsHtml}
                </select>
            </div>
        </div>`;
        container.insertAdjacentHTML('beforeend', rowHtml);
    }

    const addBtn = document.getElementById('add-btn');
    if (addBtn) addBtn.addEventListener('click', () => {
        if(!isBenevoleMode) {
            addParticipantRow();
        } else {
            // Mode Bénévole : on ajoute une ligne mission
            // On utilise currentCounts qui a été remonté dans le scope
            addBenevoleRow(currentCounts);
        }
    });

    window.loadPlayers = function(selectElement) {
        const teamName = selectElement.value;
        const playerSelect = selectElement.closest('.participant-row').querySelector('.player-select');
        playerSelect.innerHTML = '<option value="" disabled selected>Choisir le joueur</option>';
        playerSelect.disabled = true;
        let players = [];
        for (const [key, data] of Object.entries(globalTeamsData)) {
            if (data.name === teamName && data.players) { players = data.players; break; }
        }
        if (players.length > 0) {
            players.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.name; opt.text = p.name;
                playerSelect.appendChild(opt);
            });
            playerSelect.disabled = false;
        }
    };

    // 4. ENVOI DU FORMULAIRE
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
                const formData = new FormData();
                formData.append('Événement', eventTitle);
                formData.append('Parent', parentName);
                formData.append('Email', parentEmail);

                if (isBenevoleMode) {
                    // Cas Bénévole
                    const role = row.querySelector('.role-select').value;
                    formData.append('Rôle', role);
                    formData.append('Équipes', "STAFF"); 
                    formData.append('Joueurs', parentName); 
                } else {
                    // Cas Joueur
                    const team = row.querySelector('.team-select').value;
                    const player = row.querySelector('.player-select').value;
                    formData.append('Équipes', team);
                    formData.append('Joueurs', player);
                    formData.append('Rôle', "Joueur");
                }

                return fetch(scriptURL, { method: 'POST', body: formData });
            });

            try {
                await Promise.all(promises);
                btn.style.display = 'none';
                if(addBtn) addBtn.style.display = 'none';
                resultDiv.innerHTML = `
                    <div class="bg-green-100 text-green-700 p-6 rounded-lg border border-green-200 animate-fade-in-up text-center">
                        <div class="w-16 h-16 bg-green-200 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"><i class="fas fa-check"></i></div>
                        <h3 class="font-bold text-xl mb-2">Inscription Validée !</h3>
                        <p>Merci pour votre participation.</p>
                    </div>
                    <a href="index.html" class="block mt-6 text-center bg-sbc text-white py-3 rounded-lg font-bold hover:bg-sbc-dark transition shadow-md">Retour à l'accueil</a>
                `;
                resultDiv.classList.remove('hidden');
            } catch (error) {
                console.error('Erreur:', error);
                btn.disabled = false;
                btn.innerHTML = 'Réessayer';
                resultDiv.innerHTML = '<div class="bg-red-100 text-red-700 p-3 rounded mt-2">Erreur réseau. Vérifiez votre connexion.</div>';
                resultDiv.classList.remove('hidden');
            }
        });
    }
});