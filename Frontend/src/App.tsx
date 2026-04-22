import React from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Home from './UserPages/Home'
import ForgetPassword from './Signup-Login/ForgetPassword'
import Login from './Signup-Login/Login'
import Signup from './Signup-Login/Signup'
import Products from './UserPages/Products'
import About from './UserPages/About'
import Contacts from './UserPages/Contacts'
import Cart from './UserPages/Cart'
import ProductsDetail from './UserPages/ProductsDetail'
import Profile from './UserPages/Profile'
import Vendorlogin from './Vendor-Signup-Login/Vendorlogin'
import VendorSignup from './Vendor-Signup-Login/VendorSignup'

const App = () => {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/about" element={<About />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/productsdetail" element={<ProductsDetail />} />
          <Route path="/profile" element={<Profile />} />
        

        <Route path="/forgetpassword" element={<ForgetPassword />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route path="/vendorlogin" element={<Vendorlogin />} />
        <Route path="/vendorsignup" element={<VendorSignup />} />


      </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App