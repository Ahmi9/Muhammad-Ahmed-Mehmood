function fillPopup(popup, data) {
    const image = popup.querySelector('[data-ee-popup-image]');
    image.src = data.image || '';
    image.alt = data.product.title;

    popup.querySelector('[data-ee-popup-title]').textContent = data.product.title;
    popup.querySelector('[data-ee-popup-price]').textContent = data.price;
    popup.querySelector('[data-ee-popup-description]').innerHTML = data.description || '';
}

document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-ee-quick-view]');
    if (!trigger) return;

    const popup = trigger.closest('.ee-grid').querySelector('[data-ee-popup]');
    const dataElement = trigger.closest('.ee-card').querySelector('[data-ee-product-data]');
    if (!popup || !dataElement) return;

    const data = JSON.parse(dataElement.textContent);
    fillPopup(popup, data);
    popup.showModal();
});

document.addEventListener('click', (event) => {
    const popup = event.target.closest('[data-ee-popup]');
    if (!popup || event.target !== popup) return;

    const rect = popup.getBoundingClientRect();
    const isOutside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
    if (isOutside) popup.close();
});