// --- 1. INJECTION DU HTML DE LA POP-UP (LIGHTBOX) ---
document.addEventListener("DOMContentLoaded", function () {
  if (!document.getElementById("image-modal")) {
    const modalHTML = `
        <div id="image-modal" class="fixed inset-0 bg-black bg-opacity-90 hidden z-[100] flex items-center justify-center p-4 backdrop-blur-sm cursor-pointer" onclick="closeModal()">
            <div class="relative max-w-4xl w-full flex flex-col items-center" onclick="event.stopPropagation()">
                <button onclick="closeModal()" class="absolute -top-12 right-0 text-white text-4xl hover:text-gray-300 transition focus:outline-none">&times;</button>
                <img id="modal-img" src="" class="w-full max-h-[70vh] object-contain rounded-lg shadow-2xl bg-white p-4">
                <div class="text-center mt-6">
                    <h3 id="modal-title" class="text-3xl font-bold text-white mb-2 tracking-wide"></h3>
                    <p class="text-sbc-light text-lg font-medium uppercase">Partenaire du Seclin Basket Club</p>
                </div>
            </div>
        </div>`;
    document.body.insertAdjacentHTML("beforeend", modalHTML);
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") window.closeModal();
  });
});

// --- 2. FONCTIONS GLOBALES ---
window.openModal = function (src, title) {
  const modal = document.getElementById("image-modal");
  const modalImg = document.getElementById("modal-img");
  const modalTitle = document.getElementById("modal-title");

  if (modal && modalImg && modalTitle) {
    modalImg.src = src;
    modalTitle.innerText = title;
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }
};

window.closeModal = function () {
  const modal = document.getElementById("image-modal");
  if (modal) {
    modal.classList.add("hidden");
    document.body.style.overflow = "auto";
  }
};

// --- 3. GESTION DES ANNIVERSAIRES ---
document.addEventListener("DOMContentLoaded", function () {
  const today = new Date();
  const currentMonth = today.getMonth(); // 0 = Janvier

  const monthNames = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  const monthLabel = document.getElementById("current-month-name");
  if (monthLabel) monthLabel.innerText = monthNames[currentMonth];

  fetch("json/teams.json")
    .then((response) => response.json())
    .then((data) => {
      const uniquePeople = {};

      function processPerson(person, teamName, teamId, roleLabel) {
        if (!person.birth) return;
        const parts = person.birth.split("/");
        if (parts.length === 3) {
          const birthDay = parseInt(parts[0], 10);
          const birthMonth = parseInt(parts[1], 10) - 1;

          if (birthMonth === currentMonth) {
            const uniqueKey = person.name + "-" + person.birth;
            if (!uniquePeople[uniqueKey]) {
              uniquePeople[uniqueKey] = {
                name: person.name,
                img: person.img,
                day: birthDay,
                birth: person.birth,
                sexe: person.sexe || "M",
                roles: [roleLabel],
                teamsData: [{ name: teamName, id: teamId }],
              };
            } else {
              const existing = uniquePeople[uniqueKey];
              if (!existing.roles.includes(roleLabel)) existing.roles.push(roleLabel);
              const teamExists = existing.teamsData.some((t) => t.id === teamId);
              if (!teamExists) existing.teamsData.push({ name: teamName, id: teamId });
              if (person.sexe) existing.sexe = person.sexe;
            }
          }
        }
      }

      for (const [teamId, teamData] of Object.entries(data)) {
        if (teamData.players) teamData.players.forEach((p) => processPerson(p, teamData.name, teamId, "Joueur"));
        if (teamData.coaches) teamData.coaches.forEach((c) => processPerson(c, teamData.name, teamId, c.role || "Coach"));
      }

      const birthdayList = Object.values(uniquePeople);

      if (birthdayList.length > 0) {
        const section = document.getElementById("birthday-section");
        const grid = document.getElementById("birthday-grid");

        if (section && grid) {
          section.classList.remove("hidden");
          birthdayList.sort((a, b) => a.day - b.day);

          birthdayList.forEach((p) => {
            const parts = p.birth.split("/");
            let birthYear = parseInt(parts[2], 10);
            const currentYear = new Date().getFullYear();
            if (birthYear < 100) {
              const currentYearShort = currentYear - 2000;
              birthYear += birthYear > currentYearShort ? 1900 : 2000;
            }
            const age = currentYear - birthYear;
            const suffix = age === 1 ? "er" : "ème";
            const pronoun = p.sexe === "F" ? "Elle" : "Il";
            const displayRoles = p.roles.join(" & ");
            const displayTeamsLinks = p.teamsData
              .map((team) => `<a href="detail-equipe.html?id=${team.id}" class="text-gray-600 hover:text-sbc hover:underline transition font-medium">${team.name}</a>`)
              .join(" / ");

            const html = `
                <div class="bg-white rounded-xl shadow-md p-4 flex items-center gap-4 
                            w-full md:w-[calc(50%-12px)] lg:w-[calc(33.33%-16px)] xl:w-[calc(25%-18px)]
                            border-l-4 border-yellow-400 hover:shadow-lg transition transform hover:-translate-y-1">
                    <div class="relative flex-shrink-0">
                        <img src="${p.img}" alt="${p.name}" class="w-16 h-16 rounded-full object-cover border-2 border-gray-100">
                        <div class="absolute -bottom-1 -right-1 bg-yellow-400 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full shadow">${p.day}</div>
                    </div>
                    <div class="flex-grow min-w-0">
                        <h3 class="font-bold text-gray-800 text-lg leading-tight truncate mb-1">${p.name}</h3>
                        <div class="text-xs uppercase tracking-wide mb-2 text-gray-500">
                            <span class="text-sbc font-bold">${displayRoles}</span><br>
                            <span class="truncate block mt-0.5">${displayTeamsLinks}</span>
                        </div>
                        <p class="text-sbc font-bold text-sm border-t border-gray-100 pt-2"><i class="fas fa-gift mr-1"></i> ${pronoun} fête son ${age}${suffix} anniversaire !</p>
                    </div>
                </div>`;
            grid.innerHTML += html;
          });
        }
      }
    })
    .catch((err) => console.error("Erreur chargement anniversaires:", err));
});

