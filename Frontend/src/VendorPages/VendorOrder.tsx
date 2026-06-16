import { Fragment, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Navbar from '../VendorComponents/Navbar';
import { VendorMain, FadeInOnScroll } from '../components/PortalMain';
import fallbackImage from '../assets/Hero1.png';
import { resolveBackendUrl } from '../lib/api';
import {
  fetchVendorOrders,
  updateVendorOrderStatus,
  type ApiOrderStatus,
  type VendorOrderDto,
} from '../lib/orderApi';

type PaymentMethod = 'e-sewa' | 'khalti' | 'COD';
type OrderStatus = 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Canceled';
type StatusFilter = 'All' | OrderStatus;

type VendorOrder = {
  id: number;
  clientName: string;
  email: string;
  phone: string;
  location: string;
  productName: string;
  productSku: string;
  productImage: string;
  unitPrice: number;
  quantity: number;
  paymentMethod: PaymentMethod;
  orderDate: string;
  status: OrderStatus;
};

const updatableOrderStatuses: OrderStatus[] = ['Pending', 'Confirmed', 'Shipped', 'Delivered'];
const statusFilterOptions: StatusFilter[] = ['All', 'Pending', 'Confirmed', 'Shipped', 'Delivered', 'Canceled'];

const mapPayment = (method: VendorOrderDto['paymentMethod']): PaymentMethod => {
  if (method === 'ESEWA') return 'e-sewa';
  if (method === 'KHALTI') return 'khalti';
  return 'COD';
};

const mapStatus = (status: ApiOrderStatus): OrderStatus => {
  const labels: Record<ApiOrderStatus, OrderStatus> = {
    PENDING: 'Pending',
    CONFIRMED: 'Confirmed',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered',
    CANCELED: 'Canceled',
  };
  return labels[status];
};

const toApiStatus = (status: OrderStatus): ApiOrderStatus => {
  const values: Record<OrderStatus, ApiOrderStatus> = {
    Pending: 'PENDING',
    Confirmed: 'CONFIRMED',
    Shipped: 'SHIPPED',
    Delivered: 'DELIVERED',
    Canceled: 'CANCELED',
  };
  return values[status];
};

const dtoToVendorOrder = (dto: VendorOrderDto): VendorOrder => ({
  id: dto.id,
  clientName: dto.clientName,
  email: dto.email,
  phone: dto.phone,
  location: dto.location,
  productName: dto.productName,
  productSku: dto.productSku,
  productImage: dto.productImage ? resolveBackendUrl(dto.productImage) : fallbackImage,
  unitPrice: Number(dto.unitPrice),
  quantity: dto.quantity,
  paymentMethod: mapPayment(dto.paymentMethod),
  orderDate: dto.orderDate.slice(0, 10),
  status: mapStatus(dto.status),
});

const Order = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('All');
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);

  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchVendorOrders();
        setOrders(data.map(dtoToVendorOrder));
      } catch {
        setError('Could not load orders. Please try again.');
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    void loadOrders();
  }, []);

  const updateOrderStatus = async (orderId: number, status: OrderStatus) => {
    setUpdatingOrderId(orderId);
    try {
      const updated = await updateVendorOrderStatus(orderId, toApiStatus(status));
      setOrders((prev) => prev.map((order) => (order.id === orderId ? dtoToVendorOrder(updated) : order)));
      toast.success('Order status updated.');
    } catch {
      toast.error('Could not update order status.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const statusCounts = {
    All: orders.length,
    Pending: orders.filter((order) => order.status === 'Pending').length,
    Confirmed: orders.filter((order) => order.status === 'Confirmed').length,
    Shipped: orders.filter((order) => order.status === 'Shipped').length,
    Delivered: orders.filter((order) => order.status === 'Delivered').length,
    Canceled: orders.filter((order) => order.status === 'Canceled').length,
  };

  const filteredOrders = orders
    .filter((order) => {
      if (activeFilter !== 'All' && order.status !== activeFilter) {
        return false;
      }
      const query = searchTerm.trim().toLowerCase();
      if (!query) return true;
      return [order.clientName, order.productName, order.phone, order.paymentMethod, order.status]
        .join(' ')
        .toLowerCase()
        .includes(query);
    })
    .sort((a, b) => {
      const getOrderRank = (status: OrderStatus) => {
        if (status === 'Canceled') return 2;
        if (status === 'Delivered') return 1;
        return 0;
      };
      return getOrderRank(a.status) - getOrderRank(b.status);
    });

  const getUpdatableStatuses = (currentStatus: OrderStatus) => {
    if (currentStatus === 'Canceled') {
      return ['Canceled'] as OrderStatus[];
    }
    const currentStatusIndex = updatableOrderStatuses.indexOf(currentStatus);
    if (currentStatusIndex === -1) {
      return updatableOrderStatuses;
    }
    return updatableOrderStatuses.slice(currentStatusIndex);
  };

  const canViewInvoice = (status: OrderStatus) =>
    status === 'Confirmed' || status === 'Shipped' || status === 'Delivered';

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Navbar />
      <VendorMain>
      <FadeInOnScroll>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Order</h1>
            <p className="mt-1 text-sm text-slate-600">Orders placed by users are shown here for vendor processing.</p>
          </div>
          <div className="w-full sm:w-auto">
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search orders..."
              className="w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-teal-600"
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {statusFilterOptions.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                activeFilter === filter
                  ? 'border-teal-300 bg-teal-50 text-teal-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-teal-200 hover:text-teal-700'
              }`}
            >
              {filter} ({statusCounts[filter]})
            </button>
          ))}
        </div>

        <section className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <p className="px-5 py-4 text-sm text-slate-500">Loading orders...</p>
          ) : error ? (
            <p className="px-5 py-4 text-sm text-rose-600">{error}</p>
          ) : filteredOrders.length === 0 ? (
            <p className="px-5 py-4 text-sm text-slate-500">No user orders available right now.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-5 py-3 text-sm font-semibold text-slate-700">No.</th>
                    <th className="px-5 py-3 text-sm font-semibold text-slate-700">Client</th>
                    <th className="px-5 py-3 text-sm font-semibold text-slate-700">Product</th>
                    <th className="px-5 py-3 text-sm font-semibold text-slate-700">Qty</th>
                    <th className="px-5 py-3 text-sm font-semibold text-slate-700">Total</th>
                    <th className="px-5 py-3 text-sm font-semibold text-slate-700">Date</th>
                    <th className="px-5 py-3 text-sm font-semibold text-slate-700">Payment</th>
                    <th className="px-5 py-3 text-sm font-semibold text-slate-700">Status</th>
                    <th className="px-5 py-3 text-sm font-semibold text-slate-700">Status</th>
                    <th className="px-5 py-3 text-sm font-semibold text-slate-700">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order, index) => (
                    <Fragment key={order.id}>
                      <tr className="border-t border-slate-200">
                        <td className="px-5 py-4 text-sm font-medium text-slate-700">{index + 1}</td>
                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-800">{order.clientName}</p>
                          <p className="text-xs text-slate-500">{order.location}</p>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-700">{order.productName}</td>
                        <td className="px-5 py-4 text-sm text-slate-700">{order.quantity}</td>
                        <td className="px-5 py-4 text-sm font-semibold text-slate-800">
                          Rs. {Math.round(order.unitPrice * order.quantity * 1.13).toLocaleString()}
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-700">{order.orderDate}</td>
                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                              order.paymentMethod === 'e-sewa'
                                ? 'bg-emerald-100 text-emerald-800'
                                : order.paymentMethod === 'khalti'
                                  ? 'bg-violet-100 text-violet-800'
                                  : 'bg-slate-200 text-slate-800'
                            }`}
                          >
                            {order.paymentMethod}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                              order.status === 'Pending'
                                ? 'bg-amber-100 text-amber-800'
                                : order.status === 'Confirmed'
                                  ? 'bg-indigo-100 text-indigo-800'
                                : order.status === 'Shipped'
                                  ? 'bg-sky-100 text-sky-800'
                                : order.status === 'Canceled'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <select
                            value={order.status}
                            onChange={(event) => void updateOrderStatus(order.id, event.target.value as OrderStatus)}
                            disabled={order.status === 'Canceled' || updatingOrderId === order.id}
                            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs text-slate-700 focus:border-teal-600 focus:outline-none disabled:opacity-60"
                          >
                            {getUpdatableStatuses(order.status).map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col items-start gap-2">
                            <button
                              type="button"
                              onClick={() => setExpandedOrderId((prev) => (prev === order.id ? null : order.id))}
                              className="w-24 rounded-md bg-teal-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-teal-700"
                            >
                              {expandedOrderId === order.id ? 'Hide Detail' : 'View Detail'}
                            </button>
                            {canViewInvoice(order.status) ? (
                              <button
                                type="button"
                                onClick={() => navigate('/vendorbills')}
                                className="w-24 whitespace-nowrap rounded-md border border-teal-600 px-3 py-1.5 text-xs font-medium text-teal-700 transition hover:bg-teal-50"
                              >
                                View Invoice
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                      {expandedOrderId === order.id ? (
                        <tr className="border-t border-slate-200">
                          <td colSpan={10} className="bg-slate-50 px-5 py-4">
                            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                              <div className="border-b border-slate-200 pb-4">
                                <h3 className="text-sm font-semibold text-slate-900">Shipping address</h3>
                                <p className="mt-1 text-sm text-slate-600">
                                  {order.location}, Nepal, +977 {order.phone}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">{order.email}</p>
                              </div>

                              <div className="mt-4 overflow-x-auto">
                                <table className="min-w-full text-sm">
                                  <thead className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    <tr>
                                      <th className="py-2 pr-4">Image</th>
                                      <th className="py-2 pr-4">Product</th>
                                      <th className="py-2 pr-4">SKU</th>
                                      <th className="py-2 pr-4">Qty</th>
                                      <th className="py-2 pr-4">Unit</th>
                                      <th className="py-2 text-right">Line</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr className="border-b border-slate-100 text-slate-700">
                                      <td className="py-3 pr-4">
                                        <div className="h-14 w-14 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                                          <img
                                            src={order.productImage}
                                            alt={order.productName}
                                            className="h-full w-full object-contain p-1"
                                          />
                                        </div>
                                      </td>
                                      <td className="py-3 pr-4 font-medium text-slate-800">{order.productName}</td>
                                      <td className="py-3 pr-4 text-xs text-slate-500">{order.productSku}</td>
                                      <td className="py-3 pr-4">{order.quantity}</td>
                                      <td className="py-3 pr-4">Rs. {order.unitPrice.toLocaleString()}</td>
                                      <td className="py-3 text-right font-semibold text-slate-900">
                                        Rs. {(order.unitPrice * order.quantity).toLocaleString()}
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>

                              <div className="mt-4 ml-auto w-full max-w-xs space-y-2 text-sm">
                                <div className="flex items-center justify-between text-slate-600">
                                  <span>Subtotal:</span>
                                  <span>Rs. {(order.unitPrice * order.quantity).toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between text-slate-600">
                                  <span>Tax (13%):</span>
                                  <span>Rs. {Math.round(order.unitPrice * order.quantity * 0.13).toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
                                  <span>Order total:</span>
                                  <span>
                                    Rs. {Math.round(order.unitPrice * order.quantity * 1.13).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </FadeInOnScroll>
      </VendorMain>
    </div>
  );
};

export default Order;