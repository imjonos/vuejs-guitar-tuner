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
        <button v-if="!isRead" @click="start()">Start</button>
        <button v-else @click="stop()">Stop</button>
        <br><br>
        <canvas id="graph"></canvas>
    </div>
</template>

<script>
import VueSpeedometer from "vue-speedometer";
import _ from "lodash";
import dft from "../libs/fourier/dft";

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
            strings: [329.63, 246.94, 196, 146.83, 110, 82.41],
            offsets: [],
            isTime: true,
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
        this.setString(this.stringIndex);
    },
    methods: {
        start() {
            this.init();
            this.isRead = true;
        },
        stop() {
            this.isRead = false;
            this.frequency = this.string[0];
        },
        setContext() {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            _.forEach(this.strings, stringFreq => {
                this.offsets.push(Math.round(this.ctx.sampleRate/stringFreq));
            });

        },
        read() {
            let mic = this.ctx.createMediaStreamSource(this.audio),
                analyser = this.ctx.createAnalyser(),
                scriptProcessor = this.ctx.createScriptProcessor();

            analyser.fftSize = 2048;
           /* analyser.minDecibels = -90;
            analyser.maxDecibels = -30;
           */
            analyser.smoothingTimeConstant = 0.85;
            mic.connect(analyser);
            analyser.connect(scriptProcessor);
            scriptProcessor.connect(this.ctx.destination);
            scriptProcessor.addEventListener("audioprocess", () => {
                let frequency = 0;
                if (this.isRead && this.isTime) {
                    //this.isTime = false;
                    setTimeout(()=>{
                        this.isTime=true;
                    }, 1000);
                    let data = new Uint8Array(analyser.frequencyBinCount);
                    // analyser.getByteFrequencyData(data);
                    analyser.getByteTimeDomainData(data);
                    this.draw(data);
                    this.getFrequency(this.fourier(data), this.ctx.sampleRate);
                    //this.drawFourier(this.fourier(data));
                    //frequency = this.getFrequency(data, this.ctx.sampleRate);
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
        setString(index=0){
            let freq = Math.round(this.strings[index]);
            this.string = [freq-20, freq-5, freq+5, freq+20]
            this.frequency = this.string[0];
        },
        getAverageFrequency(data) {
            let value = 0;
            for ( let i = 0; i < data.length; i ++ ) {
                value += data[i];
            }
            return value / data.length;
        },
        draw(data) {
            let canvas = document.getElementById("graph"),
                canvasContext = canvas.getContext("2d");
            canvasContext.clearRect(0, 0, canvas.width, canvas.height);
            _.forEach(data, (item, i) => {
                canvasContext.fillRect(i, item, 1, 1);
            });
        },
        drawFourier(data) {
            let canvas = document.getElementById("graph"),
                canvasContext = canvas.getContext("2d");
            canvasContext.clearRect(0, 0, canvas.width, canvas.height);
            _.forEach(data, (item) => {
                canvasContext.fillRect(item.re*100, item.im*100, 1, 1);
            });
        },
        fourier(data){
            let res = dft(data);
            //console.log('data', data);
            //console.log('res', res);
            return res;
        },
        getFrequency(buffer, sampleRate) {
            let maxKey = 0,
                maxMagnitude = 0;
            //console.log('buffer', buffer);
            _.forEach(buffer, (item, key) => {
                if(item.re<=1 && item.im<=1) {
                    let m = Math.sqrt(item.re * item.re + item.im * item.im);
                    if (m > maxMagnitude) {
                        maxMagnitude = m;
                        maxKey = key;
                    }
                }
            });
            let freq = maxKey*sampleRate/2048;
            if(freq<1000) console.log(freq, maxMagnitude, maxKey);
        }
    },
    watch:{
        stringIndex(val){
            this.setString(val);
        }
    }
}
</script>

<style scoped>

</style>