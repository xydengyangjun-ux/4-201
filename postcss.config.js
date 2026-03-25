export default {
  plugins: {
    '@tailwindcss/postcss': {},
    'postcss-preset-env': {
      stage: 0,
      features: {
        'color-functional-notation': true,
        'oklab-query': true,
        'custom-properties': true,
      },
    },
    'autoprefixer': {},
  },
};
