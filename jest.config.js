export default {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  roots: ["<rootDir>/client/src", "<rootDir>/server/src", "<rootDir>/cms/src", "<rootDir>/shared"],
  passWithNoTests: true,
};
