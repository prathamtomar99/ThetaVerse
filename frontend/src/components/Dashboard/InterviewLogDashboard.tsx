import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, Clock, MessageSquareText } from "lucide-react";
import toast from "react-hot-toast";
import apiClient from "../../api/apiClient";
import { logExecution } from "../../utils/executionLogger";

interface InterviewSessionInfo {
  id: number;
  companyName: string;
  position: string;
  roundTypes: string;
  mood: string;
  startTime: string;
  endTime: string | null;
  resumeText: string | null;
}

interface InterviewLogEntry {
  id: number;
  role: string;
  content: string;
  timestamp: string;
}

const AI_ROLES = new Set(["response", "evaluation", "final"]);

function normalizeInlineText(text: string) {
  return text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .trim();
}

function renderInlineText(text: string) {
  const normalized = normalizeInlineText(text);
  const parts = normalized.split("\n");

  if (parts.length <= 1) {
    return normalized;
  }

  return (
    <>
      {parts.map((part, index) => (
        <Fragment key={`inline-${index}`}>
          {index > 0 && <br />}
          {part}
        </Fragment>
      ))}
    </>
  );
}

function isMarkdownTableLine(line: string) {
  const trimmed = line.trim();
  return /^\|.*\|$/.test(trimmed);
}

function parseMarkdownTableRow(line: string) {
  return line
    .trim()
    .split("|")
    .slice(1, -1)
    .map((cell) => cell.trim());
}

function isMarkdownTableSeparator(cells: string[]) {
  return (
    cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell.trim()))
  );
}

