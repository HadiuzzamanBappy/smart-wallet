import React, { useState } from 'react';
import {
  ShieldCheck,
  Cpu,
  Activity,
  Key,
  Leaf,
  Compass
} from 'lucide-react';
import MagicalForestScene from '../components/Entry/MagicalForestScene';

const EntryPoint = ({ onGetStarted }) => {
  const [isScanning, setIsScanning] = useState(false);

  const handleAccessVault = () => {
    setIsScanning(true);
    setTimeout(() => {
      onGetStarted?.();
    }, 1500);
  };

  const securityFeatures = [
    {
      title: "BRASS-FORGED LEDGER",
      desc: "Encrypted nodes clad in heavy brass.",
      icon: ShieldCheck,
      color: "text-amber-500"
    },
    {
      title: "CLOCKWORK ALLOCATION",
      desc: "Mechanical precision for salary breakdown.",
      icon: Cpu,
      color: "text-orange-400"
    },
    {
      title: "EMERALD TELEMETRY",
      desc: "Green-light expense tracking intelligence.",
      icon: Activity,
      color: "text-emerald-500"
    }
  ];

  return (
    <div className="min-h-screen w-full bg-stone-950 font-sans relative overflow-hidden flex flex-col items-center justify-center p-4 sm:p-8 select-none">

      {/* --- SOOTHING NATURE ATMOSPHERE BACKGROUND WITH WATERMARK IMAGE --- */}
      <div
        className="absolute inset-0 bg-stone-950 pointer-events-none z-0"
      />
      <div
        className="absolute inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-screen"
        style={{ backgroundImage: "url('/img/forest-bg.png')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-950/60 to-stone-950 pointer-events-none z-0" />

      {/* WebGL 3D Forest Scene (Wire trees, 3D leaves, sparkles) */}
      <MagicalForestScene />

      {/* Warm sunlight filtering from the top left */}
      <div className="absolute -top-40 -left-40 w-[800px] h-[800px] bg-amber-500/20 rounded-full blur-[120px] pointer-events-none z-0 mix-blend-screen" />

      {/* Subtle organic texture noise */}
      <div className="absolute inset-0 bg-cyber-grid opacity-10 pointer-events-none mix-blend-overlay z-0" />

      {/* --- CENTRAL HOBBIT-HOLE VAULT DOOR --- */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-4xl mx-auto space-y-12">

        {/* Elegant Title */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3 text-emerald-500/60 mb-2">
            <div className="w-12 h-px bg-gradient-to-r from-transparent to-emerald-500/60" />
            <Leaf className="w-4 h-4" />
            <div className="w-12 h-px bg-gradient-to-l from-transparent to-emerald-500/60" />
          </div>
        </div>

        {/* The Massive Round Door Container */}
        <div className="relative flex items-center justify-center w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96">

          {/* Organic Wood/Stone Door Frame (Deep Greenish color matching left and right trees, brightened) */}
          <div className="absolute inset-[-24px] rounded-full shadow-[0_30px_60px_rgba(0,0,0,0.8)] z-0 bg-gradient-to-r from-[#4f612a] via-[#2a4532] to-[#163022] flex items-center justify-center">
            {/* Inner texture rings */}
            <div className="absolute inset-0 rounded-full border-4 border-black/30 mix-blend-multiply pointer-events-none" />
            <div className="absolute inset-[12px] rounded-full border-[4px] border-black/20 shadow-[inset_0_0_15px_rgba(0,0,0,0.5)] pointer-events-none" />
            <div className="absolute inset-[24px] rounded-full shadow-[0_0_30px_rgba(0,0,0,0.8)] pointer-events-none" />
          </div>

          {/* The Natural Wooden Door Itself (Brown oak/pine) */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 shadow-[inset_0_0_40px_rgba(0,0,0,0.6)] border-[4px] border-emerald-950 overflow-hidden flex items-center justify-center z-10">
            
            {/* Greenish Forest Vibe / Moss Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tl from-emerald-900/50 via-green-700/20 to-transparent pointer-events-none mix-blend-overlay" />
            <div className="absolute inset-0 bg-emerald-900/10 pointer-events-none" />

            {/* Vertical "Wood Planks" styling (prominent dark lines for natural wood) */}
            <div className="absolute inset-0 flex justify-between px-[10%] opacity-30 pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="w-px h-full bg-amber-950 shadow-[1px_0_0_rgba(255,255,255,0.1)]" />
              ))}
            </div>

            {/* Door Watermark Crest / Sigil */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none mix-blend-multiply">
              <div className="absolute w-64 h-64 border-[16px] border-amber-950 rounded-full border-dashed" />
              <div className="absolute w-48 h-48 border-[4px] border-amber-950 rounded-full" />
              <div className="absolute w-72 h-72 rotate-45 border-x-[8px] border-amber-950" />
              <div className="absolute w-72 h-72 -rotate-45 border-x-[8px] border-amber-950" />
              <div className="absolute w-56 h-56 border-[8px] border-amber-950 rounded-full" />
              <div className="flex gap-4 text-amber-950">
                <Compass size={120} />
                <Leaf size={120} />
              </div>
            </div>

            {/* Subtle Lighting Hit (Tinted Greenish-Gold) */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,rgba(167,243,208,0.15)_0%,transparent_60%)] pointer-events-none" />

            {/* Central Wooden Ring / Knob */}
            <button
              onClick={handleAccessVault}
              disabled={isScanning}
              className={`relative z-20 w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-amber-700 via-amber-800 to-amber-950 border-[6px] border-amber-900/80 shadow-[0_8px_20px_rgba(0,0,0,0.6),inset_0_4px_10px_rgba(255,255,255,0.2)] flex items-center justify-center transition-all duration-300 group ${isScanning ? 'scale-95 shadow-[0_2px_10px_rgba(0,0,0,0.8)]' : 'hover:scale-105 active:scale-95'}`}
            >
              <div className="absolute inset-2 rounded-full border-4 border-amber-950/40" />
              <div className="flex flex-col items-center justify-center text-amber-100">
                <Key className={`w-8 h-8 sm:w-10 sm:h-10 mb-1 ${isScanning ? 'animate-bounce text-white' : 'text-amber-200 drop-shadow-sm'}`} />
                <span className="text-[10px] sm:text-xs font-bold tracking-widest opacity-80 uppercase">{isScanning ? 'Opening...' : 'Unlock'}</span>
              </div>
            </button>
            <div className="absolute left-[-5px] top-1/4 w-12 h-3 bg-stone-900 rounded-r shadow-[0_2px_5px_rgba(0,0,0,0.5)]" />
            <div className="absolute left-[-5px] bottom-1/4 w-12 h-3 bg-stone-900 rounded-r shadow-[0_2px_5px_rgba(0,0,0,0.5)]" />
          </div>
        </div>

        {/* --- BOTTOM ROW: MINIMAL FEATURES --- */}
        <div className="w-full max-w-4xl px-4 z-10 pt-4">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
            {securityFeatures.map((feat, index) => {
              const Icon = feat.icon;
              return (
                <div key={index} className="flex items-center gap-3 group">
                  <div className={`p-2 rounded-full bg-stone-900 border border-stone-800 shadow-inner ${feat.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold tracking-widest text-stone-200 uppercase">
                      {feat.title}
                    </h3>
                    <p className="text-[10px] text-stone-500 font-medium max-w-[150px]">
                      {feat.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};

export default EntryPoint;
