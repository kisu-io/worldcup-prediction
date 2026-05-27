// World Cup 2026 Match Schedule
// Known fixtures + TBD placeholders (will be updated when draw results are final)
// Tournament dates: June 11 - July 19, 2026
// Format: 12 groups (A-L) of 4, then R32, R16, QF, SF, 3rd, Final

export type MatchFixture = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;      // YYYY-MM-DD
  time: string;      // HH:MM (local ET)
  venue: string;
  round: RoundKey;
  group?: string;    // A-L for group stage
  locked?: boolean;  // if true, predictions are locked
};

export const ROUND_KEYS = [
  "Vòng bảng",
  "Vòng 1/32",
  "Vòng 1/16",
  "Vòng 1/8",
  "Tứ kết",
  "Tranh hạng 3",
  "Chung kết",
] as const;

export type RoundKey = typeof ROUND_KEYS[number];

export const ROUND_FEES: Record<RoundKey, number> = {
  "Vòng bảng": 10000,
  "Vòng 1/32": 20000,
  "Vòng 1/16": 20000,
  "Vòng 1/8": 20000,
  "Tứ kết": 20000,
  "Tranh hạng 3": 50000,
  "Chung kết": 100000,
};

// Tỉ lệ trích vào quỹ sinh hoạt: Vòng bảng 10%, Knockout 20%, 2 trận cuối 30%
export const ROUND_FUND_RATES: Record<RoundKey, number> = {
  "Vòng bảng": 0.10,
  "Vòng 1/32": 0.20,
  "Vòng 1/16": 0.20,
  "Vòng 1/8": 0.20,
  "Tứ kết": 0.20,
  "Tranh hạng 3": 0.30,
  "Chung kết": 0.30,
};

// Groups (drawn Dec 5, 2025)
export const GROUPS: Record<string, string[]> = {
  A: ["Mexico", "South Africa", "Nigeria", "Saudi Arabia"],
  B: ["Canada", "Argentina", "Australia", "Korea Republic"],
  C: ["Spain", "Costa Rica", "Egypt", "New Zealand"],
  D: ["USA", "Netherlands", "Ukraine", "Cape Verde"],
  E: ["Brazil", "Cameroon", "Serbia", "Tunisia"],
  F: ["Portugal", "Ghana", "Uruguay", "Iran"],
  G: ["France", "Senegal", "Poland", "Ecuador"],
  H: ["England", "Japan", "Scotland", "Morocco"],
  I: ["Germany", "Colombia", "Norway", "Jamaica"],
  J: ["Italy", "Czech Republic", "Turkey", "Iraq"],
  K: ["Belgium", "Algeria", "USA2", "DR Congo"],
  L: ["Croatia", "Wales", "Denmark", "Haiti"],
};

