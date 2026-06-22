'use client';

import { useCallback, useEffect, useRef } from 'react';
import { getSocket } from '@/lib/socket';
import { PeerManager } from '@/lib/webrtc';
import { useRoomStore } from '@/store/useRoomStore';
import { useScreenShareStore } from '@/store/useScreenShareStore';
import { useUIStore } from '@/store/useUIStore';
import type { TypedSocket } from '@/lib/socket';

const SS_SIGNALING = {
  offer: 'ss-offer' as const,
  answer: 'ss-answer' as const,
  iceCandidate: 'ss-ice-candidate' as const,
};

// Buffered signaling events (handles race condition when offer arrives before PeerManager is ready)
interface BufferedEvent {
  type: 'offer' | 'answer' | 'ice';
  senderId: string;
  data: RTCSessionDescriptionInit | RTCIceCandidateInit;
}

export function useScreenShare() {
  const peerManagerRef = useRef<PeerManager | null>(null);
  const bufferedEventsRef = useRef<BufferedEvent[]>([]);
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

  // Process any buffered signaling events
  const processBuffer = useCallback((pm: PeerManager, socket: TypedSocket) => {
    const events = bufferedEventsRef.current;
    bufferedEventsRef.current = [];

    for (const evt of events) {
      if (evt.type === 'offer') {
        pm.handleOffer(evt.senderId, evt.data as RTCSessionDescriptionInit, socket);
      } else if (evt.type === 'answer') {
        pm.handleAnswer(evt.senderId, evt.data as RTCSessionDescriptionInit);
      } else if (evt.type === 'ice') {
        pm.handleIceCandidate(evt.senderId, evt.data as RTCIceCandidateInit);
      }
    }
  }, []);

  // Listen for screen share events and ss-* WebRTC signaling
  useEffect(() => {
    const socket = getSocket();

    socket.on('screen-share-started', (data) => {
      const localUser = useRoomStore.getState().localUser;
      if (!localUser || data.userId === localUser.id) return;

      // Someone else started sharing — set up to receive stream via WebRTC
      setSharerInfo(data.userId, data.displayName);
      addToast({ type: 'info', message: `${data.displayName} started screen sharing` });

      // Destroy any old PeerManager
      if (peerManagerRef.current) {
        peerManagerRef.current.destroy();
      }

      // Create a PeerManager (using ss-* signaling) to receive the screen share stream
      const pm = new PeerManager(
        {
          onRemoteStream: (_peerId, stream) => {
            console.log('[ScreenShare] Received remote stream with', stream.getTracks().length, 'tracks');
            useScreenShareStore.getState().setRemoteStream(stream);
          },
          onRemoteTrack: (_peerId, track, stream) => {
            console.log('[ScreenShare] Received remote track:', track.kind, track.readyState);
            // Also set stream on individual track receipt for reliability
            useScreenShareStore.getState().setRemoteStream(stream);
          },
          onPeerDisconnected: (peerId) => {
            console.log('[ScreenShare] Peer disconnected:', peerId);
            useScreenShareStore.getState().setRemoteStream(null);
          },
        },
        SS_SIGNALING,
      );
      peerManagerRef.current = pm;

      // Add peer connection for the sharer (we're NOT the initiator — we wait for their offer)
      const sharer = useRoomStore.getState().users.find((u) => u.id === data.userId);
      if (sharer) {
        pm.addPeer(sharer.socketId, false, socket);
      }

      // Process any buffered events that arrived before PeerManager was ready
      processBuffer(pm, socket);
    });

    socket.on('screen-share-stopped', () => {
      if (peerManagerRef.current) {
        peerManagerRef.current.destroy();
        peerManagerRef.current = null;
      }
      bufferedEventsRef.current = [];
      storeStop();
    });

    // Handle screen share WebRTC signaling (ss-* events)
    // KEY FIX: Buffer events if PeerManager isn't ready yet (race condition)
    socket.on('ss-offer', async (data) => {
      if (peerManagerRef.current) {
        await peerManagerRef.current.handleOffer(data.senderId, data.offer, socket);
      } else {
        console.log('[ScreenShare] Buffering ss-offer (PeerManager not ready)');
        bufferedEventsRef.current.push({ type: 'offer', senderId: data.senderId, data: data.offer });
      }
    });

    socket.on('ss-answer', async (data) => {
      if (peerManagerRef.current) {
        await peerManagerRef.current.handleAnswer(data.senderId, data.answer);
      } else {
        console.log('[ScreenShare] Buffering ss-answer (PeerManager not ready)');
        bufferedEventsRef.current.push({ type: 'answer', senderId: data.senderId, data: data.answer });
      }
    });

    socket.on('ss-ice-candidate', async (data) => {
      if (peerManagerRef.current) {
        await peerManagerRef.current.handleIceCandidate(data.senderId, data.candidate);
      } else {
        console.log('[ScreenShare] Buffering ss-ice-candidate (PeerManager not ready)');
        bufferedEventsRef.current.push({ type: 'ice', senderId: data.senderId, data: data.candidate });
      }
    });

    return () => {
      socket.off('screen-share-started');
      socket.off('screen-share-stopped');
      socket.off('ss-offer');
      socket.off('ss-answer');
      socket.off('ss-ice-candidate');
    };
  }, [setSharerInfo, storeStop, addToast, setRemoteStream, processBuffer]);

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

      setLocalStream(stream);
      useScreenShareStore.getState().startSharing();

      const socket = getSocket();
      const localUser = useRoomStore.getState().localUser;

      // Set sharer info locally
      if (localUser) {
        setSharerInfo(localUser.id, localUser.displayName);
      }

      // Emit server event — notifies all other users
      socket.emit('screen-share-start');

      // Create PeerManager (using ss-* signaling) to send screen to all others
      const pm = new PeerManager(
        {
          onPeerDisconnected: (peerId) => {
            console.log('[ScreenShare] Send-side peer disconnected:', peerId);
          },
        },
        SS_SIGNALING,
      );
      pm.setLocalStream(stream);
      peerManagerRef.current = pm;

      // IMPORTANT: Delay before creating peer connections
      // Give receivers time to set up their PeerManager after receiving 'screen-share-started'
      setTimeout(() => {
        const users = useRoomStore.getState().users;
        const currentLocalUser = useRoomStore.getState().localUser;
        console.log('[ScreenShare] Creating peer connections to', users.length - 1, 'users');
        users.forEach((user) => {
          if (currentLocalUser && user.id !== currentLocalUser.id) {
            pm.addPeer(user.socketId, true, socket);
          }
        });
      }, 800);

      // Handle browser "Stop sharing" button
      stream.getTracks().forEach((track) => {
        track.onended = () => {
          stopScreenShare();
        };
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'NotAllowedError') {
        console.error('Screen share error:', err);
        addToast({ type: 'error', message: 'Failed to start screen sharing' });
      }
    }
  }, [addToast, setLocalStream, setSharerInfo]);

  const stopScreenShare = useCallback(() => {
    const currentStream = useScreenShareStore.getState().localStream;
    if (currentStream) {
      currentStream.getTracks().forEach((t) => t.stop());
    }

    if (peerManagerRef.current) {
      peerManagerRef.current.destroy();
      peerManagerRef.current = null;
    }

    bufferedEventsRef.current = [];
    storeStop();

    const socket = getSocket();
    socket.emit('screen-share-stop');
  }, [storeStop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (peerManagerRef.current) {
        peerManagerRef.current.destroy();
        peerManagerRef.current = null;
      }
      bufferedEventsRef.current = [];
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
