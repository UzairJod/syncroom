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

export function useScreenShare() {
  const peerManagerRef = useRef<PeerManager | null>(null);
  const isHostSharingRef = useRef(false);
  const localStreamRef = useRef<MediaStream | null>(null);

  const {
    isScreenSharing,
    localStream,
    remoteStream,
    sharerName,
  } = useScreenShareStore();

  // ─── Socket listeners (registered ONCE) ───
  useEffect(() => {
    const socket = getSocket();

    // === RECEIVER SIDE: someone started sharing ===
    socket.on('screen-share-started', (data) => {
      const localUser = useRoomStore.getState().localUser;
      if (!localUser || data.userId === localUser.id) return;

      console.log('[SS] 📺 Remote user started sharing:', data.displayName);
      useScreenShareStore.getState().setSharerInfo(data.userId, data.displayName);
      useUIStore.getState().addToast({ type: 'info', message: `${data.displayName} started screen sharing` });

      // Clean up old PeerManager if exists
      if (peerManagerRef.current && !isHostSharingRef.current) {
        peerManagerRef.current.destroy();
        peerManagerRef.current = null;
      }

      // Create receiving PeerManager
      const pm = new PeerManager(
        {
          onRemoteStream: (_peerId, stream) => {
            console.log('[SS] ✅ GOT REMOTE STREAM!', stream.getTracks().length, 'tracks');
            stream.getTracks().forEach(t => {
              console.log('[SS]   └─ track:', t.kind, 'readyState:', t.readyState, 'enabled:', t.enabled);
            });
            useScreenShareStore.getState().setRemoteStream(stream);
          },
          onPeerDisconnected: (peerId) => {
            console.log('[SS] ❌ Peer disconnected:', peerId);
          },
        },
        SS_SIGNALING,
      );
      peerManagerRef.current = pm;

      // Tell the host we're ready — this triggers the host to send an offer TO US
      const sharer = useRoomStore.getState().users.find((u) => u.id === data.userId);
      if (sharer) {
        console.log('[SS] 🤝 Sending ss-ready to host:', sharer.socketId);
        socket.emit('ss-ready', { targetId: sharer.socketId });
      }
    });

    // === RECEIVER SIDE: sharing stopped ===
    socket.on('screen-share-stopped', () => {
      console.log('[SS] 🛑 Screen share stopped');
      if (peerManagerRef.current && !isHostSharingRef.current) {
        peerManagerRef.current.destroy();
        peerManagerRef.current = null;
      }
      useScreenShareStore.getState().stopSharing();
    });

    // === HOST SIDE: receiver says they're ready ===
    socket.on('ss-ready', (data) => {
      console.log('[SS] 🤝 Receiver ready:', data.senderId);
      const pm = peerManagerRef.current;
      const stream = localStreamRef.current;
      if (pm && stream && isHostSharingRef.current) {
        // NOW create the peer connection and send offer
        console.log('[SS] → Creating peer + sending offer to:', data.senderId);
        pm.addPeer(data.senderId, true, socket);
      } else {
        console.warn('[SS] ss-ready received but not ready to send', {
          hasPM: !!pm, hasStream: !!stream, isSharing: isHostSharingRef.current
        });
      }
    });

    // === WebRTC signaling ===
    socket.on('ss-offer', async (data) => {
      console.log('[SS] 📨 Got ss-offer from:', data.senderId);
      const pm = peerManagerRef.current;
      if (pm) {
        await pm.handleOffer(data.senderId, data.offer, socket);
      } else {
        // Fallback: create PeerManager on the fly
        console.log('[SS] Creating on-demand PeerManager for offer');
        const newPm = new PeerManager(
          {
            onRemoteStream: (_peerId, stream) => {
              console.log('[SS] ✅ GOT REMOTE STREAM (on-demand)!');
              useScreenShareStore.getState().setRemoteStream(stream);
            },
          },
          SS_SIGNALING,
        );
        peerManagerRef.current = newPm;
        await newPm.handleOffer(data.senderId, data.offer, socket);
      }
    });

    socket.on('ss-answer', async (data) => {
      console.log('[SS] 📨 Got ss-answer from:', data.senderId);
      if (peerManagerRef.current) {
        await peerManagerRef.current.handleAnswer(data.senderId, data.answer);
      }
    });

    socket.on('ss-ice-candidate', async (data) => {
      if (peerManagerRef.current) {
        await peerManagerRef.current.handleIceCandidate(data.senderId, data.candidate);
      }
    });

    return () => {
      socket.off('screen-share-started');
      socket.off('screen-share-stopped');
      socket.off('ss-ready');
      socket.off('ss-offer');
      socket.off('ss-answer');
      socket.off('ss-ice-candidate');
    };
  }, []); // Empty deps — register once

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

      localStreamRef.current = stream;
      useScreenShareStore.getState().setLocalStream(stream);
      useScreenShareStore.getState().startSharing();
      isHostSharingRef.current = true;

      const localUser = useRoomStore.getState().localUser;
      if (localUser) {
        useScreenShareStore.getState().setSharerInfo(localUser.id, localUser.displayName);
      }

      // Create PeerManager with the screen stream
      const pm = new PeerManager(
        {
          onPeerDisconnected: (peerId) => {
            console.log('[SS] Send-side peer disconnected:', peerId);
          },
        },
        SS_SIGNALING,
      );
      pm.setLocalStream(stream);
      peerManagerRef.current = pm;

      // Tell server → server broadcasts to all other users
      // Each receiver will reply with ss-ready, and THEN we create peer connections
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
    const currentStream = localStreamRef.current;
    if (currentStream) {
      currentStream.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }

    if (peerManagerRef.current) {
      peerManagerRef.current.destroy();
      peerManagerRef.current = null;
    }
    isHostSharingRef.current = false;

    useScreenShareStore.getState().stopSharing();
    getSocket().emit('screen-share-stop');
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (peerManagerRef.current) {
        peerManagerRef.current.destroy();
        peerManagerRef.current = null;
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
