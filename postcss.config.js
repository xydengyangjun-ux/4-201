export default {
  plugins: {
    '@tailwindcss/postcss': {},
    'postcss-preset-env': {
      stage: 2,
      features: {
        'color-functional-notation': true,
        'oklab-query': true,
      },
    },
    'autoprefixer': {},
  },
};
