import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
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
import Dashboard from './VendorPages/Dashboard'

const AppContent = () => {
  const { pathname } = useLocation()
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

        {/* Signup-Login */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgetpassword" element={<ForgetPassword />} />

        {/* Vendor Login-Signup */}
        <Route path="/vendorlogin" element={<Vendorlogin />} />
        <Route path="/vendorsignup" element={<VendorSignup />} />

        {/* Vendor Pages */}
        <Route path="/vendordashboard" element={<Dashboard />} />

      </Routes>

      {showChatbot && <ChatbotButton />}
    </>
  )
}

const App = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App