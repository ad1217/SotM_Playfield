<template>
  <v-runtime-template :template="template"> </v-runtime-template>
</template>

<script>
 import fs from 'fs';
 import VRuntimeTemplate from "v-runtime-template";

 const templates = {
   'character': fs.readFileSync(__dirname + '/character.svg', 'utf8'),
   'character-back': fs.readFileSync(__dirname + '/character-back.svg', 'utf8'),
   'deck': fs.readFileSync(__dirname + '/deck.svg', 'utf8'),
 }

 export default {
   name: 'HeroCharacter',
   props: ['name', 'hp', 'keywords', 'text', 'quote', 'quoteCitation', 'artist'],
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
