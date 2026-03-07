import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Map, Clock, ExternalLink, Ghost, Sparkles, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../api/apiClient';

interface RoadmapTopic {
  id: number;
  title: string;
  priority: string;
  estimatedHours: number;
  isCompleted: boolean;
  sequenceOrder: number;
  referenceLinks: string;
  subtopics?: { title: string; isCompleted: boolean }[];
}

export default function RoadmapUI() {
  const { roadmapId } = useParams();
  const [topics, setTopics] = useState<RoadmapTopic[]>([]);
  const [ghostData, setGhostData] = useState({
      ghostPace: 0.28,
      ghostScore: 0,
      userScore: 0,
      isBehind: false
  });

  // In a real scenario we fetch the complete roadmap including topics and ghost profile.
  // For MVP we can just display the UI and try to load.
  // Actually, we should fetch it. Let's add a quick mock fallback if backend fails.
  useEffect(() => {
    apiClient.get(`/roadmaps/${roadmapId}`).then(res => {
       if (res.data.topics) setTopics(res.data.topics);
    }).catch(() => {
       toast.error("Could not load roadmap flow");
    });
    
    apiClient.get(`/ghosts/roadmap/${roadmapId}`).then(res => {
       setGhostData(res.data);
    }).catch(err => console.log("Ghost score fetch failed", err));
  }, [roadmapId]);

  const handleCompleteTask = async (topicId: number) => {
    try {
      await apiClient.put(`/roadmaps/topics/${topicId}/complete`);
      setTopics(prev => prev.map(t => t.id === topicId ? { ...t, isCompleted: true } : t));
      toast.success('Topic marked as completed!');
      // Update ghost data optimistically
      setGhostData(prev => ({
          ...prev,
          userScore: prev.userScore + 1,
          isBehind: (prev.userScore + 1) < prev.ghostScore
      }));
    } catch (err) {
      toast.error('Failed to update topic status');
    }
  };

  const handleSubtopicComplete = async (topicId: number, subtopicTitle: string) => {
    try {
      await apiClient.put(`/roadmaps/topics/${topicId}/subtopics/complete?subtopicTitle=${encodeURIComponent(subtopicTitle)}`);
      setTopics(prev => prev.map(t => {
        if (t.id === topicId && t.subtopics) {
          return {
            ...t,
            subtopics: t.subtopics.map(sub => 
              sub.title === subtopicTitle ? { ...sub, isCompleted: true } : sub
            )
          };
        }
        return t;
      }));
    } catch (err) {
      toast.error('Failed to update subtopic');
    }
  };

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">
      <div className="flex flex-col gap-2 mb-12">
         <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold text-white">Your Adaptive Flow</h1>
            <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
               <Sparkles className="w-3.5 h-3.5" /> AI Generated
            </div>
         </div>
         <p className="text-neutral-400 text-lg">Targeted syllabus tailored to your goal. Beat the ghost pace.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         {/* Ghost Pace Card */}
         <div className="col-span-1 flex flex-col gap-6">
            <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 p-6 rounded-3xl relative overflow-hidden shadow-xl">
               <div className="absolute top-4 right-4 text-indigo-400/20">
                  <Ghost className="w-24 h-24" />
               </div>
               <div className="relative z-10">
                  <div className="flex items-center gap-2 text-indigo-400 font-semibold mb-1">
                     <Ghost className="w-5 h-5" />
                     Ghost Mode
                  </div>
                  <div className="text-3xl font-bold text-white mb-2">{ghostData.ghostPace.toFixed(2)} <span className="text-sm font-normal text-indigo-200">pace/day</span></div>
                  <div className="text-sm text-indigo-200/60 leading-relaxed mb-4">
                     Ideal benchmark pace (topics/day) to complete this track on time. Stay ahead of the ghost!
                  </div>
                  <div className="w-full bg-neutral-900/60 h-2 rounded-full overflow-hidden">
                     <div 
                        className="bg-indigo-500 h-full rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-1000"
                        style={{ width: `${Math.min(100, Math.max(5, (ghostData.userScore / (topics.length || 1)) * 100))}%` }}
                     ></div>
                  </div>
                  <div className="flex justify-between text-xs font-medium mt-2 text-indigo-300">
                     <span>You: {ghostData.userScore}</span>
                     <span>Ghost: {Math.floor(ghostData.ghostScore)}</span>
                  </div>
               </div>
            </div>

            {ghostData.isBehind && (
               <div className="bg-rose-500/10 border border-rose-500/20 p-5 rounded-3xl flex items-start gap-3 shadow-lg">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="text-sm text-rose-200/80 leading-relaxed">
                     You are currently <span className="font-semibold text-rose-400">falling behind</span> the optimal pace. Schedule a focus session today to catch up!
                  </div>
               </div>
            )}
         </div>

         {/* Topics Track */}
         <div className="col-span-1 lg:col-span-3">
            <div className="bg-neutral-900/40 border border-neutral-800 rounded-3xl p-8 shadow-xl">
               <div className="flex items-center gap-3 mb-8 pb-6 border-b border-neutral-800">
                  <Map className="w-6 h-6 text-emerald-400" />
                  <h2 className="text-2xl font-bold text-white">Syllabus Flow</h2>
               </div>

               <div className="flex flex-col relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-neutral-800 before:to-transparent">
                  {topics.map((topic) => {
                     const isGhostHere = topic.sequenceOrder === Math.floor(ghostData.ghostScore) + 1;
                     
                     return (
                     <div key={topic.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active mb-12 last:mb-0">
                        
                        {/* Timeline dot */}
                        <div className={`relative flex items-center justify-center w-12 h-12 rounded-full border-4 border-neutral-950 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-xl z-20 transition-transform hover:scale-110 ${topic.isCompleted ? 'bg-emerald-500 text-neutral-950' : 'bg-neutral-800 text-neutral-400'}`}>
                           {topic.sequenceOrder}
                           
                           {isGhostHere && (
                              <div className="absolute -top-4 -right-4 text-indigo-400 animate-bounce z-30 pointer-events-none" title="Ghost is currently here!">
                                 <Ghost className="w-7 h-7 fill-indigo-500/20 drop-shadow-[0_0_12px_rgba(99,102,241,1)]" />
                              </div>
                           )}
                        </div>
                        
                        {/* Content */}
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition p-6 rounded-2xl shadow-lg">
                           <div className="flex items-center justify-between mb-3">
                              <span className={`text-xs font-semibold tracking-wider uppercase px-2 py-1 rounded-md ${topic.priority === 'High' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                 {topic.priority} Priority
                              </span>
                              <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 bg-neutral-900 px-2 py-1 rounded-md border border-neutral-800/50">
                                 <Clock className="w-3.5 h-3.5" />
                                 {topic.estimatedHours}h
                              </div>
                           </div>
                           
                           <h3 className="text-lg font-bold text-white mb-3 tracking-wide">{topic.title}</h3>
                           
                           {topic.subtopics && topic.subtopics.length > 0 && (
                              <ul className="mb-4 space-y-2">
                                 {topic.subtopics.map((sub, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-neutral-300">
                                       <button 
                                          onClick={() => !sub.isCompleted && handleSubtopicComplete(topic.id, sub.title)}
                                          disabled={sub.isCompleted}
                                          className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${sub.isCompleted ? 'bg-emerald-500 border-emerald-500 text-neutral-900' : 'border-neutral-600 hover:border-indigo-400'}`}>
                                          {sub.isCompleted && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                       </button>
                                       <span className={`leading-relaxed ${sub.isCompleted ? 'line-through text-neutral-500' : ''}`}>{sub.title}</span>
                                    </li>
                                 ))}
                              </ul>
                           )}
                           
                           {topic.referenceLinks && (
                              <a href={topic.referenceLinks} target="_blank" rel="noopener noreferrer" 
                                 className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors w-fit px-3 py-1.5 bg-indigo-500/10 rounded-lg group/link">
                                 Reference Link <ExternalLink className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
                              </a>
                           )}
                           
                           <div className="mt-5 pt-5 border-t border-neutral-800 flex justify-between items-center">
                               <button disabled={topic.isCompleted} onClick={() => handleCompleteTask(topic.id)} className={`text-sm font-semibold transition py-1.5 px-3 rounded-lg ${topic.isCompleted ? 'bg-emerald-500/10 text-emerald-500' : 'bg-neutral-800 text-neutral-300 hover:bg-emerald-500/20 hover:text-emerald-400'}`}>
                                  {topic.isCompleted ? '✓ Completed' : 'Mark as Complete'}
                               </button>
                           </div>
                        </div>

                     </div>
                     );
                  })}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
