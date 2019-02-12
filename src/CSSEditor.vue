<template>
  <codemirror
    v-on="$listeners"
    class="cssEditor"
    :value="value"
    :options="cmOptions"
  >
  </codemirror>
</template>

<script>
import { codemirror } from 'vue-codemirror';
import 'codemirror/mode/css/css.js';
import 'codemirror/addon/lint/css-lint.js';
import 'codemirror/addon/selection/active-line.js';
import 'codemirror/addon/display/placeholder.js';
import 'codemirror/addon/edit/closetag.js';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/base16-dark.css';

export default {
  name: 'CardEditor',
  components: { codemirror },

  props: ['value'],
  data() {
    return {
      cmOptions: {
        mode: 'text/css',
        placeholder: 'Insert CSS here',
        line: true,
        styleActiveLine: true,
        autoCloseTags: true,
        lineWrapping: true,
        lineNumbers: true,
        theme: 'base16-dark',
        lint: true,
        viewportMargin: Infinity,
        gutters: ['CodeMirror-lint-markers'],
      },
    };
  },
};
</script>

<style>
.cssEditor .CodeMirror {
  overflow-y: auto;
  height: fit-content;
  width: fit-content;
}

.cssEditor .CodeMirror-scroll {
  max-height: 10em;
}
</style>
