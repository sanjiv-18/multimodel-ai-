import React, { useState, useEffect } from 'react';
import { materialService, courseService } from '../services/api';
import { Material, Course } from '../types';
import {
  UploadCloud, FileText, Presentation, Video, CheckCircle2,
  AlertCircle, ArrowRight, Loader2, Sparkles, Layers, Check
} from 'lucide-react';

export const MaterialUploadPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customTitle, setCustomTitle] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  const [currentStage, setCurrentStage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const cList = await courseService.list();
        setCourses(cList);
        if (cList.length > 0) {
          const mList = await materialService.list(cList[0].id);
          setMaterials(mList);
        }
      } catch (err) {
        console.error('Failed to load materials', err);
      }
    };
    loadData();
  }, []);

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || courses.length === 0) return;
    setUploading(true);
    setError('');
    setSuccessMessage('');

    try {
      // Step 1: Uploading
      setCurrentStage('Uploading raw artifact to course storage...');
      await new Promise((r) => setTimeout(r, 600));

      // Step 2: Extracting
      setCurrentStage('Agent 1 (Multimodal Ingestion): Parsing pages, slides & video timestamps...');
      const courseId = courses[0].id;
      const uploadedMat = await materialService.upload(courseId, selectedFile, customTitle || selectedFile.name);

      // Step 3: Embedding
      setCurrentStage('Vector Indexer: Generating semantic chunk embeddings...');
      await new Promise((r) => setTimeout(r, 500));

      // Step 4: Organizing
      setCurrentStage('Agent 2 (Knowledge Agent): Mapping topics & prerequisites...');
      await new Promise((r) => setTimeout(r, 400));

      // Done
      setCurrentStage('Completed');
      setSuccessMessage(`Successfully ingested "${uploadedMat.title}" with ${uploadedMat.chunks_count || 'multiple'} indexed semantic chunks.`);
      setSelectedFile(null);
      setCustomTitle('');

      // Refresh list
      const refreshed = await materialService.list(courseId);
      setMaterials(refreshed);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to process material ingestion.');
    } finally {
      setUploading(false);
      setTimeout(() => setCurrentStage(''), 4000);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-800/60 text-xs font-mono text-indigo-300">
          <Sparkles className="w-3.5 h-3.5" /> AGENT 1 • Multimodal Ingestion Agent
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          Course Material Ingestion Pipeline
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
          Upload PDF textbooks, PowerPoint slide decks, and lecture recordings.
          LearnFlow preserves exact source metadata (pages, slide numbers, video timestamps) for grounded RAG and question generation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Upload Box */}
        <div className="lg:col-span-6 space-y-4">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all bg-slate-900/60 flex flex-col items-center justify-center min-h-[260px] ${
              selectedFile ? 'border-indigo-500 bg-indigo-950/20' : 'border-slate-700 hover:border-slate-600'
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
              <UploadCloud className="w-8 h-8" />
            </div>

            {selectedFile ? (
              <div className="space-y-2">
                <p className="font-semibold text-sm text-indigo-300">{selectedFile.name}</p>
                <p className="text-xs text-slate-400 font-mono">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for Ingestion
                </p>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-xs text-rose-400 hover:text-rose-300 underline cursor-pointer"
                >
                  Choose a different file
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-200">
                  Drag & Drop course files here, or{' '}
                  <label className="text-indigo-400 hover:text-indigo-300 underline cursor-pointer">
                    browse
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.ppt,.pptx,.mp4,.mkv,.avi,.mp3"
                      onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])}
                    />
                  </label>
                </p>
                <p className="text-xs text-slate-400">
                  Supported formats: PDF textbooks, PPT/PPTX slides, MP4 lecture video transcripts
                </p>
              </div>
            )}
          </div>

          {/* Optional Title Input */}
          {selectedFile && (
            <div className="space-y-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Source Name / Display Title
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder={selectedFile.name}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-xs transition-all shadow-md shadow-indigo-600/30 cursor-pointer flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Ingesting & Embedding...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Start Multimodal Ingestion Pipeline
                  </>
                )}
              </button>
            </div>
          )}

          {/* Live Stage Progress Indicator */}
          {currentStage && (
            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/60 text-xs text-indigo-300 flex items-center gap-3 animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin shrink-0 text-indigo-400" />
              <span>{currentStage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Existing Ingested Knowledge Base Materials */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Indexed Course Knowledge Base ({materials.length})
            </h3>
            <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Vector Indexed
            </span>
          </div>

          <div className="space-y-3">
            {materials.map((mat) => (
              <div
                key={mat.id}
                className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-800 text-slate-300">
                    {mat.file_type === 'pdf' && <FileText className="w-5 h-5 text-rose-400" />}
                    {mat.file_type === 'pptx' && <Presentation className="w-5 h-5 text-amber-400" />}
                    {mat.file_type === 'video' && <Video className="w-5 h-5 text-sky-400" />}
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs text-slate-100">{mat.title}</h4>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {mat.chunks_count} semantic chunks • {(mat.file_size_bytes / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40 uppercase">
                    {mat.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
