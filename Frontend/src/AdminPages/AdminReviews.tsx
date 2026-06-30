import { useEffect, useMemo, useState } from 'react'
import { FaStar } from 'react-icons/fa'
import AdminNavbar from '../AdminComponents/AdminNavbar'
import { AdminLayout, AdminMain, FadeInOnScroll } from '../components/PortalMain'
import ImageLightbox from '../components/ImageLightbox'
import fallbackImage from '../assets/Hero1.png'
import {
  fetchAdminReviews,
  resolveReviewAuthorAvatar,
  type ReviewDto,
} from '../lib/reviewApi'
import { getStoredUser } from '../lib/auth'

const AdminReviews = () => {
  const [reviews, setReviews] = useState<ReviewDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [brokenReviewAvatars, setBrokenReviewAvatars] = useState<Set<number>>(() => new Set())
  const [previewReviewImage, setPreviewReviewImage] = useState<{ url: string; alt: string } | null>(null)
  const currentUser = getStoredUser()

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchAdminReviews()
        setReviews(data)
      } catch {
        setError('Could not load customer reviews.')
        setReviews([])
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const filteredReviews = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return reviews
    return reviews.filter(
      (review) =>
        review.author.toLowerCase().includes(query) ||
        review.productName.toLowerCase().includes(query) ||
        review.body.toLowerCase().includes(query),
    )
  }, [reviews, searchTerm])

  return (
    <AdminLayout>
      <AdminNavbar />
      <AdminMain>
        <FadeInOnScroll>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Customer reviews</h1>
              <p className="mt-1 text-sm text-slate-600">
                Browse customer feedback across all products. Admins can view reviews only.
              </p>
            </div>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 sm:max-w-xs"
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search reviews..."
              type="search"
              value={searchTerm}
            />
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white">
            {loading ? (
              <p className="px-5 py-8 text-center text-sm text-slate-500">Loading reviews…</p>
            ) : error ? (
              <p className="px-5 py-8 text-center text-sm text-rose-600">{error}</p>
            ) : filteredReviews.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-500">
                {reviews.length === 0 ? 'No customer reviews yet.' : 'No reviews match your search.'}
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {filteredReviews.map((review) => (
                  <li className="p-5" key={review.id}>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                      <img
                        alt={review.productName}
                        className="h-16 w-16 shrink-0 rounded-xl border border-slate-200 object-cover"
                        src={review.imageUrl ?? fallbackImage}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <p className="text-base font-semibold text-slate-900">{review.productName}</p>
                          <span className="text-xs text-slate-500">{review.createdAt}</span>
                        </div>
                        <div className="mt-4 flex items-center gap-3">
                          {(() => {
                            const authorAvatar = resolveReviewAuthorAvatar(review, currentUser)
                            const showAuthorInitial = !authorAvatar || brokenReviewAvatars.has(review.id)
                            if (showAuthorInitial) {
                              return (
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-700">
                                  {review.author.charAt(0).toUpperCase()}
                                </div>
                              )
                            }
                            return (
                              <img
                                alt={review.author}
                                className="h-10 w-10 shrink-0 rounded-full border border-slate-200 object-cover"
                                referrerPolicy="no-referrer"
                                onError={() =>
                                  setBrokenReviewAvatars((prev) => {
                                    const next = new Set(prev)
                                    next.add(review.id)
                                    return next
                                  })
                                }
                                src={authorAvatar}
                              />
                            )
                          })()}
                          <div>
                            <p className="text-sm font-medium text-slate-700">{review.author}</p>
                            <div className="mt-1 flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <FaStar
                                  className={`h-3.5 w-3.5 ${star <= review.rating ? 'text-amber-400' : 'text-slate-300'}`}
                                  key={`${review.id}-${star}`}
                                />
                              ))}
                              <span className="ml-1 text-xs font-semibold text-slate-600">{review.rating}.0</span>
                            </div>
                          </div>
                        </div>
                        <p className="mt-3 text-sm leading-7 text-slate-700">{review.body}</p>
                        {review.imageUrl ? (
                          <button
                            className="mt-3 inline-block cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-transparent p-0 hover:bg-transparent"
                            onClick={() =>
                              setPreviewReviewImage({
                                url: review.imageUrl!,
                                alt: `Review photo for ${review.productName}`,
                              })
                            }
                            type="button"
                          >
                            <img
                              alt={`Review photo for ${review.productName}`}
                              className="block max-h-56 max-w-full object-cover"
                              src={review.imageUrl}
                            />
                          </button>
                        ) : null}
                        {review.likes > 0 ? (
                          <p className="mt-3 text-sm text-slate-500">{review.likes} likes</p>
                        ) : null}
                        {review.vendorReplyBody ? (
                          <div className="mt-4 rounded-xl border border-teal-100 bg-teal-50/50 p-4">
                            <div className="flex items-center gap-3">
                              {review.vendorReplyAuthorProfileImage ? (
                                <img
                                  alt={review.vendorReplyAuthorName ?? 'Vendor'}
                                  className="h-9 w-9 shrink-0 rounded-full border border-slate-200 object-cover"
                                  referrerPolicy="no-referrer"
                                  src={review.vendorReplyAuthorProfileImage}
                                />
                              ) : (
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">
                                  {(review.vendorReplyAuthorName ?? 'V').charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-semibold text-slate-900">
                                  {review.vendorReplyAuthorName ?? 'Vendor'}
                                </p>
                                {review.vendorReplyCreatedAt ? (
                                  <p className="text-xs text-slate-500">Vendor reply · {review.vendorReplyCreatedAt}</p>
                                ) : null}
                              </div>
                            </div>
                            <p className="mt-2.5 text-sm leading-7 text-slate-700">{review.vendorReplyBody}</p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </FadeInOnScroll>
      </AdminMain>
      {previewReviewImage ? (
        <ImageLightbox
          alt={previewReviewImage.alt}
          imageUrl={previewReviewImage.url}
          onClose={() => setPreviewReviewImage(null)}
        />
      ) : null}
    </AdminLayout>
  )
}

export default AdminReviews
