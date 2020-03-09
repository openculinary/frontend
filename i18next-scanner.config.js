const { i18nextToPo } = require('i18next-conv');
const VirtualFile = require('vinyl');

module.exports = {
  input: [
    'src/**/*.{html,js}',
  ],
  options: {
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
      loadPath: 'public/locales/{{lng}}/{{ns}}.json',
      savePath: 'i18n/locales/templates/{{ns}}.json',
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
        i18nextToPo(lng, json, options).then(buffer => {
          this.push(new VirtualFile({
            path: path.replace('.json', '.po'),
            contents: Buffer.from(buffer)
          }));
        });
      });
    });
  }
};
