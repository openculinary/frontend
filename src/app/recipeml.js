import { xsltProcess } from 'xslt-processor'

import { renderQuantity } from './conversion';

export { renderToHTML };

const template = `
<?xml version="1.0" encoding="utf-8" ?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:template match="/">
  <xsl:apply-templates select="//amt" />
  <xsl:apply-templates select="//ingredient" />
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
<span class="tag badge required">
  <xsl:apply-templates select="node()" />
</span>
<xsl:apply-templates select="following-sibling::text()" />
</div>
</xsl:template>

</xsl:stylesheet>
`.trim();


function renderToHTML(doc) {
    const recipeML = $.parseXML(`<xml>${doc}</xml>`);
    const recipeXSLT = $.parseXML(template);
    var recipeHTML = $(xsltProcess(recipeML, recipeXSLT));

    const quantity = renderQuantity({
        magnitude: Number($(recipeML).find('qty').text()),
        units: $(recipeML).find('unit').text(),
    });
    const quantityText = `${quantity.magnitude || ''} ${quantity.units || ''}`.trim();

    recipeHTML.filter('div.quantity').text(quantityText);
    return recipeHTML.get().map(node => node.outerHTML).join('');
}
