import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../services/api';

const SuperAdminHelp = () => {
  const [faqs, setFaqs] = useState([]);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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
      <div className="space-y-6">
        <div className="h-12 bg-surface animate-pulse rounded-xl w-48"></div>
        <div className="h-64 bg-surface animate-pulse rounded-[24px] w-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header HERO */}
      <div className="glass-panel p-6 rounded-[24px] border border-primary/5">
        <h2 className="text-2xl font-bold text-primary">Help & Documentation Center</h2>
        <p className="text-on-surface-variant text-sm mt-1">Read manual documentation sheets, browse system FAQs, or submit support tickets.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Documentation & FAQs (Col span 2) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* FAQs List */}
          <div className="glass-panel p-8 rounded-[24px] border border-primary/5 space-y-6">
            <h3 className="text-lg font-bold text-primary pb-2 border-b border-primary/5 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">forum</span>
              Frequently Asked Questions (FAQ)
            </h3>
            
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <details key={index} className="group border border-primary/5 rounded-xl p-4 [&_summary::-webkit-details-marker]:hidden bg-surface cursor-pointer">
                  <summary className="flex items-center justify-between text-sm font-semibold text-primary">
                    <span>{faq.q}</span>
                    <span className="transition-transform group-open:rotate-180 material-symbols-outlined text-sm">
                      expand_more
                    </span>
                  </summary>
                  <p className="text-xs text-on-surface-variant leading-relaxed mt-3 pt-3 border-t border-primary/5">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </div>

          {/* Documentation Manual Files */}
          <div className="glass-panel p-8 rounded-[24px] border border-primary/5 space-y-6">
            <h3 className="text-lg font-bold text-primary pb-2 border-b border-primary/5 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">menu_book</span>
              System Documentation
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {docs.map((doc, idx) => (
                <a
                  key={idx}
                  href={doc.link}
                  className="p-4 border border-primary/5 hover:border-primary/20 rounded-xl hover:translate-y-[-2px] transition-all bg-surface block space-y-2 group"
                >
                  <span className="material-symbols-outlined text-primary text-2xl group-hover:scale-105 transition-transform">article</span>
                  <p className="text-xs font-semibold text-primary">{doc.name}</p>
                  <p className="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider">Reference PDF</p>
                </a>
              ))}
            </div>
          </div>

        </div>

        {/* Right Side: Contact Support Form */}
        <div className="lg:col-span-1">
          <div className="glass-panel p-8 rounded-[24px] border border-primary/5 space-y-6 sticky top-24">
            <div>
              <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">contact_support</span>
                Contact Support
              </h3>
              <p className="text-on-surface-variant text-xs mt-1">Submit support tickets to engineering teams.</p>
            </div>

            <form onSubmit={handleSubmit(onTicketSubmit)} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block font-mono text-[9px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Ticket Subject</label>
                <input
                  {...register('title', { required: 'Subject is required' })}
                  className="w-full input-underline py-2 focus:ring-0 text-sm"
                  placeholder="e.g. SMTP connection failures"
                />
                {errors.title && <span className="text-error text-xs font-mono mt-1">{errors.title.message}</span>}
              </div>

              {/* Category */}
              <div>
                <label className="block font-mono text-[9px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Category</label>
                <select
                  {...register('category')}
                  className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2 text-sm outline-none cursor-pointer focus:border-primary"
                >
                  <option value="General">General Inquiry</option>
                  <option value="Technical">Technical Bug</option>
                  <option value="Exam Issue">Exam Issue</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block font-mono text-[9px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Priority</label>
                <select
                  {...register('priority')}
                  className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2 text-sm outline-none cursor-pointer focus:border-primary"
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority (CRITICAL)</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block font-mono text-[9px] font-semibold text-on-surface-variant mb-1 uppercase px-1">Details Description</label>
                <textarea
                  {...register('description', { required: 'Details are required' })}
                  rows={4}
                  className="w-full bg-transparent border-0 border-b-2 border-outline-variant py-2 focus:ring-0 outline-none text-sm leading-relaxed"
                  placeholder="Describe error steps, logs, or details..."
                />
                {errors.description && <span className="text-error text-xs font-mono mt-1">{errors.description.message}</span>}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-primary text-white py-3.5 px-6 rounded-xl font-semibold hover:bg-primary-container active:scale-[0.98] transition-all text-sm w-full shadow-lg shadow-primary/10"
                >
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
