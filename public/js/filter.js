
$(document).ready(function () {
	console.log("test");
	$("#filter").keyup(function(){

		var toFilter = $(this).val();

		$('#championsInner').children('.champion').each(function(){
		if ($(this).attr('id').search(new RegExp(toFilter,"i"))<0){
			$(this).css("display","none");
		} else {
			$(this).css("display","block");
		}
	});
	})
});
