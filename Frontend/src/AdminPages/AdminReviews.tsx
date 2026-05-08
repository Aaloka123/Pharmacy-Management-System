import AdminNavbar from '../AdminComponents/AdminNavbar'

const AdminReviews = () => {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminNavbar />
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold text-slate-900">Admin Reviews</h1>
      </main>
    </div>
  )
}

export default AdminReviews