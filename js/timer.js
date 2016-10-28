let debugTimerLast = Date.now();
function debugTimer (ms) {
	let seconds = ms || 1000;
	let now = Date.now();
	if (now - debugTimerLast > seconds) {
		debugClockLast = Date.now();;
	}
	// RUN CODE HERE
	console.log('hello');
	setTimeout( () => {debugTimer()}, seconds);
}