"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, ClipboardPaste, ArrowRight, ArrowLeft, Check } from "lucide-react";

type ParsedGuest = {
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  guestType?: string;
  tableNumber?: string;
};

type ColumnMapping = {
  [key: string]: string; // csv column -> guest field
};

const GUEST_FIELDS = [
  { value: "firstName", label: "First Name" },
  { value: "lastName", label: "Last Name" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "guestType", label: "Guest Type" },
  { value: "tableNumber", label: "Table Number" },
  { value: "__skip", label: "-- Skip --" },
];

interface GuestImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (guests: ParsedGuest[]) => void;
  isImporting?: boolean;
}

export function GuestImportDialog({
  open,
  onOpenChange,
  onImport,
  isImporting = false,
}: GuestImportDialogProps) {
  const [step, setStep] = useState<"source" | "mapping" | "preview">("source");
  const [rawData, setRawData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [pasteText, setPasteText] = useState("");

  const resetState = useCallback(() => {
    setStep("source");
    setRawData([]);
    setHeaders([]);
    setMapping({});
    setPasteText("");
  }, []);

  const handleClose = (val: boolean) => {
    if (!val) resetState();
    onOpenChange(val);
  };

  const parseCSV = (text: string): string[][] => {
    const lines = text.split("\n").filter((l) => l.trim());
    return lines.map((line) => {
      // Simple CSV parsing (handles quoted values)
      const result: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if ((char === "," || char === "\t") && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = parseCSV(text);
      if (rows.length > 0) {
        setHeaders(rows[0]);
        setRawData(rows.slice(1));
        autoMapColumns(rows[0]);
        setStep("mapping");
      }
    };
    reader.readAsText(file);
  };

  const handlePaste = () => {
    if (!pasteText.trim()) return;
    const rows = parseCSV(pasteText);
    if (rows.length > 0) {
      setHeaders(rows[0]);
      setRawData(rows.slice(1));
      autoMapColumns(rows[0]);
      setStep("mapping");
    }
  };

  const autoMapColumns = (cols: string[]) => {
    const newMapping: ColumnMapping = {};
    cols.forEach((col) => {
      const lower = col.toLowerCase().replace(/[^a-z]/g, "");
      if (lower.includes("first") || lower === "name") {
        newMapping[col] = "firstName";
      } else if (lower.includes("last") || lower === "surname") {
        newMapping[col] = "lastName";
      } else if (lower.includes("email")) {
        newMapping[col] = "email";
      } else if (lower.includes("phone") || lower.includes("mobile")) {
        newMapping[col] = "phone";
      } else if (lower.includes("type") || lower.includes("vip")) {
        newMapping[col] = "guestType";
      } else if (lower.includes("table")) {
        newMapping[col] = "tableNumber";
      } else {
        newMapping[col] = "__skip";
      }
    });
    setMapping(newMapping);
  };

  const getMappedGuests = (): ParsedGuest[] => {
    return rawData
      .filter((row) => row.some((cell) => cell.trim()))
      .map((row) => {
        const guest: Record<string, string> = {};
        headers.forEach((header, i) => {
          const field = mapping[header];
          if (field && field !== "__skip" && row[i]) {
            guest[field] = row[i];
          }
        });
        return guest as unknown as ParsedGuest;
      })
      .filter((g) => g.firstName);
  };

  const handleImport = () => {
    const mapped = getMappedGuests();
    onImport(mapped);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Guests</DialogTitle>
          <DialogDescription>
            {step === "source" && "Upload a CSV file or paste data from a spreadsheet."}
            {step === "mapping" && "Map your columns to guest fields."}
            {step === "preview" && "Review the data before importing."}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Source */}
        {step === "source" && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed p-6 transition-colors hover:border-primary hover:bg-primary/5">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <div className="text-center">
                  <p className="font-medium">Upload File</p>
                  <p className="text-xs text-muted-foreground">CSV or TXT file</p>
                </div>
                <Input
                  type="file"
                  accept=".csv,.txt,.tsv"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>

              <div className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed p-6">
                <ClipboardPaste className="h-8 w-8 text-muted-foreground" />
                <div className="text-center">
                  <p className="font-medium">Paste Data</p>
                  <p className="text-xs text-muted-foreground">
                    From a spreadsheet
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Paste from spreadsheet (tab or comma separated)</Label>
              <Textarea
                placeholder="First Name,Last Name,Email&#10;John,Doe,john@example.com&#10;Jane,Smith,jane@example.com"
                rows={6}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
              />
              <Button
                onClick={handlePaste}
                disabled={!pasteText.trim()}
                className="gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" /> Parse Data
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Column Mapping */}
        {step === "mapping" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Found {rawData.length} rows and {headers.length} columns.
            </p>

            <div className="space-y-3">
              {headers.map((header) => (
                <div
                  key={header}
                  className="flex items-center gap-4"
                >
                  <div className="w-1/3">
                    <Badge variant="outline">{header}</Badge>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Select
                    value={mapping[header] || "__skip"}
                    onValueChange={(v) =>
                      setMapping((m) => ({ ...m, [header]: v }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GUEST_FIELDS.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep("source")}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={() => setStep("preview")} className="gap-2">
                Preview <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === "preview" && (
          <div className="space-y-4">
            {(() => {
              const mapped = getMappedGuests();
              return (
                <>
                  <p className="text-sm text-muted-foreground">
                    <strong>{mapped.length}</strong> guests ready to import.
                  </p>

                  <div className="max-h-64 overflow-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>First Name</TableHead>
                          <TableHead>Last Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mapped.slice(0, 20).map((g, i) => (
                          <TableRow key={i}>
                            <TableCell>{g.firstName}</TableCell>
                            <TableCell>{g.lastName ?? "-"}</TableCell>
                            <TableCell>{g.email ?? "-"}</TableCell>
                            <TableCell>{g.phone ?? "-"}</TableCell>
                          </TableRow>
                        ))}
                        {mapped.length > 20 && (
                          <TableRow>
                            <TableCell
                              colSpan={4}
                              className="text-center text-muted-foreground"
                            >
                              ... and {mapped.length - 20} more
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setStep("mapping")}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                    <Button
                      onClick={handleImport}
                      disabled={isImporting || mapped.length === 0}
                      className="gap-2"
                    >
                      <Check className="h-4 w-4" />
                      {isImporting
                        ? "Importing..."
                        : `Import ${mapped.length} Guests`}
                    </Button>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
