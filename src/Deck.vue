<template>
  <!-- style is inline for phantomjs -->
  <div style="white-space: nowrap;">
  <div v-for="cardRow in chunkedCards">
    <span v-for="card in cardRow" @click="$emit('input', card)">
      <Hero v-bind="card.card"> </Hero>
    </span>
  </div>
  </div>
</template>

<script>
 import Hero from './template/hero/Hero.vue'

 export default {
   name: 'Deck',
   props: ['deckInfo'],
   components: {Hero},

   computed: {
     cards() {
       console.log
       return Object
         .keys(this.deckInfo)
         .filter(cardType => cardType !== 'meta')
         .flatMap(cardType => this.deckInfo[cardType].flatMap((card, index) => {
           let cardWrapper = {
             type: cardType,
             card: this.deckInfo[cardType][index],
             props: Hero.props,
           };
           return Array(card.count || 1).fill(cardWrapper);
         }));
     },

     chunkedCards() {
       // find minimum box to fit cards
       let columns = Math.ceil(Math.sqrt(this.cards.length));
       let rows = Math.ceil(this.cards.length / columns) || 0;
       return Array(rows)
         .fill()
         .map((_, index) => index * columns)
         .map(begin => this.cards.slice(begin, begin + columns));
     },
   },
 }
</script>
