<template>
  <div>
    <div id="controls">
      <div>
        <button type="button" @click="upload"> Save Deck </button>
        <button type="button" @click="jsonInputDownload">
          Download Input JSON
        </button>

        <button type="button"
                @click="downloadFile('/decks/' + deckID + '.tts.json', deckInfo.meta.name + '.tts.json')">
          Download Tabletop Output JSON
        </button>
      </div>

      <div>
        <label> Upload JSON: WARNING: WILL CLEAR DECK
          <input @change="jsonUpload" type="file">
        </label>
      </div>

      <form>
        <div>
          <label> Deck Name: <input type="text" v-model="deckInfo.meta.name"> </label>
        </div>
        <div>
          <label> Deck Type:
            <select v-model="deckInfo.meta.type">
              <option value="hero">hero</option>
              <option value="villain">villain</option>
              <option value="environment">environment</option>
            </select>
          </label>
        </div>
      </form>
    </div>

    <div id="cardEditor" v-if="selected">
      <button class="close-editor" @click="selected = null">X</button>
      <div v-for="(type, prop) in selected.props">
        <label> {{ prop }}
          <input v-if="type === Number" v-model="selected.card[prop]"/>
          <input v-if="type === 'file'" type="file" accept="image/*"
                 @change="fileUploaded(prop, $event)" />
          <textarea v-else rows="1" v-model="selected.card[prop]"> </textarea>
        </label>
      </div>
    </div>

    <Deck ref="deck" :cards="deckInfo.cards" v-model="selected"> </Deck>
  </div>
</template>

<script>
 import Deck from './Deck.vue';

 export default {
   name: 'Editor',
   components: {Deck},

   props: ['deckID'],
   data() {
     return {
       selected: null,
       deckInfo: {meta: {name: "", type: ""},
                  cards: {}},
     };
   },

   watch: {
     deckInfo() {
       document.title = "Editor|" + this.deckInfo.meta.name;
     },
   },

   created() {
     if (this.deckID !== 'new') {
       fetch('/decks/' + this.deckID + '.json')
         .then(r => r.json())
         .then(j => this.deckInfo = j)
         .catch((err) => console.log('did not get old JSON, starting new deck'));
     }

     /* window.addEventListener(
      *   'beforeunload', e => e.returnValue = "Unsaved changes blah blah"); */
   },

   methods: {
     // deck JSON uploader
     jsonUpload(event) {
       let files = event.target.files;
       let reader = new FileReader();
       reader.onload = event => {
         this.deckInfo = JSON.parse(event.target.result);
       };
       reader.readAsText(files[0]);
     },

     // download input JSON
     jsonInputDownload() {
       console.log(JSON.stringify(this.deckInfo));
       this.downloadFile('data:application/json;charset=utf-8,' +
                         encodeURIComponent(JSON.stringify(this.deckInfo)),
                         this.deckID + '.input.json')
     },

     fileUploaded(event, prop) {
       let reader = new FileReader();
       reader.onload = e => {
         this.selected.card[prop] = e.target.result;
       };
       reader.readAsDataURL(event.target.files[0]);
     },

     downloadFile(file, name) {
       let dl = document.createElement('a');
       dl.setAttribute('href', file);
       dl.setAttribute('download', name);
       document.body.appendChild(dl);
       dl.click();
       document.body.removeChild(dl);
     },

     upload() {
       // POST the inputed json to the server
       fetch('/upload', {
         method: 'post',
         headers: {'Content-Type': 'application/json'},
         body: JSON.stringify({
           deck: this.deckInfo,
           _id: this.deckID === 'new' ? undefined : this.deckID,
           dom: (new XMLSerializer()).serializeToString(this.$refs.deck.$el),
         })})
         .then(r => r.json())
         .then(j => this.$router.replace('/edit/' + j.id))
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
</style>
