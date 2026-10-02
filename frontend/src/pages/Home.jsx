import Hero from "../components/home/Hero";
import Features from "../components/home/Features";
import SkillsSection from "../components/home/SkillsSection";
import HowItWorks from "../components/home/HowItWorks";
import Testimonials from "../components/home/Testimonials";
import CTA from "../components/home/CTA";

export default function Home() {
  return (
    <>
      <Hero />
      <Features />
      <SkillsSection />
      <HowItWorks />
      <Testimonials />
      <CTA />
    </>
  );
}
