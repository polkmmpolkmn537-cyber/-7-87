/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Customer, ShawarmaWrap } from '../types';
import { User, Clock, AlertCircle, Check, HelpCircle, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CustomersAreaProps {
  customers: Customer[];
  onServe: (customerId: string) => void;
  currentWrap: ShawarmaWrap | null;
  isDayActive: boolean;
}

export const CustomersArea: React.FC<CustomersAreaProps> = ({
  customers,
  onServe,
  currentWrap,
  isDayActive,
}) => {
  const getPatienceColor = (patience: number) => {
    if (patience > 60) return 'bg-emerald-500';
    if (patience > 30) return 'bg-amber-500';
    return 'bg-rose-500 animate-pulse';
  };

  const getPatienceTextColor = (patience: number) => {
    if (patience > 60) return 'text-emerald-500';
    if (patience > 30) return 'text-amber-500';
    return 'text-rose-500 font-bold';
  };

  const isWrapReadyToServe = () => {
    if (!currentWrap) return false;
    if (!currentWrap.bread) return false;
    if (!currentWrap.isRolled) return false;
    if (currentWrap.grillProgress >= 90) return false; // cannot serve burnt
    return true;
  };

  return (
    <div id="customers-area" className="bg-slate-900/85 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-800 text-white shadow-xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-3 sm:mb-4 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <User className="text-amber-400 w-5 h-5" />
          <h2 className="text-base sm:text-lg font-bold font-sans">طابور الزبائن النشطين</h2>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          العدد: {customers.length}/3
        </span>
      </div>

      {!isDayActive ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4 sm:p-6 text-slate-400">
          <HelpCircle className="w-10 h-10 sm:w-12 sm:h-12 text-slate-600 mb-2 animate-bounce" />
          <p className="text-sm">المطعم مغلق حالياً.</p>
          <p className="text-xs text-slate-500 mt-1">ابدأ اليوم لاستقبال الزبائن الجائعين!</p>
        </div>
      ) : customers.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4 sm:p-6 text-slate-400">
          <Clock className="w-10 h-10 sm:w-12 sm:h-12 text-amber-500/50 mb-2 animate-pulse" />
          <p className="text-sm">الكل شبعان حالياً!</p>
          <p className="text-xs text-slate-500 mt-1">انتظر وصول زبائن جدد قريباً...</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-3.5 sm:gap-4 overflow-y-auto max-h-[550px] sm:max-h-[600px] pr-1">
          <AnimatePresence initial={false}>
            {customers.map((customer) => {
              const order = customer.order;
              const patiencePercentage = customer.patience;

              // Live Match Checker Helper
              let matchStatus = null;
              if (currentWrap) {
                const breadMatch = currentWrap.bread === order.bread;
                const wrapHasChicken = currentWrap.fillings.chicken > 0;
                const wrapHasBeef = currentWrap.fillings.beef > 0;
                let meatMatch = false;
                if (order.meat === 'chicken' && wrapHasChicken && !wrapHasBeef) meatMatch = true;
                if (order.meat === 'beef' && wrapHasBeef && !wrapHasChicken) meatMatch = true;
                if (order.meat === 'mixed' && wrapHasChicken && wrapHasBeef) meatMatch = true;

                const serveMatch = (order.serveType === 'arabic' && currentWrap.isSliced) || 
                                   (order.serveType === 'sandwich' && !currentWrap.isSliced);

                const garlicMatch = order.garlic === currentWrap.sauces.garlic;
                const tahiniMatch = order.tahini === currentWrap.sauces.tahini;
                const spicyMatch = order.spicy === currentWrap.sauces.spicy;
                const picklesMatch = order.pickles === currentWrap.fillings.pickles;
                const friesMatch = order.fries === currentWrap.fillings.fries;
                const pomegranateMatch = order.pomegranate === currentWrap.fillings.pomegranate;

                const allMatch = breadMatch && meatMatch && serveMatch && garlicMatch && tahiniMatch && spicyMatch && picklesMatch && friesMatch && pomegranateMatch;

                matchStatus = {
                  breadMatch,
                  meatMatch,
                  serveMatch,
                  garlicMatch,
                  tahiniMatch,
                  spicyMatch,
                  picklesMatch,
                  friesMatch,
                  pomegranateMatch,
                  allMatch
                };
              }

              return (
                <motion.div
                  key={customer.id}
                  layout
                  initial={{ opacity: 0, x: 50, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -50, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all flex flex-col gap-3 relative overflow-hidden group shadow-md shrink-0"
                >
                  {/* Patience Background Glow for critical state */}
                  {patiencePercentage < 25 && (
                    <div className="absolute inset-0 bg-rose-500/5 pointer-events-none animate-pulse" />
                  )}

                  {/* Top Bar: Avatar & Patience */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-slate-950 border-2 border-slate-800 flex items-center justify-center text-xl shadow-inner group-hover:scale-105 transition-transform">
                        {customer.avatar}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-200">{customer.name}</h3>
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                          customer.type === 'vip' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          customer.type === 'impatient' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                          customer.type === 'spicy_lover' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {customer.type === 'vip' ? '👑 كبار الشخصيات' :
                           customer.type === 'impatient' ? '⚡ مستعجل جداً' :
                           customer.type === 'spicy_lover' ? '🌶️ عاشق الشطة' :
                           customer.type === 'traditional' ? '🫓 كلاسيكي' : '🚶 زبون عادي'}
                        </span>
                      </div>
                    </div>

                    {/* Patience timer */}
                    <div className="flex flex-col items-end gap-1 w-24">
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span className={getPatienceTextColor(patiencePercentage)}>
                          {Math.round(patiencePercentage)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
                        <div
                          className={`h-full transition-all duration-100 ${getPatienceColor(patiencePercentage)}`}
                          style={{ width: `${patiencePercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dialogue Bubble (Smaller, purely for atmospheric flavor) */}
                  <div className="bg-slate-950/60 rounded-lg p-2 text-[11px] text-slate-400 border-r-2 border-amber-500/50 italic leading-relaxed">
                    &quot;{customer.dialogueAr}&quot;
                  </div>

                  {/* KITCHEN ORDER TICKET 🧾 (Optimized & Beautiful Thermal Receipt Design with Realtime Checkers) */}
                  <div className="bg-[#FCFAF2] text-slate-900 rounded-xl border border-amber-950/10 p-3.5 space-y-3 shadow-md relative border-l-4 border-l-amber-500">
                    {/* Receipt Header */}
                    <div className="flex items-center justify-between border-b border-dashed border-slate-300 pb-1.5 text-[10px] font-black tracking-wider text-slate-700">
                      <span className="flex items-center gap-1">📋 بون المطبخ المعتمد</span>
                      <span className="font-mono text-slate-500 text-[9px]">بون #{customer.id.split('_')[2] || '1'}</span>
                    </div>

                    {/* Core Recipe Config (Horizontal Clean Layout) */}
                    <div className="space-y-2 text-xs font-sans">
                      {/* Bread */}
                      <div className="flex items-center justify-between border-b border-slate-200/50 pb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">🫓</span>
                          <span className="text-[11px] text-slate-500 font-bold">الخبز المطلوب:</span>
                          <span className="font-black text-slate-950">
                            {order.bread === 'saj' ? 'خبز صاج' : 'خبز عربي'}
                          </span>
                        </div>
                        {currentWrap ? (
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-sm border ${
                            matchStatus?.breadMatch 
                              ? 'text-emerald-800 bg-emerald-50 border-emerald-200' 
                              : 'text-rose-800 bg-rose-50 border-rose-200 animate-pulse'
                          }`}>
                            {matchStatus?.breadMatch 
                              ? '✓ صحيح' 
                              : `✗ خاطئ (تستخدم ${currentWrap.bread === 'saj' ? 'صاج' : 'عربي'})`
                            }
                          </span>
                        ) : (
                          <span className="text-[9px] text-slate-400 font-bold">⌛ في الانتظار</span>
                        )}
                      </div>

                      {/* Meat */}
                      <div className="flex items-center justify-between border-b border-slate-200/50 pb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">🥩</span>
                          <span className="text-[11px] text-slate-500 font-bold">الحشوة الأساسية:</span>
                          <span className="font-black text-slate-950">
                            {order.meat === 'chicken' ? 'شاورما دجاج' :
                             order.meat === 'beef' ? 'لحم عجل طازج' : 'شاورما دبل مشكل'}
                          </span>
                        </div>
                        {currentWrap ? (
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-sm border ${
                            matchStatus?.meatMatch 
                              ? 'text-emerald-800 bg-emerald-50 border-emerald-200' 
                              : (currentWrap.fillings.chicken === 0 && currentWrap.fillings.beef === 0)
                              ? 'text-amber-800 bg-amber-50 border-amber-200 animate-pulse'
                              : 'text-rose-800 bg-rose-50 border-rose-200 animate-pulse'
                          }`}>
                            {matchStatus?.meatMatch 
                              ? '✓ صحيح' 
                              : (currentWrap.fillings.chicken === 0 && currentWrap.fillings.beef === 0)
                              ? '⏳ أضف اللحم باللوحة'
                              : '✗ لحم خاطئ'
                            }
                          </span>
                        ) : (
                          <span className="text-[9px] text-slate-400 font-bold">⌛ في الانتظار</span>
                        )}
                      </div>

                      {/* Serving Style */}
                      <div className="flex items-center justify-between border-b border-slate-200/50 pb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">🍽️</span>
                          <span className="text-[11px] text-slate-500 font-bold">التقديم النهائي:</span>
                          <span className="font-black text-slate-950">
                            {order.serveType === 'arabic' ? 'وجبة عربي 🍱' : 'ساندويش كامل 🌯'}
                          </span>
                        </div>
                        {currentWrap ? (
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-sm border ${
                            matchStatus?.serveMatch 
                              ? 'text-emerald-800 bg-emerald-50 border-emerald-200' 
                              : (order.serveType === 'arabic' && !currentWrap.isSliced)
                              ? 'text-amber-800 bg-amber-50 border-amber-200 animate-pulse'
                              : 'text-rose-800 bg-rose-50 border-rose-200'
                          }`}>
                            {matchStatus?.serveMatch 
                              ? '✓ صحيح' 
                              : (order.serveType === 'arabic' && !currentWrap.isSliced)
                              ? '⏳ يحتاج تقطيع بالسكين'
                              : '✗ خطأ (لا تقطعها!)'
                            }
                          </span>
                        ) : (
                          <span className="text-[9px] text-slate-400 font-bold">⌛ في الانتظار</span>
                        )}
                      </div>
                    </div>

                    {/* Interactive Ingredients Checklist */}
                    <div className="space-y-1.5 border-t border-dashed border-slate-300 pt-2 text-right">
                      <span className="text-[10px] text-slate-600 font-extrabold block mb-1">➕ حالة المكونات والإضافات بالطلب:</span>
                      <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                        {/* Garlic */}
                        {order.garlic ? (
                          <div className={`flex items-center justify-between p-1 rounded-md border ${
                            !currentWrap 
                              ? 'bg-slate-50 text-slate-500 border-slate-200' 
                              : currentWrap.sauces.garlic 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold' 
                              : 'bg-amber-50 text-amber-800 border-amber-200 font-bold animate-pulse'
                          }`}>
                            <span>🧄 ثومية</span>
                            <span>{!currentWrap ? '⏳ مطلوب' : currentWrap.sauces.garlic ? '✓ مضاف' : '➕ اضف'}</span>
                          </div>
                        ) : (
                          currentWrap?.sauces.garlic && (
                            <div className="flex items-center justify-between p-1 rounded-md border bg-rose-50 text-rose-800 border-rose-200 font-bold animate-pulse col-span-2">
                              <span>🧄 ثومية مضافة</span>
                              <span>❌ زائد! الزبون يكره الثومية</span>
                            </div>
                          )
                        )}

                        {/* Tahini */}
                        {order.tahini ? (
                          <div className={`flex items-center justify-between p-1 rounded-md border ${
                            !currentWrap 
                              ? 'bg-slate-50 text-slate-500 border-slate-200' 
                              : currentWrap.sauces.tahini 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold' 
                              : 'bg-amber-50 text-amber-800 border-amber-200 font-bold animate-pulse'
                          }`}>
                            <span>🧅 طحينة</span>
                            <span>{!currentWrap ? '⏳ مطلوب' : currentWrap.sauces.tahini ? '✓ مضاف' : '➕ اضف'}</span>
                          </div>
                        ) : (
                          currentWrap?.sauces.tahini && (
                            <div className="flex items-center justify-between p-1 rounded-md border bg-rose-50 text-rose-800 border-rose-200 font-bold animate-pulse col-span-2">
                              <span>🧅 طحينة مضافة</span>
                              <span>❌ زائد! الزبون يكره الطحينة</span>
                            </div>
                          )
                        )}

                        {/* Spicy */}
                        {order.spicy ? (
                          <div className={`flex items-center justify-between p-1 rounded-md border ${
                            !currentWrap 
                              ? 'bg-slate-50 text-slate-500 border-slate-200' 
                              : currentWrap.sauces.spicy 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold' 
                              : 'bg-amber-50 text-amber-800 border-amber-200 font-bold animate-pulse'
                          }`}>
                            <span>🌶️ شطة</span>
                            <span>{!currentWrap ? '⏳ مطلوب' : currentWrap.sauces.spicy ? '✓ مضاف' : '➕ اضف'}</span>
                          </div>
                        ) : (
                          currentWrap?.sauces.spicy && (
                            <div className="flex items-center justify-between p-1 rounded-md border bg-rose-50 text-rose-800 border-rose-200 font-bold animate-pulse col-span-2">
                              <span>🌶️ شطة مضافة</span>
                              <span>❌ زائد! الزبون يكره الشطة</span>
                            </div>
                          )
                        )}

                        {/* Pickles */}
                        {order.pickles ? (
                          <div className={`flex items-center justify-between p-1 rounded-md border ${
                            !currentWrap 
                              ? 'bg-slate-50 text-slate-500 border-slate-200' 
                              : currentWrap.fillings.pickles 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold' 
                              : 'bg-amber-50 text-amber-800 border-amber-200 font-bold animate-pulse'
                          }`}>
                            <span>🥒 مخلل</span>
                            <span>{!currentWrap ? '⏳ مطلوب' : currentWrap.fillings.pickles ? '✓ مضاف' : '➕ اضف'}</span>
                          </div>
                        ) : (
                          currentWrap?.fillings.pickles ? (
                            <div className="flex items-center justify-between p-1 rounded-md border bg-rose-50 text-rose-800 border-rose-200 font-bold animate-pulse col-span-2">
                              <span>🥒 مخلل مضاف</span>
                              <span>❌ زائد! بدون مخلل بالطلب</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between p-1 rounded-md border bg-slate-100 text-slate-400 border-slate-200 line-through">
                              <span>🥒 بدون مخلل</span>
                              <span>✓ صحيح</span>
                            </div>
                          )
                        )}

                        {/* Fries */}
                        {order.fries ? (
                          <div className={`flex items-center justify-between p-1 rounded-md border ${
                            !currentWrap 
                              ? 'bg-slate-50 text-slate-500 border-slate-200' 
                              : currentWrap.fillings.fries 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold' 
                              : 'bg-amber-50 text-amber-800 border-amber-200 font-bold animate-pulse'
                          }`}>
                            <span>🍟 بطاطا</span>
                            <span>{!currentWrap ? '⏳ مطلوب' : currentWrap.fillings.fries ? '✓ مضاف' : '➕ اضف'}</span>
                          </div>
                        ) : (
                          currentWrap?.fillings.fries ? (
                            <div className="flex items-center justify-between p-1 rounded-md border bg-rose-50 text-rose-800 border-rose-200 font-bold animate-pulse col-span-2">
                              <span>🍟 بطاطا مضافة</span>
                              <span>❌ زائد! بدون بطاطا بالطلب</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between p-1 rounded-md border bg-slate-100 text-slate-400 border-slate-200 line-through">
                              <span>🍟 بدون بطاطا</span>
                              <span>✓ صحيح</span>
                            </div>
                          )
                        )}

                        {/* Pomegranate */}
                        {order.pomegranate ? (
                          <div className={`flex items-center justify-between p-1 rounded-md border ${
                            !currentWrap 
                              ? 'bg-slate-50 text-slate-500 border-slate-200' 
                              : currentWrap.fillings.pomegranate 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold' 
                              : 'bg-amber-50 text-amber-800 border-amber-200 font-bold animate-pulse'
                          }`}>
                            <span>🍯 دبس رمان</span>
                            <span>{!currentWrap ? '⏳ مطلوب' : currentWrap.fillings.pomegranate ? '✓ مضاف' : '➕ اضف'}</span>
                          </div>
                        ) : (
                          currentWrap?.fillings.pomegranate && (
                            <div className="flex items-center justify-between p-1 rounded-md border bg-rose-50 text-rose-800 border-rose-200 font-bold animate-pulse col-span-2">
                              <span>🍯 دبس رمان مضاف</span>
                              <span>❌ زائد! بدون دبس رمان</span>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {/* Realtime Live assembly matching state */}
                    {currentWrap && (
                      <div className="border-t border-dashed border-slate-300 pt-2 flex items-center justify-between text-[10px] font-bold text-slate-500">
                        <span>حالة التطابق المباشر:</span>
                        <span className={`px-2 py-0.5 rounded-full ${
                          matchStatus?.allMatch 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-amber-100 text-amber-800 animate-pulse'
                        }`}>
                          {matchStatus?.allMatch ? '🎯 متطابق ومثالي 100%' : '⏳ قيد التحضير والتعديل'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Serve Button */}
                  <div className="mt-1 flex gap-2">
                    <button
                      onClick={() => onServe(customer.id)}
                      disabled={!isWrapReadyToServe()}
                      className={`w-full py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 text-xs font-black transition-all cursor-pointer ${
                        isWrapReadyToServe()
                          ? matchStatus?.allMatch
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black shadow-lg shadow-emerald-500/30 hover:scale-[1.02] border border-emerald-400/40 animate-bounce'
                            : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black shadow-lg shadow-orange-500/20 hover:scale-[1.01]'
                          : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                      }`}
                    >
                      <Check className="w-4 h-4 stroke-[3px]" />
                      <span>
                        {isWrapReadyToServe()
                          ? matchStatus?.allMatch
                            ? 'قدّم الطلب المثالي الآن! 🎯🛎️'
                            : 'قدّم الساندويش مع وجود أخطاء ⚠️🛎️'
                          : 'قدّم الشاورما الحالية له 🛎️'
                        }
                      </span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
