"use client";

import { useState, useEffect } from "react";
import { Share2, X, Trash2, Users } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { logger } from "@/lib/logger";

type ShareInfo = {
  id: string;
  sharedWithEmail: string;
  permission: string;
  createdAt: string;
};

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  itemType: "task" | "note" | "trip";
  itemId: string;
  itemTitle: string;
}

export function ShareDialog({ open, onClose, itemType, itemId, itemTitle }: ShareDialogProps) {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<"view" | "edit">("view");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [existingShares, setExistingShares] = useState<ShareInfo[]>([]);

  useEffect(() => {
    if (!open) return;
    setEmail("");
    setPermission("view");
    setError(null);
    setSuccess(null);
    loadExistingShares();
  }, [open, itemId]);

  async function loadExistingShares() {
    try {
      const shares = await apiClient<ShareInfo[]>(`/api/shares?view=by-me`);
      setExistingShares(
        shares.filter((s) => s.id && s.sharedWithEmail).filter(
          (s: ShareInfo & { itemType?: string; itemId?: string }) =>
            (s as Record<string, unknown>).itemType === itemType &&
            (s as Record<string, unknown>).itemId === itemId,
        ),
      );
    } catch {
      logger.error("Failed to load existing shares");
    }
  }

  async function handleShare() {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await apiClient("/api/shares", {
        method: "POST",
        body: JSON.stringify({ itemType, itemId, email: email.trim(), permission }),
      });
      setSuccess(`Shared with ${email.trim()}`);
      setEmail("");
      await loadExistingShares();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to share");
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke(shareId: string) {
    try {
      await apiClient(`/api/shares/${shareId}`, { method: "DELETE" });
      setExistingShares((prev) => prev.filter((s) => s.id !== shareId));
    } catch {
      setError("Failed to revoke share");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-sm mx-4 mb-4 sm:mb-0 rounded-2xl border bg-card p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-sm">Share</h2>
          </div>
          <button onClick={onClose} className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground truncate" title={itemTitle}>
          {itemTitle}
        </p>

        <div className="space-y-2">
          <input
            type="email"
            placeholder="Enter email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm bg-background"
            onKeyDown={(e) => { if (e.key === "Enter") void handleShare(); }}
          />
          <div className="flex gap-2">
            <select
              value={permission}
              onChange={(e) => setPermission(e.target.value as "view" | "edit")}
              className="flex-1 rounded-lg border px-3 py-2 text-sm bg-background"
            >
              <option value="view">Can view</option>
              <option value="edit">Can edit</option>
            </select>
            <button
              onClick={() => void handleShare()}
              disabled={loading || !email.trim()}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
            >
              {loading ? "..." : "Share"}
            </button>
          </div>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}
        {success && <p className="text-xs text-green-600 dark:text-green-400">{success}</p>}

        {existingShares.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              Shared with
            </div>
            {existingShares.map((share) => (
              <div key={share.id} className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-medium">{share.sharedWithEmail}</span>
                  <span className="text-muted-foreground ml-1">({share.permission})</span>
                </div>
                <button
                  onClick={() => void handleRevoke(share.id)}
                  className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
