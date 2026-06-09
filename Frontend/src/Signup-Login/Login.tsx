import GoogleSignInButton from '../components/GoogleSignInButton'
import Copyright from '../UserComponents/Copyright'
import Footer from '../UserComponents/Footer'
import Header from '../UserComponents/Header'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { IoEyeOffOutline, IoEyeOutline } from 'react-icons/io5'
import { toast } from 'react-toastify'
import { resolveBackendUrl } from '../lib/api'
import { homePathForRole, setAuthSession, type AuthUser } from '../lib/auth'

const LOGIN_URL = '/api/auth/login'
const VERIFY_OTP_URL = '/api/auth/verify-otp'

type AuthLoginResponse = { accessToken: string; refreshToken: string; user: AuthUser }

type PendingOtpResponse = {
  otpRequired: boolean
  otpToken: string
  maskedEmail: string
  message: string
}

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials')
  const [otpToken, setOtpToken] = useState('')
  const [maskedEmail, setMaskedEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')

  useEffect(() => {
    const fromSignup = location.state as { email?: string } | undefined
    if (fromSignup?.email) {
      setEmail(fromSignup.email)
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.pathname, location.state, navigate])

  const completeLogin = (body: AuthLoginResponse) => {
    setAuthSession(body.user, body.accessToken, body.refreshToken)
    toast.success(`Welcome back, ${body.user.fullName.split(' ')[0]}!`)
    const from = (location.state as { from?: string } | null)?.from
    navigate(from ?? homePathForRole(body.user.role), { replace: true })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(resolveBackendUrl(LOGIN_URL), {
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

      const body = (await res.json()) as PendingOtpResponse
      setOtpToken(body.otpToken)
      setMaskedEmail(body.maskedEmail)
      setOtpCode('')
      setStep('otp')
      toast.info(body.message)
    } catch {
      toast.error('Could not reach the server. Is the backend running on port 8080?')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^\d{6}$/.test(otpCode.trim())) {
      toast.error('Enter the 6-digit code from your email.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(resolveBackendUrl(VERIFY_OTP_URL), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otpToken, code: otpCode.trim() }),
      })

      if (!res.ok) {
        let message = 'Verification failed. Please try again.'
        try {
          const problem = (await res.json()) as { detail?: string }
          if (problem.detail) message = problem.detail
        } catch {
          /* ignore parse errors */
        }
        toast.error(message)
        return
      }

      const body = (await res.json()) as AuthLoginResponse
      completeLogin(body)
    } catch {
      toast.error('Could not reach the server. Is the backend running on port 8080?')
    } finally {
      setLoading(false)
    }
  }

  const handleBackToLogin = () => {
    setStep('credentials')
    setOtpToken('')
    setOtpCode('')
    setMaskedEmail('')
  }

  return (
    <>
      <Header />
      <main className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-white px-4 py-10">
        <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
          {step === 'credentials' ? (
            <>
              <h1 className="text-center text-2xl font-bold text-slate-900">Login</h1>
              <p className="mt-2 text-center text-sm text-slate-500">
                Don&apos;t have an account?{' '}
                <Link className="font-medium text-teal-700 hover:text-teal-800" to="/signup">
                  Signup
                </Link>
              </p>

              <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                <div>
                  <div className="border-b border-slate-300 transition-colors duration-75 focus-within:border-teal-600">
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
                  <div className="relative border-b border-slate-300 transition-colors duration-75 focus-within:border-teal-600">
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
                  {loading ? 'Sending code…' : 'Login'}
                </button>
              </form>

              <div className="my-6 flex items-center gap-3">
                <span className="h-px flex-1 bg-slate-200" />
                <span className="text-xs font-medium uppercase tracking-wide text-slate-400">OR</span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>

              <GoogleSignInButton />
            </>
          ) : (
            <>
              <h1 className="text-center text-2xl font-bold text-slate-900">Verify your email</h1>
              <p className="mt-2 text-center text-sm text-slate-500">
                We sent a 6-digit code to <span className="font-medium text-slate-700">{maskedEmail}</span>
              </p>

              <form className="mt-8 space-y-6" onSubmit={handleVerifyOtp}>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="otp">
                    Verification code
                  </label>
                  <input
                    autoComplete="one-time-code"
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-center text-lg tracking-[0.4em] text-slate-900 outline-none transition focus:border-teal-600"
                    id="otp"
                    inputMode="numeric"
                    maxLength={6}
                    onChange={(ev) => setOtpCode(ev.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    required
                    type="text"
                    value={otpCode}
                  />
                </div>

                <button
                  className="w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
                  disabled={loading}
                  type="submit"
                >
                  {loading ? 'Verifying…' : 'Verify & continue'}
                </button>

                <button
                  className="w-full text-sm font-medium text-slate-600 transition hover:text-teal-700"
                  onClick={handleBackToLogin}
                  type="button"
                >
                  Back to login
                </button>
              </form>
            </>
          )}

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
