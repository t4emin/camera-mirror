import type { ConnectionState } from "@/types/connection";
import styles from "./ConnectionStatus.module.css";

interface ConnectionStatusProps {
  state: ConnectionState;
}

export function ConnectionStatus({ state }: ConnectionStatusProps) {
  return (
    <div className={styles.status} data-state={state.toLowerCase()}>
      <span aria-hidden="true" />
      {state}
    </div>
  );
}
