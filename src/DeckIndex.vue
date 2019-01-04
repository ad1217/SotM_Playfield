<template>
  <body>
    <router-link to="/edit/new">Create New Deck</router-link>
    <ul>
      <li v-for="deck in decks">
        {{ deck.deck.meta.name }}:
        <router-link :to="'/play/' + deck._id"> Play </router-link>
        <router-link :to="'/edit/' + deck._id"> Edit </router-link>
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
       .then(d => this.decks = d)
       .catch(err => console.log("Couldn't get deck list"));
   },
 }
</script>
