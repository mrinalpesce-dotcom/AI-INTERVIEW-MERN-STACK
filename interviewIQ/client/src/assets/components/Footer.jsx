import React from 'react'
import { BsRobot } from 'react-icons/bs'

function Footer() {
  return (
    <footer className='bg-[#f3f3f3] flex justify-center px-4 pb-10 py-4 pt-10'>
      <div className='w-full max-w-6xl bg-white rounded-[24px] shadow-sm border border-gray-200 py-8 px-6 text-center flex flex-col items-center justify-center'>
        <div className='flex items-center gap-3 cursor-pointer justify-center'>
          <div className='bg-black text-white p-2 rounded-lg'>
            <BsRobot size={20} />
          </div>
          <h2 className='font-semibold text-lg text-gray-800'>InterviewIQ.AI</h2>
        </div>
        <p className='text-gray-500 text-center text-sm md:text-base leading-relaxed mt-4'>
          Copyright &copy; {new Date().getFullYear()}. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

export default Footer