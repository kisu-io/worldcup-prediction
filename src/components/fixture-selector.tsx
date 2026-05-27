import { useState, useMemo } from "react";
import { Search, Calendar, MapPin } from "lucide-react";
import { FIXTURES, type RoundKey } from "../lib/schedule";

interface FixtureSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
  onRoundChange: (round: RoundKey) => void;
}

const GROUP_ORDER = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

const TEAM_FLAGS: Record<string, string> = {
  Argentina: "🇦🇷", Australia: "🇦🇺", Algeria: "🇩🇿",
  Belgium: "🇧🇪", Brazil: "🇧🇷",
  Cameroon: "🇨🇲", Canada: "🇨🇦", Colombia: "🇨🇴", "Costa Rica": "🇨🇷", Croatia: "🇭🇷", "Czech Republic": "🇨🇿",
  Denmark: "🇩🇰", "DR Congo": "🇨🇩",
  Ecuador: "🇪🇨", Egypt: "🇪🇬", England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  France: "🇫🇷",
  Germany: "🇩🇪", Ghana: "🇬🇭",
  Haiti: "🇭🇹",
  Iran: "🇮🇷", Iraq: "🇮🇶", Italy: "🇮🇹",
  Jamaica: "🇯🇲", Japan: "🇯🇵",
  "Korea Republic": "🇰🇷",
  Mexico: "🇲🇽", Morocco: "🇲🇦",
  Netherlands: "🇳🇱", "New Zealand": "🇳🇿", Nigeria: "🇳🇬", Norway: "🇳🇴",
  Poland: "🇵🇱", Portugal: "🇵🇹",
  "Saudi Arabia": "🇸🇦", Scotland: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", Senegal: "🇸🇳", Serbia: "🇷🇸", Spain: "🇪🇸", "South Africa": "🇿🇦",
  Tunisia: "🇹🇳", Turkey: "🇹🇷",
  Ukraine: "🇺🇦", Uruguay: "🇺🇾", USA: "🇺🇸",
  Wales: "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
};

function getFlag(team: string): string {
  return TEAM_FLAGS[team] || "⚽";
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

const ROUND_SHORT: Record<RoundKey, string> = {
  "Vòng bảng": "Bảng",
  "Vòng 1/32": "1/32",
  "Vòng 1/16": "1/16",
  "Vòng 1/8": "BK",
  "Tứ kết": "Tứ kết",
  "Tranh hạng 3": "H3",
  "Chung kết": "CK",
};

export function FixtureSelector({ selectedId, onSelect, onRoundChange }: FixtureSelectorProps) {
  const [round, setRound] = useState<RoundKey>("Vòng bảng");
  const [group, setGroup] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let result = FIXTURES.filter((f) => f.round === round);
    if (round === "Vòng bảng" && group !== "ALL") {
      result = result.filter((f) => f.group === group);
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter(
        (f) =>
          f.homeTeam.toLowerCase().includes(s) ||
          f.awayTeam.toLowerCase().includes(s)
      );
    }
    return result.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  }, [round, group, search]);

  const handleRoundChange = (r: RoundKey) => {
    setRound(r);
    setGroup("ALL");
    onRoundChange(r);
  };

  return (
    <div className="space-y-3">
      {/* Round selector pills */}
      <div className="flex flex-wrap gap-1.5">
        {(["Vòng bảng", "Vòng 1/32", "Vòng 1/16", "Tứ kết", "Tranh hạng 3", "Chung kết"] as RoundKey[]).map((r) => (
          <button
            key={r}
            onClick={() => handleRoundChange(r)}
            className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-semibold transition-all cursor-pointer ${
              round === r
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                : "bg-white/[0.03] text-slate-400 border border-white/[0.06] hover:text-white hover:bg-white/[0.06]"
            }`}
          >
            {ROUND_SHORT[r]}
          </button>
        ))}
      </div>

      {/* Group filter (only for group stage) */}
      {round === "Vòng bảng" && (
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setGroup("ALL")}
            className={`w-7 h-7 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              group === "ALL"
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                : "bg-white/[0.03] text-slate-500 border border-white/[0.06] hover:text-white"
            }`}
          >
            All
          </button>
          {GROUP_ORDER.map((g) => (
            <button
              key={g}
              onClick={() => setGroup(g)}
              className={`w-7 h-7 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                group === g
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  : "bg-white/[0.03] text-slate-500 border border-white/[0.06] hover:text-white"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Tìm đội..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/30"
        />
      </div>

      {/* Match count */}
      <p className="text-[10px] text-slate-500">
        {filtered.length} trận
      </p>

      {/* Match cards */}
      <div className="grid gap-1.5 max-h-64 overflow-y-auto pr-1">
        {filtered.map((fixture) => (
          <button
            key={fixture.id}
            onClick={() => onSelect(fixture.id)}
            className={`w-full text-left rounded-xl px-3 py-2.5 border transition-all cursor-pointer ${
              selectedId === fixture.id
                ? "bg-amber-500/[0.08] border-amber-500/30"
                : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1]"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-base">{getFlag(fixture.homeTeam)}</span>
                <span className="text-xs font-medium text-white truncate">{fixture.homeTeam}</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono flex-shrink-0 mx-2">vs</span>
              <div className="flex items-center gap-1.5 min-w-0 justify-end">
                <span className="text-xs font-medium text-white truncate">{fixture.awayTeam}</span>
                <span className="text-base">{getFlag(fixture.awayTeam)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
              <span className="flex items-center gap-0.5">
                <Calendar size={10} />
                {formatDate(fixture.date)} {fixture.time}
              </span>
              {fixture.group && (
                <span className="px-1 rounded bg-cyan-500/10 text-cyan-400 text-[9px]">
                  Nhóm {fixture.group}
                </span>
              )}
              <span className="flex items-center gap-0.5 ml-auto">
                <MapPin size={10} />
                {fixture.venue.split(",")[0]}
              </span>
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-slate-500 text-xs text-center py-4">Không tìm thấy trận nào</p>
        )}
      </div>
    </div>
  );
}
