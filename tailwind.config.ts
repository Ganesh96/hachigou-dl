import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        kaijuu: {
          bg: "#05070A",
          panel: "#0D1117",
          elevated: "#111A22",
          border: "#22313A",
          text: "#EAF7F4",
          muted: "#8FA7A3",
          cyan: "#18F0C8",
          green: "#7CFF6B",
          magenta: "#FF3D81",
          amber: "#FFB547"
        }
      }
    }
  },
  plugins: []
};

export default config;