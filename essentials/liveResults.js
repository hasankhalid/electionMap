/*function liveResults(updateFunction){
	var socket = io.connect('https://election-res.herokuapp.com');
    socket.on('connect', function(){
        console.log('socket connected :)');
        //socket.emit('connInfo',{username : 'testUser'}); //change with actual username
    });
    socket.on('update', function (data) {
				var tootip = document.getElementById('hoverbox');
				if(tootip){
					tootip.innerHTML = '';
				}
        updateFunction('update', data);
    });
    socket.on('disconnect', function(reason){
        console.log('socket stuff disconnect', reason);
    });
} */
