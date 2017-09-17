const {nativeImage} = require('electron')
const {clipboard} = require('electron')
const SimpleEvent = require("./SimpleEvent").SimpleEvent;

class ImageInserter {
    constructor(elemModal) {
        this.elemModal = $(elemModal);
        this.elemModal.attr('tabindex', -1);

        this.eventImageInsert = new SimpleEvent();
        this.eventImageInsertPNG = new SimpleEvent();

        this.elemModal.find(".buttonInsert").click(() => {
            const croppedCanvas = this.cropper.getCroppedCanvas({
                imageSmoothingEnabled: false,
                imageSmoothingQuality: 'high',
            });
            const image = nativeImage.createFromDataURL(croppedCanvas.toDataURL());
            this.eventImageInsert.trigger(image);

            this.elemModal.modal("hide");
        });

        this.elemModal.find(".buttonInsertPNG").click(() => {
            const croppedCanvas = this.cropper.getCroppedCanvas({
                imageSmoothingEnabled: false,
                imageSmoothingQuality: 'high',
            });
            const image = nativeImage.createFromDataURL(croppedCanvas.toDataURL());
            this.eventImageInsertPNG.trigger(image);

            this.elemModal.modal("hide");
        });

        this.eventClose = new SimpleEvent();
        this.elemModal.on("hidden.bs.modal", () => this.eventClose.trigger())
    }

    show(image) {
        // cleanup old cropper
        if (this.cropper) {
            this.cropper.destroy();
            this.elemModal.find(".modal-body").html("");
        }
        
        // show
        this.elemModal.modal({
            show: true,
            keyboard: true,
        });

        // setup image
        let img = $("<img class='imageInserterImage' src='"+image.toDataURL()+"'>>");
        this.elemModal.find(".modal-body").append(img);

        // setup cropperjs
        this.cropper = new Cropper(img[0], {
            viewMode: 0,
        });
        setTimeout(() => {
            this.cropper.setDragMode("crop");
            this.cropper.clear()
        }, 0);
    }

    copyToClipboard() {
        const croppedCanvas = this.cropper.getCroppedCanvas({
            imageSmoothingEnabled: false,
            imageSmoothingQuality: 'high',
        });
        const image = nativeImage.createFromDataURL(croppedCanvas.toDataURL());
        clipboard.writeImage(image);
    }

}

exports.ImageInserter = ImageInserter;