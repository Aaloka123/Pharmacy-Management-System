import { GoogleOAuthProvider } from '@react-oauth/google'
import { useEffect, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { getGoogleClientId } from './lib/googleAuth'
import { getStoredUser, homePathForRole } from './lib/auth'
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
import Checkout from './UserPages/Checkout'
import PaymentSuccess from './UserPages/PaymentSuccess'
import OrderTracking from './UserPages/OrderTracking'
import UserMessage from './UserPages/UserMessage'
import Dashboard from './VendorPages/VendorDashboard'
import Message from './VendorPages/VendorMessage'
import Product from './VendorPages/VendorProduct'
import Order from './VendorPages/VendorOrder'
import Bills from './VendorPages/VendorBills'
import Transaction from './VendorPages/VendorTransaction'
import Setting from './VendorPages/VendorSetting'
import Review from './VendorPages/VendorReview'
import AdminDashboard from './AdminPages/AdminDashboard'
import AdminUsers from './AdminPages/AdminUsers'
import AdminVendors from './AdminPages/AdminVendors'
import AdminApproveVendor from './AdminPages/AdminApproveVendor'
import AdminProducts from './AdminPages/AdminProducts'
import AdminReviews from './AdminPages/AdminReviews'
import AdminProfit from './AdminPages/AdminProfit'
import AdminSettings from './AdminPages/AdminSettings'
import AdminVendorProfile from './AdminPages/AdminVendorProfile'
import VendorProfile from './UserPages/VendorProfile'
import Prescription from './UserPages/Prescription'
import VendorUserProfile from './VendorPages/VendorUserProfile'
import RequireAuth from './lib/RequireAuth'
import AdminUserProfile from './AdminPages/AdminUserProfile'
import PageTransition from './components/PageTransition'

/** Sync redirect so vendor/admin never flash the public user pages. */
const PortalHomeRedirect = ({ children }: { children: ReactNode }) => {
  const user = getStoredUser()
  if (user && user.role !== 'USER') {
    return <Navigate to={homePathForRole(user.role)} replace />
  }
  return <>{children}</>
}

const AppContent = () => {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])

  const normalizedPath = pathname.replace(/\/+$/, '') || '/'

  const vendorPortalPaths = [
    '/vendordashboard',
    '/vendormessage',
    '/vendorproduct',
    '/vendororder',
    '/vendorreview',
    '/vendorbills',
    '/vendortransaction',
    '/vendorsetting',
    '/vendoruserprofile',
    '/vendorlogin',
    '/vendorsignup',
  ]
  const showMessageChatbot =
    !normalizedPath.startsWith('/admin') &&
    !['/login', '/signup', '/forgetpassword'].includes(normalizedPath) &&
    !vendorPortalPaths.includes(normalizedPath)

  return (
    <>
      <PageTransition>
      <Routes>
        {/* Public browseable pages */}
        <Route path="/" element={<PortalHomeRedirect><Home /></PortalHomeRedirect>} />
        <Route path="/products" element={<Products />} />
        <Route path="/productsdetail" element={<ProductsDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/vendorprofile" element={<VendorProfile />} />

        {/* User-account pages (login required) */}
        <Route path="/profile" element={<RequireAuth roles={['USER']}><Profile /></RequireAuth>} />
        <Route path="/cart" element={<RequireAuth roles={['USER']}><Cart /></RequireAuth>} />
        <Route path="/checkout" element={<RequireAuth roles={['USER']}><Checkout /></RequireAuth>} />
        <Route path="/payment/success" element={<RequireAuth roles={['USER']}><PaymentSuccess /></RequireAuth>} />
        <Route path="/ordertracking" element={<RequireAuth roles={['USER']}><OrderTracking /></RequireAuth>} />
        <Route path="/usermessage" element={<RequireAuth roles={['USER']}><UserMessage /></RequireAuth>} />
        <Route path="/prescription" element={<RequireAuth roles={['USER']}><Prescription /></RequireAuth>} />
        

        {/* Signup-Login */}
        <Route path="/login" element={<PortalHomeRedirect><Login /></PortalHomeRedirect>} />
        <Route path="/signup" element={<PortalHomeRedirect><Signup /></PortalHomeRedirect>} />
        <Route path="/forgetpassword" element={<PortalHomeRedirect><ForgetPassword /></PortalHomeRedirect>} />

        {/* Vendor Login-Signup */}
        <Route path="/vendorlogin" element={<PortalHomeRedirect><Vendorlogin /></PortalHomeRedirect>} />
        <Route path="/vendorsignup" element={<PortalHomeRedirect><VendorSignup /></PortalHomeRedirect>} />

        {/* Vendor Pages (VENDOR only — unauthenticated visits go to /vendorlogin) */}
        <Route path="/vendordashboard" element={<RequireAuth roles={['VENDOR']} loginPath="/vendorlogin"><Dashboard /></RequireAuth>} />
        <Route path="/vendormessage" element={<RequireAuth roles={['VENDOR']} loginPath="/vendorlogin"><Message /></RequireAuth>} />
        <Route path="/vendorproduct" element={<RequireAuth roles={['VENDOR']} loginPath="/vendorlogin"><Product /></RequireAuth>} />
        <Route path="/vendororder" element={<RequireAuth roles={['VENDOR']} loginPath="/vendorlogin"><Order /></RequireAuth>} />
        <Route path="/vendorreview" element={<RequireAuth roles={['VENDOR']} loginPath="/vendorlogin"><Review /></RequireAuth>} />
        <Route path="/vendorbills" element={<RequireAuth roles={['VENDOR']} loginPath="/vendorlogin"><Bills /></RequireAuth>} />
        <Route path="/vendortransaction" element={<RequireAuth roles={['VENDOR']} loginPath="/vendorlogin"><Transaction /></RequireAuth>} />
        <Route path="/vendorsetting" element={<RequireAuth roles={['VENDOR']} loginPath="/vendorlogin"><Setting /></RequireAuth>} />
        <Route path="/vendoruserprofile" element={<RequireAuth roles={['VENDOR']} loginPath="/vendorlogin"><VendorUserProfile /></RequireAuth>} />


        {/* Admin Pages (ADMIN only) */}
        <Route path="/admindashboard" element={<RequireAuth roles={['ADMIN']}><AdminDashboard /></RequireAuth>} />
        <Route path="/adminusers" element={<RequireAuth roles={['ADMIN']}><AdminUsers /></RequireAuth>} />
        <Route path="/adminvendors" element={<RequireAuth roles={['ADMIN']}><AdminVendors /></RequireAuth>} />
        <Route path="/adminapprovevendor" element={<RequireAuth roles={['ADMIN']}><AdminApproveVendor /></RequireAuth>} />
        <Route path="/adminproducts" element={<RequireAuth roles={['ADMIN']}><AdminProducts /></RequireAuth>} />
        <Route path="/adminreviews" element={<RequireAuth roles={['ADMIN']}><AdminReviews /></RequireAuth>} />
        <Route path="/adminprofit" element={<RequireAuth roles={['ADMIN']}><AdminProfit /></RequireAuth>} />
        <Route path="/adminsettings" element={<RequireAuth roles={['ADMIN']}><AdminSettings /></RequireAuth>} />
        <Route path="/adminvendorprofile" element={<RequireAuth roles={['ADMIN']}><AdminVendorProfile /></RequireAuth>} />
        <Route path="/adminuserprofile" element={<RequireAuth roles={['ADMIN']}><AdminUserProfile /></RequireAuth>} />

      </Routes>
      </PageTransition>

      {showMessageChatbot ? <ChatbotButton /> : null}
    </>
  )
}

const App = () => {
  return (
    <GoogleOAuthProvider clientId={getGoogleClientId()}>
      <BrowserRouter>
        <AppContent />
        <ToastContainer position="top-right" autoClose={1200} hideProgressBar newestOnTop closeOnClick pauseOnFocusLoss={false} draggable={false} theme="colored" />
      </BrowserRouter>
    </GoogleOAuthProvider>
  )
}

export default App