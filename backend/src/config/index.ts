import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
    PORT: z
        .string()
        .regex(/^\d+$/, {
            error: 'Only numbers are allowed !',
        })
        .default('3030')
        .transform((val: string) => parseInt(val, 10))
        .refine((val: number) => val > 0 && val <= 65535, {
            error: 'Port number must be in range (0, 65535]',
        }),

    MONGODB_URI: z
        .string()
        .trim()
        .min(1, {
            error: 'MONGODB_URI cannot be empty !',
        })
        .refine((val) => val.startsWith('mongodb://') || val.startsWith('mongodb+srv://'), {
            error: 'MONGODB_URI must start with mongodb:// or mongodb+srv://',
        }),

    SALT_ROUNDS: z
        .string()
        .regex(/^\d+$/, {
            error: 'Only numbers are allowed !',
        })
        .default('10')
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
        .trim()
        .min(1, {
            error: 'ACCESS_TOKEN_SECRET cannot be empty !',
        }),

    ACCESS_TOKEN_EXPIRY: z
        .string()
        .trim()
        .regex(/^\d+[smhd]$/, {
            error: 'ACCESS_TOKEN_EXPIRY must be in format like 15m, 2h, 1d, 30s',
        })
        .default('1d'),

    SMTP_HOST: z.string().optional().default('smtp.gmail.com'),
    SMTP_PORT: z
        .string()
        .optional()
        .default('465')
        .transform((val) => parseInt(val, 10)),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    EMAIL_FROM: z.string().optional().default('VARKA <no-reply@varka.ai>'),
    GEMINI_API_KEY: z.string().optional(),
    GEMINI_MODEL: z.string().optional().default('gemini-2.5-flash'),
    PYTHON_API_URL: z.string().optional().default('http://127.0.0.1:8000'),
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
    geminiApiKey: parsedEnv.data.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '',
    geminiModel: parsedEnv.data.GEMINI_MODEL || process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    pythonApiUrl: parsedEnv.data.PYTHON_API_URL || process.env.PYTHON_API_URL || 'http://127.0.0.1:8000',
} as const

export default config