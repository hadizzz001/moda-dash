'use client';

import { useState, useEffect } from 'react';
import Upload from '../components/Upload';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import ExportToExcel from '../components/ExportToExcel';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

export default function ProductTable() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');


  // Fetch products and categories on load
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    const response = await fetch('/api/products');
    if (response.ok) {
      const data = await response.json();
      setProducts(data);
    } else {
      console.error('Failed to fetch products');
    }
  };

  const fetchCategories = async () => {
    const response = await fetch('/api/category');
    if (response.ok) {
      const data = await response.json();
      setCategories(data);
    } else {
      console.error('Failed to fetch categories');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        const response = await fetch(`/api/products/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          alert('Product deleted successfully');
          fetchProducts();
        } else {
          console.error('Failed to delete product');
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
  };

  const handleUpdate = async (updatedProduct) => {
    try {
      const response = await fetch(`/api/products/${updatedProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProduct),
      });

      if (response.ok) {
        alert('Product updated successfully');
        setEditingProduct(null);
        fetchProducts();
      } else {
        console.error('Failed to update product');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Filter products by search query
  const filterBySearch = (product) => {
    return product.title.toLowerCase().includes(searchQuery.toLowerCase());
  };

  // Filter products by selected category
  const filterByCategory = (product) => {
    const isFilteredByCategory = selectedCategory ? product.category === selectedCategory : true;

    return isFilteredByCategory;
  };

  // Apply both search and category filters
  const filteredProducts = products.filter((product) => {
    return filterBySearch(product) && filterByCategory(product);
  });




  return (
    <div className="max-w-7xl mx-auto p-4 text-[12px]">
      {editingProduct && (
        <EditProductForm
          product={editingProduct}
          onCancel={() => setEditingProduct(null)}
          onSave={handleUpdate}
        />
      )}
      <h1 className="text-2xl font-bold mb-4">Product List</h1>

      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full border p-2"
          placeholder="Search by title..."
        />
      </div>

      {/* Category Filter */}
      <div className="mb-4">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full border p-2"
        >
          <option value="">Select a category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.name}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <ExportToExcel products={products} />

      <table className="table-auto w-full border-collapse border border-gray-200 mb-4">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Title</th>
            <th className="border p-2">Pic</th>
            <th className="border p-2">Discount Price (USD)</th>
            <th className="border p-2">Category</th>
            <th className="border p-2">New Arrival</th>
            <th className="border p-2">Type</th>
            <th className="border p-2">Stock</th>
            <th className="border p-2">Colors & Qty</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>

        <tbody>
          {filteredProducts.map((product) => {
            const fileUrl = product.img[0];
            const isVideo = /\.(mp4|webm|ogg)$/i.test(fileUrl);
            const isCollection = product.type === "collection";
            const isSingle = product.type === "single";

            // Stock Calculation Logic
            const isOutOfStockSingle = isSingle && (product.stock === "0" || product.stock === 0 || product.stock === null );

            const allColorsQtyZero = isCollection &&
              product.color &&
              product.color.length > 0 &&
              product.color.every(c => !c.sizes && parseInt(c.qty) === 0);

            const allSizesQtyZero = isCollection &&
              product.color &&
              product.color.length > 0 &&
              product.color.every(c =>
                Array.isArray(c.sizes) &&
                c.sizes.length > 0 &&
                c.sizes.every(s => parseInt(s.qty || 0) === 0)
              );

            let totalStock = 0;
            if (isSingle) {
              totalStock = parseInt(product.stock || 0);
            } else if (product.color && product.color.length > 0) {
              product.color.forEach(c => {
                if (Array.isArray(c.sizes) && c.sizes.length > 0) {
                  totalStock += c.sizes.reduce((sum, s) => sum + parseInt(s.qty || 0), 0);
                } else {
                  totalStock += parseInt(c.qty || 0);
                }
              });
            }

            const isLowStock = totalStock > 0 && totalStock < 3;

            let rowClass = "";
            if (isOutOfStockSingle || allColorsQtyZero || allSizesQtyZero) {
              rowClass = "bg-red-300";
            } else if (isLowStock) {
              rowClass = "bg-yellow-300";
            }





            return (
              <tr key={product.id} className={rowClass}>

                <td className="border p-2">{product.title}</td>
                <td className="border p-2">
                  {isVideo ? (
                    <video controls className="w-24 h-auto">
                      <source src={fileUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <img src={fileUrl} alt="Product" className="w-24 h-auto" />
                  )}
                </td>
                <td className="border p-2">
                  {product.type === 'single' || (product.type === 'collection' && !product.color)
                    ? (`$${product.discount}`)
                    : (product.type === 'collection' && product.color && product.color.some(c => c.sizes?.length)
                      ? (() => {
                        const prices = product.color
                          .flatMap(c => c.sizes || [])
                          .map(s => s.price);

                        if (prices.length === 0) return product.discount;

                        const minPrice = Math.min(...prices);
                        const maxPrice = Math.max(...prices);

                        return minPrice === maxPrice
                          ? `$${minPrice.toFixed(2)}`
                          : `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;
                      })()
                      : `$${product.discount}`
                    )
                  }
                </td>

                <td className="border p-2">{product.category}</td>
                <td className="border p-2">{product.arrival}</td>
                <td className="border p-2">{product.type}</td>

                <td className="border p-2">
                  {product.type === 'single' && product.stock}

                  {product.type === 'collection' && product.color && !product.color[0]?.sizes &&
                    product.color.reduce((sum, c) => sum + (c.qty || 0), 0)
                  }

                  {product.type === 'collection' && product.color && product.color[0]?.sizes &&
                    product.color.reduce(
                      (colorSum, color) =>
                        colorSum +
                        (color.sizes
                          ? color.sizes.reduce((sizeSum, s) => sizeSum + (s.qty || 0), 0)
                          : 0),
                      0
                    )
                  }
                </td>

                <td className="border p-2">
                  {!isSingle && product.color && product.color.length > 0 ? (
                    <ul className="space-y-1">
                      {product.color.map((c, index) => (
                        <li key={index}>
                          <span className="font-semibold">{c.color}</span>
                          {c.sizes && Array.isArray(c.sizes) ? (
                            <ul className="ml-4 space-y-1 list-disc">
                              {c.sizes.map((s, idx) => (
                                <li key={idx}>
                                  <span className="italic">{s.size}</span>: {s.qty}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <>: {c.qty}</>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    isCollection ? 'No colors' : '—'
                  )}
                </td>


                <td className="border p-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="bg-yellow-500 text-white px-2 py-1 mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="bg-red-500 text-white px-2 py-1"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>

      </table>


    </div>
  );
}




function EditProductForm({ product, onCancel, onSave }) {
  const [title, setTitle] = useState(product.title);
  const [stock, setStock] = useState(product.stock || "0");
  const [img, setImg] = useState(product.img || []);
  const [description, setDescription] = useState(product.description);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(product.category || "");
  const [arrival, setArrival] = useState(product.arrival === "yes");
  const [type, setType] = useState(product.type || "single");

  const [originPrice, setOriginPrice] = useState(product.origin || '');
  const [weightKg, setWeightKg] = useState(product.weight || '');
  const [profitPercent, setProfitPercent] = useState(product.profit || '');
  const [date, setShippingDate] = useState(product.date || '');
  const [shippingRate, setShippingRate] = useState(product.rate || '');

  const origin = parseFloat(originPrice) || 0;
  const weight = parseFloat(weightKg) || 0;
  const profit = (parseFloat(profitPercent) || 0);
  const rate = parseFloat(shippingRate) || 0;

  const shippingCost = parseFloat((weight * rate).toFixed(2));
  const rawPrice = parseFloat(((origin + shippingCost) / (1 - profit || 1)).toFixed(2));
  const roundedUpPrice = (Math.floor(rawPrice) + 1) - 0.01;
  const finalPrice = parseFloat((roundedUpPrice).toFixed(2));
  const profitAmount = parseFloat((roundedUpPrice - (origin + shippingCost)).toFixed(2));
  const oldprice = parseFloat((finalPrice * 1.25).toFixed(2));
  const landing = parseFloat((shippingCost + origin).toFixed(2));


  const availableColors = ["black", "white", "red", "yellow", "blue", "green", "orange", "purple", "brown", "gray", "pink"];

  const [selectedColors, setSelectedColors] = useState(() => {
    const initial = {};
    (product.color || []).forEach(c => {
      initial[c.color] = {
        qty: c.qty || 1,
        sizes: c.sizes || {} // { M: { qty: 2, price: 15 } }
      };
    });
    return initial;
  });

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const categoriesRes = await fetch("/api/category");
        setCategories(await categoriesRes.json());
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchOptions();
  }, []);









  const handleSubmit = (e) => {
    e.preventDefault();

    onSave({
      ...product,
      title,
      description,
      price: oldprice.toFixed(2),
      discount: finalPrice.toFixed(2),
      origin: Number(origin.toFixed(2)),
      weight: Number(weight.toFixed(2)),
      profit: Number(profit.toFixed(2)),
      rate: Number(rate.toFixed(2)),
      shippingCost: Number(shippingCost.toFixed(2)),
      landing: Number(landing.toFixed(2)),
      profitAmount: Number(profitAmount.toFixed(2)),
      date,
      img,
      category: selectedCategory,
      type,
      ...(arrival && { arrival: "yes" }),
      ...(type === 'single' && { stock: stock }),
      ...(type === 'collection' && {
        color: Object.entries(selectedColors).map(([colorName, data]) => {
          const { qty, sizes } = data;
          const hasSizes = sizes && Object.keys(sizes).length > 0;
          return hasSizes
            ? {
              color: colorName,
              sizes: Object.entries(sizes).map(([size, values]) => ({
                size: values.size,
                price: Number(values.price),
                qty: Number(values.qty)
              }))
            }
            : {
              color: colorName,
              qty: Number(qty)
            };
        })
      })
    });
  };






  const toggleColor = (color) => {
    setSelectedColors((prev) => {
      if (prev[color]) {
        const updated = { ...prev };
        delete updated[color];
        return updated;
      } else {
        return {
          ...prev,
          [color]: { qty: 1, sizes: {} }
        };
      }
    });
  };

  const updateQty = (color, qty) => {
    setSelectedColors((prev) => ({
      ...prev,
      [color]: {
        ...prev[color],
        qty,
      }
    }));
  };

  const updateSize = (color, size, valueObj, remove = false) => {
    setSelectedColors((prev) => {
      const prevColor = prev[color] || { qty: 1, sizes: {} };
      const updatedSizes = { ...prevColor.sizes };

      if (remove) {
        delete updatedSizes[size];
      } else {
        updatedSizes[size] = valueObj;
      }

      return {
        ...prev,
        [color]: {
          ...prevColor,
          qty: undefined, // hide color-level qty when using sizes
          sizes: updatedSizes
        }
      };
    });
  };






  return (
    <form onSubmit={handleSubmit} className="text-[12px] border p-4 bg-gray-100 rounded">
      <h2 className="text-xl font-bold mb-4">Edit Product</h2>

      {/* Title */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border p-2" required />
      </div>

      {/* Category */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Category</label>
        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full border p-2">
          <option value="">Select Category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.name}>{cat.name}</option>
          ))}
        </select>
      </div>

      <h3 className="text-lg font-semibold mt-6 mb-2">Pricing Calculator</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium">Origin Price ($)</label>
          <input type="number" value={originPrice} step="0.01" onChange={(e) => setOriginPrice(e.target.value)} className="w-full border p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Weight (kg)</label>
          <input type="number" value={weightKg} step="0.01" onChange={(e) => setWeightKg(e.target.value)} className="w-full border p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Profit (eg: 0.6 for 60%)</label>
          <input type="number" value={profitPercent} step="0.1" onChange={(e) => setProfitPercent(e.target.value)} className="w-full border p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Shipping Date</label>
          <input type="month" value={date} onChange={(e) => setShippingDate(e.target.value)} className="w-full border p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Shipping Rate ($/kg)</label>
          <input type="number" value={shippingRate} step="0.01" onChange={(e) => setShippingRate(e.target.value)} className="w-full border p-2" />
        </div>
      </div>


      <div className="bg-gray-100 p-4 rounded space-y-2 text-sm sm:text-base">
        <p><strong>Shipping Cost:</strong> ${shippingCost.toFixed(2)}</p>
        <p><strong>Landing Cost:</strong> ${landing.toFixed(2)}</p>
        <p><strong>Profit Amount:</strong> ${profitAmount.toFixed(2)}</p>
      </div>

      <div className="mt-4">
        <label className="text-sm font-bold">Compare-at Price</label>
        <input type="number" value={oldprice.toFixed(2)} className="w-full border p-2 mb-2" readOnly />

        <label className="text-sm font-bold">Discounted Price</label>
        <input type="number" value={finalPrice.toFixed(2)} className="w-full border p-2" readOnly />
      </div>



      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Product Type</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="type"
              value="single"
              checked={type === "single"}
              onChange={() => setType("single")}
            />
            Single
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="type"
              value="collection"
              checked={type === "collection"}
              onChange={() => setType("collection")}
            />
            Collection
          </label>
        </div>
      </div>






      {/* Price, Discount, Stock */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">

        {type === "single" && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Stock</label>
            <input
              type="number"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="w-full border p-2"
              required
            />
          </div>
        )}

      </div>


      {type === "collection" && (
        <div className="mb-6">
          <label className="block text-lg font-bold mb-2">Choose Colors</label>
          <div className="flex flex-col gap-4">
            {availableColors.map((color) => {
              const isSelected = selectedColors[color];
              const hasSizes = isSelected && Object.keys(isSelected.sizes || {}).length > 0;

              return (
                <div key={color} className="p-3 border rounded-md">
                  <div className="flex items-center space-x-2 mb-2">
                    <div
                      className={`w-6 h-6 rounded-full cursor-pointer border-2 ${isSelected ? 'ring-2 ring-offset-2 ring-black' : ''
                        }`}
                      style={{ backgroundColor: color }}
                      onClick={() => toggleColor(color)}
                      title={color}
                    ></div>
                    <span className="capitalize font-medium">{color}</span>
                  </div>

                  {isSelected && (
                    <div className="ml-6 space-y-2">
                      {/* Show quantity input if no sizes */}
                      {!hasSizes && (
                        <input
                          type="number"
                          min={0}
                          placeholder="Qty"
                          className="border px-2 py-1 w-20"
                          value={isSelected.qty}
                          onChange={(e) => updateQty(color, e.target.value)}
                        />
                      )}

                      {/* Add Size Button */}
                      <button
                        type="button"
                        className="bg-blue-500 text-white px-2 py-1 text-sm rounded"
onClick={() => {
  const size = prompt('Enter size name (e.g., S, M, L)');
  if (!size || size.includes(',')) {
    alert('Commas are not allowed in the size name.');
    return;
  }
  updateSize(color, size, { size, qty: 1, price: '' });
}}

                      >
                        + Add Size
                      </button>

                      {/* Render Sizes */}
                      {hasSizes &&
                        Object.entries(isSelected.sizes).map(([sizeName, sizeData]) => (
                          <div key={sizeName} className="flex items-center gap-2 ml-4 mt-2">
                            <span className="font-semibold">{sizeData.size}</span>

                            <span>Price</span>
                            <input
                              type="number"
                              placeholder="Price"
                              value={sizeData.price}
                              onChange={(e) =>
                                updateSize(color, sizeName, {
                                  ...sizeData,
                                  price: e.target.value,
                                })
                              }
                              className="border px-2 py-1 w-20"
                            />

                            <span>Qty</span>
                            <input
                              type="number"
                              placeholder="Qty"
                              value={sizeData.qty}
                              onChange={(e) =>
                                updateSize(color, sizeName, {
                                  ...sizeData,
                                  qty: e.target.value,
                                })
                              }
                              className="border px-2 py-1 w-20"
                            />

                            <button
                              type="button"
                              className="text-red-500 font-bold"
                              onClick={() => updateSize(color, sizeName, null, true)} // delete
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}






      {/* Description */}
      <label className="block text-lg font-bold mb-2">Description</label>
      <ReactQuill value={description} onChange={setDescription} className="mb-4" theme="snow" placeholder="Write your product description here..." />

      {/* Arrival */}
      <div className="mb-4">
        <input type="checkbox" checked={arrival} onChange={(e) => setArrival(e.target.checked)} />
        <label className="ml-2 text-sm font-medium">New Arrival</label>
      </div>

      {/* Image Upload */}
      <Upload onFilesUpload={(url) => setImg(url)} />

      {/* Buttons */}
      <div className="flex gap-2 mt-4">
        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">Save</button>
        <button type="button" onClick={onCancel} className="bg-gray-500 text-white px-4 py-2 rounded">Cancel</button>
      </div>
    </form>
  );
}

