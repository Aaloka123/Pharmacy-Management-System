import Navbar from '../VendorComponents/Navbar';
import { VendorLayout, VendorMain, FadeInOnScroll } from '../components/PortalMain';
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { IoEyeOffOutline, IoEyeOutline } from 'react-icons/io5';
import { api, ApiRequestError, resolveMediaUrl, resolveProfileImageUrl } from '../lib/api';
import { getStoredUser, onAuthChange, setStoredUser, type AuthUser } from '../lib/auth';
import {
  toApiStoreStatus,
  toDisplayStoreStatus,
  updateVendorStoreStatus,
  type ApiStoreStatus,
} from '../lib/vendorsApi';

type VendorRecord = {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  location: string;
  businessPanVatId: string;
  businessName: string;
  businessLocation: string;
  pharmacyLicense: string;
  pharmacyManagementCertificate: string;
  panVatCertificate: string;
  profileImage: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  storeStatus: ApiStoreStatus;
  storeLockedByAdmin: boolean;
};

const Setting = () => {
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<VendorRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isStoreEditing, setIsStoreEditing] = useState(false);
  const [isProfileEditing, setIsProfileEditing] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [storeStatus, setStoreStatus] = useState<'Open' | 'Close'>('Open');
  const [isUpdatingStoreStatus, setIsUpdatingStoreStatus] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pharmacyCertInputRef = useRef<HTMLInputElement | null>(null);
  const panCertInputRef = useRef<HTMLInputElement | null>(null);

  const [businessName, setBusinessName] = useState('');
  const [businessLocation, setBusinessLocation] = useState('');
  const [pharmacyLicense, setPharmacyLicense] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [location, setLocation] = useState('');

  const [isSavingStore, setIsSavingStore] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingPharmacyCert, setIsUploadingPharmacyCert] = useState(false);
  const [isUploadingPanCert, setIsUploadingPanCert] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const applyVendor = (data: VendorRecord) => {
    setVendor(data);
    setBusinessName(data.businessName);
    setBusinessLocation(data.businessLocation);
    setPharmacyLicense(data.pharmacyLicense);
    setName(data.name);
    setPhoneNumber(data.phoneNumber);
    setLocation(data.location);
    setProfileImage(data.profileImage ?? null);
    setStoreStatus(
      data.status === 'APPROVED'
        ? toDisplayStoreStatus(data.storeStatus ?? 'OPEN')
        : 'Open',
    );
  };

  useEffect(() => {
    let cancelled = false;

    const load = async (vendorId: number) => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get<VendorRecord>(`/api/vendors/${vendorId}`);
        if (!cancelled) applyVendor(data);
      } catch (err) {
        if (!cancelled) {
          setError('Could not load your vendor profile.');
          toast.error('Failed to load vendor profile.');
          console.error(err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const stored = getStoredUser();
    if (!stored || stored.role !== 'VENDOR') {
      navigate('/vendorlogin', { replace: true });
      return;
    }
    load(stored.id);

    const unsubscribe = onAuthChange(() => {
      const next = getStoredUser();
      if (!next || next.role !== 'VENDOR') {
        navigate('/vendorlogin', { replace: true });
        return;
      }
      if (next.id !== stored.id) load(next.id);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [navigate]);

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !vendor) return;
    const previewUrl = URL.createObjectURL(file);
    setProfileImage(previewUrl);
    setIsUploadingImage(true);
    try {
      const payload = new FormData();
      payload.append('image', file);
      const { data } = await api.post<VendorRecord>(`/api/vendors/${vendor.id}/profile-image`, payload);
      applyVendor(data);
      const current = getStoredUser();
      if (current) {
        setStoredUser({ ...current, profileImage: data.profileImage ?? null });
      }
      toast.success('Profile picture updated.');
    } catch (e) {
      if (e instanceof ApiRequestError) {
        toast.error('Failed to upload profile picture.');
      } else {
        toast.error('Could not reach the server.');
      }
      setProfileImage(vendor.profileImage ?? null);
    } finally {
      setIsUploadingImage(false);
      if (event.target) event.target.value = '';
    }
  };

  const uploadCertificate = async (
    file: File,
    endpoint: 'pharmacy-management-certificate' | 'pan-vat-certificate',
    setUploading: (value: boolean) => void,
    successMessage: string,
  ) => {
    if (!vendor) return;
    setUploading(true);
    try {
      const payload = new FormData();
      payload.append('certificate', file);
      const { data } = await api.post<VendorRecord>(`/api/vendors/${vendor.id}/${endpoint}`, payload);
      applyVendor(data);
      toast.success(successMessage);
    } catch (e) {
      if (e instanceof ApiRequestError) {
        toast.error('Failed to upload certificate.');
      } else {
        toast.error('Could not reach the server.');
      }
    } finally {
      setUploading(false);
    }
  };

  const handlePharmacyCertChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !vendor) return;
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('Please upload an image or PDF file.');
      if (event.target) event.target.value = '';
      return;
    }
    await uploadCertificate(
      file,
      'pharmacy-management-certificate',
      setIsUploadingPharmacyCert,
      'Pharmacy Management Certificate updated.',
    );
    if (event.target) event.target.value = '';
  };

  const handlePanCertChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !vendor) return;
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('Please upload an image or PDF file.');
      if (event.target) event.target.value = '';
      return;
    }
    await uploadCertificate(
      file,
      'pan-vat-certificate',
      setIsUploadingPanCert,
      'PAN / VAT Certificate updated.',
    );
    if (event.target) event.target.value = '';
  };

  const isImageCertificate = (url: string | null | undefined) => {
    if (!url) return false;
    const lower = url.toLowerCase();
    return !lower.includes('.pdf') && !lower.includes('/raw/upload');
  };

  const handleStoreStatusChange = async (nextStatus: 'Open' | 'Close') => {
    if (!vendor) return;
    if (nextStatus === 'Open' && vendor.storeLockedByAdmin) {
      toast.error('Your store was closed by an administrator. Only an administrator can reopen it.');
      return;
    }
    const confirmed = window.confirm(`Do you want to change store status to ${nextStatus}?`);
    if (!confirmed) return;

    setIsUpdatingStoreStatus(true);
    try {
      const { data } = await updateVendorStoreStatus(vendor.id, toApiStoreStatus(nextStatus));
      setVendor((current) =>
        current
          ? {
              ...current,
              storeStatus: data.storeStatus,
              storeLockedByAdmin: data.storeLockedByAdmin,
            }
          : current,
      );
      setStoreStatus(toDisplayStoreStatus(data.storeStatus));
      toast.success(nextStatus === 'Close' ? 'Your shop is now closed.' : 'Your shop is now open.');
    } catch (e) {
      if (e instanceof ApiRequestError) {
        toast.error('Failed to update store status.');
      } else {
        toast.error('Could not reach the server.');
      }
    } finally {
      setIsUpdatingStoreStatus(false);
    }
  };

  const updateVendor = async (
    vendorId: number,
    body: Record<string, string>,
    onSuccess: (data: VendorRecord) => void,
    successMessage: string,
  ) => {
    try {
      const { data } = await api.put<VendorRecord>(`/api/vendors/${vendorId}`, body);
      onSuccess(data);
      toast.success(successMessage);
    } catch (e) {
      if (e instanceof ApiRequestError) {
        toast.error('Failed to save changes.');
      } else {
        toast.error('Could not reach the server.');
      }
    }
  };

  const handleSaveStore = async (event: FormEvent) => {
    event.preventDefault();
    if (!vendor) return;
    setIsSavingStore(true);
    try {
      await updateVendor(
        vendor.id,
        {
          businessName: businessName.trim(),
          businessLocation: businessLocation.trim(),
          pharmacyLicense: pharmacyLicense.trim(),
        },
        (data) => {
          applyVendor(data);
          setIsStoreEditing(false);
        },
        'Store information updated.',
      );
    } finally {
      setIsSavingStore(false);
    }
  };

  const handleSaveProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (!vendor) return;
    setIsSavingProfile(true);
    try {
      await updateVendor(
        vendor.id,
        {
          name: name.trim(),
          phoneNumber: phoneNumber.trim(),
          location: location.trim(),
        },
        (data) => {
          applyVendor(data);
          setIsProfileEditing(false);
          const current = getStoredUser();
          if (current) {
            const updated: AuthUser = {
              ...current,
              fullName: data.name,
              phoneNumber: data.phoneNumber,
              location: data.location,
            };
            setStoredUser(updated);
          }
        },
        'Profile details updated.',
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (!vendor) return;
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password must match.');
      return;
    }
    setIsSavingPassword(true);
    try {
      await api.put(`/api/vendors/${vendor.id}/password`, { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
      toast.success('Password updated successfully.');
    } catch (e) {
      if (e instanceof ApiRequestError) {
        if (e.response.status === 401) {
          toast.error('Current password is incorrect.');
        } else if (e.response.status === 400) {
          toast.error('New password is too short. Use at least 6 characters.');
        } else {
          toast.error('Failed to update password.');
        }
      } else {
        toast.error('Could not reach the server.');
      }
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <VendorLayout>
      <Navbar />
      <VendorMain>
      <FadeInOnScroll>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vendor Settings</h1>
          <p className="mt-1 text-sm text-slate-600">Manage store details and account security.</p>
        </div>

        {loading ? (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600 shadow-sm">
            Loading your vendor profile…
          </div>
        ) : error || !vendor ? (
          <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">
            {error ?? 'Vendor profile not available.'}
          </div>
        ) : (
          <>
            <section className="mt-6">
              <div className="mt-4 flex items-center justify-center">
                <div className="text-center">
                  <div className="relative inline-block">
                    {profileImage ? (
                      <img alt="Vendor profile preview" className="h-28 w-28 rounded-full border border-slate-200 object-cover" src={resolveProfileImageUrl(profileImage) ?? undefined} />
                    ) : (
                      <div className="flex h-28 w-28 items-center justify-center rounded-full border border-slate-200 bg-linear-to-br from-teal-600 to-teal-700 text-3xl font-bold text-white">
                        {(vendor.businessName.trim().charAt(0) || vendor.name.trim().charAt(0) || 'V').toUpperCase()}
                      </div>
                    )}
                    <button
                      aria-label="Change profile picture"
                      className="absolute -bottom-1 -right-1 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-600 shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={() => fileInputRef.current?.click()}
                      type="button"
                      disabled={isUploadingImage}
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
                  <p className="mt-4 text-base font-semibold text-slate-900">{vendor.businessName}</p>
                  <p className="mt-1 text-sm text-slate-600">{vendor.email}</p>
                </div>
              </div>
            </section>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <form className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm" onSubmit={handleSaveStore}>
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
                      value={businessName}
                      onChange={(event) => setBusinessName(event.target.value)}
                      id="storeName"
                      readOnly={!isStoreEditing}
                      type="text"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="storeAddress">
                      Business Location
                    </label>
                    <input
                      className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none ${
                        isStoreEditing ? 'focus:border-teal-600' : 'cursor-not-allowed bg-slate-100'
                      }`}
                      value={businessLocation}
                      onChange={(event) => setBusinessLocation(event.target.value)}
                      id="storeAddress"
                      readOnly={!isStoreEditing}
                      type="text"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="businessPanVatId">
                      Business PAN / VAT ID
                    </label>
                    <input
                      className="w-full cursor-not-allowed rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-800 outline-none"
                      value={vendor.businessPanVatId}
                      id="businessPanVatId"
                      readOnly
                      type="text"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="pharmacyLicense">
                      Pharmacy License
                    </label>
                    <input
                      className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none ${
                        isStoreEditing ? 'focus:border-teal-600' : 'cursor-not-allowed bg-slate-100'
                      }`}
                      value={pharmacyLicense}
                      onChange={(event) => setPharmacyLicense(event.target.value)}
                      id="pharmacyLicense"
                      readOnly={!isStoreEditing}
                      type="text"
                    />
                  </div>
                  {isStoreEditing && (
                    <button
                      className="rounded-lg bg-teal-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
                      disabled={isSavingStore}
                      type="submit"
                    >
                      {isSavingStore ? 'Saving…' : 'Save Store Information'}
                    </button>
                  )}
                </div>
              </form>

              <form className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm" onSubmit={handleSaveProfile}>
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
                      value={name}
                      onChange={(event) => setName(event.target.value)}
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
                      value={phoneNumber}
                      onChange={(event) =>
                        setPhoneNumber(event.target.value.replace(/\D/g, '').slice(0, 10))
                      }
                      inputMode="numeric"
                      maxLength={10}
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
                      className="w-full cursor-not-allowed rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-800 outline-none"
                      value={vendor.email}
                      id="vendorEmail"
                      readOnly
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
                      value={location}
                      onChange={(event) => setLocation(event.target.value)}
                      id="personalAddress"
                      readOnly={!isProfileEditing}
                      type="text"
                    />
                  </div>
                  {isProfileEditing && (
                    <button
                      className="rounded-lg bg-teal-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
                      disabled={isSavingProfile}
                      type="submit"
                    >
                      {isSavingProfile ? 'Saving…' : 'Save Profile Details'}
                    </button>
                  )}
                </div>
              </form>

              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                <h2 className="text-lg font-semibold text-slate-900">Certificates</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Upload or replace your Pharmacy Management Certificate and PAN / VAT Certificate.
                </p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 p-4">
                    <span className="text-sm font-semibold text-slate-800">Pharmacy Management Certificate</span>
                    {vendor.pharmacyManagementCertificate ? (
                      <div className="mt-3">
                        {isImageCertificate(vendor.pharmacyManagementCertificate) ? (
                          <img
                            alt="Pharmacy Management Certificate"
                            className="max-h-40 w-full rounded-lg border border-slate-200 object-contain"
                            src={resolveMediaUrl(vendor.pharmacyManagementCertificate) ?? undefined}
                          />
                        ) : null}
                        <a
                          className="mt-2 inline-block text-sm font-medium text-teal-700 hover:text-teal-800"
                          href={resolveMediaUrl(vendor.pharmacyManagementCertificate) ?? '#'}
                          rel="noreferrer"
                          target="_blank"
                        >
                          View current certificate
                        </a>
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-slate-500">No certificate uploaded yet.</p>
                    )}
                    <input
                      accept="image/*,.pdf"
                      className="mt-3 block w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-teal-600 file:px-3.5 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-teal-700 disabled:opacity-60"
                      disabled={isUploadingPharmacyCert}
                      onChange={handlePharmacyCertChange}
                      ref={pharmacyCertInputRef}
                      type="file"
                    />
                    {isUploadingPharmacyCert ? (
                      <p className="mt-2 text-xs text-slate-500">Uploading…</p>
                    ) : null}
                  </div>

                  <div className="rounded-lg border border-slate-200 p-4">
                    <span className="text-sm font-semibold text-slate-800">PAN / VAT Certificate</span>
                    {vendor.panVatCertificate ? (
                      <div className="mt-3">
                        {isImageCertificate(vendor.panVatCertificate) ? (
                          <img
                            alt="PAN / VAT Certificate"
                            className="max-h-40 w-full rounded-lg border border-slate-200 object-contain"
                            src={resolveMediaUrl(vendor.panVatCertificate) ?? undefined}
                          />
                        ) : null}
                        <a
                          className="mt-2 inline-block text-sm font-medium text-teal-700 hover:text-teal-800"
                          href={resolveMediaUrl(vendor.panVatCertificate) ?? '#'}
                          rel="noreferrer"
                          target="_blank"
                        >
                          View current certificate
                        </a>
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-slate-500">No certificate uploaded yet.</p>
                    )}
                    <input
                      accept="image/*,.pdf"
                      className="mt-3 block w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-teal-600 file:px-3.5 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-teal-700 disabled:opacity-60"
                      disabled={isUploadingPanCert}
                      onChange={handlePanCertChange}
                      ref={panCertInputRef}
                      type="file"
                    />
                    {isUploadingPanCert ? (
                      <p className="mt-2 text-xs text-slate-500">Uploading…</p>
                    ) : null}
                  </div>
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
                  <form className="mt-4 space-y-4" onSubmit={handleSavePassword}>
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
                          placeholder="Confirm password"
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
                    <button
                      className="rounded-lg bg-teal-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
                      disabled={isSavingPassword}
                      type="submit"
                    >
                      {isSavingPassword ? 'Saving…' : 'Save Password'}
                    </button>
                  </form>
                ) : null}
              </section>

            </div>

            <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">Store Status</h2>
              {vendor.storeLockedByAdmin && storeStatus === 'Close' ? (
                <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Your store was closed by an administrator. Contact admin to reopen your shop.
                </p>
              ) : null}
              <div className="mt-3">
                <button
                  className={`w-full rounded-lg px-4 py-1.5 text-center text-sm font-semibold text-white disabled:opacity-60 ${
                    storeStatus === 'Open' ? 'bg-emerald-600' : 'bg-rose-600'
                  }`}
                  disabled={
                    isUpdatingStoreStatus
                    || vendor.status !== 'APPROVED'
                    || (storeStatus === 'Close' && vendor.storeLockedByAdmin)
                  }
                  onClick={() => void handleStoreStatusChange(storeStatus === 'Open' ? 'Close' : 'Open')}
                  type="button"
                >
                  {isUpdatingStoreStatus ? 'Updating…' : storeStatus}
                </button>
              </div>
            </section>
          </>
        )}
      </FadeInOnScroll>
      </VendorMain>
    </VendorLayout>
  );
};

export default Setting;
