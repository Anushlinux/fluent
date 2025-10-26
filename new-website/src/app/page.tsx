import Navigation from '@/components/sections/navigation';
import HeroSection from '@/components/sections/hero';
import ValueProposition from '@/components/sections/value-proposition';
import ArchitectureTabs from '@/components/sections/architecture-tabs';
import GlobalNetwork from '@/components/sections/global-network';
import TrustedCompanies from '@/components/sections/trusted-companies';
import DeploymentSpeed from '@/components/sections/deployment-speed';
import PricingSection from '@/components/sections/pricing';
import ComparisonSection from '@/components/sections/comparison';
import DeveloperExperienceSection from '@/components/sections/developer-experience';
import FinalCtaSection from '@/components/sections/final-cta';
import Footer from '@/components/sections/footer';
import { AirdropBanner } from '@/components/AirdropBanner';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background-primary overflow-x-hidden">
      <Navigation />
      
      <AirdropBanner />
      
      <main className="relative overflow-x-hidden">
        <HeroSection />
        
        <ValueProposition />
        
        <ArchitectureTabs />
        
        <GlobalNetwork />
        
        <TrustedCompanies />
        
        <DeploymentSpeed />
        
        <PricingSection />
        
        <ComparisonSection />
        
        <DeveloperExperienceSection />
        
        <FinalCtaSection />
      </main>
      
      <Footer />
    </div>
  );
}