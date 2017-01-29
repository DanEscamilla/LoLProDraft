var pickBanOrder = ["ban","ban","ban","ban","ban","ban",
				"pick","pick","pick","pick","pick","pick",
				"ban","ban","ban","ban",
				"pick","pick","pick","pick"];

var teamOrder = ["blue","red","blue","red","blue","red",
				"blue","red","red","blue","blue","red",
				"red","blue","red","blue",
				"red","blue","blue","red"];
var itemOrder = [1,1,2,2,3,3,1,1,2,2,3,3,4,4,5,5,4,4,5,5];
var usedChamps = [];
var imageFile
var turn = -1; 
var champSelected = false;
var currentChampion = "";
var timerBlue, timerRed,intervalId,currentTimer;
var countDownTimer = 30;
var draftBegun = false;
var paused = false;
var socket;
var room;
var updatingState = false;
var draftDone=false;

var lockSound = new Audio('/sounds/lockinchampion.mp3');
var doneSound = new Audio('/sounds/exitchampionselect.mp3');
var selectSound = new Audio('/sounds/air_button_press_1.mp3');
var timerSound = new Audio('/sounds/countdown10seconds.mp3');
var beginSound = new Audio('/sounds/yourturn.mp3');

var getLocation = function(href) {
    var l = document.createElement("a");
    l.href = href;
    return l;
};

jQuery(function($){
	timerInit();
	console.log(window.location);
	room = window.location.href.match("(name=)(.*)")[2];
	socket  = io.connect();

	socket.on('update state',function(data){
		updateState(data);
	});
	socket.on('select champ',function(data){
		serverlessCS(data);
	});

	socket.on('lock in',function(data){
		serverlessLI();
	});

	socket.on('start draft',function(data){
		serverlessSD();
	});

	socket.on('pause draft',function(data){
		serverlessPI();
	});
	socket.on('closed room',function(data){
		window.location = "http://"+window.location.host+"/";
	});
	socket.on('user joined',function(users){
		console.log("joined, users:"+users);
		$("#user-count").text("Users:"+users);	
	});
	socket.on('restart draft',function(users){
		restart();
	});
	socket.on('count down',function(time){
		if (!draftDone && draftBegun){
			countDownTimer = time;
			currentTimer.text(time);
		}
	});
});

