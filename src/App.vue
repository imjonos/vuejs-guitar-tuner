<template>
  <img alt="Vue logo" width="40" src="./assets/logo.png">
  <tuner></tuner>
</template>

<script>
import Tuner from './components/Tuner.vue'

export default {
  name: 'App',
  components: {
    Tuner
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
