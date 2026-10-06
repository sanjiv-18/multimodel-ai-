import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { knowledgeService, courseService } from '../services/api';
import { Topic } from '../types';
import { KnowledgeGraphVisualizer } from '../components/KnowledgeGraphVisualizer';
import { Network, Sparkles, Layers } from 'lucide-react';

export const KnowledgeMapPage: React.FC = () => {
  const navigate = useNavigate();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadKnowledge = async () => {
      try {
        const cList = await courseService.list();
        if (cList.length > 0) {
          const tops = await knowledgeService.getTopics(cList[0].id);
          setTopics(tops);
        }
      } catch (err) {
        console.error('Failed to load knowledge map', err);
      } finally {
        setLoading(false);
      }
    };
    loadKnowledge();
  }, []);

  const handleSelectConcept = (conceptName: string, topicName: string) => {
    navigate('/tutor', { state: { initialPrompt: `Explain ${conceptName} in ${topicName} with source citations.` } });
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-800/60 text-xs font-mono text-indigo-300">
          <Sparkles className="w-3.5 h-3.5" /> AGENT 2 • Knowledge Organization Agent
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          Curriculum Knowledge Map & Prerequisite Graph
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
          Visualizes hierarchical topics, subtopics, core concepts, and prerequisite dependencies.
          Select any concept to launch an interactive grounded tutor explanation or targeted quiz.
        </p>
      </div>

      {/* Visualizer Component */}
      <KnowledgeGraphVisualizer topics={topics} onSelectConcept={handleSelectConcept} />
    </div>
  );
};
