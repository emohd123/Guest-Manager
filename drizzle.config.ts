import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

export default defineConfig({
  out: "./drizzle",
  schema: "./src/server/db/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgresql://postgres:yAKSR32MoeZ6dgZC@[2406:da18:243:7423:87a6:df5f:bd5c:b49e]:5432/postgres",
  },
});
