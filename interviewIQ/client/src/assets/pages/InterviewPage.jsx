import React, { useState } from 'react'
import Step1SetUp from '../components/Step1SetUp.jsx'
import Step2Interview from '../components/Step2Interview.jsx'
import ReportPage from './ReportPage.jsx'
import { useSelector } from 'react-redux'
import AuthModel from '../components/AuthModel.jsx'
import { useNavigate } from 'react-router-dom'

function InterviewPage() {
  const [step, setStep] = useState(1)
  const [interviewData, setInterviewData] = useState(null)
  const [reportData, setReportData] = useState(null)
  const { userData } = useSelector((state) => state.user)
  const navigate = useNavigate()

  return (
    <div className='min-h-screen bg-gray-50'>
      {!userData && (
        <AuthModel onClose={() => navigate('/home')} />
      )}
      {step === 1 && (
        <Step1SetUp
          onStart={(data) => {
            setInterviewData(data)
            setStep(2)
          }}
        />
      )}
      {step === 2 && (
        <Step2Interview
          interviewData={interviewData}
          onFinish={(report) => {
            setReportData(report)
            setStep(3)
          }}
        />
      )}
      {step === 3 && <ReportPage report={reportData} />}
    </div>
  )
}

export default InterviewPage