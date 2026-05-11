"use client";

import { useState, useEffect } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend, ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Cell } from "recharts";
import { Activity, Users, Shield, Search, Map } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Types
type Player = {
  Player: string;
  Nation: string;
  Pos: string;
  Age: number;
  Team: string;
  Min: number;
  Cluster: number;
  Player_Profile: string;
  PCA1: number;
  PCA2: number;
  Gls_90: number;
  Ast_90: number;
  xG_90: number;
  xAG_90: number;
  PrgC_90: number;
  PrgP_90: number;
  PrgR_90: number;
  Gls_90_percentile: number;
  Ast_90_percentile: number;
  xG_90_percentile: number;
  xAG_90_percentile: number;
  PrgC_90_percentile: number;
  PrgP_90_percentile: number;
  PrgR_90_percentile: number;
};


// Colors for the clusters (using Tailwind/Tailwind colors equivalent)
const CLUSTER_COLORS = [
  "#3b82f6", // Blue 500
  "#10b981", // Emerald 500
  "#f59e0b", // Amber 500
  "#ef4444", // Red 500
  "#8b5cf6", // Violet 500
  "#ec4899", // Pink 500
  "#f97316", // Orange 500
  "#14b8a6", // Teal 500
];

// Formation definitions: each position has a label, zone (for data filtering), and coordinates
type FormationPosition = { label: string; zone: string; top: string; left: string };

const FORMATIONS: Record<string, FormationPosition[]> = {
  '4-3-3': [
    { label: 'ST', zone: 'FW', top: '12%', left: '50%' },
    { label: 'LW', zone: 'FW', top: '20%', left: '18%' },
    { label: 'RW', zone: 'FW', top: '20%', left: '82%' },
    { label: 'LCM', zone: 'MF', top: '45%', left: '28%' },
    { label: 'CM', zone: 'MF', top: '50%', left: '50%' },
    { label: 'RCM', zone: 'MF', top: '45%', left: '72%' },
    { label: 'LB', zone: 'DF', top: '78%', left: '12%' },
    { label: 'LCB', zone: 'DF', top: '82%', left: '35%' },
    { label: 'RCB', zone: 'DF', top: '82%', left: '65%' },
    { label: 'RB', zone: 'DF', top: '78%', left: '88%' },
  ],
  '4-4-2': [
    { label: 'LST', zone: 'FW', top: '12%', left: '35%' },
    { label: 'RST', zone: 'FW', top: '12%', left: '65%' },
    { label: 'LM', zone: 'MF', top: '42%', left: '12%' },
    { label: 'LCM', zone: 'MF', top: '45%', left: '38%' },
    { label: 'RCM', zone: 'MF', top: '45%', left: '62%' },
    { label: 'RM', zone: 'MF', top: '42%', left: '88%' },
    { label: 'LB', zone: 'DF', top: '78%', left: '12%' },
    { label: 'LCB', zone: 'DF', top: '82%', left: '35%' },
    { label: 'RCB', zone: 'DF', top: '82%', left: '65%' },
    { label: 'RB', zone: 'DF', top: '78%', left: '88%' },
  ],
  '3-5-2': [
    { label: 'LST', zone: 'FW', top: '12%', left: '35%' },
    { label: 'RST', zone: 'FW', top: '12%', left: '65%' },
    { label: 'LM', zone: 'MF', top: '40%', left: '10%' },
    { label: 'LCM', zone: 'MF', top: '45%', left: '32%' },
    { label: 'CDM', zone: 'MF', top: '52%', left: '50%' },
    { label: 'RCM', zone: 'MF', top: '45%', left: '68%' },
    { label: 'RM', zone: 'MF', top: '40%', left: '90%' },
    { label: 'LCB', zone: 'DF', top: '82%', left: '22%' },
    { label: 'CB', zone: 'DF', top: '85%', left: '50%' },
    { label: 'RCB', zone: 'DF', top: '82%', left: '78%' },
  ],
  '4-2-3-1': [
    { label: 'ST', zone: 'FW', top: '10%', left: '50%' },
    { label: 'LAM', zone: 'MF', top: '28%', left: '20%' },
    { label: 'CAM', zone: 'MF', top: '25%', left: '50%' },
    { label: 'RAM', zone: 'MF', top: '28%', left: '80%' },
    { label: 'LCDM', zone: 'MF', top: '52%', left: '38%' },
    { label: 'RCDM', zone: 'MF', top: '52%', left: '62%' },
    { label: 'LB', zone: 'DF', top: '78%', left: '12%' },
    { label: 'LCB', zone: 'DF', top: '82%', left: '35%' },
    { label: 'RCB', zone: 'DF', top: '82%', left: '65%' },
    { label: 'RB', zone: 'DF', top: '78%', left: '88%' },
  ],
  '5-3-2': [
    { label: 'LST', zone: 'FW', top: '12%', left: '35%' },
    { label: 'RST', zone: 'FW', top: '12%', left: '65%' },
    { label: 'LCM', zone: 'MF', top: '42%', left: '28%' },
    { label: 'CM', zone: 'MF', top: '45%', left: '50%' },
    { label: 'RCM', zone: 'MF', top: '42%', left: '72%' },
    { label: 'LWB', zone: 'DF', top: '65%', left: '8%' },
    { label: 'LCB', zone: 'DF', top: '80%', left: '25%' },
    { label: 'CB', zone: 'DF', top: '84%', left: '50%' },
    { label: 'RCB', zone: 'DF', top: '80%', left: '75%' },
    { label: 'RWB', zone: 'DF', top: '65%', left: '92%' },
  ],
};

