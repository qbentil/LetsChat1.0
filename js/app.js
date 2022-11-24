const user1 = document.getElementById('user1');
const user2 = document.getElementById('user2');

console.log('init');
let localStream = null;
let remoteStream = null;

const init = async () => {
    // Get local stream
    localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
    });
    // Display local stream on #user1
    document.getElementById('user1').srcObject = localStream;
};

init();
