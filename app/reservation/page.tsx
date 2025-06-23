"use client"; 
import ExportButton from "../components/ExportExcel";
import { useState, useEffect } from "react"; 

const Page = () => {
  const [allTemp, setTemp] = useState<any[]>([]);
  const [updatedNums, setUpdatedNums] = useState({});
  const [submittedPosts, setSubmittedPosts] = useState({});
  const [filterClientName, setFilterClientName] = useState("");
  const [filterReceiptNum, setFilterReceiptNum] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [totals, setTotals] = useState({});

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

    const dateInRange = (!from || postDate >= from) && (!to || postDate <= to);
    return clientMatch && receiptMatch && dateInRange;
  });

  useEffect(() => {
    const storedSubmittedPosts = JSON.parse(localStorage.getItem("submittedPosts")) || {};
    setSubmittedPosts(storedSubmittedPosts);
  }, []);

  const handleInputChange = (id, value) => {
    setUpdatedNums((prev) => ({ ...prev, [id]: value }));
  };

  const handleUpdate = async (id) => {
    const numToUpdate = updatedNums[id];
    if (!numToUpdate) return;

    try {
      const response = await fetch(`/api/order1/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ num: numToUpdate }),
      });

      const result = await response.json();

      if (response.ok) {
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

  const fetchProducts = async () => {
    const response = await fetch("/api/order");
    if (response.ok) {
      const data = await response.json();
      setTemp(data);
    } else {
      console.error("Failed to fetch products");
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handlePaymentUpdate = async (id) => {
    try {
      const response = await fetch(`/api/order/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paid: true }),
      });

      if (response.ok) {
        setTemp((prev) =>
          prev.map((order) => (order.id === id ? { ...order, paid: true } : order))
        );
      }
    } catch (error) {
      console.error("Error updating payment:", error);
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
        setTemp((prev) =>
          prev.map((order) => (order.id === id ? { ...order, fulfillment: true } : order))
        );
      }
    } catch (error) {
      console.error("Error updating fulfillment:", error);
    }
  };

  const handleDeleteOrder = async (id) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;

    let data;
    try {
      const response = await fetch(`/api/order/${id}`, { method: "GET" });
      if (response.ok) {
        data = await response.json();
      } else {
        console.error("Failed to get order");
      }
    } catch (error) {
      console.error("Error getting order:", error);
    }

    if (Array.isArray(data?.userInfo)) {
      for (const item of data.userInfo) {
        if (item.type === "single") {
          await fetch(`api/stock3`, {
            method: "PATCH",
            headers: { "Content-Type": "text/plain" },
            body: `${item._id || item.id},${item.quantity}`,
          });
        } else if (item.type === "collection") {
          const hasSizes = item.selectedSize && item.selectedSize.length > 0;

          if (hasSizes) {
            const payload = `${item._id || item.id},${item.quantity},${item.selectedColor},${item.selectedSize}`;
            await fetch(`api/stock5`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: payload,
            });
          } else {
            const payload = `${item._id || item.id},${item.quantity},${item.selectedColor}`;
            await fetch(`api/stock4`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
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
        window.location.replace("/reservation");
      } else {
        console.error("Failed to delete order");
      }
    } catch (error) {
      console.error("Error deleting order:", error);
    }
  };

const calculateOrderTotal = async (order) => {
  let orderTotal = 0;

  for (const item of order.userInfo) {
    let price = 0;

    if (item.type === "single" || (item.type === "collection" && !item.selectedSize)) {
      // Single type or collection without size (flat price)
      price = parseFloat(item.price);
    } else if (item.type === "collection" && item.selectedColor && item.selectedSize) {
      // Collection with size: find price based on selectedColor and selectedSize
      const selectedColor = item.color?.find(c => c.color === item.selectedColor);
      const selectedSize = selectedColor?.sizes?.find(s => s.size === item.selectedSize);
      price = parseFloat(selectedSize?.price || "0");
    }

    const qty = parseInt(item.quantity || 1, 10);
    orderTotal += price * qty;
  }

  const delivery = parseFloat(order.delivery || "0");
  orderTotal += delivery;

  let discountPercent = 0;

  if (order.code) {
    try {
      const res = await fetch(`/api/offer/${order.code}`);
      const data = await res.json();
      discountPercent = data?.per || 0;
    } catch (err) {
      console.error("Discount API failed", err);
    }
  }

  const discountAmount = (orderTotal * discountPercent) / 100;
  return (orderTotal - discountAmount).toFixed(2);
};


  useEffect(() => {
    const fetchTotals = async () => {
      if (!Array.isArray(allTemp)) return;
      const result = {};
      for (const order of allTemp) {
        const total = await calculateOrderTotal(order);
        result[order.oid] = total;
      }
      setTotals(result);
    };

    fetchTotals();
  }, [allTemp]);

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

      <table className="table table-striped">
        <thead>
          <tr>
            <th>Order #</th>
            <th>Receipt #</th>
            <th>Image</th>
            <th>Client Name</th>
            <th>Total Amount</th>
            <th>Total Items</th>
            <th>Code</th>
            <th>Date</th>
            <th>Action</th>
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
                  <img src={post.userInfo[0]?.img[0]} width={40} height={40} />
                </td>
                <td>{post.cartItems?.fname}</td>
                <td>{totals[post.oid] ? `$${totals[post.oid]}` : "Calculating..."}</td>
                <td>
                  {post.userInfo?.reduce(
                    (acc, item) => acc + (isNaN(item.quantity) ? 0 : Number(item.quantity)),
                    0
                  )}
                </td>
                <td>{post.code}</td>
                <td>{post.date}</td>
                <td className="flex space-x-2">
                  <a
                    className="text-blue-700 bg-black p-1 w-14 h-8 flex items-center justify-center"
                    href={`/order?id=${post.id}`}
                  >
                    View
                  </a>
                  <button
                    onClick={() => handleDeleteOrder(post.id)}
                    className="bg-red-500 text-white p-1 w-14 h-8"
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
              <td colSpan={9} className="text-center">
                No matching records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Page;
