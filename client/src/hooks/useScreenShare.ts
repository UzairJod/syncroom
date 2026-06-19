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

  // Listen for screen share events and ss-* WebRTC signaling
  useEffect(() => {
    const socket = getSocket();

    socket.on('screen-share-started', (data) => {
      const localUser = useRoomStore.getState().localUser;
      if (!localUser || data.userId === localUser.id) return;

      // Someone else started sharing — we'll receive stream via WebRTC
      setSharerInfo(data.userId, data.displayName);
      addToast({ type: 'info', message: `${data.displayName} started screen sharing` });

      // Create a PeerManager (using ss-* signaling) to receive the screen share stream
      const pm = new PeerManager(
        {
          onRemoteStream: (_peerId, stream) => {
            useScreenShareStore.getState().setRemoteStream(stream);
          },
          onPeerDisconnected: () => {
            useScreenShareStore.getState().setRemoteStream(null);
          },
        },
        SS_SIGNALING,
      );
      peerManagerRef.current = pm;

      // We wait for the offer from the host (we're not the initiator)
      const sharer = useRoomStore.getState().users.find((u) => u.id === data.userId);
      if (sharer) {
        pm.addPeer(sharer.socketId, false, socket);
      }
    });

    socket.on('screen-share-stopped', () => {
      if (peerManagerRef.current) {
        peerManagerRef.current.destroy();
        peerManagerRef.current = null;
      }
      storeStop();
    });

    // Handle screen share WebRTC signaling (ss-* events)
    socket.on('ss-offer', async (data) => {
      if (peerManagerRef.current) {
        await peerManagerRef.current.handleOffer(data.senderId, data.offer, socket);
      }
    });

    socket.on('ss-answer', async (data) => {
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
  }, [setSharerInfo, storeStop, addToast, setRemoteStream]);

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
            console.log('Screen share peer disconnected:', peerId);
          },
        },
        SS_SIGNALING,
      );
      pm.setLocalStream(stream);
      peerManagerRef.current = pm;

      // Create peer connections to all other users in the room (as initiator)
      const users = useRoomStore.getState().users;
      users.forEach((user) => {
        if (localUser && user.id !== localUser.id) {
          pm.addPeer(user.socketId, true, socket);
        }
      });

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
