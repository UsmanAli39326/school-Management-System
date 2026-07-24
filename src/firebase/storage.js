import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './config';

/**
 * Upload a file to Firebase Storage
 * @param {File} file - The file to upload
 * @param {string} path - The full path in storage (e.g., 'students/schoolId/studentId/photo.jpg')
 * @returns {Promise<string>} - The download URL of the uploaded file
 */
export async function uploadFile(file, path) {
  if (!file) return null;
  
  const storageRef = ref(storage, path);
  
  try {
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

/**
 * Delete a file from Firebase Storage given its path
 * @param {string} path - The full path to the file
 */
export async function deleteFile(path) {
  if (!path) return;
  
  const storageRef = ref(storage, path);
  try {
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}

/**
 * Generate a safe unique filename to avoid overwrites
 */
export function generateUniqueFileName(originalName) {
  const extension = originalName.split('.').pop();
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${extension}`;
}
