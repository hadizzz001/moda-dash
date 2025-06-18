"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import Upload from '../components/Upload';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

export default function AddProduct() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(''); 
  const [stock, setStock] = useState('');
  const [img, setImg] = useState(['']);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [productType, setProductType] = useState('single'); 
  const [selectedColors, setSelectedColors] = useState([]);
  const [colorQuantities, setColorQuantities] = useState({});
  const [colorSizes, setColorSizes] = useState({});





  const availableColors = ["black", "white", "red", "yellow", "blue", "green", "orange", "purple", "brown", "gray", "pink"];

  const handleColorToggle = (color) => {
    setSelectedColors(prev =>
      prev.includes(color)
        ? prev.filter(c => c !== color)
        : [...prev, color]
    );
  };


  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch(`/api/category`);
        if (response.ok) {
          const data = await response.json();
          setCategoryOptions(data);
          setSelectedCategory('');
        } else {
          console.error('Failed to fetch categories');
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    }
    fetchCategories();
  }, []);




  const handleSubmit = async (e) => {
    e.preventDefault();

    if (img.length === 1 && img[0] === '') {
      alert('Please choose at least 1 image');
      return;
    }

    // Validate color quantities if collection
    if (productType === 'collection') {
      if (selectedColors.length === 0) {
        alert('Please select at least one color with a quantity.');
        return;
      }

      let atLeastOneValid = false;

      for (const color of selectedColors) {
        const colorData = colorQuantities[color];

        if (!colorData) {
          alert(`Missing data for color: ${color}`);
          return;
        }

        const sizes = colorData.sizes;

        if (sizes && Object.keys(sizes).length > 0) {
          for (const [size, { price, qty }] of Object.entries(sizes)) {
            const priceNum = Number(price);
            const qtyNum = Number(qty);

            if (isNaN(priceNum) || priceNum <= 0) {
              alert(`Please enter a valid price for size "${size}" in color "${color}".`);
              return;
            }

            if (isNaN(qtyNum) || qtyNum <= 0) {
              alert(`Please enter a valid quantity for size "${size}" in color "${color}".`);
              return;
            }

            atLeastOneValid = true;
          }
        } else {
          const colorQty = Number(colorData.qty);
          if (isNaN(colorQty) || colorQty <= 0) {
            alert(`Please enter a valid quantity (greater than 0) for color "${color}".`);
            return;
          }

          atLeastOneValid = true;
        }
      }

      if (!atLeastOneValid) {
        alert('At least one color or size must have valid quantity and price.');
        return;
      }
    }



    const payload = {
      title,
      description,
price: Number(price).toFixed(2), 
      img,
      category: selectedCategory,
      type: productType,
      ...(productType === 'single' && { stock }),
      ...(productType === 'collection' && {
        color: selectedColors.map(color => {
          const data = colorQuantities[color] || {};
          if (data.sizes && Object.keys(data.sizes).length > 0) {
            return {
              color,
              sizes: Object.entries(data.sizes).map(([size, values]) => ({
                size,
                price: Number(parseFloat(values.price).toFixed(2)),
                qty: Number(values.qty)
              }))
            };
          } else {
            return {
              color,
              qty: Number(data.qty || 0)
            };
          }
        })
      })
    };



    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert('Product added successfully!');
        window.location.href = '/dashboard';
      } else {
        alert('Failed to add product');
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      alert('An error occurred');
    }
  };


  const handleImgChange = (url) => {
    if (url) {
      setImg(url);
    }
  };




  // Add a size row for a color
  const handleAddSize = (color) => {
    setColorSizes(prev => ({
      ...prev,
      [color]: [...(prev[color] || []), { size: '', price: '', qty: '' }]
    }));
  };

  // Update a specific size's field
  const handleSizeChange = (color, index, field, value) => {
    setColorSizes(prev => {
      const updated = [...prev[color]];
      updated[index][field] = value;
      return {
        ...prev,
        [color]: updated
      };
    });
  };










  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Add New Product</h1>
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border p-2 mb-4"
        required
      />

      {/* Category Selection */}
      <label className="block text-lg font-bold mb-2">Category</label>
      <select
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
        className="w-full border p-2 mb-4"
        required
      >
        <option value="" disabled>Select a category</option>
        {categoryOptions.map((category) => (
          <option key={category.id} value={category.name}>
            {category.name}
          </option>
        ))}
      </select>







      <input
        type="number"
        step="0.01"
        placeholder="Price"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="w-full border p-2 mb-4"
        required
      />

 






      {/* Product Type Radio */}
      <div className="mb-4">
        <label className="block text-lg font-bold mb-2">Product Type</label>
        <div className="flex space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              value="single"
              checked={productType === 'single'}
              onChange={() => setProductType('single')}
            />
            <span>1 Item</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              value="collection"
              checked={productType === 'collection'}
              onChange={() => setProductType('collection')}
            />
            <span>Collection</span>
          </label>
        </div>
      </div>

      {/* Stock Input (only for 1 item) */}
      {productType === 'single' && (
        <input
          type="number"
          placeholder="Stock"
          value={stock}
          min={0}
          onChange={(e) => setStock(e.target.value)}
          className="w-full border p-2 mb-4"
          required
        />
      )}

      {/* Color Select with Qty Inputs (only for collection) */}
      {productType === 'collection' && (
        <div className="mb-4">
          <label className="block text-lg font-bold mb-2">Choose Colors</label>
          <div className="flex flex-col gap-4">
            {availableColors.map((color) => (
              <div key={color} className="p-2 border rounded-md">
                <div className="flex items-center space-x-2 mb-2">
                  <div
                    className={`w-6 h-6 rounded-full cursor-pointer border-2 ${selectedColors.includes(color) ? 'ring-2 ring-offset-2' : ''
                      }`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorToggle(color)}
                  ></div>
                  <span className="capitalize font-medium">{color}</span>
                  {selectedColors.includes(color) && (
                    <div className="space-y-2">
                      {/* Color-level quantity (only if no sizes) */}
                      {!(colorQuantities[color]?.sizes && Object.keys(colorQuantities[color].sizes).length > 0) && (
                        <input
                          type="number"
                          placeholder="Qty"
                          min={0}
                          value={colorQuantities[color]?.qty || ''}
                          onChange={(e) =>
                            setColorQuantities((prev) => ({
                              ...prev,
                              [color]: {
                                ...prev[color],
                                qty: e.target.value,
                                sizes: prev[color]?.sizes || {},
                              }
                            }))
                          }
                          className="border px-2 py-1 w-20"
                        />
                      )}

                      {/* Add size button */}
                      <button
                        type="button"
                        className="bg-blue-500 text-white px-2 py-1 text-sm rounded"
                        onClick={() => {
                          const size = prompt('Enter size name (e.g., S, M, L)');
                          if (!size || size.includes(',')) {
                            alert('Commas are not allowed in the size name.');
                            return;
                          }

                          setColorQuantities((prev) => ({
                            ...prev,
                            [color]: {
                              ...prev[color],
                              qty: undefined, // hide top qty if sizes are used
                              sizes: {
                                ...prev[color]?.sizes,
                                [size]: { price: '', qty: '' }
                              }
                            }
                          }));
                        }}
                      >
                        + Add Size
                      </button>

                      {/* Render sizes for this color */}
                      {colorQuantities[color]?.sizes &&
                        Object.entries(colorQuantities[color].sizes).map(([sizeName, sizeData]) => (
                          <div key={sizeName} className="flex items-center gap-2 ml-4 mt-2">
                            <span className="font-semibold">{sizeName}</span>
                            <input
                              type="number"
                              placeholder="Price"
                              value={sizeData.price}
                              onChange={(e) =>
                                setColorQuantities((prev) => ({
                                  ...prev,
                                  [color]: {
                                    ...prev[color],
                                    sizes: {
                                      ...prev[color].sizes,
                                      [sizeName]: {
                                        ...prev[color].sizes[sizeName],
                                        price: e.target.value
                                      }
                                    }
                                  }
                                }))
                              }
                              className="border px-2 py-1 w-20"
                            />
                            <input
                              type="number"
                              placeholder="Qty"
                              value={sizeData.qty}
                              min={0}
                              onChange={(e) =>
                                setColorQuantities((prev) => ({
                                  ...prev,
                                  [color]: {
                                    ...prev[color],
                                    sizes: {
                                      ...prev[color].sizes,
                                      [sizeName]: {
                                        ...prev[color].sizes[sizeName],
                                        qty: e.target.value
                                      }
                                    }
                                  }
                                }))
                              }
                              className="border px-2 py-1 w-20"
                            />
                            <button
                              type="button"
                              className="text-red-500 font-bold"
                              onClick={() => {
                                const newSizes = { ...colorQuantities[color].sizes };
                                delete newSizes[sizeName];

                                setColorQuantities((prev) => ({
                                  ...prev,
                                  [color]: {
                                    ...prev[color],
                                    sizes: newSizes
                                  }
                                }));
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                    </div>
                  )}

                </div>

                {/* Sizes */}
                {selectedColors.includes(color) && colorSizes[color] && (
                  <div className="ml-6">
                    {colorSizes[color].map((sz, idx) => (
                      <div key={idx} className="flex items-center space-x-2 mb-2">
                        <input
                          type="text"
                          placeholder="Size"
                          value={sz.size}
                          onChange={(e) =>
                            handleSizeChange(color, idx, 'size', e.target.value)
                          }
                          className="border px-2 py-1 w-20"
                        />
                        <input
                          type="number"
                          placeholder="Price"
                          value={sz.price}
                          onChange={(e) =>
                            handleSizeChange(color, idx, 'price', e.target.value)
                          }
                          className="border px-2 py-1 w-24"
                        />
                        <input
                          type="number"
                          placeholder="Qty"
                          min={0}
                          value={sz.qty}
                          onChange={(e) =>
                            handleSizeChange(color, idx, 'qty', e.target.value)
                          }
                          className="border px-2 py-1 w-20"
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      className="text-sm bg-blue-500 text-white px-2 py-1 rounded"
                      onClick={() => handleAddSize(color)}
                    >
                      Add Size
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      )}


      <label className="block text-lg font-bold mb-2">Description</label>
      <ReactQuill
        value={description}
        onChange={setDescription}
        className="mb-4"
        theme="snow"
        placeholder="Write your product description here..."
      />

      <Upload onFilesUpload={handleImgChange} />Max 12 images


 <br/>

      <button type="submit" className="bg-green-500 text-white px-4 py-2">
        Save Product
      </button>
    </form>
  );
}
