
import React, { useState, useEffect, useMemo } from 'react';
import { PackingList, Holiday, AppView, PackingItem, CategoryDef } from './types';
import { INITIAL_CATEGORIES, AVAILABLE_ICONS, COLOR_OPTIONS } from './constants';
import { generatePackingSuggestions } from './services/geminiService';

const generateId = () => Math.random().toString(36).substring(2, 11);

const App: React.FC = () => {
  const [lists, setLists] = useState<PackingList[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [categories, setCategories] = useState<CategoryDef[]>([]);
  const [view, setView] = useState<AppView>('dashboard');
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [multiSelect, setMultiSelect] = useState<Set<string>>(new Set());
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showAddHolidayModal, setShowAddHolidayModal] = useState(false);
  const [showAddTemplateModal, setShowAddTemplateModal] = useState(false);
  const [showCatEditModal, setShowCatEditModal] = useState<CategoryDef | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategoryId, setNewItemCategoryId] = useState<string>('');

  useEffect(() => {
    const savedLists = localStorage.getItem('pp_lists');
    const savedHolidays = localStorage.getItem('pp_holidays');
    const savedCats = localStorage.getItem('pp_categories');
    
    if (savedLists) setLists(JSON.parse(savedLists));
    if (savedHolidays) setHolidays(JSON.parse(savedHolidays));
    if (savedCats) {
      setCategories(JSON.parse(savedCats));
    } else {
      setCategories(INITIAL_CATEGORIES);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('pp_lists', JSON.stringify(lists));
    localStorage.setItem('pp_holidays', JSON.stringify(holidays));
    localStorage.setItem('pp_categories', JSON.stringify(categories));
  }, [lists, holidays, categories]);

  useEffect(() => {
    if (categories.length > 0 && !newItemCategoryId) {
      setNewItemCategoryId(categories[0].id);
    }
  }, [categories, newItemCategoryId]);

  const templates = useMemo(() => lists.filter(l => l.isTemplate), [lists]);
  const activeList = useMemo(() => lists.find(l => l.id === activeListId), [lists, activeListId]);
  const activeHoliday = useMemo(() => holidays.find(h => h.listId === activeListId), [holidays, activeListId]);

  const progress = useMemo(() => {
    if (!activeList || activeList.items.length === 0) return 0;
    const packed = activeList.items.filter(i => i.isPacked).length;
    return Math.round((packed / activeList.items.length) * 100);
  }, [activeList]);

  const handleCreateHoliday = (name: string, templateId?: string) => {
    const newListId = generateId();
    let initialItems: PackingItem[] = [];
    if (templateId) {
      const sourceTemplate = lists.find(l => l.id === templateId);
      if (sourceTemplate) {
        initialItems = sourceTemplate.items.map(i => ({ ...i, id: generateId(), isPacked: false, image: undefined }));
      }
    }
    const newList: PackingList = { id: newListId, name: `${name} Packing List`, items: initialItems, isTemplate: false, createdAt: Date.now() };
    const newHoliday: Holiday = { id: generateId(), name, listId: newListId };
    setLists(prev => [newList, ...prev]);
    setHolidays(prev => [newHoliday, ...prev]);
    setActiveListId(newListId);
    setView('list-detail');
  };

  const addItemToActiveList = (item: Partial<PackingItem>) => {
    if (!activeListId) return;
    const newItem: PackingItem = {
      id: generateId(),
      name: item.name || 'New Item',
      categoryId: item.categoryId || categories[0]?.id || 'cat_other',
      isPacked: false,
      ...item
    };
    setLists(prev => prev.map(l => l.id === activeListId ? { ...l, items: [...l.items, newItem] } : l));
    setNewItemName('');
  };

  const addItemToMainList = (item: PackingItem, templateId: string) => {
    const templateItem = { ...item, id: generateId(), isPacked: false };
    setLists(prev => prev.map(l => l.id === templateId ? { ...l, items: [...l.items, templateItem] } : l));
  };

  const toggleItemPacked = (itemId: string) => {
    setLists(prev => prev.map(l => l.id === activeListId ? {
      ...l,
      items: l.items.map(i => i.id === itemId ? { ...i, isPacked: !i.isPacked } : i)
    } : l));
  };

  const deleteItem = (itemId: string) => {
    setLists(prev => prev.map(l => l.id === activeListId ? {
      ...l,
      items: l.items.filter(i => i.id !== itemId)
    } : l));
  };

  const deleteSelectedItems = () => {
    setLists(prev => prev.map(l => l.id === activeListId ? { ...l, items: l.items.filter(i => !multiSelect.has(i.id)) } : l));
    setMultiSelect(new Set());
    setIsEditing(false);
  };

  const handleImageUpload = (itemId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLists(prev => prev.map(l => l.id === activeListId ? { ...l, items: l.items.map(i => i.id === itemId ? { ...i, image: reader.result as string } : i) } : l));
      };
      reader.readAsDataURL(file);
    }
  };

  const deleteList = (listId: string) => {
    setLists(prev => prev.filter(l => l.id !== listId));
    setHolidays(prev => prev.filter(h => h.listId !== listId));
    if (activeListId === listId) { setView('dashboard'); setActiveListId(null); }
  };

  const handleSaveCategory = (cat: CategoryDef) => {
    if (categories.some(c => c.id === cat.id)) {
      setCategories(prev => prev.map(c => c.id === cat.id ? cat : c));
    } else {
      setCategories(prev => [...prev, cat]);
    }
    setShowCatEditModal(null);
  };

  const deleteCategory = (id: string) => {
    if (categories.length <= 1) return;
    setCategories(prev => prev.filter(c => c.id !== id));
    const fallbackId = categories.find(c => c.id !== id)?.id || 'cat_other';
    setLists(prev => prev.map(l => ({
      ...l,
      items: l.items.map(i => i.categoryId === id ? { ...i, categoryId: fallbackId } : i)
    })));
  };

  // --- Views ---

  const CategoriesView = () => (
    <div className="p-4 md:p-8 space-y-8 max-w-4xl mx-auto pb-20 safe-area-inset-top">
      <header className="flex items-center justify-between">
        <button onClick={() => setView('dashboard')} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
          <i className="fa-solid fa-chevron-left text-xl"></i>
        </button>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Categories</h1>
        <button 
          onClick={() => setShowCatEditModal({ id: generateId(), name: '', icon: 'fa-box', colorClass: COLOR_OPTIONS[0] })}
          className="bg-indigo-600 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
        >
          <i className="fa-solid fa-plus"></i>
        </button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {categories.map(cat => (
          <div key={cat.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg ${cat.colorClass}`}>
                <i className={`fa-solid ${cat.icon}`}></i>
              </div>
              <span className="font-bold text-slate-800">{cat.name}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowCatEditModal(cat)} className="w-10 h-10 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-indigo-600 transition-all flex items-center justify-center">
                <i className="fa-solid fa-pen"></i>
              </button>
              <button onClick={() => deleteCategory(cat.id)} className="w-10 h-10 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all flex items-center justify-center">
                <i className="fa-regular fa-trash-can"></i>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const Dashboard = () => (
    <div className="p-4 md:p-8 space-y-10 max-w-5xl mx-auto pb-32 safe-area-inset-top">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">PackPerfect</h1>
          <p className="text-slate-500 font-medium">Smart packing assistant.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setView('categories')} className="bg-white border border-slate-200 text-slate-600 w-12 h-12 rounded-2xl transition-all flex items-center justify-center hover:bg-slate-50">
            <i className="fa-solid fa-tags"></i>
          </button>
          <button onClick={() => setShowAddHolidayModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white w-12 h-12 rounded-2xl shadow-lg transition-all flex items-center justify-center">
            <i className="fa-solid fa-plane-departure"></i>
          </button>
        </div>
      </header>

      <section className="space-y-4">
        <div className="flex justify-between items-end">
          <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Master Lists</h2>
          <button onClick={() => setShowAddTemplateModal(true)} className="text-indigo-600 font-black text-xs hover:underline uppercase tracking-wider">
            + New Template
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {templates.map(tpl => (
            <div key={tpl.id} onClick={() => { setActiveListId(tpl.id); setView('list-detail'); }} className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm hover:shadow-lg transition-all cursor-pointer group">
              <div className="flex justify-between items-start mb-3">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-lg">
                  <i className="fa-solid fa-layer-group"></i>
                </div>
                <button onClick={(e) => { e.stopPropagation(); deleteList(tpl.id); }} className="text-slate-300 hover:text-red-500 p-1"><i className="fa-regular fa-trash-can"></i></button>
              </div>
              <h3 className="font-black text-slate-800 text-sm line-clamp-2">{tpl.name}</h3>
              <p className="text-slate-400 text-[10px] mt-1 font-bold uppercase tracking-widest">{tpl.items.length} Items</p>
            </div>
          ))}
          {templates.length === 0 && (
             <button onClick={() => setShowAddTemplateModal(true)} className="col-span-2 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-6 flex flex-col items-center justify-center text-slate-400 transition-all">
                <i className="fa-solid fa-plus-circle text-xl mb-2"></i>
                <span className="font-bold text-xs uppercase tracking-wide">Create Master Template</span>
             </button>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Upcoming Trips</h2>
        <div className="grid grid-cols-1 gap-4">
          {holidays.map(holiday => {
            const list = lists.find(l => l.id === holiday.listId);
            const itemsDone = list?.items.filter(i => i.isPacked).length || 0;
            const itemsTotal = list?.items.length || 0;
            const itemProgress = itemsTotal > 0 ? (itemsDone / itemsTotal) * 100 : 0;
            return (
              <div key={holiday.id} onClick={() => { setActiveListId(holiday.listId); setView('list-detail'); }} className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 cursor-pointer hover:shadow-xl transition-all relative group overflow-hidden">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1">
                    <h3 className="text-xl font-black text-slate-800 line-clamp-1">{holiday.name}</h3>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-0.5">{itemsTotal} Items Total</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); deleteList(holiday.listId); }} className="text-slate-300 hover:text-red-500 p-2 transition-colors"><i className="fa-regular fa-trash-can text-lg"></i></button>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    <span>{itemsDone} of {itemsTotal} packed</span>
                    <span>{Math.round(itemProgress)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-1000 ${itemProgress === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`} style={{ width: `${itemProgress}%` }}></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Primary Mobile CTA */}
      <div className="fixed bottom-6 left-6 right-6 safe-area-inset-bottom">
         <button onClick={() => setShowAddHolidayModal(true)} className="w-full bg-indigo-600 text-white py-4 rounded-[24px] font-black shadow-2xl shadow-indigo-200 uppercase tracking-widest text-sm flex items-center justify-center gap-3">
           <i className="fa-solid fa-plus"></i> New Adventure
         </button>
      </div>
    </div>
  );

  const ListDetail = () => {
    if (!activeList) return null;
    return (
      <div className="pb-40 min-h-screen bg-slate-50 safe-area-inset-bottom">
        <nav className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-slate-100 p-4 safe-area-inset-top">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button onClick={() => { setView('dashboard'); setIsEditing(false); setMultiSelect(new Set()); }} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
              <i className="fa-solid fa-chevron-left text-xl"></i>
            </button>
            <div className="text-center px-4 flex-1">
              <h2 className="text-base font-black truncate text-slate-900 tracking-tight">{activeHoliday?.name || activeList.name}</h2>
              {activeList.isTemplate && <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest block bg-amber-50 rounded-full px-2 py-0.5 mt-0.5 mx-auto w-fit">Master Template</span>}
            </div>
            <button onClick={() => setIsEditing(!isEditing)} className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center ${isEditing ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
              <i className={isEditing ? 'fa-solid fa-check text-base' : 'fa-solid fa-pen-to-square'}></i>
            </button>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto p-4 space-y-10 mt-2">
          {categories.map(cat => {
            const items = activeList.items.filter(i => i.categoryId === cat.id);
            if (items.length === 0 && !isEditing) return null;
            return (
              <section key={cat.id} className="space-y-4">
                <header className="flex items-center gap-3 bg-slate-50/80 py-2 sticky top-[80px] z-10">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-sm ${cat.colorClass}`}>
                    <i className={`fa-solid ${cat.icon} text-xs`}></i>
                  </div>
                  <h3 className="font-black text-slate-900 uppercase tracking-wider text-[10px]">{cat.name}</h3>
                  <div className="h-[1px] flex-1 bg-slate-200"></div>
                  <span className="text-[9px] font-black text-slate-400">{items.length}</span>
                </header>

                <div className="grid grid-cols-1 gap-2.5">
                  {items.map(item => (
                    <div key={item.id} className={`flex items-center gap-3 p-4 rounded-[24px] transition-all ${item.isPacked ? 'bg-emerald-50/40 opacity-60' : 'bg-white shadow-sm border border-slate-100'}`}>
                      {isEditing ? (
                        <input type="checkbox" checked={multiSelect.has(item.id)} onChange={() => { const newSet = new Set(multiSelect); if (newSet.has(item.id)) newSet.delete(item.id); else newSet.add(item.id); setMultiSelect(newSet); }} className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 cursor-pointer" />
                      ) : (
                        <button disabled={activeList.isTemplate} onClick={() => toggleItemPacked(item.id)} className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${item.isPacked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 bg-white'} ${activeList.isTemplate ? 'opacity-20' : ''}`}>
                          {item.isPacked && <i className="fa-solid fa-check text-[10px]"></i>}
                        </button>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className={`text-slate-800 font-bold block truncate text-base ${item.isPacked ? 'line-through text-slate-400' : ''}`}>{item.name}</span>
                        {item.image && (
                          <div className="mt-3 relative inline-block">
                            <img src={item.image} alt={item.name} className="h-24 w-24 object-cover rounded-[20px] border-2 border-white shadow-lg" />
                            {isEditing && (
                              <button onClick={() => setLists(prev => prev.map(l => l.id === activeListId ? { ...l, items: l.items.map(i => i.id === item.id ? { ...i, image: undefined } : i) } : l))} className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] shadow-lg ring-2 ring-white"><i className="fa-solid fa-xmark"></i></button>
                            )}
                          </div>
                        )}
                      </div>
                      {isEditing && (
                        <div className="flex items-center gap-0.5">
                          <label className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-indigo-600"><i className="fa-solid fa-camera text-sm"></i><input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(item.id, e)} /></label>
                          {!activeList.isTemplate && templates.length > 0 && <button onClick={() => addItemToMainList(item, templates[0].id)} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-amber-500"><i className="fa-solid fa-cloud-arrow-up text-sm"></i></button>}
                          <button onClick={() => deleteItem(item.id)} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500"><i className="fa-regular fa-trash-can text-sm"></i></button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* Dynamic Mobile Footer Input */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent z-30 safe-area-inset-bottom">
          <div className="max-w-4xl mx-auto">
            {isEditing && multiSelect.size > 0 ? (
              <div className="bg-slate-900 text-white p-4 rounded-[28px] flex items-center justify-between shadow-2xl border border-white/10">
                <span className="font-bold text-sm ml-2">{multiSelect.size} Selected</span>
                <div className="flex gap-2">
                  <button onClick={() => { const newSet = new Set(multiSelect); activeList.items.forEach(i => newSet.add(i.id)); setMultiSelect(newSet); }} className="text-slate-400 text-[10px] font-black uppercase tracking-wider pr-2">All</button>
                  <button onClick={deleteSelectedItems} className="bg-red-500 text-white px-5 py-2.5 rounded-[20px] font-black text-xs flex items-center gap-2"><i className="fa-solid fa-trash-can"></i> Delete</button>
                </div>
              </div>
            ) : (
              <div className="bg-white p-2 rounded-[28px] shadow-2xl border border-slate-100 flex items-center gap-2">
                <select value={newItemCategoryId} onChange={(e) => setNewItemCategoryId(e.target.value)} className="bg-slate-50 text-[10px] font-black uppercase tracking-widest rounded-[20px] px-4 py-3.5 outline-none border-none text-slate-600 appearance-none">
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="Packing something new?" className="flex-1 outline-none text-slate-900 placeholder-slate-300 font-bold text-sm bg-transparent" onKeyDown={(e) => e.key === 'Enter' && newItemName && addItemToActiveList({ name: newItemName, categoryId: newItemCategoryId })} />
                <button onClick={() => newItemName && addItemToActiveList({ name: newItemName, categoryId: newItemCategoryId })} className={`w-11 h-11 rounded-[18px] flex items-center justify-center transition-all ${newItemName ? 'bg-indigo-600 text-white rotate-0' : 'bg-slate-50 text-slate-200 rotate-90'}`}><i className="fa-solid fa-plus"></i></button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const CategoryEditModal = () => {
    const [name, setName] = useState(showCatEditModal?.name || '');
    const [icon, setIcon] = useState(showCatEditModal?.icon || 'fa-box');
    const [color, setColor] = useState(showCatEditModal?.colorClass || COLOR_OPTIONS[0]);
    if (!showCatEditModal) return null;
    return (
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-6 overflow-y-auto">
        <div className="bg-white rounded-[40px] w-full max-w-md p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
          <header className="text-center"><h2 className="text-2xl font-black text-slate-900 tracking-tight">Category Setup</h2></header>
          <div className="space-y-5">
            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Name</label><input autoFocus value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 outline-none focus:border-indigo-500 font-bold text-lg" /></div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Icon</label>
              <div className="grid grid-cols-5 gap-2 bg-slate-50 p-4 rounded-3xl max-h-40 overflow-y-auto custom-scrollbar">
                {AVAILABLE_ICONS.map(i => (
                  <button key={i} onClick={() => setIcon(i)} className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all ${icon === i ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-300'}`}><i className={`fa-solid ${i}`}></i></button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Color</label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map(c => <button key={c} onClick={() => setColor(c)} className={`w-8 h-8 rounded-full transition-all border-2 ${color === c ? 'border-indigo-600 scale-110' : 'border-transparent'} ${c}`}></button>)}
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-2"><button onClick={() => setShowCatEditModal(null)} className="flex-1 py-4 rounded-2xl font-bold text-slate-400">Cancel</button><button onClick={() => handleSaveCategory({ ...showCatEditModal, name, icon, colorClass: color })} disabled={!name} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black">Save</button></div>
        </div>
      </div>
    );
  };

  const NewHolidayModal = () => {
    const [name, setName] = useState('');
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    return (
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-[40px] w-full max-w-md p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
          <header className="text-center"><h2 className="text-2xl font-black text-slate-900 tracking-tight">New Trip</h2></header>
          <div className="space-y-5">
            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Trip Name</label><input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Summer in Italy" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 outline-none focus:border-indigo-500 font-bold text-lg" /></div>
            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start From</label><div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1"><button onClick={() => setSelectedTemplateId('')} className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${selectedTemplateId === '' ? 'border-indigo-500 bg-indigo-50/20' : 'border-slate-100'}`}><span className="font-bold text-slate-800 text-sm">Fresh Empty List</span>{selectedTemplateId === '' && <i className="fa-solid fa-circle-check text-indigo-500"></i>}</button>{templates.map(tpl => (<button key={tpl.id} onClick={() => setSelectedTemplateId(tpl.id)} className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${selectedTemplateId === tpl.id ? 'border-indigo-500 bg-indigo-50/20' : 'border-slate-100'}`}><span className="font-bold text-slate-800 text-sm line-clamp-1">{tpl.name}</span>{selectedTemplateId === tpl.id && <i className="fa-solid fa-circle-check text-indigo-500"></i>}</button>))}</div></div>
          </div>
          <div className="flex gap-3 pt-2"><button onClick={() => setShowAddHolidayModal(false)} className="flex-1 py-4 rounded-2xl font-bold text-slate-400">Cancel</button><button onClick={() => { if (name) { handleCreateHoliday(name, selectedTemplateId || undefined); setShowAddHolidayModal(false); } }} disabled={!name} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black">Let's Go</button></div>
        </div>
      </div>
    );
  };

  const NewTemplateModal = () => {
    const [name, setName] = useState('');
    const [suggestionPrompt, setSuggestionPrompt] = useState('');
    const createTemplateWithAI = async () => {
      if (!name) return;
      setLoadingSuggestions(true);
      const newId = generateId();
      const newList: PackingList = { id: newId, name, items: [], isTemplate: true, createdAt: Date.now() };
      setLists(prev => [newList, ...prev]);
      setActiveListId(newId);
      setView('list-detail');
      setShowAddTemplateModal(false);
      if (suggestionPrompt) {
        const items = await generatePackingSuggestions(suggestionPrompt, categories);
        if (items && items.length > 0) {
          setLists(prev => prev.map(l => l.id === newId ? { ...l, items: items.map((s: any) => ({
            id: generateId(),
            name: s.name,
            categoryId: categories.find(c => c.name.toLowerCase() === s.categoryName.toLowerCase())?.id || categories[0]?.id || 'cat_other',
            isPacked: false
          })) } : l));
        }
      }
      setLoadingSuggestions(false);
    }
    return (
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-[40px] w-full max-w-md p-8 shadow-2xl space-y-6"><header className="text-center"><h2 className="text-2xl font-black text-slate-900 tracking-tight">Master Template</h2></header>
          <div className="space-y-5"><div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Name</label><input autoFocus value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 outline-none focus:border-amber-500 font-bold text-lg" /></div><div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">AI Guide (Prompt)</label><textarea value={suggestionPrompt} onChange={e => setSuggestionPrompt(e.target.value)} placeholder="e.g. 2 weeks in Japan during winter..." className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 outline-none focus:border-indigo-500 font-bold text-slate-700 h-24 resize-none" /></div></div>
          <div className="flex gap-3 pt-2"><button onClick={() => setShowAddTemplateModal(false)} className="flex-1 py-4 rounded-2xl font-bold text-slate-400">Cancel</button><button onClick={createTemplateWithAI} disabled={!name} className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl font-black">Create</button></div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {view === 'dashboard' && <Dashboard />}
      {view === 'list-detail' && <ListDetail />}
      {view === 'categories' && <CategoriesView />}
      {showAddHolidayModal && <NewHolidayModal />}
      {showAddTemplateModal && <NewTemplateModal />}
      {showCatEditModal && <CategoryEditModal />}
      {loadingSuggestions && (
        <div className="fixed top-12 left-6 right-6 z-[110] bg-slate-900 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3 font-black animate-in slide-in-from-top-4"><i className="fa-solid fa-wand-magic-sparkles animate-pulse text-indigo-400"></i><span className="text-xs uppercase tracking-widest">AI Generating...</span></div>
      )}
    </div>
  );
};

export default App;
