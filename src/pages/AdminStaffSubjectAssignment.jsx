import React, { useState, useEffect } from 'react';
import { 
  Users, BookOpen, Layers, Edit3, Trash2, Search, X, Check, 
  HelpCircle, AlertCircle, PlusCircle, CheckSquare, Square
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';

const AdminStaffSubjectAssignment = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data lists
  const [assignments, setAssignments] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);
  const [staffList, setStaffList] = useState([]);

  // Assignment Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);
  const [subjectSearch, setSubjectSearch] = useState('');

  // Fetch all assignments and dropdowns
  const fetchData = async () => {
    setLoading(true);
    try {
      const dropdownsRes = await api.get('/staff-subjects/dropdowns');
      if (dropdownsRes.data?.success) {
        setSubjectsList(dropdownsRes.data.data.subjects || []);
        setStaffList(dropdownsRes.data.data.staffList || []);
      }

      const assignmentsRes = await api.get('/staff-subjects');
      if (assignmentsRes.data?.success) {
        setAssignments(assignmentsRes.data.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load subject mapping details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Open modal for editing
  const handleAssignClick = (staff) => {
    setSelectedStaff(staff);
    // Find if staff has existing subjects
    const existing = assignments.find(a => String(a._id) === String(staff._id));
    if (existing) {
      setSelectedSubjectIds(existing.assignedSubjects.map(s => String(s._id)));
    } else {
      setSelectedSubjectIds([]);
    }
    setSubjectSearch('');
    setModalOpen(true);
  };

  // Submit assignments
  const handleSaveAssignments = async () => {
    if (!selectedStaff) return;
    setSaving(true);
    const toastId = toast.loading(`Saving assignments for ${selectedStaff.name}...`);
    try {
      const res = await api.post('/staff-subjects/assign', {
        staffId: selectedStaff._id,
        subjectIds: selectedSubjectIds
      });
      if (res.data?.success) {
        toast.success(`Assigned subjects to ${selectedStaff.name} successfully!`, { id: toastId });
        setModalOpen(false);
        fetchData();
      } else {
        toast.error('Assignment failed.', { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Server error saving assignments.', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  // Search subjects in modal
  const filteredSubjects = subjectsList.filter(sub => 
    sub.name.toLowerCase().includes(subjectSearch.toLowerCase()) ||
    sub.code.toLowerCase().includes(subjectSearch.toLowerCase())
  );

  // Filtered staff lists on dashboard search
  const filteredStaffAssignments = assignments.filter(staff => 
    staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (staff.department?.name && staff.department.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Statistics summaries
  const totalStaff = staffList.length;
  const staffWithAssignments = assignments.filter(a => a.assignedSubjects.length > 0).length;
  const totalAssignmentsCount = assignments.reduce((acc, curr) => acc + (curr.assignedSubjects?.length || 0), 0);
  const totalSubjectsCount = subjectsList.length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 bg-[#FFFDFC]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[#1D1D1F] flex items-center gap-2">
            <Layers size={22} className="text-[#8C1D40]" />
            Staff Subject Mapping
          </h2>
          <p className="text-xs font-semibold text-gray-500 mt-1">
            Map faculty instructors to multiple subjects across departments to support Allied Course curriculum.
          </p>
        </div>
      </div>

      {/* STATISTICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Faculty */}
        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide">Total Faculty</p>
            <p className="text-2xl font-black text-gray-800">{totalStaff}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500">
            <Users size={18} />
          </div>
        </div>

        {/* Mapped Faculty */}
        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-extrabold text-[#059669] uppercase tracking-wide">Assigned Instructors</p>
            <p className="text-2xl font-black text-[#059669]">{staffWithAssignments}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#059669]">
            <Check size={18} />
          </div>
        </div>

        {/* Total Mappings */}
        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-extrabold text-[#8C1D40] uppercase tracking-wide">Total Assignments</p>
            <p className="text-2xl font-black text-[#8C1D40]">{totalAssignmentsCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#8C1D40]/5 border border-[#8C1D40]/10 flex items-center justify-center text-[#8C1D40]">
            <Layers size={18} />
          </div>
        </div>

        {/* Total Subjects */}
        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wide">Available Subjects</p>
            <p className="text-2xl font-black text-indigo-600">{totalSubjectsCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <BookOpen size={18} />
          </div>
        </div>

      </div>

      {/* SEARCH AND MAIN TABLE CONTAINER */}
      <div className="bg-white border border-gray-150 rounded-[20px] shadow-xs overflow-hidden">
        
        {/* Search header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 bg-[#FAFAFA] px-6 py-4 gap-3">
          <span className="text-xs font-black text-[#8C1D40] uppercase tracking-wider">Faculty Assignments Grid</span>
          
          <div className="relative max-w-xs w-full">
            <Search size={14} className="text-gray-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search staff, code, department..."
              className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#8C1D40] transition-colors"
            />
          </div>
        </div>

        {/* Assignments Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 space-y-4 animate-pulse">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 bg-gray-50 border border-gray-150 rounded-xl" />
              ))}
            </div>
          ) : (
            <table className="w-full text-left text-xs font-semibold text-gray-700">
              <thead className="bg-[#FAFAFA] border-b border-gray-100 text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">
                <tr>
                  <th className="px-6 py-4">Faculty Member</th>
                  <th className="px-6 py-4">Parent Dept</th>
                  <th className="px-6 py-4">Assigned Subjects ({subjectsList.length ? 'Multiple Allowed' : 'N/A'})</th>
                  <th className="px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredStaffAssignments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                      <Users size={24} className="mx-auto mb-2 text-gray-300" />
                      No matching faculty records found.
                    </td>
                  </tr>
                ) : (
                  filteredStaffAssignments.map((staff) => (
                    <tr key={staff._id} className="hover:bg-gray-50/50 transition-colors">
                      
                      {/* Name / ID */}
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-gray-900">{staff.name}</p>
                          <p className="text-[10px] font-mono text-gray-400 font-bold mt-0.5">{staff.employeeId} · {staff.designation || 'Staff'}</p>
                        </div>
                      </td>

                      {/* Parent Department */}
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-[#F9FAFB] border border-gray-200 text-gray-600 rounded-md font-mono text-[10px] font-bold">
                          {staff.department?.code || 'N/A'}
                        </span>
                      </td>

                      {/* Badges List */}
                      <td className="px-6 py-4">
                        {staff.assignedSubjects.length === 0 ? (
                          <span className="text-[11px] text-gray-400 font-semibold italic">No subjects assigned</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 max-w-xl">
                            {staff.assignedSubjects.map((sub) => (
                              <span 
                                key={sub._id} 
                                className="inline-flex px-2 py-0.5 bg-[#F8ECEF] border border-[#8C1D40]/10 text-[#8C1D40] rounded-full text-[10px] font-bold"
                              >
                                {sub.name} ({sub.code})
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleAssignClick(staff)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#8C1D40] hover:opacity-95 text-white text-xs font-bold rounded-xl transition-all shadow-xs active:scale-95"
                        >
                          <Edit3 size={12} />
                          Assign / Edit
                        </button>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {/* ASSIGNMENT MODAL / DRAWER */}
      <AnimatePresence>
        {modalOpen && selectedStaff && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs">
            
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-[#F0D6DD]/80 rounded-[28px] max-w-2xl w-full p-6 shadow-2xl z-50 flex flex-col justify-between max-h-[85vh]"
            >
              <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
                
                {/* Modal Title */}
                <div className="flex justify-between items-start pb-3 border-b border-gray-100">
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900">Map Subjects for {selectedStaff.name}</h3>
                    <p className="text-[10px] text-gray-500 font-semibold mt-0.5 uppercase tracking-wide font-mono">
                      ID: {selectedStaff.employeeId} · Dept: {selectedStaff.department?.name || 'N/A'}
                    </p>
                  </div>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="p-1.5 rounded-full hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Selected subjects quick pill panel */}
                <div className="space-y-1.5 shrink-0">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide">Selected Subjects ({selectedSubjectIds.length})</span>
                  <div className="flex flex-wrap gap-1.5 p-3 bg-[#FAFAFA] border border-gray-150 rounded-xl min-h-[50px] max-h-[100px] overflow-y-auto">
                    {selectedSubjectIds.length === 0 ? (
                      <span className="text-xs text-gray-400 italic font-semibold">Select subjects from list below...</span>
                    ) : (
                      selectedSubjectIds.map(subId => {
                        const subObj = subjectsList.find(s => String(s._id) === String(subId));
                        return (
                          <span 
                            key={subId}
                            className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 bg-[#8C1D40] text-white rounded-full text-[10px] font-bold"
                          >
                            {subObj?.name || 'Subject'}
                            <button
                              onClick={() => setSelectedSubjectIds(selectedSubjectIds.filter(id => id !== subId))}
                              className="w-4 h-4 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
                            >
                              <X size={10} />
                            </button>
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Search field in Modal */}
                <div className="relative shrink-0">
                  <Search size={13} className="text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={subjectSearch}
                    onChange={(e) => setSubjectSearch(e.target.value)}
                    placeholder="Search subject by name or code..."
                    className="w-full bg-white border border-gray-200 rounded-xl pl-8.5 pr-4 py-2 text-xs font-semibold focus:outline-none focus:border-[#8C1D40] transition-colors"
                  />
                </div>

                {/* Dynamic Subject Choices list */}
                <div className="flex-1 overflow-y-auto border border-gray-150 rounded-xl divide-y divide-gray-100 bg-[#FAFAFA]">
                  {filteredSubjects.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                      <AlertCircle size={20} className="mx-auto mb-2 text-gray-300" />
                      No subjects match your query.
                    </div>
                  ) : (
                    filteredSubjects.map(sub => {
                      const isSelected = selectedSubjectIds.includes(String(sub._id));
                      return (
                        <div
                          key={sub._id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedSubjectIds(selectedSubjectIds.filter(id => id !== String(sub._id)));
                            } else {
                              setSelectedSubjectIds([...selectedSubjectIds, String(sub._id)]);
                            }
                          }}
                          className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white transition-colors ${
                            isSelected ? 'bg-white border-l-2 border-[#8C1D40]' : ''
                          }`}
                        >
                          <div className="space-y-0.5">
                            <p className={`text-xs font-bold ${isSelected ? 'text-[#8C1D40]' : 'text-gray-800'}`}>
                              {sub.name}
                            </p>
                            <p className="text-[10px] text-gray-400 font-semibold font-mono">
                              Code: {sub.code} · Credits: {sub.credits} · Type: {sub.subjectType || 'Theory'}
                            </p>
                            <p className="text-[9px] text-gray-500 font-bold">
                              Dept: {sub.department?.name} · Sem: Semester {sub.semester?.semesterNumber}
                            </p>
                          </div>
                          
                          <button className={`p-1 rounded-md ${isSelected ? 'text-[#8C1D40]' : 'text-gray-300'}`}>
                            {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-end pt-4 border-t border-gray-100 mt-4 shrink-0">
                <button
                  onClick={() => setModalOpen(false)}
                  className="py-2.5 px-5 rounded-xl border border-gray-200 text-xs font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAssignments}
                  disabled={saving}
                  className="py-2.5 px-5 rounded-xl bg-[#8C1D40] hover:opacity-95 text-white text-xs font-bold transition-all shadow-xs active:scale-[0.98] disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Mapping'}
                </button>
              </div>

            </motion.div>

          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AdminStaffSubjectAssignment;
