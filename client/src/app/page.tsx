'use client';

import { useRouter } from 'next/navigation';
import { nanoid } from 'nanoid';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

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
    const roomId = nanoid(8);
    router.push(`/room/${roomId}`);
  };

  const handleJoinRoom = () => {
    if (joinId.trim()) {
      router.push(`/room/${joinId.trim()}`);
    }
  };

  return (
    <div className="relative min-h-dvh flex flex-col overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-tertiary animate-gradient-shift" />
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-accent-purple/10 rounded-full blur-[100px] animate-orb-1" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-blue/10 rounded-full blur-[120px] animate-orb-2" />
        <div className="absolute top-2/3 left-1/2 w-64 h-64 bg-accent-pink/8 rounded-full blur-[80px] animate-orb-1" style={{ animationDelay: '-5s' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center shadow-lg shadow-accent-purple/30">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-accent-blue to-accent-purple bg-clip-text text-transparent">
            SyncRoom
          </span>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="text-center max-w-3xl mx-auto space-y-8">
          {/* Title */}
          <div className="space-y-4">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight">
              <span className="bg-gradient-to-r from-white via-white to-text-secondary bg-clip-text text-transparent">
                Watch together.
              </span>
              <br />
              <span className="bg-gradient-to-r from-accent-blue via-accent-purple to-accent-pink bg-clip-text text-transparent">
                Anywhere.
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-text-secondary max-w-xl mx-auto">
              Create a room, share the link, and enjoy synchronized video watching with voice chat, screen sharing, and more.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleCreateRoom}
              className="group relative px-8 py-4 text-lg font-bold text-white rounded-2xl bg-gradient-to-r from-accent-blue via-accent-purple to-accent-pink shadow-2xl shadow-accent-purple/30 hover:shadow-accent-purple/50 transition-all duration-300 hover:scale-105 active:scale-100 animate-glow-pulse"
            >
              <span className="relative z-10 flex items-center gap-2">
                ✨ Create Room
              </span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-text-muted text-sm">or</span>
            </div>

            <div className="flex items-center gap-2">
              <Input
                placeholder="Enter room ID..."
                value={joinId}
                onChange={(e) => setJoinId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                className="w-48"
              />
              <Button variant="secondary" onClick={handleJoinRoom}>
                Join
              </Button>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20 w-full max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group p-6 bg-bg-glass backdrop-blur-md border border-border-glass rounded-2xl hover:border-white/15 hover:bg-white/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20"
            >
              <span className="text-3xl block mb-3">{feature.icon}</span>
              <h3 className="text-base font-semibold text-text-primary mb-1">{feature.title}</h3>
              <p className="text-sm text-text-muted leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6 text-xs text-text-muted">
        Built with ❤️ using Next.js, Socket.IO & WebRTC
      </footer>
    </div>
  );
}
