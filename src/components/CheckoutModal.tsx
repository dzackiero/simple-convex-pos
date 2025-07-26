import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface CartItem {
  productId: Id<"products">;
  name: string;
  price: number;
  quantity: number;
  stock: number;
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  total: number;
  paymentMethod: string;
  customerName: string;
  onConfirm: () => void;
  isProcessing: boolean;
  isCompleted: boolean;
}

export function CheckoutModal({
  isOpen,
  onClose,
  cart,
  total,
  paymentMethod,
  customerName,
  onConfirm,
  isProcessing,
  isCompleted,
}: CheckoutModalProps) {
  const settings = useQuery(api.settings.get);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);

  // Get QR image URL
  const qrImageUrlFromQuery = useQuery(
    api.settings.getQrImageUrl,
    settings?.qrImageId ? { storageId: settings.qrImageId } : "skip"
  );

  // Update local state when query result changes
  useEffect(() => {
    if (qrImageUrlFromQuery) {
      setQrImageUrl(qrImageUrlFromQuery);
    }
  }, [qrImageUrlFromQuery]);

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = () => {
    return new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const paymentMethodLabels = {
    cash: "Tunai",
    card: "Kartu",
    transfer: "Transfer",
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black  bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className={`md:flex md:flex-col bg-white rounded-lg ${qrImageUrl && (paymentMethod === "transfer" || paymentMethod === "card") ? "max-w-5xl" : "max-w-3xl"} w-full h-[80vh] p-6`}
      >
        {/* Header Modal */}
        <div className="flex justify-between items-center mb-6 ">
          <h2 className="text-xl font-semibold">Konfirmasi Pembayaran</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
          {/* Receipt Section */}
          <div className="p-2 w-full overflow-y-auto border-gray-200">
            {/* Business Info */}
            {settings &&
              (settings.businessName || settings.businessAddress) && (
                <div className="text-center mb-6 pb-4 border-b border-gray-200">
                  {settings.businessName && (
                    <h3 className="font-semibold text-lg">
                      {settings.businessName}
                    </h3>
                  )}
                  {settings.businessAddress && (
                    <p className="text-sm text-gray-600 mt-1">
                      {settings.businessAddress}
                    </p>
                  )}
                  {settings.businessPhone && (
                    <p className="text-sm text-gray-600">
                      {settings.businessPhone}
                    </p>
                  )}
                </div>
              )}

            {/* Receipt */}
            <div id="receipt-content" className="space-y-4 mb-6">
              <div className="text-center text-sm text-gray-600">
                <p>Tanggal: {formatDate()}</p>
                {customerName && <p>Pelanggan: {customerName}</p>}
              </div>

              <div className="border-t border-b border-gray-200 py-4">
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div
                      key={item.productId}
                      className="flex justify-between text-sm"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-gray-600">
                          {item.quantity} x {formatRupiah(item.price)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatRupiah(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total:</span>
                    <span>{formatRupiah(total)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Metode Pembayaran:</span>
                    <span>
                      {
                        paymentMethodLabels[
                          paymentMethod as keyof typeof paymentMethodLabels
                        ]
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code Section */}
          {(paymentMethod === "transfer" || paymentMethod === "card") &&
            qrImageUrl && (
              <div className=" p-2 text-center flex flex-col justify-center h-full border border-gray-200">
                <p className="text-sm font-medium mb-2 text-center">
                  Scan QRIS untuk Pembayaran:
                </p>
                <img
                  src={qrImageUrl}
                  alt="QR Code Pembayaran"
                  className="max-w-full object-contain mx-auto"
                />
              </div>
            )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6">
          {!isCompleted ? (
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Batal
              </button>
              <button
                onClick={onConfirm}
                disabled={isProcessing}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? "Memproses..." : "Konfirmasi Pembayaran"}
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handlePrint}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Cetak Struk
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Tutup
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
