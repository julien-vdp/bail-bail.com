import { getAccountInfo } from "@/actions/auth";
import { redirect } from "next/navigation";
import { AccountForm } from "./AccountForm";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { DeleteApplicationButton } from "./DeleteApplicationButton";

export default async function AccountPage() {
  const res = await getAccountInfo();
  
  if (res.error || !res.data) {
    redirect("/auth");
  }

  const user = res.data;
  const { prisma } = await import("@/lib/prisma");
  let hasOtherRole = false;
  let applications: any[] = [];

  if (user.email) {
    if (user.role === "OWNER") {
      const candidate = await prisma.candidate.findUnique({ where: { email: user.email } });
      hasOtherRole = !!candidate;
    } else {
      const owner = await prisma.user.findUnique({ where: { email: user.email } });
      hasOtherRole = !!owner;
      const candidate = await prisma.candidate.findUnique({ 
        where: { email: user.email },
        include: {
          applications: {
            include: { property: true },
            orderBy: { createdAt: "desc" }
          }
        }
      });
      if (candidate) {
        applications = candidate.applications;
      }
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NOUVEAU': return <span className="bg-blue-100 text-blue-700 text-[10px] uppercase px-2 py-1 rounded-full font-bold">Nouveau</span>;
      case 'INCOMPLET': return <span className="bg-orange-100 text-orange-700 text-[10px] uppercase px-2 py-1 rounded-full font-bold">Incomplet</span>;
      case 'EN_COURS': return <span className="bg-purple-100 text-purple-700 text-[10px] uppercase px-2 py-1 rounded-full font-bold">En analyse</span>;
      case 'ACCEPTE': return <span className="bg-green-100 text-green-700 text-[10px] uppercase px-2 py-1 rounded-full font-bold">Accepté</span>;
      case 'REFUSE': return <span className="bg-red-100 text-red-700 text-[10px] uppercase px-2 py-1 rounded-full font-bold">Refusé</span>;
      default: return <span className="bg-slate-100 text-slate-700 text-[10px] uppercase px-2 py-1 rounded-full font-bold">{status}</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 pt-8 md:pt-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Mon Compte</h1>
        <p className="text-slate-500 mt-2">
          Gérez vos informations personnelles et suivez vos dossiers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Colonne de gauche : Formulaire */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-5 text-center">Mes Informations</h2>
            <AccountForm initialData={user} hasOtherRole={hasOtherRole} />
          </div>
        </div>

        {/* Colonne de droite : Candidatures (seulement si candidat) */}
        {user.role === "CANDIDATE" && (
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold text-slate-800">Mes Dossiers de Location</h2>
            
            {applications.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
                <Home className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p>Vous n'avez pas encore déposé de candidature.</p>
                <Link href="/annonces" className="text-primary font-medium hover:underline mt-2 inline-block">Consulter nos annonces</Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {applications.map(app => (
                  <div key={app.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-primary/40 transition-all flex items-center justify-between gap-4">
                    <Link href={`/dossier/${app.id}`} className="min-w-0 flex-1 group">
                      <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-3 rounded-xl text-primary shrink-0">
                          <Home className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-bold text-slate-900 group-hover:text-primary transition-colors">{app.property.title}</h3>
                            {getStatusBadge(app.status)}
                          </div>
                          <p className="text-sm text-slate-500 flex items-center gap-2">
                            <span className="truncate max-w-[200px] sm:max-w-[300px]">{app.property.shortAddress}</span>
                            <span className="hidden sm:inline">•</span>
                            <span className="font-bold text-slate-700 hidden sm:inline">{app.property.rent} € / mois</span>
                          </p>
                        </div>
                      </div>
                    </Link>
                    <div className="shrink-0 flex items-center gap-2">
                      <Link href={`/dossier/${app.id}`} className="block group">
                        <div className="w-10 h-10 rounded-full bg-slate-50 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
                        </div>
                      </Link>
                      <DeleteApplicationButton applicationId={app.id} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
