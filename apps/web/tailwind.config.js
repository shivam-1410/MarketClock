/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        graphite: {
          950: "#0B0D10", // root background
          900: "#12151A", // card layer
          850: "#171A21", // elevated card
          800: "#1C2028", // borders & active containers
          700: "#2B313D",
          500: "#8A8F9B", // muted labels
          100: "#E8E9EC", // primary foreground
        },
        state: {
          open: "#E8B34A",       // Amber / Gold (OPEN)
          preclose: "#E0793C",   // Vibrant Orange (PRE_CLOSE)
          closed: "#3A5CE0",     // Deep Royal Blue (CLOSED)
          cooldown: "#2FBF9E",   // Teal (PRE_OPEN & COOL_DOWN)
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "IBM Plex Mono", "Menlo", "Courier New", "monospace"],
      },
      boxShadow: {
        "glow-open": "0 0 45px -5px rgba(232, 179, 74, 0.35)",
        "glow-preclose": "0 0 45px -5px rgba(224, 121, 60, 0.4)",
        "glow-closed": "0 0 45px -5px rgba(58, 92, 224, 0.35)",
        "glow-cooldown": "0 0 45px -5px rgba(47, 191, 158, 0.4)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};
