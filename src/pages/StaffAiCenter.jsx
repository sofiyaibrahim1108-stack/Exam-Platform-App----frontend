import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Plus, Trash2, Edit2, Search, Sparkles, Paperclip, Check, Copy,
  ThumbsUp, ThumbsDown, StopCircle, RefreshCw, X, FileText, Image,
  MessageSquare, Brain, HelpCircle, GraduationCap, Lightbulb, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

// ─── Suggested Prompt Cards for Redesigned Welcome Screen ──────────
const CARDS = [
  {
    icon: '📚',
    title: 'AI Syllabus Analyzer',
    description: "Analyze syllabus and generate topics, learning/course outcomes, Bloom's Taxonomy mapping, and teaching suggestions.",
    prompt: "Analyze this syllabus and generate topics, outcomes, and Bloom's Taxonomy mapping."
  },
  {
    icon: '🎯',
    title: "Bloom's Taxonomy Assistant",
    description: 'Generate questions based on cognitive levels: Remember, Understand, Apply, Analyze, Evaluate, and Create.',
    prompt: "Generate Bloom's Taxonomy questions for this topic."
  },
  {
    icon: '📊',
    title: 'Difficulty Analyzer',
    description: 'Analyze whether questions are Easy, Medium, or Hard. Provide reasons and improvement suggestions.',
    prompt: "Analyze the difficulty level of these questions."
  },
  {
    icon: '✨',
    title: 'Question Improver',
    description: 'Improve grammar, clarity, quality, and formatting of questions while preserving their meaning.',
    prompt: "Improve these questions for clarity and grammar."
  },
  {
    icon: '🌐',
    title: 'Question Translator',
    description: 'Translate questions into English, Tamil, Hindi, or other supported languages.',
    prompt: "Translate these questions into Tamil."
  },
  {
    icon: '💡',
    title: 'Answer Explanation',
    description: 'Generate detailed model answers with step-by-step explanations suitable for students.',
    prompt: "Generate a detailed answer with explanation."
  },
  {
    icon: '🎲',
    title: 'Distractor Generator',
    description: 'Generate meaningful incorrect options for MCQs that are realistic and avoid obvious wrong answers.',
    prompt: "Generate three meaningful distractors for this MCQ."
  },
  {
    icon: '📝',
    title: 'AI Lesson Planner',
    description: 'Generate lesson plans including learning objectives, activities, exercises, assessments, and homework suggestions.',
    prompt: "Create a lesson plan for this topic."
  },
  {
    icon: '👨‍🏫',
    title: 'AI Teaching Assistant',
    description: 'Ask anything related to teaching, curriculum planning, classroom management, assessment strategies, or academic guidance.',
    prompt: "Help me teach this topic effectively."
  }
];

