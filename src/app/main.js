import './pages/search'
import './pages/starred'
import './pages/meals'
import './views/products'
import './main.css'

import './collaboration'

import 'jquery';
import { populateStorage } from './storage';
$(populateStorage);

import { recipeFormatter, rowAttributes } from './ui/recipe-list';
export { recipeFormatter, rowAttributes };
