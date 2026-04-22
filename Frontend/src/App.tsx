import React from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Home from './UserPages/Home'
import ForgetPassword from './Signup-Login/ForgetPassword'
import Login from './Signup-Login/Login'
import Signup from './Signup-Login/Signup'

const App = () => {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
        

        <Route path="/forgetpassword" element={<ForgetPassword />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

      </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App