<template>
    <div>
        <select v-model="stringIndex">
            <option value="0">1 (E)	329.63 Hz	E4</option>
            <option value="1">2 (B)	246.94 Hz	B3</option>
            <option value="2">3 (G)	196.00 Hz	G3</option>
            <option value="3">4 (D)	146.83 Hz	D3</option>
            <option value="4">5 (A)	110.00 Hz	A2</option>
            <option value="5">6 (E)	82.41 Hz	E2</option>
        </select>
        <br><br>
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
    /**1 (E)	329.63 Hz	E4
     2 (B)	246.94 Hz	B3
     3 (G)	196.00 Hz	G3
     4 (D)	146.83 Hz	D3
     5 (A)	110.00 Hz	A2
     6 (E)	82.41 Hz	E2 **/
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
                [0, 320, 340, 660],
                [0, 240, 254, 494],
                [0, 190, 202, 392],
                [0, 140, 154, 294],
                [0, 100, 120, 220],
                [0, 75, 89, 164]
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
            analyser.minDecibels = -60;
            analyser.maxDecibels = -30;
            analyser.smoothingTimeConstant = 0.30;
            mic.connect(analyser);
            analyser.connect(scriptProcessor);
            scriptProcessor.connect(this.ctx.destination);
            scriptProcessor.addEventListener("audioprocess", () => {
                let frequency = this.string[0];
                if (this.isRead) {
                    let data = new Uint8Array(analyser.frequencyBinCount),
                        largest = 0;
                    analyser.getByteFrequencyData(data);
                    for (let i = 0; i < 30; i++) {
                        if (data[i]>this.string[0] &&
                            data[i]<this.string[3] &&
                            data[i] >= data[largest]) {
                            largest = i;
                        }
                    }
                    frequency = largest * Math.ceil(this.ctx.sampleRate/analyser.fftSize);
                    if(frequency>this.string[3]) frequency = this.string[3];
                    else
                        if(frequency<this.string[0]) frequency = this.string[0];
                }
                this.frequency = Math.round(frequency*100)/100;

            });
        },
        init() {
            this.setContext();
            if (navigator.mediaDevices.getUserMedia === undefined) {
                navigator.mediaDevices.getUserMedia = function (constraints) {
                    let getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

                    if (!getUserMedia) {
                        return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
                    }
                    return new Promise(function (resolve, reject) {
                        getUserMedia.call(navigator, constraints, resolve, reject);
                    });
                }
            }
            navigator.mediaDevices.getUserMedia({audio: true, video: false}).then((stream) => {
                this.audio = stream;
                this.read();
            });
        },
    },
    watch:{
        stringIndex(val){
            this.string = this.strings[val];
        }
    }
}
</script>

<style scoped>

</style>