import type { TypedSocket } from './socket';

interface PeerManagerCallbacks {
  onRemoteStream?: (peerId: string, stream: MediaStream) => void;
  onRemoteTrack?: (peerId: string, track: MediaStreamTrack, stream: MediaStream) => void;
  onPeerDisconnected?: (peerId: string) => void;
}

interface SignalingEvents {
  offer: 'webrtc-offer' | 'ss-offer';
  answer: 'webrtc-answer' | 'ss-answer';
  iceCandidate: 'webrtc-ice-candidate' | 'ss-ice-candidate';
}

const DEFAULT_SIGNALING: SignalingEvents = {
  offer: 'webrtc-offer',
  answer: 'webrtc-answer',
  iceCandidate: 'webrtc-ice-candidate',
};

function getIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];

  const turnUrl = process.env.NEXT_PUBLIC_TURN_URL;
  const turnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME;
  const turnCredential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;

  if (turnUrl && turnUsername && turnCredential) {
    servers.push({
      urls: turnUrl,
      username: turnUsername,
      credential: turnCredential,
    });
  }

  return servers;
}

export class PeerManager {
  private peers: Map<string, RTCPeerConnection> = new Map();
  private iceCandidateBuffer: Map<string, RTCIceCandidateInit[]> = new Map();
  private remoteDescriptionSet: Map<string, boolean> = new Map();
  localStream: MediaStream | null = null;
  private screenTrack: MediaStreamTrack | null = null;
  private callbacks: PeerManagerCallbacks;
  private signaling: SignalingEvents;

  constructor(callbacks: PeerManagerCallbacks = {}, signaling?: SignalingEvents) {
    this.callbacks = callbacks;
    this.signaling = signaling ?? DEFAULT_SIGNALING;
  }

  addPeer(peerId: string, isInitiator: boolean, socket: TypedSocket): RTCPeerConnection {
    // Close existing connection if any
    this.removePeer(peerId);

    const pc = new RTCPeerConnection({
      iceServers: getIceServers(),
    });

    this.peers.set(peerId, pc);
    this.remoteDescriptionSet.set(peerId, false);
    this.iceCandidateBuffer.set(peerId, []);

    // Add local tracks if we have a stream
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // Add screen share track if active
    if (this.screenTrack) {
      const screenStream = new MediaStream([this.screenTrack]);
      pc.addTrack(this.screenTrack, screenStream);
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit(this.signaling.iceCandidate, {
          targetId: peerId,
          candidate: event.candidate.toJSON(),
        } as any);
      }
    };

    // Handle remote tracks
    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) {
        this.callbacks.onRemoteStream?.(peerId, stream);
      }
      this.callbacks.onRemoteTrack?.(peerId, event.track, event.streams[0] || new MediaStream([event.track]));
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.callbacks.onPeerDisconnected?.(peerId);
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        this.callbacks.onPeerDisconnected?.(peerId);
      }
    };

    // If initiator, create offer
    if (isInitiator) {
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          if (pc.localDescription) {
            socket.emit(this.signaling.offer, {
              targetId: peerId,
              offer: pc.localDescription,
            } as any);
          }
        })
        .catch((err) => console.error('Error creating offer:', err));
    }

    return pc;
  }

  removePeer(peerId: string): void {
    const pc = this.peers.get(peerId);
    if (pc) {
      pc.close();
      this.peers.delete(peerId);
      this.remoteDescriptionSet.delete(peerId);
      this.iceCandidateBuffer.delete(peerId);
    }
  }

  async handleOffer(peerId: string, offer: RTCSessionDescriptionInit, socket: TypedSocket): Promise<void> {
    let pc = this.peers.get(peerId);
    if (!pc) {
      pc = this.addPeer(peerId, false, socket);
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      this.remoteDescriptionSet.set(peerId, true);

      // Process buffered ICE candidates
      await this.processBufferedCandidates(peerId);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit(this.signaling.answer, {
        targetId: peerId,
        answer: pc.localDescription!,
      } as any);
    } catch (err) {
      console.error('Error handling offer:', err);
    }
  }

  async handleAnswer(peerId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const pc = this.peers.get(peerId);
    if (!pc) return;

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      this.remoteDescriptionSet.set(peerId, true);

      // Process buffered ICE candidates
      await this.processBufferedCandidates(peerId);
    } catch (err) {
      console.error('Error handling answer:', err);
    }
  }

  async handleIceCandidate(peerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const pc = this.peers.get(peerId);
    if (!pc) return;

    if (this.remoteDescriptionSet.get(peerId)) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('Error adding ICE candidate:', err);
      }
    } else {
      // Buffer the candidate until remote description is set
      const buffer = this.iceCandidateBuffer.get(peerId) || [];
      buffer.push(candidate);
      this.iceCandidateBuffer.set(peerId, buffer);
    }
  }

  private async processBufferedCandidates(peerId: string): Promise<void> {
    const pc = this.peers.get(peerId);
    const buffer = this.iceCandidateBuffer.get(peerId);
    if (!pc || !buffer) return;

    for (const candidate of buffer) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('Error adding buffered ICE candidate:', err);
      }
    }
    this.iceCandidateBuffer.set(peerId, []);
  }

  setLocalStream(stream: MediaStream): void {
    this.localStream = stream;

    // Add tracks to all existing peers
    this.peers.forEach((pc) => {
      const senders = pc.getSenders();
      stream.getTracks().forEach((track) => {
        const existingSender = senders.find((s) => s.track?.kind === track.kind);
        if (existingSender) {
          existingSender.replaceTrack(track);
        } else {
          pc.addTrack(track, stream);
        }
      });
    });
  }

  removeLocalStream(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
    }
    this.localStream = null;

    // Remove tracks from all peers
    this.peers.forEach((pc) => {
      pc.getSenders().forEach((sender) => {
        if (sender.track && sender.track !== this.screenTrack) {
          pc.removeTrack(sender);
        }
      });
    });
  }

  addScreenShareTrack(track: MediaStreamTrack): void {
    this.screenTrack = track;
    const stream = new MediaStream([track]);

    this.peers.forEach((pc) => {
      pc.addTrack(track, stream);
    });
  }

  removeScreenShareTrack(): void {
    if (!this.screenTrack) return;

    this.peers.forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track === this.screenTrack);
      if (sender) {
        pc.removeTrack(sender);
      }
    });

    this.screenTrack.stop();
    this.screenTrack = null;
  }

  getPeer(peerId: string): RTCPeerConnection | undefined {
    return this.peers.get(peerId);
  }

  getAllPeerIds(): string[] {
    return Array.from(this.peers.keys());
  }

  destroy(): void {
    this.peers.forEach((pc) => pc.close());
    this.peers.clear();
    this.iceCandidateBuffer.clear();
    this.remoteDescriptionSet.clear();

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    if (this.screenTrack) {
      this.screenTrack.stop();
      this.screenTrack = null;
    }
  }
}
