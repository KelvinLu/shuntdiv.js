# shuntdiv.js

Move your `div`s around.

## Basic Usage

```
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

1. Include `shuntdiv.js` and Dan Eden's [`animate.css`](https://daneden.github.io/animate.css/) in your document.
2. Place your `div` frames in a "container" parent `div`.
3. Instantiate a new `ShuntDiv` object.
4. Create and add new `Transition`s and `Introduction`s.

## The `shuntdiv` Abstractions

#### The `ShuntDiv` object

A `ShuntDiv` object represents the container `div` (a stage), whose children `div`s (frames) are moving around, and encapsulates the behavior of the transitioning `divs`.

The constructor takes three arguments:
- The container `div` element as an [element](https://developer.mozilla.org/en-US/docs/Web/API/element) object.
- An array (possibly empty) of `Shunt` objects to initially link, for convenience.
- An object (possibly empty or `undefined`) of configuration options.

#### Frames

A frame represents a `div` element that moves around on stage. `shuntdiv.js` is all about attaching and removing these elements from the DOM while possibly animating them.

They are denoted by the presence of the `shunt-frame` attibute. While interacting with `shuntdiv.js`, they are usually referenced by their `id` attribute or their `element` object.

#### Shunts

A [shunt](http://www.dictionary.com/browse/shunt) abstracts the notion of the movement of frames, the triggering actions, and the transformation between the two. There are two types of shunts; transitions and introductions.

###### Transitions

This is the representation of the movement of *two* frames. They are represented by `ShuntDiv.Transition` objects.

The constructor takes five arguments:
- The `id` of an exiting frame's `div`, as a string.
- The `id` of an entering frame's `div`, as a string.
- The name of a `ShuntDiv` transform, as a string.
- The name of a `ShuntDiv` trigger, as a string.
- An object (possibly empty or `undefined`) of configuration options for the transform and trigger.

###### Introductions

This is the representation of the movement of a *single* frame. They are represented by `ShuntDiv.Transition` objects.

The constructor takes five arguments:
- The `id` of the entering frame's `div`, as a string.
- The name of a `ShuntDiv` transform, as a string.
- An object (possibly empty or `undefined`) of configuration options for the transform.

#### Transforms

A transform represents the movement of *two* frames. There is the notion of an *entering* frame (the `div` about to take the container's stage) and *exiting* frame (the `div` currently staged within the container). The exiting frame is replaced by the entering frame and may be accompanied with some CSS animations.

Transforms are referenced by name when used as arguments to the construction of shunt objects.

- `replace`: No CSS animations. The exiting frame is just removed from the DOM and the entering frame is attached to the DOM.
- `enterAnimateCss`: A CSS animation, specified in an option, is applied to the entering frame being attached (in front of the exiting frame). The exiting frame is removed from the DOM after the animation completes.
- `exitAnimateCss`:  A CSS animation, specified in an option, is applied to the exiting frame being removed. The entering frame is attached (behind the exiting frame) to the DOM before the animation starts.
- `dualAnimateCss`: Two CSS animations are applied simultaneously to the entering and exiting frames. The entering frame can be configured to be attached to the DOM above or below the exiting frame, for visual purposes.
- `zRotate`: CSS animations are used to create a visual 3D "rotating" effect.

#### Triggers

Triggers are referenced by name when used as arguments to the construction of **transition** shunt objects. (**Introduction** shunts are triggered manually by a call to the `introduce` method of the `ShuntDiv` object or the `Introduction` object)

- `event`: Attaches an event listener to the exiting frame that will trigger the shunt, where the event name is arbitrary.
- `click`: Attaches a `click` event listener to an element (the exiting frame, by default) that will trigger the shunt.
- `keypress`: Attaches a `keydown` event listener to the `document` that will trigger the shunt on some specified key.
- `touchSwipe`: Attaches event listeners to the container that will trigger the shunt when a swiping action is simulated.
