"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  Globe,
  ExternalLink,
  User,
  Pencil,
  UserPlus,
  Loader2,
  Trash2,
} from "lucide-react";
import type { LeadRow } from "@/lib/leads-data";
import { convertLeadToMerchantAction, deleteLeadAction } from "@/app/dashboard/leads/actions";

const TikTokIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

function isUrl(value: string): boolean {
  const s = value.trim();
  return s.startsWith("http://") || s.startsWith("https://");
}

type LeadWithId = LeadRow & { id: string };

export function LeadDetail({
  lead,
  userRole,
}: {
  lead: LeadWithId;
  userRole?: string;
}) {
  const router = useRouter();
  const [convertLoading, setConvertLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const canEdit = userRole === "ADMIN" || userRole === "EDITOR";
  const canPromote =
    canEdit &&
    (lead.stage === "Confirmed" ||
      lead.stage === "Interested" ||
      ["PH Confirmed Merchants", "US Confirmed Merchants", "Interested Merchants"].includes(
        lead.sourceSheet
      ));

  async function handlePromote() {
    setConvertLoading(true);
    const result = await convertLeadToMerchantAction(lead.id);
    setConvertLoading(false);
    if (result.success && "redirect" in result) {
      router.push(result.redirect);
      router.refresh();
    } else if (!result.success && "error" in result) {
      alert(result.error ?? "Failed to promote");
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete lead "${lead.merchantName}"? This cannot be undone.`)) return;
    setDeleteLoading(true);
    const result = await deleteLeadAction(lead.id);
    setDeleteLoading(false);
    if (result.success) {
      router.push("/dashboard/leads");
      router.refresh();
    } else {
      alert(result.error ?? "Failed to delete");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{lead.sourceSheet}</Badge>
        {lead.stage && <Badge variant="outline">{lead.stage}</Badge>}
        {lead.shopifyStatus && lead.shopifyStatus !== "NOT_STARTED" && (
          <Badge>{lead.shopifyStatus}</Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
          <CardDescription>Email, phone, address</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {lead.email && (
            <a
              href={`mailto:${lead.email}`}
              className="flex items-center gap-2 text-primary hover:underline"
            >
              <Mail className="h-4 w-4" />
              {lead.email}
            </a>
          )}
          {lead.contact && (
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              {lead.contact}
            </p>
          )}
          {lead.address && (
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {lead.address}
            </p>
          )}
          {!lead.email && !lead.contact && !lead.address && (
            <p className="text-muted-foreground">No contact info</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Social & Web</CardTitle>
          <CardDescription>Links</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {lead.fb &&
              (isUrl(lead.fb) ? (
                <a
                  href={lead.fb}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <Facebook className="h-4 w-4" />
                  Facebook <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Facebook className="h-4 w-4" />
                  {lead.fb}
                </span>
              ))}
            {lead.ig &&
              (isUrl(lead.ig) ? (
                <a
                  href={lead.ig}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <Instagram className="h-4 w-4" />
                  Instagram <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Instagram className="h-4 w-4" />
                  {lead.ig}
                </span>
              ))}
            {lead.tiktok &&
              (isUrl(lead.tiktok) ? (
                <a
                  href={lead.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <TikTokIcon />
                  TikTok <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <TikTokIcon />
                  {lead.tiktok}
                </span>
              ))}
            {lead.website &&
              (isUrl(lead.website) ? (
                <a
                  href={lead.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <Globe className="h-4 w-4" />
                  Website <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  {lead.website}
                </span>
              ))}
            {!lead.fb && !lead.ig && !lead.tiktok && !lead.website && (
              <p className="text-muted-foreground">No social links</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm">{lead.products || "—"}</p>
        </CardContent>
      </Card>

      {(lead.statusNotes || lead.callsUpdate) && (
        <Card>
          <CardHeader>
            <CardTitle>Notes & History</CardTitle>
            <CardDescription>Status notes and call updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {lead.statusNotes && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status Notes</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{lead.statusNotes}</p>
              </div>
            )}
            {lead.callsUpdate && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Calls Update</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{lead.callsUpdate}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {lead.encodedBy && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          Encoded by {lead.encodedBy}
        </p>
      )}

      {canEdit && (
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={`/dashboard/leads/${lead.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Lead
            </Link>
          </Button>
          {canPromote && (
            <Button
              disabled={convertLoading}
              onClick={handlePromote}
              className="bg-[#5e3c28] text-white hover:bg-[#4a2f20]"
            >
              {convertLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="mr-2 h-4 w-4" />
              )}
              Promote to Merchant
            </Button>
          )}
          <Button
            variant="destructive"
            disabled={deleteLoading}
            onClick={handleDelete}
          >
            {deleteLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Delete Lead
          </Button>
        </div>
      )}
    </div>
  );
}
