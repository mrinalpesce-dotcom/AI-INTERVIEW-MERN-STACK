import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FaClock,
  FaMicrophone,
  FaMicrophoneSlash,
  FaPaperPlane,
  FaArrowRight,
  FaRobot,
  FaCheckCircle,
  FaSpinner,
  FaVolumeUp,
  FaVolumeMute
} from 'react-icons/fa'
import axios from 'axios'
import { serverUrl } from '../../App.jsx'
import femaleAiVideo from '../female-ai.mp4'

function Step2Interview({ interviewData, onFinish }) {
  const interviewId = interviewData?.interviewId || interviewData?.interview?._id
  const questions = interviewData?.questions || interviewData?.interview?.questions || []

  const [currentIndex, setCurrentIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [finishing, setFinishing] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voices, setVoices] = useState([])
  const [hasUserEnabledAudio, setHasUserEnabledAudio] = useState(false)

  const currentQ = questions[currentIndex] || {
    question: 'No questions available.',
    timeLimit: 60,
    difficulty: 'Medium'
  }

  const [timeRemaining, setTimeRemaining] = useState(currentQ.timeLimit || 60)
  const recognitionRef = useRef(null)
  const timerRef = useRef(null)
  const videoRef = useRef(null)
  const utteranceRef = useRef(null)
  const speakTimeoutRef = useRef(null)
  const audioRef = useRef(null)

  // Load natural voices and handle browser voice change events
  useEffect(() => {
    const updateVoices = () => {
      if ('speechSynthesis' in window) {
        const v = window.speechSynthesis.getVoices()
        if (v && v.length > 0) {
          setVoices(v)
        }
      }
    }

    updateVoices()
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices
    }

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [])

  // Initialize Speech Recognition if supported
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onresult = (event) => {
        let transcript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript
        }
        setAnswer((prev) => (prev ? prev + ' ' + transcript : transcript))
      }

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event)
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
    }
  }, [])

  // Play audio fallback using Google TTS audio stream
  const playAudioFallback = (rawText) => {
    try {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      const cleanText = rawText.replace(/[*_#`]/g, '').trim()
      const chunk = cleanText.length > 180 ? cleanText.slice(0, 180) : cleanText
      const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${encodeURIComponent(chunk)}`
      const audio = new Audio(audioUrl)
      audioRef.current = audio

      audio.onplay = () => {
        setIsSpeaking(true)
      }
      audio.onended = () => {
        setIsSpeaking(false)
      }
      audio.onerror = () => {
        setIsSpeaking(false)
      }
      audio.play().catch((err) => {
        console.warn('Audio TTS fallback playback blocked:', err)
        setIsSpeaking(false)
      })
    } catch (err) {
      console.warn('Audio fallback error:', err)
      setIsSpeaking(false)
    }
  }

  // Speak question aloud using natural voice with cancel-delay protection & fallback
  const speakQuestion = (textToSpeak) => {
    const text = textToSpeak || currentQ?.question
    if (!text || text === 'No questions available.') return

    if (speakTimeoutRef.current) {
      clearTimeout(speakTimeoutRef.current)
    }

    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
      if (audioRef.current) {
        audioRef.current.pause()
      }
    } catch (_) {}

    speakTimeoutRef.current = setTimeout(() => {
      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.resume()

          const cleanText = text.replace(/[*_#`]/g, '').trim()
          const utterance = new SpeechSynthesisUtterance(cleanText)
          window._activeUtterance = utterance
          utteranceRef.current = utterance

          const voiceList = window.speechSynthesis.getVoices()
          if (voiceList && voiceList.length > 0) {
            // Strictly find female English voices and explicitly exclude male voices
            const femaleVoice =
              voiceList.find((v) => {
                const name = v.name.toLowerCase()
                const isFemale =
                  name.includes('zira') ||
                  name.includes('female') ||
                  name.includes('jenny') ||
                  name.includes('aria') ||
                  name.includes('samantha') ||
                  name.includes('victoria') ||
                  name.includes('karen') ||
                  name.includes('susan') ||
                  name.includes('hazel') ||
                  name.includes('eva') ||
                  name.includes('heera') ||
                  name.includes('catherine') ||
                  name.includes('linda') ||
                  name.includes('libby') ||
                  name.includes('sonia') ||
                  name.includes('neerja') ||
                  name.includes('google us english') ||
                  name.includes('google uk english female')

                const isMale =
                  name.includes('david') ||
                  name.includes('mark') ||
                  name.includes('male') ||
                  name.includes('george') ||
                  name.includes('guy') ||
                  name.includes('james') ||
                  name.includes('richard') ||
                  name.includes('ravi')

                return v.lang.startsWith('en') && isFemale && !isMale
              }) ||
              voiceList.find((v) => {
                const name = v.name.toLowerCase()
                return (
                  v.lang.startsWith('en') &&
                  !name.includes('david') &&
                  !name.includes('mark') &&
                  !name.includes('male') &&
                  !name.includes('george')
                )
              })

            if (femaleVoice) {
              utterance.voice = femaleVoice
            }
          }

          utterance.volume = 1.0
          utterance.rate = 0.95
          utterance.pitch = 1.15

          utterance.onstart = () => {
            setIsSpeaking(true)
          }

          utterance.onend = () => {
            setIsSpeaking(false)
            window._activeUtterance = null
          }

          utterance.onerror = (e) => {
            if (e?.error === 'canceled' || e?.error === 'interrupted') {
              setIsSpeaking(false)
              window._activeUtterance = null
              return
            }
            console.warn('SpeechSynthesis event error (' + e?.error + '), falling back to Audio TTS...')
            setIsSpeaking(false)
            window._activeUtterance = null
            if (e?.error === 'synthesis-failed' || e?.error === 'not-allowed') {
              playAudioFallback(text)
            }
          }

          window.speechSynthesis.speak(utterance)
        } catch (err) {
          console.error('Speech synthesis error, trying audio fallback:', err)
          playAudioFallback(text)
        }
      } else {
        playAudioFallback(text)
      }
    }, 120)
  }

  const stopSpeaking = () => {
    if (speakTimeoutRef.current) {
      clearTimeout(speakTimeoutRef.current)
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    if (audioRef.current) {
      audioRef.current.pause()
    }
    setIsSpeaking(false)
    window._activeUtterance = null
  }

  // Timer countdown
  useEffect(() => {
    setTimeRemaining(currentQ.timeLimit || 60)
    setFeedback(null)
    setAnswer('')
    setErrorMsg('')

    if (timerRef.current) clearInterval(timerRef.current)

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [currentIndex, currentQ.timeLimit])

  // Automatically speak question whenever a question appears or changes
  useEffect(() => {
    if (currentQ?.question && currentQ.question !== 'No questions available.') {
      speakQuestion(currentQ.question)
    }
    return () => {
      stopSpeaking()
    }
  }, [currentIndex, currentQ?.question])

  const toggleListening = () => {
    // If AI voice is speaking, stop it so it doesn't talk over candidate
    stopSpeaking()

    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please type your answer.')
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch (err) {
        console.error(err)
      }
    }
  }

  const handleSubmitAnswer = async () => {
    if (!answer.trim() || submitting) return
    setSubmitting(true)
    setErrorMsg('')
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }

    try {
      const response = await axios.post(
        `${serverUrl}/api/interview/submit-answer`,
        {
          interviewId,
          questionIndex: currentIndex,
          questionId: currentQ._id || currentQ.id,
          answer: answer.trim(),
          timeTaken: (currentQ.timeLimit || 60) - timeRemaining
        },
        { withCredentials: true }
      )

      setFeedback(response.data)
    } catch (err) {
      console.error(err)
      setErrorMsg(err.response?.data?.message || 'Failed to submit answer')
    } finally {
      setSubmitting(false)
    }
  }

  const handleNextOrFinish = async () => {
    stopSpeaking()
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      // Finish interview
      setFinishing(true)
      try {
        const response = await axios.post(
          `${serverUrl}/api/interview/finish`,
          { interviewId },
          { withCredentials: true }
        )
        if (onFinish) {
          onFinish(response.data)
        }
      } catch (err) {
        console.error(err)
        setErrorMsg(err.response?.data?.message || 'Failed to finish interview')
      } finally {
        setFinishing(false)
      }
    }
  }

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between py-6 px-4 md:px-8">
      {/* Top Bar */}
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-200 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-black text-white p-2 rounded-xl">
            <FaRobot size={22} />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">
              Question {currentIndex + 1} of {questions.length}
            </h2>
            <p className="text-xs text-gray-500">
              Difficulty: <span className="font-semibold text-green-600">{currentQ.difficulty || 'Medium'}</span>
            </p>
          </div>
        </div>

        {/* Timer */}
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono text-sm font-semibold transition ${
            timeRemaining <= 15
              ? 'bg-red-100 text-red-600 animate-pulse'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          <FaClock />
          <span>{formatTime(timeRemaining)}</span>
        </div>
      </div>

      {/* Main Grid: AI Video / Question & Candidate Answer */}
      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 items-stretch">
        {/* Left Column: AI Avatar and Question */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 flex flex-col justify-between">
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-video max-h-72 flex items-center justify-center group shadow-inner">
            <video
              ref={videoRef}
              src={femaleAiVideo}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />

            {/* Speaking Status Badge */}
            <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-xs text-white">
              <span className={`w-2.5 h-2.5 rounded-full transition-colors ${isSpeaking ? 'bg-green-400 animate-ping' : 'bg-gray-400'}`} />
              <span className="font-medium">{isSpeaking ? 'AI Speaking...' : 'AI Ready'}</span>
            </div>

            {/* Bouncing sound waves when speaking */}
            {isSpeaking && (
              <div className="absolute bottom-3 left-3 flex items-end gap-1 bg-black/60 backdrop-blur-md px-3 py-2 rounded-xl">
                <span className="w-1 h-3 bg-green-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1 h-6 bg-green-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1 h-2 bg-green-400 rounded-full animate-bounce [animation-delay:300ms]" />
                <span className="w-1 h-5 bg-green-400 rounded-full animate-bounce [animation-delay:100ms]" />
                <span className="w-1 h-4 bg-green-400 rounded-full animate-bounce [animation-delay:250ms]" />
              </div>
            )}

            {/* Speak / Stop Button on video */}
            <button
              type="button"
              onClick={isSpeaking ? stopSpeaking : () => speakQuestion()}
              className={`absolute bottom-3 right-3 flex items-center gap-1.5 px-4 py-2 rounded-full shadow-xl text-xs font-bold transition cursor-pointer z-10 ${
                isSpeaking
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
              title={isSpeaking ? 'Stop Voice' : 'Listen to Question'}
            >
              {isSpeaking ? <FaVolumeMute size={14} /> : <FaVolumeUp size={14} />}
              <span>{isSpeaking ? 'Stop Voice' : 'Speak Question'}</span>
            </button>
          </div>

          <div className="mt-6 flex-1 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-green-600 uppercase tracking-wider">
                Question {currentIndex + 1}
              </span>
              <button
                type="button"
                onClick={isSpeaking ? stopSpeaking : () => speakQuestion()}
                className="text-xs font-semibold text-green-700 hover:text-green-800 flex items-center gap-1 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-full border border-green-200 transition cursor-pointer"
              >
                {isSpeaking ? <FaVolumeMute size={12} /> : <FaVolumeUp size={12} />}
                <span>{isSpeaking ? 'Mute AI' : 'Play Audio'}</span>
              </button>
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 leading-snug">
              {currentQ.question}
            </h3>
          </div>
        </div>

        {/* Right Column: Candidate Answer Box & Instant Feedback */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-800">Your Response</label>
              <button
                type="button"
                onClick={toggleListening}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {isListening ? <FaMicrophoneSlash /> : <FaMicrophone />}
                <span>{isListening ? 'Stop Recording' : 'Voice Input'}</span>
              </button>
            </div>

            <textarea
              rows={8}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={submitting || feedback !== null}
              placeholder="Type your answer here or click 'Voice Input' to speak..."
              className="w-full p-4 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm resize-none disabled:bg-gray-50"
            />

            {errorMsg && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs">
                {errorMsg}
              </div>
            )}

            {/* AI Feedback Display */}
            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 rounded-2xl bg-green-50 border border-green-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-green-800 flex items-center gap-1.5">
                      <FaCheckCircle className="text-green-600" /> AI Evaluation
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-200 text-green-900">
                      Score: {feedback.score ?? feedback.question?.score ?? 0} / 10
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed">{feedback.feedback}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3">
            {!feedback ? (
              <button
                onClick={handleSubmitAnswer}
                disabled={!answer.trim() || submitting}
                className="flex-1 py-3.5 px-6 rounded-xl bg-black hover:bg-gray-800 text-white font-semibold text-sm transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    <span>Evaluating Answer...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Answer</span>
                    <FaPaperPlane />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNextOrFinish}
                disabled={finishing}
                className="flex-1 py-3.5 px-6 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-green-600/30"
              >
                {finishing ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    <span>Generating Final Report...</span>
                  </>
                ) : (
                  <>
                    <span>{currentIndex < questions.length - 1 ? 'Next Question' : 'Complete Interview & View Report'}</span>
                    <FaArrowRight />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Step2Interview