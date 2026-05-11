import googleLogo from '../assets/Google.png'
import Copyright from '../UserComponents/Copyright'
import Footer from '../UserComponents/Footer'
import Header from '../UserComponents/Header'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { IoEyeOffOutline, IoEyeOutline } from 'react-icons/io5'
import { toast } from 'react-toastify'
import { homePathForRole, setStoredUser, type AuthUser } from '../lib/auth'

const LOGIN_URL = '/api/users/login'

const Login = () => {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })

      if (!res.ok) {
        if (res.status === 401) {
          toast.error('Invalid email or password.')
        } else {
          toast.error('Login failed. Please try again.')
        }
        return
      }

      const user = (await res.json()) as AuthUser
      setStoredUser(user)
      toast.success(`Welcome back, ${user.fullName.split(' ')[0]}!`)
      navigate(homePathForRole(user.role), { replace: true })
    } catch {
      toast.error('Could not reach the server. Is the backend running on port 8080?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header />
      <main className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-white px-4 py-10">
        <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
          <h1 className="text-center text-2xl font-bold text-slate-900">Login</h1>
          <p className="mt-2 text-center text-sm text-slate-500">
            Don&apos;t have an account?{' '}
            <Link className="font-medium text-teal-700 hover:text-teal-800" to="/signup">
              Signup
            </Link>
          </p>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <div className="border-b border-slate-300 transition-colors duration-200 focus-within:border-teal-600">
                <input
                  className="w-full bg-transparent px-0 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                  id="email"
                  placeholder="Enter your email address"
                  type="email"
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <div className="relative border-b border-slate-300 transition-colors duration-200 focus-within:border-teal-600">
                <input
                  className="w-full bg-transparent pl-0 pr-9 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                  id="password"
                  placeholder="Enter your password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(ev) => setPassword(ev.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-0.5 text-slate-500 transition hover:text-slate-700"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <IoEyeOffOutline className="size-4" /> : <IoEyeOutline className="size-4" />}
                </button>
              </div>
              <p className="mt-2 text-right text-sm">
                <Link className="text-slate-600 hover:text-teal-700 hover:underline" to="/forgetpassword">
                  Forgot Password?
                </Link>
              </p>
            </div>

            <button
              className="w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Logging in…' : 'Login'}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">OR</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <button
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            type="button"
          >
            <img alt="Google logo" className="h-5 w-5 object-contain" src={googleLogo} />
            Continue with Google
          </button>

          <p className="mt-6 text-center text-sm text-slate-600">
            By joining, you agree to the <span className="underline">Terms</span> and <span className="underline">Privacy Policy.</span>
          </p>
        </section>
      </main>
      <Footer />
      <Copyright />
    </>
  )
}

export default Login
