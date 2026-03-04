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
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30 transition-colors group-focus-within:text-primary" />
              <Input
                placeholder={searchPlaceholder}
                value={
                  (table.getColumn(searchKey)?.getFilterValue() as string) ?? ""
                }
                onChange={(e) =>
                  table.getColumn(searchKey)?.setFilterValue(e.target.value)
                }
                className="pl-12 h-12 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-white/20 focus-visible:ring-primary focus-visible:border-primary transition-all pr-4"
              />
            </div>
          )}
          {toolbar}
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-10 px-4 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white hidden sm:flex gap-2"
          >
            <Download className="h-4 w-4" /> Export
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-10 px-4 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white gap-2">
                <Settings2 className="h-4 w-4" />
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px] p-2 rounded-2xl bg-[#1A1C30] border-white/10 text-white">
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
                      className="capitalize rounded-lg focus:bg-white/10 focus:text-white"
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
      <div className="rounded-[40px] bg-white/5 border border-white/10 shadow-2xl overflow-hidden backdrop-blur-3xl">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-white/5 border-b border-white/10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-none hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="text-white/40 h-14 first:pl-8 last:pr-8 font-bold text-xs uppercase tracking-widest">
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
                      <p className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Loading Data...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="border-b border-white/5 last:border-0 group transition-all duration-300 hover:bg-white/5 data-[state=selected]:bg-primary/10"
                  >
                    {row.getVisibleCells().map((cell) => (
                       <TableCell key={cell.id} className="py-5 first:pl-8 last:pr-8 text-white/80 group-hover:text-white font-medium">
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
                    className="h-64 text-center text-white/20"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="p-4 rounded-full bg-white/5 mb-2">
                        <Search className="h-8 w-8 text-white/10" />
                      </div>
                      <p className="font-bold uppercase tracking-widest text-xs">No entries found</p>
                      <p className="text-[10px] text-white/5 lowercase">Try adjusting your filters</p>
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
        <div className="flex items-center gap-4 bg-white/5 p-1 rounded-2xl">
          <div className="px-4 py-2 text-xs font-black uppercase text-white/30 tracking-tighter">
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
            <span className="text-[10px] font-black uppercase text-white/20 tracking-widest">Rows per page</span>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger className="h-10 w-20 rounded-xl bg-white/5 border-white/10 text-white font-bold transition-all hover:bg-white/10">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top" className="bg-[#1A1C30] border-white/10 text-white rounded-xl">
                {[10, 20, 30, 50, 100].map((size) => (
                  <SelectItem key={size} value={`${size}`} className="rounded-lg focus:bg-white/10 focus:text-white font-bold">
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black uppercase text-white/20 tracking-widest">
              Page {table.getState().pagination.pageIndex + 1} of {Math.max(1, table.getPageCount())}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="h-10 w-10 p-0 rounded-xl bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-20"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                className="h-10 w-10 p-0 rounded-xl bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white disabled:opacity-20"
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
