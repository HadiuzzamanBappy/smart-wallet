import { doc, getDoc, updateDoc, deleteField } from "firebase/firestore";
import { db } from "../config/firebase";
import { encryptData, decryptData } from "../utils/encryption";

/**
 * Save a salary plan to Firestore, encrypting each component individually.
 * It stores the data in a nested 'salary' object for better organization.
 */
export async function saveSalaryPlan(userId, planData, formData, aiAdvice) {
  const ref = doc(db, 'users', userId);
  
  // Encrypt each component individually as requested
  const plan_encrypted = await encryptData(JSON.stringify(planData));
  const form_encrypted = await encryptData(JSON.stringify(formData));
  const aiAdvice_encrypted = await encryptData(aiAdvice || "");

  await updateDoc(ref, {
    salary: {
      plan_encrypted,
      form_encrypted,
      aiAdvice_encrypted,
      updatedAt: new Date().toISOString()
    }
  });
}

/**
 * Get a saved salary plan from Firestore, decrypting the nested data.
 */
export async function getSalaryPlan(userId) {
  const ref = doc(db, 'users', userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const docData = snap.data();
  // Check for the new nested 'salary' structure first
  if (docData.salary && docData.salary.plan_encrypted) {
    try {
      const planStr = await decryptData(docData.salary.plan_encrypted);
      const formStr = await decryptData(docData.salary.form_encrypted);
      const aiAdvice = await decryptData(docData.salary.aiAdvice_encrypted);

      return {
        plan: JSON.parse(planStr),
        form: JSON.parse(formStr),
        aiAdvice: aiAdvice,
        savedAt: docData.salary.updatedAt
      };
    } catch (e) {
      console.error("Failed to decrypt granular salary plan", e);
    }
  }

  // Fallback for legacy 'salaryPlan_encrypted' top-level field
  if (docData.salaryPlan_encrypted) {
    try {
      const decryptedString = await decryptData(docData.salaryPlan_encrypted);
      const payload = JSON.parse(decryptedString);
      return payload;
    } catch (e) {
      console.error("Failed to decrypt legacy salary plan", e);
    }
  }

  return null;
}

/**
 * Delete the saved salary plan.
 */
export async function deleteSalaryPlan(userId) {
  const ref = doc(db, 'users', userId);
  await updateDoc(ref, {
    salary: deleteField(),
    salaryPlan_encrypted: deleteField() // Also clean up legacy field if present
  });
}
