import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import PourquoiSection from '@/components/PourquoiSection';
import Footer from '@/components/Footer';
import FeatureSection from '@/components/FeatureSection';
import FaqSection from '@/components/FaqSection';
import TestimonialsSection from '@/components/TestimonialsSection';


export default function Home() {
  return (
    <main className="min-h-screen pt-32 relative z-10">
      <Navbar />
      <Hero />
      <FeatureSection />
      <PourquoiSection />
      <FaqSection />
      <TestimonialsSection />
      <Footer />
    </main>
  );
}
