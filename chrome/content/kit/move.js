(function(){
	var startPos = null;
	function mouseDown(event) {
	  startPos = [event.clientX, event.clientY];
	}
	
	function mouseMove(event) {
	  if (startPos) {
		var newX = event.screenX - startPos[0];
	    var newY = event.screenY - startPos[1];
		
	    window.moveTo(newX, newY);
	  }
	}
	function mouseUp(event) {
	  startPos = null; 
	}
	
	window.addEventListener("mousedown", mouseDown, false);
	window.addEventListener("mouseup", mouseUp, false);
	window.addEventListener("mousemove", mouseMove, false);	
})()
