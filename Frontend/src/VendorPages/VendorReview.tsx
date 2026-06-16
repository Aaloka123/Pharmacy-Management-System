import Navbar from '../VendorComponents/Navbar';
import { VendorLayout, VendorMain, FadeInOnScroll } from '../components/PortalMain';

const Review = () => {
  return (
    <VendorLayout>
      <Navbar />
      <VendorMain>
      <FadeInOnScroll>
        <h1 className="text-2xl font-bold text-slate-900">Review</h1>
        <p className="mt-1 text-sm text-slate-600">this is review.</p>
      </FadeInOnScroll>
      </VendorMain>
    </VendorLayout>
  );
};

export default Review;