import Navbar from '../VendorComponents/Navbar';

const Order = () => {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Navbar />
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold text-slate-900">Order</h1>
        <p className="mt-1 text-sm text-slate-600">this is order.</p>
      </main>
    </div>
  );
};

export default Order;