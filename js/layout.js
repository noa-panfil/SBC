const headerHTML = `
<nav class="bg-sbc-dark text-white shadow-lg sticky top-0 z-50">
    <div class="container mx-auto px-4 py-4 flex justify-between items-center relative z-50 bg-sbc-dark">
        <a href="index.html" class="flex items-center gap-3">
            <img src="/img/logo.png" alt="Logo SBC" class="h-10 md:h-12 w-auto">
            <span class="text-lg md:text-2xl font-bold tracking-wider whitespace-nowrap">SECLIN BASKET CLUB</span>
        </a>

        <div class="hidden lg:flex space-x-5 items-center font-medium text-sm lg:text-base" id="desktop-menu">
            <a href="index.html" class="hover:text-sbc-light transition pb-1 border-b-2 border-transparent hover:border-sbc-light">Accueil</a>
            <a href="equipes.html" class="hover:text-sbc-light transition pb-1 border-b-2 border-transparent hover:border-sbc-light">Équipes</a>
            <a href="palmares.html" class="hover:text-sbc-light transition pb-1 border-b-2 border-transparent hover:border-sbc-light">Palmarès</a>
            <a href="informations.html" class="hover:text-sbc-light transition pb-1 border-b-2 border-transparent hover:border-sbc-light">Infos</a>
            <a href="partenaires.html" class="hover:text-sbc-light transition pb-1 border-b-2 border-transparent hover:border-sbc-light">Partenaires</a>
            <a href="contact.html" class="bg-sbc hover:bg-sbc-light text-white px-4 py-2 rounded-full transition shadow-md">Contact</a>
            
            <div class="flex items-center gap-3 ml-2 pl-2 border-l border-gray-700">
                <a href="https://www.facebook.com/share/1BfEPGLcYV/" target="_blank" class="text-gray-400 hover:text-[#1877F2] transition transform hover:scale-110">
                    <i class="fab fa-facebook text-xl"></i>
                </a>
                <a href="https://www.instagram.com/seclinbasketclub/" target="_blank" class="text-gray-400 hover:text-[#E4405F] transition transform hover:scale-110">
                    <i class="fab fa-instagram text-xl"></i>
                </a>
            </div>
        </div>
        
        <button id="burger-btn" class="lg:hidden text-white text-2xl focus:outline-none transition-transform duration-300">
            <i class="fas fa-bars" id="burger-icon"></i>
        </button>
    </div>

    <div id="mobile-menu" class="absolute top-full left-0 w-full bg-sbc-dark border-t border-green-800 shadow-2xl 
                transition-all duration-300 ease-in-out transform 
                opacity-0 -translate-y-4 pointer-events-none -z-10">
        
        <div class="container mx-auto px-4 py-6 flex flex-col space-y-4 text-center text-lg">
            <a href="index.html" class="hover:text-sbc-light py-2 border-b border-green-800/30">Accueil</a>
            <a href="equipes.html" class="hover:text-sbc-light py-2 border-b border-green-800/30">Nos Équipes</a>
            <a href="palmares.html" class="hover:text-sbc-light py-2 border-b border-green-800/30">Palmarès</a>
            <a href="informations.html" class="hover:text-sbc-light py-2 border-b border-green-800/30">Infos Pratiques</a>
            <a href="partenaires.html" class="hover:text-sbc-light py-2 border-b border-green-800/30">Partenaires</a>
            <a href="contact.html" class="text-sbc-light font-bold py-2 bg-green-900/30 rounded-lg mt-2">Nous Contacter</a>
            
            <div class="flex justify-center gap-6 pt-4 border-t border-green-800/30">
                <a href="https://www.facebook.com/share/1BfEPGLcYV/" target="_blank" class="text-white hover:text-[#1877F2] transition">
                    <i class="fab fa-facebook text-2xl"></i>
                </a>
                <a href="https://www.instagram.com/seclinbasketclub/" target="_blank" class="text-white hover:text-[#E4405F] transition">
                    <i class="fab fa-instagram text-2xl"></i>
                </a>
            </div>
        </div>
    </div>
</nav>
`;

