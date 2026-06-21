import { generateDocumentRequirements } from "../src/lib/documentRequirements";

// Helper to check requirement presence and required-ness
function check(reqs: any[], key: string, expectedRequired: boolean | null = null): { found: boolean; status: string } {
  const found = reqs.find(r => r.key === key);
  if (!found) {
    return { found: false, status: "MISSING" };
  }
  if (expectedRequired !== null && found.required !== expectedRequired) {
    return { found: true, status: `FOUND BUT required is ${found.required} (expected ${expectedRequired})` };
  }
  return { found: true, status: "OK" };
}

const defaultProperty = {
  rent: 1000,
  rentWithCharges: 1000,
  hasGli: false,
  gliMode: "NONE",
  acceptsGuarantors: true,
  acceptsStudents: true,
  acceptsColocation: false,
  acceptsUnstableProfiles: false,
  requiresTaxNotice: true,
  requiresCurrentAddressProof: true,
  requiresEmploymentProof: true,
  requiresIncomeProof: true,
  tenantAlreadyInPlaceStatus: "NEW_TENANT",
};

const defaultCandidate = {
  employmentStatus: "CDI",
  hasGuarantor: false,
  declaredMonthlyIncome: 3500,
  isInProbationPeriod: false,
  isCdiMobility: false,
  isApprentice: false,
  isColocation: false,
  roommates: [],
  guarantor: null,
};

let allPassed = true;

console.log("=== EXECUTION DES TESTS DES 10 SCENARIOS GLI ===");

// 1. GLI Oui, CDI hors période d'essai, revenu OK.
{
  const p = { ...defaultProperty, gliMode: "STRICT", rentWithCharges: 1000 };
  const c = { ...defaultCandidate, employmentStatus: "CDI", declaredMonthlyIncome: 3500 };
  const reqs = generateDocumentRequirements(p, c);
  
  const cIdentity = check(reqs, "candidate_identity", true);
  const cDomicile = check(reqs, "candidate_domicile", true);
  const cEmployment = check(reqs, "candidate_employment", true);
  const cPayslip1 = check(reqs, "candidate_income_payslip_1", true);
  const cTax = check(reqs, "candidate_tax_notice", true);
  const hasGuarantorDocs = reqs.some(r => r.key.startsWith("guarantor"));

  const passed = cIdentity.status === "OK" && 
                 cDomicile.status === "OK" && 
                 cEmployment.status === "OK" && 
                 cPayslip1.status === "OK" && 
                 cTax.status === "OK" && 
                 !hasGuarantorDocs;
  
  console.log(`[TEST 1] GLI Oui, CDI hors période d'essai, revenu OK : ${passed ? "PASS" : "FAIL"}`);
  if (!passed) {
    allPassed = false;
    console.log("  Details:", { cIdentity, cDomicile, cEmployment, cPayslip1, cTax, hasGuarantorDocs });
  }
}

// 2. GLI Oui, CDI en période d'essai.
{
  const p = { ...defaultProperty, gliMode: "STRICT", rentWithCharges: 1000 };
  const c = { ...defaultCandidate, employmentStatus: "CDI", isInProbationPeriod: true };
  const reqs = generateDocumentRequirements(p, c);

  // Even in probation, candidate CDI docs must be generated.
  const cEmployment = check(reqs, "candidate_employment", true);
  const cPayslip1 = check(reqs, "candidate_income_payslip_1", true);

  const passed = cEmployment.status === "OK" && cPayslip1.status === "OK";
  console.log(`[TEST 2] GLI Oui, CDI en période d'essai : ${passed ? "PASS" : "FAIL"}`);
  if (!passed) {
    allPassed = false;
    console.log("  Details:", { cEmployment, cPayslip1 });
  }
}

// 3. GLI Oui, CDD moins de 12 mois.
{
  const p = { ...defaultProperty, gliMode: "STRICT", rentWithCharges: 1000 };
  const c = { ...defaultCandidate, employmentStatus: "CDD", cddRemainingMonths: 6 };
  const reqs = generateDocumentRequirements(p, c);

  const cEmployment = check(reqs, "candidate_employment", true);
  const cPayslip1 = check(reqs, "candidate_income_payslip_1", true);

  const passed = cEmployment.status === "OK" && cPayslip1.status === "OK";
  console.log(`[TEST 3] GLI Oui, CDD moins de 12 mois : ${passed ? "PASS" : "FAIL"}`);
  if (!passed) {
    allPassed = false;
    console.log("  Details:", { cEmployment, cPayslip1 });
  }
}

// 4. GLI Oui, étudiant avec caution.
{
  const p = { ...defaultProperty, gliMode: "STRICT", rentWithCharges: 1000, acceptsGuarantors: true };
  const c = { 
    ...defaultCandidate, 
    employmentStatus: "STUDENT", 
    hasGuarantor: true,
    guarantor: { employmentStatus: "CDI" }
  };
  const reqs = generateDocumentRequirements(p, c);

  const cStudent = check(reqs, "candidate_student_status", true);
  const gIdentity = check(reqs, "guarantor_identity", true);
  const gEmployment = check(reqs, "guarantor_employment", true);
  const gPayslip1 = check(reqs, "guarantor_income_payslip_1", true);

  const passed = cStudent.status === "OK" && gIdentity.status === "OK" && gEmployment.status === "OK" && gPayslip1.status === "OK";
  console.log(`[TEST 4] GLI Oui, étudiant avec caution : ${passed ? "PASS" : "FAIL"}`);
  if (!passed) {
    allPassed = false;
    console.log("  Details:", { cStudent, gIdentity, gEmployment, gPayslip1 });
  }
}

