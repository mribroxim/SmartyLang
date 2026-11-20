import fs from 'node:fs';
import { ITEMS } from '../src/lib/smarty/roomModel.ts';
import { biteXp } from '../src/lib/bites/xp.ts';
import { MEAL_PRICE } from '../src/lib/smarty/pantry.ts';
import { QUEST_POOL, questsFor } from '../src/lib/quests.ts';
const paid = ITEMS.filter(item => item.price > 0);
const prices = Object.fromEntries([...new Set(paid.map(item => item.price))].sort((a, b) => a - b).map(price => [price, paid.filter(item => item.price === price).length]));
const perBite = biteXp('learn', 85, false).coins;
const scenarios = [2, 4, 6].map(bites => ({ ordinaryBitesPerDay: bites, coinsPerDay: bites * perBite, coinsPerDayAfterOneMeal: bites * perBite - MEAL_PRICE, daysTo30Coins: Math.ceil(30 / (bites * perBite)), daysTo80Coins: Math.ceil(80 / (bites * perBite)) }));
const questFrequency: Record<string, number> = {};
for (let day = 1; day <= 28; day++) for (const quest of questsFor(`2026-11-${String(day).padStart(2, '0')}`, false)) questFrequency[quest.id] = (questFrequency[quest.id] || 0) + 1;
const data = {
  furniture: { total: ITEMS.length, paid: paid.length, freeCatalogItems: ITEMS.length - paid.length, prices, totalCatalogCoinCost: paid.reduce((sum, item) => sum + item.price, 0), coinCostAfterStarterGift: paid.reduce((sum, item) => sum + item.price, 0) - 30, note: 'One paid shelf variant is also a starter gift. Prices cycle by index; they do not increase monotonically.' },
  rewards: { ordinary: biteXp('meet', 100, true), today: biteXp('today', 100, true), unitTest: biteXp('meet', 90, false, true), perfectUnitTest: biteXp('meet', 100, true, true), sectionJump: biteXp('section-test', 80, false), practice: biteXp('practice', 80, false), highAccuracyPractice: biteXp('practice', 90, false), mealPrice: MEAL_PRICE },
  scenarios, assumptions: 'Ordinary lesson bites at ~85% accuracy only (5 coins each); one meal costs MEAL_PRICE. No quest coins, tests or Practice included; calculated, not observed telemetry.',
  quests: { pool: QUEST_POOL.map(({ id, target, max }) => ({ id, target, max: !!max })), picksPerDay: 3, freeFrequencyOver28Days: questFrequency, maximumQuestCoinsPerDay: 30 },
  jumpTest: { sampledWords: 12, sampleSource: 'first 30 lessons of target section', steps: ['definition: up to 12 words', 'listening: up to 5 words', 'spelling: up to 4 words'], passPercent: 80, note: 'Score is the rounded unweighted average of first-attempt step percentages, rather than word-weighted accuracy. Nominally 21 graded word presentations when all 12 translations exist. Empirical level discrimination has not been measured.' },
  meows: { promptTarget: 'about one reply in six; never consecutive', nominalPercent: 100 / 6, observedReplies: 0, note: 'Prompt guidance is not a statistical rate guarantee. No live model sample was collected.' },
  balanceRisks: ['No daily cap on Practice coins; coins per day have no finite upper bound.', 'Section-jump reward replay needs a durable one-time claim before launch.', 'The same three quests can be claimed on offline devices before merge; merging claims does not reverse duplicate fish already earned.'],
};
fs.writeFileSync('docs/balance-report.json', JSON.stringify(data, null, 2) + '\n');
console.log(JSON.stringify(data, null, 2));
