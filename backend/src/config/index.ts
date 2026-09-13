import 'dotenv/config'
import { z } from 'zod'

const stripQuotes = (val?: string): string | undefined => {
  if (!val) return val
  const trimmed = val.trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim()
  }
  return trimmed
}

const envSchema = z.object({
    PORT: z
        .string()
        .transform((val) => stripQuotes(val) || '3030')
        .refine((val) => /^\d+$/.test(val), {
            error: 'Only numbers are allowed !',
        })
        .transform((val: string) => parseInt(val, 10))
        .refine((val: number) => val > 0 && val <= 65535, {
            error: 'Port number must be in range (0, 65535]',
        }),

    MONGODB_URI: z
        .string()
        .transform((val) => stripQuotes(val) || '')
        .pipe(
            z
                .string()
                .trim()
                .min(1, {
                    error: 'MONGODB_URI cannot be empty !',
                })
                .refine((val) => val.startsWith('mongodb://') || val.startsWith('mongodb+srv://'), {
                    error: 'MONGODB_URI must start with mongodb:// or mongodb+srv://',
                })
        ),

    SALT_ROUNDS: z
        .string()
        .transform((val) => stripQuotes(val) || '10')
        .refine((val) => /^\d+$/.test(val), {
            error: 'Only numbers are allowed !',
        })
        .transform((val: string) => parseInt(val, 10))
        .pipe(
            z
                .number()
                .gte(5, {
                    error: 'Salt must be greater than equal to 5',
                })
                .lt(12, {
                    error: 'Salt must be less than 12',
                }),
        ),

    ACCESS_TOKEN_SECRET: z
        .string()
        .transform((val) => stripQuotes(val) || '')
        .pipe(
            z
                .string()
                .trim()
                .min(1, {
                    error: 'ACCESS_TOKEN_SECRET cannot be empty !',
                })
        ),

    ACCESS_TOKEN_EXPIRY: z
        .string()
        .transform((val) => stripQuotes(val) || '1d')
        .pipe(
            z
                .string()
                .trim()
                .regex(/^\d+[smhd]$/, {
                    error: 'ACCESS_TOKEN_EXPIRY must be in format like 15m, 2h, 1d, 30s',
                })
        ),

    SMTP_HOST: z
        .string()
        .optional()
        .transform((val) => stripQuotes(val) || 'smtp.gmail.com'),
    SMTP_PORT: z
        .string()
        .optional()
        .transform((val) => {
            const cleaned = stripQuotes(val) || '465'
            const parsed = parseInt(cleaned, 10)
            return isNaN(parsed) ? 465 : parsed
        }),
    SMTP_USER: z.string().optional().transform(stripQuotes),
    SMTP_PASS: z.string().optional().transform(stripQuotes),
    EMAIL_FROM: z
        .string()
        .optional()
        .transform((val) => stripQuotes(val) || 'VARKA Freight Security <aashishrajput9838@gmail.com>'),
    GEMINI_API_KEY: z.string().optional().transform(stripQuotes),
    GEMINI_MODEL: z
        .string()
        .optional()
        .transform((val) => stripQuotes(val) || 'gemini-2.5-flash'),
    PYTHON_API_URL: z
        .string()
        .optional()
        .transform((val) => stripQuotes(val) || 'http://127.0.0.1:8000'),
})

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
    console.error('ERROR parsing the environment variables : ', parsedEnv.error.flatten())
    process.exit(1)
}

const config = {
    port: parsedEnv.data.PORT,
    mongodbUri: parsedEnv.data.MONGODB_URI,
    saltRounds: parsedEnv.data.SALT_ROUNDS,
    accessTokenSecret: parsedEnv.data.ACCESS_TOKEN_SECRET,
    accessTokenExpiry: parsedEnv.data.ACCESS_TOKEN_EXPIRY,
    smtpHost: parsedEnv.data.SMTP_HOST,
    smtpPort: parsedEnv.data.SMTP_PORT,
    smtpUser: parsedEnv.data.SMTP_USER,
    smtpPass: parsedEnv.data.SMTP_PASS,
    emailFrom: parsedEnv.data.EMAIL_FROM,
    geminiApiKey: parsedEnv.data.GEMINI_API_KEY || stripQuotes(process.env.GEMINI_API_KEY) || '',
    geminiModel: parsedEnv.data.GEMINI_MODEL || stripQuotes(process.env.GEMINI_MODEL) || 'gemini-2.5-flash',
    pythonApiUrl: parsedEnv.data.PYTHON_API_URL || stripQuotes(process.env.PYTHON_API_URL) || 'http://127.0.0.1:8000',
} as const

export default config
