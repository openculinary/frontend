import { renderQuantity } from './conversion';

export { getIngredientQuantity, renderIngredientHTML, renderDirectionHTML };

function getIngredientQuantity(markup) {
    const xml = $.parseXML(`<xml>${markup}</xml>`).firstChild;
    return {
      magnitude: Number($(xml).find('amt qty').text()),
      units: $(xml).find('amt unit').text(),
    };
}

function renderIngredientHTML(ingredient) {
    const xml = $.parseXML(`<xml>${ingredient.markup}</xml>`).firstChild;
    const container = $('<div />');

    const quantity = renderQuantity({
      magnitude: ingredient.quantity,
      units: ingredient.units
    });
    const quantityHTML = `${quantity.magnitude || ''} ${quantity.units || ''}`.trim();
    container.append($('<div />', {'class': 'quantity', 'html': quantityHTML}));

    $(xml.childNodes).remove('amt');
    $(xml).find('ingredient').replaceWith((idx, text) => $('<span />', {'class': 'tag badge', 'text': text}).addClass(ingredient.product && ingredient.product.state));
    container.append($('<div />', {'class': 'product', 'html': xml.childNodes}));

    return container.html();
}

function renderDirectionHTML(direction) {
    const xml = $.parseXML(`<xml>${direction.markup}</xml>`).firstChild;
    const container = $('<div />');

    $(xml).find('mark').replaceWith((idx, text) => $('<span />', {'class': 'equipment tag badge', 'text': text}));
    const directionHTML = $('<li />', {'class': 'direction', 'html': xml.childNodes});

    container.append(directionHTML);
    return container.html();
}
