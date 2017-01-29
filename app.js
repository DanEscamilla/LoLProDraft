
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

app.get('/GGGGpass',function(req,res){
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
	});

	socket.on('join',function(room){
		socket.join(room);
	});
	socket.on('leave room',function(room){
		var roomToRemove = checkRoom(room);
		if (roomToRemove){
			removeRoom(roomToRemove);
		}
		socket.leave(room);
	});
	socket.on('start draft',function(data){
		io.sockets.in(data).emit('start draft',data);
	});
	socket.on('select champ',function(data){
		io.sockets.in(data.r).emit('select champ',data.champ);
	});
	socket.on('pause draft',function(data){
		io.sockets.in(data).emit('pause draft',data);
	});
	socket.on('lock in',function(data){
		io.sockets.in(data).emit('lock in',data);
	});
});

setInterval(function(){
	var newValidRooms = []
  	for (var i=0;i<validRooms.length;i++){
  		if(io.nsps['/'].adapter.rooms[validRooms[i]]){
  			newValidRooms.push(validRooms[i]);
  		}
  	}
  	validRooms = newValidRooms;
}, 60*60 * 1000);   

function checkRoom(roomName){
	if(io.nsps['/'].adapter.rooms[roomName].length<=1){
   		return roomName;
	}
	return null;
}
function removeRoom(roomName){
	var index = validRooms.indexOf(roomName);
	validRooms.splice(index,1);
}