/** @type {import("tailwindcss").Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/styles/**/*.{js,ts,jsx,tsx,css}",
  ],
  theme: {
    extend: {
      colors: {
        gold: "rgba(207, 181, 59, 100)",
        lightGold: "rgb(222,204,120)",
        lightBlack: "rgba(32,33,36, 100)",
      },

      boxShadow: {
        md: "0px 0px 15px 1px rgba(240, 240, 240, 0)",
      },
    },
    fontFamily: {
      heading: ["Courgette", "cursive"],
    },
    // backgroundImage: {
    //   map: "url('../../public/map-background.png')",
    // },
  },
};
