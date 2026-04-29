import { doc, getDoc, updateDoc, deleteField } from "firebase/firestore";
import { db } from "../config/firebase";
import { encryptData, decryptData } from "../utils/encryption";

/**
 * Save a salary plan to Firestore, encrypting the sensitive data.
 * It stores the plan inside the user's main profile document 
 * to align with existing security rules without requiring a deploy.
 */
export async function saveSalaryPlan(userId, planData, formData, aiAdvice) {
  const ref = doc(db, 'users', userId);
  
  // Package the sensitive payload
  const payload = {
    plan: planData,
    form: formData,
    aiAdvice: aiAdvice,
    savedAt: new Date().toISOString(),
    version: 1,
  };

  // Encrypt the entire payload as a single JSON string
  const encryptedPayload = await encryptData(JSON.stringify(payload));

  await updateDoc(ref, {
    salaryPlan_encrypted: encryptedPayload
  });
}

/**
 * Get a saved salary plan from Firestore, decrypting the data.
 */
export async function getSalaryPlan(userId) {
  const ref = doc(db, 'users', userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const docData = snap.data();
  if (docData.salaryPlan_encrypted) {
    try {
      const decryptedString = await decryptData(docData.salaryPlan_encrypted);
      const payload = JSON.parse(decryptedString);
      return payload;
    } catch (e) {
      console.error("Failed to decrypt salary plan", e);
      return null;
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
    salaryPlan_encrypted: deleteField()
  });
}
