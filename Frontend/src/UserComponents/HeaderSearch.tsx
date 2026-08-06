import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePublicProducts } from '../hooks/usePublicProducts'
import { getFirstProductImageUrl } from '../lib/productsApi'

type HeaderSearchProps = {
  inputClassName: string
  dropdownClassName?: string
  onNavigate?: () => void
}

const HeaderSearch = ({ inputClassName, dropdownClassName = '', onNavigate }: HeaderSearchProps) => {
  const navigate = useNavigate()
  const { products, loading } = usePublicProducts()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return products
      .filter((product) => product.productName.toLowerCase().includes(q))
      .slice(0, 8)
  }, [products, query])

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  const showDropdown = open && query.trim().length > 0

  const goToProduct = (productId: number) => {
    setQuery('')
    setOpen(false)
    onNavigate?.()
    navigate(`/productsdetail?id=${productId}`)
  }

  return (
    <div className="relative" ref={containerRef}>
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        fill="none"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="m21 21-4.35-4.35m1.85-5.15a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
      <input
        aria-autocomplete="list"
        aria-expanded={showDropdown}
        aria-label="Search products"
        className={inputClassName}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search..."
        type="search"
        value={query}
      />

      {showDropdown ? (
        <div
          className={`absolute left-0 right-0 top-[calc(100%+0.4rem)] z-[60] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg ${dropdownClassName}`}
          role="listbox"
        >
          {loading && products.length === 0 ? (
            <p className="px-3 py-3 text-sm text-slate-500">Loading products…</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-3 text-sm text-slate-500">No products found.</p>
          ) : (
            <ul className="max-h-72 overflow-y-auto py-1">
              {results.map((product) => {
                const imageUrl = getFirstProductImageUrl(product.images)
                return (
                  <li key={product.id}>
                    <button
                      className="flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition hover:bg-teal-50"
                      onClick={() => goToProduct(product.id)}
                      role="option"
                      type="button"
                    >
                      {imageUrl ? (
                        <img
                          alt=""
                          className="h-10 w-10 shrink-0 rounded-lg border border-slate-200 bg-white object-contain p-0.5"
                          src={imageUrl}
                        />
                      ) : (
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-[10px] text-slate-400">
                          N/A
                        </span>
                      )}
                      <span className="min-w-0 truncate text-sm font-medium text-slate-800">
                        {product.productName}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}

export default HeaderSearch
