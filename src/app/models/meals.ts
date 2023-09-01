import { getMealId } from '../common';
import { db } from '../database';

export { removeMeal };

function removeMeal() : void {
  void getMealId(this).then(mealId => { void db.meals.delete(mealId); });
}
