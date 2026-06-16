import Header from '../UserComponents/Header'
import Footer from '../UserComponents/Footer'
import Copyright from '../UserComponents/Copyright'
import Aboutuscontent from '../UserComponents/Aboutuscontent'
import AboutCTA from '../UserComponents/AboutCTA'
import AboutText from '../UserComponents/AboutText'
import FadeInOnScroll from '../components/FadeInOnScroll'

const About = () => {
  return (
    <div className="bg-white">
      <Header />
      <FadeInOnScroll><Aboutuscontent /></FadeInOnScroll>
      <FadeInOnScroll delay={100}><AboutCTA /></FadeInOnScroll>
      <FadeInOnScroll delay={120}><AboutText /></FadeInOnScroll>
      <Footer />
      <Copyright />
    </div>
  )
}

export default About