import { Plus, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SERVICES, STATUSES } from "@/lib/leads";

export interface LeadFilters {
  search: string;
  status: string | null;
  service: string | null;
}

interface LeadsToolbarProps {
  filters: LeadFilters;
  onFiltersChange: (filters: LeadFilters) => void;
  onAddLead: () => void;
}

export function LeadsToolbar({
  filters,
  onFiltersChange,
  onAddLead,
}: LeadsToolbarProps) {
  const hasFilters =
    filters.search.trim() !== "" ||
    filters.status !== null ||
    filters.service !== null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[180px] flex-1">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.search}
          onChange={(event) =>
            onFiltersChange({ ...filters, search: event.target.value })
          }
          placeholder="Search name or mobile…"
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
          className="h-11 w-[150px] md:h-9"
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
          className="h-11 w-[170px] md:h-9"
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

      <Button
        variant="ghost"
        onClick={() =>
          onFiltersChange({ search: "", status: null, service: null })
        }
        disabled={!hasFilters}
        className="h-11 px-3 md:h-9"
      >
        <X className="size-4" />
        Clear filters
      </Button>

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
