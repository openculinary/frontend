import * as $ from 'jquery';

import { Ingredient } from './database';
import { renderQuantity } from './conversion';

export { renderIngredientHTML };

function renderIngredientHTML(ingredient: Ingredient) : HTMLElement {
    const xml = $.parseXML(`<xml>${ingredient.markup}</xml>`).firstChild;
    const container = $('<div />');

    const quantity = renderQuantity(ingredient.quantity);
    const quantityHTML = `${quantity.magnitude || ''} ${quantity.units || ''}`.trim();
    container.append($('<div />', {'class': 'quantity', 'html': quantityHTML}));

    $(xml.childNodes).remove('amt');
    $(xml).find('ingredient').replaceWith((idx, text) => $('<span />', {'class': 'product', 'text': text}).addClass(ingredient.product.state));
    container.append($('<div />', {'class': 'ingredient', 'html': xml.childNodes}));

    return container.html();
}
