import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Plus, Trash2, Edit2, Search, Sparkles, Paperclip, Check, Copy,
  ThumbsUp, ThumbsDown, StopCircle, RefreshCw, X, FileText, Image,
  MessageSquare, HelpCircle, GraduationCap, Lightbulb, BookOpen, Clock, MapPin, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

// ─── Suggested Prompt Cards for Redesigned Welcome Screen ──────────
const CARDS = [
  {
    icon: '📘',
    title: 'Explain Topic',
    description: 'Understand difficult concepts in simple language with examples.',
    prompt: 'Explain this topic in simple terms.'
  },
  {
    icon: '📅',
    title: 'Create Study Planner',
    description: 'Generate a personalized study timetable for your exams.',
    prompt: 'Create a study plan for my upcoming exams.'
  },
  {
    icon: '📝',
    title: 'Summarize Notes',
    description: 'Convert long notes into short revision-friendly summaries.',
    prompt: 'Summarize my notes.'
  },
  {
    icon: '🧠',
    title: 'Quiz Me',
    description: 'Generate MCQs and practice questions on any topic.',
    prompt: 'Create a quiz on this topic.'
  },
  {
    icon: '💻',
    title: 'Programming Help',
    description: 'Debug code, explain programming concepts, and solve coding problems.',
    prompt: 'Help me solve this programming problem.'
  },
  {
    icon: '🎴',
    title: 'Create Flashcards',
    description: 'Generate quick revision flashcards from any topic.',
    prompt: 'Generate flashcards for this topic.'
  },
  {
    icon: '🎯',
    title: 'Exam Preparation',
    description: 'Prepare for exams with important questions, revision tips, and study strategies.',
    prompt: 'Help me prepare for my exam.'
  }
];

// ─── Mock Responses database for student tutor simulator ──────────
const MOCK_ANSWERS = {
  default: `Hello! I am **EduAI**, your AI Study Tutor. 

I can help resolve your doubts, summarize notes, or quiz you on topics.
Here is how we can study together:
1. **Explain Topic**: Ask me to break down any complex concept.
2. **Flashcards & Quizzes**: Request test questions to challenge your knowledge.
3. **Syllabus Help**: Paste study syllabus guides to structure notes.

Here is a quick example of a clean search function:
\`\`\`javascript
function binarySearch(arr, target) {
  let left = 0, right = arr.length - 1;
  while (left <= right) {
    let mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}
\`\`\`
Ask me anything about your subjects!`,
  binary: `Let's break down why **Binary Search** has a time complexity of **O(log n)**:

### 1. The Core Strategy
Binary Search works by repeatedly dividing the search space in half. 
- In the worst case, you start with **n** elements.
- After 1 step, you have **n/2** elements remaining.
- After 2 steps, you have **n/4** elements remaining.
- After **k** steps, you have **n / (2^k)** elements remaining.

### 2. Solving for Complexity
The search terminates when the search space is reduced to 1 element:
- **n / (2^k) = 1**
- **n = 2^k**
- Taking log base 2 of both sides: **log2(n) = k**

Therefore, the maximum number of steps (k) required to find the element is directly proportional to **log2(n)**, which in Big-O notation is simplified to **O(log n)**.

### 3. Quick Code Representation
\`\`\`javascript
// Worst-case performance is log2(N) steps
const stepsCount = (n) => Math.ceil(Math.log2(n));
console.log("Steps for 1024 items: ", stepsCount(1024)); // Output: 10
\`\`\`
Does this make the logarithmic division clear?`,
  css: `Here are 5 revision flashcards on **CSS Flexbox** properties:

1. **Card 1: display: flex**
   - **Front**: How do you define a flex container?
   - **Back**: Apply \`display: flex;\` or \`display: inline-flex;\` to the parent element.

2. **Card 2: justify-content**
   - **Front**: Which property aligns items along the main axis?
   - **Back**: \`justify-content\`. Options: \`flex-start\`, \`flex-end\`, \`center\`, \`space-between\`, \`space-around\`, \`space-evenly\`.

3. **Card 3: align-items**
   - **Front**: Which property aligns items along the cross axis?
   - **Back**: \`align-items\`. Options: \`stretch\` (default), \`flex-start\`, \`flex-end\`, \`center\`, \`baseline\`.

4. **Card 4: flex-direction**
   - **Front**: How do you make flex items stack vertically instead of horizontally?
   - **Back**: Set \`flex-direction: column;\` on the flex container.

5. **Card 5: flex-wrap**
   - **Front**: How do you force flex items onto multiple lines if space runs out?
   - **Back**: Apply \`flex-wrap: wrap;\` to the container element.`
};

