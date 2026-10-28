import React, { useState } from 'react'
import Navbar from '../components/Navbar.jsx'
import { useSelector } from 'react-redux'
import { motion } from "framer-motion"
import { useNavigate } from 'react-router-dom'
import AuthModel from '../components/AuthModel.jsx'
import Footer from '../components/Footer.jsx'
import {
  BsRocket,
  BsMic,
  BsClock,
  BsBarChart,
  BsFileEarmarkText,
  BsPersonVideo2,
  BsCode,
  BsBriefcase
} from "react-icons/bs"
import { HiSparkles } from 'react-icons/hi'
import evalImg from "../MM.png"
import resumeImg from "../resume.png"
import pdfImg from "../pdf.png"
import analyticsImg from "../history.png"
import hrImg from "../HR.png"
import techImg from "../tech.png"
import confidenceImg from "../hero.png"
import creditImg from "../img1.png"





function Home() {
  const { userData } = useSelector((state) => state.user)
  const [showAuth, setShowAuth] = useState(false)
  const navigate = useNavigate()

  const handleStartInterview = () => {
    if (!userData) { setShowAuth(true); return }
    navigate("/interview")
  }
  return (
    <div className='min-h-screen bg-[#f3f3f3] flex flex-col gap-5'>
      <Navbar />
      <div className='flex-1 px-6 py-20'>

        <div className='max-w-6xl mx-auto'>
        <div className='flex justify-center mb-6'>
          <div className='bg-gray-100 text-gray-600 text-sm px-4 py-2 rounded-full flex items-center gap-2'>
            <HiSparkles size={16} className='bg-green-50 text-green-600' />
            <span>AI Powered Smart Interview Platform</span>
          </div>
          </div>
          <div className='text-center mb-28'>
           <motion.h1
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 1, duration: 1, ease: "easeOut" }}
           
           className='text-4xl md:text-6xl font-semibold leading-tight max-w-4xl mx-auto'>
              Practice Interview with 
              <span className='relative inline-block'>
                <span className='absolute inset-0 bg-green-100 translate-y-3 translate-x-1 rounded-full -z-10'></span>
                <span className='relative text-green-600'>AI Smart InterviewIQ</span>
              </span>


           </motion.h1>
           <motion.p
           initial={{opacity:0,y:20}}
           animate={{opacity:1,y:0}}
           transition={{delay:1.2,duration:1,ease:"easeOut"}}
           className='text-gray-500 text-center text-sm md:text-base leading-relaxed mb-12 mt-6'>
             Role-based mock interviews with smart follow-ups, adaptive difficulty and real-time performance evaluation.
           </motion.p>
           <div className='flex flex-wrap justify-center gap-4 mt-10'>
             <motion.button
             onClick={handleStartInterview}
             whileHover={{ opacity: 0.9, scale: 1.03 }}
             whileTap={{ opacity: 1, scale: 0.98 }}
             className='bg-black text-white px-10 py-3 rounded-full hover:opacity-90 transition shadow-md'>
               Start Interview
             </motion.button>

             <motion.button
             onClick={() => navigate("/history")}
             whileHover={{ opacity: 0.9, scale: 1.03 }}
             whileTap={{ opacity: 1, scale: 0.98 }}
             className='border border-gray-300 px-10 py-3 rounded-full hover:bg-gray-100 transition'>
               View History
             </motion.button>
           </div>


           </div>
           <div className='flex flex-col md:flex-row justify-center items-center gap-10 mb-28'>
           {
            [
              {
                icon:<BsRocket size={32}/>,
                step:"STEP 1",
                title:"Role & Experience Selection",
                desc:"AI adjust difficulty based on Selected job role."
              },
              {
                icon:<BsMic size={32}/>,
                step:"STEP 2",
                title:"Smart Voice Interview",
                desc:" AI will ask job-specific questions and engage in natural conversation."
              },
              {
                icon:<BsClock size={32}/>,
                step:"STEP 3",
                title:"Real-time Evaluation",
                desc:"Get instant feedback on your answers along with suggestions for improvement."
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{opacity:0,y:60}}
                animate={{opacity:1,y:0}}
                transition={{delay:index*0.3,duration:0.6}}
                
                whileHover={{ scale: 1.04 }}
              
                className={`
                  relative bg-white rounded-3xl border-2 border-green-100
                  hover:border-green-500 p-10 w-80 max-w-[90%] shadow-md
                  hover:shadow-2xl
                  transition-all duration-300
                  ${index === 0 ? "rotate-[-4deg]" : ""}
                  ${index === 1 ? "rotate-[3deg] md:-mt-6 shadow-xl" : ""}
                  ${index === 2 ? "rotate-[-4deg] md:-mt-6 shadow-2xl" : ""}
                `}
              >
                <div className='text-green-600 mb-4'>{item.icon}</div>
                <p className='text-xs font-bold text-green-500 uppercase tracking-widest mb-2'>{item.step}</p>
                <h3 className='text-lg font-semibold text-gray-800 mb-2'>{item.title}</h3>
                <p className='text-sm text-gray-500 leading-relaxed'>{item.desc}</p>
              </motion.div>
            ))
           }
           </div>
           <div className='mb-32'>
            <motion.h2
            initial={{opacity:0,y:20}}
            animate={{opacity:1,y:0}}
            transition={{delay:0.6,duration:0.6}}
            className='text-4xl md:text-5xl font-semibold text-center mb-6'>
              Advanced AI
              <span className='text-green-600'> Features & Capabilities</span>
              </motion.h2>

              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {
                  [
                    {
                      image: evalImg,
                      icon: <BsBarChart size={32} />,
                      title: "AI Voice & Speech Feedback",
                      desc: "Real-time analysis of your answers with actionable feedback on clarity and technical accuracy.",
                    },
                    {
                      image: resumeImg,
                      icon: <BsFileEarmarkText size={32} />,
                      title: "Resume-Tailored Questions",
                      desc: "Custom interview questions generated specifically from your experience and tech stack.",
                    },
                    {
                      image: pdfImg,
                      icon: <BsFileEarmarkText size={32} />,
                      title: "Downloadable PDF Reports",
                      desc: "Export comprehensive interview scorecards and improvement tips to review anytime.",
                    },
                    {
                      image: analyticsImg,
                      icon: <BsBarChart size={32} />,
                      title: "History & Progress Analytics",
                      desc: "Track your mock interview metrics, scoring trends, and confidence over time.",
                    },
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      className='bg-white border border-gray-200 rounded-3xl shadow-sm hover:shadow-xl transition-all p-6'
                    >
                      <div className='flex flex-col md:flex-row items-center gap-8'>
                        <div className='w-full md:w-1/2 flex justify-center'>
                          <img
                            src={item.image}
                            alt={item.title}
                            className='w-full h-auto object-contain max-h-64'
                          />
                        </div>

                        <div className='w-full md:w-1/2'>
                          <div className='bg-green-50 text-green-600 w-12 h-12 rounded-xl flex items-center justify-center mb-6'>
                            {item.icon}
                          </div>
                          <h3 className='font-semibold text-gray-800 text-lg mb-2'>{item.title}</h3>
                          <p className='text-gray-500 text-sm leading-relaxed'>{item.desc}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                }
              </div>
            </div>
             <div className='mb-32'>
            <motion.h2
            initial={{opacity:0,y:20}}
            animate={{opacity:1,y:0}}
            transition={{delay:0.6,duration:0.6}}
            className='text-4xl md:text-5xl font-semibold text-center mb-6'>
              Multiple Interview Types
              <span className='text-green-600'> Features & Capabilities</span>
              </motion.h2>

              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {
                  [
                    {
                      img:hrImg,
                      title:"HR Interview",
                      desc:"Practice common HR interview questions and get feedback on your answers.",
                      color:"",
                      icon:<BsPersonVideo2 size={32} />,
                    },
                    {
                      img:techImg,
                      title:"Technical Interview",
                      desc:"Practice common technical interview questions and get feedback on your answers.",
                      color:"",
                      icon:<BsPersonVideo2 size={32} />,
                    },
                    {
                      img:confidenceImg,
                      title:"Coding Round ",
                      desc:"Crack coding interviews with AI-powered practice sessions. Get instant feedback on logic, efficiency, and best practices.",
                      color:"",
                      icon:<BsCode size={32} />,
                    },
                    {
                      img:creditImg,
                      title:"Behavioral Interview",
                      desc:"Sharpen your analytical and decision-making skills with real case study scenarios. Get structured feedback to ace your business acumen rounds.",
                      color:"",
                      icon:<BsBriefcase size={32} />,
                    },
                  ].map((mode, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      className='bg-white border border-gray-200 rounded-3xl shadow-sm hover:shadow-xl transition-all p-6'
                    >
                      <div className='flex flex-col md:flex-row items-center gap-8'>
                      <div className="w-1/2">
                      <h3 className="font-semibold text-lg text-gray-800 mb-2">{mode.title}</h3>
                      <p className='text-gray-500 text-sm leading-relaxed'>{mode.desc}</p>
                      </div>
                      <div className="w-1/2 flex justify-end">
                        <img src={mode.img} alt={mode.title} 
                        className="w-28 h-28 object-contain"
                        />
                        </div>



                      </div>
                    </motion.div>
                  ))
                }
              </div>
            </div>
            </div>
            {showAuth && <AuthModel onClose={() => setShowAuth(false)} />}
            <Footer/>
          </div>
        </div>
  )
}

export default Home
