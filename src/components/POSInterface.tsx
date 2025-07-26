import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";
import { CheckoutModal } from "./CheckoutModal";

interface CartItem {
  productId: Id<"products">;
  name: string;
  price: number;
  quantity: number;
  stock: number;
}

export function POSInterface() {
  const products = useQuery(api.products.list, {}) || [];
  const categories = useQuery(api.products.categories) || [];
  const createSale = useMutation(api.sales.create);

  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [customerName, setCustomerName] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [isPaymentCompleted, setIsPaymentCompleted] = useState(false);

  const filteredProducts = selectedCategory
    ? products.filter(p => p.category === selectedCategory)
    : products;

  const addToCart = (product: typeof products[0]) => {
    const existingItem = cart.find(item => item.productId === product._id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        toast.error(`Stok ${product.name} tidak mencukupi`);
        return;
      }
      setCart(cart.map(item =>
        item.productId === product._id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      if (product.stock === 0) {
        toast.error(`${product.name} habis`);
        return;
      }
      setCart([...cart, {
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: 1,
        stock: product.stock,
      }]);
    }
  };

  const updateQuantity = (productId: Id<"products">, newQuantity: number) => {
    if (newQuantity === 0) {
      setCart(cart.filter(item => item.productId !== productId));
    } else {
      const item = cart.find(item => item.productId === productId);
      if (item && newQuantity <= item.stock) {
        setCart(cart.map(item =>
          item.productId === productId
            ? { ...item, quantity: newQuantity }
            : item
        ));
      } else {
        toast.error("Jumlah melebihi stok yang tersedia");
      }
    }
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error("Keranjang kosong");
      return;
    }
    setShowCheckoutModal(true);
    setIsPaymentCompleted(false);
  };

  const handleCloseModal = () => {
    setShowCheckoutModal(false);
    if (isPaymentCompleted) {
      setCart([]);
      setCustomerName("");
      setIsPaymentCompleted(false);
    }
  };

  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    try {
      await createSale({
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        paymentMethod,
        customerName: customerName || undefined,
      });

      toast.success("Transaksi berhasil!");
      setIsPaymentCompleted(true);
    } catch (error) {
      toast.error("Transaksi gagal: " + (error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Produk</h2>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Semua Kategori</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <div
                  key={product._id}
                  onClick={() => addToCart(product)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    product.stock === 0
                      ? 'bg-gray-100 border-gray-300 cursor-not-allowed'
                      : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <h3 className="font-medium text-sm mb-2">{product.name}</h3>
                  <p className="text-blue-600 font-semibold text-sm mb-1">
                    {formatRupiah(product.price)}
                  </p>
                  <p className={`text-xs ${product.stock === 0 ? 'text-red-500' : 'text-gray-500'}`}>
                    Stok: {product.stock}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cart Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Keranjang</h2>
          
          <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
            {cart.map(item => (
              <div key={item.productId} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{item.name}</h4>
                  <p className="text-xs text-gray-600">{formatRupiah(item.price)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium hover:bg-gray-300"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-sm">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium hover:bg-gray-300"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <p className="text-gray-500 text-center py-8">Keranjang kosong</p>
            )}
          </div>

          <div className="border-t pt-4 space-y-4">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total:</span>
              <span className="text-blue-600">{formatRupiah(total)}</span>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Nama Pelanggan (Opsional)</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Masukkan nama pelanggan"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Metode Pembayaran</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="cash">Tunai</option>
                <option value="card">Kartu</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="w-full bg-blue-600 text-white py-3 rounded-md font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Bayar
            </button>
          </div>
        </div>
      </div>

      <CheckoutModal
        isOpen={showCheckoutModal}
        onClose={handleCloseModal}
        cart={cart}
        total={total}
        paymentMethod={paymentMethod}
        customerName={customerName}
        onConfirm={handleConfirmPayment}
        isProcessing={isProcessing}
        isCompleted={isPaymentCompleted}
      />
    </>
  );
}
