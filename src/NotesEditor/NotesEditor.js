require("./ace-mode-notes.js");
const Document = ace.require("ace/document").Document;
const SimpleEvent = require("./../SimpleEvent").SimpleEvent;

class NotesEditor {
    constructor(editorElem) {
        this.editorElem = editorElem;
        this.editor = ace.edit(editorElem);
        this.editor.setTheme("ace/theme/textmate");

        this.eventDocumentChange = new SimpleEvent();
        this.editor.on("change", () => this.eventDocumentChange.trigger())
    }

    setContent(fileContent) {
        const session = ace.createEditSession(new Document(fileContent));
        this.editor.setSession(session);
        this.editor.getSession().setMode("ace/mode/notes");
        this.editor.setOptions({
            fontFamily: "Consolas, 'Courier New', monospace",
            fontSize: "14px"
        });
        
        this.setupDisplayImagesForNewDocument();
        this.setupClickTogglesAndClickLinks();
    }

    getContent() {
        return this.editor.getSession().getValue();
    }

    show() {
        $(this.editorElem).css("z-index", "10");
    }

    hide() {
        $(this.editorElem).css("z-index", "1");
    }

    focus() {
        this.editor.focus();
    }

    destroy() {
        this.editor.destroy();
        $(this.editorElem).remove();
    }

    setupDisplayImagesForNewDocument() {
        const LineWidgets = ace.require("ace/line_widgets").LineWidgets;

        const session = this.editor.session;
        if (!session.widgetManager) {
            session.widgetManager = new LineWidgets(session);
            session.widgetManager.attach(this.editor);
        }

        function displayImagesInLine(row) {
            const linkTokens = session.getTokens(row).filter((token) => token.type == "link");
            const hasToggleOpen = session.getTokens(row).filter((token) => token.type == "toggle_open").length > 0;

            if (session.lineWidgets && session.lineWidgets[row]) {
                session.widgetManager.removeLineWidget(session.lineWidgets[row]);
            }

            if (linkTokens.length > 0 && hasToggleOpen) {
                const token = linkTokens[0];
                session.widgetManager.addLineWidget({
                    row: row, 
                    fixedWidth: true,
                    coverGutter: false,
                    el: $("<div class='inline-image'><img src='"+token.value+"'></div>")[0],
                    type: "inline images"
                })
            }
        }
        const rowCount = session.getLength();
        for (let i=0; i<rowCount; i++) {
            displayImagesInLine(i);
        }
        session.on('change', function(change) {
            const rowStart = change.start.row;
            const rowEnd = change.end.row;
            for (let i=rowStart; i<=rowEnd; i++) {
                displayImagesInLine(i);
            }
        });
    }

    setupClickTogglesAndClickLinks() {
        const {shell} = require('electron')
        const multiSelectOnMouseDown = ace.require("ace/mouse/multi_select_handler").onMouseDown;
        const Range = ace.require("ace/range").Range;
        const session = this.editor.session;

        this.editor.off("mousedown", multiSelectOnMouseDown)
        this.editor.on("mousedown", function(event){
            if ((event.getAccelKey() && event.getButton() == 0) || event.getButton() == 2) {
                const docPos = event.getDocumentPosition();
                const token = session.getTokenAt(docPos.row, docPos.column);

                if(token && token.type == "link"){
                    shell.openExternal(token.value);
                    event.preventDefault();
                    event.stopPropagation();
                    return;
                }

                if(token && token.type == "toggle_open"){
                    session.replace(new Range(docPos.row, token.start, docPos.row, token.start+3), "[+]")
                    event.preventDefault();
                    event.stopPropagation();
                    return;
                }
                if(token && token.type == "toggle_close"){
                    session.replace(new Range(docPos.row, token.start, docPos.row, token.start+3), "[-]")
                    event.preventDefault();
                    event.stopPropagation();
                    return;
                }

                if(token && token.type == "task_todo"){
                    const replacement = (token.value[0] === " " ? " " : "") + "DONE ";
                    session.replace(new Range(docPos.row, token.start, docPos.row, token.start+token.value.length), replacement)
                    event.preventDefault();
                    event.stopPropagation();
                    return;
                }
                if(token && token.type == "task_done"){
                    const replacement = (token.value[0] === " " ? " " : "") + "WAITING ";
                    session.replace(new Range(docPos.row, token.start, docPos.row, token.start+token.value.length), replacement)
                    event.preventDefault();
                    event.stopPropagation();
                    return;
                }
                if(token && token.type == "task_waiting"){
                    const replacement = (token.value[0] === " " ? " " : "") + "TODO ";
                    session.replace(new Range(docPos.row, token.start, docPos.row, token.start+token.value.length), replacement)
                    event.preventDefault();
                    event.stopPropagation();
                    return;
                }
            }
            return true;
        });
        this.editor.on("mousedown", multiSelectOnMouseDown)
    }
}

exports.NotesEditor = NotesEditor;