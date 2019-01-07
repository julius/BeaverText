const NotesFile = require("./NotesFile.js").NotesFile;
const NotesEditor = require("./NotesEditor/NotesEditor.js").NotesEditor;
const ImageDisplay = require("./ImageDisplay.js").ImageDisplay;
const ImageInserter = require("./ImageInserter.js").ImageInserter;
const fs = require("fs");
const path = require("path");
const remote = require('electron').remote;
const {dialog} = require('electron').remote;
const {Menu, MenuItem} = require('electron').remote;
const {clipboard} = require('electron')
const {nativeImage} = require('electron')

class NotesApp {
    constructor() {
        this.elemEditorSpace = $(".editorSpace");
        this.elemTabs = $(".nav.nav-tabs");
        this.files = [];
        this.activeFile = null;

        this.setupImageInserter();
        this.setupImageDisplay();
        this.setupMenu();
        this.setupDragDropHandler();
        this.loadSession();
        this.setupUnsavedFilesChecker();
    }

    tryPastingImageFromClipboard() {
        const image = clipboard.readImage();
        if (image.isEmpty()) {
            return null;
        }
        this.imageInserter.show(image);
    }

    setupImageDisplay() {
        this.imageDisplay = new ImageDisplay($(".modal.imageDisplay"));
        this.imageDisplay.eventClose.listen(() => {
            if (!this.activeFile) return;
            this.activeFile.notesEditor.focus();            
        })
    }

    setupImageInserter() {
        this.imageInserter = new ImageInserter($(".modal.imageInserter"));
        this.imageInserter.eventClose.listen(() => {
            if (!this.activeFile) return;
            this.activeFile.notesEditor.focus();            
        })

        const shortId = () => {
            const rnd = Math.floor(Math.random() * 1000000);
            return rnd.toString(36);
        }

        const uniqueFileName = (dir, fileExt) => {
            const fileName = shortId() + fileExt;
            const filePath = path.join(dir, fileName);
            if (fs.existsSync(filePath)) {
                return uniqueFileName(dir, fileExt);
            }
            return fileName;
        }

        const insertImageIntoEditor = (fileName) => {
            const urlImages = "file://__dir__/" + path.basename(this.activeFile.filePath) + "-images/" + fileName;
            const insertText = "[-] " + urlImages;
            this.activeFile.notesEditor.insertLineAtCursor(insertText);
        }

        this.imageInserter.eventImageInsert.listen((image) => {
            if (!this.activeFile) return;
            const dirNoteFile = path.dirname(this.activeFile.filePath);
            const dirImages = path.join(dirNoteFile, path.basename(this.activeFile.filePath) + "-images");
            const fileName = uniqueFileName(dirImages, ".jpg");
            const filePath = path.join(dirImages, fileName);
            if (!fs.existsSync(dirImages)) fs.mkdirSync(dirImages);            
            fs.writeFileSync(filePath, image.toJPEG(80));
            insertImageIntoEditor(fileName);
        })
        this.imageInserter.eventImageInsertPNG.listen((image) => {
            if (!this.activeFile) return;
            const dirNoteFile = path.dirname(this.activeFile.filePath);
            const dirImages = path.join(dirNoteFile, path.basename(this.activeFile.filePath) + "-images");
            const fileName = uniqueFileName(dirImages, ".png");
            const filePath = path.join(dirImages, fileName);
            if (!fs.existsSync(dirImages)) fs.mkdirSync(dirImages);
            fs.writeFileSync(filePath, image.toPNG());
            insertImageIntoEditor(fileName);
        })
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
                        accelerator: "CmdOrCtrl+O",
                        click: () => this.handleButtonOpen(),
                    },
                    {
                        label: "Save File",
                        accelerator: "CmdOrCtrl+S",
                        click: () => this.handleButtonSave(),
                    },
                    {
                        label: "Close File",
                        accelerator: "CmdOrCtrl+W",
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
                label: "Edit",
                submenu: [
                  {
                    label: "Undo",
                    accelerator: "CmdOrCtrl+Z",
                    selector: "undo:"
                  },
                  {
                    label: "Redo",
                    accelerator: "Shift+CmdOrCtrl+Z",
                    selector: "redo:"
                  },
                  {
                    type: "separator"
                  },
                  {
                    label: "Cut",
                    accelerator: "CmdOrCtrl+X",
                    selector: "cut:"
                  },
                  {
                    label: "Copy",
                    accelerator: "CmdOrCtrl+C",
                    selector: "copy:"
                  },
                  {
                    label: "Paste",
                    accelerator: "CmdOrCtrl+V",
                    selector: "paste:"
                  },
                  {
                    label: "Select All",
                    accelerator: "CmdOrCtrl+A",
                    selector: "selectAll:"
                  }
                ]
              },
            {
                label: "Tabs",
                submenu: [
                    {
                        label: "Next Tab",
                        accelerator: "CmdOrCtrl+PageDown",
                        click: () => this.gotoNextTab(),
                    },
                    {
                        label: "Next Tab",
                        accelerator: "CmdOrCtrl+Tab",
                        click: () => this.gotoNextTab(),
                    },
                    {
                        label: "Prev Tab",
                        accelerator: "CmdOrCtrl+PageUp",
                        click: () => this.gotoPrevTab(),
                    },
                    {
                        label: "Prev Tab",
                        accelerator: "CmdOrCtrl+Shift+Tab",
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
        notesFile.eventClosed.listen(() => this.handleFileClosed(notesFile));
        notesFile.eventRequestImageDisplay.listen((imageUrl) => this.imageDisplay.show(imageUrl));
        notesFile.eventPaste.listen(() => this.tryPastingImageFromClipboard());

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

    setupUnsavedFilesChecker() {
        const originalTitle = document.title;

        setInterval(() => {
            let filesUnsaved = false;
            this.files.forEach((f) => {
                if (f.isUnsaved) {
                    filesUnsaved = true;
                }
            });

            if (filesUnsaved) {
                document.title = "* " + originalTitle;
            } else {
                document.title = originalTitle;
            }
        }, 500);
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
            for (let f of ev.dataTransfer.files) {
                const isImageFile = [".jpg", ".jpeg", ".png"].indexOf(path.extname(f.path).toLowerCase()) !== -1;

                if (isImageFile) {
                    const image = nativeImage.createFromPath(f.path);
                    if (!image || image.isEmpty()) {
                        alert("Failed to load image from path: " + f.path);
                        return;
                    }
                    this.imageInserter.show(image);
                } else {
                    this.openFile(f.path);
                }
            }
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