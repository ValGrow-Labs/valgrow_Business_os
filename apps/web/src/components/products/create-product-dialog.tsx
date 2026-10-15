import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateProduct, type ProductItem } from "@/hooks/queries/useProducts";
import { useCategories } from "@/hooks/queries/useCategories";
import { useBrands } from "@/hooks/queries/useBrands";
import { useUnits } from "@/hooks/queries/useUnits";
import { useTaxes } from "@/hooks/queries/useTaxes";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export interface CreateProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductCreated?: (product: ProductItem) => void;
}

interface ProductFormData {
  name: string;
  sku: string;
  barcode: string;
  costPrice: string;
  retailPrice: string;
  type: "PHYSICAL" | "SERVICE" | "DIGITAL";
  categoryId: string;
  brandId: string;
  unitId: string;
  taxId: string;
  description: string;
}

const initialFormData: ProductFormData = {
  name: "",
  sku: "",
  barcode: "",
  costPrice: "",
  retailPrice: "",
  type: "PHYSICAL",
  categoryId: "none",
  brandId: "none",
  unitId: "none",
  taxId: "none",
  description: "",
};

export function CreateProductDialog({
  open,
  onOpenChange,
  onProductCreated,
}: CreateProductDialogProps) {
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { data: categories = [] } = useCategories({ status: "ACTIVE" });
  const { data: brands = [] } = useBrands();
  const { data: units = [] } = useUnits();
  const { data: taxes = [] } = useTaxes();

  const createProductMutation = useCreateProduct();

  const activeCategories = categories.filter((c) => c.status === "ACTIVE" || !c.status);
  const activeBrands = brands.filter((b) => b.status === "ACTIVE" || !b.status);
  const activeUnits = units.filter((u) => u.status === "ACTIVE" || !u.status);
  const activeTaxes = taxes.filter((t) => t.status === "ACTIVE" || !t.status);

  const handleClose = () => {
    if (isSaving) return;
    setFormError(null);
    setFormData(initialFormData);
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError("Product name is required.");
      return;
    }

    if (formData.costPrice && Number(formData.costPrice) < 0) {
      setFormError("Cost price cannot be negative.");
      return;
    }

    if (formData.retailPrice && Number(formData.retailPrice) < 0) {
      setFormError("Retail price cannot be negative.");
      return;
    }

    setFormError(null);
    setIsSaving(true);

    try {
      const payload: Partial<ProductItem> = {
        name: formData.name.trim(),
        sku: formData.sku.trim() || null,
        barcode: formData.barcode.trim() || null,
        description: formData.description.trim() || null,
        type: formData.type,
        status: "ACTIVE",
        costPrice: formData.costPrice ? Number(formData.costPrice) : 0,
        categoryId: formData.categoryId !== "none" ? formData.categoryId : null,
        brandId: formData.brandId !== "none" ? formData.brandId : null,
        unitId: formData.unitId !== "none" ? formData.unitId : null,
        taxId: formData.taxId !== "none" ? formData.taxId : null,
      };

      const newProduct = await createProductMutation.mutateAsync(payload);

      // If retail price is provided, register standard RETAIL price tier
      if (formData.retailPrice && Number(formData.retailPrice) > 0) {
        try {
          await apiClient(`/products/${newProduct.id}/prices`, {
            method: "POST",
            body: JSON.stringify({
              price: Number(formData.retailPrice),
              tier: "RETAIL",
              minQuantity: 1,
            }),
          });
        } catch (priceErr) {
          console.warn("Could not save retail price tier:", priceErr);
        }
      }

      toast.success(`Product "${newProduct.name}" created successfully`);
      setFormData(initialFormData);
      onProductCreated?.(newProduct);
      onOpenChange(false);
    } catch (err: any) {
      const msg = err?.message || "Failed to create product.";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => (!val ? handleClose() : onOpenChange(true))}>
      <DialogContent
        className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto z-[60]"
        onPointerDownOutside={(e) => {
          // Prevent pointer down event from bubbling to parent dialog
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Create New Product</DialogTitle>
          <DialogDescription>
            Add an item to the product catalog to include in this purchase order.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {formError && (
            <div className="p-3 text-xs rounded-md border border-destructive/40 bg-destructive/10 text-destructive font-medium">
              {formError}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="new-product-name" className="text-xs font-medium">
                Product Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="new-product-name"
                placeholder="e.g. Arabica Reserve Coffee Beans"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-9 text-xs"
                disabled={isSaving}
                autoFocus
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new-product-sku" className="text-xs font-medium">
                SKU
              </Label>
              <Input
                id="new-product-sku"
                placeholder="e.g. BEAN-001"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="h-9 text-xs"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new-product-barcode" className="text-xs font-medium">
                Barcode
              </Label>
              <Input
                id="new-product-barcode"
                placeholder="e.g. 8901234567890"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="h-9 text-xs"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new-product-cost" className="text-xs font-medium">
                Cost Price (₹)
              </Label>
              <Input
                id="new-product-cost"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                className="h-9 text-xs"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new-product-retail" className="text-xs font-medium">
                Retail Price (₹)
              </Label>
              <Input
                id="new-product-retail"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.retailPrice}
                onChange={(e) => setFormData({ ...formData, retailPrice: e.target.value })}
                className="h-9 text-xs"
                disabled={isSaving}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new-product-type" className="text-xs font-medium">
                Product Type
              </Label>
              <select
                id="new-product-type"
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as "PHYSICAL" | "SERVICE" | "DIGITAL",
                  })
                }
                className="w-full h-9 px-3 rounded-md border text-xs bg-background"
                disabled={isSaving}
              >
                <option value="PHYSICAL">Physical Goods</option>
                <option value="SERVICE">Service</option>
                <option value="DIGITAL">Digital Item</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new-product-unit" className="text-xs font-medium">
                Unit of Measure
              </Label>
              <select
                id="new-product-unit"
                value={formData.unitId}
                onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                className="w-full h-9 px-3 rounded-md border text-xs bg-background"
                disabled={isSaving}
              >
                <option value="none">None</option>
                {activeUnits.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new-product-category" className="text-xs font-medium">
                Category
              </Label>
              <select
                id="new-product-category"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full h-9 px-3 rounded-md border text-xs bg-background"
                disabled={isSaving}
              >
                <option value="none">Unassigned</option>
                {activeCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new-product-brand" className="text-xs font-medium">
                Brand
              </Label>
              <select
                id="new-product-brand"
                value={formData.brandId}
                onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                className="w-full h-9 px-3 rounded-md border text-xs bg-background"
                disabled={isSaving}
              >
                <option value="none">Generic / None</option>
                {activeBrands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="new-product-tax" className="text-xs font-medium">
                Tax Rule
              </Label>
              <select
                id="new-product-tax"
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                className="w-full h-9 px-3 rounded-md border text-xs bg-background"
                disabled={isSaving}
              >
                <option value="none">No Tax (0%)</option>
                {activeTaxes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.rate}%)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="new-product-description" className="text-xs font-medium">
                Description
              </Label>
              <Textarea
                id="new-product-description"
                placeholder="Product specifications, purchase notes…"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="text-xs"
                disabled={isSaving}
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              Create Product
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
