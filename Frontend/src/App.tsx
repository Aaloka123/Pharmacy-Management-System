import { useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Home from './UserPages/Home'
import Products from './UserPages/Products'
import About from './UserPages/About'
import Contacts from './UserPages/Contacts'
import Login from './Signup-Login/Login'
import Signup from './Signup-Login/Signup'
import ForgetPassword from './Signup-Login/ForgetPassword'
import Vendorlogin from './Vendor-Signup-Login/VendorLogin'
import VendorSignup from './Vendor-Signup-Login/VendorSignup'
import ChatbotButton from './UserComponents/ChatbotButton'
import ProductsDetail from './UserPages/ProductsDetail'
import Profile from './UserPages/Profile'
import Cart from './UserPages/Cart'
import Dashboard from './VendorPages/VendorDashboard'
import Message from './VendorPages/VendorMessage'
import Product from './VendorPages/VendorProduct'
import Order from './VendorPages/VendorOrder'
import Bills from './VendorPages/VendorBills'
import Setting from './VendorPages/VendorSetting'
import Review from './VendorPages/VendorReview'
import AdminDashboard from './AdminPages/AdminDashboard'
import AdminUsers from './AdminPages/AdminUsers'
import AdminVendors from './AdminPages/AdminVendors'
import AdminApproveVendor from './AdminPages/AdminApproveVendor'
import AdminProducts from './AdminPages/AdminProducts'
import AdminReviews from './AdminPages/AdminReviews'
import AdminSettings from './AdminPages/AdminSettings'
import AdminVendorProfile from './AdminPages/AdminVendorProfile'
import VendorProfile from './UserPages/VendorProfile'
import Prescription from './UserPages/Prescription'
import VendorUserProfile from './VendorPages/VendorUserProfile'
import RequireAuth from './lib/RequireAuth'
import AdminUserProfile from './AdminPages/AdminUserProfile'

const AppContent = () => {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])

  const normalizedPath = pathname.replace(/\/+$/, '') || '/'
  const userRoutes = ['/', '/products', '/productsdetail', '/about', '/contacts', '/profile', '/cart']
  const showChatbot = userRoutes.some((route) => normalizedPath === route || normalizedPath.startsWith(`${route}/`))

  return (
    <>
      <Routes>
        {/* Public browseable pages */}
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/productsdetail" element={<ProductsDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/vendorprofile" element={<VendorProfile />} />

        {/* User-account pages (login required) */}
        <Route path="/profile" element={<RequireAuth roles={['USER']}><Profile /></RequireAuth>} />
        <Route path="/cart" element={<RequireAuth roles={['USER']}><Cart /></RequireAuth>} />
        <Route path="/prescription" element={<RequireAuth roles={['USER']}><Prescription /></RequireAuth>} />
        

        {/* Signup-Login */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgetpassword" element={<ForgetPassword />} />

        {/* Vendor Login-Signup */}
        <Route path="/vendorlogin" element={<Vendorlogin />} />
        <Route path="/vendorsignup" element={<VendorSignup />} />

        {/* Vendor Pages (VENDOR only — unauthenticated visits go to /vendorlogin) */}
        <Route path="/vendordashboard" element={<RequireAuth roles={['VENDOR']} loginPath="/vendorlogin"><Dashboard /></RequireAuth>} />
        <Route path="/vendormessage" element={<RequireAuth roles={['VENDOR']} loginPath="/vendorlogin"><Message /></RequireAuth>} />
        <Route path="/vendorproduct" element={<RequireAuth roles={['VENDOR']} loginPath="/vendorlogin"><Product /></RequireAuth>} />
        <Route path="/vendororder" element={<RequireAuth roles={['VENDOR']} loginPath="/vendorlogin"><Order /></RequireAuth>} />
        <Route path="/vendorreview" element={<RequireAuth roles={['VENDOR']} loginPath="/vendorlogin"><Review /></RequireAuth>} />
        <Route path="/vendorbills" element={<RequireAuth roles={['VENDOR']} loginPath="/vendorlogin"><Bills /></RequireAuth>} />
        <Route path="/vendorsetting" element={<RequireAuth roles={['VENDOR']} loginPath="/vendorlogin"><Setting /></RequireAuth>} />
        <Route path="/vendoruserprofile" element={<RequireAuth roles={['VENDOR']} loginPath="/vendorlogin"><VendorUserProfile /></RequireAuth>} />


        {/* Admin Pages (ADMIN only) */}
        <Route path="/admindashboard" element={<RequireAuth roles={['ADMIN']}><AdminDashboard /></RequireAuth>} />
        <Route path="/adminusers" element={<RequireAuth roles={['ADMIN']}><AdminUsers /></RequireAuth>} />
        <Route path="/adminvendors" element={<RequireAuth roles={['ADMIN']}><AdminVendors /></RequireAuth>} />
        <Route path="/adminapprovevendor" element={<RequireAuth roles={['ADMIN']}><AdminApproveVendor /></RequireAuth>} />
        <Route path="/adminproducts" element={<RequireAuth roles={['ADMIN']}><AdminProducts /></RequireAuth>} />
        <Route path="/adminreviews" element={<RequireAuth roles={['ADMIN']}><AdminReviews /></RequireAuth>} />
        <Route path="/adminsettings" element={<RequireAuth roles={['ADMIN']}><AdminSettings /></RequireAuth>} />
        <Route path="/adminvendorprofile" element={<RequireAuth roles={['ADMIN']}><AdminVendorProfile /></RequireAuth>} />
        <Route path="/adminuserprofile" element={<RequireAuth roles={['ADMIN']}><AdminUserProfile /></RequireAuth>} />

      </Routes>

      {showChatbot && <ChatbotButton />}
    </>
  )
}

const App = () => {
  return (
    <BrowserRouter>
      <AppContent />
      <ToastContainer position="top-right" autoClose={3000} newestOnTop closeOnClick pauseOnFocusLoss={false} theme="colored" />
    </BrowserRouter>
  )
}

export default App