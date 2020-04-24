import '@ungap/global-this';
import { DOMImplementationImpl, DOMParserImpl, XMLSerializerImpl } from 'xmldom-ts';
import { install, xsltProcess } from 'xslt-ts';

export { renderToHTML };

const template = `
<?xml version="1.0" encoding="utf-8" ?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:template match="/"><div /></xsl:template>
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
