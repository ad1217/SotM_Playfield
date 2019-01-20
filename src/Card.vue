<template>
  <span @click="$emit('input', {card: card, props: props})">
  <v-runtime-template :template="template"> </v-runtime-template>
  </span>
</template>

<script>
 import HTMLEmbed from './HTMLEmbed.vue';
 import VRuntimeTemplate from "v-runtime-template";
 import propTypes from './template/*/input.yaml';
 import templates from './template/*/*.svg';

 export default {
   name: 'Card',
   props: ['deckType', 'type', 'card'],
   components: {VRuntimeTemplate, HTMLEmbed},

   computed: {
     props() {
       return {count: 'number', ...propTypes[this.deckType][this.type]};
     },

     template() {
       let deckTemplates = templates[this.deckType];
       let cardType = (this.type in deckTemplates) ? this.type :
		      this.type.replace(/-back$/, '');
       return deckTemplates[cardType]
	 .replace('<?xml version="1.0" encoding="UTF-8"?>\n', '');
     },
   },
 }
</script>

<style>
 .htmlEmbed {
   line-height: .8em;
 }

 .htmlEmbed p {
   margin-top: 0;
   margin-bottom: .5em;
 }
</style>
