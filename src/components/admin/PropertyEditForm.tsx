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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [hasGli, setHasGli] = useState(property.hasGli || property.isEligibleGLI || false);
  const [gliMode, setGliMode] = useState<string>(property.gliMode || (property.hasGli || property.isEligibleGLI ? "INDICATIVE" : "NONE"));
  const [rentWithCharges, setRentWithCharges] = useState<number>(property.rentWithCharges || property.rent || 0);
  const [gliMonthlyIncomeThreshold, setGliMonthlyIncomeThreshold] = useState(
    property.gliMonthlyIncomeThreshold !== null && property.gliMonthlyIncomeThreshold !== undefined
      ? String(property.gliMonthlyIncomeThreshold)
      : property.minSalaryRequired !== null && property.minSalaryRequired !== undefined
      ? String(property.minSalaryRequired)
      : ""
  );
  const [acceptsGuarantor, setAcceptsGuarantor] = useState(property.acceptsGuarantor !== false);
  const [acceptsGuarantors, setAcceptsGuarantors] = useState(property.acceptsGuarantors !== false);
  const [acceptsStudent, setAcceptsStudent] = useState(
    property.acceptsStudent !== false && property.studentPolicy !== "REFUSED"
  );
  const [acceptsStudents, setAcceptsStudents] = useState(property.acceptsStudents !== false);
  const [acceptsColocation, setAcceptsColocation] = useState(property.acceptsColocation || false);
  const [acceptsUnstableProfiles, setAcceptsUnstableProfiles] = useState(property.acceptsUnstableProfiles || false);
  const [tenantAlreadyInPlaceStatus, setTenantAlreadyInPlaceStatus] = useState<string>(property.tenantAlreadyInPlaceStatus || "NEW_TENANT");
  const [studentGuarantorPolicy, setStudentGuarantorPolicy] = useState<string>("OBLIGATORY"); // OBLIGATORY, OPTIONAL, NONE
  const [colocationIncomeCumulative, setColocationIncomeCumulative] = useState<boolean>(true);
  const [requiresTaxNotice, setRequiresTaxNotice] = useState(property.requiresTaxNotice !== false);
  const [requiresCurrentAddressProof, setRequiresCurrentAddressProof] = useState(property.requiresCurrentAddressProof !== false);
  const [requiresEmploymentProof, setRequiresEmploymentProof] = useState(property.requiresEmploymentProof !== false);
  const [requiresIncomeProof, setRequiresIncomeProof] = useState(property.requiresIncomeProof !== false);
  const [customInstructions, setCustomInstructions] = useState(property.customInstructions || "");
  const [customDocumentInstructions, setCustomDocumentInstructions] = useState(property.customDocumentInstructions || "");
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

  const handleDelete = () => {
    setIsDeleteModalOpen(false);
    startTransition(async () => {
      const res = await deletePropertyAction(property.id);
      if (res && res.error) {
        alert("Erreur : " + res.error);
      } else {
        window.location.href = "/admin";
      }
    });
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
                    Conditions du dossier locatif
                  </h3>
                  <p className="text-xs text-slate-500">
                    Définissez les critères d'éligibilité et configurez le moteur conditionnel pour les pièces justificatives.
                  </p>
                </div>
                <div className="w-full lg:w-[280px] shrink-0">
                  <AnnonceSettingsIllustration />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Champ 1 : Garantie Loyers Impayés */}
                  <div className="space-y-3 bg-white p-5 rounded-2xl border shadow-sm">
                    <div>
                      <label className="text-sm font-bold text-[#092B5A] block mb-1">
                        Le logement est-il couvert par une Garantie Loyers Impayés (GLI) ?
                      </label>
                      <p className="text-xs text-slate-500 mb-3">
                        L'assurance loyers impayés impose des critères stricts de solvabilité aux locataires.
                      </p>
                      <div className="flex gap-4">
                        <label className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 cursor-pointer transition-all ${
                          gliMode !== "NONE" 
                            ? "border-[#1463FF] bg-[#1463FF]/5 text-[#1463FF] font-bold" 
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                        }`}>
                          <input 
                            type="radio" 
                            name="gli_active_toggle" 
                            checked={gliMode !== "NONE"} 
                            onChange={() => setGliMode("INDICATIVE")} 
                            className="sr-only"
                          />
                          <span>Oui, couvert</span>
                        </label>
                        <label className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 cursor-pointer transition-all ${
                          gliMode === "NONE" 
                            ? "border-[#092B5A] bg-[#092B5A]/5 text-[#092B5A] font-bold" 
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                        }`}>
                          <input 
                            type="radio" 
                            name="gli_active_toggle" 
                            checked={gliMode === "NONE"} 
                            onChange={() => setGliMode("NONE")} 
                            className="sr-only"
                          />
                          <span>Non couvert</span>
                        </label>
                      </div>
                    </div>

                    {/* Sous-section GLI dynamique */}
                    {gliMode !== "NONE" && (
                      <div className="pt-4 border-t border-slate-100 space-y-4 animate-in fade-in duration-300">
                        {/* A. Loyer charges comprises & Mode GLI */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-bold text-[#092B5A] block mb-1">
                              Loyer charges comprises (€) <span className="text-red-500">*</span>
                            </label>
                            <Input 
                              type="number" 
                              required 
                              name="rentWithCharges" 
                              value={rentWithCharges} 
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setRentWithCharges(val);
                                // Suggest default threshold if not set manually
                                setGliMonthlyIncomeThreshold(String(Math.round(val * 3)));
                              }}
                              className="h-10 text-sm"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-[#092B5A] block mb-1">
                              Mode de filtrage GLI
                            </label>
                            <select
                              value={gliMode}
                              onChange={(e) => setGliMode(e.target.value)}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                              <option value="INDICATIVE">Indicatif (Conseillé, n'empêche pas le dépôt)</option>
                              <option value="STRICT">Strict (Avertissement fort sur l'éligibilité)</option>
                            </select>
                          </div>
                        </div>

                        {/* B. Seuil de revenu minimum */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-bold text-[#092B5A]">
                              Seuil de revenu mensuel minimum (€)
                            </label>
                            <button
                              type="button"
                              onClick={() => setGliMonthlyIncomeThreshold(String(Math.round(rentWithCharges * 3)))}
                              className="text-[10px] text-[#1463FF] hover:underline font-semibold"
                            >
                              Calculer à 3x ({Math.round(rentWithCharges * 3)} €)
                            </button>
                          </div>
                          <Input 
                            type="number" 
                            value={gliMonthlyIncomeThreshold} 
                            onChange={(e) => setGliMonthlyIncomeThreshold(e.target.value)}
                            placeholder="Ex: 3000"
                            className="h-10 text-sm"
                          />
                          <p className="text-[11px] text-slate-500 mt-1">
                            Le seuil dépend des règles de votre assurance. Bail-Bail peut vous aider à structurer la demande de pièces, mais ne remplace pas la validation finale de l’assureur.
                          </p>
                        </div>

                        {/* C. Règles de solvabilité GLI Card */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
                          <h5 className="font-bold text-[#092B5A] text-xs">Règles indicatives de solvabilité GLI :</h5>
                          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5 list-disc pl-4 text-slate-600">
                            <li>CDI hors période d'essai : max 37% d'effort</li>
                            <li>Fonctionnaire : max 37% d'effort</li>
                            <li>Indépendant (≥ 2 ans) : max 33% d'effort</li>
                            <li>CDI en mobilité : max 30% d'effort</li>
                            <li>CDD (reste ≥ 12 mois) : max 25% d'effort</li>
                            <li>Retraité : max 37% d'effort</li>
                          </ul>
                        </div>

                        {/* D. Profils acceptés */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-[#092B5A] block">
                            Profils de solvabilité éligibles avec votre contrat GLI :
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs bg-slate-50 p-4 rounded-xl border">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <Checkbox checked={true} disabled />
                              <span className="text-slate-600">CDI hors période d’essai</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <Checkbox checked={true} disabled />
                              <span className="text-slate-600">Fonctionnaire</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <Checkbox checked={true} disabled />
                              <span className="text-slate-600">Indépendant &gt; 2 ans</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <Checkbox checked={true} disabled />
                              <span className="text-slate-600">Retraité</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <Checkbox checked={true} disabled />
                              <span className="text-slate-600">CDI en mobilité</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <Checkbox checked={true} disabled />
                              <span className="text-slate-600">CDD restant &ge; 12 mois</span>
                            </label>
                            
                            <label htmlFor="acceptsStudentsCheckbox" className="flex items-center gap-2 cursor-pointer">
                              <Checkbox 
                                id="acceptsStudentsCheckbox"
                                checked={acceptsStudents} 
                                onCheckedChange={(checked) => setAcceptsStudents(checked === true)}
                              />
                              <span className="text-slate-700 font-medium">Étudiant / apprenti avec garant</span>
                            </label>
                            
                            <label htmlFor="acceptsColocationCheckbox" className="flex items-center gap-2 cursor-pointer">
                              <Checkbox 
                                id="acceptsColocationCheckbox"
                                checked={acceptsColocation} 
                                onCheckedChange={(checked) => setAcceptsColocation(checked === true)}
                              />
                              <span className="text-slate-700 font-medium">Colocation cumulable</span>
                            </label>

                            <label htmlFor="acceptsUnstableProfilesCheckbox" className="flex items-center gap-2 cursor-pointer md:col-span-2 border-t pt-2 mt-1">
                              <Checkbox 
                                id="acceptsUnstableProfilesCheckbox"
                                checked={acceptsUnstableProfiles} 
                                onCheckedChange={(checked) => setAcceptsUnstableProfiles(checked === true)}
                              />
                              <div>
                                <span className="text-slate-700 font-medium block">Autres profils (CDD court, chômage, intérim)</span>
                                <span className="text-[10px] text-slate-400">Non standard, requiert une option ou validation explicite.</span>
                              </div>
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Champ 2 : Étudiants / Apprentis */}
                  <div className="space-y-3 bg-white p-5 rounded-2xl border shadow-sm">
                    <div>
                      <label className="text-sm font-bold text-[#092B5A] block mb-1">
                        Acceptez-vous les étudiants ou apprentis ?
                      </label>
                      <div className="flex gap-4 mt-2">
                        <label className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 cursor-pointer transition-all ${
                          acceptsStudents 
                            ? "border-[#1463FF] bg-[#1463FF]/5 text-[#1463FF] font-bold" 
                            : "border-slate-200 bg-white text-slate-600"
                        }`}>
                          <input 
                            type="radio" 
                            name="accepts_students_toggle" 
                            checked={acceptsStudents} 
                            onChange={() => setAcceptsStudents(true)} 
                            className="sr-only"
                          />
                          <span>Oui</span>
                        </label>
                        <label className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 cursor-pointer transition-all ${
                          !acceptsStudents 
                            ? "border-[#092B5A] bg-[#092B5A]/5 text-[#092B5A] font-bold" 
                            : "border-slate-200 bg-white text-slate-600"
                        }`}>
                          <input 
                            type="radio" 
                            name="accepts_students_toggle" 
                            checked={!acceptsStudents} 
                            onChange={() => setAcceptsStudents(false)} 
                            className="sr-only"
                          />
                          <span>Non</span>
                        </label>
                      </div>
                    </div>

                    {acceptsStudents && (
                      <div className="pt-3 border-t border-slate-100 space-y-3 animate-in fade-in duration-200">
                        <label className="text-xs font-bold text-[#092B5A] block mb-1">
                          Demander une caution solidaire (garant) ?
                        </label>
                        <select
                          value={studentGuarantorPolicy}
                          onChange={(e) => {
                            setStudentGuarantorPolicy(e.target.value);
                            if (e.target.value === "OBLIGATORY" || e.target.value === "OPTIONAL") {
                              setAcceptsGuarantors(true);
                            }
                          }}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        >
                          <option value="OBLIGATORY">Oui, obligatoire</option>
                          <option value="OPTIONAL">Oui, facultative</option>
                          <option value="NONE">Non, pas de caution demandée</option>
                        </select>
                        {gliMode !== "NONE" && (
                          <p className="text-[11px] text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                            ℹ️ Dans certaines GLI, la caution solidaire est admise uniquement pour les étudiants ou apprentis.
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Champ 3 : Garants pour les autres profils */}
                  <div className="space-y-3 bg-white p-5 rounded-2xl border shadow-sm">
                    <div>
                      <label className="text-sm font-bold text-[#092B5A] block mb-1">
                        Acceptez-vous les garants pour les autres profils ?
                      </label>
                      <div className="flex gap-4 mt-2">
                        <label className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 cursor-pointer transition-all ${
                          acceptsGuarantors 
                            ? "border-[#1463FF] bg-[#1463FF]/5 text-[#1463FF] font-bold" 
                            : "border-slate-200 bg-white text-slate-600"
                        }`}>
                          <input 
                            type="radio" 
                            name="accepts_guarantors_toggle" 
                            checked={acceptsGuarantors} 
                            onChange={() => setAcceptsGuarantors(true)} 
                            className="sr-only"
                          />
                          <span>Oui</span>
                        </label>
                        <label className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 cursor-pointer transition-all ${
                          !acceptsGuarantors 
                            ? "border-[#092B5A] bg-[#092B5A]/5 text-[#092B5A] font-bold" 
                            : "border-slate-200 bg-white text-slate-600"
                        }`}>
                          <input 
                            type="radio" 
                            name="accepts_guarantors_toggle" 
                            checked={!acceptsGuarantors} 
                            onChange={() => setAcceptsGuarantors(false)} 
                            className="sr-only"
                          />
                          <span>Non</span>
                        </label>
                      </div>
                    </div>

                    {gliMode !== "NONE" && acceptsGuarantors && (
                      <p className="text-[11px] text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200 animate-in fade-in">
                        ⚠️ Attention : selon les contrats GLI, un garant ne remplace pas forcément les critères de solvabilité du candidat, sauf cas prévu comme étudiant ou apprenti.
                      </p>
                    )}
                  </div>

                  {/* Champ 4 : Colocation */}
                  <div className="space-y-3 bg-white p-5 rounded-2xl border shadow-sm">
                    <div>
                      <label className="text-sm font-bold text-[#092B5A] block mb-1">
                        Acceptez-vous la colocation ?
                      </label>
                      <div className="flex gap-4 mt-2">
                        <label className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 cursor-pointer transition-all ${
                          acceptsColocation 
                            ? "border-[#1463FF] bg-[#1463FF]/5 text-[#1463FF] font-bold" 
                            : "border-slate-200 bg-white text-slate-600"
                        }`}>
                          <input 
                            type="radio" 
                            name="accepts_colocation_toggle" 
                            checked={acceptsColocation} 
                            onChange={() => setAcceptsColocation(true)} 
                            className="sr-only"
                          />
                          <span>Oui</span>
                        </label>
                        <label className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 cursor-pointer transition-all ${
                          !acceptsColocation 
                            ? "border-[#092B5A] bg-[#092B5A]/5 text-[#092B5A] font-bold" 
                            : "border-slate-200 bg-white text-slate-600"
                        }`}>
                          <input 
                            type="radio" 
                            name="accepts_colocation_toggle" 
                            checked={!acceptsColocation} 
                            onChange={() => setAcceptsColocation(false)} 
                            className="sr-only"
                          />
                          <span>Non</span>
                        </label>
                      </div>
                    </div>

                    {acceptsColocation && (
                      <div className="pt-3 border-t border-slate-100 space-y-3 animate-in fade-in duration-200">
                        <label className="text-xs font-bold text-[#092B5A] block mb-1">
                          Les revenus des colocataires peuvent-ils être cumulés ?
                        </label>
                        <div className="flex gap-4">
                          <label className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border cursor-pointer transition-all text-xs ${
                            colocationIncomeCumulative ? "border-[#1463FF] bg-[#1463FF]/5 text-[#1463FF] font-medium" : "border-slate-200 bg-white text-slate-600"
                          }`}>
                            <input 
                              type="radio" 
                              name="colocation_income_toggle" 
                              checked={colocationIncomeCumulative} 
                              onChange={() => setColocationIncomeCumulative(true)} 
                              className="sr-only"
                            />
                            <span>Oui</span>
                          </label>
                          <label className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border cursor-pointer transition-all text-xs ${
                            !colocationIncomeCumulative ? "border-[#092B5A] bg-[#092B5A]/5 text-[#092B5A] font-medium" : "border-slate-200 bg-white text-slate-600"
                          }`}>
                            <input 
                              type="radio" 
                              name="colocation_income_toggle" 
                              checked={!colocationIncomeCumulative} 
                              onChange={() => setColocationIncomeCumulative(false)} 
                              className="sr-only"
                            />
                            <span>Non</span>
                          </label>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          💡 Les revenus des locataires signataires peuvent généralement être cumulés pour analyser la solvabilité.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Champ 5 : Locataire déjà en place */}
                  <div className="space-y-3 bg-white p-5 rounded-2xl border shadow-sm">
                    <div>
                      <label className="text-sm font-bold text-[#092B5A] block mb-1">
                        Locataire déjà en place ?
                      </label>
                      <p className="text-xs text-slate-500 mb-3">
                        Si le candidat réside déjà dans le logement, des justificatifs d'historique de paiement de loyers sont demandés.
                      </p>
                      <select
                        value={tenantAlreadyInPlaceStatus}
                        onChange={(e) => setTenantAlreadyInPlaceStatus(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      >
                        <option value="NEW_TENANT">Non, nouveau locataire</option>
                        <option value="IN_PLACE_LESS_THAN_6_MONTHS">Oui, depuis moins de 6 mois</option>
                        <option value="IN_PLACE_MORE_THAN_6_MONTHS">Oui, depuis plus de 6 mois</option>
                      </select>
                    </div>

                    {tenantAlreadyInPlaceStatus === "IN_PLACE_LESS_THAN_6_MONTHS" && (
                      <div className="p-3 bg-blue-50/50 text-[#092B5A] rounded-xl border border-blue-100 text-xs space-y-1 animate-in fade-in">
                        <span className="font-bold">Pièces supplémentaires exigées :</span>
                        <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                          <li>Attestation de non-sinistralité de l'assureur</li>
                          <li>Décompte des loyers payés depuis l’entrée dans les lieux</li>
                        </ul>
                      </div>
                    )}

                    {tenantAlreadyInPlaceStatus === "IN_PLACE_MORE_THAN_6_MONTHS" && (
                      <div className="p-3 bg-blue-50/50 text-[#092B5A] rounded-xl border border-blue-100 text-xs space-y-1 animate-in fade-in">
                        <span className="font-bold">Pièces supplémentaires exigées :</span>
                        <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                          <li>Décompte des loyers réglés sur les 6 derniers mois</li>
                          <li>Justificatifs bancaires des règlements</li>
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Consignes supplémentaires de documents */}
                  <div className="space-y-2 bg-white p-5 rounded-2xl border shadow-sm">
                    <label className="text-sm font-bold text-[#092B5A] block">
                      Instructions spécifiques de pièces jointes (facultatif)
                    </label>
                    <Textarea 
                      name="customDocumentInstructions" 
                      value={customDocumentInstructions}
                      onChange={(e) => setCustomDocumentInstructions(e.target.value)}
                      placeholder="Ex: Merci de fournir les quittances avec signatures ou QR codes si possible."
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
                      <span className={`font-bold px-2 py-0.5 rounded-full ${gliMode !== "NONE" ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-600'}`}>
                        {gliMode !== "NONE" ? (gliMode === "STRICT" ? "Stricte" : "Indicative") : 'Non activée'}
                      </span>
                    </li>
                    {gliMode !== "NONE" && (
                      <>
                        <li className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                          <span className="text-slate-500 font-medium">Loyer avec charges</span>
                          <span className="font-bold text-[#092B5A]">{rentWithCharges} €/mois</span>
                        </li>
                        <li className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                          <span className="text-slate-500 font-medium">Revenu minimum</span>
                          <span className="font-bold text-[#092B5A]">
                            {gliMonthlyIncomeThreshold ? `${gliMonthlyIncomeThreshold} €/mois` : `${Math.round(rentWithCharges * 3)} €/mois`}
                          </span>
                        </li>
                      </>
                    )}
                    <li className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                      <span className="text-slate-500 font-medium">Garants</span>
                      <span className={`font-bold px-2 py-0.5 rounded-full ${acceptsGuarantors ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {acceptsGuarantors ? 'Acceptés' : 'Refusés'}
                      </span>
                    </li>
                    <li className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                      <span className="text-slate-500 font-medium">Étudiants</span>
                      <span className={`font-bold px-2 py-0.5 rounded-full ${acceptsStudents ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {acceptsStudents ? 'Acceptés' : 'Refusés'}
                      </span>
                    </li>
                    <li className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                      <span className="text-slate-500 font-medium">Colocation</span>
                      <span className={`font-bold px-2 py-0.5 rounded-full ${acceptsColocation ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {acceptsColocation ? 'Acceptée' : 'Refusée'}
                      </span>
                    </li>
                    <li className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                      <span className="text-slate-500 font-medium">Déjà en place ?</span>
                      <span className="font-semibold text-slate-700">
                        {tenantAlreadyInPlaceStatus === "NEW_TENANT" ? "Nouveau" : "Oui"}
                      </span>
                    </li>
                  </ul>
                  
                  {/* Hidden inputs to sync database properties */}
                  <input type="hidden" name="hasGli" value={gliMode !== "NONE" ? "true" : "false"} />
                  <input type="hidden" name="isEligibleGLI" value={gliMode !== "NONE" ? "true" : "false"} />
                  <input type="hidden" name="gliMode" value={gliMode} />
                  <input type="hidden" name="rentWithCharges" value={rentWithCharges} />
                  <input type="hidden" name="gliMonthlyIncomeThreshold" value={gliMonthlyIncomeThreshold || ""} />
                  <input type="hidden" name="minSalaryRequired" value={gliMonthlyIncomeThreshold || ""} />
                  <input type="hidden" name="acceptsStudent" value={acceptsStudents ? "true" : "false"} />
                  <input type="hidden" name="acceptsStudents" value={acceptsStudents ? "true" : "false"} />
                  <input type="hidden" name="studentPolicy" value={acceptsStudents ? "ACCEPTED" : "REFUSED"} />
                  <input type="hidden" name="acceptsGuarantor" value={acceptsGuarantors ? "true" : "false"} />
                  <input type="hidden" name="acceptsGuarantors" value={acceptsGuarantors ? "true" : "false"} />
                  <input type="hidden" name="acceptsColocation" value={acceptsColocation ? "true" : "false"} />
                  <input type="hidden" name="acceptsUnstableProfiles" value={acceptsUnstableProfiles ? "true" : "false"} />
                  <input type="hidden" name="tenantAlreadyInPlaceStatus" value={tenantAlreadyInPlaceStatus} />
                  <input type="hidden" name="customDocumentInstructions" value={customDocumentInstructions || ""} />
                  
                  {/* Kept check fields from previous schema for fallback compatibility */}
                  <input type="hidden" name="requiresCurrentAddressProof" value={requiresCurrentAddressProof ? "true" : "false"} />
                  <input type="hidden" name="requiresEmploymentProof" value={requiresEmploymentProof ? "true" : "false"} />
                  <input type="hidden" name="requiresIncomeProof" value={requiresIncomeProof ? "true" : "false"} />
                  <input type="hidden" name="requiresTaxNotice" value={requiresTaxNotice ? "true" : "false"} />
                  <input type="hidden" name="customInstructions" value={customInstructions || ""} />
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
            <Button type="button" variant="destructive" onClick={() => setIsDeleteModalOpen(true)} disabled={isPending || isUploading}>
              <Trash2 className="w-4 h-4 mr-2" /> Supprimer l'annonce
            </Button>
            <Button type="submit" disabled={isPending || isUploading} className="gap-2">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Enregistrer les modifications
            </Button>
          </div>
        </form>
      </div>

      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[480px] p-6 rounded-2xl">
          <DialogHeader className="text-center space-y-3">
            <div className="flex justify-center mb-2">
              <img
                src="/delete_warning.png"
                alt="Alerte Suppression"
                className="w-[200px] h-auto object-contain rounded-xl shadow-md border border-slate-100"
              />
            </div>
            <DialogTitle className="text-2xl font-extrabold text-[#092B5A] tracking-tight">
              Supprimer définitivement ?
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-sm leading-relaxed">
              Vous êtes sur le point de supprimer cette annonce immobilière.
            </DialogDescription>
          </DialogHeader>

          <div className="my-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl">
            <div className="flex gap-3">
              <div className="space-y-1">
                <p className="text-xs font-bold text-red-800 uppercase tracking-wider">Opération irrévocable</p>
                <p className="text-xs text-red-700 leading-relaxed font-medium">
                  Cette action supprimera également <strong>toutes les candidatures</strong> associées à ce logement ainsi que <strong>tous les documents et pièces justificatives</strong> déposés par les candidats.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              className="w-full sm:w-1/2 h-11 rounded-xl font-semibold border-slate-200 text-slate-600 hover:bg-slate-50"
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              className="w-full sm:w-1/2 h-11 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2"
              disabled={isPending}
            >
              {isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Suppression...</>
              ) : (
                <><Trash2 className="w-4 h-4" /> Supprimer</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
