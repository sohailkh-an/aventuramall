import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadImage = async (base64Image: string, folder: string) => {
  try {
    const result = await cloudinary.uploader.upload(base64Image, {
      folder: `tiktokshopstore/${folder}`,
      resource_type: 'image',
    });
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image');
  }
};

export const uploadFile = async (base64File: string, folder: string) => {
  try {
    const result = await cloudinary.uploader.upload(base64File, {
      folder: `tiktokshopstore/${folder}`,
      resource_type: 'auto',
    });
    return { url: result.secure_url, publicId: result.public_id };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload file');
  }
};

export const deleteFile = async (publicId: string, resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto') => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error) {
    console.error('Cloudinary delete error:', error);
  }
};

export default cloudinary;
