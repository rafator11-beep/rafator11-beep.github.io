export type Card = string; // format: "Ah", "Kd", "2s", "Tc" (T=10)

export enum HandRank {
  HighCard = 0,
  Pair = 1,
  TwoPair = 2,
  ThreeOfAKind = 3,
  Straight = 4,
  Flush = 5,
  FullHouse = 6,
  FourOfAKind = 7,
  StraightFlush = 8,
}

export interface HandResult {
  rank: HandRank;
  value: number; // For tie-breaking
  description: string;
  cards: Card[]; // The best 5 cards
}

const VALUES = "23456789TJQKA";
const SUITS = "H D S C".split(" ");

export function getHandResult(cards: Card[]): HandResult {
  // Normalize input to uppercase (Bug 18 normalization)
  const normalizedCards = cards.map(c => (c[0] + c[1]).toUpperCase());
  
  // 1. Get all combinations of 5 from cards (up to 7)
  const combinations = getCombinations(normalizedCards, 5);
  
  let bestHand: HandResult | null = null;

  for (const combo of combinations) {
    const result = evaluateFiveCards(combo);
    if (!bestHand || compareResults(result, bestHand) > 0) {
      bestHand = result;
    }
  }

  return bestHand!;
}

function getCombinations(cards: Card[], k: number): Card[][] {
  if (cards.length < k) return [cards];
  const result: Card[][] = [];
  function backtrack(start: number, current: Card[]) {
    if (current.length === k) {
      result.push([...current]);
      return;
    }
    for (let i = start; i < cards.length; i++) {
      current.push(cards[i]);
      backtrack(i + 1, current);
      current.pop();
    }
  }
  backtrack(0, []);
  return result;
}

function evaluateFiveCards(cards: Card[]): HandResult {
  if (cards.length < 5) {
      return { 
          rank: HandRank.HighCard, 
          value: calculateValue(HandRank.HighCard, cards), 
          description: "Mano incompleta", 
          cards 
      };
  }
  const sorted = [...cards].sort((a, b) => VALUES.indexOf(b[0]) - VALUES.indexOf(a[0]));
  const counts: Record<string, number> = {};
  const suits: Record<string, number> = {};
  
  sorted.forEach(c => {
    counts[c[0]] = (counts[c[0]] || 0) + 1;
    suits[c[1]] = (suits[c[1]] || 0) + 1;
  });

  const valueCounts = Object.entries(counts).sort((a, b) => b[1] - a[1] || VALUES.indexOf(b[0]) - VALUES.indexOf(a[0]));
  const isFlush = Object.values(suits).some(s => s === 5);
  
  // Check for straight
  let isStraight = true;
  for (let i = 0; i < 4; i++) {
    if (VALUES.indexOf(sorted[i][0]) - VALUES.indexOf(sorted[i+1][0]) !== 1) {
      isStraight = false;
    }
  }
  // Special case: A 2 3 4 5
  if (!isStraight && "A2345".split("").every(v => counts[v])) {
    isStraight = true;
  }

  // Rank determining
  if (isStraight && isFlush) return { rank: HandRank.StraightFlush, value: calculateValue(HandRank.StraightFlush, sorted), description: "Escalera de Color", cards: sorted };
  if (valueCounts[0][1] === 4) return { rank: HandRank.FourOfAKind, value: calculateValue(HandRank.FourOfAKind, sorted, valueCounts), description: "Póker", cards: sorted };
  if (valueCounts[0][1] === 3 && valueCounts[1][1] === 2) return { rank: HandRank.FullHouse, value: calculateValue(HandRank.FullHouse, sorted, valueCounts), description: "Full House", cards: sorted };
  if (isFlush) return { rank: HandRank.Flush, value: calculateValue(HandRank.Flush, sorted), description: "Color", cards: sorted };
  if (isStraight) return { rank: HandRank.Straight, value: calculateValue(HandRank.Straight, sorted), description: "Escalera", cards: sorted };
  if (valueCounts[0][1] === 3) return { rank: HandRank.ThreeOfAKind, value: calculateValue(HandRank.ThreeOfAKind, sorted, valueCounts), description: "Trío", cards: sorted };
  if (valueCounts[0][1] === 2 && valueCounts[1][1] === 2) return { rank: HandRank.TwoPair, value: calculateValue(HandRank.TwoPair, sorted, valueCounts), description: "Dobles Parejas", cards: sorted };
  if (valueCounts[0][1] === 2) return { rank: HandRank.Pair, value: calculateValue(HandRank.Pair, sorted, valueCounts), description: "Pareja", cards: sorted };
  
  return { rank: HandRank.HighCard, value: calculateValue(HandRank.HighCard, sorted), description: "Carta Alta", cards: sorted };
}

function calculateValue(rank: HandRank, cards: Card[], valueCounts?: [string, number][]): number {
  let value = rank * 10000000;
  
  if (valueCounts) {
    // Principal values first (pairs, sets, etc)
    valueCounts.forEach((vc, i) => {
        value += VALUES.indexOf(vc[0]) * Math.pow(15, 4-i);
    });
  } else {
    // High card priority
    cards.forEach((c, i) => {
        value += VALUES.indexOf(c[0]) * Math.pow(15, 4-i);
    });
  }
  return value;
}

function compareResults(a: HandResult, b: HandResult): number {
  return a.value - b.value;
}
