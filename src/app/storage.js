import 'jquery';

import * as CRDT from 'delta-crdts';

export { populateStorage, storage, wrapMutators };

var storage = {
  recipes: null,
  starred: null,
  meals: null,
  products: null,
};

function populateStorage() {
  $.each(storage, function (model) {
    var stored = window.localStorage.getItem(model);
    stored = JSON.parse(stored) || {}
    stored = new Map(Object.entries(stored));
    storage[model].apply(stored);
  });
}

function wrapMutators(rwlwwset) {
  var fns = ['add', 'remove'];
  fns.forEach(function(fn) {
    var origFn = rwlwwset[fn];
    rwlwwset[fn] = function(...args) {
      origFn(Date.now(), ...args);
    };
  });
}

$(function() {
  $.each(storage, function (model) {
    var modelStorage = CRDT('rwlwwset')(model);
    wrapMutators(modelStorage);

    modelStorage.load = function() {
      var items = {};
      modelStorage.value().forEach(function (item) {
        items[item.hashCode] = item.value;
      });
      return items;
    };

    modelStorage.save = function() {
      var items = Object.fromEntries(modelStorage.state());
      window.localStorage.setItem(model, JSON.stringify(items));
    };

    storage[model] = modelStorage;
    storage[model].on('state changed', storage[model].save);
  });
});
