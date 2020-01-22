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
    var data = new Map();
    $.each(stored, key => data.set(key, stored[key]));
    storage[model].apply(data);
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
      var state = modelStorage.state();
      var data = {};
      state.forEach((value, key) => data[key] = value);
      window.localStorage.setItem(model, JSON.stringify(data));
    };

    storage[model] = modelStorage;
    storage[model].on('state changed', storage[model].save);
  });
});
