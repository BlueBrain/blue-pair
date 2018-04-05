
const defaultConfig = {};

const devConfig = {
  server: {
    host: 'localhost',
    port: 8888,
  },
};

const prodConfig = {
  server: {
    host: process.env.VUE_APP_SERVER_HOST,
    port: process.env.VUE_APP_SERVER_PORT,
  },
};

const prodMode = process.env.NODE_ENV === 'production';

const config = Object.assign(
  {},
  defaultConfig,
  prodMode ? prodConfig : devConfig,
);

export default config;