const PositionNode = ({ top, left, label, zone, onClick, assignedPlayer }: { top: string, left: string, label: string, zone: string, onClick: (zone: string, label: string) => void, assignedPlayer?: Player | null }) => (
  <button
    onClick={() => onClick(zone, label)}
    className="absolute -translate-x-1/2 -translate-y-1/2 group z-10"
    style={{ top, left }}
  >
    {assignedPlayer ? (
      <div className="flex flex-col items-center gap-0.5 group-hover:scale-105 transition-transform duration-300">
        <div
          className="w-[72px] h-[100px] rounded-lg overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.6)] border border-white/20 relative"
          style={{ background: `linear-gradient(135deg, ${CLUSTER_COLORS[assignedPlayer.Cluster]}60 0%, #0f172a 100%)` }}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center p-1">
            <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: CLUSTER_COLORS[assignedPlayer.Cluster] }}>{assignedPlayer.Pos.split(',')[0]}</span>
            <Users size={28} className="text-white/70 my-0.5" />
            <span className="text-[8px] font-black text-white uppercase truncate w-full text-center leading-tight">{assignedPlayer.Player.split(' ').pop()}</span>
            <div className="flex gap-2 mt-0.5 text-[7px] text-slate-300 font-bold">
              <span>G {assignedPlayer.Gls_90.toFixed(1)}</span>
              <span>xG {assignedPlayer.xG_90.toFixed(1)}</span>
            </div>
          </div>
        </div>
        <span className="text-[8px] font-bold text-emerald-400 bg-black/80 px-1.5 py-0.5 rounded">{label}</span>
      </div>
    ) : (
      <div className="flex flex-col items-center gap-1">
        <div className="w-14 h-14 rounded-full bg-slate-900/90 border-2 border-white/30 backdrop-blur-md flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.5)] group-hover:shadow-[0_0_30px_rgba(59,130,246,0.8)] group-hover:border-blue-400 group-hover:scale-110 transition-all duration-300">
          <span className="text-white font-black text-lg tracking-wider">{label}</span>
        </div>
        <div className="px-3 py-1 rounded bg-black/80 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10 text-xs font-bold text-blue-300 shadow-xl">
          Select {label}
        </div>
      </div>
    )}
  </button>
);

