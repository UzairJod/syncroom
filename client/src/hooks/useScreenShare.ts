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
  // All refs — survive re-renders and useEffect re-runs
  const peerManagerRef = useRef<PeerManager | null>(null);
  const isHostSharingRef = useRef(false);
  const addToast = useUIStore((s) => s.addToast);

  const {
    isScreenSharing,
    localStream,
    remoteStream,
    sharerName,
    setLocalStream,
    setRemoteStream,
    setSharerInfo,
    stopSharing: storeStop,
  } = useScreenShareStore();

  // ─── Socket listeners (registered once, use refs for state) ───
  useEffect(() => {
    const socket = getSocket();

    // When someone starts screen sharing
    socket.on('screen-share-started', (data) => {
      const localUser = useRoomStore.getState().localUser;
      if (!localUser || data.userId === localUser.id) return;

      console.log('[SS] Remote user started sharing:', data.displayName);

      useScreenShareStore.getState().setSharerInfo(data.userId, data.displayName);
      useUIStore.getState().addToast({ type: 'info', message: `${data.displayName} started screen sharing` });

      // Destroy any existing receiving PeerManager
      if (peerManagerRef.current && !isHostSharingRef.current) {
        peerManagerRef.current.destroy();
        peerManagerRef.current = null;
      }

      // Create receiving PeerManager
      const pm = new PeerManager(
        {
          onRemoteStream: (_peerId, stream) => {
            console.log('[SS] ✅ Got remote stream:', stream.getTracks().length, 'tracks');
            stream.getTracks().forEach(t => console.log('[SS]   track:', t.kind, t.readyState, t.enabled));
            useScreenShareStore.getState().setRemoteStream(stream);
          },
          onRemoteTrack: (_peerId, track) => {
            console.log('[SS] Got remote track:', track.kind, track.readyState);
          },
          onPeerDisconnected: (peerId) => {
            console.log('[SS] Receive peer disconnected:', peerId);
          },
        },
        SS_SIGNALING,
      );
      peerManagerRef.current = pm;

      // Pre-create the peer connection (non-initiator, waits for offer)
      const sharer = useRoomStore.getState().users.find((u) => u.id === data.userId);
      if (sharer) {
        console.log('[SS] Created receive peer for:', sharer.socketId);
        pm.addPeer(sharer.socketId, false, socket);
      } else {
        console.warn('[SS] Could not find sharer in users list:', data.userId);
      }
    });

    socket.on('screen-share-stopped', () => {
      console.log('[SS] Screen share stopped');
      if (peerManagerRef.current && !isHostSharingRef.current) {
        peerManagerRef.current.destroy();
        peerManagerRef.current = null;
      }
      useScreenShareStore.getState().stopSharing();
    });

    // ─── WebRTC signaling for screen share ───
    socket.on('ss-offer', async (data) => {
      console.log('[SS] Got ss-offer from:', data.senderId, 'pmExists:', !!peerManagerRef.current);
      if (peerManagerRef.current) {
        await peerManagerRef.current.handleOffer(data.senderId, data.offer, socket);
      } else {
        // PeerManager not ready — create one on the fly to handle this offer
        console.log('[SS] Creating PeerManager on-demand for incoming offer');
        const pm = new PeerManager(
          {
            onRemoteStream: (_peerId, stream) => {
              console.log('[SS] ✅ Got remote stream (on-demand):', stream.getTracks().length, 'tracks');
              useScreenShareStore.getState().setRemoteStream(stream);
            },
            onPeerDisconnected: (peerId) => {
              console.log('[SS] On-demand peer disconnected:', peerId);
            },
          },
          SS_SIGNALING,
        );
        peerManagerRef.current = pm;
        await pm.handleOffer(data.senderId, data.offer, socket);
      }
    });

    socket.on('ss-answer', async (data) => {
      console.log('[SS] Got ss-answer from:', data.senderId, 'pmExists:', !!peerManagerRef.current);
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
      socket.off('ss-offer');
      socket.off('ss-answer');
      socket.off('ss-ice-candidate');
    };
  }, []); // ← Empty deps! Register once, use refs for everything

  // ─── Host: start sharing ───
  const startScreenShare = useCallback(async () => {
    const isHost = useRoomStore.getState().isHost();
    if (!isHost) {
      addToast({ type: 'error', message: 'Only the host can share screen' });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' } as MediaTrackConstraints,
        audio: true,
      });

      // Store stream
      useScreenShareStore.getState().setLocalStream(stream);
      useScreenShareStore.getState().startSharing();
      isHostSharingRef.current = true;

      const socket = getSocket();
      const localUser = useRoomStore.getState().localUser;
      if (localUser) {
        useScreenShareStore.getState().setSharerInfo(localUser.id, localUser.displayName);
      }

      // Tell server (broadcasts to other users)
      socket.emit('screen-share-start');

      // Create SENDING PeerManager
      const pm = new PeerManager(
        {
          onPeerDisconnected: (peerId) => {
            console.log('[SS] Send peer disconnected:', peerId);
          },
        },
        SS_SIGNALING,
      );
      pm.setLocalStream(stream);
      peerManagerRef.current = pm;

      // Wait for receivers to set up, then send offers
      setTimeout(() => {
        const users = useRoomStore.getState().users;
        const me = useRoomStore.getState().localUser;
        const others = users.filter(u => me && u.id !== me.id);
        console.log('[SS] Sending offers to', others.length, 'users');
        others.forEach((user) => {
          console.log('[SS] → addPeer (initiator) to:', user.socketId, user.displayName);
          pm.addPeer(user.socketId, true, socket);
        });
      }, 1000);

      // Handle browser "Stop sharing" button
      stream.getTracks().forEach((track) => {
        track.onended = () => stopScreenShare();
      });

    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'NotAllowedError') {
        console.error('[SS] Screen share error:', err);
        addToast({ type: 'error', message: 'Failed to start screen sharing' });
      }
    }
  }, [addToast]);

  // ─── Host: stop sharing ───
  const stopScreenShare = useCallback(() => {
    const currentStream = useScreenShareStore.getState().localStream;
    if (currentStream) {
      currentStream.getTracks().forEach((t) => t.stop());
    }

    if (peerManagerRef.current) {
      peerManagerRef.current.destroy();
      peerManagerRef.current = null;
    }
    isHostSharingRef.current = false;

    useScreenShareStore.getState().stopSharing();

    const socket = getSocket();
    socket.emit('screen-share-stop');
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
