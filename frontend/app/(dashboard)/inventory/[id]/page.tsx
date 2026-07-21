/**
 * Scaffold route.
 * The target architecture calls for a dedicated `/inventory/[id]` detail page.
 * Today, item details are shown inline in the Inventory list/grid on
 * `(dashboard)/inventory/page.tsx`. This route is reserved for when a
 * standalone item-detail view is introduced, without changing current
 * inline behavior.
 */
export default async function InventoryItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="p-6">
      <p className="text-muted-foreground">
        Item detail view for inventory item #{id} is reserved for future use.
        Item details are currently shown inline on the Inventory page.
      </p>
    </div>
  );
}
