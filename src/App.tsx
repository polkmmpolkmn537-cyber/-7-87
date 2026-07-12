/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Customer, CustomerOrder, DayReport, Inventory, InventoryPrices, ShawarmaWrap, ShopUpgrades } from './types';
import { CustomersArea } from './components/CustomersArea';
import { SkewersArea } from './components/SkewersArea';
import { Workstation } from './components/Workstation';
import { DaySetup } from './components/DaySetup';
import { EndDayReport } from './components/EndDayReport';
import { UpgradesMenu } from './components/UpgradesMenu';
import { sfx } from './utils/audio';
import { Flame, DollarSign, Clock, Volume2, VolumeX, HelpCircle, ArrowLeft, RotateCcw, TrendingUp, HelpCircle as QuestionIcon, Plus, Eye, Music, Star, Sparkles, AlertCircle, Check, Settings } from 'lucide-react';

const INITIAL_INVENTORY: Inventory = {
  pita: 10,
  saj: 0,
  chicken: 4,
  beef: 0,
  garlic: 8,
  tahini: 0,
  pickles: 6,
  fries: 6,
  pomegranate: 4,
};

const INVENTORY_PRICES: InventoryPrices = {
  pita: 0.15,
  saj: 0.30,
  chickenMeat: 1.20,
  beefMeat: 1.80,
  garlic: 0.20,
  tahini: 0.25,
  pickles: 0.15,
  fries: 0.20,
  pomegranate: 0.25,
};

const EMERGENCY_PRICES: InventoryPrices = {
  pita: 0.25,
  saj: 0.45,
  chickenMeat: 1.80, // pre-sliced directly into tray
  beefMeat: 2.60,    // pre-sliced directly into tray
  garlic: 0.30,
  tahini: 0.40,
  pickles: 0.22,
  fries: 0.28,
  pomegranate: 0.35,
};

const INITIAL_UPGRADES: ShopUpgrades = {
  electricKnife: false,
  superGrill: false,
  quickBurner: false,
  autoGarlic: false,
  helperAbuAhmad: false,
  helperAbuToum: false,
  marketingLevel: 0,
  unlockedBeef: false,
  unlockedSaj: false,
  arabicMealBoxPro: false,
  arabicMealBoxRoyal: false,
};

const CUSTOMER_NAMES = [
  { name: 'أبو أحمد', avatar: '👨‍🦳', quote: 'يا ابني كثرلي الثومية الله يرضى عليك، شاورما بدون ثوم مثل الشاي بدون سكر!', type: 'traditional' },
  { name: 'أم مازن', avatar: '🧕', quote: 'سويلي إياها على خبز صاج وغرقها دبس رمان لعيال عمتك يا بطل!', type: 'regular' },
  { name: 'سامي المستعجل', avatar: '🧑‍💻', quote: 'بسرعة يا غالي، محاضرة الدكتور سامر بدأت وعمري ما رح أخلص!', type: 'impatient' },
  { name: 'أبو ليلى ذو الرأس الحامي', avatar: '🧔', quote: 'وجبة عربي لحم دبل، غرقها شطة حاررررة تسخن القلب!', type: 'spicy_lover' },
  { name: 'سارة النباتية المزيفة', avatar: '👩', quote: 'أنا نباتية بس بموت بريحة الشاورما! سويلي بطاطا وثومية ومخلل كأنها دجاج!', type: 'regular' },
  { name: 'المعلم يوسف الهادئ', avatar: '👨‍🏫', quote: 'مساء الخير يا بني، على مهلك، ساندويش كلاسيكي طحينة ومخلل بارك الله فيك.', type: 'traditional' },
  { name: 'ليلى الدكتورة الراقية', avatar: '👩‍⚕️', quote: 'أريد وجبة عربي لحم على خبز صاج، ممتازة التغليف بدون كاتشاب ودبس رمان إضافي.', type: 'vip' },
  { name: 'فارس الشطة والبارود', avatar: '🔥', quote: 'حط شطة لغاية ما تشوف النار تطلع من عيني! تفجير!', type: 'spicy_lover' },
  { name: 'الحاج جلال المتقاعد', avatar: '👴', quote: 'يا بني، أي ساندويش دافئ وطري على ذوقك، بس خفف المخللات كرمال الضغط.', type: 'traditional' },
];

