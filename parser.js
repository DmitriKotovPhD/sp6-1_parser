// @todo: напишите здесь код парсера
// Привести полученные null и undefined значения к пустой строке
const getStringValue = (str) => {
    return str || '';
};

// Соответствие кодов валют валютным символам
const currencyCodes = {
    '₽': 'RUB',
    '$': 'USD',
    '€': 'EUR',
};


// Получить для страницы: 
// поля meta, заголовка, язык страницы, и ряд прочих полей
const getPageMeta = () => {
    const meta = {};

    const _title = getStringValue(document.querySelector('title')?.textContent);

    meta.title = _title.split('—')[0].trim();
    meta.description = getStringValue(document.querySelector('meta[name="description"]')?.content);

    const keywords = getStringValue(document.querySelector('meta[name="keywords"]')?.content);
    meta.keywords = keywords.split(',').map(el => el.trim());

    meta.language = document.querySelector('html').lang;

    meta.opengraph = {};
    const ogNodes = document.querySelectorAll('meta[property^="og"]');
    ogNodes.forEach(node => {
        const key = node.attributes.property.textContent.split(':')[1].trim();
        const value = node.content.trim();
        meta.opengraph[key] = value;
    });

    if(meta.opengraph.title) {
        meta.opengraph.title = meta.opengraph.title.split('—')[0].trim();
    }


    return meta;
};

// Получить описание товара из страницы
const getPageProduct = () => {
    const product = {};

    const productNode = document.querySelector('.product');

    product.id = getStringValue(productNode.dataset.id);
    product.name = getStringValue(productNode.querySelector('h1.title')?.textContent);
    
    const likeBtn = productNode.querySelector('.like');
    product.isLiked = likeBtn.classList.contains('active');

    const tagNodes = productNode.querySelector('.tags')?.children ?? [];
    const tagCategories = {
        'green' : 'category',
        'blue'  : 'label',
        'red'   : 'discount',
    };
    product.tags = {};
    for(const node of tagNodes) {
        const tagCategory = tagCategories[node.className];
        if(tagCategory) {
            if(!product.tags[tagCategory]) {
                product.tags[tagCategory] = [];
            }
            product.tags[tagCategory].push(node.textContent);
        }
    }
    
    // Получить цену товара после скидки
    const priceNode = productNode.querySelector('.price');
    
    // Просто для универсальности, получаем цену таким способом.
    // Можно было бы взять просто firstChild.
    const priceTextContentParts = [...priceNode.childNodes].filter(el => (el.nodeType === Node.TEXT_NODE) && el.textContent.trim()).map(el => el.textContent.trim());
    const priceTextContent = priceTextContentParts.length ? priceTextContentParts[0] : [];


    const currencySymbol = priceTextContent[0];
    const price = Number(priceTextContent.substring(1));
    const oldPrice = Number(priceNode.querySelector('span')?.textContent.substring(1) ?? '');

    product.price = price;
    product.oldPrice = oldPrice;
    product.discount = oldPrice - price;
    product.discountPercent = `${(product.discount / product.oldPrice * 100).toFixed(2)}%`;
    product.currency = getStringValue(currencyCodes[currencySymbol]);

    const properties = document.querySelector('.properties');
    product.properties = Object.fromEntries([...properties.children].map(property => [...property.children].map(el => el.textContent.trim())));

    const descriptionNode = productNode.querySelector('.description')?.cloneNode(true) ?? [];
    descriptionNode.querySelectorAll('*').forEach(el => el.removeAttribute('class'));

    product.description = getStringValue(descriptionNode.innerHTML.trim());
    product.images = [...productNode.querySelectorAll('.preview nav img')].map(img => ({
        preview: img.src,
        full: img.dataset.src,
        alt: img.alt.trim()
    }));

    return product;
};

// Получить рекомендуемые товары
const getPageSuggested = () => {
    const items = document.querySelector('.suggested .items')?.children ?? [];
    
    return [...items].map(item => ({
        name: item.querySelector('h3').textContent.trim(),
        description: item.querySelector('p').textContent.trim(),
        image: item.querySelector('img').src,
        price: item.querySelector('b').textContent.trim().substring(1),
        currency: getStringValue(currencyCodes[item.querySelector('b').textContent.trim()[0]])
    }));
};

// Получить данные обзоров
const getPageReviews = () => {
    const items = document.querySelector('.reviews .items')?.children ?? [];

    // Преобразовать формат отображения даты
    // TODO: использовать Intl toLocaleDateString
    const convertDate = (dateString) => {
        const date = dateString.replaceAll('/', '.');
        return date;
    };

    return [...items].map(item => ({
        rating: item.querySelectorAll('.rating .filled').length,
        author: {
            avatar: item.querySelector('.author img').src,
            name: item.querySelector('.author span').textContent.trim(),
        },
        title: item.querySelector('.title').textContent.trim(),
        description: items[0].querySelector('.title').nextElementSibling.textContent.trim(),
        date: convertDate(item.querySelector('.author').lastElementChild.textContent.trim()),
    }));
};

// Получить разультат разбора (парсинга) страницы
function parsePage() {
    return {
        meta: getPageMeta(),
        product: getPageProduct(),
        suggested: getPageSuggested(),
        reviews: getPageReviews()
    };
}

window.parsePage = parsePage;