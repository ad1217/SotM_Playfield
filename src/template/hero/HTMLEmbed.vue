<template>
  <foreignObject>
    <div class="htmlEmbed" v-html="html"> </div>
  </foreignObject>
</template>

<script>
 export default {
   name: 'HTMLEmbed',
   props: ['html'],
 }
</script>
