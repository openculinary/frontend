import { renderQuantity } from './conversion';

export { renderIngredientHTML, renderDirectionHTML };

function getIngredientQuantity(doc) {
    const xml = $.parseXML(`<xml>${doc}</xml>`).firstChild;
    return {
      magnitude: Number($(xml).find('amt qty').text()),
      units: $(xml).find('amt unit').text(),
    };
}

function renderIngredientHTML(doc, state) {
    const xml = $.parseXML(`<xml>${doc}</xml>`).firstChild;
    const container = $('<div />');

    const quantity = renderQuantity(getIngredientQuantity(doc));
    const quantityHTML = `${quantity.magnitude || ''} ${quantity.units || ''}`.trim();
    container.append($('<div />', {'class': 'quantity', 'html': quantityHTML}));

    $(xml.childNodes).remove('amt');
    $(xml).find('ingredient').replaceWith((idx, text) => $('<span />', {'class': `tag badge`, 'text': text}).addClass(state));
    container.append($('<div />', {'class': 'product', 'html': xml.childNodes}));

    return container.html();
}

function renderDirectionHTML(doc) {
    const xml = $.parseXML(`<xml>${doc}</xml>`).firstChild;
    const container = $('<div />');

    $(xml).find('mark').replaceWith((idx, text) => $('<span />', {'class': 'equipment tag badge', 'text': text}));
    const direction = $('<li />', {'class': 'direction', 'html': xml.childNodes});

    container.append(direction);
    return container.html();
}
