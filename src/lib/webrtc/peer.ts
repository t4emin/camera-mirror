import type { SignalMessage } from "@/types/signaling";

interface WebRTCPeerOptions {
  onSignal: (message: SignalMessage) => void;
  onRemoteStream?: (stream: MediaStream) => void;
}

export class WebRTCPeer {
  private connection?: RTCPeerConnection;

  constructor(private readonly options: WebRTCPeerOptions) {}

  async startCameraOffer(roomId: string, stream: MediaStream): Promise<void> {
    const connection = this.ensureConnection(roomId);

    stream.getTracks().forEach((track) => {
      connection.addTrack(track, stream);
    });

    const offer = await connection.createOffer();
    await connection.setLocalDescription(offer);

    this.options.onSignal({
      type: "offer",
      roomId,
      sdp: offer
    });
  }

  async acceptOffer(message: Extract<SignalMessage, { type: "offer" }>) {
    const connection = this.ensureConnection(message.roomId);

    await connection.setRemoteDescription(message.sdp);

    const answer = await connection.createAnswer();
    await connection.setLocalDescription(answer);

    this.options.onSignal({
      type: "answer",
      roomId: message.roomId,
      sdp: answer
    });
  }

  async acceptAnswer(message: Extract<SignalMessage, { type: "answer" }>) {
    if (!this.connection) {
      return;
    }

    await this.connection.setRemoteDescription(message.sdp);
  }

  async addIceCandidate(
    message: Extract<SignalMessage, { type: "ice-candidate" }>
  ) {
    if (!this.connection) {
      return;
    }

    await this.connection.addIceCandidate(message.candidate);
  }

  close(): void {
    this.connection?.close();
    this.connection = undefined;
  }

  private ensureConnection(roomId: string): RTCPeerConnection {
    if (this.connection) {
      return this.connection;
    }

    const connection = new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302"
        }
      ]
    });

    connection.addEventListener("icecandidate", (event) => {
      if (!event.candidate) {
        return;
      }

      this.options.onSignal({
        type: "ice-candidate",
        roomId,
        candidate: event.candidate.toJSON()
      });
    });

    connection.addEventListener("track", (event) => {
      const [stream] = event.streams;

      if (stream) {
        this.options.onRemoteStream?.(stream);
      }
    });

    this.connection = connection;
    return connection;
  }
}