// --- 4. GESTION DES ÉVÉNEMENTS (PAGINATION + SWITCH + LIEN) ---
document.addEventListener("DOMContentLoaded", function() {
    
    fetch('json/events.json')
        .then(response => response.json())
        .then(data => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const upcomingEvents = [];
            const pastEvents = [];

            function parseDate(str) {
                const [day, month, year] = str.split('/');
                return new Date(year, month - 1, day);
            }

            for (const [key, event] of Object.entries(data)) {
                event.id = key; 

                if (event["format-date"]) {
                    const eventDate = parseDate(event["format-date"]);
                    event.jsDate = eventDate;

                    if (eventDate >= today) {
                        upcomingEvents.push(event);
                    } else {
                        pastEvents.push(event);
                    }
                }
            }

            upcomingEvents.sort((a, b) => a.jsDate - b.jsDate);
            pastEvents.sort((a, b) => b.jsDate - a.jsDate);

            if (upcomingEvents.length === 0 && pastEvents.length === 0) return;

            document.getElementById('events-section').classList.remove('hidden');

            let currentView = 'upcoming'; 
            let currentPage = 0;
            const itemsPerPage = 3;

            const gridEl = document.getElementById('events-grid');
            const prevBtn = document.getElementById('carousel-prev');
            const nextBtn = document.getElementById('carousel-next');
            const titleEl = document.getElementById('events-title');
            const subtitleEl = document.getElementById('events-subtitle');
            const noEventsMsg = document.getElementById('no-events-msg');
            const dotsContainer = document.getElementById('pagination-dots');

            function createEventCard(event, id, isPast) {
                const cardOpacity = isPast ? 'opacity-70 grayscale' : '';
                
                const Tag = isPast ? 'div' : 'a';
                const hrefAttribute = isPast ? '' : `href="event.html?id=${id}"`;
                const cursorClass = isPast ? 'cursor-default' : 'cursor-pointer group'; 

                return `
                <${Tag} ${hrefAttribute} class="block bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-2xl transition duration-300 flex flex-col h-full animate-fade-in-up ${cardOpacity} ${cursorClass}">
                    
                    <div class="relative w-full h-64 bg-gray-100">
                        <img src="${event.image}" alt="${event.title}" 
                             class="w-full h-full object-cover transition duration-500 hover:scale-105"
                             onerror="this.src='https://placehold.co/600x400?text=SBC+Event'">
                        
                        <div class="absolute top-4 right-4 bg-white/90 backdrop-blur text-sbc-dark font-bold px-3 py-1 rounded-lg shadow text-sm border border-gray-100">
                            <i class="far fa-calendar mr-1"></i> ${event.date}
                        </div>

                        ${!isPast ? `
                        <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition duration-300 flex items-center justify-center">
                            <span class="bg-sbc text-white px-6 py-2 rounded-full font-bold shadow-lg opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition duration-300">
                                S'inscrire
                            </span>
                        </div>` : ''}
                    </div>

                    <div class="p-6 flex flex-col flex-grow">
                        <h3 class="text-xl font-bold text-gray-800 mb-2 line-clamp-1">${event.title}</h3>
                        <div class="text-sm text-gray-500 mb-3 space-y-1">
                            <p><i class="fas fa-clock text-sbc mr-2"></i> ${event.time}</p>
                            <p><i class="fas fa-map-marker-alt text-sbc mr-2"></i> ${event.location}</p>
                        </div>
                        
                        <p class="text-gray-600 text-sm flex-grow line-clamp-3">
                            ${event.description}
                        </p>
                    </div>
                </${Tag}>`;
            }

            function render(direction = null) {
                const list = (currentView === 'upcoming') ? upcomingEvents : pastEvents;
                const isPast = (currentView === 'past');
                const totalPages = Math.ceil(list.length / itemsPerPage);
                const start = currentPage * itemsPerPage;
                const end = start + itemsPerPage;
                const visibleItems = list.slice(start, end);

                const updateDOM = () => {
                    if (currentView === 'upcoming') {
                        titleEl.innerHTML = '<i class="fas fa-calendar-alt text-sbc"></i> Événements à venir';
                        subtitleEl.innerText = "Ne manquez pas les prochains rendez-vous !";
                    } else {
                        titleEl.innerHTML = '<i class="fas fa-history text-gray-400"></i> C\'est déjà passé';
                        subtitleEl.innerText = "Souvenirs des événements précédents.";
                    }

                    if (list.length === 0) {
                        gridEl.innerHTML = '';
                        noEventsMsg.classList.remove('hidden');
                        prevBtn.classList.add('hidden');
                        nextBtn.classList.add('hidden');
                        if(dotsContainer) dotsContainer.innerHTML = '';
                    } else {
                        noEventsMsg.classList.add('hidden');
                        gridEl.innerHTML = visibleItems.map(evt => createEventCard(evt, evt.id, isPast)).join('');

                        prevBtn.classList.toggle('hidden', totalPages <= 1);
                        nextBtn.classList.toggle('hidden', totalPages <= 1);
                        
                        prevBtn.disabled = (currentPage === 0);
                        prevBtn.style.opacity = (currentPage === 0) ? "0.3" : "1";
                        prevBtn.style.cursor = (currentPage === 0) ? "default" : "pointer";

                        nextBtn.disabled = (currentPage >= totalPages - 1);
                        nextBtn.style.opacity = (currentPage >= totalPages - 1) ? "0.3" : "1";
                        nextBtn.style.cursor = (currentPage >= totalPages - 1) ? "default" : "pointer";

                        if (dotsContainer) {
                            if (totalPages > 1) {
                                dotsContainer.innerHTML = Array.from({length: totalPages}, (_, i) => `
                                    <span class="block w-2 h-2 rounded-full transition-all duration-300 ${i === currentPage ? 'bg-sbc w-4' : 'bg-gray-300'}"></span>
                                `).join('');
                            } else {
                                dotsContainer.innerHTML = '';
                            }
                        }
                    }
                };

                if (!direction) {
                    updateDOM();
                    return;
                }

                const exitTranslate = direction === 'next' ? '-translate-x-10' : 'translate-x-10';
                const enterTranslate = direction === 'next' ? 'translate-x-10' : '-translate-x-10';

                gridEl.classList.add('opacity-0', exitTranslate);

                setTimeout(() => {
                    updateDOM();
                    gridEl.classList.remove('transition-all', 'duration-300', exitTranslate);
                    gridEl.classList.add(enterTranslate);

                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            gridEl.classList.add('transition-all', 'duration-300');
                            gridEl.classList.remove('opacity-0', enterTranslate);
                        });
                    });
                }, 300);
            }

            function toggleContext() {
                gridEl.classList.add('opacity-0');
                setTimeout(() => {
                    currentView = (currentView === 'upcoming') ? 'past' : 'upcoming';
                    currentPage = 0; 
                    render();
                    requestAnimationFrame(() => {
                        gridEl.classList.remove('opacity-0');
                    });
                }, 300);
            }
            document.getElementById('btn-prev-event').addEventListener('click', toggleContext);
            document.getElementById('btn-next-event').addEventListener('click', toggleContext);

            prevBtn.addEventListener('click', () => {
                if (currentPage > 0) {
                    currentPage--;
                    render('prev');
                }
            });

            nextBtn.addEventListener('click', () => {
                const list = (currentView === 'upcoming') ? upcomingEvents : pastEvents;
                const totalPages = Math.ceil(list.length / itemsPerPage);
                if (currentPage < totalPages - 1) {
                    currentPage++;
                    render('next');
                }
            });

            render();
        })
        .catch(err => console.error("Erreur chargement events:", err));
});