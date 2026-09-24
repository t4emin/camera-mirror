import { MonitorClient } from "./MonitorClient";

interface MonitorPageProps {
  params: Promise<{
    roomId: string;
  }>;
}

export default async function MonitorPage({ params }: MonitorPageProps) {
  const { roomId } = await params;
  return <MonitorClient roomId={roomId} />;
}
