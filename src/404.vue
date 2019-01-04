<template>
  <div>
    <headful title="404 Not Found"> </headful>
    <h1>Error 404: Path {{ path }} not found</h1>
    You seem to have gone to the wrong place, would you like to go
    back to the <a href="/">Deck Index</a>?
  </div>
</template>

<script>
 export default {
   name: 'Err404',
   data() {
     return {
       path: window.location.pathname,
     }
   },
 }
</script>
