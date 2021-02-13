<template>
  <div>
    <headful :title="'Editor|' + deckInfo.meta.name"> </headful>
    <div id="controls">
      <div>
        <button type="button" @click="upload">Save Deck</button>
        <Loader :loading="uploading"></Loader>
        Download:
        <a
          class="download"
          :href="downloadJSON(deckInfo)"
          :download="deckInfo.meta.name + '.input.json'"
        >
          Input JSON
        </a>
        <a
          class="download"
          :href="downloadYAML(deckInfo)"
          :download="deckInfo.meta.name + '.input.yaml'"
        >
          Input YAML
        </a>
        <a
          class="download"
          :href="downloadJSON(makeTTSJSON())"
          :download="deckInfo.meta.name + '.tts.json'"
        >
          Tabletop Sim Output JSON
        </a>
        <a
          class="download"
          :href="`/decks/${deckID}.png`"
          :download="deckInfo.meta.name + '.png'"
        >
          Deck PNG
        </a>
      </div>

      <div>
        <label>
          Upload JSON: WARNING: WILL CLEAR DECK
          <input ref="jsonUpload" type="file" />
        </label>
        <button type="button" @click="jsonUpload">Load</button>
      </div>

      <div>
        <label>
          Deck Name: <input type="text" v-model="deckInfo.meta.name" />
        </label>
        <label>
          Deck Type:
          <select v-model="deckInfo.meta.type">
            <option
              v-for="deckType in Object.keys(templates)"
              :value="deckType"
            >
              {{ deckType }}
            </option>
          </select>
        </label>
      </div>
    </div>

    <div v-if="deckInfo.meta.type">
      <label>
        New Card Type:
        <select v-model="newCardType">
          <option
            v-for="cardType in Object.keys(templates[deckInfo.meta.type])"
            :value="cardType"
          >
            {{ cardType }}
          </option>
        </select>
      </label>
      <button type="button" @click="addCard">Add New Card</button>
    </div>

    <CSSEditor v-model="deckInfo.css"> </CSSEditor>

    <CardEditor
      v-if="selected"
      class="cardEditor"
      :card="selected.card"
      :props="templates[deckInfo.meta.type][selected.type]"
      @close="selected = null"
    >
    </CardEditor>

    <Deck ref="deck" :deckInfo="deckInfo" @select="selected = $event"> </Deck>
  </div>
</template>

<script>
import html2canvas from 'html2canvas';
import yaml from 'js-yaml';

import Deck from './Deck.vue';
import CardEditor from './CardEditor.vue';
import CSSEditor from './CSSEditor.vue';
import Loader from './Loader.vue';

import templates from './template/*/input.yaml';
import tts_templates from './template/tts/*.json';

