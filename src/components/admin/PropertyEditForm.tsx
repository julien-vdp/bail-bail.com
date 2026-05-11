"use client";

import { useTransition, useState } from "react";
import { updatePropertyAction, deletePropertyAction } from "@/actions/property";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Trash2, Save, Image as ImageIcon, CheckCircle2 } from "lucide-react";

export function PropertyEditForm({
  property,
  bankImages
}: {
  property: any;
  bankImages: string[];
}) {
  const [isPending, startTransition] = useTransition();
  const [isGli, setIsGli] = useState(property.isEligibleGLI || false);
  const [selectedImages, setSelectedImages] = useState<string[]>(
    property.images?.map((img: any) => img.url) || []
  );

  const toggleImage = (url: string) => {
    if (selectedImages.includes(url)) {
      setSelectedImages(selectedImages.filter(i => i !== url));
    } else {
      setSelectedImages([...selectedImages, url]);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    // Add selected images
    selectedImages.forEach(img => {
      formData.append("images", img);
    });

    startTransition(async () => {
      await updatePropertyAction(null, formData);
      alert("Annonce mise à jour avec succès !");
    });
  };

  const handleArchive = () => {
    if (confirm("Voulez-vous vraiment archiver cette annonce ?")) {
      startTransition(async () => {
        await deletePropertyAction(property.id);
        window.location.href = "/admin";
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <input type="hidden" name="propertyId" value={property.id} />

          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Informations générales</h2>
            <div className="text-sm font-mono bg-slate-100 px-3 py-1 rounded">Code : {property.code}</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Titre de l'annonce</label>
                <Input name="title" defaultValue={property.title} required />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Adresse courte</label>
                <Input name="shortAddress" defaultValue={property.shortAddress} required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Loyer mensuel (€)</label>
                  <Input name="rent" type="number" defaultValue={property.rent} required />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Surface (m²)</label>
                  <Input name="surface" type="number" step="0.1" defaultValue={property.surface} required />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Statut</label>
                <select
                  name="status"
                  defaultValue={property.status}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="DRAFT">Brouillon (Non visible)</option>
                  <option value="AVAILABLE">Actif (Recherche en cours)</option>
                  <option value="RENTED">Loué</option>
                  <option value="ARCHIVED">Archivé</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Description détaillée</label>
                <Textarea
                  name="description"
                  defaultValue={property.description || ""}
                  className="min-h-[250px]"
                />
              </div>
            </div>

            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-xl bg-slate-50 mt-4">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox 
                    id="isEligibleGLI" 
                    name="isEligibleGLI" 
                    checked={isGli}
                    onCheckedChange={(c) => setIsGli(c === true)}
                  />
                  <div>
                    <label htmlFor="isEligibleGLI" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Éligible à la Garantie Loyers Impayés (GLI)
                    </label>
                    <p className="text-xs text-slate-500 mt-1">Affichera un avertissement rouge strict aux candidats.</p>
                  </div>
                </div>
                
                {isGli && (
                  <div className="pl-7">
                    <label className="text-sm font-medium mb-1 block">Salaire minimum exigé (€) (Optionnel)</label>
                    <Input name="minSalaryRequired" type="number" defaultValue={property.minSalaryRequired || ""} placeholder="ex: 2500" />
                    <p className="text-xs text-slate-500 mt-1">S'il est vide, la règle des 3x le loyer s'applique.</p>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Politique Étudiante</label>
                <select 
                  name="studentPolicy" 
                  defaultValue={property.studentPolicy || "ACCEPTED"}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="ACCEPTED">Étudiants acceptés (Garant exigé)</option>
                  <option value="REFUSED">Étudiants refusés</option>
                  <option value="ONLY_STUDENTS">Uniquement pour étudiants</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t">
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="w-5 h-5 text-slate-500" />
              <h2 className="text-xl font-bold">Galerie photos</h2>
            </div>
            <p className="text-sm text-slate-500 mb-4">Sélectionnez les images à associer à cette annonce (issues de notre banque d'images générées).</p>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {bankImages.map(url => {
                const isSelected = selectedImages.includes(url);
                return (
                  <div
                    key={url}
                    onClick={() => toggleImage(url)}
                    className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${isSelected ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-slate-300"
                      }`}
                  >
                    <img src={url} alt="Image bank" className="w-full h-full object-cover" />
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-white rounded-full">
                        <CheckCircle2 className="w-6 h-6 text-primary" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between items-center pt-6 border-t">
            <Button type="button" variant="destructive" onClick={handleArchive} disabled={isPending}>
              <Trash2 className="w-4 h-4 mr-2" /> Archiver
            </Button>
            <Button type="submit" disabled={isPending} className="gap-2">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Enregistrer les modifications
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
