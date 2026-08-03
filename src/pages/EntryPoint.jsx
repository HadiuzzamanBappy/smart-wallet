import React, { useState } from 'react';
import {
  ShieldCheck,
  Cpu,
  Activity,
  Key,
  Leaf,
  Compass
} from 'lucide-react';
import VaultAuth from '../components/Entry/VaultAuth';
import MagicalForestScene from '../components/Entry/MagicalForestScene';
import Tooltip from '../components/UI/base/Tooltip';

const EntryPoint = () => {
  const [doorState, setDoorState] = useState('closed'); // 'closed', 'opening', 'open'

  const handleAccessVault = () => {
    setDoorState('opening');
    setTimeout(() => {
      setDoorState('open');
    }, 2000); // 2 second cinematic zoom/swing animation
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

  const DoorGraphic = () => (
    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 shadow-[inset_0_0_40px_rgba(0,0,0,0.6)] border-[4px] border-emerald-950 overflow-hidden flex items-center justify-center pointer-events-none">
      {/* Greenish Forest Vibe / Moss Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tl from-emerald-900/50 via-green-700/20 to-transparent pointer-events-none mix-blend-overlay" />
      <div className="absolute inset-0 bg-emerald-900/10 pointer-events-none" />

      {/* Vertical "Wood Planks" styling */}
      <div className="absolute inset-0 flex justify-between px-[10%] opacity-30 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="w-px h-full bg-amber-950 shadow-[1px_0_0_rgba(255,255,255,0.1)]" />
        ))}
      </div>

      {/* Realistic Central Split Seam Bevels */}
      {/* Left Door Edge Bevel */}
      <div className="absolute top-0 right-1/2 w-3 h-full bg-gradient-to-r from-transparent to-black/80 pointer-events-none z-10" />
      <div className="absolute top-0 right-1/2 w-[1px] h-full bg-amber-400/30 pointer-events-none z-10" />
      
      {/* Right Door Edge Bevel */}
      <div className="absolute top-0 left-1/2 w-3 h-full bg-gradient-to-l from-transparent to-black/80 pointer-events-none z-10" />
      <div className="absolute top-0 left-1/2 w-[1px] h-full bg-black/90 pointer-events-none z-10" />

      {/* Door Watermark Crest / Sigil */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none mix-blend-multiply z-20">
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

      {/* Subtle Lighting Hit */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,rgba(167,243,208,0.15)_0%,transparent_60%)] pointer-events-none z-30" />

      {/* Left and Right Hinges */}
      <div className="absolute left-[-5px] top-1/4 w-12 h-3 bg-stone-900 rounded-r shadow-[0_2px_5px_rgba(0,0,0,0.5)] z-40" />
      <div className="absolute left-[-5px] bottom-1/4 w-12 h-3 bg-stone-900 rounded-r shadow-[0_2px_5px_rgba(0,0,0,0.5)] z-40" />
      <div className="absolute right-[-5px] top-1/4 w-12 h-3 bg-stone-900 rounded-l shadow-[0_2px_5px_rgba(0,0,0,0.5)] z-40" />
      <div className="absolute right-[-5px] bottom-1/4 w-12 h-3 bg-stone-900 rounded-l shadow-[0_2px_5px_rgba(0,0,0,0.5)] z-40" />
    </div>
  );

  return (
    <div className="dark min-h-screen w-full bg-stone-950 font-sans relative overflow-hidden flex flex-col items-center justify-center p-4 sm:p-8 select-none">

      {/* --- SOOTHING NATURE ATMOSPHERE BACKGROUND WITH WATERMARK IMAGE --- */}
      <div className="absolute inset-0 bg-stone-950 pointer-events-none z-0" />
      <div
        className={`absolute inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat opacity-[0.15] dark:opacity-40 blur-xl dark:blur-none grayscale dark:grayscale-0 mix-blend-luminosity dark:mix-blend-screen transition-opacity duration-[2000ms] ${doorState !== 'closed' ? 'opacity-0' : ''}`}
        style={{ backgroundImage: "url('/img/forest-bg.png')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/10 dark:via-emerald-950/60 to-stone-50 dark:to-stone-950 pointer-events-none z-0" />

      {/* WebGL 3D Forest Scene (Wire trees, 3D leaves, sparkles) */}
      <MagicalForestScene />

      {/* Warm sunlight filtering from the top left */}
      <div className={`absolute -top-40 -left-40 w-[800px] h-[800px] bg-amber-500/20 rounded-full blur-[120px] pointer-events-none z-0 mix-blend-screen transition-opacity duration-[2000ms] ${doorState !== 'closed' ? 'opacity-0' : ''}`} />

      {/* Subtle organic texture noise */}
      <div className="absolute inset-0 bg-cyber-grid opacity-10 pointer-events-none mix-blend-overlay z-0" />

        {/* --- CENTRAL HOBBIT-HOLE VAULT DOOR --- */}
        <div className={`relative z-10 flex items-center justify-center transition-all ease-in-out will-change-transform ${doorState !== 'closed' ? 'duration-[3000ms] scale-[1.05] sm:scale-[1.1] md:scale-[1.15]' : 'duration-[2000ms] scale-[0.8] sm:scale-[0.9]'}`}>

          {/* Elegant Title */}
          <div className={`absolute bottom-[100%] mb-10 w-[100vw] left-1/2 -translate-x-1/2 flex flex-col items-center justify-center transition-all duration-1000 ${doorState !== 'closed' ? 'opacity-0 pointer-events-none -translate-y-8' : 'opacity-100 translate-y-0'}`}>
            <div className="flex items-center justify-center gap-3 text-emerald-500/60 mb-2">
              <div className="w-12 h-px bg-gradient-to-r from-transparent to-emerald-500/60" />
              <Leaf className="w-4 h-4" />
              <div className="w-12 h-px bg-gradient-to-l from-transparent to-emerald-500/60" />
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-b from-amber-400 via-amber-200 to-amber-600 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] uppercase">
              Access Vault
            </h1>
          </div>

          {/* The Massive Round Door Container (with Perspective for 3D swing) */}
          <div className="relative flex items-center justify-center w-[26rem] h-[26rem] sm:w-[30rem] sm:h-[30rem] md:w-[36rem] md:h-[36rem] [perspective:2000px]">

            {/* Organic Wood/Stone Door Frame (Deep Greenish color matching left and right trees, brightened) */}
            <div className="absolute inset-[-24px] rounded-full shadow-[0_30px_60px_rgba(0,0,0,0.8)] z-0 bg-gradient-to-r from-[#4f612a] via-[#2a4532] to-[#163022] flex items-center justify-center">
              {/* Inner texture rings */}
              <div className="absolute inset-0 rounded-full border-4 border-black/30 mix-blend-multiply pointer-events-none" />
              <div className="absolute inset-[12px] rounded-full border-[4px] border-black/20 shadow-[inset_0_0_15px_rgba(0,0,0,0.5)] pointer-events-none" />
              <div className="absolute inset-[24px] rounded-full shadow-[0_0_30px_rgba(0,0,0,0.8)] pointer-events-none bg-stone-950" />
            </div>

            {/* The Interior of the Vault */}
            <div className="absolute inset-0 rounded-full shadow-[inset_0_0_80px_rgba(0,0,0,0.8)] flex items-center justify-center z-0 overflow-hidden">
              
              {/* Blurred Forest Background */}
              <div 
                className="absolute inset-0 opacity-100 pointer-events-none scale-110"
                style={{
                  backgroundImage: 'url(/img/forest-bg.png)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'blur(12px) brightness(0.6)'
                }}
              />
              
              {/* Subtle Gradient overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/30 to-transparent pointer-events-none" />

              <div className={`w-full h-full flex items-center justify-center transition-all ${doorState !== 'closed' ? 'duration-[2000ms] delay-[1000ms] opacity-100 scale-95 sm:scale-100' : 'duration-300 delay-0 opacity-0 scale-50 pointer-events-none'} relative z-10`}>
                 <VaultAuth onBack={() => setDoorState('closed')} />
              </div>
            </div>

            {/* The Split Wooden Door */}
            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none z-10">
              
              {/* Left Door Half */}
              <div 
                className={`absolute inset-0 pointer-events-auto transition-transform will-change-transform ease-[cubic-bezier(0.4,0,0.2,1)] ${doorState !== 'closed' ? 'duration-[3000ms] -translate-x-[95%]' : 'duration-[2000ms] translate-x-0'}`}
                style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)' }}
              >
                <DoorGraphic />
              </div>

              {/* Right Door Half */}
              <div 
                className={`absolute inset-0 pointer-events-auto transition-transform will-change-transform ease-[cubic-bezier(0.4,0,0.2,1)] ${doorState !== 'closed' ? 'duration-[3000ms] translate-x-[95%]' : 'duration-[2000ms] translate-x-0'}`}
                style={{ clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)' }}
              >
                <DoorGraphic />
              </div>

              {/* Central Wooden Ring / Knob (Fades out and shrinks just before door slides) */}
              <div className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${doorState !== 'closed' ? 'opacity-0 scale-50 pointer-events-none' : 'opacity-100 scale-100 pointer-events-auto'}`}>
                <button
                  onClick={handleAccessVault}
                  disabled={doorState !== 'closed'}
                  className="relative z-30 w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-amber-700 via-amber-800 to-amber-950 border-[6px] border-amber-900/80 shadow-[0_8px_20px_rgba(0,0,0,0.6),inset_0_4px_10px_rgba(255,255,255,0.2)] flex items-center justify-center transition-transform hover:scale-105 active:scale-95 group"
                >
                  <div className="absolute inset-2 rounded-full border-4 border-amber-950/40 group-hover:border-amber-950/20 transition-colors" />
                  <div className="flex flex-col items-center justify-center text-amber-100">
                    <Key className="w-8 h-8 sm:w-10 sm:h-10 mb-1 text-amber-200 drop-shadow-sm group-hover:text-emerald-400 transition-colors" />
                    <span className="text-[10px] sm:text-xs font-bold tracking-widest opacity-80 uppercase group-hover:opacity-100 transition-opacity">Unlock</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* --- BOTTOM ROW: MINIMAL FEATURES --- */}
          <div className={`absolute top-[100%] mt-12 w-[100vw] left-1/2 -translate-x-1/2 flex flex-col items-center justify-center transition-all duration-1000 ${doorState !== 'closed' ? 'opacity-0 pointer-events-none translate-y-12' : 'opacity-100 translate-y-0'}`}>
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 w-full max-w-4xl px-4">
              {securityFeatures.map((feat, index) => {
                const Icon = feat.icon;
                return (
                  <Tooltip
                    key={index}
                    content={
                      <div className="flex flex-col gap-1 text-center md:text-left">
                        <span className="font-bold text-stone-800 dark:text-stone-200">{feat.title}</span>
                        <span className="text-stone-600 dark:text-stone-500 dark:text-stone-400">{feat.desc}</span>
                      </div>
                    }
                    position="top"
                    className="flex"
                  >
                    <div className="flex items-center gap-3 group cursor-pointer md:cursor-default">
                      <div className={`p-3 md:p-2 rounded-full bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-inner ${feat.color}`}>
                        <Icon className="w-5 h-5 md:w-4 md:h-4" />
                      </div>
                      <div className="hidden md:block text-left">
                        <h3 className="text-xs font-bold tracking-widest text-stone-800 dark:text-stone-200 uppercase">
                          {feat.title}
                        </h3>
                        <p className="text-[10px] text-stone-600 dark:text-stone-500 font-medium max-w-[150px]">
                          {feat.desc}
                        </p>
                      </div>
                    </div>
                  </Tooltip>
                );
              })}
            </div>
          </div>

        </div>

    </div>
  );
};

export default EntryPoint;
