"use client";

import { useTransition, useState, useRef } from "react";
import { updatePropertyAction, deletePropertyAction } from "@/actions/property";
import { uploadPropertyImageAction, deletePropertyImageAction } from "@/actions/upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Trash2, Save, Image as ImageIcon, CheckCircle2, UploadCloud, Sliders } from "lucide-react";
import { AddressAutocomplete } from "./AddressAutocomplete";

function AnnonceSettingsIllustration() {
  return (
    <svg viewBox="0 0 400 180" className="w-full max-h-[140px] bg-gradient-to-br from-[#092B5A]/5 to-[#1463FF]/5 border border-slate-100 rounded-xl py-2 px-4 shadow-inner" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background circles */}
      <circle cx="80" cy="90" r="50" fill="#1463FF" fillOpacity="0.04" />
      <circle cx="320" cy="90" r="45" fill="#092B5A" fillOpacity="0.03" />

      {/* 1. House (Bail-Bail logo/style) on the left */}
      <g transform="translate(40, 25)">
        {/* House background card outline */}
        <rect x="0" y="20" width="80" height="90" rx="14" fill="white" stroke="#092B5A" strokeWidth="2.5" />
        {/* Roof */}
        <path d="M-5 20 L40 -5 L85 20" stroke="#092B5A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {/* Windows */}
        <rect x="15" y="38" width="18" height="18" rx="4" fill="#1463FF" fillOpacity="0.1" stroke="#1463FF" strokeWidth="2" />
        <rect x="47" y="38" width="18" height="18" rx="4" fill="#1463FF" fillOpacity="0.1" stroke="#1463FF" strokeWidth="2" />
        {/* Door */}
        <rect x="15" y="68" width="18" height="42" rx="3" fill="#092B5A" />
        {/* Tiny window on the door or heart */}
        <circle cx="24" cy="78" r="2" fill="white" />
        {/* Chimney */}
        <rect x="58" y="0" width="12" height="16" rx="2" fill="#EF4444" />
      </g>

      {/* 2. Connection lines (representing configuration flow) */}
      <path d="M 140 90 L 190 90" stroke="#1463FF" strokeWidth="2" strokeDasharray="4 4" strokeLinecap="round" />

      {/* 3. Settings Control panel with Sliders/Toggles on the right */}
      <g transform="translate(210, 20)">
        {/* Panel outline */}
        <rect x="0" y="0" width="150" height="125" rx="14" fill="white" stroke="#092B5A" strokeWidth="2.5" />
        
        {/* Slider 1 */}
        <rect x="15" y="25" width="80" height="6" rx="3" fill="#E2E8F0" />
        <rect x="15" y="25" width="45" height="6" rx="3" fill="#1463FF" />
        <circle cx="60" cy="28" r="7" fill="white" stroke="#1463FF" strokeWidth="2.5" />
        
        {/* Toggle switch 1 */}
        <rect x="15" y="55" width="100" height="4" rx="2" fill="#E2E8F0" />
        <rect x="110" y="47" width="25" height="14" rx="7" fill="#1463FF" />
        <circle cx="127" cy="54" r="5" fill="white" />
        
        {/* Slider 2 */}
        <rect x="15" y="85" width="80" height="6" rx="3" fill="#E2E8F0" />
        <rect x="15" y="85" width="65" height="6" rx="3" fill="#1463FF" />
        <circle cx="80" cy="88" r="7" fill="white" stroke="#1463FF" strokeWidth="2.5" />

        {/* Toggle switch 2 (off) */}
        <rect x="110" y="78" width="25" height="14" rx="7" fill="#CBD5E1" />
        <circle cx="117" cy="85" r="5" fill="white" />
        
        {/* Small decorations */}
        <rect x="15" y="15" width="40" height="4" rx="2" fill="#94A3B8" />
        <rect x="15" y="45" width="50" height="4" rx="2" fill="#94A3B8" />
        <rect x="15" y="75" width="30" height="4" rx="2" fill="#94A3B8" />
      </g>
    </svg>
  );
}

