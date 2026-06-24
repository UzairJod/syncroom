'use client';

import { useCallback, useRef, useEffect } from 'react';
import { getSocket } from '@/lib/socket';
import { PeerManager } from '@/lib/webrtc';
import { useVoiceStore } from '@/store/useVoiceStore';
import { useRoomStore } from '@/store/useRoomStore';
import { MAX_VOICE_PARTICIPANTS } from '@/lib/constants';
import { useUIStore } from '@/store/useUIStore';

export function useVoiceChat() {
  const peerManagerRef = useRef<PeerManager | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const speakingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const {
    isInVoice, isMuted, voiceUsers, speakingUsers,
    joinVoice: storeJoin, leaveVoice: storeLeave, toggleMute: storeToggleMute,
    addVoiceUser, removeVoiceUser, setSpeaking, setVolume,
  } = useVoiceStore();

  const addToast = useUIStore((s) => s.addToast);

  useEffect(() => {
    const socket = getSocket();

    socket.on('voice-user-joined', (data) => {
      addVoiceUser(data.userId);
    });

    socket.on('voice-user-left', (data) => {
      removeVoiceUser(data.userId);
      const user = useRoomStore.getState().users.find((u) => u.id === data.userId);
      if (user && peerManagerRef.current) {
        peerManagerRef.current.removePeer(user.socketId);
      }
    });

    socket.on('voice-users', (data) => {
      data.userIds.forEach((id) => addVoiceUser(id));
      
      // We are the new user joining voice. Connect to all existing voice users!
      if (useVoiceStore.getState().isInVoice && peerManagerRef.current) {
        const currentUsers = useRoomStore.getState().users;
        const localUser = useRoomStore.getState().localUser;
        
        data.userIds.forEach((userId) => {
          const user = currentUsers.find((u) => u.id === userId);
          if (user && localUser && user.id !== localUser.id) {
            peerManagerRef.current!.addPeer(user.socketId, true, socket);
          }
        });
      }
    });

    socket.on('webrtc-offer', async (data) => {
      if (peerManagerRef.current) {
        await peerManagerRef.current.handleOffer(data.senderId, data.offer, socket);
      }
    });

    socket.on('webrtc-answer', async (data) => {
      if (peerManagerRef.current) {
        await peerManagerRef.current.handleAnswer(data.senderId, data.answer);
      }
    });

    socket.on('webrtc-ice-candidate', async (data) => {
      if (peerManagerRef.current) {
        await peerManagerRef.current.handleIceCandidate(data.senderId, data.candidate);
      }
    });

    return () => {
      socket.off('voice-user-joined');
      socket.off('voice-user-left');
      socket.off('voice-users');
      socket.off('webrtc-offer');
      socket.off('webrtc-answer');
      socket.off('webrtc-ice-candidate');
    };
  }, [isInVoice, addVoiceUser, removeVoiceUser]);

  const startSpeakingDetection = useCallback((stream: MediaStream) => {
    try {
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.4;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let wasSpeaking = false;

      speakingIntervalRef.current = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
        const isSpeaking = average > 15;

        if (isSpeaking !== wasSpeaking) {
          wasSpeaking = isSpeaking;
          const socket = getSocket();
          socket.emit('voice-speaking', { isSpeaking });
          const localUser = useRoomStore.getState().localUser;
          if (localUser) setSpeaking(localUser.id, isSpeaking);
        }
      }, 100);
    } catch (err) {
      console.error('Failed to set up speaking detection:', err);
    }
  }, [setSpeaking]);

  const joinVoice = useCallback(async () => {
    if (voiceUsers.length >= MAX_VOICE_PARTICIPANTS) {
      addToast({ type: 'error', message: `Voice chat is full (max ${MAX_VOICE_PARTICIPANTS})` });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;

      const pm = new PeerManager({
        onRemoteStream: (peerId, remoteStream) => {
          const audio = document.createElement('audio');
          audio.srcObject = remoteStream;
          audio.autoplay = true;
          audio.id = `voice-audio-${peerId}`;
          document.body.appendChild(audio);
        },
        onPeerDisconnected: (peerId) => {
          const el = document.getElementById(`voice-audio-${peerId}`);
          if (el) el.remove();
        },
      });
      pm.setLocalStream(stream);

      peerManagerRef.current = pm;

      const socket = getSocket();
      socket.emit('voice-join');
      storeJoin();

      startSpeakingDetection(stream);

    } catch (err) {
      console.error('Failed to join voice:', err);
      addToast({ type: 'error', message: 'Failed to access microphone' });
    }
  }, [voiceUsers, storeJoin, startSpeakingDetection, addToast]);

  const leaveVoice = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (peerManagerRef.current) {
      peerManagerRef.current.destroy();
      peerManagerRef.current = null;
    }
    if (speakingIntervalRef.current) {
      clearInterval(speakingIntervalRef.current);
      speakingIntervalRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    // Remove all audio elements
    document.querySelectorAll('[id^="voice-audio-"]').forEach((el) => el.remove());

    const socket = getSocket();
    socket.emit('voice-leave');
    storeLeave();
  }, [storeLeave]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        const socket = getSocket();
        socket.emit('voice-mute', { isMuted: !audioTrack.enabled });
        storeToggleMute();
      }
    }
  }, [storeToggleMute]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (peerManagerRef.current) {
        peerManagerRef.current.destroy();
      }
      if (speakingIntervalRef.current) {
        clearInterval(speakingIntervalRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      document.querySelectorAll('[id^="voice-audio-"]').forEach((el) => el.remove());
    };
  }, []);

  return {
    joinVoice,
    leaveVoice,
    toggleMute,
    isInVoice,
    isMuted,
    voiceUsers,
    speakingUsers,
  };
}
