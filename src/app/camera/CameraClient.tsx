"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CameraPreview } from "@/components/CameraPreview";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { PairQRCode } from "@/components/PairQRCode";
import { CameraController } from "@/lib/camera/cameraController";
import { blobToDataUrl, captureFromStream } from "@/lib/camera/capture";
import { WebRTCPeer } from "@/lib/webrtc/peer";
import { createPeerId, SignalingClient } from "@/lib/websocket/client";
import type { ConnectionState } from "@/types/connection";
import styles from "./camera.module.css";

export function CameraClient() {
  const controller = useMemo(() => new CameraController(), []);
  const signalingClient = useMemo(() => new SignalingClient(), []);
  const webRTCPeer = useMemo(
    () =>
      new WebRTCPeer({
        onSignal: (message) => signalingClient.sendSignal(message)
      }),
    [signalingClient]
  );
  const peerId = useMemo(() => createPeerId("camera"), []);
  const [stream, setStream] = useState<MediaStream>();
  const [state, setState] = useState<ConnectionState>("WAITING");
  const [error, setError] = useState<string>();
  const [roomId, setRoomId] = useState<string>();
  const [isPairModalOpen, setIsPairModalOpen] = useState(false);
  const [pendingMonitorId, setPendingMonitorId] = useState<string>();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const roomIdRef = useRef<string | undefined>(undefined);
  const streamRef = useRef<MediaStream | undefined>(undefined);
  const offerStartedRef = useRef(false);

  const startCamera = useCallback(async () => {
    setError(undefined);
    setState("CONNECTING");
    setRoomId(undefined);
    setPendingMonitorId(undefined);
    offerStartedRef.current = false;

    try {
      const nextStream = await controller.start({ facingMode: "environment" });
      setStream(nextStream);
      streamRef.current = nextStream;
      setState("WAITING");
      await signalingClient.connect();
      signalingClient.createRoom(peerId);
    } catch (startError) {
      setState("ERROR");
      setError(
        startError instanceof Error
          ? startError.message
          : "Unable to start camera."
      );
    }
  }, [controller, peerId, signalingClient]);

  useEffect(() => {
    const unsubscribe = signalingClient.onMessage((message) => {
      if (message.type === "room-created") {
        roomIdRef.current = message.roomId;
        setRoomId(message.roomId);
        setIsPairModalOpen(true);
      }

      if (message.type === "room-state") {
        setState(message.state);

        if (message.state === "WAITING" || message.state === "DISCONNECTED") {
          offerStartedRef.current = false;
          webRTCPeer.close();
        }
      }

      if (message.type === "pair-request") {
        setPendingMonitorId(message.peerId);
      }

      if (
        message.type === "room-state" &&
        message.state === "CONNECTED" &&
        roomIdRef.current &&
        streamRef.current &&
        !offerStartedRef.current
      ) {
        offerStartedRef.current = true;
        void webRTCPeer
          .startCameraOffer(roomIdRef.current, streamRef.current)
          .catch((webrtcError) => {
            setState("ERROR");
            setError(
              webrtcError instanceof Error
                ? webrtcError.message
                : "Unable to start WebRTC stream."
            );
          });
      }

      if (message.type === "answer") {
        void webRTCPeer.acceptAnswer(message);
      }

      if (message.type === "ice-candidate") {
        void webRTCPeer.addIceCandidate(message);
      }

      if (
        message.type === "capture" &&
        roomIdRef.current &&
        streamRef.current &&
        videoRef.current
      ) {
        void captureFromStream(streamRef.current, videoRef.current)
          .then(async (result) => {
            signalingClient.sendCaptureResult({
              roomId: roomIdRef.current as string,
              dataUrl: await blobToDataUrl(result.blob),
              mimeType: result.mimeType,
              source: result.source
            });
          })
          .catch((captureError) => {
            setError(
              captureError instanceof Error
                ? captureError.message
                : "Unable to capture image."
            );
          });
      }

      if (message.type === "error") {
        setState("ERROR");
        setError(message.message);
      }
    });

    return () => {
      unsubscribe();
      webRTCPeer.close();
      signalingClient.close();
      controller.stop();
    };
  }, [controller, signalingClient, webRTCPeer]);

  return (
    <main className={styles.page}>
      <div className={styles.statusDock}>
        <ConnectionStatus compact state={state} />
      </div>

      <CameraPreview
        stream={stream}
        onVideoReady={(videoElement) => {
          videoRef.current = videoElement;
        }}
      />

      {error ? <p className={styles.error}>{error}</p> : null}

      {roomId ? (
        <PairQRCode
          roomId={roomId}
          open={isPairModalOpen}
          onOpen={() => setIsPairModalOpen(true)}
          onClose={() => setIsPairModalOpen(false)}
        />
      ) : null}

      {roomId && pendingMonitorId ? (
        <section className={styles.pairRequest}>
          <div>
            <p>Monitor wants to connect</p>
            <span>Confirm this request to start the live feed.</span>
          </div>
          <button
            onClick={() => {
              signalingClient.approveMonitor(roomId, peerId);
              setPendingMonitorId(undefined);
            }}
          >
            Accept
          </button>
        </section>
      ) : null}

      <div className={styles.controls}>
        {!stream ? (
          <button className={styles.primaryButton} onClick={startCamera}>
            Start Camera
          </button>
        ) : null}
      </div>
    </main>
  );
}
