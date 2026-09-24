export type SignalMessage =
  | {
      type: "offer";
      roomId: string;
      sdp: RTCSessionDescriptionInit;
    }
  | {
      type: "answer";
      roomId: string;
      sdp: RTCSessionDescriptionInit;
    }
  | {
      type: "ice-candidate";
      roomId: string;
      candidate: RTCIceCandidateInit;
    };
