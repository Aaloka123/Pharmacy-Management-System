
import Header from '../UserComponents/Header'
import Footer from '../UserComponents/Footer'
import Copyright from '../UserComponents/Copyright'
import Hero from '../UserComponents/Hero'
import TopProduct from '../UserComponents/TopProduct'
import ProductSuggestion from '../UserComponents/ProductSuggestion'
import CTA from '../UserComponents/CTA'
import FAQ from '../UserComponents/FAQ'
import New from '../UserComponents/New'
import Guarantee from '../UserComponents/Guarantee'

const Home = () => {
  return (
    <div>
        <Header />
        <Hero />
        <Guarantee />
        <TopProduct />
        <ProductSuggestion />
        <CTA />
        <New/>
        <FAQ />
        <Footer />
        <Copyright />
    </div>
  )
}

export default Home