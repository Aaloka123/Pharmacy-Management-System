import AdminNavbar from '../AdminComponents/AdminNavbar'
import { AdminLayout, AdminMain, FadeInOnScroll } from '../components/PortalMain'

const AdminReviews = () => {
  return (
    <AdminLayout>
      <AdminNavbar />
      <AdminMain>
      <FadeInOnScroll>
        <h1 className="text-2xl font-bold text-slate-900">Admin Reviews</h1>
      </FadeInOnScroll>
      </AdminMain>
    </AdminLayout>
  )
}

export default AdminReviews