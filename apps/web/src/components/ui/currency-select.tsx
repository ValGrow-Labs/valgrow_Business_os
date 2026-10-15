import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { CURRENCIES, getCurrency, type Currency } from "@/lib/currencies";
import { cn } from "@/lib/utils";

export interface CurrencySelectProps {
  value: string;
  onValueChange: (value: string) => void;
  id?: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  "aria-label"?: string;
}

export function CurrencySelect({
  value,
  onValueChange,
  id,
  disabled = false,
  className,
  placeholder = "Select currency",
  "aria-label": ariaLabel = "Select currency",
}: CurrencySelectProps) {
  const [open, setOpen] = React.useState(false);
  const selectedCurrency = getCurrency(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          role="combobox"
          aria-expanded={open}
          aria-label={ariaLabel}
          className={cn(
            "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-surface px-3 py-2 text-sm shadow-xs ring-offset-background cursor-pointer text-left focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
        >
          <span className="truncate">
            {selectedCurrency ? selectedCurrency.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[320px] sm:w-[380px] max-w-[calc(100vw-2rem)] p-0 z-[70] shadow-xl border border-border"
        align="start"
      >
        <Command
          filter={(itemValue, search) => {
            // cmdk passes itemValue (lowercase) and search (lowercase)
            if (!search) return 1;
            return itemValue.includes(search.toLowerCase().trim()) ? 1 : 0;
          }}
        >
          <CommandInput
            placeholder="Search code, name, or symbol..."
            className="h-9 text-xs sm:text-sm"
          />
          <CommandList className="max-h-60 sm:max-h-72 overflow-y-auto">
            <CommandEmpty className="py-6 text-center text-xs text-muted-foreground">
              No matching currency found.
            </CommandEmpty>
            <CommandGroup>
              {CURRENCIES.map((currency) => {
                const isSelected = currency.code === value;
                return (
                  <CommandItem
                    key={currency.code}
                    value={`${currency.code} ${currency.name} ${currency.symbol} ${currency.label}`}
                    onSelect={() => {
                      onValueChange(currency.code);
                      setOpen(false);
                    }}
                    className="flex items-center justify-between cursor-pointer py-2 px-2.5 text-xs sm:text-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Check
                        className={cn(
                          "h-3.5 w-3.5 shrink-0 text-primary",
                          isSelected ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <span className="truncate">{currency.label}</span>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