// ─── Mock Responses database for EduAI Simulator ─────────────────
const MOCK_ANSWERS = {
  default: `I am **ExamoraAI**, your university academic co-pilot. 

Based on your prompt, here is a structured analysis of the topics:
1. **Curriculum Alignment**: Align assessments directly with unit syllabus objectives.
2. **Bloom's Taxonomy**: Distribute questions across cognitive levels (Remember, Understand, Apply, Analyze, Evaluate, Create).
3. **Distractor Quality**: Ensure wrong answers mimic common student misconceptions.

Here is a quick sample syllabus blueprint:
\`\`\`javascript
const syllabusModule = {
  moduleName: "Advanced Distributed Systems",
  weeks: 4,
  cognitiveLevels: ["Analyze", "Evaluate"]
};
console.log("Aligned modules successfully generated.");
\`\`\`

Let me know if you would like me to compile specific questions or analyze a syllabus file!`,
  quantum: `Here are 5 advanced Multiple Choice Questions (MCQs) mapped to Quantum Computing logic gates:

1. **Question**: Which quantum gate corresponds to a classical NOT gate in terms of state transformation?
   - **Options**:
     - A) Hadamard (H) Gate
     - B) Pauli-X Gate **(Correct)**
     - C) CNOT Gate
     - D) Phase (S) Gate
   - **Explanation**: The Pauli-X gate performs a bit-flip on a single qubit, mapping |0⟩ to |1⟩ and |1⟩ to |0⟩.

2. **Question**: What is the primary output state of applying a Hadamard (H) gate to the ground state |0⟩?
   - **Options**:
     - A) |1⟩
     - B) |+⟩ **(Correct)**
     - C) |-⟩
     - D) |i⟩
   - **Explanation**: The H gate creates an equal superposition: ( |0⟩ + |1⟩ ) / √2, which is denoted as |+⟩.

3. **Question**: Which quantum gate requires two qubits to operate, acting as a conditional transformer?
   - **Options**:
     - A) Pauli-Y
     - B) CNOT **(Correct)**
     - C) T-gate
     - D) Identity
   - **Explanation**: The Controlled-NOT (CNOT) gate flips the target qubit if and only if the control qubit is |1⟩.

4. **Question**: What is the matrix representation of the Pauli-Z gate?
   - **Options**:
     - A) [[0, 1], [1, 0]]
     - B) [[1, 0], [0, -1]] **(Correct)**
     - C) [[0, -i], [i, 0]]
     - D) [[1, 1], [1, -1]] / √2

5. **Question**: In quantum algorithms, why is the Toffoli gate considered a universal gate for classical computation?
   - **Options**:
     - A) It is a 3-qubit controlled-controlled-NOT gate that can implement any boolean function reversibly. **(Correct)**
     - B) It can create entanglement from any unentangled input vector.
     - C) It introduces a continuous phase adjustment.
     - D) It bypasses decoherence completely.`,
  blooms: `Here is a Bloom's Taxonomy distribution blueprint designed for a Data Structures & Algorithms course:

- **Remembering (15%)**: Defining structures (e.g., linked list nodes, stacks, trees) and their corresponding space complexities.
- **Understanding (25%)**: Comparing average vs. worst-case time complexities of sorting algorithms (e.g., QuickSort vs. MergeSort).
- **Applying (30%)**: Writing traversals or tree-rotation functions (e.g., AVL tree rebalancing code).
- **Analyzing (20%)**: Profiling system runtimes and identifying hash-collision bottlenecks.
- **Evaluating / Creating (10%)**: Devising custom memory pooling strategies or lock-free data structures for high-performance concurrent networks.

Here is a visualization map of the node heights vs. algorithmic complexity:
\`\`\`javascript
function calculateComplexity(n) {
  // Mapped to Bloom's cognitive level: Apply
  return n * Math.log2(n); 
}
\`\`\`
Would you like me to generate questions for any specific category?`
};

