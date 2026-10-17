const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

function getOptions(product) {
    if (product.variants.length === 1 && product.variants[0].title === 'Default Title') return [];

    return product.options.map((option, index) => {
        const name = typeof option === 'string' ? option : option.name;
        const values = [...new Set(product.variants.map((variant) => variant.options[index]))];
        return { name, values };
    });
}

function colorField(option) {
    const choices = option.values.map((value, index) => `
    <label class="ee-color">
        <input type="radio" class="ee-color__input" name="${escapeHtml(option.name)}" value="${escapeHtml(value)}"${index === 0 ? ' checked' : ''}>
        <span class="ee-color__name" style="--ee-swatch: ${escapeHtml(value.toLowerCase())};">${escapeHtml(value)}</span>
    </label>`).join('');

    return `
    <fieldset class="ee-popup__field">
        <legend class="ee-popup__label">${escapeHtml(option.name)}</legend>
        <div class="ee-colors">${choices}</div>
    </fieldset>`;
}

function selectField(option) {
    const name = escapeHtml(option.name);
    const items = option.values.map((value) => `
        <li class="ee-select__option" role="option" tabindex="-1" aria-selected="false" data-value="${escapeHtml(value)}">${escapeHtml(value)}</li>`).join('');

    return `
    <div class="ee-popup__field">
        <span class="ee-popup__label">${name}</span>
        <div class="ee-select" data-ee-select>
            <input type="hidden" name="${name}" value="">
            <button type="button" class="ee-select__button" aria-haspopup="listbox" aria-expanded="false">
                <span class="ee-select__value">Choose your ${name.toLowerCase()}</span>
                <span class="ee-select__icon">
                    <svg width="14" height="8" viewBox="0 0 14 8" aria-hidden="true">
                        <path d="M1 1l6 6 6-6" stroke="currentColor" stroke-width="1.5" fill="none"/>
                    </svg>
                </span>
            </button>
            <ul class="ee-select__list" role="listbox" aria-label="${name}" hidden>${items}</ul>
        </div>
    </div>`;
}

function renderOptions(popup, product) {
    const options = getOptions(product).sort((a, b) => /colou?r/i.test(b.name) - /colou?r/i.test(a.name));
    const fields = options.map((option) => (/colou?r/i.test(option.name) ? colorField(option) : selectField(option)));
    popup.querySelector('[data-ee-popup-options]').innerHTML = fields.join('');
}

function fillPopup(popup, data) {
    const image = popup.querySelector('[data-ee-popup-image]');
    image.src = data.image || '';
    image.alt = data.title;

    popup.querySelector('[data-ee-popup-title]').textContent = data.title;
    popup.querySelector('[data-ee-popup-price]').textContent = data.price;
    popup.querySelector('[data-ee-popup-description]').innerHTML = data.description || '';
    renderOptions(popup, data);
    popup.productData = data;
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

function openSelect(select) {
    select.querySelector('.ee-select__button').setAttribute('aria-expanded', 'true');
    const list = select.querySelector('.ee-select__list');
    list.hidden = false;
    (list.querySelector('[aria-selected="true"]') || list.firstElementChild).focus();
}

function closeSelect(select, focusButton) {
    const button = select.querySelector('.ee-select__button');
    button.setAttribute('aria-expanded', 'false');
    select.querySelector('.ee-select__list').hidden = true;
    if (focusButton) button.focus();
}

function chooseOption(select, item) {
    select.querySelectorAll('[role="option"]').forEach((option) => {
        option.setAttribute('aria-selected', option === item ? 'true' : 'false');
    });
    select.querySelector('input[type="hidden"]').value = item.dataset.value;
    select.querySelector('.ee-select__value').textContent = item.dataset.value;
    closeSelect(select, true);
}

document.addEventListener('click', (event) => {
    const select = event.target.closest('[data-ee-select]');

    // a click anywhere else closes any open dropdown
    document.querySelectorAll('[data-ee-select]').forEach((other) => {
        if (other !== select) closeSelect(other, false);
    });
    if (!select) return;

    const item = event.target.closest('[role="option"]');
    if (item) {
        chooseOption(select, item);
    } else if (event.target.closest('.ee-select__button')) {
        const isOpen = select.querySelector('.ee-select__button').getAttribute('aria-expanded') === 'true';
        isOpen ? closeSelect(select, false) : openSelect(select);
    }
});

document.addEventListener('keydown', (event) => {
    const select = event.target.closest('[data-ee-select]');
    if (!select) return;

    const item = event.target.closest('[role="option"]');
    if (!item) {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            openSelect(select);
        }
        return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const next = event.key === 'ArrowDown' ? item.nextElementSibling : item.previousElementSibling;
        if (next) next.focus();
    } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        chooseOption(select, item);
    } else if (event.key === 'Escape') {
        event.preventDefault(); //closes only the list, keeps the popup open
        closeSelect(select, true);
    } else if (event.key === 'Tab') {
        closeSelect(select, false);
    }
});

function findVariant(data, form) {
    if (data.variants.length === 1) return data.variants[0];

    const formData = new FormData(form);
    return data.variants.find((variant) => data.options.every((name, index) => variant.options[index] === formData.get(name)));
}

function showError(element, message) {
    element.textContent = message;
    element.hidden = false;
}

function updateCartBubble(sections) {
    const html = sections && sections['cart-icon-bubble'];
    const bubble = document.getElementById('cart-icon-bubble');
    if (!html || !bubble) return;

    const fresh = new DOMParser().parseFromString(html, 'text/html').querySelector('.shopify-section');
    if (fresh) bubble;escapeHtml.innerHTML = fresh.innerHTML;
}

async function addToCart(items) {
    const root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';
    const response = await fetch(`${root}cart/add.js`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ items, sections: 'cart-icon-bubble' }),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.description || 'Could not add to cart, please try again.');
    return result;
}

document.addEventListener('submit', async (event) => {
    const form = event.target.closest('[data-ee-popup-form]');
    if (!form) return;
    event.preventDefault();

    const popup = form.closest('[data-ee-popup]');
    const data = popup.productData;
    const error = form.querySelector('[data-ee-popup-error]');
    const button = form.querySelector('.ee-popup__submit');
    error.hidden = true;

    const formData = new FormData(form);
    const missing = data.variants.length > 1 && data.options.find((name) => !formData.get(name));
    if (missing) return showError(error, `Please choose your ${missing.toLowerCase()}.`);
    
    const variant = findVariant(data, form);
    if (!variant || !variant.available) return showError(error, 'This combination is sold out.');

    const items = [{ id: variant.id, quantity: 1 }];

    button.disabled = true;
    try {
        const result = await addToCart(items);
        updateCartBubble(result.sections);
        popup.close();
    } catch (err) {
        showError(error, err.message);
    } finally {
        button.disabled = false;
    }
})