import '@fortawesome/fontawesome-free/css/fontawesome.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

import './views/search';
import './views/starred';
import './views/meals';
import './views/shopping-list';
import './main.css';

import './collaboration';

import 'jquery';
import { populateStorage } from './storage';
$(populateStorage);

import { recipeFormatter, rowAttributes } from './ui/recipe-list';
export { recipeFormatter, rowAttributes };
