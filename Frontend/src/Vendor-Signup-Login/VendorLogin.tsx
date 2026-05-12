import { useState, type FormEvent } from 'react'
import Header from '../UserComponents/Header'
import Footer from '../UserComponents/Footer'
import Copyright from '../UserComponents/Copyright'
import { Link, useNavigate } from 'react-router-dom'
import { IoEyeOffOutline, IoEyeOutline } from 'react-icons/io5'
import { toast } from 'react-toastify'
import { homePathForRole, setStoredUser, type AuthUser } from '../lib/auth'

const VENDOR_LOGIN_URL = '/api/vendors/login'

type VendorLoginResponse = {
  id: number
  name: string
  email: string
  phoneNumber: string
  location: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
}

const Vendorlogin = () => {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(VENDOR_LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })

      if (!res.ok) {
        if (res.status === 401) {
          toast.error('Invalid email or password.')
        } else if (res.status === 403) {
          const message = await res
            .json()
            .then((body: { message?: string }) => body?.message)
            .catch(() => undefined)
          toast.error(message ?? 'Your vendor account is not approved yet.')
        } else {
          toast.error('Login failed. Please try again.')
        }
        return
      }

      const vendor = (await res.json()) as VendorLoginResponse
      const authUser: AuthUser = {
        id: vendor.id,
        fullName: vendor.name,
        email: vendor.email,
        phoneNumber: vendor.phoneNumber,
        location: vendor.location,
        role: 'VENDOR',
      }
      setStoredUser(authUser)
      toast.success(`Welcome back, ${vendor.name.split(' ')[0]}!`)
      navigate(homePathForRole('VENDOR'), { replace: true })
    } catch {
      toast.error('Could not reach the server. Is the backend running on port 8080?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-slate-50">
      <Header />
      <main className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-white px-4 py-10 md:px-8">
        <section className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl lg:grid-cols-2">
          <div className="bg-white p-6 md:p-8">
            <span className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Vendor Access
            </span>

            <h1 className="mt-4 text-3xl font-bold leading-tight text-slate-900">Log in to your vendor portal</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Manage your products, track orders, and access payouts from one dashboard.
            </p>

            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Email</span>
                <div className="border-b border-slate-300 transition-colors duration-200 focus-within:border-teal-600">
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(ev) => setEmail(ev.target.value)}
                    className="w-full bg-transparent px-0 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Password</span>
                <div className="relative border-b border-slate-300 transition-colors duration-200 focus-within:border-teal-600">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(ev) => setPassword(ev.target.value)}
                    className="w-full bg-transparent pl-0 pr-9 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-700"
                  >
                    {showPassword ? <IoEyeOffOutline className="size-5" /> : <IoEyeOutline className="size-5" />}
                  </button>
                </div>
              </label>

              <p className="text-right text-sm">
                <Link className="text-slate-600 hover:text-teal-700 hover:underline" to="/forgetpassword">
                  Forgot Password?
                </Link>
              </p>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
                >
                  {loading ? 'Logging in…' : 'Continue'}
                </button>
              </div>
            </form>

            <p className="mt-5 text-center text-sm text-slate-600">
              New to MedNexux?{' '}
              <Link className="font-semibold text-teal-700 hover:underline" to="/vendorsignup">
                Create a vendor account
              </Link>
            </p>
          </div>

          <aside className="flex flex-col justify-between bg-teal-700 p-6 text-white md:p-8">
            <div>
              <h2 className="text-2xl font-bold">Welcome back!</h2>
              <p className="mt-3 text-sm leading-6 text-teal-50">
                Need help with onboarding or catalog updates? Connect with our MedNexux success team and we will guide
                you with best growth practices.
              </p>
            </div>

            <ul className="mt-6 space-y-3 text-sm leading-6">
              <li>• Track orders and manage inventory in real-time</li>
              <li>• Download statements and payout history</li>
              <li>• Join seasonal campaigns for pharmacy products</li>
            </ul>

            <button
              type="button"
              className="mt-6 w-full rounded-xl bg-white/20 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/30"
            >
              Contact Seller Support
            </button>
          </aside>
        </section>
      </main>
      <Footer />
      <Copyright />
    </div>
  )
}

export default Vendorlogin