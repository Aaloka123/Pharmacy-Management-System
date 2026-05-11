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
        {/* User Pages */}
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/productsdetail" element={<ProductsDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/vendorprofile" element={<VendorProfile />} />
        <Route path="/prescription" element={<Prescription />} />
        

        {/* Signup-Login */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgetpassword" element={<ForgetPassword />} />

        {/* Vendor Login-Signup */}
        <Route path="/vendorlogin" element={<Vendorlogin />} />
        <Route path="/vendorsignup" element={<VendorSignup />} />

        {/* Vendor Pages */}
        <Route path="/vendordashboard" element={<Dashboard />} />
        <Route path="/vendormessage" element={<Message />} />
        <Route path="/vendorproduct" element={<Product />} />
        <Route path="/vendororder" element={<Order />} />
        <Route path="/vendorreview" element={<Review />} />
        <Route path="/vendorbills" element={<Bills />} />
        <Route path="/vendorsetting" element={<Setting />} />
        <Route path="/vendoruserprofile" element={<VendorUserProfile />} />


        {/*Admin Pages*/ }
        <Route path="/admindashboard" element={<AdminDashboard/>} />
        <Route path="/adminusers" element={<AdminUsers/>} />
        <Route path="/adminvendors" element={<AdminVendors/>} />
        <Route path="/adminapprovevendor" element={<AdminApproveVendor/>} />
        <Route path="/adminproducts" element={<AdminProducts/>} />
        <Route path="/adminreviews" element={<AdminReviews/>} />
        <Route path="/adminsettings" element={<AdminSettings/>} />
        <Route path="/adminvendorprofile" element={<AdminVendorProfile/>} />

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