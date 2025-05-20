import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Footer from '@/components/Footer';
import FeatureSection from '@/components/FeatureSection';
import FaqSection from '@/components/FaqSection';
import TestimonialsSection from '@/components/TestimonialsSection';
import OffersSection from '@/components/Offers';


export default function Home() {
  return (
    <main className="min-h-screen pt-32 relative z-10">
      <Navbar />
      <Hero />
      <FeatureSection />
      <OffersSection />
      <FaqSection />
      <TestimonialsSection />
      <Footer />
    </main>
  );
}
