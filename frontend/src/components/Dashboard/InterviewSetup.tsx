import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../api/apiClient";
import { Bot, Play } from "lucide-react";
import toast from "react-hot-toast";
import { useStoreContext } from "../../contextApi/ContextApi";
import { withExecutionLog } from "../../utils/executionLogger";

export default function InterviewSetup() {
  const [companyName, setCompanyName] = useState("Barclays");
  const [position, setPosition] = useState("SDE2");
  const [roundTypes, setRoundTypes] = useState("Technical, HLD, HR");
  const [mood, setMood] = useState("Medium");
  const [resumeText, setResumeText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { currentUserId } = useStoreContext();

  const handleStart = withExecutionLog(
    "InterviewSetup.handleStart",
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      try {
        if (!currentUserId) {
          toast.error("Please sign in again to start an interview");
          return;
        }

        const res = await apiClient.post("/interviews/start", {
          companyName,
          position,
          roundTypes,
          mood,
          userId: currentUserId,
          resumeText,
        });

        toast.success("Interview Session Created!");
        navigate(`/interview/${res.data.id}`);
      } catch (err) {
        toast.error("Failed to start session");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    },
  );

  return (
    <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
      <div className="bg-neutral-900/40 border border-neutral-800 rounded-3xl p-8 shadow-xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Interview Setup</h1>
            <p className="text-neutral-400">Configure your target persona</p>
          </div>
        </div>

        <form onSubmit={handleStart} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-neutral-300">
                Target Company
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-neutral-300">
                Target Position
              </label>
              <input
                type="text"
                required
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-neutral-300">
              Round Types
            </label>
            <input
              type="text"
              required
              value={roundTypes}
              onChange={(e) => setRoundTypes(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition"
              placeholder="e.g. Technical, HLD, HR"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-neutral-300">
              Interviewer Mood
            </label>
            <select
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition appearance-none"
            >
              <option value="Friendly">Friendly</option>
              <option value="Medium">Medium</option>
              <option value="Strict">Strict</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-neutral-300">
              Resume / Background Experience (Optional)
            </label>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              rows={3}
              className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition resize-none"
              placeholder="Paste relevant experience or skills so the AI can tailor questions to your background..."
            ></textarea>
          </div>

          <button
            disabled={isLoading}
            type="submit"
            className="mt-4 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            {isLoading ? "Initializing..." : "Start Session"}
            {!isLoading && <Play className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
}
