const env = process.env.NODE_ENV;

export default {
  isDevelopment() {
    return !env || env === 'development';
  },
  isProduction() {
    return env === 'production';
  }
}
