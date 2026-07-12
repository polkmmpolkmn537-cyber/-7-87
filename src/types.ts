/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type BreadType = 'pita' | 'saj';
export type MeatType = 'chicken' | 'beef' | 'mixed';
export type ServeType = 'sandwich' | 'arabic';

export interface SauceState {
  garlic: boolean; // Toum
  tahini: boolean; // Tarator
  spicy: boolean;  // Shatta
}

export interface FillingState {
  chicken: number;     // amount in portions (0 to 3)
  beef: number;        // amount in portions (0 to 3)
  pickles: boolean;
  fries: boolean;
  pomegranate: boolean; // Debs Remman
}

export interface ShawarmaWrap {
  bread: BreadType | null;
  sauces: SauceState;
  fillings: FillingState;
  isRolled: boolean;
  grillProgress: number; // 0 to 100 (0=raw, 55-75=crispy perfect, >90=burnt)
  isSliced: boolean;    // converted to Arabic meal style
}

export interface CustomerOrder {
  bread: BreadType;
  meat: MeatType;
  garlic: boolean;
  tahini: boolean;
  spicy: boolean;
  pickles: boolean;
  fries: boolean;
  pomegranate: boolean;
  serveType: ServeType;
}

export interface Customer {
  id: string;
  name: string;
  avatar: string;
  order: CustomerOrder;
  patience: number;      // 0 to 100
  maxPatience: number;   // initial patience in seconds
  dialogue: string;      // custom quote matching their personality
  dialogueAr: string;    // Arabic text
  type: 'regular' | 'spicy_lover' | 'impatient' | 'vip' | 'traditional';
}

export interface Inventory {
  pita: number;       // bread count
  saj: number;        // saj bread count
  chicken: number;    // portions of sliced chicken
  beef: number;       // portions of sliced beef
  garlic: number;     // sauce portions
  tahini: number;     // tahini portions
  pickles: number;    // portions
  fries: number;      // portions
  pomegranate: number;// portions
}

export interface InventoryPrices {
  pita: number;
  saj: number;
  chickenMeat: number; // raw chicken to slice
  beefMeat: number;    // raw beef to slice
  garlic: number;
  tahini: number;
  pickles: number;
  fries: number;
  pomegranate: number;
}

export interface ShopUpgrades {
  electricKnife: boolean;   // Slices chicken/beef 2.5x faster
  superGrill: boolean;      // Toasts 2x faster, won't burn past 75% automatically (safety thermostat!)
  quickBurner: boolean;     // Skewers regenerate meat 2x faster
  autoGarlic: boolean;      // One-click perfect saucing
  helperAbuAhmad: boolean;  // Worker bot who slowly slices chicken automatically
  helperAbuToum: boolean;   // Worker bot who slowly replenishes garlic/tahini automatically
  marketingLevel: number;   // 0 to 3, increases customer flow & tips
  unlockedBeef: boolean;    // beef skewer & tahini unlocked
  unlockedSaj: boolean;     // Saj bread unlocked
  arabicMealBoxPro: boolean;   // Unlocks Level 2 Professional 4-Compartment Meal Box
  arabicMealBoxRoyal: boolean; // Unlocks Level 3 Golden Royal 4-Compartment Meal Box
}

export interface DayReport {
  dayNumber: number;
  revenue: number;
  tips: number;
  expenseIngredients: number;
  expenseExpress: number;
  netProfit: number;
  customersServed: number;
  customersAngry: number;
  stars: number; // 1 to 5 stars rating
  funSummary: string;
}
