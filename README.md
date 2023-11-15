# This is Cuckoo

Cuckoo is a modeling tool.
It isn't UML.
It's based off of something called the Schlaer-Mellor (SM) method.
Or just OOA for short.
I'm also just making some bits up because it's my tool. 😃

It's not even an alpha tool yet.
It's strictly for me to develop an implementation of recursive design, RD.
RD is something else from SM, but they never really got it all figured out and published.
So again, I'm making it up.

## Building

Apparently lock files don't work the way you'd think in node, so you'll need to run this command to initialize the node deps:

```console
npm install --legacy-peer-deps
```

And then:

``console
cargo tauri dev
```

This clearly presupposes that you have tauri installed.

## Controls

The controls are anything but simple.
I didn't want to deal with a keyboard handler, so it's all mouse.
Luckily mouse events have key modifiers.
We make extensive use of those.
It's so bad I've forgotten what they are after just a few weeks.

| Click Location | Modifier         | Effect              |
| -------------- | ---------------- | ------------------- |
| Paper          | ⌘ + click + drag | New Object          |
| Object         | ⌘ + click + drag | New Relationship    |
| Object         | double-click     | Object Editor       |
| Object         | ⌥ + click        | Object Editor       |
| Object         | ⌃ + click        | Delete Object       |
| Relationship   | double-click     | Relationship Editor |
| Relationship   | ⌥ + click        | Relationship Editor |
| Relationship   | ⌃ + click        | Delete Relationship |
| Paper          | ⌥ + click        | Undo Action         |
| Paper          | shift + click    | Redo Action         |
| Paper          | ⌃ + click        | Group Selection     |
| Paper          | double-click     | Reload Cuckoo       |

Creating an Isa is special. Start in an object and stop dragging on the paper shortly after leaving the object.
This will create a stub of a relationship.
To add subtypes, click in the object that's to become a subtype, and drag to the stub.

Group selection is neat.
It's more of a mode that you get put into when you `⌃ + click + drag` on the paper.
`⌃ + click + drag` to draw a selection box around a bunch of stuff.
Objects with their top-left corners in the selection box will be selected.
`⌃ + click + drag` inside the box to move it.
`⌃ + click + drag` outside the selection box to pan the paper.
`⌃ + click` outside the selection box to end group selection mode.

## Methodology

I don't want to go deep here.
I'd mostly just like to introduce the boxen and lines.

_aside: I've got a book on category theory that I'll actually be able to understand.
I wonder if the boxen are categories and the lines functors?
I have a feeling..._

Think of the boxen as _objects_.
Or, maybe Classes would be more appropriate today.
I often use object to mean class, and instance to mean object.
Deal wih it.
Objects have _attributes_, which are just data.
They have names and types.
_Every object has an attribute called `id` that has type `Uuid` ._
This is not enforced by the tool -- it's up to you, the modeler.
Sorry.
Deal with it.

The lines are relationships between objects.
A relationship between two (or the same) objects implies some shared structure, or shared semantics.
A double ended arrow means "many".
A single ended arrow means "one".
These are the _cardinality_ of the relationship.

For example, relationship `R1` between `Object` and `Attribute` is saying that an `Object` has many `Attributes` .
That's not quite true.
There's a little `c` next to the double ended arrow going to `Attribute` .
That letter means that the relationship is _conditional_ on the `Attribute` side.
This means that an `Object` has _zero_ **or** _more_ `Attributes` .

Finally we need to talk about relationship phrases.
These things are descriptive and meant to be read a certain way.
I always get lost, and waffle back and forth on the correct way.
But here is cannon.
The phrase adjacent to the object is meant to be _read_ after naming the object.
For example, `Attribute` "lives in an" `Object` , is the correct way to read `R1` going from `Attribute` to `Object` .

There are three types of relationship, and only two are currently implemented.
_Binary_ relationships have an object on either end.
That's what was described above.
One thing not dealt with are referential attributes.
These formalize the relationship between two objects.
They display as an attribute with an ampersand on the object that "points at" the referent.
Create one by ⌘ + click + dragging between objects.
The starting object is _pointing_ at the ending object, so it will get the referential attribute.

The other supported relationship type is an "isa", or generalization/specialization, supertype-subtype, etc.
The meaning is more along the lines of an algebraic type, or Rust enum.
To create one of these, ⌘ + click + drag from the base class and stop someplace on the paper.
You'll end up with a little stub of a relationship.
From there ⌘ + click + drag from a subtype object to the nub.

_aside: I was just thinking about cuckoo, as I stared at it trying to figure out how to represent relationships on objects in ooa_1.
Anyway, I think I'm building all this shit because cuckoo is a tool that I can use to express how I think about coding.
Everything that I actually code is based on boxen and lines.
The code itself is an interesting, but long-winded way to get the computer to do something.
So in effect I am building myself the ultimate tool with which I can express my thoughts.
That seems pretty deep._
