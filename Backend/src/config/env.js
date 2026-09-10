import { config } from "dotenv";

const envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env.development";

export default config({ path: envFile });