import '@fortawesome/fontawesome-free/css/fontawesome.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import 'select2/dist/css/select2.css';

import './dialogs/about';
import './views/recipe';
import './views/search';
import './views/starred';
import './views/meals';
import './views/shopping-list';
import './views/shopping-list.css';
import './main.css';

import 'jquery';
import { populateStorage } from './storage';
$(populateStorage);

import { recipeFormatter, rowAttributes } from './views/components/recipe-list';
export { recipeFormatter, rowAttributes };
