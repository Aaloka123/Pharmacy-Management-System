import AdminNavbar from '../AdminComponents/AdminNavbar'
import { AdminMain, FadeInOnScroll } from '../components/PortalMain'
import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { IoEyeOffOutline, IoEyeOutline } from 'react-icons/io5'
import { api, ApiRequestError } from '../lib/api'
import { getStoredUser, onAuthChange, setStoredUser, type AuthUser } from '../lib/auth'

const AdminSettings = () => {
  const navigate = useNavigate()
  const [isProfileEditing, setIsProfileEditing] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const stored = getStoredUser()
  const [adminId, setAdminId] = useState<number | null>(stored?.id ?? null)
  const [adminName, setAdminName] = useState(stored?.fullName ?? '')
  const [adminEmail, setAdminEmail] = useState(stored?.email ?? '')
  const [adminPhone, setAdminPhone] = useState(stored?.phoneNumber ?? '')

  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  useEffect(() => {
    if (!getStoredUser()) {
      navigate('/login', { replace: true })
      return
    }
    const unsubscribe = onAuthChange(() => {
      const u = getStoredUser()
      if (!u) {
        navigate('/login', { replace: true })
        return
      }
      setAdminId(u.id)
      setAdminName(u.fullName)
      setAdminEmail(u.email)
      setAdminPhone(u.phoneNumber)
    })
    return unsubscribe
  }, [navigate])

  const handleProfileSave = async (event: FormEvent) => {
    event.preventDefault()
    if (!adminId) {
      toast.error('Session expired. Please log in again.')
      navigate('/login')
      return
    }
    setIsSavingProfile(true)
    try {
      const { data: updated } = await api.patch<AuthUser>('/api/users/me', {
        fullName: adminName.trim(),
        phoneNumber: adminPhone.trim(),
      })
      setStoredUser(updated)
      setAdminName(updated.fullName)
      setAdminPhone(updated.phoneNumber)
      setIsProfileEditing(false)
      toast.success('Profile updated successfully.')
    } catch (e) {
      if (e instanceof ApiRequestError && e.response.status === 401) {
        toast.error('Session expired. Please log in again.')
      } else {
        toast.error('Could not reach the server.')
      }
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handlePasswordSave = async (event: FormEvent) => {
    event.preventDefault()
    if (!adminId) {
      toast.error('Session expired. Please log in again.')
      navigate('/login')
      return
    }
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields.')
      return
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password must match.')
      return
    }
    setIsSavingPassword(true)
    try {
      await api.post('/api/users/me/password', { currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast.success('Password updated successfully.')
    } catch (e) {
      if (e instanceof ApiRequestError) {
        if (e.response.status === 401) {
          toast.error('Current password is incorrect.')
        } else if (e.response.status === 400) {
          toast.error('New password is too short. Use at least 6 characters.')
        } else {
          toast.error('Failed to update password.')
        }
      } else {
        toast.error('Could not reach the server.')
      }
    } finally {
      setIsSavingPassword(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminNavbar />
      <AdminMain>
      <FadeInOnScroll>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Settings</h1>
          <p className="mt-1 text-sm text-slate-600">Manage profile, passwords, and admin accounts.</p>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <form
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            onSubmit={handleProfileSave}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Profile Settings</h2>
              <button
                aria-label="Edit profile settings"
                className="cursor-pointer rounded-md border border-slate-300 p-2 text-slate-600"
                onClick={() => setIsProfileEditing((prev) => !prev)}
                type="button"
              >
                <svg className="size-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="m16.862 3.487 3.65 3.65M4.5 19.5l4.5-1 10.512-10.512a2.121 2.121 0 0 0-3-3L6 15.5l-1.5 4Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="adminName">
                  Admin Name
                </label>
                <input
                  className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none ${
                    isProfileEditing ? 'focus:border-teal-600' : 'cursor-not-allowed bg-slate-100'
                  }`}
                  value={adminName}
                  onChange={(event) => setAdminName(event.target.value)}
                  id="adminName"
                  readOnly={!isProfileEditing}
                  type="text"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="adminEmail">
                  Email
                </label>
                <input
                  className="w-full cursor-not-allowed rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-800 outline-none"
                  value={adminEmail}
                  id="adminEmail"
                  readOnly
                  type="email"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="adminPhone">
                  Phone Number
                </label>
                <input
                  className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none ${
                    isProfileEditing ? 'focus:border-teal-600' : 'cursor-not-allowed bg-slate-100'
                  }`}
                  value={adminPhone}
                  onChange={(event) => setAdminPhone(event.target.value.replace(/\D/g, '').slice(0, 10))}
                  id="adminPhone"
                  readOnly={!isProfileEditing}
                  inputMode="numeric"
                  maxLength={10}
                  type="text"
                />
              </div>
              {isProfileEditing && (
                <div className="pt-1">
                  <button
                    className="cursor-pointer rounded-lg bg-teal-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    disabled={isSavingProfile}
                    type="submit"
                  >
                    {isSavingProfile ? 'Saving…' : 'Save Profile'}
                  </button>
                </div>
              )}
            </div>
          </form>

          <form
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            onSubmit={handlePasswordSave}
          >
            <h2 className="text-lg font-semibold text-slate-900">Security</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="currentPassword">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-10 text-sm text-slate-800 outline-none focus:border-teal-600"
                    id="currentPassword"
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    type={showCurrentPassword ? 'text' : 'password'}
                  />
                  <button
                    aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                    onClick={() => setShowCurrentPassword((prev) => !prev)}
                    type="button"
                  >
                    {showCurrentPassword ? <IoEyeOffOutline className="size-4" /> : <IoEyeOutline className="size-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="newPassword">
                  New Password
                </label>
                <div className="relative">
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-10 text-sm text-slate-800 outline-none focus:border-teal-600"
                    id="newPassword"
                    placeholder="Enter new password (min 6 chars)"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    type={showNewPassword ? 'text' : 'password'}
                  />
                  <button
                    aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    type="button"
                  >
                    {showNewPassword ? <IoEyeOffOutline className="size-4" /> : <IoEyeOutline className="size-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-10 text-sm text-slate-800 outline-none focus:border-teal-600"
                    id="confirmPassword"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    type={showConfirmPassword ? 'text' : 'password'}
                  />
                  <button
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    type="button"
                  >
                    {showConfirmPassword ? <IoEyeOffOutline className="size-4" /> : <IoEyeOutline className="size-4" />}
                  </button>
                </div>
              </div>
              <div className="pt-1">
                <button
                  className="cursor-pointer rounded-lg bg-teal-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  disabled={isSavingPassword}
                  type="submit"
                >
                  {isSavingPassword ? 'Saving…' : 'Save Password'}
                </button>
              </div>
            </div>
          </form>

        </div>

        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Create New Admin</h2>
          <p className="mt-1 text-sm text-slate-600">Add another admin who can access the admin dashboard.</p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="newAdminName">
                Full Name
              </label>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-teal-600"
                id="newAdminName"
                placeholder="Enter full name"
                type="text"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="newAdminEmail">
                Email
              </label>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-teal-600"
                id="newAdminEmail"
                placeholder="Enter admin email"
                type="email"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="newAdminRole">
                Role
              </label>
              <select
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-teal-600"
                defaultValue="Admin"
                id="newAdminRole"
              >
                <option>Admin</option>
                <option>Super Admin</option>
                <option>Moderator Admin</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="newAdminPassword">
                Temporary Password
              </label>
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-teal-600"
                id="newAdminPassword"
                placeholder="Set temporary password"
                type="password"
              />
            </div>
          </div>

          <div className="mt-5">
            <button className="cursor-pointer rounded-lg bg-teal-600 px-5 py-2 text-sm font-semibold text-white" type="button">
              Create Admin
            </button>
          </div>
        </section>

      </FadeInOnScroll>
      </AdminMain>
    </div>
  )
}

export default AdminSettings
