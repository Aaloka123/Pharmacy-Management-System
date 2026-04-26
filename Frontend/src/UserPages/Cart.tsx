import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Footer from '../UserComponents/Footer'
import Copyright from '../UserComponents/Copyright'
import Header from '../UserComponents/Header'
import AmoxicillinImage from '../assets/Amoxicillin.jpg'
import LisinoprilImage from '../assets/Lisinopril.jpg'

type CartLine = {
  id: string
  name: string
  subtitle: string
  strength: string
  form: string
  pack: string
  unitPrice: number
  image: string
  qty: number
}

const initialCartLines: CartLine[] = [
  {
    id: 'Amoxicillin',
    name: 'Amoxicillin',
    subtitle: 'Antibiotics · Penicillin Type',
    strength: '500mg',
    form: 'Capsules',
    pack: '30 ct',
    unitPrice: 425,
    image: AmoxicillinImage,
    qty: 1,
  },
  {
    id: 'Lisinopril',
    name: 'Lisinopril',
    subtitle: 'Cardiovascular · ACE Inhibitor',
    strength: '10mg',
    form: 'Tablets',
    pack: '90 ct',
    unitPrice: 280,
    image: LisinoprilImage,
    qty: 1,
  },
]

const Cart = () => {
  const [lines, setLines] = useState<CartLine[]>(initialCartLines)
  const [selectedIds, setSelectedIds] = useState<string[]>(initialCartLines[0] ? [initialCartLines[0].id] : [])

  useEffect(() => {
    const lineIds = new Set(lines.map((line) => line.id))
    setSelectedIds((prev) => {
      return prev.filter((id) => lineIds.has(id))
    })
  }, [lines])

  const selectedLines = useMemo(() => lines.filter((line) => selectedIds.includes(line.id)), [lines, selectedIds])
  const selectedProductNames = useMemo(() => selectedLines.map((line) => line.name), [selectedLines])
  const subtotal = useMemo(() => selectedLines.reduce((sum, line) => sum + line.unitPrice * line.qty, 0), [selectedLines])
  const tax = useMemo(() => subtotal * 0.13, [subtotal])
  const total = useMemo(() => subtotal + tax, [subtotal, tax])
  const itemCount = useMemo(() => selectedLines.length, [selectedLines])
  const allSelected = lines.length > 0 && selectedIds.length === lines.length

  const updateQty = (id: string, qty: number) => {
    if (qty < 1) return
    setLines(lines.map((line) => (line.id === id ? { ...line, qty } : line)))
  }

  const removeLine = (id: string) => {
    setLines(lines.filter((line) => line.id !== id))
  }

  const removeSelected = () => {
    if (selectedIds.length === 0) return
    setLines(lines.filter((line) => !selectedIds.includes(line.id)))
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id]))
  }

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([])
      return
    }
    setSelectedIds(lines.map((line) => line.id))
  }

  return (
    <div className="bg-white">
      <Header />
      <main className="px-[80px] pb-12 pt-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Your cart</h1>
            <p className="mt-2 text-sm text-slate-600">
              Review your items before checkout. Prescription products may need verification.
            </p>
          </div>
        </div>

        {lines.length === 0 ? (
          <section className="mt-10 rounded-3xl border border-dashed border-slate-200 bg-white px-8 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 text-teal-700">
              <svg aria-hidden="true" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
                <path d="M6 6h15l-1.5 9h-12L6 6Z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6 6 5 3H2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="9" cy="20" r="1" />
                <circle cx="18" cy="20" r="1" />
              </svg>
            </div>
            <h2 className="mt-6 text-xl font-semibold text-slate-900">Your cart is empty</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
              Browse the catalog and add medications you need. Your selections will appear here.
            </p>
            <Link
              className="mt-8 inline-flex items-center justify-center rounded-lg bg-linear-to-br from-teal-600 to-teal-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-teal-900/20 transition hover:from-teal-700 hover:to-teal-800"
              to="/products"
            >
              Browse products
            </Link>
          </section>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
            <section className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div className="inline-flex items-center gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-3 text-sm font-semibold text-slate-700">
                    <input
                      checked={allSelected}
                      className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-700"
                      onChange={toggleSelectAll}
                      type="checkbox"
                    />
                    Select all products
                  </label>
                  <p className="text-xs text-slate-500">
                    ({selectedIds.length} selected)
                  </p>
                </div>
                <button
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-rose-600 transition hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={selectedIds.length === 0}
                  onClick={removeSelected}
                  type="button"
                >
                  <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <path
                      d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                    />
                  </svg>
                  Delete
                </button>
              </div>
              {lines.map((line) => (
                <article
                  className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md sm:flex-row sm:items-center sm:p-5"
                  key={line.id}
                >
                  <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-600 sm:mr-1">
                    <input
                      checked={selectedIds.includes(line.id)}
                      className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-700"
                      onChange={() => toggleSelect(line.id)}
                      type="checkbox"
                    />
                    <span className="sm:hidden">Select</span>
                  </label>
                  <div className="flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50 sm:h-28 sm:w-28">
                    {line.image ? (
                      <img alt={line.name} className="h-24 w-full max-w-28 object-contain p-2 sm:h-full sm:max-w-none" src={line.image} />
                    ) : (
                      <span className="text-xs text-slate-400">No image</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-bold text-slate-900">{line.name}</h2>
                    <p className="mt-0.5 text-xs text-slate-500">{line.subtitle}</p>
                    <p className="mt-2 text-sm font-semibold text-teal-700">NRP {(line.unitPrice * line.qty).toLocaleString()}</p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-600">
                      <span>
                        <span className="text-slate-400">Strength</span> <span className="font-medium">{line.strength}</span>
                      </span>
                      <span>
                        <span className="text-slate-400">Form</span> <span className="font-medium">{line.form}</span>
                      </span>
                      <span>
                        <span className="text-slate-400">Pack</span> <span className="font-medium">{line.pack}</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-6 border-t border-slate-100 pt-4 sm:min-w-[180px] sm:self-center sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
                    <div>
                      <p className="px-1 text-[9px] font-semibold uppercase tracking-wide text-slate-400">Quantity</p>
                      <div className="mt-1 flex items-center justify-between rounded-lg bg-slate-50">
                        <button
                          aria-label="Decrease quantity"
                          className="rounded-md px-3 py-2 text-base leading-none text-slate-600 transition hover:bg-white hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                          disabled={line.qty <= 1}
                          onClick={() => updateQty(line.id, line.qty - 1)}
                          type="button"
                        >
                          −
                        </button>
                        <span className="min-w-8 text-center text-xs font-semibold text-slate-900">{line.qty}</span>
                        <button
                          aria-label="Increase quantity"
                          className="rounded-md px-3 py-2 text-base leading-none text-slate-600 transition hover:bg-white hover:text-slate-900"
                          onClick={() => updateQty(line.id, line.qty + 1)}
                          type="button"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <button
                      aria-label={`Remove ${line.name} from cart`}
                      className="justify-self-end rounded-lg border border-transparent p-2 text-rose-600 transition hover:border-rose-100 hover:bg-rose-50 hover:text-rose-700"
                      onClick={() => removeLine(line.id)}
                      type="button"
                    >
                      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <path
                          d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.8"
                        />
                      </svg>
                    </button>
                  </div>
                </article>
              ))}
            </section>

            <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
              <h2 className="text-lg font-bold text-slate-900">Order summary</h2>
              <dl className="mt-5 space-y-3 text-sm">
                <div className="text-slate-600">
                  <dt>
                    <div className="flex items-center justify-between">
                      <p>Items</p>
                      <p className="text-slate-900">{itemCount} selected</p>
                    </div>
                    {selectedProductNames.length > 0 ? (
                      <div className="mt-1.5 space-y-0.5 text-xs text-teal-700">
                        {selectedProductNames.map((name) => (
                          <p key={name}>{name}</p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">No product selected</p>
                    )}
                  </dt>
                </div>
                <div className="flex justify-between text-slate-600">
                  <dt>Subtotal</dt>
                  <dd className="font-medium text-slate-900">NRP {subtotal.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between text-slate-600">
                  <dt>Tax (13%)</dt>
                  <dd className="font-medium text-slate-900">NRP {tax.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-3 text-slate-800">
                  <dt className="font-semibold">Total</dt>
                  <dd className="text-base font-bold text-teal-700">NRP {total.toLocaleString()}</dd>
                </div>
              </dl>
              <button
                className="mt-6 w-full rounded-lg bg-linear-to-br from-teal-600 to-teal-700 py-3 text-sm font-semibold text-white shadow-sm shadow-teal-900/20 transition enabled:hover:from-teal-700 enabled:hover:to-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={selectedLines.length === 0}
                type="button"
              >
                Proceed to checkout
              </button>
              <Link
                className="mt-3 block w-full rounded-lg border border-teal-700 bg-white py-2.5 text-center text-sm font-semibold text-teal-700"
                to="/products"
              >
                Continue shopping
              </Link>
            </aside>
          </div>
        )}
      </main>
      <Footer />
      <Copyright />
    </div>
  )
}

export default Cart