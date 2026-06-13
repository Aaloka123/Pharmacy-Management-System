import { useEffect, useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from 'react'
import Copyright from '../UserComponents/Copyright'
import Footer from '../UserComponents/Footer'
import Header from '../UserComponents/Header'
import { Link, useNavigate } from 'react-router-dom'
import { IoEyeOffOutline, IoEyeOutline } from 'react-icons/io5'
import { toast } from 'react-toastify'
import { resolveBackendUrl } from '../lib/api'

const FORGOT_PASSWORD_URL = '/api/auth/forgot-password'
const RESET_PASSWORD_URL = '/api/auth/reset-password'
const OTP_LENGTH = 6
const EMPTY_OTP = Array.from({ length: OTP_LENGTH }, () => '')
const MIN_REQUEST_WAIT_MS = 5000

type PendingOtpResponse = {
  otpRequired: boolean
  otpToken: string
  maskedEmail: string
  message: string
}

const ForgetPassword = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState<'email' | 'otp' | 'password'>('email')
  const [email, setEmail] = useState('')
  const [otpToken, setOtpToken] = useState('')
  const [maskedEmail, setMaskedEmail] = useState('')
  const [otpDigits, setOtpDigits] = useState<string[]>(EMPTY_OTP)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    if (step === 'otp') {
      otpInputRefs.current[0]?.focus()
    }
  }, [step])

  const waitForMinimumDelay = async (startedAt: number) => {
    const elapsed = Date.now() - startedAt
    const remaining = MIN_REQUEST_WAIT_MS - elapsed
    if (remaining > 0) {
      await new Promise((resolve) => setTimeout(resolve, remaining))
    }
  }

  const handleSendCode = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    const startedAt = Date.now()
    try {
      const res = await fetch(resolveBackendUrl(FORGOT_PASSWORD_URL), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })

      if (!res.ok) {
        await waitForMinimumDelay(startedAt)
        if (res.status === 404) {
          toast.error('No account found with this email address.')
        } else {
          toast.error('Could not send reset code. Please try again.')
        }
        return
      }

      const body = (await res.json()) as PendingOtpResponse
      await waitForMinimumDelay(startedAt)
      setOtpToken(body.otpToken)
      setMaskedEmail(body.maskedEmail)
      setOtpDigits(EMPTY_OTP)
      setStep('otp')
      toast.success('Check your email for the 6-digit reset code.')
    } catch {
      await waitForMinimumDelay(startedAt)
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

  const handleContinueToPassword = (event: FormEvent) => {
    event.preventDefault()
    const code = otpDigits.join('')
    if (!/^\d{6}$/.test(code)) {
      toast.error('Enter the 6-digit code from your email.')
      return
    }
    setStep('password')
  }

  const handleResetPassword = async (event: FormEvent) => {
    event.preventDefault()
    const code = otpDigits.join('')
    if (!/^\d{6}$/.test(code)) {
      toast.error('Enter the 6-digit code from your email.')
      setStep('otp')
      return
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(resolveBackendUrl(RESET_PASSWORD_URL), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otpToken, code, newPassword }),
      })

      if (!res.ok) {
        let message = 'Password reset failed. Please try again.'
        try {
          const problem = (await res.json()) as { detail?: string }
          if (problem.detail) message = problem.detail
        } catch {
          /* ignore parse errors */
        }
        toast.error(message)
        return
      }

      toast.success('Password updated! You can now log in.')
      navigate('/login', { replace: true })
    } catch {
      toast.error('Could not reach the server. Is the backend running on port 8080?')
    } finally {
      setLoading(false)
    }
  }

  const handleBackToEmail = () => {
    setStep('email')
    setOtpToken('')
    setOtpDigits(EMPTY_OTP)
    setMaskedEmail('')
    setNewPassword('')
    setConfirmPassword('')
  }

  const handleBackToOtp = () => {
    setStep('otp')
    setNewPassword('')
    setConfirmPassword('')
  }

  return (
    <>
      <Header />
      <main className="flex min-h-[calc(100vh-80px)] items-center justify-center bg-white px-4 py-10">
        <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
          {step === 'email' && (
            <>
              <h1 className="text-center text-2xl font-bold text-slate-900">Forgot password</h1>
              <p className="mt-2 text-center text-sm text-slate-500">
                Enter your email and we&apos;ll send you a 6-digit code to reset your password.
              </p>

              <form className="mt-8 space-y-6" onSubmit={handleSendCode}>
                <div>
                  <div className="border-b border-slate-300 transition-colors duration-75 focus-within:border-teal-600">
                    <input
                      autoComplete="email"
                      className="w-full bg-transparent px-0 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                      id="email"
                      onChange={(ev) => setEmail(ev.target.value)}
                      placeholder="Enter your email address"
                      required
                      type="email"
                      value={email}
                    />
                  </div>
                </div>

                <button
                  className="w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
                  disabled={loading}
                  type="submit"
                >
                  {loading ? 'Please wait…' : 'Send reset code'}
                </button>
              </form>
            </>
          )}

          {step === 'otp' && (
            <>
              <h1 className="text-center text-2xl font-bold text-slate-900">Enter verification code</h1>
              <p className="mt-2 text-center text-sm text-slate-500">
                We sent a 6-digit code to <span className="font-medium text-slate-700">{maskedEmail}</span>
              </p>

              <form className="mt-8 space-y-6" onSubmit={handleContinueToPassword}>
                <div>
                  <p className="mb-3 text-sm font-medium text-slate-700">Verification code</p>
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
                  className="w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
                  type="submit"
                >
                  Continue
                </button>

                <button
                  className="w-full text-sm font-medium text-slate-600 transition hover:text-teal-700"
                  onClick={handleBackToEmail}
                  type="button"
                >
                  Back to email
                </button>
              </form>
            </>
          )}

          {step === 'password' && (
            <>
              <h1 className="text-center text-2xl font-bold text-slate-900">Set new password</h1>
              <p className="mt-2 text-center text-sm text-slate-500">Choose a new password for your account.</p>

              <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
                <div>
                  <div className="relative border-b border-slate-300 transition-colors duration-75 focus-within:border-teal-600">
                    <input
                      autoComplete="new-password"
                      className="w-full bg-transparent pl-0 pr-9 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                      id="new-password"
                      onChange={(ev) => setNewPassword(ev.target.value)}
                      placeholder="New password"
                      required
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                    />
                    <button
                      className="absolute right-0 top-1/2 -translate-y-1/2 p-0.5 text-slate-500 transition hover:text-slate-700"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      type="button"
                    >
                      {showNewPassword ? <IoEyeOffOutline className="size-4" /> : <IoEyeOutline className="size-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="relative border-b border-slate-300 transition-colors duration-75 focus-within:border-teal-600">
                    <input
                      autoComplete="new-password"
                      className="w-full bg-transparent pl-0 pr-9 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                      id="confirm-password"
                      onChange={(ev) => setConfirmPassword(ev.target.value)}
                      placeholder="Confirm new password"
                      required
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                    />
                    <button
                      className="absolute right-0 top-1/2 -translate-y-1/2 p-0.5 text-slate-500 transition hover:text-slate-700"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      type="button"
                    >
                      {showConfirmPassword ? (
                        <IoEyeOffOutline className="size-4" />
                      ) : (
                        <IoEyeOutline className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  className="w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
                  disabled={loading}
                  type="submit"
                >
                  {loading ? 'Updating…' : 'Reset password'}
                </button>

                <button
                  className="w-full text-sm font-medium text-slate-600 transition hover:text-teal-700"
                  onClick={handleBackToOtp}
                  type="button"
                >
                  Back to code
                </button>
              </form>
            </>
          )}

          <p className="mt-6 text-center text-sm text-slate-600">
            Remember your password?{' '}
            <Link className="font-medium text-teal-700 hover:text-teal-800" to="/login">
              Back to login
            </Link>
          </p>
        </section>
      </main>
      <Footer />
      <Copyright />
    </>
  )
}

export default ForgetPassword
