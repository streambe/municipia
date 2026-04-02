import { Hero } from "@/components/landing/hero";
import { MunicipalitySelector } from "@/components/landing/municipality-selector";
import { AboutSection } from "@/components/landing/about-section";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <main id="main-content" className="flex-1">
        <Hero />
        <MunicipalitySelector />
        <AboutSection />
      </main>
      <Footer />
    </div>
  );
}
