const {nativeImage} = require('electron')
const {clipboard} = require('electron')
const SimpleEvent = require("./SimpleEvent").SimpleEvent;

class ImageDisplay {
    constructor(elemModal) {
        this.elemModal = $(elemModal);
        this.elemModal.attr('tabindex', -1);

        this.elemModal.find(".buttonCopy").click(() => {
            this.copyToClipboard();
            this.elemModal.modal("hide");
        });

        this.eventClose = new SimpleEvent();
        this.elemModal.on("hidden.bs.modal", () => this.eventClose.trigger())
    }

    show(imageUrl) {
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
        this.elemModal.find(".modal-title").text(imageUrl);


        // setup image
        let img = $("<img class='imageDisplayImage'>");
        img.on("load", () => {

            // setup cropperjs
            this.cropper = new Cropper(img[0], {
                viewMode: 0,
                dragMode: "move",
                ready: () => {
                    this.cropper.clear()
                    this.cropper.setDragMode("move");
                }
            });
        })
        img.attr("src", imageUrl);
        this.elemModal.find(".modal-body").append(img);
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

exports.ImageDisplay = ImageDisplay;