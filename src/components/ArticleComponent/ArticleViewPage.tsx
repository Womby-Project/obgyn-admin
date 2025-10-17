import { useEffect, useMemo, useState } from 'react';
import type { Article } from '@/pages/OBGYN/OBGYNArticlePage';
import { supabase } from "@/lib/supabaseClient";
import DOMPurify from 'dompurify';

// --- SVG ICONS ---
const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const FetchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const SourceIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>;
const ViewsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
const CopyrightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>;
const ArrowRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>;
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;

interface ArticleViewPageProps {
  article: Article; // from card click; we'll re-fetch full DB row
  onBack: () => void;
}

export default function ArticleViewPage({ article, onBack }: ArticleViewPageProps) {
  const [full, setFull] = useState<null | {
    id: string;
    title: string;
    imageUrl: string | null;
    views: number;
    author?: string | null;
    source?: string | null;
    publishedDate?: string;
    fetchedDate?: string;
    link?: string | null;
    body?: string | null; // HTML string from DB
  }>(null);

  useEffect(() => {
    (async () => {
      // 1) Load article
      const { data, error } = await supabase
        .from('articles')
        .select('id,title,thumbnail_url,views_count,author,source,published_at,created_at,link,body')
        .eq('id', article.id)
        .maybeSingle();

      if (error || !data) return;

      let nextViews = data.views_count ?? 0;

      // 2) Record unique view in article_views and increment views_count once per user
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes?.user?.id ?? null;

      if (userId) {
        const { data: ins, error: insErr } = await supabase
          .from('article_views')
          .upsert(
            { article_id: data.id, user_id: userId, viewed_at: new Date().toISOString() },
            { onConflict: 'article_id,user_id', ignoreDuplicates: true }
          )
          .select();

        if (!insErr && ins && ins.length > 0) {
          nextViews = nextViews + 1;
          await supabase.from('articles').update({ views_count: nextViews }).eq('id', data.id);
        }
      }

      setFull({
        id: data.id,
        title: data.title,
        imageUrl: data.thumbnail_url ?? null,
        views: nextViews,
        author: data.author,
        source: data.source,
        link: data.link,
        body: data.body, // keep raw HTML; we'll sanitize below
        publishedDate: data.published_at
          ? new Date(data.published_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
          : undefined,
        fetchedDate: data.created_at
          ? new Date(data.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
          : undefined,
      });
    })();
  }, [article.id]);

  // ——— Sanitize + rewrite relative URLs so images/links work ———
  const sanitizedBody = useMemo(() => {
    if (!full?.body) return '';

    // base is the original article link (if any)
    let base: URL | null = null;
    try { if (full.link) base = new URL(full.link); } catch { base = null; }

    // Create a throwaway DOM to rewrite href/src before sanitizing
    const container = document.createElement('div');
    container.innerHTML = full.body;

    // Fix <a> links
    container.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href') || '';
      try {
        const abs = base ? new URL(href, base).toString() : href;
        a.setAttribute('href', abs);
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
      } catch { /* ignore bad URLs */ }
    });

    // Fix <img> sources (avoid empty or relative broken paths)
    container.querySelectorAll('img[src]').forEach((img) => {
      const src = img.getAttribute('src') || '';
      // If empty, remove the image node
      if (!src.trim()) {
        img.remove();
        return;
      }
      try {
        const abs = base ? new URL(src, base).toString() : src;
        img.setAttribute('src', abs);
        // nice defaults
        if (!img.getAttribute('loading')) img.setAttribute('loading', 'lazy');
        if (!img.getAttribute('alt')) img.setAttribute('alt', '');
        img.classList.add('mx-auto', 'rounded-lg');
      } catch {
        // if URL invalid, drop the image
        img.remove();
      }
    });

    // Sanitize final HTML
    const clean = DOMPurify.sanitize(container.innerHTML, {
      USE_PROFILES: { html: true }, // allow basic HTML; no scripts/event handlers
    });

    return clean;
  }, [full?.body, full?.link]);

  if (!full) {
    return (
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
        <div className="max-w mx-auto">
          <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-6">
            <BackIcon /><span>Back to Library</span>
          </button>
          <div className="text-sm text-gray-500">Loading…</div>
        </div>
      </main>
    );
  }

  const isOBAuthored = !!full.author && !full.source;

  return (
    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
      <div className="max-w mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-6">
          <BackIcon /><span>Back to Library</span>
        </button>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-500">
            {full.publishedDate && (
              <div className="flex items-center gap-1.5">
                <CalendarIcon /><span>Published: {full.publishedDate}</span>
              </div>
            )}
            {full.source && (
              <div className="flex items-center gap-1.5">
                <FetchIcon /><span>Fetched: {full.fetchedDate}</span>
              </div>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{full.title}</h1>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600">
            {full.source ? (
              <div className="flex items-center gap-1.5"><SourceIcon /><span>Source: {full.source}</span></div>
            ) : full.author ? (
              <div className="flex items-center gap-1.5"><UserIcon /><span>Author: {full.author}</span></div>
            ) : null}
            <div className="flex items-center gap-1.5"><ViewsIcon /><span>{full.views} Views</span></div>
          </div>

          {full.imageUrl ? (
            <div className="pt-4">
              <img src={full.imageUrl} alt={full.title} className="w-full rounded-xl object-cover" />
            </div>
          ) : null}

          {/* Render sanitized HTML body */}
          <div
            className="prose max-w-none text-gray-700 leading-relaxed pt-6"
            dangerouslySetInnerHTML={{ __html: sanitizedBody }}
          />

          {/* Copyright block */}
          <div className="mt-12 pt-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-5 flex items-start gap-4">
              <CopyrightIcon />
              <div>
                <h4 className="font-bold text-gray-800">Source & Copyright</h4>
                {isOBAuthored ? (
                  <p className="text-sm text-gray-600 mt-1">
                    © {full.author}. This article is original content authored by the attending obstetrician-gynecologist.
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 mt-1">
                      This article was originally published by {full.source}. Content may be summarized for patient education.
                    </p>
                    {full.link && (
                      <a href={full.link} target="_blank" rel="noreferrer" className="text-sm font-semibold text-red-500 hover:text-red-700 mt-3 inline-flex items-center gap-1.5">
                        <span>Read original article</span>
                        <ArrowRightIcon />
                      </a>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
