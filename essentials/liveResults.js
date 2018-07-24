function liveResults(updateFunction){
	var socket = io.connect('http://192.168.10.16:3000');
    socket.on('connect', function(){
        console.log('socket connected :)');
        //socket.emit('connInfo',{username : 'testUser'}); //change with actual username
    });
    socket.on('update', function (data) {
        updateFunction('update')
				console.log(data);
    });
    socket.on('disconnect', function(reason){
        console.log('socket stuff disconnect', reason);
    });
}
