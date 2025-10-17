import { useEffect, useState } from 'react';
import { supabase } from "@/lib/supabaseClient";

// --- SVG ICONS ---
const BackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);
const DiscardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
const PostIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

interface WriteArticlePageProps {
  onBack: () => void;
}

export default function WriteArticlePage({ onBack }: WriteArticlePageProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [posting, setPosting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [authorName, setAuthorName] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes?.user?.id;
      if (!userId) return;

      const { data: ob, error: obErr } = await supabase
        .from('obgyn_users')
        .select('first_name,last_name')
        .eq('id', userId)
        .maybeSingle();

      if (!obErr && ob) {
        setAuthorName(`${ob.first_name} ${ob.last_name}`.trim());
      } else {
        setAuthorName(null); // not an OB — article will be treated as external if you add source/link later
      }
    })();
  }, []);

  async function uploadThumbnailToBucket(file: File): Promise<string | null> {
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes?.user?.id;
      if (!userId) return null;

      const safeFileName = file.name.replace(/\s+/g, "-");
      const unique = (typeof crypto !== "undefined" && "randomUUID" in crypto)
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const path = `${userId}/${unique}-${safeFileName}`;
      const { error: upErr } = await supabase
        .storage
        .from('obgyn_thumbnail_articles')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || 'image/*',
        });

      if (upErr) {
        setErrorMsg(upErr.message ?? 'Upload failed');
        return null;
      }

      const { data: pub } = supabase
        .storage
        .from('obgyn_thumbnail_articles')
        .getPublicUrl(path);

      return pub?.publicUrl ?? null;
    } catch (e: any) {
      setErrorMsg(e?.message ?? 'Upload failed');
      return null;
    }
  }

  async function handlePost() {
    setErrorMsg(null);

    if (!title.trim() || !content.trim()) {
      setErrorMsg('Please provide a title and content.');
      return;
    }

    setPosting(true);

    // 1) Upload thumbnail (if provided) → get public URL
    let thumbnail_url: string | null = null;
    if (thumbFile) {
      thumbnail_url = await uploadThumbnailToBucket(thumbFile);
      if (!thumbnail_url) {
        setPosting(false);
        // We can allow posting without thumbnail; if you want to enforce, uncomment the next two lines:
        // setErrorMsg('Thumbnail upload failed. Please try again.');
        // return;
      }
    }

    // 2) Prepare article row
    const isOB = !!authorName;
    const author = isOB ? authorName : null; // OB-authored → set author
    const source = null; // OB-authored originals have no external source
    const now = new Date().toISOString();

    // Required unique, non-null link (internal placeholder for OB-authored)
    const link = `internal:${(typeof crypto !== "undefined" && "randomUUID" in crypto) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;

    // 3) Insert to articles with thumbnail_url captured from bucket
    const { error: insErr } = await supabase.from('articles').insert({
      title,
      excerpt: content.length > 160 ? content.slice(0, 160) + '…' : content,
      body: content,
      thumbnail_url,        // ✅ store the public URL from the bucket
      author,               // ✅ OB shown as author
      source,               // ✅ null for OB-authored to trigger copyright block without link
      link,                 // ✅ required unique field, internal marker
      published_at: now,
      status: 'Posted',
      views_count: 0,
    });

    setPosting(false);

    if (insErr) {
      setErrorMsg(insErr.message ?? 'Unable to post article.');
      return;
    }

    // success
    onBack();
  }

  return (
    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
      <div className="max-w mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-6">
          <BackIcon />
          <span>Back to Library</span>
        </button>

        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Write Article</h2>
              <p className="text-gray-500 mt-1">Fill in the information below.</p>
            </div>

            {errorMsg && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {errorMsg}
              </div>
            )}

            <div className="border-t border-gray-200 pt-6 space-y-4">
              <div>
                <label htmlFor="article-title" className="block text-sm font-bold text-gray-700 mb-1">Article Details</label>
                <input
                  type="text"
                  id="article-title"
                  placeholder="Enter a descriptive title for your article"
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none placeholder-gray-400 text-sm"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="article-thumbnail" className="block text-sm font-bold text-gray-700 mb-1">Thumbnail</label>
                <input
                  id="article-thumbnail"
                  type="file"
                  accept="image/*"
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none text-sm"
                  onChange={(e) => setThumbFile(e.target.files?.[0] ?? null)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Uploads to <code>obgyn_thumbnail_articles</code> (public). The image URL is saved to <code>articles.thumbnail_url</code>.
                </p>
              </div>

              <div>
                <label htmlFor="article-content" className="block text-sm font-bold text-gray-700 mb-1">Content</label>
                <textarea
                  id="article-content"
                  rows={12}
                  placeholder="Enter your article content here"
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none placeholder-gray-400 text-sm"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <button
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            onClick={onBack}
            disabled={posting}
          >
            <DiscardIcon />
            <span>Discard</span>
          </button>
          <button
            className="flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white bg-[#E46B64] rounded-lg hover:bg-[#D15B54]"
            onClick={handlePost}
            disabled={posting}
          >
            <PostIcon />
            <span>{posting ? 'Posting…' : 'Post'}</span>
          </button>
        </div>
      </div>
    </main>
  );
}
