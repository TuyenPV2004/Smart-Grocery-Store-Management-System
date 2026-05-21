import React, { useState, useEffect } from "react";
import { X, Upload, Trash2, Image as ImageIcon } from "lucide-react";
import { IoImages } from "react-icons/io5";
import Swal from "sweetalert2";
import productService from "../services/productService";
import { getImageUrl } from "../utils/imageUrl";

const ProductImageModal = ({ isOpen, onClose, product, onUpdate }) => {
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (isOpen && product) {
      fetchImages();
    }
  }, [isOpen, product]);

  const fetchImages = async () => {
    try {
      const res = await productService.get(product.id);
      setImages(res.data.images || []);
    } catch {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load product images",
        confirmButtonColor: "#3085d6",
      });
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          icon: "warning",
          title: "Warning",
          text: "Image size cannot exceed 5MB",
          confirmButtonColor: "#f8bb86",
        });
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      await productService.uploadImage(product.id, selectedFile);
      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Image uploaded successfully",
        timer: 1500,
        showConfirmButton: false,
      });
      setSelectedFile(null);
      setPreviewUrl(null);
      fetchImages();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Upload error:", error);
      Swal.fire({
        icon: "error",
        title: "Upload Error",
        text: error.response?.data || error.message || "Failed to upload image",
        confirmButtonColor: "#3085d6",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId) => {
    const result = await Swal.fire({
      title: "Confirm Delete?",
      text: "Are you sure you want to delete this image?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      await productService.deleteImage(product.id, imageId);
      Swal.fire({
        icon: "success",
        title: "Deleted",
        text: "Image deleted successfully",
        timer: 1500,
        showConfirmButton: false,
      });
      fetchImages();
      if (onUpdate) onUpdate();
    } catch {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to delete image",
        confirmButtonColor: "#3085d6",
      });
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-slate-200 animate-in zoom-in duration-200 overflow-hidden">
        {/* Header */}
        <div className="relative flex justify-center items-center p-6 sm:p-8 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <IoImages className="text-purple-600 shrink-0" size={26} />
            <h2 className="text-xl sm:text-2xl font-medium text-slate-900 leading-none">
              Product Image Management
            </h2>
          </div>
          <button
            onClick={onClose}
            className="absolute right-8 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X size={24} strokeWidth={2.5} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar bg-slate-50/50">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Upload Section */}
            <div className="lg:col-span-1 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-6 bg-slate-900 rounded-full"></div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Add New Image
                </h3>
              </div>

              <div className="bg-[#DFEBDF] border border-[#DFEBDF]/50 rounded-2xl p-4 shadow-sm">
                <div
                  className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-purple-400 hover:bg-purple-50 transition-colors cursor-pointer group relative"
                  onClick={() =>
                    document.getElementById("image-upload").click()
                  }
                >
                  {previewUrl ? (
                    <div className="relative aspect-square w-full">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-full object-contain rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          Change Image
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 py-4">
                      <div className="p-3 bg-slate-100 rounded-full group-hover:bg-white transition-colors">
                        <Upload
                          size={24}
                          className="text-slate-400 group-hover:text-purple-600"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700">
                          Click to select image
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          PNG, JPG, GIF up to 5MB
                        </p>
                      </div>
                    </div>
                  )}
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>

                {selectedFile && (
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm shadow-purple-200"
                  >
                    {uploading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Upload size={18} />
                        Confirm Upload
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Gallery Section */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-6 bg-slate-900 rounded-full"></div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Image List ({images.length})
                </h3>
              </div>

              <div className="bg-[#DFEBDF] border border-[#DFEBDF]/50 rounded-2xl p-6 shadow-sm min-h-[300px]">
                {images.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                    <ImageIcon
                      size={48}
                      strokeWidth={1}
                      className="mb-4 opacity-50"
                    />
                    <p className="text-[15px] font-medium text-slate-600">
                      No images yet
                    </p>
                    <p className="text-sm mt-1">
                      Upload images using the panel on the left
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {images.map((image) => (
                      <div
                        key={image.id}
                        className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50"
                      >
                        <img
                          src={getImageUrl(image.imageUrl)}
                          alt="Product"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                          <button
                            onClick={() => handleDelete(image.id)}
                            className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-lg transform hover:scale-105 transition-all"
                            title="Delete this image"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductImageModal;
