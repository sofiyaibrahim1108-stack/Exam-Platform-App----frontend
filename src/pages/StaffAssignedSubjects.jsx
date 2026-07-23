import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Calendar, Building2, Info, CheckCircle2, Edit3, BookMarked, X, Layers, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const StaffAssignedSubjects = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [syllabi, setSyllabi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/faculty-assignments/staff/me');
      const syllabiRes = await api.get('/syllabi');
      if (response.data && response.data.success) {
        const list = response.data.data.assignments || [];
        setAssignments(list);
      }
      if (syllabiRes.data && syllabiRes.data.success) {
        setSyllabi(syllabiRes.data.data || []);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to retrieve assigned subjects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 font-sans">
        <div className="bg-white border border-[rgba(140,29,64,0.08)] p-6 rounded-[24px] animate-pulse">
          <div className="h-8 bg-gray-100 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-100 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-[rgba(140,29,64,0.08)] p-6 rounded-[24px] space-y-4 animate-pulse">
              <div className="h-5 bg-gray-100 rounded w-3/4"></div>
              <div className="h-4 bg-gray-100 rounded w-1/2"></div>
              <div className="h-10 bg-gray-100 rounded w-full mt-4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans pb-10">
      {/* Header */}
      <div className="bg-white border border-[rgba(140,29,64,0.08)] p-6 rounded-[24px] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#8C1D40]/5 rounded-full blur-2xl pointer-events-none"></div>
        <h2 className="text-xl font-extrabold text-[#1D1D1F] mb-1">My Assigned Subjects</h2>
        <p className="text-[#6B7280] text-xs">
          View subjects mapped to your instruction profile by the Administrator. Access question generation and syllabus analyzer.
        </p>
      </div>

      {assignments.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-16 text-center border border-[rgba(140,29,64,0.08)] rounded-[28px] bg-white max-w-lg mx-auto shadow-xs"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#F8ECEF] text-[#8C1D40] flex items-center justify-center mx-auto mb-4">
            <BookOpen size={28} />
          </div>
          <h4 className="text-sm font-bold text-[#1D1D1F]">No Subjects Assigned</h4>
          <p className="text-[#6B7280] text-xs mt-1 leading-relaxed">
            You do not have any active subject assignments for the current academic session. Please contact your department administration to assign courses.
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((item, idx) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white border border-[rgba(140,29,64,0.08)] p-6 rounded-[24px] shadow-xs flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group relative overflow-hidden"
            >
              {/* Top border bar */}
              <span className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#8C1D40] to-[#C74B74] opacity-0 group-hover:opacity-100 transition-opacity"></span>

              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="px-2 py-0.5 bg-[#F8ECEF] border border-[#8C1D40]/10 rounded-md text-[9px] font-mono font-bold text-[#8C1D40] uppercase">
                    {item.subject?.subjectType || 'Theory'}
                  </span>
                  <span className="px-2.5 py-0.5 bg-[#F8ECEF]/40 text-[#C74B74] border border-[#8C1D40]/5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider">
                    AY {item.academicYear}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-extrabold text-[#1D1D1F] truncate leading-tight group-hover:text-[#8C1D40] transition-colors">{item.subject?.name}</h3>
                  <p className="text-[10px] font-mono text-[#6B7280] mt-0.5 font-semibold">Code: {item.subject?.code}</p>
                </div>

                <div className="pt-3.5 grid grid-cols-2 gap-2 text-[10px] font-bold text-[#6B7280] border-t border-gray-100">
                  <div>
                    <span className="text-[8px] block text-[#9CA3AF] uppercase font-mono font-bold">Department</span>
                    <span className="truncate block mt-0.5 text-[#1D1D1F]">{item.department?.code}</span>
                  </div>
                  <div>
                    <span className="text-[8px] block text-[#9CA3AF] uppercase font-mono font-bold">Course</span>
                    <span className="truncate block mt-0.5 text-[#1D1D1F]">{item.course?.code}</span>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-gray-50 mt-1">
                    <span className="text-[8px] block text-[#9CA3AF] uppercase font-mono font-bold">Semester & Credits</span>
                    <span className="block mt-0.5 text-[#1D1D1F]">
                      Semester {item.semester?.semesterNumber} ({item.subject?.credits || 3} Credits)
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-4 mt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSubject(item);
                    setDetailsModalOpen(true);
                  }}
                  className="py-2 rounded-xl text-[10px] bg-gray-50 border border-gray-200 text-[#6B7280] font-bold hover:bg-gray-100 hover:text-[#1D1D1F] transition-all font-sans text-center"
                >
                  View Details
                </button>
                
                {(() => {
                  const s = syllabi.find(sy => sy.subject === item.subject?._id);
                  const isCompleted = s?.status === 'Completed';
                  const hasDraft = s?.status === 'Draft';
                  
                  return (
                    <button
                      type="button"
                      onClick={() => navigate(`/staff/syllabus/${item.subject?._id}`)}
                      className={`py-2 rounded-xl text-[10px] font-bold transition-all text-center flex items-center justify-center gap-1.5 border ${
                        isCompleted
                          ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-500/20'
                          : hasDraft
                          ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-500/20'
                          : 'bg-gradient-to-r from-[#8C1D40] to-[#C74B74] hover:opacity-95 text-white border-transparent shadow-xs active:scale-95'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 size={12} />
                      ) : hasDraft ? (
                        <Edit3 size={12} />
                      ) : (
                        <BookMarked size={12} />
                      )}
                      {isCompleted ? 'Syllabus (Saved)' : hasDraft ? 'Syllabus (Draft)' : 'Syllabus'}
                    </button>
                  );
                })()}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* DETAILS DIALOG */}
      <AnimatePresence>
        {detailsModalOpen && selectedSubject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetailsModalOpen(false)}
              className="fixed inset-0"
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[24px] border border-[rgba(140,29,64,0.10)] shadow-2xl p-6 w-full max-w-md z-10 relative overflow-hidden"
            >
              <h3 className="text-sm font-extrabold text-[#1D1D1F] mb-1 flex items-center gap-2">
                <Info size={16} className="text-[#8C1D40]" />
                Subject Details
              </h3>
              <p className="text-[#6B7280] text-[10px] mb-4 font-semibold uppercase tracking-wider">Academic Metadata Record</p>

              <div className="space-y-3 text-xs bg-gray-50 border border-gray-100 p-4 rounded-2xl font-sans">
                <div className="flex justify-between border-b border-gray-200/50 pb-2">
                  <span className="text-[#6B7280] font-semibold">Subject Code</span>
                  <span className="font-mono font-bold text-[#8C1D40]">{selectedSubject.subject?.code}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200/50 pb-2">
                  <span className="text-[#6B7280] font-semibold">Subject Name</span>
                  <span className="font-bold text-right max-w-[200px] text-[#1D1D1F]">{selectedSubject.subject?.name}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200/50 pb-2">
                  <span className="text-[#6B7280] font-semibold">Course Mapped</span>
                  <span className="font-bold text-[#1D1D1F]">{selectedSubject.course?.name} ({selectedSubject.course?.code})</span>
                </div>
                <div className="flex justify-between border-b border-gray-200/50 pb-2">
                  <span className="text-[#6B7280] font-semibold">Academic Year</span>
                  <span className="font-extrabold text-[#C74B74]">{selectedSubject.academicYear}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200/50 pb-2">
                  <span className="text-[#6B7280] font-semibold">Assigned Date</span>
                  <span className="font-mono text-[#1D1D1F] font-semibold">{new Date(selectedSubject.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280] font-semibold">Subject Credits</span>
                  <span className="font-bold font-mono text-[#1D1D1F]">{selectedSubject.subject?.credits || 3} Credits</span>
                </div>
              </div>

              <div className="flex justify-end pt-4 mt-5 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setDetailsModalOpen(false)}
                  className="px-5 py-2 text-xs font-bold bg-[#8C1D40] text-white hover:opacity-95 rounded-xl transition-all shadow-xs"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StaffAssignedSubjects;
