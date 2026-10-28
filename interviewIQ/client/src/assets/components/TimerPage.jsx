import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import Navbar from './Navbar.jsx'
import Footer from './Footer.jsx'
import {
  BsPlayFill,
  BsPauseFill,
  BsArrowCounterclockwise,
  BsStopwatch,
  BsMicFill,
  BsMicMuteFill,
  BsVolumeUpFill,
  BsVolumeMuteFill,
  BsFullscreen,
  BsFullscreenExit,
  BsLightningChargeFill,
  BsChatSquareQuoteFill,
  BsArrowLeft,
  BsStars,
  BsSpeedometer2,
  BsCheckCircleFill
} from 'react-icons/bs'

// Practice Interview Question Prompts
const PRACTICE_PROMPTS = [
  {
    category: 'Elevator Pitch',
    question: 'Tell me about yourself and walk me through your background.',
    targetTime: 60,
    tips: 'Focus on past achievements, current role, and future aspirations (Past-Present-Future formula).'
  },
  {
    category: 'Behavioral (STAR)',
    question: 'Describe a challenging situation at work and how you overcame it.',
    targetTime: 90,
    tips: 'Structure using STAR: Situation (20s), Task (10s), Action (40s), Result (20s).'
  },
  {
    category: 'Technical',
    question: 'How do you approach system scalability and optimizing performance bottlenecks?',
    targetTime: 120,
    tips: 'Mention horizontal scaling, caching strategies, indexing, and asynchronous job queues.'
  },
  {
    category: 'Teamwork',
    question: 'Tell me about a time you strongly disagreed with a coworker or manager. How did you handle it?',
    targetTime: 75,
    tips: 'Show active listening, professional diplomacy, data-driven reasoning, and mutual alignment.'
  },
  {
    category: 'Rapid Fire',
    question: 'What is your greatest strength and how does it directly benefit our team?',
    targetTime: 45,
    tips: 'Be specific, give one crisp concrete example, and avoid generic buzzwords.'
  },
  {
    category: 'Problem Solving',
    question: 'Walk me through a project failure or mistake you made. What did you learn?',
    targetTime: 90,
    tips: 'Own the mistake without blaming others, then emphasize the preventive systems you built.'
  }
]

// Preset Durations
const PRESETS = [
  { label: '30s Pitch', seconds: 30, desc: 'Quick intro / elevator speech' },
  { label: '60s Answer', seconds: 60, desc: 'Standard concise response' },
  { label: '90s STAR', seconds: 90, desc: 'Behavioral story framework' },
  { label: '2m Tech', seconds: 120, desc: 'Architecture & technical deep dive' },
  { label: '3m Case', seconds: 180, desc: 'Case study & system design' }
]

