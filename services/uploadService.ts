import { resizeImage } from "@/utils/imageResize";

/**
 * Uploads data and files to a specified endpoint.
 * @param url The API endpoint URL.
 * @param formData An object containing key-value pairs for the form data.
 * @param files A file or an array of files to upload.
 * @returns The JSON response from the server.
 */
export async function uploadData(
  url: string,
  formData: Record<string, any>,
  files?: File | File[]
) {
  const payload = new FormData();

  // Append regular form data
  Object.entries(formData).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach(v => payload.append(key, v));
      } else {
        payload.append(key, value.toString());
      }
    }
  });

  // Handle files
  if (files) {
    const fileArray = Array.isArray(files) ? files : [files];
    
    for (const file of fileArray) {
      try {
        // Try to resize/compress the image
        const resizedFile = await resizeImage(file);
        payload.append("files", resizedFile, resizedFile.name);
      } catch (resizeError) {
        // If resize fails, use original file
        console.warn("Image resize failed, using original file:", resizeError);
        payload.append("files", file, file.name);
      }
    }
  }

  // Get token from localStorage (consistent with apiFetch)
  const token = typeof window !== 'undefined' 
    ? (localStorage.getItem('access_token') || localStorage.getItem('token')) 
    : null;
  const headers: Record<string, string> = {};
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: "POST",
    body: payload,
    headers: headers
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "อัปโหลดไม่สำเร็จ");
  }

  return res.json();
}
