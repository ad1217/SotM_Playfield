<template>
  <body>
    <label>Create New Deck:
      <input type="text"
             @change="window.location='/deck/' + event.target.value + '/editor'">
    </label>
    <ul>
      <li v-for="deck in decks">
        {{ deck }}:
        <router-link :to="'/play/' + deck"> Play </router-link>
        <router-link :to="'/edit/' + deck"> Edit </router-link>
      </li>
    </ul>
  </body>
</template>

<script>
 export default {
   name: 'DeckIndex',
   data() {
     return {
       decks: null,
     }
   },

   created() {
     fetch('/decks.json')
       .then(r => r.json())
       .then(d => this.decks = d);
   },
 }
</script>
