/** @type {import('ts-jest').JestConfigWithTsJest} */
export const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    "(\..*)\.js": "$1"
  }
};

export default config;