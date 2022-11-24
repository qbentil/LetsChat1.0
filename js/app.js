const user1 = document.getElementById("user1");
const user2 = document.getElementById("user2");
let localStream = null;
let remoteStream = null;
let peerConnection = null;

// servers
const servers = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
};
const init = async () => {
  // Get local stream
  localStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  });
  // Display local stream on #user1
  user1.srcObject = localStream;

  // create offer
  createOffer();
};

const createOffer = async () => {
  // Create peer connection
  peerConnection = new RTCPeerConnection(servers);
  // make remote stream available to #user2
  remoteStream = new MediaStream();
  user2.srcObject = remoteStream;

  // Add local stream to peer connection
  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  // Add remote stream to peer connection
  peerConnection.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  };

  // ice candidate
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      console.log("ICE candidate", event.candidate);
    }
  };
  // create offer and set local description
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  console.log("Offer", offer);
};

init();
