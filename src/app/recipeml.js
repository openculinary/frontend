import { xsltProcess } from 'xslt-processor'

import { renderQuantity } from './conversion';

export { renderToHTML, renderDirectionHTML };

const template = `
<?xml version="1.0" encoding="utf-8" ?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:template match="/">
  <xml>
    <xsl:apply-templates select="//amt" />
    <xsl:apply-templates select="//ingredient" />
  </xml>
</xsl:template>

<xsl:template match="text()">
  <xsl:if test="not(. = 'undefined')">
  <xsl:value-of select="." />
  </xsl:if>
</xsl:template>

<xsl:template match="amt">
<div class="quantity">
  <xsl:apply-templates select="qty" />
  <xsl:apply-templates select="unit" />
</div>
</xsl:template>

<xsl:template match="qty|unit">
  <xsl:apply-templates select="node()" />
</xsl:template>

<xsl:template match="ingredient">
<div class="product">
<xsl:apply-templates select="preceding-sibling::text()" />
<span class="tag badge">
  <xsl:apply-templates select="node()" />
</span>
<xsl:apply-templates select="following-sibling::text()" />
</div>
</xsl:template>

</xsl:stylesheet>
`.trim();


function renderToHTML(doc, state) {
    const recipeML = $.parseXML(`<xml>${doc}</xml>`);
    const recipeXSLT = $.parseXML(template);
    var recipeHTML = $(xsltProcess(recipeML, recipeXSLT));

    recipeHTML.find('div.product span.tag').addClass(state);

    if (!recipeHTML.find('div.quantity').length) {
      recipeHTML.prepend($('<div>', {'class': 'quantity'}));
    }

    const quantity = renderQuantity({
      magnitude: Number($(recipeML).find('qty').text()),
      units: $(recipeML).find('unit').text(),
    });
    const quantityText = `${quantity.magnitude || ''} ${quantity.units || ''}`.trim();
    recipeHTML.find('div.quantity').html(quantityText);

    return recipeHTML.children().get().map(node => node.outerHTML).join('');
}

function renderDirectionHTML(doc) {
    const xml = $.parseXML(`<xml>${doc}</xml>`).firstChild;
    const container = $('<div />');

    $(xml).find('mark').replaceWith((idx, text) => $('<div />', {'class': 'equipment', 'text': text}));
    const direction = $('<li />', {'html': xml.childNodes});

    container.append(direction);
    return container.html();
}
