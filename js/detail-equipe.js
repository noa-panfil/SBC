const params = new URLSearchParams(window.location.search);
const teamId = params.get('id');

fetch('json/teams.json')
    .then(response => response.json())
    .then(data => {
        const team = data[teamId];

        if (team) {
            document.getElementById('team-name').innerText = team.name;
            document.title = `SBC - ${team.name}`;
            document.getElementById('team-category').innerText = team.category;
            document.getElementById('team-schedule').innerText = team.schedule;

            document.getElementById('team-coaches').innerHTML = team.coaches.map(c => `
                <div class="relative overflow-hidden flex items-center gap-5 p-4 rounded-xl bg-sbc-dark text-white shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
                    <!-- Background decoration -->
                    <div class="absolute right-0 top-0 w-24 h-full bg-white/5 skew-x-12 translate-x-12 group-hover:translate-x-8 transition-transform"></div>
                    
                    <!-- Watermark Logo -->
                    <img src="img/logo.png" alt="" class="absolute -right-6 -bottom-6 w-24 opacity-10 grayscale rotate-12 group-hover:rotate-0 transition-all duration-500">

                    <!-- Image container -->
                    <div class="relative flex-shrink-0">
                        <div class="absolute inset-0 bg-sbc-light rounded-full blur-md opacity-20 group-hover:opacity-40 transition-opacity"></div>
                        <img src="${c.img}" alt="Coach ${c.name} - ${c.role} du Seclin Basket Club" 
                                class="relative w-16 h-16 rounded-full object-cover border-2 border-sbc-light/30 shadow-sm">
                    </div>
                    
                    <!-- Content -->
                    <div class="relative z-10 flex-grow">
                        <h4 class="font-bold text-lg leading-tight tracking-wide group-hover:text-sbc-light transition-colors">
                            ${c.name.toUpperCase()}
                        </h4>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="w-2 h-2 rounded-full bg-sbc-light animate-pulse"></span>
                            <p class="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                                ${c.role}
                            </p>
                        </div>
                    </div>
                </div>
            `).join('');

            if (team.players && team.players.length > 0) {
                document.getElementById('team-players').innerHTML = team.players.map(p => `
                    <div class="group relative bg-white p-6 rounded-2xl shadow hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 overflow-hidden text-center">
                        <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sbc to-sbc-light"></div>
                        <div class="relative inline-block mb-4">
                            <div class="absolute inset-0 bg-sbc rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                            <img src="${p.img}" alt="Joueur ${p.name} numéro ${p.num} de l'équipe ${team.name} du Seclin Basket Club" 
                                    class="relative w-24 h-24 rounded-full object-cover border-4 border-white shadow-md group-hover:scale-105 transition-transform duration-300">
                            <span class="absolute -bottom-2 -right-2 bg-gradient-to-br from-sbc to-sbc-dark text-white text-sm font-bold h-8 w-8 flex items-center justify-center rounded-full border-2 border-white shadow-lg">
                                #${p.num}
                            </span>
                        </div>
                        <h4 class="font-bold text-gray-800 text-lg group-hover:text-sbc transition-colors leading-tight">
                            ${p.name}
                        </h4>
                    </div>
                `).join('');
            } else {
                document.getElementById('team-players').innerHTML = `<p class="text-gray-500 col-span-full">Effectif non communiqué.</p>`;
            }
            const desktopTarget = document.getElementById('scorenco-widget-desktop');
            const mobileTarget = document.getElementById('scorenco-widget-mobile');

            if (team.widgetId && (desktopTarget || mobileTarget)) {
                const w = document.createElement('div');
                w.className = 'scorenco-widget';
                w.setAttribute('data-widget-type', 'team');
                w.setAttribute('data-widget-id', team.widgetId);
                w.style.css ? v = 2.0 : 'background: #14532d; height: 500px; display: flex; align-items: center; justify-content: center; flex-direction: column; text-transform: uppercase; font-family: sans-serif; font-weight: bolder; gap: 9px; color:#1E457B;';

                const styleTag = document.createElement('style');
                styleTag.textContent = ".ldsdr{display:inline-block;width:80px;height:80px}.ldsdr:after{content:\" \";display:block;width:64px;height:64px;margin:8px;border-radius:50%;border:6px solid #1E457B;border-color:#1E457B transparent;animation:ldsdr 1.2s linear infinite}@keyframes ldsdr{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}";
                w.appendChild(styleTag);

                const s = document.createElement('script');
                s.async = true;
                s.defer = true;
                s.src = 'https://widgets.scorenco.com/host/widgets.js';
                w.appendChild(s);

                const placeWidget = () => {
                    const isDesktop = window.matchMedia('(min-width:1024px)').matches;
                    if (isDesktop && desktopTarget) {
                        desktopTarget.appendChild(w);
                    } else if (!isDesktop && mobileTarget) {
                        mobileTarget.appendChild(w);
                    } else if (desktopTarget) {
                        desktopTarget.appendChild(w);
                    } else if (mobileTarget) {
                        mobileTarget.appendChild(w);
                    }
                };

                placeWidget();

                let lastIsDesktop = window.matchMedia('(min-width:1024px)').matches;
                window.addEventListener('resize', () => {
                    const nowIsDesktop = window.matchMedia('(min-width:1024px)').matches;
                    if (nowIsDesktop !== lastIsDesktop) {
                        lastIsDesktop = nowIsDesktop;
                        placeWidget();
                    }
                });
            }

        } else {
            document.body.innerHTML = "<div class='text-center p-12 mt-12'><h1 class='text-2xl font-bold'>Équipe introuvable</h1><a href='equipes.html' class='text-sbc underline'>Retour</a></div>";
        }
    })
    .catch(error => console.error('Erreur:', error));
