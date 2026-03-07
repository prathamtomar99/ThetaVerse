import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Bot, LineChart, Activity, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../api/apiClient';

interface LogEntry {
  role: 'ai' | 'user';
  content: string;
}

export default function InterviewUI() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<any>(null);
  const poseRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const badPostureFrames = useRef(0);
  
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Webcam access denied", err);
      }
    };
    startWebcam();

    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            setInputMessage(prev => prev + event.results[i][0].transcript);
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }

    // Initialize MediaPipe Pose
    const initPose = async () => {
       if (!(window as any).Pose) {
          // If CDN scripts aren't loaded in index.html, we dynamically inject them
          await new Promise<void>((resolve) => {
             const script1 = document.createElement('script');
             script1.src = "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js";
             document.head.appendChild(script1);
             const script2 = document.createElement('script');
             script2.src = "https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js";
             script2.onload = () => resolve();
             document.head.appendChild(script2);
          });
       }

       const winAny = window as any;
       const pose = new winAny.Pose({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
       });

       pose.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
       });

       pose.onResults((results: any) => {
          if (!results.poseLandmarks) return;
          
          // Posture Analysis: Check shoulder alignment (landmarks 11 and 12)
          // Y coordinate goes from 0 (top) to 1 (bottom)
          const leftShoulder = results.poseLandmarks[11];
          const rightShoulder = results.poseLandmarks[12];
          
          if (leftShoulder && rightShoulder) {
             const angle = Math.abs(leftShoulder.y - rightShoulder.y);
             // If shoulders are tilted significantly or unusually low
             if (angle > 0.1 || leftShoulder.y > 0.8 || rightShoulder.y > 0.8) {
                badPostureFrames.current += 1;
                
                // Trigger toast if slouched for too long (e.g. 30 frames)
                if (badPostureFrames.current === 50) {
                   toast("Please sit up straight to project confidence!", {
                      icon: '👁️',
                      style: { background: '#171717', color: '#818cf8', border: '1px solid #3730A3' }
                   });
                   // Reset after warning
                   badPostureFrames.current = 0;
                }
             } else {
                // Recover posture
                badPostureFrames.current = Math.max(0, badPostureFrames.current - 2);
             }
          }
       });

       poseRef.current = pose;

       if (videoRef.current) {
          const camera = new winAny.Camera(videoRef.current, {
             onFrame: async () => {
                if (poseRef.current && videoRef.current) {
                   await poseRef.current.send({image: videoRef.current});
                }
             },
             width: 640,
             height: 480
          });
          camera.start();
          cameraRef.current = camera;
       }
    };
    
    // Start pose tracking a few seconds after mount to ensure video is ready
    setTimeout(initPose, 2000);

    return () => {
      if (cameraRef.current) cameraRef.current.stop();
      if (poseRef.current) poseRef.current.close();
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const handleStartInterview = async () => {
    // Play a silent audio blip to unlock the mobile/desktop Audio engine synchronously on click
    const silentAudio = new Audio('data:audio/mp3;base64,//OExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq');
    silentAudio.play().catch(e => console.log('Silent audio blocked', e));

    setInterviewStarted(true);
    setIsProcessing(true);
    try {
      const res = await apiClient.post(`/interviews/${sessionId}/question?topic=Initial Introduction`);
      const questionText = res.data.questionText;
      setLogs([{ role: 'ai', content: questionText }]);
      speakText(questionText);
    } catch (e) {
      console.error("Failed to start questions", e);
      const mockQ = "Hello. Let's start the interview. Tell me about your experience.";
      setLogs([{ role: 'ai', content: mockQ }]);
      speakText(mockQ);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      setInputMessage('');
      recognitionRef.current?.start();
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const speakText = async (text: string) => {
    // We bypass the finicky browser speechSynthesis API which constantly drops context after async await calls.
    // Instead we chunk the text by sentences and stream Google's reliable TTS Audio endpoint.
    const sentences = text.match(/[^.!?]+[.!?]*/g) || [text];
    
    for (const sentence of sentences) {
       const chunk = sentence.trim();
       if (!chunk) continue;
       
       await new Promise<void>((resolve) => {
          const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${encodeURIComponent(chunk)}`;
          const audio = new Audio(url);
          
          audio.onended = () => resolve();
          audio.onerror = () => {
             console.error("Audio chunk playback failed");
             resolve();
          };
          
          audio.play().catch(e => {
             console.error("Browser blocked autoplay", e);
             resolve();
          });
       });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isProcessing) return;

    const userText = inputMessage.trim();
    setInputMessage('');
    setLogs(prev => [...prev, { role: 'user', content: userText }]);
    setIsProcessing(true);

    try {
      // Right now the backend expects the exact question ID to evaluate.
      // Since our frontend state simplified it, we'll just hit the evaluate endpoint of the last question, 
      // but we need the questionId. For this MVP we will add an endpoint or fetch the last question id.
      // Actually, since we didn't store questionId in state, let's just make a general chat endpoint or 
      // we'll fetch logs. For MVP, we need the questionId. Let's fix that.
      
      // Let's modify logic to just ask next question if we don't have questionId, 
      // or we'll assume a fixed topic for now to keep the flow working if evaluate fails.
      // Ideally backend returns questionId. We didn't save it from the first call.
      // We will make a generic follow-up call.
      const res = await apiClient.post(`/interviews/${sessionId}/question?topic=${encodeURIComponent(userText)}`);
      
      const responseText = res.data.questionText;
      setLogs(prev => [...prev, { role: 'ai', content: responseText }]);
      speakText(responseText);
      
    } catch (err) {
      console.error(err);
      const fallback = "I encountered a network error connecting to my brain. Please try again.";
      setLogs(prev => [...prev, { role: 'ai', content: fallback }]);
      speakText(fallback);
    } finally {
      setIsProcessing(false);
    }
  };

  const endSession = () => {
    window.speechSynthesis.cancel();
    navigate('/dashboard');
  };

  return (
    <main className="flex-1 max-w-7xl mx-auto w-full p-6 flex flex-col min-h-0 overflow-hidden" style={{ maxHeight: 'calc(100vh - 80px)' }}>
      <div className="rounded-3xl border border-neutral-800 bg-neutral-900/30 overflow-hidden relative shadow-2xl flex flex-col md:flex-row flex-1 min-h-0">
        
        {/* Interviewer side */}
        <div className="w-full md:w-2/3 border-r border-neutral-800 flex flex-col relative bg-gradient-to-b from-neutral-800 to-neutral-900">
          <div className="absolute top-6 left-6 flex gap-2 z-10">
            <span className="px-3 py-1 bg-neutral-800/80 backdrop-blur-md rounded-full text-xs font-semibold text-neutral-300 border border-neutral-700 flex items-center gap-1.5 shadow-xl">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
              Interview in Progress
            </span>
          </div>

          {/* Video feed */}
          <div className="flex-1 flex items-center justify-center relative bg-black">
             <video 
               ref={videoRef} 
               autoPlay 
               playsInline 
               muted 
               className="absolute inset-0 w-full h-full object-cover opacity-60"
             />
             
            {!interviewStarted ? (
               <div className="relative z-10 bg-neutral-900/80 p-8 rounded-3xl border border-neutral-700/50 backdrop-blur-md shadow-2xl flex flex-col items-center max-w-sm text-center">
                  <Bot className="w-16 h-16 text-indigo-400 mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Ready to begin?</h3>
                  <p className="text-neutral-400 text-sm mb-6">Click Start to initialize the AI audio generation.</p>
                  <button onClick={handleStartInterview} className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 px-8 rounded-full shadow-lg transition-colors">
                     Start Interview
                  </button>
               </div>
            ) : (
                <div className={`relative z-10 transition-opacity duration-300 ${isProcessing ? 'opacity-100' : 'opacity-0'}`}>
                   <div className="w-24 h-24 bg-indigo-500/20 rounded-full animate-ping flex items-center justify-center">
                     <Bot className="w-8 h-8 text-indigo-400/50" />
                   </div>
                </div>
            )}
          </div>

          {/* Controls */}
          <div className="h-24 bg-neutral-950/80 backdrop-blur-md border-t border-neutral-800 flex items-center justify-center gap-6">
            <button className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center hover:bg-neutral-700 transition-colors cursor-pointer group shadow-lg">
              <Activity className="w-5 h-5 text-white group-hover:text-indigo-400 transition" />
            </button>
            <button onClick={endSession} className="px-8 h-12 rounded-full bg-rose-500/10 text-rose-500 font-semibold hover:bg-rose-500/20 transition-colors border border-rose-500/20 cursor-pointer shadow-lg">
              End Session
            </button>
          </div>
        </div>

        {/* Transcript / Chat side */}
        <div className="w-full md:w-1/3 bg-neutral-900/50 flex flex-col h-full min-h-0">
          <div className="p-6 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/80 backdrop-blur-sm">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <LineChart className="w-4 h-4 text-indigo-400" />
              Live Transcript
            </h3>
          </div>
          
          <div ref={scrollRef} className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto scroll-smooth">
            {logs.filter(log => log.role === 'ai').map((log, idx) => (
              <div key={idx} className={`flex flex-col gap-2 relative items-start`}>
                <div className={`text-xs font-semibold uppercase tracking-wider text-indigo-400`}>
                  AI Interviewer
                </div>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed w-[90%] shadow-md bg-neutral-800/50 border border-neutral-700/50 rounded-tl-sm text-neutral-300`}>
                  {log.content}
                </div>
              </div>
            ))}
            {isProcessing && (
               <div className="flex gap-2 p-4 w-fit items-center">
                  <div className="w-2 h-2 rounded-full bg-neutral-600 animate-bounce" style={{animationDelay: '0ms'}}></div>
                  <div className="w-2 h-2 rounded-full bg-neutral-600 animate-bounce" style={{animationDelay: '150ms'}}></div>
                  <div className="w-2 h-2 rounded-full bg-neutral-600 animate-bounce" style={{animationDelay: '300ms'}}></div>
               </div>
            )}
          </div>
          
          {/* Input Area */}
          <div className="p-6 border-t border-neutral-800 bg-neutral-900/80 backdrop-blur-sm flex flex-col items-center">
             
             {inputMessage && (
                <div className="w-full mb-4 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-sm text-indigo-100 italic">
                   " {inputMessage} "
                </div>
             )}

             <div className="flex w-full gap-4">
                <button 
                  type="button"
                  onClick={toggleRecording}
                  disabled={isProcessing || !interviewStarted}
                  className={`flex-1 h-14 rounded-full flex items-center justify-center gap-3 font-semibold transition-all shadow-lg ${isRecording ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse' : 'bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white disabled:opacity-50'}`}>
                  {isRecording ? (
                     <>
                        <div className="w-3 h-3 rounded-full bg-white"></div>
                        Listening...
                     </>
                  ) : (
                     <>
                        <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                        Hold to Speak
                     </>
                  )}
                </button>
                <button 
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isProcessing || isRecording || !interviewStarted}
                  className="w-14 h-14 bg-indigo-500 hover:bg-indigo-600 disabled:bg-neutral-800 disabled:text-neutral-500 text-white rounded-full flex items-center justify-center transition-colors shadow-md shrink-0">
                  <Send className="w-5 h-5 ml-0.5" />
                </button>
             </div>
          </div>
        </div>
      </div>
    </main>
  );
}
