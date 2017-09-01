class SimpleEvent {
    constructor() {
        this.listeners = [];
    }

    listen(listener) {
        this.listeners.push(listener);
    }

    trigger() {
        this.listeners.forEach((listener) => {
            listener.apply(null, arguments);
        })
    }
}

exports.SimpleEvent = SimpleEvent;