import 'array-flat-polyfill';
import '@ungap/global-this';
import { DOMImplementationImpl, DOMParserImpl, XMLSerializerImpl } from 'xmldom-ts';
import { install, xsltProcess } from 'xslt-ts';

export { renderToHTML };

const template = `
<?xml version="1.0" encoding="utf-8" ?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:template match="/">
  <xsl:apply-templates />
</xsl:template>

<xsl:template match="amt">
<div class="quantity">
  <xsl:value-of select="qty/text()" />
  <xsl:text> </xsl:text>
  <xsl:value-of select="unit/text()" />
</div>
</xsl:template>

<xsl:template match="ingredient">
<div class="product"><xsl:value-of select="text()" /></div>
</xsl:template>

</xsl:stylesheet>
`;


function renderToHTML(doc) {
    const parser = new DOMParserImpl();
    const serializer = new XMLSerializerImpl();
    const dom = new DOMImplementationImpl();

    install(parser, serializer, dom);

    const recipeML = parser.parseFromString(doc, 'text/xml');
    const recipeXSLT = parser.parseFromString(template, 'text/xml');

    return xsltProcess(recipeML, recipeXSLT);
}
