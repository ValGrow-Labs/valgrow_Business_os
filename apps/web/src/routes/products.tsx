import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  CodeCell,
  ListPage,
  NameCell,
  NumberCell,
  StatusBadge,
  type ListRow,
} from "@/components/foundation/list-page";
import { ModuleTabs } from "@/components/foundation/module-tabs";
import type { Column } from "@/components/foundation/data-table";
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  type ProductItem,
} from "@/hooks/queries/useProducts";
import { useCategories } from "@/hooks/queries/useCategories";
import { useBrands } from "@/hooks/queries/useBrands";
import { useUnits } from "@/hooks/queries/useUnits";
import { useTaxes } from "@/hooks/queries/useTaxes";
import { useActiveCurrency } from "@/hooks/useActiveCurrency";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Trash2, Loader2, Boxes, Package, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { exportToCsv, getExportFilename } from "@/lib/exportCsv";

const title = "Products & Catalog";
const description =
  "Master catalog of physical goods, services, and digital items across tenant branches.";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} · ValGrow Business OS` },
      { property: "og:description", content: description },
    ],
  }),
  component: ProductsPage,
});

interface ProductFormState {
  name: string;
  sku: string;
  barcode: string;
  costPrice: string;
  type: "PHYSICAL" | "SERVICE" | "DIGITAL";
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  categoryId: string;
  brandId: string;
  unitId: string;
  taxId: string;
  description: string;
}

const initialFormState: ProductFormState = {
  name: "",
  sku: "",
  barcode: "",
  costPrice: "",
  type: "PHYSICAL",
  status: "ACTIVE",
  categoryId: "none",
  brandId: "none",
  unitId: "none",
  taxId: "none",
  description: "",
};

function ProductsPage() {
  const { currencySymbol, formatMoney } = useActiveCurrency();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedBrand, setSelectedBrand] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");

  const hasActiveFilters = Boolean(
    selectedCategory !== "ALL" ||
    selectedBrand !== "ALL" ||
    selectedStatus !== "ALL" ||
    selectedType !== "ALL"
  );

  const handleClearFilters = () => {
    setSelectedCategory("ALL");
    setSelectedBrand("ALL");
    setSelectedStatus("ALL");
    setSelectedType("ALL");
    setSearch("");
    setPage(1);
  };

  const {
    data: productsData,
    isLoading: isProductsLoading,
    isError: isProductsError,
    refetch: refetchProducts,
  } = useProducts({
    page,
    search: debouncedSearch.trim() || undefined,
    categoryId: selectedCategory !== "ALL" ? selectedCategory : undefined,
    brandId: selectedBrand !== "ALL" ? selectedBrand : undefined,
    status: selectedStatus !== "ALL" ? selectedStatus : undefined,
    type: selectedType !== "ALL" ? selectedType : undefined,
  });

  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();
  const { data: units = [] } = useUnits();
  const { data: taxes = [] } = useTaxes();

  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [formData, setFormData] = useState<ProductFormState>(initialFormState);
  const [formError, setFormError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const products = productsData?.data || [];
      exportToCsv({
        filename: getExportFilename("valgrow-products"),
        columns: [
          { header: "Product Name", accessor: (p) => p.name },
          { header: "SKU", accessor: (p) => p.sku || "" },
          { header: "Barcode", accessor: (p) => p.barcode || "" },
          { header: "Product Type", accessor: (p) => p.type || "" },
          { header: "Category", accessor: (p) => p.category?.name || "Unassigned" },
          { header: "Brand", accessor: (p) => p.brand?.name || "Generic" },
          { header: "Unit", accessor: (p) => (p.unit ? `${p.unit.name} (${p.unit.code})` : "") },
          { header: "Cost Price", accessor: (p) => (p.costPrice !== null && p.costPrice !== undefined ? Number(p.costPrice) : "") },
          {
            header: "Retail Price",
            accessor: (p) => {
              const defaultRetailPrice = p.priceLevels?.find(
                (pr: any) => pr.tier === "RETAIL" && !pr.variantId
              )?.price;
              return defaultRetailPrice !== undefined && defaultRetailPrice !== null
                ? Number(defaultRetailPrice)
                : p.costPrice !== null && p.costPrice !== undefined
                ? Number(p.costPrice)
                : "";
            },
          },
          {
            header: "Tax Rule",
            accessor: (p) => (p.tax ? `${p.tax.name} (${p.tax.rate}%)` : "No Tax"),
          },
          { header: "Status", accessor: (p) => p.status || "" },
          { header: "Description", accessor: (p) => p.description || "" },
        ],
        data: products,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData(initialFormState);
    setFormError(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (product: ProductItem) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || "",
      sku: product.sku || "",
      barcode: product.barcode || "",
      costPrice: product.costPrice !== null && product.costPrice !== undefined ? String(product.costPrice) : "",
      type: product.type || "PHYSICAL",
      status: product.status || "ACTIVE",
      categoryId: product.categoryId || "none",
      brandId: product.brandId || "none",
      unitId: product.unitId || "none",
      taxId: product.taxId || "none",
      description: product.description || "",
    });
    setFormError(null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await deleteProductMutation.mutateAsync(id);
      toast.success("Product deleted successfully");
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete product");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError("Product name is required.");
      return;
    }

    setFormError(null);

    const payload: Partial<ProductItem> = {
      name: formData.name.trim(),
      sku: formData.sku.trim() || null,
      barcode: formData.barcode.trim() || null,
      description: formData.description.trim() || null,
      type: formData.type,
      status: formData.status,
      costPrice: formData.costPrice ? Number(formData.costPrice) : 0,
      categoryId: formData.categoryId !== "none" ? formData.categoryId : null,
      brandId: formData.brandId !== "none" ? formData.brandId : null,
      unitId: formData.unitId !== "none" ? formData.unitId : null,
      taxId: formData.taxId !== "none" ? formData.taxId : null,
    };

    try {
      if (editingProduct) {
        await updateProductMutation.mutateAsync({ id: editingProduct.id, data: payload });
        toast.success("Product updated successfully");
      } else {
        await createProductMutation.mutateAsync(payload);
        toast.success("Product created successfully");
      }
      setIsDialogOpen(false);
    } catch (err: any) {
      setFormError(err?.message || "Failed to save product.");
      toast.error(err?.message || "Failed to save product.");
    }
  };

  const columns: Column<ListRow>[] = [
    { key: "name", header: "Product", render: (r) => <NameCell value={String(r["name"] ?? "")} /> },
    { key: "sku", header: "SKU", render: (r) => <CodeCell value={String(r["sku"] ?? "")} /> },
    { key: "category", header: "Category" },
    { key: "brand", header: "Brand" },
    {
      key: "type",
      header: "Type",
      render: (r) => <span className="text-xs text-muted-foreground">{String(r["type"] ?? "")}</span>,
    },
    {
      key: "price",
      header: "Cost / Retail Price",
      className: "text-right",
      render: (r) => <NumberCell value={String(r["price"] ?? "")} />,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge value={String(r["status"] ?? "")} />,
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (r) => {
        const product = productsData?.data?.find((p) => p.id === r["id"]);
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => product && handleOpenEdit(product)}
              title="Edit Product"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => product && handleDelete(product.id, product.name)}
              title="Delete Product"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const rows: ListRow[] = useMemo(() => {
    if (!productsData?.data) return [];
    const query = search.trim();

    const getRelevance = (pName: string, sku: string | null = "") => {
      if (!query) return 1;
      const qClean = query.toLowerCase().replace(/[-_\s]+/g, "");
      const nameClean = pName.toLowerCase().replace(/[-_\s]+/g, "");
      const skuClean = (sku || "").toLowerCase().replace(/[-_\s]+/g, "");
      const qRaw = query.toLowerCase();
      const nameRaw = pName.toLowerCase();
      const skuRaw = (sku || "").toLowerCase();

      if (nameClean === qClean || nameRaw === qRaw || (skuClean && skuClean === qClean)) return 100;
      if (nameClean.startsWith(qClean) || nameRaw.startsWith(qRaw)) return 80;
      if (nameRaw.split(/[-_\s]+/).some((w) => w.startsWith(qRaw) || w.startsWith(qClean))) return 70;
      if (nameClean.includes(qClean) || (skuClean && skuClean.includes(qClean))) return 60;
      if (nameRaw.includes(qRaw) || (skuRaw && skuRaw.includes(qRaw))) return 50;

      const tokens = qRaw.split(/[-_\s]+/).filter(Boolean);
      if (tokens.length > 0 && tokens.every((t) => nameClean.includes(t) || skuClean.includes(t))) return 40;

      return 0;
    };

    const scoredItems = productsData.data
      .map((p) => {
        const relevance = getRelevance(p.name, p.sku);
        const defaultRetailPrice = p.priceLevels?.find(
          (pr: any) => pr.tier === "RETAIL" && !pr.variantId,
        )?.price;

        const priceDisplay =
          defaultRetailPrice !== undefined && defaultRetailPrice !== null
            ? formatMoney(defaultRetailPrice)
            : p.costPrice !== undefined && p.costPrice !== null
            ? `${formatMoney(p.costPrice)} (Cost)`
            : formatMoney(0);

        return {
          row: {
            id: p.id,
            name: p.name,
            sku: p.sku || "N/A",
            category: p.category?.name || "Unassigned",
            brand: p.brand?.name || "Generic",
            type: p.type,
            price: priceDisplay,
            status: p.status === "ACTIVE" ? "Active" : p.status === "DRAFT" ? "Draft" : "Archived",
          },
          relevance,
        };
      })
      .filter((item) => (query ? item.relevance > 0 : true));

    if (query) {
      scoredItems.sort((a, b) => b.relevance - a.relevance);
    }

    return scoredItems.map((item) => item.row);
  }, [productsData, search, formatMoney]);

  const totalProducts = productsData?.meta?.total || 0;
  const activeProducts = productsData?.data?.filter((p) => p.status === "ACTIVE").length || 0;
  const categoriesCount = useMemo(
    () => new Set(productsData?.data?.map((p) => p.categoryId).filter(Boolean)).size,
    [productsData?.data],
  );

  const stats = useMemo(
    () => [
      { label: "Total Products", value: String(totalProducts), hint: "Catalog items" },
      { label: "Active Items", value: String(activeProducts) },
      {
        label: "Categories",
        value: String(categoriesCount),
      },
    ],
    [totalProducts, activeProducts, categoriesCount],
  );

  const isSaving = createProductMutation.isPending || updateProductMutation.isPending;

  const filterContent = (
    <div className="flex flex-wrap items-center gap-2.5 w-full">
      {/* Category Filter */}
      <div className="w-44">
        <Select
          value={selectedCategory}
          onValueChange={(val) => {
            setSelectedCategory(val);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Brand Filter */}
      <div className="w-40">
        <Select
          value={selectedBrand}
          onValueChange={(val) => {
            setSelectedBrand(val);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="All Brands" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Brands</SelectItem>
            {brands.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Status Filter */}
      <div className="w-36">
        <Select
          value={selectedStatus}
          onValueChange={(val) => {
            setSelectedStatus(val);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Type Filter */}
      <div className="w-36">
        <Select
          value={selectedType}
          onValueChange={(val) => {
            setSelectedType(val);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="PHYSICAL">Physical</SelectItem>
            <SelectItem value="SERVICE">Service</SelectItem>
            <SelectItem value="DIGITAL">Digital</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reset Action */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          className="h-8 text-xs text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="mr-1 h-3 w-3" />
          Reset filters
        </Button>
      )}
    </div>
  );

  return (
    <>
      <ListPage guide="products"
        title={title}
        description={description}
        eyebrow="Master Data"
        actionLabel="New product"
        onAction={handleOpenAdd}
        onExport={handleExport}
        isExporting={isExporting}
        stats={stats}
        columns={columns}
        rows={rows}
        isLoading={isProductsLoading && !productsData}
        isError={isProductsError}
        onRetry={() => refetchProducts()}
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search products by name, SKU, or barcode…"
        filterContent={filterContent}
        hasActiveFilters={hasActiveFilters}
      >
        <ModuleTabs
          id="catalog"
          tabs={[
            { to: "/products", label: "Product catalog", icon: Package },
            { to: "/inventory", label: "Live stock levels", icon: Boxes },
          ]}
        />
      </ListPage>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {formError && (
              <div className="p-3 text-xs rounded border border-destructive/40 bg-destructive/10 text-destructive font-medium">
                {formError}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="product-name">
                  Product Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="product-name"
                  placeholder="e.g. Organic Arabica Coffee Beans"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="product-sku">SKU</Label>
                <Input
                  id="product-sku"
                  placeholder="e.g. BEAN-001"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="product-barcode">Barcode</Label>
                <Input
                  id="product-barcode"
                  placeholder="e.g. 8901234567890"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="product-costPrice">Cost Price ({currencySymbol})</Label>
                <Input
                  id="product-costPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="product-type">Product Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(val: "PHYSICAL" | "SERVICE" | "DIGITAL") =>
                    setFormData({ ...formData, type: val })
                  }
                >
                  <SelectTrigger id="product-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PHYSICAL">Physical</SelectItem>
                    <SelectItem value="SERVICE">Service</SelectItem>
                    <SelectItem value="DIGITAL">Digital</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="product-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(val: "DRAFT" | "ACTIVE" | "ARCHIVED") =>
                    setFormData({ ...formData, status: val })
                  }
                >
                  <SelectTrigger id="product-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="product-category">Category</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(val) => setFormData({ ...formData, categoryId: val })}
                >
                  <SelectTrigger id="product-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="product-brand">Brand</Label>
                <Select
                  value={formData.brandId}
                  onValueChange={(val) => setFormData({ ...formData, brandId: val })}
                >
                  <SelectTrigger id="product-brand">
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Generic / None</SelectItem>
                    {brands.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="product-unit">Unit of Measure</Label>
                <Select
                  value={formData.unitId}
                  onValueChange={(val) => setFormData({ ...formData, unitId: val })}
                >
                  <SelectTrigger id="product-unit">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {units.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} ({u.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="product-tax">Tax Rule</Label>
                <Select
                  value={formData.taxId}
                  onValueChange={(val) => setFormData({ ...formData, taxId: val })}
                >
                  <SelectTrigger id="product-tax">
                    <SelectValue placeholder="Select tax" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Tax</SelectItem>
                    {taxes.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} ({t.rate}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="product-description">Description</Label>
                <Textarea
                  id="product-description"
                  placeholder="Add product details or specifications…"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingProduct ? "Save Changes" : "Create Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
