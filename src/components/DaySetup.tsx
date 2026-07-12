/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Inventory, InventoryPrices, ShopUpgrades } from '../types';
import { ShoppingCart, Package, Info, ArrowLeftRight, CheckSquare, Plus, Minus, Zap } from 'lucide-react';
import { sfx } from '../utils/audio';

interface DaySetupProps {
  money: number;
  inventory: Inventory;
  upgrades: ShopUpgrades;
  prices: InventoryPrices;
  onBuyIngredients: (items: Partial<Inventory>, totalCost: number) => void;
  onStartDay: () => void;
  dayNumber: number;
}

export const DaySetup: React.FC<DaySetupProps> = ({
  money,
  inventory,
  upgrades,
  prices,
  onBuyIngredients,
  onStartDay,
  dayNumber,
}) => {
  // Temporary shopping cart state
  const [cart, setCart] = useState<Partial<Inventory>>({
    pita: 0,
    saj: 0,
    chicken: 0,
    beef: 0,
    garlic: 0,
    tahini: 0,
    pickles: 0,
    fries: 0,
    pomegranate: 0,
  });

  const handleAdjustCart = (key: keyof Inventory, delta: number) => {
    setCart((prev) => {
      const currentVal = prev[key] || 0;
      const newVal = Math.max(0, currentVal + delta);

      // Sfx
      if (newVal !== currentVal) {
        sfx.playWrap();
      }

      return {
        ...prev,
        [key]: newVal,
      };
    });
  };

  const getCartTotalCost = () => {
    let total = 0;
    total += (cart.pita || 0) * prices.pita;
    total += (cart.saj || 0) * prices.saj;
    total += (cart.chicken || 0) * prices.chickenMeat;
    total += (cart.beef || 0) * prices.beefMeat;
    total += (cart.garlic || 0) * prices.garlic;
    total += (cart.tahini || 0) * prices.tahini;
    total += (cart.pickles || 0) * prices.pickles;
    total += (cart.fries || 0) * prices.fries;
    total += (cart.pomegranate || 0) * prices.pomegranate;
    return total;
  };

  const totalCost = getCartTotalCost();
  const canAfford = money >= totalCost;

  const handleCheckout = () => {
    if (totalCost === 0) return;
    if (!canAfford) {
      sfx.playSadBuzz();
      return;
    }

    sfx.playCoin();
    onBuyIngredients(cart, totalCost);
    // Reset cart after buying
    setCart({
      pita: 0,
      saj: 0,
      chicken: 0,
      beef: 0,
      garlic: 0,
      tahini: 0,
      pickles: 0,
      fries: 0,
      pomegranate: 0,
    });
  };

  const ingredientSpecs = [
    { key: 'pita' as keyof Inventory, name: '🫓 خبز عربي كلاسيكي', price: prices.pita, available: true, unit: 'رغيف' },
    { key: 'saj' as keyof Inventory, name: '🌯 خبز صاج ملكي', price: prices.saj, available: upgrades.unlockedSaj, unit: 'رغيف' },
    { key: 'chicken' as keyof Inventory, name: '🍗 لحم دجاج خام للسيخ', price: prices.chickenMeat, available: true, unit: 'حصة استواء' },
    { key: 'beef' as keyof Inventory, name: '🥩 لحم عجل خام للسيخ', price: prices.beefMeat, available: upgrades.unlockedBeef, unit: 'حصة استواء' },
    { key: 'garlic' as keyof Inventory, name: '🧄 حصص صوص الثومية', price: prices.garlic, available: !upgrades.autoGarlic, unit: 'حصة صوص' },
    { key: 'tahini' as keyof Inventory, name: '🧅 حصص صوص الطحينة', price: prices.tahini, available: upgrades.unlockedBeef && !upgrades.autoGarlic, unit: 'حصة صوص' },
    { key: 'pickles' as keyof Inventory, name: '🥒 مخلل مقطع شرائح', price: prices.pickles, available: true, unit: 'وعاء شرائح' },
    { key: 'fries' as keyof Inventory, name: '🍟 بطاطا أصابع للقلي', price: prices.fries, available: true, unit: 'سلة للقلي' },
    { key: 'pomegranate' as keyof Inventory, name: '🍯 دبس رمان فاخر', price: prices.pomegranate, available: true, unit: 'حصة صوص' },
  ];

  return (
    <div id="day-setup" className="bg-slate-900/85 backdrop-blur-md rounded-2xl p-6 border border-slate-800 text-white shadow-xl max-w-4xl mx-auto flex flex-col gap-6">
      {/* Title & Day banner */}
      <div className="text-center space-y-2 border-b border-slate-800 pb-5">
        <span className="text-xs font-black uppercase bg-amber-500/15 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full">
          مرحلة التموين والتجهيز
        </span>
        <h2 className="text-2xl font-black font-sans tracking-tight">تجهيز مستودع اليوم رقم {dayNumber}</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          قم بشراء المواد الخام اللازمة لتلبية طلبات الزبائن وتفادي نفاد المكونات أثناء Rush Hour! شراء المواد الآن أرخص بكثير من التوصيل السريع الطارئ أثناء الضغط.
        </p>
      </div>

      {/* Main shopping grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: shopping selection items (Col-span 7) */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-xs text-slate-400 font-bold flex items-center gap-1.5 px-1">
            <Package className="w-4 h-4 text-slate-400" />
            قائمة التموينات والمواد المتاحة
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
            {ingredientSpecs.map((item) => {
              if (!item.available) return null;

              const inCart = cart[item.key] || 0;
              const inStock = inventory[item.key];

              return (
                <div
                  key={item.key}
                  className="bg-slate-950/80 rounded-xl p-3 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between gap-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-slate-100">{item.name}</h4>
                      <span className="text-[10px] text-slate-500 font-sans block mt-0.5">
                        الوحدة: {item.unit} • السعر: ${item.price.toFixed(2)}
                      </span>
                    </div>
                    <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                      الموجود: {inStock}
                    </span>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center justify-between border-t border-slate-900/60 pt-2">
                    <span className="text-[10px] text-slate-400">إضافة للسلة:</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAdjustCart(item.key, -5)}
                        disabled={inCart <= 0}
                        className="w-6 h-6 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-xs font-bold transition-all cursor-pointer"
                        title="طرح 5"
                      >
                        -5
                      </button>
                      <button
                        onClick={() => handleAdjustCart(item.key, -1)}
                        disabled={inCart <= 0}
                        className="w-6 h-6 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-xs font-bold transition-all cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-mono font-bold text-amber-400">
                        {inCart}
                      </span>
                      <button
                        onClick={() => handleAdjustCart(item.key, 1)}
                        className="w-6 h-6 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 flex items-center justify-center text-xs font-bold transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleAdjustCart(item.key, 5)}
                        className="w-6 h-6 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 flex items-center justify-center text-xs font-bold transition-all cursor-pointer"
                        title="إضافة 5"
                      >
                        +5
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: cart checkout & launch day (Col-span 5) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Checkout Invoice Card */}
          <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 flex flex-col gap-4">
            <h3 className="text-xs text-slate-400 font-bold flex items-center gap-1.5 border-b border-slate-900 pb-2">
              <ShoppingCart className="w-4 h-4 text-amber-500" />
              فاتورة المشتريات الحالية
            </h3>

            {/* Shopping Cart List */}
            <div className="space-y-2 max-h-[160px] overflow-y-auto text-xs pr-1">
              {ingredientSpecs.map((spec) => {
                const qty = cart[spec.key] || 0;
                if (qty === 0) return null;
                const cost = qty * spec.price;
                return (
                  <div key={spec.key} className="flex justify-between text-slate-300 font-sans">
                    <span>{spec.name} x{qty}</span>
                    <span className="font-mono text-slate-400">${cost.toFixed(2)}</span>
                  </div>
                );
              })}

              {totalCost === 0 && (
                <div className="text-center py-6 text-slate-600 text-xs italic">
                  السلة فارغة. اضبط الكميات لتجهيز طلبك.
                </div>
              )}
            </div>

            {/* Invoice Summary */}
            <div className="border-t border-slate-900/80 pt-3 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">الرصيد المتوفر:</span>
                <span className="font-mono font-bold text-slate-200">${money.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 font-bold">إجمالي الفاتورة:</span>
                <span className={`font-mono font-black ${canAfford ? 'text-amber-400' : 'text-rose-500'}`}>
                  ${totalCost.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Purchase action */}
            <button
              onClick={handleCheckout}
              disabled={totalCost === 0 || !canAfford}
              className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                totalCost > 0 && canAfford
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 active:scale-[0.98] shadow-lg shadow-orange-500/10'
                  : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
              }`}
            >
              <span>دفع وشحن المستودع</span>
            </button>
          </div>

          {/* Let's Roll / Start Day Trigger */}
          <div className="bg-slate-950/40 border border-slate-800/40 rounded-xl p-4 flex flex-col gap-3 justify-center items-center text-center">
            <div className="space-y-1">
              <h4 className="text-xs text-emerald-400 font-bold">جاهز لاستقبال الطابور؟</h4>
              <p className="text-[11px] text-slate-500 max-w-[220px]">
                بمجرد البدء، ستتدفق طلبات الزبائن لمدة دقيقتين متواصلتين. لا تدع الشاورما تحترق!
              </p>
            </div>

            <button
              onClick={onStartDay}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black text-sm transition-all shadow-lg shadow-emerald-500/15 active:scale-[0.98] cursor-pointer"
            >
              🚀 ابدأ يوم العمل رقم {dayNumber}!
            </button>
          </div>
        </div>
      </div>

      {/* Warnings & Notes */}
      <div className="bg-slate-950/40 rounded-xl p-3.5 border border-slate-800/60 flex gap-2.5 text-xs text-slate-400 font-sans">
        <Info className="w-5 h-5 text-amber-400 shrink-0" />
        <div className="space-y-1">
          <p className="font-bold text-slate-300">💡 تذكير التوصيل الطارئ:</p>
          <p className="leading-relaxed text-[11px]">
            إذا نفدت أي مادة أثناء ضغط العمل، يمكنك النقر على زر التوصيل الطارئ في واجهة اللعبة لشحن مستودعك فوراً وبشكل أسرع، ولكن بزيادة سعر تبلغ <span className="text-amber-400 font-bold">40%</span> مقارنة بأسعار التموين الهادئة المتاحة حالياً في هذه الشاشة.
          </p>
        </div>
      </div>
    </div>
  );
};