export default function App() {
  // Game persistent states
  const [money, setMoney] = useState<number>(150.00);
  const [inventory, setInventory] = useState<Inventory>(INITIAL_INVENTORY);
  const [upgrades, setUpgrades] = useState<ShopUpgrades>(INITIAL_UPGRADES);
  const [dayNumber, setDayNumber] = useState<number>(1);
  const [reputation, setReputation] = useState<number>(80); // 0 to 100%

  // Screen routing state
  const [gameState, setGameState] = useState<'tutorial' | 'setup' | 'playing' | 'report'>('tutorial');

  // Interactive gameplay states
  const [activeTab, setActiveTab] = useState<'customers' | 'prep' | 'skewers'>('prep'); // mobile tab selector
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [currentWrap, setCurrentWrap] = useState<ShawarmaWrap | null>(null);
  const [configuredDayDuration, setConfiguredDayDuration] = useState<number>(120);
  const [dayTimer, setDayTimer] = useState<number>(120); // counts down during active day
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Background music states & Custom Interactive feedback toast
  const [isMusicPlaying, setIsMusicPlaying] = useState<boolean>(false);
  const [serveFeedback, setServeFeedback] = useState<{
    success: boolean;
    customerName: string;
    avatar: string;
    score: number;
    tip: number;
    dialogue: string;
    mistakes: string[];
  } | null>(null);

  // Audio ambient music active toggle
  const handleToggleMusic = () => {
    const nextMusic = !isMusicPlaying;
    setIsMusicPlaying(nextMusic);
    if (nextMusic) {
      sfx.startAmbientMusic();
    } else {
      sfx.stopAmbientMusic();
    }
  };

  // Clean up music loop on unmount
  useEffect(() => {
    return () => {
      sfx.stopAmbientMusic();
    };
  }, []);

  // Day accounting report accumulation
  const [dayEarnings, setDayEarnings] = useState<{
    revenue: number;
    tips: number;
    expenseIngredients: number;
    expenseExpress: number;
    servedCount: number;
    angryCount: number;
  }>({
    revenue: 0,
    tips: 0,
    expenseIngredients: 0,
    expenseExpress: 0,
    servedCount: 0,
    angryCount: 0,
  });

  const [activeDayReport, setActiveDayReport] = useState<DayReport | null>(null);

  // Tutorial / How to Play popup toggle
  const [showHowToModal, setShowHowToModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Background/active refs to prevent closure issues in intervals
  const currentWrapRef = useRef<ShawarmaWrap | null>(null);
  currentWrapRef.current = currentWrap;

  const upgradesRef = useRef<ShopUpgrades>(upgrades);
  upgradesRef.current = upgrades;

  const inventoryRef = useRef<Inventory>(inventory);
  inventoryRef.current = inventory;

  // Audio mute toggles
  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    sfx.setMute(nextMute);
    sfx.playWrap();
  };

  // Generate a random customer order fitting current unlocks
  const generateRandomCustomer = useCallback((): Customer => {
    const isBeefUnlocked = upgradesRef.current.unlockedBeef;
    const isSajUnlocked = upgradesRef.current.unlockedSaj;

    // Pick a candidate name
    let candidates = [...CUSTOMER_NAMES];
    // Filter vip or specialized if requirements not met
    if (!isBeefUnlocked) {
      candidates = candidates.filter((c) => !c.quote.includes('لحم'));
    }
    if (!isSajUnlocked) {
      candidates = candidates.filter((c) => !c.quote.includes('صاج'));
    }

    const randomTemplate = candidates[Math.floor(Math.random() * candidates.length)];

    // Build specific order
    const meatOptions: ('chicken' | 'beef' | 'mixed')[] = ['chicken'];
    if (isBeefUnlocked) {
      meatOptions.push('beef');
      meatOptions.push('mixed');
    }
    const meat = meatOptions[Math.floor(Math.random() * meatOptions.length)];

    const bread: 'pita' | 'saj' = isSajUnlocked && Math.random() > 0.4 ? 'saj' : 'pita';
    const serveType: 'sandwich' | 'arabic' = Math.random() > 0.4 ? 'sandwich' : 'arabic';

    const order: CustomerOrder = {
      bread,
      meat,
      garlic: meat === 'chicken' || meat === 'mixed' || Math.random() > 0.5,
      tahini: meat === 'beef' || meat === 'mixed' || Math.random() > 0.6,
      spicy: randomTemplate.type === 'spicy_lover' || Math.random() > 0.6,
      pickles: Math.random() > 0.2 && randomTemplate.name !== 'الحاج جلال المتقاعد',
      fries: Math.random() > 0.3,
      pomegranate: isBeefUnlocked && Math.random() > 0.5,
      serveType,
    };

    // Arabic descriptive text of order
    let demandText = `أريد شاورما ${order.meat === 'chicken' ? 'دجاج' : order.meat === 'beef' ? 'لحم' : 'مشكل دبل'} على خبز ${order.bread === 'saj' ? 'صاج مميز' : 'عربي كلاسيكي'}`;
    if (order.serveType === 'arabic') {
      demandText += ' وجبة مقطعة عربي بالعلبة 🍱';
    } else {
      demandText += ' ساندويش رول مبروم 🌯';
    }

    let extraList: string[] = [];
    if (order.garlic) extraList.push('ثومية');
    if (order.tahini) extraList.push('طحينة');
    if (order.spicy) extraList.push('شطة حارة 🔥');
    if (order.pickles) extraList.push('مخلل 🥒');
    if (order.fries) extraList.push('بطاطا 🍟');
    if (order.pomegranate) extraList.push('دبس رمان 🍯');

    if (extraList.length > 0) {
      demandText += ` مع: ${extraList.join(' و')}`;
    }

    const maxPatience = randomTemplate.type === 'impatient' ? 50 : randomTemplate.type === 'vip' ? 80 : 100;

    return {
      id: `cust_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: randomTemplate.name,
      avatar: randomTemplate.avatar,
      order,
      patience: 100,
      maxPatience,
      dialogue: randomTemplate.quote,
      dialogueAr: randomTemplate.quote,
      type: randomTemplate.type as any,
    };
  }, []);

  // Central Game Day Ticker
  useEffect(() => {
    if (gameState !== 'playing') return;

    const timer = setInterval(() => {
      setDayTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleEndDay();
          return 0;
        }
        return prev - 1;
      });

      // Tick down customer patience
      setCustomers((prevCustomers) => {
        let reputationPenalties = 0;
        let angryCountIncrement = 0;

        const updated = prevCustomers
          .map((c) => {
            // Marketing upgrade gives customer patience reduction buffer
            const reductionRate = upgradesRef.current.marketingLevel > 0
              ? 1.5 - (upgradesRef.current.marketingLevel * 0.25)
              : 1.5;

            return {
              ...c,
              patience: Math.max(0, c.patience - reductionRate),
            };
          })
          .filter((c) => {
            if (c.patience <= 0) {
              reputationPenalties += 10;
              angryCountIncrement += 1;
              sfx.playSadBuzz();
              return false; // leaves angry
            }
            return true;
          });

        if (reputationPenalties > 0) {
          setReputation((r) => Math.max(0, r - reputationPenalties));
          setDayEarnings((prev) => ({
            ...prev,
            angryCount: prev.angryCount + angryCountIncrement,
          }));
        }

        return updated;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  // Customer Spawning Interval
  useEffect(() => {
    if (gameState !== 'playing') return;

    const spawnInterval = setInterval(() => {
      setCustomers((prev) => {
        if (prev.length >= 3) return prev; // max 3 customers in queue

        // Marketing campaign attracts customers faster
        const chance = upgradesRef.current.marketingLevel > 0
          ? 0.7 + (upgradesRef.current.marketingLevel * 0.1)
          : 0.55;

        if (Math.random() < chance) {
          sfx.playDoorBell();
          return [...prev, generateRandomCustomer()];
        }
        return prev;
      });
    }, 5500); // try spawn every 5.5s

    return () => clearInterval(spawnInterval);
  }, [gameState, generateRandomCustomer]);

  // Handle inventory additions / raw slicing
  const handleSliceMeat = useCallback((type: 'chicken' | 'beef', amount: number) => {
    setInventory((prev) => ({
      ...prev,
      [type]: prev[type] + amount,
    }));
  }, []);

  const handleConsumeInventory = useCallback((item: keyof Inventory, amount: number) => {
    setInventory((prev) => ({
      ...prev,
      [item]: Math.max(0, prev[item] - amount),
    }));
  }, []);

  const handleRefundInventory = useCallback((items: Partial<Inventory>) => {
    setInventory((prev) => {
      const copy = { ...prev };
      Object.keys(items).forEach((k) => {
        const key = k as keyof Inventory;
        copy[key] = (copy[key] || 0) + (items[key] || 0);
      });
      return copy;
    });
  }, []);

  // Upgrade Purchase
  const handleBuyUpgrade = (key: keyof ShopUpgrades, cost: number) => {
    if (money < cost) return;
    setMoney((prev) => prev - cost);
    setUpgrades((prev) => ({
      ...prev,
      [key]: true,
    }));
  };

  // Pre-day ingredients stocking
  const handleBuyIngredients = (items: Partial<Inventory>, totalCost: number) => {
    if (money < totalCost) return;
    setMoney((prev) => prev - totalCost);
    setInventory((prev) => {
      const copy = { ...prev };
      Object.keys(items).forEach((k) => {
        const key = k as keyof Inventory;
        copy[key] = (copy[key] || 0) + (items[key] || 0);
      });
      return copy;
    });

    setDayEarnings((prev) => ({
      ...prev,
      expenseIngredients: prev.expenseIngredients + totalCost,
    }));
  };

  // Emergency Express Delivery (during gameplay)
  const handleEmergencyOrder = (item: keyof Inventory) => {
    const cost = EMERGENCY_PRICES[item === 'chicken' ? 'chickenMeat' : item === 'beef' ? 'beefMeat' : item] * 5;
    if (money < cost) {
      sfx.playSadBuzz();
      return;
    }

    // Play drone sound
    sfx.playDoorBell();
    setTimeout(() => sfx.playCoin(), 150);

    setMoney((prev) => prev - cost);
    setInventory((prev) => ({
      ...prev,
      [item]: prev[item] + 5,
    }));

    setDayEarnings((prev) => ({
      ...prev,
      expenseExpress: prev.expenseExpress + cost,
    }));
  };

  // Start the workday
  const handleStartDay = () => {
    // Reset day reports
    setDayTimer(configuredDayDuration);
    setDayEarnings({
      revenue: 0,
      tips: 0,
      expenseIngredients: dayEarnings.expenseIngredients, // preserve what they spent in DaySetup
      expenseExpress: 0,
      servedCount: 0,
      angryCount: 0,
    });

    // Populate with 2 starting customers immediately
    sfx.playHappyChime();
    setCustomers([generateRandomCustomer(), generateRandomCustomer()]);
    setCurrentWrap(null);
    setGameState('playing');
  };

  // End of the day
  const handleEndDay = () => {
    setGameState('report');

    // Calculate rating stars (1 to 5)
    let stars = 5;
    const angryCount = dayEarnings.angryCount;
    const served = dayEarnings.servedCount;

    if (angryCount > 0) stars = 4;
    if (angryCount >= 3) stars = 3;
    if (angryCount >= 5) stars = 2;
    if (served === 0) stars = 1;

    // Financial calculations
    const netProfit = (dayEarnings.revenue + dayEarnings.tips) - (dayEarnings.expenseIngredients + dayEarnings.expenseExpress);
    setMoney((prev) => prev + dayEarnings.revenue + dayEarnings.tips);

    const report: DayReport = {
      dayNumber,
      revenue: dayEarnings.revenue,
      tips: dayEarnings.tips,
      expenseIngredients: dayEarnings.expenseIngredients,
      expenseExpress: dayEarnings.expenseExpress,
      netProfit,
      customersServed: served,
      customersAngry: angryCount,
      stars,
      funSummary: '',
    };

    setActiveDayReport(report);
  };

  // Move to next day setup phase
  const handleNextDay = () => {
    setDayNumber((d) => d + 1);
    setGameState('setup');
    setCustomers([]);
    setCurrentWrap(null);
    setDayEarnings({
      revenue: 0,
      tips: 0,
      expenseIngredients: 0,
      expenseExpress: 0,
      servedCount: 0,
      angryCount: 0,
    });
  };

  // Serving engine: evaluates served sandwich against active customer specifications
  const handleServeCustomer = (customerId: string) => {
    const wrap = currentWrapRef.current;
    if (!wrap) return;

    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return;

    // EVALUATION MOTOR
    let score = 100;
    let mistakes: string[] = [];

    // 1. Check Bread Type
    if (wrap.bread !== customer.order.bread) {
      sfx.playSadBuzz();
      setReputation((r) => Math.max(0, r - 15));
      setDayEarnings((prev) => ({ ...prev, angryCount: prev.angryCount + 1 }));
      setCustomers((prev) => prev.filter((c) => c.id !== customerId));
      setCurrentWrap(null);

      setServeFeedback({
        success: false,
        customerName: customer.name,
        avatar: customer.avatar,
        score: 0,
        tip: 0,
        dialogue: `لقد طلبت خبز ${customer.order.bread === 'saj' ? 'صاج مبروم' : 'عربي كلاسيكي'} وأنت وضعت خبز ${wrap.bread === 'saj' ? 'صاج' : 'عربي'}! كيف آكل هذا؟ 😡`,
        mistakes: [`نوع الخبز المستعمل خاطئ كلياً وغير مطابق للطلب`],
      });
      return;
    }

    // 2. Check Meat Type
    const wrapHasChicken = wrap.fillings.chicken > 0;
    const wrapHasBeef = wrap.fillings.beef > 0;

    if (customer.order.meat === 'chicken' && (wrapHasBeef || !wrapHasChicken)) {
      sfx.playSadBuzz();
      setReputation((r) => Math.max(0, r - 15));
      setDayEarnings((prev) => ({ ...prev, angryCount: prev.angryCount + 1 }));
      setCustomers((prev) => prev.filter((c) => c.id !== customerId));
      setCurrentWrap(null);

      setServeFeedback({
        success: false,
        customerName: customer.name,
        avatar: customer.avatar,
        score: 0,
        tip: 0,
        dialogue: `لقد طلبت شاورما دجاج ذهبية متبلة وأنت وضعت شاورما لحم أو نسيت الدجاج! 😡`,
        mistakes: [`اللحم خاطئ (مطلوب شاورما دجاج طازجة)`],
      });
      return;
    }
    if (customer.order.meat === 'beef' && (wrapHasChicken || !wrapHasBeef)) {
      sfx.playSadBuzz();
      setReputation((r) => Math.max(0, r - 15));
      setDayEarnings((prev) => ({ ...prev, angryCount: prev.angryCount + 1 }));
      setCustomers((prev) => prev.filter((c) => c.id !== customerId));
      setCurrentWrap(null);

      setServeFeedback({
        success: false,
        customerName: customer.name,
        avatar: customer.avatar,
        score: 0,
        tip: 0,
        dialogue: `لقد طلبت شاورما لحم عجل بالخلطة السرية وأنت وضعت شاورما دجاج! 😡`,
        mistakes: [`اللحم خاطئ (مطلوب شاورما لحم عجل بالدهنة)`],
      });
      return;
    }
    if (customer.order.meat === 'mixed' && (!wrapHasChicken || !wrapHasBeef)) {
      sfx.playSadBuzz();
      setReputation((r) => Math.max(0, r - 15));
      setDayEarnings((prev) => ({ ...prev, angryCount: prev.angryCount + 1 }));
      setCustomers((prev) => prev.filter((c) => c.id !== customerId));
      setCurrentWrap(null);

      setServeFeedback({
        success: false,
        customerName: customer.name,
        avatar: customer.avatar,
        score: 0,
        tip: 0,
        dialogue: `لقد طلبت شاورما مشكل دجاج ولحم معاً وأنت نسيت أحدهما! 😡`,
        mistakes: [`لم تخلط اللحم والدجاج معاً كما تقتضي أصول الساندويشة المشكلة`],
      });
      return;
    }

    // 3. Toasted Correctness
    if (wrap.grillProgress >= 90) {
      sfx.playSadBuzz();
      setReputation((r) => Math.max(0, r - 15));
      setDayEarnings((prev) => ({ ...prev, angryCount: prev.angryCount + 1 }));
      setCustomers((prev) => prev.filter((c) => c.id !== customerId));
      setCurrentWrap(null);

      setServeFeedback({
        success: false,
        customerName: customer.name,
        avatar: customer.avatar,
        score: 0,
        tip: 0,
        dialogue: `هذه الشاورما متفحمة ومحروقة تماماً كأنها فحم من الموقد! لن آكل هذا! 😡`,
        mistakes: [`الساندويش محروق ومتفحم كلياً بسبب الإفراط في الكبس والتحميص`],
      });
      return;
    }

    // 4. Extras Checklists
    if (customer.order.garlic && !wrap.sauces.garlic) {
      score -= 20;
      mistakes.push('نسيت دهن الثومية الكلاسيكية');
    }
    if (customer.order.tahini && !wrap.sauces.tahini) {
      score -= 20;
      mistakes.push('نسيت صوص الطحينة المميز');
    }
    if (customer.order.spicy && !wrap.sauces.spicy) {
      score -= 15;
      mistakes.push('نسيت الشطة الحارة للأسف');
    } else if (!customer.order.spicy && wrap.sauces.spicy) {
      score -= 35;
      mistakes.push('وضعت شطة حارة حارقة وأنا لا أتحملها!');
    }

    if (customer.order.pickles && !wrap.fillings.pickles) {
      score -= 15;
      mistakes.push('نسيت مخلل الخيار المقرمش');
    } else if (!customer.order.pickles && wrap.fillings.pickles) {
      score -= 15;
      mistakes.push('وضعت مخللاً وأنا طلبته بدونه');
    }

    if (customer.order.fries && !wrap.fillings.fries) {
      score -= 15;
      mistakes.push('نسيت أصابع البطاطا المقرمشة بالداخل');
    } else if (!customer.order.fries && wrap.fillings.fries) {
      score -= 15;
      mistakes.push('وضعت بطاطا داخل الساندويش عن طريق الخطأ');
    }

    if (customer.order.pomegranate && !wrap.fillings.pomegranate) {
      score -= 20;
      mistakes.push('نسيت قطرات دبس الرمان الفاخرة');
    } else if (!customer.order.pomegranate && wrap.fillings.pomegranate) {
      score -= 15;
      mistakes.push('وضعت دبس رمان حلو وأفسدت نكهة اللحم الكلاسيكية');
    }

    // 5. Check serving cuts style
    if (customer.order.serveType === 'arabic' && !wrap.isSliced) {
      score -= 30;
      mistakes.push('أردتها وجبة عربي مقطعة بالعلبة وأنت قدمت ساندويشاً كاملاً');
    } else if (customer.order.serveType === 'sandwich' && wrap.isSliced) {
      score -= 20;
      mistakes.push('أردت ساندويشاً رول للأكل المباشر وأنت قمت بتقطيعها كوجبة عربي');
    }

    // Un-toasted warning
    if (wrap.grillProgress < 40) {
      score -= 15;
      mistakes.push('الساندويش نيء وبارد، لم يلمس كبّاسة التقمير بالشكل الكافي');
    }

    // Evaluate final payoff
    const isPerfect = mistakes.length === 0 && wrap.grillProgress >= 55 && wrap.grillProgress <= 78;

    // Calculations of Price
    let basePrice = customer.order.bread === 'saj' ? 8.50 : 5.50;
    if (customer.order.serveType === 'arabic') {
      basePrice += 4.00; // premium for slicing packaging and fries on side
      if (upgradesRef.current.arabicMealBoxRoyal) {
        basePrice += 3.00; // Level 3 Royal Box Premium!
      } else if (upgradesRef.current.arabicMealBoxPro) {
        basePrice += 1.50; // Level 2 Pro Box Premium!
      }
    }
    if (customer.order.meat === 'beef') {
      basePrice += 2.00; // premium for beef
    } else if (customer.order.meat === 'mixed') {
      basePrice += 3.00; // mixed is expensive double meat
    }

    // Tip algorithms
    let tip = 0;
    if (isPerfect) {
      tip += basePrice * 0.40; // 40% tips for perfect crisp golden wrap!
    } else if (score > 80) {
      tip += basePrice * 0.15;
    }

    if (customer.order.serveType === 'arabic') {
      if (upgradesRef.current.arabicMealBoxRoyal) {
        tip += 2.00; // Extra royal tip
      } else if (upgradesRef.current.arabicMealBoxPro) {
        tip += 1.00; // Extra pro tip
      }
    }

    // patience bonus/penalty
    if (customer.patience > 75) {
      tip += 1.50; // fast service tip!
    }

    // apply score multiplier
    const finalEarned = (basePrice * (score / 100));

    // trigger SFX
    if (score >= 60) {
      sfx.playHappyChime();
      sfx.playCoin();
    } else {
      sfx.playSadBuzz();
    }

    // Trigger visual feedback state instead of blocking alert!
    let dialogueMessage = '';
    if (score >= 90) {
      dialogueMessage = `يا إلهي! طعم خرافي، والقرمشة الذهبية تعدل المزاج! يعطيك ألف عافية يا فنان الشاورما! 😍🔥`;
    } else if (score >= 75) {
      dialogueMessage = `ساندويش لذيذ ودافئ ويسد الجوع تماماً، شكرًا لك يا بني! 👍`;
    } else if (score >= 50) {
      dialogueMessage = `لا بأس به، ولكن ركّز أكثر في المرات القادمة على المكونات والتحميص ليكون الطلب ممتازًا. 🙂`;
    } else {
      dialogueMessage = `الطلب سيئ جداً وبعيد عما طلبته، لن آكل منه إلا القليل! 😢`;
    }

    setServeFeedback({
      success: score >= 60,
      customerName: customer.name,
      avatar: customer.avatar,
      score,
      tip,
      dialogue: dialogueMessage,
      mistakes,
    });

    // Update Stats
    setReputation((r) => Math.min(100, r + (score >= 85 ? 5 : score < 60 ? -10 : 0)));
    setDayEarnings((prev) => ({
      ...prev,
      revenue: prev.revenue + finalEarned,
      tips: prev.tips + tip,
      servedCount: prev.servedCount + 1,
    }));

    // Remove customer from active queue
    setCustomers((prev) => prev.filter((c) => c.id !== customerId));
    setCurrentWrap(null);
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans select-none pb-8">
      {/* Header Bar */}
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-2.5 sm:py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center justify-between w-full sm:w-auto gap-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl sm:text-3xl leading-none">🌯</span>
              <div>
                <h1 className="text-sm sm:text-lg font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 flex items-center gap-1.5 font-sans">
                  محاكي الشاورما الواقعي
                </h1>
                <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider">النسخة السريعة الذهبية للقرية</p>
              </div>
            </div>

            {/* Controls inside top row on mobile */}
            <div className="flex sm:hidden items-center gap-1.5">
              <button
                onClick={handleToggleMusic}
                className={`p-1.5 border rounded-lg transition-all cursor-pointer ${
                  isMusicPlaying
                    ? 'bg-amber-500 border-amber-400 text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
                title={isMusicPlaying ? 'إيقاف موسيقى الخلفية' : 'تشغيل موسيقى الخلفية (Ambient)'}
              >
                <Music className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleToggleMute}
                className="p-1.5 bg-slate-900 border border-slate-850 rounded-lg hover:bg-slate-850 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => setShowHowToModal(true)}
                className="p-1.5 bg-slate-900 border border-slate-850 rounded-lg hover:bg-slate-850 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                title="كيفية اللعب والخطوات"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => { sfx.playWrap(); setShowSettingsModal(true); }}
                className="p-1.5 bg-slate-900 border border-slate-850 rounded-lg hover:bg-slate-850 text-slate-400 hover:text-slate-200 transition-all cursor-pointer text-amber-400"
                title="إعدادات وقت اليوم"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Stats Badges */}
          <div className="flex items-center justify-between sm:justify-start gap-2 text-xs font-mono w-full sm:w-auto">
            {/* Money */}
            <div className="bg-emerald-950/40 border border-emerald-500/20 px-2.5 py-1.5 rounded-full flex-1 sm:flex-initial flex items-center justify-center gap-1 font-bold text-emerald-400 shadow-md shadow-emerald-500/5 text-[10px] sm:text-xs">
              <DollarSign className="w-3.5 h-3.5" />
              <span>${money.toFixed(2)}</span>
            </div>

            {/* Rep */}
            <div className="bg-indigo-950/40 border border-indigo-500/20 px-2.5 py-1.5 rounded-full flex-1 sm:flex-initial flex items-center justify-center gap-1 font-bold text-indigo-400 shadow-md text-[10px] sm:text-xs">
              <TrendingUp className="w-3.5 h-3.5" />
              <span><span className="hidden sm:inline">سمعة: </span>{reputation}%</span>
            </div>

            {/* Day */}
            <div className="bg-amber-950/40 border border-amber-500/20 px-2.5 py-1.5 rounded-full flex-1 sm:flex-initial flex items-center justify-center gap-1 font-bold text-amber-400 shadow-md text-[10px] sm:text-xs">
              <span>اليوم {dayNumber}</span>
            </div>
          </div>

          {/* Controls for desktop screen */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={handleToggleMusic}
              className={`p-2 border rounded-lg transition-all cursor-pointer ${
                isMusicPlaying
                  ? 'bg-amber-500 border-amber-400 text-slate-950 hover:bg-amber-400 shadow-lg shadow-amber-500/20 animate-pulse'
                  : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
              title={isMusicPlaying ? 'إيقاف موسيقى الخلفية' : 'تشغيل موسيقى الخلفية (Ambient)'}
            >
              <Music className="w-4 h-4" />
            </button>

            <button
              onClick={handleToggleMute}
              className="p-2 bg-slate-900 border border-slate-850 rounded-lg hover:bg-slate-850 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
              title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setShowHowToModal(true)}
              className="p-2 bg-slate-900 border border-slate-850 rounded-lg hover:bg-slate-850 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
              title="كيفية اللعب والخطوات"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            <button
              onClick={() => { sfx.playWrap(); setShowSettingsModal(true); }}
              className="p-2 bg-slate-900 border border-slate-850 rounded-lg hover:bg-slate-850 text-slate-400 hover:text-slate-200 transition-all cursor-pointer text-amber-400 flex items-center gap-1.5 font-bold"
              title="إعدادات وقت اليوم"
            >
              <Settings className="w-4 h-4" />
              <span className="text-xs hidden md:inline">الإعدادات</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Screen Content Router */}
      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full flex flex-col justify-center items-stretch">
        {/* TUTORIAL / SPLASH STATE */}
        {gameState === 'tutorial' && (
          <div className="bg-slate-900/85 border border-slate-800 rounded-2xl p-6 md:p-8 max-w-2xl mx-auto text-center space-y-6 shadow-2xl backdrop-blur-md">
            <span className="text-6xl animate-bounce block">🌯🍗🧄</span>
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-black text-amber-400 font-sans">لقد ورثت كشك الشاورما الأشهر!</h2>
              <p className="text-xs text-slate-300 leading-relaxed font-sans max-w-lg mx-auto">
                لقد ورثت كشك شاورما متواضع من جدك المعلم أبو أحمد. مهمتك هي قيادة هذا المحل، وإعداد ألذ ساندويشات الشاورما الطازجة، وتلبية طلبات الزبائن غريبي الأطوار في القرية لترقية وتطوير مطعمك الصغير ليصبح ملك الساحة الأول!
              </p>
            </div>

            {/* Steps guidelines cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-right text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                <span className="text-xl">1. 🔪 قص اللحم</span>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">انقر باستمرار على سيخ الشاورما الدوار لقص لحم الدجاج أو اللحم المطهو في الوعاء.</p>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                <span className="text-xl">2. 🫓 افرد الخبز</span>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">اختر خبز عربي كلاسيكي أو صاج ملكي (حسب طلب الزبون بالضبط) لفرده على طاولة التحضير.</p>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                <span className="text-xl">3. 🥫 دهن وحشو</span>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">ضع صوص الثومية أو الطحينة، ثم حمّل شاورما، بطاطا، مخللات، ودبس رمان بمقادير دقيقة.</p>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                <span className="text-xl">4. 🌯 لف الساندويش</span>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">انقر على &quot;لف الساندويش&quot; لرول الخبز وتجهيزه لمرحلة الكبس والتحميص.</p>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                <span className="text-xl">5. 🔥 الكبس والتقمير</span>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">اضغط باستمرار على الكباسة للحصول على لون محمص ذهبي (55%-78%). انتبه لئلا تحترق شاورمتك!</p>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                <span className="text-xl">6. 🍱 تقديم عربي</span>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">اقطع الساندويش لتقديمها كـ &quot;وجبة عربي بالعلبة&quot; أو قدمها كاملة كساندويش لتربح المال الحلال!</p>
              </div>
            </div>

            <button
              onClick={() => {
                sfx.playDoorBell();
                setGameState('setup');
                // Auto-activate lovely background lofi music!
                setIsMusicPlaying(true);
                sfx.startAmbientMusic();
              }}
              className="py-3 px-8 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-sm transition-all shadow-lg shadow-orange-500/20 active:scale-[0.98] cursor-pointer"
            >
              افتح أبواب المحل وابدأ المغامرة! 🚀
            </button>
          </div>
        )}

        {/* SETUP PHASE (INVENTORY & UPGRADE) */}
        {gameState === 'setup' && (
          <div className="space-y-6">
            {/* Tab switchers */}
            <div className="flex bg-slate-950 rounded-xl p-1 border border-slate-850 max-w-sm mx-auto">
              <button
                onClick={() => setActiveTab('prep')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'prep' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                📦 تموين المكونات
              </button>
              <button
                onClick={() => setActiveTab('skewers')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'skewers' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ⚡ متجر التطويرات
              </button>
            </div>

            {activeTab === 'prep' ? (
              <DaySetup
                money={money}
                inventory={inventory}
                upgrades={upgrades}
                prices={INVENTORY_PRICES}
                onBuyIngredients={handleBuyIngredients}
                onStartDay={handleStartDay}
                dayNumber={dayNumber}
              />
            ) : (
              <UpgradesMenu
                money={money}
                upgrades={upgrades}
                onBuyUpgrade={handleBuyUpgrade}
              />
            )}
          </div>
        )}

        {/* DAY PLAYING GAMEPLAY LOOP */}
        {gameState === 'playing' && (
          <div className="flex flex-col gap-5">
            {/* Top Game Bar HUD */}
            <div className="bg-slate-950/90 rounded-2xl p-3 border border-slate-850 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
              {/* Day Time left */}
              <div className="flex items-center justify-between md:justify-start w-full md:w-auto gap-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500 animate-pulse" />
                  <span className="text-slate-400">الوقت المتبقي لليوم:</span>
                </div>
                <span className="font-mono text-base font-black text-amber-400">{dayTimer} ثانية</span>
              </div>

              {/* Stock Alerts & Quick refills shortcut */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider border-r-2 sm:border-r-0 sm:border-l border-amber-500 sm:border-slate-800 pr-2 sm:pr-0 sm:pl-2 text-right sm:text-left">
                  شحن طارئ (+5 قطع):
                </span>
                <div className="flex gap-1.5 overflow-x-auto pb-1.5 sm:pb-0 scrollbar-thin">
                  <button
                    onClick={() => handleEmergencyOrder('pita')}
                    disabled={money < EMERGENCY_PRICES.pita * 5}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] px-2 py-1.5 rounded-lg text-slate-300 disabled:opacity-40 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    🫓 عربي (${(EMERGENCY_PRICES.pita * 5).toFixed(0)})
                  </button>
                  {upgrades.unlockedSaj && (
                    <button
                      onClick={() => handleEmergencyOrder('saj')}
                      disabled={money < EMERGENCY_PRICES.saj * 5}
                      className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] px-2 py-1.5 rounded-lg text-slate-300 disabled:opacity-40 cursor-pointer whitespace-nowrap shrink-0"
                    >
                      🌯 صاج (${(EMERGENCY_PRICES.saj * 5).toFixed(0)})
                    </button>
                  )}
                  <button
                    onClick={() => handleEmergencyOrder('chicken')}
                    disabled={money < EMERGENCY_PRICES.chickenMeat * 5}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] px-2 py-1.5 rounded-lg text-slate-300 disabled:opacity-40 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    🍗 دجاج (${(EMERGENCY_PRICES.chickenMeat * 5).toFixed(0)})
                  </button>
                  {upgrades.unlockedBeef && (
                    <button
                      onClick={() => handleEmergencyOrder('beef')}
                      disabled={money < EMERGENCY_PRICES.beefMeat * 5}
                      className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] px-2 py-1.5 rounded-lg text-slate-300 disabled:opacity-40 cursor-pointer whitespace-nowrap shrink-0"
                    >
                      🥩 لحم (${(EMERGENCY_PRICES.beefMeat * 5).toFixed(0)})
                    </button>
                  )}
                  {!upgrades.autoGarlic && (
                    <button
                      onClick={() => handleEmergencyOrder('garlic')}
                      disabled={money < EMERGENCY_PRICES.garlic * 5}
                      className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] px-2 py-1.5 rounded-lg text-slate-300 disabled:opacity-40 cursor-pointer whitespace-nowrap shrink-0"
                    >
                      🧄 ثومية (${(EMERGENCY_PRICES.garlic * 5).toFixed(0)})
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile View Tab bar toggle (hidden on large displays) */}
            <div className="lg:hidden flex bg-slate-950 rounded-xl p-1 border border-slate-850">
              <button
                onClick={() => setActiveTab('customers')}
                className={`flex-1 py-2 text-[11px] font-black rounded-lg transition-all cursor-pointer ${
                  activeTab === 'customers' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                }`}
              >
                👥 طابور الزبائن ({customers.length})
              </button>
              <button
                onClick={() => setActiveTab('prep')}
                className={`flex-1 py-2 text-[11px] font-black rounded-lg transition-all cursor-pointer ${
                  activeTab === 'prep' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                }`}
              >
                🌯 طاولة التحضير {currentWrap && '🔵'}
              </button>
              <button
                onClick={() => setActiveTab('skewers')}
                className={`flex-1 py-2 text-[11px] font-black rounded-lg transition-all cursor-pointer ${
                  activeTab === 'skewers' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                }`}
              >
                🔥 سيخ القص
              </button>
            </div>

            {/* Desktop Layout or responsive active view */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              {/* Active customer queue (3 columns) */}
              <div className={`lg:col-span-4 ${activeTab === 'customers' ? 'block' : 'hidden lg:block'}`}>
                <CustomersArea
                  customers={customers}
                  onServe={handleServeCustomer}
                  currentWrap={currentWrap}
                  isDayActive={gameState === 'playing'}
                />
              </div>

              {/* Preparation board workstation (5 columns) */}
              <div className={`lg:col-span-5 ${activeTab === 'prep' ? 'block' : 'hidden lg:block'}`}>
                <Workstation
                  inventory={inventory}
                  upgrades={upgrades}
                  currentWrap={currentWrap}
                  isDayActive={gameState === 'playing'}
                  onUpdateWrap={setCurrentWrap}
                  onConsumeInventory={handleConsumeInventory}
                  onRefundInventory={handleRefundInventory}
                />
              </div>

              {/* Rotisserie spits slicer (3 columns) */}
              <div className={`lg:col-span-3 ${activeTab === 'skewers' ? 'block' : 'hidden lg:block'}`}>
                <SkewersArea
                  inventory={inventory}
                  upgrades={upgrades}
                  onSliceMeat={handleSliceMeat}
                  isDayActive={gameState === 'playing'}
                />
              </div>
            </div>
          </div>
        )}

        {/* REPORT SHEET STATE */}
        {gameState === 'report' && activeDayReport && (
          <EndDayReport
            report={activeDayReport}
            onNextDay={handleNextDay}
          />
        )}
      </main>

      {/* FOOTER */}
      <footer className="text-center text-[11px] text-slate-600 mt-8 space-y-1">
        <p>© 2026 محاكي الشاورما الواقعي - كود ألعاب متطور بالكامل في الذكاء الاصطناعي</p>
        <p>مصمم لمحاكاة واقعية للغاية لوصفات الشاورما العربية، كبّاسة التقمير، ومخزون المطبخ الطازج.</p>
      </footer>

      {/* HOW TO PLAY TUTORIAL DIALOG MODAL */}
      {showHowToModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg p-5 text-right space-y-4 shadow-2xl relative">
            <h3 className="text-lg font-black text-amber-400">📖 دليل تشغيل كشك الشاورما</h3>

            <div className="space-y-3 text-xs leading-relaxed text-slate-300">
              <div className="space-y-1">
                <span className="font-bold text-slate-100 block">1. استلام طلب الزبون:</span>
                <p>شاهد قائمة طابور الزبائن بالجانب الأيسر. يريد كل زبون مواصفات خاصة: لحمة معينة (دجاج أو لحم)، نوع خبز معين، صوصات محددة (ثومية للدجاج وطحينة للحم) ومقبلات (مخلل وبطاطا ودبس رمان).</p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-100 block">2. قص الشاورما طازجة:</span>
                <p>بالجانب الأيمن، انقر باستمرار على السيخ الدوار لقص شرائح اللحم الساخنة في وعاء التقطيع. تأكد من توفر حصص جاهزة لتستخدمها بالحشو.</p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-100 block">3. تجهيز ورول الخبز:</span>
                <p>بالقسم الأوسط، اضغط على نوع الخبز العربي أو الصاج، ثم ضع المكونات المطلوبة فقط. اضغط على &quot;لف الساندويش&quot; لتجهيزها.</p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-100 block">4. كبس مقرمش ذهبي:</span>
                <p>بعد اللف، ضع الساندويش على الكباسة واضغط باستمرار. أفضل نسبة كبس هي <span className="text-emerald-400 font-bold">بين 55% و 78%</span>. إذا تجاوزت 90% ستحترق وتتلف الشاورما كلياً!</p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-100 block">5. التقديم والربح:</span>
                <p>إذا طلب الزبون وجبة مقطعة عربي، اضغط على &quot;تقطيع عربي&quot; أولاً قبل التقديم. قدم الساندويش للزبون المطلوب في طابوره واجمع المال الحلال والإكراميات الكبيرة!</p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  sfx.playWrap();
                  setShowHowToModal(false);
                }}
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition-all cursor-pointer"
              >
                حسناً، فهمت الخطوات!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM REALTIME CUSTOMER SERVE FEEDBACK POPUP */}
      {serveFeedback && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-500/30 rounded-2xl max-w-md w-full p-6 text-right space-y-5 shadow-2xl shadow-amber-500/10 relative animate-in fade-in zoom-in duration-300">
            
            {/* Header with Customer Avatar */}
            <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
              <span className="text-5xl bg-slate-950 p-2.5 rounded-2xl border border-slate-800">{serveFeedback.avatar}</span>
              <div className="flex-1">
                <span className="text-xs text-amber-400 font-bold tracking-wider">تقييم الزبون للخدمة</span>
                <h3 className="text-lg font-black text-slate-100">{serveFeedback.customerName}</h3>
              </div>
              <div className="flex flex-col items-center bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-850">
                <span className="text-[10px] text-slate-500 font-bold uppercase">التقييم</span>
                <span className={`text-xl font-mono font-black ${serveFeedback.score >= 85 ? 'text-emerald-400' : serveFeedback.score >= 60 ? 'text-yellow-400' : 'text-rose-400'}`}>
                  {serveFeedback.score}/100
                </span>
              </div>
            </div>

            {/* Customer Quote dialogue */}
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-850 text-xs italic text-slate-300 leading-relaxed relative">
              <span className="absolute left-2 bottom-1 text-2xl text-slate-800 font-serif leading-none">”</span>
              <p>&quot;{serveFeedback.dialogue}&quot;</p>
            </div>

            {/* Tip & Earnings summary */}
            {serveFeedback.score >= 50 && (
              <div className="bg-emerald-950/20 border border-emerald-500/20 p-3 rounded-xl flex items-center justify-between text-xs font-bold text-emerald-400">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span>الإكرامية (البقشيش) المكتسب:</span>
                </div>
                <span className="font-mono text-sm font-black text-emerald-300">+${serveFeedback.tip.toFixed(2)}</span>
              </div>
            )}

            {/* Mistakes / Corrections List */}
            {serveFeedback.mistakes.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] text-slate-400 font-black tracking-wider block">الأخطاء والملاحظات الفنية:</span>
                <div className="bg-slate-950/70 rounded-xl p-3 border border-slate-850 text-xs space-y-1.5 text-rose-300">
                  {serveFeedback.mistakes.map((mistake, index) => (
                    <div key={index} className="flex items-start gap-2 justify-end">
                      <span>{mistake}</span>
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action button to resume */}
            <button
              onClick={() => {
                sfx.playCoin();
                setServeFeedback(null);
              }}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black rounded-xl text-xs transition-all active:scale-[0.98] shadow-lg shadow-orange-500/10 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>استمر في تحضير الشاورما الحلال 🌯</span>
            </button>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-right space-y-6 shadow-2xl relative animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-slate-200 text-xs font-bold bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg"
              >
                إغلاق ✕
              </button>
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-400" />
                <h3 className="text-base sm:text-lg font-bold font-sans text-slate-100">إعدادات المحل</h3>
              </div>
            </div>

            <div className="space-y-4 text-right">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold block">وقت اليوم النشط (بالثواني):</label>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  قم بتعديل مدة اليوم لتناسب أسلوب لعبك. المدة الافتراضية هي 120 ثانية (لا تقل عن 100 ولا تزيد عن 1000 ثانية).
                </p>
              </div>

              {/* Slider & Input */}
              <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-xl border border-slate-850">
                <div className="text-center shrink-0 bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg">
                  <span className="text-[9px] text-slate-500 font-bold block">الوقت</span>
                  <span className="font-mono text-base font-black text-amber-400">{configuredDayDuration}s</span>
                </div>
                
                <div className="flex-1 space-y-2">
                  <input
                    type="range"
                    min="100"
                    max="1000"
                    step="10"
                    value={configuredDayDuration}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setConfiguredDayDuration(val);
                      sfx.playWrap();
                    }}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                    <span>100s</span>
                    <span>500s</span>
                    <span>1000s</span>
                  </div>
                </div>
              </div>

              {/* Direct number input */}
              <div className="flex items-center justify-between gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-850 text-xs">
                <input
                  type="number"
                  min="100"
                  max="1000"
                  value={configuredDayDuration}
                  onChange={(e) => {
                    let val = Number(e.target.value);
                    if (val > 1000) val = 1000;
                    if (val < 0) val = 0; // allow typing
                    setConfiguredDayDuration(val);
                  }}
                  onBlur={() => {
                    if (configuredDayDuration < 100) {
                      setConfiguredDayDuration(100);
                    }
                    if (configuredDayDuration > 1000) {
                      setConfiguredDayDuration(1000);
                    }
                  }}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-center font-mono text-amber-400 w-24 focus:outline-none focus:border-amber-500 font-bold"
                />
                <span className="text-slate-300">أو اكتب الوقت بدقة (ثانية):</span>
              </div>

              {/* Presets */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 font-bold block">تحديد سريع:</span>
                <div className="grid grid-cols-4 gap-1.5 text-[10px] sm:text-xs">
                  {[
                    { label: 'كلاسيكي (120)', val: 120 },
                    { label: 'متزن (180)', val: 180 },
                    { label: 'هادئ (300)', val: 300 },
                    { label: 'الملكي (600)', val: 600 },
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      onClick={() => {
                        setConfiguredDayDuration(preset.val);
                        sfx.playCoin();
                      }}
                      className={`py-1.5 px-1 rounded-lg border text-center font-bold transition-all cursor-pointer ${
                        configuredDayDuration === preset.val
                          ? 'bg-amber-500 border-amber-400 text-slate-950'
                          : 'bg-slate-950 hover:bg-slate-850 border-slate-850 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {gameState === 'playing' && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl text-[10px] text-amber-300 leading-normal">
                  ⚠️ <strong>ملاحظة:</strong> بما أن اليوم نشط حالياً، سيتم تطبيق وقت اليوم الجديد عند بدء اليوم التالي من مرحلة التموين.
                </div>
              )}
            </div>

            <button
              onClick={() => {
                sfx.playCoin();
                let val = configuredDayDuration;
                if (val < 100) val = 100;
                if (val > 1000) val = 1000;
                setConfiguredDayDuration(val);
                setShowSettingsModal(false);
              }}
              className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black rounded-xl text-xs sm:text-sm transition-all active:scale-[0.98] shadow-lg shadow-orange-500/10 cursor-pointer text-center"
            >
              حفظ الإعدادات والعودة 💾
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
