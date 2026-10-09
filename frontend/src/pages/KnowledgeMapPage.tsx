import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { knowledgeService, courseService } from '../services/api';
import { Topic, Course } from '../types';
import { KnowledgeGraphVisualizer } from '../components/KnowledgeGraphVisualizer';
import { Network, Sparkles, Layers } from 'lucide-react';

export const KnowledgeMapPage: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadKnowledge = async () => {
    try {
      const cList = await courseService.list();
      setCourses(cList);
      if (cList.length > 0) {
        const cId = selectedCourseId && cList.some(c => c.id === selectedCourseId)
          ? selectedCourseId
          : cList[0].id;
        setSelectedCourseId(cId);
        const tops = await knowledgeService.getTopics(cId);
        setTopics(tops);
      }
    } catch (err) {
      console.error('Failed to load knowledge map', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKnowledge();
  }, []);

  const handleCourseChange = async (courseId: string) => {
    setSelectedCourseId(courseId);
    try {
      const tops = await knowledgeService.getTopics(courseId);
      setTopics(tops);
    } catch (err) {
      console.error('Failed to load course topics', err);
    }
  };

  const handleSelectConcept = (conceptName: string, topicName: string) => {
    navigate('/tutor', { state: { initialPrompt: `Explain ${conceptName} in ${topicName} with source citations.` } });
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[40vh]">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
        No courses available. Create a course first to view knowledge relationships.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Course Switcher */}
      {courses.length > 1 && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700">Course:</span>
          <select
            value={selectedCourseId}
            onChange={(e) => handleCourseChange(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none focus:border-indigo-500 shadow-2xs"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Visualizer Component */}
      <KnowledgeGraphVisualizer topics={topics} onSelectConcept={handleSelectConcept} />
    </div>
  );
};
