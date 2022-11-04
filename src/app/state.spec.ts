import * as assert from 'assert';

import { pushState } from './state';

describe('state navigation', function() {

  xit('does not add duplicate entries', function () {
    assert.equal(1, window.history.length);
    pushState({}, '#example');
    window.history.go();
    pushState({}, '#example');
    assert.equal(2, window.history.length);
  });

})
