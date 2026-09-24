import type { ConnectionState } from "./connection";
import type { CapturedImagePayload } from "./camera";
import type { PeerRole } from "./room";
import type { SignalMessage } from "./signaling";

export type ClientMessage =
  | {
      type: "create-room";
      peerId: string;
    }
  | {
      type: "join-room";
      roomId: string;
      peerId: string;
      role: PeerRole;
    }
  | {
      type: "approve-monitor";
      roomId: string;
      peerId: string;
    }
  | {
      type: "capture";
      roomId: string;
    }
  | ({
      type: "capture-result";
    } & CapturedImagePayload)
  | SignalMessage;

export type ServerMessage =
  | {
      type: "room-created";
      roomId: string;
    }
  | {
      type: "room-state";
      roomId: string;
      state: ConnectionState;
    }
  | {
      type: "pair-request";
      roomId: string;
      peerId: string;
    }
  | {
      type: "capture";
      roomId: string;
    }
  | ({
      type: "capture-result";
    } & CapturedImagePayload)
  | {
      type: "error";
      message: string;
    }
  | SignalMessage;
