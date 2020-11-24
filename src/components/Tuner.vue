<template>
    <div>
        <vue-speedometer
            v-if="string"
            :width="500"
            :needleHeightRatio="0.7"
            :value="frequency"
            :customSegmentStops="string"
            :segmentColors="colors"
            :currentValueText="String(frequency)+'Hz'"
            :customSegmentLabels="segments"
            :ringWidth="47"
            :needleTransitionDuration="3333"
            needleTransition="easeElastic"
            needleColor="#a7ff83"
            textColor="#000"
            :minValue="string[0]"
            :maxValue="string[3]"
        />
        <button @click="start()">Start</button>
        <button @click="stop()">Stop</button>
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
            frequency: 0,
            isRead: false,
            stringIndex: 0,
            string: null,
            strings: [
                [300, 430, 460, 590]
            ],
            colors: ["#9399ff", "#14ffec", "#00bbf0"],
            segments: [
                {
                    text: "Low",
                    position: "OUTSIDE",
                    color: "#000",
                },
                {
                    text: "Great",
                    position: "OUTSIDE",
                    color: "#000",
                },
                {
                    text: "High",
                    position: "OUTSIDE",
                    color: "#000",
                }
            ]
        }
    },
    mounted() {
        this.string = this.strings[this.stringIndex];
    },
    methods: {
        start() {
            this.init();
            this.isRead = true;
        },
        stop() {
            this.isRead = false;
            this.frequency = 0;
        },
        setContext() {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        },
        read() {
            let mic = this.ctx.createMediaStreamSource(this.audio),
                analyser = this.ctx.createAnalyser(),
                scriptProcessor = this.ctx.createScriptProcessor();
            analyser.fftSize = 2048;
            analyser.smoothingTimeConstant = 0.3;
            mic.connect(analyser);
            analyser.connect(scriptProcessor);
            scriptProcessor.connect(this.ctx.destination);
            scriptProcessor.addEventListener("audioprocess", () => {
                let frequency = this.string[0];
                if (this.isRead) {
                    let data = new Uint8Array(analyser.frequencyBinCount),
                        largest = 0;
                    analyser.getByteFrequencyData(data);
                    for (let i = 0; i < analyser.frequencyBinCount; i++) {
                        if (data[i] > data[largest]) {
                            largest = i;
                        }
                    }
                    frequency = largest * (this.ctx.sampleRate / analyser.fftSize);
                    console.log(largest, this.ctx.sampleRate, analyser.fftSize);
                    if(frequency>this.string[3]) frequency = this.string[3];
                    else
                        if(frequency<this.string[0]) frequency = this.string[0];
                }
                this.frequency = Math.round(frequency);

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
            navigator.mediaDevices.getUserMedia({audio: true, video: false}).then((stream) => {
                this.audio = stream;
                this.read();
            });
        }
    }
}
</script>

<style scoped>

</style>