export default {
  name: 'Editor',
  components: { Deck, CardEditor, CSSEditor, Loader },

  props: ['deckID'],
  data() {
    return {
      uploading: false,
      selected: null,
      templates: templates,
      newCardType: '',
      deckInfo: { meta: { name: '', type: '', css: '' }, cards: {} },
    };
  },

  created() {
    if (this.deckID !== 'new') {
      fetch('/decks/' + this.deckID + '.json')
        .then((r) => r.json())
        .then((j) => (this.deckInfo = j.deck))
        .catch((err) => console.log('did not get old JSON, starting new deck'));
    }

    /* window.addEventListener(
     *   'beforeunload', e => e.returnValue = "Unsaved changes blah blah"); */
  },

  watch: {
    'deckInfo.css'(newVal) {
      if (!newVal) newVal = '';
      let el = document.querySelector('#injectedStyle');
      if (!el) {
        el = document.body.appendChild(document.createElement('style'));
        el.id = 'injectedStyle';
      }
      el.innerHTML = newVal;
    },
  },

  methods: {
    // deck JSON uploader
    jsonUpload(event) {
      let files = this.$refs.jsonUpload.files;
      let reader = new FileReader();
      reader.onload = (e) => (this.deckInfo = yaml.safeLoad(e.target.result));
      reader.readAsText(files[0]);
    },

    addCard(event) {
      let newCard = {};
      (this.deckInfo.cards[this.newCardType] =
        this.deckInfo.cards[this.newCardType] || []).push(newCard);
      this.selected = {
        card: newCard,
        type: this.newCardType,
      };
    },

    downloadJSON(json) {
      return (
        'data:application/json;charset=utf-8,' +
        encodeURIComponent(JSON.stringify(json))
      );
    },

    downloadYAML(json) {
      return (
        'data:application/x-yaml;charset=utf-8,' +
        encodeURIComponent(yaml.dump(json))
      );
    },

    makeTTSJSON() {
      // make a copy
      let deckOut = JSON.parse(JSON.stringify(tts_templates['deck']));
      deckOut.ObjectStates[0].Nickname = this.deckInfo.meta.name;

      let index = 100;
      deckOut.ObjectStates[0].ContainedObjects = Object.keys(
        this.deckInfo.cards
      ).flatMap((cardType) =>
        this.deckInfo.cards[cardType].flatMap((card) => {
          let cardOut = {
            ...JSON.parse(JSON.stringify(tts_templates['card'])),
            Nickname: card.name,
            Description: card.keywords,
            CardID: index,
          };

          deckOut.ObjectStates[0].DeckIDs.push(
            ...Array(card.count || 1).fill(index)
          );
          index++;

          if (card.back) {
            cardOut.States = {
              2: {
                ...JSON.parse(JSON.stringify(tts_templates['card'])),
                Nickname: card.back.name,
                Description: card.back.keywords,
                CardID: index,
              },
            };
            index++;
          }
          return Array(card.count || 1).fill(cardOut);
        })
      );

      let cardCount = index - 100;
      let columns = Math.ceil(Math.sqrt(cardCount));
      Object.assign(deckOut.ObjectStates[0].CustomDeck['1'], {
        NumWidth: columns,
        NumHeight: Math.ceil(cardCount / columns),
        FaceURL: `${location.origin}/decks/${this.deckID}.png`,
        BackURL:
          'http://cloud-3.steamusercontent.com/ugc/156906385556221451/CE2C3AFE1759790CB0B532FFD636D05A99EC91F4/',
      });

      return deckOut;
    },

    upload() {
      this.uploading = true;

      // TODO: remove this nasty hack
      function bindStyles(doc) {
        console.log(doc);
        // get existing styles from CSS...
        let style = Array.from(document.styleSheets)
          .flatMap((sheet) => Array.from(sheet.cssRules))
          .map((rule) => rule.cssText)
          .join('\n');
        // ...and jam them into a <style> in each foreignObject
        doc.querySelectorAll('foreignObject').forEach((o) => {
          let styleElement = o.appendChild(document.createElement('style'));
          styleElement.innerHTML = style;
        });
      }

      let node = this.$refs.deck.$el;
      html2canvas(node, {
        scale: 2,
        backgroundColor: 'black',
        onclone: bindStyles,
      })
        .then((canvas) => canvas.toDataURL('image/png'))
        .then((image) =>
          // POST the inputed json to the server
          fetch('/upload', {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              deck: this.deckInfo,
              _id: this.deckID === 'new' ? undefined : this.deckID,
              image: image,
            }),
          })
        )
        .then((r) => r.json())
        .then((j) => {
          this.$router.replace('/edit/' + j.id);
          this.uploading = false;
        })
        .catch((err) => console.log('Failed to upload' + err));
    },
  },
};
</script>

<style>
.cardEditor {
  position: fixed;
  top: 0;
  right: 0;
  background-color: gray;
  padding: 10px;
  border-radius: 3px;
  max-width: 40%;
}

.close-editor {
  float: right;
}

a.download {
  display: inline-block;
  margin-bottom: 0.2em;
  background-color: #1976d2;
  color: white;
  text-decoration: none;
  padding: 0.2em 0.4em;
}

a.download:hover {
  background-color: #1565c0;
}
</style>
