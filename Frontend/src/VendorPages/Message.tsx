import Navbar from '../VendorComponents/Navbar';

const Message = () => {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Navbar />
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-semibold text-slate-900">Message</h1>
      </main>
    </div>
  );
};

export default Message;