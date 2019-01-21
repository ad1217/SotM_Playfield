<template>
  <span @click="$emit('input', {card: card, props: props})">
    <v-runtime-template :template="template"> </v-runtime-template>
  </span>
</template>

<script>
 import Vue from 'vue';
 import VRuntimeTemplate from "v-runtime-template";

 import HTMLEmbed from './HTMLEmbed.vue';

 import propTypes from './template/*/input.yaml';
 import templates from './template/*/*.svg';

 function growShrink() {
   this.update = function (thisElement, binding) {
     const params = binding.value;

     let heightAcc = 0;
     let children = Array.from(thisElement.children);
     for (let el of params.bottom ? children.reverse() : children) {
       el.children[params.adjust].setAttribute(
	 'height', el.children[params.check].firstChild.clientHeight + params.padding);

       let translate = heightAcc + params.offset || 0;
       heightAcc += el.children[params.check].firstChild.clientHeight + params.margin;
       if (params.bottom) {
	 translate = -heightAcc + params.offset || 0;
       }
       el.setAttribute('transform', `translate(0, ${translate})`);
     };
   }
   this.inserted = this.update;
 }

 Vue.directive('growShrink', new growShrink());

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
