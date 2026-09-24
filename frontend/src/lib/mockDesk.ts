export type ClientStatus = 'ACTIVE' | 'SUSPENDED';
export type ClientTone = 'blue' | 'violet' | 'amber' | 'teal' | 'rose';

export type MockClient = {
  id: string;
  name: string;
  initials: string;
  tone: ClientTone;
  master: string;
  status: ClientStatus;
  position: number;
  available: number;
  exposure: number;
  limit: number;
  bets: number;
  cash: number;
  phone: string;
  joined: string;
  activity: string;
};

export function formatINR(value: number): string {
  return `₹ ${Math.abs(value).toLocaleString('en-IN')}`;
}

function initialsOf(name: string): string {
  const parts = name.split(' ');
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

export const TONES: ClientTone[] = ['blue', 'violet', 'amber', 'teal', 'rose'];
export const MASTERS = ['A. Rao', 'S. Iyer', 'K. Malhotra'];

const RAW_CLIENTS: [
  name: string,
  position: number,
  exposure: number,
  bets: number,
  cash: number,
  phone: string,
  joined: string,
  activity: string,
  status?: ClientStatus,
][] = [
  ['Rahul Verma', 482500, 116250, 12, 85000, '98213 40561', '4 Feb 2025', '2 min ago'],
  ['Priya Nair', 214800, 22400, 7, 42000, '99001 22384', '18 Aug 2024', '18 min ago'],
  ['Arjun Mehta', 876200, 250000, 26, 120000, '90112 88450', '2 Nov 2023', '41 min ago'],
  ['Sneha Kapoor', 148600, 0, 0, 25000, '98450 11209', '30 May 2025', '1 hr ago'],
  ['Vikram Rathod', 356200, 84500, 9, 60000, '97654 30012', '11 Jan 2024', '3 hr ago'],
  ['Ananya Iyer', 92400, 12800, 3, 18000, '96501 74423', '22 Sep 2025', '5 hr ago'],
  ['Karan Malhotra', 612900, 198000, 19, 95000, '95023 66710', '6 Jun 2023', 'Yesterday'],
  ['Ishita Sharma', 267300, 41200, 6, 38000, '94112 55089', '14 Mar 2025', 'Yesterday'],
  ['Rohan Bhatia', 58200, 0, 0, 12000, '93400 29981', '2 Dec 2024', '3 days ago', 'SUSPENDED'],
  ['Divya Menon', 731000, 165400, 21, 110000, '92771 40355', '19 Jul 2024', '2 hr ago'],
  ['Aditya Kulkarni', 189400, 30500, 5, 27000, '91660 82217', '8 Apr 2025', '6 hr ago'],
  ['Neha Joshi', 405600, 97800, 14, 71000, '90558 13674', '25 Oct 2023', '20 min ago'],
  ['Siddharth Rao', 523100, 140200, 17, 88000, '89441 90026', '3 Feb 2024', '9 min ago'],
  ['Pooja Desai', 76800, 9400, 2, 15000, '88337 65510', '17 Sep 2025', '1 day ago'],
  ['Manish Chawla', 298700, 52600, 8, 44000, '87226 41883', '30 Jan 2025', '47 min ago'],
  ['Kavya Pillai', 654300, 178900, 22, 102000, '86115 27749', '12 Jun 2024', '2 min ago'],
  ['Varun Sethi', 132900, 18700, 4, 21000, '85004 63315', '5 May 2025', '4 hr ago'],
  ['Ritu Agarwal', 447800, 103500, 15, 76000, '84993 84480', '28 Nov 2023', 'Yesterday'],
  ['Aakash Bansal', 39500, 0, 0, 8000, '83882 15346', '9 Aug 2025', '5 days ago', 'SUSPENDED'],
  ['Meera Krishnan', 569200, 152300, 18, 91000, '82771 50913', '21 Mar 2024', '31 min ago'],
  ['Tanmay Oberoi', 224100, 36800, 6, 33000, '81660 27680', '15 Feb 2025', '7 hr ago'],
  ['Simran Chopra', 815600, 231000, 25, 118000, '80549 98247', '4 Oct 2023', '14 min ago'],
  ['Devendra Pawar', 167300, 24100, 3, 24000, '79438 66914', '23 Jun 2025', '3 hr ago'],
  ['Anjali Trivedi', 380900, 88200, 11, 63000, '78327 35682', '10 Jan 2025', '55 min ago'],
];

export const MOCK_CLIENTS: MockClient[] = RAW_CLIENTS.map(
  ([name, position, exposure, bets, cash, phone, joined, activity, status], index) => ({
    id: `CLI-${1042 + index}`,
    name,
    initials: initialsOf(name),
    tone: TONES[index % TONES.length]!,
    master: MASTERS[index % MASTERS.length]!,
    status: status ?? 'ACTIVE',
    position,
    exposure,
    available: position - exposure,
    limit: Math.round((position + exposure) * 1.4),
    bets,
    cash,
    phone,
    joined,
    activity,
  }),
);

export type BetStatus = 'OPEN' | 'PENDING' | 'ACCEPTED' | 'SETTLED_WON' | 'SETTLED_LOST' | 'VOID';

export type MockBet = {
  id: string;
  client: string;
  clientId: string;
  sport: string;
  match: string;
  market: string;
  selection: string;
  odds: number;
  stake: number;
  exposure: number;
  potentialPayout: number;
  status: BetStatus;
  placedAt: string;
};

export const SPORTS = ['Cricket', 'Football', 'Basketball', 'Tennis', 'Kabaddi'];

export function betStatusTone(status: BetStatus): 'green' | 'amber' | 'red' | 'blue' | 'slate' {
  switch (status) {
    case 'PENDING':
      return 'amber';
    case 'OPEN':
    case 'ACCEPTED':
      return 'blue';
    case 'SETTLED_WON':
      return 'green';
    case 'SETTLED_LOST':
      return 'red';
    case 'VOID':
      return 'slate';
  }
}

const RAW_BETS: [
  clientIndex: number,
  sport: string,
  match: string,
  market: string,
  selection: string,
  odds: number,
  stake: number,
  status: BetStatus,
  placedAt: string,
][] = [
  [0, 'Cricket', 'India vs Australia', 'Match Winner', 'India', 1.85, 25000, 'OPEN', 'Today, 10:42 AM'],
  [2, 'Football', 'Arsenal vs Chelsea', 'Over / Under 2.5', 'Over 2.5', 1.92, 18500, 'OPEN', 'Today, 10:31 AM'],
  [1, 'Basketball', 'Lakers vs Celtics', 'Moneyline', 'Celtics', 2.1, 12000, 'PENDING', 'Today, 10:18 AM'],
  [3, 'Football', 'Real Madrid vs Barcelona', 'Both Teams to Score', 'Yes', 1.65, 8000, 'ACCEPTED', 'Today, 9:54 AM'],
  [6, 'Cricket', 'Mumbai Indians vs CSK', 'Top Batter', 'Rohit Sharma', 4.5, 15500, 'OPEN', 'Today, 9:40 AM'],
  [9, 'Football', 'Man City vs Liverpool', 'Correct Score', '2-1', 8.0, 21000, 'PENDING', 'Today, 9:22 AM'],
  [4, 'Tennis', 'Djokovic vs Alcaraz', 'Set Winner', 'Alcaraz', 2.3, 14000, 'OPEN', 'Today, 8:58 AM'],
  [5, 'Kabaddi', 'Patna Pirates vs Bengal Warriors', 'Match Winner', 'Patna Pirates', 1.75, 6000, 'SETTLED_WON', 'Yesterday, 8:10 PM'],
  [7, 'Basketball', 'Warriors vs Suns', 'Total Points Over/Under', 'Over 224.5', 1.9, 9500, 'ACCEPTED', 'Today, 8:30 AM'],
  [10, 'Cricket', 'RCB vs KKR', 'Match Winner', 'RCB', 2.05, 11000, 'OPEN', 'Today, 8:05 AM'],
  [11, 'Football', 'PSG vs Bayern Munich', 'Match Winner', 'PSG', 2.5, 16500, 'PENDING', 'Today, 7:48 AM'],
  [12, 'Cricket', 'Australia vs England', 'Top Bowler', 'Pat Cummins', 3.75, 7000, 'SETTLED_LOST', 'Yesterday, 6:20 PM'],
  [13, 'Tennis', 'Swiatek vs Sabalenka', 'Match Winner', 'Swiatek', 1.7, 9000, 'SETTLED_WON', 'Yesterday, 4:45 PM'],
  [14, 'Basketball', 'Nuggets vs Bucks', 'Moneyline', 'Nuggets', 1.95, 13500, 'OPEN', 'Today, 7:15 AM'],
  [15, 'Football', 'Inter Milan vs AC Milan', 'Over / Under 2.5', 'Under 2.5', 2.0, 10000, 'ACCEPTED', 'Today, 6:52 AM'],
  [16, 'Cricket', 'Delhi Capitals vs SRH', 'Match Winner', 'SRH', 1.8, 5500, 'VOID', 'Yesterday, 3:10 PM'],
  [17, 'Kabaddi', 'U Mumba vs Jaipur Pink Panthers', 'Match Winner', 'U Mumba', 1.9, 4800, 'OPEN', 'Today, 6:20 AM'],
  [19, 'Tennis', 'Medvedev vs Sinner', 'Set Winner', 'Sinner', 1.6, 12500, 'PENDING', 'Today, 5:55 AM'],
  [20, 'Football', 'Barcelona vs Atletico Madrid', 'Match Winner', 'Barcelona', 1.55, 19000, 'SETTLED_WON', 'Yesterday, 2:30 PM'],
  [21, 'Cricket', 'New Zealand vs South Africa', 'Match Winner', 'New Zealand', 2.2, 17500, 'OPEN', 'Today, 5:10 AM'],
  [22, 'Basketball', 'Heat vs Knicks', 'Moneyline', 'Knicks', 1.88, 6500, 'VOID', 'Yesterday, 1:05 PM'],
  [23, 'Football', 'Borussia Dortmund vs RB Leipzig', 'Both Teams to Score', 'Yes', 1.72, 8800, 'ACCEPTED', 'Today, 4:40 AM'],
  [8, 'Cricket', 'Pakistan vs Sri Lanka', 'Top Batter', 'Babar Azam', 3.2, 5000, 'SETTLED_LOST', 'Yesterday, 11:20 AM'],
  [18, 'Tennis', 'Gauff vs Rybakina', 'Match Winner', 'Gauff', 2.4, 3200, 'OPEN', 'Today, 4:05 AM'],
];

export const MOCK_BETS: MockBet[] = RAW_BETS.map(
  ([clientIndex, sport, match, market, selection, odds, stake, status, placedAt], index) => {
    const client = MOCK_CLIENTS[clientIndex]!;
    return {
      id: `BET-${String(864 - index).padStart(4, '0')}`,
      client: client.name,
      clientId: client.id,
      sport,
      match,
      market,
      selection,
      odds,
      stake,
      exposure: stake,
      potentialPayout: Math.round(stake * odds),
      status,
      placedAt,
    };
  },
);

// ---------------------------------------------------------------------------
// Matches
// ---------------------------------------------------------------------------

export type MatchStatus = 'UPCOMING' | 'LIVE' | 'FINISHED';

export type MockMatch = {
  id: string;
  sport: string;
  home: string;
  away: string;
  competition: string;
  startTime: string;
  status: MatchStatus;
  exposure: number;
};

const RAW_MATCHES: [
  sport: string,
  home: string,
  away: string,
  competition: string,
  startTime: string,
  status: MatchStatus,
  exposure: number,
][] = [
  ['Cricket', 'India', 'Australia', 'Border-Gavaskar Trophy', 'Live · 32.4 overs', 'LIVE', 158250],
  ['Football', 'Arsenal', 'Chelsea', 'Premier League', 'Live · 63\'', 'LIVE', 92400],
  ['Basketball', 'Lakers', 'Celtics', 'NBA Regular Season', 'Live · Q3 4:12', 'LIVE', 41000],
  ['Football', 'Real Madrid', 'Barcelona', 'La Liga', 'Today, 8:00 PM', 'UPCOMING', 68000],
  ['Cricket', 'Mumbai Indians', 'Chennai Super Kings', 'IPL', 'Today, 7:30 PM', 'UPCOMING', 155000],
  ['Tennis', 'Djokovic', 'Alcaraz', 'ATP Masters Final', 'Today, 6:00 PM', 'UPCOMING', 44000],
  ['Football', 'Man City', 'Liverpool', 'Premier League', 'Today, 9:30 PM', 'UPCOMING', 71000],
  ['Kabaddi', 'Patna Pirates', 'Bengal Warriors', 'Pro Kabaddi League', 'Tomorrow, 8:00 PM', 'UPCOMING', 6000],
  ['Basketball', 'Warriors', 'Suns', 'NBA Regular Season', 'Tomorrow, 6:30 AM', 'UPCOMING', 9500],
  ['Cricket', 'Royal Challengers Bengaluru', 'Kolkata Knight Riders', 'IPL', 'Yesterday, 7:30 PM', 'FINISHED', 0],
  ['Football', 'PSG', 'Bayern Munich', 'UEFA Champions League', 'Yesterday, 8:15 PM', 'FINISHED', 0],
  ['Tennis', 'Swiatek', 'Sabalenka', 'WTA Finals', 'Yesterday, 4:30 PM', 'FINISHED', 0],
  ['Cricket', 'Pakistan', 'Sri Lanka', 'Asia Cup', 'Yesterday, 11:00 AM', 'FINISHED', 0],
  ['Football', 'Borussia Dortmund', 'RB Leipzig', 'Bundesliga', 'Today, 4:40 AM', 'UPCOMING', 8800],
];

export const MOCK_MATCHES: MockMatch[] = RAW_MATCHES.map(
  ([sport, home, away, competition, startTime, status, exposure], index) => ({
    id: `MTC-${String(1200 + index)}`,
    sport,
    home,
    away,
    competition,
    startTime,
    status,
    exposure,
  }),
);

export function matchStatusTone(status: MatchStatus): 'green' | 'amber' | 'red' | 'blue' | 'slate' {
  return status === 'LIVE' ? 'red' : status === 'UPCOMING' ? 'blue' : 'slate';
}

// ---------------------------------------------------------------------------
// Markets
// ---------------------------------------------------------------------------

export type MarketStatus = 'OPEN' | 'SUSPENDED' | 'SETTLED';

export type MockMarket = {
  id: string;
  matchId: string;
  match: string;
  sport: string;
  marketType: string;
  status: MarketStatus;
  betsCount: number;
  exposure: number;
};

const RAW_MARKETS: [matchIndex: number, marketType: string, status: MarketStatus, betsCount: number, exposure: number][] = [
  [0, 'Match Winner', 'OPEN', 18, 82500],
  [0, 'Total Runs Over/Under', 'OPEN', 9, 41300],
  [0, 'Top Batter', 'SUSPENDED', 5, 34450],
  [1, 'Match Winner', 'OPEN', 14, 52400],
  [1, 'Over / Under 2.5', 'OPEN', 11, 40000],
  [2, 'Moneyline', 'OPEN', 8, 28000],
  [2, 'Total Points Over/Under', 'OPEN', 6, 13000],
  [3, 'Match Winner', 'OPEN', 4, 38000],
  [3, 'Both Teams to Score', 'OPEN', 3, 30000],
  [4, 'Match Winner', 'OPEN', 22, 98000],
  [4, 'Top Batter', 'OPEN', 7, 57000],
  [5, 'Set Winner', 'OPEN', 5, 44000],
  [6, 'Match Winner', 'OPEN', 6, 41000],
  [6, 'Correct Score', 'SUSPENDED', 3, 30000],
  [7, 'Match Winner', 'OPEN', 2, 6000],
  [8, 'Total Points Over/Under', 'OPEN', 3, 9500],
  [9, 'Match Winner', 'SETTLED', 12, 0],
  [10, 'Match Winner', 'SETTLED', 9, 0],
  [13, 'Both Teams to Score', 'OPEN', 4, 8800],
];

export const MOCK_MARKETS: MockMarket[] = RAW_MARKETS.map(
  ([matchIndex, marketType, status, betsCount, exposure], index) => {
    const match = MOCK_MATCHES[matchIndex]!;
    return {
      id: `MKT-${String(3400 + index)}`,
      matchId: match.id,
      match: `${match.home} vs ${match.away}`,
      sport: match.sport,
      marketType,
      status,
      betsCount,
      exposure,
    };
  },
);

export function marketStatusTone(status: MarketStatus): 'green' | 'amber' | 'red' | 'blue' | 'slate' {
  return status === 'OPEN' ? 'green' : status === 'SUSPENDED' ? 'amber' : 'slate';
}

// ---------------------------------------------------------------------------
// Settlements
// ---------------------------------------------------------------------------

export type SettlementStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type MockSettlement = {
  id: string;
  match: string;
  sport: string;
  betsCount: number;
  totalPayout: number;
  status: SettlementStatus;
  requestedAt: string;
  requestedBy: string;
};

const RAW_SETTLEMENTS: [
  match: string,
  sport: string,
  betsCount: number,
  totalPayout: number,
  status: SettlementStatus,
  requestedAt: string,
  requestedBy: string,
][] = [
  ['Patna Pirates vs Bengal Warriors', 'Kabaddi', 14, 46500, 'PENDING', 'Yesterday, 9:05 PM', 'A. Rao'],
  ['Australia vs England', 'Cricket', 22, 118400, 'PENDING', 'Yesterday, 7:10 PM', 'S. Iyer'],
  ['Swiatek vs Sabalenka', 'Tennis', 9, 31200, 'PENDING', 'Yesterday, 5:40 PM', 'K. Malhotra'],
  ['Barcelona vs Atletico Madrid', 'Football', 17, 76800, 'APPROVED', 'Yesterday, 3:20 PM', 'A. Rao'],
  ['Pakistan vs Sri Lanka', 'Cricket', 11, 28900, 'APPROVED', 'Yesterday, 12:15 PM', 'S. Iyer'],
  ['Royal Challengers Bengaluru vs Kolkata Knight Riders', 'Cricket', 26, 142300, 'APPROVED', '2 days ago', 'A. Rao'],
  ['PSG vs Bayern Munich', 'Football', 19, 89500, 'REJECTED', '2 days ago', 'K. Malhotra'],
  ['Heat vs Knicks', 'Basketball', 6, 15200, 'PENDING', 'Today, 1:05 AM', 'S. Iyer'],
];

export const MOCK_SETTLEMENTS: MockSettlement[] = RAW_SETTLEMENTS.map(
  ([match, sport, betsCount, totalPayout, status, requestedAt, requestedBy], index) => ({
    id: `STL-${String(19 - index).padStart(3, '0')}`,
    match,
    sport,
    betsCount,
    totalPayout,
    status,
    requestedAt,
    requestedBy,
  }),
);

export function settlementStatusTone(status: SettlementStatus): 'green' | 'amber' | 'red' | 'blue' | 'slate' {
  return status === 'PENDING' ? 'amber' : status === 'APPROVED' ? 'green' : 'red';
}

// ---------------------------------------------------------------------------
// Cash sessions
// ---------------------------------------------------------------------------

export type CashSessionStatus = 'OPEN' | 'RECONCILED' | 'FLAGGED';

export type MockCashSession = {
  id: string;
  master: string;
  date: string;
  opening: number;
  received: number;
  paid: number;
  expectedClosing: number;
  physicalCount: number;
  difference: number;
  status: CashSessionStatus;
};

const RAW_CASH_SESSIONS: [
  master: string,
  date: string,
  opening: number,
  received: number,
  paid: number,
  physicalCount: number,
][] = [
  ['A. Rao', 'Today', 580000, 215000, 108500, 674000],
  ['S. Iyer', 'Today', 320000, 96000, 54000, 362000],
  ['K. Malhotra', 'Today', 410000, 128000, 71500, 466500],
  ['A. Rao', 'Yesterday', 512000, 184000, 96000, 600000],
  ['S. Iyer', 'Yesterday', 298000, 87000, 49500, 335500],
  ['K. Malhotra', 'Yesterday', 388000, 111000, 62000, 437000],
  ['A. Rao', '2 days ago', 470000, 165000, 88000, 547000],
  ['S. Iyer', '2 days ago', 276000, 79000, 45000, 310000],
];

export const MOCK_CASH_SESSIONS: MockCashSession[] = RAW_CASH_SESSIONS.map(
  ([master, date, opening, received, paid, physicalCount], index) => {
    const expectedClosing = opening + received - paid;
    const difference = physicalCount - expectedClosing;
    const status: CashSessionStatus =
      index < 3 ? 'OPEN' : Math.abs(difference) > 5000 ? 'FLAGGED' : 'RECONCILED';
    return {
      id: `CSH-${String(104 - index)}`,
      master,
      date,
      opening,
      received,
      paid,
      expectedClosing,
      physicalCount,
      difference,
      status,
    };
  },
);

export function cashStatusTone(status: CashSessionStatus): 'green' | 'amber' | 'red' | 'blue' | 'slate' {
  return status === 'OPEN' ? 'blue' : status === 'RECONCILED' ? 'green' : 'red';
}

// ---------------------------------------------------------------------------
// Commissions
// ---------------------------------------------------------------------------

export type CommissionRule = {
  id: string;
  master: string;
  role: string;
  rate: number;
  effectiveFrom: string;
  status: 'ACTIVE' | 'INACTIVE';
};

const RAW_COMMISSION_RULES: [master: string, role: string, rate: number, effectiveFrom: string, status?: 'INACTIVE'][] = [
  ['A. Rao', 'Master', 4.5, '1 Jan 2025'],
  ['S. Iyer', 'Master', 4.0, '1 Jan 2025'],
  ['K. Malhotra', 'Master', 4.25, '1 Mar 2025'],
  ['A. Rao', 'Master', 3.5, '1 Jun 2024', 'INACTIVE'],
  ['Super Admin A', 'Super Admin', 2.0, '1 Jan 2025'],
];

export const MOCK_COMMISSION_RULES: CommissionRule[] = RAW_COMMISSION_RULES.map(
  ([master, role, rate, effectiveFrom, status], index) => ({
    id: `RULE-${String(index + 1).padStart(2, '0')}`,
    master,
    role,
    rate,
    effectiveFrom,
    status: status ?? 'ACTIVE',
  }),
);

export type CommissionPayout = {
  id: string;
  master: string;
  period: string;
  grossVolume: number;
  commissionEarned: number;
  status: 'PAID' | 'PENDING';
};

const RAW_COMMISSION_PAYOUTS: [master: string, period: string, grossVolume: number, status?: 'PENDING'][] = [
  ['A. Rao', 'March 2026', 4820000, 'PENDING'],
  ['S. Iyer', 'March 2026', 3140000, 'PENDING'],
  ['K. Malhotra', 'March 2026', 2765000, 'PENDING'],
  ['A. Rao', 'February 2026', 4510000],
  ['S. Iyer', 'February 2026', 2980000],
  ['K. Malhotra', 'February 2026', 2610000],
];

export const MOCK_COMMISSION_PAYOUTS: CommissionPayout[] = RAW_COMMISSION_PAYOUTS.map(
  ([master, period, grossVolume, status], index) => {
    const rule = MOCK_COMMISSION_RULES.find((r) => r.master === master && r.status === 'ACTIVE');
    const rate = rule?.rate ?? 4;
    return {
      id: `PAY-${String(index + 1).padStart(3, '0')}`,
      master,
      period,
      grossVolume,
      commissionEarned: Math.round((grossVolume * rate) / 100),
      status: status ?? 'PAID',
    };
  },
);

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export type ReportCatalogEntry = {
  id: string;
  name: string;
  description: string;
};

export const REPORT_CATALOG: ReportCatalogEntry[] = [
  { id: 'client-activity', name: 'Client Activity Report', description: 'Bets, deposits, and position changes per client over a date range.' },
  { id: 'settlement-summary', name: 'Settlement Summary', description: 'Approved and rejected settlements with payout totals by sport.' },
  { id: 'cash-flow', name: 'Cash Flow Report', description: 'Opening, received, paid, and reconciled cash across sessions.' },
  { id: 'commission', name: 'Commission Report', description: 'Commission earned and paid per master for a selected period.' },
  { id: 'audit-export', name: 'Audit Export', description: 'Full audit trail export for compliance and internal review.' },
];

export type ReportExport = {
  id: string;
  reportName: string;
  generatedAt: string;
  generatedBy: string;
  sizeLabel: string;
};

const RAW_REPORT_EXPORTS: [reportName: string, generatedAt: string, generatedBy: string, sizeLabel: string][] = [
  ['Settlement Summary', 'Today, 9:12 AM', 'Super Admin A', '212 KB'],
  ['Client Activity Report', 'Yesterday, 6:40 PM', 'A. Rao', '1.4 MB'],
  ['Cash Flow Report', 'Yesterday, 11:05 AM', 'Super Admin A', '88 KB'],
  ['Commission Report', '3 days ago', 'Super Admin A', '64 KB'],
  ['Client Activity Report', '5 days ago', 'S. Iyer', '1.1 MB'],
];

export const MOCK_REPORT_EXPORTS: ReportExport[] = RAW_REPORT_EXPORTS.map(
  ([reportName, generatedAt, generatedBy, sizeLabel], index) => ({
    id: `EXP-${String(index + 1).padStart(3, '0')}`,
    reportName,
    generatedAt,
    generatedBy,
    sizeLabel,
  }),
);

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------

export type AuditCategory = 'SECURITY' | 'FINANCIAL' | 'HIERARCHY' | 'OPERATIONS';

export type AuditEntry = {
  id: string;
  actor: string;
  role: string;
  action: string;
  target: string;
  category: AuditCategory;
  timestamp: string;
  ip: string;
};

const RAW_AUDIT: [actor: string, role: string, action: string, target: string, category: AuditCategory, timestamp: string, ip: string][] = [
  ['Super Admin A', 'Super Admin', 'Suspended client', 'Rahul Verma (CLI-1042)', 'HIERARCHY', 'Today, 11:02 AM', '10.4.2.18'],
  ['A. Rao', 'Master', 'Posted ledger journal', 'JRNL-2291', 'FINANCIAL', 'Today, 10:48 AM', '10.4.2.44'],
  ['Super Admin A', 'Super Admin', 'Approved settlement', 'STL-016', 'FINANCIAL', 'Today, 10:20 AM', '10.4.2.18'],
  ['S. Iyer', 'Master', 'Created client', 'Test Client Nine (CLI-1066)', 'HIERARCHY', 'Today, 9:55 AM', '10.4.3.9'],
  ['Super Admin A', 'Super Admin', 'Signed in', '—', 'SECURITY', 'Today, 8:02 AM', '10.4.2.18'],
  ['K. Malhotra', 'Master', 'Rejected settlement', 'STL-013', 'FINANCIAL', 'Yesterday, 8:40 PM', '10.4.4.61'],
  ['Super Admin A', 'Super Admin', 'Updated commission rule', 'RULE-03', 'FINANCIAL', 'Yesterday, 4:15 PM', '10.4.2.18'],
  ['A. Rao', 'Master', 'Opened cash session', 'CSH-101', 'OPERATIONS', 'Yesterday, 9:00 AM', '10.4.2.44'],
  ['Super Admin A', 'Super Admin', 'Suspended market', 'MKT-3413 (Correct Score)', 'OPERATIONS', 'Yesterday, 7:30 AM', '10.4.2.18'],
  ['S. Iyer', 'Master', 'Reversed ledger journal', 'JRNL-2270', 'FINANCIAL', '2 days ago', '10.4.3.9'],
  ['Super Admin A', 'Super Admin', 'Changed session timeout', 'Security settings', 'SECURITY', '2 days ago', '10.4.2.18'],
  ['K. Malhotra', 'Master', 'Suspended client', 'Aakash Bansal (CLI-1060)', 'HIERARCHY', '3 days ago', '10.4.4.61'],
];

export const MOCK_AUDIT_LOG: AuditEntry[] = RAW_AUDIT.map(
  ([actor, role, action, target, category, timestamp, ip], index) => ({
    id: `AUD-${String(4820 - index)}`,
    actor,
    role,
    action,
    target,
    category,
    timestamp,
    ip,
  }),
);

export function auditCategoryTone(category: AuditCategory): 'green' | 'amber' | 'red' | 'blue' | 'slate' {
  switch (category) {
    case 'SECURITY':
      return 'red';
    case 'FINANCIAL':
      return 'blue';
    case 'HIERARCHY':
      return 'amber';
    case 'OPERATIONS':
      return 'slate';
  }
}
