export interface DocumentRequirementDefinition {
  key: string;
  label: string;
  description: string;
  category:
    | "IDENTITY"
    | "DOMICILE"
    | "EMPLOYMENT"
    | "INCOME"
    | "TAX"
    | "GUARANTOR_IDENTITY"
    | "GUARANTOR_DOMICILE"
    | "GUARANTOR_EMPLOYMENT"
    | "GUARANTOR_INCOME"
    | "GUARANTOR_TAX"
    | "OTHER";
  isRequired: boolean;
  isOptional: boolean;
  allowedFileTypes: string[];
  maxFiles: number;
  helperText?: string;
}

export function generateDocumentRequirements(
  property: any,
  candidate: any
): DocumentRequirementDefinition[] {
  const requirements: DocumentRequirementDefinition[] = [];
  const allowedFileTypes = ["application/pdf", "image/jpeg", "image/png"];

  // 1. Pièce d'identité (Toujours demandée)
  requirements.push({
    key: "candidate_identity",
    label: "Pièce d'identité",
    description: "Carte nationale d'identité, passeport, permis de conduire ou titre de séjour en cours de validité.",
    category: "IDENTITY",
    isRequired: true,
    isOptional: false,
    allowedFileTypes,
    maxFiles: 1,
  });

  // 2. Justificatif de domicile actuel
  if (property.requiresCurrentAddressProof !== false) {
    requirements.push({
      key: "candidate_domicile",
      label: "Justificatif de domicile",
      description: "Quittance de loyer de moins de 3 mois, attestation d'hébergement, facture d'énergie ou justificatif équivalent.",
      category: "DOMICILE",
      isRequired: true,
      isOptional: false,
      allowedFileTypes,
      maxFiles: 2,
    });
  }

  // 3. Justificatif de situation professionnelle
  if (property.requiresEmploymentProof !== false) {
    const status = candidate.employmentStatus || "OTHER";

    if (status === "CDI") {
      requirements.push({
        key: "candidate_employment",
        label: "Contrat de travail ou attestation employeur",
        description: "Contrat de travail complet signé ou attestation de l'employeur de moins de 3 mois.",
        category: "EMPLOYMENT",
        isRequired: true,
        isOptional: false,
        allowedFileTypes,
        maxFiles: 1,
      });
    } else if (status === "CDD") {
      requirements.push({
        key: "candidate_employment",
        label: "Contrat de travail",
        description: "Contrat de travail en cours montrant la durée restante et la rémunération.",
        category: "EMPLOYMENT",
        isRequired: true,
        isOptional: false,
        allowedFileTypes,
        maxFiles: 1,
      });
    } else if (status === "PUBLIC_SERVANT") {
      requirements.push({
        key: "candidate_employment",
        label: "Attestation employeur ou arrêté de nomination",
        description: "Arrêté de nomination ou attestation d'appartenance à la fonction publique de moins de 3 mois.",
        category: "EMPLOYMENT",
        isRequired: true,
        isOptional: false,
        allowedFileTypes,
        maxFiles: 1,
      });
    } else if (status === "SELF_EMPLOYED") {
      requirements.push({
        key: "candidate_employment",
        label: "Kbis, avis Sirene ou justificatif d'activité",
        description: "Extrait Kbis de moins de 3 mois, avis de situation Sirene récent ou carte professionnelle.",
        category: "EMPLOYMENT",
        isRequired: true,
        isOptional: false,
        allowedFileTypes,
        maxFiles: 2,
      });
    } else if (status === "STUDENT") {
      requirements.push({
        key: "candidate_student_status",
        label: "Certificat de scolarité ou carte étudiant",
        description: "Certificat de scolarité pour l'année en cours ou carte d'étudiant valide.",
        category: "EMPLOYMENT",
        isRequired: true,
        isOptional: false,
        allowedFileTypes,
        maxFiles: 1,
      });
    } else if (status === "UNEMPLOYED") {
      // isOptional true sauf si le propriétaire l'a rendu obligatoire
      const isReq = property.requiresEmploymentProof === true;
      requirements.push({
        key: "candidate_status_proof",
        label: "Justificatif de situation",
        description: "Attestation France Travail (Pôle Emploi) ou avis de situation récent.",
        category: "EMPLOYMENT",
        isRequired: isReq,
        isOptional: !isReq,
        allowedFileTypes,
        maxFiles: 1,
      });
    } else if (status !== "RETIRED") {
      // OTHER ou autre statut non listé
      requirements.push({
        key: "candidate_status_proof",
        label: "Justificatif de situation professionnelle",
        description: "Tout document récent attestant de votre situation actuelle.",
        category: "EMPLOYMENT",
        isRequired: false,
        isOptional: true,
        allowedFileTypes,
        maxFiles: 1,
      });
    }
  }

  // 4. Justificatifs de revenus
  if (property.requiresIncomeProof !== false) {
    const status = candidate.employmentStatus || "OTHER";

    if (["CDI", "CDD", "PUBLIC_SERVANT"].includes(status)) {
      requirements.push({
        key: "candidate_income_payslips",
        label: "Trois dernières fiches de paie",
        description: "Vos trois derniers bulletins de salaire.",
        category: "INCOME",
        isRequired: true,
        isOptional: false,
        allowedFileTypes,
        maxFiles: 3,
      });
    } else if (status === "SELF_EMPLOYED") {
      requirements.push({
        key: "candidate_income_self_employed",
        label: "Bilan, attestation comptable ou justificatif de revenus",
        description: "Dernier bilan comptable, attestation de revenus de votre comptable ou déclaration de revenus.",
        category: "INCOME",
        isRequired: true,
        isOptional: false,
        allowedFileTypes,
        maxFiles: 2,
      });
    } else if (status === "RETIRED") {
      requirements.push({
        key: "candidate_income_pension",
        label: "Justificatif de pension retraite",
        description: "Dernier bulletin de pension de retraite ou attestation de versement des caisses de retraite.",
        category: "INCOME",
        isRequired: true,
        isOptional: false,
        allowedFileTypes,
        maxFiles: 1,
      });
    } else if (status === "STUDENT") {
      requirements.push({
        key: "candidate_income_student",
        label: "Justificatif de bourse ou revenus éventuels",
        description: "Attestation d'attribution de bourse d'études ou justificatifs de revenus d'activité.",
        category: "INCOME",
        isRequired: false,
        isOptional: true,
        allowedFileTypes,
        maxFiles: 2,
      });
    } else {
      // UNEMPLOYED / OTHER
      requirements.push({
        key: "candidate_income_other",
        label: "Justificatif de ressources éventuelles",
        description: "Attestation de versements d'indemnités France Travail, CAF ou autres ressources.",
        category: "INCOME",
        isRequired: false,
        isOptional: true,
        allowedFileTypes,
        maxFiles: 2,
      });
    }
  }

  // 5. Dernier avis d'imposition
  if (property.requiresTaxNotice !== false) {
    const isStudent = candidate.employmentStatus === "STUDENT";
    requirements.push({
      key: "candidate_tax_notice",
      label: "Dernier avis d'imposition",
      description: "Votre dernier avis d'imposition complet.",
      category: "TAX",
      // Optionnel pour les étudiants car ils sont généralement rattachés fiscalement
      isRequired: !isStudent,
      isOptional: isStudent,
      allowedFileTypes,
      maxFiles: 1,
    });
  }

  // 6. Documents du Garant
  if (property.acceptsGuarantor !== false && candidate.hasGuarantor === true) {
    requirements.push({
      key: "guarantor_identity",
      label: "Pièce d'identité du garant",
      description: "Carte d'identité, passeport ou titre de séjour en cours de validité du garant.",
      category: "GUARANTOR_IDENTITY",
      isRequired: true,
      isOptional: false,
      allowedFileTypes,
      maxFiles: 1,
    });

    if (property.requiresCurrentAddressProof !== false) {
      requirements.push({
        key: "guarantor_domicile",
        label: "Justificatif de domicile du garant",
        description: "Dernière quittance de loyer, facture d'électricité, taxe foncière ou attestation d'hébergement du garant.",
        category: "GUARANTOR_DOMICILE",
        isRequired: true,
        isOptional: false,
        allowedFileTypes,
        maxFiles: 1,
      });
    }

    if (property.requiresEmploymentProof !== false) {
      requirements.push({
        key: "guarantor_employment",
        label: "Justificatif de situation professionnelle du garant",
        description: "Contrat de travail, attestation d'emploi de moins de 3 mois ou Kbis du garant.",
        category: "GUARANTOR_EMPLOYMENT",
        isRequired: true,
        isOptional: false,
        allowedFileTypes,
        maxFiles: 1,
      });
    }

    if (property.requiresIncomeProof !== false) {
      requirements.push({
        key: "guarantor_income",
        label: "Justificatifs de revenus du garant",
        description: "Trois dernières fiches de paie ou derniers justificatifs de ressources du garant.",
        category: "GUARANTOR_INCOME",
        isRequired: true,
        isOptional: false,
        allowedFileTypes,
        maxFiles: 3,
      });
    }

    if (property.requiresTaxNotice !== false) {
      requirements.push({
        key: "guarantor_tax_notice",
        label: "Dernier avis d'imposition du garant",
        description: "Avis d'imposition le plus récent du garant.",
        category: "GUARANTOR_TAX",
        isRequired: true,
        isOptional: false,
        allowedFileTypes,
        maxFiles: 1,
      });
    }
  }

  return requirements;
}
