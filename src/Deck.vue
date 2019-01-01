<template>
  <!-- style is inline for phantomjs -->
  <div style="white-space: nowrap;">
    <div v-for="cardRow in chunkedCards">
      <span v-for="card in cardRow" @click="$emit('input', card)">
        <Hero v-bind="card.card" style="white-space: initial;"> </Hero>
      </span>
    </div>
  </div>
</template>

<script>
 import Hero from './template/hero/Hero.vue'

 export default {
   name: 'Deck',
   props: ['cards'],
   components: {Hero},

   computed: {
     allCards() {
       return Object
         .keys(this.cards)
         .flatMap(cardType => this.cards[cardType].flatMap((card, index) => {
           let cardWrapper = {
             type: cardType,
             card: this.cards[cardType][index],
             props: Hero.props,
           };
           return Array(card.count || 1).fill(cardWrapper);
         }));
     },

     chunkedCards() {
       // find minimum box to fit cards
       let columns = Math.ceil(Math.sqrt(this.allCards.length));
       let rows = Math.ceil(this.allCards.length / columns) || 0;
       return Array(rows)
         .fill()
         .map((_, index) => index * columns)
         .map(begin => this.allCards.slice(begin, begin + columns));
     },
   },
 }
</script>
