import { useEffect, useState } from 'react';
import ArticleCard, { type Article } from './ArticleCard';
import { supabase } from "@/lib/supabaseClient";

function fmt(dateStr?: string | null) {
  if (!dateStr) return undefined;
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function ArchiveContent({ onViewArticle }: { onViewArticle: (article: Article) => void }) {
  const [items, setItems] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('articles')
        .select('id,title,excerpt,thumbnail_url,views_count,author,source,updated_at')
        .eq('status', 'Archived')
        .order('updated_at', { ascending: false });

      if (!error && data) {
        const mapped: Article[] = data.map((row) => ({
          id: row.id,
          title: row.title,
          description: row.excerpt ?? '',
          imageUrl: row.thumbnail_url ?? '',
          views: row.views_count ?? 0,
          author: row.author ?? undefined,
          source: row.source ?? undefined,
          archivedDate: fmt(row.updated_at),
        }));
        setItems(mapped);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="text-sm text-gray-500">Loading archive…</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map(article => (
        <ArticleCard key={article.id} article={article} variant="archived" onViewArticle={onViewArticle} />
      ))}
    </div>
  );
}
