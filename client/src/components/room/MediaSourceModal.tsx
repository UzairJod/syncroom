'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import VideoUploader from './VideoUploader';
import { useUIStore } from '@/store/useUIStore';
import { useMediaSync } from '@/hooks/useMediaSync';
import { isYouTubeUrl, extractYouTubeId, getYouTubeThumbnail } from '@/lib/youtube';

type Tab = 'youtube' | 'upload';

export default function MediaSourceModal() {
  const { mediaModalOpen, setMediaModalOpen } = useUIStore();
  const { setMediaSource } = useMediaSync();
  const [activeTab, setActiveTab] = useState<Tab>('youtube');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [urlError, setUrlError] = useState('');

  const videoId = extractYouTubeId(youtubeUrl);
  const thumbnailUrl = videoId ? getYouTubeThumbnail(videoId) : null;

  const handleYouTubePlay = () => {
    if (!youtubeUrl.trim()) {
      setUrlError('Please enter a YouTube URL');
      return;
    }
    if (!isYouTubeUrl(youtubeUrl)) {
      setUrlError('Invalid YouTube URL');
      return;
    }
    setUrlError('');
    setMediaSource(youtubeUrl, 'youtube');
    setMediaModalOpen(false);
    setYoutubeUrl('');
  };

  const handleVideoUploadComplete = (url: string) => {
    setMediaSource(url, 'video');
    setMediaModalOpen(false);
  };

  return (
    <Modal
      isOpen={mediaModalOpen}
      onClose={() => setMediaModalOpen(false)}
      title="Set Media Source"
      maxWidth="max-w-xl"
    >
      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white/5 p-1 rounded-xl">
        {(['youtube', 'upload'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200
              ${activeTab === tab
                ? 'bg-gradient-to-r from-accent-blue to-accent-purple text-white shadow-lg'
                : 'text-text-secondary hover:text-text-primary hover:bg-white/5'}
            `}
          >
            {tab === 'youtube' ? '▶ YouTube' : '📁 Upload Video'}
          </button>
        ))}
      </div>

      {/* YouTube Tab */}
      {activeTab === 'youtube' && (
        <div className="space-y-4">
          <Input
            label="YouTube URL"
            placeholder="https://youtube.com/watch?v=..."
            value={youtubeUrl}
            onChange={(e) => { setYoutubeUrl(e.target.value); setUrlError(''); }}
            error={urlError}
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-red-500">
                <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            }
          />

          {/* Thumbnail Preview */}
          {thumbnailUrl && (
            <div className="relative aspect-video rounded-lg overflow-hidden border border-border-glass">
              <img
                src={thumbnailUrl}
                alt="Video thumbnail"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <polygon points="10 8 16 12 10 16 10 8" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          <Button onClick={handleYouTubePlay} className="w-full">
            Play YouTube Video
          </Button>
        </div>
      )}

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <VideoUploader onUploadComplete={handleVideoUploadComplete} />
      )}
    </Modal>
  );
}
