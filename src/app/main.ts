import '@fortawesome/fontawesome-free/css/fontawesome.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-table/dist/bootstrap-table.css';
import 'select2/dist/css/select2.css';
import 'tablesaw/dist/stackonly/tablesaw.stackonly.css';

import './dialogs/about';
import './dialogs/about.css';
import './views/recipe';
import './views/recipe.css';
import './views/search';
import './views/search.css';
import './views/starred';
import './views/starred.css';
import './views/meals';
import './views/meals.css';
import './views/shopping-list';
import './views/shopping-list.css';
import './views/components/recipe-list';
import './views/components/recipe-list.css';
import './main.css';

import 'jquery';
import { Database } from './database';
import { populateStorage } from './storage';
$(populateStorage);

import { recipeFormatter, rowAttributes } from './views/components/recipe-list';
export { recipeFormatter, rowAttributes };
