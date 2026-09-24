import type { ConnectionState } from "./connection";

export type PeerRole = "camera" | "monitor";

export interface RoomPeer {
  id: string;
  role: PeerRole;
}

export interface RoomSnapshot {
  id: string;
  state: ConnectionState;
  camera?: RoomPeer;
  monitor?: RoomPeer;
  pendingMonitor?: RoomPeer;
}