// 5. GLI Oui, étudiant sans caution.
{
  const p = { ...defaultProperty, gliMode: "STRICT", rentWithCharges: 1000 };
  const c = { 
    ...defaultCandidate, 
    employmentStatus: "STUDENT", 
    hasGuarantor: false,
    guarantor: null
  };
  const reqs = generateDocumentRequirements(p, c);

  const cStudent = check(reqs, "candidate_student_status", true);
  const hasGuarantorDocs = reqs.some(r => r.key.startsWith("guarantor"));

  const passed = cStudent.status === "OK" && !hasGuarantorDocs;
  console.log(`[TEST 5] GLI Oui, étudiant sans caution : ${passed ? "PASS" : "FAIL"}`);
  if (!passed) {
    allPassed = false;
    console.log("  Details:", { cStudent, hasGuarantorDocs });
  }
}

// 6. GLI Oui, indépendant moins de 2 ans.
{
  const p = { ...defaultProperty, gliMode: "STRICT", rentWithCharges: 1000 };
  const c = { 
    ...defaultCandidate, 
    employmentStatus: "SELF_EMPLOYED", 
    selfEmployedYears: 1
  };
  const reqs = generateDocumentRequirements(p, c);

  const cEmployment = check(reqs, "candidate_employment", true); // Kbis
  const cIncome = check(reqs, "candidate_income_self_employed", true); // Bilan/attestation

  const passed = cEmployment.status === "OK" && cIncome.status === "OK";
  console.log(`[TEST 6] GLI Oui, indépendant moins de 2 ans : ${passed ? "PASS" : "FAIL"}`);
  if (!passed) {
    allPassed = false;
    console.log("  Details:", { cEmployment, cIncome });
  }
}

// 7. GLI Non, garant accepté.
{
  const p = { ...defaultProperty, gliMode: "NONE", acceptsGuarantors: true };
  const c = { 
    ...defaultCandidate, 
    employmentStatus: "CDI", 
    hasGuarantor: true,
    guarantor: { employmentStatus: "CDI" }
  };
  const reqs = generateDocumentRequirements(p, c);

  const cEmployment = check(reqs, "candidate_employment", true);
  const gIdentity = check(reqs, "guarantor_identity", true);
  const gEmployment = check(reqs, "guarantor_employment", true);

  const passed = cEmployment.status === "OK" && gIdentity.status === "OK" && gEmployment.status === "OK";
  console.log(`[TEST 7] GLI Non, garant accepté : ${passed ? "PASS" : "FAIL"}`);
  if (!passed) {
    allPassed = false;
    console.log("  Details:", { cEmployment, gIdentity, gEmployment });
  }
}

// 8. Colocation avec un CDI et un demandeur d'emploi.
{
  const p = { ...defaultProperty, acceptsColocation: true };
  const c = { 
    ...defaultCandidate, 
    employmentStatus: "CDI", 
    isColocation: true,
    roommates: [
      { id: "rm1", firstName: "Jane", lastName: "Doe", employmentStatus: "UNEMPLOYED", declaredMonthlyIncome: 800 }
    ]
  };
  const reqs = generateDocumentRequirements(p, c);

  const cEmployment = check(reqs, "candidate_employment", true);
  const rIdentity = check(reqs, "roommate_rm1_identity", true);
  const rStatus = check(reqs, "roommate_rm1_status_proof", false); // Unemployed is not CDI/CDD/etc., should be recommended: true, required: false (per lines 452-463)

  const passed = cEmployment.status === "OK" && rIdentity.status === "OK" && rStatus.status === "OK";
  console.log(`[TEST 8] Colocation avec un CDI et un demandeur d'emploi : ${passed ? "PASS" : "FAIL"}`);
  if (!passed) {
    allPassed = false;
    console.log("  Details:", { cEmployment, rIdentity, rStatus });
  }
}

// 9. Retraité seul avec reste à vivre suffisant.
{
  const p = { ...defaultProperty, gliMode: "STRICT", rentWithCharges: 1000 };
  const c = { 
    ...defaultCandidate, 
    employmentStatus: "RETIRED", 
    declaredMonthlyIncome: 3000
  };
  const reqs = generateDocumentRequirements(p, c);

  const cPension = check(reqs, "candidate_income_pension", true);
  const cTax = check(reqs, "candidate_tax_notice", true);

  const passed = cPension.status === "OK" && cTax.status === "OK";
  console.log(`[TEST 9] Retraité seul avec reste à vivre suffisant : ${passed ? "PASS" : "FAIL"}`);
  if (!passed) {
    allPassed = false;
    console.log("  Details:", { cPension, cTax });
  }
}

// 10. Locataire déjà en place depuis plus de 6 mois.
{
  const p = { 
    ...defaultProperty, 
    tenantAlreadyInPlaceStatus: "IN_PLACE_MORE_THAN_6_MONTHS"
  };
  const c = { ...defaultCandidate, employmentStatus: "CDI" };
  const reqs = generateDocumentRequirements(p, c);

  const cHistory = check(reqs, "candidate_already_in_place_rents_6m", true);
  const cBank = check(reqs, "candidate_already_in_place_bank", true);

  const passed = cHistory.status === "OK" && cBank.status === "OK";
  console.log(`[TEST 10] Locataire déjà en place depuis plus de 6 mois : ${passed ? "PASS" : "FAIL"}`);
  if (!passed) {
    allPassed = false;
    console.log("  Details:", { cHistory, cBank });
  }
}

if (allPassed) {
  console.log("\n>>> TOUS LES TESTS SONT AU VERT ! <<<");
  process.exit(0);
} else {
  console.error("\n>>> CERTAINS TESTS ONT ECHOUÉ. <<<");
  process.exit(1);
}
