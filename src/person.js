import Peer from 'peerjs';

import './style.css';

const isNick =
    window.location.pathname.endsWith(
        'nick.html'
    );

const MY_PEER_ID =
    isNick
        ? 'nick'
        : 'ana';


const REMOTE_PEER_ID =
    isNick
        ? 'ana'
        : 'nick';


const localVideo =
    document.getElementById(
        'localVideo'
    );


const remoteVideo =
    document.getElementById(
        'remoteVideo'
    );


const callButton =
    document.getElementById(
        'callButton'
    );


const hangupButton =
    document.getElementById(
        'hangupButton'
    );


const status =
    document.getElementById(
        'status'
    );


const remotePlaceholder =
    document.getElementById(
        'remotePlaceholder'
    );

const peer =
    new Peer(MY_PEER_ID);

let localStream = null;

let currentCall = null;

async function startCamera() {

    try {

        localStream =
            await navigator
                .mediaDevices
                .getUserMedia({

                    video: true,

                    audio: true

                });


        localVideo.srcObject =
            localStream;


        setStatus(
            'Camera ready'
        );


    } catch (error) {

        console.error(
            error
        );


        setStatus(
            'Camera/microphone permission denied'
        );

    }

}

function setStatus(
    message
) {

    status.textContent =
        message;

}

peer.on(
    'open',
    (id) => {

        console.log(
            'Peer connected:',
            id
        );


        setStatus(
            `Online as ${id}`
        );

    }
);

peer.on("call", (call) => {

    console.log("📞 INCOMING CALL");
    console.log("Caller:", call.peer);

    setStatus("Incoming call...");

    if (!localStream) {

        console.error(
            "❌ No local stream available!"
        );

        return;

    }

    console.log(
        "Answering with local stream:",
        localStream
    );

    call.answer(localStream);

    currentCall = call;

    handleCall(call);

});

function callPerson() {

    if (!localStream) {

        setStatus(
            'Camera is not ready'
        );

        return;

    }


    setStatus(
        `Calling ${REMOTE_PEER_ID}...`
    );


    console.log(
        "📞 Calling:",
        REMOTE_PEER_ID
    );

    console.log(
        "Local stream:",
        localStream
    );

    const call =
        peer.call(
            REMOTE_PEER_ID,
            localStream
        );


    currentCall =
        call;


    handleCall(
        call
    );

}

function handleCall(call) {

    console.log("Handling call:", call);

    call.on("stream", (remoteStream) => {

        console.log("🎥 REMOTE STREAM RECEIVED");
        console.log("Remote stream:", remoteStream);

        remoteVideo.srcObject = remoteStream;

        remotePlaceholder.style.display = "none";

        setStatus("Connected");

    });

    call.on("close", () => {

        console.log("Call closed");

        remoteVideo.srcObject = null;

        remotePlaceholder.style.display = "flex";

        setStatus("Call ended");

    });

    call.on("error", (error) => {

        console.error("❌ CALL ERROR:", error);

        setStatus("Call error");

    });

}

callButton.addEventListener(
    'click',
    () => {

        callPerson();

    }
);

hangupButton.addEventListener(
    'click',
    () => {

        if (currentCall) {

            currentCall.close();

            currentCall =
                null;

        }


        remoteVideo.srcObject =
            null;


        remotePlaceholder.hidden =
            false;


        setStatus(
            'Call ended'
        );

    }
);

startCamera();

function showSubtitle(
    text
) {

    const textElement =
        document.querySelector(
            '.subtitle-text'
        );

     textElement.textContent =
        text;
}

