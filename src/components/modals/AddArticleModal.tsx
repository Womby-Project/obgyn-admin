import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Icon } from "@iconify/react";
import { useState } from "react";
import { toast } from "sonner";

interface AddArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (url: string) => Promise<void> | void;
}

export default function AddArticleModal({
  isOpen,
  onClose,
  onAdd,
}: AddArticleModalProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddArticle = async () => {
    if (!url.trim()) {
      toast.error("Please enter a valid URL");
      return;
    }

    try {
      setLoading(true);
      await onAdd(url);
      toast.success("Adding new article, please wait!");
      setUrl("");
      onClose();
    } catch (err: any) {
      console.error("Error adding article:", err);
      toast.error(err.message || "Failed to add article");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95%] max-w-lg bg-white rounded-xl shadow-lg p-8 border-none space-y-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800">
            Add Article By URL
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            Enter a URL to add an article to your content library. The system
            will automatically extract the title, content, and images.
          </p>
        </DialogHeader>

        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Article URL
          </label>
          <Icon
            icon="ph:link-bold"
            className="absolute left-3 top-10 text-gray-400 h-5 w-5"
          />
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/article"
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#E46B64]/40 outline-none"
            disabled={loading}
          />
        </div>

        <div className="flex justify-end gap-4 pt-4 border-gray-200">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2 rounded-lg bg-white border border-gray-300 text-gray-800 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAddArticle}
            disabled={loading}
            className="px-6 py-2 rounded-lg text-white font-semibold bg-[#E46B64] hover:bg-[#d65c58] transition-colors disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add Article"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
