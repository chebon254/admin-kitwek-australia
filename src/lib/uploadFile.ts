export async function uploadFile(file: File, path: string): Promise<string> {
  try {
    // Set file size limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("File size exceeds 5MB limit");
    }

    console.log(`Preparing to upload file: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);
    
    // Implement client-side image compression if it's an image
    if (file.type.startsWith('image/')) {
      file = await compressImage(file);
      console.log(`Compressed image size: ${file.size} bytes`);
    }
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("path", path);

    // Implement retry logic for the fetch request
    const maxAttempts = 3;
    let attempt = 0;
    
    while (attempt < maxAttempts) {
      attempt++;
      console.log(`API request attempt ${attempt} of ${maxAttempts}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout
      
      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          const error = await response.text();
          
          if (attempt >= maxAttempts) {
            throw new Error(error || "Upload failed after multiple attempts");
          }
          
          console.log(`Request failed with status ${response.status}. Retrying...`);
          // Wait before retrying (exponential backoff)
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        const data = await response.json();
        console.log("Upload successful, received URL:", data.url);
        return data.url;
      } catch (error: any) {
        clearTimeout(timeoutId);
        
        if (attempt >= maxAttempts) {
          if (error.name === 'AbortError') {
            throw new Error("Upload request timed out after multiple attempts. Please check your network connection.");
          }
          throw error;
        }
        
        console.log(`Request error: ${error.message}. Retrying...`);
        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error("Failed to upload after multiple attempts");
  } catch (error: any) {
    console.error("Error uploading file:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to upload file");
  }
}

// Helper function to compress images before upload
async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      
      // Calculate new dimensions while maintaining aspect ratio
      let width = img.width;
      let height = img.height;
      const maxDimension = 1200; // Max width or height
      
      if (width > height && width > maxDimension) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else if (height > maxDimension) {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }
      
      // Create canvas and draw resized image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to blob with moderate quality
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Could not create image blob'));
            return;
          }
          
          // Create new file from blob
          const compressedFile = new File(
            [blob], 
            file.name, 
            { type: 'image/jpeg', lastModified: Date.now() }
          );
          
          resolve(compressedFile);
        },
        'image/jpeg',
        0.8 // Quality (0.8 = 80%)
      );
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Error loading image for compression'));
    };
  });
}