const footerHTML = `
<footer class="bg-gray-900 text-white pt-12 pb-6 mt-auto">
    <div class="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div>
            <h4 class="text-xl font-bold mb-4 text-sbc-light flex items-center gap-2">
                <img src="/img/logo.png" class="h-8 w-auto"> SBC Seclin
            </h4>
            <p class="text-gray-400 text-sm">Le club de basket historique de la ville.<br>Formation, Passion, Compétition.</p>
        </div>
        <div>
            <h4 class="text-xl font-bold mb-4 text-sbc-light">Liens Rapides</h4>
            <ul class="text-gray-400 text-sm space-y-2">
                <li><a href="index.html" class="hover:text-white">Accueil</a></li>
                <li><a href="equipes.html" class="hover:text-white">Nos Équipes</a></li>
                <li><a href="palmares.html" class="hover:text-white">Palmarès</a></li>
                <li><a href="informations.html" class="hover:text-white">Infos Pratiques</a></li>
            </ul>
        </div>
        <div>
            <h4 class="text-xl font-bold mb-4 text-sbc-light">Contact</h4>
            <p class="text-gray-400 text-sm mb-2"><i class="fas fa-map-marker-alt mr-2"></i> 7 rue Joliot Curie, 59113 Seclin </p>
            <p class="text-gray-400 text-sm mb-4"><i class="fas fa-envelope mr-2"></i> seclinbc@gmail.com </p>
            
            <div class="flex space-x-4">
                <a href="https://www.facebook.com/share/1BfEPGLcYV/" class="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-blue-600 hover:text-white transition duration-300">
                    <i class="fab fa-facebook-f"></i>
                </a>
                <a href="https://www.instagram.com/seclinbasketclub/" class="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-pink-600 hover:text-white transition duration-300">
                    <i class="fab fa-instagram"></i>
                </a>
            </div>
        </div>
    </div>
    <div class="text-center border-t border-gray-800 pt-6 text-gray-500 text-sm">
        &copy; 2025 Seclin Basket Club. Tous droits réservés. - <a href="mentions-legales.html" class="hover:text-gray-300">Mentions Légales</a>
    </div>
</footer>
`;

document.addEventListener("DOMContentLoaded", function() {
    const headerPlaceholder = document.getElementById('header-placeholder');
    if(headerPlaceholder) headerPlaceholder.innerHTML = headerHTML;

    const footerPlaceholder = document.getElementById('footer-placeholder');
    if(footerPlaceholder) footerPlaceholder.innerHTML = footerHTML;

    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    const links = document.querySelectorAll('#desktop-menu a, #mobile-menu a');
    
    links.forEach(link => {
        const linkHref = link.getAttribute('href');
        if(currentPage.includes(linkHref)) {
            link.classList.add('text-sbc-light');
            link.classList.remove('border-transparent');
            if(link.parentElement.id === 'desktop-menu') {
                link.classList.add('border-sbc-light');
            }
        }
    });

    const burgerBtn = document.getElementById('burger-btn');
    const burgerIcon = document.getElementById('burger-icon');
    const mobileMenu = document.getElementById('mobile-menu');

    if(burgerBtn && mobileMenu) {
        burgerBtn.addEventListener('click', () => {
            const isClosed = mobileMenu.classList.contains('opacity-0');

            if (isClosed) {
                mobileMenu.classList.remove('opacity-0', '-translate-y-4', 'pointer-events-none', '-z-10');
                mobileMenu.classList.add('opacity-100', 'translate-y-0', 'pointer-events-auto', 'z-40');
                burgerIcon.classList.remove('fa-bars');
                burgerIcon.classList.add('fa-times');
                burgerBtn.classList.add('rotate-90');
            } else {
                mobileMenu.classList.remove('opacity-100', 'translate-y-0', 'pointer-events-auto', 'z-40');
                mobileMenu.classList.add('opacity-0', '-translate-y-4', 'pointer-events-none', '-z-10');
                burgerIcon.classList.remove('fa-times');
                burgerIcon.classList.add('fa-bars');
                burgerBtn.classList.remove('rotate-90');
            }
        });
    }
});