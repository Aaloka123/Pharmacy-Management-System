import Navbar from '../VendorComponents/Navbar';

const Product = () => {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Navbar />
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-semibold text-slate-900">Product</h1>
      </main>
    </div>
  );
};

export default Product;