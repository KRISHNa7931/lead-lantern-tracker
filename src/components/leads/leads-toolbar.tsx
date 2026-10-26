import { CalendarClock, Plus, Search, X } from "lucide-react";

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
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export function LeadsToolbar({
  filters,
  onFiltersChange,
  onAddLead,
  sort,
  onSortChange,
}: LeadsToolbarProps) {
  const hasFilters = hasActiveFilters(filters);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full min-w-0 sm:w-auto sm:min-w-[180px] sm:flex-1">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.search}
          onChange={(event) =>
            onFiltersChange({ ...filters, search: event.target.value })
          }
          placeholder="Search by name or mobile"
          className="h-11 pl-9 md:h-9"
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
          className="h-11 w-[calc(50%-0.25rem)] sm:w-[150px] md:h-9"
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
          className="h-11 w-[calc(50%-0.25rem)] sm:w-[170px] md:h-9"
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

      <Select value={sort} onValueChange={(value) => onSortChange(value as SortOption)}>
        <SelectTrigger aria-label="Sort by" className="h-11 w-[calc(50%-0.25rem)] sm:w-[200px] md:h-9">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
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
        className={cn("h-11 w-[calc(50%-0.25rem)] sm:w-auto md:h-9")}
      >
        <CalendarClock className="size-4" />
        Due today
      </Button>

      {hasFilters && (
        <Button
          variant="ghost"
          onClick={() => onFiltersChange(EMPTY_FILTERS)}
          className="h-11 px-3 md:h-9"
        >
          <X className="size-4" />
          Clear filters
        </Button>
      )}

      <Button
        onClick={onAddLead}
        className="hidden h-9 md:inline-flex"
      >
        <Plus className="size-4" />
        Add lead
      </Button>
    </div>
  );
}
