"use client";

import { useState } from "react";
import { MCTClient } from "@mct/sdk";
import { Button } from "@mct/ui/components/Button";
import { Input } from "@mct/ui/components/Input";
import { Dialog } from "@mct/ui/components/Dialog";
import { Badge } from "@mct/ui/components/Badge";
import type { DocumentShare } from "@mct/sdk";

interface DocumentShareClientProps {
  documentId: string;
  initialShares: DocumentShare[];
}

export default function DocumentShareClient({
  documentId,
  initialShares,
}: DocumentShareClientProps) {
  const [shares, setShares] = useState<DocumentShare[]>(initialShares);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState("24");
  const [maxAccess, setMaxAccess] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const api =
    typeof window !== "undefined" ? MCTClient.create({ baseUrl: "" }) : null;

  const handleCreateShare = async () => {
    if (!api) return;
    setError(null);
    setCreating(true);
    try {
      const hours = parseInt(expiresIn, 10);
      if (isNaN(hours) || hours < 1) {
        setError("Expiration must be at least 1 hour");
        return;
      }
      const expiresAt = new Date(
        Date.now() + hours * 60 * 60 * 1000,
      ).toISOString();
      const result = await api.documents.createShare(documentId, {
        expiresAt,
        maxAccess: maxAccess ? parseInt(maxAccess, 10) : undefined,
      });
      setShares((prev) => [...prev, result]);
      setDialogOpen(false);
      setExpiresIn("24");
      setMaxAccess("");
    } catch (e: any) {
      setError(e?.message || "Failed to create share link");
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (shareId: string) => {
    if (!api) return;
    try {
      await api.documents.removeShare(documentId, shareId);
      setShares((prev) => prev.filter((s) => s.id !== shareId));
      setRevokeDialogOpen(null);
    } catch (e: any) {
      setError(e?.message || "Failed to revoke share link");
    }
  };

  const copyToClipboard = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  return (
    <section className="cyber-panel">
      <div className="flex items-center justify-between">
        <h2 className="cyber-heading text-lg">Share Links</h2>
        <Button
          size="sm"
          onClick={() => setDialogOpen(true)}
          disabled={creating}
        >
          Create Link
        </Button>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="mt-6 space-y-3">
        {shares.length === 0 ? (
          <p className="cyber-subtext">
            No share links created yet. Create a link to share this document
            with external parties.
          </p>
        ) : (
          shares.map((share) => {
            const expired = isExpired(share.expires_at);
            const shareUrl = `${window.location.origin}/api/v1/documents/shares/${share.token}`;

            return (
              <div
                key={share.id}
                className="flex flex-col gap-2 rounded-lg border border-white/5 bg-white/5 p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {expired || share.revoked_at ? (
                      <Badge variant="danger" size="sm">
                        Expired
                      </Badge>
                    ) : (
                      <Badge variant="success" size="sm">
                        Active
                      </Badge>
                    )}
                    <span className="text-xs text-slate-400">
                      Created {formatDate(share.created_at)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(shareUrl, share.id)}
                    >
                      {copiedId === share.id ? "Copied!" : "Copy Link"}
                    </Button>
                    {!share.revoked_at && !expired && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setRevokeDialogOpen(share.id)}
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex gap-4 text-xs text-slate-500">
                  <span>
                    Access: {share.access_count}
                    {share.max_access ? ` / ${share.max_access}` : ""}
                  </span>
                  <span>Expires: {formatDate(share.expires_at)}</span>
                  {share.revoked_at && (
                    <span>Revoked: {formatDate(share.revoked_at)}</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Create Share Link"
        description="Generate a shareable link for external parties."
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Expires in (hours)"
            type="number"
            value={expiresIn}
            onChange={(e) => setExpiresIn(e.target.value)}
            min={1}
            max={8760}
            helperText="Minimum 1 hour, maximum 1 year (8760 hours)"
          />
          <Input
            label="Max accesses (optional)"
            type="number"
            value={maxAccess}
            onChange={(e) => setMaxAccess(e.target.value)}
            min={1}
            placeholder="Unlimited"
            helperText="Leave empty for unlimited access"
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateShare} loading={creating}>
              Create Link
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={revokeDialogOpen !== null}
        onOpenChange={() => setRevokeDialogOpen(null)}
        title="Revoke Share Link"
        description="This will immediately invalidate the share link."
        size="sm"
      >
        <p className="cyber-subtext">
          Are you sure you want to revoke this share link? Users with this link
          will no longer be able to access the document.
        </p>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={() => setRevokeDialogOpen(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => revokeDialogOpen && handleRevoke(revokeDialogOpen)}
          >
            Revoke
          </Button>
        </div>
      </Dialog>
    </section>
  );
}
