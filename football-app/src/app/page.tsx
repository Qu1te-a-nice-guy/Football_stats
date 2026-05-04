"use client";

import { useState, useEffect } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Activity, Users, Shield } from "lucide-react";

// Types
type Player = {
  Player: string;
  Nation: string;
  Pos: string;
  Age: number;
  Team: string;
  Min: number;
  Cluster: number;
  Perfil_do_Jogador: string;
  PCA1: number;
  PCA2: number;
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
];

export default function Home() {
  const [data, setData] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"clusters" | "compare">("clusters");
  
  // Cluster Map State
  const [clusterSearch, setClusterSearch] = useState("");
  const [searchedPlayer, setSearchedPlayer] = useState<Player | null>(null);
  const [activeClusters, setActiveClusters] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

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

  // Group data by cluster for scatter plot
  const clusterData = [0, 1, 2, 3, 4, 5, 6].map(clusterId => {
    if (!activeClusters.includes(clusterId)) return [];
    return data.filter(p => p.Cluster === clusterId);
  });
  
  // Extract unique profiles mapping properly sorted by cluster ID (0 to 5)
  const profileNames = [0, 1, 2, 3, 4, 5, 6].map(id => {
    const match = data.find(d => d.Cluster === id);
    return match ? match.Perfil_do_Jogador : `Cluster ${id}`;
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
      const p1Val = player1 ? (player1 as any)[m.key + "_percentile"] : 0;
      const p2Val = player2 ? (player2 as any)[m.key + "_percentile"] : 0;
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
    <div className="min-h-screen text-slate-50 p-6 sm:p-12 font-sans selection:bg-blue-500/30">
      
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-12 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400">
            Premier League Analytics
          </h1>
          <p className="mt-2 text-slate-400 text-lg">Next-gen player profiling and scouting (23/24)</p>
        </div>
        
        <div className="glass-card p-1 rounded-xl flex gap-1">
          <button 
            onClick={() => setActiveTab("clusters")}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${activeTab === 'clusters' ? 'bg-blue-500/20 text-blue-400 shadow-[inset_0_0_20px_rgba(59,130,246,0.1)] border border-blue-500/30' : 'text-slate-400 hover:text-white'}`}
          >
            <Users size={18} /> Cluster Map
          </button>
          <button 
            onClick={() => setActiveTab("compare")}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${activeTab === 'compare' ? 'bg-indigo-500/20 text-indigo-400 shadow-[inset_0_0_20px_rgba(99,102,241,0.1)] border border-indigo-500/30' : 'text-slate-400 hover:text-white'}`}
          >
            <Shield size={18} /> Compare
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        
        {/* --- CLUSTER MAP TAB --- */}
        {activeTab === "clusters" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
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
                        <button 
                          key={i} 
                          onClick={() => toggleCluster(i)}
                          className={`w-full flex items-start gap-3 p-3 rounded-lg border transition-all ${
                            isActive 
                              ? 'bg-slate-800/80 border-slate-600 shadow-[0_0_10px_rgba(255,255,255,0.05)]' 
                              : 'bg-slate-800/30 border-slate-700/30 opacity-40 hover:opacity-80'
                          }`}
                        >
                          <div className={`w-3 h-3 rounded-full mt-1.5 transition-all ${isActive ? 'shadow-[0_0_8px_currentColor]' : ''}`} style={{ backgroundColor: CLUSTER_COLORS[i], color: CLUSTER_COLORS[i] }}></div>
                          <span className={`text-sm font-medium text-left ${isActive ? 'text-slate-200' : 'text-slate-400'}`}>{name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Chart Area */}
              <div className="col-span-1 lg:col-span-3 flex flex-col gap-4">
                
                {/* Cluster Search */}
                <div className="glass-card p-4 rounded-2xl border-t border-slate-700/50 relative z-20">
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Locate a player on the map..."
                      value={clusterSearch}
                      onChange={(e) => setClusterSearch(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
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
                    <div className="mt-3 flex justify-between items-center bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                      <div>
                        <span className="text-xs text-slate-400 block">Located Player</span>
                        <span className="font-bold text-white flex items-center gap-2">
                          <span className="text-yellow-400 text-lg">★</span> {searchedPlayer.Player}
                        </span>
                      </div>
                      <button onClick={() => setSearchedPlayer(null)} className="text-slate-400 hover:text-white px-3 py-1 bg-slate-700 rounded hover:bg-slate-600 transition-colors text-sm">
                        Clear
                      </button>
                    </div>
                  )}
                </div>

                <div className="glass-card p-6 rounded-2xl h-[500px] lg:h-[600px] flex flex-col relative overflow-hidden group border-t border-slate-700/50 z-10">
                  
                  <div className="absolute top-4 left-6 z-10 pointer-events-none">
                    <h3 className="text-xl font-bold text-white/90">Playstyle Distribution</h3>
                    <p className="text-slate-400 text-sm">PCA Dimension Reduction</p>
                  </div>
                  
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
                                    <span className="font-semibold" style={{color: CLUSTER_COLORS[data.Cluster]}}>{data.Perfil_do_Jogador}</span>
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

                      {/* Searched Player Highlight Layer */}
                      {searchedPlayer && (
                        <Scatter 
                          data={[searchedPlayer]} 
                          shape={(props: any) => {
                            const { cx, cy } = props;
                            return (
                              <svg x={cx - 15} y={cy - 15} width={30} height={30} viewBox="0 0 1024 1024">
                                <path d="M512 0l158 320 354 51-256 250 60 353-316-166-316 166 60-353-256-250 354-51z" fill="#facc15" stroke="#ffffff" strokeWidth="30"/>
                              </svg>
                            );
                          }}
                        />
                      )}
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

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
                      <span className="font-semibold" style={{color: CLUSTER_COLORS[player1.Cluster]}}>{player1.Perfil_do_Jogador}</span>
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
                      <span className="font-semibold block text-right" style={{color: CLUSTER_COLORS[player2.Cluster]}}>{player2.Perfil_do_Jogador}</span>
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

      </main>
    </div>
  );
}
