<template>
  <div>
    <headful :title="'Editor|' + deckInfo.meta.name"> </headful>
    <div id="controls">
      <div>
        <button type="button" @click="upload"> Save Deck </button>
        <Loader :loading="uploading"></Loader>
        Download:
        <a class="download" :href="inputJSON"
           :download="deckInfo.meta.name + '.input.json'">
          Input JSON
        </a>
        <a class="download" :href="`/decks/${deckID}.tts.json`"
           :download="deckInfo.meta.name + '.tts.json'">
          Tabletop Sim Output JSON
        </a>
        <a class="download" :href="`/decks/${deckID}.png`"
           :download="deckInfo.meta.name + '.png'">
          Deck PNG
        </a>
      </div>

      <div>
        <label> Upload JSON: WARNING: WILL CLEAR DECK
          <input ref="jsonUpload" type="file">
        </label>
        <button type="button" @click="jsonUpload"> Load </button>
      </div>

      <div>
        <label> Deck Name: <input type="text" v-model="deckInfo.meta.name"> </label>
        <label> Deck Type:
          <select v-model="deckInfo.meta.type">
            <option value="hero">hero</option>
            <option value="villain">villain</option>
            <option value="environment">environment</option>
          </select>
        </label>
      </div>
    </div>

    <div id="cardEditor" v-if="selected">
      <button class="close-editor" @click="selected = null">X</button>
      <div v-for="(type, prop) in selected.props">
        <label> {{ prop }}
          <input v-if="type === 'image'" type="file" accept="image/*"
                 @change="fileUploaded(prop, $event)" />
          <textarea v-else-if="type === 'textarea'" v-model="selected.card[prop]"> </textarea>
          <input v-else :type="type" v-model="selected.card[prop]"/>
        </label>
      </div>
    </div>

    <Deck ref="deck" :cards="deckInfo.cards" v-model="selected"> </Deck>
  </div>
</template>

<script>
 import yaml from 'js-yaml';
 import html2canvas from 'html2canvas';
 import Deck from './Deck.vue';
 import Loader from './Loader.vue';

 export default {
   name: 'Editor',
   components: {Deck, Loader},

   props: ['deckID'],
   data() {
     return {
       uploading: false,
       selected: null,
       deckInfo: {meta: {name: "", type: ""},
                  cards: {}},
     };
   },

   created() {
     if (this.deckID !== 'new') {
       fetch('/decks/' + this.deckID + '.json')
         .then(r => r.json())
         .then(j => this.deckInfo = j.deck)
         .catch((err) => console.log('did not get old JSON, starting new deck'));
     }

     /* window.addEventListener(
      *   'beforeunload', e => e.returnValue = "Unsaved changes blah blah"); */
   },

   computed: {
     inputJSON() {
       return 'data:application/json;charset=utf-8,' +
              encodeURIComponent(JSON.stringify(this.deckInfo))
     },
   },

   methods: {
     // deck JSON uploader
     jsonUpload(event) {
       let files = this.$refs.jsonUpload.files;
       let reader = new FileReader();
       reader.onload = e => this.deckInfo = yaml.safeLoad(e.target.result);
       reader.readAsText(files[0]);
     },

     fileUploaded(event, prop) {
       let reader = new FileReader();
       reader.onload = e => {
         this.selected.card[prop] = e.target.result;
       };
       reader.readAsDataURL(event.target.files[0]);
     },

     upload() {
       this.uploading = true;

       let node = this.$refs.deck.$el;
       html2canvas(node, {scale: 2, width: node.scrollWidth,
                          backgroundColor: 'black'})
         .then(canvas => canvas.toDataURL("image/png"))
         .then(image =>
           // POST the inputed json to the server
           fetch('/upload', {
             method: 'post',
             headers: {'Content-Type': 'application/json'},
             body: JSON.stringify({
               deck: this.deckInfo,
               _id: this.deckID === 'new' ? undefined : this.deckID,
               image: image,
               css: document.styleSheets[0].href,
             })}))
         .then(r => r.json())
         .then(j => {
           this.$router.replace('/edit/' + j.id);
           this.uploading = false;
         })
         .catch(err => console.log('Failed to upload' + err));
     },
   },
 }
</script>

<style>
 #cardEditor {
   position: fixed;
   top: 0;
   right: 0;
   background-color: gray;
   padding: 10px;
   border-radius: 3px;
 }

 .close-editor {
   float: right;
 }

 a.download {
   display: inline-block;
   margin-bottom: .2em;
   background-color: #1976D2;
   color: white;
   text-decoration: none;
   padding: .2em .4em;
 }

 a.download:hover {
   background-color: #1565C0;
 }
</style>
