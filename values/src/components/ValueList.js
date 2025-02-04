"use client";

import React, { useState, useEffect } from 'react';
import { ArrowUpDown, Edit, Trash, Plus } from 'lucide-react';

// Simulating backend API calls
const fetchKnives = async () => {
  const response = await fetch("/api/knives", {
    method: 'GET',
    credentials: 'same-origin', // Send cookies for session management
  });
  if (!response.ok) {
    throw new Error('Failed to fetch knives');
  }
  return await response.json();
};

const saveKnives = async (knives) => {
  await fetch("/api/save-knives", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: 'same-origin', // Send cookies for session management
    body: JSON.stringify(knives),
  });
};

const logout = async () => {
  await fetch("/api/logout", {
    method: 'POST',
    credentials: 'same-origin',
  });
};

const ValueList = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [showAddEdit, setShowAddEdit] = useState(false);
  const [editingKnife, setEditingKnife] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    image: '',
    obtainMethod: '',
    rarity: '',
    demand: '',
    value: ''
  });
  const [knives, setKnives] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Check auth status first
    fetch('/api/auth-status', {
      credentials: 'same-origin'
    })
      .then(res => res.json())
      .then(data => {
        setIsAdmin(data.isAuthenticated);
      })
      .catch(err => console.error('Auth check failed:', err));
  
    // Fetch knives
    fetchKnives()
      .then(setKnives)
      .catch(err => {
        console.error('Failed to load knives:', err);
        setKnives([]); // Set empty array on error
      });
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginData),
      credentials: 'same-origin', // Send cookies for session management
    });

    if (response.ok) {
      setIsAdmin(true);
      setShowLogin(false);
    } else {
      alert('Invalid credentials');
    }
  };

  const handleLogout = async () => {
    await logout();
    setIsAdmin(false);
    setLoginData({ username: '', password: '' });
  };

  const handleAddEdit = async (e) => {
    e.preventDefault();
    let updatedKnives;

    if (editingKnife) {
      updatedKnives = knives.map(knife =>
        knife.id === editingKnife.id ? { ...formData, id: knife.id } : knife
      );
    } else {
      updatedKnives = [...knives, { ...formData, id: knives.length + 1 }];
    }

    setKnives(updatedKnives);
    setShowAddEdit(false);
    setEditingKnife(null);
    setFormData({ name: '', image: '', obtainMethod: '', rarity: '', demand: '', value: '' });

    // Save updated knives to the backend
    await saveKnives(updatedKnives);
  };

  const handleDelete = async (knifeId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      const updatedKnives = knives.filter(knife => knife.id !== knifeId);
      setKnives(updatedKnives);
      await saveKnives(updatedKnives);
    }
  };

  const handleEdit = (knife) => {
    setEditingKnife(knife);
    setFormData(knife);
    setShowAddEdit(true);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });

    const sortedKnives = [...knives].sort((a, b) => {
      if (key === 'value') {
        return direction === 'asc' ? a[key] - b[key] : b[key] - a[key];
      }
      if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    setKnives(sortedKnives);
  };

  const filteredKnives = knives.filter(knife =>
    knife.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    knife.rarity.toLowerCase().includes(searchTerm.toLowerCase()) ||
    knife.obtainMethod.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRarityColor = (rarity) => {
    const colors = {
      'Basic': 'text-gray-900',
      'Common': 'text-green-500',
      'Rare': 'text-blue-500',
      'Legendary': 'text-purple-500',
      'Exotic': 'text-orange-500',
      'Mythic': 'text-red-500',
      'Dream': 'text-blue-300',
      'Custom': 'text-gray-900'
    };
    return colors[rarity] || 'text-gray-900';
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Assassin Knife Database</h1>
        {isAdmin ? (
          <div className="flex gap-4">
            <button onClick={() => { setEditingKnife(null); setFormData({ name: '', image: '', obtainMethod: '', rarity: '', demand: '', value: '' }); setShowAddEdit(true); }} className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
              <Plus size={20} /> Add Knife
            </button>
            <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">Logout</button>
          </div>
        ) : (
          <button onClick={() => setShowLogin(true)} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Admin Login</button>
        )}
      </div>

      {/* Admin login modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-2xl font-bold mb-4">Admin Login</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block mb-1">Username</label>
                <input type="text" value={loginData.username} onChange={(e) => setLoginData({ ...loginData, username: e.target.value })} className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block mb-1">Password</label>
                <input type="password" value={loginData.password} onChange={(e) => setLoginData({ ...loginData, password: e.target.value })} className="w-full px-3 py-2 border rounded" />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Login</button>
                <button type="button" onClick={() => setShowLogin(false)} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Knife form */}
      {showAddEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-2xl font-bold mb-4">{editingKnife ? 'Edit Knife' : 'Add New Knife'}</h2>
            <form onSubmit={handleAddEdit} className="space-y-4">
              <div>
                <label className="block mb-1">Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border rounded" required />
              </div>
              <div>
                <label className="block mb-1">Image URL</label>
                <input type="text" value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} className="w-full px-3 py-2 border rounded" required />
              </div>
              <div>
                <label className="block mb-1">Obtain Method</label>
                <input type="text" value={formData.obtainMethod} onChange={(e) => setFormData({ ...formData, obtainMethod: e.target.value })} className="w-full px-3 py-2 border rounded" required />
              </div>
              <div>
                <label className="block mb-1">Rarity</label>
                <select value={formData.rarity} onChange={(e) => setFormData({ ...formData, rarity: e.target.value })} className="w-full px-3 py-2 border rounded" required>
                  <option value="">Select Rarity</option>
                  <option value="Basic">Basic</option>
                  <option value="Common">Common</option>
                  <option value="Rare">Rare</option>
                  <option value="Legendary">Legendary</option>
                  <option value="Exotic">Exotic</option>
                  <option value="Mythic">Mythic</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>
              <div>
                <label className="block mb-1">Demand</label>
                <select value={formData.demand} onChange={(e) => setFormData({ ...formData, demand: e.target.value })} className="w-full px-3 py-2 border rounded" required>
                  <option value="">Select Demand</option>
                  <option value="Very Low">Very Low</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Very High">Very High</option>
                </select>
              </div>
              <div>
                <label className="block mb-1">Value</label>
                <input type="number" value={formData.value} onChange={(e) => setFormData({ ...formData, value: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded" required />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">{editingKnife ? 'Save Changes' : 'Add Knife'}</button>
                <button type="button" onClick={() => { setShowAddEdit(false); setEditingKnife(null); setFormData({ name: '', image: '', obtainMethod: '', rarity: '', demand: '', value: '' }); }} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="mb-6">
        <input type="text" placeholder="Search knives..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full max-w-sm px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {/* Knife Table */}
      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('name')}>
                <div className="flex items-center">Name<ArrowUpDown className="ml-2 h-4 w-4" /></div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('obtainMethod')}>
                <div className="flex items-center">Obtain Method<ArrowUpDown className="ml-2 h-4 w-4" /></div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('rarity')}>
                <div className="flex items-center">Rarity<ArrowUpDown className="ml-2 h-4 w-4" /></div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('demand')}>
                <div className="flex items-center">Demand<ArrowUpDown className="ml-2 h-4 w-4" /></div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('value')}>
                <div className="flex items-center">Value<ArrowUpDown className="ml-2 h-4 w-4" /></div>
              </th>
              {isAdmin && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredKnives.map((knife) => (
              <tr key={knife.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <img src={knife.image} alt={knife.name} className="w-12 h-12 object-cover rounded" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-medium">{knife.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{knife.obtainMethod}</td>
                <td className={`px-6 py-4 whitespace-nowrap ${getRarityColor(knife.rarity)}`}>{knife.rarity}</td>
                <td className="px-6 py-4 whitespace-nowrap">{knife.demand}</td>
                <td className="px-6 py-4 whitespace-nowrap">{knife.value}</td>
                {isAdmin && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(knife)} className="text-blue-600 hover:text-blue-900"><Edit size={20} /></button>
                      <button onClick={() => handleDelete(knife.id)} className="text-red-600 hover:text-red-900"><Trash size={20} /></button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ValueList;