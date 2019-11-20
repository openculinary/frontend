import './models/search'
import './models/starred'
import './models/meals'
import './views/shopping-list'
import './main.css'

import './collaboration'

import 'jquery';
import { populateStorage } from './storage';
$(populateStorage);

import { recipeFormatter, rowAttributes } from './ui/recipe-list';
export { recipeFormatter, rowAttributes };
