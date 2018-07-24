function liveResults(){
	var socket = io.connect('https://election-res.herokuapp.com');
    socket.on('connect', function(){
        console.log('socket connected :)');
        //socket.emit('connInfo',{username : 'testUser'}); //change with actual username
    });
    socket.on('update', function (data) {
        console.log('socket stuff', data);
    });
    socket.on('disconnect', function(reason){
        console.log('socket stuff disconnect', reason);
    });
}