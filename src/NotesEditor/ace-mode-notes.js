ace.define("ace/mode/notes",["require","exports","module"], function (require, exports, module) {

var oop = require("ace/lib/oop");
var MarkdownMode = require("ace/mode/markdown").Mode;
var TextMode = require("ace/mode/text").Mode;
var MarkdownHighlightRules = require("ace/mode/markdown_highlight_rules").MarkdownHighlightRules;
var TextHighlightRules = require("ace/mode/text_highlight_rules").TextHighlightRules;

var NotesHighlightRules = function() {
    TextHighlightRules.call(this);
    this.$rules = {
        "start": [
            {
                token: function(value) {
                    return "heading.1";
                },
                regex: /^#(?=\s*[^ #]|\s+#.)/,
                next: "heading.1"
            }, {
                token: function(value) {
                    return "heading.2";
                },
                regex: /^##(?=\s*[^ #]|\s+#.)/,
                next: "heading.2"
            }, {
                token: function(value) {
                    return "heading.3";
                },
                regex: /^###(?=\s*[^ #]|\s+#.)/,
                next: "heading.3"
            }, {
                token: function(value) {
                    return "heading.4";
                },
                regex: /^####(?=\s*[^ #]|\s+#.)/,
                next: "heading.4"
            }, {
                token: "link",
                regex: /(file|http|https):\/\//,
                next: "url",
            }, {
                token: "task_todo",
                regex: /(\s|^)TODO\s/,
            }, {
                token: "task_waiting",
                regex: /(\s|^)WAIT(ING)?\s/,
            }, {
                token: "task_done",
                regex: /(\s|^)DONE\s/,
            }, {
                token: "toggle_open",
                regex: /\[\-\]/,
            }, {
                token: "toggle_close",
                regex: /\[\+\]/,
            }, {
                defaultToken : "text",
            }
        ],
        "heading.1": [
            {
                regex: "$",
                next : "start",
            }, {
                defaultToken : "heading.1"
            }
        ],
        "heading.2": [
            {
                regex: "$",
                next : "start",
            }, {
                defaultToken : "heading.2"
            }
        ],
        "heading.3": [
            {
                regex: "$",
                next : "start",
            }, {
                defaultToken : "heading.3"
            }
        ],
        "heading.4": [
            {
                regex: "$",
                next : "start",
            }, {
                defaultToken : "heading.4"
            }
        ],
        "url": [
            {
                regex: /$|\s/,
                next: "start",
                token: "text"
            }, {
                defaultToken : "link",
            }
        ],
    };
};
oop.inherits(NotesHighlightRules, TextHighlightRules);


var Mode = function() {
    TextMode.call(this);
    this.HighlightRules = NotesHighlightRules;
};
oop.inherits(Mode, TextMode);

exports.Mode = Mode;

})