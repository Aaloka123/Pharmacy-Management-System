import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ClipboardEvent } from 'react'
import Header from '../UserComponents/Header'
import Footer from '../UserComponents/Footer'
import Copyright from '../UserComponents/Copyright'
import { Link, useNavigate } from 'react-router-dom'
import { IoEyeOffOutline, IoEyeOutline } from 'react-icons/io5'
import { toast } from 'react-toastify'
import { resolveBackendUrl } from '../lib/api'
import { homePathForRole, setAuthSession, type AuthUser } from '../lib/auth'

const VENDOR_LOGIN_URL = '/api/auth/vendor/login'
const VENDOR_VERIFY_OTP_URL = '/api/auth/vendor/verify-otp'
const OTP_LENGTH = 6
const EMPTY_OTP = Array.from({ length: OTP_LENGTH }, () => '')
const MIN_LOGIN_WAIT_MS = 5000

type VendorAuthResponse = { accessToken: string; refreshToken: string; user: AuthUser }

type PendingOtpResponse = {
  otpRequired: boolean
  otpToken: string
  maskedEmail: string
  message: string
}

const Vendorlogin = () => {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials')
  const [otpToken, setOtpToken] = useState('')
  const [maskedEmail, setMaskedEmail] = useState('')
  const [otpDigits, setOtpDigits] = useState<string[]>(EMPTY_OTP)
  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    if (step === 'otp') {
      otpInputRefs.current[0]?.focus()
    }
  }, [step])

  const completeLogin = (body: VendorAuthResponse) => {
    setAuthSession(body.user, body.accessToken, body.refreshToken)
    toast.success(`Welcome back, ${body.user.fullName.split(' ')[0]}!`)
    navigate(homePathForRole('VENDOR'), { replace: true })
  }

  const waitForMinimumLoginDelay = async (startedAt: number) => {
    const elapsed = Date.now() - startedAt
    const remaining = MIN_LOGIN_WAIT_MS - elapsed
    if (remaining > 0) {
      await new Promise((resolve) => setTimeout(resolve, remaining))
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    const startedAt = Date.now()
    try {
      const res = await fetch(resolveBackendUrl(VENDOR_LOGIN_URL), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })

      if (!res.ok) {
        await waitForMinimumLoginDelay(startedAt)
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

      const body = (await res.json()) as PendingOtpResponse
      await waitForMinimumLoginDelay(startedAt)
      setOtpToken(body.otpToken)
      setMaskedEmail(body.maskedEmail)
      setOtpDigits(EMPTY_OTP)
      setStep('otp')
    } catch {
      await waitForMinimumLoginDelay(startedAt)
      toast.error('Could not reach the server. Is the backend running on port 8080?')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    setOtpDigits((prev) => {
      const next = [...prev]
      next[index] = digit
      return next
    })
    if (digit && index < OTP_LENGTH - 1) {
      otpInputRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!pasted) return
    const next = EMPTY_OTP.map((_, index) => pasted[index] ?? '')
    setOtpDigits(next)
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1)
    otpInputRefs.current[focusIndex]?.focus()
  }

  const handleVerifyOtp = async (event: FormEvent) => {
    event.preventDefault()
    const code = otpDigits.join('')
    if (!/^\d{6}$/.test(code)) {
      toast.error('Enter the 6-digit code from your email.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(resolveBackendUrl(VENDOR_VERIFY_OTP_URL), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otpToken, code }),
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

      const body = (await res.json()) as VendorAuthResponse
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
    setOtpDigits(EMPTY_OTP)
    setMaskedEmail('')
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

            {step === 'credentials' ? (
              <>
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-500 transition hover:text-slate-700"
                      >
                        {showPassword ? <IoEyeOffOutline className="size-5" /> : <IoEyeOutline className="size-5" />}
                      </button>
                    </div>
                  </label>

                  <p className="text-right text-sm">
                    <Link className="text-slate-600 hover:text-teal-700 hover:underline" to="/forgetpassword?account=vendor">
                      Forgot Password?
                    </Link>
                  </p>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full cursor-pointer rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? 'Please wait…' : 'Continue'}
                    </button>
                  </div>
                </form>

                <p className="mt-5 text-center text-sm text-slate-600">
                  New to MedNexux?{' '}
                  <Link className="font-semibold text-teal-700 hover:underline" to="/vendorsignup">
                    Create a vendor account
                  </Link>
                </p>
              </>
            ) : (
              <>
                <h1 className="mt-4 text-3xl font-bold leading-tight text-slate-900">Verify your email</h1>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  We sent a 6-digit code to <span className="font-medium text-slate-800">{maskedEmail}</span>
                </p>

                <form className="mt-6 space-y-5" onSubmit={handleVerifyOtp}>
                  <div>
                    <p className="mb-3 text-sm font-semibold text-slate-700">Verification code</p>
                    <div className="flex justify-center gap-2 sm:gap-3">
                      {otpDigits.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => {
                            otpInputRefs.current[index] = el
                          }}
                          aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
                          autoComplete={index === 0 ? 'one-time-code' : 'off'}
                          className="h-12 w-10 rounded-lg border border-slate-300 text-center text-lg font-semibold text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 sm:h-14 sm:w-12"
                          inputMode="numeric"
                          maxLength={1}
                          onChange={(ev) => handleOtpDigitChange(index, ev.target.value)}
                          onKeyDown={(ev) => handleOtpKeyDown(index, ev)}
                          onPaste={index === 0 ? handleOtpPaste : undefined}
                          required
                          type="text"
                          value={digit}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    className="w-full cursor-pointer rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={loading}
                    type="submit"
                  >
                    {loading ? 'Verifying…' : 'Verify & continue'}
                  </button>

                  <button
                    className="w-full cursor-pointer text-sm font-medium text-slate-600 transition hover:text-teal-700"
                    onClick={handleBackToLogin}
                    type="button"
                  >
                    Back to login
                  </button>
                </form>
              </>
            )}
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
              className="mt-6 w-full cursor-pointer rounded-xl bg-white/20 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/30"
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
