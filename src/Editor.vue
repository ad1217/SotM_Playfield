<template>
  <div>
    <div id="controls">
      <div>
        <button type="button" @click="upload"> Save Deck </button>
        <button type="button" @click="jsonInputDownload">
          Download Input JSON
        </button>

        <button type="button"
                @click="downloadFile('deck.tts.json', deckName + '.json')">
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
          <label> Deck Name: <input type="text" v-model="deckName"> </label>
        </div>
        <div>
          <label> Deck Type:
            <select v-model="deckInfo.type">
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
      <div v-for="(type, prop) in selectedCardProps">
        <label> {{ prop }}
          <input v-if="type === Number" v-model="selected.card[prop]"/>
          <input v-if="type === 'file'" v-model="selected.card[prop]"/>
          <textarea v-else rows="1" v-model="selected.card[prop]"> </textarea>
        </label>
      </div>
    </div>

    <div ref="deck" :style="deckStyle">
      <div v-for="card in cards" @click="selected = card">
        <Hero v-bind="card.card"> </Hero>
      </div>
    </div>
  </div>
</template>

<script>
 import Hero from './template/hero/Hero.vue'

 export default {
   name: 'Editor',

   components: {Hero},

   props: ['deckName'],
   data() {
     return {
       selected: null,
       deckInfo: {},
     };
   },

   watch: {
     deckName() {
       document.title = "Editor|" + deckName;
     },
   },

   created() {
     fetch('/decks/' + this.deckName + '.input.json')
       .then(r => r.json())
       .then(j => this.deckInfo = j);
     /* window.addEventListener(
      *   'beforeunload', e => e.returnValue = "Unsaved changes blah blah"); */
   },

   computed: {
     cards() {
       return Object
         .keys(this.deckInfo)
         .filter(cardType => typeof this.deckInfo[cardType] !== 'string')
         .flatMap(cardType => this.deckInfo[cardType].flatMap((card, index) => {
           let cardWrapper = {
             type: cardType,
             card: this.deckInfo[cardType][index],
           };
           return Array(card.count || 1).fill(cardWrapper);
         }));
     },

     deckStyle() {
       // find minimum box to fit cards
       let rows = Math.ceil(Math.sqrt(this.cards.length));
       let columns = this.cards.length > rows * (rows - 1) ? rows : rows - 1;
       return {
         display: 'grid',
         'grid-template-columns': `repeat(${rows}, 1fr)`,
         'grid-template-rows': `repeat(${columns}, 1fr)`,
       };
     },

     selectedCardProps() {
       // todo: make better
       return Hero.props;
     },
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
                         this.deckName + '.input.json')
     },

     // chrome doesn't seem to send input event on file select
     fileUploaded(event) {
       let prop = event.target.id.substring(5);
       if (prop === "image") {
         let files = event.target.files;
         let reader = new FileReader();
         reader.onload = e => {
           selected.svg.querySelector('#' + prop)
                   .setAttributeNS("http://www.w3.org/1999/xlink", "href", e.target.result);
           selected.json[prop] = e.target.result;
         };
         reader.readAsDataURL(files[0]);
       }
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
       // POST the generated SVGs to the server
       let data = (new XMLSerializer()).serializeToString(this.$refs.deck);
       fetch('upload', {
         method: 'post',
         headers: {'Content-Type': 'application/json'},
         body: JSON.stringify({body: data, json: this.deckInfo})
       });
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
