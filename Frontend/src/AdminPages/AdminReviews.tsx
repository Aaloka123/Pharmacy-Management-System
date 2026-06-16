import AdminNavbar from '../AdminComponents/AdminNavbar'
import { AdminMain, FadeInOnScroll } from '../components/PortalMain'

const AdminReviews = () => {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminNavbar />
      <AdminMain>
      <FadeInOnScroll>
        <h1 className="text-2xl font-bold text-slate-900">Admin Reviews</h1>
      </FadeInOnScroll>
      </AdminMain>
    </div>
  )
}

export default AdminReviews