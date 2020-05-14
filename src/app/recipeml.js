import { xsltProcess } from 'xslt-processor'

import { renderQuantity } from './conversion';

export { renderIngredientHTML, renderDirectionHTML };

function renderIngredientHTML(doc, state) {
    const xml = $.parseXML(`<xml>${doc}</xml>`).firstChild;
    const container = $('<div />');

    const magnitude = Number($(xml).find('amt qty').text());
    const units = $(xml).find('amt unit').text();
    $(xml.childNodes).remove('amt');

    const quantity = renderQuantity({
      magnitude: magnitude,
      units: units,
    });
    const quantityHTML = `${quantity.magnitude || ''} ${quantity.units || ''}`.trim();
    container.append($('<div />', {'class': 'quantity', 'html': quantityHTML}));

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
