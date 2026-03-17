import type { Config } from "jest";

const shared = {
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transformIgnorePatterns: [
    "node_modules/(?!(@prisma)/)",
  ],
};

const config: Config = {
  projects: [
    {
      ...shared,
      displayName: "backend",
      preset: "ts-jest/presets/default-esm",
      testEnvironment: "node",
      extensionsToTreatAsEsm: [".ts"],
      setupFiles: ["<rootDir>/src/__tests__/setup.ts"],
      testMatch: ["**/__tests__/**/*.test.ts"],
      transform: {
        "^.+\\.tsx?$": [
          "ts-jest",
          {
            useESM: true,
            tsconfig: "tsconfig.json",
          },
        ],
      },
    },
    {
      ...shared,
      displayName: "frontend",
      testEnvironment: "jsdom",
      testMatch: ["**/__tests__/**/*.test.tsx"],
      setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup-dom.ts"],
      transform: {
        "^.+\\.tsx?$": [
          "ts-jest",
          {
            tsconfig: "tsconfig.json",
          },
        ],
      },
    },
  ],
};

export default config;
