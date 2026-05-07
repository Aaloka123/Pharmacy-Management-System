import Navbar from '../VendorComponents/Navbar';
import { useRef, useState, type ChangeEvent } from 'react';
import AalokaImage from '../assets/aaloka.png';

const Setting = () => {
  const [profileImage, setProfileImage] = useState<string | null>(AalokaImage);
  const [isStoreEditing, setIsStoreEditing] = useState(false);
  const [isProfileEditing, setIsProfileEditing] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [storeStatus, setStoreStatus] = useState<'Open' | 'Close'>('Open');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const imageUrl = URL.createObjectURL(file);
    setProfileImage(imageUrl);
  };

  const handleStoreStatusChange = (nextStatus: 'Open' | 'Close') => {
    const confirmed = window.confirm(`Do you want to change store status to ${nextStatus}?`);
    if (!confirmed) return;
    setStoreStatus(nextStatus);
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Navbar />
      <main className="flex-1 p-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vendor Settings</h1>
          <p className="mt-1 text-sm text-slate-600">Manage store details and account security.</p>
        </div>

        <section className="mt-6">
          <div className="mt-4 flex items-center justify-center">
            <div className="text-center">
              <div className="relative inline-block">
                {profileImage ? (
                  <img alt="Vendor profile preview" className="h-28 w-28 rounded-full border border-slate-200 object-cover" src={profileImage} />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-full border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500">
                    No Photo
                  </div>
                )}
                <button
                  aria-label="Change profile picture"
                  className="absolute -bottom-1 -right-1 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-600 shadow-sm"
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24">
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
              <input accept="image/*" className="hidden" onChange={handleImageChange} ref={fileInputRef} type="file" />
              <p className="mt-4 text-base font-semibold text-slate-900">Himalaya Pharmacy</p>
              <p className="mt-1 text-sm text-slate-600">himalaya.pharmacy@gmail.com</p>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Store Information Setting</h2>
              <button
                aria-label="Edit store information"
                className="rounded-md border border-slate-300 p-2 text-slate-600"
                onClick={() => setIsStoreEditing((prev) => !prev)}
                type="button"
              >
                <svg className="size-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="m16.862 3.487 3.65 3.65M4.5 19.5l4.5-1 10.512-10.512a2.121 2.121 0 0 0-3-3L6 15.5l-1.5 4Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="storeName">
                  Store Name
                </label>
                <input
                  className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none ${
                    isStoreEditing ? 'focus:border-teal-600' : 'cursor-not-allowed bg-slate-100'
                  }`}
                  defaultValue="Himalaya Pharmacy"
                  id="storeName"
                  readOnly={!isStoreEditing}
                  type="text"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="storeAddress">
                  Address
                </label>
                <input
                  className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none ${
                    isStoreEditing ? 'focus:border-teal-600' : 'cursor-not-allowed bg-slate-100'
                  }`}
                  defaultValue="Dhapakhel, Lalitpur"
                  id="storeAddress"
                  readOnly={!isStoreEditing}
                  type="text"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="storeDescription">
                  Store Description (Optional)
                </label>
                <textarea
                  className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none ${
                    isStoreEditing ? 'focus:border-teal-600' : 'cursor-not-allowed bg-slate-100'
                  }`}
                  defaultValue="Trusted neighborhood pharmacy providing essential medicines."
                  id="storeDescription"
                  readOnly={!isStoreEditing}
                  rows={3}
                />
              </div>
              {isStoreEditing && (
                <button className="rounded-lg bg-teal-600 px-5 py-2 text-sm font-semibold text-white" type="button">
                  Save Store Information
                </button>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Profile Details</h2>
              <button
                aria-label="Edit vendor profile"
                className="rounded-md border border-slate-300 p-2 text-slate-600"
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
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="fullName">
                  Full Name
                </label>
                <input
                  className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none ${
                    isProfileEditing ? 'focus:border-teal-600' : 'cursor-not-allowed bg-slate-100'
                  }`}
                  defaultValue="Ramesh Koirala"
                  id="fullName"
                  readOnly={!isProfileEditing}
                  type="text"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="vendorPhone">
                  Phone Number
                </label>
                <input
                  className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none ${
                    isProfileEditing ? 'focus:border-teal-600' : 'cursor-not-allowed bg-slate-100'
                  }`}
                  defaultValue="+977-9801112233"
                  id="vendorPhone"
                  readOnly={!isProfileEditing}
                  type="tel"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="vendorEmail">
                  Email Address
                </label>
                <input
                  className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none ${
                    isProfileEditing ? 'focus:border-teal-600' : 'cursor-not-allowed bg-slate-100'
                  }`}
                  defaultValue="himalaya.pharmacy@gmail.com"
                  id="vendorEmail"
                  readOnly={!isProfileEditing}
                  type="email"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="personalAddress">
                  Personal Address
                </label>
                <input
                  className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none ${
                    isProfileEditing ? 'focus:border-teal-600' : 'cursor-not-allowed bg-slate-100'
                  }`}
                  defaultValue="Kathmandu, Nepal"
                  id="personalAddress"
                  readOnly={!isProfileEditing}
                  type="text"
                />
              </div>
              {isProfileEditing && (
                <button className="rounded-lg bg-teal-600 px-5 py-2 text-sm font-semibold text-white" type="button">
                  Save Profile Details
                </button>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
            <h2 className="mb-3 text-base font-semibold text-slate-900">Change Password</h2>
            <button
              aria-label="Toggle change password section"
              className="flex w-full items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-3 text-left"
              onClick={() => setShowPasswordForm((prev) => !prev)}
              type="button"
            >
              <h3 className="text-[13px] font-semibold text-slate-900">Change Password</h3>
              <span className="inline-flex items-center justify-center text-slate-600">
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
                      <svg className="size-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
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
                      <svg className="size-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
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
                      placeholder="Confirm password"
                      type={showConfirmPassword ? 'text' : 'password'}
                    />
                    <button
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      type="button"
                    >
                      <svg className="size-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </div>
                <button className="rounded-lg bg-teal-600 px-5 py-2 text-sm font-semibold text-white" type="button">
                  Save Password
                </button>
              </div>
            ) : null}
          </section>

        </div>

        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Store Status</h2>
          <div className="mt-3">
            <button
              className={`w-full rounded-lg px-4 py-1.5 text-center text-sm font-semibold text-white ${
                storeStatus === 'Open' ? 'bg-emerald-600' : 'bg-rose-600'
              }`}
              onClick={() => handleStoreStatusChange(storeStatus === 'Open' ? 'Close' : 'Open')}
              type="button"
            >
              {storeStatus}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Setting;