function champSelect(champName){
	if (validateChampionSelected(champName)==false){
		return;
	}
	socket.emit('select champ',{r:room,champ:champName});
}
function serverlessCS(champName){
	switch(pickBanOrder[turn]){
		case "pick":
			selectPick(champName);
			break;
		case "ban":
			selectBan(champName);
			break;
		default:
			return;
	}
	currentChampion = champName;
	champSelected = true;
	playFile(selectSound);
}
function selectPick(champName){
	$("#"+teamOrder[turn]+"-pick-"+itemOrder[turn]).css("background-image","url(/centered/" +champName+ "_Splash_Centered_0.jpg)");
}
function selectBan(champName){
	$("#"+teamOrder[turn]+"-ban-"+itemOrder[turn]).css("background-image","url(/thumbnails/" +champName+ "_Square_0.png)");
}
function lockInBan(){
	if (pickBanOrder[turn] == "ban")
		$("#"+teamOrder[turn]+"-ban-"+itemOrder[turn]).removeClass("blinker");
}
function lockIn(){
	if (turn>=0 && turn <20 && currentChampion!=""){
		socket.emit('lock in',{r:room,champ:currentChampion});
	}
}
function serverlessLI(){
	if (champSelected){
		playFile(lockSound);
		lockInBan();
		nextTurn();
		champSelected=false;
		usedChamps.push(currentChampion);
		invalidateChampionThumbnail(currentChampion);
		currentChampion = "";
	}
	if (turn >= 20){
		$("#lock-in").css("display","none");	
		playFile(doneSound);
		stopInterval();	
		draftDone = true;
	}
}
function timerChange(){
	currentTimer.text("");
	if (teamOrder[turn+1] == "red"){
		currentTimer = timerRed;
	} else {
		currentTimer = timerBlue;
	}
	stopInterval();
	startInterval();
	countDownTimer = 30;
}
function invalidateChampionThumbnail(champName){
	$("#"+champName).addClass("greyout");
}
function validateChampionSelected(champName){
	for (var i=0;i<usedChamps.length;i++){
		if (champName == usedChamps[i]){
			return false;
		}
	}
	return true;
}
function nextTurn(){
	changeTurn();
	changeText();
	turn++;
}
function changeTurn(){
	if (turn >= 0 && turn+1 < pickBanOrder.length){
		$("#container").removeClass(teamOrder[turn]+"-turn");
		$("#container").addClass(teamOrder[turn+1]+"-turn");
		timerChange();
	}
}
function changeText(){
	if (turn >= 0){
		var currentEle = $("#"+teamOrder[turn]+"-pick-"+itemOrder[turn]+" span");
		currentEle.text((pickBanOrder[turn]=="ban")?"":currentChampion);
		currentEle.removeClass("blinker");
	}
	if (turn < pickBanOrder.length){
		var nextEle = $("#"+teamOrder[turn+1]+"-pick-"+itemOrder[turn+1]+" span");
		nextEle.text(pickBanOrder[turn+1]+"ing...");
		nextEle.addClass("blinker");
	}
}
function startDraft(){
	socket.emit('start draft',room);
}
function closeDraft(){
	socket.emit('close draft',room);
}
function serverlessSD(){
	if (draftBegun == false){
		playFile(beginSound);
		draftBegun = true;
		$("#lock-in").css("display","block");
		nextTurn();
		startInterval();
	} else {
		paused = false;
	}
}
function pauseInterval(){
	socket.emit('pause draft',room);
}
function serverlessPI(){
	paused = true;	
}
function stopInterval(){
	// clearInterval(intervalId);
	currentTimer.text("");
}
function startInterval(){
	currentTimer.text("30");
	// intervalId = setInterval(function() {
// 		if (paused == false){
// 		    countDownTimer--;
// 		    currentTimer.text(countDownTimer);
// 		    if (countDownTimer<=10){
// 		    	playFile(timerSound);
// 		    }
// 		}
// 	}, 1000);
}
function countDown(){
	if (paused == false){
	    countDownTimer--;
	    currentTimer.text(countDownTimer);
	    if (countDownTimer<=10){
	    	playFile(timerSound);
	    }
	}
}
function timerInit(){
	timerBlue = $("#timer-blue");
	timerRed = $("#timer-red");
	currentTimer = timerBlue;
}
function restartDraft(){
	socket.emit('restart draft',room);
}
function restart(){
	for (var i=1;i<=5;i++){
		$("#red-pick-"+i).css("background-image","url(layout_graphics/pick-background-cropped-red.jpg)");
		$("#red-pick-"+i+" span").text("");
		$("#blue-pick-"+i).css("background-image","url(layout_graphics/pick-background-cropped.jpg)");
		$("#blue-pick-"+i+" span").text("");
		$("#red-ban-"+i).css("background-image","");
		$("#blue-ban-"+i).css("background-image","");
	}
	$("#container").removeClass("red-turn");
	$("#container").addClass("blue-turn");
	stopInterval();
	currentTimer.text("");
	$("#lock-in").css("display","none");
	draftBegun = false;
	turn = -1;
	for (var i=0;i<usedChamps.length;i++){
		$("#"+usedChamps[i]).removeClass("greyout");
	}
	usedChamps = [];
}
	
var fired = false;

window.onkeydown = function(e) { 
    if(event.keyCode == 32 && fired==false) {
        lockIn();
        fired = true;

    }
    return !(e.keyCode == 32);

};

function playFile(audioFile){
	if (updatingState == false){	
		audioFile.currentTime = 0;
		audioFile.play();
	}
}

window.onkeyup = function(e) { 
    if(event.keyCode == 32) {
        fired = false;
    }
    return !(e.keyCode == 32);
};

window.onbeforeunload = function (event) {
    socket.emit('leave room',room);
};
function updateState(data){
	if (data.lockedin.length==0){
		return;
	} 
	console.log(data);
	updatingState = true;
	turn = -1;
	serverlessSD();
	for (var i=0;i<data.lockedin.length;i++){
		serverlessCS(data.lockedin[i]);
		serverlessLI();
	}
	serverlessCS(data.current);
	countDownTimer = data.counter;
	updatingState = false;
}