/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Inventory, ShopUpgrades } from '../types';
import { Flame, ShieldAlert, Cpu, Award } from 'lucide-react';
import { sfx } from '../utils/audio';

interface SkewersAreaProps {
  inventory: Inventory;
  upgrades: ShopUpgrades;
  onSliceMeat: (type: 'chicken' | 'beef', amount: number) => void;
  isDayActive: boolean;
}

export const SkewersArea: React.FC<SkewersAreaProps> = ({
  inventory,
  upgrades,
  onSliceMeat,
  isDayActive,
}) => {
  // Cooking levels for skewers (0 to 100, where 100 means fully cooked and ready to slice)
  const [chickenCooked, setChickenCooked] = useState(100);
  const [beefCooked, setBeefCooked] = useState(100);

  // Active slicing states for visual feedback
  const [isSlicingChicken, setIsSlicingChicken] = useState(false);
  const [isSlicingBeef, setIsSlicingBeef] = useState(false);

  // Flying particles for slicing
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; type: 'chicken' | 'beef' }[]>([]);
  const nextParticleId = useRef(0);

  // Auto-regeneration of cooked meat layer
  useEffect(() => {
    if (!isDayActive) return;

    const interval = setInterval(() => {
      // Burner upgrade makes it cook faster
      const regenRate = upgrades.quickBurner ? 6 : 3;

      setChickenCooked((prev) => Math.min(100, prev + regenRate));
      if (upgrades.unlockedBeef) {
        setBeefCooked((prev) => Math.min(100, prev + regenRate));
      }
    }, 400);

    return () => clearInterval(interval);
  }, [isDayActive, upgrades.quickBurner, upgrades.unlockedBeef]);

  // Abu Ahmad auto-slicing logic (if bought)
  useEffect(() => {
    if (!isDayActive || !upgrades.helperAbuAhmad) return;

    const interval = setInterval(() => {
      // Abu Ahmad slices chicken automatically every 3 seconds if cooked > 30
      setChickenCooked((prev) => {
        if (prev >= 20) {
          onSliceMeat('chicken', 1);
          sfx.playSizzle(0.2, 0.05);
          sfx.playSlice();
          return prev - 20;
        }
        return prev;
      });

      // Also slices beef if unlocked
      if (upgrades.unlockedBeef) {
        setBeefCooked((prev) => {
          if (prev >= 20) {
            onSliceMeat('beef', 1);
            sfx.playSizzle(0.2, 0.05);
            sfx.playSlice();
            return prev - 20;
          }
          return prev;
        });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isDayActive, upgrades.helperAbuAhmad, upgrades.unlockedBeef, onSliceMeat]);

  const triggerSlicingParticles = (type: 'chicken' | 'beef', isRightSide: boolean) => {
    const id = nextParticleId.current++;
    // Generate flying piece of meat
    const newParticle = {
      id,
      x: isRightSide ? 70 : 30,
      y: 40 + Math.random() * 20,
      type,
    };
    setParticles((prev) => [...prev, newParticle]);

    // Remove particle after animation completes
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== id));
    }, 600);
  };

  const handleSlice = (type: 'chicken' | 'beef', isRightSide: boolean) => {
    if (!isDayActive) return;

    const cooked = type === 'chicken' ? chickenCooked : beefCooked;
    if (cooked < 15) {
      // Not enough cooked meat on skewer
      sfx.playSadBuzz();
      return;
    }

    // Play sounds
    sfx.playSlice();
    sfx.playSizzle(0.3, upgrades.electricKnife ? 0.25 : 0.15);

    // Apply slicing
    const slicesGained = upgrades.electricKnife ? 2 : 1;
    onSliceMeat(type, slicesGained);

    // Drain cooking level
    if (type === 'chicken') {
      setChickenCooked((prev) => Math.max(0, prev - 15));
      setIsSlicingChicken(true);
      setTimeout(() => setIsSlicingChicken(false), 150);
    } else {
      setBeefCooked((prev) => Math.max(0, prev - 15));
      setIsSlicingBeef(true);
      setTimeout(() => setIsSlicingBeef(false), 150);
    }

    // Trigger visual meat flying pieces
    triggerSlicingParticles(type, isRightSide);
    if (upgrades.electricKnife) {
      setTimeout(() => triggerSlicingParticles(type, isRightSide), 80);
    }
  };

  return (
    <div id="skewers-area" className="bg-slate-900/85 backdrop-blur-md rounded-2xl p-5 border border-slate-800 text-white shadow-xl flex flex-col gap-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Flame className="text-orange-500 w-5 h-5 animate-pulse" />
          <h2 className="text-lg font-bold font-sans">أسياخ الشاورما الدوارة</h2>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
          <Flame className="w-3.5 h-3.5" />
          <span>الشعلة نشطة</span>
        </div>
      </div>

      {/* Skewers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 items-stretch">
        {/* CHICKEN SKEWER (ALWAYS ACTIVE) */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 flex flex-col items-center justify-between relative overflow-hidden group">
          {/* Slicing Particles */}
          {particles
            .filter((p) => p.type === 'chicken')
            .map((p) => (
              <span
                key={p.id}
                className="absolute w-2.5 h-2.5 bg-amber-600 rounded-sm pointer-events-none z-10 animate-ping"
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            ))}

          {/* Sizzling fire element background */}
          <div className="absolute top-2 right-2 flex flex-col items-center gap-1">
            <Flame className="w-4 h-4 text-orange-500 animate-bounce" />
            <span className="text-[9px] text-orange-400 uppercase font-bold tracking-wider">شعلة دافئة</span>
          </div>

          <div className="text-center">
            <h3 className="font-bold text-sm text-amber-200">سيخ شاورما الدجاج</h3>
            <span className="text-[10px] text-slate-400">النوع الأساسي الكلاسيكي</span>
          </div>

          {/* Skewer Visual Container */}
          <div className="h-44 w-32 relative my-4 flex items-center justify-center">
            {/* Center Rod */}
            <div className="absolute top-0 bottom-0 w-2 bg-slate-400 rounded shadow-md z-0" />

            {/* Meat Cone (Vertical Rotisserie Spit) */}
            <div
              className={`w-16 h-36 bg-gradient-to-r from-amber-700 via-amber-500 to-amber-700 rounded-b-3xl rounded-t-[50px] shadow-lg relative transition-all duration-150 z-20 ${
                isSlicingChicken ? 'scale-x-95 brightness-110 translate-x-0.5' : 'animate-pulse'
              } ${chickenCooked < 20 ? 'opacity-40' : ''}`}
              style={{
                clipPath: 'polygon(15% 0%, 85% 0%, 100% 70%, 50% 100%, 0% 70%)',
                transform: `rotate(${isSlicingChicken ? '3deg' : '0deg'})`,
              }}
            >
              {/* Searing lines / textures */}
              <div className="absolute inset-y-0 left-2 w-1.5 bg-amber-900/30 rounded" />
              <div className="absolute inset-y-0 right-4 w-1 bg-amber-900/30 rounded" />
              <div className="absolute inset-y-0 left-6 w-2 bg-amber-400/20 rounded" />
              <div className="absolute top-1/4 left-0 right-0 h-1 bg-amber-800/40" />
              <div className="absolute top-2/4 left-0 right-0 h-1 bg-amber-800/40" />
              <div className="absolute top-3/4 left-0 right-0 h-1 bg-amber-800/40" />

              {/* Glowing cooked outer glow */}
              <div
                className="absolute inset-0 rounded-b-3xl rounded-t-[50px] bg-amber-500/10 pointer-events-none mix-blend-screen"
                style={{ opacity: chickenCooked / 100 }}
              />
            </div>

            {/* Drip Tray */}
            <div className="absolute bottom-1 w-24 h-4 bg-slate-800 rounded-md border border-slate-700 z-10 shadow" />
          </div>

          {/* Stats & Actions */}
          <div className="w-full space-y-3">
            {/* Cooking Layer Indicator */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>جاهزية اللحم للاستواء</span>
                <span className={chickenCooked >= 30 ? 'text-emerald-400 font-bold' : 'text-rose-400 animate-pulse'}>
                  {chickenCooked}% {chickenCooked < 30 ? '(يستوي...)' : '(جاهز!)'}
                </span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-300 ${
                    chickenCooked >= 30 ? 'bg-gradient-to-r from-orange-500 to-amber-500' : 'bg-rose-500 animate-pulse'
                  }`}
                  style={{ width: `${chickenCooked}%` }}
                />
              </div>
            </div>

            {/* Slice Button */}
            <button
              onClick={() => handleSlice('chicken', false)}
              disabled={!isDayActive || chickenCooked < 15}
              className={`w-full py-2.5 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                isDayActive && chickenCooked >= 15
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 active:scale-[0.98]'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <span>{upgrades.electricKnife ? '⚡ قص شاورما دجاج (سريع)' : '🔪 قص شاورما دجاج'}</span>
            </button>

            {/* Helper bot status */}
            {upgrades.helperAbuAhmad && (
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 justify-center">
                <Cpu className="w-3.5 h-3.5 animate-spin" />
                <span>المساعد أبو أحمد يقوم بالقص التلقائي...</span>
              </div>
            )}
          </div>
        </div>

        {/* BEEF SKEWER (UNLOCKED VIA UPGRADE) */}
        <div className={`bg-slate-950/70 border rounded-xl p-4 flex flex-col items-center justify-between relative overflow-hidden group transition-all ${
          upgrades.unlockedBeef ? 'border-slate-800/80' : 'border-slate-800/30 opacity-40 select-none bg-slate-950/30'
        }`}>
          {upgrades.unlockedBeef ? (
            <>
              {/* Slicing Particles */}
              {particles
                .filter((p) => p.type === 'beef')
                .map((p) => (
                  <span
                    key={p.id}
                    className="absolute w-2.5 h-2.5 bg-red-800 rounded-sm pointer-events-none z-10 animate-ping"
                    style={{
                      left: `${p.x}%`,
                      top: `${p.y}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                ))}

              <div className="absolute top-2 right-2 flex flex-col items-center gap-1">
                <Flame className="w-4 h-4 text-orange-500 animate-bounce" />
                <span className="text-[9px] text-red-400 uppercase font-bold tracking-wider">شعلة حارة</span>
              </div>

              <div className="text-center">
                <h3 className="font-bold text-sm text-red-300">سيخ شاورما اللحم</h3>
                <span className="text-[10px] text-slate-400">اللحم الفاخر مع لية الخروف</span>
              </div>

              {/* Skewer Visual Container */}
              <div className="h-44 w-32 relative my-4 flex items-center justify-center">
                {/* Center Rod */}
                <div className="absolute top-0 bottom-0 w-2 bg-slate-400 rounded shadow-md z-0" />

                {/* Meat Cone */}
                <div
                  className={`w-16 h-36 bg-gradient-to-r from-red-950 via-red-800 to-red-950 rounded-b-3xl rounded-t-[50px] shadow-lg relative transition-all duration-150 z-20 ${
                    isSlicingBeef ? 'scale-x-95 brightness-110 translate-x-0.5' : 'animate-pulse'
                  } ${beefCooked < 20 ? 'opacity-40' : ''}`}
                  style={{
                    clipPath: 'polygon(15% 0%, 85% 0%, 100% 70%, 50% 100%, 0% 70%)',
                    transform: `rotate(${isSlicingBeef ? '3deg' : '0deg'})`,
                  }}
                >
                  {/* Searing lines / textures */}
                  <div className="absolute inset-y-0 left-2 w-1.5 bg-slate-900/40 rounded" />
                  <div className="absolute inset-y-0 right-4 w-1 bg-slate-900/40 rounded" />
                  <div className="absolute inset-y-0 left-6 w-2 bg-red-400/10 rounded" />
                  <div className="absolute top-1/4 left-0 right-0 h-1 bg-red-950/60" />
                  <div className="absolute top-2/4 left-0 right-0 h-1 bg-red-950/60" />
                  <div className="absolute top-3/4 left-0 right-0 h-1 bg-red-950/60" />

                  {/* Fat white layers (Liyyeh) for realism */}
                  <div className="absolute top-10 left-1 right-1 h-1 bg-stone-200/40 rounded-full" />
                  <div className="absolute top-24 left-1.5 right-1.5 h-1 bg-stone-200/40 rounded-full" />

                  {/* Glowing cooked outer glow */}
                  <div
                    className="absolute inset-0 rounded-b-3xl rounded-t-[50px] bg-red-500/10 pointer-events-none mix-blend-screen"
                    style={{ opacity: beefCooked / 100 }}
                  />
                </div>

                {/* Drip Tray */}
                <div className="absolute bottom-1 w-24 h-4 bg-slate-800 rounded-md border border-slate-700 z-10 shadow" />
              </div>

              {/* Stats & Actions */}
              <div className="w-full space-y-3">
                {/* Cooking Layer Indicator */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>جاهزية اللحم للاستواء</span>
                    <span className={beefCooked >= 30 ? 'text-emerald-400 font-bold' : 'text-rose-400 animate-pulse'}>
                      {beefCooked}% {beefCooked < 30 ? '(يستوي...)' : '(جاهز!)'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-300 ${
                        beefCooked >= 30 ? 'bg-gradient-to-r from-red-600 to-orange-500' : 'bg-rose-500 animate-pulse'
                      }`}
                      style={{ width: `${beefCooked}%` }}
                    />
                  </div>
                </div>

                {/* Slice Button */}
                <button
                  onClick={() => handleSlice('beef', true)}
                  disabled={!isDayActive || beefCooked < 15}
                  className={`w-full py-2.5 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    isDayActive && beefCooked >= 15
                      ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white active:scale-[0.98]'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  <span>{upgrades.electricKnife ? '⚡ قص شاورما لحم (سريع)' : '🔪 قص شاورما لحم'}</span>
                </button>

                {/* Helper bot status */}
                {upgrades.helperAbuAhmad && (
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 justify-center">
                    <Cpu className="w-3.5 h-3.5 animate-spin" />
                    <span>المساعد أبو أحمد يقطّع اللحم أيضاً...</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <ShieldAlert className="w-10 h-10 text-slate-600 mb-2" />
              <h4 className="font-bold text-sm text-slate-400">سيخ اللحم مقفل</h4>
              <p className="text-[11px] text-slate-500 mt-1 max-w-[180px]">
                اشترِ ترقية &quot;شاورما اللحم&quot; من المتجر لتمكين السيخ وجذب زبائن اللحم والوجبات الفاخرة!
              </p>
              <div className="mt-4 px-3 py-1 bg-amber-400/10 border border-amber-400/20 rounded text-amber-400 text-xs font-bold flex items-center gap-1">
                <Award className="w-3.5 h-3.5" />
                <span>الربح مضاعف</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Slices Counter Tray */}
      <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800/60 flex items-center justify-around">
        <div className="text-center">
          <div className="text-[10px] text-slate-400">شاورما دجاج مقصوصة بالوعاء</div>
          <div className="text-xl font-black text-amber-400 font-mono mt-0.5">{inventory.chicken} <span className="text-xs font-bold">وجبة</span></div>
        </div>
        <div className="h-8 w-px bg-slate-800" />
        <div className="text-center">
          <div className="text-[10px] text-slate-400">شاورما لحم مقصوصة بالوعاء</div>
          <div className="text-xl font-black text-red-400 font-mono mt-0.5">
            {upgrades.unlockedBeef ? inventory.beef : '---'} <span className="text-xs font-bold">{upgrades.unlockedBeef && 'وجبة'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
