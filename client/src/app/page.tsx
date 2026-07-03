'use client';

import { useRouter } from 'next/navigation';
import { customAlphabet } from 'nanoid';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const generatePin = customAlphabet('0123456789', 6);

const FEATURES = [
  { icon: '▶️', title: 'YouTube Sync', desc: 'Watch YouTube videos in perfect sync with friends' },
  { icon: '🎤', title: 'Voice Chat', desc: 'Talk to your friends with low-latency WebRTC audio' },
  { icon: '🖥️', title: 'Screen Share', desc: 'Share your screen for everyone in the room to see' },
  { icon: '📁', title: 'Video Upload', desc: 'Upload your own videos and watch together' },
  { icon: '💬', title: 'Live Chat', desc: 'Real-time text chat with emojis and notifications' },
  { icon: '🚀', title: 'No Sign-up', desc: 'Create a room instantly — no account required' },
];

export default function HomePage() {
  const router = useRouter();
  const [joinId, setJoinId] = useState('');

  const handleCreateRoom = () => {
    const roomId = generatePin();
    router.push(`/room/${roomId}`);
  };

  const handleJoinRoom = () => {
    if (joinId.trim()) {
      router.push(`/room/${joinId.trim()}`);
    }
  };

  return (
    <div className="relative min-h-dvh flex flex-col bg-bg-primary overflow-hidden">
      {/* Premium Minimal Background */}
      <div className="fixed inset-0 -z-10 bg-bg-primary">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-accent-purple/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent-blue/10 blur-[120px] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(13,17,23,1))] pointer-events-none" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-6 safe-area-top max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center shadow-lg shadow-accent-purple/20 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-accent-purple/30">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold tracking-tight text-text-primary group-hover:text-white transition-colors duration-200">
              SyncRoom
            </span>
            <span className="text-xs font-medium text-text-muted">
              by Uzair
            </span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-4xl mx-auto space-y-10 animate-fade-in">
          {/* Title */}
          <div className="space-y-6">
            <h1 className="text-5xl min-[375px]:text-6xl sm:text-7xl lg:text-[80px] font-bold leading-[1.1] tracking-tight">
              <span className="text-text-primary">Watch together.</span>
              <br />
              <span className="bg-gradient-to-r from-accent-purple to-accent-blue bg-clip-text text-transparent">
                Anywhere.
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed font-medium">
              Create a room, share the link, and enjoy synchronized video watching with voice chat, screen sharing, and more.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-12">
            <button
              onClick={handleCreateRoom}
              className="group relative h-14 px-8 text-lg font-semibold text-white rounded-xl bg-gradient-to-r from-accent-purple to-accent-blue shadow-[0_0_20px_rgba(124,92,252,0.3)] hover:shadow-[0_0_30px_rgba(78,168,255,0.4)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Create Room
              </span>
            </button>

            <div className="flex items-center gap-4 text-text-muted text-sm font-medium">
              <div className="w-8 h-[1px] bg-border-glass" />
              or
              <div className="w-8 h-[1px] bg-border-glass" />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Input
                placeholder="Enter room ID..."
                value={joinId}
                onChange={(e) => setJoinId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                className="h-14 sm:w-64 text-base"
              />
              <Button variant="secondary" onClick={handleJoinRoom} className="h-14 px-6 text-base shrink-0 rounded-xl">
                Join
              </Button>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-24 sm:mt-32 w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group p-8 bg-bg-tertiary border border-border-glass rounded-2xl hover:border-white/10 hover:bg-[#252b3b] transition-all duration-250 ease-out hover:-translate-y-1 shadow-sm"
            >
              <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-bg-secondary border border-border-glass mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-xl">{feature.icon}</span>
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2 tracking-tight">{feature.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6 text-xs text-text-muted safe-area-bottom">
        Built with ❤️ using Next.js, Socket.IO & WebRTC
      </footer>
    </div>
  );
}
