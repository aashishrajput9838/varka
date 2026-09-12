import crypto from 'crypto'

const generateOTP = (): string => {
    const otp = crypto.randomInt(0, 1000000).toString().padStart(6, '0')
    return otp;
}

export default generateOTP