/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DayReport } from '../types';
import { Award, DollarSign, Users, Star, AlertTriangle, ArrowRight } from 'lucide-react';
import { sfx } from '../utils/audio';

interface EndDayReportProps {
  report: DayReport;
  onNextDay: () => void;
}

export const EndDayReport: React.FC<EndDayReportProps> = ({
  report,
  onNextDay,
}) => {
  // Star renderer
  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1 justify-center my-3">
        {Array.from({ length: 5 }).map((_, index) => {
          const filled = index < rating;
          return (
            <Star
              key={index}
              className={`w-8 h-8 ${
                filled ? 'text-amber-400 fill-amber-400 animate-bounce' : 'text-slate-700'
              }`}
              style={{ animationDelay: `${index * 80}ms` }}
            />
          );
        })}
      </div>
    );
  };

  const getCriticQuote = (stars: number) => {
    switch (stars) {
      case 5:
        return {
          critic: 'أبو نضال - الناقد الغذائي الأشهر',
          quote: 'شاورما خرافية ولا أروع! الثومية موزونة بالملي، والخبز مقرمش مقمر واللحمة تذوب بالفم مثل الزبدة. أنصح جميع عشاق الشاورما بالزحف إلى هذا المحل فوراً! معلم شاورما بلقب بطل قومي! ⭐⭐⭐⭐⭐',
        };
      case 4:
        return {
          critic: 'أم مازن - ربة منزل وعاشقة للطهي',
          quote: 'الخدمة ممتازة والطعم رائع جداً، شاورما نظيفة وخفيفة ولذيذة. فقط واجهنا بعض الازدحام والتأخير البسيط في الطابور، لكن الطعم ينسيك الانتظار بالكامل. سأعود بالتأكيد!',
        };
      case 3:
        return {
          critic: 'شادي الكسول - مبرمج ومحب للشاورما',
          quote: 'الشاورما لا بأس بها، حشوة جيدة لكن المخلل قليل جداً وبعض الساندويشات كانت تحتاج كبس زيادة على الشواية. ليست سيئة ولكن المعلم يحتاج لزيادة سرعته وتنظيم طاولته.',
        };
      case 2:
        return {
          critic: 'الأستاذ يحيى - زبون غاضب ومستعجل',
          quote: 'تجربة مخيبة لآمالي! انتظرت ربع ساعة في الطابور وفي النهاية أعطاني شاورما دجاج باردة وبدون ثوم رغم أني صرخت ثلاث مرات "كثر ثوم يا معلم"! إهمال واضح ووصفات خاطئة.',
        };
      default:
        return {
          critic: 'دائرة الرقابة الصحية والبلدية 🛑',
          quote: 'ما هذا؟! الدخان يتصاعد من الكباسة، والزبائن يهربون غاضبين، الشاورما محروقة متفحمة وبعضها فارغ بلا لحم! المحل على حافة الإغلاق بالشمع الأحمر إذا لم تنقذ سمعتك غداً!',
        };
    }
  };

  const criticInfo = getCriticQuote(report.stars);
  const netProfitPositive = report.netProfit >= 0;

  return (
    <div id="end-day-report" className="bg-slate-900/85 backdrop-blur-md rounded-2xl p-6 border border-slate-800 text-white shadow-xl max-w-xl mx-auto flex flex-col gap-6">
      {/* Day summary header */}
      <div className="text-center space-y-1.5 border-b border-slate-800 pb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">انتهى يوم العمل بنجاح!</span>
        <h2 className="text-2xl font-black font-sans text-amber-400">التقرير المالي ليوم العمل #{report.dayNumber}</h2>
        {renderStars(report.stars)}
      </div>

      {/* Critic Quote Card */}
      <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 italic relative">
        <span className="text-xs font-black block text-amber-500 mb-1">💬 تقييم الصحافة والزوار:</span>
        <p className="text-xs text-slate-200 leading-relaxed">&quot;{criticInfo.quote}&quot;</p>
        <span className="text-[10px] text-slate-500 font-bold block text-left mt-2.5">— {criticInfo.critic}</span>
      </div>

      {/* Financial statement sheet */}
      <div className="space-y-3">
        <h3 className="text-xs text-slate-400 font-bold flex items-center gap-1">
          <DollarSign className="w-4 h-4 text-slate-400" />
          كشف الحساب والمبيعات التراكمي
        </h3>

        <div className="bg-slate-950/40 rounded-xl p-4 border border-slate-850 space-y-2.5 text-xs font-sans">
          {/* Revenue */}
          <div className="flex justify-between items-center text-slate-300">
            <span>مبيعات الشاورما الأساسية:</span>
            <span className="font-mono text-emerald-400 font-bold">+${report.revenue.toFixed(2)}</span>
          </div>

          {/* Tips */}
          <div className="flex justify-between items-center text-slate-300">
            <span>إكراميات وبقشيش الزبائن الحريصين:</span>
            <span className="font-mono text-emerald-400 font-bold">+${report.tips.toFixed(2)}</span>
          </div>

          {/* Stock Cost */}
          <div className="flex justify-between items-center text-slate-300">
            <span>تكلفة التموين المخزني (قبل اليوم):</span>
            <span className="font-mono text-rose-400 font-bold">-${report.expenseIngredients.toFixed(2)}</span>
          </div>

          {/* Express Emergency Cost */}
          <div className="flex justify-between items-center text-slate-300">
            <span>تكلفة التوصيل الطارئ (أثناء الضغط):</span>
            <span className="font-mono text-rose-400 font-bold">-${report.expenseExpress.toFixed(2)}</span>
          </div>

          <div className="h-px bg-slate-800 my-2" />

          {/* Net profit */}
          <div className="flex justify-between items-center text-sm font-bold">
            <span className="text-slate-200">صافي أرباح اليوم:</span>
            <span className={`font-mono text-base font-black ${netProfitPositive ? 'text-emerald-400' : 'text-rose-500'}`}>
              {netProfitPositive ? '+' : ''}${report.netProfit.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Customer summary */}
      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850 flex flex-col justify-center items-center gap-1">
          <Users className="w-5 h-5 text-emerald-400" />
          <span className="text-[10px] text-slate-500">زبائن تم خدمتهم</span>
          <span className="font-mono font-black text-slate-200 text-base">{report.customersServed} زبون</span>
        </div>

        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850 flex flex-col justify-center items-center gap-1">
          <AlertTriangle className={`w-5 h-5 ${report.customersAngry > 0 ? 'text-rose-500 animate-pulse' : 'text-slate-600'}`} />
          <span className="text-[10px] text-slate-500">زبائن غادروا غاضبين</span>
          <span className="font-mono font-black text-slate-200 text-base">{report.customersAngry} زبون</span>
        </div>
      </div>

      {/* Action button to proceed */}
      <button
        onClick={() => {
          sfx.playWrap();
          onNextDay();
        }}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/10 cursor-pointer"
      >
        <span>الاستمرار إلى اليوم التالي</span>
        <ArrowRight className="w-4 h-4 stroke-[2.5px]" />
      </button>
    </div>
  );
};
