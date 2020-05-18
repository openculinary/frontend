const { i18nextToPot } = require('i18next-conv');
const Vinyl = require('vinyl');

module.exports = {
  input: [
    'src/**/*.{html,js}',
  ],
  options: {
    func: {
      list: ['i18nAttr'],
      extensions: ['.js'],
    },
    contextSeparator: '|',
    pluralSeparator: '|',
    ns: [
      'categories',
      'footer',
      'meal-planner',
      'navigation',
      'search',
      'shopping-list',
      'starred-recipes',
    ],
    resource: {
      savePath: 'i18n/locales/templates/{{ns}}.pot',
    },
  },
  flush: function() {
    resources = this.parser.get();
    Object.keys(resources).forEach(lng => {
      const namespaces = resources[lng];
      Object.keys(namespaces).forEach(ns => {
        const object = namespaces[ns];
        if (Object.keys(object).length == 0) return;
        const path = this.parser.formatResourceSavePath(lng, ns);
        const json = JSON.stringify(object, null, false);
        const options = {
          keyseparator: this.parser.options.keySeparator,
          ctxSeparator: this.parser.options.contextSeparator,
          ignorePlurals: !this.parser.options.plural,
        }
        i18nextToPot(lng, json, options).then(buffer => {
          this.push(new Vinyl({
            path: path,
            contents: Buffer.from(buffer.toString() + '\n')
          }));
        });
      });
    });
  }
};
