import Header from "./header"
import Hero from "./hero"
import Projects from "./projects"
import Services from "./services"
import Faq from "./faq"
import CallToAction from "./call-to-action"
import Footer from "./footer"
import ProtocolStrip from "./protocol-strip"

export { Header, Hero, Projects, Services, Faq, CallToAction, Footer }

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-[#111111]">
      <Header />
      <div className="container pt-0">
        <Hero />
        <ProtocolStrip />
        <Projects />
        <Services />
        <Faq />
        <CallToAction />
      </div>
      <Footer />
    </main>
  )
}
