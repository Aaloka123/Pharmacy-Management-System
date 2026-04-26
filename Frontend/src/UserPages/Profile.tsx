import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import Footer from '../UserComponents/Footer'
import Copyright from '../UserComponents/Copyright'
import Header from '../UserComponents/Header'
import AalokaImage from '../assets/aaloka.png'

const Profile = () => {
  const [fullName, setFullName] = useState('Aaloka Poudel')
  const [phoneNumber, setPhoneNumber] = useState('+977 9812345678')
  const [email, setEmail] = useState('aalokapoudel@gmail.com')
  const [location, setLocation] = useState('Dhapakhel, Lalitpur')
  const [profileImage, setProfileImage] = useState<string | null>(AalokaImage)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const passwordError = useMemo(() => {
    if (!currentPassword && !newPassword && !confirmPassword) return ''
    if (newPassword.length > 0 && newPassword.length < 8) return 'New password must be at least 8 characters.'
    if (newPassword !== confirmPassword) return 'New password and confirm password must match.'
    return ''
  }, [currentPassword, newPassword, confirmPassword])

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const imageUrl = URL.createObjectURL(file)
    setProfileImage(imageUrl)
  }

  const handleProfileSave = (event: FormEvent) => {
    event.preventDefault()
    setIsEditingProfile(false)
    window.alert('Profile details updated successfully.')
  }

  const handlePasswordSave = (event: FormEvent) => {
    event.preventDefault()
    if (passwordError) return
    if (!currentPassword || !newPassword || !confirmPassword) return
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    window.alert('Password updated successfully.')
  }

  const handleDeleteAccount = () => {
    const confirmed = window.confirm('Are you sure you want to delete your account? This action cannot be undone.')
    if (!confirmed) return
    window.alert('Your account has been deleted.')
  }

  const handleLogout = () => {
    window.alert('You have been logged out.')
  }

  return (
    <div className="bg-white">
      <Header />
      <main className="px-[80px] py-10">
        <section className="mx-auto max-w-[1100px]">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
            <p className="mt-2 text-sm text-slate-600">Manage your account details and security settings.</p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
            <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-bold text-slate-900">Profile Picture</h2>

              <div className="mt-5 flex items-center justify-center">
                <div className="relative">
                  {profileImage ? (
                    <img alt="Profile preview" className="h-36 w-36 rounded-full border border-slate-200 object-cover" src={profileImage} />
                  ) : (
                    <div className="flex h-36 w-36 items-center justify-center rounded-full border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
                      No photo
                    </div>
                  )}
                  <button
                    aria-label="Edit profile picture"
                    className="absolute bottom-1 right-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-teal-500 hover:text-teal-700"
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                  >
                    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <path
                        d="M4 20h4l10-10-4-4L4 16v4Zm12-14 2 2m-1-5a1.5 1.5 0 0 1 2.12 0l1.88 1.88a1.5 1.5 0 0 1 0 2.12L19 8l-4-4 1-1Z"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                      />
                    </svg>
                  </button>
                  <input accept="image/*" className="hidden" onChange={handleImageChange} ref={fileInputRef} type="file" />
                </div>
              </div>
              <p className="mt-4 text-center text-[16px] font-bold text-slate-900">Aaloka Poudel</p>
              <p className="mt-1 text-center text-sm text-slate-600">aalokapoudel@gmail.com</p>
            </aside>

            <div className="space-y-6">
              <form className="rounded-2xl border border-slate-200 bg-white p-6" onSubmit={handleProfileSave}>
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-lg font-bold text-slate-900">Personal Information</h2>
                  <button
                    aria-label={isEditingProfile ? 'Disable profile editing' : 'Enable profile editing'}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-teal-500 hover:text-teal-700"
                    onClick={() => setIsEditingProfile((prev) => !prev)}
                    type="button"
                  >
                    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <path
                        d="M4 20h4l10-10-4-4L4 16v4Zm12-14 2 2m-1-5a1.5 1.5 0 0 1 2.12 0l1.88 1.88a1.5 1.5 0 0 1 0 2.12L19 8l-4-4 1-1Z"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                      />
                    </svg>
                  </button>
                </div>
                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-sm text-slate-600">Full Name</span>
                    <input
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                      disabled={!isEditingProfile}
                      onChange={(e) => setFullName(e.target.value)}
                      type="text"
                      value={fullName}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm text-slate-600">Phone Number</span>
                    <input
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                      disabled={!isEditingProfile}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      type="tel"
                      value={phoneNumber}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm text-slate-600">Email Address</span>
                    <input
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                      disabled={!isEditingProfile}
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      value={email}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm text-slate-600">Location</span>
                    <input
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                      disabled={!isEditingProfile}
                      onChange={(e) => setLocation(e.target.value)}
                      type="text"
                      value={location}
                    />
                  </label>
                </div>
                {isEditingProfile ? (
                  <button
                    className="mt-5 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-800"
                    type="submit"
                  >
                    Save Profile
                  </button>
                ) : null}
              </form>

              <section className="rounded-2xl border border-slate-200 bg-white p-6">
                <h2 className="text-lg font-bold text-slate-900">Account Setting</h2>

                <div className="mt-5 space-y-4">
                  <section className="rounded-xl border border-slate-200 bg-white p-5">
                    <button
                      aria-label="Toggle change password section"
                      className="flex w-full items-center justify-between gap-4 text-left"
                      onClick={() => setShowPasswordForm((prev) => !prev)}
                      type="button"
                    >
                      <h3 className="text-[14px] text-slate-900" style={{ fontWeight: 600 }}>Change Password</h3>
                      <span className="inline-flex items-center justify-center text-slate-600 transition hover:text-teal-700">
                        <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <path
                            d={showPasswordForm ? 'm15 5-7 7 7 7' : 'm9 5 7 7-7 7'}
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                          />
                        </svg>
                      </span>
                    </button>

                    {showPasswordForm ? (
                      <form className="mt-5" onSubmit={handlePasswordSave}>
                        <div className="grid grid-cols-1 gap-4">
                          <label className="block">
                            <span className="mb-1.5 block text-sm text-slate-600">Current Password</span>
                            <div className="relative">
                              <input
                                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 pr-10 text-sm text-slate-800 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                type={showCurrentPassword ? 'text' : 'password'}
                                value={currentPassword}
                              />
                              <button
                                aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-700"
                                onClick={() => setShowCurrentPassword((prev) => !prev)}
                                type="button"
                              >
                                {showCurrentPassword ? (
                                  <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7Z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
                                  </svg>
                                ) : (
                                  <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </label>
                          <label className="block">
                            <span className="mb-1.5 block text-sm text-slate-600">New Password</span>
                            <div className="relative">
                              <input
                                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 pr-10 text-sm text-slate-800 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                                onChange={(e) => setNewPassword(e.target.value)}
                                type={showNewPassword ? 'text' : 'password'}
                                value={newPassword}
                              />
                              <button
                                aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-700"
                                onClick={() => setShowNewPassword((prev) => !prev)}
                                type="button"
                              >
                                {showNewPassword ? (
                                  <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7Z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
                                  </svg>
                                ) : (
                                  <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </label>
                          <label className="block">
                            <span className="mb-1.5 block text-sm text-slate-600">Confirm Password</span>
                            <div className="relative">
                              <input
                                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 pr-10 text-sm text-slate-800 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                              />
                              <button
                                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-700"
                                onClick={() => setShowConfirmPassword((prev) => !prev)}
                                type="button"
                              >
                                {showConfirmPassword ? (
                                  <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7Z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
                                  </svg>
                                ) : (
                                  <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </label>
                        </div>
                        {passwordError ? <p className="mt-3 text-sm text-rose-600">{passwordError}</p> : null}
                        <button
                          className="mt-5 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-800"
                          disabled={Boolean(passwordError)}
                          type="submit"
                        >
                          Update Password
                        </button>
                      </form>
                    ) : null}
                  </section>

                  <button
                    className="flex w-full items-center justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 p-5 text-left transition hover:bg-rose-100"
                    onClick={handleDeleteAccount}
                    type="button"
                  >
                    <h3 className="text-[14px] text-rose-700" style={{ fontWeight: 600 }}>Delete Account</h3>
                  </button>

                  <button
                    className="flex w-full items-center justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 p-5 text-left transition hover:bg-rose-100"
                    onClick={handleLogout}
                    type="button"
                  >
                    <h3 className="text-[14px] text-rose-700" style={{ fontWeight: 600 }}>Logout</h3>
                  </button>
                </div>
              </section>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <Copyright />
    </div>
  )
}

export default Profile