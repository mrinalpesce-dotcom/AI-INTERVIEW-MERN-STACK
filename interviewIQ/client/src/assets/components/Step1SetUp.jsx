import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  FaUserTie,
  FaBriefcase,
  FaFileUpload,
  FaChartLine,
  FaMicrophoneAlt,
  FaRobot,
  FaCheckCircle,
  FaSpinner
} from 'react-icons/fa'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import { serverUrl } from '../../App.jsx'
import { setUserData } from '../../redux/user.Slice.js'
import AuthModel from './AuthModel.jsx'

const roleSuggestions = [
  'Full Stack Developer',
  'Frontend Developer',
  'Backend Developer',
  'React Developer',
  'Node.js Developer',
  'Software Engineer'
]

const experienceOptions = [
  { label: 'Entry Level (0-1 yrs)', value: '0-1 years' },
  { label: 'Junior (1-3 yrs)', value: '1-3 years' },
  { label: 'Mid-Level (3-5 yrs)', value: '3-5 years' },
  { label: 'Senior (5+ yrs)', value: '5+ years' }
]

const modes = [
  { id: 'Technical' },
  { id: 'HR' }
]

function Step1SetUp({ onStart }) {
  const { userData } = useSelector((state) => state.user)
  const dispatch = useDispatch()
  const [role, setRole] = useState('')
  const [experience, setExperience] = useState('')
  const [mode, setMode] = useState('Technical')
  const [resumeFile, setResumeFile] = useState(null)
  const [isAnalysing, setIsAnalysing] = useState(false)
  const [resumeText, setResumeText] = useState('')
  const [projects, setProjects] = useState([])
  const [skills, setSkills] = useState([])
  const [analysis, setAnalysis] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [showAuthModal, setShowAuthModal] = useState(false)

  const handleUploadResume = async () => {
    if (!resumeFile || isAnalysing) return
    setIsAnalysing(true)
    setErrorMsg('')

    const formdata = new FormData()
    formdata.append('resume', resumeFile)
    formdata.append('role', role)
    formdata.append('experience', experience)

    try {
      const result = await axios.post(`${serverUrl}/api/interview/analyze-resume`, formdata, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      })

      if (result.data) {
        if (result.data.role) setRole(result.data.role)
        if (result.data.experience) setExperience(result.data.experience)
        if (result.data.resumeText) setResumeText(result.data.resumeText)
        if (result.data.skills) setSkills(result.data.skills)
        if (result.data.projects) setProjects(result.data.projects)
        setAnalysis(true)
      }
    } catch (error) {
      console.error(error)
      setErrorMsg(error.response?.data?.message || 'Error analyzing resume')
    } finally {
      setIsAnalysing(false)
    }
  }

  const handleStart = async (e) => {
    if (e) e.preventDefault()
    if (!role || !experience || loading) return
    setLoading(true)
    setErrorMsg('')

    // Unlock browser audio speech synthesis on this user gesture
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel()
        const prime = new SpeechSynthesisUtterance('Starting')
        prime.volume = 0.05
        window.speechSynthesis.speak(prime)
      } catch (_) {}
    }

    try {
      const result = await axios.post(
        `${serverUrl}/api/interview/generate-questions`,
        {
          role,
          experience,
          mode,
          resumeText,
          projects,
          skills
        },
        { withCredentials: true }
      )

      if (userData && result.data.creditsLeft !== undefined) {
        dispatch(
          setUserData({
            ...userData,
            credits: result.data.creditsLeft
          })
        )
      }

      if (onStart) {
        onStart(result.data)
      }
    } catch (error) {
      console.error(error)
      setErrorMsg(error.response?.data?.message || 'Failed to start interview')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 px-4 py-8"
    >
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">
        {/* Left Column: Information & Overview */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="relative bg-gradient-to-br from-green-50 to-green-100 p-8 md:p-12 flex flex-col justify-between"
        >
          <div>
            <div className="inline-flex items-center gap-2 bg-green-200/60 text-green-900 px-3 py-1.5 rounded-full text-xs font-semibold mb-4">
              <FaRobot className="text-green-700" />
              <span>Step 1 &bull; Interview Setup</span>
            </div>

            <h2 className="text-3xl md:text-4xl font-extrabold text-green-950 mb-3 tracking-tight">
              Start Your Interview
            </h2>
            <p className="text-green-800 text-base md:text-lg mb-8 leading-relaxed">
              Prepare for your next high-stakes interview with AI. Sharpen technical depth, problem-solving, and communication.
            </p>

            <div className="space-y-4">
              {[
                {
                  icon: <FaUserTie className="text-green-600 text-xl" />,
                  title: 'Customized Evaluation',
                  text: 'Tailored questions mapped to your target job role and seniority.'
                },
                {
                  icon: <FaChartLine className="text-green-600 text-xl" />,
                  title: 'Deep Performance Metrics',
                  text: 'Instant feedback on clarity, structure, and technical accuracy.'
                },
                {
                  icon: <FaMicrophoneAlt className="text-green-600 text-xl" />,
                  title: 'Real-Time Voice Interaction',
                  text: 'Practice natural conversation with dynamic AI follow-ups.'
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="flex items-start space-x-4 bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-green-100 hover:shadow-md transition-shadow"
                >
                  <div className="p-2.5 bg-green-50 rounded-xl">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">{item.title}</h4>
                    <p className="text-xs text-gray-600 mt-0.5">{item.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-green-200/60 flex items-center justify-between text-xs text-green-800">
            <span>Powered by InterviewIQ AI</span>
            <span>Adaptive Difficulty &bull; Instant Feedback</span>
          </div>
        </motion.div>

        {/* Right Column: Setup Form */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="p-8 md:p-12 bg-white flex flex-col justify-center"
        >
          <div className="mb-6">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
              AI Smart Interview
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Configure your interview parameters to begin your personalized session.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center justify-between">
              <span>{errorMsg}</span>
              {(errorMsg.toLowerCase().includes('unauthorized') || errorMsg.toLowerCase().includes('token') || errorMsg.toLowerCase().includes('log in')) && (
                <button
                  type="button"
                  onClick={() => setShowAuthModal(true)}
                  className="ml-3 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold whitespace-nowrap cursor-pointer transition"
                >
                  Sign In
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleStart} className="space-y-6">
            {/* Target Role */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Target Role <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <FaBriefcase />
                </div>
                <input
                  type="text"
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Full Stack Developer, React Engineer"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm transition"
                />
              </div>

              {/* Suggestions chips */}
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {roleSuggestions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setRole(item)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition cursor-pointer ${
                      role === item
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Experience Level */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Experience Level <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {experienceOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setExperience(opt.value)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left text-xs font-medium transition cursor-pointer ${
                      experience === opt.value
                        ? 'border-green-600 bg-green-50 text-green-900 ring-2 ring-green-500'
                        : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {experience === opt.value && (
                      <FaCheckCircle className="text-green-600 text-sm flex-shrink-0 ml-1" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Interview Mode */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Interview Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                {modes.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMode(m.id)}
                    className={`py-2.5 px-2 text-center rounded-xl text-xs font-semibold border transition cursor-pointer ${
                      mode === m.id
                        ? 'bg-black text-white border-black shadow-sm'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {m.id}
                  </button>
                ))}
              </div>
            </div>

            {/* Upload Resume (Optional) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Resume <span className="text-xs font-normal text-gray-400">(Optional for tailored context)</span>
              </label>
              <div className="flex gap-2 items-center">
                <label className="flex-1 flex items-center justify-center gap-3 p-3.5 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-500 hover:bg-green-50/40 transition cursor-pointer">
                  <FaFileUpload className="text-gray-400 text-lg" />
                  <span className="text-xs text-gray-600 truncate max-w-[220px]">
                    {resumeFile ? resumeFile.name : 'Upload PDF resume'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      setResumeFile(e.target.files?.[0] || null)
                      setAnalysis(false)
                    }}
                    className="hidden"
                  />
                </label>
                {resumeFile && (
                  <button
                    type="button"
                    onClick={handleUploadResume}
                    disabled={isAnalysing}
                    className="px-4 py-3.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isAnalysing ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      'Analyze'
                    )}
                  </button>
                )}
              </div>
              {analysis && (
                <div className="mt-2 text-xs text-green-700 bg-green-50 p-2.5 rounded-xl border border-green-200 flex items-center gap-2">
                  <FaCheckCircle className="text-green-600" />
                  <span>Resume parsed! Autofilled role, experience & skills.</span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={!role || !experience || loading}
              whileHover={{ scale: !role || !experience || loading ? 1 : 1.02 }}
              whileTap={{ scale: !role || !experience || loading ? 1 : 0.98 }}
              className={`w-full py-3.5 px-6 rounded-xl font-semibold text-sm transition shadow-md cursor-pointer flex items-center justify-center gap-2 ${
                !role || !experience || loading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white shadow-green-600/30'
              }`}
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  <span>Generating Interview Session...</span>
                </>
              ) : (
                <>
                  <span>Start Interview Session</span>
                  <FaRobot />
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
      {showAuthModal && <AuthModel onClose={() => setShowAuthModal(false)} />}
    </motion.div>
  )
}

export default Step1SetUp