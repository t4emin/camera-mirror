"use client";

import { useEffect, useMemo, useState } from "react";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { MonitorPreview } from "@/components/MonitorPreview";
import { WebRTCPeer } from "@/lib/webrtc/peer";
import { createPeerId, SignalingClient } from "@/lib/websocket/client";
import type { ConnectionState } from "@/types/connection";
import styles from "./monitor.module.css";

interface MonitorClientProps {
  roomId: string;
}

export function MonitorClient({ roomId }: MonitorClientProps) {
  const client = useMemo(() => new SignalingClient(), []);
  const [remoteStream, setRemoteStream] = useState<MediaStream>();
  const webRTCPeer = useMemo(
    () =>
      new WebRTCPeer({
        onSignal: (message) => client.sendSignal(message),
        onRemoteStream: (stream) => setRemoteStream(stream)
      }),
    [client]
  );
  const peerId = useMemo(() => createPeerId("monitor"), []);
  const [state, setState] = useState<ConnectionState>("CONNECTING");
  const [error, setError] = useState<string>();
  const [capturedImage, setCapturedImage] = useState<string>();

  const reconnect = () => {
    setError(undefined);
    setState("CONNECTING");
    setRemoteStream(undefined);
    webRTCPeer.close();

    void client
      .connect()
      .then(() => {
        client.joinRoom(roomId, "monitor", peerId);
      })
      .catch((connectError) => {
        setState("ERROR");
        setError(
          connectError instanceof Error
            ? connectError.message
            : "Unable to reconnect."
        );
      });
  };

  const capture = () => {
    try {
      client.sendCapture(roomId);
    } catch (captureError) {
      setState("ERROR");
      setError(
        captureError instanceof Error
          ? captureError.message
          : "Unable to send capture command."
      );
    }
  };

  useEffect(() => {
    const unsubscribe = client.onMessage((message) => {
      if (message.type === "room-state" && message.roomId === roomId) {
        setState(message.state);
      }

      if (message.type === "error") {
        setState("ERROR");
        setError(message.message);
      }

      if (message.type === "offer") {
        void webRTCPeer.acceptOffer(message).catch((webrtcError) => {
          setState("ERROR");
          setError(
            webrtcError instanceof Error
              ? webrtcError.message
              : "Unable to accept WebRTC stream."
          );
        });
      }

      if (message.type === "ice-candidate") {
        void webRTCPeer.addIceCandidate(message);
      }

      if (message.type === "capture-result" && message.roomId === roomId) {
        setCapturedImage(message.dataUrl);
      }
    });

    void client
      .connect()
      .then(() => {
        client.joinRoom(roomId, "monitor", peerId);
      })
      .catch((connectError) => {
        setState("ERROR");
        setError(
          connectError instanceof Error
            ? connectError.message
            : "Unable to connect."
        );
      });

    return () => {
      unsubscribe();
      webRTCPeer.close();
      client.close();
    };
  }, [client, peerId, roomId, webRTCPeer]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Phone B</p>
          <h1>Monitor</h1>
        </div>
        <ConnectionStatus state={state} />
      </header>

      <MonitorPreview stream={remoteStream} />

      {error ? <p className={styles.error}>{error}</p> : null}

      {state === "DISCONNECTED" || state === "ERROR" ? (
        <button className={styles.reconnectButton} onClick={reconnect}>
          Reconnect
        </button>
      ) : null}

      <div className={styles.controls}>
        <button
          className={styles.captureButton}
          disabled={state !== "CONNECTED" || !client.isConnected()}
          onClick={capture}
        >
          Capture
        </button>
      </div>

      {capturedImage ? (
        <section className={styles.preview}>
          <h2>Captured Preview</h2>
          <img src={capturedImage} alt="Captured camera frame" />
        </section>
      ) : null}
    </main>
  );
}
