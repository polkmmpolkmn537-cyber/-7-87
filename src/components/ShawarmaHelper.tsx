/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, BookOpen, Sparkles, ShoppingBag, DollarSign, Award, Info } from 'lucide-react';
import { sfx } from '../utils/audio';

interface GuideItem {
  id: string;
  title: string;
  category: 'sauces' | 'meats' | 'breads' | 'mechanics' | 'extras';
  icon: string;
  unlockCondition: string;
  whereToBuy: string;
  costInfo: string;
  bestPractice: string;
  proTip: string;
}

export const ShawarmaHelper: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>('tahini');

  const guideItems: GuideItem[] = [
    {
      id: 'tahini',
      title: '🧅 صوص الطحينة (الطرطور الملوكي)',
      category: 'sauces',
      icon: '🧅',
      unlockCondition: '🔒 مغلق افتراضياً. يتطلب شراء ترقية "شاورما اللحم الفاخر" من متجر التطويرات بسعر $180.',
      whereToBuy: '🛒 يُشترى من شاشة التموين قبل بداية يوم العمل بسعر $0.25 للحصة، أو كـ "شحن طارئ" أثناء العمل بسعر $0.40.',
      costInfo: 'السعر الأساسي: $0.25 • الشحن السريع الطارئ: $0.40 للوجبة.',
      bestPractice: 'تُضاف الطحينة حصرياً إلى شاورما اللحم العجل (أو الدبل المشكل). تجنب تماماً وضع الطحينة لزبائن شاورما الدجاج إلا بطلب صريح لكي لا يغضبوا!',
      proTip: '💡 إذا قمت بتفعيل ترقية "صانع الصوصات (أبو الثوم)"، سيقوم بتعبئة الطحينة والثومية تلقائياً ومجاناً في مستودعك كل 8 ثوانٍ دون دفع أي فلس!'
    },
    {
      id: 'garlic',
      title: '🧄 صوص الثومية الكلاسيكي (توم المطبخ)',
      category: 'sauces',
      icon: '🧄',
      unlockCondition: '🟢 مفتوح تلقائياً منذ اليوم الأول للعمل.',
      whereToBuy: '🛒 يُشترى من شاشة التموين قبل اليوم بسعر $0.20 للحصة، أو عبر أزرار الشحن الطارئ السريع أثناء العمل بسعر $0.30.',
      costInfo: 'السعر الأساسي: $0.20 • الشحن الطارئ: $0.30 للوجبة.',
      bestPractice: 'الرفيق الروحي لشاورما الدجاج! يكره الزبائن شاورما دجاج خالية من الثومية. تأكد دائماً من غرق خبز الدجاج بالثومية الطازجة.',
      proTip: '💡 قم بشراء ترقية "موزع صوص الثوم اللانهائي" من المتجر بسعر $180 لدهن الثومية والطحينة بلمسة واحدة سريعة ومجانية تماماً دون استهلاك مخزون المستودع للأبد!'
    },
    {
      id: 'beef_meat',
      title: '🥩 لحم عجل طازج (سيخ اللحم)',
      category: 'meats',
      icon: '🥩',
      unlockCondition: '🔒 يتطلب تفعيل ترقية "شاورما اللحم الفاخر" من متجر التطويرات بسعر $180 لفتح السيخ وصوص الطحينة معاً.',
      whereToBuy: '🛒 يُشترى كلحم خام في شاشة التموين بسعر $1.80 لحصة الاستواء، ثم تقوم بقصه بالسكين أثناء العمل. أو شحن سريع جاهز بسعر $2.60 للحصة.',
      costInfo: 'اللحم الخام: $1.80 • القص السريع والجاهز بالطائرة: $2.60.',
      bestPractice: 'اللحم يمنحك مبيعات مرتفعة جداً وبقشيشاً سخياً، ويحبه زبائن الـ VIP والمعلم يوسف. يحتاج دائماً صوص طحينة ودبس رمان ومخلل كشركاء نكهة.',
      proTip: '💡 استخدم "السكين الكهربائي المزدوج" لقص طبقة اللحم بسرعة 2.5x مضاعفة وحصد حصتين كاملتين في كل لفة قص!'
    },
    {
      id: 'saj_bread',
      title: '🌯 خبز الصاج الملكي (المرقوق)',
      category: 'breads',
      icon: '🌯',
      unlockCondition: '🔒 يتطلب ترقية "خبز الصاج الملكي" من المتجر بسعر $130.',
      whereToBuy: '🛒 يُشترى في شاشة التموين بسعر $0.30 للرغيف، أو شحن طارئ مستعجل أثناء الضغط بسعر $0.45.',
      costInfo: 'السعر بالتموين: $0.30 • شحن طارئ: $0.45.',
      bestPractice: 'يزيد قيمة طلب الساندويش بنسبة 40% كاملة! كما أنه يتسع لكميات أكبر من الحشو.',
      proTip: '💡 الزبائن الراقين مثل الدكتورة ليلى وأم مازن يفضلون دائماً طلب شاورما الصاج الملوكية.'
    },
    {
      id: 'pomegranate',
      title: '🍯 دبس رمان فاخر',
      category: 'extras',
      icon: '🍯',
      unlockCondition: '🟢 مفتوح ومتاح للاستخدام منذ البداية.',
      whereToBuy: '🛒 يُشترى من شاشة التموين بسعر $0.25 للحصة. يسهل العثور عليه في أسفل قائمة المواد دائمًا.',
      costInfo: 'السعر الأساسي: $0.25 للحصة.',
      bestPractice: 'يُضاف لزيادة الطعم الحامض الحلو والمزازة الفاخرة، خاصة لسيخ لحم العجل ووجبات الصاج والزبائن الـ VIP.',
      proTip: '💡 إضافة دبس الرمان للزبائن الذين يطلبونه يضاعف نسبة رضاهم ويعطيك تقييماً كاملاً بلمح البصر!'
    },
    {
      id: 'arabic_meal',
      title: '🍱 وجبة عربي مقطعة بالعلبة الكبرى',
      category: 'mechanics',
      icon: '🍱',
      unlockCondition: '🟢 متاحة افتراضياً، ويمكن ترقية العلبة بمتجر الترقيات لزيادة البقشيش.',
      whereToBuy: '🛠️ تصنعها بنفسك: خذ خبزاً، احشه، لفه، حمصه على الكباسة جرة جيدة، ثم اضغط على زر "تقطيع عربي ✂️".',
      costInfo: 'مجانية التصنيع ولكن تتطلب كبساً وتوضيباً دقيقاً في أقسام العلبة.',
      bestPractice: 'يجب كبس الساندويش وتثبيتها بالكباسة أولاً حتى تصل حرارة التقمير إلى المستوى الأخضر (55%-78%)، ثم تقطيعها بالسكين وتوضيب العلبة.',
      proTip: '💡 اشتر ترقية "العلبة الملكية المذهبة" للحصول على +50% بقشيش وزيادة مهولة في السمعة التجارية للمحل!'
    },
    {
      id: 'grill_toast',
      title: '🌡️ التقمير المثالي (الكبس والتحميص)',
      category: 'mechanics',
      icon: '🔥',
      unlockCondition: '🟢 ميكانيكية أساسية في الفرن والكباسة.',
      whereToBuy: 'يتم استخدام الكبّاسة في طاولة العمل بوضع الساندويش الملفوف والضغط المطول.',
      costInfo: 'مجاني تماماً، فقط يحتاج انتباه المعلم لمنع الاحتراق.',
      bestPractice: 'النطاق الذهبي والمثالي هو بين 55% و 78% للتحميص المقرمش. تحت الـ 40% تعتبر الساندويش باردة وتغضب الزبائن، وفوق الـ 90% تفحم وتتحول لرماد قابل للرمي بالقمامة!',
      proTip: '💡 الشواية الكهرومغناطيسية الذكية ($200) تكبس الساندويش بضعف السرعة وتصدر جرس تنبيه قبل الاحتراق لحمايتك!'
    }
  ];

  const currentItem = guideItems.find(item => item.id === selectedItemId) || guideItems[0];

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    sfx.playWrap();
  };

  const handleSelect = (id: string) => {
    setSelectedItemId(id);
    sfx.playWrap();
  };

  return (
    <div id="shawarma-helper-card" className="bg-slate-900 border border-amber-500/30 rounded-2xl shadow-xl overflow-hidden transition-all duration-300">
      {/* Accordion Trigger Header */}
      <button
        onClick={handleToggle}
        className="w-full px-5 py-4 flex items-center justify-between bg-slate-950 text-white font-sans focus:outline-none cursor-pointer hover:bg-slate-950/80 transition-all border-b border-slate-850"
      >
        <div className="flex items-center gap-2">
          {isOpen ? <ChevronUp className="w-5 h-5 text-amber-400" /> : <ChevronDown className="w-5 h-5 text-amber-400" />}
          <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/25 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
            <Sparkles className="w-3 h-3 animate-pulse" />
            دليلك للتطوير والتموين
          </span>
        </div>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-black text-amber-400">👨‍🍳 مساعد معلم الشاورما الذكي (حل المشاكل)</h3>
          <BookOpen className="w-5 h-5 text-amber-400" />
        </div>
      </button>

      {/* Expandable Guide Body */}
      {isOpen && (
        <div className="p-4 bg-slate-900/60 text-right space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="text-[11px] text-slate-400 leading-normal font-sans">
            أهلاً بك يا معلم! هل تشعر أن بعض المكونات مفقودة أو غير واضحة للتموين؟ اختر أي مادة أو ميكانيكية من القائمة المنسدلة أدناه لتعرف بدقة متناهية أين تُباع، شروط ظهورها، وكيف تستفيد منها لتحصيل أعلى بقشيش!
          </p>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Left Column: Selector Dropdown & Categories (Col-span 4) */}
            <div className="md:col-span-4 space-y-3">
              <label className="text-[10px] text-slate-400 font-extrabold block">اختر المكون أو النكهة المراد الاستعلام عنها:</label>
              
              <div className="relative">
                <select
                  value={selectedItemId}
                  onChange={(e) => handleSelect(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-amber-500 cursor-pointer appearance-none text-right pr-8"
                >
                  <optgroup label="🍯 الصوصات والصلصات الكريمة">
                    <option value="tahini">🧅 صوص الطحينة (الطرطور)</option>
                    <option value="garlic">🧄 صوص الثومية (التوم)</option>
                  </optgroup>
                  <optgroup label="🥩 اللحوم المفرومة والأسياخ">
                    <option value="beef_meat">🥩 سيخ لحم العجل الفاخر</option>
                  </optgroup>
                  <optgroup label="🫓 المخبوزات والخبز">
                    <option value="saj_bread">🌯 خبز الصاج المرقوق</option>
                  </optgroup>
                  <optgroup label="➕ الإضافات والمقبلات">
                    <option value="pomegranate">🍯 دبس رمان حامض حلو</option>
                  </optgroup>
                  <optgroup label="🍱 آليات التحضير والتقطيع">
                    <option value="arabic_meal">🍱 تحضير الوجبة العربي</option>
                    <option value="grill_toast">🔥 التقمير وكبس الساندويش</option>
                  </optgroup>
                </select>
                <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</span>
              </div>

              {/* Fast quick-link badges */}
              <div className="flex flex-wrap gap-1.5 justify-end">
                {guideItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`text-[10px] px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                      selectedItemId === item.id
                        ? 'bg-amber-500 border-amber-400 text-slate-950 font-black shadow-md'
                        : 'bg-slate-950/60 border-slate-850 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {item.icon} {item.title.split(' ')[1]}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: Detailed visual specs sheet (Col-span 8) */}
            <div className="md:col-span-8 bg-slate-950/80 rounded-xl p-4 border border-slate-850 flex flex-col justify-between gap-3 text-xs leading-relaxed">
              {/* Card Title & Icon Banner */}
              <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                <span className="text-[10px] uppercase font-black tracking-widest text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full font-sans">
                  معلومات المكون والتموين 📋
                </span>
                <h4 className="font-black text-sm text-slate-100 flex items-center gap-1.5">
                  <span>{currentItem.title}</span>
                </h4>
              </div>

              {/* Block 1: Unlock condition */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 block flex items-center gap-1 justify-end">
                  <span>شرط الظهور والتفعيل التجاري</span>
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                </span>
                <p className="text-[11px] text-amber-200/90 font-bold bg-amber-500/5 p-2 rounded-lg border border-amber-500/10 text-right font-sans">
                  {currentItem.unlockCondition}
                </p>
              </div>

              {/* Block 2: Where to buy */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 block flex items-center gap-1 justify-end">
                    <span>أين وكيف تشتريها؟</span>
                    <ShoppingBag className="w-3.5 h-3.5 text-indigo-400" />
                  </span>
                  <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-850 h-full text-right text-[11px] text-slate-300">
                    {currentItem.whereToBuy}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 block flex items-center gap-1 justify-end">
                    <span>التكلفة ومستويات السعر</span>
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  </span>
                  <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-850 h-full text-right text-[11px] text-slate-300">
                    {currentItem.costInfo}
                  </div>
                </div>
              </div>

              {/* Block 3: Best Practice */}
              <div className="space-y-1 bg-slate-900 p-3 rounded-lg border border-slate-850">
                <span className="text-[10px] font-bold text-emerald-400 block flex items-center gap-1 justify-end">
                  <span>طريقة التحضير الصحيحة (بدون غضب الزبون)</span>
                  <Info className="w-3.5 h-3.5 text-emerald-400" />
                </span>
                <p className="text-[11px] text-slate-300">
                  {currentItem.bestPractice}
                </p>
              </div>

              {/* Block 4: Pro Tip */}
              <div className="text-[11px] text-amber-300 font-bold bg-amber-500/5 px-3 py-2 rounded-lg border border-amber-500/10 flex items-start gap-1.5 justify-end">
                <span className="text-right">{currentItem.proTip}</span>
                <span className="text-sm">💡</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
