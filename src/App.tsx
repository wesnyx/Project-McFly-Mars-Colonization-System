import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  Battery, 
  Droplets, 
  Flame, 
  Home, 
  Info, 
  Layers, 
  MessageSquare, 
  Navigation, 
  Settings, 
  Shield, 
  Thermometer, 
  Users, 
  Wind,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Cpu,
  Globe,
  AlertTriangle,
  Send,
  Camera,
  Maximize2,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { GoogleGenAI } from "@google/genai";
import { cn } from './lib/utils';
import { Resource, ISRUModule, HabitatZone } from './types';
import { 
  INITIAL_RESOURCES, 
  INITIAL_ISRU_MODULES, 
  INITIAL_HABITAT_ZONES,
  MARS_CONSTANTS 
} from './constants';
import { translations, Language } from './translations';

// --- Camera Feed Component ---
const CameraFeed = ({ title, id, imageUrl, status = 'active', onRefresh, lang }: { title: string, id: string, imageUrl: string | null, status?: string, onRefresh: () => void, lang: Language }) => {
  const [timestamp, setTimestamp] = useState(new Date().toISOString());
  const t = translations[lang].dashboard.cams;

  useEffect(() => {
    const interval = setInterval(() => {
      setTimestamp(new Date().toISOString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="camera-container aspect-video group relative">
      <div className="camera-overlay" />
      <div className="camera-noise" />
      <div className="camera-scanline" />
      
      {imageUrl ? (
        <motion.img 
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          src={imageUrl} 
          alt={title}
          className="w-full h-full object-cover camera-glitch"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-black/40 gap-4">
          <RefreshCw className="w-8 h-8 text-mars-accent animate-spin" />
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{t.uplink}</span>
        </div>
      )}

      {/* Camera UI Overlay */}
      <div className="absolute inset-0 p-4 flex flex-col justify-between z-40 pointer-events-none">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-mono text-white/80 uppercase tracking-tighter">REC</span>
            <span className="text-[10px] font-mono text-white/50 ml-2">CAM-{id}</span>
          </div>
          <div className="text-[10px] font-mono text-white/50">{timestamp}</div>
        </div>
        
        <div className="flex justify-between items-end">
          <div>
            <div className="text-xs font-mono text-white font-bold uppercase tracking-widest">{title}</div>
            <div className="text-[8px] font-mono text-mars-accent uppercase mt-1">{t.status}: {status === 'active' ? 'ACTIVE' : status}</div>
          </div>
          <div className="flex gap-2 pointer-events-auto">
            <button 
              onClick={onRefresh}
              className="p-1.5 bg-black/40 hover:bg-mars-accent/40 rounded border border-white/10 transition-colors"
            >
              <RefreshCw className="w-3 h-3 text-white" />
            </button>
            <button className="p-1.5 bg-black/40 hover:bg-mars-accent/40 rounded border border-white/10 transition-colors">
              <Maximize2 className="w-3 h-3 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Corner Brackets */}
      <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-white/40 z-40" />
      <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-white/40 z-40" />
      <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-white/40 z-40" />
      <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-white/40 z-40" />
    </div>
  );
};

// --- Mock Data for Charts ---
const RESOURCE_HISTORY = Array.from({ length: 20 }, (_, i) => ({
  time: `${i}:00`,
  o2: 80 + Math.random() * 10,
  h2o: 40 + Math.random() * 5,
  pwr: 90 + Math.random() * 8,
  food: 10 + Math.random() * 2,
}));

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const t = translations[lang];

  const [resources, setResources] = useState<Resource[]>(INITIAL_RESOURCES);
  const [isruModules, setIsruModules] = useState<ISRUModule[]>(INITIAL_ISRU_MODULES);
  const [habitatZones, setHabitatZones] = useState<HabitatZone[]>(INITIAL_HABITAT_ZONES);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'isru' | 'habitat' | 'ai'>('dashboard');
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [selectedZone, setSelectedZone] = useState<HabitatZone | null>(null);
  const [cameraFeeds, setCameraFeeds] = useState<Record<string, string | null>>({
    '01': null,
    '02': null,
    '03': null,
    '04': null,
  });

  const [isBalancing, setIsBalancing] = useState(false);
  const [balanceSuccess, setBalanceSuccess] = useState(false);

  const balanceResources = () => {
    setIsBalancing(true);
    // Simulate system processing
    setTimeout(() => {
      setResources(prev => prev.map(res => {
        if (res.trend === 'down' || res.status === 'critical' || res.status === 'warning') {
          const newValue = Math.min(res.max, res.value + 15);
          return {
            ...res,
            value: newValue,
            trend: 'stable' as const,
            status: newValue > 50 ? 'optimal' as const : (newValue > 20 ? 'warning' as const : 'critical' as const)
          };
        }
        return res;
      }));
      setIsBalancing(false);
      setBalanceSuccess(true);
      setTimeout(() => setBalanceSuccess(false), 3000);
    }, 1500);
  };

  const generateCameraFeed = async (id: string, prompt: string) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }],
        },
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          setCameraFeeds(prev => ({ ...prev, [id]: imageUrl }));
          return;
        }
      }
    } catch (error) {
      console.error(`Error generating camera feed ${id}:`, error);
      // Fallback to picsum if Gemini fails
      setCameraFeeds(prev => ({ ...prev, [id]: `https://picsum.photos/seed/mars-cam-${id}/800/450?blur=1` }));
    }
  };

  useEffect(() => {
    const prompts: Record<string, string> = {
      '01': translations[lang].dashboard.cams.ext + " Cinematic wide shot of a Mars colony with futuristic regolith domes, red dusty landscape, realistic lighting, high detail, 4k, surveillance camera perspective, slightly grainy.",
      '02': translations[lang].dashboard.cams.int + " Interior corridor of a Mars habitat, futuristic metal walls, emergency red lights flickering, heavy blast doors closing, realistic, surveillance camera perspective, high contrast.",
      '03': translations[lang].dashboard.cams.isru + " Close up of a complex Mars ISRU (In-Situ Resource Utilization) machinery, pipes, tanks, glowing indicators, red dust on surfaces, realistic, surveillance camera perspective.",
      '04': translations[lang].dashboard.cams.hangar + " Mars landing pad area for Ingenuity helicopter, flat dusty ground with markings, distant hills, realistic, surveillance camera perspective, wide angle.",
    };

    Object.entries(prompts).forEach(([id, prompt]) => {
      if (!cameraFeeds[id]) {
        generateCameraFeed(id, prompt);
      }
    });
  }, [lang]);

  const addIsruModule = () => {
    const types: ('regolith' | 'atmosphere' | 'ice')[] = ['regolith', 'atmosphere', 'ice'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    const newModule: ISRUModule = {
      id: `module-${Date.now()}`,
      name: `${randomType.toUpperCase()}-${Math.floor(Math.random() * 100)}`,
      type: randomType,
      efficiency: 0.7 + Math.random() * 0.25,
      powerConsumption: 10 + Math.random() * 30,
      outputRate: 1 + Math.random() * 5,
      status: 'active'
    };
    setIsruModules(prev => [...prev, newModule]);
  };

  const repairZone = (id: string) => {
    setHabitatZones(prev => prev.map(z => 
      z.id === id ? { ...z, integrity: Math.min(100, z.integrity + 5) } : z
    ));
  };

  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
    { role: 'ai', text: translations[lang].ai.init }
  ]);

  useEffect(() => {
    // Update initial message when language changes if no other messages exist
    if (chatMessages.length === 1) {
      setChatMessages([{ role: 'ai', text: translations[lang].ai.init }]);
    }
  }, [lang]);

  const [userInput, setUserInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    const userMsg = userInput;
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setUserInput("");
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userMsg,
        config: {
          systemInstruction: translations[lang].ai.systemInstruction
        }
      });

      setChatMessages(prev => [...prev, { role: 'ai', text: response.text || translations[lang].ai.delay }]);
    } catch (error) {
      console.error("Gemini Error:", error);
      setChatMessages(prev => [...prev, { role: 'ai', text: translations[lang].ai.error }]);
    } finally {
      setIsTyping(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal': return 'status-optimal';
      case 'warning': return 'status-warning';
      case 'critical': return 'status-critical';
      default: return 'bg-gray-500';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUpRight className="w-4 h-4 text-green-500" />;
      case 'down': return <ArrowDownRight className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-mars-dark">
      {/* Sidebar */}
      <aside className="w-20 lg:w-64 bg-mars-surface border-r border-white/10 flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-mars-accent rounded-lg flex items-center justify-center mars-glow">
            <Globe className="text-white w-6 h-6" />
          </div>
          <h1 className="hidden lg:block text-lg font-bold text-white tracking-tighter">ARES CONTROL</h1>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {[
            { id: 'dashboard', icon: Activity, label: t.sidebar.dashboard },
            { id: 'isru', icon: Cpu, label: t.sidebar.isru },
            { id: 'habitat', icon: Home, label: t.sidebar.habitat },
            { id: 'ai', icon: MessageSquare, label: t.sidebar.ai },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={cn(
                "w-full flex items-center gap-4 p-3 rounded-lg transition-all",
                activeTab === item.id 
                  ? "bg-mars-accent text-white mars-glow" 
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className="w-6 h-6" />
              <span className="hidden lg:block font-mono text-sm uppercase">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-4">
          <button 
            onClick={() => setLang(lang === 'en' ? 'tr' : 'en')}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 text-gray-400 hover:text-white transition-colors border border-white/10"
          >
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span className="hidden lg:block text-xs font-medium">{lang === 'en' ? 'English' : 'Türkçe'}</span>
            </div>
            <span className="text-[10px] font-mono bg-mars-accent/20 text-mars-accent px-1.5 py-0.5 rounded uppercase">
              {lang === 'en' ? 'TR' : 'EN'}
            </span>
          </button>

          <div>
            <div className="hidden lg:block text-[10px] text-gray-500 font-mono uppercase mb-2">{t.sidebar.status}</div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-gray-500">TEMP</span>
                <span className="text-mars-accent">{MARS_CONSTANTS.AVG_TEMP}°C</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-gray-500">GRAV</span>
                <span className="text-mars-accent">{MARS_CONSTANTS.GRAVITY}m/s²</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-10">
        <header className="mb-10 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-mars-accent mb-1 tracking-widest uppercase">{t.sidebar.status}: {t.header.safe}</div>
            <h2 className="text-4xl font-bold text-white tracking-tighter">
              {activeTab === 'dashboard' && t.sidebar.dashboard}
              {activeTab === 'isru' && t.sidebar.isru}
              {activeTab === 'habitat' && t.sidebar.habitat}
              {activeTab === 'ai' && t.sidebar.ai}
            </h2>
          </div>
          <div className="flex items-center gap-4 bg-mars-surface/50 border border-white/5 p-2 rounded-lg px-4">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-gray-500 font-mono">SOL TIME</span>
              <span className="text-sm font-mono text-white">SOL {MARS_CONSTANTS.currentSol} | 14:22:05</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-gray-500 font-mono">NETWORK</span>
              <span className="text-sm font-mono text-green-500">CONNECTED</span>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Surveillance Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-mono text-white flex items-center gap-2">
                    <Camera className="w-5 h-5 text-mars-accent" />
                    {t.dashboard.surveillance}
                  </h3>
                  <div className="text-[10px] font-mono text-gray-500 uppercase">Signal Latency: 4.2m</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <CameraFeed 
                    id="01" 
                    title={t.dashboard.cams.ext} 
                    imageUrl={cameraFeeds['01']} 
                    onRefresh={() => {
                      setCameraFeeds(prev => ({ ...prev, '01': null }));
                      generateCameraFeed('01', t.dashboard.cams.ext + " Cinematic wide shot of a Mars colony...");
                    }}
                    lang={lang}
                  />
                  <CameraFeed 
                    id="02" 
                    title={t.dashboard.cams.int} 
                    imageUrl={cameraFeeds['02']} 
                    status="FAIL-SAFE ACTIVE"
                    onRefresh={() => {
                      setCameraFeeds(prev => ({ ...prev, '02': null }));
                      generateCameraFeed('02', t.dashboard.cams.int + " Interior corridor of a Mars habitat...");
                    }}
                    lang={lang}
                  />
                  <CameraFeed 
                    id="03" 
                    title={t.dashboard.cams.isru} 
                    imageUrl={cameraFeeds['03']} 
                    onRefresh={() => {
                      setCameraFeeds(prev => ({ ...prev, '03': null }));
                      generateCameraFeed('03', t.dashboard.cams.isru + " Close up of a complex Mars ISRU...");
                    }}
                    lang={lang}
                  />
                  <CameraFeed 
                    id="04" 
                    title={t.dashboard.cams.hangar} 
                    imageUrl={cameraFeeds['04']} 
                    onRefresh={() => {
                      setCameraFeeds(prev => ({ ...prev, '04': null }));
                      generateCameraFeed('04', t.dashboard.cams.hangar + " Mars landing pad area...");
                    }}
                    lang={lang}
                  />
                </div>
              </div>

              {/* Resource Grid */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-mono text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-mars-accent" />
                    {t.sidebar.dashboard}
                  </h3>
                  <button
                    onClick={balanceResources}
                    disabled={isBalancing}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs uppercase transition-all border",
                      isBalancing 
                        ? "bg-white/5 border-white/10 text-gray-500 cursor-not-allowed"
                        : balanceSuccess
                          ? "bg-green-500/20 border-green-500/50 text-green-500 mars-glow"
                          : "bg-mars-accent/20 border-mars-accent/50 text-mars-accent hover:bg-mars-accent/30"
                    )}
                  >
                    {isBalancing ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        {t.dashboard.balancing}
                      </>
                    ) : balanceSuccess ? (
                      <>
                        <Shield className="w-3 h-3" />
                        {t.dashboard.balanced}
                      </>
                    ) : (
                      <>
                        <Zap className="w-3 h-3" />
                        {t.dashboard.balance}
                      </>
                    )}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {resources.map((res) => {
                  const resourceNames: Record<string, string> = {
                    'Oxygen': t.dashboard.resources.o2,
                    'Water': t.dashboard.resources.h2o,
                    'Power': t.dashboard.resources.power,
                    'Food': t.dashboard.resources.food
                  };
                  return (
                    <div key={res.id} className="mars-card group hover:border-mars-accent/50 transition-colors">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-white/5 rounded-lg group-hover:bg-mars-accent/20 transition-colors">
                          {res.id === 'o2' && <Wind className="w-5 h-5 text-blue-400" />}
                          {res.id === 'h2o' && <Droplets className="w-5 h-5 text-cyan-400" />}
                          {res.id === 'pwr' && <Zap className="w-5 h-5 text-yellow-400" />}
                          {res.id === 'food' && <Flame className="w-5 h-5 text-orange-400" />}
                        </div>
                        <div className="flex items-center gap-1">
                          {getTrendIcon(res.trend)}
                          <span className={cn("status-indicator", getStatusColor(res.status))} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs font-mono text-gray-500 uppercase">{resourceNames[res.name] || res.name}</div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-white">{res.value}</span>
                          <span className="text-xs font-mono text-gray-500">{res.unit}</span>
                        </div>
                      </div>
                      <div className="mt-4 w-full bg-white/5 h-1 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(res.value / res.max) * 100}%` }}
                          className={cn(
                            "h-full rounded-full",
                            res.status === 'optimal' ? "bg-green-500" : res.status === 'warning' ? "bg-yellow-500" : "bg-red-500"
                          )}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

              {/* Main Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 mars-card h-[400px] flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-mono text-gray-400">{t.dashboard.production}</h3>
                    <div className="flex gap-4 text-[10px] font-mono">
                      <div className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded-full" /> O2</div>
                      <div className="flex items-center gap-1"><span className="w-2 h-2 bg-cyan-500 rounded-full" /> H2O</div>
                      <div className="flex items-center gap-1"><span className="w-2 h-2 bg-yellow-500 rounded-full" /> PWR</div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={RESOURCE_HISTORY}>
                        <defs>
                          <linearGradient id="colorO2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis dataKey="time" stroke="#ffffff30" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#ffffff30" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#2D2D2D', border: '1px solid #ffffff10', borderRadius: '8px' }}
                          itemStyle={{ fontSize: '12px', fontFamily: 'monospace' }}
                        />
                        <Area type="monotone" dataKey="o2" stroke="#3b82f6" fillOpacity={1} fill="url(#colorO2)" />
                        <Area type="monotone" dataKey="h2o" stroke="#06b6d4" fillOpacity={0} />
                        <Area type="monotone" dataKey="pwr" stroke="#eab308" fillOpacity={0} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="mars-card flex flex-col">
                  <h3 className="text-sm font-mono text-gray-400 mb-6 uppercase">{t.dashboard.alerts}</h3>
                  <div className="space-y-4 overflow-y-auto pr-2">
                    {(showAllLogs ? [
                      { type: 'warning', msg: t.dashboard.dust, time: '12m ago' },
                      { type: 'critical', msg: t.dashboard.leak, time: '45m ago' },
                      { type: 'info', msg: t.dashboard.isru_start, time: '2h ago' },
                      { type: 'warning', msg: 'Solar array efficiency at 78%', time: '4h ago' },
                      { type: 'info', msg: 'New ISRU module deployed', time: '5h ago' },
                      { type: 'warning', msg: 'Oxygen scrubbers need cleaning', time: '6h ago' },
                    ] : [
                      { type: 'warning', msg: t.dashboard.dust, time: '12m ago' },
                      { type: 'critical', msg: t.dashboard.leak, time: '45m ago' },
                      { type: 'info', msg: t.dashboard.isru_start, time: '2h ago' },
                      { type: 'warning', msg: 'Solar array efficiency at 78%', time: '4h ago' },
                    ]).map((alert, i) => (
                      <div key={i} className="flex gap-3 p-3 bg-white/5 rounded-lg border border-white/5">
                        <div className={cn(
                          "p-2 rounded-full h-fit",
                          alert.type === 'critical' ? "bg-red-500/20 text-red-500" : alert.type === 'warning' ? "bg-yellow-500/20 text-yellow-500" : "bg-blue-500/20 text-blue-500"
                        )}>
                          {alert.type === 'critical' ? <AlertTriangle className="w-4 h-4" /> : alert.type === 'warning' ? <Info className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="text-xs font-mono text-white">{alert.msg}</div>
                          <div className="text-[10px] font-mono text-gray-500 uppercase mt-1">{alert.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => setShowAllLogs(!showAllLogs)}
                    className="mt-auto w-full py-2 bg-white/5 hover:bg-white/10 text-xs font-mono uppercase text-gray-400 rounded-lg transition-colors"
                  >
                    {showAllLogs ? t.dashboard.hide_logs : t.dashboard.view_all}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'isru' && (
            <motion.div 
              key="isru"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              <div className="space-y-6">
                <h3 className="text-lg font-mono text-white mb-4">{t.isru.title}</h3>
                {isruModules.map((module) => (
                  <div key={module.id} className="mars-card flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-mars-accent/20 rounded-lg flex items-center justify-center">
                        <Cpu className="w-6 h-6 text-mars-accent" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white uppercase">{module.name}</div>
                        <div className="text-[10px] font-mono text-gray-500 uppercase">{t.isru.processing} ({module.type})</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <div className="text-[10px] font-mono text-gray-500 uppercase">{t.isru.efficiency}</div>
                        <div className="text-sm font-mono text-white">{(module.efficiency * 100).toFixed(0)}%</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-mono text-gray-500 uppercase">{t.isru.output}</div>
                        <div className="text-sm font-mono text-mars-accent">{module.outputRate} kg/h</div>
                      </div>
                      <div className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-mono uppercase",
                        module.status === 'active' ? "bg-green-500/20 text-green-500" : "bg-yellow-500/20 text-yellow-500"
                      )}>
                        {module.status === 'active' ? 'ACTIVE' : module.status}
                      </div>
                    </div>
                  </div>
                ))}
                <button 
                  onClick={addIsruModule}
                  className="w-full py-4 border-2 border-dashed border-white/10 rounded-lg text-gray-500 hover:text-white hover:border-white/20 transition-all font-mono uppercase text-sm"
                >
                  + {t.isru.deploy}
                </button>
              </div>

              <div className="mars-card flex flex-col">
                <h3 className="text-lg font-mono text-white mb-6">{t.isru.simulation}</h3>
                <div className="flex-1 bg-black/20 rounded-lg p-6 flex flex-col items-center justify-center text-center space-y-6">
                  <div className="relative w-48 h-48">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                      <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="552.92" strokeDashoffset={552.92 * (1 - 0.72)} className="text-mars-accent" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-bold text-white">72%</span>
                      <span className="text-[10px] font-mono text-gray-500 uppercase">{t.isru.total_cap}</span>
                    </div>
                  </div>
                  <div className="max-w-xs">
                    <p className="text-sm text-gray-400">{t.isru.desc}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 w-full">
                    <div className="p-4 bg-white/5 rounded-lg">
                      <div className="text-[10px] font-mono text-gray-500 uppercase mb-1">{t.isru.o2_cap}</div>
                      <div className="text-xl font-bold text-white">12.4 kg</div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg">
                      <div className="text-[10px] font-mono text-gray-500 uppercase mb-1">{t.isru.h2o_ext}</div>
                      <div className="text-xl font-bold text-white">8.2 L</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'habitat' && (
            <motion.div 
              key="habitat"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {habitatZones.map((zone) => {
                  const zoneNames: Record<string, string> = {
                    'Central Hub': t.habitat.zones.hub,
                    'Greenhouse Alpha': t.habitat.zones.greenhouse,
                    'Science Lab': t.habitat.zones.lab,
                    'Residential B': t.habitat.zones.res
                  };
                  return (
                    <div key={zone.id} className="mars-card space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="text-sm font-bold text-white uppercase">{zoneNames[zone.name] || zone.name}</div>
                        <div className={cn(
                          "px-2 py-0.5 rounded text-[8px] font-mono uppercase",
                          zone.type === 'residential' ? "bg-blue-500/20 text-blue-400" : 
                          zone.type === 'greenhouse' ? "bg-green-500/20 text-green-400" :
                          zone.type === 'laboratory' ? "bg-purple-500/20 text-purple-400" : "bg-red-500/20 text-red-400"
                        )}>
                          {zone.type}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-mono text-white">{zone.population}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Wind className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-mono text-white">{zone.oxygenLevel}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Thermometer className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-mono text-white">{zone.temperature}°C</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-mono text-white">{zone.integrity}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                        <div className="h-full bg-mars-accent" style={{ width: `${zone.integrity}%` }} />
                      </div>
                      <button 
                        onClick={() => repairZone(zone.id)}
                        className="w-full py-1 bg-white/5 hover:bg-mars-accent/20 text-[10px] font-mono uppercase text-gray-400 hover:text-white rounded transition-all"
                      >
                        {t.habitat.repair}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="mars-card h-[500px] relative overflow-hidden bg-black/40">
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Mock Habitat Layout Visualization */}
                  <div className="relative w-96 h-96">
                    <div className="absolute inset-0 border-2 border-white/5 rounded-full animate-[spin_60s_linear_infinite]" />
                    <div className="absolute inset-10 border border-white/5 rounded-full animate-[spin_40s_linear_infinite_reverse]" />
                    
                    {/* Central Hub */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-mars-accent rounded-full mars-glow flex items-center justify-center z-10">
                      <Home className="text-white w-8 h-8" />
                    </div>

                    {/* Zones */}
                    {[
                      { top: '10%', left: '50%', icon: Flame, color: 'text-red-500' },
                      { top: '50%', left: '90%', icon: Droplets, color: 'text-cyan-500' },
                      { top: '90%', left: '50%', icon: Zap, color: 'text-yellow-500' },
                      { top: '50%', left: '10%', icon: Users, color: 'text-blue-500' },
                    ].map((pos, i) => (
                      <div 
                        key={i} 
                        className="absolute -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-mars-surface border border-white/10 rounded-lg flex items-center justify-center hover:border-mars-accent transition-colors cursor-pointer"
                        style={{ top: pos.top, left: pos.left }}
                      >
                        <pos.icon className={cn("w-6 h-6", pos.color)} />
                      </div>
                    ))}

                    {/* Connector Lines */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      <line x1="50%" y1="50%" x2="50%" y2="10%" stroke="white" strokeOpacity="0.1" strokeDasharray="4" />
                      <line x1="50%" y1="50%" x2="90%" y2="50%" stroke="white" strokeOpacity="0.1" strokeDasharray="4" />
                      <line x1="50%" y1="50%" x2="50%" y2="90%" stroke="white" strokeOpacity="0.1" strokeDasharray="4" />
                      <line x1="50%" y1="50%" x2="10%" y2="50%" stroke="white" strokeOpacity="0.1" strokeDasharray="4" />
                    </svg>
                  </div>
                </div>
                <div className="absolute bottom-6 left-6">
                  <h3 className="text-sm font-mono text-white uppercase">{t.habitat.map}</h3>
                  <p className="text-xs text-gray-500 font-mono">{t.habitat.monitoring}</p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'ai' && (
            <motion.div 
              key="ai"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-[calc(100vh-250px)] flex flex-col mars-card"
            >
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={cn(
                    "flex flex-col max-w-[80%]",
                    msg.role === 'user' ? "ml-auto items-end" : "items-start"
                  )}>
                    <div className={cn(
                      "px-4 py-3 rounded-2xl text-sm font-sans",
                      msg.role === 'user' 
                        ? "bg-mars-accent text-white rounded-tr-none" 
                        : "bg-white/5 text-gray-200 rounded-tl-none border border-white/5"
                    )}>
                      {msg.text}
                    </div>
                    <span className="text-[10px] font-mono text-gray-500 uppercase mt-1">
                      {msg.role === 'user' ? t.ai.user : t.ai.ares}
                    </span>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex items-center gap-2 text-gray-500 font-mono text-xs">
                    <div className="flex gap-1">
                      <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" />
                      <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                    {t.ai.typing}
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="p-6 border-t border-white/10 flex gap-4">
                <input 
                  type="text" 
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={t.ai.placeholder}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm font-sans focus:outline-none focus:border-mars-accent transition-colors"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={isTyping || !userInput.trim()}
                  className="bg-mars-accent hover:bg-mars-accent/80 disabled:opacity-50 text-white p-3 rounded-lg transition-all mars-glow"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
