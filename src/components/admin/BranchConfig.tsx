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
  FileSpreadsheet,
  Printer,
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
  Save,
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
  } = useERPStore();

  // Default active tab to TAX so user sees the newly requested Tax & Billing page
  const [activeSettingsTab, setActiveSettingsTab] = useState<
    'BRANCH' | 'USERS' | 'TAX' | 'PRINTER' | 'NOTIFICATIONS'
  >('TAX');
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionFloor, setNewSectionFloor] = useState('Ground Floor');
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

  // =========================================================================
  // STATE: PER-BRANCH TAX & BILLING CONFIGURATION
  // =========================================================================
  const [selectedTaxBranchId, setSelectedTaxBranchId] = useState<string>(
    currentBranch?._id || (branches[0]?._id ?? '')
  );

  const [taxGstPercent, setTaxGstPercent] = useState<number>(5);
  const [taxServiceCharge, setTaxServiceCharge] = useState<number>(0);
  const [taxCgst, setTaxCgst] = useState<number>(2.5);
  const [taxSgst, setTaxSgst] = useState<number>(2.5);
  const [taxDiscountRule, setTaxDiscountRule] = useState<string>('Standard');
  const [taxRoundOff, setTaxRoundOff] = useState<boolean>(true);
  const [taxPricesInclude, setTaxPricesInclude] = useState<boolean>(false);

  // Load tax settings when selectedTaxBranchId changes
  useEffect(() => {
    const b = branches.find((br) => br._id === selectedTaxBranchId) || branches[0];
    if (b && b.taxes) {
      setTaxGstPercent(b.taxes.gstPercentage ?? (b.taxes.cgst + b.taxes.sgst || 5));
      setTaxServiceCharge(b.taxes.serviceCharge ?? 0);
      setTaxCgst(b.taxes.cgst ?? 2.5);
      setTaxSgst(b.taxes.sgst ?? 2.5);
      setTaxDiscountRule(b.taxes.discountRule || 'Standard');
      setTaxRoundOff(b.taxes.roundOffTotal ?? true);
      setTaxPricesInclude(b.taxes.pricesIncludeTax ?? false);
    }
  }, [selectedTaxBranchId, branches]);

  // Handle GST change and auto split CGST/SGST
  const handleGstPercentChange = (val: number) => {
    setTaxGstPercent(val);
    const half = parseFloat((val / 2).toFixed(2));
    setTaxCgst(half);
    setTaxSgst(half);
  };

  // Save changes for selected branch's taxes
  const handleSaveTaxSettings = () => {
    const b = branches.find((br) => br._id === selectedTaxBranchId);
    if (!b) return;

    const updatedBranch: Branch = {
      ...b,
      taxes: {
        cgst: taxCgst,
        sgst: taxSgst,
        serviceCharge: taxServiceCharge,
        gstPercentage: taxGstPercent,
        discountRule: taxDiscountRule,
        roundOffTotal: taxRoundOff,
        pricesIncludeTax: taxPricesInclude,
      },
    };

    updateBranch(updatedBranch);
  };

  const handleResetTaxForm = () => {
    const b = branches.find((br) => br._id === selectedTaxBranchId) || branches[0];
    if (b && b.taxes) {
      setTaxGstPercent(b.taxes.gstPercentage ?? 5);
      setTaxServiceCharge(b.taxes.serviceCharge ?? 0);
      setTaxCgst(b.taxes.cgst ?? 2.5);
      setTaxSgst(b.taxes.sgst ?? 2.5);
      setTaxDiscountRule(b.taxes.discountRule || 'Standard');
      setTaxRoundOff(b.taxes.roundOffTotal ?? true);
      setTaxPricesInclude(b.taxes.pricesIncludeTax ?? false);
    }
  };

  // =========================================================================
  // STATE: RECEIPT & PRINTER CONFIGURATION
  // =========================================================================
  const [selectedReceiptBranchId, setSelectedReceiptBranchId] = useState<string>(
    currentBranch?._id || (branches[0]?._id ?? '')
  );

  const [invoicePrefix, setInvoicePrefix] = useState<string>('INV-');
  const [receiptHeaderText, setReceiptHeaderText] = useState<string>(
    'Welcome to Arabian Mandhi!'
  );
  const [receiptFooterText, setReceiptFooterText] = useState<string>(
    'Thank you for visiting! Please come again.'
  );
  const [printRestaurantLogo, setPrintRestaurantLogo] = useState<boolean>(false);
  const [autoPrintOnCheckout, setAutoPrintOnCheckout] = useState<boolean>(true);
  const [useThermalFormat, setUseThermalFormat] = useState<boolean>(true);
  const [paperWidth, setPaperWidth] = useState<string>('80mm');

  // Load receipt settings when selectedReceiptBranchId changes
  useEffect(() => {
    const b = branches.find((br) => br._id === selectedReceiptBranchId) || branches[0];
    if (b) {
      const rs = b.receiptSettings;
      setInvoicePrefix(rs?.invoicePrefix ?? 'INV-');
      setReceiptHeaderText(rs?.headerText ?? 'Welcome to Arabian Mandhi!');
      setReceiptFooterText(rs?.footerText ?? 'Thank you for visiting! Please come again.');
      setPrintRestaurantLogo(rs?.printLogo ?? false);
      setAutoPrintOnCheckout(rs?.autoPrintOnCheckout ?? true);
      setUseThermalFormat(rs?.useThermalFormat ?? true);
      setPaperWidth(rs?.paperWidth ?? '80mm');
    }
  }, [selectedReceiptBranchId, branches]);

  const handleSaveReceiptSettings = () => {
    const b = branches.find((br) => br._id === selectedReceiptBranchId);
    if (!b) return;

    const updatedBranch: Branch = {
      ...b,
      receiptSettings: {
        invoicePrefix,
        headerText: receiptHeaderText,
        footerText: receiptFooterText,
        printLogo: printRestaurantLogo,
        autoPrintOnCheckout,
        useThermalFormat,
        paperWidth,
      },
    };

    updateBranch(updatedBranch);
  };

  const handleResetReceiptForm = () => {
    const b = branches.find((br) => br._id === selectedReceiptBranchId) || branches[0];
    if (b) {
      const rs = b.receiptSettings;
      setInvoicePrefix(rs?.invoicePrefix ?? 'INV-');
      setReceiptHeaderText(rs?.headerText ?? 'Welcome to Arabian Mandhi!');
      setReceiptFooterText(rs?.footerText ?? 'Thank you for visiting! Please come again.');
      setPrintRestaurantLogo(rs?.printLogo ?? false);
      setAutoPrintOnCheckout(rs?.autoPrintOnCheckout ?? true);
      setUseThermalFormat(rs?.useThermalFormat ?? true);
      setPaperWidth(rs?.paperWidth ?? '80mm');
    }
  };

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
  const [timings, setTimings] = useState<string>('');
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
    setTimings('11:30 AM – 11:30 PM');
    setManagerName('');
    setManagerId('');
    setBranchStaffList([]);
    setBranchSections([
      { name: 'Main Dining Hall', floor: 'Ground Floor', tablesCount: 12 },
      { name: 'Family AC Dining', floor: 'First Floor', tablesCount: 8 },
    ]);
    setNewSectionName('');
    setNewSectionFloor('Ground Floor');
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
    setTimings(b.timings || '');
    setManagerName(b.managerName || '');
    setManagerId(b.managerId || '');
    setBranchStaffList(b.staffList || []);
    setBranchSections(
      b.sections && b.sections.length > 0
        ? b.sections
        : [
            { name: 'Main Dining Hall', floor: 'Ground Floor', tablesCount: 12 },
          ]
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
        floor: newSectionFloor,
        tablesCount: Number(newSectionTables) || 10,
      },
    ]);
    setNewSectionName('');
    setNewSectionTables(10);
  };

  const handleAddPresetSection = (name: string, floor: string, tablesCount: number) => {
    if (branchSections.some((s) => s.name.toLowerCase() === name.toLowerCase())) return;
    setBranchSections([...branchSections, { name, floor, tablesCount }]);
  };

  const handleRemoveSection = (index: number) => {
    const updated = [...branchSections];
    updated.splice(index, 1);
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
          timings: timings.trim() || existing.timings,
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
        timings: timings.trim() || '11:00 AM – 11:30 PM',
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

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName.trim()) return;

    if (editingUserId) {
      const existing = staffList.find((s) => s._id === editingUserId);
      if (existing) {
        const updatedStaff: Staff = {
          ...existing,
          name: personName.trim(),
          designation: designation.trim() || 'Front Desk Receptionist',
          role: userRole,
          branchAccess,
          email: userEmail.trim() || existing.email,
          phone: userPhone.trim() || existing.phone,
          username: username.trim() || existing.username,
          password: password.trim() || existing.password,
        };
        updateUser(updatedStaff);
        setSharingStaff(updatedStaff);
      }
    } else {
      const createdStaff: Omit<Staff, '_id'> = {
        employeeCode: `EMP-${Math.floor(100 + Math.random() * 900)}`,
        name: personName.trim(),
        designation: designation.trim() || 'Front Desk Receptionist (POS)',
        role: userRole,
        branchId: currentBranch?._id || (branches[0]?._id ?? ''),
        branchAccess,
        email: userEmail.trim() || `${username.trim() || 'user'}@arabianmandi.com`,
        phone: userPhone.trim() || '+91 9876543200',
        active: true,
        username: username.trim() || `reception.${Math.floor(100 + Math.random() * 900)}`,
        password: password.trim() || 'Mandi@POS123',
      };
      addUser(createdStaff);
      const createdWithId: any = {
        ...createdStaff,
        _id: `staff-${Date.now()}`,
      };
      setSharingStaff(createdWithId);
    }

    setIsUserModalOpen(false);
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

  const selectedBranchObject =
    branches.find((br) => br._id === selectedTaxBranchId) || branches[0];

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
              onClick={() => setActiveSettingsTab('TAX')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-extrabold transition-all text-left shadow-sm cursor-pointer ${
                activeSettingsTab === 'TAX'
                  ? 'bg-red-600 text-white shadow-red-600/20'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Tax & Billing</span>
            </button>

            <button
              onClick={() => setActiveSettingsTab('PRINTER')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                activeSettingsTab === 'PRINTER'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>Receipt & Printer</span>
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
              TAB 3: TAX & BILLING (PER-BRANCH CONFIGURATION MATCHING SCREENSHOT)
          ================================================================= */}
          {activeSettingsTab === 'TAX' && (
            <div className="space-y-6">
              {/* Top Header matching screenshot */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Tax & Billing</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Configure tax & billing options below for individual branches.
                  </p>
                </div>

                {/* Cancel and Save Changes buttons matching image */}
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={handleResetTaxForm}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-extrabold text-xs transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveTaxSettings}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>

              {/* Individual Branch Selector Bar */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <label className="text-xs font-extrabold uppercase tracking-wider text-red-600 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4" />
                      <span>Select Branch to Assign Taxes</span>
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Each individual branch can maintain separate GST, CGST, SGST, and service charge rates.
                    </p>
                  </div>

                  {selectedBranchObject && (
                    <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-700">
                      <span>GSTIN:</span>
                      <strong className="text-slate-900">{selectedBranchObject.gst}</strong>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {branches.map((br) => (
                    <button
                      key={br._id}
                      onClick={() => setSelectedTaxBranchId(br._id)}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedTaxBranchId === br._id
                          ? 'bg-red-50 border-red-500 shadow-sm'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-slate-900 block truncate">
                          {br.name.replace('Arabian Mandi – ', '').replace('Arabian Mandi - ', '')}
                        </span>
                        {selectedTaxBranchId === br._id && (
                          <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block mt-1">
                        {br.branchCode} • GST: {br.taxes?.gstPercentage ?? ((br.taxes?.cgst || 2.5) + (br.taxes?.sgst || 2.5))}%
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Tax & Billing Form Card matching screenshot precisely */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                {/* 2x2 Grid matching screenshot */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* GST Percentage (%) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      GST Percentage (%)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="28"
                      value={taxGstPercent}
                      onChange={(e) => handleGstPercentChange(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>

                  {/* Service Charge (%) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Service Charge (%)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="20"
                      value={taxServiceCharge}
                      onChange={(e) => setTaxServiceCharge(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>

                  {/* CGST (%) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      CGST (%)
                    </label>
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      max="14"
                      value={taxCgst}
                      onChange={(e) => setTaxCgst(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>

                  {/* SGST (%) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      SGST (%)
                    </label>
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      max="14"
                      value={taxSgst}
                      onChange={(e) => setTaxSgst(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>

                  {/* Discount Rules dropdown matching screenshot */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Discount Rules
                    </label>
                    <select
                      value={taxDiscountRule}
                      onChange={(e) => setTaxDiscountRule(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600 cursor-pointer"
                    >
                      <option value="Standard">Standard</option>
                      <option value="Staff Discount Allowed (10%)">
                        Staff Discount Allowed (10%)
                      </option>
                      <option value="Manager Approval Required (>15%)">
                        Manager Approval Required (&gt;15%)
                      </option>
                      <option value="No Discounts Allowed">No Discounts Allowed</option>
                    </select>
                  </div>
                </div>

                {/* Checkboxes matching screenshot exactly */}
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  {/* Checkbox 1: Round Off Total Amount */}
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={taxRoundOff}
                      onChange={(e) => setTaxRoundOff(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded text-red-600 focus:ring-red-600 border-slate-300 cursor-pointer"
                    />
                    <div>
                      <p className="text-xs font-extrabold text-slate-900">
                        Round Off Total Amount
                      </p>
                      <p className="text-xs text-slate-500">
                        Automatically round bill totals to nearest whole number.
                      </p>
                    </div>
                  </label>

                  {/* Checkbox 2: Prices Include Tax */}
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={taxPricesInclude}
                      onChange={(e) => setTaxPricesInclude(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded text-red-600 focus:ring-red-600 border-slate-300 cursor-pointer"
                    />
                    <div>
                      <p className="text-xs font-extrabold text-slate-900">
                        Prices Include Tax
                      </p>
                      <p className="text-xs text-slate-500">
                        Menu prices already include GST/Taxes.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Order-Type Specific Tax Assignment Matrix (Dine-in / Takeaway / Delivery) */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Order-Type Tax Breakdown for {selectedBranchObject?.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Individual branch order modes can apply specific GST rates.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-extrabold text-slate-500 uppercase">
                      Dine-In Orders
                    </span>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-extrabold text-slate-900 text-sm">Restaurant GST</span>
                      <span className="font-mono text-xs font-bold bg-white px-2.5 py-1 rounded border border-slate-200 text-red-600">
                        {taxGstPercent}% ({taxCgst}% + {taxSgst}%)
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-extrabold text-slate-500 uppercase">
                      Takeaway / Parcel
                    </span>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-extrabold text-slate-900 text-sm">Counter Parcel</span>
                      <span className="font-mono text-xs font-bold bg-white px-2.5 py-1 rounded border border-slate-200 text-red-600">
                        {taxGstPercent}% GST
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-extrabold text-slate-500 uppercase">
                      Swiggy / Zomato Delivery
                    </span>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-extrabold text-slate-900 text-sm">Aggregator GST</span>
                      <span className="font-mono text-xs font-bold bg-white px-2.5 py-1 rounded border border-slate-200 text-slate-700">
                        5% (Reverse Charge)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

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
                                        {b.sections.length} {b.sections.length === 1 ? 'Floor/Area' : 'Floors/Areas'}
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

          {/* =================================================================
              TAB 4: RECEIPT & PRINTER (CONFIG & PREVIEW MATCHING SCREENSHOT)
          ================================================================= */}
          {activeSettingsTab === 'PRINTER' && (
            <div className="space-y-6">
              {/* Top Header matching screenshot */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Receipt &amp; Printer</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Configure receipt &amp; printer options below.
                  </p>
                </div>

                {/* Cancel and Save Changes buttons matching image */}
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={handleResetReceiptForm}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-extrabold text-xs transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveReceiptSettings}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>

              {/* Branch selector pills so settings can be saved per branch */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Printer className="w-4 h-4 text-red-600" />
                  <span className="text-xs font-extrabold text-slate-800">
                    Active Branch:
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {branches.map((br) => (
                    <button
                      key={br._id}
                      type="button"
                      onClick={() => setSelectedReceiptBranchId(br._id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                        selectedReceiptBranchId === br._id
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {br.name.replace('Arabian Mandi – ', '').replace('Arabian Mandi - ', '')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Two Column Layout matching screenshot */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Column: Form Controls (6 cols) */}
                <div className="lg:col-span-6 space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  {/* Invoice Prefix */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Invoice Prefix
                    </label>
                    <input
                      type="text"
                      value={invoicePrefix}
                      onChange={(e) => setInvoicePrefix(e.target.value)}
                      placeholder="INV-"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>

                  {/* Receipt Header Text */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Receipt Header Text
                    </label>
                    <textarea
                      rows={3}
                      value={receiptHeaderText}
                      onChange={(e) => setReceiptHeaderText(e.target.value)}
                      placeholder="Welcome to Arabian Mandhi!"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600 resize-none"
                    />
                  </div>

                  {/* Receipt Footer Text */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Receipt Footer Text
                    </label>
                    <textarea
                      rows={3}
                      value={receiptFooterText}
                      onChange={(e) => setReceiptFooterText(e.target.value)}
                      placeholder="Thank you for visiting! Please come again."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600 resize-none"
                    />
                  </div>

                  {/* Checkboxes matching image */}
                  <div className="space-y-3.5 pt-2">
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={printRestaurantLogo}
                        onChange={(e) => setPrintRestaurantLogo(e.target.checked)}
                        className="w-4 h-4 rounded text-red-600 accent-red-600 focus:ring-red-600 border-slate-300 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-800">
                        Print Restaurant Logo
                      </span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={autoPrintOnCheckout}
                        onChange={(e) => setAutoPrintOnCheckout(e.target.checked)}
                        className="w-4 h-4 rounded text-red-600 accent-red-600 focus:ring-red-600 border-slate-300 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-800">
                        Auto Print on Checkout
                      </span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={useThermalFormat}
                        onChange={(e) => setUseThermalFormat(e.target.checked)}
                        className="w-4 h-4 rounded text-red-600 accent-red-600 focus:ring-red-600 border-slate-300 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-800">
                        Use Thermal Printer Format
                      </span>
                    </label>
                  </div>

                  {/* Paper Width */}
                  <div className="pt-2">
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Paper Width
                    </label>
                    <input
                      type="text"
                      value={paperWidth}
                      onChange={(e) => setPaperWidth(e.target.value)}
                      placeholder="e.g. 80mm"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>
                </div>

                {/* Right Column: RECEIPT PREVIEW matching screenshot card */}
                <div className="lg:col-span-6 bg-slate-50/90 border border-slate-200 rounded-2xl p-6 sm:p-10 flex flex-col items-center justify-center min-h-[460px] shadow-sm">
                  <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-6">
                    RECEIPT PREVIEW
                  </span>

                  <div className="w-full max-w-[300px] bg-white rounded-lg shadow-md border border-slate-200/80 p-6 font-mono text-xs text-slate-800 space-y-3">
                    {printRestaurantLogo && (
                      <div className="flex justify-center pb-1">
                        <div className="w-9 h-9 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-xs tracking-tight shadow-sm">
                          LOGO
                        </div>
                      </div>
                    )}

                    <div className="text-center font-bold text-sm text-slate-900 leading-snug">
                      {receiptHeaderText || 'Welcome to Arabian Mandhi!'}
                    </div>

                    <div className="border-b border-dashed border-slate-300 py-1" />

                    <div className="text-left text-xs font-semibold text-slate-700">
                      Order: {invoicePrefix || 'INV-'}1001
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-700 pt-1">
                      <div className="flex justify-between">
                        <span>1x Chicken Mandhi</span>
                        <span>₹350</span>
                      </div>
                      <div className="flex justify-between">
                        <span>2x Pepsi</span>
                        <span>₹100</span>
                      </div>
                    </div>

                    <div className="border-b border-dashed border-slate-300 py-1" />

                    <div className="flex justify-between font-extrabold text-xs text-slate-900 pt-1">
                      <span>Total:</span>
                      <span>₹450</span>
                    </div>

                    <div className="text-center text-[11px] text-slate-600 pt-3 leading-relaxed">
                      {receiptFooterText || 'Thank you for visiting! Please come again.'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSettingsTab !== 'USERS' &&
            activeSettingsTab !== 'BRANCH' &&
            activeSettingsTab !== 'TAX' &&
            activeSettingsTab !== 'PRINTER' && (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center space-y-3">
                <Building2 className="w-10 h-10 text-red-600 mx-auto" />
                <h3 className="font-extrabold text-lg text-slate-900">
                  {activeSettingsTab === 'NOTIFICATIONS' && 'Restaurant Alert & Email Notification Rules'}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Select <strong>Tax & Billing</strong>, <strong>User Management</strong>, <strong>Receipt & Printer</strong>, or <strong>Branch Management</strong> on the left sidebar to configure your restaurant preferences.
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

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Working Hours
                    </label>
                    <input
                      type="text"
                      value={timings}
                      onChange={(e) => setTimings(e.target.value)}
                      placeholder="11:00 AM – 11:30 PM"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-red-600 flex items-center gap-1.5">
                    <Layers className="w-4 h-4" />
                    <span>2. Branch Sections & Dining Areas (Floors / Zones)</span>
                  </h4>
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                    {branchSections.length} {branchSections.length === 1 ? 'Area' : 'Areas'} Added
                  </span>
                </div>

                <p className="text-xs text-slate-500">
                  Define the floors and dining zones in this restaurant branch (e.g. Dining Hall, Garden Party Area, Rooftop Majlis).
                </p>

                {/* Quick Add Presets */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-600 block">Quick Add Preset Areas:</span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { name: 'Main Dining Hall', floor: 'Ground Floor', tablesCount: 14 },
                      { name: 'First Floor AC Dining', floor: 'First Floor', tablesCount: 10 },
                      { name: 'Garden Party Area', floor: 'Outdoor / Garden', tablesCount: 10 },
                      { name: 'Rooftop Majlis Lounge', floor: 'Rooftop', tablesCount: 8 },
                      { name: 'VIP Family Hall', floor: 'First Floor', tablesCount: 6 },
                      { name: 'Private Banquet Hall', floor: 'Second Floor', tablesCount: 12 },
                    ].map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => handleAddPresetSection(preset.name, preset.floor, preset.tablesCount)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 hover:border-red-200 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{preset.name} ({preset.floor})</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Section Input Bar */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <span className="text-xs font-extrabold text-slate-800 block">Add Custom Section / Floor</span>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        value={newSectionName}
                        onChange={(e) => setNewSectionName(e.target.value)}
                        placeholder="e.g. Garden Party Area"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <select
                        value={newSectionFloor}
                        onChange={(e) => setNewSectionFloor(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600 cursor-pointer"
                      >
                        <option value="Ground Floor">Ground Floor</option>
                        <option value="First Floor">First Floor</option>
                        <option value="Second Floor">Second Floor</option>
                        <option value="Outdoor / Garden">Outdoor / Garden</option>
                        <option value="Rooftop">Rooftop</option>
                        <option value="Basement">Basement</option>
                      </select>
                    </div>
                    <div className="sm:col-span-3 flex gap-2">
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
                            <p className="text-[10px] text-slate-500 font-medium">
                              {sec.floor} • {sec.tablesCount || 10} Tables
                            </p>
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
