import cloudinary from "cloudinary";
import path from "path";
import DataURIParser from "datauri/parser.js";
import { getEnv } from "../configs/config.js";

export const getDataUri = (file) => {
  const parser = new DataURIParser();
  const extName = path.extname(file.originalname).toString();
  return parser.format(extName, file.buffer);
};

export const configureCloudinary = async () => {
  try {
    cloudinary.v2.config({
      cloud_name: getEnv("CLOUDINARY_CLIENT_NAME"),
      api_key: getEnv("CLOUDINARY_CLIENT_KEY"),
      api_secret: getEnv("CLOUDINARY_CLIENT_SECRET"),
    });
    console.log("Cloudinary configured successfully");
  } catch (error) {
    console.error("Error configuring Cloudinary:", error);
  }
};

// UPLOAD FILE ON CLOUDINARY
// =========================
export const uploadOnCloudinary = async (image, subFolder) => {
  try {
    const fileUrl = await getDataUri(image);
    let response = false;
    if (fileUrl?.content) {
      response = await cloudinary.v2.uploader.upload(fileUrl.content, {
        resource_type: "image",
        folder: `${getEnv("CLOUDINARY_FOLDER_NAME")}/${subFolder}`,
      });
      console.log(`Image uploaded successfully on cloudinary`);
    }
    return response;
  } catch (error) {
    console.error("Error occurred while uploading file on Cloudinary", error);
    return null;
  }
};

// REMOVE FILE FROM CLOUDINARY
// ===========================
export const removeFromCloudinary = async (fileName, resourceType = "image") => {
  try {
    const response = await cloudinary.v2.uploader.destroy(fileName, {
      resource_type: resourceType,
    });
    console.log(`Image deleted successfully from cloudinary`);
    return response;
  } catch (error) {
    console.error("Error occurred while removing file from Cloudinary", error);
    return null;
  }
};
