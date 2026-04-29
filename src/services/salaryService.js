import { doc, setDoc, getDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";
import { encryptData, decryptData } from "../utils/encryption";

const COLLECTION = "salaryPlans";

/**
 * Save a salary plan to Firestore, encrypting the sensitive data.
 */
export async function saveSalaryPlan(userId, planData, formData, aiAdvice) {
  const ref = doc(db, COLLECTION, userId);
  
  // Package the sensitive payload
  const payload = {
    plan: planData,
    form: formData,
    aiAdvice: aiAdvice
  };

  // Encrypt the entire payload as a single JSON string
  const encryptedPayload = await encryptData(JSON.stringify(payload));

  await setDoc(ref, {
    data_encrypted: encryptedPayload,
    savedAt: serverTimestamp(),
    version: 1,
  });
}

/**
 * Get a saved salary plan from Firestore, decrypting the data.
 */
export async function getSalaryPlan(userId) {
  const ref = doc(db, COLLECTION, userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const docData = snap.data();
  if (docData.data_encrypted) {
    try {
      const decryptedString = await decryptData(docData.data_encrypted);
      const payload = JSON.parse(decryptedString);
      return {
        ...payload,
        savedAt: docData.savedAt,
        version: docData.version
      };
    } catch (e) {
      console.error("Failed to decrypt salary plan", e);
      return null;
    }
  }

  // Fallback for unencrypted legacy data if it exists
  return {
    plan: docData.plan,
    form: docData.form,
    aiAdvice: docData.aiAdvice,
    savedAt: docData.savedAt,
    version: docData.version
  };
}

/**
 * Delete the saved salary plan.
 */
export async function deleteSalaryPlan(userId) {
  const ref = doc(db, COLLECTION, userId);
  await deleteDoc(ref);
}
