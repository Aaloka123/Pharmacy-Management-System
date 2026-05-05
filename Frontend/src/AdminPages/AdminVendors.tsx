import AdminNavbar from '../AdminComponents/AdminNavbar'

const AdminVendors = () => {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminNavbar />
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold text-slate-900">Admin Vendors</h1>
      </main>
    </div>
  )
}

export default AdminVendors