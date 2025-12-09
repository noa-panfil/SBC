// --- 1. INJECTION DU HTML DE LA POP-UP (LIGHTBOX) ---
document.addEventListener("DOMContentLoaded", function () {
  // On vérifie si la modal existe déjà pour ne pas la créer en double
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

  // Ajout de l'écouteur pour la touche Echap
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") window.closeModal();
  });
});

// --- 2. FONCTIONS GLOBALES (Pour que le onclick="..." du HTML les trouve) ---
window.openModal = function (src, title) {
  const modal = document.getElementById("image-modal");
  const modalImg = document.getElementById("modal-img");
  const modalTitle = document.getElementById("modal-title");

  if (modal && modalImg && modalTitle) {
    modalImg.src = src;
    modalTitle.innerText = title;
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden"; // Bloquer le scroll
  }
};

window.closeModal = function () {
  const modal = document.getElementById("image-modal");
  if (modal) {
    modal.classList.add("hidden");
    document.body.style.overflow = "auto"; // Réactiver le scroll
  }
};

// --- GESTION DES ANNIVERSAIRES INTELLIGENTS ---
document.addEventListener("DOMContentLoaded", function () {
  const today = new Date();
  const currentMonth = today.getMonth(); // 0 = Janvier

  const monthNames = [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre",
  ];
  const monthLabel = document.getElementById("current-month-name");
  if (monthLabel) monthLabel.innerText = monthNames[currentMonth];

  fetch("teams.json")
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
            // Clé unique
            const uniqueKey = person.name + "-" + person.birth;

            if (!uniquePeople[uniqueKey]) {
              uniquePeople[uniqueKey] = {
                name: person.name,
                img: person.img,
                day: birthDay,
                birth: person.birth,
                // On récupère le sexe (M par défaut si absent)
                sexe: person.sexe || "M",
                roles: [roleLabel],
                teamsData: [{ name: teamName, id: teamId }],
              };
            } else {
              // Fusion
              const existing = uniquePeople[uniqueKey];
              if (!existing.roles.includes(roleLabel))
                existing.roles.push(roleLabel);
              const teamExists = existing.teamsData.some(
                (t) => t.id === teamId
              );
              if (!teamExists)
                existing.teamsData.push({ name: teamName, id: teamId });

              // Si le sexe est défini dans la nouvelle occurrence, on met à jour (sécurité)
              if (person.sexe) existing.sexe = person.sexe;
            }
          }
        }
      }

      // Parcours
      for (const [teamId, teamData] of Object.entries(data)) {
        if (teamData.players)
          teamData.players.forEach((p) =>
            processPerson(p, teamData.name, teamId, "Joueur")
          );
        if (teamData.coaches)
          teamData.coaches.forEach((c) =>
            processPerson(c, teamData.name, teamId, c.role || "Coach")
          );
      }

      const birthdayList = Object.values(uniquePeople);

      if (birthdayList.length > 0) {
        const section = document.getElementById("birthday-section");
        const grid = document.getElementById("birthday-grid");

        if (section && grid) {
          section.classList.remove("hidden");
          birthdayList.sort((a, b) => a.day - b.day);

          birthdayList.forEach((p) => {
            // Calcul âge
            const parts = p.birth.split("/");
            let birthYear = parseInt(parts[2], 10);
            const currentYear = new Date().getFullYear();
            if (birthYear < 100) {
              const currentYearShort = currentYear - 2000;
              birthYear += birthYear > currentYearShort ? 1900 : 2000;
            }
            const age = currentYear - birthYear;
            const suffix = age === 1 ? "er" : "ème";

            // --- NOUVEAU : Choix du pronom ---
            const pronoun = p.sexe === "F" ? "Elle" : "Il";

            // Liens équipes
            const displayRoles = p.roles.join(" & ");
            const displayTeamsLinks = p.teamsData
              .map(
                (team) =>
                  `<a href="detail-equipe.html?id=${team.id}" class="text-gray-600 hover:text-sbc hover:underline transition font-medium">${team.name}</a>`
              )
              .join(" / ");

            const html = `
                <div class="bg-white rounded-xl shadow-md p-4 flex items-center gap-4 
                            w-full md:w-[calc(50%-12px)] lg:w-[calc(33.33%-16px)] xl:w-[calc(25%-18px)]
                            border-l-4 border-yellow-400 hover:shadow-lg transition transform hover:-translate-y-1">
                    
                    <div class="relative flex-shrink-0">
                        <img src="${p.img}" alt="${p.name}" class="w-16 h-16 rounded-full object-cover border-2 border-gray-100">
                        <div class="absolute -bottom-1 -right-1 bg-yellow-400 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full shadow">
                            ${p.day}
                        </div>
                    </div>
                    <div class="flex-grow min-w-0">
                        <h3 class="font-bold text-gray-800 text-lg leading-tight truncate mb-1">${p.name}</h3>
                        
                        <div class="text-xs uppercase tracking-wide mb-2 text-gray-500">
                            <span class="text-sbc font-bold">${displayRoles}</span> 
                            <br>
                            <span class="truncate block mt-0.5">${displayTeamsLinks}</span>
                        </div>
                        
                        <p class="text-sbc font-bold text-sm border-t border-gray-100 pt-2">
                            <i class="fas fa-gift mr-1"></i> ${pronoun} fête son ${age}${suffix} anniversaire !
                        </p>
                    </div>
                </div>
            `;
                        grid.innerHTML += html;
          });
        }
      }
    })
    .catch((err) => console.error("Erreur chargement anniversaires:", err));
});