export function PropertyEditForm({
  property,
  bankImages
}: {
  property: any;
  bankImages: string[];
}) {
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [hasGli, setHasGli] = useState(property.hasGli || property.isEligibleGLI || false);
  const [gliMonthlyIncomeThreshold, setGliMonthlyIncomeThreshold] = useState(
    property.gliMonthlyIncomeThreshold !== null && property.gliMonthlyIncomeThreshold !== undefined
      ? String(property.gliMonthlyIncomeThreshold)
      : property.minSalaryRequired !== null && property.minSalaryRequired !== undefined
      ? String(property.minSalaryRequired)
      : ""
  );
  const [acceptsGuarantor, setAcceptsGuarantor] = useState(property.acceptsGuarantor !== false);
  const [acceptsStudent, setAcceptsStudent] = useState(
    property.acceptsStudent !== false && property.studentPolicy !== "REFUSED"
  );
  const [requiresTaxNotice, setRequiresTaxNotice] = useState(property.requiresTaxNotice !== false);
  const [requiresCurrentAddressProof, setRequiresCurrentAddressProof] = useState(property.requiresCurrentAddressProof !== false);
  const [requiresEmploymentProof, setRequiresEmploymentProof] = useState(property.requiresEmploymentProof !== false);
  const [requiresIncomeProof, setRequiresIncomeProof] = useState(property.requiresIncomeProof !== false);
  const [customInstructions, setCustomInstructions] = useState(property.customInstructions || "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Separate bank images and uploaded images
  const allPropertyImages = property.images?.map((img: any) => img.url) || [];
  const uploadedImages = allPropertyImages.filter((url: string) => url.startsWith("/api/images/"));
  const [selectedBankImages, setSelectedBankImages] = useState<string[]>(
    allPropertyImages.filter((url: string) => !url.startsWith("/api/images/"))
  );

  const toggleBankImage = (url: string) => {
    if (selectedBankImages.includes(url)) {
      setSelectedBankImages(selectedBankImages.filter(i => i !== url));
    } else {
      setSelectedBankImages([...selectedBankImages, url]);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsUploading(true);
    const formData = new FormData();
    Array.from(e.target.files).forEach(file => formData.append("images", file));
    
    const res = await uploadPropertyImageAction(property.id, formData);
    if (res.error) {
      alert("Erreur: " + res.error);
    }
    
    // Clear input
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsUploading(false);
  };

  const handleDeleteImage = async (url: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette photo ?")) return;
    
    setIsDeleting(url);
    const res = await deletePropertyImageAction(url);
    if (res.error) {
      alert("Erreur: " + res.error);
    }
    setIsDeleting(null);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    // Add selected bank images to the form data
    selectedBankImages.forEach(img => {
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
                <label className="text-sm font-medium mb-1 block">Adresse complète</label>
                <AddressAutocomplete name="shortAddress" defaultValue={property.shortAddress} />
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

            <div className="md:col-span-2 border rounded-2xl p-6 bg-slate-50/50 space-y-6 mt-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-[#092B5A] flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-[#1463FF]" />
                    Paramètres du dossier locatif
                  </h3>
                  <p className="text-xs text-slate-500">
                    Personnalisez finement la checklist et les exigences documentaires pour cette annonce.
                  </p>
                </div>
                <div className="w-full lg:w-[280px] shrink-0">
                  <AnnonceSettingsIllustration />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* 1. Assurances & Éligibilité */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-800 border-b pb-1">Conditions de garanties</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 border rounded-xl p-4 bg-white shadow-sm">
                        <div className="flex items-start space-x-3">
                          <Checkbox 
                            id="hasGli" 
                            name="hasGli" 
                            checked={hasGli}
                            onCheckedChange={(c) => setHasGli(c === true)}
                          />
                          <div className="grid gap-1 leading-none">
                            <label htmlFor="hasGli" className="text-sm font-bold text-[#092B5A] cursor-pointer">
                              Garantie Loyers Impayés activée
                            </label>
                            <p className="text-xs text-slate-400">
                              Activez cette option si le logement est couvert par une assurance loyers impayés.
                            </p>
                          </div>
                        </div>

                        {hasGli && (
                          <div className="mt-4 pt-3 border-t pl-2 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                            <label className="text-xs font-bold text-[#092B5A] block">
                              Revenu net mensuel minimum demandé (€)
                            </label>
                            <Input 
                              name="gliMonthlyIncomeThreshold" 
                              type="number" 
                              value={gliMonthlyIncomeThreshold}
                              onChange={(e) => setGliMonthlyIncomeThreshold(e.target.value)}
                              placeholder="Ex: 4050" 
                              className="h-9 text-sm"
                            />
                            <p className="text-[10px] text-slate-400">
                              Montant généralement demandé par l’assureur pour valider le dossier.
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4 border rounded-xl p-4 bg-white shadow-sm">
                        <div className="flex items-start space-x-3">
                          <Checkbox 
                            id="acceptsGuarantor" 
                            name="acceptsGuarantor" 
                            checked={acceptsGuarantor}
                            onCheckedChange={(c) => setAcceptsGuarantor(c === true)}
                          />
                          <div className="grid gap-1 leading-none">
                            <label htmlFor="acceptsGuarantor" className="text-sm font-bold text-[#092B5A] cursor-pointer">
                              Accepter les garants
                            </label>
                            <p className="text-xs text-slate-400">
                              Permettre aux candidats d’ajouter un garant à leur dossier.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3 border-t pt-3">
                          <Checkbox 
                            id="acceptsStudent" 
                            name="acceptsStudent" 
                            checked={acceptsStudent}
                            onCheckedChange={(c) => setAcceptsStudent(c === true)}
                          />
                          <div className="grid gap-1 leading-none">
                            <label htmlFor="acceptsStudent" className="text-sm font-bold text-[#092B5A] cursor-pointer">
                              Accepter les profils étudiants
                            </label>
                            <p className="text-xs text-slate-400">
                              Permettre aux étudiants de candidater.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. Pièces exigées */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-800 border-b pb-1">Pièces justificatives requises</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start space-x-3 border rounded-xl p-3 bg-white shadow-sm">
                        <Checkbox 
                          id="requiresCurrentAddressProof" 
                          name="requiresCurrentAddressProof" 
                          checked={requiresCurrentAddressProof}
                          onCheckedChange={(c) => setRequiresCurrentAddressProof(c === true)}
                        />
                        <div className="grid gap-1 leading-none">
                          <label htmlFor="requiresCurrentAddressProof" className="text-sm font-semibold cursor-pointer">
                            Justificatif de domicile actuel
                          </label>
                          <p className="text-xs text-slate-400">Quittance de loyer, attestation d'hébergement, etc.</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3 border rounded-xl p-3 bg-white shadow-sm">
                        <Checkbox 
                          id="requiresEmploymentProof" 
                          name="requiresEmploymentProof" 
                          checked={requiresEmploymentProof}
                          onCheckedChange={(c) => setRequiresEmploymentProof(c === true)}
                        />
                        <div className="grid gap-1 leading-none">
                          <label htmlFor="requiresEmploymentProof" className="text-sm font-semibold cursor-pointer">
                            Justificatif de situation professionnelle
                          </label>
                          <p className="text-xs text-slate-400">Contrat de travail, attestation employeur, Kbis...</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3 border rounded-xl p-3 bg-white shadow-sm">
                        <Checkbox 
                          id="requiresIncomeProof" 
                          name="requiresIncomeProof" 
                          checked={requiresIncomeProof}
                          onCheckedChange={(c) => setRequiresIncomeProof(c === true)}
                        />
                        <div className="grid gap-1 leading-none">
                          <label htmlFor="requiresIncomeProof" className="text-sm font-semibold cursor-pointer">
                            Justificatifs de revenus
                          </label>
                          <p className="text-xs text-slate-400">3 dernières fiches de paie, justificatifs de pension, etc.</p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3 border rounded-xl p-3 bg-white shadow-sm">
                        <Checkbox 
                          id="requiresTaxNotice" 
                          name="requiresTaxNotice" 
                          checked={requiresTaxNotice}
                          onCheckedChange={(c) => setRequiresTaxNotice(c === true)}
                        />
                        <div className="grid gap-1 leading-none">
                          <label htmlFor="requiresTaxNotice" className="text-sm font-semibold cursor-pointer">
                            Dernier avis d'imposition
                          </label>
                          <p className="text-xs text-slate-400">Avis d'imposition requis ou non pour le dossier.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. Consignes supplémentaires */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#092B5A] block">Consignes complémentaires</label>
                    <Textarea 
                      name="customInstructions" 
                      value={customInstructions}
                      onChange={(e) => setCustomInstructions(e.target.value)}
                      placeholder="Ex: Merci de déposer les documents au format PDF si possible."
                      className="min-h-[85px] text-sm"
                    />
                  </div>
                </div>

                {/* Résumé des critères (Sidebar de la card) */}
                <div className="bg-[#092B5A]/5 rounded-2xl p-5 border border-slate-200/60 space-y-4 self-start">
                  <h5 className="text-xs font-bold text-[#092B5A] uppercase tracking-wider">Résumé du dossier exigé</h5>
                  <ul className="space-y-3 text-xs">
                    <li className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                      <span className="text-slate-500 font-medium">GLI (Assurance)</span>
                      <span className={`font-bold px-2 py-0.5 rounded-full ${hasGli ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-600'}`}>
                        {hasGli ? 'Activée' : 'Non activée'}
                      </span>
                    </li>
                    {hasGli && (
                      <li className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                        <span className="text-slate-500 font-medium">Revenu minimum</span>
                        <span className="font-bold text-[#092B5A]">
                          {gliMonthlyIncomeThreshold ? `${gliMonthlyIncomeThreshold} €/mois` : `3x le loyer (${property.rent * 3} €/mois)`}
                        </span>
                      </li>
                    )}
                    <li className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                      <span className="text-slate-500 font-medium">Garants</span>
                      <span className={`font-bold px-2 py-0.5 rounded-full ${acceptsGuarantor ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {acceptsGuarantor ? 'Acceptés' : 'Refusés'}
                      </span>
                    </li>
                    <li className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                      <span className="text-slate-500 font-medium">Étudiants</span>
                      <span className={`font-bold px-2 py-0.5 rounded-full ${acceptsStudent ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {acceptsStudent ? 'Acceptés' : 'Refusés'}
                      </span>
                    </li>
                  </ul>
                  
                  {/* Hidden inputs to sync old properties fields if they are submitted */}
                  <input type="hidden" name="isEligibleGLI" value={hasGli ? "true" : "false"} />
                  <input type="hidden" name="minSalaryRequired" value={gliMonthlyIncomeThreshold || ""} />
                  <input type="hidden" name="studentPolicy" value={acceptsStudent ? "ACCEPTED" : "REFUSED"} />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-slate-500" />
                <h2 className="text-xl font-bold">Galerie photos</h2>
              </div>
              <div>
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                  Ajouter des photos
                </Button>
              </div>
            </div>

            {uploadedImages.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Vos photos importées</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {uploadedImages.map((url: string) => (
                    <div key={url} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 shadow-sm group">
                      <img src={url} alt="Photo du logement" className="w-full h-full object-cover" />
                      
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button 
                          type="button" 
                          variant="destructive" 
                          size="icon" 
                          className="rounded-full h-8 w-8"
                          onClick={() => handleDeleteImage(url)}
                          disabled={isDeleting === url}
                        >
                          {isDeleting === url ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Banque d'images générées</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {bankImages.map(url => {
                  const isSelected = selectedBankImages.includes(url);
                  return (
                    <div
                      key={url}
                      onClick={() => toggleBankImage(url)}
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
          </div>

          <div className="flex justify-between items-center pt-6 border-t">
            <Button type="button" variant="destructive" onClick={handleArchive} disabled={isPending || isUploading}>
              <Trash2 className="w-4 h-4 mr-2" /> Archiver
            </Button>
            <Button type="submit" disabled={isPending || isUploading} className="gap-2">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Enregistrer les modifications
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
