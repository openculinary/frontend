import * as assert from 'assert';

import { pushState } from '../src/app/state';

describe('duplicate state attempts', function() {
  assert.equal(1, window.history.length);
  pushState({}, '#example');
  window.history.go();
  pushState({}, '#example');
  assert.equal(2, window.history.length);
})
