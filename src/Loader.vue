<template>
  <div v-show="loading" class="loader"> </div>
</template>

<script>
 export default {
   name: "Loader",
   props: ['loading'],
 }
</script>

<style>
 .loader {
   display: inline-block;
   border: .33em solid #f3f3f3; /* Light grey */
   border-top: .33em solid #3498db; /* Blue */
   border-radius: 50%;
   width: .33em;
   height: .33em;
   animation: spin 2s linear infinite;
 }

 @keyframes spin {
   0% { transform: rotate(0deg); }
   100% { transform: rotate(360deg); }
 }
</style>
