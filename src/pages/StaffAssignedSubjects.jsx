import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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

  const handleComingSoon = (moduleName) => {
    toast.error(`${moduleName} workspace will be unlocked in Phase 2.`, {
      icon: '🔒',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="glass-panel p-6 rounded-[24px] animate-pulse">
          <div className="h-8 bg-surface-container-high rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-surface-container-high rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-panel p-6 rounded-[24px] space-y-4 animate-pulse">
              <div className="h-5 bg-surface-container-high rounded w-3/4"></div>
              <div className="h-4 bg-surface-container-high rounded w-1/2"></div>
              <div className="h-10 bg-surface-container-high rounded w-full mt-4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-[24px]">
        <h2 className="text-2xl font-bold text-primary mb-1">My Assigned Subjects</h2>
        <p className="text-on-surface-variant text-xs">
          View subjects mapped to your instruction profile by the Administrator. Access question generation and evaluations.
        </p>
      </div>

      {assignments.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-16 text-center border-2 border-dashed border-primary/10 rounded-[28px] bg-primary/5 max-w-lg mx-auto"
        >
          <span className="material-symbols-outlined text-on-surface-variant/20 text-6xl mb-4">menu_book</span>
          <h4 className="text-base font-bold text-on-surface">No Subjects Assigned</h4>
          <p className="text-on-surface-variant text-xs mt-1">
            You do not have any active subject assignments for the current academic session. Please contact the administrator.
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
              className="glass-panel p-6 rounded-[24px] border border-primary/5 shadow-sm flex flex-col justify-between hover:translate-y-[-2px] transition-all duration-300"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="px-2 py-0.5 bg-primary/10 border border-primary/15 rounded-md text-[9px] font-mono font-bold text-primary uppercase">
                    {item.subject?.subjectType || 'Theory'}
                  </span>
                  <span className="px-2.5 py-0.5 bg-secondary/15 text-secondary border border-secondary/10 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider">
                    AY {item.academicYear}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-primary truncate leading-snug">{item.subject?.name}</h3>
                  <p className="text-[10px] font-mono text-on-surface-variant mt-0.5">Code: {item.subject?.code}</p>
                </div>

                <div className="pt-2 grid grid-cols-2 gap-2 text-[10px] font-semibold text-on-surface-variant border-t border-primary/5">
                  <div>
                    <span className="text-[9px] block text-on-surface-variant/50 uppercase font-mono">Department</span>
                    <span className="truncate block mt-0.5">{item.department?.code}</span>
                  </div>
                  <div>
                    <span className="text-[9px] block text-on-surface-variant/50 uppercase font-mono">Course</span>
                    <span className="truncate block mt-0.5">{item.course?.code}</span>
                  </div>
                  <div className="col-span-2 pt-1.5">
                    <span className="text-[9px] block text-on-surface-variant/50 uppercase font-mono">Semester & Credits</span>
                    <span className="block mt-0.5">
                      Semester {item.semester?.semesterNumber} ({item.subject?.credits || 3} Credits)
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-4 mt-4 border-t border-primary/5">
                <button
                  onClick={() => {
                    setSelectedSubject(item);
                    setDetailsModalOpen(true);
                  }}
                  className="py-2 rounded-xl text-[10px] bg-primary/10 text-primary font-bold hover:bg-primary/20 transition-all font-sans text-center"
                >
                  View Details
                </button>
                
                {(() => {
                  const s = syllabi.find(sy => sy.subject === item.subject?._id);
                  const isCompleted = s?.status === 'Completed';
                  const hasDraft = s?.status === 'Draft';
                  
                  return (
                    <>
                      <button
                        onClick={() => navigate(`/staff/syllabus/${item.subject?._id}`)}
                        className={`py-2 rounded-xl text-[10px] font-bold transition-all text-center flex items-center justify-center gap-1 ${
                          isCompleted
                            ? 'bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/15'
                            : hasDraft
                            ? 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-700 border border-yellow-500/20'
                            : 'bg-primary text-white hover:bg-primary/90 shadow-sm'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[12px]">
                          {isCompleted ? 'check_circle' : hasDraft ? 'edit_note' : 'menu_book'}
                        </span>
                        {isCompleted ? 'Syllabus (Saved)' : hasDraft ? 'Syllabus (Draft)' : 'Syllabus'}
                      </button>
                    </>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetailsModalOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface rounded-[24px] border border-primary/10 shadow-2xl p-6 w-full max-w-md z-10 relative overflow-hidden"
            >
              <h3 className="text-lg font-bold text-primary mb-2">Subject Details</h3>
              <p className="text-on-surface-variant text-[11px] mb-4">Full academic metadata and assignment log records.</p>

              <div className="space-y-3 text-xs bg-surface-container-low p-4 rounded-xl">
                <div className="flex justify-between border-b border-primary/5 pb-2">
                  <span className="text-on-surface-variant font-medium">Subject Code</span>
                  <span className="font-mono font-bold text-primary">{selectedSubject.subject?.code}</span>
                </div>
                <div className="flex justify-between border-b border-primary/5 pb-2">
                  <span className="text-on-surface-variant font-medium">Subject Name</span>
                  <span className="font-semibold text-right max-w-[200px]">{selectedSubject.subject?.name}</span>
                </div>
                <div className="flex justify-between border-b border-primary/5 pb-2">
                  <span className="text-on-surface-variant font-medium">Course Mapped</span>
                  <span className="font-semibold">{selectedSubject.course?.name} ({selectedSubject.course?.code})</span>
                </div>
                <div className="flex justify-between border-b border-primary/5 pb-2">
                  <span className="text-on-surface-variant font-medium">Academic Year</span>
                  <span className="font-bold text-secondary">{selectedSubject.academicYear}</span>
                </div>
                <div className="flex justify-between border-b border-primary/5 pb-2">
                  <span className="text-on-surface-variant font-medium">Assigned Date</span>
                  <span className="font-mono">{new Date(selectedSubject.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant font-medium">Subject Credits</span>
                  <span className="font-bold font-mono">{selectedSubject.subject?.credits || 3} Credits</span>
                </div>
              </div>

              <div className="flex justify-end pt-4 mt-6 border-t border-primary/5">
                <button
                  onClick={() => setDetailsModalOpen(false)}
                  className="px-5 py-2 text-xs font-semibold bg-primary text-white hover:bg-primary-container rounded-xl transition-all shadow-lg shadow-primary/10"
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
