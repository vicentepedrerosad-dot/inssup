"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { SiteDetailBody } from "@/components/site/SiteDetailBody";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/misc";
import { SitesMap } from "@/components/map/SitesMap";
import { ArrowLeft, RadioTower, HardHat } from "lucide-react";

export default function SiteDetailPage() {
  const params = useParams<{ id: string }>();
  const { sites } = useStore();
  const site = sites.find((s) => s.id === params.id);

  if (!site) {
    return (
      <Card>
        <EmptyState
          icon={<RadioTower className="size-6" />}
          title="Sitio no encontrado"
          description={`No existe un sitio con código ${params.id}.`}
          action={
            <Link href="/sitios">
              <Button variant="outline" size="sm">
                <ArrowLeft className="size-4" /> Volver a sitios
              </Button>
            </Link>
          }
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href="/sitios">
            <Button variant="ghost" size="icon" aria-label="Volver">
              <ArrowLeft className="size-4.5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">
              {site.name}
            </h1>
            <p className="text-sm text-slate-500">
              <span className="font-mono">{site.id}</span> · {site.comuna},{" "}
              {site.region}
            </p>
          </div>
        </div>
        <Link href="/terreno" className="hidden sm:block">
          <Button variant="outline" size="sm">
            <HardHat className="size-4" />
            Registrar en terreno
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SiteDetailBody siteId={site.id} />
        </Card>

        <div className="space-y-4">
          <Card className="overflow-hidden">
            <CardHeader title="Ubicación" subtitle={`${site.comuna}, ${site.region}`} />
            <SitesMap sites={[site]} height={260} />
          </Card>
        </div>
      </div>
    </div>
  );
}
