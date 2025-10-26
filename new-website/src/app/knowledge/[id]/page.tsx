import { notFound } from 'next/navigation';
import Navigation from '@/components/sections/navigation';
import Footer from '@/components/sections/footer';
import { KnowledgeDetail } from '@/components/knowledge-detail';
import { knowledgeNodes } from '@/lib/knowledge-data';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return Object.keys(knowledgeNodes).map((id) => ({
    id,
  }));
}

export default async function KnowledgePage({ params }: PageProps) {
  const { id } = await params;
  const node = knowledgeNodes[id];

  if (!node) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background-primary">
      <Navigation />
      
      <main className="relative">
        <KnowledgeDetail node={node} />
      </main>
      
      <Footer />
    </div>
  );
}
