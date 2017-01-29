var dir = "/thumbnails/";
var fileextension = ".png";
$.ajax({
    //This will retrieve the contents of the folder if the folder is configured as 'browsable'
    url: dir,
    success: function (data) {
        //List all .png file names in the page
        $(data).find("a:contains(" + fileextension + ")").each(function () {
            var filename = this.href.replace(window.location.host, "").replace("http://", "");
            var champname = filename.match("(\/thumbnails\/)(.*)(?=_S)")[2];
            $("#"+champname).click(function(){
                champSelect(champname);
            });
        });

    }

});




window.onload = function(){
    $("#container").removeClass("hidden");
    $("#lock-in").click(function(){
        lockIn();
    });
    $("#start-draft").click(function(){
        startDraft();
    });
    $("#pause-draft").click(function(){
        pauseInterval();
    });
    $("#close-draft").click(function(){
        closeDraft();
    });
    socket.emit('join',room);

};
