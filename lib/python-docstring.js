'use babel';

import PythonDocstringView from './pydoc-view';
import { CompositeDisposable } from 'atom';

var meta, notification;
meta = require("../package.json");


export default {

  pythonDocstringView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.pythonDocstringView = new PythonDocstringView(state.pythonDocstringViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.pythonDocstringView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that adds doc string this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'pydoc:comment': () => this.comment()
    }));
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.pythonDocstringView.destroy();
  },

  serialize() {
    return {
      pythonDocstringViewState: this.pythonDocstringView.serialize()
    };
  },



  comment() {
    function error(msg, code) {
      notification = atom.notifications.addError(msg, {
        dismissable: true,
        description: "\`def fn([var: var_type]*) -> return_type\`",
        buttons: [
          {
            text: "Dismisss",
            onDidClick: function() {
              return notification.dismiss();
            }
          }
        ]
      });
    }


    let editor
    if (editor = atom.workspace.getActiveTextEditor()) {
      editor.selectToBeginningOfLine()

      function deselect() {
        _origin = editor.getCursorScreenPosition()
        editor.setSelectedBufferRange([_origin,_origin])
      }

      while (!editor.getSelectedText().startsWith("def")) {
        editor.selectUp()
      }
      deselect()
      editor.selectToEndOfLine()

      let selection = editor.getSelectedText()

      // Validate that method header fits Schema

      word = "[\\w\\]\\[]+";
      variable_pair = `${word}:\\s*${word}\\s*`;
      variable_series = `${variable_pair}(?:,\\s*${variable_pair})*`;
      regex = new RegExp(`def (?<method_name>${word})\\s*\\((${variable_series})?\\)\\s*->\\s*(?<return_type>${word}):`);

      if (!regex.test(selection)) {
        error("Please match method header to expected format. ")
        return
      }

      var match = regex.exec(selection);
      console.log(match);
      var fn_name = match[1]
      var variables = null;
      var ret_type = match[3];

      if (match[2] !== undefined) {
        variables = match[2].split(" ").join("").split(",")
        variables = variables.map(v => v.split(":"))
      }

      // Add Doc String Template

      var INPUT_TEXT = "\n"

      var docstring_tag = "\"\"\""
      function skipLine(cnt=2) {
        INPUT_TEXT += "\t" + "\n".repeat(cnt)
      }
      INPUT_TEXT += "\t" + docstring_tag
      INPUT_TEXT += "SHORT_DESCRIPTION"
      skipLine()
      INPUT_TEXT += "\t..."
      skipLine()
      if (variables != null) {
        INPUT_TEXT += "\tArgs:"
        skipLine(1)
        for (var variable of variables) {
          INPUT_TEXT += `\t\t${variable[0]} (${variable[1]}): ${variable[0].toUpperCase()}_DESCRIPTION`
          skipLine(1)
        }
        skipLine(1)
      }


      if (ret_type != "None") {
        INPUT_TEXT += "\tReturns:"
        skipLine(1)
        INPUT_TEXT += `\t\tA ${ret_type} ...`
        skipLine()
        INPUT_TEXT += "\t\tFor example:\n"
        INPUT_TEXT += "\t\t\tSAMPLE_RESPONSE"
        skipLine()
      }

      INPUT_TEXT += "\tRaises:"
      skipLine(1)
      INPUT_TEXT += "\t\tErrorType: Error details"
      skipLine(1)
      INPUT_TEXT += "\t" + docstring_tag

      editor.moveToEndOfLine()
      editor.insertText(INPUT_TEXT)

    }
  }

};
