export function isCommand(str) {
  return typeof str === 'string' && str.charAt(0) === '/';  
}
