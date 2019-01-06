<template>
  <span @click="$emit('input', {card: card, props: props})">
    <v-runtime-template :template="template">
    </v-runtime-template>
  </span>
</template>

<script>
 import fs from 'fs';
 import VRuntimeTemplate from "v-runtime-template";

 let propTypes = {
   character: {
     hp: "number",
     power: "text",
     art: "image",
     powerText: "textarea"
   },
   "character-back": {
     incapacitated: "textarea"
   },
   deck: {
     name: "text",
     hp: "number",
     art: "image",
     keywords: "text",
     text: "textarea",
     quote: "textarea",
     quoteCitation: "text",
     artist: "text"
   }
 };

 const templates = {
   'character': fs.readFileSync(__dirname + '/character.svg', 'utf8'),
   'character-back': fs.readFileSync(__dirname + '/character-back.svg', 'utf8'),
   'deck': fs.readFileSync(__dirname + '/deck.svg', 'utf8'),
 }

 export default {
   name: 'HeroCharacter',
   props: ['type', 'card'],
   components: {VRuntimeTemplate},

   data() {
     return {
       props: propTypes[this.type],
     }
   },

   computed: {
     template() {
       return templates[this.type]
         .replace('<?xml version="1.0" encoding="UTF-8"?>\n', '');
     },
   },
 }
</script>
