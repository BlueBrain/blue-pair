
const defaultConfig = {};

const devConfig = {
  server: {
    host: 'localhost',
    port: 8888,
  },
};

const prodConfig = {
  server: {
    host: process.env.SERVER_HOST,
    port: process.env.SERVER_PORT,
  },
};

const prodMode = process.env.NODE_ENV === 'production';

const config = Object.assign(
  {},
  defaultConfig,
  prodMode ? prodConfig : devConfig,
);

export default config;
