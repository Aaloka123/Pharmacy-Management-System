import AdminNavbar from '../AdminComponents/AdminNavbar'
import { useState } from 'react'

const AdminSettings = () => {
  const [isProfileEditing, setIsProfileEditing] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminNavbar />
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold text-slate-900">Admin Settings</h1>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Profile Settings</h2>
              <button
                aria-label="Edit profile settings"
                className="rounded-md border border-slate-300 p-2 text-slate-600"
                onClick={() => setIsProfileEditing(true)}
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
                  defaultValue="Admin User"
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
                  className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none ${
                    isProfileEditing ? 'focus:border-teal-600' : 'cursor-not-allowed bg-slate-100'
                  }`}
                  defaultValue="admin@mednexus.com"
                  id="adminEmail"
                  readOnly={!isProfileEditing}
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
                  defaultValue="+977-9800000000"
                  id="adminPhone"
                  readOnly={!isProfileEditing}
                  type="text"
                />
              </div>
              {isProfileEditing && (
                <div className="pt-1">
                  <button
                    className="rounded-lg bg-teal-600 px-5 py-2 text-sm font-semibold text-white"
                    onClick={() => setIsProfileEditing(false)}
                    type="button"
                  >
                    Save Profile
                  </button>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
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
                    type={showCurrentPassword ? 'text' : 'password'}
                  />
                  <button
                    aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                    onClick={() => setShowCurrentPassword((prev) => !prev)}
                    type="button"
                  >
                    {showCurrentPassword ? (
                      <svg className="size-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7Z" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M3 3l18 18" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <svg className="size-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
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
                    placeholder="Enter new password"
                    type={showNewPassword ? 'text' : 'password'}
                  />
                  <button
                    aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    type="button"
                  >
                    {showNewPassword ? (
                      <svg className="size-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7Z" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M3 3l18 18" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <svg className="size-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
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
                    type={showConfirmPassword ? 'text' : 'password'}
                  />
                  <button
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    type="button"
                  >
                    {showConfirmPassword ? (
                      <svg className="size-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7Z" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M3 3l18 18" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <svg className="size-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div className="pt-1">
                <button className="rounded-lg bg-teal-600 px-5 py-2 text-sm font-semibold text-white" type="button">
                  Save Password
                </button>
              </div>
            </div>
          </section>

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
            <button className="rounded-lg bg-teal-600 px-5 py-2 text-sm font-semibold text-white" type="button">
              Create Admin
            </button>
          </div>
        </section>

      </main>
    </div>
  )
}

export default AdminSettings
