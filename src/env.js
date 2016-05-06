const env = process.env.NODE_ENV;

export default {
  isDevelpment() {
    return !env || env === 'development';
  },
  isProduction() {
    return env === 'production';
  }
}
