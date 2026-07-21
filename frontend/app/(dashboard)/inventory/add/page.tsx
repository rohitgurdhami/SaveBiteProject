/**
 * Scaffold route.
 *
 * The target architecture calls for a dedicated `/inventory/add` page. Today,
 * adding a food item is handled inline on the Inventory page via a toggled
 * form (see `showAddForm` in `(dashboard)/inventory/page.tsx`), triggered by
 * `?action=add`. This route is reserved for when "add" is split into its own
 * page, without changing the current inline-form behavior.
 */
export default function AddInventoryItemPage() {
  return (
    <div className="p-6">
      <p className="text-muted-foreground">
        Adding items is currently handled inline on the Inventory page
        (use the &quot;Add Item&quot; button there). This route is reserved for a
        future dedicated add-item page.
      </p>
    </div>
  );
}
