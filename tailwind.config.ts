import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Identité Posélien (reprise de la maquette)
        teal: "#0B3D3A",
        teal2: "#12544F",
        tealBg: "#E8F1EF",
        orange: "#F26419",
        orangeBg: "#FDECE2",
        appbg: "#F4F7F5",
        card: "#FFFFFF",
        ink: "#14201E",
        muted: "#5B6B67",
        line: "#E4EAE7",
        greenBg: "#E7F4EC",
        green: "#1B8A4B",
        amberBg: "#FBF1DE",
        amber: "#9A6B12",
        redBg: "#FBE9E7",
        red: "#C0392B",
        mist: "#9FC4BF",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