function TimerPage() {
  const navigate = useNavigate()
  const location = useLocation()

  // Initial duration from query param, location state, or default 60s
  const initialDuration = location.state?.timeLimit || 60

  const [totalSeconds, setTotalSeconds] = useState(initialDuration)
  const [timeLeft, setTimeLeft] = useState(initialDuration)
  const [isRunning, setIsRunning] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [customMinutes, setCustomMinutes] = useState(1)
  const [customSeconds, setCustomSeconds] = useState(0)

  // Prompts & Speech recognition
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0)
  const [showPrompt, setShowPrompt] = useState(true)
  const [transcript, setTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const timerRef = useRef(null)
  const recognitionRef = useRef(null)
  const containerRef = useRef(null)

  // Web Audio Context for beeps
  const playBeep = (freq = 440, type = 'sine', duration = 0.15) => {
    if (!soundEnabled) return
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = type
      osc.frequency.setValueAtTime(freq, ctx.currentTime)
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start()
      osc.stop(ctx.currentTime + duration)
    } catch (_) { }
  }

  // Timer Tick
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current)
            setIsRunning(false)
            setIsCompleted(true)
            stopVoiceRecognition()
            playBeep(880, 'triangle', 0.5) // Finish chime
            return 0
          }
          // Warning beeps at 10, 5, 3, 2, 1 seconds
          if (prev <= 6) {
            playBeep(520, 'sine', 0.1)
          }
          return prev - 1
        })
      }, 1000)
    } else {
      clearInterval(timerRef.current)
    }

    return () => clearInterval(timerRef.current)
  }, [isRunning, timeLeft])

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onresult = (event) => {
        let currentTranscript = ''
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript + ' '
        }
        setTranscript(currentTranscript)
      }

      recognition.onerror = (e) => {
        console.warn('Speech recognition error:', e.error)
        setIsListening(false)
      }

      recognition.onend = () => {
        if (isListening && isRunning) {
          try {
            recognition.start()
          } catch (_) { }
        }
      }

      recognitionRef.current = recognition
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [isListening, isRunning])

  const toggleVoiceRecognition = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported in this browser. Please try Google Chrome.')
      return
    }

    if (isListening) {
      stopVoiceRecognition()
    } else {
      startVoiceRecognition()
    }
  }

  const startVoiceRecognition = () => {
    if (!recognitionRef.current) return
    try {
      recognitionRef.current.start()
      setIsListening(true)
    } catch (_) { }
  }

  const stopVoiceRecognition = () => {
    if (!recognitionRef.current) return
    try {
      recognitionRef.current.stop()
      setIsListening(false)
    } catch (_) { }
  }

  const handleStartPause = () => {
    if (isCompleted) {
      handleReset()
      return
    }
    if (!isRunning) {
      playBeep(660, 'sine', 0.12)
      setIsRunning(true)
    } else {
      setIsRunning(false)
      if (isListening) stopVoiceRecognition()
    }
  }

  const handleReset = () => {
    setIsRunning(false)
    setIsCompleted(false)
    setTimeLeft(totalSeconds)
    setTranscript('')
    stopVoiceRecognition()
  }

  const handleSelectPreset = (seconds) => {
    setIsRunning(false)
    setIsCompleted(false)
    setTotalSeconds(seconds)
    setTimeLeft(seconds)
    setTranscript('')
    stopVoiceRecognition()
  }

  const handleCustomDuration = (e) => {
    e.preventDefault()
    const total = Math.max(5, parseInt(customMinutes || 0, 10) * 60 + parseInt(customSeconds || 0, 10))
    handleSelectPreset(total)
  }

  const handleNextPrompt = () => {
    const nextIdx = (currentPromptIndex + 1) % PRACTICE_PROMPTS.length
    setCurrentPromptIndex(nextIdx)
    handleSelectPreset(PRACTICE_PROMPTS[nextIdx].targetTime)
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => { })
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => { })
      setIsFullscreen(false)
    }
  }

  // Calculate percentage & colors
  const progressPercent = totalSeconds > 0 ? (timeLeft / totalSeconds) * 100 : 0
  const isWarning = progressPercent <= 30 && progressPercent > 10
  const isDanger = progressPercent <= 10

  const formatMinutesSeconds = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`
  }

  // Word count & Pace calculation
  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0
  const elapsedSecs = Math.max(1, totalSeconds - timeLeft)
  const wordsPerMinute = elapsedSecs > 5 ? Math.round((wordCount / elapsedSecs) * 60) : 0

  const activePrompt = PRACTICE_PROMPTS[currentPromptIndex]

  // SVG Circle calculation
  const radius = 130
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference

  return (
    <div
      ref={containerRef}
      className={`min-h-screen bg-[#f7f8fa] flex flex-col justify-between transition-colors ${isFullscreen ? 'bg-black text-white p-6' : ''
        }`}
    >
      <div>
        {!isFullscreen && <Navbar />}

        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          {/* Header Bar */}
          {!isFullscreen && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <button
                  onClick={() => navigate(-1)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-black mb-2 transition"
                >
                  <BsArrowLeft size={14} />
                  <span>Back</span>
                </button>
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                  <span>Interview Practice Timer</span>
                  <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold">
                    Pro Pacer
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Train your timing, master the STAR technique, and prevent rambling during technical and HR interviews.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`p-2.5 rounded-full border transition ${soundEnabled
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-gray-100 text-gray-400 border-gray-200'
                    }`}
                  title={soundEnabled ? 'Mute Audio Beeps' : 'Enable Audio Beeps'}
                >
                  {soundEnabled ? <BsVolumeUpFill size={16} /> : <BsVolumeMuteFill size={16} />}
                </button>

                <button
                  onClick={toggleFullscreen}
                  className="p-2.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 shadow-2xs transition"
                  title="Toggle Fullscreen"
                >
                  {isFullscreen ? <BsFullscreenExit size={16} /> : <BsFullscreen size={16} />}
                </button>
              </div>
            </div>
          )}

          {/* Practice Prompt Banner */}
          {showPrompt && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-3xl p-6 border mb-8 shadow-sm transition ${isFullscreen
                  ? 'bg-gray-900 border-gray-800 text-white'
                  : 'bg-white border-gray-200'
                }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-green-100 text-green-700 rounded-lg">
                    <BsChatSquareQuoteFill size={14} />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-green-700">
                    {activePrompt.category} Prompt
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleNextPrompt}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
                  >
                    <BsStars className="text-amber-500" />
                    <span>Next Question</span>
                  </button>
                </div>
              </div>

              <h2 className={`text-lg sm:text-xl font-bold mb-2 ${isFullscreen ? 'text-white' : 'text-gray-900'}`}>
                "{activePrompt.question}"
              </h2>
              <p className="text-xs text-gray-400">
                <strong className="text-gray-500">Pro Tip: </strong>
                {activePrompt.tips}
              </p>
            </motion.div>
          )}

          {/* Central Timer Display */}
          <div
            className={`rounded-3xl p-8 border shadow-sm flex flex-col items-center justify-center relative overflow-hidden transition ${isFullscreen
                ? 'bg-gray-900/80 border-gray-800'
                : 'bg-white border-gray-200'
              }`}
          >
            {/* SVG Radial Countdown */}
            <div className="relative flex items-center justify-center my-4">
              <svg width="320" height="320" className="transform -rotate-90">
                {/* Background Ring */}
                <circle
                  cx="160"
                  cy="160"
                  r={radius}
                  stroke={isFullscreen ? '#27272a' : '#f1f5f9'}
                  strokeWidth="14"
                  fill="transparent"
                />
                {/* Dynamic Progress Ring */}
                <circle
                  cx="160"
                  cy="160"
                  r={radius}
                  stroke={
                    isDanger
                      ? '#ef4444'
                      : isWarning
                        ? '#f59e0b'
                        : '#10b981'
                  }
                  strokeWidth="14"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700 ease-linear"
                />
              </svg>

              {/* Inner Countdown Number */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span
                  className={`text-5xl sm:text-6xl font-black font-mono tracking-tight transition ${isDanger
                      ? 'text-red-500 animate-pulse'
                      : isWarning
                        ? 'text-amber-500'
                        : isFullscreen
                          ? 'text-white'
                          : 'text-gray-900'
                    }`}
                >
                  {formatMinutesSeconds(timeLeft)}
                </span>

                <span className="text-xs uppercase tracking-widest font-semibold text-gray-400 mt-2">
                  {isCompleted
                    ? 'Time Finished!'
                    : isRunning
                      ? 'Speaking in Progress'
                      : 'Timer Paused'}
                </span>

                {isCompleted && (
                  <div className="mt-2 text-xs font-bold text-red-500 bg-red-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <BsCheckCircleFill /> Time's up!
                  </div>
                )}
              </div>
            </div>

            {/* Primary Control Buttons */}
            <div className="flex items-center gap-4 mt-6">
              <button
                onClick={handleReset}
                title="Reset timer"
                className="p-3.5 rounded-full border border-gray-300 text-gray-600 hover:text-black hover:bg-gray-100 transition cursor-pointer"
              >
                <BsArrowCounterclockwise size={20} />
              </button>

              <button
                onClick={handleStartPause}
                className={`flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-bold text-base transition shadow-lg cursor-pointer ${isCompleted
                    ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                    : isRunning
                      ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                      : 'bg-green-600 hover:bg-green-700 text-white shadow-green-600/30'
                  }`}
              >
                {isCompleted ? (
                  <>
                    <BsArrowCounterclockwise size={20} />
                    <span>Restart</span>
                  </>
                ) : isRunning ? (
                  <>
                    <BsPauseFill size={22} />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <BsPlayFill size={24} />
                    <span>Start Practice</span>
                  </>
                )}
              </button>

              <button
                onClick={toggleVoiceRecognition}
                title={isListening ? 'Stop Voice Input' : 'Transcribe Answer & Track Pace'}
                className={`p-3.5 rounded-full border transition cursor-pointer ${isListening
                    ? 'bg-rose-50 text-rose-600 border-rose-300 animate-pulse'
                    : 'border-gray-300 text-gray-600 hover:text-black hover:bg-gray-100'
                  }`}
              >
                {isListening ? <BsMicFill size={20} /> : <BsMicMuteFill size={20} />}
              </button>
            </div>

            {/* Speaking Pace & Metrics indicator */}
            {isListening && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold"
              >
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                  <BsSpeedometer2 size={13} />
                  <span>Pacing: {wordsPerMinute} WPM</span>
                  <span className="text-gray-400 font-normal">
                    ({wordsPerMinute > 160 ? 'Too Fast' : wordsPerMinute < 110 ? 'A Bit Slow' : 'Ideal 130-150'})
                  </span>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                  <span>Words Spoken: {wordCount}</span>
                </div>
              </motion.div>
            )}

            {/* Real-time transcribed text */}
            {transcript && (
              <div className="mt-5 w-full max-w-xl p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-700 font-mono leading-relaxed max-h-36 overflow-y-auto">
                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                  Live Transcription:
                </span>
                {transcript}
              </div>
            )}
          </div>

          {/* Preset Buttons & Custom Inputs */}
          {!isFullscreen && (
            <div className="mt-8 space-y-6">
              {/* Framework Presets */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                  Framework Presets
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {PRESETS.map((p) => {
                    const isSelected = totalSeconds === p.seconds
                    return (
                      <button
                        key={p.seconds}
                        onClick={() => handleSelectPreset(p.seconds)}
                        className={`p-3.5 rounded-2xl border text-center transition flex flex-col items-center justify-center cursor-pointer ${isSelected
                            ? 'bg-black text-white border-black shadow-md'
                            : 'bg-white hover:bg-gray-50 text-gray-800 border-gray-200'
                          }`}
                      >
                        <span className="text-sm font-bold">{p.label}</span>
                        <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-gray-300' : 'text-gray-400'}`}>
                          {p.desc}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Custom Duration & Full Mock CTA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Custom Time */}
                <form
                  onSubmit={handleCustomDuration}
                  className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-1">Set Custom Time</h4>
                    <p className="text-xs text-gray-500 mb-4">
                      Customize minutes and seconds for tailored mock questions.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 flex-1">
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={customMinutes}
                        onChange={(e) => setCustomMinutes(e.target.value)}
                        className="w-full bg-transparent text-sm font-bold focus:outline-none"
                      />
                      <span className="text-xs text-gray-400 font-semibold ml-1">min</span>
                    </div>

                    <div className="flex items-center bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 flex-1">
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={customSeconds}
                        onChange={(e) => setCustomSeconds(e.target.value)}
                        className="w-full bg-transparent text-sm font-bold focus:outline-none"
                      />
                      <span className="text-xs text-gray-400 font-semibold ml-1">sec</span>
                    </div>

                    <button
                      type="submit"
                      className="bg-black hover:bg-gray-800 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition cursor-pointer"
                    >
                      Set
                    </button>
                  </div>
                </form>

                {/* Ready for Full Interview Banner */}
                <div className="bg-gradient-to-br from-green-500 to-emerald-700 text-white rounded-2xl p-5 shadow-md flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <BsLightningChargeFill className="text-yellow-300" />
                      <span className="text-xs font-bold uppercase tracking-wider text-green-100">
                        Ready to Test Yourself?
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-white mb-1">Take Full AI Mock Interview</h4>
                    <p className="text-xs text-green-100 leading-relaxed">
                      Experience realistic voice-based mock interviews with resume evaluation and instant AI feedback.
                    </p>
                  </div>

                  <div className="mt-4">
                    <button
                      onClick={() => navigate('/interview')}
                      className="bg-white text-gray-900 hover:bg-green-50 font-bold text-xs px-5 py-2.5 rounded-full transition shadow-sm cursor-pointer"
                    >
                      Start Full Mock Interview →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {!isFullscreen && <Footer />}
    </div>
  )
}

export default TimerPage
