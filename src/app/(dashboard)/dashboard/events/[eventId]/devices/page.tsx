"use client";

import { use, useMemo, useState, type ReactNode } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Archive,
  Copy,
  Pencil,
  RefreshCcw,
  Smartphone,
  Trash2,
  TriangleAlert,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/data-table";
import { toast } from "sonner";

type DeviceRow = {
  id: string;
  name: string;
  platform: string | null;
  model: string | null;
  station: string | null;
  status: "online" | "offline";
  battery: number | null;
  scannerBattery: number | null;
  appVersion: string | null;
  lastReportAt: Date | null;
  lastSyncAt: Date | null;
  computedOnline: boolean;
};

const iosUrl =
  process.env.NEXT_PUBLIC_MOBILE_IOS_URL ??
  "https://apps.apple.com/us/app/guest-manager-check-in/id1460267612";
const androidUrl = process.env.NEXT_PUBLIC_MOBILE_ANDROID_URL ?? "";
const checkinV2Enabled = process.env.NEXT_PUBLIC_CHECKIN_APP_V2_ENABLED !== "false";

export default function DevicesPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const utils = trpc.useUtils();
  const [latestQr, setLatestQr] = useState<{ token: string; expiresAt: string } | null>(null);

  const { data: listData, isLoading } = trpc.devices.list.useQuery({
    eventId,
    limit: 200,
    offset: 0,
  });
  const { data: stats } = trpc.devices.stats.useQuery({ eventId });
  const { data: pairingAccess } = trpc.devices.getPairingAccess.useQuery({ eventId });

  const rotatePairing = trpc.devices.rotatePairingAccess.useMutation({
    onSuccess: async () => {
      toast.success("Pairing credentials rotated");
      await utils.devices.getPairingAccess.invalidate({ eventId });
    },
  });

  const createQr = trpc.devices.createPairingQrToken.useMutation({
    onSuccess: (data) => {
      setLatestQr({ token: data.token, expiresAt: new Date(data.expiresAt).toISOString() });
      toast.success("QR token generated");
    },
  });

  const pingDevice = trpc.devices.ping.useMutation({
    onSuccess: () => toast.success("Ping command queued"),
  });

  const updateDevice = trpc.devices.update.useMutation({
    onSuccess: async () => {
      toast.success("Device updated");
      await Promise.all([
        utils.devices.list.invalidate({ eventId, limit: 200, offset: 0 }),
        utils.devices.stats.invalidate({ eventId }),
      ]);
    },
  });

  const archiveDevice = trpc.devices.archive.useMutation({
    onSuccess: async () => {
      toast.success("Device archived");
      await Promise.all([
        utils.devices.list.invalidate({ eventId, limit: 200, offset: 0 }),
        utils.devices.stats.invalidate({ eventId }),
      ]);
    },
  });

  const deleteDevice = trpc.devices.delete.useMutation({
    onSuccess: async () => {
      toast.success("Device deleted");
      await Promise.all([
        utils.devices.list.invalidate({ eventId, limit: 200, offset: 0 }),
        utils.devices.stats.invalidate({ eventId }),
      ]);
    },
  });

  const devices = useMemo(() => (listData?.devices ?? []) as DeviceRow[], [listData?.devices]);

  if (!checkinV2Enabled) {
    return (
      <Card className="p-6">
        <h1 className="text-xl font-semibold">Check-in App V2 is disabled</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enable `CHECKIN_APP_V2_ENABLED` to use device pairing and mobile controls.
        </p>
      </Card>
    );
  }

  async function copyText(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error(`Unable to copy ${label.toLowerCase()}`);
    }
  }

  const columns = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }: { row: { original: DeviceRow } }) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.platform ?? "mobile"} {row.original.model ? `• ${row.original.model}` : ""}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: { original: DeviceRow } }) => (
        <Badge variant={row.original.computedOnline ? "default" : "secondary"}>
          {row.original.computedOnline ? "Online" : "Offline"}
        </Badge>
      ),
    },
    {
      accessorKey: "station",
      header: "Station",
      cell: ({ row }: { row: { original: DeviceRow } }) => row.original.station ?? "—",
    },
    {
      accessorKey: "battery",
      header: "Battery",
      cell: ({ row }: { row: { original: DeviceRow } }) => (
        <div className="text-sm">
          Phone: {row.original.battery ?? "—"}%
          <br />
          Scanner: {row.original.scannerBattery ?? "—"}%
        </div>
      ),
    },
    {
      accessorKey: "lastReportAt",
      header: "Last Report",
      cell: ({ row }: { row: { original: DeviceRow } }) =>
        row.original.lastReportAt
          ? formatDistanceToNow(new Date(row.original.lastReportAt), { addSuffix: true })
          : "Never",
    },
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }: { row: { original: DeviceRow } }) => (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => pingDevice.mutate({ eventId, deviceId: row.original.id })}
          >
            Ping
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const newName = window.prompt("Device name", row.original.name);
              if (!newName) return;
              const newStation = window.prompt("Station", row.original.station ?? "");
              updateDevice.mutate({
                eventId,
                deviceId: row.original.id,
                patch: {
                  name: newName,
                  station: newStation ?? undefined,
                },
              });
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (!window.confirm("Archive this device?")) return;
              archiveDevice.mutate({ eventId, deviceId: row.original.id });
            }}
          >
            <Archive className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              if (!window.confirm("Delete this device permanently?")) return;
              deleteDevice.mutate({ eventId, deviceId: row.original.id });
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-8">
        <MetricCard icon={<Wifi className="h-4 w-4 text-green-600" />} label="Devices online" value={stats?.devicesOnline ?? 0} />
        <MetricCard icon={<WifiOff className="h-4 w-4 text-red-600" />} label="Devices offline" value={stats?.devicesOffline ?? 0} />
        <MetricCard icon={<TriangleAlert className="h-4 w-4 text-amber-600" />} label="Low battery" value={stats?.lowBattery ?? 0} />
        <MetricCard icon={<Zap className="h-4 w-4 text-green-600" />} label="Successful scans" value={stats?.successfulScans ?? 0} />
        <MetricCard icon={<TriangleAlert className="h-4 w-4 text-red-600" />} label="Unsuccessful scans" value={stats?.unsuccessfulScans ?? 0} />
        <MetricCard icon={<TriangleAlert className="h-4 w-4 text-red-600" />} label="No show" value={stats?.noShow ?? 0} />
        <MetricCard icon={<RefreshCcw className="h-4 w-4 text-amber-600" />} label="Checked out" value={stats?.checkedOut ?? 0} />
        <MetricCard icon={<Smartphone className="h-4 w-4 text-green-600" />} label="Checked in" value={stats?.checkedIn ?? 0} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Access Code + PIN</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded border p-3">
              <div className="text-muted-foreground">Access Code</div>
              <div className="mt-1 flex items-center justify-between">
                <span className="font-mono text-lg">{pairingAccess?.accessCode ?? "------"}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  disabled={!pairingAccess?.accessCode}
                  onClick={() => pairingAccess?.accessCode && copyText(pairingAccess.accessCode, "Access code")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="rounded border p-3">
              <div className="text-muted-foreground">PIN</div>
              <div className="mt-1 flex items-center justify-between">
                <span className="font-mono text-lg">{pairingAccess?.pin ?? "Rotate to reveal new PIN"}</span>
                {pairingAccess?.pin ? (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => pairingAccess?.pin && copyText(pairingAccess.pin, "PIN")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            </div>
            <Button
              className="w-full"
              onClick={() => rotatePairing.mutate({ eventId })}
              disabled={rotatePairing.isPending}
            >
              Rotate Code + PIN
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>QR Pairing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Button
              className="w-full"
              variant="outline"
              onClick={() => createQr.mutate({ eventId })}
              disabled={createQr.isPending}
            >
              Generate One-Time QR Token
            </Button>
            {latestQr ? (
              <div className="rounded border p-3">
                <div className="text-muted-foreground">Token</div>
                <div className="font-mono text-xs break-all mt-1">{latestQr.token}</div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Expires {formatDistanceToNow(new Date(latestQr.expiresAt), { addSuffix: true })}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Generate a short-lived token and render it in your QR flow.</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Mobile Apps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <a href={iosUrl} target="_blank" rel="noreferrer" className="block">
              <Button className="w-full">Download iPhone App</Button>
            </a>
            {androidUrl ? (
              <a href={androidUrl} target="_blank" rel="noreferrer" className="block">
                <Button className="w-full" variant="outline">
                  Download Android App
                </Button>
              </a>
            ) : (
              <Button className="w-full" variant="outline" disabled>
                Android Coming Soon
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={devices}
        searchKey="name"
        searchPlaceholder="Search devices..."
        isLoading={isLoading}
      />
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{label}</span>
          {icon}
        </div>
        <div className="mt-2 text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}
