ShuntDiv = (function(){
    ShuntDiv = function(frameContainer, transitions, options) {
        // Load options
        this.options = {
            'default': null,
            'saveWithHash': false,
        };

        if ((options) && (options instanceof Object)) for (option in options) if (options.hasOwnProperty(option))
            this.options[option] = options[option];

        // Collect frames, set initial CSS, and remove from DOM
        this._container = frameContainer;
        this._frames = [];
        this._stagedFrame = undefined;
        this._transitionLock = false;

        for (var i = frameContainer.children.length - 1; i >= 0; i--)
            if ((frame = frameContainer.children[i]).hasAttribute('shunt-frame')) {
                this._frames.push(frame);

                frame.style.position =  'absolute';
                frame.style.top =       0;
                frame.style.left =      0;
                frame.style.minWidth =     '100%';
                frame.style.minHeight =    '100%';
                frame.style['box-sizing'] = 'border-box';

                frameContainer.removeChild(frame);
            }

        // Set container inital CSS
        frameContainer.style.position = 'relative';
        frameContainer.style.overflow = this.options['overflow'] || 'hidden';

        // Attach default frame
        if (this._frames) {
            for (var i = this._frames.length - 1; i > 0; i--)
                if (this._frames[i].getAttribute('id') === this.options.default)
                    break;

            frameContainer.appendChild(this._stagedFrame = this._frames[i]);
        }

        // Create transitions with triggers
        this._transitions = [];
        for (var i = transitions.length - 1; i >= 0; i--)
            this.addTransition(transitions[i]);

        // Attach hash change listener
        if (this.options.saveWithHash) {
            if ((id = location.hash.slice(1)) && (!!id))
                this.showFrameById(id);

            window.addEventListener('hashchange', (function(event) {
                if ((id = location.hash.slice(1)) && (!!id) && (this._stagedFrame.getAttribute('id') != id))
                    this.showFrameById(id);
            }).bind(this));
        }
        
        // Attach swipe listener
        this._swipeChecker = new ShuntDiv.SwipeChecker(this._container);
    };

    ShuntDiv.prototype.addTransition = function(transitionObj) {
        if (this._transitions.indexOf(transitionObj) === -1)
        {
            this._transitions.push(transitionObj);
            transitionObj.initialize(this);
        }
    };

    ShuntDiv.prototype.removeTransition = function(frameId) {
        for (var i = this._transitions.length - 1; i >= 0; i--) {
            // Removing list elements from the end of the list? Smart.
            transitionObj = this._transitions[i];
            if ((transitionObj.exitFrameId === frameId) || (transitionObj.enterFrameId === frameId)) {
                transitionObj.remove();
                this._transitions.splice(i, 1);
            }
        };
    };

    ShuntDiv.prototype.addFrame = function(elem) {
        if (typeof elem == 'string' || elem instanceof String)
            frame = this.addFrameById(elem);
        else
            frame = this.addFrameByElem(elem);

        if (!frame) return;

        frame.style.position =  'absolute';
        frame.style.top =       0;
        frame.style.left =      0;
        frame.style.width =     '100%';
        frame.style.height =    '100%';
        frame.style['box-sizing'] = 'border-box';
    };

    ShuntDiv.prototype.addFrameByElem = function(frameElem) {
        if (this._frames.indexOf(frameElem) === -1) 
            return this._frames.push(frameElem);
    };

    ShuntDiv.prototype.addFrameById = function(frameId) {
        for (var i = this._frameContainer.children.length - 1; i >= 0; i--)
            if (((frame = this._frameContainer.children[i]).getAttribute('id') === frameId) && (this._frames.indexOf(frame) === -1))
                return this._frames.push(this._children[i]);
    };

    ShuntDiv.prototype.removeFrame = function(elem) {
        if (typeof elem == 'string' || elem instanceof String)
            frame = this.removeFrameById(elem);
        else
            frame = this.removeFrameByElem(elem);

        if (!frame) return;

        if (this.getStagedFrame() == frame) {
            this.setStagedFrame(undefined);
            this._container.removeChild(frame);
            this.removeTransition(frame.getAttribute('id'));
        }

        return frame;
    };

    ShuntDiv.prototype.removeFrameByElem = function(frameElem) {
        for (var i = this._frames.length - 1; i >= 0; i--)
            if (this._frames[i] === frameElem)
                return this._frames.splice(i, 1)[0];
    };

    ShuntDiv.prototype.removeFrameById = function(frameId) {
        for (var i = this._frames.length - 1; i >= 0; i--)
            if (this._frames[i].getAttribute('id') === frameId)
                return this._frames.splice(i, 1)[0]; 
    };

    ShuntDiv.prototype.getTransitionLock = function() {
        return this._transitionLock;
    };

    ShuntDiv.prototype.transitionLock = function() {
        this._transitionLock = true;
    };

    ShuntDiv.prototype.transitionUnlock = function() {
        this._transitionLock = false;
    };

    ShuntDiv.prototype.getStagedFrame = function() {
        return this._stagedFrame;
    };

    ShuntDiv.prototype.setStagedFrame = function(frame) {
        this._stagedFrame = frame;

        if ((id = frame.getAttribute('id')) && (!!id) && this.options.saveWithHash)
            location.hash = id;
            
        if (callback = this.options['onTransition'])
            callback();
    };

    ShuntDiv.prototype.showFrame = function(elem) {
        if (typeof elem == 'string' || elem instanceof String)
            this.showFrameById(elem);
        else
            this.showFrameByElem(elem);
    };

    ShuntDiv.prototype.showFrameByElem = function(frameElem) {
        for (var i = this._frames.length - 1; i >= 0; i--)
            if ((frame = this._frames[i]) === frameElem) {
                this._container.removeChild(this.getStagedFrame());
                this.setStagedFrame(frame);
                this._container.appendChild(frame);
            }    
        };

    ShuntDiv.prototype.showFrameById = function(frameId) {
        for (var i = this._frames.length - 1; i >= 0; i--)
            if ((frame = this._frames[i]).getAttribute('id') === frameId) {
                this._container.removeChild(this.getStagedFrame());
                this.setStagedFrame(frame);
                this._container.appendChild(frame);
            }
    };


    var SwipeChecker = ShuntDiv.SwipeChecker = function(container) {
        this.elem = container;

        touchPos = this.touchPos = {
            startX: undefined,
            startY: undefined,
            moveX: undefined,
            moveY: undefined,
            deviateX: 0,
            deviateY: 0,
        };

        maxDeviate = 30;
        minMoveX = 50;
        minMoveY = 50;

        this.elem.addEventListener('touchstart', (startCallback = function(startEvent) {
            touchPos.startX = startEvent.touches[0].screenX;
            touchPos.startY = startEvent.touches[0].screenY; 
        }));

        this.elem.addEventListener('touchmove', (moveCallback = function(moveEvent) {
            touchPos.moveX = moveEvent.touches[0].screenX;
            touchPos.moveY = moveEvent.touches[0].screenY;

            touchPos.deviateX = Math.max(touchPos.deviateX, Math.abs(touchPos.moveX - touchPos.startX));
            touchPos.deviateY = Math.max(touchPos.deviateY, Math.abs(touchPos.moveY - touchPos.startY));
        }));

        this.elem.addEventListener('touchend', (endCallback = function(endEvent) {
            dir = null;

            if ((touchPos.deviateX < maxDeviate) || (touchPos.deviateY < maxDeviate)) {
                if ((diffX = Math.abs(touchPos.moveX - touchPos.startX)) > (diffY = Math.abs(touchPos.moveY - touchPos.startY))) {
                    if (diffX > minMoveX) {
                        if (touchPos.moveX < touchPos.startX) 
                            dir = 'left';
                        else
                            dir = 'right';
                    }
                } else {
                    if (diffY > minMoveY) {
                        if (touchPos.moveY > touchPos.startY) 
                            dir = 'down';
                        else
                            dir = 'up';
                    }
                }
            }

            touchPos.deviateX = touchPos.deviateY = 0;

            container.dispatchEvent(new CustomEvent('shuntdivswiped', { detail: dir }));
        }));
    };

    // A Transition object describes the relationship between two concrete 
    // frames, their Transform function, and a Trigger function for some
    // animation

    // Example: Transition initialization
    // new ShuntDiv.Transition('intro', 'info', 'exitSlideUp', 'click', {id: 'button-next'})

    var Transition = ShuntDiv.Transition = function(exitFrameId, enterFrameId, transform, trigger, options) {
        this.exitFrameId =      exitFrameId;
        this.enterFrameId =     enterFrameId;
        this.transform =        transform;
        this.trigger =          trigger;
        this.options =          options;

        this.triggerElem =      undefined;
        this.callback =         undefined;  
    };

    Transition.prototype.initialize = function(context) {
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

        trigger = triggerFunc(context, transformFunc, exitFrame, enterFrame, this.options);
        this.triggerElem = trigger.elem;
        this.listener = trigger.listener;
        this.callback = trigger.callback;
    };

    Transition.prototype.remove = function() {
        if (this.triggerElem && this.listener && this.callback)
            this.triggerElem.removeEventListener(this.listener, this.callback);
    };

    // A Trigger function adds an event listener to a concrete frame and
    // assigns a Transform callback.

    // Example: Trigger function signature
    // myTrigger = function(context, transformCallback, exitFrame, enterFrame, [eventArgs]*) { ... };

    var Triggers = ShuntDiv.Triggers = {
        'click': function(context, transformCallback, exitFrame, enterFrame, options) {
            if (options && (clickElemId = options.id))
                triggerElem = exitFrame.querySelector('#' + clickElemId);
            else
                triggerElem = exitFrame;

            triggerCallback = function() {
                if (context.getStagedFrame() == exitFrame)
                    transformCallback(context, exitFrame, enterFrame, options);
            };

            triggerElem.addEventListener('click', triggerCallback);

            return {
                elem: triggerElem,
                listener: 'click',
                callback: triggerCallback,
            };
        },

        'keypress': function(context, transformCallback, exitFrame, enterFrame, options) {
            keyCode = 32;

            if (options && (key = options.key))
                if (Number.isInteger(key))
                    keyCode = key;
                else if (typeof key == 'string' || key instanceof String)
                    keyCode = key.toUpperCase().charCodeAt(0);

            triggerCallback = ShuntDiv.Triggers._keypressfactory(keyCode, context, transformCallback, exitFrame, enterFrame, options);

            document.addEventListener('keydown', triggerCallback);

            return {
                elem: document, 
                listener: 'keydown',
                callback: triggerCallback,
            };
        },

        '_keypressfactory': function(keyCode, context, transformCallback, exitFrame, enterFrame, options) {
            return function(e) {
                if ((e.keyCode == keyCode) && (context.getStagedFrame() == exitFrame)) {
                    transformCallback(context, exitFrame, enterFrame, options);
                }
            };
        },

        'touchSwipe': function(context, transformCallback, exitFrame, enterFrame, options) {
            swipeDir = options.swipe;

            triggerCallback = ShuntDiv.Triggers._touchswipefactory(swipeDir, context, transformCallback, exitFrame, enterFrame, options);

            context._container.addEventListener('shuntdivswiped', triggerCallback);

            return {
                elem: exitFrame,
                listener: 'shuntdivswiped',
                callback: triggerCallback,
            };
        },

        '_touchswipefactory': function(swipeDir, context, transformCallback, exitFrame, enterFrame, options) {
            return function(e) {
                if ((e.detail == swipeDir) && (context.getStagedFrame() == exitFrame)) {
                    transformCallback(context, exitFrame, enterFrame, options);
                }
            };
        },

    };

    // A Transform function should take any two DOM elements and perform the
    // DOM rendering and CSS manipulation for some animation.
    // It is meant to be called when a Transition is triggered, performing
    // the grunt work.

    // Example: Transform fucntion signature
    // myTransform = function(context, exitFrame, enterFrame, options) { ... };

    var Transforms = ShuntDiv.Transforms = {
        'replace': function(context, exitFrame, enterFrame, options) {
            if (context.getTransitionLock()) return;
            context.transitionLock();

            exitFrame.parentNode.insertBefore(enterFrame, exitFrame);

            setTimeout(function(){ 
                context.transitionUnlock();
                context.setStagedFrame(enterFrame);
                exitFrame.parentNode.removeChild(exitFrame); 
            }, 10);
        },

        'enterAnimateCss': function(context, exitFrame, enterFrame, options) {
            if (context.getTransitionLock()) return;
            context.transitionLock();

            animation_name = (options) ? options.animation_name || 'fadeIn' : 'fadeIn';
            animation_time = (options) ? options.animation_time || 500 : 500;
            animation_function = (options) ? options.animation_function || 'linear' : 'linear';

            exitFrame.parentNode.appendChild(enterFrame);

            enterFrame.style['-webkit-animation']    = animation_name + ' ' + animation_time.toString() + 'ms ' + animation_function;
            enterFrame.style['animation']            = animation_name + ' ' + animation_time.toString() + 'ms ' + animation_function;

            setTimeout(function() { 
                context.transitionUnlock();
                context.setStagedFrame(enterFrame);
                exitFrame.parentNode.removeChild(exitFrame); 
                enterFrame.style['-webkit-animation']    = '';
                enterFrame.style['animation']            = '';
            }, animation_time);
        },

        'exitAnimateCss': function(context, exitFrame, enterFrame, options) {
            if (context.getTransitionLock()) return;
            context.transitionLock();

            animation_name = (options) ? options.animation_name || 'fadeOut' : 'fadeOut';
            animation_time = (options) ? options.animation_time || 500 : 500;
            animation_function = (options) ? options.animation_function || 'linear' : 'linear';

            exitFrame.parentNode.insertBefore(enterFrame, exitFrame);

            exitFrame.style['-webkit-animation']    = animation_name + ' ' + animation_time.toString() + 'ms ' + animation_function;
            exitFrame.style['animation']            = animation_name + ' ' + animation_time.toString() + 'ms ' + animation_function;

            setTimeout(function() { 
                context.transitionUnlock();
                context.setStagedFrame(enterFrame);
                exitFrame.parentNode.removeChild(exitFrame); 
                exitFrame.style['-webkit-animation']    = '';
                exitFrame.style['animation']            = '';
            }, animation_time);
        },

        'dualAnimateCss': function(context, exitFrame, enterFrame, options) {
            if (context.getTransitionLock()) return;
            context.transitionLock();

            exit_animation_name = (options) ? options.exit_animation_name || 'fadeIn' : 'fadeIn';
            exit_animation_time = (options) ? options.exit_animation_time || 500 : 500;
            exit_animation_function = (options) ? options.exit_animation_function || 'linear' : 'linear';

            enter_animation_name = (options) ? options.enter_animation_name || 'fadeIn' : 'fadeIn';
            enter_animation_time = (options) ? options.enter_animation_time || 500 : 500;
            enter_animation_function = (options) ? options.enter_animation_function || 'linear' : 'linear';

            enter_above = (options) ? options.enter_above || true : true;

            if (enter_above)
                exitFrame.parentNode.appendChild(enterFrame);
            else
                exitFrame.parentNode.insertBefore(enterFrame, exitFrame);

            exitFrame.style['-webkit-animation']    = exit_animation_name + ' ' + exit_animation_time.toString() + 'ms ' + exit_animation_function;
            exitFrame.style['animation']            = exit_animation_name + ' ' + exit_animation_time.toString() + 'ms ' + exit_animation_function;
            enterFrame.style['-webkit-animation']   = enter_animation_name + ' ' + enter_animation_time.toString() + 'ms ' + enter_animation_function;
            enterFrame.style['animation']           = enter_animation_name + ' ' + enter_animation_time.toString() + 'ms ' + enter_animation_function;

            setTimeout(function() { 
                context.transitionUnlock();
                context.setStagedFrame(enterFrame);
                exitFrame.parentNode.removeChild(exitFrame); 
                exitFrame.style['-webkit-animation']    = '';
                exitFrame.style['animation']            = '';
                enterFrame.style['-webkit-animation']   = '';
                enterFrame.style['animation']           = '';
            }, Math.max(exit_animation_time, enter_animation_time));
        },

        'zRotate': function(context, exitFrame, enterFrame, options) {
            if (context.getTransitionLock()) return;
            context.transitionLock();

            direction = (options) ? options.rotate || 'up' : 'up';
            animation_time = (options) ? options.animation_time || 1000 : 1000;
            animation_function = (options) ? options.animation_function || 'cubic-bezier(.17,.67,.42,.99)' : 'cubic-bezier(.17,.67,.42,.99)';

            rotateAxis = ((direction == 'up') || (direction == 'down')) ? 'X' : 'Y';
            rotateSignExit =  ((direction == 'up') || (direction == 'right')) ? '-' : '';
            rotateSignEnter =  ((direction == 'up') || (direction == 'right')) ? '' : '-';

            translateAxis = ((direction == 'up') || (direction == 'down')) ? 'Y' : 'X';
            translateSignExit =  ((direction == 'up') || (direction == 'left')) ? '-' : '';
            translateSignEnter =  ((direction == 'up') || (direction == 'left')) ? '' : '-';

            style  = document.createElement('style');
            style.type = 'text/css';
            style.innerHTML = '@-webkit-keyframes zRotateExit {\n' +
                'from { transform: rotate' + rotateAxis + '(0deg) translate' + translateAxis + '(0%); opacity: 1; }\n' +
                'to { transform: rotate' + rotateAxis + '(' + rotateSignExit + '90deg) translate' + translateAxis + '(' + translateSignExit + '100%); opacity: 0; }\n' +
                '}\n' +
                '@-webkit-keyframes zRotateEnter {\n' +
                'from { transform: rotate' + rotateAxis + '(' + rotateSignEnter + '90deg) translate' + translateAxis + '(' + translateSignEnter + '100%); opacity: 0; }\n' +
                'to { transform: rotate' + rotateAxis + '(0deg) translate' + translateAxis + '(0%); opacity: 1; }\n' +
                '}\n' +
                '@keyframes zRotateExit {\n' +
                'from { transform: rotate' + rotateAxis + '(0deg) translate' + translateAxis + '(0%); opacity: 1; }\n' +
                'to { transform: rotate' + rotateAxis + '(' + rotateSignExit + '90deg) translate' + translateAxis + '('+ translateSignExit + '100%); opacity: 0; }\n' +
                '}\n' +
                '@keyframes zRotateEnter {\n' +
                'from { transform: rotate' + rotateAxis + '(' + rotateSignEnter +  '90deg) translate' + translateAxis + '(' + translateSignEnter + '100%); opacity: 0; }\n' +
                'to { transform: rotate' + rotateAxis + '(0deg) translate' + translateAxis + '(0%); opacity: 1; }\n' +
                '}\n';

            document.body.appendChild(style);

            exit_animation_name = 'zRotateExit';
            enter_animation_name = 'zRotateEnter';

            exitFrame.parentNode.appendChild(enterFrame);

            context._container.style['perspective'] = '300px';
            context._container.style['perspective-origin'] = '50% 50%';

            exitFrame.style['-webkit-animation']    = exit_animation_name + ' ' + animation_time.toString() + 'ms ' + animation_function;
            exitFrame.style['animation']            = exit_animation_name + ' ' + animation_time.toString() + 'ms ' + animation_function;
            enterFrame.style['-webkit-animation']   = enter_animation_name + ' ' + animation_time.toString() + 'ms ' + animation_function;
            enterFrame.style['animation']           = enter_animation_name + ' ' + animation_time.toString() + 'ms ' + animation_function;

            setTimeout(function() { 
                context.transitionUnlock();
                context.setStagedFrame(enterFrame);
                exitFrame.parentNode.removeChild(exitFrame); 
                exitFrame.style['-webkit-animation']    = '';
                exitFrame.style['animation']            = '';
                enterFrame.style['-webkit-animation']   = '';
                enterFrame.style['animation']           = '';

                document.body.removeChild(style);
                context._container.style['perspective'] = 'inherit';
                context._container.style['perspective-origin'] = 'inherit';
            }, animation_time);
        },
    };

    return ShuntDiv;
})();