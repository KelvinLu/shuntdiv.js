ShuntDiv = (function(){
    ShuntDiv = function(frameContainer, transitions, options) {
        // Load options
        this.options = {
            'default': null,
        };

        if ((options) && (options instanceof Object)) for (option in options) if (options.hasOwnProperty(option))
            this.options[option] = options[option];

        // Collect frames, set initial CSS, and remove from DOM
        this._container = frameContainer;
        this._frames = [];
        this._transitionLock = false;

        for (var i = frameContainer.children.length - 1; i >= 0; i--)
            if ((frame = frameContainer.children[i]).hasAttribute('shunt-frame')) {
                this._frames.push(frame);

                frame.style.position =  'absolute';
                frame.style.top =       0;
                frame.style.left =      0;
                frame.style.width =     '100%';
                frame.style.height =    '100%';

                frameContainer.removeChild(frame);
            }

        // Set container inital CSS
        frameContainer.style.position = 'relative';
        frameContainer.style.overflow = 'hidden';

        // Attach default frame
        if (this._frames)
            for (var i = this._frames.length - 1; i > 0; i--)
                if (this._frames[i].getAttribute('id') === this.options.default)
                    break;
            frameContainer.appendChild(this._frames[i]);

        // Create transitions with triggers
        this._transitions = transitions || [];
        for (var i = this._transitions.length - 1; i >= 0; i--)
            this._transitions[i].activate(this);
    }

    // A Transition object describes the relationship between two concrete 
    // frames, their Transform function, and a Trigger function for some
    // animation

    // Example: Transition initialization
    // new ShuntDiv.Transition('intro', 'info', 'exitSlideUp', 'click', {id: 'button-next'})

    var Transition = ShuntDiv.Transition = function(exitFrameId, enterFrameId, transform, trigger, triggerOptions) {
        this.exitFrameId =      exitFrameId;
        this.enterFrameId =     enterFrameId;
        this.transform =        transform;
        this.trigger =          trigger;
        this.triggerOptions =   triggerOptions;

        this.triggerElem =      undefined;
        this.callback =         undefined;  
    };

    Transition.prototype.activate = function(context) {
        exitFrame = enterFrame = undefined;

        for (var i = context._frames.length - 1; i >= 0; i--) {
            frame = context._frames[i];
            frameId = frame.getAttribute('id');

            if (frameId === this.exitFrameId) {
                exitFrame = frame;
            } else if (frameId === this.enterFrameId) {
                enterFrame = frame;
            }
        };

        triggerFunc = ShuntDiv.Triggers[this.trigger];
        transformFunc = ShuntDiv.Transforms[this.transform];

        if (!exitFrame && !enterFrame) return;
        if (!triggerFunc && !transformFunc) return;

        trigger = triggerFunc(context, transformFunc, exitFrame, enterFrame, this.triggerOptions);
        this.callback = trigger.elem;
        this.triggerElem = trigger.callback;
    };

    Transition.prototype.deactivate = function() {
        if (!this.triggerElem)
            this.triggerElem.removeEventListener(this.trigger, this.callback);
    };

    // A Trigger function adds an event listener to a concrete frame and
    // assigns a Transform callback.

    // Example: Trigger function signature
    // myTrigger = function(context, transformCallback, exitFrame, enterFrame, [eventArgs]*) { ... };

    var Triggers = ShuntDiv.Triggers = {
        'click': function(context, transformCallback, exitFrame, enterFrame, options) {
            if (clickElemId = options.id)
                triggerElem = exitFrame.querySelector('#' + clickElemId);
            else
                triggerElem = exitFrame;

            triggerCallback = function() {
                transformCallback(context, exitFrame, enterFrame);
            };

            triggerElem.addEventListener('click', triggerCallback);

            return {
                elem: triggerElem, 
                callback: triggerCallback,
            };
        },

        'keypress': function(context, transformCallback, exitFrame, enterFrame, options) {
            
        },
    };

    // A Transform function should take any two DOM elements and perform the
    // DOM rendering and CSS manipulation for some animation.
    // It is meant to be called when a Transition is triggered, performing
    // the grunt work.

    // Example: Transform fucntion signature
    // myTransform = function(context, exitFrame, enterFrame) { ... };

    var Transforms = ShuntDiv.Transforms = {
        'exitSlideUp': function(context, exitFrame, enterFrame) {
            if (context._transitionLock) return;
            context._transitionLock = true;

            exitFrame.parentNode.insertBefore(enterFrame, exitFrame);

            exitFrame.style['-webkit-animation'] = 'slide-up 0.5s ease-in';
            exitFrame.style['animation'] = 'slide-up 0.5s ease-in';

            setTimeout(function(){ 
                context._transitionLock = false; 
                exitFrame.parentNode.removeChild(exitFrame); 
                exitFrame.style['-webkit-animation'] = '';
                exitFrame.style['animation'] = '';
            }, 500);
        },
    };

    return ShuntDiv;
})();