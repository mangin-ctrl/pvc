import 'bootstrap/dist/css/bootstrap.min.css';
import './style.css';

document.querySelector('#app').innerHTML = `

    <main class="call-screen">

        <!-- Remote video -->
        <div class="remote-video">

            <video
                id="remoteVideo"
                autoplay
                playsinline>
            </video>

            <!-- Subtitle -->
            <div class="subtitle">

                <span class="subtitle-language">
                    Português
                </span>

                <span class="subtitle-text">
                    Olá, como você está?
                </span>

            </div>

            <!-- Local video -->
            <div class="local-video">

                <video
                  id="localVideo"
                  autoplay
                  playsinline
                  muted>
                </video>

            </div>

        </div>


        <!-- Call controls -->
        <div class="call-controls">

            <button
                id="callButton"
                class="control-button end-call"
                aria-label="Call Button">

                ☎

            </button>

            <button
                id="micButton"
                class="control-button"
                aria-label="Microphone">

                🎤

            </button>
           
        </div>

    </main>

`;



const callButton =
  document.getElementById('callButton');

const micButton =
  document.getElementById('micButton');


callButton.addEventListener('click', () => {

  endButton.classList.toggle('disabled');

});

micButton.addEventListener('click', () => {

  if (!localStream) {
    return;
  }

  const audioTrack =
    localStream.getAudioTracks()[0];

  if (!audioTrack) {
    return;
  }

  audioTrack.enabled =
    !audioTrack.enabled;

  micButton.classList.toggle(
    'disabled',
    !audioTrack.enabled
  );

});



const localVideo =
  document.getElementById('localVideo');

const remoteVideo =
  document.getElementById('remoteVideo');

let localStream = null;

async function startLocalVideo() {

  try {

    localStream =
      await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

    localVideo.srcObject =
      localStream;

    simulateRemoteVideo();

  } catch (error) {

    console.error(
      'Unable to access camera:',
      error
    );

  }
}

startLocalVideo();

function simulateRemoteVideo() {

  if (!localStream) {
    return;
  }

  remoteVideo.srcObject =
    localStream;
}



function showSubtitle(
  text,
  language = 'Português'
) {

  const languageElement =
    document.querySelector(
      '.subtitle-language'
    );

  const textElement =
    document.querySelector(
      '.subtitle-text'
    );

  languageElement.textContent =
    language;

  textElement.textContent =
    text;
}

showSubtitle(
    'How are you?',
    'English'
);