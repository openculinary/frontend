import * as $ from 'jquery';

import { Ingredient, Direction } from './database';
import { renderQuantity } from './conversion';

export { renderIngredientHTML, renderDirectionHTML };

function renderIngredientHTML(ingredient: Ingredient) : HTMLElement {
    const xml = $.parseXML(`<xml>${ingredient.markup}</xml>`).firstChild;
    const container = $('<div />');

    const quantity = renderQuantity(ingredient.quantity);
    const quantityHTML = `${quantity.magnitude || ''} ${quantity.units || ''}`.trim();
    container.append($('<div />', {'class': 'quantity', 'html': quantityHTML}));

    $(xml.childNodes).remove('amt');
    $(xml).find('ingredient').replaceWith((idx, text) => $('<span />', {'class': 'product', 'text': text}).addClass(ingredient.product && ingredient.product.state));
    container.append($('<div />', {'class': 'ingredient', 'html': xml.childNodes}));

    return container.html();
}

function renderDirectionHTML(direction: Direction) : HTMLElement {
    const xml = $.parseXML(`<xml>${direction.markup}</xml>`).firstChild;
    const container = $('<div />');

    $(xml).find('mark[class*=equipment]').replaceWith((idx, text) => $('<span />', {'class': 'equipment', 'text': text}));
    $(xml).find('mark[class*=action]').replaceWith((idx, text) => $('<span />', {'class': 'action', 'text': text}));
    const directionHTML = $('<li />', {'class': 'direction', 'html': xml.childNodes});

    container.append(directionHTML);
    return container.html();
}
