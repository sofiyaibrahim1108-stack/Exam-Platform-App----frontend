import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  HelpCircle, Book, FileText, Send, MessageSquare,
  ChevronDown, ChevronRight, Mail, AlertCircle
} from 'lucide-react';
import api from '../services/api';

const SuperAdminHelp = () => {
  const [faqs, setFaqs] = useState([]);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  // Load FAQ questions list on mount
  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const response = await api.get('/help/faqs');
        if (response.data && response.data.success) {
          setFaqs(response.data.data.faqs);
          setDocs(response.data.data.documentation);
        }
      } catch (error) {
        toast.error('Failed to load help resources.');
      } finally {
        setLoading(false);
      }
    };
    fetchFaqs();
  }, []);

  // SUBMIT support ticket
  const onTicketSubmit = async (data) => {
    setSubmitting(true);
    const toastId = toast.loading('Submitting ticket...');
    try {
      await api.post('/help/contact', data);
      toast.success('Ticket submitted successfully! We will email you back.', { id: toastId });
      reset();
    } catch (error) {
      toast.error(error.message || 'Ticket submission failed.', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-12 bg-gray-100 rounded-xl w-48"></div>
        <div className="h-64 bg-gray-105 rounded-[24px] w-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header HERO */}
      <div className="bg-white p-6 rounded-[24px] border border-[#EADFE3] shadow-[0_12px_30px_rgba(139,21,56,0.04)]">
        <h2 className="text-xl font-extrabold text-[#8B1538]">Help & Documentation Center</h2>
        <p className="text-gray-500 text-xs mt-0.5 font-semibold">Read manual documentation sheets, browse system FAQs, or submit support tickets.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Documentation & FAQs (Col span 2) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* FAQs List */}
          <div className="bg-white p-8 rounded-[24px] border border-[#EADFE3] shadow-[0_12px_30px_rgba(139,21,56,0.04)] space-y-6">
            <h3 className="text-sm font-extrabold text-[#8B1538] pb-2 border-b border-gray-100 flex items-center gap-2">
              <MessageSquare size={16} />
              Frequently Asked Questions (FAQ)
            </h3>
            
            <div className="space-y-3 font-semibold text-xs text-gray-700">
              {faqs.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div key={index} className="border border-gray-150 rounded-2xl overflow-hidden bg-gray-50/20">
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                      className="w-full flex items-center justify-between p-4 text-left font-bold text-gray-800 hover:bg-gray-50/50 transition-colors"
                    >
                      <span>{faq.q}</span>
                      {isOpen ? <ChevronDown size={15} className="text-[#8B1538]" /> : <ChevronRight size={15} className="text-gray-400" />}
                    </button>
                    {isOpen && (
                      <div className="p-4 bg-white border-t border-gray-100 text-gray-500 leading-relaxed font-semibold text-[11px]">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Documentation Manual Files */}
          <div className="bg-white p-8 rounded-[24px] border border-[#EADFE3] shadow-[0_12px_30px_rgba(139,21,56,0.04)] space-y-6">
            <h3 className="text-sm font-extrabold text-[#8B1538] pb-2 border-b border-gray-100 flex items-center gap-2">
              <Book size={16} />
              System Documentation
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {docs.map((doc, idx) => (
                <a
                  key={idx}
                  href={doc.link}
                  className="p-4 border border-gray-150 hover:border-[#8B1538]/30 rounded-2xl hover:shadow-[0_8px_20px_rgba(139,21,56,0.03)] transition-all bg-white block space-y-2 group"
                >
                  <FileText size={24} className="text-[#8B1538] group-hover:scale-105 transition-transform" />
                  <p className="text-xs font-bold text-gray-850 truncate">{doc.name}</p>
                  <p className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider">Reference PDF</p>
                </a>
              ))}
            </div>
          </div>

        </div>

        {/* Right Side: Contact Support Form */}
        <div className="lg:col-span-1">
          <div className="bg-white p-8 rounded-[24px] border border-[#EADFE3] shadow-[0_12px_30px_rgba(139,21,56,0.04)] space-y-6 sticky top-24">
            <div>
              <h3 className="text-sm font-extrabold text-[#8B1538] flex items-center gap-2">
                <HelpCircle size={16} />
                Contact Support
              </h3>
              <p className="text-gray-500 text-xs mt-0.5 font-semibold">Submit support tickets to engineering teams.</p>
            </div>

            <form onSubmit={handleSubmit(onTicketSubmit)} className="space-y-6">
              {/* Subject */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Ticket Subject</label>
                <input
                  {...register('title', { required: 'Subject is required' })}
                  className="w-full input-underline py-2 focus:ring-0 text-xs font-semibold text-gray-850"
                  placeholder="e.g. SMTP connection failures"
                />
                {errors.title && <span className="text-red-500 text-xs block font-mono mt-1">{errors.title.message}</span>}
              </div>

              {/* Category */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Category</label>
                <select
                  {...register('category')}
                  className="w-full input-underline py-2 focus:ring-0 text-xs font-semibold text-gray-600 bg-white"
                >
                  <option value="General">General Inquiry</option>
                  <option value="Technical">Technical Bug</option>
                  <option value="Exam Issue">Exam Issue</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Priority</label>
                <select
                  {...register('priority')}
                  className="w-full input-underline py-2 focus:ring-0 text-xs font-semibold text-gray-600 bg-white"
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority (CRITICAL)</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Details Description</label>
                <textarea
                  {...register('description', { required: 'Details are required' })}
                  rows={4}
                  className="w-full input-underline py-2 focus:ring-0 text-xs font-semibold text-gray-850 leading-relaxed"
                  placeholder="Describe error steps, logs, or details..."
                />
                {errors.description && <span className="text-red-500 text-xs block font-mono mt-1">{errors.description.message}</span>}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#8B1538] hover:bg-[#720F2B] text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all w-full shadow-md shadow-[#8B1538]/10 flex items-center justify-center gap-1.5"
                >
                  <Send size={12} />
                  {submitting ? 'Submitting...' : 'Submit Support Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SuperAdminHelp;
