import { defineConfig } from "vitest/config"
import { join } from "path"

export default defineConfig(
    {
        test: {
            setupFiles: [join(__dirname, "../../", "shared", "test-setup.ts")],
            environment: "jsdom"
        }
    }
)