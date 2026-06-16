import Navbar from '../VendorComponents/Navbar';
import { VendorMain, FadeInOnScroll } from '../components/PortalMain';

const Review = () => {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Navbar />
      <VendorMain>
      <FadeInOnScroll>
        <h1 className="text-2xl font-bold text-slate-900">Review</h1>
        <p className="mt-1 text-sm text-slate-600">this is review.</p>
      </FadeInOnScroll>
      </VendorMain>
    </div>
  );
};

export default Review;