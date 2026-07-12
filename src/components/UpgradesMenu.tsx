/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShopUpgrades } from '../types';
import { Zap, ShieldAlert, Flame, Cpu, Award, BadgeAlert, Layers, Bell, Check } from 'lucide-react';
import { sfx } from '../utils/audio';

interface UpgradesMenuProps {
  money: number;
  upgrades: ShopUpgrades;
  onBuyUpgrade: (upgradeKey: keyof ShopUpgrades, cost: number) => void;
}

export const UpgradesMenu: React.FC<UpgradesMenuProps> = ({
  money,
  upgrades,
  onBuyUpgrade,
}) => {
  const upgradeItems = [
    {
      key: 'unlockedBeef' as keyof ShopUpgrades,
      name: '🔓 شاورما اللحم الفاخر',
      description: 'إضافة سيخ لحم العجل الفاخر وصوص الطحينة (التراطور) إلى قائمتك. يفتح طلبات اللحم غالية الثمن ومضاعفة الأرباح!',
      cost: 180,
      icon: <Award className="w-5 h-5 text-red-400" />,
      bought: upgrades.unlockedBeef,
      requirement: null,
    },
    {
      key: 'unlockedSaj' as keyof ShopUpgrades,
      name: '🔓 خبز الصاج الملكي',
      description: 'فتح خبز الصاج الفاخر المرقوق. يزيد من سعة الساندويش لثلاثة أضعاف، ويمنحك سعراً أعلى بنسبة 40% لكل طلب صاج!',
      cost: 130,
      icon: <Layers className="w-5 h-5 text-yellow-400" />,
      bought: upgrades.unlockedSaj,
      requirement: null,
    },
    {
      key: 'electricKnife' as keyof ShopUpgrades,
      name: '⚡ السكين الكهربائي المزدوج',
      description: 'سكين دوار كهربائي سريع. يمنحك حصتين (2 slices) من اللحم دفعة واحدة عند كل عملية قص، ويزيد سرعة القص بنسبة 150%!',
      cost: 120,
      icon: <Zap className="w-5 h-5 text-amber-400" />,
      bought: upgrades.electricKnife,
      requirement: null,
    },
    {
      key: 'superGrill' as keyof ShopUpgrades,
      name: '🌡️ شواية كهرومغناطيسية ذكية',
      description: 'شواية كبس مسطحة فائقة السرعة مع منظم حراري ذكي. تكبس الساندويش بضعف السرعة، وترسل صوتاً تنبيهياً ذكياً قبل احتراقها لمنع تلف المكونات!',
      cost: 200,
      icon: <Bell className="w-5 h-5 text-indigo-400" />,
      bought: upgrades.superGrill,
      requirement: null,
    },
    {
      key: 'quickBurner' as keyof ShopUpgrades,
      name: '🔥 حارقات شعلة السوبر توربو',
      description: 'حارقات غاز حديثة لسيخ الشاورما. تسرع عملية استواء طبقة اللحم الخارجية للسيخ بنسبة 100%، مما يتيح لك القص المتواصل دون فترات انتظار!',
      cost: 150,
      icon: <Flame className="w-5 h-5 text-orange-500 animate-pulse" />,
      bought: upgrades.quickBurner,
      requirement: null,
    },
    {
      key: 'autoGarlic' as keyof ShopUpgrades,
      name: '🍯 موزع صوص الثوم اللانهائي',
      description: 'موزع الكبس التلقائي للثومية والطحينة. يدهن الصوص بلمسة واحدة سريعة دون استهلاك أو نفاد مخزون الثومية أو الطحينة من مستودعك (توفير دائم لحصص صوصاتك!)',
      cost: 180,
      icon: <Layers className="w-5 h-5 text-teal-400" />,
      bought: upgrades.autoGarlic,
      requirement: null,
    },
    {
      key: 'helperAbuAhmad' as keyof ShopUpgrades,
      name: '🤖 العامل المساعد (أبو أحمد)',
      description: 'توظيف مساعد خبير بالقص. يقوم أبو أحمد بقص اللحم المطهو من الأسياخ دورياً وتعبئة وعاء اللحم الجاهز تلقائياً كل 3 ثوانٍ أثناء انشغالك باللف والكبس!',
      cost: 250,
      icon: <Cpu className="w-5 h-5 text-emerald-400" />,
      bought: upgrades.helperAbuAhmad,
      requirement: null,
    },
    {
      key: 'helperAbuToum' as keyof ShopUpgrades,
      name: '🧙‍♂️ صانع الصوصات (أبو الثوم)',
      description: 'أبو الثوم هو خبير تحضير صوص الثومية والطرطور بالمخزن. يقوم بزيادة مخزون الصوصات تلقائياً بمقدار 1 وحدة من الثومية والطحينة كل 8 ثوانٍ مجاناً وبلا توقف!',
      cost: 220,
      icon: <Cpu className="w-5 h-5 text-purple-400" />,
      bought: upgrades.helperAbuToum,
      requirement: null,
    },
    {
      key: 'arabicMealBoxPro' as keyof ShopUpgrades,
      name: '🍱 علبة عربي احترافية (4 أقسام)',
      description: 'ترقية علبة الوجبة العربي إلى علبة بلاستيكية سوداء أنيقة مقسمة لـ 4 أقسام (الشاورما الكبرى، الثومية، المخلل، والشطة). تزيد البقشيش بنسبة 25% لطلبات العربي!',
      cost: 110,
      icon: <Layers className="w-5 h-5 text-teal-400" />,
      bought: upgrades.arabicMealBoxPro,
      requirement: null,
    },
    {
      key: 'arabicMealBoxRoyal' as keyof ShopUpgrades,
      name: '👑 العلبة الملكية المذهبة (فاخرة جداً)',
      description: 'علبة ملوك الشاورما الفاخرة ذات الحواف المذهبة والزخارف البراقة. تمنحك إكراميات هائلة (+50% بقشيش) وزيادة سمعة مضافة عند تقديم الوجبات العربي!',
      cost: 160,
      icon: <Award className="w-5 h-5 text-yellow-400 animate-bounce" />,
      bought: upgrades.arabicMealBoxRoyal,
      requirement: 'arabicMealBoxPro',
    },
  ];

  const handlePurchase = (key: keyof ShopUpgrades, cost: number) => {
    if (money < cost) {
      sfx.playSadBuzz();
      return;
    }
    sfx.playCoin();
    onBuyUpgrade(key, cost);
  };

  return (
    <div id="upgrades-menu" className="bg-slate-900/85 backdrop-blur-md rounded-2xl p-5 border border-slate-800 text-white shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
        <div className="flex items-center gap-2">
          <Zap className="text-amber-400 w-5 h-5" />
          <h2 className="text-lg font-bold font-sans">معرض ترقيات المطعم وتوسيعاته</h2>
        </div>
        <div className="text-sm font-bold bg-amber-400/10 text-amber-400 border border-amber-400/20 px-3 py-1 rounded-full font-mono">
          رصيد النقود المتاح: ${money.toFixed(2)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[480px] overflow-y-auto pr-1">
        {upgradeItems.map((item) => {
          const isRequirementMet = !item.requirement || upgrades[item.requirement as keyof ShopUpgrades];
          const canAfford = money >= item.cost && isRequirementMet;
          return (
            <div
              key={item.key}
              className={`rounded-xl p-4 border flex flex-col justify-between gap-3 transition-all relative overflow-hidden ${
                item.bought
                  ? 'bg-emerald-950/20 border-emerald-500/30'
                  : canAfford
                  ? 'bg-slate-950/70 border-slate-800 hover:border-amber-500/40 hover:bg-slate-950/90'
                  : 'bg-slate-950/35 border-slate-900 opacity-70'
              }`}
            >
              {/* Bought Stamp overlay */}
              {item.bought && (
                <div className="absolute top-2 right-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-0.5">
                  <Check className="w-3.5 h-3.5 stroke-[3px]" />
                  <span>مشتراة ونشطة</span>
                </div>
              )}

              {/* Requirement lock overlay */}
              {!item.bought && !isRequirementMet && (
                <div className="absolute top-2 right-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-0.5">
                  <span>🔒 يتطلب المستوى السابق</span>
                </div>
              )}

              {/* Card Header */}
              <div className="flex gap-3 items-start pr-12">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center">
                  {item.icon}
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-bold text-sm text-slate-100">{item.name}</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{item.description}</p>
                </div>
              </div>

              {/* Price & Purchase Button */}
              <div className="flex items-center justify-between border-t border-slate-900/60 pt-3 mt-1">
                <div>
                  <span className="text-[10px] text-slate-500 block">تكلفة التطوير</span>
                  <span className="font-mono text-sm font-black text-amber-400">${item.cost}</span>
                </div>

                {item.bought ? (
                  <button
                    disabled
                    className="py-1.5 px-3 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center gap-1 cursor-not-allowed"
                  >
                    <span>مفعّل</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handlePurchase(item.key, item.cost)}
                    disabled={!canAfford}
                    className={`py-1.5 px-4 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                      canAfford
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 active:scale-[0.98] shadow shadow-orange-500/10'
                        : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    }`}
                  >
                    <span>شراء وترقية</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
