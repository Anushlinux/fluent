import { notFound } from 'next/navigation';
import Navigation from '@/components/sections/navigation';
import Footer from '@/components/sections/footer';
import { DomainGraphViewer } from '@/components/domain-graph-viewer';
import { getDomainConfigByContext, getAllDomainIds } from '@/lib/domain-config';

interface PageProps {
  params: Promise<{ context: string }>;
}

export async function generateStaticParams() {
  return getAllDomainIds().map((context) => ({
    context,
  }));
}

export default async function DomainPage({ params }: PageProps) {
  const { context } = await params;
  const domainConfig = getDomainConfigByContext(context);

  if (!domainConfig) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background-primary">
      <Navigation />
      
      <main className="relative">
        <DomainGraphViewer domainConfig={domainConfig} />
      </main>
      
      <Footer />
    </div>
  );
}

