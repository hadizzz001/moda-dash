"use client"

import React from 'react'
import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from "react";




const page = () => {
  const [allTemp1, setTemp1] = useState()
  const searchParams = useSearchParams()
  const search = searchParams.get('id') 
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [availableColors, setAvailableColors] = useState([]);
  const [availableSizes, setAvailableSizes] = useState([]);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [qty, setQty] = useState(1);
  const [editableData, setEditableData] = useState({
    fname: allTemp1?.cartItems?.fname || '',
    lname: allTemp1?.cartItems?.lname || '',
    phone: allTemp1?.cartItems?.phone || '',
    city: allTemp1?.cartItems?.city || '',
    address: allTemp1?.cartItems?.address || '',
    apt: allTemp1?.cartItems?.apt || '', 
  });
  const [remark, setRemark] = useState({ 
    apt: allTemp1?.remark || ''
  });




  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`/api/order/${search}`);
        if (response.ok) {
          const data = await response.json();
          setTemp1(data); 

          setEditableData({
            fname: data?.cartItems?.fname || '',
            lname: data?.cartItems?.lname || '',
            phone: data?.cartItems?.phone || '',
            city: data?.cartItems?.city || '',
            address: data?.cartItems?.address || '',
            apt: data?.cartItems?.apt || ''
          });
          setRemark(data?.remark || '');
        } else {
          console.error('Failed to fetch products');
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, []);


  // Handle change for inputs
  const handleFieldChange = (field, value) => {
    setEditableData(prev => ({ ...prev, [field]: value }));
  };

  // Handle save of edited fields
  const handleSaveCustomerDetails = async () => {
    console.log("Saving customer details:", editableData);


    try {
      const response = await fetch(`/api/order/${search}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          cartItems: editableData,
          remark
         }),
      });

      if (response.ok) {
        console.log("Done!");

      } else {
        console.error("Failed to update status.");
      }
    } catch (error) {
      console.error("Error updating order:", error);
    }





  };







  const handleAddProduct = async () => {
    if (!selectedProduct || qty < 1) return;

    const id = selectedProduct.id || selectedProduct._id;
    let stockUrl = '';
    let body = '';

    if (selectedProduct.type === "single") {
      stockUrl = `/api/stock`;
      body = `${id},${qty}`;
    } else if (selectedProduct.color && selectedProduct.color[0].sizes) {
      stockUrl = `/api/stock2`;
      body = `${id},${selectedColor},${selectedSize},${qty}`;
    } else {
      stockUrl = `/api/stock1`;
      body = `${id},${selectedColor},${qty}`;
    }

    try {
      const stockResponse = await fetch(stockUrl, {
        method: "PATCH",
        headers: {
          "Content-Type": "text/plain"
        },
        body
      });

      if (!stockResponse.ok) {
        const errorText = await stockResponse.text();
        alert(`Stock update failed: ${errorText || stockResponse.statusText}`);
        return;
      }
    } catch (error) {
      alert(`Error connecting to stock API: ${error.message}`);
      return;
    }

    // Update the order if stock update succeeded
    const newItem = {
      ...selectedProduct, // spread the product properties
      quantity: qty,
      selectedColor,
      selectedSize,
    };


    try {
      await fetch(`/api/order3/${search}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ newItem }),
      });
    } catch (error) {
      alert(`Order update failed: ${error.message}`);
    }

    setShowModal(false);
    fetchProducts(); // refresh order
  };







  const calculateFinalTotal = () => {
    if (allTemp1 && allTemp1.userInfo) {
      const result = allTemp1.userInfo.reduce(
        (acc, post) => {
          const price = post.price;
          const qty = post.quantity;
          acc.totalPrice += isNaN(price) || isNaN(qty) ? 0 : price * qty;
          acc.totalItems += isNaN(qty) ? 0 : qty;
          return acc;
        },
        { totalPrice: 0, totalItems: 0 }
      );

      return result;
    }

    return { totalPrice: 0, totalItems: 0 };
  };
  const finalTotal = calculateFinalTotal();
 


  const fetchAvailableProducts = async () => {
    const res = await fetch('/api/products');
    const data = await res.json();

    const inStock = data.filter(product => {
      if (product.type === 'single') {
        return product.stock > 0;
      }

      if (product.type === 'collection') {
        return product.color.some(c => c.qty > 0 || (c.sizes && c.sizes.some(s => s.qty > 0)));
      }

      return false;
    });

    setAllProducts(inStock);
  };


  const handleProductChange = (product) => {
    setSelectedProduct(product);
    setSelectedColor('');
    setSelectedSize('');

    if (product.type === 'collection') {
      const hasSizes = product.color[0]?.sizes;
      setAvailableColors(product.color.map(c => c.color));

      if (hasSizes) {
        // wait until color is selected to fetch sizes
        setAvailableSizes([]);
      }
    } else {
      setAvailableColors([]);
      setAvailableSizes([]);
    }
  };

  const handleColorChange = (color) => {
    setSelectedColor(color);
    const colorObj = selectedProduct.color.find(c => c.color === color);

    if (colorObj?.sizes) {
      setAvailableSizes(colorObj.sizes.map(s => s.size));
    } else {
      setAvailableSizes([]);
    }
  };




  const handleDeleteOrder = async (item, idx) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this order?");
    if (!confirmDelete) return;


    if (item.type === "single") {
      await fetch(`api/stock3`, {
        method: "PATCH",
        headers: {
          'Content-Type': 'text/plain',
        },
        body: `${item._id || item.id},${item.quantity}`,
      });

    } else if (item.type === "collection") {
      const hasSizes = item.selectedSize && item.selectedSize.length > 0;

      if (hasSizes) {
        // Case 3: Collection with color and sizes
        const payload = `${item._id || item.id},${item.quantity},${item.selectedColor},${item.selectedSize}`;
        console.log('PATCH to api/stock5 with payload:', payload);

        await fetch(`api/stock5`, {
          method: "PATCH",
          headers: {
            'Content-Type': 'application/json',
          },
          body: payload,
        });
      } else {
        // Case 2: Collection with color only (no sizes)
        const payload = `${item._id || item.id},${item.quantity},${item.selectedColor}`;
        console.log('PATCH to api/stock4 with payload:', payload);

        await fetch(`api/stock4`, {
          method: "PATCH",
          headers: {
            'Content-Type': 'application/json',
          },
          body: payload,
        });
      }
    }




    try {
      const response = await fetch(`/api/order4`, {
        method: "PATCH",
        headers: {
          'Content-Type': 'text/plain',
        },
        body: `${search},${idx}`,
      });

      if (response.ok) {
        console.log("Order deleted and stock restored");
        // Refresh orders after deletion
        window.location.replace("/order?id=" + search);
      } else {
        console.error("Failed to delete order");
      }
    } catch (error) {
      console.error("Error deleting order:", error);
    }
  };



  const handleRemarkChange = (event) => { 
  setRemark(event.target.value);
};




  return (
    <>
      <div className="bg-gray-100 h-screen py-8 text-[14px]">
        <div className="container mx-auto px-4">
          <p className="font-bold mb-4">Order #: {allTemp1?.oid}</p> 
          <p className="font-bold mb-4">Receipt #: {allTemp1?.num}</p>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="col-md-8">
              <div className="bg-white rounded-lg shadow-md p-6 mb-4">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left font-semibold">Product</th>
                      <th className="text-left font-semibold">Pic</th>
                      <th className="text-left font-semibold">Price</th>
                      <th className="text-left font-semibold">Color</th>
                      <th className="text-left font-semibold">Size</th>
                      <th className="text-left font-semibold">Quantity</th>
                      <th className="text-left font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allTemp1 && Object?.keys(allTemp1).length > 0 ? (
                      allTemp1.userInfo.map((temp, index) => (

                        <>
                          <tr>
                            <td className="py-4">
                              <div className="flex items-center">
                                <span className="font-semibold">{temp.title}</span>
                              </div>
                            </td>
                            <td className="py-4">  <img src={temp.img[0]} width={40} height={40} /></td>
                            <td className="py-4">
                              <td>
                                {(() => {
                                  const colorObj = temp.color?.find(c => c.color === temp.selectedColor);
                                  const sizeObj = colorObj?.sizes?.find(s => s.size === temp.selectedSize);
                                  const price = sizeObj?.price ?? parseFloat(temp.discount);
                                  return `$${price}`;
                                })()}
                              </td>


                            </td>
                            <td className="py-4">{temp.selectedColor}</td>
                            <td className="py-4">{temp.selectedSize}</td>

                            <td className="py-4">
                              <div className="flex items-center">
                                <span className="text-center w-8">{temp.quantity}</span>
                              </div>
                            </td>

                            <td className="py-4">
                              {allTemp1.userInfo.length > 1 && (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5 text-red-500 cursor-pointer"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  onClick={() => handleDeleteOrder(temp, index)}
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              )}
                            </td>


                          </tr>
                        </>
                      ))

                    ) : (
                      <div className='home___error-container'>
                        <h2 className='text-black text-xl dont-bold'>...</h2>

                      </div>
                    )}
                  </tbody>
                </table>
                <button
                  onClick={() => {
                    fetchAvailableProducts();
                    setShowModal(true);
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded mb-4"
                >
                  Add New Product
                </button>


              </div>
            </div>
            <div className="col-md-4">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold mb-4">Customer Details</h2>

                {allTemp1 && Object?.keys(allTemp1).length > 0 ? (
                  <>
<div className="flex justify-between mb-2">
  <span>First Name:</span>
  <input
    type="text"
    className="border p-1 w-1/2"
    value={editableData.fname}
    onChange={(e) => handleFieldChange("fname", e.target.value)}
  />
</div>
<div className="flex justify-between mb-2">
  <span>Last Name:</span>
  <input
    type="text"
    className="border p-1 w-1/2"
    value={editableData.lname}
    onChange={(e) => handleFieldChange("lname", e.target.value)}
  />
</div>


                    <div className="flex justify-between mb-2">
                      <span>Phone:</span>
                      <input
                        type="text"
                        className="border p-1 w-1/2"
                        value={editableData.phone}
                        onChange={(e) => handleFieldChange("phone", e.target.value)}
                      />
                    </div>

                    <div className="flex justify-between mb-2">
                      <span>Country:</span>
                      <span>{allTemp1.cartItems.country}</span>
                    </div>

                    <div className="flex justify-between mb-2">
                      <span>City:</span>
                      <input
                        type="text"
                        className="border p-1 w-1/2"
                        value={editableData.city}
                        onChange={(e) => handleFieldChange("city", e.target.value)}
                      />
                    </div>

                    <div className="flex justify-between mb-2">
                      <span>Address:</span>
                      <input
                        type="text"
                        className="border p-1 w-1/2"
                        value={editableData.address}
                        onChange={(e) => handleFieldChange("address", e.target.value)}
                      />
                    </div>

                    <div className="flex justify-between mb-2">
                      <span>Apt-Street:</span>
                      <input
                        type="text"
                        className="border p-1 w-1/2"
                        value={editableData.apt}
                        onChange={(e) => handleFieldChange("apt", e.target.value)}
                      />
                    </div>

                    <hr className="my-2" />

                    <div className="flex justify-between mb-2">
                      <span className="font-semibold">Total Items:</span>
                      <span className="font-semibold">{finalTotal.totalItems}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold">Code:</span>
                      <span className="font-semibold">{allTemp1.code}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold">Total Amount:</span>
                      <span className="font-semibold">${allTemp1.total}</span>
                    </div>

                    <div className="mt-4">
<textarea
  value={remark}
  onChange={handleRemarkChange}
  placeholder="Enter remark"
  className="border p-1 w-full"
/>

                      <div className="mt-2"> 
                        <button
                          onClick={handleSaveCustomerDetails}
                          className="bg-green-500 text-white p-1"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className='home___error-container'>
                    <h2 className='text-black text-xl font-bold'>...</h2>
                  </div>
                )}
              </div>
            </div>


          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-[90%] max-w-md relative">
            <button onClick={() => setShowModal(false)} className="absolute top-2 right-2 text-lg">×</button>

            <h2 className="text-lg font-bold mb-4">Add New Product</h2>

            <label>Select Product:</label>
            <select
              onChange={(e) => handleProductChange(JSON.parse(e.target.value))}
              className="w-full border p-2 mb-4"
            >
              <option value="">Choose product</option>
              {allProducts.map(p => (
                <option key={p._id} value={JSON.stringify(p)}>{p.title}</option>
              ))}
            </select>

            {availableColors.length > 0 && (
              <>
                <label>Color:</label>
                <select
                  value={selectedColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-full border p-2 mb-4"
                >
                  <option value="">Choose color</option>
                  {availableColors.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </>
            )}

            {availableSizes.length > 0 && (
              <>
                <label>Size:</label>
                <select
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  className="w-full border p-2 mb-4"
                >
                  <option value="">Choose size</option>
                  {availableSizes.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </>
            )}

            <label>Quantity:</label>
            <input
              type="number"
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="w-full border p-2 mb-4"
              min={1}
            />

            <button
              className="bg-blue-500 text-white px-4 py-2 rounded w-full"
              onClick={handleAddProduct}
            >
              Confirm Add
            </button>
          </div>
        </div>
      )}



    </>
  )
}

export default page