import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { COUNTRIES, getCountry, type Country } from "@/lib/countries";
import { cn } from "@/lib/utils";

export interface CountrySelectProps {
  value: string;
  onValueChange: (value: string) => void;
  id?: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  "aria-label"?: string;
  modal?: boolean;
}

export function CountrySelect({
  value,
  onValueChange,
  id,
  disabled = false,
  className,
  placeholder = "Select country",
  "aria-label": ariaLabel = "Select country",
  modal = true,
}: CountrySelectProps) {
  const [open, setOpen] = React.useState(false);
  const selectedCountry = getCountry(value);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={modal}>
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
          <span className="truncate flex items-center gap-2">
            {selectedCountry ? (
              <>
                <span className="text-base leading-none select-none" aria-hidden="true">
                  {selectedCountry.flag}
                </span>
                <span>{selectedCountry.name}</span>
              </>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[320px] sm:w-[380px] max-w-[calc(100vw-2rem)] p-0 z-[70] shadow-xl border border-border"
        align="start"
        onWheel={(e) => e.stopPropagation()}
      >
        <Command
          filter={(itemValue, search) => {
            if (!search) return 1;
            const cleanSearch = search.toLowerCase().trim();
            return itemValue.includes(cleanSearch) ? 1 : 0;
          }}
          onWheel={(e) => e.stopPropagation()}
        >
          <CommandInput
            placeholder="Search 195 countries by name, code or alias..."
            className="h-9 text-xs sm:text-sm"
          />
          <CommandList
            className="max-h-60 sm:max-h-72 overflow-y-auto overscroll-contain"
            onWheel={(e) => e.stopPropagation()}
          >
            <CommandEmpty className="py-6 text-center text-xs text-muted-foreground">
              No matching country found.
            </CommandEmpty>
            <CommandGroup>
              {COUNTRIES.map((country) => {
                const isSelected =
                  selectedCountry?.name === country.name ||
                  value?.trim().toLowerCase() === country.name.toLowerCase() ||
                  value?.trim().toLowerCase() === country.code.toLowerCase();

                const searchValue = `${country.name.toLowerCase()} ${country.officialName.toLowerCase()} ${country.code.toLowerCase()} ${
                  country.aliases?.join(" ").toLowerCase() || ""
                }`;

                return (
                  <CommandItem
                    key={country.code}
                    value={searchValue}
                    onSelect={() => {
                      onValueChange(country.name);
                      setOpen(false);
                    }}
                    className="flex items-center justify-between cursor-pointer py-2 px-2.5 text-xs sm:text-sm"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="text-base leading-none shrink-0" aria-hidden="true">
                        {country.flag}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="truncate font-medium text-foreground">{country.name}</span>
                        {country.officialName !== country.name && (
                          <span className="truncate text-[10px] text-muted-foreground">
                            {country.officialName}
                          </span>
                        )}
                      </div>
                    </div>
                    <Check
                      className={cn(
                        "ml-2 h-4 w-4 shrink-0 text-primary",
                        isSelected ? "opacity-100" : "opacity-0",
                      )}
                    />
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
