import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { tutorService, courseService, materialService } from '../services/api';
import { Course, Message, Citation } from '../types';
import { CitationBadge } from '../components/CitationBadge';
import { SourceViewerModal } from '../components/SourceViewerModal';
import {
  Send,
  BookOpen,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Bookmark,
  RefreshCw,
  PenTool,
  Paperclip,
  X,
  FileText,
  UploadCloud,
  CheckCircle2
} from 'lucide-react';

export const TutorChatPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);

  // File Upload State
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initTutor = async () => {
      try {
        const cList = await courseService.list();
        setCourses(cList);
        if (cList.length > 0) {
          const convs = await tutorService.listConversations(cList[0].id);
          if (convs.length > 0 && convs[0].messages.length > 0) {
            setConversationId(convs[0].id);
            setMessages(convs[0].messages);
          } else {
            setMessages([
              {
                id: 'init-1',
                sender: 'tutor',
                content:
                  "Hi! I am your course tutor. Ask me any doubt about your course, or **upload your lecture notes / slides** (PDF, TXT, PPT) using the 📎 button below to ask questions directly from your own material.",
                citations: [],
                is_grounded: true,
                created_at: new Date().toISOString(),
              },
            ]);
          }
        }
      } catch (err) {
        console.error('Failed to load tutor', err);
      }
    };
    initTutor();
  }, []);

  // Handle passed initial prompt from dashboard
  useEffect(() => {
    if (location.state && (location.state as any).initialPrompt) {
      const p = (location.state as any).initialPrompt;
      setInputQuery(p);
      setTimeout(() => {
        handleSend(p);
      }, 100);
    }
  }, [location.state]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachedFile(e.target.files[0]);
    }
  };

  const handleSend = async (queryToSend?: string) => {
    const query = queryToSend || inputQuery;
    if ((!query.trim() && !attachedFile) || courses.length === 0 || loading) return;

    const courseId = courses[0].id;
    let finalQuery = query.trim();

    setLoading(true);
    setInputQuery('');

    // If a file is attached, upload & ingest it first
    if (attachedFile) {
      setUploadingFile(true);
      try {
        const uploadResult = await materialService.upload(
          courseId,
          attachedFile,
          attachedFile.name
        );
        
        const fileName = attachedFile.name;
        setAttachedFile(null);

        // If user didn't write a question, default to explaining the notes
        if (!finalQuery) {
          finalQuery = `I just uploaded my notes "${fileName}". Please give me a concise summary and explain the core concepts and key points.`;
        }

        const userMsg: Message = {
          id: `user-${Date.now()}`,
          sender: 'user',
          content: `📎 [Uploaded: ${fileName}]\n\n${finalQuery}`,
          citations: [],
          is_grounded: true,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userMsg]);
      } catch (uploadErr) {
        console.error('Error uploading attached note', uploadErr);
      } finally {
        setUploadingFile(false);
      }
    } else {
      const userMsg: Message = {
        id: `user-${Date.now()}`,
        sender: 'user',
        content: finalQuery,
        citations: [],
        is_grounded: true,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
    }

    try {
      const response = await tutorService.chat(courseId, finalQuery, conversationId);
      setConversationId(response.conversation_id);
      setMessages((prev) => [...prev, response.message]);
    } catch (err) {
      console.error('Tutor chat error', err);
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: 'tutor',
        content: "I couldn't retrieve that information right now. Please try asking again.",
        citations: [],
        is_grounded: false,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionChip = (actionType: string, msg: Message) => {
    if (actionType === 'practice') {
      navigate('/practice');
    } else if (actionType === 'show_source' && msg.citations && msg.citations.length > 0) {
      setActiveCitation(msg.citations[0]);
    } else if (actionType === 'explain_simply') {
      handleSend('Explain that concept more simply in plain terms.');
    } else if (actionType === 'show_example') {
      handleSend('Show me a concrete step-by-step code example of that.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col h-[calc(100vh-4rem)]">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-white">AI Tutor</h2>
          <p className="text-[11px] text-slate-400">
            Ask any doubt or upload your notes to get instant grounded explanations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-xs px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
            title="Upload notes file"
          >
            <Paperclip className="w-3.5 h-3.5 text-indigo-400" />
            <span>Upload Notes</span>
          </button>

          <button
            onClick={() => {
              setMessages([]);
              setConversationId(undefined);
            }}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            New conversation
          </button>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".pdf,.txt,.md,.ppt,.pptx,.doc,.docx"
        className="hidden"
      />

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-6 py-6 pr-1">
        {messages.map((msg) => {
          const isTutor = msg.sender === 'tutor';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isTutor ? 'items-start' : 'items-end'}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-4 py-3.5 space-y-3 ${
                  isTutor
                    ? 'bg-slate-900 border border-slate-800/90 text-slate-200 text-sm leading-relaxed'
                    : 'bg-indigo-600 text-white text-sm shadow-sm'
                }`}
              >
                {/* Content */}
                <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

                {/* Source References */}
                {isTutor && msg.citations && msg.citations.length > 0 && (
                  <div className="pt-2.5 border-t border-slate-800/80 space-y-1.5">
                    <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                      From your course & notes:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.citations.map((c, idx) => (
                        <CitationBadge
                          key={idx}
                          citation={c}
                          onClick={(cit) => setActiveCitation(cit)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Contextual Action Chips */}
              {isTutor && msg.id !== 'init-1' && (
                <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pl-1">
                  <button
                    onClick={() => handleActionChip('explain_simply', msg)}
                    className="text-xs px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    Explain simply
                  </button>
                  <button
                    onClick={() => handleActionChip('show_example', msg)}
                    className="text-xs px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    Show an example
                  </button>
                  <button
                    onClick={() => handleActionChip('practice', msg)}
                    className="text-xs px-2.5 py-1 rounded-md bg-indigo-950/70 border border-indigo-800/60 hover:border-indigo-600 text-indigo-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 font-medium"
                  >
                    <PenTool className="w-3 h-3" /> Practice with me
                  </button>
                  {msg.citations && msg.citations.length > 0 && (
                    <button
                      onClick={() => handleActionChip('show_source', msg)}
                      className="text-xs px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <BookOpen className="w-3 h-3" /> Show source
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 pl-1 font-mono">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            <span>
              {uploadingFile
                ? 'Uploading & indexing your notes...'
                : 'Thinking and checking course material...'}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Section */}
      <div className="pt-2 shrink-0 space-y-2">
        {/* Attached File Preview Chip */}
        {attachedFile && (
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-indigo-950/70 border border-indigo-800/80 text-xs text-indigo-200 animate-fadeIn">
            <div className="flex items-center gap-2 truncate">
              <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="font-medium truncate">{attachedFile.name}</span>
              <span className="text-[11px] text-indigo-400/80 font-mono">
                ({(attachedFile.size / 1024).toFixed(1)} KB)
              </span>
            </div>
            <button
              onClick={() => setAttachedFile(null)}
              className="p-1 rounded-md hover:bg-indigo-900/60 text-indigo-300 hover:text-white transition-colors cursor-pointer"
              title="Remove attached note"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-center"
        >
          {/* Paperclip Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`absolute left-3 p-1.5 rounded-lg transition-colors cursor-pointer ${
              attachedFile
                ? 'text-indigo-400 bg-indigo-950/60'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Attach Notes / PDF / Slides"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder={
              attachedFile
                ? `Ask any doubt about "${attachedFile.name}"...`
                : "Ask a doubt or click 📎 to upload notes..."
            }
            disabled={loading}
            className="w-full pl-11 pr-24 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/40 transition-all"
          />

          <button
            type="submit"
            disabled={loading || (!inputQuery.trim() && !attachedFile)}
            className="absolute right-2 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <span>Ask</span>
            <Send className="w-3 h-3" />
          </button>
        </form>
      </div>

      {/* Source Viewer Modal */}
      <SourceViewerModal citation={activeCitation} onClose={() => setActiveCitation(null)} />
    </div>
  );
};
