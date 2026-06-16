import AdminNavbar from '../AdminComponents/AdminNavbar'
import { AdminMain, FadeInOnScroll } from '../components/PortalMain'

const AdminProducts = () => {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminNavbar />
      <AdminMain>
      <FadeInOnScroll>
        <h1 className="text-2xl font-bold text-slate-900">Admin Products</h1>
      </FadeInOnScroll>
      </AdminMain>
    </div>
  )
}

export default AdminProducts