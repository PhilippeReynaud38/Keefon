/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],

  theme: {
    extend: {
      colors: {
        // ---------- UI Vivaya ----------
        primary: '#f55057',
        secondary: '#ffcf00',
        accent: '#22d3ee',
        neutral: '#64748b',
        surface: '#ffffff',
        'surface-muted': '#f9fafb',

        // ---------- Couleurs du chat ----------
        chatBgFrom: '#b2ebf2',
        chatBgTo: '#80deea',
        chatOuter: '#00bcd4',
        bubbleLeft: '#FFF6C5',
        bubbleRight: '#C1F9D0',
        menuBtn: '#FFD200',
        bubbleSent: '#c6f6d5',
        bubbleReceived: '#fef9c3',

        // ---------- Couleurs test-colors.tsx ----------
        paleYellow: '#FEFF93',
        flashyYellow: '#FBF700',
        veryPaleYellow: '#FDFF34',
        flashyOrange: '#FFB80D',
        orangeVivaya: '#FFA500',
        yellowGreen: '#E4FF02',
        paleGreen: '#59FF72',
        tenderGreen: '#2CFF4B',
        flashyGreen: '#00FF25',
        palePink: '#FFC7EE',
      },

      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui'],
      },

      backgroundImage: {
        flow: `linear-gradient(
          180deg,
          #d1fff0 0%,
          #b9f7e8 25%,
          #a9f0e4 50%,
          #97eae0 75%,
          #a3ede2 100%
        )`,
        'chat-mobile': `linear-gradient(
          180deg,
          var(--tw-gradient-from, #93F7FF) 0%,
          #7fe9fc 50%,
          var(--tw-gradient-to, #58E0FF) 100%
        )`,
      },

      boxShadow: {
        card: '0 10px 40px -10px rgba(0,0,0,.15)',
      },
    },
  },

  plugins: [
    function ({ matchUtilities, theme }) {
      matchUtilities(
        {
          'bg-var': val => ({ backgroundColor: `var(--${val})` }),
          'text-var': val => ({ color: `var(--${val})` }),
        },
        { values: theme('colors') }
      );
    },
  ],
};
