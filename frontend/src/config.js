
const defaultConfig = {
  maintenance: !!process.env.VUE_APP_MAINTENANCE,
};

const devConfig = {
  server: {
    host: 'localhost',
    port: 8888,
  },
};

const prodConfig = {};

const prodMode = process.env.NODE_ENV === 'production';

const config = Object.assign(
  {},
  defaultConfig,
  prodMode ? prodConfig : devConfig,
);

export default config;
