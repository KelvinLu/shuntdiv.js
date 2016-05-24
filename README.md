# shuntdiv.js

Move your `div`s around.

# Basic Usage

```
<link rel="stylesheet" type="text/css" href="https://cdn.rawgit.com/daneden/animate.css/master/animate.css">

<div id="main-content">
    <div id="intro" shunt-frame>
      <h1>Intro</h1>
        <p>
          Lorem ipsum dolor sit amet, consectetur...<br/>
        </p>
    </div>

    <div id="info-1" shunt-frame>
        <h1>Info 1</h1>
        <p>
          Nunc aliquet dignissim tincidunt...<br/>
        </p>
    </div>

    ...

</div>

<script type="text/javascript">
  myShunts = new ShuntDiv(document.getElementById('main-content'), [ ... ], { ... });
  myShunts.addTransition(new ShuntDiv.Transition('intro', 'info-1' , 'exitAnimateCss', 'keypress', {
      key: 'a',
      animation_name: 'hinge',
      animation_time: 2000,
  }));
  myShunts.addShunt(new ShuntDiv.Introduction('info-1', 'exitAnimateCss'));
</script>
```

1. Include `shuntdiv.js` and [Dan Eden's `animate.css`](https://daneden.github.io/animate.css/) in your document.
2. Place your `div` frames in a "container" parent `div`.
3. Instantiate a new `ShuntDiv` object.
4. Create and add new `Transition`s and `Introduction`s.




# The `shuntdiv` Abstractions

## The `ShuntDiv` object

A `ShuntDiv` object represents the container `div` (a stage), whose children `div`s (frames) are moving around, and encapsulates the behavior of the transitioning `divs`.

The constructor takes three arguments:
- The container `div` element as an [element](https://developer.mozilla.org/en-US/docs/Web/API/element) object.
- An array (possibly empty) of `Shunt` objects to initially link, for convenience.
- An object (possibly empty or `undefined`) of configuration options.

e.g;

```
myShunts = new ShuntDiv(document.getElementById('main-content'), [
        new ShuntDiv.Transition('intro', 'info-1' , 'exitAnimateCss', 'keypress', {
            key: 'a',
            animation_name: 'hinge',
            animation_time: 2000,
        })
        ...
    ], {
        default: 'intro',
        ...
    });
```

## Frames

A frame represents a `div` element that moves around on stage. `shuntdiv.js` is all about attaching and removing these elements from the DOM while possibly animating them.

They are denoted by the presence of the `shunt-frame` attibute. While interacting with `shuntdiv.js`, they are usually referenced by their `id` attribute or their `element` object.

e.g;

```
<div id="main-content">
    <div id="intro" shunt-frame>
        ...
    </div>
    <div id="info-1" shunt-frame>
        ...
    </div>
    ...
</div>
```

## Shunts

A [shunt](http://www.dictionary.com/browse/shunt) abstracts the notion of the movement of frames, the visual transformation between the two, and the triggering action.

There are two types of shunts; transitions and introductions.

#### Transitions

Transitions are an abstraction of the movement between *two* specific frames. They are represented by `ShuntDiv.Transition` objects.

Semantically, these objects are composed of three parts:
- The frames exiting and entering the DOM by the movement.
- The visual specification of the transformation in the movement; a `ShuntDiv` transform.
- The action which triggers the movement; a `ShuntDiv` trigger.

The constructor takes five arguments:
- The `id` of an exiting frame's `div`, as a string.
- The `id` of an entering frame's `div`, as a string.
- The name of a `ShuntDiv` transform, as a string.
- The name of a `ShuntDiv` trigger, as a string.
- An object (possibly empty or `undefined`) of configuration options for the transform and trigger objects.

e.g;

```
new ShuntDiv.Transition('intro', 'info-1' , 'zRotate', 'wheel', {
    deltaY: 10,
    rotate: 'down',
});

new ShuntDiv.Transition('info-2', 'contact' , 'dualAnimateCss', 'click', {
    exit_animation_name: 'fadeOut',
    exit_animation_function: 'cubic-bezier(.1,1,.61,.96)',
    enter_animation_name: 'slideInDown',
    enter_animation_function: 'cubic-bezier(.1,1,.61,.96)',
    enter_above: true,
});
```

#### Introductions

Introductions are an abstraction of the movement from any frame to a *single* specific frame. They are represented by `ShuntDiv.Introduction` objects.

Semantically, these objects are composed of two parts:
- The frame being introduced into the DOM by the movement.
- The visual specification of the transformation in the movement; a `ShuntDiv` transform.

Introductions can be thought of as a more general version of a transition, where the exiting frame is a wildcard and the triggers are constrained to invocation by runtime JavaScript method calls.

These objects might be used when the introduction of a certain frame is not dependent on the presence of another frame, such as a button press on a navigation menu.

The constructor takes five arguments:
- The `id` of the entering frame's `div`, as a string.
- The name of a `ShuntDiv` transform, as a string.
- An object (possibly empty or `undefined`) of configuration options for the transform.

e.g;

```
new ShuntDiv.Introduction('info-1', 'exitAnimateCss', {
    ...
});
```

## Transforms

A transform represents the visual transformation of the movement between any two frames and is used in the composition of shunt objects.

There is the notion of an *entering* frame (the `div` about to take the container's stage/be placed on the DOM) and *exiting* frame (the `div` currently staged within the container/on the DOM). The exiting frame is replaced by the entering frame and may be accompanied with some CSS animations.

The configuration object passed to the shunt constructor (where some transform is specified) can contain key-value pairs that can configure the behavior of the transformation.

Transforms are referenced by name when used as arguments to the constructor of shunt objects. Below is a list of such transforms that can be used, as well as their configurable options.

- `replace`: A simple replacement between two frames. Involves no CSS animations. The exiting frame is just removed from the DOM and the entering frame is attached to the DOM. This transform takes no configuration.
- `enterAnimateCss`: A CSS animation, specified in an option, is applied to the entering frame being attached (in front of the exiting frame, which remains still). The exiting frame is removed from the DOM after the animation completes. Configuration of the following properties is allowed:
    - `animation_name` (optional, default: `"fadeIn"`): A name of a CSS keyframe animation in `animate.css`.
    - `animation_time` (optional, default: `500`): Number of milliseconds the CSS animation should take.
    - `animation_function` (optional, default: `"linear"`): The interpolation function used in the CSS animation.
- `exitAnimateCss`:  A CSS animation, specified in an option, is applied to the exiting frame being removed. The entering frame is attached (behind the exiting frame being animated) to the DOM before the animation starts. Configuration of the following properties is allowed:
    - `animation_name` (optional, default: `"fadeIn"`): A name of a CSS keyframe animation in `animate.css`.
    - `animation_time` (optional, default: `500`): Number of milliseconds the CSS animation should take.
    - `animation_function` (optional, default: `"linear"`): The interpolation function used in the CSS animation.
- `dualAnimateCss`: Two CSS animations are applied simultaneously to the entering and exiting frames. The entering frame can be configured to be attached to the DOM above or below the exiting frame, for visual purposes. Configuration of the following properties is allowed:
    - `enter_animation_name` (optional, default: `"fadeIn"`): A name of a CSS keyframe animation in `animate.css`.
    - `enter_animation_time` (optional, default: `500`): Number of milliseconds the CSS animation should take.
    - `enter_animation_function` (optional, default: `"linear"`): The interpolation function used in the CSS animation.
    - `exit_animation_name` (optional, default: `"fadeIn"`): A name of a CSS keyframe animation in `animate.css`.
    - `exit_animation_time` (optional, default: `500`): Number of milliseconds the CSS animation should take.
    - `exit_animation_function` (optional, default: `"linear"`): The interpolation function used in the CSS animation.
    - `enter_above` (optional, default: `true`): A boolean indicating if the entering frame should be placed in front (with respect tot he ordering of DOM elements) of the exiting frame.
- `zRotate`: CSS animations are used to create a visual 3D "rotating" effect. Configuration of the following properties is allowed:
    - `direction` (optional, default: `"up"`): The direction (`up`, `down`, `left`, `right`) of the rolling effect.
    - `animation_time` (optional, default: `500`): Number of milliseconds the CSS animation should take.
    - `animation_function` (optional, default: `"cubic-bezier(.17,.67,.42,.99)"`): The interpolation function used in the CSS animation.

## Triggers

A trigger represents some action that may occur on the exiting frame's DOM element or the `document` itself, which triggers a shunt.

> (*Introduction* shunts are triggered at runtime by the `introduce` method of the `ShuntDiv` object or the `Introduction` object)

The configuration object passed to the shunt constructor (where some trigger is specified) can contain key-value pairs that can configure the specification of the trigger.

Triggers are referenced by name when used as arguments to the construction of transitions. Below is a list of such triggers that can be used, as well as their configurable options.

- `event`: Attaches a `CustomEvent` event listener to the exiting frame that will trigger the shunt, where the event name is arbitrary. Configuration of the following properties is allowed:
    - `name` (optional, default: `"shunt"`): The name of the `CustomEvent` being listened for.
    - `id` (optional): The `id` attribute of a child element of the exiting frame which the event listener is attached to. If it is not specified, the event listener is attached to the exiting frame itself.
- `click`: Attaches a `click` event listener to an element (the exiting frame, by default) that will trigger the shunt. Configuration of the following properties is allowed:
    - `element` (optional): The parent DOM element of the DOM element specified by the `id` configuration. Defaults to the exiting frame.
    - `id` (optional): The `id` attribute of a child element of the `element` DOM element which the event listener is attached to. If it is not specified, the event listener is attached to the exiting frame itself and the `element` configuration is not used.
- `keypress`: Attaches a `keydown` event listener to the `document` that will trigger the shunt on some specified key. Configuration of the following properties is allowed:
    - `key` (optional): An integer key code or character that the event listener will trigger on when the respective key is pressed. Defaults to the space bar.
- `touchSwipe`: Attaches event listeners to the `ShuntDiv` container element that will trigger a shunt when a swiping action is simulated. Useful for mobile platforms that emit the `touchend` event onto the DOM. Configuration of the following properties is allowed:
    - `swipe` (optional, default: `"down"`): The direction (`up`, `down`, `left`, `right`) which the container will "listen" for.
- `wheel`: Attaches a scroll wheel `wheel` event listener to an element (the exiting frame, by default) that will trigger the shunt. Configuration of the following properties is allowed:
    - `element` (optional): The parent DOM element of the DOM element specified by the `id` configuration. Defaults to the exiting frame.
    - `id` (optional): The `id` attribute of a child element of the `element` DOM element which the event listener is attached to. If it is not specified, the event listener is attached to the exiting frame itself and the `element` configuration is not used.
    - `deltaY` (optional): The minimal `deltaY` quantity given by the emitted `wheel` event which is needed to trigger the shunt.
    - `deltaX` (optional): The minimal `deltaX` quantity given by the emitted `wheel` event which is needed to trigger the shunt.
    - `deltaZ` (optional): The minimal `deltaZ` quantity given by the emitted `wheel` event which is needed to trigger the shunt.
