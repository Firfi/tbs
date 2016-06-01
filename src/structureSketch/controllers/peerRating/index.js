// import Router, goToRoute from router.js
// import aspectToRate, rates, items from ./entities

// class Rate extends Route {
//   onEnter: send items.pop() to user with rate kb; aspectToRate.current(0)
//   handlers: {'rate kb input': rates.add(rate); aspectToRate.current(+1); if last then message(rates.getCurrent()) and goToRoute(../) }
//   onExit: aspectToRate.current(NONE)
// }

// class Create extends Route {
//   onEnter: message('send your item')
//   handlers: {'any text message except starting from /': items.add(item); message('done'); goToRoute(../)}
// }

// export class PR extends Route {
//   onEnter: message('hey! /rate or /create')
//   handlers: {'/rate': goToRoute('rate'),
//              '/create': goToRoute('create')
//          }
//   constructor: children = {create: new Create(), rate: new Rate()}
// }
