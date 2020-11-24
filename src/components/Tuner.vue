<template>
    <div>
        <vue-speedometer
            :width="500"
            :needleHeightRatio="0.7"
            :value="frequency"
            :customSegmentStops='[0, 250, 750, 1000]'
            :segmentColors='["#9399ff", "#14ffec", "#00bbf0"]'
            :currentValueText="String(frequency)"
            :customSegmentLabels='[
        {
          text: "Good",
          position: "OUTSIDE",
          color: "#d8dee9",
        },
        {
          text: "Great",
          position: "OUTSIDE",
          color: "#d8dee9",
        },
        {
          text: "Awesome!",
          position: "OUTSIDE",
          color: "#d8dee9",
        },
      ]'
            :ringWidth="47"
            :needleTransitionDuration="3333"
            needleTransition="easeElastic"
            needleColor="#a7ff83"
            textColor="#d8dee9"
        />
        <a href="" @click.prevent="start()">Start</a>  <a href="" @click.prevent="stop()">Stop</a>
    </div>
</template>

<script>
import VueSpeedometer from "vue-speedometer"

export default {
    name: "Tuner",
    components: {
        VueSpeedometer
    },
    data() {
        return {
            data: {},
            ctx: {},
            audio: null,
            frequency: 0
        }
    },
    mounted() {

    },
    methods: {
        start(){
            this.init();
        },
        stop(){
            this.audio.getTracks().forEach(function(track) {
                track.stop();
            });
        },
        setContext(){
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        },
        read(){
            let mic = this.ctx.createMediaStreamSource(this.audio);
            console.log('stream', this.audio);
            let analyser = this.ctx.createAnalyser();
            let scriptProcessor = this.ctx.createScriptProcessor();
            analyser.fftSize = 2048;
            // osc = ctx.createOscillator();
            mic.connect(analyser);
            analyser.connect(scriptProcessor);
            scriptProcessor.connect(this.ctx.destination);
            scriptProcessor.addEventListener("audioprocess", ()=>{
                let data = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(data);
                let idx = 0;
                for (let j = 0; j < analyser.frequencyBinCount; j++) {
                    if (data[j] > data[idx]) {
                        idx = j;
                    }
                }
                this.frequency = idx * this.ctx.sampleRate / analyser.fftSize;
                console.log('frequency', this.frequency);
            });
        },
        init() {
            this.setContext();
            if (navigator.mediaDevices.getUserMedia === undefined) {
                navigator.mediaDevices.getUserMedia = function (constraints) {

                    // First get ahold of the legacy getUserMedia, if present
                    let getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

                    // Some browsers just don't implement it - return a rejected promise with an error
                    // to keep a consistent interface
                    if (!getUserMedia) {
                        return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
                    }

                    // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
                    return new Promise(function (resolve, reject) {
                        getUserMedia.call(navigator, constraints, resolve, reject);
                    });
                }
            }
            navigator.mediaDevices.getUserMedia({audio: true, video: false}).then((stream)=> {
                this.audio = stream;
                this.read();
            });
        }
    }
}
</script>

<style scoped>

</style>