<template>
  <div class="deck">
    <div v-for="cardRow in chunkedCards">
      <Hero v-for="card in cardRow" v-model="selected"
            :type="card.type" :card="card.card"> </Hero>
    </div>
  </div>
</template>

<script>
 import Hero from './template/hero/Hero.vue'

 export default {
   name: 'Deck',
   props: ['cards'],
   components: {Hero},

   data() {
     return {
       selected: null,
     }
   },

   watch: {
     selected() {
       this.$emit('input', this.selected);
     }
   },

   computed: {
     allCards() {
       return Object
         .keys(this.cards)
         .flatMap(cardType => this.cards[cardType].flatMap((card, index) => {
           let cardWrapper = [{
             type: cardType,
             card: card,
           }];
           if (card.back) { // TODO: a little hacky
             cardWrapper.push({
               type: cardType + '-back',
               card: card.back,
             });
           }
           return cardWrapper;
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

<style>
 .deck {
   white-space: nowrap;
   width: fit-content;
 }

 .deck svg {
   white-space: initial;
 }
</style>
