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
  const [pendingMonitorId, setPendingMonitorId] = useState<string>();
  const [capturedUrl, setCapturedUrl] = useState<string>();
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

  const capture = useCallback(async () => {
    if (!stream || !videoRef.current) {
      return;
    }

    try {
      const result = await captureFromStream(stream, videoRef.current);
      const nextUrl = URL.createObjectURL(result.blob);
      setCapturedUrl((currentUrl) => {
        if (currentUrl) {
          URL.revokeObjectURL(currentUrl);
        }

        return nextUrl;
      });
    } catch (captureError) {
      setError(
        captureError instanceof Error
          ? captureError.message
          : "Unable to capture image."
      );
    }
  }, [stream]);

  useEffect(() => {
    const unsubscribe = signalingClient.onMessage((message) => {
      if (message.type === "room-created") {
        roomIdRef.current = message.roomId;
        setRoomId(message.roomId);
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

  useEffect(() => {
    return () => {
      if (capturedUrl) {
        URL.revokeObjectURL(capturedUrl);
      }
    };
  }, [capturedUrl]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Phone A</p>
          <h1>Camera</h1>
        </div>
        <ConnectionStatus state={state} />
      </header>

      <CameraPreview
        stream={stream}
        onVideoReady={(videoElement) => {
          videoRef.current = videoElement;
        }}
      />

      {error ? <p className={styles.error}>{error}</p> : null}

      {roomId ? <PairQRCode roomId={roomId} /> : null}

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
        <button className={styles.primaryButton} onClick={startCamera}>
          Start Camera
        </button>
        <button
          className={styles.secondaryButton}
          disabled={!stream}
          onClick={capture}
        >
          Test Capture
        </button>
      </div>

      {capturedUrl ? (
        <section className={styles.preview}>
          <h2>Captured Preview</h2>
          <img src={capturedUrl} alt="Captured camera frame" />
        </section>
      ) : null}
    </main>
  );
}
