'use babel';

import PydocView from './pydoc-view';
import { CompositeDisposable } from 'atom';

var meta, notification;
meta = require("../package.json");

var word = "[\\w\\]\\[]+";
var variable_pair = `${word}:\\s*${word}\\s*.*`;
var variable_series = `${variable_pair}(?:,\\s*${variable_pair})*`;
var regex = new RegExp(`def (?<method_name>${word})\\s*\\((${variable_series})?\\)\\s*->\\s*(?<return_type>${word}):`);

function parse_variables(variables_raw) {
  variables_list = []
  while (variables_raw != "") {
    // find variable name
    var curr_name = null;
    var curr_type = null;
    var curr_default = null;
    var has_default = false;

    var param_type_delimiter_pos = variables_raw.indexOf(":");
    curr_name = variables_raw.substring(0, param_type_delimiter_pos).trim();
    variables_raw = variables_raw.substring(param_type_delimiter_pos+1).trim();

    // find variable type
    var next_eq = variables_raw.indexOf("=");
    var next_comma_for_type = variables_raw.indexOf(",");
    var end_of_var_type_pos;
    if ((next_eq != -1) &&
          ( next_eq < next_comma_for_type ||
            next_comma_for_type == -1
          )
    ) {
      has_default = true;
      end_of_var_type_pos = next_eq;
    } else {
      end_of_var_type_pos = next_comma_for_type;
    }

    if (end_of_var_type_pos != -1) {
      curr_type = variables_raw.substring(0, end_of_var_type_pos).trim();
      variables_raw = variables_raw.substring(end_of_var_type_pos).trim();
    } else {
      curr_type = variables_raw.trim();
      variables_raw = ""
      has_default = false
    }


    if (has_default) {
      // remove the equals
      variables_raw = variables_raw.substring(1).trim();
      // find variable default value

      const LITERAL_DELIMITERS = ["\'", ("\"")]
      const OBJ_DELIMITERS = {"{": "}", "(": ")"}
      var currLiteral = null
      var objectStack = []

      var i = 0
      var next_char = variables_raw.charAt(i);
      var end_of_value_type_pos;
      while(!(next_char == "," && currLiteral == null && objectStack.length == 0) && (i < variables_raw.length)) {
        if (currLiteral != null) {
          // if in literal, try to get out if matches current literal
          if (next_char == currLiteral) {
            currLiteral = null
          }
        } else if (LITERAL_DELIMITERS.includes(next_char)) {
          currLiteral = next_char
        }

        if (currLiteral == null) {
          if (next_char in OBJ_DELIMITERS) {
            objectStack.unshift(next_char)
          } else if (objectStack.length != 0 && OBJ_DELIMITERS[objectStack[0]] == next_char) {
            // try to escape the inner most nested
            objectStack.shift()
          }
        }

        i++;
        next_char = variables_raw.charAt(i);
      }

      curr_default = variables_raw.substring(0, i);
      variables_raw = variables_raw.substring(i+1).trim()

    } else {
      var next_comma = variables_raw.indexOf(",")
      variables_raw = variables_raw.substring(next_comma+1).trim()
    }

    variables_list.push([curr_name, curr_type, curr_default])


  }
  return variables_list
}




export default {

  pydocView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.pydocView = new PydocView(state.pydocViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.pydocView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that comments this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'pydoc:comment': () => this.comment()
    }));
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.pydocView.destroy();
  },

  serialize() {
    return {
      pydocViewState: this.pydocView.serialize()
    };
  },

  error(msg, code) {
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
  },

  comment() {
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

      if (!regex.test(selection)) {
        this.error("Please match method header to expected format. ")
        return
      }

      var match = regex.exec(selection);
      var fn_name = match[1]
      var variables = null;
      var ret_type = match[3];

      if (match[2] !== undefined) {
        variables = parse_variables(match[2])
        console.log(variables);
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
          if (variable[2]) {
            INPUT_TEXT += ` - Default: ${variable[2]}`
          }
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
