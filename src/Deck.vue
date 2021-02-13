<template>
  <div class="deck">
    <div v-for="cardRow in chunkedCards">
      <Card
        v-for="card in cardRow"
        :deckType="deckInfo.meta.type"
        :type="card.type"
        :card="card.card"
        @click.native="$emit('select', card)"
      >
      </Card>
    </div>
  </div>
</template>

<script>
import Card from './Card.vue';

export default {
  name: 'Deck',
  props: ['deckInfo'],
  components: { Card },

  computed: {
    allCards() {
      return Object.keys(this.deckInfo.cards).flatMap((cardType) =>
        this.deckInfo.cards[cardType].flatMap((card, index) => {
          let cardWrapper = [
            {
              type: cardType,
              card: card,
            },
          ];
          if (card.back) {
            // TODO: a little hacky
            cardWrapper.push({
              type: cardType + '-back',
              card: card.back,
            });
          }
          return cardWrapper;
        })
      );
    },

    chunkedCards() {
      // find minimum box to fit cards
      let columns = Math.ceil(Math.sqrt(this.allCards.length));
      let rows = Math.ceil(this.allCards.length / columns) || 0;
      return Array(rows)
        .fill()
        .map((_, index) => index * columns)
        .map((begin) => this.allCards.slice(begin, begin + columns));
    },
  },
};
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
