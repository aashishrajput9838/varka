import bcrypt from "bcryptjs";
import config from "../config/index.js";

const { saltRounds } = config

const hashPassword = async(password: string): Promise<string> => {
    try {
        const s = await bcrypt.genSalt(saltRounds);
        const passwordHash = await bcrypt.hash(password, s)
        return passwordHash
    } catch (err) {
        throw new Error(`Error hashing the password: ${(err as Error).message}`)
    }
}

const compareHash = async(currPassword: string, hashwedPassword: string): Promise<boolean> => {
    try {
        const isMatch = await bcrypt.compare(currPassword, hashwedPassword)
        return isMatch
    } catch (err) {
        console.error(`Bcrypt comparison error: ${(err as Error).message}`);
        return false
    }
}


const hashService = {
    hashingPassword: hashPassword, 
    compareHashedPassword: compareHash,
} as const 

export default hashService