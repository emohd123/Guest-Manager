"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Settings2,
  Download,
} from "lucide-react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  toolbar?: React.ReactNode;
  pageSize?: number;
  totalCount?: number;
  isLoading?: boolean;
  rowSelection?: Record<string, boolean>;
  setRowSelection?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search...",
  toolbar,
  pageSize = 20,
  isLoading = false,
  rowSelection: externalRowSelection,
  setRowSelection: setExternalRowSelection,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  
  const [internalRowSelection, setInternalRowSelection] = useState<Record<string, boolean>>({});
  const rowSelection = externalRowSelection !== undefined ? externalRowSelection : internalRowSelection;
  const setRowSelection = setExternalRowSelection !== undefined ? setExternalRowSelection as any : setInternalRowSelection;

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getRowId: (row) => (row as { id: string }).id,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    initialState: {
      pagination: {
        pageSize,
      },
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between px-2">
        <div className="flex flex-1 items-center gap-4">
          {searchKey && (
            <div className="relative group lg:w-[400px]">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input
                placeholder={searchPlaceholder}
                value={
                  (table.getColumn(searchKey)?.getFilterValue() as string) ?? ""
                }
                onChange={(e) => {
                  const column = table.getColumn(searchKey);
                  if (column) {
                    column.setFilterValue(e.target.value);
                  }
                }}
                className="h-12 rounded-2xl border-border bg-card/80 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary transition-all"
              />
            </div>
          )}
          {toolbar}
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="hidden h-10 gap-2 rounded-xl border border-border bg-card/80 px-4 text-muted-foreground hover:bg-card hover:text-foreground sm:flex"
          >
            <Download className="h-4 w-4" /> Export
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-10 gap-2 rounded-xl border border-border bg-card/80 px-4 text-muted-foreground hover:bg-card hover:text-foreground">
                <Settings2 className="h-4 w-4" />
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px] rounded-2xl border border-border bg-popover p-2 text-popover-foreground">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide(),
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize rounded-lg focus:bg-accent/10 focus:text-popover-foreground"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-hidden rounded-[40px] border border-border bg-card/90 shadow-2xl backdrop-blur-3xl dark:bg-white/5 dark:border-white/10">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-border bg-muted/40 dark:border-white/10 dark:bg-white/5">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-none hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="h-14 first:pl-8 last:pr-8 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-64 text-center"
                  >
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-[0_0_20px_rgba(255,91,106,0.5)]" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Loading Data...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="group border-b border-border transition-all duration-300 last:border-0 hover:bg-muted/40 data-[state=selected]:bg-primary/10 dark:border-white/5 dark:hover:bg-white/5"
                  >
                    {row.getVisibleCells().map((cell) => (
                       <TableCell key={cell.id} className="py-5 first:pl-8 last:pr-8 font-medium text-foreground group-hover:text-foreground dark:text-white/80 dark:group-hover:text-white">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-64 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="mb-2 rounded-full bg-muted p-4 dark:bg-white/5">
                        <Search className="h-8 w-8 text-muted-foreground/50 dark:text-white/10" />
                      </div>
                      <p className="font-bold uppercase tracking-widest text-xs">No entries found</p>
                      <p className="text-[10px] lowercase text-muted-foreground/70">Try adjusting your filters</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination Container */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between px-4">
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card/80 p-1 dark:border-white/10 dark:bg-white/5">
          <div className="px-4 py-2 text-xs font-black uppercase tracking-tighter text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length > 0 ? (
              <span className="text-primary font-black">
                {table.getFilteredSelectedRowModel().rows.length} / {table.getFilteredRowModel().rows.length} SELECTED
              </span>
            ) : (
              <span>{table.getFilteredRowModel().rows.length} TOTAL ROWS</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6 lg:gap-8">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Rows per page</span>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger className="h-10 w-20 rounded-xl border-border bg-card text-foreground font-bold transition-all hover:bg-muted dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top" className="rounded-xl border border-border bg-popover text-popover-foreground">
                {[10, 20, 30, 50, 100].map((size) => (
                  <SelectItem key={size} value={`${size}`} className="rounded-lg font-bold focus:bg-accent/10 focus:text-popover-foreground">
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Page {table.getState().pagination.pageIndex + 1} of {Math.max(1, table.getPageCount())}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="h-10 w-10 rounded-xl border-border bg-card/80 p-0 text-muted-foreground hover:bg-card hover:text-foreground disabled:opacity-20 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                className="h-10 w-10 rounded-xl border-border bg-card/80 p-0 text-muted-foreground hover:bg-card hover:text-foreground disabled:opacity-20 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
