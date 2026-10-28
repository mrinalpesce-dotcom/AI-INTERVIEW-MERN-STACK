import { configureStore } from '@reduxjs/toolkit'
import userSlice from "./user.Slice"

export default  configureStore({
  reducer: {
    user:userSlice
  }
})