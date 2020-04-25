import { xsltProcess, xmlParse } from 'xslt-processor'

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
  <xsl:if test="qty and unit"><xsl:text> </xsl:text></xsl:if>
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
`;


function renderToHTML(doc) {
    const recipeML = xmlParse(`<xml>${doc}</xml>`);
    const recipeXSLT = xmlParse(template);

    return xsltProcess(recipeML, recipeXSLT);
}