const StaffAiCenter = () => {
  const { feature } = useParams();
  
  // ─── Chat States ──────────────────────────────────────────────────
  const [chats, setChats] = useState([
    { id: '1', title: 'Quantum MCQs Draft', category: 'Question Generation', messages: [] },
    { id: '2', title: 'Data Structures Blueprint', category: 'Course Planning', messages: [] },
    { id: '3', title: 'Syllabus Review Check', category: 'General', messages: [] }
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

  // Ref for auto scroll
  const chatBottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingIntervalRef = useRef(null);

  // Active chat calculation
  const activeChat = chats.find(c => c.id === selectedChatId) || chats[0];

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeChat?.messages, isTyping]);

  // Clean intervals on unmount
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
      title: 'New Chat Session',
      category: 'General',
      messages: []
    };
    setChats([newChatObj, ...chats]);
    setSelectedChatId(newId);
    setInputVal('');
    toast.success('Started a new chat session.');
  };

  const handleDeleteChat = (e, id) => {
    e.stopPropagation();
    const updated = chats.filter(c => c.id !== id);
    setChats(updated);
    if (selectedChatId === id && updated.length > 0) {
      setSelectedChatId(updated[0].id);
    }
    toast.success('Chat deleted.');
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
    toast.success('Chat renamed.');
  };

  const handleClearHistory = () => {
    if (window.confirm('Clear all chat conversations in this workspace?')) {
      setChats(chats.map(c => c.id === selectedChatId ? { ...c, messages: [] } : c));
      toast.success('Conversation history cleared.');
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
    e.target.value = null; // reset
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
    
    // Update active chat title if it's currently generic
    let chatTitle = activeChat?.title;
    if (chatTitle === 'New Chat Session') {
      chatTitle = text.slice(0, 24) + (text.length > 24 ? '...' : '');
    }

    setChats(chats.map(c => c.id === selectedChatId ? { ...c, title: chatTitle, messages: updatedMessages } : c));
    setInputVal('');
    setAttachedFiles([]);
    setIsTyping(true);

    // Call API and stream/simulate typing for the response
    api.post('/ai/chat', {
      message: text,
      role: 'staff',
      history: (activeChat?.messages || []).map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }))
    })
    .then(res => {
      const responseText = res.data && res.data.success && res.data.data ? res.data.data.message : 'No response from ExamoraAI.';
      
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
      }, 45);
    })
    .catch(err => {
      console.error(err);
      toast.error('Failed to communicate with ExamoraAI.');
      setIsTyping(false);
    });
  };

  const handleStopGeneration = () => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      setIsTyping(false);
      toast.success('Generation suspended.');
    }
  };

  const handleRegenerate = (msgIndex) => {
    if (isTyping) return;
    // Find last user message before this AI response
    const messages = activeChat.messages;
    const lastUserMsg = [...messages].reverse().find(m => m.sender === 'user');
    if (lastUserMsg) {
      // Remove everything from the index of the response onward, and send again
      const cleared = messages.slice(0, msgIndex);
      setChats(chats.map(c => c.id === selectedChatId ? { ...c, messages: cleared } : c));
      handleSendMessage(lastUserMsg.text);
    }
  };

  const handleCopyMessage = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Response copied to clipboard!');
  };

  const handleFeedback = (msgId, type) => {
    setLikes(prev => ({
      ...prev,
      [msgId]: prev[msgId] === type ? null : type // Toggle
    }));
    toast.success(type === 'like' ? 'Marked as helpful' : 'Marked as unhelpful');
  };

  // ─── Custom Markdown & Code Blocks Parser ─────────────────────────
  const renderMarkdownMessage = (text) => {
    if (!text) return <p className="text-xs text-gray-400">ExamoraAI is crafting an answer...</p>;
    const parts = text.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const codeLines = part.slice(3, -3).trim().split('\n');
        const language = codeLines[0] && !codeLines[0].includes(' ') ? codeLines[0] : 'javascript';
        const code = (language === codeLines[0] ? codeLines.slice(1) : codeLines).join('\n');
        return (
          <div key={index} className="my-3.5 rounded-xl border border-[rgba(140,29,64,0.12)] bg-[#1e1e24] text-gray-100 overflow-hidden font-mono text-xs shadow-md">
            <div className="flex items-center justify-between px-4 py-2 bg-[#121216] text-[#8C1D40] font-bold border-b border-[#2d2d35] text-[10px] tracking-wider">
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
          parsedElements.push(<strong key={match.index} className="font-bold text-[#8C1D40]">{match[1]}</strong>);
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
    'syllabus-analyzer': {
      title: 'AI Syllabus Analyzer',
      description: 'Review curriculum text, cross-reference mapping matrices, and generate direct topics coverage analysis from university PDF course lists.',
      points: [
        'Automatic topic hierarchy categorization',
        'Bloom\'s taxonomy mapping alignment scores',
        'Identify gaps between study material and lesson schedules',
        'Instant draft syllabus output template generation'
      ]
    },
    'blooms-taxonomy': {
      title: 'Bloom\'s Taxonomy Assistant',
      description: 'Audit assessment papers against educational cognitive levels to verify that exam formats match targeted academic milestones.',
      points: [
        'Question distributions by cognitive dimensions',
        'Rebalance templates with custom ratios',
        'Analyze action verbs (Explain, Devise, Contrast, Define)',
        'Align evaluations directly to outcomes'
      ]
    },
    'difficulty-analyzer': {
      title: 'Difficulty Analyzer',
      description: 'Evaluate assessment items based on linguistic patterns, question structure complexities, and historical student outcomes to estimate grading metrics.',
      points: [
        'Complexity indexing metrics',
        'Identify trick statements or linguistic biases',
        'Validate distractor lengths and options consistency',
        'Ensure stable test duration distributions'
      ]
    },
    'question-improver': {
      title: 'Question Improver',
      description: 'Refine raw assessment drafts into premium questions with optimized readability, correct taxonomic verbs, and highly valid distractors.',
      points: [
        'Polishes grammatical formatting',
        'Removes structural clues or dual correct choices',
        'Clarifies case-study statement paragraphs',
        'Automated readability standard scoring'
      ]
    },
    'question-translator': {
      title: 'Question Translator',
      description: 'Localize assessment materials across academic languages with precise preservation of course definitions and formatting templates.',
      points: [
        'Maintains math equations, symbols, and formulas',
        'Preserves code snippets and arrays exactly',
        'Standard definitions vocabulary dictionary checks',
        'Supports major international scientific languages'
      ]
    },
    'answer-explanation': {
      title: 'Answer Explanation Generator',
      description: 'Provide detailed step-by-step rationales for key answers to help students understand why distractor choices were marked incorrect.',
      points: [
        'Detailed correct option rationales',
        'Explain distractor traps and common logic mistakes',
        'Generates links to corresponding course textbook sections',
        'LaTeX equations and logic tables expansion'
      ]
    },
    'distractor-generator': {
      title: 'Distractor Generator',
      description: 'Generate high-fidelity incorrect choices based on real-world learning errors, making options challenging and academically valuable.',
      points: [
        'Generates plausible incorrect scenarios',
        'Detects and removes obvious throwaway choices',
        'Validates option balance (lengths, forms, styles)',
        'Adapts options from common arithmetic errors'
      ]
    },
    'lesson-planner': {
      title: 'AI Lesson Planner',
      description: 'Compile detailed week-by-week academic plans complete with study materials, interactive tasks, and recommended formative quizzes.',
      points: [
        'Outputs detailed lecture notes templates',
        'Maps classroom slides to home exercises',
        'Recommends custom sandbox projects',
        'Estimates pacing requirements dynamically'
      ]
    },
    'teaching-assistant': {
      title: 'AI Teaching Assistant',
      description: 'Get recommendations for course grading curves, custom email drafts for student assistance, and draft scripts for classroom demonstrations.',
      points: [
        'Draft study guides and review outlines',
        'Synthesize performance spreadsheets logs',
        'Automate common syllabus clarifications',
        'Construct laboratory exercise briefs'
      ]
    }
  };

  // Render placeholder if it's not a chat feature (all AI Center links are chat features now)
  const isChatFeature = true;
  if (!isChatFeature) {
    const detail = subFeaturesDetails[feature] || {
      title: 'AI Center Feature',
      description: 'This premium AI feature is currently scheduled for deployment.',
      points: ['Advanced ExamoraAI-powered optimizations', 'Automated grading assistance integration']
    };

    return (
      <div className="space-y-6">
        {/* Breadcrumb Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-[#1A1A1A]">{detail.title}</h2>
            <p className="text-xs text-[#6B7280]">AI Center Workspace / Academic Portal</p>
          </div>
          <Link
            to="/staff/ai-center/chat"
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#8C1D40] to-[#C74B74] text-white rounded-xl text-xs font-bold shadow-md hover:opacity-90 transition-opacity"
          >
            <Sparkles size={14} /> Back to AI Chat
          </Link>
        </div>

        {/* Card Panel */}
        <div className="bg-white rounded-3xl border border-[#F0D6DD] shadow-[0_12px_36px_rgba(140,29,64,0.04)] p-8 max-w-4xl mx-auto flex flex-col md:flex-row gap-8 items-center">
          {/* SVG Illustration */}
          <div className="w-48 h-48 flex-shrink-0 flex items-center justify-center bg-gradient-to-tr from-[#8C1D40]/5 to-[#C74B74]/10 rounded-3xl border border-[#F8ECEF]">
            <svg width="90" height="90" viewBox="0 0 24 24" fill="none" stroke="#8C1D40" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              <circle cx="12" cy="12" r="10" stroke="rgba(140,29,64,0.2)" strokeWidth="1" />
            </svg>
          </div>

          {/* Details */}
          <div className="flex-1 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8C1D40]/10 border border-[#8C1D40]/25 text-[#8C1D40] text-[10px] font-black uppercase tracking-wider">
              <Sparkles size={11} /> ExamoraAI Co-Pilot Feature
            </div>
            <h3 className="text-lg font-extrabold text-[#111111]">{detail.title} Preview</h3>
            <p className="text-xs text-[#6B7280] leading-relaxed font-semibold">{detail.description}</p>
            
            <div className="pt-2">
              <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#8C1D40] mb-2">Planned Capabilities</h4>
              <ul className="space-y-1.5">
                {detail.points.map((p, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-[#4B5563] font-medium">
                    <span className="w-1.5 h-1.5 bg-[#C74B74] rounded-full shrink-0"></span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            {/* Glassmorphic Coming Soon Bar */}
            <div className="pt-4 flex items-center gap-4 border-t border-[rgba(140,29,64,0.06)] mt-4">
              <div className="px-5 py-2.5 bg-gradient-to-tr from-[#8C1D40]/5 to-[#C74B74]/5 border border-[rgba(140,29,64,0.08)] rounded-xl flex items-center gap-3 w-full">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></span>
                <div className="min-w-0">
                  <p className="text-[10px] font-mono font-bold text-[#8C1D40] uppercase tracking-wider">Status: Development Pipeline</p>
                  <p className="text-[11px] text-[#6B7280] mt-0.5">Deployment slated for Next Academic Term release.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Chat Assistant Interface ──────────────────────────────────────
  return (
    <div className="h-[calc(100vh-100px)] flex bg-[#FFFDFC] rounded-3xl border border-[#F0D6DD] overflow-hidden shadow-[0_12px_45px_rgba(122,0,31,0.04)]">
      
      {/* File input for mockup attachments */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* ── Chat Sidebar (Left Panel) ────────────────────────────────── */}
      <aside className="w-64 border-r border-[#F0D6DD] bg-white flex flex-col shrink-0">
        
        {/* Upper Sidebar controls */}
        <div className="p-4 border-b border-[#F0D6DD] space-y-3">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#8C1D40] to-[#C74B74] text-white rounded-xl text-xs font-bold shadow-md hover:opacity-90 transition-opacity"
          >
            <Plus size={14} /> New Chat
          </button>
          
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={13} />
            <input
              type="text"
              placeholder="Search chat logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-[#F0D6DD] rounded-xl text-xs bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#8C1D40] focus:bg-white"
            />
          </div>
        </div>

        {/* Chat List categories */}
        <div className="px-4 py-2 border-b border-[#F0D6DD] flex gap-1.5 overflow-x-auto text-[10px] font-bold">
          {['All', 'Question Generation', 'Course Planning', 'General'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-1 rounded-full shrink-0 transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#8C1D40]/10 text-[#8C1D40]'
                  : 'text-[#6B7280] hover:bg-gray-100'
              }`}
            >
              {cat.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Logs */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {filteredChats.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <MessageSquare className="mx-auto mb-2 text-gray-200" size={24} />
              <p className="text-[10px] font-medium">No chats found</p>
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
                      ? 'bg-[#8C1D40]/10 text-[#8C1D40]'
                      : 'text-[#6B7280] hover:bg-[#F8ECEF]/40'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <MessageSquare size={13} className="shrink-0 text-gray-400 group-hover:text-[#8C1D40]" />
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={() => handleSaveRename(c.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(c.id);
                        }}
                        className="w-full bg-white border border-[#8C1D40] rounded px-1 text-xs focus:outline-none"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="truncate pr-1">{c.title}</span>
                    )}
                  </div>

                  {/* Actions overlay */}
                  {!isEditing && (
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 shrink-0 transition-opacity">
                      <button
                        onClick={(e) => handleStartRename(e, c)}
                        className="p-0.5 text-gray-400 hover:text-[#8C1D40] rounded"
                        title="Rename chat"
                      >
                        <Edit2 size={11} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteChat(e, c.id)}
                        className="p-0.5 text-gray-400 hover:text-red-600 rounded"
                        title="Delete chat"
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

        {/* Clear Conversations Footer */}
        <div className="p-3 border-t border-[#F0D6DD] bg-gray-50 flex items-center justify-between">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Workspace log</span>
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
        <header className="px-6 py-3 border-b border-[#F0D6DD] bg-white flex items-center justify-between shrink-0">
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold text-[#111111] truncate">{activeChat?.title || 'Chat Assistant'}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
              <span className="text-[9px] font-mono font-bold text-[#8C1D40] uppercase tracking-wider">ExamoraAI LLM Online Node</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-mono font-bold text-[#6B7280] uppercase tracking-wider">Course Reference</p>
              <p className="text-[11px] text-[#1D1D1F] font-bold mt-0.5">Global Syllabi Repository</p>
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
                  👋 Welcome to AI Assistant
                </h1>
                <p className="text-xs font-semibold text-gray-500 max-w-lg mx-auto leading-relaxed">
                  Your intelligent teaching companion.
                  <br />
                  Generate questions, improve assessments, create lesson plans, analyze syllabus, and simplify your teaching workflow using AI.
                </p>
              </div>

              {/* Suggestions Grid */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                  <Sparkles size={14} className="text-[#7A001F]" />
                  <h2 className="text-[10px] font-extrabold uppercase tracking-wider text-[#7A001F]">
                    ✨ You can ask AI Assistant to...
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
                      <div className="w-8 h-8 rounded-full bg-[#8C1D40]/10 border border-[#8C1D40]/20 flex items-center justify-center text-[#8C1D40] shrink-0 font-mono text-xs font-bold">
                        🤖
                      </div>
                    )}

                    {/* Bubble */}
                    <div className={`max-w-[85%] space-y-1`}>
                      <div className={`p-4 rounded-[20px] shadow-sm text-xs font-medium ${
                        isUser
                          ? 'bg-[#8C1D40]/5 border border-[#8C1D40]/15 text-[#111111]'
                          : 'bg-white border border-[#F0D6DD]'
                      }`}>
                        
                        {/* Attachments preview inside User bubble */}
                        {isUser && m.attachments && m.attachments.length > 0 && (
                          <div className="mb-2.5 flex flex-wrap gap-2">
                            {m.attachments.map((file, fIdx) => (
                              <div key={fIdx} className="flex items-center gap-1.5 px-2 py-1 rounded bg-white border border-[#F0D6DD] text-[10px] text-gray-500 font-mono">
                                {file.type === 'pdf' ? <FileText size={10} className="text-[#8C1D40]" /> : <Image size={10} className="text-blue-500" />}
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
                              className="hover:text-[#8C1D40] transition-colors flex items-center gap-0.5"
                              title="Copy answer text"
                            >
                              <Copy size={11} /> Copy
                            </button>
                            <span>·</span>
                            <button
                              onClick={() => handleRegenerate(idx)}
                              className="hover:text-[#8C1D40] transition-colors flex items-center gap-0.5"
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
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#8C1D40] to-[#C74B74] flex items-center justify-center text-white shrink-0 font-bold text-xs uppercase shadow-sm">
                        U
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Bot Typing Simulator Indicator */}
              {isTyping && (
                <div className="flex gap-4 justify-start">
                  <div className="w-8 h-8 rounded-full bg-[#8C1D40]/10 border border-[#8C1D40]/20 flex items-center justify-center text-[#8C1D40] shrink-0 font-mono text-xs font-bold">
                    🤖
                  </div>
                  <div className="space-y-1.5 max-w-[85%]">
                    <div className="p-4 rounded-[20px] bg-white border border-[#F0D6DD] shadow-sm flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-[#8C1D40] rounded-full animate-bounce delay-0"></span>
                        <span className="w-1.5 h-1.5 bg-[#8C1D40] rounded-full animate-bounce [animation-delay:0.2s]"></span>
                        <span className="w-1.5 h-1.5 bg-[#8C1D40] rounded-full animate-bounce [animation-delay:0.4s]"></span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono font-bold">ExamoraAI is streaming draft...</span>
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
                <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F8ECEF]/60 border border-[#F0D6DD] text-[10px] font-bold text-[#8C1D40] tracking-tight relative group">
                  {file.type === 'pdf' ? <FileText size={11} /> : <Image size={11} />}
                  <span className="truncate max-w-[100px]">{file.name}</span>
                  <span className="text-[9px] text-gray-400 font-normal">({file.size})</span>
                  <button
                    onClick={() => handleRemoveAttachment(idx)}
                    className="p-0.5 rounded-full hover:bg-[#8C1D40]/10 text-gray-500 hover:text-[#8C1D40] transition-colors"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Controls Bar & Input Box */}
          <div className="max-w-3xl mx-auto flex items-end gap-3 bg-gray-50 border border-[#F0D6DD] rounded-2xl p-2 focus-within:ring-1 focus-within:ring-[#8C1D40] focus-within:bg-white transition-all">
            
            {/* Action buttons attachments triggers */}
            <div className="flex items-center gap-1 mb-1">
              <button
                onClick={() => triggerAttachment('pdf')}
                type="button"
                className="p-1.5 text-gray-400 hover:text-[#8C1D40] hover:bg-white rounded-lg transition-colors"
                title="Attach PDF file"
              >
                <FileText size={15} />
              </button>
              <button
                onClick={() => triggerAttachment('image')}
                type="button"
                className="p-1.5 text-gray-400 hover:text-[#8C1D40] hover:bg-white rounded-lg transition-colors"
                title="Attach Image"
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
              placeholder="Ask ExamoraAI to draft questions, review syllabus or structure classes..."
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
                  className="p-2 bg-gradient-to-r from-[#8C1D40] to-[#C74B74] text-white rounded-xl shadow hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send size={14} />
                </button>
              )}
            </div>

          </div>

          {/* Disclaimer details */}
          <p className="text-[9px] text-[#9CA3AF] text-center font-medium">
            ExamoraAI Assistant uses integrated course parameters. Verify crucial syllabus codes independently.
          </p>
        </div>

      </section>

    </div>
  );
};

export default StaffAiCenter;
