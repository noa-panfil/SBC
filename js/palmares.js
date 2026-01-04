const modal = document.getElementById('image-modal');
const modalImg = document.getElementById('modal-img');
const modalTitle = document.getElementById('modal-title');
const modalDesc = document.getElementById('modal-desc');

function openModal(src, title, desc) {
    modalImg.src = src;
    modalTitle.innerText = title;
    modalDesc.innerText = desc;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Bloquer le scroll
}

function closeModal() {
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto'; // Réactiver le scroll
}

// Fermer avec la touche Echap
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
});
