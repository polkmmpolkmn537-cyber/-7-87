/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Inventory, ShawarmaWrap, ShopUpgrades } from '../types';
import { Trash2, ShoppingBag, CheckCircle, Info, Flame, Grid, Scissors } from 'lucide-react';
import { sfx } from '../utils/audio';

interface WorkstationProps {
  inventory: Inventory;
  upgrades: ShopUpgrades;
  currentWrap: ShawarmaWrap | null;
  isDayActive: boolean;
  onUpdateWrap: (wrap: ShawarmaWrap | null) => void;
  onConsumeInventory: (item: keyof Inventory, amount: number) => void;
  onRefundInventory: (items: Partial<Inventory>) => void; // in case of trash, refund bread only or none
}

export const Workstation: React.FC<WorkstationProps> = ({
  inventory,
  upgrades,
  currentWrap,
  isDayActive,
  onUpdateWrap,
  onConsumeInventory,
  onRefundInventory,
}) => {
  const [isGrilling, setIsGrilling] = useState(false);
  const [showGrillSmoke, setShowGrillSmoke] = useState(false);

  // Interactive slicing and packing mechanics
  const [isSlicingMode, setIsSlicingMode] = useState(false);
  const [sliceCuts, setSliceCuts] = useState<number[]>([]);
  const [isPackingMode, setIsPackingMode] = useState(false);
  const [packedCompartments, setPackedCompartments] = useState({
    shawarma: false,
    sauce1: false,
    pickles: false,
    sauce2: false,
  });

  // Auto-Grilling loop
  useEffect(() => {
    if (!isGrilling || !currentWrap || !currentWrap.isRolled) {
      setIsGrilling(false);
      return;
    }

    const interval = setInterval(() => {
      onUpdateWrap((prev) => {
        if (!prev) return null;
        const speed = upgrades.superGrill ? 4 : 2.5; // superGrill toasts faster
        const nextProgress = Math.min(100, prev.grillProgress + speed);

        // Safety thermostat for superGrill: it triggers a warning bell and slows down or caps at 80% unless pressed again
        if (upgrades.superGrill && nextProgress >= 80 && prev.grillProgress < 80) {
          sfx.playDoorBell(); // alert ding
        }

        if (nextProgress >= 90 && prev.grillProgress < 90) {
          sfx.playSadBuzz(); // Burn sound
        }

        return {
          ...prev,
          grillProgress: nextProgress,
        };
      });
    }, 150);

    return () => clearInterval(interval);
  }, [isGrilling, upgrades.superGrill, onUpdateWrap]);

  // Handle grilling sound
  useEffect(() => {
    if (isGrilling) {
      const sizzleInterval = setInterval(() => {
        sfx.playSizzle(0.3, 0.1);
      }, 300);
      return () => clearInterval(sizzleInterval);
    }
  }, [isGrilling]);

  // Smoke effects on high grilling progress
  useEffect(() => {
    if (currentWrap && currentWrap.isRolled && currentWrap.grillProgress > 65) {
      setShowGrillSmoke(true);
    } else {
      setShowGrillSmoke(false);
    }
  }, [currentWrap]);

  // Helper Abu Toum: automated garlic refill
  useEffect(() => {
    if (!isDayActive || !upgrades.helperAbuToum) return;

    const interval = setInterval(() => {
      // replenishes garlic and tahini in shop stock
      onRefundInventory({ garlic: 1, tahini: 1 });
      sfx.playWrap();
    }, 8000);

    return () => clearInterval(interval);
  }, [isDayActive, upgrades.helperAbuToum, onRefundInventory]);

  // Actions
  const handleTakeBread = (type: 'pita' | 'saj') => {
    if (!isDayActive) return;
    if (currentWrap) return; // already has a wrap on board

    const stock = type === 'pita' ? inventory.pita : inventory.saj;
    if (stock <= 0) {
      sfx.playSadBuzz();
      return;
    }

    // Play sound
    sfx.playWrap();

    // Consume bread
    onConsumeInventory(type, 1);

    // Initialize wrap state
    const newWrap: ShawarmaWrap = {
      bread: type,
      sauces: { garlic: false, tahini: false, spicy: false },
      fillings: { chicken: 0, beef: 0, pickles: false, fries: false, pomegranate: false },
      isRolled: false,
      grillProgress: 0,
      isSliced: false,
    };
    onUpdateWrap(newWrap);
  };

  const handleAddSauce = (sauceType: 'garlic' | 'tahini' | 'spicy') => {
    if (!currentWrap || currentWrap.isRolled) return;

    // Check inventory for non-spicy sauces
    if (sauceType === 'garlic' && inventory.garlic <= 0 && !upgrades.autoGarlic) {
      sfx.playSadBuzz();
      return;
    }
    if (sauceType === 'tahini' && inventory.tahini <= 0 && !upgrades.autoGarlic) {
      sfx.playSadBuzz();
      return;
    }

    // Play sauce smear sound
    sfx.playWrap();

    if (!upgrades.autoGarlic) {
      if (sauceType === 'garlic') onConsumeInventory('garlic', 1);
      if (sauceType === 'tahini') onConsumeInventory('tahini', 1);
    }

    onUpdateWrap({
      ...currentWrap,
      sauces: {
        ...currentWrap.sauces,
        [sauceType]: true,
      },
    });
  };

  const handleAddMeat = (meatType: 'chicken' | 'beef') => {
    if (!currentWrap || currentWrap.isRolled) return;

    // Check sliced inventory
    const meatStock = meatType === 'chicken' ? inventory.chicken : inventory.beef;
    if (meatStock <= 0) {
      sfx.playSadBuzz();
      return;
    }

    sfx.playSizzle(0.15, 0.08);

    onConsumeInventory(meatType, 1);

    onUpdateWrap({
      ...currentWrap,
      fillings: {
        ...currentWrap.fillings,
        [meatType]: Math.min(3, currentWrap.fillings[meatType] + 1), // Max 3 portions
      },
    });
  };

  const handleAddExtra = (extraType: 'pickles' | 'fries' | 'pomegranate') => {
    if (!currentWrap || currentWrap.isRolled) return;

    // Check stock
    if (extraType === 'pickles' && inventory.pickles <= 0) {
      sfx.playSadBuzz();
      return;
    }
    if (extraType === 'fries' && inventory.fries <= 0) {
      sfx.playSadBuzz();
      return;
    }
    if (extraType === 'pomegranate' && inventory.pomegranate <= 0) {
      sfx.playSadBuzz();
      return;
    }

    sfx.playWrap();

    onConsumeInventory(extraType, 1);

    onUpdateWrap({
      ...currentWrap,
      fillings: {
        ...currentWrap.fillings,
        [extraType]: true,
      },
    });
  };

  const handleRoll = () => {
    if (!currentWrap || currentWrap.isRolled) return;
    sfx.playWrap();
    onUpdateWrap({
      ...currentWrap,
      isRolled: true,
    });
  };

  const handleSliceMeal = () => {
    if (!currentWrap || !currentWrap.isRolled || currentWrap.isSliced) return;
    if (currentWrap.grillProgress < 40) {
      // Must be toasted first!
      sfx.playSadBuzz();
      return;
    }

    sfx.playSlice();
    setIsSlicingMode(true);
    setSliceCuts([]);
    setIsPackingMode(false);
    setPackedCompartments({
      shawarma: false,
      sauce1: false,
      pickles: false,
      sauce2: false,
    });
  };

  const handleTrash = () => {
    if (!currentWrap) return;
    sfx.playSadBuzz();
    onUpdateWrap(null);
  };

  const getGrillStatusText = (progress: number) => {
    if (progress === 0) return 'بارد (غير محمص)';
    if (progress < 30) return 'بدأ يسخن...';
    if (progress < 55) return 'نصف تحميص...';
    if (progress <= 78) return '🔥 محمص مقرمش ذهبي! (مثالي)';
    if (progress < 90) return 'حروق خفيفة (انتبه!)';
    return '💀 تفحم واحترق! (غير قابل للأكل)';
  };

  const getGrillStatusColor = (progress: number) => {
    if (progress === 0) return 'text-slate-400';
    if (progress < 55) return 'text-yellow-500';
    if (progress <= 78) return 'text-emerald-400 font-bold drop-shadow-md animate-pulse';
    if (progress < 90) return 'text-orange-500';
    return 'text-rose-600 font-black animate-bounce';
  };

  return (
    <div id="workstation" className="bg-slate-900/85 backdrop-blur-md rounded-2xl p-3 sm:p-5 border border-slate-800 text-white shadow-xl flex flex-col gap-4 sm:gap-5 h-full">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ShoppingBag className="text-amber-500 w-5 h-5" />
          <h2 className="text-sm sm:text-lg font-bold font-sans">طاولة تحضير الشاورما</h2>
        </div>
        <div className="text-[10px] sm:text-xs text-slate-400">
          {currentWrap ? (
            <span className="bg-amber-500/10 text-amber-400 px-2 sm:px-2.5 py-0.5 rounded border border-amber-500/20">
              قيد التحضير حالياً
            </span>
          ) : (
            <span className="bg-slate-800 text-slate-400 px-2 sm:px-2.5 py-0.5 rounded border border-slate-700">
              طاولة فارغة
            </span>
          )}
        </div>
      </div>

      {/* Main Work Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 flex-1 items-start">
        {/* Left column: Visual plate container (Col-span 7) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center bg-slate-950/80 rounded-2xl p-3 sm:p-4 border border-slate-800/80 h-full min-h-[220px] sm:min-h-[340px] relative overflow-hidden group">
          {showGrillSmoke && (
            <div className="absolute inset-0 bg-slate-900/40 pointer-events-none z-30 flex items-center justify-center">
              <span className="text-[9px] sm:text-[10px] text-orange-400 bg-orange-950/80 border border-orange-500/30 px-3 py-1 rounded-full animate-pulse">
                💨 الدخان يتصاعد من الكبّاسة! {currentWrap && currentWrap.grillProgress >= 90 ? 'احترقت!' : 'محمص جاهز!'}
              </span>
            </div>
          )}

          {currentWrap ? (
            <div className="w-full flex flex-col items-center justify-between h-full gap-3 sm:gap-4">
              {/* Sandwich Graphic Display */}
              <div className="flex-1 flex items-center justify-center relative w-full h-32 sm:h-44 my-2">
                {/* Visual Plate */}
                <div className="w-44 h-44 sm:w-64 sm:h-64 rounded-full bg-slate-900/50 border-4 border-dashed border-slate-800/60 absolute -z-10 group-hover:border-slate-700/60 transition-all" />

                {/* Flat Bread view */}
                {!currentWrap.isRolled ? (
                  <div
                    className={`w-36 h-36 sm:w-52 sm:h-52 rounded-full relative shadow-2xl border-2 transition-transform duration-300 ${
                      currentWrap.bread === 'saj'
                        ? 'bg-[#E3C598] border-[#c09d66] scale-105' // Saj is brownish/larger
                        : 'bg-[#F9F5EC] border-[#EADFCB]' // Pita is white/smaller
                    }`}
                  >
                    {/* BREAD TEXTURE BACKGROUND */}
                    <div className="absolute inset-2 sm:inset-4 rounded-full border border-amber-900/5 opacity-20" />
                    <div className="absolute inset-6 sm:inset-10 rounded-full border border-amber-900/5 opacity-20" />

                    {/* Dynamic sauces visuals */}
                    {currentWrap.sauces.garlic && (
                      <div className="absolute inset-5 sm:inset-8 bg-gradient-to-r from-stone-100/60 to-transparent blur-sm rounded-full transform -rotate-12" />
                    )}
                    {currentWrap.sauces.tahini && (
                      <div className="absolute inset-8 sm:inset-12 bg-gradient-to-tr from-amber-800/20 to-transparent blur-md rounded-full transform rotate-45" />
                    )}
                    {currentWrap.sauces.spicy && (
                      <div className="absolute inset-4 sm:inset-6 bg-rose-500/10 blur-[8px] rounded-full" />
                    )}

                    {/* Center stuffing representation */}
                    <div className="absolute inset-8 sm:inset-12 flex flex-col items-center justify-center gap-0.5 sm:gap-1 overflow-hidden pointer-events-none">
                      {/* Slices representation */}
                      {currentWrap.fillings.chicken > 0 && (
                        <div className="flex flex-wrap gap-0.5 justify-center">
                          {Array.from({ length: currentWrap.fillings.chicken }).map((_, i) => (
                            <span key={i} className="w-5 h-2.5 sm:w-7 sm:h-3.5 bg-amber-600 rounded-sm shadow-sm" />
                          ))}
                        </div>
                      )}
                      {currentWrap.fillings.beef > 0 && (
                        <div className="flex flex-wrap gap-0.5 justify-center">
                          {Array.from({ length: currentWrap.fillings.beef }).map((_, i) => (
                            <span key={i} className="w-5 h-2.5 sm:w-7 sm:h-3.5 bg-red-900 rounded-sm shadow-sm" />
                          ))}
                        </div>
                      )}

                      {/* Pickles */}
                      {currentWrap.fillings.pickles && (
                        <div className="flex gap-1">
                          <span className="w-5 h-1.5 sm:w-8 sm:h-2 bg-emerald-500 rounded-full" />
                          <span className="w-4 h-1.5 sm:w-6 sm:h-2 bg-emerald-600 rounded-full transform rotate-12" />
                        </div>
                      )}

                      {/* Fries */}
                      {currentWrap.fillings.fries && (
                        <div className="flex gap-1 mt-1">
                          <span className="w-7 h-1 sm:w-10 sm:h-1.5 bg-yellow-400 rounded" />
                          <span className="w-5 h-1 sm:w-8 sm:h-1.5 bg-yellow-500 rounded transform -rotate-6" />
                        </div>
                      )}

                      {/* Pomegranate molasses */}
                      {currentWrap.fillings.pomegranate && (
                        <div className="absolute inset-0 bg-purple-950/10 flex items-center justify-center">
                          <span className="w-full h-0.5 sm:h-1 bg-purple-950/60 transform rotate-12 blur-[1px]" />
                          <span className="w-full h-0.5 sm:h-1 bg-purple-950/60 transform -rotate-12 blur-[1px]" />
                        </div>
                      )}
                    </div>

                    {/* Bread details overlay */}
                    <span className="absolute bottom-1 sm:bottom-2 left-1/2 -translate-x-1/2 text-[8px] sm:text-[9px] bg-slate-900/80 text-amber-200 px-1.5 sm:px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
                      {currentWrap.bread === 'saj' ? 'خبز صاج مفرود' : 'خبز عربي مفتوح'}
                    </span>
                  </div>
                ) : (
                  /* ROLLED / WRAPPED VIEW */
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div
                      className={`h-10 sm:h-12 rounded-full relative shadow-2xl transition-all duration-300 flex items-center justify-between px-2 sm:px-3 border-2 overflow-hidden ${
                        currentWrap.grillProgress >= 90
                          ? 'bg-neutral-900 border-neutral-950 w-40 sm:w-52 scale-95 animate-pulse' // Burnt
                          : currentWrap.grillProgress >= 55
                          ? 'bg-amber-800 border-amber-950 w-44 sm:w-56' // Perfectly toasted
                          : 'bg-[#F2E6D0] border-[#cbb393] w-40 sm:w-52' // Standard Rolled
                      }`}
                    >
                      {/* Wrapped paper look on left part */}
                      <div className="absolute left-0 top-0 bottom-0 w-1/3 bg-slate-100/90 border-r border-slate-300 flex items-center justify-center">
                        <span className="text-[7px] sm:text-[8px] text-slate-500 font-bold rotate-90 uppercase">شاورما</span>
                      </div>

                      {/* Grill marks fading in based on grillProgress */}
                      {currentWrap.grillProgress > 10 && (
                        <div
                          className="absolute inset-0 bg-repeat-x flex justify-around pointer-events-none opacity-80"
                          style={{
                            backgroundImage: 'linear-gradient(90deg, #513511 20%, transparent 20%)',
                            backgroundSize: '12px 100%',
                            opacity: currentWrap.grillProgress / 100,
                          }}
                        />
                      )}

                      {/* Slices of meat popping out of right rolled side */}
                      <div className="w-5 sm:w-6 h-full bg-amber-700/80 rounded-r-full absolute right-0 flex flex-col gap-0.5 items-center justify-center py-1">
                        <span className="w-2 h-0.5 sm:w-2.5 sm:h-1 bg-yellow-400 rounded" />
                        <span className="w-2.5 h-0.5 sm:w-3.5 sm:h-1 bg-amber-900 rounded" />
                        <span className="w-2 h-0.5 sm:w-2.5 sm:h-1 bg-green-500 rounded" />
                      </div>
                    </div>

                    {/* Sliced Meal Box representation */}
                    {currentWrap.isSliced && (
                      <div className="mt-1.5 bg-amber-400/10 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-bold flex items-center gap-1">
                        <Scissors className="w-3.5 h-3.5" />
                        <span>مقطّعة وجبة عربي بالعلبة 🍱</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Toasting controls if rolled */}
              {currentWrap.isRolled && (
                <div className="w-full bg-slate-900 rounded-xl p-2.5 sm:p-3 border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-[10px] sm:text-xs">
                    <span className="flex items-center gap-1">
                      <Flame className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isGrilling ? 'text-orange-500 animate-bounce' : 'text-slate-500'}`} />
                      حالة التحميص بالكبارة:
                    </span>
                    <span className={getGrillStatusColor(currentWrap.grillProgress)}>
                      {getGrillStatusText(currentWrap.grillProgress)}
                    </span>
                  </div>

                  {/* Toast progress bar */}
                  <div className="w-full bg-slate-950 h-3 sm:h-3.5 rounded-full overflow-hidden border border-slate-800 relative">
                    <div
                      className={`h-full transition-all duration-150 ${
                        currentWrap.grillProgress >= 90
                          ? 'bg-neutral-900'
                          : currentWrap.grillProgress >= 55
                          ? 'bg-gradient-to-r from-emerald-500 to-amber-500'
                          : 'bg-yellow-500'
                      }`}
                      style={{ width: `${currentWrap.grillProgress}%` }}
                    />
                    {/* Perfect target marker zone (55% to 78%) */}
                    <div className="absolute top-0 bottom-0 left-[55%] right-[22%] bg-emerald-400/20 border-x border-dashed border-emerald-400 pointer-events-none flex items-center justify-center text-[7px] sm:text-[8px] text-emerald-400 font-bold">
                      مقرمشة مثالية
                    </div>
                  </div>

                  {/* Toast Buttons */}
                  <div className="flex gap-2">
                    <button
                      onMouseDown={() => setIsGrilling(true)}
                      onMouseUp={() => setIsGrilling(false)}
                      onMouseLeave={() => setIsGrilling(false)}
                      onTouchStart={() => setIsGrilling(true)}
                      onTouchEnd={() => setIsGrilling(false)}
                      disabled={currentWrap.grillProgress >= 100}
                      className={`flex-1 py-1.5 sm:py-2 rounded-lg font-bold text-[10px] sm:text-xs flex items-center justify-center gap-1 sm:gap-1.5 transition-all select-none cursor-pointer ${
                        currentWrap.grillProgress >= 100
                          ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'
                          : isGrilling
                          ? 'bg-orange-600 text-white shadow-inner animate-pulse'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 active:scale-[0.98]'
                      }`}
                    >
                      <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span>اضغط باستمرار للتحميص (كبس)</span>
                    </button>

                    {/* Cut to Arabic Meal Box */}
                    <button
                      onClick={handleSliceMeal}
                      disabled={currentWrap.grillProgress < 40 || currentWrap.isSliced}
                      className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg font-bold text-[10px] sm:text-xs flex items-center gap-1 transition-all cursor-pointer ${
                        currentWrap.grillProgress >= 40 && !currentWrap.isSliced
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-500 active:scale-[0.98]'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      }`}
                    >
                      <Scissors className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span>تقطيع عربي</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Trash & Meta bottom bar */}
              <div className="w-full flex items-center justify-between border-t border-slate-800 pt-3">
                <div className="text-[10px] sm:text-xs text-slate-400 flex flex-wrap gap-1.5">
                  <span className="font-bold text-slate-300">مكونات الساندويش:</span>
                  <span>{currentWrap.fillings.chicken > 0 && `🍗 دجاج (${currentWrap.fillings.chicken}) `}</span>
                  <span>{currentWrap.fillings.beef > 0 && `🥩 لحم (${currentWrap.fillings.beef}) `}</span>
                  <span>{currentWrap.sauces.garlic && '🧄 ثومية '}</span>
                  <span>{currentWrap.sauces.tahini && '🧅 طحينة '}</span>
                  <span>{currentWrap.sauces.spicy && '🌶️ شطة '}</span>
                  <span>{currentWrap.fillings.pickles && '🥒 مخلل '}</span>
                  <span>{currentWrap.fillings.fries && '🍟 بطاطا '}</span>
                  <span>{currentWrap.fillings.pomegranate && '🍯 دبس رمان '}</span>
                </div>

                <button
                  onClick={handleTrash}
                  className="p-1.5 sm:p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 rounded-lg text-[10px] sm:text-xs font-bold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap"
                  title="رمي في القمامة وبدء ساندويش جديدة"
                >
                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>رمي بالقمامة</span>
                </button>
              </div>
            </div>
          ) : (
            /* EMPTY STATION - PROMPT FOR BREAD SELECTION */
            <div className="text-center space-y-4 p-4 sm:p-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-2xl sm:text-3xl mx-auto animate-pulse">
                🫓
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-xs sm:text-sm text-slate-200">صينية التحضير نظيفة وجاهزة</h3>
                <p className="text-[10px] sm:text-xs text-slate-500 max-w-sm mx-auto">
                  اختر نوع الخبز من القائمة الجانبية لوضعه على الطاولة والبدء في وضع الصوصات واللحم والمقبلات!
                </p>
              </div>

              {/* Quick bread selectors */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center pt-2">
                <button
                  onClick={() => handleTakeBread('pita')}
                  disabled={!isDayActive || inventory.pita <= 0}
                  className={`py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl text-[10px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    isDayActive && inventory.pita > 0
                      ? 'bg-slate-800 hover:bg-slate-700 text-amber-200 border border-slate-700 active:scale-[0.98]'
                      : 'bg-slate-950 text-slate-600 border border-slate-900 cursor-not-allowed'
                  }`}
                >
                  <span>🫓 عربي كلاسيك ({inventory.pita})</span>
                </button>

                {upgrades.unlockedSaj ? (
                  <button
                    onClick={() => handleTakeBread('saj')}
                    disabled={!isDayActive || inventory.saj <= 0}
                    className={`py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl text-[10px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      isDayActive && inventory.saj > 0
                        ? 'bg-slate-800 hover:bg-slate-700 text-yellow-400 border border-slate-700 active:scale-[0.98]'
                        : 'bg-slate-950 text-slate-600 border border-slate-900 cursor-not-allowed'
                    }`}
                  >
                    <span>🌯 صاج ملكي ({inventory.saj})</span>
                  </button>
                ) : (
                  <div className="py-2 px-3 rounded-xl bg-slate-950 border border-slate-900 text-slate-600 text-[10px] sm:text-xs flex items-center justify-center gap-1">
                    <span>🔒 صاج (مقفل)</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right column: Prep Controls & Inventory levels (Col-span 5) */}
        <div className="lg:col-span-5 flex flex-col gap-3 sm:gap-4">
          {/* Bread Selectors if wrapper is already active but we show general supplies */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5 sm:p-3 space-y-2">
            <h4 className="text-[10px] sm:text-xs text-slate-400 font-bold flex items-center gap-1">
              <Grid className="w-3.5 h-3.5 text-slate-400" />
              المخزون الحالي للمطبخ
            </h4>

            {/* Bread rows */}
            <div className="grid grid-cols-2 gap-2 text-[11px] sm:text-xs">
              <div className="bg-slate-900/85 p-1.5 sm:p-2 rounded border border-slate-800 flex justify-between items-center">
                <span>🫓 خبز عربي:</span>
                <span className={`font-mono font-bold ${inventory.pita <= 2 ? 'text-rose-400 animate-pulse' : 'text-slate-200'}`}>
                  {inventory.pita} رغيف
                </span>
              </div>

              <div className="bg-slate-900/85 p-1.5 sm:p-2 rounded border border-slate-800 flex justify-between items-center">
                <span>🌯 خبز صاج:</span>
                <span className={`font-mono font-bold ${inventory.saj <= 2 ? 'text-rose-400 animate-pulse' : 'text-slate-200'}`}>
                  {upgrades.unlockedSaj ? `${inventory.saj} رغيف` : 'مقفل 🔒'}
                </span>
              </div>
            </div>
          </div>

          {/* Ingredient Buttons */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 sm:p-4 flex flex-col gap-2.5 sm:gap-3">
            <h4 className="text-[11px] sm:text-xs text-amber-200 font-bold">خطوات التجهيز والحشو:</h4>

            {currentWrap ? (
              <>
                {/* 1. SAUCES SECTION */}
                <div className="space-y-1">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">الصوصات الأساسية</div>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    {/* Garlic */}
                    <button
                      onClick={() => handleAddSauce('garlic')}
                      disabled={currentWrap.isRolled || currentWrap.sauces.garlic || (inventory.garlic <= 0 && !upgrades.autoGarlic)}
                      className={`py-1.5 sm:py-2 px-1 text-center rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                        currentWrap.sauces.garlic
                          ? 'bg-slate-800 text-slate-400 border border-slate-700'
                          : inventory.garlic > 0 || upgrades.autoGarlic
                          ? 'bg-stone-100 text-slate-950 hover:bg-stone-200 shadow active:scale-[0.98]'
                          : 'bg-slate-950 text-slate-600 border border-slate-900 cursor-not-allowed'
                      }`}
                    >
                      🧄 ثومية ({upgrades.autoGarlic ? '♾️' : inventory.garlic})
                    </button>

                    {/* Tahini */}
                    <button
                      onClick={() => handleAddSauce('tahini')}
                      disabled={currentWrap.isRolled || currentWrap.sauces.tahini || (inventory.tahini <= 0 && !upgrades.autoGarlic)}
                      className={`py-1.5 sm:py-2 px-1 text-center rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                        currentWrap.sauces.tahini
                          ? 'bg-slate-800 text-slate-400 border border-slate-700'
                          : inventory.tahini > 0 || upgrades.autoGarlic
                          ? 'bg-amber-100 text-amber-950 hover:bg-amber-200 shadow active:scale-[0.98]'
                          : 'bg-slate-950 text-slate-600 border border-slate-900 cursor-not-allowed'
                      }`}
                    >
                      🧅 طحينة ({upgrades.autoGarlic ? '♾️' : inventory.tahini})
                    </button>

                    {/* Spicy */}
                    <button
                      onClick={() => handleAddSauce('spicy')}
                      disabled={currentWrap.isRolled || currentWrap.sauces.spicy}
                      className={`py-1.5 sm:py-2 px-1 text-center rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                        currentWrap.sauces.spicy
                          ? 'bg-slate-800 text-slate-400 border border-slate-700'
                          : 'bg-red-600 hover:bg-red-700 text-white shadow active:scale-[0.98]'
                      }`}
                    >
                      🌶️ شطة
                    </button>
                  </div>
                </div>

                {/* 2. MEAT SECTION */}
                <div className="space-y-1">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">وضع اللحم المقصوص</div>
                  <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                    {/* Chicken Slices */}
                    <button
                      onClick={() => handleAddMeat('chicken')}
                      disabled={currentWrap.isRolled || currentWrap.fillings.chicken >= 3 || inventory.chicken <= 0}
                      className={`py-1.5 sm:py-2.5 px-1.5 sm:px-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                        currentWrap.fillings.chicken >= 3
                          ? 'bg-slate-800 text-slate-400 border border-slate-700'
                          : inventory.chicken > 0
                          ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow active:scale-[0.98]'
                          : 'bg-slate-950 text-slate-600 border border-slate-900 cursor-not-allowed'
                      }`}
                    >
                      <span>🍗 دجاج ({inventory.chicken})</span>
                      <span className="text-[9px] font-normal opacity-85">
                        المضاف: {currentWrap.fillings.chicken}/3
                      </span>
                    </button>

                    {/* Beef Slices */}
                    <button
                      onClick={() => handleAddMeat('beef')}
                      disabled={currentWrap.isRolled || !upgrades.unlockedBeef || currentWrap.fillings.beef >= 3 || inventory.beef <= 0}
                      className={`py-1.5 sm:py-2.5 px-1.5 sm:px-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                        !upgrades.unlockedBeef
                          ? 'bg-slate-950 text-slate-700 border border-slate-900/40 cursor-not-allowed'
                          : currentWrap.fillings.beef >= 3
                          ? 'bg-slate-800 text-slate-400 border border-slate-700'
                          : inventory.beef > 0
                          ? 'bg-red-600 hover:bg-red-700 text-white font-black shadow active:scale-[0.98]'
                          : 'bg-slate-950 text-slate-600 border border-slate-900 cursor-not-allowed'
                      }`}
                    >
                      <span>🥩 لحم ({upgrades.unlockedBeef ? inventory.beef : '🔒'})</span>
                      <span className="text-[9px] font-normal opacity-85">
                        المضاف: {currentWrap.fillings.beef}/3
                      </span>
                    </button>
                  </div>
                </div>

                {/* 3. EXTRAS & VEGGIES */}
                <div className="space-y-1">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">المقبلات والحشوات الإضافية</div>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    {/* Pickles */}
                    <button
                      onClick={() => handleAddExtra('pickles')}
                      disabled={currentWrap.isRolled || currentWrap.fillings.pickles || inventory.pickles <= 0}
                      className={`py-1.5 sm:py-2 px-1 text-center rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                        currentWrap.fillings.pickles
                          ? 'bg-slate-800 text-slate-400 border border-slate-700'
                          : inventory.pickles > 0
                          ? 'bg-green-600 hover:bg-green-700 text-white shadow active:scale-[0.98]'
                          : 'bg-slate-950 text-slate-600 border border-slate-900 cursor-not-allowed'
                      }`}
                    >
                      🥒 مخلل ({inventory.pickles})
                    </button>

                    {/* Fries */}
                    <button
                      onClick={() => handleAddExtra('fries')}
                      disabled={currentWrap.isRolled || currentWrap.fillings.fries || inventory.fries <= 0}
                      className={`py-1.5 sm:py-2 px-1 text-center rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                        currentWrap.fillings.fries
                          ? 'bg-slate-800 text-slate-400 border border-slate-700'
                          : inventory.fries > 0
                          ? 'bg-yellow-500 hover:bg-yellow-600 text-slate-950 shadow active:scale-[0.98]'
                          : 'bg-slate-950 text-slate-600 border border-slate-900 cursor-not-allowed'
                      }`}
                    >
                      🍟 بطاطا ({inventory.fries})
                    </button>

                    {/* Pomegranate Molasses */}
                    <button
                      onClick={() => handleAddExtra('pomegranate')}
                      disabled={currentWrap.isRolled || currentWrap.fillings.pomegranate || inventory.pomegranate <= 0}
                      className={`py-1.5 sm:py-2 px-1 text-center rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                        currentWrap.fillings.pomegranate
                          ? 'bg-slate-800 text-slate-400 border border-slate-700'
                          : inventory.pomegranate > 0
                          ? 'bg-purple-800 hover:bg-purple-900 text-white shadow active:scale-[0.98]'
                          : 'bg-slate-950 text-slate-600 border border-slate-900 cursor-not-allowed'
                      }`}
                    >
                      🍯 رمان ({inventory.pomegranate})
                    </button>
                  </div>
                </div>

                {/* 4. WRAP IT ACTION */}
                <div className="pt-1.5">
                  <button
                    onClick={handleRoll}
                    disabled={
                      currentWrap.isRolled ||
                      (currentWrap.fillings.chicken === 0 && currentWrap.fillings.beef === 0)
                    }
                    className={`w-full py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      !currentWrap.isRolled && (currentWrap.fillings.chicken > 0 || currentWrap.fillings.beef > 0)
                        ? 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-950 font-black scale-100 active:scale-[0.98]'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>لف الساندويش ورول الخبز 🌯</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-4 sm:p-6 text-center border-2 border-dashed border-slate-800 rounded-lg text-slate-500">
                <Info className="w-6 h-6 sm:w-8 sm:h-8 text-slate-600 mb-1.5" />
                <p className="text-[11px] sm:text-xs">
                  اختر الخبز أولاً من الشاشة الوسطى لبدء حشو الساندويش بالمكونات اللذيذة!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* INTERACTIVE SLICING AND PACKING PANEL OVERLAY */}
      {isSlicingMode && currentWrap && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col justify-center items-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border-2 border-indigo-500/30 rounded-2xl max-w-2xl w-full p-6 text-right space-y-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            
            {/* Header with Title */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <button
                onClick={() => {
                  setIsSlicingMode(false);
                  setIsPackingMode(false);
                }}
                className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 px-3 py-1 rounded-lg text-xs font-bold"
              >
                إلغاء التقطيع ✕
              </button>
              <div className="flex items-center gap-2">
                <Scissors className="w-5 h-5 text-indigo-400 animate-pulse" />
                <h3 className="text-base sm:text-lg font-bold font-sans text-slate-100">
                  {!isPackingMode ? "لوح التقطيع التفاعلي للشاورما" : "تعبئة علبة الوجبة العربية"}
                </h3>
              </div>
            </div>

            {!isPackingMode ? (
              /* INTERACTIVE CUTTING BOARD VIEW */
              <div className="space-y-6 text-right">
                <div className="space-y-1">
                  <span className="text-xs text-amber-400 font-bold tracking-wider block">الخطوة 1: تقطيع الساندويش</span>
                  <h4 className="text-sm font-bold text-slate-200">
                    انقر/المس على الساندويش لقصّها بسكين الشيف! تحتاج إلى إجراء <span className="text-amber-400 font-black">4 قطوع</span> متساوية على الأقل.
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    كلما قمت بالتقطيع بمسافات متناسقة، بدت الساندويشات أكثر إحترافية وجاذبية للزبون!
                  </p>
                </div>

                {/* Interactive Cutting Area */}
                <div className="relative bg-slate-950/80 p-10 rounded-2xl border border-slate-850 flex items-center justify-center min-h-[220px]">
                  {/* Wooden Board texture background */}
                  <div className="absolute inset-2 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-950/15 via-slate-950 to-slate-950 border border-amber-900/10 rounded-xl pointer-events-none" />

                  {/* Laid Roll Wrap */}
                  <div 
                    id="cutting-wrap-target"
                    onClick={(e) => {
                      if (sliceCuts.length >= 5) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = e.clientX - rect.left;
                      const percent = Math.round((clickX / rect.width) * 100);
                      
                      // Add cut coordinate
                      setSliceCuts((prev) => [...prev, percent].sort((a, b) => a - b));
                      sfx.playSlice();
                    }}
                    className={`h-16 rounded-full relative shadow-2xl flex items-center justify-between px-3 border-4 cursor-pointer overflow-hidden select-none w-full max-w-[400px] transition-all duration-300 ${
                      currentWrap.grillProgress >= 90
                        ? 'bg-neutral-900 border-neutral-950'
                        : currentWrap.grillProgress >= 55
                        ? 'bg-amber-800 border-amber-950 shadow-amber-900/30'
                        : 'bg-[#F2E6D0] border-[#cbb393]'
                    }`}
                  >
                    {/* Paper on left side */}
                    <div className="absolute left-0 top-0 bottom-0 w-1/4 bg-slate-100/90 border-r border-slate-300 flex items-center justify-center pointer-events-none">
                      <span className="text-[8px] text-slate-500 font-bold rotate-90 uppercase">شاورما</span>
                    </div>

                    {/* Grill lines */}
                    {currentWrap.grillProgress > 10 && (
                      <div
                        className="absolute inset-0 bg-repeat-x flex justify-around pointer-events-none opacity-85"
                        style={{
                          backgroundImage: 'linear-gradient(90deg, #513511 20%, transparent 20%)',
                          backgroundSize: '16px 100%',
                          opacity: currentWrap.grillProgress / 100,
                        }}
                      />
                    )}

                    {/* Render Cut Marks */}
                    {sliceCuts.map((cutPercent, index) => (
                      <div 
                        key={index}
                        className="absolute top-0 bottom-0 w-1.5 bg-slate-950 border-x border-amber-500/40 pointer-events-none shadow-[0_0_8px_rgba(245,158,11,0.2)]"
                        style={{ left: `${cutPercent}%` }}
                      />
                    ))}

                    {/* Tips showing out on right side */}
                    <div className="w-8 h-full bg-amber-700/80 rounded-r-full absolute right-0 flex flex-col gap-0.5 items-center justify-center py-1 pointer-events-none">
                      <span className="w-3 h-1 bg-yellow-400 rounded" />
                      <span className="w-4 h-1 bg-amber-950 rounded" />
                      <span className="w-3 h-1 bg-green-500 rounded" />
                    </div>
                  </div>

                  {/* Cut Count badge */}
                  <div className="absolute top-4 right-4 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-full text-xs text-slate-300 font-bold">
                    الضربات الحالية: <span className="font-mono text-amber-400 font-black text-sm">{sliceCuts.length} / 4</span>
                  </div>
                </div>

                {/* Cuts timeline display */}
                <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                  <span>عدد القطع الناتجة: <span className="font-mono text-indigo-400 text-sm">{sliceCuts.length + 1} قطع شاورما</span></span>
                  <span>انقر فوق الساندويش لقصّها بسكينك المطبخي 🔪</span>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setSliceCuts([]);
                      sfx.playWrap();
                    }}
                    disabled={sliceCuts.length === 0}
                    className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center border ${
                      sliceCuts.length > 0
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 active:scale-[0.98]'
                        : 'bg-slate-950 text-slate-600 border-slate-900 cursor-not-allowed'
                    }`}
                  >
                    إعادة تهيئة القطوع 🔄
                  </button>
                  <button
                    onClick={() => {
                      sfx.playCoin();
                      setIsPackingMode(true);
                    }}
                    disabled={sliceCuts.length < 4}
                    className={`flex-1 py-3 rounded-xl text-xs font-black transition-all cursor-pointer text-center ${
                      sliceCuts.length >= 4
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 active:scale-[0.98] shadow-lg shadow-orange-500/20'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    الانتقال لتعبئة العلبة العربي 📦 ➔
                  </button>
                </div>
              </div>
            ) : (
              /* PACKING / FILLING MEAL COMPARTMENTS VIEW */
              <div className="space-y-5 text-right">
                <div className="space-y-1">
                  <span className="text-xs text-indigo-400 font-bold tracking-wider block">الخطوة 2: تنسيق علبة التقديم</span>
                  <h4 className="text-sm font-bold text-slate-200 flex items-center justify-end gap-1.5">
                    <span>تنسيق الوجبة في علبة التقديم المميزة</span>
                    {upgrades.arabicMealBoxRoyal ? (
                      <span className="bg-amber-400/10 text-amber-400 border border-amber-400/20 text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse flex items-center gap-0.5">
                        ⭐ علبة ملوك مذهبة (مستوى 3)
                      </span>
                    ) : upgrades.arabicMealBoxPro ? (
                      <span className="bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[10px] px-2 py-0.5 rounded-full font-black flex items-center gap-0.5">
                        🍱 علبة احترافية 4 أقسام (مستوى 2)
                      </span>
                    ) : (
                      <span className="bg-slate-500/10 text-slate-400 border border-slate-500/20 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                        📦 علبة كرتون بسيطة (مستوى 1)
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {!upgrades.arabicMealBoxPro 
                      ? "قم بشراء ترقية العلبة الاحترافية من المتجر لفتح علبة الـ 4 أقسام لمضاعفة البقشيش! حالياً العلبة بسيطة."
                      : "انقر على كل قسم لتعبئة مكونات الوجبة من قطع شاورما كبرى، صوصات ومخلل بشكل رائع قبل الإغلاق."}
                  </p>
                </div>

                {/* BOX DESIGN */}
                {!upgrades.arabicMealBoxPro ? (
                  /* LEVEL 1 STANDARD SIMPLE BOX Rendering */
                  <div className="bg-amber-950/10 border-2 border-dashed border-amber-900/20 rounded-2xl p-6 min-h-[220px] flex flex-col justify-center items-center gap-4 relative">
                    <span className="text-5xl animate-bounce">📦</span>
                    <div className="text-center space-y-1">
                      <p className="text-sm font-bold text-slate-300">العلبة الكرتونية العادية</p>
                      <p className="text-[11px] text-slate-500">ممتلئة بالبطاطس والشاورما المفرومة عشوائياً كالمعتاد.</p>
                    </div>
                    <button
                      onClick={() => {
                        setPackedCompartments({
                          shawarma: true,
                          sauce1: true,
                          pickles: true,
                          sauce2: true,
                        });
                        sfx.playCoin();
                      }}
                      className="px-6 py-2 bg-slate-800 text-amber-400 hover:bg-slate-700 border border-slate-700 text-xs font-bold rounded-lg transition-all"
                    >
                      رص المكونات بسرعة ������
                    </button>
                  </div>
                ) : (
                  /* LEVEL 2 & 3 - PROFESSIONAL 4-COMPARTMENT BENTO BOX Rendering */
                  <div className={`p-4 sm:p-6 rounded-2xl border-2 grid grid-cols-3 gap-3 min-h-[240px] relative overflow-hidden transition-all duration-300 ${
                    upgrades.arabicMealBoxRoyal 
                      ? 'bg-slate-950 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)]' 
                      : 'bg-slate-950 border-slate-850'
                  }`}>
                    {/* Royal Sparkling stars */}
                    {upgrades.arabicMealBoxRoyal && (
                      <div className="absolute inset-0 pointer-events-none opacity-40">
                        <span className="absolute top-4 left-6 text-xl animate-ping">✨</span>
                        <span className="absolute bottom-6 right-8 text-lg animate-ping delay-1000">✨</span>
                        <span className="absolute top-1/2 right-12 text-sm animate-pulse">✨</span>
                      </div>
                    )}

                    {/* COMPARTMENT 1: SHAWAMA (LARGEST SECTION) */}
                    <div 
                      onClick={() => {
                        setPackedCompartments(p => ({ ...p, shawarma: true }));
                        sfx.playSlice();
                      }}
                      className={`col-span-2 row-span-2 rounded-xl border flex flex-col items-center justify-center p-3 transition-all cursor-pointer relative ${
                        packedCompartments.shawarma 
                          ? 'bg-amber-950/20 border-amber-500/30 shadow-inner' 
                          : 'bg-slate-900/60 border-slate-850 hover:border-amber-500/30'
                      }`}
                    >
                      {packedCompartments.shawarma ? (
                        <div className="space-y-1.5 flex flex-col items-center justify-center">
                          {/* Slices visual */}
                          <div className="flex flex-col gap-1">
                            <div className="flex gap-1.5">
                              <span className="w-10 h-5 bg-amber-600 rounded-md border border-amber-900/30 shadow-md transform rotate-12 flex items-center justify-center text-[8px] font-bold text-amber-200">🌯</span>
                              <span className="w-10 h-5 bg-amber-600 rounded-md border border-amber-900/30 shadow-md transform -rotate-12 flex items-center justify-center text-[8px] font-bold text-amber-200">🌯</span>
                            </div>
                            <div className="flex gap-1.5">
                              <span className="w-10 h-5 bg-amber-600 rounded-md border border-amber-900/30 shadow-md transform -rotate-6 flex items-center justify-center text-[8px] font-bold text-amber-200">🌯</span>
                              <span className="w-10 h-5 bg-amber-600 rounded-md border border-amber-900/30 shadow-md transform rotate-6 flex items-center justify-center text-[8px] font-bold text-amber-200">🌯</span>
                            </div>
                          </div>
                          <span className="text-[10px] text-amber-400 font-bold block bg-amber-500/10 px-2 py-0.5 rounded-full">القسم الأكبر: الشاورما المقطعة ({sliceCuts.length + 1} قطع)</span>
                        </div>
                      ) : (
                        <div className="text-center space-y-1 text-slate-500">
                          <span className="text-3xl block animate-pulse">🔪</span>
                          <span className="text-[10px] font-bold block text-slate-400">انقر لرص الشاورما هنا (القسم الأكبر)</span>
                        </div>
                      )}
                    </div>

                    {/* COMPARTMENT 2: TOUM SAUCE SECTION */}
                    <div 
                      onClick={() => {
                        setPackedCompartments(p => ({ ...p, sauce1: true }));
                        sfx.playWrap();
                      }}
                      className={`col-span-1 rounded-xl border flex flex-col items-center justify-center p-2 transition-all cursor-pointer relative ${
                        packedCompartments.sauce1 
                          ? 'bg-stone-900/40 border-stone-750' 
                          : 'bg-slate-900/60 border-slate-850 hover:border-slate-800'
                      }`}
                    >
                      {packedCompartments.sauce1 ? (
                        <div className="text-center space-y-1">
                          <div className="w-8 h-8 rounded-full bg-stone-100 border-2 border-stone-300 mx-auto flex items-center justify-center shadow-inner relative overflow-hidden">
                            <div className="absolute inset-0.5 bg-gradient-to-tr from-stone-200/40 to-white rounded-full" />
                          </div>
                          <span className="text-[9px] font-bold text-stone-300 block">ثومية كريمية 🧄</span>
                        </div>
                      ) : (
                        <div className="text-center text-[9px] text-slate-500">
                          <span className="text-xl block">🧄</span>
                          <span>اضغط لصب الثومية</span>
                        </div>
                      )}
                    </div>

                    {/* COMPARTMENT 3: SHATTA SAUCE SECTION */}
                    <div 
                      onClick={() => {
                        setPackedCompartments(p => ({ ...p, sauce2: true }));
                        sfx.playWrap();
                      }}
                      className={`col-span-1 rounded-xl border flex flex-col items-center justify-center p-2 transition-all cursor-pointer relative ${
                        packedCompartments.sauce2 
                          ? 'bg-rose-950/20 border-rose-900/30' 
                          : 'bg-slate-900/60 border-slate-850 hover:border-slate-800'
                      }`}
                    >
                      {packedCompartments.sauce2 ? (
                        <div className="text-center space-y-1">
                          <div className="w-8 h-8 rounded-full bg-rose-600 border-2 border-rose-800 mx-auto flex items-center justify-center shadow-inner relative overflow-hidden">
                            <div className="absolute inset-0.5 bg-gradient-to-tr from-rose-700/40 to-rose-500 rounded-full animate-pulse" />
                          </div>
                          <span className="text-[9px] font-bold text-rose-400 block">شطة حارة 🔥</span>
                        </div>
                      ) : (
                        <div className="text-center text-[9px] text-slate-500">
                          <span className="text-xl block">🌶️</span>
                          <span>اضغط لصب الشطة</span>
                        </div>
                      )}
                    </div>

                    {/* COMPARTMENT 4: PICKLES & FRIES SECTION */}
                    <div 
                      onClick={() => {
                        setPackedCompartments(p => ({ ...p, pickles: true }));
                        sfx.playWrap();
                      }}
                      className={`col-span-1 rounded-xl border flex flex-col items-center justify-center p-2 transition-all cursor-pointer relative ${
                        packedCompartments.pickles 
                          ? 'bg-emerald-950/20 border-emerald-500/30' 
                          : 'bg-slate-900/60 border-slate-850 hover:border-slate-800'
                      }`}
                    >
                      {packedCompartments.pickles ? (
                        <div className="text-center space-y-1">
                          <div className="flex gap-0.5 justify-center animate-bounce">
                            <span className="w-4 h-1.5 bg-emerald-500 rounded transform rotate-12 shadow" />
                            <span className="w-4 h-1.5 bg-yellow-400 rounded transform -rotate-12 shadow" />
                          </div>
                          <span className="text-[9px] font-bold text-emerald-400 block">مخلل وبطاطا 🥒</span>
                        </div>
                      ) : (
                        <div className="text-center text-[9px] text-slate-500">
                          <span className="text-xl block">🥒</span>
                          <span>اضغط لرص المخلل</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Bottom actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setIsPackingMode(false);
                      sfx.playWrap();
                    }}
                    className="py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer text-center"
                  >
                    ⬅ العودة للتقطيع
                  </button>
                  <button
                    onClick={() => {
                      sfx.playCoin();
                      setIsSlicingMode(false);
                      setIsPackingMode(false);
                      
                      // complete the slicing to true!
                      onUpdateWrap({
                        ...currentWrap,
                        isSliced: true,
                      });
                    }}
                    disabled={upgrades.arabicMealBoxPro && (!packedCompartments.shawarma || !packedCompartments.sauce1 || !packedCompartments.pickles || !packedCompartments.sauce2)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer text-center ${
                      !upgrades.arabicMealBoxPro || (packedCompartments.shawarma && packedCompartments.sauce1 && packedCompartments.pickles && packedCompartments.sauce2)
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 active:scale-[0.98] shadow-lg shadow-emerald-500/20'
                        : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    }`}
                  >
                    <span>{upgrades.arabicMealBoxPro && (!packedCompartments.shawarma || !packedCompartments.sauce1 || !packedCompartments.pickles || !packedCompartments.sauce2) ? "املأ الأقسام الـ 4 المتبقية ⚠️" : "تغليف العلبة وتقديمها للزبون 🍱"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
