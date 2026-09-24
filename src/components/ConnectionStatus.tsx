import type { ConnectionState } from "@/types/connection";
import styles from "./ConnectionStatus.module.css";

interface ConnectionStatusProps {
  state: ConnectionState;
  compact?: boolean;
}

export function ConnectionStatus({ compact = false, state }: ConnectionStatusProps) {
  return (
    <div
      aria-label={state}
      className={compact ? styles.compactStatus : styles.status}
      data-state={state.toLowerCase()}
      title={state}
    >
      <span aria-hidden="true" />
      {compact ? null : state}
    </div>
  );
}
