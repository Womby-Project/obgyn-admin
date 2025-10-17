import { useEffect, useState } from 'react';
import ArticleCard, { type Article } from './ArticleCard';
import { supabase } from "@/lib/supabaseClient";

function fmt(dateStr?: string | null) {
  if (!dateStr) return undefined;
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function PostedByYouContent({ onViewArticle }: { onViewArticle: (article: Article) => void }) {
  const [items, setItems] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);

      // Get current user
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes?.user?.id;
      if (!userId) { setItems([]); setLoading(false); return; }

      // Determine if user is an OBGYN and get full name
      const { data: ob, error: obErr } = await supabase
        .from('obgyn_users')
        .select('first_name,last_name')
        .eq('id', userId)
        .maybeSingle();

      const fullName = ob && !obErr ? `${ob.first_name} ${ob.last_name}`.trim() : undefined;

      // Fetch articles by author name (Posted)
      const query = supabase
        .from('articles')
        .select('id,title,excerpt,thumbnail_url,views_count,author,source,published_at')
        .eq('status', 'Posted');

      const { data, error } = fullName
        ? await query.eq('author', fullName)
        : await query.eq('author', ''); // non-OBs have no "you" posts

      if (!error && data) {
        const mapped: Article[] = data.map((row) => ({
          id: row.id,
          title: row.title,
          description: row.excerpt ?? '',
          imageUrl: row.thumbnail_url ?? '',
          views: row.views_count ?? 0,
          author: row.author ?? undefined,
          source: row.source ?? undefined,
          publishedDate: fmt(row.published_at),
        }));
        setItems(mapped);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="text-sm text-gray-500">Loading your posts…</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map(article => (
        <ArticleCard key={article.id} article={article} variant="posted" onViewArticle={onViewArticle} />
      ))}
    </div>
  );
}
