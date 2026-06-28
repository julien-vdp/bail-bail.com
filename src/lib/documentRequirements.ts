export interface DocumentRequirementDefinition {
  key: string;
  label: string;
  description: string;
  category: string;
  required: boolean;
  recommended: boolean;
  maxFiles: number;
  helperText?: string;
  appliesTo: "candidate" | "guarantor" | "roommate";
  legalWarning?: string;
}

function getFormattedPastMonth(offset: number): string {
  const months = [
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre"
  ];
  const d = new Date();
  d.setDate(1); // avoid month overflow issues
  d.setMonth(d.getMonth() - offset);
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function generateDocumentRequirements(
  property: any,
  candidate: any
): DocumentRequirementDefinition[] {
  const requirements: DocumentRequirementDefinition[] = [];
  const allowedFileTypes = ["application/pdf", "image/jpeg", "image/png"];

  // 1. Pièce d'identité du candidat (Toujours obligatoire)
  requirements.push({
    key: "candidate_identity",
    label: "Pièce d'identité",
    description: "Carte nationale d'identité, passeport, permis de conduire ou titre de séjour en cours de validité.",
    category: "IDENTITY",
    required: true,
    recommended: false,
    maxFiles: 1,
    appliesTo: "candidate",
  });

  // 2. Justificatif de domicile actuel du candidat
  if (property.requiresCurrentAddressProof !== false) {
    requirements.push({
      key: "candidate_domicile",
      label: "Justificatif de domicile",
      description: "Quittance de loyer de moins de 3 mois, attestation d'hébergement, facture d'énergie ou justificatif équivalent.",
      category: "DOMICILE",
      required: true,
      recommended: false,
      maxFiles: 2,
      appliesTo: "candidate",
    });
  }

  const hasGli = property.hasGli || property.gliMode === "STRICT" || property.gliMode === "INDICATIVE" || false;

  // 3. Justificatifs professionnels et de revenus du candidat
  if (property.requiresEmploymentProof !== false || property.requiresIncomeProof !== false) {
    const status = candidate.employmentStatus || "OTHER";
    
    // CDI HORS PÉRIODE D'ESSAI ou CDI EN MOBILITÉ
    if (status === "CDI" || status === "CDI_MOBILITY") {
      const isProbation = candidate.isInProbationPeriod === true;
      requirements.push({
        key: "candidate_employment",
        label: "Contrat de travail ou attestation employeur de moins d'un mois",
        description: "Contrat de travail complet signé ou attestation récente de l'employeur confirmant la non-période d'essai.",
        category: "EMPLOYMENT",
        required: true,
        recommended: false,
        maxFiles: 1,
        appliesTo: "candidate",
      });

      // Si CDI en mobilité
      if (candidate.isCdiMobility === true) {
        requirements.push({
          key: "candidate_previous_employment_proof",
          label: "Certificat de travail du précédent employeur",
          description: "Justificatif prouvant que vous avez occupé un CDI pendant au moins 2 ans avant ce changement.",
          category: "EMPLOYMENT",
          required: true,
          recommended: false,
          maxFiles: 1,
          appliesTo: "candidate",
        });
      }

      // 3 payslips
      if (property.requiresIncomeProof !== false) {
        for (let i = 1; i <= 3; i++) {
          requirements.push({
            key: `candidate_income_payslip_${i}`,
            label: `Fiche de paie - ${getFormattedPastMonth(i)}`,
            description: `Votre bulletin de salaire pour le mois de ${getFormattedPastMonth(i)}.`,
            category: "INCOME",
            required: true,
            recommended: false,
            maxFiles: 1,
            appliesTo: "candidate",
          });
        }
      }
    } 
    // CDD
    else if (status === "CDD") {
      requirements.push({
        key: "candidate_employment",
        label: "Contrat de travail ou attestation CDD",
        description: "Contrat de travail en cours précisant les dates de début et de fin d'activité.",
        category: "EMPLOYMENT",
        required: true,
        recommended: false,
        maxFiles: 1,
        appliesTo: "candidate",
      });

      if (property.requiresIncomeProof !== false) {
        for (let i = 1; i <= 3; i++) {
          requirements.push({
            key: `candidate_income_payslip_${i}`,
            label: `Fiche de paie - ${getFormattedPastMonth(i)}`,
            description: `Votre bulletin de salaire pour le mois de ${getFormattedPastMonth(i)}.`,
            category: "INCOME",
            required: true,
            recommended: false,
            maxFiles: 1,
            appliesTo: "candidate",
          });
        }
      }
    } 
    // FONCTIONNAIRE
    else if (status === "PUBLIC_SERVANT") {
      requirements.push({
        key: "candidate_employment",
        label: "Attestation employeur ou arrêté de nomination",
        description: "Arrêté de nomination définitive ou attestation d'appartenance à la fonction publique récente.",
        category: "EMPLOYMENT",
        required: true,
        recommended: false,
        maxFiles: 1,
        appliesTo: "candidate",
      });

      if (property.requiresIncomeProof !== false) {
        for (let i = 1; i <= 3; i++) {
          requirements.push({
            key: `candidate_income_payslip_${i}`,
            label: `Fiche de paie - ${getFormattedPastMonth(i)}`,
            description: `Votre bulletin de salaire pour le mois de ${getFormattedPastMonth(i)}.`,
            category: "INCOME",
            required: true,
            recommended: false,
            maxFiles: 1,
            appliesTo: "candidate",
          });
        }
      }
    } 
    // INDÉPENDANT / FREELANCE
    else if (status === "SELF_EMPLOYED") {
      requirements.push({
        key: "candidate_employment",
        label: "Kbis, avis Sirene ou justificatif d'activité",
        description: "Extrait Kbis de moins de 3 mois, avis Sirene ou tout justificatif récent d'activité.",
        category: "EMPLOYMENT",
        required: true,
        recommended: false,
        maxFiles: 2,
        appliesTo: "candidate",
      });

      if (property.requiresIncomeProof !== false) {
        requirements.push({
          key: "candidate_income_self_employed",
          label: "Bilan, attestation comptable ou déclaration",
          description: "Dernier bilan complet ou attestation de revenus signée par votre comptable.",
          category: "INCOME",
          required: true,
          recommended: false,
          maxFiles: 2,
          appliesTo: "candidate",
        });
        
        // Attestation comptable optionnelle/recommandée
        requirements.push({
          key: "candidate_comptable_proof",
          label: "Attestation comptable de revenus",
          description: "Recommandé pour faciliter l'étude de votre solvabilité indépendante.",
          category: "INCOME",
          required: false,
          recommended: true,
          maxFiles: 1,
          appliesTo: "candidate",
        });
      }
    } 
    // ÉTUDIANT / APPRENTI
    else if (status === "STUDENT") {
      requirements.push({
        key: "candidate_student_status",
        label: "Certificat de scolarité ou carte étudiant",
        description: "Justificatif de scolarité pour l'année universitaire ou scolaire en cours.",
        category: "EMPLOYMENT",
        required: true,
        recommended: false,
        maxFiles: 1,
        appliesTo: "candidate",
      });

      // Si Apprenti / Alternant
      if (candidate.isApprentice === true) {
        requirements.push({
          key: "candidate_apprentice_contract",
          label: "Contrat d'apprentissage ou d'alternance",
          description: "Contrat signé décrivant la durée et la rémunération de l'apprentissage.",
          category: "EMPLOYMENT",
          required: true,
          recommended: false,
          maxFiles: 1,
          appliesTo: "candidate",
        });

        if (property.requiresIncomeProof !== false) {
          requirements.push({
            key: "candidate_income_student",
            label: "Bulletins de paie disponibles",
            description: "Dernières fiches de paie d'alternance disponibles.",
            category: "INCOME",
            required: false,
            recommended: true,
            maxFiles: 3,
            appliesTo: "candidate",
          });
        }
      } else {
        // Étudiant classique
        if (property.requiresIncomeProof !== false) {
          requirements.push({
            key: "candidate_income_student",
            label: "Justificatif de bourse ou revenus d'activité",
            description: "Attestation d'attribution de bourse d'études ou justificatifs de revenus d'activité.",
            category: "INCOME",
            required: false,
            recommended: true,
            maxFiles: 2,
            appliesTo: "candidate",
          });
        }
      }
    } 
    // RETRAITÉ
    else if (status === "RETIRED") {
      requirements.push({
        key: "candidate_income_pension",
        label: "Justificatif de pension retraite",
        description: "Dernier bulletin de pension de retraite ou notification d'ouverture des droits.",
        category: "INCOME",
        required: true,
        recommended: false,
        maxFiles: 2,
        appliesTo: "candidate",
      });
    } 
    // AUTRES PROFILS (Chômage, Interim, etc.)
    else {
      const isAcceptedUnstable = property.acceptsUnstableProfiles === true || candidate.isColocation === true;
      requirements.push({
        key: "candidate_status_proof",
        label: "Justificatif de situation (RSA, France Travail...)",
        description: "Dernière notification de droits, attestation de versements ou de situation récente.",
        category: "EMPLOYMENT",
        required: isAcceptedUnstable,
        recommended: !isAcceptedUnstable,
        maxFiles: 2,
        appliesTo: "candidate",
      });

      if (property.requiresIncomeProof !== false) {
        requirements.push({
          key: "candidate_income_other",
          label: "Justificatif de ressources éventuelles",
          description: "Attestations de versements CAF, indemnités de chômage ou autres.",
          category: "INCOME",
          required: false,
          recommended: true,
          maxFiles: 2,
          appliesTo: "candidate",
        });
      }
    }
  }

  // 4. Avis d'imposition du candidat
  if (property.requiresTaxNotice !== false) {
    const isStudent = candidate.employmentStatus === "STUDENT";
    requirements.push({
      key: "candidate_tax_notice",
      label: "Dernier avis d'imposition",
      description: "Votre dernier avis d'imposition complet.",
      category: "TAX",
      required: !isStudent,
      recommended: isStudent,
      maxFiles: 1,
      appliesTo: "candidate",
    });
  }

  // 5. Clauses "Locataire déjà en place"
  if (property.tenantAlreadyInPlaceStatus === "IN_PLACE_LESS_THAN_6_MONTHS") {
    requirements.push({
      key: "candidate_already_in_place_non_sinistralite",
      label: "Attestation de non-sinistralité",
      description: "Attestation de l'assureur ou décompte indiquant l'absence d'impayés de loyer.",
      category: "OTHER",
      required: true,
      recommended: false,
      maxFiles: 1,
      appliesTo: "candidate",
    });
    requirements.push({
      key: "candidate_already_in_place_rents",
      label: "Décompte des loyers payés",
      description: "Décompte des quittances émises et des loyers payés depuis l'entrée dans les lieux.",
      category: "OTHER",
      required: true,
      recommended: false,
      maxFiles: 1,
      appliesTo: "candidate",
    });
  } else if (property.tenantAlreadyInPlaceStatus === "IN_PLACE_MORE_THAN_6_MONTHS") {
    requirements.push({
      key: "candidate_already_in_place_rents_6m",
      label: "Décompte des loyers (6 derniers mois)",
      description: "Décompte de l'historique de paiement des 6 derniers mois.",
      category: "OTHER",
      required: true,
      recommended: false,
      maxFiles: 1,
      appliesTo: "candidate",
    });
    requirements.push({
      key: "candidate_already_in_place_bank",
      label: "Justificatifs bancaires des règlements",
      description: "Extraits ou relevés bancaires prouvant les règlements réguliers des loyers.",
      category: "OTHER",
      required: true,
      recommended: false,
      maxFiles: 1,
      appliesTo: "candidate",
    });
  }

  // 6. Colocataires
  if (candidate.isColocation === true && candidate.roommates && candidate.roommates.length > 0) {
    candidate.roommates.forEach((roommate: any, index: number) => {
      const rid = roommate.id || String(index + 1);
      const prefix = `roommate_${rid}`;

      // Identité colocataire
      requirements.push({
        key: `${prefix}_identity`,
        label: `Pièce d'identité - ${roommate.firstName} ${roommate.lastName}`,
        description: `Pièce d'identité en cours de validité de votre colocataire.`,
        category: "IDENTITY",
        required: true,
        recommended: false,
        maxFiles: 1,
        appliesTo: "roommate",
      });

      // Domicile colocataire
      if (property.requiresCurrentAddressProof !== false) {
        requirements.push({
          key: `${prefix}_domicile`,
          label: `Justificatif de domicile - ${roommate.firstName} ${roommate.lastName}`,
          description: `Justificatif de domicile actuel de votre colocataire.`,
          category: "DOMICILE",
          required: true,
          recommended: false,
          maxFiles: 1,
          appliesTo: "roommate",
        });
      }

      // Situation pro et revenus colocataire
      const rstatus = roommate.employmentStatus || "OTHER";
      if (["CDI", "CDI_MOBILITY", "CDD", "PUBLIC_SERVANT"].includes(rstatus)) {
        requirements.push({
          key: `${prefix}_employment`,
          label: `Justificatif professionnel - ${roommate.firstName}`,
          description: `Contrat de travail ou attestation employeur de ${roommate.firstName}.`,
          category: "EMPLOYMENT",
          required: true,
          recommended: false,
          maxFiles: 1,
          appliesTo: "roommate",
        });
        
        if (property.requiresIncomeProof !== false) {
          for (let i = 1; i <= 3; i++) {
            requirements.push({
              key: `${prefix}_income_payslip_${i}`,
              label: `Fiche de paie (${getFormattedPastMonth(i)}) - ${roommate.firstName}`,
              description: `Bulletin de salaire de ${roommate.firstName} pour ${getFormattedPastMonth(i)}.`,
              category: "INCOME",
              required: true,
              recommended: false,
              maxFiles: 1,
              appliesTo: "roommate",
            });
          }
        }
      } else if (rstatus === "SELF_EMPLOYED") {
        requirements.push({
          key: `${prefix}_employment`,
          label: `Justificatif indépendant (Kbis) - ${roommate.firstName}`,
          description: `Extrait Kbis ou carte professionnelle de ${roommate.firstName}.`,
          category: "EMPLOYMENT",
          required: true,
          recommended: false,
          maxFiles: 1,
          appliesTo: "roommate",
        });
        if (property.requiresIncomeProof !== false) {
          requirements.push({
            key: `${prefix}_income`,
            label: `Justificatifs de revenus - ${roommate.firstName}`,
            description: `Dernier bilan comptable ou déclaration fiscale de ${roommate.firstName}.`,
            category: "INCOME",
            required: true,
            recommended: false,
            maxFiles: 2,
            appliesTo: "roommate",
          });
        }
      } else if (rstatus === "STUDENT") {
        requirements.push({
          key: `${prefix}_student_status`,
          label: `Certificat de scolarité - ${roommate.firstName}`,
          description: `Certificat de scolarité ou carte étudiante de ${roommate.firstName}.`,
          category: "EMPLOYMENT",
          required: true,
          recommended: false,
          maxFiles: 1,
          appliesTo: "roommate",
        });
      } else {
        requirements.push({
          key: `${prefix}_status_proof`,
          label: `Justificatif de situation - ${roommate.firstName}`,
          description: `Attestation CAF, RSA ou France Travail de ${roommate.firstName}.`,
          category: "EMPLOYMENT",
          required: false,
          recommended: true,
          maxFiles: 1,
          appliesTo: "roommate",
        });
      }

      // Impôts colocataire
      if (property.requiresTaxNotice !== false) {
        requirements.push({
          key: `${prefix}_tax_notice`,
          label: `Dernier avis d'imposition - ${roommate.firstName}`,
          description: `Dernier avis d'imposition complet de ${roommate.firstName}.`,
          category: "TAX",
          required: rstatus !== "STUDENT",
          recommended: rstatus === "STUDENT",
          maxFiles: 1,
          appliesTo: "roommate",
        });
      }
    });
  }

  // 7. Garant
  if (property.acceptsGuarantors !== false && candidate.hasGuarantor === true && candidate.guarantor) {
    const guarantor = candidate.guarantor;

    // Pièce d'identité garant
    requirements.push({
      key: "guarantor_identity",
      label: "Pièce d'identité du garant",
      description: "Carte d'identité, passeport ou titre de séjour en cours de validité du garant.",
      category: "GUARANTOR_IDENTITY",
      required: true,
      recommended: false,
      maxFiles: 1,
      appliesTo: "guarantor",
    });

    // Domicile garant
    if (property.requiresCurrentAddressProof !== false) {
      requirements.push({
        key: "guarantor_domicile",
        label: "Justificatif de domicile du garant",
        description: "Dernière quittance de loyer, taxe foncière ou facture d'énergie du garant.",
        category: "GUARANTOR_DOMICILE",
        required: true,
        recommended: false,
        maxFiles: 1,
        appliesTo: "guarantor",
      });
    }

    // Situation pro garant
    if (property.requiresEmploymentProof !== false) {
      requirements.push({
        key: "guarantor_employment",
        label: "Situation professionnelle du garant",
        description: "Contrat de travail, arrêté de nomination ou extrait Kbis récent du garant.",
        category: "GUARANTOR_EMPLOYMENT",
        required: true,
        recommended: false,
        maxFiles: 1,
        appliesTo: "guarantor",
      });
    }

    // Revenus garant
    if (property.requiresIncomeProof !== false) {
      const gstatus = guarantor.employmentStatus || "OTHER";
      if (["CDI", "CDI_MOBILITY", "CDD", "PUBLIC_SERVANT"].includes(gstatus)) {
        for (let i = 1; i <= 3; i++) {
          requirements.push({
            key: `guarantor_income_payslip_${i}`,
            label: `Fiche de paie garant - ${getFormattedPastMonth(i)}`,
            description: `Bulletin de salaire du garant pour le mois de ${getFormattedPastMonth(i)}.`,
            category: "GUARANTOR_INCOME",
            required: true,
            recommended: false,
            maxFiles: 1,
            appliesTo: "guarantor",
          });
        }
      } else {
        requirements.push({
          key: "guarantor_income",
          label: "Justificatifs de ressources du garant",
          description: "Dernier bilan comptable, attestation de pension de retraite ou de ressources du garant.",
          category: "GUARANTOR_INCOME",
          required: true,
          recommended: false,
          maxFiles: 2,
          appliesTo: "guarantor",
        });
      }
    }

    // Avis d'imposition garant
    if (property.requiresTaxNotice !== false) {
      requirements.push({
        key: "guarantor_tax_notice",
        label: "Dernier avis d'imposition du garant",
        description: "Avis d'imposition le plus récent du garant.",
        category: "GUARANTOR_TAX",
        required: true,
        recommended: false,
        maxFiles: 1,
        appliesTo: "guarantor",
      });
    }
  }

  return requirements;
}

export async function syncDocumentRequirements(
  applicationId: string,
  property: any,
  candidate: any
) {
  const { prisma } = await import("@/lib/prisma");

  const reqDefs = generateDocumentRequirements(property, candidate);
  const currentReqKeys = reqDefs.map(r => r.key);

  // Rendre null requirementId pour les documents dont l'exigence va disparaître
  await prisma.document.updateMany({
    where: {
      applicationId,
      requirement: {
        key: { notIn: currentReqKeys }
      }
    },
    data: { requirementId: null }
  });

  // Supprimer les exigences devenues obsolètes
  await prisma.documentRequirement.deleteMany({
    where: {
      applicationId,
      key: { notIn: currentReqKeys }
    }
  });

  // Insérer / Mettre à jour les exigences actuelles
  for (const def of reqDefs) {
    const existing = await prisma.documentRequirement.findFirst({
      where: { applicationId, key: def.key }
    });

    if (existing) {
      await prisma.documentRequirement.update({
        where: { id: existing.id },
        data: {
          label: def.label,
          description: def.description,
          category: def.category,
          required: def.required,
          recommended: def.recommended,
          appliesTo: def.appliesTo,
          maxFiles: def.maxFiles,
        }
      });
    } else {
      await prisma.documentRequirement.create({
        data: {
          applicationId,
          key: def.key,
          label: def.label,
          description: def.description,
          category: def.category,
          required: def.required,
          recommended: def.recommended,
          appliesTo: def.appliesTo,
          maxFiles: def.maxFiles,
          status: "PENDING"
        }
      });
    }
  }

  // Réassocier les documents existants par rapport aux nouvelles exigences en DB
  const allRequirements = await prisma.documentRequirement.findMany({
    where: { applicationId }
  });
  const allDocuments = await prisma.document.findMany({
    where: { applicationId }
  });

  for (const doc of allDocuments) {
    const req = allRequirements.find(r => {
      // 1. Match by exact key if type holds the requirement key
      if (r.key === doc.type) return true;

      // 2. Fallbacks for category matching, strictly scoped:
      const docTypeLower = doc.type.toLowerCase();
      
      // Candidate scope
      if (r.appliesTo === "candidate") {
        if (r.key === "candidate_identity" && doc.type === "IDENTITY") return true;
        if (r.key === "candidate_domicile" && doc.type === "DOMICILE") return true;
        if (r.key.includes("income") && doc.type === "INCOME" && !docTypeLower.includes("roommate") && !docTypeLower.includes("guarantor")) return true;
        if (r.key.includes("employment") && doc.type === "EMPLOYMENT" && !docTypeLower.includes("roommate") && !docTypeLower.includes("guarantor")) return true;
        if (r.key.includes("tax") && doc.type === "TAX" && !docTypeLower.includes("roommate") && !docTypeLower.includes("guarantor")) return true;
      }
      // Roommate scope
      if (r.appliesTo === "roommate") {
        const rPrefix = r.key.split('_').slice(0, 2).join('_'); // e.g. "roommate_1"
        if (doc.type.startsWith(rPrefix)) {
          if (r.key.includes("identity") && doc.type.includes("identity")) return true;
          if (r.key.includes("domicile") && doc.type.includes("domicile")) return true;
          if (r.key.includes("income") && doc.type.includes("income")) return true;
          if (r.key.includes("employment") && doc.type.includes("employment")) return true;
          if (r.key.includes("tax") && doc.type.includes("tax")) return true;
        }
      }
      // Guarantor scope
      if (r.appliesTo === "guarantor") {
        if (r.key === "guarantor_identity" && doc.type === "GUARANTOR_IDENTITY") return true;
        if (r.key === "guarantor_domicile" && doc.type === "GUARANTOR_DOMICILE") return true;
        if (r.key.includes("income") && doc.type === "GUARANTOR_INCOME") return true;
        if (r.key.includes("employment") && doc.type === "GUARANTOR_EMPLOYMENT") return true;
        if (r.key.includes("tax") && doc.type === "GUARANTOR_TAX") return true;
      }
      return false;
    });
    if (req && doc.requirementId !== req.id) {
      await prisma.document.update({
        where: { id: doc.id },
        data: { requirementId: req.id }
      });
    }
  }
}
