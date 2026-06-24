'use client';

import { useCallback, useEffect, useRef } from 'react';
import { getSocket } from '@/lib/socket';
import { PeerManager } from '@/lib/webrtc';
import { useRoomStore } from '@/store/useRoomStore';
import { useScreenShareStore } from '@/store/useScreenShareStore';
import { useUIStore } from '@/store/useUIStore';

const SS_SIGNALING = {
  offer: 'ss-offer' as const,
  answer: 'ss-answer' as const,
  iceCandidate: 'ss-ice-candidate' as const,
};

// Module-level state so that the listener instance (in page.tsx) 
// and the UI instance (in RoomToolbar.tsx) share the same references.
let globalPeerManager: PeerManager | null = null;
let globalIsHostSharing = false;
let globalLocalStream: MediaStream | null = null;

export function useScreenShare(registerListeners = false) {

  const {
    isScreenSharing,
    localStream,
    remoteStream,
    sharerName,
  } = useScreenShareStore();

  // ─── Socket listeners (registered ONCE) ───
  useEffect(() => {
    if (!registerListeners) return;
    const socket = getSocket();

    // === RECEIVER SIDE: someone started sharing ===
    const handleScreenShareStarted = (data: any) => {
      const localUser = useRoomStore.getState().localUser;
      if (!localUser || data.userId === localUser.id) return;

      console.log('[SS] 📺 Remote user started sharing:', data.displayName);
      useScreenShareStore.getState().setSharerInfo(data.userId, data.displayName);
      useUIStore.getState().addToast({ type: 'info', message: `${data.displayName} started screen sharing` });

      // Clean up old PeerManager if exists
      if (globalPeerManager && !globalIsHostSharing) {
        globalPeerManager.destroy();
        globalPeerManager = null;
      }

      // Create receiving PeerManager
      const pm = new PeerManager(
        {
          onRemoteStream: (_peerId, stream) => {
            console.log('[SS] ✅ GOT REMOTE STREAM!', stream.getTracks().length, 'tracks');
            stream.getTracks().forEach(t => {
              console.log('[SS]   └─ track:', t.kind, 'readyState:', t.readyState, 'enabled:', t.enabled);
            });
            // 🔴 CRITICAL FIX: Create a NEW MediaStream so Zustand detects the reference change and forces a re-render
            useScreenShareStore.getState().setRemoteStream(new MediaStream(stream.getTracks()));
          },
          onPeerDisconnected: (peerId) => {
            console.log('[SS] ❌ Peer disconnected:', peerId);
          },
        },
        SS_SIGNALING,
      );
      globalPeerManager = pm;

      // Tell the host we're ready — this triggers the host to send an offer TO US
      const sharer = useRoomStore.getState().users.find((u) => u.id === data.userId);
      if (sharer) {
        console.log('[SS] 🤝 Sending ss-ready to host:', sharer.socketId);
        socket.emit('ss-ready', { targetId: sharer.socketId });
      }
    };

    // === RECEIVER SIDE: sharing stopped ===
    const handleScreenShareStopped = () => {
      console.log('[SS] 🛑 Screen share stopped');
      if (globalPeerManager && !globalIsHostSharing) {
        globalPeerManager.destroy();
        globalPeerManager = null;
      }
      useScreenShareStore.getState().stopSharing();
    };

    // === HOST SIDE: receiver says they're ready ===
    const handleSSReady = (data: any) => {
      console.log('[SS] 🤝 Receiver ready:', data.senderId);
      const pm = globalPeerManager;
      const stream = globalLocalStream;
      if (pm && stream && globalIsHostSharing) {
        // NOW create the peer connection and send offer
        console.log('[SS] → Creating peer + sending offer to:', data.senderId);
        pm.addPeer(data.senderId, true, socket);
      } else {
        console.warn('[SS] ss-ready received but not ready to send', {
          hasPM: !!pm, hasStream: !!stream, isSharing: globalIsHostSharing
        });
      }
    };

    // === WebRTC signaling ===
    const handleSSOffer = async (data: any) => {
      console.log('[SS] 📨 Got ss-offer from:', data.senderId);
      const pm = globalPeerManager;
      if (pm) {
        await pm.handleOffer(data.senderId, data.offer, socket);
      } else {
        // Fallback: create PeerManager on the fly
        console.log('[SS] Creating on-demand PeerManager for offer');
        const newPm = new PeerManager(
          {
            onRemoteStream: (_peerId, stream) => {
              console.log('[SS] ✅ GOT REMOTE STREAM (on-demand)!');
              useScreenShareStore.getState().setRemoteStream(new MediaStream(stream.getTracks()));
            },
          },
          SS_SIGNALING,
        );
        globalPeerManager = newPm;
        await newPm.handleOffer(data.senderId, data.offer, socket);
      }
    };

    const handleSSAnswer = async (data: any) => {
      console.log('[SS] 📨 Got ss-answer from:', data.senderId);
      if (globalPeerManager) {
        await globalPeerManager.handleAnswer(data.senderId, data.answer);
      }
    };

    const handleSSIceCandidate = async (data: any) => {
      if (globalPeerManager) {
        await globalPeerManager.handleIceCandidate(data.senderId, data.candidate);
      }
    };

    socket.on('screen-share-started', handleScreenShareStarted);
    socket.on('screen-share-stopped', handleScreenShareStopped);
    socket.on('ss-ready', handleSSReady);
    socket.on('ss-offer', handleSSOffer);
    socket.on('ss-answer', handleSSAnswer);
    socket.on('ss-ice-candidate', handleSSIceCandidate);

    return () => {
      socket.off('screen-share-started', handleScreenShareStarted);
      socket.off('screen-share-stopped', handleScreenShareStopped);
      socket.off('ss-ready', handleSSReady);
      socket.off('ss-offer', handleSSOffer);
      socket.off('ss-answer', handleSSAnswer);
      socket.off('ss-ice-candidate', handleSSIceCandidate);
    };
  }, [registerListeners]); // Empty deps — register once

  // ─── Host: start sharing ───
  const startScreenShare = useCallback(async () => {
    const isHost = useRoomStore.getState().isHost();
    if (!isHost) {
      useUIStore.getState().addToast({ type: 'error', message: 'Only the host can share screen' });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' } as MediaTrackConstraints,
        audio: true,
      });
      globalLocalStream = stream;
      useScreenShareStore.getState().setLocalStream(stream);
      useScreenShareStore.getState().startSharing();
      globalIsHostSharing = true;

      const localUser = useRoomStore.getState().localUser;
      if (localUser) {
        useScreenShareStore.getState().setSharerInfo(localUser.id, localUser.displayName);
      }

      // Clean up old
      if (globalPeerManager) {
        globalPeerManager.destroy();
      }

      // Create sending PeerManager
      const pm = new PeerManager(
        {
          onPeerDisconnected: (peerId) => console.log('[SS] ❌ Peer disconnected:', peerId),
        },
        SS_SIGNALING,
      );
      globalPeerManager = pm;

      // Add local stream tracks to all peers
      pm.setLocalStream(stream);
      const socket = getSocket();
      socket.emit('screen-share-start');
      console.log('[SS] 📡 Host started sharing, waiting for ss-ready from receivers...');

      // Handle browser "Stop sharing" button
      stream.getTracks().forEach((track) => {
        track.onended = () => stopScreenShare();
      });

    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'NotAllowedError') {
        console.error('[SS] Error:', err);
        useUIStore.getState().addToast({ type: 'error', message: 'Failed to start screen sharing' });
      }
    }
  }, []);

  // ─── Host: stop sharing ───
  const stopScreenShare = useCallback(() => {
    // Clean up connections
    if (globalPeerManager) {
      globalPeerManager.destroy();
      globalPeerManager = null;
    }

    if (globalLocalStream) {
      globalLocalStream.getTracks().forEach((track) => track.stop());
      globalLocalStream = null;
    }

    globalIsHostSharing = false;

    useScreenShareStore.getState().stopSharing();
    getSocket().emit('screen-share-stop');
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (globalPeerManager) {
        globalPeerManager.destroy();
        globalPeerManager = null;
      }
    };
  }, []);

  return {
    startScreenShare,
    stopScreenShare,
    isScreenSharing,
    localStream,
    remoteStream,
    sharerName,
  };
}
