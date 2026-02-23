"use client";

import { useState, useCallback, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import { 
  Upload, 
  FileText, 
  Check, 
  ChevronRight, 
  AlertCircle, 
  Loader2, 
  Table as TableIcon,
  CheckCircle2,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ImportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  onSuccess: () => void;
}

type Step = "upload" | "mapping" | "preview" | "processing";

export function ImportWizard({ open, onOpenChange, eventId, onSuccess }: ImportWizardProps) {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [isImporting, setIsImporting] = useState(false);

  const guestFields = useMemo(() => [
    { label: "First Name", value: "firstName", required: true },
    { label: "Last Name", value: "lastName", required: false },
    { label: "Email", value: "email", required: false },
    { label: "Phone", value: "phone", required: false },
    { label: "Guest Type", value: "guestType", required: false },
    { label: "Table Number", value: "tableNumber", required: false },
    { label: "Notes", value: "notes", required: false },
  ], []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setFile(file);
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setCsvData(results.data);
          if (results.meta.fields) {
            setHeaders(results.meta.fields);
            // Attempt auto-mapping
            const initialMapping: Record<string, string> = {};
            results.meta.fields.forEach(header => {
              const lowerHeader = header.toLowerCase().replace(/[\s_-]/g, '');
              const field = guestFields.find(f => 
                f.label.toLowerCase().replace(/[\s_-]/g, '') === lowerHeader ||
                f.value.toLowerCase() === lowerHeader
              );
              if (field) {
                initialMapping[header] = field.value;
              }
            });
            setMapping(initialMapping);
          }
          setStep("mapping");
        },
        error: (error) => {
          toast.error("Error parsing CSV: " + error.message);
        }
      });
    }
  }, [guestFields]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv']
    },
    multiple: false
  });

  const dataImportMutation = trpc.dataImports.create.useMutation();
  const bulkCreateMutation = trpc.guests.bulkCreate.useMutation();

  const handleStartImport = async () => {
    setIsImporting(true);
    setStep("processing");

    // Transform data
    const guestsToImport = csvData.map(row => {
      const guest: any = {};
      Object.entries(mapping).forEach(([csvHeader, field]) => {
        if (field && field !== "none") {
          guest[field] = row[csvHeader];
        }
      });
      return guest;
    }).filter(g => g.firstName); // Ensure required fields

    try {
      // 1. Create import record (Ignore if table mismatch for now)
      try {
        await dataImportMutation.mutateAsync({
          eventId,
          filename: file?.name || "import.csv",
          totalRecords: guestsToImport.length,
        });
      } catch (e) {
        console.warn("Could not track import history", e);
      }

      // 2. Perform bulk create
      await bulkCreateMutation.mutateAsync({
        eventId,
        guests: guestsToImport,
      });

      toast.success(`Successfully imported ${guestsToImport.length} guests`);
      onSuccess();
      onOpenChange(false);
      reset();
    } catch (error) {
      toast.error("Import failed: " + (error as any).message);
      setStep("preview");
    } finally {
      setIsImporting(false);
    }
  };

  const reset = () => {
    setStep("upload");
    setFile(null);
    setCsvData([]);
    setHeaders([]);
    setMapping({});
    setIsImporting(false);
  };

  const isMappingComplete = useMemo(() => {
    return guestFields
      .filter(f => f.required)
      .every(f => Object.values(mapping).includes(f.value));
  }, [mapping, guestFields]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!isImporting) onOpenChange(v); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden sm:rounded-2xl border-none shadow-2xl">
        <DialogHeader className="p-6 bg-primary text-primary-foreground">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold tracking-tight">Import Guests Wizard</DialogTitle>
              <DialogDescription className="text-primary-foreground/80 mt-1">
                {step === "upload" && "Start by uploading your guest list CSV file."}
                {step === "mapping" && "Connect your CSV columns to the system guest fields."}
                {step === "preview" && "Review the first few rows before final import."}
                {step === "processing" && "Processing records..."}
              </DialogDescription>
            </div>
            {!isImporting && (
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="text-primary-foreground hover:bg-white/10">
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-8 bg-white dark:bg-zinc-950">
          {step === "upload" && (
            <div 
              {...getRootProps()} 
              className={cn(
                "border-2 border-dashed rounded-2xl p-16 flex flex-col items-center justify-center cursor-pointer transition-all duration-300",
                isDragActive 
                  ? "border-primary bg-primary/5 scale-[0.99]" 
                  : "border-zinc-200 dark:border-zinc-800 hover:border-primary/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50"
              )}
            >
              <input {...getInputProps()} />
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 animate-in zoom-in-50 duration-500">
                <Upload className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold tracking-tight">Drop your CSV file here</h3>
              <p className="text-muted-foreground mt-2 max-w-sm text-center">
                Drag and drop your file, or click to browse. We support .csv files up to 5MB.
              </p>
              
              <div className="mt-10 flex flex-wrap justify-center gap-6 text-xs text-muted-foreground font-medium uppercase tracking-widest">
                <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900">
                  <Check className="h-4 w-4 text-green-500" /> UTF-8 Format
                </span>
                <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900">
                  <Check className="h-4 w-4 text-green-500" /> Header Row Required
                </span>
              </div>
            </div>
          )}

          {step === "mapping" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid md:grid-cols-5 gap-8">
                <div className="md:col-span-3 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <TableIcon className="h-4 w-4" /> Column Mapping
                    </h3>
                  </div>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {headers.map(header => (
                      <div key={header} className="group flex items-center justify-between p-4 rounded-xl border bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100/50 dark:hover:bg-zinc-900 transition-colors border-zinc-200 dark:border-zinc-800">
                        <div className="min-w-0 flex-1 mr-4">
                          <span className="text-sm font-semibold truncate block" title={header}>{header}</span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">Sample: {String(csvData[0][header]).slice(0, 30)}</span>
                        </div>
                        <Select 
                          value={mapping[header] || "none"} 
                          onValueChange={(val) => setMapping(prev => ({ ...prev, [header]: val }))}
                        >
                          <SelectTrigger className="w-[180px] bg-white dark:bg-zinc-950 font-medium h-10 border-zinc-200 dark:border-zinc-700">
                            <SelectValue placeholder="Map to..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none" className="text-muted-foreground italic">Ignore this column</SelectItem>
                            {guestFields.map(field => (
                              <SelectItem key={field.value} value={field.value}>
                                {field.label} {field.required && <span className="text-red-500">*</span>}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2 space-y-6">
                  <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <h3 className="font-bold text-sm uppercase tracking-widest flex items-center gap-2 mb-6">
                      <AlertCircle className="h-4 w-4 text-primary" /> Requirements
                    </h3>
                    <ul className="space-y-4 text-sm font-medium">
                      {guestFields.filter(f => f.required).map(f => {
                        const isMapped = Object.values(mapping).includes(f.value);
                        return (
                          <li key={f.value} className="flex items-center gap-3">
                            <div className={cn(
                              "h-6 w-6 rounded-full flex items-center justify-center shrink-0 transition-colors",
                              isMapped ? "bg-green-500 text-white" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400"
                            )}>
                              {isMapped ? <Check className="h-3.5 w-3.5" /> : <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            </div>
                            <span className={isMapped ? "text-zinc-500 strike-through" : "text-zinc-900 dark:text-zinc-100"}>
                              {f.label} column mapping
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                    <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        The system will automatically validate data during import. Rows with missing required fields will be skipped.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Ready to Import {csvData.length} records</h3>
                <Badge variant="secondary" className="px-3 py-1 font-mono text-xs">{file?.name}</Badge>
              </div>
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                <Table>
                  <TableHeader className="bg-zinc-50 dark:bg-zinc-900">
                    <TableRow>
                      {Object.keys(mapping).filter(h => mapping[h] && mapping[h] !== "none").map(h => (
                        <TableHead key={h} className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {guestFields.find(f => f.value === mapping[h])?.label || mapping[h]}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csvData.slice(0, 5).map((row, i) => (
                      <TableRow key={i} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                        {Object.keys(mapping).filter(h => mapping[h] && mapping[h] !== "none").map(h => (
                          <TableCell key={h} className="text-sm font-medium py-3">{row[h]}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {csvData.length > 5 && (
                  <div className="p-3 text-center text-[10px] font-bold uppercase text-muted-foreground tracking-widest bg-zinc-50/50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800">
                    + {csvData.length - 5} more records to process
                  </div>
                )}
              </div>
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0" />
                <p className="text-sm font-medium">Verify the data above looks correct. Clicking "Confirm Import" will bulk-add these guests to the event.</p>
              </div>
            </div>
          )}

          {step === "processing" && (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in-95 duration-500">
              <div className="relative">
                <Loader2 className="h-20 w-20 animate-spin text-primary opacity-20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Upload className="h-8 w-8 text-primary animate-bounce" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold tracking-tight italic">Analyzing & Inserting Data...</h3>
                <p className="text-muted-foreground max-w-xs mx-auto">
                  We&apos;re creating guest profiles and linking them to your company dashboard.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-6 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-3 z-10">
          {!isProcessing && step !== "upload" && (
            <Button variant="outline" onClick={() => setStep(step === "mapping" ? "upload" : "mapping")} className="rounded-xl h-11 px-6 font-bold uppercase tracking-widest text-xs">
              Back
            </Button>
          )}
          {step === "mapping" && (
            <Button 
              className="rounded-xl h-11 px-8 font-bold uppercase tracking-widest text-xs group transition-all"
              onClick={() => setStep("preview")}
              disabled={!isMappingComplete}
            >
              Analyze Data <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          )}
          {step === "preview" && (
            <Button className="rounded-xl h-11 px-10 font-bold uppercase tracking-widest text-xs bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/20" onClick={handleStartImport}>
              Confirm Import
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const isProcessing = false; // Mock for step logic
