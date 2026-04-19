import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../api/apiClient";
import { Bot, CalendarPlus, Play, UserRound } from "lucide-react";
import toast from "react-hot-toast";
import { useStoreContext } from "../../contextApi/ContextApi";
import { withExecutionLog } from "../../utils/executionLogger";

interface InterviewerProfile {
  interviewerId: number;
  name: string;
  email: string;
  headline?: string;
  bio?: string;
}

interface InterviewSlot {
  slotId: number;
  interviewerId: number;
  interviewerName: string;
  startTime: string;
  endTime: string;
  googleMeetLink: string;
  booked: boolean;
}

export default function InterviewSetup() {
  const [companyName, setCompanyName] = useState("Barclays");
  const [position, setPosition] = useState("SDE2");
  const [roundTypes, setRoundTypes] = useState("Technical, HLD, HR");
  const [mood, setMood] = useState("Medium");
  const [resumeText, setResumeText] = useState("");
  const [mode, setMode] = useState("AI");

  const [interviewers, setInterviewers] = useState<InterviewerProfile[]>([]);
  const [slots, setSlots] = useState<InterviewSlot[]>([]);
  const [selectedInterviewerId, setSelectedInterviewerId] = useState<number | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);

  const [myHeadline, setMyHeadline] = useState("");
  const [myBio, setMyBio] = useState("");
  const [slotStart, setSlotStart] = useState("");
  const [slotEnd, setSlotEnd] = useState("");
  const [slotMeetLink, setSlotMeetLink] = useState("");
  const [mySlots, setMySlots] = useState<InterviewSlot[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isSlotSaving, setIsSlotSaving] = useState(false);

  const navigate = useNavigate();
  const { currentUserId, currentUser } = useStoreContext();

  const isInterviewer = currentUser?.role === "INTERVIEWER";

  const selectedInterviewer = useMemo(() => {
    return interviewers.find((item) => item.interviewerId === selectedInterviewerId) || null;
  }, [interviewers, selectedInterviewerId]);

  const loadInterviewerDirectory = async () => {
    const response = await apiClient.get("/interviewers");
    setInterviewers(response.data);
  };

  const loadSlotsForInterviewer = async (interviewerId: number) => {
    const response = await apiClient.get(`/interviewers/${interviewerId}/slots?onlyAvailable=true`);
    setSlots(response.data);
    setSelectedSlotId(null);
  };

  const loadInterviewerSelfData = async () => {
    const [profileRes, slotRes] = await Promise.all([
      apiClient.get("/interviewers/profile/me"),
      apiClient.get("/interviewers/slots/me"),
    ]);

    setMyHeadline(profileRes.data.headline || "");
    setMyBio(profileRes.data.bio || "");
    setMySlots(slotRes.data);
  };

  useEffect(() => {
    const init = async () => {
      try {
        if (isInterviewer) {
          await loadInterviewerSelfData();
          return;
        }

        await loadInterviewerDirectory();
      } catch (error) {
        console.error("Failed to initialize interview setup", error);
        toast.error("Failed to load interview setup data");
      }
    };

    void init();
  }, [isInterviewer]);

  useEffect(() => {
    if (isInterviewer || mode !== "HUMAN" || !selectedInterviewerId) {
      return;
    }

    void loadSlotsForInterviewer(selectedInterviewerId).catch((error) => {
      console.error("Failed to load interviewer slots", error);
      toast.error("Failed to load available slots");
    });
  }, [selectedInterviewerId, mode, isInterviewer]);

  const handleSaveProfile = withExecutionLog(
    "InterviewSetup.handleSaveProfile",
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsProfileSaving(true);
      try {
        await apiClient.post("/interviewers/profile", {
          headline: myHeadline,
          bio: myBio,
        });
        toast.success("Profile saved");
      } catch (error) {
        console.error(error);
        toast.error("Failed to save profile");
      } finally {
        setIsProfileSaving(false);
      }
    },
  );

  const handleCreateSlot = withExecutionLog(
    "InterviewSetup.handleCreateSlot",
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSlotSaving(true);
      try {
        await apiClient.post("/interviewers/slots", {
          startTime: slotStart,
          endTime: slotEnd,
          googleMeetLink: slotMeetLink,
        });
        toast.success("Slot created");
        setSlotStart("");
        setSlotEnd("");
        setSlotMeetLink("");
        await loadInterviewerSelfData();
      } catch (error) {
        console.error(error);
        toast.error("Failed to create slot");
      } finally {
        setIsSlotSaving(false);
      }
    },
  );

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

        if (mode === "HUMAN") {
          if (!selectedInterviewerId || !selectedSlotId) {
            toast.error("Please select interviewer and slot");
            return;
          }

          const res = await apiClient.post("/interviews/book-human", {
            userId: currentUserId,
            interviewerId: selectedInterviewerId,
            slotId: selectedSlotId,
            companyName,
            position,
            roundTypes,
            resumeText,
          });

          toast.success("Interview booked successfully");
          navigate(`/interview/${res.data.id}`);
          return;
        }

        const res = await apiClient.post("/interviews/start", {
          companyName,
          position,
          roundTypes,
          mood,
          mode,
          userId: currentUserId,
          resumeText,
        });

        toast.success("Interview Session Created");
        navigate(`/interview/${res.data.id}`);
      } catch (err) {
        toast.error("Failed to start session");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    },
  );

  if (isInterviewer) {
    return (
      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-neutral-900/40 border border-neutral-800 rounded-3xl p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <UserRound className="w-6 h-6 text-indigo-400" />
              <h1 className="text-2xl font-bold text-white">Interviewer Profile</h1>
            </div>

            <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-neutral-300">Headline</label>
                <input
                  type="text"
                  value={myHeadline}
                  onChange={(e) => setMyHeadline(e.target.value)}
                  className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white"
                  placeholder="Senior Backend Engineer | Systems Design"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-neutral-300">Bio</label>
                <textarea
                  value={myBio}
                  onChange={(e) => setMyBio(e.target.value)}
                  rows={4}
                  className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white resize-none"
                  placeholder="Share your experience and interview focus areas"
                />
              </div>
              <button
                disabled={isProfileSaving}
                type="submit"
                className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white font-semibold py-3 px-4 rounded-xl"
              >
                {isProfileSaving ? "Saving..." : "Save Profile"}
              </button>
            </form>
          </div>

          <div className="bg-neutral-900/40 border border-neutral-800 rounded-3xl p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <CalendarPlus className="w-6 h-6 text-emerald-400" />
              <h2 className="text-2xl font-bold text-white">Create Slot</h2>
            </div>

            <form onSubmit={handleCreateSlot} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-neutral-300">Start Time</label>
                <input
                  type="datetime-local"
                  required
                  value={slotStart}
                  onChange={(e) => setSlotStart(e.target.value)}
                  className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-neutral-300">End Time</label>
                <input
                  type="datetime-local"
                  required
                  value={slotEnd}
                  onChange={(e) => setSlotEnd(e.target.value)}
                  className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-neutral-300">Google Meet Link</label>
                <input
                  type="url"
                  required
                  value={slotMeetLink}
                  onChange={(e) => setSlotMeetLink(e.target.value)}
                  className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white"
                  placeholder="https://meet.google.com/xxx-xxxx-xxx"
                />
              </div>
              <button
                disabled={isSlotSaving}
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-semibold py-3 px-4 rounded-xl"
              >
                {isSlotSaving ? "Creating..." : "Create Availability Slot"}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-6 bg-neutral-900/40 border border-neutral-800 rounded-3xl p-8 shadow-xl">
          <h3 className="text-xl font-bold text-white mb-4">My Slots</h3>
          {mySlots.length === 0 ? (
            <p className="text-neutral-400">No slots created yet.</p>
          ) : (
            <div className="space-y-3">
              {mySlots.map((slot) => (
                <div key={slot.slotId} className="rounded-xl border border-neutral-800 bg-neutral-950/60 px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">
                      {new Date(slot.startTime).toLocaleString()} - {new Date(slot.endTime).toLocaleTimeString()}
                    </p>
                    <p className="text-xs text-neutral-400">{slot.googleMeetLink}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${slot.booked ? "bg-rose-500/20 text-rose-300" : "bg-emerald-500/20 text-emerald-300"}`}>
                    {slot.booked ? "Booked" : "Available"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
      <div className="bg-neutral-900/40 border border-neutral-800 rounded-3xl p-8 shadow-xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Interview Setup</h1>
            <p className="text-neutral-400">AI mock or human interviewer booking</p>
          </div>
        </div>

        <form onSubmit={handleStart} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-neutral-300">Interview Mode</label>
            <select
              value={mode}
              onChange={(e) => {
                setMode(e.target.value);
                setSelectedInterviewerId(null);
                setSelectedSlotId(null);
                setSlots([]);
              }}
              className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white"
            >
              <option value="AI">AI Interview</option>
              <option value="HUMAN">Human Interviewer (Google Meet)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-neutral-300">Target Company</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-neutral-300">Target Position</label>
              <input
                type="text"
                required
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-neutral-300">Round Types</label>
            <input
              type="text"
              required
              value={roundTypes}
              onChange={(e) => setRoundTypes(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white"
              placeholder="e.g. Technical, HLD, HR"
            />
          </div>

          {mode === "AI" ? (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-neutral-300">Interviewer Mood</label>
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white"
              >
                <option value="Friendly">Friendly</option>
                <option value="Medium">Medium</option>
                <option value="Strict">Strict</option>
              </select>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-neutral-300">Choose Interviewer</label>
                <select
                  required
                  value={selectedInterviewerId ?? ""}
                  onChange={(e) => setSelectedInterviewerId(Number(e.target.value))}
                  className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white"
                >
                  <option value="" disabled>
                    Select interviewer
                  </option>
                  {interviewers.map((interviewer) => (
                    <option key={interviewer.interviewerId} value={interviewer.interviewerId}>
                      {interviewer.name} {interviewer.headline ? `- ${interviewer.headline}` : ""}
                    </option>
                  ))}
                </select>
                {selectedInterviewer?.bio && (
                  <p className="text-xs text-neutral-400">{selectedInterviewer.bio}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-neutral-300">Choose Available Slot</label>
                <select
                  required
                  value={selectedSlotId ?? ""}
                  onChange={(e) => setSelectedSlotId(Number(e.target.value))}
                  className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white"
                  disabled={!selectedInterviewerId}
                >
                  <option value="" disabled>
                    Select slot
                  </option>
                  {slots.map((slot) => (
                    <option key={slot.slotId} value={slot.slotId}>
                      {new Date(slot.startTime).toLocaleString()} - {new Date(slot.endTime).toLocaleTimeString()}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-neutral-300">
              Resume / Background Experience (Optional)
            </label>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              rows={3}
              className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white resize-none"
            />
          </div>

          <button
            disabled={isLoading}
            type="submit"
            className="mt-4 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            {isLoading ? "Initializing..." : mode === "HUMAN" ? "Book Interview" : "Start Session"}
            {!isLoading && <Play className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
}
