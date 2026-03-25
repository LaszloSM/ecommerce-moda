import DashboardSidebar from '@/components/layout/DashboardSidebar'

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <main className="flex-1 p-6 lg:ml-64">
        {children}
      </main>
    </div>
  )
}