// Known fixtures + generated group stage placeholders
export const FIXTURES: MatchFixture[] = [
  // ===== GROUP STAGE (June 11-27) =====
  // Group A - Mexico's group
  { id: "A1", homeTeam: "Mexico", awayTeam: "South Africa", date: "2026-06-11", time: "20:00", venue: "Estadio Azteca, Mexico City", round: "Vòng bảng", group: "A" },
  { id: "A2", homeTeam: "Nigeria", awayTeam: "Saudi Arabia", date: "2026-06-12", time: "15:00", venue: "Estadio Akron, Guadalajara", round: "Vòng bảng", group: "A" },
  { id: "A3", homeTeam: "Mexico", awayTeam: "Nigeria", date: "2026-06-17", time: "18:00", venue: "Estadio Azteca, Mexico City", round: "Vòng bảng", group: "A" },
  { id: "A4", homeTeam: "South Africa", awayTeam: "Saudi Arabia", date: "2026-06-17", time: "21:00", venue: "Estadio BBVA, Monterrey", round: "Vòng bảng", group: "A" },
  { id: "A5", homeTeam: "Mexico", awayTeam: "Saudi Arabia", date: "2026-06-22", time: "20:00", venue: "Estadio Azteca, Mexico City", round: "Vòng bảng", group: "A" },
  { id: "A6", homeTeam: "South Africa", awayTeam: "Nigeria", date: "2026-06-22", time: "16:00", venue: "Estadio Akron, Guadalajara", round: "Vòng bảng", group: "A" },

  // Group D - USA's group
  { id: "D1", homeTeam: "USA", awayTeam: "Netherlands", date: "2026-06-12", time: "19:00", venue: "SoFi Stadium, Los Angeles", round: "Vòng bảng", group: "D" },
  { id: "D2", homeTeam: "Ukraine", awayTeam: "Cape Verde", date: "2026-06-13", time: "15:00", venue: "Lumen Field, Seattle", round: "Vòng bảng", group: "D" },
  { id: "D3", homeTeam: "USA", awayTeam: "Ukraine", date: "2026-06-18", time: "19:00", venue: "AT&T Stadium, Dallas", round: "Vòng bảng", group: "D" },
  { id: "D4", homeTeam: "Netherlands", awayTeam: "Cape Verde", date: "2026-06-18", time: "16:00", venue: "Arrowhead Stadium, Kansas City", round: "Vòng bảng", group: "D" },
  { id: "D5", homeTeam: "USA", awayTeam: "Cape Verde", date: "2026-06-23", time: "21:00", venue: "MetLife Stadium, New York", round: "Vòng bảng", group: "D" },
  { id: "D6", homeTeam: "Netherlands", awayTeam: "Ukraine", date: "2026-06-23", time: "18:00", venue: "Mercedes-Benz Stadium, Atlanta", round: "Vòng bảng", group: "D" },

  // Group E - Brazil's group
  { id: "E1", homeTeam: "Brazil", awayTeam: "Cameroon", date: "2026-06-13", time: "20:00", venue: "Hard Rock Stadium, Miami", round: "Vòng bảng", group: "E" },
  { id: "E2", homeTeam: "Serbia", awayTeam: "Tunisia", date: "2026-06-14", time: "15:00", venue: "Camping World Stadium, Orlando", round: "Vòng bảng", group: "E" },
  { id: "E3", homeTeam: "Brazil", awayTeam: "Serbia", date: "2026-06-19", time: "20:00", venue: "Hard Rock Stadium, Miami", round: "Vòng bảng", group: "E" },
  { id: "E4", homeTeam: "Cameroon", awayTeam: "Tunisia", date: "2026-06-19", time: "17:00", venue: "Raymond James Stadium, Tampa", round: "Vòng bảng", group: "E" },
  { id: "E5", homeTeam: "Brazil", awayTeam: "Tunisia", date: "2026-06-24", time: "21:00", venue: "MetLife Stadium, New York", round: "Vòng bảng", group: "E" },
  { id: "E6", homeTeam: "Cameroon", awayTeam: "Serbia", date: "2026-06-24", time: "18:00", venue: "Mercedes-Benz Stadium, Atlanta", round: "Vòng bảng", group: "E" },

  // Group G - France's group
  { id: "G1", homeTeam: "France", awayTeam: "Senegal", date: "2026-06-14", time: "20:00", venue: "AT&T Stadium, Dallas", round: "Vòng bảng", group: "G" },
  { id: "G2", homeTeam: "Poland", awayTeam: "Ecuador", date: "2026-06-15", time: "15:00", venue: "NRG Stadium, Houston", round: "Vòng bảng", group: "G" },
  { id: "G3", homeTeam: "France", awayTeam: "Poland", date: "2026-06-20", time: "19:00", venue: "SoFi Stadium, Los Angeles", round: "Vòng bảng", group: "G" },
  { id: "G4", homeTeam: "Senegal", awayTeam: "Ecuador", date: "2026-06-20", time: "16:00", venue: "Levi's Stadium, San Francisco", round: "Vòng bảng", group: "G" },
  { id: "G5", homeTeam: "France", awayTeam: "Ecuador", date: "2026-06-25", time: "21:00", venue: "Lumen Field, Seattle", round: "Vòng bảng", group: "G" },
  { id: "G6", homeTeam: "Senegal", awayTeam: "Poland", date: "2026-06-25", time: "18:00", venue: "BC Place, Vancouver", round: "Vòng bảng", group: "G" },

  // Group H - England's group
  { id: "H1", homeTeam: "England", awayTeam: "Japan", date: "2026-06-15", time: "19:00", venue: "MetLife Stadium, New York", round: "Vòng bảng", group: "H" },
  { id: "H2", homeTeam: "Scotland", awayTeam: "Morocco", date: "2026-06-16", time: "15:00", venue: "Gillette Stadium, Boston", round: "Vòng bảng", group: "H" },
  { id: "H3", homeTeam: "England", awayTeam: "Scotland", date: "2026-06-20", time: "21:00", venue: "MetLife Stadium, New York", round: "Vòng bảng", group: "H" },
  { id: "H4", homeTeam: "Japan", awayTeam: "Morocco", date: "2026-06-21", time: "16:00", venue: "BMO Field, Toronto", round: "Vòng bảng", group: "H" },
  { id: "H5", homeTeam: "England", awayTeam: "Morocco", date: "2026-06-26", time: "21:00", venue: "MetLife Stadium, New York", round: "Vòng bảng", group: "H" },
  { id: "H6", homeTeam: "Japan", awayTeam: "Scotland", date: "2026-06-26", time: "18:00", venue: "BC Place, Vancouver", round: "Vòng bảng", group: "H" },

  // Group I - Germany's group
  { id: "I1", homeTeam: "Germany", awayTeam: "Colombia", date: "2026-06-16", time: "20:00", venue: "Mercedes-Benz Stadium, Atlanta", round: "Vòng bảng", group: "I" },
  { id: "I2", homeTeam: "Norway", awayTeam: "Jamaica", date: "2026-06-17", time: "15:00", venue: "Bank of America Stadium, Charlotte", round: "Vòng bảng", group: "I" },
  { id: "I3", homeTeam: "Germany", awayTeam: "Norway", date: "2026-06-21", time: "19:00", venue: "AT&T Stadium, Dallas", round: "Vòng bảng", group: "I" },
  { id: "I4", homeTeam: "Colombia", awayTeam: "Jamaica", date: "2026-06-21", time: "16:00", venue: "NRG Stadium, Houston", round: "Vòng bảng", group: "I" },
  { id: "I5", homeTeam: "Germany", awayTeam: "Jamaica", date: "2026-06-26", time: "20:00", venue: "Soldier Field, Chicago", round: "Vòng bảng", group: "I" },
  { id: "I6", homeTeam: "Colombia", awayTeam: "Norway", date: "2026-06-27", time: "16:00", venue: "Levi's Stadium, San Francisco", round: "Vòng bảng", group: "I" },

  // Other groups (simplified - B, C, F, J, K, L)
  { id: "B1", homeTeam: "Canada", awayTeam: "Argentina", date: "2026-06-11", time: "16:00", venue: "BC Place, Vancouver", round: "Vòng bảng", group: "B" },
  { id: "B2", homeTeam: "Australia", awayTeam: "Korea Republic", date: "2026-06-12", time: "12:00", venue: "BMO Field, Toronto", round: "Vòng bảng", group: "B" },
  { id: "B3", homeTeam: "Canada", awayTeam: "Australia", date: "2026-06-17", time: "14:00", venue: "BC Place, Vancouver", round: "Vòng bảng", group: "B" },
  { id: "B4", homeTeam: "Argentina", awayTeam: "Korea Republic", date: "2026-06-17", time: "11:00", venue: "Lumen Field, Seattle", round: "Vòng bảng", group: "B" },
  { id: "B5", homeTeam: "Canada", awayTeam: "Korea Republic", date: "2026-06-22", time: "12:00", venue: "BC Place, Vancouver", round: "Vòng bảng", group: "B" },
  { id: "B6", homeTeam: "Argentina", awayTeam: "Australia", date: "2026-06-22", time: "15:00", venue: "SoFi Stadium, Los Angeles", round: "Vòng bảng", group: "B" },

  { id: "C1", homeTeam: "Spain", awayTeam: "Costa Rica", date: "2026-06-13", time: "17:00", venue: "Levi's Stadium, San Francisco", round: "Vòng bảng", group: "C" },
  { id: "C2", homeTeam: "Egypt", awayTeam: "New Zealand", date: "2026-06-14", time: "12:00", venue: "Allegiant Stadium, Las Vegas", round: "Vòng bảng", group: "C" },
  { id: "C3", homeTeam: "Spain", awayTeam: "Egypt", date: "2026-06-18", time: "17:00", venue: "SoFi Stadium, Los Angeles", round: "Vòng bảng", group: "C" },
  { id: "C4", homeTeam: "Costa Rica", awayTeam: "New Zealand", date: "2026-06-19", time: "12:00", venue: "Lumen Field, Seattle", round: "Vòng bảng", group: "C" },
  { id: "C5", homeTeam: "Spain", awayTeam: "New Zealand", date: "2026-06-23", time: "14:00", venue: "Levi's Stadium, San Francisco", round: "Vòng bảng", group: "C" },
  { id: "C6", homeTeam: "Costa Rica", awayTeam: "Egypt", date: "2026-06-23", time: "11:00", venue: "Allegiant Stadium, Las Vegas", round: "Vòng bảng", group: "C" },

  { id: "F1", homeTeam: "Portugal", awayTeam: "Ghana", date: "2026-06-14", time: "18:00", venue: "MetLife Stadium, New York", round: "Vòng bảng", group: "F" },
  { id: "F2", homeTeam: "Uruguay", awayTeam: "Iran", date: "2026-06-15", time: "13:00", venue: "Gillette Stadium, Boston", round: "Vòng bảng", group: "F" },
  { id: "F3", homeTeam: "Portugal", awayTeam: "Uruguay", date: "2026-06-19", time: "19:00", venue: "Hard Rock Stadium, Miami", round: "Vòng bảng", group: "F" },
  { id: "F4", homeTeam: "Ghana", awayTeam: "Iran", date: "2026-06-20", time: "13:00", venue: "Camping World Stadium, Orlando", round: "Vòng bảng", group: "F" },
  { id: "F5", homeTeam: "Portugal", awayTeam: "Iran", date: "2026-06-24", time: "20:00", venue: "MetLife Stadium, New York", round: "Vòng bảng", group: "F" },
  { id: "F6", homeTeam: "Ghana", awayTeam: "Uruguay", date: "2026-06-24", time: "17:00", venue: "Bank of America Stadium, Charlotte", round: "Vòng bảng", group: "F" },

  { id: "J1", homeTeam: "Italy", awayTeam: "Czech Republic", date: "2026-06-15", time: "17:00", venue: "Soldier Field, Chicago", round: "Vòng bảng", group: "J" },
  { id: "J2", homeTeam: "Turkey", awayTeam: "Iraq", date: "2026-06-16", time: "13:00", venue: "Arrowhead Stadium, Kansas City", round: "Vòng bảng", group: "J" },
  { id: "J3", homeTeam: "Italy", awayTeam: "Turkey", date: "2026-06-20", time: "18:00", venue: "Soldier Field, Chicago", round: "Vòng bảng", group: "J" },
  { id: "J4", homeTeam: "Czech Republic", awayTeam: "Iraq", date: "2026-06-21", time: "13:00", venue: "Bank of America Stadium, Charlotte", round: "Vòng bảng", group: "J" },
  { id: "J5", homeTeam: "Italy", awayTeam: "Iraq", date: "2026-06-25", time: "20:00", venue: "AT&T Stadium, Dallas", round: "Vòng bảng", group: "J" },
  { id: "J6", homeTeam: "Czech Republic", awayTeam: "Turkey", date: "2026-06-25", time: "17:00", venue: "NRG Stadium, Houston", round: "Vòng bảng", group: "J" },

  { id: "K1", homeTeam: "Belgium", awayTeam: "Algeria", date: "2026-06-16", time: "19:00", venue: "Mercedes-Benz Stadium, Atlanta", round: "Vòng bảng", group: "K" },
  { id: "K2", homeTeam: "DR Congo", awayTeam: "Wales", date: "2026-06-17", time: "13:00", venue: "Bank of America Stadium, Charlotte", round: "Vòng bảng", group: "K" },
  { id: "K3", homeTeam: "Belgium", awayTeam: "DR Congo", date: "2026-06-21", time: "21:00", venue: "MetLife Stadium, New York", round: "Vòng bảng", group: "K" },
  { id: "K4", homeTeam: "Algeria", awayTeam: "Wales", date: "2026-06-22", time: "14:00", venue: "Gillette Stadium, Boston", round: "Vòng bảng", group: "K" },
  { id: "K5", homeTeam: "Belgium", awayTeam: "Wales", date: "2026-06-27", time: "21:00", venue: "MetLife Stadium, New York", round: "Vòng bảng", group: "K" },
  { id: "K6", homeTeam: "Algeria", awayTeam: "DR Congo", date: "2026-06-27", time: "18:00", venue: "Arrowhead Stadium, Kansas City", round: "Vòng bảng", group: "K" },

  { id: "L1", homeTeam: "Croatia", awayTeam: "Wales", date: "2026-06-17", time: "19:00", venue: "BMO Field, Toronto", round: "Vòng bảng", group: "L" },
  { id: "L2", homeTeam: "Denmark", awayTeam: "Haiti", date: "2026-06-18", time: "15:00", venue: "BC Place, Vancouver", round: "Vòng bảng", group: "L" },
  { id: "L3", homeTeam: "Croatia", awayTeam: "Denmark", date: "2026-06-22", time: "20:00", venue: "BMO Field, Toronto", round: "Vòng bảng", group: "L" },
  { id: "L4", homeTeam: "Wales", awayTeam: "Haiti", date: "2026-06-23", time: "16:00", venue: "BC Place, Vancouver", round: "Vòng bảng", group: "L" },
  { id: "L5", homeTeam: "Croatia", awayTeam: "Haiti", date: "2026-06-27", time: "19:00", venue: "BMO Field, Toronto", round: "Vòng bảng", group: "L" },
  { id: "L6", homeTeam: "Wales", awayTeam: "Denmark", date: "2026-06-27", time: "15:00", venue: "BC Place, Vancouver", round: "Vòng bảng", group: "L" },

  // ===== ROUND OF 32 (June 28 - July 3) =====
  // Placeholder matches - will be filled when group results are known
  { id: "R32-1", homeTeam: "1A", awayTeam: "3C/D/E/F", date: "2026-06-28", time: "15:00", venue: "AT&T Stadium, Dallas", round: "Vòng 1/32" },
  { id: "R32-2", homeTeam: "1C", awayTeam: "3A/B/F", date: "2026-06-28", time: "19:00", venue: "NRG Stadium, Houston", round: "Vòng 1/32" },
  { id: "R32-3", homeTeam: "1B", awayTeam: "3E/F/G/H", date: "2026-06-28", time: "21:00", venue: "SoFi Stadium, Los Angeles", round: "Vòng 1/32" },
  { id: "R32-4", homeTeam: "1F", awayTeam: "3A/B/C", date: "2026-06-29", time: "15:00", venue: "Hard Rock Stadium, Miami", round: "Vòng 1/32" },
  { id: "R32-5", homeTeam: "1D", awayTeam: "3B/E/F/G", date: "2026-06-29", time: "19:00", venue: "MetLife Stadium, New York", round: "Vòng 1/32" },
  { id: "R32-6", homeTeam: "1H", awayTeam: "3A/D/E/I", date: "2026-06-29", time: "21:00", venue: "Gillette Stadium, Boston", round: "Vòng 1/32" },
  { id: "R32-7", homeTeam: "1E", awayTeam: "3C/G/H/I", date: "2026-06-30", time: "15:00", venue: "Mercedes-Benz Stadium, Atlanta", round: "Vòng 1/32" },
  { id: "R32-8", homeTeam: "1G", awayTeam: "3D/F/H/J", date: "2026-06-30", time: "19:00", venue: "Lumen Field, Seattle", round: "Vòng 1/32" },
  { id: "R32-9", homeTeam: "2A", awayTeam: "2C", date: "2026-06-30", time: "21:00", venue: "BC Place, Vancouver", round: "Vòng 1/32" },
  { id: "R32-10", homeTeam: "2B", awayTeam: "2F", date: "2026-07-01", time: "15:00", venue: "BMO Field, Toronto", round: "Vòng 1/32" },
  { id: "R32-11", homeTeam: "2D", awayTeam: "2H", date: "2026-07-01", time: "19:00", venue: "Arrowhead Stadium, Kansas City", round: "Vòng 1/32" },
  { id: "R32-12", homeTeam: "2E", awayTeam: "2G", date: "2026-07-01", time: "21:00", venue: "Soldier Field, Chicago", round: "Vòng 1/32" },
  { id: "R32-13", homeTeam: "2I", awayTeam: "2K", date: "2026-07-02", time: "15:00", venue: "Allegiant Stadium, Las Vegas", round: "Vòng 1/32" },
  { id: "R32-14", homeTeam: "2J", awayTeam: "2L", date: "2026-07-02", time: "19:00", venue: "Levi's Stadium, San Francisco", round: "Vòng 1/32" },
  { id: "R32-15", homeTeam: "1J", awayTeam: "3K/L", date: "2026-07-02", time: "21:00", venue: "Camping World Stadium, Orlando", round: "Vòng 1/32" },
  { id: "R32-16", homeTeam: "1L", awayTeam: "3J/K", date: "2026-07-03", time: "19:00", venue: "Raymond James Stadium, Tampa", round: "Vòng 1/32" },

  // ===== ROUND OF 16 (July 4-7) =====
  { id: "R16-1", homeTeam: "W R32-1", awayTeam: "W R32-2", date: "2026-07-04", time: "15:00", venue: "AT&T Stadium, Dallas", round: "Vòng 1/16" },
  { id: "R16-2", homeTeam: "W R32-3", awayTeam: "W R32-4", date: "2026-07-04", time: "19:00", venue: "NRG Stadium, Houston", round: "Vòng 1/16" },
  { id: "R16-3", homeTeam: "W R32-5", awayTeam: "W R32-6", date: "2026-07-05", time: "15:00", venue: "SoFi Stadium, Los Angeles", round: "Vòng 1/16" },
  { id: "R16-4", homeTeam: "W R32-7", awayTeam: "W R32-8", date: "2026-07-05", time: "19:00", venue: "Hard Rock Stadium, Miami", round: "Vòng 1/16" },
  { id: "R16-5", homeTeam: "W R32-9", awayTeam: "W R32-10", date: "2026-07-06", time: "15:00", venue: "MetLife Stadium, New York", round: "Vòng 1/16" },
  { id: "R16-6", homeTeam: "W R32-11", awayTeam: "W R32-12", date: "2026-07-06", time: "19:00", venue: "Gillette Stadium, Boston", round: "Vòng 1/16" },
  { id: "R16-7", homeTeam: "W R32-13", awayTeam: "W R32-14", date: "2026-07-07", time: "15:00", venue: "Mercedes-Benz Stadium, Atlanta", round: "Vòng 1/16" },
  { id: "R16-8", homeTeam: "W R32-15", awayTeam: "W R32-16", date: "2026-07-07", time: "19:00", venue: "Lumen Field, Seattle", round: "Vòng 1/16" },

  // ===== QUARTER FINALS (July 9-11) =====
  { id: "QF-1", homeTeam: "W R16-1", awayTeam: "W R16-2", date: "2026-07-09", time: "19:00", venue: "AT&T Stadium, Dallas", round: "Tứ kết" },
  { id: "QF-2", homeTeam: "W R16-3", awayTeam: "W R16-4", date: "2026-07-09", time: "21:00", venue: "NRG Stadium, Houston", round: "Tứ kết" },
  { id: "QF-3", homeTeam: "W R16-5", awayTeam: "W R16-6", date: "2026-07-10", time: "19:00", venue: "MetLife Stadium, New York", round: "Tứ kết" },
  { id: "QF-4", homeTeam: "W R16-7", awayTeam: "W R16-8", date: "2026-07-11", time: "19:00", venue: "SoFi Stadium, Los Angeles", round: "Tứ kết" },

  // ===== SEMI FINALS (July 14-15) =====
  { id: "SF-1", homeTeam: "W QF-1", awayTeam: "W QF-2", date: "2026-07-14", time: "20:00", venue: "AT&T Stadium, Dallas", round: "Vòng 1/8" },
  { id: "SF-2", homeTeam: "W QF-3", awayTeam: "W QF-4", date: "2026-07-15", time: "20:00", venue: "MetLife Stadium, New York", round: "Vòng 1/8" },

  // ===== 3RD PLACE (July 18) =====
  { id: "3RD", homeTeam: "L SF-1", awayTeam: "L SF-2", date: "2026-07-18", time: "16:00", venue: "Hard Rock Stadium, Miami", round: "Tranh hạng 3" },

  // ===== FINAL (July 19) =====
  { id: "FINAL", homeTeam: "W SF-1", awayTeam: "W SF-2", date: "2026-07-19", time: "15:00", venue: "MetLife Stadium, East Rutherford", round: "Chung kết" },
];

