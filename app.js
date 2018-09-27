
var express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server);
var url = require('url');
var shortid = require('shortid');
var validRooms = [];
var gameStates = [];

app.use('/', express.static(__dirname + '/public'));

var directory = require('serve-index');
app.use('/thumbnails',directory(__dirname + '/public/thumbnails'));
app.use('/centered',directory(__dirname + '/public/centered'));

app.get('/',function(req,res){
	res.sendFile(__dirname+'/home.html');
});

app.get('/',function(req,res){
	res.sendFile(__dirname+'/test.html');
});

app.get('/room',function(req,res,next){
	var queryData = url.parse(req.url, true).query;
	if (validRooms.indexOf(queryData.name)!=-1){
		res.sendFile(__dirname+'/index.html');
	}
});

server.listen(process.env.PORT || 3000);

io.sockets.on('connection',function(socket){

	socket.on('create room',function(data){
		var newroom = shortid.generate();
		validRooms.push(newroom);
		socket.emit('change url',"/room/?name="+newroom);
		initGameState(newroom);
	});

	socket.on('close draft',function(room){
		if (validRooms.indexOf(room)==-1){
			return;
		}
		io.sockets.in(room).emit('closed room',room);
		for (var socketId in io.nsps['/'].adapter.rooms[room].sockets) {
			var socket = io.sockets.connected[socketId];
		    socket.leave(room);
		}
	});

	socket.on('join',function(room){
		if (validRooms.indexOf(room)==-1){
			return;
		}
		socket.join(room);
		socket.emit('update state',gameStates[room]);
		updateCount(room,socket);
	});
	socket.on('leave room',function(room){
		if (validRooms.indexOf(room)==-1){
			return;
		}
		var roomToRemove = checkRoom(room);
		if (roomToRemove){
			console.log(roomToRemove);
			removeRoom(roomToRemove);
		}
		socket.leave(room);
		updateCount(room,socket);
	});
	socket.on('start draft',function(room){
		if (validRooms.indexOf(room)==-1){
			return;
		}
		gameStates[room].begun = true;
		gameStates[room].paused = false;
		io.sockets.in(room).emit('start draft',"");
	});
	socket.on('select champ',function(data){
		if (validRooms.indexOf(data.r)==-1){
			return;
		}
		gameStates[data.r].current = data.champ;
		io.sockets.in(data.r).emit('select champ',data.champ);
	});
	socket.on('pause draft',function(room){
		if (validRooms.indexOf(room)==-1){
			return;
		}
		gameStates[room].paused = true;
		io.sockets.in(room).emit('pause draft',room);
	});
	socket.on('lock in',function(data){
		if (validRooms.indexOf(data.r)==-1){
			return;
		}
		gameStates[data.r].lockedin.push(data.champ);
		gameStates[data.r].current = "";
		gameStates[data.r].counter = 30;
		io.sockets.in(data.r).emit('lock in',data.champ);
	});
	socket.on('restart draft',function(room){
		if (validRooms.indexOf(room)==-1){
			return;
		}
		initGameState(room);
		io.sockets.in(room).emit('restart draft',room);
	});
});

function initGameState(room){
	gameStates[room] = {lockedin:[],current:"",paused:true,counter:30,begun:false};

}
setInterval(function(){
	for (var key in gameStates){
		if (gameStates[key].paused == false){
	    	gameStates[key].counter--;
	    	io.sockets.in(key).emit('count down',gameStates[key].counter);
		}
		// if (gameStates[key].begun ){
		// 	gameStates[key].begun = true;
		// 	gameStates[key].paused = false;
		// 	io.sockets.in(key).emit('start draft',"");
		// }
	}

}, 1000);

function updateCount(room){
	var users;
	if (io.nsps['/'].adapter.rooms[room]){
		users = io.nsps['/'].adapter.rooms[room].length;
	} else {
		users = 1;
	}
	io.sockets.in(room).emit('user joined',users);
}
// setInterval(function(){
// 	var newValidRooms = []
//   	for (var i=0;i<validRooms.length;i++){
//   		if(io.nsps['/'].adapter.rooms[validRooms[i]]){
//   			newValidRooms.push(validRooms[i]);
//   		}
//   	}
//   	validRooms = newValidRooms;
// }, 60 * 1000);

function checkRoom(roomName){
	if(io.nsps['/'].adapter.rooms[roomName]){
		if(io.nsps['/'].adapter.rooms[roomName].length<=1){
	   		return roomName;
		} else {
			return null;
		}
	} else {
		return roomName;
	}
}
function removeRoom(roomName){
	delete gameStates[roomName];
	var index = validRooms.indexOf(roomName);
	if (index != -1){
		validRooms.splice(index,1);
	}
}