function renderLogContent(content: string) {
  const lines = content.split("\n").map((line) => line.replace(/\s+$/g, ""));

  const blocks: ReactNode[] = [];
  let listBuffer: string[] = [];
  let listType: "ul" | "ol" | null = null;

  const flushList = () => {
    if (listBuffer.length === 0 || !listType) {
      return;
    }

    if (listType === "ul") {
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="list-disc pl-5 space-y-1.5">
          {listBuffer.map((item, index) => (
            <li key={`ul-item-${index}`}>{item}</li>
          ))}
        </ul>,
      );
    } else {
      blocks.push(
        <ol
          key={`ol-${blocks.length}`}
          className="list-decimal pl-5 space-y-1.5 marker:font-semibold"
        >
          {listBuffer.map((item, index) => (
            <li key={`ol-item-${index}`}>{item}</li>
          ))}
        </ol>,
      );
    }

    listBuffer = [];
    listType = null;
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      continue;
    }

    if (
      isMarkdownTableLine(trimmed) &&
      i + 1 < lines.length &&
      isMarkdownTableLine(lines[i + 1].trim())
    ) {
      const headerCells = parseMarkdownTableRow(trimmed);
      const separatorCells = parseMarkdownTableRow(lines[i + 1]);

      if (isMarkdownTableSeparator(separatorCells)) {
        flushList();

        const rows: string[][] = [];
        let rowIndex = i + 2;
        while (
          rowIndex < lines.length &&
          isMarkdownTableLine(lines[rowIndex].trim())
        ) {
          rows.push(parseMarkdownTableRow(lines[rowIndex]));
          rowIndex += 1;
        }

        blocks.push(
          <div
            key={`table-${blocks.length}`}
            className="overflow-x-auto rounded-xl border border-white/10"
          >
            <table className="w-full min-w-180 border-collapse text-left text-sm">
              <thead className="bg-white/5 text-white">
                <tr>
                  {headerCells.map((cell, idx) => (
                    <th
                      key={`th-${idx}`}
                      className="px-3 py-2 font-semibold align-top"
                    >
                      {renderInlineText(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ridx) => (
                  <tr
                    key={`tr-${ridx}`}
                    className="border-t border-white/10 align-top"
                  >
                    {headerCells.map((_, cidx) => (
                      <td
                        key={`td-${ridx}-${cidx}`}
                        className="px-3 py-2 text-current/95"
                      >
                        {renderInlineText(row[cidx] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>,
        );

        i = rowIndex - 1;
        continue;
      }
    }

    const unorderedMatch = trimmed.match(/^(?:[-*•])\s+(.+)/);
    if (unorderedMatch) {
      if (listType && listType !== "ul") {
        flushList();
      }
      listType = "ul";
      listBuffer.push(normalizeInlineText(unorderedMatch[1]));
      continue;
    }

    const orderedMatch = trimmed.match(/^\d+[.)]\s+(.+)/);
    if (orderedMatch) {
      if (listType && listType !== "ol") {
        flushList();
      }
      listType = "ol";
      listBuffer.push(normalizeInlineText(orderedMatch[1]));
      continue;
    }

    flushList();

    const markdownHeadingMatch = trimmed.match(/^#{1,6}\s+(.+)$/);
    if (markdownHeadingMatch) {
      blocks.push(
        <h4
          key={`h-md-${blocks.length}`}
          className="mt-1 font-semibold text-white"
        >
          {renderInlineText(markdownHeadingMatch[1])}
        </h4>,
      );
      continue;
    }

    const headingMatch = trimmed.match(/^\*\*(.+)\*\*:??$/);
    if (headingMatch) {
      blocks.push(
        <h4
          key={`h-${blocks.length}`}
          className="mt-1 font-semibold text-white"
        >
          {renderInlineText(headingMatch[1])}
        </h4>,
      );
      continue;
    }

    blocks.push(
      <p key={`p-${blocks.length}`} className="leading-7">
        {renderInlineText(trimmed)}
      </p>,
    );
  }

  flushList();

  return blocks.length > 0 ? blocks : <p className="leading-7">{content}</p>;
}

export default function InterviewLogDashboard() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [sessionInfo, setSessionInfo] = useState<InterviewSessionInfo | null>(
    null,
  );
  const [logs, setLogs] = useState<InterviewLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLogs = async () => {
      if (!sessionId) {
        return;
      }

      try {
        const [sessionResponse, logsResponse] = await Promise.all([
          apiClient.get(`/interviews/${sessionId}`),
          apiClient.get(`/interviews/${sessionId}/logs`),
        ]);

        setSessionInfo(sessionResponse.data);
        setLogs(logsResponse.data);
        logExecution("InterviewLogDashboard.loadLogs", "logs loaded", {
          sessionId,
          entries: logsResponse.data.length,
        });
      } catch (error) {
        console.error("Failed to load interview logs", error);
        toast.error("Failed to load interview logs");
      } finally {
        setIsLoading(false);
      }
    };

    void loadLogs();
  }, [sessionId]);

  const finalEvaluation = useMemo(() => {
    const finalLog = [...logs].reverse().find((log) => log.role === "final");
    return finalLog?.content ?? "No final evaluation was generated.";
  }, [logs]);

  return (
    <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-12">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">
              Interview Log Dashboard
            </h1>
            <p className="text-neutral-400">
              Transcript, AI evaluation, and the final summary for this session.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate("/dashboard")}
          className="inline-flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/60 px-4 py-3 text-neutral-300 hover:text-white hover:border-neutral-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </button>
      </div>

      {sessionInfo && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
            <div className="text-xs uppercase tracking-wider text-neutral-500 mb-2">
              Company
            </div>
            <div className="text-white font-semibold">
              {sessionInfo.companyName}
            </div>
            <div className="text-neutral-400 text-sm">
              {sessionInfo.position}
            </div>
          </div>
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
            <div className="text-xs uppercase tracking-wider text-neutral-500 mb-2">
              Round Types
            </div>
            <div className="text-white font-semibold">
              {sessionInfo.roundTypes || "Technical"}
            </div>
            <div className="text-neutral-400 text-sm">
              Mood: {sessionInfo.mood}
            </div>
          </div>
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
            <div className="text-xs uppercase tracking-wider text-neutral-500 mb-2">
              Time
            </div>
            <div className="text-white font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              {sessionInfo.endTime ? "Completed" : "In progress"}
            </div>
            <div className="text-neutral-400 text-sm">
              Session ID: {sessionInfo.id}
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-neutral-500 animate-pulse">Loading logs...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-3xl border border-neutral-800 bg-neutral-900/40 p-6">
            <h2 className="text-xl font-semibold text-white mb-5 flex items-center gap-2">
              <MessageSquareText className="w-5 h-5 text-indigo-400" />
              Transcript
            </h2>

            <div className="space-y-5">
              {logs.map((log) => (
                <div key={log.id} className="space-y-1.5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    {log.role}
                  </div>
                  <div
                    className={`rounded-2xl border px-4 py-3 text-sm whitespace-pre-wrap wrap-break-word ${
                      log.role === "response"
                        ? "border-indigo-500/35 bg-indigo-500/12 text-indigo-100"
                        : log.role === "evaluation" || log.role === "final"
                          ? "border-emerald-500/30 bg-emerald-500/8 text-emerald-100"
                          : "border-neutral-700 bg-neutral-900/70 text-neutral-200"
                    }`}
                  >
                    {AI_ROLES.has(log.role) ? (
                      <div className="space-y-2 text-[15px] leading-7">
                        {renderLogContent(log.content)}
                      </div>
                    ) : (
                      log.content
                    )}
                  </div>
                </div>
              ))}

              {logs.length === 0 && (
                <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-950/40 p-8 text-center text-neutral-500">
                  No interview logs found yet.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-emerald-500/25 bg-emerald-500/8 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Final Evaluation
              </h2>
              <div className="text-sm text-emerald-100 whitespace-pre-wrap wrap-break-word">
                <div className="space-y-2 text-[15px] leading-7">
                  {renderLogContent(finalEvaluation)}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-neutral-800 bg-neutral-900/40 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Next Steps
              </h2>
              <p className="text-sm leading-6 text-neutral-400">
                Review the evaluation, then start another interview session when
                you are ready.
              </p>
              <Link
                to="/interview/setup"
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-indigo-500 px-4 py-3 text-white font-medium hover:bg-indigo-600 transition"
              >
                Start another interview
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
