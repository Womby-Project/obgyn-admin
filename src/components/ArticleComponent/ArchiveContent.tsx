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

      // NOTE: replaced updated_at with created_at (exists in your schema)
      const { data, error } = await supabase
        .from('articles')
        .select('id,title,excerpt,thumbnail_url,views_count,author,source,created_at,published_at,status')
        .eq('status', 'Archived')
        .order('created_at', { ascending: false }); // or 'published_at'

      if (error) {
        console.error('Archive fetch error:', error);
        setItems([]);
        setLoading(false);
        return;
      }

      const mapped: Article[] = (data ?? []).map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.excerpt ?? '',
        imageUrl: row.thumbnail_url ?? '',
        views: row.views_count ?? 0,
        author: row.author ?? undefined,
        source: row.source ?? undefined,
        // choose which date to show for “archived”; here we prefer created_at, fallback to published_at
        archivedDate: fmt(row.created_at ?? row.published_at),
      }));

      setItems(mapped);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="text-sm text-gray-500">Loading archive…</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map(article => (
        <ArticleCard
          key={article.id}
          article={article}
          variant="archived"
          onViewArticle={onViewArticle}
        />
      ))}
    </div>
  );
}
