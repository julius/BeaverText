const NotesFile = require("./NotesFile.js").NotesFile;
const NotesEditor = require("./NotesEditor/NotesEditor.js").NotesEditor;
const fs = require("fs");
const path = require("path");
const remote = require('electron').remote;
const {dialog} = require('electron').remote;
const {Menu, MenuItem} = require('electron').remote;

class NotesApp {
    constructor() {
        this.elemEditorSpace = $(".editorSpace");
        this.elemTabs = $(".nav.nav-tabs");
        this.files = [];
        this.activeFile = null;

        this.setupMenu();
        this.setupDragDropHandler();
        this.loadSession();
    }

    setupMenu() {
        // const menu = new Menu();
        // menu.append(new MenuItem({ label: "Open File", click: () => this.handleButtonOpen() }))
        const menu = Menu.buildFromTemplate([
            {
                label: "File",
                submenu: [
                    {
                        label: "Open File",
                        accelerator: "Ctrl+O",
                        click: () => this.handleButtonOpen(),
                    },
                    {
                        label: "Save File",
                        accelerator: "Ctrl+S",
                        click: () => this.handleButtonSave(),
                    },
                    {
                        label: "Close File",
                        accelerator: "Ctrl+W",
                        click: () => this.activeFile && this.activeFile.close(),
                    },
                    {type: 'separator'},
                    { 
                        label: "Exit",
                        click: () => remote.getCurrentWindow().close(),
                    },
                ]
            },
            {
                label: "Tabs",
                submenu: [
                    {
                        label: "Next Tab",
                        accelerator: "Ctrl+PageDown",
                        click: () => this.gotoNextTab(),
                    },
                    {
                        label: "Next Tab",
                        accelerator: "Ctrl+Tab",
                        click: () => this.gotoNextTab(),
                    },
                    {
                        label: "Prev Tab",
                        accelerator: "Ctrl+PageUp",
                        click: () => this.gotoPrevTab(),
                    },
                    {
                        label: "Prev Tab",
                        accelerator: "Ctrl+Shift+Tab",
                        click: () => this.gotoPrevTab(),
                    },
                ]
            },
            {
                label: 'Dev',
                submenu: [
                    {role: 'reload'},
                    {role: 'forcereload'},
                    {role: 'toggledevtools'},
                    {type: 'separator'},
                    {role: 'resetzoom'},
                    {role: 'zoomin'},
                    {role: 'zoomout'},
                    {type: 'separator'},
                    {role: 'togglefullscreen'}
                ]
            },
        ])
        Menu.setApplicationMenu(menu);
    }

    gotoNextTab() {
        if (!this.activeFile) return;
        let idx = this.files.indexOf(this.activeFile);
        idx = (idx + 1) % this.files.length;
        this.setActiveFile(this.files[idx]);
    }

    gotoPrevTab() {
        if (!this.activeFile) return;
        let idx = this.files.indexOf(this.activeFile);
        idx = (idx - 1);
        if (idx < 0) idx = this.files.length - 1;
        this.setActiveFile(this.files[idx]);
    }

    handleButtonOpen() {
        const filePaths = dialog.showOpenDialog({properties: ['openFile', 'multiSelections', 'createDirectory']});
        if (!filePaths) {
            return;
        }

        // open files
        filePaths.forEach((filePath) => this.openFile(filePath));
    }

    handleButtonSave() {
        if (!this.activeFile) {
            return;
        }
        this.activeFile.save();
    }

    openFile(filePath) {
        // check if file is already open in some tab
        const alreadyOpenFiles = this.files.filter((f) => f.filePath === filePath);
        if (alreadyOpenFiles.length > 0) {
            this.setActiveFile(alreadyOpenFiles[0]);
            return;
        }

        // create tab
        const title = path.basename(filePath);
        const elemTab = $("<li><span class='title'>"+title+"</a><span class='glyphicon glyphicon-remove close-saved'></span><span class='glyphicon glyphicon-stop close-unsaved'></span></li>");
        elemTab.tooltip({title: filePath, placement: "bottom", delay: { "show": 1000, "hide": 0 }});
        this.elemTabs.append(elemTab);

        // create editor
        const elemEditor = $("<div class='editor'></div>");
        this.elemEditorSpace.append(elemEditor);
        const notesEditor = new NotesEditor(elemEditor[0]);

        // create NotesFile
        const notesFile = new NotesFile(filePath, elemTab, notesEditor);
        this.files.push(notesFile);

        notesFile.eventRequestActiveByTabClick.listen(() => this.setActiveFile(notesFile));
        notesFile.eventClosed.listen(() => this.handleFileClosed(notesFile))
        this.setActiveFile(notesFile);
    }

    setActiveFile(activeFile) {
        if (activeFile) {
            this.files.forEach((file) => {
                if (file !== activeFile) file.setInactive();
            })
            activeFile.setActive();
        }
        this.activeFile = activeFile;
        this.saveSession();
    }

    handleFileClosed(notesFile) {
        this.files = this.files.filter((f) => f !== notesFile);
        if (this.files.length > 0) {
            this.setActiveFile(this.files[0]);
        } else {
            this.setActiveFile(null);
        }
    }

    setupDragDropHandler() {
        document.body.ondragover = (ev) => {
            return false;
        }
        document.body.ondragleave = (ev) => {
            return false;
        }
        document.body.ondragend = (ev) => {
            return false;
        }
        document.body.ondrop = (ev) => {
            ev.preventDefault();
            for (let f of ev.dataTransfer.files) this.openFile(f.path);
        }
    }

    saveSession() {
        const sessionData = {
            "filePaths": this.files.map((f) => f.filePath),
            "activeFile": this.activeFile ? this.activeFile.filePath : null,
        }
        localStorage.setItem("sessionData", JSON.stringify(sessionData));
    }

    loadSession() {
        const sessionDataRaw = localStorage.getItem("sessionData");
        if (!sessionDataRaw) {
            return;
        }

        const sessionData = JSON.parse(sessionDataRaw);
        sessionData.filePaths.forEach((filePath) => this.openFile(filePath));

        this.files.forEach((file) => file.filePath === sessionData.activeFile && this.setActiveFile(file));
    }
}

exports.NotesApp = NotesApp;