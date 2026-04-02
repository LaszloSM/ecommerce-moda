import AdminSidebar from '@/components/layout/AdminSidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar user={{ name: 'Admin', email: '' }} />
      <main className="flex-1 p-6 lg:ml-64">
        {children}
      </main>
    </div>
  )
}
