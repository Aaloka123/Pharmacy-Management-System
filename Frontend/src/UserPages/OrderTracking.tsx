import { Link } from 'react-router-dom'
import Copyright from '../UserComponents/Copyright'
import Footer from '../UserComponents/Footer'
import Header from '../UserComponents/Header'

const OrderTracking = () => {
  return (
    <div className="bg-white">
      <Header />
      <main className="px-4 pb-12 pt-6 md:px-8 lg:px-[80px]">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Order tracking</h1>
            <p className="mt-2 text-sm text-slate-600">Track the status of your MedNexus orders.</p>
          </div>
          <Link className="text-sm font-semibold text-teal-700 hover:text-teal-800 hover:underline" to="/cart">
            Back to cart
          </Link>
        </div>

        <section className="mx-auto mt-10 max-w-2xl rounded-2xl border border-dashed border-slate-200 bg-white px-8 py-16 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">No orders to track yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            Once you place an order, it will appear here so you can follow delivery updates.
          </p>
          <Link
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-linear-to-br from-teal-600 to-teal-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-teal-900/20 transition hover:from-teal-700 hover:to-teal-800"
            to="/products"
          >
            Browse products
          </Link>
        </section>
      </main>
      <Footer />
      <Copyright />
    </div>
  )
}

export default OrderTracking
