import { getMealId } from '../common';
import { db } from '../database';

export { removeMeal };

function removeMeal() : void {
  getMealId(this).then(mealId => { db.meals.delete(mealId); });
}
