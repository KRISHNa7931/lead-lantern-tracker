import { CalendarClock, FileUp, Plus, Search, X } from "lucide-react";

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
  DEFAULT_SORT,
  EMPTY_FILTERS,
  SERVICES,
  SORT_OPTIONS,
  STATUSES,
  hasActiveFilters,
  type LeadFilters,
  type SortOption,
} from "@/lib/leads";
import { cn } from "@/lib/utils";

export type { LeadFilters };


interface LeadsToolbarProps {
  filters: LeadFilters;
  onFiltersChange: (filters: LeadFilters) => void;
  onAddLead: () => void;
  onImport: () => void;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

const controlH = "h-9";
const controlRadius = "rounded-lg";

export function LeadsToolbar({
  filters,
  onFiltersChange,
  onAddLead,
  onImport,
  sort,
  onSortChange,
}: LeadsToolbarProps) {
  const hasFilters = hasActiveFilters(filters);
  const hasSortOrFilters = hasFilters || sort !== DEFAULT_SORT;

  return (
    <div className="space-y-2 md:space-y-0">
      {/* ── Desktop: one tidy row ── */}
      <div className="hidden items-center gap-2 md:flex">
        {/* Search — wider, takes up remaining space */}
        <div className="relative min-w-0 flex-1">
          <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(event) =>
              onFiltersChange({ ...filters, search: event.target.value })
            }
            placeholder="Search by name or mobile"
            className={cn(controlH, controlRadius, "pl-8 text-[13px]")}
            aria-label="Search leads by name or mobile"
          />
        </div>

        <Select
          value={filters.status ?? "all"}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, status: value === "all" ? null : value })
          }
        >
          <SelectTrigger
            aria-label="Filter by status"
            className={cn(controlH, controlRadius, "w-[140px] text-[13px]")}
          >
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.service ?? "all"}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, service: value === "all" ? null : value })
          }
        >
          <SelectTrigger
            aria-label="Filter by service"
            className={cn(controlH, controlRadius, "w-[160px] text-[13px]")}
          >
            <SelectValue placeholder="Service" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All services</SelectItem>
            {SERVICES.map((service) => (
              <SelectItem key={service} value={service}>
                {service}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={sort || "__default__"}
          onValueChange={(value) => onSortChange(value === "__default__" ? DEFAULT_SORT : value as SortOption)}
        >
          <SelectTrigger aria-label="Sort by" className={cn(controlH, controlRadius, "w-[160px] text-[13px]")}>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__default__" className="text-muted-foreground">Sort by</SelectItem>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant={filters.due === "today" ? "default" : "outline"}
          aria-pressed={filters.due === "today"}
          onClick={() =>
            onFiltersChange({ ...filters, due: filters.due === "today" ? null : "today" })
          }
          className={cn(controlH, controlRadius, "gap-1.5 text-[13px] px-3")}
        >
          <CalendarClock className="size-3.5" />
          Due today
        </Button>

        {hasSortOrFilters && (
          <Button
            variant="ghost"
            onClick={() => {
              onFiltersChange(EMPTY_FILTERS);
              onSortChange(DEFAULT_SORT);
            }}
            className={cn(controlH, controlRadius, "gap-1.5 px-2.5 text-[13px] text-muted-foreground")}
          >
            <X className="size-3.5" />
            Clear
          </Button>
        )}

        <Button
          variant="outline"
          onClick={onImport}
          className={cn(controlH, controlRadius, "gap-1.5 text-[13px] px-3")}
        >
          <FileUp className="size-3.5" />
          Import
        </Button>

        {/* Primary CTA — accent color, right side */}
        <Button
          onClick={onAddLead}
          className={cn(controlH, controlRadius, "gap-1.5 text-[13px] px-3.5")}
        >
          <Plus className="size-3.5" />
          Add lead
        </Button>
      </div>

      {/* ── Mobile: search full-width, filters 2-col grid ── */}
      <div className="flex flex-col gap-2 md:hidden">
        <div className="relative">
          <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(event) =>
              onFiltersChange({ ...filters, search: event.target.value })
            }
            placeholder="Search by name or mobile"
            className="h-10 rounded-lg pl-8 text-[13px]"
            aria-label="Search leads by name or mobile"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Select
            value={filters.status ?? "all"}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, status: value === "all" ? null : value })
            }
          >
            <SelectTrigger aria-label="Filter by status" className="h-10 rounded-lg text-[13px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.service ?? "all"}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, service: value === "all" ? null : value })
            }
          >
            <SelectTrigger aria-label="Filter by service" className="h-10 rounded-lg text-[13px]">
              <SelectValue placeholder="Service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All services</SelectItem>
              {SERVICES.map((service) => (
                <SelectItem key={service} value={service}>
                  {service}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={sort || "__default__"}
            onValueChange={(value) => onSortChange(value === "__default__" ? DEFAULT_SORT : value as SortOption)}
          >
            <SelectTrigger aria-label="Sort by" className="h-10 rounded-lg text-[13px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__default__" className="text-muted-foreground">Sort by</SelectItem>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant={filters.due === "today" ? "default" : "outline"}
            aria-pressed={filters.due === "today"}
            onClick={() =>
              onFiltersChange({ ...filters, due: filters.due === "today" ? null : "today" })
            }
            className="h-10 rounded-lg gap-1.5 text-[13px]"
          >
            <CalendarClock className="size-3.5" />
            Due today
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onImport}
            className="h-9 flex-1 rounded-lg gap-1.5 text-[13px]"
          >
            <FileUp className="size-3.5" />
            Import
          </Button>

          {hasSortOrFilters && (
            <Button
              variant="ghost"
              onClick={() => {
                onFiltersChange(EMPTY_FILTERS);
                onSortChange(DEFAULT_SORT);
              }}
              className="h-9 rounded-lg gap-1.5 px-2.5 text-[13px] text-muted-foreground"
            >
              <X className="size-3.5" />
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
