import { model } from 'mongoose'
import userSchema from './user.schema.js'
import { IUser  } from './user.schema.js'

const userModel = model<IUser>('user', userSchema)

export default userModel