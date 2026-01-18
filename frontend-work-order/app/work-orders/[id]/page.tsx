import WorkOrderDetail from '@/src/components/WorkOrderDetail';

// Directly use the component in the page wrapper
// React Server Component wrapper for the client component
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return (
    <div className="p-4">
      <WorkOrderDetail workOrderId={resolvedParams.id} />
    </div>
  );
}
