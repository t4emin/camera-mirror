"use client";

import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";
import styles from "./PairQRCode.module.css";

interface PairQRCodeProps {
  roomId: string;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export function PairQRCode({ roomId, open, onOpen, onClose }: PairQRCodeProps) {
  const [qrUrl, setQrUrl] = useState<string>();
  const [monitorUrl, setMonitorUrl] = useState<string>();
  const [ready, setReady] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const expanded = open && ready;

  // Paint the collapsed bar first, including when room creation auto-opens it.
  useEffect(() => {
    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => setReady(true));
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const url = `${window.location.origin}/monitor/${roomId}`;
    setMonitorUrl(url);
    setQrUrl(undefined);
    void QRCode.toDataURL(url, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 320,
      color: { dark: "#07110f", light: "#f7fafc" }
    }).then((result) => {
      if (!cancelled) setQrUrl(result);
    });
    return () => { cancelled = true; };
  }, [roomId]);

  useEffect(() => {
    if (!expanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    buttonRef.current?.focus({ preventScroll: true });
    return () => { document.body.style.overflow = previousOverflow; };
  }, [expanded]);

  useEffect(() => {
    if (!expanded) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        event.preventDefault();
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [expanded, onClose]);

  return (
    <>
      <div
        aria-hidden="true"
        className={`${styles.backdrop} ${expanded ? styles.backdropVisible : ""}`}
        onClick={onClose}
      />
      <section
        className={`${styles.panel} ${expanded ? styles.expanded : ""}`}
        role={expanded ? "dialog" : undefined}
        aria-modal={expanded ? true : undefined}
        aria-label={`Pair with room ${roomId}`}
      >
        <div className={styles.heading}>
          <p className={styles.label}>Room</p>
          <p className={styles.roomId}>{roomId}</p>
        </div>
        <button
          ref={buttonRef}
          type="button"
          className={styles.toggle}
          aria-haspopup={expanded ? undefined : "dialog"}
          aria-expanded={expanded}
          onClick={expanded ? onClose : onOpen}
        >
          {expanded ? "Close" : "Show QR"}
        </button>
        <div className={styles.details} aria-hidden={!expanded}>
          {qrUrl ? (
            <img className={styles.qr} src={qrUrl} alt={`QR code for room ${roomId}`} />
          ) : (
            <div className={styles.qr} />
          )}
          <p className={styles.url}>{monitorUrl}</p>
        </div>
      </section>
    </>
  );
}
