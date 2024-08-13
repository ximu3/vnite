import { addDynamicIconSelectors } from '@iconify/tailwind'
import { styled } from '@mui/material'

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.jsx"],
  theme: {
    extend: {
      fontFamily: {
        // sans: ['LXGW WenKai', 'sans-serif'],
        // 23272E
      },
      colors: {
        'custom': {
          'main': '#22262D',
          'text': '#B8B9B9',
          'text-light': '#F4F5F7',
          'main-1': '#292D34',
          'main-2': '#24282F',
          'main-3': '#25272C',
          'main-4': '#171D25',
          'main-5': '#3D4450',
          'main-6': '#171D25',
          'main-7': '#2A2D34',
          'blue': '#67C1F5',
          'green': '#1EB44B',
          'blue-1': '#3E4E69',
          'blue-2': '#38709A',
          'blue-3': '#1B2838',
          'blue-4': '#2995D8',
          'blue-5': '#243D50',
          'blue-6': '#1A9FFF',
          'blue1': '#1A9FFF',
          'red': '#E22A27',
          'hover': '#3D4450',
        },
        'chestnut': {
          '50': '#fdf4f3',
          '100': '#faece9',
          '200': '#f6d8d5',
          '300': '#eeb8b3',
          '400': '#e39089',
          '500': '#d5635e',
          '600': '#c14343',
          '700': '#a03032',
          '800': '#872a30',
          '900': '#74272e',
          '950': '#401114',
        },
        'athens-gray': {
          '50': '#f5f7f9',
          '100': '#eceff4',
          '200': '#d6dde7',
          '300': '#b9c5d7',
          '400': '#97a9c3',
          '500': '#7e8fb3',
          '600': '#6c7ba4',
          '700': '#606b95',
          '800': '#525a7b',
          '900': '#454b63',
          '950': '#2d303e',
        },
        'bule-white': {
          '50': '#EEF3FD'
        },
        'white3': {
          '0': '#FCFEFF',
          '50': '#F8FBFF'
        }


      },
      width: {
        '1/20': '5%',
        '1/30': '3.333333%',
        '1/40': '2.5%',
        '1/16': '6.25%',
        '54': '13.5rem',
        "100": "25rem",
        "170": "42.5rem",
        "270": "67.5rem",

      },
      boxShadow: {
        'inner-sm': 'inset 0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'inner-md': 'inset 0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        'inner-lg': 'inset 0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        'inner-xl': 'inset 0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        'inner-2xl': 'inset 0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      },
      spacing: {
        "58": "14.5rem",
        "59": "14.75rem",
        "65": "16.25rem",
        "67": "16.75rem",
        "77": "19.25rem",
        "82": "20.5rem",
        "84": "21rem",
        "86": "21.5rem",
        "88": "22rem",
        "90": "22.5rem",
        "92": "23rem",
        "94": "23.5rem",
        "96": "24rem",
        "98": "24.5rem",
        "100": "25rem",
        "102": "25.5rem",
        "104": "26rem",
        "106": "26.5rem",
        "108": "27rem",
        "110": "27.5rem",
        "112": "28rem",
        "114": "28.5rem",
        "116": "29rem",
        "118": "29.5rem",
        "120": "30rem",
        "140": "35rem",
        "160": "40rem",
        "165": "41.25rem",
        "170": "42.5rem",
      },
      height: {
        '1/10': '10%',
        '1/9': '11.111111%',
        '1/8': '12.5%',
        '1/7': '14.285714%',
        '120': '30rem',
      },
      borderWidth: {
        '0.5': '0.5px',
        '1': '1px',
        '3': '3px',
      },
      gridTemplateRows: {
        '15': 'repeat(15, minmax(0, 1fr))',
        '16': 'repeat(16, minmax(0, 1fr))',
        '17': 'repeat(17, minmax(0, 1fr))',
        '23': 'repeat(23, minmax(0, 1fr))',
        '25': 'repeat(25, minmax(0, 1fr))',
        '26': 'repeat(26, minmax(0, 1fr))',
      },
      gridTemplateColumns: {
        '15': 'repeat(15, minmax(0, 1fr))',
        '17': 'repeat(17, minmax(0, 1fr))',
        '13': 'repeat(13, minmax(0, 1fr))',
        '23': 'repeat(23, minmax(0, 1fr))',
        '26': 'repeat(26, minmax(0, 1fr))',
      },
      gridColumnStart: {
        '13': '13',
        '14': '14',
        '15': '15',
        '16': '16',
        '17': '17',
        '18': '18',
        '19': '19',
        '20': '20',
        '21': '21',
        '22': '22',
        '23': '23',
        '24': '24',
        '25': '25',
        '26': '26',
        '27': '27',
      },
      gridColumnEnd: {
        '13': '13',
        '14': '14',
        '15': '15',
        '16': '16',
        '17': '17',
        '18': '18',
        '19': '19',
        '20': '20',
        '21': '21',
        '22': '22',
        '23': '23',
        '24': '24',
        '25': '25',
        '26': '26',
        '27': '27',
        '28': '28',
      },
      gridRow: {
        'span-16': 'span 16 / span 16',
        'span-17': 'span 17 / span 17',
        'span-18': 'span 18 / span 18',
        'span-19': 'span 19 / span 19',
        'span-20': 'span 20 / span 20',
        'span-21': 'span 21 / span 21',
        'span-22': 'span 22 / span 22',
        'span-23': 'span 23 / span 23',
        'span-24': 'span 24 / span 24',
        'span-25': 'span 25 / span 25',
      }
    }
  },
  plugins: [
    require('daisyui'),
    require('tailwind-scrollbar')({ nocompatible: true, preferredStrategy: 'pseudoelements' }),
    addDynamicIconSelectors(),
  ],
  daisyui: {
    // themes: ["light", "dark"],
    // styled: false,
    themes: [
      {
        light: {
          ...require("daisyui/src/theming/themes")["dark"],
          "--rounded-box": "0rem", // border radius rounded-box utility class, used in card and other large boxes
          "--rounded-btn": "0rem", // border radius rounded-btn utility class, used in buttons and similar element
          "--rounded-badge": "0rem", // border radius rounded-badge utility class, used in badges and similar
          "--animation-btn": "0.25s", // duration of animation when you click on button
          "--animation-input": "0.2s", // duration of animation for inputs like checkbox, toggle, radio, etc
          "--btn-focus-scale": "0.95", // scale transform of button when you focus on it
          "--border-btn": "1px", // border width of buttons
          "--tab-border": "1px", // border width of tabs
          "--tab-radius": "0rem", // border radius of tabs
        },
      }, "dark"
    ],
  },
  important: true,
}
