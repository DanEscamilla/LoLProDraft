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
var currentChampion = "null";
var timerBlue, timerRed,intervalId,currentTimer;
var countDownTimer = 30;
var draftBegun = false;
var paused = false;
var socket;
var room;

var getLocation = function(href) {
    var l = document.createElement("a");
    l.href = href;
    return l;
};

jQuery(function($){

	room = window.location.href.match("(name=)(.*)")[2];
	socket  = io.connect();

	socket.emit('join',room);

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
	socket.emit('lock in',room);
}
function serverlessLI(){
	if (champSelected){
		lockInBan();
		nextTurn();
		champSelected=false;
		usedChamps.push(currentChampion);
		invalidateChampionThumbnail(currentChampion);
	}
	if (turn >= 20){
		$("#lock-in").css("display","none");	
		stopInterval();	
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
		currentEle.text("");
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
function serverlessSD(){
	if (draftBegun == false){
		draftBegun = true;
		$("#lock-in").css("display","block");
		nextTurn();
		timerInit();
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
function resumeInterval(){

}
function stopInterval(){
	clearInterval(intervalId);
	currentTimer.text("");
}
function startInterval(){
	currentTimer.text("30");
	intervalId = setInterval(function() {
		if (paused == false){
		    countDownTimer--;
		    currentTimer.text(countDownTimer);
		}
	}, 1000);
}
function timerInit(){
	timerBlue = $("#timer-blue");
	timerRed = $("#timer-red");
	currentTimer = timerBlue;
}
	
var fired = false;

window.onkeydown = function(e) { 
    if(event.keyCode == 32 && fired==false) {
        lockIn();
        fired = true;

    }
    return !(e.keyCode == 32);

};

window.onkeyup = function(e) { 
    if(event.keyCode == 32) {
        fired = false;
    }
    return !(e.keyCode == 32);
};

window.onbeforeunload = function (event) {
    socket.emit('leave room',room);
};