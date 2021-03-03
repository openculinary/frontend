import { getMealId } from '../common';
import { db } from '../database';

export { removeMeal };

function removeMeal() {
  getMealId(this).then(mealId => { db.meals.delete(mealId); });
}
