import WorkOrderList from "@/src/components/WorkOrderList";


export default function Home() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card p-6 rounded-xl border shadow-sm">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Welcome back to maintenance command center.</p>
        </div>
        <div className="flex gap-2">
          {/* Create Button could go here */}
        </div>
      </div>

      <WorkOrderList />
    </div>
  );
}
