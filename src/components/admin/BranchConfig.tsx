import React, { useState, useEffect } from 'react';
import { useERPStore } from '../../stores/erp.store';
import type { Branch, Staff, UserRole } from '../../types/erp.types';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Search,
  Users,
  Bell,
  ArrowLeft,
  X,
  Zap,
  Power,
  MapPin,
  Phone,
  Check,
  KeyRound,
  Copy,
  Share2,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  Briefcase,
  Layers,
  Utensils,
} from 'lucide-react';

export const BranchConfig: React.FC = () => {
  const {
    branches,
    currentBranch,
    setCurrentBranch,
    activeRole,
    setActiveScreen,
    addBranch,
    updateBranch,
    deleteBranch,
    toggleBranchStatus,
    staffList,
    addUser,
    updateUser,
    deleteUser,
    resetUserPassword,
    fetchBranches,
    fetchStaffList,
  } = useERPStore();

  // Always refresh branches and staff from the backend when Settings opens
  useEffect(() => {
    fetchBranches();
    fetchStaffList();
  }, []);

  // Default active tab to BRANCH management
  const [activeSettingsTab, setActiveSettingsTab] = useState<
    'BRANCH' | 'USERS' | 'NOTIFICATIONS'
  >('BRANCH');
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionTables, setNewSectionTables] = useState<number>(10);

  // =========================================================================
  // STATE: USER MANAGEMENT MODAL & CREDENTIAL SHARING MODAL
  // =========================================================================
  const [userRoleFilter, setUserRoleFilter] = useState<string>('All');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const [personName, setPersonName] = useState('');
  const [designation, setDesignation] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('Receptionist');
  const [branchAccess, setBranchAccess] = useState('All Branches');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [sharingStaff, setSharingStaff] = useState<Staff | null>(null);
  const [copiedCredential, setCopiedCredential] = useState(false);

  // Quick settings state matching footer
  const [defaultBranchId, setDefaultBranchId] = useState<string>(
    currentBranch?._id || (branches[0]?._id ?? '')
  );
  const [quickBranchSwitch, setQuickBranchSwitch] = useState<boolean>(true);

  // =========================================================================
  // STATE: ADD / EDIT BRANCH MODAL
  // =========================================================================
  const [isBranchModalOpen, setIsBranchModalOpen] = useState<boolean>(false);
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [branchName, setBranchName] = useState<string>('');
  const [branchCode, setBranchCode] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [gst, setGst] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('11:00 AM');
  const [endTime, setEndTime] = useState<string>('11:30 PM');
  const [managerName, setManagerName] = useState<string>('');
  const [managerId, setManagerId] = useState<string>('');
  const [branchStaffList, setBranchStaffList] = useState<any[]>([]);
  const [branchSections, setBranchSections] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // =========================================================================
  // HANDLERS: BRANCH MANAGEMENT
  // =========================================================================
  const handleOpenAddBranchModal = () => {
    setEditingBranchId(null);
    setBranchName('');
    setBranchCode(`BR-${Math.floor(100 + Math.random() * 900)}`);
    setAddress('');
    setPhone('+91 ');
    setGst('36AABCA1234F1Z5');
    setStartTime('11:30 AM');
    setEndTime('11:30 PM');
    setManagerName('');
    setManagerId('');
    setBranchStaffList([]);
    setBranchSections([]);
    setNewSectionName('');
    setNewSectionTables(10);
    setIsBranchModalOpen(true);
  };

  const handleOpenEditBranchModal = (b: Branch) => {
    setEditingBranchId(b._id);
    setBranchName(b.name);
    setBranchCode(b.branchCode);
    setAddress(b.address);
    setPhone(b.phone);
    setGst(b.gst || '');
    let st = '11:00 AM';
    let et = '11:30 PM';
    if (b.timings) {
      const parts = b.timings.split(/[-–]| to /i).map(s => s.trim());
      if (parts.length >= 2) {
        st = parts[0];
        et = parts[1];
      }
    }
    setStartTime(st);
    setEndTime(et);
    setManagerName(b.managerName || '');
    setManagerId(b.managerId || '');
    setBranchStaffList(b.staffList || []);
    setBranchSections(
      b.sections && b.sections.length > 0
        ? b.sections
        : []
    );
    setIsBranchModalOpen(true);
  };

  const handleGenerateManagerId = () => {
    const generated = `MGR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setManagerId(generated);
  };

  const handleAddSection = () => {
    if (!newSectionName.trim()) return;
    setBranchSections([
      ...branchSections,
      {
        name: newSectionName.trim(),
        tablesCount: Number(newSectionTables) || 10,
      },
    ]);
    setNewSectionName('');
    setNewSectionTables(10);
  };

  const handleRemoveSection = (index: number) => {
    if (!window.confirm('Remove this section? All its tables will also be deleted from the cloud when you save.')) return;
    const updated = [...branchSections];
    updated.splice(index, 1);
    setBranchSections(updated);
  };

  const handleUpdateSectionCount = (index: number, count: number) => {
    const updated = [...branchSections];
    updated[index] = { ...updated[index], tablesCount: Math.max(1, count) };
    setBranchSections(updated);
  };

  const handleSaveBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName.trim()) return;

    if (editingBranchId) {
      const existing = branches.find((b) => b._id === editingBranchId);
      if (existing) {
        updateBranch({
          ...existing,
          name: branchName.trim(),
          branchCode: branchCode.trim() || existing.branchCode,
          address: address.trim() || 'Address not provided',
          phone: phone.trim() || '+91 9876543200',
          gst: gst.trim() || existing.gst,
          timings: `${startTime.trim()} - ${endTime.trim()}` || existing.timings,
          managerName: managerName.trim() || 'John Doe',
          managerId: managerId.trim() || 'MGR-DEFAULT',
          staffList: branchStaffList,
          sections: branchSections,
        });
      }
    } else {
      addBranch({
        name: branchName.trim(),
        branchCode: branchCode.trim() || `BR-${Math.floor(100 + Math.random() * 900)}`,
        address: address.trim() || 'Location not specified',
        phone: phone.trim() || '+91 9876543200',
        gst: gst.trim() || '36AABCA1234F1Z5',
        taxes: { cgst: 2.5, sgst: 2.5, serviceCharge: 0 },
        timings: `${startTime.trim()} - ${endTime.trim()}` || '11:00 AM – 11:30 PM',
        status: 'Active',
        managerName: managerName.trim() || 'John Doe',
        managerId: managerId.trim() || `MGR-${Math.floor(1000 + Math.random() * 9000)}`,
        staffList: branchStaffList,
        sections: branchSections,
      });
    }

    setIsBranchModalOpen(false);
  };

  // =========================================================================
  // HANDLERS: USER MANAGEMENT
  // =========================================================================
  const handleOpenAddUserModal = () => {
    setEditingUserId(null);
    setPersonName('');
    setDesignation('Front Desk Receptionist (POS)');
    setUserRole('Receptionist');
    setBranchAccess(currentBranch?.name || 'All Branches');
    setUserEmail('');
    setUserPhone('+91 ');
    const randomUser = `user.${Math.floor(100 + Math.random() * 900)}`;
    const randomPass = `POS#${Math.floor(1000 + Math.random() * 9000)}`;
    setUsername(randomUser);
    setPassword(randomPass);
    setShowPassword(true);
    setIsUserModalOpen(true);
  };

  const handleOpenEditUserModal = (st: Staff) => {
    setEditingUserId(st._id);
    setPersonName(st.name);
    setDesignation(st.designation || 'Front Desk Receptionist');
    setUserRole(st.role);
    setBranchAccess(st.branchAccess || 'All Branches');
    setUserEmail(st.email || '');
    setUserPhone(st.phone || '+91 ');
    setUsername(st.username || st.email?.split('@')[0] || 'reception_user');
    setPassword(st.password || 'Password@2026');
    setShowPassword(false);
    setIsUserModalOpen(true);
  };

  const handleGenerateCredentials = () => {
    const base = personName.trim().toLowerCase().replace(/[^a-z0-9]/g, '') || 'reception';
    const genUser = `${base}.${Math.floor(10 + Math.random() * 90)}`;
    const randomChar = Math.random().toString(36).slice(-4).toUpperCase();
    const genPass = `AM-${new Date().getFullYear()}#${randomChar}`;
    setUsername(genUser);
    setPassword(genPass);
    setShowPassword(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName.trim()) return;

    const matchedBranch = branches.find((b) => b.name === branchAccess || b._id === branchAccess);
    const targetBranchId = matchedBranch?._id || currentBranch?._id || (branches[0]?._id ?? '');

    try {
      if (editingUserId) {
        const existing = staffList.find((s) => s._id === editingUserId);
        if (existing) {
          const updatedStaff: Staff = {
            ...existing,
            name: personName.trim(),
            designation: designation.trim() || 'Front Desk Receptionist',
            role: userRole,
            branchId: targetBranchId,
            branchAccess,
            email: userEmail.trim() || existing.email,
            phone: userPhone.trim() || existing.phone,
            username: username.trim() || existing.username,
            password: password.trim() || existing.password,
          };
          await updateUser(editingUserId, updatedStaff);
          setSharingStaff(updatedStaff);
        }
      } else {
        const createdStaff: Omit<Staff, '_id'> = {
          employeeCode: `EMP-${Math.floor(100 + Math.random() * 900)}`,
          name: personName.trim(),
          designation: designation.trim() || 'Front Desk Receptionist (POS)',
          role: userRole,
          branchId: targetBranchId,
          branchAccess,
          email: userEmail.trim() || `${username.trim() || 'user'}@arabianmandi.com`,
          phone: userPhone.trim() || '+91 9876543200',
          active: true,
          username: username.trim() || `reception.${Math.floor(100 + Math.random() * 900)}`,
          password: password.trim() || 'Mandi@POS123',
        };
        await addUser(createdStaff);
        const createdWithId: any = {
          ...createdStaff,
          _id: `staff-${Date.now()}`,
        };
        setSharingStaff(createdWithId);
      }
      setIsUserModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to save user to backend server. Username might already exist.');
    }
  };

  const handleShareCredentials = (st: Staff) => {
    setCopiedCredential(false);
    setSharingStaff(st);
  };

  const handleCopyCredentialsText = (st: Staff) => {
    const textToCopy = `=== ARABIAN MANDI POS LOGIN CREDENTIALS ===\nEmployee Name: ${st.name}\nDesignation: ${st.designation || st.role}\nAssigned Branch: ${st.branchAccess || 'All Branches'}\nLogin Username: ${st.username || st.email}\nPassword: ${st.password || 'Please check with Admin'}\nLogin Role: ${st.role}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedCredential(true);
    setTimeout(() => setCopiedCredential(false), 3000);
  };

  // Filter branches for search
  const filteredBranches = branches.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.name.toLowerCase().includes(q) ||
      b.address.toLowerCase().includes(q) ||
      (b.managerName && b.managerName.toLowerCase().includes(q))
    );
  });

  // Filter users based on search & role filter
  const filteredUsers = (staffList || []).filter((st) => {
    if (userRoleFilter !== 'All' && st.role !== userRoleFilter && st.role !== userRoleFilter.split(' ')[0]) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      st.name.toLowerCase().includes(q) ||
      (st.designation && st.designation.toLowerCase().includes(q)) ||
      (st.username && st.username.toLowerCase().includes(q)) ||
      (st.branchAccess && st.branchAccess.toLowerCase().includes(q))
    );
  });



  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 min-h-[calc(100vh-4rem)] p-6 space-y-6">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() =>
              setActiveScreen(activeRole === 'Super Admin' ? 'ADMIN_ANALYTICS' : 'POS_WORKSPACE')
            }
            className="p-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            title="Return Back"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
            <span>Back</span>
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Settings</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage your restaurant preferences and configurations
            </p>
          </div>
        </div>
      </div>

      {/* Main Settings Split View */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Settings Navigation Menu (Compact w-56) */}
        <div className="w-full lg:w-56 flex-shrink-0 space-y-2.5">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search settings..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>

          <div className="space-y-1.5">
            <button
              onClick={() => setActiveSettingsTab('BRANCH')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-extrabold transition-all text-left shadow-sm cursor-pointer ${
                activeSettingsTab === 'BRANCH'
                  ? 'bg-red-600 text-white shadow-red-600/20'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Branch Management</span>
            </button>

            <button
              onClick={() => setActiveSettingsTab('USERS')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-extrabold transition-all text-left shadow-sm cursor-pointer ${
                activeSettingsTab === 'USERS'
                  ? 'bg-red-600 text-white shadow-red-600/20'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>User Management</span>
            </button>

            <button
              onClick={() => setActiveSettingsTab('NOTIFICATIONS')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeSettingsTab === 'NOTIFICATIONS'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Notifications</span>
            </button>
          </div>
        </div>

        {/* Right Content Panel */}
        <div className="flex-1 min-w-0 w-full space-y-6">

          {/* =================================================================
              TAB 1: USER MANAGEMENT
          ================================================================= */}
          {activeSettingsTab === 'USERS' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">User Management</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Assign software access to staff members, configure designations, and manually share generated login credentials.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">User Access Control</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Manage staff software permissions, branch access, and login credentials.
                  </p>
                </div>

                <button
                  onClick={handleOpenAddUserModal}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add User</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                {[
                  { label: 'All Users', role: 'All' },
                  { label: 'Owner / Admin', role: 'Super Admin' },
                  { label: 'Receptionist', role: 'Receptionist' },
                  { label: 'Manager', role: 'Manager' },
                  { label: 'Cashier', role: 'Cashier' },
                  { label: 'Waiter', role: 'Waiter' },
                ].map((pill) => (
                  <button
                    key={pill.role}
                    onClick={() => setUserRoleFilter(pill.role)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-extrabold transition-all cursor-pointer text-center ${
                      userRoleFilter === pill.role
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 text-[11px] font-extrabold uppercase tracking-wider">
                        <th className="py-4 px-6">Name & Designation</th>
                        <th className="py-4 px-6">Role</th>
                        <th className="py-4 px-6">Branch Access</th>
                        <th className="py-4 px-6">Login Username</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-800">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                            No users found. Click "+ Add User" to assign software access to a staff member.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((st) => (
                          <tr
                            key={st._id}
                            className="hover:bg-slate-50/80 transition-colors"
                          >
                            <td className="py-4 px-6 font-extrabold text-slate-900">
                              <div className="flex items-center gap-3">
                                <span className="w-9 h-9 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-extrabold text-sm shrink-0">
                                  {st.name[0]}
                                </span>
                                <div>
                                  <p className="text-slate-900 font-extrabold">{st.name}</p>
                                  <span className="text-[11px] text-slate-500 font-medium">
                                    {st.designation || 'Staff Member'}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-6">
                              <span
                                className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wide ${
                                  st.role === 'Super Admin'
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                    : st.role === 'Cashier'
                                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                    : st.role === 'Manager'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                }`}
                              >
                                {st.role === 'Super Admin' ? 'Owner' : st.role}
                              </span>
                            </td>

                            <td className="py-4 px-6 text-slate-700 font-semibold">
                              <span className="flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{st.branchAccess || 'All Branches'}</span>
                              </span>
                            </td>

                            <td className="py-4 px-6 font-mono text-slate-700">
                              <span className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-900 font-bold">
                                {st.username || st.email?.split('@')[0] || 'user'}
                              </span>
                            </td>

                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleShareCredentials(st)}
                                  className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/30 text-amber-700 font-extrabold text-[11px] flex items-center gap-1 transition-all cursor-pointer"
                                  title="Manually Share Credentials with Staff"
                                >
                                  <Share2 className="w-3.5 h-3.5" />
                                  <span>Share Credentials</span>
                                </button>

                                <button
                                  onClick={() => {
                                    const newPass = resetUserPassword(st._id);
                                    handleShareCredentials({ ...st, password: newPass });
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg text-blue-600 hover:bg-blue-50 font-extrabold text-[11px] transition-all cursor-pointer"
                                  title="Reset and generate new temporary password"
                                >
                                  Reset Password
                                </button>

                                <button
                                  onClick={() => handleOpenEditUserModal(st)}
                                  title="Edit User Access"
                                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>

                                {st.role !== 'Super Admin' && (
                                  <button
                                    onClick={() => {
                                      if (
                                        window.confirm(
                                          `Are you sure you want to revoke access for "${st.name}"?`
                                        )
                                      ) {
                                        deleteUser(st._id);
                                      }
                                    }}
                                    title="Delete User"
                                    className="p-2 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              TAB 2: BRANCH MANAGEMENT
          ================================================================= */}
          {activeSettingsTab === 'BRANCH' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Branch Management</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Configure branch management options below.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Branch Configuration</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Manage all your branches from a single place.
                  </p>
                </div>

                <button
                  onClick={handleOpenAddBranchModal}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Branch</span>
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 text-[11px] font-extrabold uppercase tracking-wider">
                        <th className="py-4 px-6">Branch Name</th>
                        <th className="py-4 px-6">Location</th>
                        <th className="py-4 px-6">Manager</th>
                        <th className="py-4 px-6">Contact</th>
                        <th className="py-4 px-6">Status</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-800">
                      {filteredBranches.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                            No branches found. Click "+ Add Branch" to add a new branch.
                          </td>
                        </tr>
                      ) : (
                        filteredBranches.map((b) => (
                          <tr
                            key={b._id}
                            className={`hover:bg-slate-50/80 transition-colors ${
                              b.status === 'Inactive' ? 'opacity-65' : ''
                            }`}
                          >
                            <td className="py-4 px-6 font-extrabold text-slate-900">
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-red-600" />
                                <div>
                                  <p>{b.name}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] font-mono text-slate-400">
                                      {b.branchCode}
                                    </span>
                                    {b.sections && b.sections.length > 0 && (
                                      <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                                        {b.sections.length} {b.sections.length === 1 ? 'Area' : 'Areas'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-6 text-slate-600 max-w-xs truncate">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{b.address}</span>
                              </span>
                            </td>

                            <td className="py-4 px-6">
                              <div>
                                <p className="font-bold text-slate-800">
                                  {b.managerName || 'John Doe'}
                                </p>
                                <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                  {b.managerId || 'MGR-101'}
                                </span>
                              </div>
                            </td>

                            <td className="py-4 px-6 font-mono text-slate-700">
                              <span className="flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{b.phone}</span>
                              </span>
                            </td>

                            <td className="py-4 px-6">
                              <span
                                className={`px-3 py-1 rounded-full text-[11px] font-extrabold ${
                                  b.status === 'Active'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : 'bg-slate-200 text-slate-700 border border-slate-300'
                                }`}
                              >
                                {b.status}
                              </span>
                            </td>

                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleOpenEditBranchModal(b)}
                                  title="Edit Branch & Staff"
                                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => toggleBranchStatus(b._id)}
                                  title={b.status === 'Active' ? 'Disable Branch' : 'Enable Branch'}
                                  className={`p-2 rounded-lg transition-colors cursor-pointer ${
                                    b.status === 'Active'
                                      ? 'hover:bg-amber-100 text-amber-600'
                                      : 'hover:bg-emerald-100 text-emerald-600'
                                  }`}
                                >
                                  <Power className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => {
                                    if (
                                      window.confirm(
                                        `Are you sure you want to delete "${b.name}"?`
                                      )
                                    ) {
                                      deleteBranch(b._id);
                                    }
                                  }}
                                  title="Delete Branch"
                                  className="p-2 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <span className="font-extrabold text-sm text-slate-800">Default Branch</span>
                  <select
                    value={defaultBranchId}
                    onChange={(e) => {
                      setDefaultBranchId(e.target.value);
                      setCurrentBranch(e.target.value);
                    }}
                    className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-extrabold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-600 cursor-pointer"
                  >
                    {branches.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name.replace('Arabian Mandi – ', '').replace('Arabian Mandi - ', '')}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <span className="font-extrabold text-sm text-slate-800">
                    Quick Branch Switch
                  </span>
                  <button
                    onClick={() => setQuickBranchSwitch(!quickBranchSwitch)}
                    className={`w-6 h-6 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                      quickBranchSwitch
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'bg-slate-200 border border-slate-300'
                    }`}
                  >
                    {quickBranchSwitch && <Check className="w-4 h-4 stroke-[3]" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSettingsTab !== 'USERS' &&
            activeSettingsTab !== 'BRANCH' && (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center space-y-3">
                <Building2 className="w-10 h-10 text-red-600 mx-auto" />
                <h3 className="font-extrabold text-lg text-slate-900">
                  {activeSettingsTab === 'NOTIFICATIONS' && 'Restaurant Alert & Email Notification Rules'}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Select <strong>User Management</strong> or <strong>Branch Management</strong> on the left sidebar to configure your restaurant preferences.
                </p>
              </div>
            )}
        </div>
      </div>

      {/* =========================================================================
          MODAL 1: ADD / EDIT USER & GENERATE CREDENTIALS
      ========================================================================= */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <KeyRound className="w-6 h-6 text-amber-400" />
                <div>
                  <h3 className="text-lg font-extrabold">
                    {editingUserId ? 'Edit User Software Access' : 'Assign POS Software to Person'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Specify whom the software is given to, their designation, assigned branch & login credentials
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-6">
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-red-600 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4" />
                  <span>1. Person & Job Designation</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Person's Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={personName}
                      onChange={(e) => setPersonName(e.target.value)}
                      placeholder="e.g. Mohammed Tariq"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Designation / Job Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g. Front Desk Receptionist / Shift Manager"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-red-600 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4" />
                  <span>2. Software Permission & Branch Access</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      POS Software Role *
                    </label>
                    <select
                      value={userRole}
                      onChange={(e) => setUserRole(e.target.value as UserRole)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600 cursor-pointer"
                    >
                      <option value="Receptionist">Receptionist (Front Desk POS & Billing)</option>
                      <option value="Manager">Branch Manager (Operational Control)</option>
                      <option value="Cashier">Cashier (Billing & Cash Drawer)</option>
                      <option value="Waiter">Captain / Waiter (Table KOT Taking)</option>
                      <option value="Super Admin">Owner / Super Admin (All Access)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Assigned Branch Access *
                    </label>
                    <select
                      value={branchAccess}
                      onChange={(e) => setBranchAccess(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600 cursor-pointer"
                    >
                      <option value="All Branches">All Branches (Global Access)</option>
                      {branches.map((b) => (
                        <option key={b._id} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Contact Email / ID
                    </label>
                    <input
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="tariq@arabianmandi.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Contact Phone
                    </label>
                    <input
                      type="text"
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      placeholder="+91 9876543200"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                    <Lock className="w-4 h-4" />
                    <span>3. Generated Login Credentials</span>
                  </h4>
                  <button
                    type="button"
                    onClick={handleGenerateCredentials}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-[11px] flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Generate Fresh Credentials</span>
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                  <p className="text-xs text-slate-700 font-medium">
                    The Admin shares these credentials manually with the receptionist/staff member so they can log into the POS software.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Login Username *
                      </label>
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="e.g. tariq.pos"
                        className="w-full px-3 py-2 rounded-xl border border-amber-400/60 bg-white text-xs font-mono font-bold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Login Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="POS#Password2026"
                          className="w-full pl-3 pr-10 py-2 rounded-xl border border-amber-400/60 bg-white text-xs font-mono font-bold text-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-2 text-slate-500 hover:text-slate-800 cursor-pointer"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
                >
                  {editingUserId ? 'Update Access & Credentials' : 'Create Access & Share Credentials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: MANUAL CREDENTIAL SHARING DIALOG
      ========================================================================= */}
      {sharingStaff && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-500 text-slate-950">
                  <Share2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">
                    Share Login Credentials
                  </h3>
                  <p className="text-xs text-slate-500">
                    Manually provide these details to the staff member
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSharingStaff(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Employee Name:</span>
                <span className="font-bold text-amber-400">{sharingStaff.name}</span>
              </div>

              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Designation:</span>
                <span className="font-bold text-white">
                  {sharingStaff.designation || sharingStaff.role}
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Branch Access:</span>
                <span className="font-bold text-white">
                  {sharingStaff.branchAccess || 'All Branches'}
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Login Username:</span>
                <span className="font-bold text-emerald-400">
                  {sharingStaff.username || sharingStaff.email}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Login Password:</span>
                <span className="font-extrabold text-amber-300 bg-slate-800 px-2 py-1 rounded">
                  {sharingStaff.password || 'Mandi@POS123'}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 text-center">
              Share via WhatsApp, Email, or Handover Slip. The user will select their branch upon login.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => handleCopyCredentialsText(sharingStaff)}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {copiedCredential ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-amber-400" />
                    <span>Copy Credentials Text</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setSharingStaff(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: ADD / EDIT BRANCH MODAL
      ========================================================================= */}
      {isBranchModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <Building2 className="w-6 h-6 text-red-500" />
                <div>
                  <h3 className="text-lg font-extrabold">
                    {editingBranchId ? 'Edit Branch Configuration' : 'Add New Branch'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Configure Branch Name, Location, Branch Manager ID & Assigned Staff
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBranchModalOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBranch} className="p-6 space-y-6">
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-red-600 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" />
                  <span>1. Primary Branch Details</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Branch Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                      placeholder="e.g. Arabian Mandi - Madurai"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Branch Code
                    </label>
                    <input
                      type="text"
                      value={branchCode}
                      onChange={(e) => setBranchCode(e.target.value)}
                      placeholder="e.g. BR-MADURAI"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Location / Full Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. No. 45, Anna Salai, Bypass Road, Madurai"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Contact Phone Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 9876543200"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={(() => {
                           const m = startTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
                           if (!m) return '';
                           let h = parseInt(m[1]);
                           if (m[3].toUpperCase() === 'PM' && h < 12) h += 12;
                           if (m[3].toUpperCase() === 'AM' && h === 12) h = 0;
                           return `${String(h).padStart(2, '0')}:${m[2]}`;
                        })()}
                        onChange={(e) => {
                           const val = e.target.value;
                           if (!val) return;
                           const [h, m] = val.split(':');
                           let hours = parseInt(h);
                           const ampm = hours >= 12 ? 'PM' : 'AM';
                           hours = hours % 12;
                           hours = hours ? hours : 12;
                           setStartTime(`${String(hours).padStart(2, '0')}:${m} ${ampm}`);
                        }}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={(() => {
                           const m = endTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
                           if (!m) return '';
                           let h = parseInt(m[1]);
                           if (m[3].toUpperCase() === 'PM' && h < 12) h += 12;
                           if (m[3].toUpperCase() === 'AM' && h === 12) h = 0;
                           return `${String(h).padStart(2, '0')}:${m[2]}`;
                        })()}
                        onChange={(e) => {
                           const val = e.target.value;
                           if (!val) return;
                           const [h, m] = val.split(':');
                           let hours = parseInt(h);
                           const ampm = hours >= 12 ? 'PM' : 'AM';
                           hours = hours % 12;
                           hours = hours ? hours : 12;
                           setEndTime(`${String(hours).padStart(2, '0')}:${m} ${ampm}`);
                        }}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-red-600 flex items-center gap-1.5">
                    <Layers className="w-4 h-4" />
                    <span>2. Branch Sections & Dining Areas</span>
                  </h4>
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                    {branchSections.length} {branchSections.length === 1 ? 'Area' : 'Areas'} Added
                  </span>
                </div>

                <p className="text-xs text-slate-500">
                  Define the dining zones in this restaurant branch (e.g. Dining Hall, Garden Party Area, Rooftop Majlis).
                </p>



                {/* Custom Section Input Bar */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <span className="text-xs font-extrabold text-slate-800 block">Add Custom Section</span>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-8">
                      <input
                        type="text"
                        value={newSectionName}
                        onChange={(e) => setNewSectionName(e.target.value)}
                        placeholder="e.g. Garden Party Area"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600"
                      />
                    </div>
                    
                    <div className="sm:col-span-4 flex gap-2">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={newSectionTables}
                        onChange={(e) => setNewSectionTables(parseInt(e.target.value) || 10)}
                        placeholder="Tables"
                        title="Number of tables"
                        className="w-20 px-2.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600"
                      />
                      <button
                        type="button"
                        onClick={handleAddSection}
                        className="flex-1 px-3 py-2 bg-slate-900 hover:bg-red-600 text-white font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Added Sections Cards List */}
                {branchSections.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {branchSections.map((sec, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-sm"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                            <Utensils className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-extrabold text-slate-900 truncate">
                              {sec.name}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <button
                                type="button"
                                onClick={() => handleUpdateSectionCount(idx, (sec.tablesCount || 10) - 1)}
                                className="w-5 h-5 rounded bg-slate-200 hover:bg-red-100 text-slate-700 flex items-center justify-center text-xs font-extrabold cursor-pointer"
                              >−</button>
                              <span className="text-[11px] font-bold text-slate-700 w-6 text-center">{sec.tablesCount || 10}</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateSectionCount(idx, (sec.tablesCount || 10) + 1)}
                                className="w-5 h-5 rounded bg-slate-200 hover:bg-emerald-100 text-slate-700 flex items-center justify-center text-xs font-extrabold cursor-pointer"
                              >+</button>
                              <span className="text-[10px] text-slate-400">tables</span>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSection(idx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                          title="Remove Area"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200 space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-red-600 flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>3. Branch Manager Assignment</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Branch Manager's Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={managerName}
                      onChange={(e) => setManagerName(e.target.value)}
                      placeholder="e.g. John Doe / Imran Khan"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Manager ID (Auto or Custom)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={managerId}
                        onChange={(e) => setManagerId(e.target.value)}
                        placeholder="e.g. MGR-2026-9041"
                        className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600"
                      />
                      <button
                        type="button"
                        onClick={handleGenerateManagerId}
                        className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                        title="Generate unique Manager ID"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Generate ID</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => setIsBranchModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
                >
                  {editingBranchId ? 'Update Branch' : 'Save & Create Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
