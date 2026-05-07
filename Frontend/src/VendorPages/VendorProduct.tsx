import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import Navbar from '../VendorComponents/Navbar';
import productImage from '../assets/Hero1.png';
import productImageTwo from '../assets/Hero2.jpg';
import productImageThree from '../assets/Hero3.png';
import productImageFour from '../assets/cta.png';

type ProductRow = {
  id: number;
  productName: string;
  sku: string;
  category: string;
  strength: string;
  form: string;
  quantity: string;
  storageRequirements: string;
  expiryDate: string;
  productDescription: string;
  dosageInstructions: string[];
  sideEffects: string[];
  price: number;
  stock: number;
  status: 'Active' | 'Inactive';
  images: string[];
};

const VendorProduct = () => {
  const [products, setProducts] = useState<ProductRow[]>([
    {
      id: 1,
      productName: 'Amoxicillin 500mg',
      sku: 'AMX-500-001',
      category: 'Antibiotics',
      strength: '500mg',
      form: 'Capsule',
      quantity: '30 ct',
      storageRequirements: 'Store below 25C in a dry place.',
      expiryDate: '2027-08-15',
      productDescription: 'Broad-spectrum antibiotic capsule.',
      dosageInstructions: ['Take after meals', 'Use with full glass of water'],
      sideEffects: ['Nausea', 'Mild diarrhea'],
      price: 425,
      stock: 18,
      status: 'Active',
      images: [productImage],
    },
    {
      id: 2,
      productName: 'Lisinopril 10mg',
      sku: 'LSP-010-002',
      category: 'Cardiovascular',
      strength: '10mg',
      form: 'Tablet',
      quantity: '10 tablets',
      storageRequirements: 'Store at 20C to 25C in dry condition.',
      expiryDate: '2028-01-10',
      productDescription: 'ACE inhibitor tablet for blood pressure control.',
      dosageInstructions: ['Take once daily', 'Take at the same time each day'],
      sideEffects: ['Dry cough', 'Dizziness'],
      price: 280,
      stock: 24,
      status: 'Active',
      images: [productImageTwo],
    },
    {
      id: 3,
      productName: 'Metformin 500mg',
      sku: 'MTF-500-003',
      category: 'Diabetes Care',
      strength: '500mg',
      form: 'Tablet',
      quantity: '20 tablets',
      storageRequirements: 'Store away from moisture and direct sunlight.',
      expiryDate: '2027-12-20',
      productDescription: 'Oral antidiabetic medicine for blood sugar management.',
      dosageInstructions: ['Take with meals', 'Do not crush or chew tablet'],
      sideEffects: ['Nausea', 'Stomach upset'],
      price: 190,
      stock: 30,
      status: 'Active',
      images: [productImageThree],
    },
    {
      id: 4,
      productName: 'Albuterol Inhaler',
      sku: 'ALB-090-004',
      category: 'Respiratory',
      strength: '100mcg',
      form: 'Inhaler',
      quantity: '1 unit',
      storageRequirements: 'Keep at room temperature and away from heat.',
      expiryDate: '2024-11-30',
      productDescription: 'Rescue inhaler for quick relief from breathing difficulty.',
      dosageInstructions: ['Shake before each use', 'Use as prescribed by physician'],
      sideEffects: ['Tremor', 'Headache'],
      price: 1150,
      stock: 0,
      status: 'Inactive',
      images: [productImageFour],
    },
  ]);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    productName: '',
    sku: '',
    category: '',
    strength: '',
    form: '',
    quantity: '',
    storageRequirements: '',
    expiryDate: '',
    productDescription: '',
    dosageInstructions: '',
    sideEffects: '',
    price: '',
    stock: '',
  });

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return products;
    return products.filter((product) =>
      [
        product.productName,
        product.sku,
        product.category,
        product.strength,
        product.form,
        product.quantity,
        product.storageRequirements,
        product.expiryDate,
        product.productDescription,
      ].some((value) => value.toLowerCase().includes(query)),
    );
  }, [products, searchTerm]);

  const getExpiryStatus = (expiryDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expDate = new Date(expiryDate);
    if (Number.isNaN(expDate.getTime())) {
      return { label: 'Unknown', classes: 'bg-slate-100 text-slate-700' };
    }
    expDate.setHours(0, 0, 0, 0);

    if (expDate < today) {
      return { label: 'Expired', classes: 'bg-rose-100 text-rose-700' };
    }
    if (expDate.getTime() === today.getTime()) {
      return { label: 'Expires Today', classes: 'bg-amber-100 text-amber-700' };
    }
    return { label: 'Valid', classes: 'bg-emerald-100 text-emerald-700' };
  };

  const truncateDescription = (value: string, maxChars = 90) => {
    const text = value.trim();
    if (text.length <= maxChars) return text;
    return `${text.slice(0, maxChars).trim()}.........`;
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    setProductImages((prev) => {
      const remainingSlots = 4 - prev.length;
      if (remainingSlots <= 0) {
        window.alert('You can upload maximum 4 images.');
        return prev;
      }

      const filesToAdd = files.slice(0, remainingSlots);
      if (files.length > remainingSlots) {
        window.alert('Only 4 images are allowed. Extra images were ignored.');
      }

      const imageUrls = filesToAdd.map((file) => URL.createObjectURL(file));
      return [...prev, ...imageUrls];
    });
    event.target.value = '';
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setProductImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsedStock = Number(formData.stock);
    const payload = {
      productName: formData.productName.trim(),
      sku: formData.sku.trim(),
      category: formData.category.trim(),
      strength: formData.strength.trim(),
      form: formData.form.trim(),
      quantity: formData.quantity.trim(),
      storageRequirements: formData.storageRequirements.trim(),
      expiryDate: formData.expiryDate,
      productDescription: formData.productDescription.trim(),
      dosageInstructions: formData.dosageInstructions
        .split('\n')
        .map((item) => item.replace(/^-\s*/, '').trim())
        .filter(Boolean),
      sideEffects: formData.sideEffects
        .split('\n')
        .map((item) => item.replace(/^-\s*/, '').trim())
        .filter(Boolean),
      price: Number(formData.price),
      stock: parsedStock,
      status: parsedStock > 0 ? 'Active' as const : 'Inactive' as const,
      images: productImages.length > 0 ? productImages : [productImage],
    };

    if (editingId !== null) {
      setProducts((prev) => prev.map((product) => (product.id === editingId ? { ...product, ...payload } : product)));
      window.alert('Product updated successfully.');
    } else {
      const newProduct: ProductRow = {
        id: Date.now(),
        ...payload,
      };
      setProducts((prev) => [newProduct, ...prev]);
      window.alert('Product added successfully.');
    }

    setFormData({
      productName: '',
      sku: '',
      category: '',
      strength: '',
      form: '',
      quantity: '',
      storageRequirements: '',
      expiryDate: '',
      productDescription: '',
      dosageInstructions: '',
      sideEffects: '',
      price: '',
      stock: '',
    });
    setProductImages([]);
    setEditingId(null);
  };

  const handleEdit = (product: ProductRow) => {
    setEditingId(product.id);
    setFormData({
      productName: product.productName,
      sku: product.sku,
      category: product.category,
      strength: product.strength,
      form: product.form,
      quantity: product.quantity,
      storageRequirements: product.storageRequirements,
      expiryDate: product.expiryDate,
      productDescription: product.productDescription,
      dosageInstructions: product.dosageInstructions.map((item) => `- ${item}`).join('\n'),
      sideEffects: product.sideEffects.map((item) => `- ${item}`).join('\n'),
      price: String(product.price),
      stock: String(product.stock),
    });
    setProductImages(product.images);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: number) => {
    const confirmed = window.confirm('Are you sure you want to delete this product?');
    if (!confirmed) return;
    setProducts((prev) => prev.filter((product) => product.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setFormData({
        productName: '',
        sku: '',
        category: '',
        strength: '',
        form: '',
        quantity: '',
        storageRequirements: '',
        expiryDate: '',
        productDescription: '',
        dosageInstructions: '',
        sideEffects: '',
        price: '',
        stock: '',
      });
      setProductImages([]);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Navbar />
      <main className="flex-1 overflow-x-hidden p-6">
        <h1 className="text-2xl font-bold text-slate-900">Product</h1>
        <p className="mt-1 text-sm text-slate-600">Manage products with ease</p>

        <section className="sticky top-4 z-10 mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">{editingId !== null ? 'Edit Product' : 'Add Product'}</h2>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <label className="block text-sm text-slate-700">
              Product Name
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
                onChange={(event) => setFormData((prev) => ({ ...prev, productName: event.target.value }))}
                placeholder="Enter product name"
                required
                type="text"
                value={formData.productName}
              />
            </label>

            <label className="block text-sm text-slate-700">
              SKU
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
                onChange={(event) => setFormData((prev) => ({ ...prev, sku: event.target.value }))}
                placeholder="Enter SKU"
                required
                type="text"
                value={formData.sku}
              />
            </label>

            <label className="block text-sm text-slate-700">
              Category
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
                onChange={(event) => setFormData((prev) => ({ ...prev, category: event.target.value }))}
                placeholder="Enter category"
                required
                type="text"
                value={formData.category}
              />
            </label>

            <label className="block text-sm text-slate-700">
              Strength
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
                onChange={(event) => setFormData((prev) => ({ ...prev, strength: event.target.value }))}
                placeholder="Enter strength (e.g. 500mg)"
                required
                type="text"
                value={formData.strength}
              />
            </label>

            <label className="block text-sm text-slate-700">
              Form
              <div className="relative mt-1">
                <select
                  className="w-full appearance-none rounded-lg border border-slate-300 px-3 py-2 pr-10 text-sm outline-none focus:border-teal-600"
                  onChange={(event) => setFormData((prev) => ({ ...prev, form: event.target.value }))}
                  required
                  value={formData.form}
                >
                  <option value="">Select form</option>
                  <option value="Tablet">Tablet</option>
                  <option value="Capsule">Capsule</option>
                  <option value="Syrup">Syrup</option>
                  <option value="Inhaler">Inhaler</option>
                  <option value="Injection">Injection</option>
                  <option value="Ointment">Ointment</option>
                  <option value="Drops">Drops</option>
                </select>
                <svg
                  aria-hidden="true"
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
            </label>

            <label className="block text-sm text-slate-700">
              Quantity
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
                onChange={(event) => setFormData((prev) => ({ ...prev, quantity: event.target.value }))}
                placeholder="Enter quantity (e.g. 30 ct)"
                required
                type="text"
                value={formData.quantity}
              />
            </label>

            <label className="block text-sm text-slate-700">
              Storage Requirements
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
                onChange={(event) => setFormData((prev) => ({ ...prev, storageRequirements: event.target.value }))}
                placeholder="Enter storage requirements"
                required
                type="text"
                value={formData.storageRequirements}
              />
            </label>

            <label className="block text-sm text-slate-700">
              Expiry Date
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
                onChange={(event) => setFormData((prev) => ({ ...prev, expiryDate: event.target.value }))}
                required
                type="date"
                value={formData.expiryDate}
              />
            </label>

            <label className="block text-sm text-slate-700">
              Price
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
                min="0"
                onChange={(event) => setFormData((prev) => ({ ...prev, price: event.target.value }))}
                placeholder="Enter price"
                required
                type="number"
                value={formData.price}
              />
            </label>

            <label className="block text-sm text-slate-700">
              Stock
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
                min="0"
                onChange={(event) => setFormData((prev) => ({ ...prev, stock: event.target.value }))}
                placeholder="0"
                required
                type="number"
                value={formData.stock}
              />
            </label>

            <label className="block text-sm text-slate-700 md:col-span-2">
              Product Description
              <textarea
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
                onChange={(event) => setFormData((prev) => ({ ...prev, productDescription: event.target.value }))}
                placeholder="Enter product description"
                required
                rows={3}
                value={formData.productDescription}
              />
            </label>

            <label className="block text-sm text-slate-700 md:col-span-2">
              Dosage Instructions (bullet points: one per line)
              <textarea
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
                onChange={(event) => setFormData((prev) => ({ ...prev, dosageInstructions: event.target.value }))}
                placeholder={'- Take after meals\n- Drink plenty of water'}
                required
                rows={3}
                value={formData.dosageInstructions}
              />
            </label>

            <label className="block text-sm text-slate-700 md:col-span-2">
              Side Effects (bullet points: one per line)
              <textarea
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
                onChange={(event) => setFormData((prev) => ({ ...prev, sideEffects: event.target.value }))}
                placeholder={'- Nausea\n- Mild headache'}
                required
                rows={3}
                value={formData.sideEffects}
              />
            </label>

            <label className="block text-sm text-slate-700 md:col-span-2">
              Product Images (max 4)
              <input
                accept="image/*"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
                multiple
                onChange={handleImageChange}
                type="file"
              />
              {productImages.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {productImages.map((image, index) => (
                    <div className="relative" key={`${image}-${index}`}>
                      <img alt={`Product preview ${index + 1}`} className="h-12 w-12 rounded-md border border-slate-200 object-cover" src={image} />
                      <button
                        aria-label={`Remove image ${index + 1}`}
                        className="absolute -right-1 -top-1 inline-flex h-4 w-4 cursor-pointer items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white"
                        onClick={() => handleRemoveImage(index)}
                        type="button"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </label>

            <div className="md:col-span-2">
              <div className="flex items-center gap-2">
                <button className="cursor-pointer rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white" type="submit">
                  {editingId !== null ? 'Update Product' : 'Add Product'}
                </button>
                {editingId !== null && (
                  <button
                    className="cursor-pointer rounded-lg border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700"
                    onClick={() => {
                      setEditingId(null);
                      setFormData({
                        productName: '',
                        sku: '',
                        category: '',
                        strength: '',
                        form: '',
                        quantity: '',
                        storageRequirements: '',
                        expiryDate: '',
                        productDescription: '',
                        dosageInstructions: '',
                        sideEffects: '',
                        price: '',
                        stock: '',
                      });
                      setProductImages([]);
                    }}
                    type="button"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </form>
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-4">
            <h2 className="text-2xl font-semibold text-slate-900">Product List</h2>
            <input
              className="w-80 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600"
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search products"
              type="text"
              value={searchTerm}
            />
          </div>
          <div className="w-full overflow-x-auto">
            <table className="min-w-[1600px] text-left">
              <thead className="bg-slate-100">
                <tr>
                  <th className="whitespace-nowrap px-5 py-3 text-sm font-semibold text-slate-700">ID</th>
                  <th className="whitespace-nowrap px-5 py-3 text-sm font-semibold text-slate-700">Images</th>
                  <th className="whitespace-nowrap px-5 py-3 text-sm font-semibold text-slate-700">SKU</th>
                  <th className="whitespace-nowrap px-5 py-3 text-sm font-semibold text-slate-700">Product Name</th>
                  <th className="whitespace-nowrap px-5 py-3 text-sm font-semibold text-slate-700">Category</th>
                  <th className="whitespace-nowrap px-5 py-3 text-sm font-semibold text-slate-700">Strength</th>
                  <th className="whitespace-nowrap px-5 py-3 text-sm font-semibold text-slate-700">Form</th>
                  <th className="whitespace-nowrap px-5 py-3 text-sm font-semibold text-slate-700">Quantity</th>
                  <th className="whitespace-nowrap px-5 py-3 text-sm font-semibold text-slate-700">Storage Requirements</th>
                  <th className="whitespace-nowrap px-5 py-3 text-sm font-semibold text-slate-700">Expiry Date</th>
                  <th className="whitespace-nowrap px-5 py-3 text-sm font-semibold text-slate-700">Expiry Status</th>
                  <th className="whitespace-nowrap px-5 py-3 text-sm font-semibold text-slate-700">Product Description</th>
                  <th className="whitespace-nowrap px-5 py-3 text-sm font-semibold text-slate-700">Dosage Instructions</th>
                  <th className="whitespace-nowrap px-5 py-3 text-sm font-semibold text-slate-700">Side Effects</th>
                  <th className="whitespace-nowrap px-5 py-3 text-sm font-semibold text-slate-700">Price</th>
                  <th className="whitespace-nowrap px-5 py-3 text-sm font-semibold text-slate-700">Stock</th>
                  <th className="whitespace-nowrap px-5 py-3 text-sm font-semibold text-slate-700">Status</th>
                  <th className="whitespace-nowrap px-5 py-3 text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product, index) => (
                  (() => {
                    const expiryStatus = getExpiryStatus(product.expiryDate);
                    return (
                  <tr className="border-t border-slate-200" key={product.id}>
                    <td className="whitespace-nowrap px-5 py-3 align-top text-sm text-slate-700">{index + 1}</td>
                    <td className="whitespace-nowrap px-5 py-3 align-top text-sm text-slate-700">
                      <img
                        alt={`${product.productName} preview`}
                        className="h-11 w-11 rounded-md border border-slate-200 object-cover"
                        src={product.images[0] || productImage}
                      />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 align-top text-sm text-slate-700">{product.sku}</td>
                    <td className="whitespace-nowrap px-5 py-3 align-top text-sm text-slate-800">{product.productName}</td>
                    <td className="whitespace-nowrap px-5 py-3 align-top text-sm text-slate-700">{product.category}</td>
                    <td className="whitespace-nowrap px-5 py-3 align-top text-sm text-slate-700">{product.strength}</td>
                    <td className="whitespace-nowrap px-5 py-3 align-top text-sm text-slate-700">{product.form}</td>
                    <td className="whitespace-nowrap px-5 py-3 align-top text-sm text-slate-700">{product.quantity}</td>
                    <td className="max-w-[240px] px-5 py-3 align-top text-sm text-slate-700">
                      {truncateDescription(product.storageRequirements)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 align-top text-sm text-slate-700">{product.expiryDate}</td>
                    <td className="whitespace-nowrap px-5 py-3 align-top text-sm">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${expiryStatus.classes}`}>
                        {expiryStatus.label}
                      </span>
                    </td>
                    <td className="max-w-[240px] px-5 py-3 align-top text-sm text-slate-700">{truncateDescription(product.productDescription)}</td>
                    <td className="max-w-[220px] px-5 py-3 align-top text-sm text-slate-700">
                      <ul className="list-disc pl-4">
                        {product.dosageInstructions.slice(0, 2).map((item, itemIndex) => (
                          <li key={`${product.id}-dosage-${itemIndex}`}>{item}</li>
                        ))}
                        {product.dosageInstructions.length > 2 && <li className="list-none pl-0">.....</li>}
                      </ul>
                    </td>
                    <td className="max-w-[220px] px-5 py-3 align-top text-sm text-slate-700">
                      <ul className="list-disc pl-4 marker:text-rose-600">
                        {product.sideEffects.slice(0, 2).map((item, itemIndex) => (
                          <li key={`${product.id}-side-${itemIndex}`}>{item}</li>
                        ))}
                        {product.sideEffects.length > 2 && <li className="list-none pl-0 marker:text-transparent">.....</li>}
                      </ul>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 align-top text-sm text-slate-700">NPR {product.price.toLocaleString()}</td>
                    <td className="whitespace-nowrap px-5 py-3 align-top text-sm text-slate-700">
                      {product.stock}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 align-top text-sm">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          product.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {product.status === 'Active' ? 'In stock' : 'Out of stock'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 align-top text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          className="cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                          onClick={() => handleEdit(product)}
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          className="cursor-pointer rounded-md border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700"
                          onClick={() => handleDelete(product.id)}
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                    );
                  })()
                ))}
                {filteredProducts.length === 0 && (
                  <tr className="border-t border-slate-200">
                    <td className="px-5 py-4 text-sm text-slate-500" colSpan={18}>
                      No products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default VendorProduct;