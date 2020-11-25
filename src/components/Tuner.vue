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
                scriptProcessor = this.ctx.createScriptProcessor(),
                filter1 = this.ctx.createBiquadFilter(),
                filter2 = this.ctx.createBiquadFilter();
            //mic.volume=0.5;
            filter1.type = 'lowpass'; // High-pass filter (Тип фильтра)
            filter1.frequency.value = 360;//this.string[3]; // Cutoff to 1kHZ (Базовая частота)
            //filter1.frequency.Q = 1; // Quality factor (Добротность)
            mic.connect(filter1);

            filter2.type = 'highpass'; // High-pass filter (Тип фильтра)
            filter2.frequency.value = 40;//this.string[0]; // Cutoff to 1kHZ (Базовая частота)
            //filter2.frequency.Q = 1; // Quality factor (Добротность)
            filter1.connect(filter2);

            analyser.fftSize = 2048;
            analyser.minDecibels = -90;
            analyser.maxDecibels = -30;
            analyser.smoothingTimeConstant = 0.85;
            filter2.connect(analyser);
            //mic.connect(analyser);

            analyser.connect(scriptProcessor);
            scriptProcessor.connect(this.ctx.destination);
            scriptProcessor.addEventListener("audioprocess", () => {
                let frequency = this.frequency;
                if (this.isRead && this.isTime) {
                    //this.isTime = false;
                    setTimeout(()=>{
                        this.isTime=true;
                    }, 500);
                    let data = new Uint8Array(analyser.frequencyBinCount),
                        largest = 0,
                        lv,
                        timeData = new Uint8Array(analyser.frequencyBinCount),
                        result;
                   // analyser.getByteFrequencyData(data);
                    analyser.getByteTimeDomainData(timeData);
                    data = timeData;
                    this.draw(timeData);
                   // this.getFrequency(timeData);
                    /*let avgResult = 0;
                    _.forEach(data, val =>{
                        avgResult +=val*val;
                    });
                    avgResult = Math.sqrt(avgResult/data.length);*/
                    for (let i = 0; i < analyser.frequencyBinCount; i++) {
                        if (data[i] > data[largest]) {
                            largest = i;
                            lv=data[i];
                        }
                    }
                    result = 1 / (largest / this.ctx.sampleRate);
                    //result = largest*(this.ctx.sampleRate/analyser.fftSize);
                    if(result>this.string[3]) frequency = this.string[3];
                    else if(result<this.string[0]) frequency = this.string[0];
                    else frequency = result;
                    console.log('largest', largest,'lv',lv,'val',result, 'avg', this.getAverageFrequency(data));

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
        getFrequency(data){
            let lastPos = 0,
                lastItem = 0;
            _.forEach(data,(item, i) => {
                if (item > 128 && lastItem <= 128) { // we have crossed below the mid point
                    const elapsedSteps = i - lastPos; // how far since the last time we did this
                    lastPos = i;
                    const hertz = 1 / (elapsedSteps / this.ctx.sampleRate);
                    this.frequency = hertz;
                }
                lastItem = item;
            });
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