<template>
  <div>
    <button v-if="!nested" class="close-editor" @click="$emit('close')">
      X
    </button>
    <div v-for="(type, prop) in props">
      <label>
        {{ prop }}
        <form v-if="type === 'image'">
          <input type="file" accept="image/*" />
          <button type="button" @click="imageUpload($event, prop)">Load</button>
        </form>
        <codemirror
          v-else-if="type === 'textarea'"
          v-model="card[prop]"
          :options="cmOptions"
        >
        </codemirror>
        <CardEditor
          v-else-if="typeof type === 'object'"
          :card="card[prop]"
          :props="props[prop]"
          :nested="true"
        >
        </CardEditor>
        <input v-else :type="type" v-model="card[prop]" />
      </label>
    </div>
  </div>
</template>

<script>
import { codemirror } from 'vue-codemirror';
import 'codemirror/mode/htmlmixed/htmlmixed.js';
import 'codemirror/addon/lint/html-lint.js';
import 'codemirror/addon/selection/active-line.js';
import 'codemirror/addon/edit/closetag.js';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/base16-dark.css';

export default {
  name: 'CardEditor',
  components: { codemirror },

  props: ['card', 'props', 'nested'],
  data() {
    return {
      cmOptions: {
        mode: 'text/html',
        line: true,
        styleActiveLine: true,
        autoCloseTags: true,
        lineWrapping: true,
        lineNumbers: true,
        theme: 'base16-dark',
        lint: true,
        gutters: ['CodeMirror-lint-markers'],
      },
    };
  },

  created() {
    Object.keys(this.props)
      .filter(prop => typeof this.props[prop] === 'object')
      .forEach(prop => this.$set(this.card, prop, {}));
  },

  methods: {
    imageUpload(event, prop) {
      let reader = new FileReader();
      reader.onload = e => {
        this.card[prop] = e.target.result;
      };
      reader.readAsDataURL(event.target.form[0].files[0]);
    },
  },
};
</script>

<style>
.cardEditor .CodeMirror {
  height: auto;
}
</style>
