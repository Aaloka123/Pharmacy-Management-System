import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { resolveProfileImageUrl } from '../lib/api'
import { listPublicVendors, type PublicVendorDto } from '../lib/vendorsApi'

const shopInitial = (name: string) => {
  const trimmed = name.trim()
  return trimmed ? trimmed[0].toUpperCase() : '?'
}

const VendorLogoCard = ({ vendor }: { vendor: PublicVendorDto }) => {
  const [imageFailed, setImageFailed] = useState(false)
  const logoUrl = vendor.profileImage ? resolveProfileImageUrl(vendor.profileImage) : null
  const showImage = Boolean(logoUrl && !imageFailed)

  return (
    <Link
      className="group flex w-40 shrink-0 flex-col items-center gap-3 md:w-44"
      title={vendor.businessName}
      to={`/vendorprofile?id=${vendor.id}`}
    >
      <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md transition duration-200 group-hover:border-teal-300 group-hover:shadow-lg md:h-32 md:w-32">
        {showImage ? (
          <img
            alt={`${vendor.businessName} logo`}
            className="h-full w-full object-cover"
            onError={() => setImageFailed(true)}
            src={logoUrl!}
          />
        ) : (
          <span className="text-3xl font-bold text-teal-700">{shopInitial(vendor.businessName)}</span>
        )}
      </div>
      <p className="line-clamp-2 w-full text-center text-sm font-semibold text-slate-800">{vendor.businessName}</p>
    </Link>
  )
}

const Guarantee = () => {
  const [vendors, setVendors] = useState<PublicVendorDto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void listPublicVendors()
      .then(({ data }) => {
        if (!cancelled) setVendors(data)
      })
      .catch((err) => {
        console.error('Failed to load vendor logos:', err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <section className="bg-white px-4 py-10 md:px-8">
        <p className="text-center text-sm text-slate-500">Loading partner pharmacies...</p>
      </section>
    )
  }

  if (vendors.length === 0) {
    return null
  }

  const repeatCount = vendors.length < 8 ? Math.max(2, Math.ceil(16 / vendors.length)) : 2
  const marqueeItems = Array.from({ length: repeatCount }, () => vendors).flat()

  return (
    <section className="w-full overflow-hidden bg-white py-12 md:py-14">
      <p className="mb-8 text-center font-['Geist',sans-serif] text-sm font-normal uppercase tracking-[0.2em] text-slate-500">
        Our partner pharmacies
      </p>

      <div className="relative w-full overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-white to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-white to-transparent"
        />

        <div className="vendor-marquee-track flex w-max items-center gap-12 px-6 md:gap-16 md:px-10">
          {marqueeItems.map((vendor, index) => (
            <VendorLogoCard key={`${vendor.id}-${index}`} vendor={vendor} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default Guarantee
