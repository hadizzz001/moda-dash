'use client';

import { useState, useEffect } from 'react'; 

const ManageCategory = () => {
  const [formData, setFormData] = useState({ name: '', category: ''});
  const [editFormData, setEditFormData] = useState({ id: '', name: '', category: ''});
  const [message, setMessage] = useState('');
  const [subCategories, setSubCategories] = useState([]);
  const [mainCategories, setMainCategories] = useState([]);
  const [editMode, setEditMode] = useState(false); 

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [subRes, catRes] = await Promise.all([
          fetch('/api/sub'),
          fetch('/api/category'),
        ]);

        if (subRes.ok) {
          const subData = await subRes.json();
          setSubCategories(subData);
        }

        if (catRes.ok) {
          const catData = await catRes.json();
          setMainCategories(catData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchAll();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch('/api/sub', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      setMessage('Added successfully!');
      setFormData({ name: '', category: ''});
      window.location.href = '/sub';
    } else {
      const errorData = await res.json();
      setMessage(`Error: ${errorData.error}`);
    }
  };

  const handleEdit = (category) => {
    setEditMode(true);
    setEditFormData({
      id: category.id,
      name: category.name,
      category: category.category, 
    }); 
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`/api/sub?id=${encodeURIComponent(editFormData.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editFormData.name,
          category: editFormData.category, 
        }),
      });

      if (res.ok) {
        window.location.reload();
        setEditFormData({ id: '', name: '', category: ''});
        setEditMode(false);
      } else {
        const errorData = await res.json();
        setMessage(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('An error occurred while updating.');
    }
  };

  const handleDelete = async (id) => {
    if (confirm(`Are you sure you want to delete this?`)) {
      try {
        const res = await fetch(`/api/sub?id=${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setMessage('Deleted successfully!');
          window.location.href = '/sub';
        } else {
          const errorData = await res.json();
          setMessage(`Error: ${errorData.error}`);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };


  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{editMode ? 'Edit Subcategory' : 'Add Subcategory'}</h1>
      <form onSubmit={editMode ? handleEditSubmit : handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Name</label>
          <input
            type="text"
            className="border p-2 w-full"
            value={editMode ? editFormData.name : formData.name}
            onChange={(e) =>
              editMode
                ? setEditFormData({ ...editFormData, name: e.target.value })
                : setFormData({ ...formData, name: e.target.value })
            }
            required
          />
        </div>

        <div>
          <label className="block mb-1">Category</label>
          <select
            className="border p-2 w-full"
            value={editMode ? editFormData.category : formData.category}
            onChange={(e) =>
              editMode
                ? setEditFormData({ ...editFormData, category: e.target.value })
                : setFormData({ ...formData, category: e.target.value })
            }
            required
          >
            <option value="">Select a category</option>
            {mainCategories.map((cat) => (
              <option key={cat.id || cat._id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div> 
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          {editMode ? 'Update' : 'Add'}
        </button>
      </form>

      {message && <p className="mt-4 text-green-600">{message}</p>}

      <h2 className="text-xl font-bold mt-8">All Subcategories</h2>
      <table className="table-auto border-collapse border border-gray-300 w-full mt-4">
        <thead>
          <tr>
            <th className="border border-gray-300 p-2">Name</th>
            <th className="border border-gray-300 p-2">Category</th> 
            <th className="border border-gray-300 p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {subCategories.length > 0 ? (
            subCategories.map((category) => { 
              return (
                <tr key={category.id}>
                  <td className="border border-gray-300 p-2">{category.name}</td>
                   
                  <td className="border border-gray-300 p-2 text-center">
                    <button
                      onClick={() => handleEdit(category)}
                      className="bg-yellow-500 text-white px-4 py-1 rounded mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="bg-red-500 text-white px-4 py-1 rounded"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={3} className="border border-gray-300 p-2 text-center">
                No categories found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ManageCategory;
