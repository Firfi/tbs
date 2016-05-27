var machina = require('machina');

var rateBot = new machina.BehavioralFsm( {

  initialize: function( options ) {
    console.warn('init bot?')
  },

  namespace: "rateBot",

  initialState: "start",



  states: {
    uninitialized: {
      '*': function() {

      }
    },
    start: {
      _onEnter: function( client ) {
        console.warn('set KB to start kb');
        //client.timer = setTimeout( function() {
        //  this.handle(  client, "timeout" );
        //}.bind( this ), 30000 );
        //this.emit( "vehicles", { client: client, status: GREEN } );
      },
      '/rate': function( client ) {
        console.warn('rate message and send this thing to rate');
        this.transition( client, "rate" );
      },
      '/create': function( client ) {
        console.warn('send message "create your item"');
        this.transition( client, "create" );
      }
    },
    rate: {
      rated: function( client, i ) {
        console.warn('aspect rated: ', i);
        if (i === 3) {
          console.warn('all item aspects rated');
          this.transition( client, 'start' );
        }
      }
    },
    create: {
      message: function( client, item ) {
        if (item) {
          console.warn('item created: ', item);
          this.transition( client, 'start' );
        } else {
          console.warn('unknown item !')
        }
      }
    }
  },

  goToRate: function(client) {
    this.handle( client, "/rate" );
  },

  rateItem: function(client, i) {
    this.handle( client, 'rated', i );
  },

  goToCreate: function(client) {
    this.handle( client, '/create' );
  },

  message: function(client, item) {
    this.handle(client, 'message', item);
  }


} );

var client = {someClientField: 'some field'};

rateBot.goToRate( client );
rateBot.rateItem( client, 1 );
rateBot.rateItem( client, 2 );
rateBot.rateItem( client, 3 );

rateBot.goToCreate( client );
rateBot.message( client ); // empty
rateBot.message( client, 'some' ); // ok

console.warn(JSON.stringify(client.__machina__, null, 4));


// here is output
//var output1 = {
//  "rateBot": {
//    "inputQueue": [],
//    "targetReplayState": "start",
//    "state": "start",
//    "priorState": "create",
//    "priorAction": "create.message",
//    "currentAction": "",
//    "currentActionArgs": [
//      {
//        "inputType": "message",
//        "delegated": false
//      },
//      "some"
//    ],
//    "inExitHandler": false
//  }
//}


var rateBot2 = new machina.BehavioralFsm( {

  initialize: function( options ) {
    console.warn('init bot?')
  },

  namespace: "rateBot2",

  initialState: "start",



  states: {
    uninitialized: {
      '*': function() {

      }
    },
    start: {
      _onEnter: function( client ) {
        console.warn('set KB to start kb');
        //client.timer = setTimeout( function() {
        //  this.handle(  client, "timeout" );
        //}.bind( this ), 30000 );
        //this.emit( "vehicles", { client: client, status: GREEN } );
      },
      '/rate': function( client ) {
        console.warn('rate message and send this thing to rate');
        this.transition( client, "rate" );
      },
      '/create': function( client ) {
        console.warn('send message "create your item"');
        this.transition( client, "create" );
      }
    },
    rate: {
      _onEnter: function(client) {
        console.warn('rate on enter')
      },
      _child: new machina.BehavioralFsm({
        namespace: 'rateInnerBot',
        initialState: 'rated0',
        states: {
          rated0: {
            rated: function( client ) {
              console.warn('aspect rated: 1');
              this.transition( client, "rated1" );
            }
          },
          rated1: {
            rated: function( client ) {
              console.warn('aspect rated: 2');
              this.transition( client, "rated2" );
            }
          },
          rated2: {
            rated: function( client ) {
              console.warn('aspect rated: 3');
              this.handle( client, 'done' );
              this.transition(client, 'rated0');
            }
          }
        }
      }),
      done: function(client) { // or just 'start'
        console.warn('all item aspects rated');
        this.transition( client, 'start' );
      }
    },
    create: {
      message: function( client, item ) {
        if (item) {
          console.warn('item created: ', item);
          this.transition( client, 'start' );
        } else {
          console.warn('unknown item !')
        }
      }
    }
  },

  goToRate: function(client) {
    this.handle( client, "/rate" );
  },

  rateItem: function(client, i) {
    this.handle( client, 'rated');
  },

  goToCreate: function(client) {
    this.handle( client, '/create' );
  },

  message: function(client, item) {
    this.handle(client, 'message', item);
  }


} );

console.warn('-------------');

var client2 = {someClientField: 'client2 some field'};

rateBot2.goToRate( client2 );
rateBot2.rateItem( client2 );
rateBot2.rateItem( client2 );
rateBot2.rateItem( client2 );

rateBot2.goToCreate( client2 );
rateBot2.message( client2 ); // empty
rateBot2.message( client2, 'some' ); // ok

console.warn(JSON.stringify(client2.__machina__, null, 4));

//var output2 = {
//  "rateBot2": {
//    "inputQueue": [],
//    "targetReplayState": "start",
//    "state": "start",
//    "priorState": "create",
//    "priorAction": "create.message",
//    "currentAction": "",
//    "currentActionArgs": [
//      {
//        "inputType": "message",
//        "delegated": false
//      },
//      "some"
//    ],
//    "inExitHandler": false
//  },
//  "rateInnerBot": {
//    "inputQueue": [],
//    "targetReplayState": "rated0",
//    "state": "rated0",
//    "priorState": "rated2",
//    "priorAction": "",
//    "currentAction": "",
//    "currentActionArgs": [
//      {
//        "inputType": "done",
//        "delegated": false,
//        "bubbling": true
//      }
//    ],
//    "inExitHandler": false
//  }
//};
