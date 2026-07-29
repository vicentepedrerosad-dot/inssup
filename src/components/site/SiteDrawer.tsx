"use client";

import Link from "next/link";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { SiteDetailBody } from "./SiteDetailBody";
import { useStore } from "@/lib/store";
import { ExternalLink } from "lucide-react";

export function SiteDrawer({
  siteId,
  onClose,
}: {
  siteId: string | null;
  onClose: () => void;
}) {
  const { sites } = useStore();
  const site = siteId ? sites.find((s) => s.id === siteId) : null;

  return (
    <Drawer
      open={!!site}
      onClose={onClose}
      title={site?.name}
      subtitle={site ? `${site.id} · ${site.comuna}, ${site.region}` : undefined}
      footer={
        site && (
          <div className="flex justify-end">
            <Link href={`/sitios/${site.id}`} onClick={onClose}>
              <Button variant="outline" size="sm">
                <ExternalLink className="size-4" />
                Abrir ficha completa
              </Button>
            </Link>
          </div>
        )
      }
    >
      {site && <SiteDetailBody siteId={site.id} />}
    </Drawer>
  );
}
