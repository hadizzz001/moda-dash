
"use client"
import Link from "next/link";
import ExportButton from "../components/ExportExcel";
import { useState, useEffect } from "react";
import { redirect, useRouter } from 'next/navigation';





const page = () => {
  const [allTemp, setTemp] = useState<any>()
  const [updatedNums, setUpdatedNums] = useState({});
  const [submittedPosts, setSubmittedPosts] = useState({});
  const [filterClientName, setFilterClientName] = useState("");
  const [filterReceiptNum, setFilterReceiptNum] = useState("");
  const [fromDate, setFromDate] = useState('');
const [toDate, setToDate] = useState('');


const filteredData = allTemp?.filter((post) => {
  const clientMatch = filterClientName
    ? post.cartItems?.fname?.toLowerCase().includes(filterClientName.toLowerCase())
    : true;

  const receiptMatch = filterReceiptNum
    ? post.num?.toLowerCase().includes(filterReceiptNum.toLowerCase())
    : true;

  const postDate = new Date(post.date);
  const from = fromDate ? new Date(fromDate) : null;
  const to = toDate ? new Date(toDate) : null;

  const dateInRange =
    (!from || postDate >= from) &&
    (!to || postDate <= to);

  return clientMatch && receiptMatch && dateInRange;
});



console.log("filteredData", filteredData);



  // Load submitted state from localStorage on mount
  useEffect(() => {
    const storedSubmittedPosts = JSON.parse(localStorage.getItem("submittedPosts")) || {};
    setSubmittedPosts(storedSubmittedPosts);
  }, []);

  const handleInputChange = (id, value) => {
    setUpdatedNums((prev) => ({ ...prev, [id]: value }));
  };

  const handleUpdate = async (id) => {
    const numToUpdate = updatedNums[id]; // Get the updated number

    if (!numToUpdate) return; // Prevent empty submission

    try {
      const response = await fetch(`/api/order1/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ num: numToUpdate }),
      });

      const result = await response.json();

      if (response.ok) {
        console.log("Receipt number updated:", result);

        // Update state and save to localStorage
        setSubmittedPosts((prev) => {
          const updatedState = { ...prev, [id]: true };
          localStorage.setItem("submittedPosts", JSON.stringify(updatedState));
          return updatedState;
        });
      } else {
        console.error("Failed to update receipt number:", result);
      }
    } catch (error) {
      console.error("Error updating receipt number:", error);
    }
  };





  // Fetch products and categories on load
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const response = await fetch('/api/order');
    if (response.ok) {
      const data = await response.json();
      setTemp(data);
    } else {
      console.error('Failed to fetch products');
    }
  };




  const handlePaymentUpdate = async (id) => {
    try {
      const response = await fetch(`/api/order/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paid: true }),
      });

      if (response.ok) {
        setTemp((prevOrders) =>
          prevOrders.map((order) =>
            order.id === id ? { ...order, paid: true } : order
          )
        );
      } else {
        console.error("Failed to update payment status.");
      }
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  const handlePaymentUpdate1 = async (id) => {
    try {
      const response = await fetch(`/api/order/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fulfillment: true }),
      });

      if (response.ok) {
        setTemp((prevOrders) =>
          prevOrders.map((order) =>
            order.id === id ? { ...order, fulfillment: true } : order
          )
        );
      } else {
        console.error("Failed to update fulfillment status.");
      }
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };






  const handleDeleteOrder = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this order?");
    if (!confirmDelete) return; // If user clicks Cancel, stop the function

    let data

    try {
      const response = await fetch(`/api/order/${id}`, {
        method: "GET",
      });

      if (response.ok) {
        data = await response.json(); // Parse the response JSON
        console.log("Order data:", data);   // Log the data
      } else {
        console.error("Failed to get order");
      }
    } catch (error) {
      console.error("Error get order:", error);
    }







    if (Array.isArray(data.userInfo)) {
      for (const item of data.userInfo) {


        if (item.type === "single") {
          // Case 1: Single product, no colors or sizes
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


      }

    } 

    try {
      const response = await fetch(`/api/order/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        console.log("Order deleted and stock restored");
        // Refresh orders after deletion
        window.location.replace("/reservation");
      } else {
        console.error("Failed to delete order");
      }
    } catch (error) {
      console.error("Error deleting order:", error);
    }
  };




  return (
    <div className="container text-[12px]">
      <div className="flex justify-end items-center space-x-2 mb-4">
        <input
          type="text"
          value={filterClientName}
          onChange={(e) => setFilterClientName(e.target.value)}
          placeholder="Filter by Client Name"
          className="border p-1 text-xs"
        />
        <input
          type="text"
          value={filterReceiptNum}
          onChange={(e) => setFilterReceiptNum(e.target.value)}
          placeholder="Filter by Receipt #"
          className="border p-1 text-xs"
        />
        <input
  type="date"
  value={fromDate}
  onChange={(e) => setFromDate(e.target.value)}
  className="border p-1 text-xs"
/>
<input
  type="date"
  value={toDate}
  onChange={(e) => setToDate(e.target.value)}
  className="border p-1 text-xs"
/>

        <div className="text-xs">
          <ExportButton allTemp={allTemp} />
        </div>
      </div>
      <table className="table table-striped ">
        <thead>
          <tr>
            <th scope="col">Order #</th>
            <th scope="col">Receipt #</th>
            <th scope="col">Image</th>
            <th scope="col">Client Name</th>
            <th scope="col">Total Amount</th>
            <th scope="col">Total Items</th>
            <th scope="col">Code</th>
            <th scope="col">Date</th>
            <th scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredData?.length > 0 ? (
            filteredData.map((post) => (
              <tr key={post.id}>
                <td>{post.oid}</td>
                <td>
                  {submittedPosts[post.id] ? (
                    <p>{updatedNums[post.id] || post.num}</p>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={updatedNums[post.id] || post.num || ""}
                        onChange={(e) => handleInputChange(post.id, e.target.value)}
                        placeholder="Enter receipt number"
                        className="border p-1"
                      />
                      <button
                        onClick={() => handleUpdate(post.id)}
                        className="bg-blue-500 text-white p-1 ml-2"
                      >
                        Submit
                      </button>
                    </>
                  )}
                </td>

                <td>
                  <img src={post.userInfo[0].img[0]} width={40} height={40} />
                </td>
                <td>{post.cartItems.fname}</td>
                <td>${post.total}</td>
                <td>
                  {post.userInfo?.reduce(
                    (acc, item) =>
                      acc + (isNaN(item.quantity) ? 0 : Number(item.quantity)),
                    0
                  )}
                </td>
                <td>{post.code}</td>
                <td>{post.date}</td>
<td className="flex space-x-2">
  <a
    className="text-blue-700 bg-black p-1 w-14 h-8 flex items-center justify-center "
    href={`/order?id=${post.id}`}
  >
    View
  </a>
  <button
    onClick={() => handleDeleteOrder(post.id)}
    className="bg-red-500 text-white p-1 w-14 h-8 "
  >
    Delete
  </button>
  <button
    className={`p-1 w-14 h-8 ${post.paid ? "bg-blue-500 text-white" : "bg-black text-white"}`}
    onClick={() => !post.paid && handlePaymentUpdate(post.id)}
    disabled={post.paid}
  >
    {post.paid ? "Paid" : "Unpaid"}
  </button>
  <button
    className={`p-1 w-20 h-8 ${post.fulfillment ? "bg-blue-500 text-white" : "bg-black text-white"}`}
    onClick={() => !post.fulfillment && handlePaymentUpdate1(post.id)}
    disabled={post.fulfillment}
  >
    {post.fulfillment ? "Fulfilled" : "Unfulfilled"}
  </button>
</td>

              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={8} className="text-center">
                No matching records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>

  )
}

export default page