// Helper functions
export function getMatchLabel(fixture: MatchFixture): string {
  return `${fixture.homeTeam} vs ${fixture.awayTeam}`;
}

export function getMatchById(id: string): MatchFixture | undefined {
  return FIXTURES.find((f) => f.id === id);
}

export function getMatchesByRound(round: RoundKey): MatchFixture[] {
  return FIXTURES.filter((f) => f.round === round);
}

export function getMatchesByGroup(group: string): MatchFixture[] {
  return FIXTURES.filter((f) => f.group === group);
}

export function getUpcomingMatches(): MatchFixture[] {
  const now = new Date().toISOString().slice(0, 10);
  return FIXTURES.filter((f) => f.date >= now).sort((a, b) =>
    a.date.localeCompare(b.date) || a.time.localeCompare(b.time)
  );
}

// Round display name mapping
export const ROUND_DISPLAY: Record<RoundKey, string> = {
  "Vòng bảng": "Vòng bảng",
  "Vòng 1/32": "Vòng 1/32 (Round of 32)",
  "Vòng 1/16": "Vòng 1/16 (Round of 16)",
  "Vòng 1/8": "Bán kết",
  "Tứ kết": "Tứ kết",
  "Tranh hạng 3": "Tranh hạng 3",
  "Chung kết": "Chung kết",
};
