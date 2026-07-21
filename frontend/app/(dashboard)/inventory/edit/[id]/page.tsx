
export default async function EditInventoryItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="p-6">
      <p className="text-muted-foreground">
        Editing inventory item #{id} is currently handled inline on the
        Inventory page. This route is reserved for a future dedicated
        edit-item page.
      </p>
    </div>
  );
}
