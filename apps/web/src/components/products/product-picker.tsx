import { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  X,
  ChevronsUpDown,
  Check,
  Loader2,
  Plus,
  Package,
  Boxes,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useProducts, type ProductItem } from "@/hooks/queries/useProducts";
import { useCategories } from "@/hooks/queries/useCategories";
import { cn } from "@/lib/utils";
import { useActiveCurrency } from "@/hooks/useActiveCurrency";

export interface ProductPickerProps {
  selectedProductId: string;
  onSelectProduct: (product: ProductItem) => void;
  selectedProductDetails?: ProductItem | null | undefined;
  onClear?: () => void;
  onCreateProductClick?: () => void;
  disabled?: boolean;
  id?: string;
  className?: string;
  placeholder?: string;
}

export function ProductPicker({
  selectedProductId,
  onSelectProduct,
  selectedProductDetails,
  onClear,
  onCreateProductClick,
  disabled = false,
  id,
  className,
  placeholder = "Select Product...",
}: ProductPickerProps) {
  const [open, setOpen] = useState(false);
  const { formatMoney } = useActiveCurrency();

  // Search & Filter State
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1); // Reset page on search change
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset page when category changes
  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    setPage(1);
  };

  // Query categories
  const { data: categories = [], isLoading: isCategoriesLoading } = useCategories({
    status: "ACTIVE",
  });
  const activeCategories = useMemo(
    () => categories.filter((c) => c.status === "ACTIVE" || !c.status),
    [categories],
  );

  // Query products with server-side pagination, search & category filter
  const {
    data: productsData,
    isLoading: isProductsLoading,
    isFetching: isProductsFetching,
    isError,
    error,
    refetch,
  } = useProducts({
    page,
    limit: pageSize,
    search: debouncedSearch || undefined,
    categoryId: selectedCategory !== "ALL" ? selectedCategory : undefined,
    status: "ACTIVE",
    sortBy: "name",
    sortOrder: "asc",
  });

  const products = productsData?.data || [];
  const meta = productsData?.meta || {
    total: 0,
    page: 1,
    limit: pageSize,
    totalPages: 1,
  };

  const isDebouncing = searchInput.trim() !== debouncedSearch;
  const isSearching = isProductsLoading || isProductsFetching || isDebouncing;
  const isInitialLoading = isProductsLoading && !productsData;

  // Determine label for the trigger button
  const displayProduct = useMemo(() => {
    if (selectedProductDetails && selectedProductDetails.id === selectedProductId) {
      return selectedProductDetails;
    }
    return products.find((p) => p.id === selectedProductId);
  }, [selectedProductId, selectedProductDetails, products]);

  // Calculate total stock for a product from stockLevels
  const calculateStock = (p: ProductItem): number | null => {
    if (!p.stockLevels || p.stockLevels.length === 0) return null;
    return p.stockLevels.reduce((sum, sl) => sum + Number(sl.onHand || 0), 0);
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <div className={cn("relative flex items-center", className)}>
        <PopoverTrigger asChild>
          <button
            type="button"
            id={id}
            disabled={disabled}
            role="combobox"
            aria-expanded={open}
            aria-haspopup="listbox"
            className={cn(
              "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-xs ring-offset-background cursor-pointer text-left transition-colors hover:bg-muted/30 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50",
              selectedProductId ? "text-foreground font-medium" : "text-muted-foreground",
            )}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
              <Package className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              {displayProduct ? (
                <span className="truncate">
                  {displayProduct.name}{" "}
                  {displayProduct.sku && (
                    <span className="text-muted-foreground font-normal">
                      ({displayProduct.sku})
                    </span>
                  )}
                  {displayProduct.costPrice !== undefined && (
                    <span className="text-primary font-semibold ml-1">
                      • {formatMoney(displayProduct.costPrice || 0)}
                    </span>
                  )}
                </span>
              ) : (
                <span className="truncate">{placeholder}</span>
              )}
            </div>
            <ChevronsUpDown className="ml-1.5 h-3.5 w-3.5 shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>

        {selectedProductId && onClear && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            title="Clear selection"
            className="absolute right-7 p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted/60 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={6}
        collisionPadding={12}
        avoidCollisions={true}
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        className="w-[340px] sm:w-[540px] max-w-[calc(100vw-1.5rem)] p-0 z-[70] shadow-2xl border border-border bg-popover rounded-lg overflow-hidden flex flex-col max-h-[var(--radix-popover-content-available-height,430px)]"
      >
        {/* Search & Filter Header (Stationary) */}
        <div className="shrink-0 p-3 border-b border-border bg-muted/20 space-y-2">
          {/* Search Input */}
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              autoFocus
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by product name, SKU, or barcode..."
              className="pl-8 pr-8 h-9 text-xs sm:text-sm bg-background border-input"
            />
            {isSearching ? (
              <div className="absolute right-2.5 flex items-center justify-center p-1 pointer-events-none">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              </div>
            ) : searchInput ? (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="absolute right-2.5 p-1 text-muted-foreground hover:text-foreground cursor-pointer rounded-sm hover:bg-muted/80 transition-colors"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>

          {/* Filter Bar: Category & Create Shortcut */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <span className="text-[11px] text-muted-foreground shrink-0 font-medium">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="h-7 text-xs px-2 rounded border border-input bg-background text-foreground truncate cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary max-w-[200px]"
              >
                <option value="ALL">All Categories ({categories.length})</option>
                {activeCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {onCreateProductClick && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setOpen(false);
                  onCreateProductClick();
                }}
                className="h-7 px-2 text-[11px] text-primary gap-1 font-medium hover:bg-primary/10 shrink-0"
              >
                <Plus className="h-3 w-3" />
                New Product
              </Button>
            )}
          </div>
        </div>

        {/* Results List: Stable Independent Scroll Container */}
        <div
          className="h-[280px] max-h-[calc(var(--radix-popover-content-available-height,430px)-135px)] min-h-[160px] overflow-y-auto overscroll-contain divide-y divide-border/60"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {/* Initial Loading Indicator (only when no initial data loaded yet) */}
          {isInitialLoading && (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span>Loading catalog...</span>
            </div>
          )}

          {/* Error State */}
          {!isInitialLoading && isError && products.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center py-8 px-4 text-center space-y-2">
              <AlertCircle className="h-6 w-6 text-destructive mx-auto" />
              <p className="text-xs text-destructive font-medium">
                {error instanceof Error ? error.message : "Failed to load products."}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="h-7 text-xs gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                Retry
              </Button>
            </div>
          )}

          {/* Empty State when no products match */}
          {!isInitialLoading && !isError && products.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center py-8 px-4 text-center space-y-3">
              <Package className="h-8 w-8 text-muted-foreground/40 mx-auto" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-foreground">No products found</p>
                <p className="text-[11px] text-muted-foreground">
                  {debouncedSearch || selectedCategory !== "ALL"
                    ? "Try adjusting your search terms or category filter."
                    : "No active products are available in this organization."}
                </p>
              </div>
              {onCreateProductClick && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setOpen(false);
                    onCreateProductClick();
                  }}
                  className="h-7 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create New Product
                </Button>
              )}
            </div>
          )}

          {/* Product Items: Kept rendered during search/pagination with subtle opacity feedback */}
          {!isInitialLoading && products.length > 0 && (
            <div
              className={cn(
                "divide-y divide-border/60 transition-opacity duration-150",
                isSearching && "opacity-60",
              )}
            >
              {products.map((product) => {
                const isSelected = product.id === selectedProductId;
                const stock = calculateStock(product);
                const cost = Number(product.costPrice || 0);

                return (
                  <div
                    key={product.id}
                    onClick={() => {
                      onSelectProduct(product);
                      setOpen(false);
                    }}
                    className={cn(
                      "p-2.5 sm:px-3 text-xs cursor-pointer transition-colors flex items-center justify-between gap-2 hover:bg-muted/50",
                      isSelected && "bg-primary/5 border-l-2 border-primary",
                    )}
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      {/* Title + Badges */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-foreground truncate max-w-[280px]">
                          {product.name}
                        </span>
                        {product.category && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] py-0 px-1.5 font-normal h-4"
                          >
                            {product.category.name}
                          </Badge>
                        )}
                        {product.unit && (
                          <span className="text-[10px] text-muted-foreground font-mono">
                            [{product.unit.code}]
                          </span>
                        )}
                      </div>

                      {/* Metadata line: SKU, Barcode, Stock */}
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                        {product.sku && (
                          <span>
                            SKU: <span className="font-mono text-foreground">{product.sku}</span>
                          </span>
                        )}
                        {product.barcode && (
                          <span>
                            Barcode: <span className="font-mono">{product.barcode}</span>
                          </span>
                        )}
                        {stock !== null ? (
                          <span className={cn(stock > 0 ? "text-emerald-600 font-medium" : "text-amber-600")}>
                            Stock: {stock} {product.unit?.code || "units"}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/70">Stock: —</span>
                        )}
                      </div>
                    </div>

                    {/* Purchase Cost & Selection */}
                    <div className="text-right shrink-0 flex items-center gap-2">
                      <div className="flex flex-col items-end">
                        <span className="text-[11px] text-muted-foreground">Purchase Cost</span>
                        <span className="text-xs font-bold text-foreground">
                          {formatMoney(cost)}
                        </span>
                      </div>

                      <div
                        className={cn(
                          "h-6 w-6 rounded-md flex items-center justify-center border transition-colors",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border text-transparent hover:border-primary/50",
                        )}
                      >
                        <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination Footer (Stationary) */}
        <div className="shrink-0 p-2.5 px-3 border-t border-border bg-muted/20 flex items-center justify-between text-xs">
          <div className="text-muted-foreground text-[11px]">
            {meta.total > 0 ? (
              <span>
                Showing{" "}
                <span className="font-semibold text-foreground">
                  {(meta.page - 1) * meta.limit + 1}
                </span>
                –
                <span className="font-semibold text-foreground">
                  {Math.min(meta.page * meta.limit, meta.total)}
                </span>{" "}
                of <span className="font-semibold text-foreground">{meta.total}</span> products
              </span>
            ) : (
              <span>0 products</span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1 || isSearching}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-7 px-2 text-xs gap-0.5"
            >
              <ChevronLeft className="h-3 w-3" />
              Prev
            </Button>
            <span className="text-[11px] text-muted-foreground px-1">
              {meta.page} / {meta.totalPages || 1}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages || isSearching}
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              className="h-7 px-2 text-xs gap-0.5"
            >
              Next
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
