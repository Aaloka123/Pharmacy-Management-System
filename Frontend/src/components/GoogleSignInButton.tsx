import { useCallback, useState } from 'react'
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import googleLogo from '../assets/Google.png'
import { homePathForRole, setAuthSession, type Role } from '../lib/auth'
import { completeGoogleSignIn } from '../lib/googleAuth'

const PLATFORM_ROLES: Role[] = ['USER', 'ADMIN']

type GoogleSignInButtonProps = {
  allowedRoles?: Role[]
}

const GoogleSignInButton = ({ allowedRoles = PLATFORM_ROLES }: GoogleSignInButtonProps) => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleSuccess = useCallback(
    async (response: CredentialResponse) => {
      const idToken = response.credential
      if (!idToken) {
        toast.error('Google did not return a sign-in token. Please try again.')
        return
      }

      setLoading(true)
      try {
        const session = await completeGoogleSignIn(idToken)

        if (!allowedRoles.includes(session.user.role)) {
          toast.error(
            session.user.role === 'VENDOR'
              ? 'This account is registered as a vendor. Please use vendor login.'
              : 'This account cannot sign in here.',
          )
          return
        }

        setAuthSession(session.user, session.accessToken, session.refreshToken)
        const firstName = session.user.fullName.trim().split(/\s+/)[0]
        toast.success(firstName ? `Welcome, ${firstName}!` : 'Welcome!')
        navigate(homePathForRole(session.user.role), { replace: true })
      } catch (err) {
        if (err instanceof TypeError) {
          toast.error('Could not reach the server. Is the backend running on port 8080?')
          return
        }
        toast.error(err instanceof Error ? err.message : 'Google sign-in failed. Please try again.')
      } finally {
        setLoading(false)
      }
    },
    [allowedRoles, navigate],
  )

  const handleError = useCallback(() => {
    toast.error('Google sign-in was cancelled or could not start.')
  }, [])

  return (
    <div className="relative w-full">
      <div
        className={`pointer-events-none flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 ${loading ? 'opacity-60' : ''}`}
        aria-hidden
      >
        <img alt="" className="h-5 w-5 object-contain" src={googleLogo} />
        {loading ? 'Signing in with Google…' : 'Continue with Google'}
      </div>

      {loading && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center rounded-lg border border-slate-300 bg-white/90"
          aria-busy="true"
          aria-label="Signing in with Google"
        />
      )}

      <div
        className={`absolute inset-0 overflow-hidden opacity-[0.011] ${loading ? 'pointer-events-none' : ''} [&>div]:h-full! [&>div]:w-full! [&_iframe]:h-full! [&_iframe]:w-full!`}
        title="Continue with Google"
      >
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={handleError}
          type="standard"
          theme="outline"
          size="large"
          text="continue_with"
          shape="rectangular"
          width="400"
        />
      </div>
    </div>
  )
}

export default GoogleSignInButton
