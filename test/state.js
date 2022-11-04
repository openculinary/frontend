import * as assert from 'assert';

import { pushState } from '../src/app/state';

describe('state navigation', function() {

  it('does not add duplicate entries', function () {
    assert.equal(1, window.history.length);
    pushState({}, '#example');
    window.history.go();
    pushState({}, '#example');
    assert.equal(2, window.history.length);
  });

})
