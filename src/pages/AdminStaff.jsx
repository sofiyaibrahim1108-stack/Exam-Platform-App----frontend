import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import {
  Users, UserCheck, ShieldAlert, Plus, Download, Upload, Search, Edit2, Trash2, Key, Info, GraduationCap, Building2, UserPlus, Trash, Shield, AlertTriangle
} from 'lucide-react';
import api from '../services/api';

const AdminStaff = () => {
  // Main states
  const [staffList, setStaffList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [currentPage, setCurrentPage] = useState(1);

  // Search & Filter parameters
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [registeredFilter, setRegisteredFilter] = useState('');

  // Modals & Panels visibility controls
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);

  // Focus context state
  const [selectedStaff, setSelectedStaff] = useState(null);

  // Excel import preview state
  const [previewData, setPreviewData] = useState([]);
  const [importErrors, setImportErrors] = useState([]);

  // Forms hooks
  const {
    register: registerAdd,
    handleSubmit: handleSubmitAdd,
    reset: resetAdd,
    formState: { errors: errorsAdd },
  } = useForm();

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    setValue: setValueEdit,
    formState: { errors: errorsEdit },
  } = useForm();

  // Load staff records
  const fetchStaff = async () => {
    setLoading(true);
    try {
      const response = await api.get('/user-management/staff', {
        params: {
          search,
          department: deptFilter,
          status: statusFilter,
          isRegistered: registeredFilter,
          page: currentPage,
          limit: pagination.limit,
        },
      });
      if (response.data && response.data.success) {
        setStaffList(response.data.data.results);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to retrieve staff records.');
    } finally {
      setLoading(false);
    }
  };

  // Load active departments list
  const fetchDepartments = async () => {
    try {
      const response = await api.get('/units/dropdowns'); // Reusing existing dropdown list helper
      if (response.data && response.data.success) {
        setDepartments(response.data.data.departments);
      }
    } catch (error) {
      console.error('Failed to load active departments list', error);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [search, deptFilter, statusFilter, registeredFilter, currentPage]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  // CREATE Action (Manual)
  const onAddSubmit = async (data) => {
    const toastId = toast.loading('Registering Staff records...');
    try {
      await api.post('/user-management/staff', {
        employeeId: data.employeeId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        department: data.department,
        designation: data.designation,
        qualification: data.qualification,
        status: data.status,
      });

      toast.success('Staff master record registered successfully.', { id: toastId });
      setAddModalOpen(false);
      resetAdd();
      fetchStaff();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed.', { id: toastId });
    }
  };

  // Open EDIT modal
  const handleEditClick = (staff) => {
    setSelectedStaff(staff);
    setValueEdit('employeeId', staff.employeeId);
    setValueEdit('name', staff.name);
    setValueEdit('email', staff.email);
    setValueEdit('phone', staff.phone || '');
    setValueEdit('department', staff.department?._id || '');
    setValueEdit('designation', staff.designation || '');
    setValueEdit('qualification', staff.qualification || '');
    setValueEdit('status', staff.status);
    setEditModalOpen(true);
  };

  // UPDATE Action
  const onEditSubmit = async (data) => {
    const toastId = toast.loading('Syncing record changes...');
    try {
      await api.put(`/user-management/staff/${selectedStaff._id}`, {
        employeeId: data.employeeId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        department: data.department,
        designation: data.designation,
        qualification: data.qualification,
        status: data.status,
      });

      toast.success('Record updated successfully.', { id: toastId });
      setEditModalOpen(false);
      fetchStaff();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Record update failed.', { id: toastId });
    }
  };

  // DELETE Action
  const handleDeleteConfirm = async () => {
    const toastId = toast.loading('Removing record from database...');
    try {
      await api.delete(`/user-management/staff/${selectedStaff._id}`);
      toast.success('Record deleted successfully.', { id: toastId });
      setDeleteDialogOpen(false);
      fetchStaff();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Deletion failed.', { id: toastId });
    }
  };

  // EXPORT Excel Action
  const handleExport = async () => {
    const toastId = toast.loading('Exporting staff records...');
    try {
      const response = await api.get('/user-management/export/staff');
      if (response.data && response.data.success) {
        const rawData = response.data.data.map(item => ({
          'Employee ID': item.employeeId,
          'Name': item.name,
          'Email': item.email,
          'Phone': item.phone || '',
          'Department Name': item.department?.name || '',
          'Department Code': item.department?.code || '',
          'Designation': item.designation || '',
          'Qualification': item.qualification || '',
          'Is Registered': item.isRegistered ? 'Yes' : 'No',
          'Status': item.status,
          'Imported Date': new Date(item.importedAt).toLocaleDateString(),
        }));

        const ws = XLSX.utils.json_to_sheet(rawData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Staff Master');
        XLSX.writeFile(wb, 'Staff_Master_List.xlsx');
        toast.success('Staff records exported successfully.', { id: toastId });
      }
    } catch (error) {
      toast.error('Failed to export staff records.', { id: toastId });
    }
  };

  // EXCEL Import File Upload & Parse
  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawJson = XLSX.utils.sheet_to_json(ws);

        // Basic schema mapping from columns
        const parsed = rawJson.map(row => ({
          employeeId: row['Employee ID'] || row['employeeId'] || '',
          name: row['Name'] || row['name'] || '',
          email: row['Email'] || row['email'] || '',
          phone: row['Phone'] || row['phone'] || '',
          department: row['Department Code'] || row['Department Name'] || row['Department'] || row['department'] || '', designation: row['Designation'] || row['designation'] || '',
          qualification: row['Qualification'] || row['qualification'] || '',
        }));

        // Validate duplicates in import list
        const duplicates = [];
        const seen = new Set();
        parsed.forEach((item, index) => {
          if (item.employeeId) {
            if (seen.has(item.employeeId)) {
              duplicates.push(`Row ${index + 2}: Duplicate Employee ID "${item.employeeId}" in list.`);
            } else {
              seen.add(item.employeeId);
            }
          }
        });

        setImportErrors(duplicates);
        setPreviewData(parsed);
      } catch (err) {
        toast.error('Failed to parse Excel sheet.');
      }
    };
    reader.readAsBinaryString(file);
  };

  // SUBMIT parsed rows to API
  const handleImportSubmit = async () => {
    if (importErrors.length > 0) {
      toast.error('Please resolve validation errors in preview list.');
      return;
    }
    if (previewData.length === 0) {
      toast.error('No valid records to import.');
      return;
    }

    const toastId = toast.loading('Importing records to database...');
    try {
      await api.post('/user-management/import/staff', { records: previewData });
      toast.success('All records imported successfully!', { id: toastId });
      setImportModalOpen(false);
      setPreviewData([]);
      setImportErrors([]);
      fetchStaff();
    } catch (error) {
      if (error.response?.data?.errors) {
        setImportErrors(error.response.data.errors);
        toast.error('Excel rows failed validation. See logs.', { id: toastId });
      } else {
        toast.error(error.response?.data?.message || 'Import failed.', { id: toastId });
      }
    }
  };

  return (
    <div className="space-y-6">

      {/* Header Panel */}
      <div className="card-flat p-6 rounded-[24px] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{
          backgroundImage: 'radial-gradient(circle, #8B1E3F 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }} />
        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#8B1E3F] bg-[#FDF0F4] border border-[rgba(139,30,63,0.12)] px-2.5 py-1 rounded-[7px] mb-2">
              <UserCheck size={12} />
              Faculty Records
            </div>
            <h2 className="text-2xl font-black text-[#111111] leading-none">Staff Management</h2>
            <p className="text-[13px] text-[#6B7280] mt-1.5">Manage staff credentials, department mappings, and batch import Excel files.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setImportModalOpen(true)}
              className="btn-secondary py-2 px-3 text-[12.5px] rounded-[10px] flex items-center gap-1.5"
            >
              <Upload size={14} />
              Import Excel
            </button>
            <button
              onClick={handleExport}
              className="btn-secondary py-2 px-3 text-[12.5px] rounded-[10px] flex items-center gap-1.5"
            >
              <Download size={14} />
              Export Excel
            </button>
            <button
              onClick={() => setAddModalOpen(true)}
              className="btn-primary py-2 px-4 text-[12.5px] rounded-[10px] flex items-center gap-1.5"
            >
              <UserPlus size={14} />
              Add Staff
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#9CA3AF] uppercase">Total Staff</span>
            <div className="w-8 h-8 rounded-[8px] bg-[#FDF0F4] text-[#8B1E3F] flex items-center justify-center">
              <Users size={14} />
            </div>
          </div>
          <p className="text-2xl font-black font-mono text-[#8B1E3F] leading-none mt-1">{pagination.total}</p>
          <p className="text-[11px] text-[#6B7280] mt-1.5">Master staff directory</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#9CA3AF] uppercase">Active Faculty</span>
            <div className="w-8 h-8 rounded-[8px] bg-[#ECFDF5] text-[#059669] flex items-center justify-center">
              <UserCheck size={14} />
            </div>
          </div>
          <p className="text-2xl font-black font-mono text-[#059669] leading-none mt-1">
            {staffList.filter(s => s.status === 'Active').length}
          </p>
          <p className="text-[11px] text-[#6B7280] mt-1.5">Currently teaching</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#9CA3AF] uppercase">Pending Requests</span>
            <div className="w-8 h-8 rounded-[8px] bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center">
              <AlertTriangle size={14} />
            </div>
          </div>
          <p className="text-2xl font-black font-mono text-[#DC2626] leading-none mt-1">
            {staffList.filter(s => !s.isRegistered).length}
          </p>
          <p className="text-[11px] text-[#6B7280] mt-1.5">Awaiting setup completion</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card-flat p-4 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-center">
          {/* Search */}
          <div className="sm:col-span-2 search-bar">
            <Search size={14} className="text-[#9CA3AF] flex-shrink-0" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by Employee ID, Name, Email..."
              type="text"
            />
          </div>

          {/* Department filter */}
          <select
            value={deptFilter}
            onChange={(e) => {
              setDeptFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="select"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept._id} value={dept._id}>
                {dept.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="select"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          {/* Registration state Filter */}
          <select
            value={registeredFilter}
            onChange={(e) => {
              setRegisteredFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="select"
          >
            <option value="">Registration Status</option>
            <option value="true">Registered Accounts</option>
            <option value="false">Unregistered Master</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="table-wrap">
        {loading ? (
          <div className="space-y-3 p-4 animate-pulse">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-9 bg-gray-200 rounded w-full"></div>
            ))}
          </div>
        ) : staffList.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <UserCheck size={24} />
            </div>
            <h3 className="text-base font-bold text-[#111111]">No Staff Records</h3>
            <p className="text-[#6B7280] text-xs max-w-sm mt-1">No master records found. Try adding staff or uploading Excel.</p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th className="text-center">Registration</th>
                  <th className="text-center">Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((staff) => (
                  <tr key={staff._id}>
                    <td className="font-mono font-bold text-[#8B1E3F]">{staff.employeeId}</td>
                    <td className="font-semibold text-[#111111]">{staff.name}</td>
                    <td className="text-[#6B7280] font-mono text-[11.5px]">{staff.email}</td>
                    <td>{staff.department?.name || 'Unassigned'}</td>
                    <td>{staff.designation || '—'}</td>
                    <td className="text-center">
                      <span className={`badge ${staff.isRegistered ? 'badge-wine' : 'badge-gray'}`}>
                        {staff.isRegistered ? 'Registered' : 'Pending'}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className={`badge ${staff.status === 'Active' ? 'badge-green' : 'badge-red'}`}>
                        {staff.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleEditClick(staff)}
                          className="p-1 rounded-lg text-[#6B7280] hover:text-[#8B1E3F] hover:bg-[#FDF0F4] transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedStaff(staff);
                            setDeleteDialogOpen(true);
                          }}
                          className="p-1 rounded-lg text-[#6B7280] hover:text-[#DC2626] hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-primary/10 mt-6 pt-4">
              <span className="text-xs text-on-surface-variant font-mono">
                Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="px-4 py-2 border border-primary/10 text-xs font-bold rounded-lg hover:bg-primary/5 active:scale-95 transition-all disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage === pagination.totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                  className="px-4 py-2 border border-primary/10 text-xs font-bold rounded-lg hover:bg-primary/5 active:scale-95 transition-all disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          MANUAL CREATE MODAL
      ======================================================== */}
      <AnimatePresence>
        {addModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAddModalOpen(false)}
              className="fixed inset-0 bg-black/45 backdrop-blur-sm"
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-surface-container-lowest max-w-xl w-full rounded-[24px] border border-primary/10 p-8 shadow-2xl z-50 max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-xl font-bold text-primary mb-2">Add Staff Master</h3>
              <p className="text-on-surface-variant text-xs mb-6">Create a single staff master entry to allow future portal registration.</p>

              <form onSubmit={handleSubmitAdd(onAddSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Employee ID */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Employee ID *</label>
                    <input
                      {...registerAdd('employeeId', { required: 'Employee ID is required' })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="e.g. EMP-101"
                    />
                    {errorsAdd.employeeId && <span className="text-error text-xs block font-mono mt-1">{errorsAdd.employeeId.message}</span>}
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Full Name *</label>
                    <input
                      {...registerAdd('name', { required: 'Name is required' })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="e.g. Dr. John Doe"
                    />
                    {errorsAdd.name && <span className="text-error text-xs block font-mono mt-1">{errorsAdd.name.message}</span>}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Institutional Email *</label>
                    <input
                      type="email"
                      {...registerAdd('email', { required: 'Email is required' })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="e.g. jdoe@institution.edu"
                    />
                    {errorsAdd.email && <span className="text-error text-xs block font-mono mt-1">{errorsAdd.email.message}</span>}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Phone Number</label>
                    <input
                      {...registerAdd('phone')}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="e.g. +1234567890"
                    />
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Department *</label>
                    <select
                      {...registerAdd('department', { required: 'Department mapping is required' })}
                      className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2.5 text-base focus:ring-0 focus:border-primary outline-none cursor-pointer"
                    >
                      <option value="">Select Department...</option>
                      {departments.map(dept => (
                        <option key={dept._id} value={dept._id}>{dept.name}</option>
                      ))}
                    </select>
                    {errorsAdd.department && <span className="text-error text-xs block font-mono mt-1">{errorsAdd.department.message}</span>}
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Status</label>
                    <select
                      {...registerAdd('status')}
                      defaultValue="Active"
                      className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2.5 text-base focus:ring-0 focus:border-primary outline-none cursor-pointer"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  {/* Designation */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Designation</label>
                    <input
                      {...registerAdd('designation')}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="e.g. Associate Professor"
                    />
                  </div>

                  {/* Qualification */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Qualification</label>
                    <input
                      {...registerAdd('qualification')}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                      placeholder="e.g. PhD in CS"
                    />
                  </div>
                </div>

                <div className="flex gap-4 justify-end pt-4 border-t border-primary/5">
                  <button
                    type="button"
                    onClick={() => setAddModalOpen(false)}
                    className="py-3 px-6 rounded-xl border border-primary/10 text-sm font-semibold hover:bg-primary/5 active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-3 px-6 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-container active:scale-[0.98] transition-all"
                  >
                    Save Record
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          EDIT MODAL
      ======================================================== */}
      <AnimatePresence>
        {editModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditModalOpen(false)}
              className="fixed inset-0 bg-black/45 backdrop-blur-sm"
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-surface-container-lowest max-w-xl w-full rounded-[24px] border border-primary/10 p-8 shadow-2xl z-50 max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-xl font-bold text-primary mb-2">Edit Staff Master</h3>
              <p className="text-on-surface-variant text-xs mb-6">Modify records for this staff master entry.</p>

              <form onSubmit={handleSubmitEdit(onEditSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Employee ID */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Employee ID *</label>
                    <input
                      {...registerEdit('employeeId', { required: 'Employee ID is required' })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                    />
                    {errorsEdit.employeeId && <span className="text-error text-xs block font-mono mt-1">{errorsEdit.employeeId.message}</span>}
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Full Name *</label>
                    <input
                      {...registerEdit('name', { required: 'Name is required' })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                    />
                    {errorsEdit.name && <span className="text-error text-xs block font-mono mt-1">{errorsEdit.name.message}</span>}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Institutional Email *</label>
                    <input
                      type="email"
                      {...registerEdit('email', { required: 'Email is required' })}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                    />
                    {errorsEdit.email && <span className="text-error text-xs block font-mono mt-1">{errorsEdit.email.message}</span>}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Phone Number</label>
                    <input
                      {...registerEdit('phone')}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                    />
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Department *</label>
                    <select
                      {...registerEdit('department', { required: 'Department mapping is required' })}
                      className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2.5 text-base focus:ring-0 focus:border-primary outline-none cursor-pointer"
                    >
                      <option value="">Select Department...</option>
                      {departments.map(dept => (
                        <option key={dept._id} value={dept._id}>{dept.name}</option>
                      ))}
                    </select>
                    {errorsEdit.department && <span className="text-error text-xs block font-mono mt-1">{errorsEdit.department.message}</span>}
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Status</label>
                    <select
                      {...registerEdit('status')}
                      className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2.5 text-base focus:ring-0 focus:border-primary outline-none cursor-pointer"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  {/* Designation */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Designation</label>
                    <input
                      {...registerEdit('designation')}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                    />
                  </div>

                  {/* Qualification */}
                  <div>
                    <label className="block font-mono text-[10px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Qualification</label>
                    <input
                      {...registerEdit('qualification')}
                      className="w-full input-underline py-2 focus:ring-0 text-base"
                    />
                  </div>
                </div>

                <div className="flex gap-4 justify-end pt-4 border-t border-primary/5">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="py-3 px-6 rounded-xl border border-primary/10 text-sm font-semibold hover:bg-primary/5 active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-3 px-6 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-container active:scale-[0.98] transition-all"
                  >
                    Sync Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          DELETE DIALOG
      ======================================================== */}
      <AnimatePresence>
        {deleteDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteDialogOpen(false)}
              className="fixed inset-0 bg-black/45 backdrop-blur-sm"
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-surface-container-lowest max-w-md w-full rounded-[24px] border border-primary/10 p-8 shadow-2xl z-50 text-center space-y-6"
            >
              <div className="w-16 h-16 rounded-full bg-error/15 text-error flex items-center justify-center mx-auto text-3xl">
                <span className="material-symbols-outlined">delete_forever</span>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-primary">Remove Staff Master</h3>
                <p className="text-on-surface-variant text-sm">
                  Are you sure you want to remove the record for <strong>{selectedStaff?.name}</strong>? If this staff has already registered, their active User authentication account will also be deleted.
                </p>
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setDeleteDialogOpen(false)}
                  className="py-3 px-6 rounded-xl border border-primary/10 text-sm font-semibold hover:bg-primary/5 active:scale-95 transition-all w-1/2"
                >
                  No, Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="py-3 px-6 rounded-xl bg-error text-white text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all w-1/2"
                >
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          BATCH IMPORT EXCEL MODAL
      ======================================================== */}
      <AnimatePresence>
        {importModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setImportModalOpen(false);
                setPreviewData([]);
                setImportErrors([]);
              }}
              className="fixed inset-0 bg-black/45 backdrop-blur-sm"
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-surface-container-lowest max-w-4xl w-full rounded-[24px] border border-primary/10 p-8 shadow-2xl z-50 max-h-[90vh] flex flex-col justify-between"
            >
              <div>
                <h3 className="text-xl font-bold text-primary mb-2">Import Staff Master (Excel)</h3>
                <p className="text-on-surface-variant text-xs mb-6">
                  Upload an Excel workbook (`.xlsx`, `.xls`) with columns: `Employee ID`, `Name`, `Email`, `Phone`, `Department Code`, `Designation`, `Qualification`.
                </p>

                {/* Upload Section */}
                <div className="border-2 border-dashed border-primary/10 rounded-2xl p-8 text-center bg-primary/5 cursor-pointer relative hover:bg-primary/10 transition-colors">
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleExcelUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full"
                  />
                  <span className="material-symbols-outlined text-4xl text-primary mb-2">upload_file</span>
                  <p className="text-sm font-semibold text-primary">Click or drag Excel file to preview data</p>
                  <p className="text-xs text-on-surface-variant mt-1">Accepts standard spreadsheet extensions.</p>
                </div>

                {/* Validation logs panel */}
                {importErrors.length > 0 && (
                  <div className="bg-error/10 border border-error/20 rounded-xl p-4 mt-6 max-h-[150px] overflow-y-auto text-xs text-error font-mono space-y-1">
                    <p className="font-bold">Errors found in validation check:</p>
                    {importErrors.map((err, i) => (
                      <p key={i}>• {err}</p>
                    ))}
                  </div>
                )}

                {/* Live spreadsheet preview table */}
                {previewData.length > 0 && (
                  <div className="mt-6 space-y-2">
                    <h4 className="text-sm font-bold text-primary">Sheet Preview ({previewData.length} records parsed)</h4>
                    <div className="overflow-y-auto max-h-[220px] rounded-xl border border-primary/5 bg-surface text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-primary/5 sticky top-0 font-semibold text-primary">
                          <tr>
                            <th className="p-2 border-b border-primary/5">Emp ID</th>
                            <th className="p-2 border-b border-primary/5">Name</th>
                            <th className="p-2 border-b border-primary/5">Email</th>
                            <th className="p-2 border-b border-primary/5">Dept Code/Name</th>
                            <th className="p-2 border-b border-primary/5">Designation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-primary/5 font-mono">
                          {previewData.map((row, idx) => (
                            <tr key={idx} className="hover:bg-primary/5">
                              <td className="p-2">{row.employeeId || <span className="text-error font-bold">MISSING</span>}</td>
                              <td className="p-2 font-sans font-semibold">{row.name || <span className="text-error font-bold">MISSING</span>}</td>
                              <td className="p-2">{row.email || <span className="text-error font-bold">MISSING</span>}</td>
                              <td className="p-2">{row.department || <span className="text-error font-bold">MISSING</span>}</td>
                              <td className="p-2 font-sans">{row.designation || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4 justify-end pt-6 border-t border-primary/5 mt-6">
                <button
                  onClick={() => {
                    setImportModalOpen(false);
                    setPreviewData([]);
                    setImportErrors([]);
                  }}
                  className="py-3 px-6 rounded-xl border border-primary/10 text-sm font-semibold hover:bg-primary/5 active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportSubmit}
                  disabled={previewData.length === 0}
                  className="py-3 px-6 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-container active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none"
                >
                  Confirm Import
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AdminStaff;