const StudentAiCenter = () => {
  const { feature } = useParams();
  
  // ─── Chat States ──────────────────────────────────────────────────
  const [chats, setChats] = useState([
    { id: '1', title: 'Binary Search Doubt', category: 'Study Support', messages: [] },
    { id: '2', title: 'Flexbox Flashcards', category: 'Concept Review', messages: [] },
    { id: '3', title: 'Syllabus Summary Prep', category: 'General', messages: [] }
  ]);
  const [selectedChatId, setSelectedChatId] = useState('1');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [editingChatId, setEditingChatId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [likes, setLikes] = useState({}); // { msgId: 'like' | 'dislike' }

  // ─── Attachments Mock States ──────────────────────────────────────
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [fileInputType, setFileInputType] = useState(null); // 'pdf' | 'image'

  // Refs
  const chatBottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingIntervalRef = useRef(null);

  // Active chat
  const activeChat = chats.find(c => c.id === selectedChatId) || chats[0];

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeChat?.messages, isTyping]);

  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    };
  }, []);

  // ─── Chat Management ──────────────────────────────────────────────
  const handleNewChat = () => {
    const newId = Date.now().toString();
    const newChatObj = {
      id: newId,
      title: 'New Study Session',
      category: 'General',
      messages: []
    };
    setChats([newChatObj, ...chats]);
    setSelectedChatId(newId);
    setInputVal('');
    toast.success('Started a new study session.');
  };

  const handleDeleteChat = (e, id) => {
    e.stopPropagation();
    const updated = chats.filter(c => c.id !== id);
    setChats(updated);
    if (selectedChatId === id && updated.length > 0) {
      setSelectedChatId(updated[0].id);
    }
    toast.success('Session removed.');
  };

  const handleStartRename = (e, chat) => {
    e.stopPropagation();
    setEditingChatId(chat.id);
    setEditingTitle(chat.title);
  };

  const handleSaveRename = (id) => {
    if (!editingTitle.trim()) return;
    setChats(chats.map(c => c.id === id ? { ...c, title: editingTitle } : c));
    setEditingChatId(null);
    toast.success('Session renamed.');
  };

  const handleClearHistory = () => {
    if (window.confirm('Clear all conversation logs in this study session?')) {
      setChats(chats.map(c => c.id === selectedChatId ? { ...c, messages: [] } : c));
      toast.success('Study history cleared.');
    }
  };

  // ─── Prompt Attachments Mock ──────────────────────────────────────
  const triggerAttachment = (type) => {
    setFileInputType(type);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      setAttachedFiles([...attachedFiles, {
        name: file.name,
        type: fileInputType,
        size: (file.size / 1024).toFixed(1) + ' KB'
      }]);
      toast.success(`Attached ${file.name}`);
    }
    e.target.value = null;
  };

  const handleRemoveAttachment = (idx) => {
    setAttachedFiles(attachedFiles.filter((_, i) => i !== idx));
  };

  // ─── Chat Logic & EduAI Integration ───────────────────────────────
  const handleSendMessage = (textToSend) => {
    const text = textToSend || inputVal;
    if (!text.trim() && attachedFiles.length === 0) return;

    // 1. Add User Message
    const userMsgId = Date.now().toString();
    const userMessage = {
      id: userMsgId,
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachments: [...attachedFiles]
    };

    const updatedMessages = [...(activeChat?.messages || []), userMessage];
    
    // Update active chat title if it's generic
    let chatTitle = activeChat?.title;
    if (chatTitle === 'New Study Session') {
      chatTitle = text.slice(0, 24) + (text.length > 24 ? '...' : '');
    }

    setChats(chats.map(c => c.id === selectedChatId ? { ...c, title: chatTitle, messages: updatedMessages } : c));
    setInputVal('');
    setAttachedFiles([]);
    setIsTyping(true);

    // Call API and stream/simulate typing for the response
    api.post('/ai/chat', {
      message: text,
      role: 'student',
      history: (activeChat?.messages || []).map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }))
    })
    .then(res => {
      const responseText = res.data && res.data.success && res.data.data ? res.data.data.message : 'No response from EduAI.';
      
      let currentLength = 0;
      const textChunks = responseText.split(' ');
      const aiMsgId = (Date.now() + 1).toString();

      // Placeholder message
      const aiPlaceholder = {
        id: aiMsgId,
        sender: 'ai',
        text: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChats(prevChats => prevChats.map(c => {
        if (c.id === selectedChatId) {
          // Keep userMsg + aiPlaceholder
          return { ...c, messages: [...c.messages.filter(m => m.id !== aiMsgId), aiPlaceholder] };
        }
        return c;
      }));

      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);

      typingIntervalRef.current = setInterval(() => {
        if (currentLength >= textChunks.length) {
          clearInterval(typingIntervalRef.current);
          setIsTyping(false);
          return;
        }
        currentLength += 2;
        const currentText = textChunks.slice(0, currentLength).join(' ');

        setChats(prevChats => prevChats.map(c => {
          if (c.id === selectedChatId) {
            return {
              ...c,
              messages: c.messages.map(m => m.id === aiMsgId ? { ...m, text: currentText } : m)
            };
          }
          return c;
        }));
      }, 40);
    })
    .catch(err => {
      console.error(err);
      toast.error('Failed to communicate with EduAI.');
      setIsTyping(false);
    });
  };

  const handleStopGeneration = () => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      setIsTyping(false);
      toast.success('Tutor paused.');
    }
  };

  const handleRegenerate = (msgIndex) => {
    if (isTyping) return;
    const messages = activeChat.messages;
    const lastUserMsg = [...messages].reverse().find(m => m.sender === 'user');
    if (lastUserMsg) {
      const cleared = messages.slice(0, msgIndex);
      setChats(chats.map(c => c.id === selectedChatId ? { ...c, messages: cleared } : c));
      handleSendMessage(lastUserMsg.text);
    }
  };

  const handleCopyMessage = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied notes successfully!');
  };

  const handleFeedback = (msgId, type) => {
    setLikes(prev => ({
      ...prev,
      [msgId]: prev[msgId] === type ? null : type
    }));
    toast.success(type === 'like' ? 'Helpful explanation' : 'Feedback recorded');
  };

  // ─── Custom Markdown Parser ───────────────────────────────────────
  const renderMarkdownMessage = (text) => {
    if (!text) return <p className="text-xs text-gray-400">EduAI is analyzing concepts...</p>;
    const parts = text.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const codeLines = part.slice(3, -3).trim().split('\n');
        const language = codeLines[0] && !codeLines[0].includes(' ') ? codeLines[0] : 'javascript';
        const code = (language === codeLines[0] ? codeLines.slice(1) : codeLines).join('\n');
        return (
          <div key={index} className="my-3.5 rounded-xl border border-[rgba(122,0,31,0.12)] bg-[#1e1e24] text-gray-100 overflow-hidden font-mono text-xs shadow-sm">
            <div className="flex items-center justify-between px-4 py-2 bg-[#121216] text-[#7A001F] font-bold border-b border-[#2d2d35] text-[10px] tracking-wider">
              <span>{language.toUpperCase()}</span>
              <button
                onClick={() => handleCopyMessage(code)}
                className="hover:text-white transition-colors flex items-center gap-1"
              >
                <Copy size={11} /> Copy
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-[11px] leading-relaxed"><code>{code}</code></pre>
          </div>
        );
      }

      const inlineLines = part.split('\n');
      return inlineLines.map((line, lIdx) => {
        let content = line;
        const boldRegex = /\*\*(.*?)\*\*/g;
        const parsedElements = [];
        let lastIndex = 0;
        let match;
        
        while ((match = boldRegex.exec(content)) !== null) {
          if (match.index > lastIndex) {
            parsedElements.push(content.substring(lastIndex, match.index));
          }
          parsedElements.push(<strong key={match.index} className="font-bold text-[#7A001F]">{match[1]}</strong>);
          lastIndex = boldRegex.lastIndex;
        }
        if (lastIndex < content.length) {
          parsedElements.push(content.substring(lastIndex));
        }

        if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
          return (
            <li key={lIdx} className="ml-5 list-disc my-1 leading-relaxed text-[#374151] text-[12.5px]">
              {parsedElements.length > 0 ? parsedElements : line.trim().substring(2)}
            </li>
          );
        }
        
        return line.trim() === '' ? (
          <div key={lIdx} className="h-2" />
        ) : (
          <p key={lIdx} className="my-1 leading-relaxed text-[#374151] text-[12.5px]">
            {parsedElements.length > 0 ? parsedElements : line}
          </p>
        );
      });
    });
  };

  // Filtered Chats
  const filteredChats = chats.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' || c.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // ─── Sub-features Catalog (Coming Soon Screen Router) ──────────────
  const subFeaturesDetails = {
    explain: {
      title: 'Explain Topic',
      description: 'Stuck on a tricky module? Paste paragraph excerpts or equations here to get structural breakdowns, analogies, and simplified definitions.',
      points: [
        'Analogies matched to your study profile',
        'Mathematical formulas breakdown analysis',
        'Generates related practice codes',
        'Downloadable quick sheets summaries'
      ]
    },
    summarize: {
      title: 'Summarize Notes',
      description: 'Upload lecture slides or copy-paste long textbook chapters to generate condensed bullet guides and key takeaways.',
      points: [
        'Compresses 50 pages into 5-minute summaries',
        'Extracts terminology glossaries automatically',
        'Identifies major lecture themes and exam focus points',
        'High-density layout checklists output'
      ]
    },
    flashcards: {
      title: 'AI Flashcards Deck',
      description: 'Convert syllabus requirements into active-recall flashcard sets to drill formulas, dates, definitions, and code syntax.',
      points: [
        'Spaced repetition learning metrics',
        'Custom decks sorted by sub-course subjects',
        'Interactive self-grading layout',
        'Export decks to standard study formats'
      ]
    },
    quiz: {
      title: 'Quiz Me Workspace',
      description: 'Assess your topic readiness with custom-generated multiple choice and short-answer evaluations aligned with university standards.',
      points: [
        'Timed practice simulations mode',
        'Bloom\'s cognitive difficulty levels adjustments',
        'Instant answers marking with review reports',
        'Historical records profile comparisons'
      ]
    },
    practice: {
      title: 'Practice Questions',
      description: 'Work through database question pools of varying difficulties designed to improve concept application and logic flow.',
      points: [
        'Detailed answers breakdowns reviews',
        'Adaptive difficulty progression logic',
        'Exposes common trap selections',
        'Includes step-by-step mathematical scripts'
      ]
    },
    planner: {
      title: 'Study Planner Calendar',
      description: 'Input exam dates and available daily hours to generate a customized, balanced review schedule.',
      points: [
        'Distributes preparation topics evenly',
        'Buffer time padding before assessment days',
        'Pushes alerts indicators to portal profile',
        'Dynamically re-routes dates if items are skipped'
      ]
    },
    career: {
      title: 'Career Guidance Dashboard',
      description: 'Explore tech roles, check required subject parameters, and request advice on tailoring portfolios and resume projects.',
      points: [
        'Maps grades strengths to engineering fields',
        'Suggests specific stack modules projects',
        'Practice interviews mockup questions creator',
        'Provides templates for technical portfolios'
      ]
    }
  };

  // Render placeholder if it's not a chat feature (all AI Center links are chat features now)
  const isChatFeature = true;
  if (!isChatFeature) {
    const detail = subFeaturesDetails[feature] || {
      title: 'AI Tutor Feature',
      description: 'This premium study assistant capability is scheduled for portal activation.',
      points: ['EduAI-powered study enhancement modules', 'Direct assessment analytics feedback']
    };

    return (
      <div className="space-y-6">
        {/* Breadcrumb Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-[#1A1A1A]">{detail.title}</h2>
            <p className="text-xs text-[#6B7280]">AI Center Workspace / Student Dashboard</p>
          </div>
          <Link
            to="/student/ai-center/tutor"
            className="flex items-center gap-1.5 px-4 py-2 bg-[#7A001F] text-white rounded-xl text-xs font-bold shadow-md hover:bg-[#8C1D40] transition-colors"
          >
            <Sparkles size={14} /> Back to AI Tutor
          </Link>
        </div>

        {/* Card Panel */}
        <div className="bg-white rounded-3xl border border-[#F0D6DD] shadow-[0_12px_36px_rgba(122,0,31,0.03)] p-8 max-w-4xl mx-auto flex flex-col md:flex-row gap-8 items-center">
          {/* SVG Illustration */}
          <div className="w-48 h-48 flex-shrink-0 flex items-center justify-center bg-gradient-to-tr from-[#7A001F]/5 to-[#A11D42]/10 rounded-3xl border border-[#FDF3F6]">
            <svg width="90" height="90" viewBox="0 0 24 24" fill="none" stroke="#7A001F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
              <path d="M6 6h10M6 10h10M6 14h10" />
            </svg>
          </div>

          {/* Details */}
          <div className="flex-1 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7A001F]/10 border border-[#7A001F]/20 text-[#7A001F] text-[10px] font-black uppercase tracking-wider">
              <Sparkles size={11} /> Student Co-Pilot
            </div>
            <h3 className="text-lg font-extrabold text-[#111111]">{detail.title} Preview</h3>
            <p className="text-xs text-[#6B7280] leading-relaxed font-semibold">{detail.description}</p>
            
            <div className="pt-2">
              <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#7A001F] mb-2">Planned Capabilities</h4>
              <ul className="space-y-1.5">
                {detail.points.map((p, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-[#4B5563] font-medium">
                    <span className="w-1.5 h-1.5 bg-[#C24B72] rounded-full shrink-0"></span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            {/* Glassmorphic Coming Soon Bar */}
            <div className="pt-4 flex items-center gap-4 border-t border-[rgba(122,0,31,0.06)] mt-4">
              <div className="px-5 py-2.5 bg-gradient-to-tr from-[#7A001F]/5 to-[#C24B72]/5 border border-[rgba(122,0,31,0.06)] rounded-xl flex items-center gap-3 w-full">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></span>
                <div className="min-w-0">
                  <p className="text-[10px] font-mono font-bold text-[#7A001F] uppercase tracking-wider">Status: Development Pipeline</p>
                  <p className="text-[11px] text-[#6B7280] mt-0.5">Deployment slated for Next Academic Term release.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Student Tutor Chat Interface ─────────────────────────────────
  return (
    <div className="h-[calc(100vh-120px)] flex bg-[#FFFDFC] rounded-3xl border border-[#F0D6DD] overflow-hidden shadow-[0_12px_45px_rgba(122,0,31,0.03)]">
      
      {/* File input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* ── Chat Sidebar (Left Panel) ────────────────────────────────── */}
      <aside className="w-64 border-r border-[#F0D6DD] bg-white flex flex-col shrink-0">
        
        {/* New Chat & Search */}
        <div className="p-4 border-b border-[#F0D6DD] space-y-3">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#7A001F] text-white rounded-xl text-xs font-bold shadow-md hover:bg-[#8C1D40] transition-colors"
          >
            <Plus size={14} /> New Study Session
          </button>
          
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={13} />
            <input
              type="text"
              placeholder="Search concepts log..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-[#F0D6DD] rounded-xl text-xs bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#7A001F] focus:bg-white"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="px-4 py-2 border-b border-[#F0D6DD] flex gap-1.5 overflow-x-auto text-[10px] font-bold">
          {['All', 'Study Support', 'Concept Review', 'General'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-1 rounded-full shrink-0 transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#7A001F]/10 text-[#7A001F]'
                  : 'text-[#6B7280] hover:bg-gray-100'
              }`}
            >
              {cat.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* List of past conversations */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {filteredChats.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <MessageSquare className="mx-auto mb-2 text-gray-200" size={24} />
              <p className="text-[10px] font-medium">No sessions found</p>
            </div>
          ) : (
            filteredChats.map((c) => {
              const active = c.id === selectedChatId;
              const isEditing = c.id === editingChatId;

              return (
                <div
                  key={c.id}
                  onClick={() => {
                    if (!isEditing) setSelectedChatId(c.id);
                  }}
                  className={`group w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors relative ${
                    active
                      ? 'bg-[#7A001F]/10 text-[#7A001F]'
                      : 'text-[#6B7280] hover:bg-[rgba(122,0,31,0.03)]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <MessageSquare size={13} className="shrink-0 text-gray-400 group-hover:text-[#7A001F]" />
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={() => handleSaveRename(c.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(c.id);
                        }}
                        className="w-full bg-white border border-[#7A001F] rounded px-1 text-xs focus:outline-none"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="truncate pr-1">{c.title}</span>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 shrink-0 transition-opacity">
                      <button
                        onClick={(e) => handleStartRename(e, c)}
                        className="p-0.5 text-gray-400 hover:text-[#7A001F] rounded"
                        title="Rename session"
                      >
                        <Edit2 size={11} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteChat(e, c.id)}
                        className="p-0.5 text-gray-400 hover:text-red-600 rounded"
                        title="Delete session"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-[#F0D6DD] bg-gray-50 flex items-center justify-between">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Study Session Log</span>
          <button
            onClick={handleClearHistory}
            className="text-[10px] font-bold text-red-600 hover:underline flex items-center gap-1"
          >
            Clear Current
          </button>
        </div>
      </aside>

      {/* ── Chat Work Area ───────────────────────────────────────────── */}
      <section className="flex-1 bg-[#FFFDFC] flex flex-col min-w-0">
        
        {/* Top Active Chat header info */}
        <header className="px-6 py-3.5 border-b border-[#F0D6DD] bg-white flex items-center justify-between shrink-0">
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold text-[#111111] truncate">{activeChat?.title || 'Study Session'}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[9px] font-mono font-bold text-[#7A001F] uppercase tracking-wider">EduAI Engine Active</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-mono font-bold text-[#6B7280] uppercase tracking-wider">Clearance Mode</p>
              <p className="text-[11px] text-[#7A001F] font-bold mt-0.5">Encrypted Academic Line</p>
            </div>
          </div>
        </header>

        {/* Message Logs Viewport */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {(!activeChat?.messages || activeChat.messages.length === 0) ? (
            
            // Welcome Screen
            <div className="max-w-4xl mx-auto py-10 px-4 space-y-10">
              {/* Center Heading */}
              <div className="text-center space-y-3">
                <div className="inline-flex w-14 h-14 bg-[#7A001F]/5 border border-[#7A001F]/10 rounded-2xl items-center justify-center text-[#7A001F] shadow-sm animate-pulse mb-1">
                  <Sparkles size={24} />
                </div>
                <h1 className="text-2xl font-black text-[#7A001F] tracking-tight">
                  👋 Hello, I'm EduAI
                </h1>
                <p className="text-xs font-semibold text-gray-500 max-w-lg mx-auto leading-relaxed">
                  Your intelligent learning assistant for students.
                  <br />
                  Ask me anything related to your studies.
                </p>
              </div>

              {/* Suggestions Grid */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                  <Sparkles size={14} className="text-[#7A001F]" />
                  <h2 className="text-[10px] font-extrabold uppercase tracking-wider text-[#7A001F]">
                    ✨ You can ask EduAI to...
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {CARDS.map((card, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInputVal(card.prompt)}
                      className="text-left bg-white border border-[#F0D6DD]/80 rounded-2xl p-5 shadow-[0_4px_12px_rgba(122,0,31,0.02)] hover:shadow-[0_8px_20px_rgba(122,0,31,0.06)] hover:border-[#7A001F] hover:-translate-y-0.5 transition-all duration-200 group flex flex-col justify-between h-full"
                    >
                      <div className="space-y-2">
                        <div className="text-xl">{card.icon}</div>
                        <h3 className="text-xs font-bold text-[#111111] group-hover:text-[#7A001F] transition-colors tracking-tight">
                          {card.title}
                        </h3>
                        <p className="text-[11px] text-gray-500 leading-relaxed font-semibold">
                          {card.description}
                        </p>
                      </div>
                      <div className="mt-4 pt-2 flex items-center text-[10px] font-bold text-[#7A001F] opacity-0 group-hover:opacity-100 transition-opacity">
                        Use prompt <ChevronRight size={10} className="ml-0.5 mt-0.5" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

          ) : (
            
            // Conversation Bubbles
            <div className="max-w-3xl mx-auto space-y-6">
              {activeChat.messages.map((m, idx) => {
                const isUser = m.sender === 'user';
                return (
                  <div
                    key={m.id}
                    className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {/* Bot Avatar */}
                    {!isUser && (
                      <div className="w-8 h-8 rounded-full bg-[#7A001F]/10 border border-[#7A001F]/20 flex items-center justify-center text-[#7A001F] shrink-0 font-mono text-xs font-bold">
                        🤖
                      </div>
                    )}

                    {/* Bubble */}
                    <div className={`max-w-[85%] space-y-1`}>
                      <div className={`p-4 rounded-[20px] shadow-xs text-xs font-medium ${
                        isUser
                          ? 'bg-[#7A001F]/5 border border-[#7A001F]/10 text-[#111111]'
                          : 'bg-white border border-[#F0D6DD]'
                      }`}>
                        
                        {/* Attachments preview inside User bubble */}
                        {isUser && m.attachments && m.attachments.length > 0 && (
                          <div className="mb-2.5 flex flex-wrap gap-2">
                            {m.attachments.map((file, fIdx) => (
                              <div key={fIdx} className="flex items-center gap-1.5 px-2 py-1 rounded bg-white border border-[#F0D6DD] text-[10px] text-gray-500 font-mono">
                                {file.type === 'pdf' ? <FileText size={10} className="text-[#7A001F]" /> : <Image size={10} className="text-blue-500" />}
                                <span className="truncate max-w-[80px]">{file.name}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Text */}
                        <div className="prose max-w-none text-xs">
                          {isUser ? m.text : renderMarkdownMessage(m.text)}
                        </div>
                      </div>

                      {/* Bubble Actions Toolbar */}
                      <div className={`flex items-center gap-2 text-[10px] font-semibold text-gray-400 ${isUser ? 'justify-end' : 'justify-start'}`}>
                        <span>{m.timestamp}</span>
                        {!isUser && m.text && (
                          <>
                            <span>·</span>
                            <button
                              onClick={() => handleCopyMessage(m.text)}
                              className="hover:text-[#7A001F] transition-colors flex items-center gap-0.5"
                              title="Copy answer notes"
                            >
                              <Copy size={11} /> Copy
                            </button>
                            <span>·</span>
                            <button
                              onClick={() => handleRegenerate(idx)}
                              className="hover:text-[#7A001F] transition-colors flex items-center gap-0.5"
                              title="Regenerate this response"
                            >
                              <RefreshCw size={11} /> Retry
                            </button>
                            <span>·</span>
                            <button
                              onClick={() => handleFeedback(m.id, 'like')}
                              className={`transition-colors hover:text-emerald-500 ${likes[m.id] === 'like' ? 'text-emerald-500 font-bold' : ''}`}
                            >
                              <ThumbsUp size={11} />
                            </button>
                            <button
                              onClick={() => handleFeedback(m.id, 'dislike')}
                              className={`transition-colors hover:text-red-500 ${likes[m.id] === 'dislike' ? 'text-red-500 font-bold' : ''}`}
                            >
                              <ThumbsDown size={11} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* User Avatar */}
                    {isUser && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#7A001F] to-[#A11D42] flex items-center justify-center text-white shrink-0 font-bold text-xs uppercase shadow-sm">
                        U
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Bot Typing Simulator Indicator */}
              {isTyping && (
                <div className="flex gap-4 justify-start">
                  <div className="w-8 h-8 rounded-full bg-[#7A001F]/10 border border-[#7A001F]/20 flex items-center justify-center text-[#7A001F] shrink-0 font-mono text-xs font-bold">
                    🤖
                  </div>
                  <div className="space-y-1.5 max-w-[85%]">
                    <div className="p-4 rounded-[20px] bg-white border border-[#F0D6DD] shadow-sm flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-[#7A001F] rounded-full animate-bounce delay-0"></span>
                        <span className="w-1.5 h-1.5 bg-[#7A001F] rounded-full animate-bounce [animation-delay:0.2s]"></span>
                        <span className="w-1.5 h-1.5 bg-[#7A001F] rounded-full animate-bounce [animation-delay:0.4s]"></span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono font-bold">EduAI is composing tutor notes...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>
          )}
        </div>

        {/* Input Dock Panel */}
        <div className="p-4 border-t border-[#F0D6DD] bg-white space-y-3 shrink-0">
          
          {/* Active file attachments previews */}
          {attachedFiles.length > 0 && (
            <div className="max-w-3xl mx-auto flex flex-wrap gap-2 px-2">
              {attachedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FDF3F6]/80 border border-[#F0D6DD] text-[10px] font-bold text-[#7A001F] tracking-tight relative group">
                  {file.type === 'pdf' ? <FileText size={11} /> : <Image size={11} />}
                  <span className="truncate max-w-[100px]">{file.name}</span>
                  <span className="text-[9px] text-gray-400 font-normal">({file.size})</span>
                  <button
                    onClick={() => handleRemoveAttachment(idx)}
                    className="p-0.5 rounded-full hover:bg-[#7A001F]/10 text-gray-500 hover:text-[#7A001F] transition-colors"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Controls Bar & Input Box */}
          <div className="max-w-3xl mx-auto flex items-end gap-3 bg-gray-50 border border-[#F0D6DD] rounded-2xl p-2 focus-within:ring-1 focus-within:ring-[#7A001F] focus-within:bg-white transition-all">
            
            {/* Action buttons attachments triggers */}
            <div className="flex items-center gap-1 mb-1">
              <button
                onClick={() => triggerAttachment('pdf')}
                type="button"
                className="p-1.5 text-gray-400 hover:text-[#7A001F] hover:bg-white rounded-lg transition-colors"
                title="Attach lecture notes PDF"
              >
                <FileText size={15} />
              </button>
              <button
                onClick={() => triggerAttachment('image')}
                type="button"
                className="p-1.5 text-gray-400 hover:text-[#7A001F] hover:bg-white rounded-lg transition-colors"
                title="Attach question image"
              >
                <Image size={15} />
              </button>
            </div>

            {/* Input Element */}
            <textarea
              rows={1}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask EduAI to explain code, solve algebra steps, or create self-quizzes..."
              className="flex-1 max-h-24 min-h-[32px] py-1.5 px-2 bg-transparent text-xs font-semibold text-[#111111] focus:outline-none resize-none leading-relaxed"
            />

            {/* End Controls sends/stops */}
            <div className="flex items-center gap-1.5 mb-0.5">
              {isTyping ? (
                <button
                  onClick={handleStopGeneration}
                  type="button"
                  className="p-2 bg-amber-500 text-white rounded-xl shadow hover:bg-amber-600 transition-colors"
                  title="Stop generation"
                >
                  <StopCircle size={14} />
                </button>
              ) : (
                <button
                  onClick={() => handleSendMessage()}
                  type="button"
                  disabled={!inputVal.trim() && attachedFiles.length === 0}
                  className="p-2 bg-[#7A001F] text-white rounded-xl shadow hover:bg-[#8C1D40] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send size={14} />
                </button>
              )}
            </div>

          </div>

          {/* Disclaimer details */}
          <p className="text-[9px] text-[#9CA3AF] text-center font-medium">
            EduAI Study Assistant. Verify mathematical formulas definitions with course textbooks independently.
          </p>
        </div>

      </section>

    </div>
  );
};

export default StudentAiCenter;
