import 'bootstrap/dist/css/bootstrap.min.css';
import './style.css';

document.querySelector('#app').innerHTML = `

    <main class="call-screen">

        <!-- Remote video -->
        <div class="remote-video">

            <div class="remote-person">
                Remote Video
            </div>

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

                <div class="local-person">
                    You
                </div>

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
           
        </div>

    </main>

`;



const endButton =
  document.getElementById('callButton');

endButton.addEventListener('click', () => {

  endButton.classList.toggle('disabled');

});


