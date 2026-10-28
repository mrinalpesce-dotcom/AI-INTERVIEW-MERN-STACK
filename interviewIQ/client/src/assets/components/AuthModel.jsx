import React from "react";
import { useSelector } from "react-redux";
import { useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import Auth from "../pages/Auth";

function AuthModel({ onClose }) {
  const { userData } = useSelector((state) => state.user);

  useEffect(() => {
    if (userData) {
      onClose();
    }
  }, [userData, onClose]);

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/10 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-md">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-black z-20 transition">
          <FaTimes size={18} />
        </button>
        <Auth isModel={true} onClose={onClose} />
      </div>
    </div>
  );
}

export default AuthModel;