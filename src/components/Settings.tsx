import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function Settings() {
  const settings = useQuery(api.settings.get);
  const updateSettings = useMutation(api.settings.update);
  const generateUploadUrl = useMutation(api.settings.generateUploadUrl);

  const [formData, setFormData] = useState({
    businessName: "",
    businessAddress: "",
    businessPhone: "",
  });
  const [qrImage, setQrImage] = useState<File | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update form data when settings load
  useEffect(() => {
    if (settings) {
      setFormData({
        businessName: settings.businessName || "",
        businessAddress: settings.businessAddress || "",
        businessPhone: settings.businessPhone || "",
      });
    }
  }, [settings]);

  // Get QR image URL
  const qrImageUrl = useQuery(
    api.settings.getQrImageUrl,
    settings?.qrImageId ? { storageId: settings.qrImageId } : "skip"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let qrImageId = settings?.qrImageId;

      // Upload QR image if selected
      if (qrImage) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": qrImage.type },
          body: qrImage,
        });

        if (!result.ok) {
          throw new Error("Failed to upload QR image");
        }

        const { storageId } = await result.json();
        qrImageId = storageId;
      }

      await updateSettings({
        ...formData,
        qrImageId: qrImageId || undefined,
      });

      toast.success("Pengaturan berhasil disimpan");
      setQrImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      toast.error("Gagal menyimpan pengaturan");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("Ukuran file maksimal 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("File harus berupa gambar");
        return;
      }
      setQrImage(file);
    }
  };

  if (!settings) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Pengaturan</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-6">Informasi Bisnis</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Nama Bisnis</label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Masukkan nama bisnis"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Nomor Telepon</label>
              <input
                type="tel"
                value={formData.businessPhone}
                onChange={(e) => setFormData({ ...formData, businessPhone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Masukkan nomor telepon"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Alamat Bisnis</label>
            <textarea
              value={formData.businessAddress}
              onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Masukkan alamat lengkap bisnis"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">QR Code Pembayaran</label>
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-500">
                Upload QR code untuk pembayaran digital (maksimal 5MB)
              </p>
              
              {(qrImageUrl || qrImage) && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Preview QR Code:</p>
                  <div className="w-32 h-32 border border-gray-300 rounded-md overflow-hidden">
                    {qrImage ? (
                      <img
                        src={URL.createObjectURL(qrImage)}
                        alt="QR Code Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : qrImageUrl ? (
                      <img
                        src={qrImageUrl}
                        alt="Current QR Code"
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Menyimpan..." : "Simpan Pengaturan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
