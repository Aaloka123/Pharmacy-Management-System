import Navbar from '../VendorComponents/Navbar';

const Dashboard = () => {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Navbar />
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
      </main>
    </div>
  );
};

export default Dashboard;