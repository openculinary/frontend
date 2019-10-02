function getRecipe(el) {
  var target = $(el).hasClass('recipe') ? $(el) : $(el).parents('.recipe');
  return {
    id: target.data('id'),
    title: target.data('title'),
    products: target.data('products')
  }
}

function getProductId(el) {
  var target = $(el).hasClass('product') ? $(el) : $(el).parents('.product');
  return target.data('id');
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

function float2rat(x) {
    var tolerance = 1.0E-2;
    var h1=1; var h2=0;
    var k1=0; var k2=1;
    var b = x;
    do {
        var a = Math.floor(b);
        var aux = h1; h1 = a*h1+h2; h2 = aux;
        aux = k1; k1 = a*k1+k2; k2 = aux;
        b = 1/(b-a);
    } while (Math.abs(x-h1/k1) > x*tolerance);

    if (k1 === 1) return h1;
    if (h1 > k1) {
        h1 = Math.floor(h1 / k1);
        return h1+" 1/"+k1;
    }
    return h1+"/"+k1;
}
