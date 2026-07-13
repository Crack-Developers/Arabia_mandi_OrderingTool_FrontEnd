import React, { useState } from 'react';
import { useERPStore } from '../../stores/erp.store';
import { UtensilsCrossed, Plus, CheckCircle2, XCircle, Tag } from 'lucide-react';

export const MenuManager: React.FC = () => {
  const {
    menuItems,
    categories,
    sections,
    toggleMenuItemAvailability,
    addMenuItem,
    addCategory,
    currentBranch,
  } = useERPStore();

  const branchSections =
    currentBranch?.sections && currentBranch.sections.length > 0
      ? currentBranch.sections
      : sections && sections.length > 0
      ? sections
      : [
          { _id: 'sec-1', name: 'Ground Floor - Dining Hall' },
          { _id: 'sec-2', name: 'First Floor - Bar & Lounge' },
          { _id: 'sec-3', name: 'Second Floor - Cafeteria' },
        ];

  const activeCategories =
    categories && categories.length > 0
      ? categories
      : [
          { _id: 'cat-mandi', name: 'Mandi Meat Platters' },
          { _id: 'cat-starters', name: 'Arabian Starters & Grills' },
          { _id: 'cat-desserts', name: 'Kunafa & Desserts' },
          { _id: 'cat-beverages', name: 'Beverages & Mocktails' },
        ];

  const [selectedCat, setSelectedCat] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // New item form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryName, setCategoryName] = useState(
    activeCategories[0]?.name || 'Mandi Meat Platters'
  );
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [halfPrice, setHalfPrice] = useState('450');
  const [fullPrice, setFullPrice] = useState('850');
  const [badge, setBadge] = useState('New Special');
  const [selectedSections, setSelectedSections] = useState<string[]>(['ALL']);

  const matchingCategories = activeCategories
    .filter((c) =>
      c.name.toLowerCase().includes(categoryName.trim().toLowerCase())
    )
    .slice(-5);

  const toggleSection = (sectionId: string) => {
    if (sectionId === 'ALL') {
      setSelectedSections(['ALL']);
      return;
    }
    setSelectedSections((prev) => {
      const filtered = prev.filter((s) => s !== 'ALL');
      if (filtered.includes(sectionId)) {
        const next = filtered.filter((s) => s !== sectionId);
        return next.length === 0 ? ['ALL'] : next;
      } else {
        return [...filtered, sectionId];
      }
    });
  };

  const filteredItems = menuItems.filter(
    (item) => selectedCat === 'ALL' || item.categoryId === selectedCat
  );

  const handleCreateDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !categoryName.trim()) return;

    let matchedCat = activeCategories.find(
      (c) => c.name.trim().toLowerCase() === categoryName.trim().toLowerCase()
    );

    if (!matchedCat) {
      matchedCat = await addCategory(categoryName.trim());
    }

    const effCategoryId = matchedCat?._id || activeCategories[0]?._id || 'cat-mandi';
    addMenuItem({
      name: name.trim(),
      description: description.trim(),
      categoryId: effCategoryId,
      available: true,
      active: true,
      badge: badge || undefined,
      sections: selectedSections,
      variants: [
        { name: 'Half (2 Persons)', price: parseInt(halfPrice, 10) || 450 },
        { name: 'Full (4 Persons)', price: parseInt(fullPrice, 10) || 850 },
      ],
      addons: [
        { name: 'Extra Mandi Rice', price: 160 },
        { name: 'Shattah Sauce', price: 40 },
      ],
    });
    setName('');
    setDescription('');
    setSelectedSections(['ALL']);
    setShowAddModal(false);
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-slate-100 min-h-[calc(100vh-4rem)] space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="font-extrabold text-xl text-slate-900 flex items-center gap-2">
            <UtensilsCrossed className="w-6 h-6 text-amber-600" />
            <span>Arabian Mandi – Menu & Price Manager</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Managing dishes for <strong className="text-slate-800">{currentBranch.name}</strong>. Toggle item availability instantly for reception billing.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Add New Mandi Dish</span>
        </button>
      </div>

      {/* Categories Bar */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedCat('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            selectedCat === 'ALL'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          All Categories ({menuItems.length})
        </button>
        {activeCategories.map((c) => (
          <button
            key={c._id}
            onClick={() => setSelectedCat(c._id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedCat === c._id
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Menu Cards Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 text-slate-300 text-[11px] font-bold uppercase tracking-wider">
              <th className="py-3.5 px-5">Dish Name & Description</th>
              <th className="py-3.5 px-5">Category</th>
              <th className="py-3.5 px-5">Section / KOT Routing</th>
              <th className="py-3.5 px-5">Portion Variants</th>
              <th className="py-3.5 px-5">Status</th>
              <th className="py-3.5 px-5 text-right">Instant Toggle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredItems.map((item) => {
              const catName =
                activeCategories.find((c) => c._id === item.categoryId)?.name || 'Mandi';
              const itemSections = item.sections && item.sections.length > 0 ? item.sections : ['ALL'];
              return (
                <tr key={item._id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-sm">
                        {item.name}
                      </span>
                      {item.badge && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 text-xs mt-0.5 max-w-md">
                      {item.description}
                    </p>
                  </td>
                  <td className="py-4 px-5 font-semibold text-slate-600">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                      <Tag className="w-3 h-3 text-amber-600" />
                      {catName}
                    </span>
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex flex-wrap gap-1.5">
                      {itemSections.includes('ALL') ? (
                        <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-900 font-bold text-[11px] border border-amber-500/30">
                          All Floors & Sections
                        </span>
                      ) : (
                        itemSections.map((secId) => {
                          const secObj = branchSections.find((s) => (s._id || s.name) === secId);
                          return (
                            <span
                              key={secId}
                              className="px-2 py-0.5 rounded-lg bg-slate-800 text-amber-300 font-bold text-[10px]"
                            >
                              {secObj?.name || secId}
                            </span>
                          );
                        })
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <div className="space-y-1">
                      {item.variants.map((v, i) => (
                        <div key={i} className="flex items-center justify-between gap-4 text-slate-700">
                          <span>{v.name}</span>
                          <span className="font-bold text-slate-900">₹{v.price}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    {item.available ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 font-bold text-xs border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        In Stock (Available)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/15 text-red-700 font-bold text-xs border border-red-500/30">
                        <XCircle className="w-3.5 h-3.5" />
                        Sold Out / Unavailable
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-5 text-right">
                    <button
                      onClick={() => toggleMenuItemAvailability(item._id)}
                      className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all ${
                        item.available
                          ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      {item.available ? 'Mark Out of Stock' : 'Mark Available'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add New Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-fade-in space-y-4">
            <h3 className="font-extrabold text-lg text-slate-900">Add New Mandi Dish</h3>
            <form onSubmit={handleCreateDish} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700">Dish Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Arabian Zurbian Lamb Rice"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Description</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Authentic aromatic rice cooked with slow-simmered lamb..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-700">Category Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Type category (e.g., Signature Platters)"
                    value={categoryName}
                    onChange={(e) => {
                      setCategoryName(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                  />
                  {showSuggestions && matchingCategories.length > 0 && (
                    <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-40 overflow-y-auto">
                      <div className="px-2.5 py-1 text-[10px] font-extrabold text-slate-400 bg-slate-50 uppercase tracking-wider">
                        Suggestions (Last 5)
                      </div>
                      {matchingCategories.map((c) => (
                        <button
                          key={c._id}
                          type="button"
                          onClick={() => {
                            setCategoryName(c.name);
                            setShowSuggestions(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-amber-50 hover:text-amber-900 transition-colors flex items-center justify-between border-t border-slate-100 first:border-0"
                        >
                          <span>{c.name}</span>
                          <span className="text-[10px] text-slate-400 font-normal">Pick</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">Badge (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g., Bestseller"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Section & Kitchen Routing Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Section / Kitchen Routing (Which floors or areas serve & prepare this dish?)
                </label>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toggleSection('ALL')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
                        selectedSections.includes('ALL')
                          ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{selectedSections.includes('ALL') ? '☑' : '☐'}</span>
                      <span>All Floors & Sections (Default)</span>
                    </button>

                    {branchSections.map((sec, idx) => {
                      const secKey = sec._id || sec.name || `sec-${idx}`;
                      const isSelected =
                        !selectedSections.includes('ALL') &&
                        selectedSections.includes(secKey);
                      return (
                        <button
                          type="button"
                          key={secKey}
                          onClick={() => toggleSection(secKey)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
                            isSelected
                              ? 'bg-amber-500/20 text-amber-900 border-amber-500 font-extrabold'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span>{isSelected ? '☑' : '☐'}</span>
                          <span>{sec.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    {selectedSections.includes('ALL')
                      ? '✓ Available across all floors (Ground Dining Hall, 1st Floor Bar, 2nd Floor Cafeteria).'
                      : `✓ Assigned to ${selectedSections.length} specific section(s). KOT will route only to the associated kitchen/bar printer.`}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Half Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={halfPrice}
                    onChange={(e) => setHalfPrice(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">Full Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={fullPrice}
                    onChange={(e) => setFullPrice(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-md"
                >
                  Save Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
