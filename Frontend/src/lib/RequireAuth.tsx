import { Navigate, useLocation } from 'react-router-dom'
import { getStoredUser, homePathForRole, type Role } from './auth'

type RequireAuthProps = {
  children: React.ReactNode
  roles?: Role[]
  loginPath?: string
}

const RequireAuth = ({ children, roles, loginPath = '/login' }: RequireAuthProps) => {
  const location = useLocation()
  const user = getStoredUser()

  if (!user) {
    return <Navigate to={loginPath} replace state={{ from: location.pathname }} />
  }

  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to={homePathForRole(user.role)} replace />
  }

  return <>{children}</>
}

export default RequireAuth
