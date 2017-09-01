const fs = require("fs");
const SimpleEvent = require("./SimpleEvent").SimpleEvent;

class NotesFile {
    constructor(filePath, elemTab, notesEditor) {
        this.filePath = filePath;
        this.loadedFile = fs.readFileSync(filePath, "utf-8");
        this.elemTab = elemTab;
        this.notesEditor = notesEditor;

        this.eventRequestActiveByTabClick = new SimpleEvent();
        this.eventClosed = new SimpleEvent();

        this.elemTab.find(".title").click(() => this.eventRequestActiveByTabClick.trigger());
        this.elemTab.find(".close-saved").click(() => this.close());
        this.elemTab.find(".close-unsaved").click(() => this.closeUnsaved());

        this.handleSaved();
        this.notesEditor.setContent(this.loadedFile);
        this.notesEditor.hide();

        this.notesEditor.eventDocumentChange.listen(() => {
            this.handleUnsaved();
            this.checkIfChanged();
        })

        this.setupFileWatcher();
    }

    checkIfChanged() {
        if (this.changeCheckTimeout) {
            clearTimeout(this.changeCheckTimeout);
        }
        this.changeCheckTimeout = setTimeout(() => {
            const editorText = this.notesEditor.getContent();
            if (this.loadedFile !== editorText) {
                this.handleUnsaved();
            } else {
                this.handleSaved();
            }
        }, 500);
    }

    handleUnsaved() {
        this.elemTab.find(".close-saved").hide();
        this.elemTab.find(".close-unsaved").show();
    }
    handleSaved() {
        this.elemTab.find(".close-unsaved").hide();
        this.elemTab.find(".close-saved").show();
    }

    setActive() {
        this.notesEditor.show();
        this.notesEditor.focus();
        this.elemTab.addClass("active");
    }

    setInactive() {
        this.notesEditor.hide();
        this.elemTab.removeClass("active");
    }

    save() {
        const editorText = this.notesEditor.getContent();
        this.loadedFile = editorText;
        fs.writeFileSync(this.filePath, editorText, "utf-8");
        this.handleSaved();
    }

    close() {
        this.notesEditor.destroy();
        this.elemTab.tooltip("hide");
        this.elemTab.remove();
        this.eventClosed.trigger();
        this.fileWatcher.close();
    }

    setupFileWatcher() {
        this.fileWatcher = fs.watch(this.filePath, () => {
            if (!fs.existsSync(this.filePath)) {
                console.log("FILE DELETED ON DISK => CLOSE? SAVE AS?");
                return;
            }
            const currentFileContent = fs.readFileSync(this.filePath, "utf-8");
            if (currentFileContent !== this.loadedFile) {
                console.log("FILE CHANGED ON DISK => RELOAD?")
            }
        })
    }
}

exports.NotesFile = NotesFile;