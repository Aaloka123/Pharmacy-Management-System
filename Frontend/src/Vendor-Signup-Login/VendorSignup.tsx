import { useState, type FormEvent } from 'react'
import Header from '../UserComponents/Header'
import Footer from '../UserComponents/Footer'
import Copyright from '../UserComponents/Copyright'
import { Link, useNavigate } from 'react-router-dom'
import medicineBackground from '../assets/medicineBG.png'
import { IoEyeOffOutline, IoEyeOutline } from 'react-icons/io5'
import { toast } from 'react-toastify'
import { isValidPhoneNumber, phoneInputProps, sanitizePhoneInput } from '../lib/phoneUtils'

const VENDOR_SIGNUP_URL = '/api/vendors/signup'

type VendorSignupForm = {
  businessPanVatId: string
  businessName: string
  businessLocation: string
  pharmacyLicense: string
  personalLocation: string
  contactEmail: string
  locationPhoneNumber: string
  userName: string
  password: string
  confirmPassword: string
  pharmacyManagementCertificate: File | null
  panVatCertificate: File | null
}

const VendorSignup = () => {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState<VendorSignupForm>({
    businessPanVatId: '',
    businessName: '',
    businessLocation: '',
    pharmacyLicense: '',
    personalLocation: '',
    contactEmail: '',
    locationPhoneNumber: '',
    userName: '',
    password: '',
    confirmPassword: '',
    pharmacyManagementCertificate: null,
    panVatCertificate: null,
  })
  const [formError, setFormError] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const updateField = (key: keyof VendorSignupForm, value: string | File | null) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')
    setIsSubmitted(false)

    if (formData.password !== formData.confirmPassword) {
      setFormError('Password and confirm password do not match.')
      return
    }

    if (!formData.pharmacyManagementCertificate || !formData.panVatCertificate) {
      setFormError('Please upload both required certificates.')
      return
    }

    if (!isValidPhoneNumber(formData.locationPhoneNumber)) {
      setFormError('Phone number must be exactly 10 digits.')
      return
    }

    const payload = new FormData()
    payload.append('name', formData.userName.trim())
    payload.append('email', formData.contactEmail.trim())
    payload.append('phoneNumber', formData.locationPhoneNumber.trim())
    payload.append('location', formData.personalLocation.trim())
    payload.append('businessPanVatId', formData.businessPanVatId.trim())
    payload.append('businessName', formData.businessName.trim())
    payload.append('businessLocation', formData.businessLocation.trim())
    payload.append('pharmacyLicense', formData.pharmacyLicense.trim())
    payload.append('password', formData.password)
    payload.append('pharmacyManagementCertificate', formData.pharmacyManagementCertificate)
    payload.append('panVatCertificate', formData.panVatCertificate)

    setLoading(true)
    try {
      const res = await fetch(VENDOR_SIGNUP_URL, {
        method: 'POST',
        body: payload,
      })

      if (!res.ok) {
        if (res.status === 409) {
          setFormError('A vendor with this email or PAN/VAT ID is already registered.')
        } else if (res.status === 400) {
          setFormError('Please fill all required fields and try again.')
        } else {
          setFormError('Signup failed. Please try again.')
        }
        return
      }

      toast.success('Signup submitted! Check your email — our admin team is reviewing your application.')
      setIsSubmitted(true)
      setFormData({
        businessPanVatId: '',
        businessName: '',
        businessLocation: '',
        pharmacyLicense: '',
        personalLocation: '',
        contactEmail: '',
        locationPhoneNumber: '',
        userName: '',
        password: '',
        confirmPassword: '',
        pharmacyManagementCertificate: null,
        panVatCertificate: null,
      })
      setTimeout(() => navigate('/vendorlogin'), 1500)
    } catch {
      setFormError('Could not reach the server. Is the backend running on port 8080?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-slate-50">
      <Header />

      <main
        className="bg-cover bg-center bg-no-repeat px-6 py-10 md:px-10"
        style={{ backgroundImage: `url(${medicineBackground})` }}
      >
        <section className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm md:p-8">
          <div className="flex flex-col items-start gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Verification Required
            </span>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Vendor Sign Up</h1>
              <p className="mt-2 text-sm text-slate-600">
                Submit your business details for admin verification and account approval.
              </p>
            </div>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="text-base font-bold text-slate-900">Personal Information</h2>
              <p className="mt-1 text-xs text-slate-500">Enter your contact details for vendor communication and updates.</p>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">User Name</span>
                  <input
                    type="text"
                    required
                    value={formData.userName}
                    onChange={(event) => updateField('userName', event.target.value)}
                    className="w-full border-0 border-b border-slate-300 bg-transparent px-0 py-2 text-sm outline-none focus:border-teal-600"
                    placeholder="Your Name"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">Contact Email</span>
                  <input
                    type="email"
                    required
                    value={formData.contactEmail}
                    onChange={(event) => updateField('contactEmail', event.target.value)}
                    className="w-full border-0 border-b border-slate-300 bg-transparent px-0 py-2 text-sm outline-none focus:border-teal-600"
                    placeholder="Your Email"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">Phone Number</span>
                  <input
                    {...phoneInputProps}
                    required
                    value={formData.locationPhoneNumber}
                    onChange={(event) =>
                      updateField('locationPhoneNumber', sanitizePhoneInput(event.target.value))
                    }
                    className="w-full border-0 border-b border-slate-300 bg-transparent px-0 py-2 text-sm outline-none focus:border-teal-600"
                    placeholder="10 digit number"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">Location</span>
                  <input
                    type="text"
                    required
                    value={formData.personalLocation}
                    onChange={(event) => updateField('personalLocation', event.target.value)}
                    className="w-full border-0 border-b border-slate-300 bg-transparent px-0 py-2 text-sm outline-none focus:border-teal-600"
                    placeholder="Your Location"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="text-base font-bold text-slate-900">Business Details</h2>
              <p className="mt-1 text-xs text-slate-500">Provide official business identity used during admin verification process.</p>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">Business PAN / VAT ID</span>
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    pattern="\d+"
                    title="Business PAN / VAT ID must contain digits only"
                    value={formData.businessPanVatId}
                    onChange={(event) =>
                      updateField('businessPanVatId', event.target.value.replace(/\D/g, ''))
                    }
                    className="w-full border-0 border-b border-slate-300 bg-transparent px-0 py-2 text-sm outline-none focus:border-teal-600"
                    placeholder="Business PAN / VAT ID"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">Business Name</span>
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(event) => updateField('businessName', event.target.value)}
                    className="w-full border-0 border-b border-slate-300 bg-transparent px-0 py-2 text-sm outline-none focus:border-teal-600"
                    placeholder="Business Name"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">Business Location</span>
                  <input
                    type="text"
                    required
                    value={formData.businessLocation}
                    onChange={(event) => updateField('businessLocation', event.target.value)}
                    className="w-full border-0 border-b border-slate-300 bg-transparent px-0 py-2 text-sm outline-none focus:border-teal-600"
                    placeholder="Business Location"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">Pharmacy License</span>
                  <input
                    type="text"
                    required
                    value={formData.pharmacyLicense}
                    onChange={(event) => updateField('pharmacyLicense', event.target.value)}
                    className="w-full border-0 border-b border-slate-300 bg-transparent px-0 py-2 text-sm outline-none focus:border-teal-600"
                    placeholder="Pharmacy License"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="text-base font-bold text-slate-900">Account Security</h2>
              <p className="mt-1 text-xs text-slate-500">Set secure credentials to protect your vendor account access.</p>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">Password</span>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      minLength={6}
                      required
                      value={formData.password}
                      onChange={(event) => updateField('password', event.target.value)}
                      className="w-full border-0 border-b border-slate-300 bg-transparent px-0 py-2 pr-8 text-sm outline-none focus:border-teal-600"
                      placeholder="Minimum 6 characters"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="cursor-pointer absolute right-0 top-1/2 -translate-y-1/2 p-0.5 text-slate-500 transition hover:text-slate-700"
                    >
                      {showPassword ? <IoEyeOffOutline className="size-4" /> : <IoEyeOutline className="size-4" />}
                    </button>
                  </div>
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-medium text-slate-700">Confirm Password</span>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      minLength={6}
                      required
                      value={formData.confirmPassword}
                      onChange={(event) => updateField('confirmPassword', event.target.value)}
                      className="w-full border-0 border-b border-slate-300 bg-transparent px-0 py-2 pr-8 text-sm outline-none focus:border-teal-600"
                      placeholder="Re-enter password"
                    />
                    <button
                      type="button"
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="cursor-pointer absolute right-0 top-1/2 -translate-y-1/2 p-0.5 text-slate-500 transition hover:text-slate-700"
                    >
                      {showConfirmPassword ? <IoEyeOffOutline className="size-4" /> : <IoEyeOutline className="size-4" />}
                    </button>
                  </div>
                </label>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="text-base font-bold text-slate-900">Certificates</h2>
              <p className="mt-1 text-xs text-slate-500">Upload valid documents to confirm legal registration and PAN/VAT.</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <label className="rounded-lg border border-slate-200 bg-white p-3">
                  <span className="text-xs font-semibold text-slate-800">Pharmacy Management Certificate</span>
                  <input
                    type="file"
                    required
                    accept="image/*,.pdf"
                    className="mt-2 block w-full rounded-xl border border-slate-300 bg-white p-2 text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-teal-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-teal-700"
                    onChange={(event) => updateField('pharmacyManagementCertificate', event.target.files?.[0] ?? null)}
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    {formData.pharmacyManagementCertificate
                      ? `Selected: ${formData.pharmacyManagementCertificate.name}`
                      : 'Upload clear certificate image or PDF'}
                  </p>
                </label>

                <label className="rounded-lg border border-slate-200 bg-white p-3">
                  <span className="text-xs font-semibold text-slate-800">PAN / VAT Certificate</span>
                  <input
                    type="file"
                    required
                    accept="image/*,.pdf"
                    className="mt-2 block w-full rounded-xl border border-slate-300 bg-white p-2 text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-teal-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-teal-700"
                    onChange={(event) => updateField('panVatCertificate', event.target.files?.[0] ?? null)}
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    {formData.panVatCertificate
                      ? `Selected: ${formData.panVatCertificate.name}`
                      : 'Upload clear certificate image or PDF'}
                  </p>
                </label>
              </div>
            </section>

            {formError ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700">
                {formError}
              </div>
            ) : null}

            {isSubmitted ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                Signup request submitted successfully. Admin will review your documents and approve your account.
              </div>
            ) : null}

            <div className="space-y-4 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="cursor-pointer w-full rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
              >
                {loading ? 'Submitting…' : 'Submit Application'}
              </button>

              <p className="text-center text-sm text-slate-600">
                Already registered?{' '}
                <Link className="font-semibold text-teal-700 hover:underline" to="/vendorlogin">
                  Login
                </Link>
              </p>

              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-slate-600">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Secure payments
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  48h onboarding
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Dedicated support
                </span>
              </div>
            </div>

            <section className="rounded-2xl bg-teal-600 p-5 text-white shadow-md">
              <h3 className="text-xl font-bold">Why sellers choose Mednexux</h3>
              <ul className="mt-3 space-y-2 text-sm">
                <li>- Reach more customers with a trusted pharmacy marketplace.</li>
                <li>- Manage products, orders, and billing from one dashboard.</li>
                <li>- Faster onboarding support with clear vendor approval workflow.</li>
                <li>- Grow your business with reliable tools and insights.</li>
              </ul>
            </section>
          </form>
        </section>
      </main>

      <Footer />
      <Copyright />
    </div>
  )
}

export default VendorSignup