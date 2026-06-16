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
import FadeInOnScroll from '../components/FadeInOnScroll'

const Home = () => {
  return (
    <div>
        <Header />
        <Hero />
        <FadeInOnScroll><Guarantee /></FadeInOnScroll>
        <FadeInOnScroll delay={80}><TopProduct /></FadeInOnScroll>
        <FadeInOnScroll delay={120}><ProductSuggestion /></FadeInOnScroll>
        <FadeInOnScroll delay={80}><CTA /></FadeInOnScroll>
        <FadeInOnScroll delay={100}><New /></FadeInOnScroll>
        <FadeInOnScroll delay={120}><FAQ /></FadeInOnScroll>
        <Footer />
        <Copyright />
    </div>
  )
}

export default Home