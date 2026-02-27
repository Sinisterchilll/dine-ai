import MenuItemForm from '@/components/admin/MenuItemForm';

export default async function EditMenuItemPage({ params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params;
  return <MenuItemForm itemId={itemId} />;
}
