import type { Config } from "jest"

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.test.ts"],
  transform: {
    "^.+\.ts$": ["ts-jest", { tsconfig: "tsconfig.test.json" }]
  },
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.ts"
  ]
}

export default config