export default function Home() {
  const [data, setData] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pitch" | "clusters" | "compare">("pitch");

  // Cluster Map State
  const [clusterSearch, setClusterSearch] = useState("");
  const [searchedPlayer, setSearchedPlayer] = useState<Player | null>(null);
  const [activeClusters, setActiveClusters] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [selectedPositionLabel, setSelectedPositionLabel] = useState<string | null>(null);
  const [squad, setSquad] = useState<Record<string, Player>>({}); // label -> Player
  const [formation, setFormation] = useState<string>('4-3-3');

  const currentFormation = FORMATIONS[formation];
  const totalPositions = currentFormation.length;

  const handleFormationChange = (f: string) => {
    setFormation(f);
    setSquad({});
  };


  const handlePositionSelect = (zone: string, label: string) => {
    setSelectedZone(zone);
    setSelectedPositionLabel(label);
    setActiveTab("clusters");
  };

  const handlePlayerSelect = (player: Player) => {
    if (selectedPositionLabel) {
      setSquad(prev => ({ ...prev, [selectedPositionLabel]: player }));
      setSelectedZone(null);
      setSelectedPositionLabel(null);
      setActiveTab("pitch");
    }
  };

  const toggleCluster = (id: number) => {
    if (activeClusters.length === 7) {
      setActiveClusters([id]);
    } else if (activeClusters.includes(id) && activeClusters.length === 1) {
      setActiveClusters([0, 1, 2, 3, 4, 5, 6]);
    } else {
      setActiveClusters(prev =>
        prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
      );
    }
  };

  // Player Comparison State
  const [player1, setPlayer1] = useState<Player | null>(null);
  const [player2, setPlayer2] = useState<Player | null>(null);

  const [search1, setSearch1] = useState("");
  const [search2, setSearch2] = useState("");

  useEffect(() => {
    fetch("/data.json")
      .then((res) => res.json())
      .then((data: Player[]) => {
        setData(data);

        // Find some cool defaults for comparison
        const haaland = data.find((p) => p.Player === "Erling Haaland");
        const kdb = data.find((p) => p.Player.includes("De Bruyne"));
        if (haaland) setPlayer1(haaland);
        if (kdb) setPlayer2(kdb);

        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // OVR calculation to find the "best" players
  const getOVR = (p: Player) => (p.Gls_90_percentile * 0.3 + p.xG_90_percentile * 0.2 + p.PrgC_90_percentile * 0.2 + p.PrgP_90_percentile * 0.2 + p.PrgR_90_percentile * 0.1);

  // Already-selected player names
  const selectedPlayerNames = new Set(Object.values(squad).map(p => p.Player));

  let finalDisplayData: Player[] = [];

  const rawClusterData = [0, 1, 2, 3, 4, 5, 6].map(clusterId => {
    if (!activeClusters.includes(clusterId)) return [];
    return data.filter(p => p.Cluster === clusterId);
  });

  finalDisplayData = rawClusterData.flat();

  // Exclude already-selected players
  finalDisplayData = finalDisplayData.filter(p => !selectedPlayerNames.has(p.Player));

  if (selectedZone) {
    // Sort by positional relevance: players whose Pos includes the zone come first, then by OVR
    finalDisplayData.sort((a, b) => {
      const aMatch = a.Pos.includes(selectedZone) ? 1 : 0;
      const bMatch = b.Pos.includes(selectedZone) ? 1 : 0;
      if (bMatch !== aMatch) return bMatch - aMatch;
      return getOVR(b) - getOVR(a);
    });
  } else {
    finalDisplayData.sort((a, b) => b.Min - a.Min);
  }

  // Extract unique profiles mapping properly sorted by cluster ID (0 to 5)
  const profileNames = [0, 1, 2, 3, 4, 5, 6].map(id => {
    const match = data.find(d => d.Cluster === id);
    return match ? match.Player_Profile : `Cluster ${id}`;
  });

  // Radar Chart Data formatting
  const getRadarData = () => {
    const metrics = [
      { key: "Gls_90", label: "Goals" },
      { key: "Ast_90", label: "Assists" },
      { key: "xG_90", label: "Exp Goals (xG)" },
      { key: "xAG_90", label: "Exp Assists (xAG)" },
      { key: "PrgP_90", label: "Prog. Passes" },
      { key: "PrgC_90", label: "Prog. Carries" },
      { key: "PrgR_90", label: "Prog. Received" }
    ];

    return metrics.map(m => {
      const p1Val = player1 ? (player1 as unknown as Record<string, number>)[m.key + "_percentile"] : 0;
      const p2Val = player2 ? (player2 as unknown as Record<string, number>)[m.key + "_percentile"] : 0;
      return {
        subject: m.label,
        Player1: Math.round(p1Val),
        Player2: Math.round(p2Val),
        fullMark: 100
      };
    });
  };

  const radarData = getRadarData();

  // Search filter
  const filteredClusterSearch = data.filter(p => p.Player.toLowerCase().includes(clusterSearch.toLowerCase())).slice(0, 5);
  const filteredSearch1 = data.filter(p => p.Player.toLowerCase().includes(search1.toLowerCase())).slice(0, 5);
  const filteredSearch2 = data.filter(p => p.Player.toLowerCase().includes(search2.toLowerCase())).slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="min-h-screen text-slate-50 p-6 sm:p-12 font-sans selection:bg-blue-500/30"
    >

      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="max-w-7xl mx-auto mb-12 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-6"
      >
        <div className="space-y-2">
          <div className="inline-block px-3 py-1 mb-2 text-xs font-semibold tracking-wider text-blue-400 uppercase bg-blue-500/10 border border-blue-500/20 rounded-full">
            K-Means Machine Learning
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-200 to-indigo-400 drop-shadow-sm">
            Premier League Analytics
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl font-light">Next-gen player tactical profiling and scouting tool for the 2023/24 season.</p>
        </div>

        <div className="glass-card p-1.5 rounded-2xl flex gap-1 shadow-2xl">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab("pitch")}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${activeTab === 'pitch' ? 'bg-blue-500/20 text-blue-300 shadow-[inset_0_0_20px_rgba(59,130,246,0.15)] border border-blue-500/40' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
          >
            <Map size={18} className={activeTab === 'pitch' ? 'text-blue-400' : ''} /> Pitch
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab("clusters")}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${activeTab === 'clusters' ? 'bg-blue-500/20 text-blue-300 shadow-[inset_0_0_20px_rgba(59,130,246,0.15)] border border-blue-500/40' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
          >
            <Users size={18} className={activeTab === 'clusters' ? 'text-blue-400' : ''} /> Cluster Map
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab("compare")}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${activeTab === 'compare' ? 'bg-emerald-500/20 text-emerald-300 shadow-[inset_0_0_20px_rgba(16,185,129,0.15)] border border-emerald-500/40' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
          >
            <Shield size={18} className={activeTab === 'compare' ? 'text-emerald-400' : ''} /> Compare
          </motion.button>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto">

        <AnimatePresence mode="wait">

          {/* --- PITCH TAB --- */}
          {activeTab === "pitch" && (
            <motion.div
              key="pitch"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center justify-center py-8"
            >
              <div className="text-center mb-8 space-y-4">
                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-xl uppercase italic">Select Your Build</h2>
                <p className="text-slate-300 text-lg">Choose a formation, then tap each position to assign players.</p>

                {/* Formation Selector */}
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {Object.keys(FORMATIONS).map(f => (
                    <button
                      key={f}
                      onClick={() => handleFormationChange(f)}
                      className={`px-4 py-2 rounded-xl font-bold text-sm transition-all duration-300 border ${formation === f
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                        : 'bg-slate-800/50 text-slate-400 border-slate-700/50 hover:text-white hover:border-slate-500'
                        }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                {Object.keys(squad).length > 0 && (
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    <span className="text-emerald-400 font-bold text-sm">{Object.keys(squad).length}/{totalPositions} Positions Filled</span>
                    <button onClick={() => setSquad({})} className="text-xs text-red-400 hover:text-red-300 border border-red-500/30 px-3 py-1 rounded-lg hover:bg-red-500/10 transition-colors">Reset Squad</button>
                  </div>
                )}
              </div>

              <div className="relative w-full max-w-4xl mx-auto aspect-[2/3] md:aspect-[3/4] bg-gradient-to-b from-emerald-800 to-green-950 rounded-[40px] border-8 border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden ring-1 ring-white/10">
                {/* Pitch Markings (CSS) */}
                <div className="absolute inset-0 pointer-events-none opacity-40">
                  <div className="absolute top-1/2 left-0 w-full h-1 bg-white -translate-y-1/2"></div>
                  <div className="absolute top-1/2 left-1/2 w-48 h-48 border-4 border-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                  <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                  {/* Penalty Boxes */}
                  <div className="absolute top-0 left-1/2 w-1/2 h-1/6 border-4 border-white border-t-0 -translate-x-1/2"></div>
                  <div className="absolute top-0 left-1/2 w-1/4 h-[8%] border-4 border-white border-t-0 -translate-x-1/2"></div>
                  <div className="absolute bottom-0 left-1/2 w-1/2 h-1/6 border-4 border-white border-b-0 -translate-x-1/2"></div>
                  <div className="absolute bottom-0 left-1/2 w-1/4 h-[8%] border-4 border-white border-b-0 -translate-x-1/2"></div>
                </div>

                {/* Dynamic Formation Positions */}
                {currentFormation.map(pos => (
                  <PositionNode key={pos.label} top={pos.top} left={pos.left} label={pos.label} zone={pos.zone} onClick={handlePositionSelect} assignedPlayer={squad[pos.label]} />
                ))}
              </div>
            </motion.div>
          )}

          {/* --- CLUSTER MAP TAB --- */}
          {activeTab === "clusters" && (
            <motion.div
              key="clusters"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              {/* Position Selection Header */}
              {selectedPositionLabel && (
                <div className="flex items-center justify-between glass-card p-4 rounded-2xl border border-blue-500/30">
                  <div className="flex items-center gap-4">
                    <button onClick={() => { setSelectedZone(null); setSelectedPositionLabel(null); setActiveTab('pitch'); }} className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-1">← Back to Pitch</button>
                    <div className="h-6 w-px bg-slate-700"></div>
                    <span className="text-white font-bold">Selecting player for: <span className="text-blue-400 text-lg">{selectedPositionLabel}</span></span>
                  </div>
                  <span className="text-slate-400 text-sm">{finalDisplayData.length} players available</span>
                </div>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* Sidebar */}
                <div className="col-span-1 space-y-6">
                  <div className="glass-card p-6 rounded-2xl border-t border-slate-700/50">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                      <Activity size={20} className="text-blue-400" />
                      K-Means AI Clusters
                    </h2>
                    <div className="space-y-3">
                      {profileNames.map((name, i) => {
                        const isActive = activeClusters.includes(i);
                        return (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            key={i}
                            onClick={() => toggleCluster(i)}
                            className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-300 interactive-card ${isActive
                              ? 'bg-slate-800/80 border-slate-500 shadow-[0_0_15px_rgba(255,255,255,0.05)] translate-x-1'
                              : 'bg-slate-800/30 border-slate-700/30 opacity-50 hover:opacity-100 hover:border-slate-600'
                              }`}
                          >
                            <div className={`w-3.5 h-3.5 rounded-full transition-all duration-500 ${isActive ? 'shadow-[0_0_12px_currentColor] scale-110' : 'scale-90'}`} style={{ backgroundColor: CLUSTER_COLORS[i], color: CLUSTER_COLORS[i] }}></div>
                            <span className={`text-sm font-medium text-left ${isActive ? 'text-white drop-shadow-sm' : 'text-slate-400'}`}>{name}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stats Key */}
                  <div className="glass-card p-5 rounded-2xl border-t border-slate-700/50">
                    <h2 className="text-sm font-bold mb-3 flex items-center gap-2 text-white uppercase tracking-wider">
                      <Shield size={16} className="text-emerald-400" />
                      Stats Key
                    </h2>
                    <div className="space-y-2 text-[11px]">
                      <div className="flex justify-between items-center">
                        <span className="text-blue-400 font-bold">G/90</span>
                        <span className="text-slate-400">Goals per 90 min</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-blue-400 font-bold">A/90</span>
                        <span className="text-slate-400">Assists per 90 min</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-blue-400 font-bold">xG/90</span>
                        <span className="text-slate-400">Expected Goals per 90</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-blue-400 font-bold">xAG/90</span>
                        <span className="text-slate-400">Expected Assists per 90</span>
                      </div>
                      <div className="border-t border-slate-700/50 pt-2 mt-2"></div>
                      <div className="flex justify-between items-center">
                        <span className="text-emerald-400 font-bold">PrgC</span>
                        <span className="text-slate-400">Progressive Carries /90</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-emerald-400 font-bold">PrgP</span>
                        <span className="text-slate-400">Progressive Passes /90</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-emerald-400 font-bold">PrgR</span>
                        <span className="text-slate-400">Progressive Receptions /90</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chart Area */}
                <div className="col-span-1 lg:col-span-3 flex flex-col gap-4">

                  {/* Cluster Search */}
                  <div className="glass-card p-4 rounded-2xl border-t border-slate-700/50 relative z-20">
                    <div className="relative flex items-center">
                      <Search className="absolute left-4 text-slate-500 pointer-events-none" size={18} />
                      <input
                        type="text"
                        placeholder="Locate a player in the bento box..."
                        value={clusterSearch}
                        onChange={(e) => setClusterSearch(e.target.value)}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner placeholder-slate-500"
                      />
                      {clusterSearch && (
                        <div className="absolute top-full left-0 w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                          {filteredClusterSearch.length > 0 ? filteredClusterSearch.map(p => (
                            <button
                              key={p.Player}
                              onClick={() => { setSearchedPlayer(p); setClusterSearch(""); }}
                              className="w-full text-left px-4 py-3 hover:bg-slate-700 flex justify-between items-center transition-colors"
                            >
                              <span className="font-medium">{p.Player}</span>
                              <span className="text-xs text-slate-400">{p.Team}</span>
                            </button>
                          )) : (
                            <div className="px-4 py-3 text-slate-400 text-sm">No players found</div>
                          )}
                        </div>
                      )}
                    </div>
                    {searchedPlayer && (
                      <div className="mt-3 flex justify-between items-center bg-slate-800/50 rounded-lg p-3 border border-yellow-500/30">
                        <div>
                          <span className="text-xs text-slate-400 block">Showing results for</span>
                          <span className="font-bold text-white flex items-center gap-2">
                            <span className="text-yellow-400 text-lg">★</span> {searchedPlayer.Player} — {searchedPlayer.Team}
                          </span>
                        </div>
                        <button onClick={() => setSearchedPlayer(null)} className="text-slate-400 hover:text-white px-3 py-1 bg-slate-700 rounded hover:bg-slate-600 transition-colors text-sm">
                          Show All
                        </button>
                      </div>
                    )}
                  </div>

                  {/* PCA Scatter Plot */}
                  <div className="glass-card p-6 rounded-2xl border-t border-slate-700/50">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Activity size={18} className="text-blue-400" />
                      K-Means Cluster Scatter Plot
                      <span className="text-xs text-slate-400 font-normal ml-2">PCA-reduced 2D space</span>
                    </h3>
                    <ResponsiveContainer width="100%" height={420}>
                      <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis
                          type="number" dataKey="PCA1" name="PCA1"
                          tick={{ fill: '#94a3b8', fontSize: 11 }}
                          axisLine={{ stroke: '#475569' }}
                          label={{ value: 'PCA Component 1', position: 'bottom', fill: '#64748b', fontSize: 12 }}
                        />
                        <YAxis
                          type="number" dataKey="PCA2" name="PCA2"
                          tick={{ fill: '#94a3b8', fontSize: 11 }}
                          axisLine={{ stroke: '#475569' }}
                          label={{ value: 'PCA Component 2', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 12 }}
                        />
                        <ZAxis range={[40, 40]} />
                        <Tooltip
                          cursor={{ strokeDasharray: '3 3', stroke: '#64748b' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload as Player;
                              return (
                                <div className="bg-slate-800/95 backdrop-blur-md border border-slate-600 rounded-xl p-3 shadow-2xl max-w-[220px]">
                                  <p className="font-bold text-white text-sm">{d.Player}</p>
                                  <p className="text-slate-400 text-xs">{d.Team} · {d.Pos}</p>
                                  <div className="flex items-center gap-2 mt-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CLUSTER_COLORS[d.Cluster] }}></div>
                                    <span className="text-[10px] text-slate-300 font-medium">{d.Perfil_do_Jogador}</span>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        {[0, 1, 2, 3, 4, 5, 6].map(clusterId => {
                          if (!activeClusters.includes(clusterId)) return null;
                          const clusterPlayers = data.filter(p => p.Cluster === clusterId);
                          return (
                            <Scatter
                              key={clusterId}
                              name={profileNames[clusterId]}
                              data={clusterPlayers}
                              fill={CLUSTER_COLORS[clusterId]}
                              onClick={(dotData: { payload?: Player }) => {
                                if (dotData?.payload) {
                                  setSearchedPlayer(searchedPlayer?.Player === dotData.payload.Player ? null : dotData.payload);
                                }
                              }}
                              cursor="pointer"
                            >
                              {clusterPlayers.map((p, idx) => (
                                <Cell
                                  key={idx}
                                  fill={CLUSTER_COLORS[clusterId]}
                                  fillOpacity={searchedPlayer && searchedPlayer.Player === p.Player ? 1 : 0.7}
                                  stroke={searchedPlayer && searchedPlayer.Player === p.Player ? '#facc15' : 'transparent'}
                                  strokeWidth={searchedPlayer && searchedPlayer.Player === p.Player ? 3 : 0}
                                />
                              ))}
                            </Scatter>
                          );
                        })}
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="relative z-10 w-full h-[600px] overflow-y-auto pr-2 pb-10 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                    <motion.div
                      layout
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    >
                      <AnimatePresence>
                        {(searchedPlayer ? finalDisplayData.filter(p => p.Player === searchedPlayer.Player) : finalDisplayData).map((player) => (
                          <motion.div
                            key={player.Player}
                            layout
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            whileHover={{ scale: 1.03, y: -4 }}
                            transition={{ duration: 0.3 }}
                            onClick={() => selectedPositionLabel && handlePlayerSelect(player)}
                            className={`relative w-full aspect-[2/3] rounded-t-3xl rounded-b-xl overflow-hidden shadow-2xl interactive-card group border-b-[6px] ${searchedPlayer?.Player === player.Player ? 'ring-4 ring-yellow-400' : ''} ${selectedPositionLabel ? 'cursor-pointer' : ''}`}
                            style={{
                              background: `linear-gradient(135deg, ${CLUSTER_COLORS[player.Cluster]}50 0%, #0f172a 100%)`,
                              borderBottomColor: CLUSTER_COLORS[player.Cluster]
                            }}
                          >
                            {/* Card inner border */}
                            <div className="absolute inset-[3px] border-2 border-white/20 rounded-t-[20px] rounded-b-[8px] pointer-events-none z-10"></div>
                            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 blur-3xl rounded-full"></div>

                            {/* FUT Card Content */}
                            <div className="absolute inset-0 p-4 flex flex-col z-20">
                              {/* Top Header: Pos & Team/Nation */}
                              <div className="flex justify-between items-start">
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold uppercase tracking-wider" style={{ color: CLUSTER_COLORS[player.Cluster], textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{player.Pos.split(',')[0]}</span>
                                  <span className="text-[9px] text-slate-400 font-medium">Age {player.Age}</span>
                                </div>
                                <div className="flex flex-col items-end gap-0.5">
                                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-300 text-right max-w-[100px] leading-tight">{player.Team}</div>
                                  <span className="text-[9px] text-slate-500 font-medium">{player.Nation.split(' ').pop()}</span>
                                </div>
                              </div>

                              {/* Player Silhouette */}
                              <div className="flex-1 flex items-end justify-center relative mt-1">
                                <div className="absolute bottom-0 w-20 h-20 rounded-full blur-2xl" style={{ backgroundColor: CLUSTER_COLORS[player.Cluster], opacity: 0.5 }}></div>
                                <Users size={72} className="text-white/50 group-hover:text-white/90 transition-colors drop-shadow-2xl scale-110 group-hover:scale-125 duration-500 origin-bottom" />
                              </div>

                              {/* Player Name */}
                              <div className="text-center mt-1 pb-1.5 border-b-2 border-white/20 relative">
                                <h3 className="font-black text-lg text-white uppercase tracking-wider truncate drop-shadow-md">{player.Player}</h3>
                                <span className="text-[9px] text-slate-400">{player.Min} mins played</span>
                              </div>

                              {/* Stats Grid - All stats */}
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-[10px] font-bold px-0.5">
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-400 font-medium tracking-wider">G/90</span>
                                  <span className="text-white text-[11px]">{player.Gls_90.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-400 font-medium tracking-wider">A/90</span>
                                  <span className="text-white text-[11px]">{player.Ast_90.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-400 font-medium tracking-wider">xG/90</span>
                                  <span className="text-white text-[11px]">{player.xG_90.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-400 font-medium tracking-wider">xAG/90</span>
                                  <span className="text-white text-[11px]">{player.xAG_90.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-400 font-medium tracking-wider">PrgC</span>
                                  <span className="text-white text-[11px]">{player.PrgC_90.toFixed(1)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-400 font-medium tracking-wider">PrgP</span>
                                  <span className="text-white text-[11px]">{player.PrgP_90.toFixed(1)}</span>
                                </div>
                                <div className="flex justify-between items-center col-span-2 border-t border-white/10 pt-1 mt-0.5">
                                  <span className="text-slate-400 font-medium tracking-wider">PrgR</span>
                                  <span className="text-white text-[11px]">{player.PrgR_90.toFixed(1)}</span>
                                </div>
                              </div>

                              {/* Cluster Tag */}
                              <div className="mt-2 mb-1 flex justify-center">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-black/60 border border-white/20 shadow-lg backdrop-blur-md">
                                  <div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: CLUSTER_COLORS[player.Cluster], color: CLUSTER_COLORS[player.Cluster] }}></div>
                                  <span className="text-[9px] uppercase tracking-widest text-slate-100 font-bold truncate max-w-[130px]">{player.Perfil_do_Jogador}</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      {finalDisplayData.length === 0 && (
                        <div className="col-span-full py-20 text-center text-slate-500 flex flex-col items-center">
                          <Users size={48} className="mb-4 opacity-20" />
                          <p className="text-lg font-medium">{selectedZone === 'GK' ? 'Goalkeepers Not Included' : 'No players selected'}</p>
                          <p className="text-sm">{selectedZone === 'GK' ? 'GK data is evaluated using separate metrics and not included in outfield tactical clustering.' : 'Select at least one tactical cluster from the sidebar.'}</p>
                        </div>
                      )}
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* --- COMPARE TAB --- */}
          {activeTab === "compare" && (
            <motion.div
              key="compare"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >

              {/* Player Search Bars */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Player 1 Selection */}
                <div className="glass-card p-6 md:p-8 rounded-3xl border-t border-blue-500/30 relative interactive-card group overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-bl-full -mr-10 -mt-10 blur-xl group-hover:bg-blue-500/20 transition-all duration-700 pointer-events-none"></div>
                  <div className="flex justify-between items-center mb-6 relative z-10">
                    <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)] animate-pulse"></div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Player 1</h3>
                  </div>

                  <div className="relative z-10">
                    <input
                      type="text"
                      placeholder="Search Player 1..."
                      value={search1}
                      onChange={(e) => setSearch1(e.target.value)}
                      className="w-full bg-slate-900/60 border border-slate-700 rounded-xl py-3.5 px-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner placeholder-slate-500"
                    />
                    {search1 && (
                      <div className="absolute top-full left-0 w-full mt-2 bg-slate-800/95 backdrop-blur-xl border border-slate-600 rounded-xl shadow-2xl z-50 overflow-hidden">
                        {filteredSearch1.map(p => (
                          <button
                            key={p.Player}
                            onClick={() => { setPlayer1(p); setSearch1(""); }}
                            className="w-full text-left px-5 py-3.5 hover:bg-blue-500/20 flex justify-between items-center transition-colors border-b border-slate-700/50 last:border-0"
                          >
                            <span className="font-semibold text-slate-100">{p.Player}</span>
                            <span className="text-xs font-medium text-slate-400 bg-slate-900/50 px-2 py-1 rounded-md">{p.Team}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {player1 && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="mt-8 flex flex-col gap-1 relative z-10"
                    >
                      <h2 className="text-4xl font-extrabold text-white drop-shadow-md">{player1.Player}</h2>
                      <p className="text-blue-400 font-medium text-lg flex items-center gap-2">
                        <Shield size={16} /> {player1.Team} <span className="text-slate-600">|</span> {player1.Pos}
                      </p>
                      <div className="mt-6 flex flex-col gap-1.5">
                        <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Tactical Profile</span>
                        <div className="inline-flex items-center gap-2 bg-slate-900/50 border border-slate-700/80 rounded-lg px-4 py-2.5 w-max">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CLUSTER_COLORS[player1.Cluster], boxShadow: `0 0 8px ${CLUSTER_COLORS[player1.Cluster]}` }}></div>
                          <span className="font-bold tracking-wide" style={{ color: CLUSTER_COLORS[player1.Cluster] }}>{player1.Perfil_do_Jogador}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Player 2 Selection */}
                <div className="glass-card p-6 md:p-8 rounded-3xl border-t border-emerald-500/30 relative interactive-card group overflow-hidden">
                  <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-br-full -ml-10 -mt-10 blur-xl group-hover:bg-emerald-500/20 transition-all duration-700 pointer-events-none"></div>
                  <div className="flex justify-between items-center mb-6 relative z-10">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Player 2</h3>
                    <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)] animate-pulse"></div>
                  </div>
<<<<<<< HEAD
=======

                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 60, right: 20, bottom: 50, left: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                      <XAxis type="number" dataKey="PCA1" name="PCA1" stroke="#64748b" tick={{fill: '#94a3b8'}} label={{ value: "PC1 — Attacking Activity / Final Third Volume", position: "insideBottom", offset: -10, fill: "#64748b", fontSize: 12 }} />
                      <YAxis type="number" dataKey="PCA2" name="PCA2" stroke="#64748b" tick={{fill: '#94a3b8'}} label={{ value: "PC2 — Progression & Chance Creation", angle: -90, position: "insideLeft", offset: 10, fill: "#64748b", fontSize: 12 }} />

                      <Tooltip
                        isAnimationActive={false}
                        cursor={{ strokeDasharray: '3 3', stroke: '#cbd5e1', opacity: 0.2 }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="glass-card p-4 rounded-xl border border-slate-600 shadow-2xl backdrop-blur-xl">
                                <p className="font-bold text-lg text-white mb-1">{data.Player}</p>
                                <p className="text-sm text-slate-300 font-medium mb-3">{data.Team} • {data.Pos}</p>
                                <div className="space-y-1.5">
                                  <p className="text-xs text-slate-400 flex justify-between gap-4">
                                    <span>Profile:</span>
                                    <span className="font-semibold" style={{color: CLUSTER_COLORS[data.Cluster]}}>{data.Player_Profile}</span>
                                  </p>
                                  <div className="h-px w-full bg-slate-700/50 my-1"></div>
                                  <p className="text-xs text-slate-400 flex justify-between gap-4">
                                    <span>xG+xAG/90:</span> <span className="text-white">{(data.xG_90 + data.xAG_90).toFixed(2)}</span>
                                  </p>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />

                      {clusterData.map((cData, index) => (
                        <Scatter
                          key={index}
                          name={profileNames[index] || `Cluster ${index}`}
                          data={cData}
                          fill={CLUSTER_COLORS[index]}
                          fillOpacity={0.8}
                          stroke={CLUSTER_COLORS[index]}
                          strokeWidth={1}
                        />
                      ))}
>>>>>>> 93182cd172ab93e27438acf09d196d968b61cd33

  <div className="relative z-10">
    <input
      type="text"
      placeholder="Search Player 2..."
      value={search2}
      onChange={(e) => setSearch2(e.target.value)}
      className="w-full bg-slate-900/60 border border-slate-700 rounded-xl py-3.5 px-4 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner placeholder-slate-500 text-right"
    />
    {search2 && (
      <div className="absolute top-full left-0 w-full mt-2 bg-slate-800/95 backdrop-blur-xl border border-slate-600 rounded-xl shadow-2xl z-50 overflow-hidden">
        {filteredSearch2.map(p => (
          <button
            key={p.Player}
            onClick={() => { setPlayer2(p); setSearch2(""); }}
            className="w-full text-left px-5 py-3.5 hover:bg-emerald-500/20 flex justify-between items-center transition-colors border-b border-slate-700/50 last:border-0"
          >
            <span className="text-xs font-medium text-slate-400 bg-slate-900/50 px-2 py-1 rounded-md">{p.Team}</span>
            <span className="font-semibold text-slate-100">{p.Player}</span>
          </button>
        ))}
      </div>
    )}
  </div>

  {
    player2 && (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mt-8 flex flex-col gap-1 relative z-10 text-right"
      >
        <h2 className="text-4xl font-extrabold text-white drop-shadow-md">{player2.Player}</h2>
        <p className="text-emerald-400 font-medium text-lg flex items-center justify-end gap-2">
          {player2.Pos} <span className="text-slate-600">|</span> {player2.Team} <Shield size={16} />
        </p>
        <div className="mt-6 flex flex-col items-end gap-1.5">
          <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Tactical Profile</span>
          <div className="inline-flex items-center gap-2 bg-slate-900/50 border border-slate-700/80 rounded-lg px-4 py-2.5 w-max">
            <span className="font-bold tracking-wide" style={{ color: CLUSTER_COLORS[player2.Cluster] }}>{player2.Perfil_do_Jogador}</span>
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CLUSTER_COLORS[player2.Cluster], boxShadow: `0 0 8px ${CLUSTER_COLORS[player2.Cluster]}` }}></div>
          </div>
        </div>
      </motion.div>
    )
  }
                </div >

              </div >

    {/* Radar Chart */ }
    < div className = "glass-card rounded-3xl p-6 md:p-10 border-t border-slate-700/50" >
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">Head to Head Performance</h3>
                  <p className="text-slate-400 mt-2 text-sm">Metrics shown as Percentiles (0-100) relative to all PL outfield players</p>
                </div>

                <div className="h-[450px] md:h-[550px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 500 }}
                      />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#475569' }} tickCount={6} />

                      {player1 && (
                        <Radar
                          name={player1.Player}
                          dataKey="Player1"
                          stroke="#3b82f6"
                          strokeWidth={3}
                          fill="#3b82f6"
                          fillOpacity={0.4}
                        />
                      )}
                      {player2 && (
                        <Radar
                          name={player2.Player}
                          dataKey="Player2"
                          stroke="#10b981"
                          strokeWidth={3}
                          fill="#10b981"
                          fillOpacity={0.4}
                        />
                      )}
                      <Tooltip
                        isAnimationActive={false}
                        contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: '#475569', borderRadius: '12px', color: '#f8fafc' }}
                        itemStyle={{ fontWeight: 'bold' }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div >

<<<<<<< HEAD
            </motion.div >
          )
}
        </AnimatePresence >
=======
        {/* --- COMPARE TAB --- */}
        {activeTab === "compare" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* Player Search Bars */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Player 1 Selection */}
              <div className="glass-card p-6 rounded-2xl border-t border-blue-500/20 relative">
                <div className="flex justify-between items-center mb-4">
                  <div className="w-4 h-4 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]"></div>
                  <h3 className="text-sm font-medium text-slate-400 uppercase tracking-widest">Player 1</h3>
                </div>
                
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search Player 1..."
                    value={search1}
                    onChange={(e) => setSearch1(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  {search1 && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                      {filteredSearch1.map(p => (
                        <button 
                          key={p.Player}
                          onClick={() => { setPlayer1(p); setSearch1(""); }}
                          className="w-full text-left px-4 py-3 hover:bg-slate-700 flex justify-between items-center transition-colors"
                        >
                          <span className="font-medium">{p.Player}</span>
                          <span className="text-xs text-slate-400">{p.Team}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {player1 && (
                  <div className="mt-6 flex flex-col gap-2">
                    <h2 className="text-3xl font-bold text-white">{player1.Player}</h2>
                    <p className="text-blue-400 font-medium">{player1.Team} • {player1.Pos}</p>
                    <div className="mt-2 text-sm text-slate-300 border border-slate-700/50 bg-slate-800/30 rounded-lg p-3">
                      <span className="block text-xs uppercase text-slate-500 mb-1">AI Profile</span>
                      <span className="font-semibold" style={{color: CLUSTER_COLORS[player1.Cluster]}}>{player1.Player_Profile}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Player 2 Selection */}
              <div className="glass-card p-6 rounded-2xl border-t border-emerald-500/20 relative">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-medium text-slate-400 uppercase tracking-widest">Player 2</h3>
                  <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]"></div>
                </div>
                
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search Player 2..."
                    value={search2}
                    onChange={(e) => setSearch2(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  {search2 && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                      {filteredSearch2.map(p => (
                        <button 
                          key={p.Player}
                          onClick={() => { setPlayer2(p); setSearch2(""); }}
                          className="w-full text-left px-4 py-3 hover:bg-slate-700 flex justify-between items-center transition-colors"
                        >
                          <span className="font-medium">{p.Player}</span>
                          <span className="text-xs text-slate-400">{p.Team}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {player2 && (
                  <div className="mt-6 flex flex-col gap-2 text-right">
                    <h2 className="text-3xl font-bold text-white">{player2.Player}</h2>
                    <p className="text-emerald-400 font-medium">{player2.Pos} • {player2.Team}</p>
                    <div className="mt-2 text-sm text-slate-300 border border-slate-700/50 bg-slate-800/30 rounded-lg p-3 text-left">
                       <span className="block text-xs uppercase text-slate-500 mb-1 text-right">AI Profile</span>
                      <span className="font-semibold block text-right" style={{color: CLUSTER_COLORS[player2.Cluster]}}>{player2.Player_Profile}</span>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Radar Chart */}
            <div className="glass-card rounded-3xl p-6 md:p-10 border-t border-slate-700/50">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">Head to Head Performance</h3>
                <p className="text-slate-400 mt-2 text-sm">Metrics shown as Percentiles (0-100) relative to all PL outfield players</p>
              </div>

              <div className="h-[450px] md:h-[550px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 500 }} 
                    />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{fill: '#475569'}} tickCount={6} />
                    
                    {player1 && (
                      <Radar
                        name={player1.Player}
                        dataKey="Player1"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        fill="#3b82f6"
                        fillOpacity={0.4}
                      />
                    )}
                    {player2 && (
                      <Radar
                        name={player2.Player}
                        dataKey="Player2"
                        stroke="#10b981"
                        strokeWidth={3}
                        fill="#10b981"
                        fillOpacity={0.4}
                      />
                    )}
                    <Tooltip 
                      isAnimationActive={false}
                      contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: '#475569', borderRadius: '12px', color: '#f8fafc' }}
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}
>>>>>>> 93182cd172ab93e27438acf09d196d968b61cd33

      </main >
    </motion.div >
  );
}
