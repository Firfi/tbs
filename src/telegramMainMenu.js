
import Route, { routes } from './subbots/router.js';


export default class MainMenu {
  constructor() {
    const telegram = new Route('root', this, true);
    telegram.hears('/menu', function * () {
      const routeCommands = Object.keys(routes).map(r => `/route ${r}`);
      this.reply(`available routes: \n${routeCommands.join('\n')}`);
    });
  }
}
