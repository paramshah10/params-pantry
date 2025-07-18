import { scheduler } from 'firebase-functions';
import { Timestamp } from 'firebase-admin/firestore';
export interface Proportion {
    ingredient: string;
    maxQty: string;
    minQty: string;
    quantity: string;
    unit: string;
}
export interface Recipe {
    content?: string;
    created: Timestamp;
    lastCooked: Timestamp;
    name: string;
    proportions?: Proportion[];
    tags: string[];
}
export type RecipeMap = {
    [key: string]: Recipe;
};
export declare const weeklyRecipeUpdate: scheduler.ScheduleFunction;
