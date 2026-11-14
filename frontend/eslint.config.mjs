import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...nextVitals,
  {
    // Admin screens preview arbitrary uploaded images, so plain <img> is intentional there.
    files: ["src/app/(admin)/**/*.tsx", "src/components/admin/**/*.tsx"],
    rules: { "@next/next/no-img-element": "off" },
  },
];
export default config;
