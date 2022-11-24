import { MoveStruct } from '../features/paper/Paper';
import { Rect, Point, BinaryEnd, PaperStore } from './store';

export function handleObjectResize(move: MoveStruct, event: React.MouseEvent) {
    if (event.movementX === 0 && event.movementY === 0) {
        return null;
    }

    let { object, target } = move;
    let { x, y, width, height, resizeDir } = object;

    let dirty_m = false;
    let dirty_r = false;

    // Resizing
    let dx = event.movementX;
    let dy = event.movementY;

    // Figure out what to change based on what's being dragged
    switch (resizeDir) {
        case 'north':
            y += dy;
            if (dy < 0) {
                height += -dy;
            } else {
                height -= dy
            }
            break;
        case 'south':
            height += dy;
            break;
        case 'east':
            width += dx;
            break;
        case 'west':
            x += dx;
            if (dx < 0) {
                width += -dx;
            } else {
                width -= dx;
            }
            break;

        default:
            console.error('WTF');
            break;
    }

    let parent = target!.node!.parentNode as SVGGElement;

    let xform = parent!.transform.baseVal.getItem(0);
    console.assert(xform.type === SVGTransform.SVG_TRANSFORM_TRANSLATE);

    let kids = parent.children;
    for (let i = 0; i < kids.length; i++) {
        let child = kids[i];

        // @ts-ignore
        let classes = child.className.baseVal.split('_');
        let type = classes[1];
        switch (type) {
            case 'objectRect':
                switch (resizeDir) {
                    case 'north':
                        // @ts-ignore
                        child.setAttribute('height', height);
                        xform.setTranslate(x, y);
                        dirty_m = true;
                        dirty_r = true;
                        break;

                    case 'south':
                        // @ts-ignore
                        child.setAttribute('height', height);
                        dirty_r = true;
                        break;

                    case 'east':
                        // @ts-ignore
                        child.setAttribute('width', width);
                        dirty_r = true;
                        break

                    case 'west':
                        // @ts-ignore
                        child.setAttribute('width', width);
                        xform.setTranslate(x, y);
                        dirty_m = true;
                        dirty_r = true;
                        break;

                    default:
                        break;
                }
                break;

            case 'objectBisectLine':
                // @ts-ignore
                child.setAttribute('x2', width);
                break;

            case 'objectName':
                // @ts-ignore
                child.setAttribute('x', width / 2);
                break;

            default:
                break;
        }

    }

    return {
        ...move,
        object: { ...object, width, height, x, y, dirty_m, dirty_r }
    };

}

export function handleObjectMove(paper_obj: PaperStore, move: MoveStruct, event: React.MouseEvent) {
    if (event.movementX === 0 && event.movementY === 0) {
        return null;
    }

    let { object, target } = move;
    let { x, y, rels, width, height } = object;

    let parent = target!.node!.parentNode as SVGGElement;
    let obj_id = parent!.id;

    x += event.movementX;
    y += event.movementY;

    let xform = parent!.transform.baseVal.getItem(0);
    console.assert(xform.type === SVGTransform.SVG_TRANSFORM_TRANSLATE);
    xform.setTranslate(x, y);

    if (rels.length === 0) {
        // Now find all the arrows connected to us.
        Object.keys(paper_obj.relationships)
            .forEach((r_id) => {
                let r = paper_obj.relationships[r_id];
                switch (Object.keys(r!)[0]) {
                    case 'BinaryUI': {
                        // @ts-ignore
                        r = r!.BinaryUI;

                        let from_id = r!.from.id;
                        // @ts-ignore
                        let to_id = r!.to.id;

                        // id is the Object.id
                        // We call makeGlyph with the x, y coordinates from the other end of the relationship
                        if (from_id === obj_id) {
                            let dir = r!.from.dir;
                            // @ts-ignore
                            let glyph = document.getElementById(`${r_id}:${from_id}:${dir}:from`) as SVGGElement;
                            // let xform = glyph.transform.baseVal.getItem(0);
                            // console.assert(xform.type === SVGTransform.SVG_TRANSFORM_TRANSLATE);
                            // let x = xform.matrix.e + event.movementX;
                            // let y = xform.matrix.f + event.movementY;
                            let x0 = r!.from.x;
                            let y0 = r!.from.y;

                            moveGlyph(x, y, glyph, paper_obj!, { x0: x0, y0: y0, x1: x + width, y1: y + height });
                            rels.push({ target: glyph, x: x0, y: y0, type: 'binary' });
                        } else if (to_id === obj_id) {
                            // @ts-ignore
                            let dir = r!.to.dir;
                            // @ts-ignore
                            let glyph = document.getElementById(`${r_id}:${to_id}:${dir}:to`) as SVGGElement;
                            // let xform = glyph.transform.baseVal.getItem(0);
                            // console.assert(xform.type === SVGTransform.SVG_TRANSFORM_TRANSLATE);
                            // let x = xform.matrix.e + event.movementX;
                            // let y = xform.matrix.f + event.movementY;
                            // @ts-ignore
                            let x0 = r!.to.x;
                            // @ts-ignore
                            let y0 = r!.to.y;

                            moveGlyph(x, y, glyph, paper_obj!, { x0: x0, y0: y0, x1: x + width, y1: y + height });
                            rels.push({ target: glyph, x: x0, y: y0, type: 'binary' });
                        }
                    }
                        break;
                    case 'IsaUI': {
                        // @ts-ignore
                        r = r!.IsaUI;
                        let from_id = r!.from.id;

                        if (from_id === obj_id) {
                            let dir = r!.from.dir;

                            // @ts-ignore
                            let glyph = document.getElementById(`${r_id}:${from_id}:${dir}:from`) as SVGGElement;

                            let x0 = r!.from.x;
                            let y0 = r!.from.y;

                            moveGlyph(x, y, glyph, paper_obj!, { x0: x0, y0: y0, x1: x + width, y1: y + height });
                            rels.push({ target: glyph, x: x0, y: y0, type: 'isa' });
                        } else {
                            // @ts-ignore
                            for (let rel_ui of r!.to) {
                                if (rel_ui.id === obj_id) {
                                    let dir = rel_ui.dir;

                                    // @ts-ignore
                                    let glyph = document.getElementById(`${r_id}:${rel_ui.id}:${dir}:to`) as SVGGElement;

                                    let x0 = rel_ui.x;
                                    let y0 = rel_ui.y;

                                    moveGlyph(x, y, glyph, paper_obj!, { x0: x0, y0: y0, x1: x + width, y1: y + height });
                                    rels.push({ target: glyph, x: x0, y: y0, type: 'isa' });
                                }
                            }
                        }
                    }
                        break;

                    default:
                        console.error('unknown relationship', r!);
                        break;
                }
            });
    } else {
        // Use the cached result. Note that it's using the location of the top left corner of the
        // object, and not the other end of the relationship. I guess this works.
        rels.map((r) => moveGlyph(r.x, r.y, r.target, paper_obj!, { x0: x, y0: y, x1: x + width, y1: y + height }));
    }

    return { ...move, object: { ...object, x, y, dirty_m: true, rels } };
}

export function moveGlyph(x: number, y: number, target: SVGGElement, paper: PaperStore, box?: Rect) {
    let [id, obj_id, dir, end] = target.id.split(':');
    let orig_dir = dir;

    let obj_ui = paper.objects[obj_id];
    if (obj_ui === undefined) {
        console.error('undefined obj_ui', obj_id);
        return [x, y, ''];
    }

    let rel_ui = paper.relationships[id];
    if (rel_ui === undefined) {
        console.error('undefined rel_ui', id);
        return [x, y, ''];
    }
    let type = Object.keys(rel_ui)[0];

    // I don't even remember the intention of box exactly, a few days later. I can do better.
    // I think it's meant to offer an idea of where the box we are attached to is currently. Rather
    // than rely on what's stored.
    let north = box ? box.y0 : obj_ui.y;
    let south = box ? box.y1 : obj_ui.y + obj_ui.height;
    let west = box ? box.x0 : obj_ui.x;
    let east = box ? box.x1 : obj_ui.x + obj_ui.width;

    let dx = x;
    let dy = y;
    // minimize the distance from the other end of the relationship, and not the mouse pointer.
    if (box && type === 'BinaryUI') {
        if (end === 'from') {
            // @ts-ignore
            dx = rel_ui.BinaryUI.to.x;
            // @ts-ignore
            dy = rel_ui.BinaryUI.to.y;
        } else {
            // @ts-ignore
            dx = rel_ui.BinaryUI.from.x;
            // @ts-ignore
            dy = rel_ui.BinaryUI.from.y;
        }
    } else if (box && type === 'IsaUI') {
        if (end === 'from') {
            // @ts-ignore
            dx = rel_ui.IsaUI.from.x;
            // @ts-ignore
            dy = rel_ui.IsaUI.from.y;
        } else {
            // @ts-ignore
            let ui = rel_ui.IsaUI;
            ui.to.forEach((to_ui: BinaryEnd, index: number) => {
                if (to_ui.id === obj_id) {
                    dx = to_ui.x;
                    dy = to_ui.y;
                }
            });
        }
    }

    // Find the point on the target boundary that minimizes the distance to (x, y).
    let d_north = distToSegmentSquared({ x: dx, y: dy }, { x: west, y: north }, { x: east, y: north });
    let d_west = distToSegmentSquared({ x: dx, y: dy }, { x: west, y: north }, { x: west, y: south });
    let d_south = distToSegmentSquared({ x: dx, y: dy }, { x: west, y: south }, { x: east, y: south });
    let d_east = distToSegmentSquared({ x: dx, y: dy }, { x: east, y: south }, { x: east, y: north });
    let mins = [d_north, d_west, d_south, d_east];

    // The idea here is to only swap sides if we fall outside of a tolerance.
    let my_min = (values: number[]) => {
        let min_idx = values.indexOf(Math.min(...mins));
        let min_value = values[min_idx];
        values[min_idx] *= 2;

        let penultimate_idx = values.indexOf(Math.min(...mins));
        let diff = values[penultimate_idx] - min_value;

        if (diff < 15) {
            return penultimate_idx;
        } else {
            return min_idx;
        }
    };

    let idx = mins.indexOf(Math.min(...mins));
    if (box) {
        idx = my_min(mins);
    }

    // This is sort of funky. I'm not even sure of what I want to accomplish. As it stands,
    // the location of the anchor is maintained, and the new location tries to match that of
    // the old location. That's the nested ternary operators.
    // I think what I'd like is for a less abrupt fallback.
    //
    // Now thinking that the anchor should stick to it's position on the box as long as possible.
    switch (idx) {
        case 0:
            dir = 'North';
            y = north;
            x = x < west ? west : x > east ? east : x;
            break;
        case 1:
            dir = 'West';
            x = west;
            // y = dy;
            y = y < north ? north : y > south ? south : y;
            break;
        case 2:
            dir = 'South';
            y = south;
            // x = dx;
            x = x < west ? west : x > east ? east : x;
            break;
        case 3:
            dir = 'East';
            x = east;
            // y = y <= north ? north + (south - north) / 2 : y >= south ? north + (south - north) / 2 : y;
            y = y < north ? north : y > south ? south : y;
            // y = dy;
            break;

        default:
            console.error('ooops', mins, idx);
            break;
    }

    // Move the glyph
    target.setAttribute('transform', makeTransform(x, y, dir));

    // this feels dirty
    if (orig_dir !== dir) {
        target.id = target.id.replace(orig_dir, dir);
    }

    // Move the lines
    if (type === 'BinaryUI') {
        // Move the line
        let grandParent = target.parentNode;
        let kids = grandParent!.children;
        for (let i = 0; i < kids.length; i++) {
            let child = kids[i];
            if (child instanceof SVGPathElement) {
                let d = '';
                if (end === "from") {
                    // @ts-ignore
                    let other = rel_ui.BinaryUI.to;
                    // @ts-ignore
                    d = makeLine({ x, y, dir, id: '' }, other);

                } else {
                    // @ts-ignore
                    let other = rel_ui.BinaryUI.from;
                    // @ts-ignore
                    d = makeLine(other, { x, y, dir, id: '' });
                }

                child.setAttribute('d', d);
            }
        }
    } else if (type === 'IsaUI') {
        // @ts-ignore
        let ui = rel_ui.IsaUI;
        if (end === 'to') {
            let grandParent = target.parentNode;
            let kids = grandParent!.children;
            for (let i = 0; i < kids.length; i++) {
                let child = kids[i];
                if (child instanceof SVGPathElement) {
                    let [_id, _obj_id] = child.id.split(':');
                    if (_obj_id === obj_id) {
                        // Make up a fake ui element to send.
                        // @ts-ignore
                        let d = makeLine(ui.from, { x, y, dir, id: '' });
                        child.setAttribute('d', d);
                    }
                }
            }
        } else {
            let grandParent = target.parentNode;
            let kids = grandParent!.children;
            let index = 0;
            for (let i = 0; i < kids.length; i++) {
                let child = kids[i];
                if (child instanceof SVGPathElement) {
                    // @ts-ignore
                    let d = makeLine({ x, y, dir, id: '' }, ui.to[index]);
                    child.setAttribute('d', d);
                    index++;
                }
            }
        }

        return [x, y, dir];
    }
}

function sqr(x: number) { return x * x }
function dist2(v: Point, w: Point) { return sqr(v.x - w.x) + sqr(v.y - w.y) }
function distToSegmentSquared(p: Point, v: Point, w: Point) {
    var l2 = dist2(v, w);
    if (l2 == 0) return dist2(p, v);
    var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return dist2(p, {
        x: v.x + t * (w.x - v.x),
        y: v.y + t * (w.y - v.y)
    });
}
export function makeTransform(x: number, y: number, dir: string) {
    return 'translate(' + x + ',' + y + ') rotate(' + getRotation(dir)! + ')';
}

export function getRotation(dir: string) {
    switch (dir) {
        case 'North':
            return 270;

        case 'South':
            return 90;

        case 'East':
            return 0;

        case 'West':
            return 180

        default:
            console.error('bad direction');
            break;
    }
}

export function getAnchorOffset(x: number, y: number, dir: string) {
    switch (dir) {
        case 'North':
            return [x, y - 40];

        case 'South':
            return [x, y + 40];

        case 'East':
            return [x + 40, y];

        case 'West':
            return [x - 40, y];

        default:
            console.error('bad direction');
            break;
    }
}

export function makeLine(from: BinaryEnd, to: BinaryEnd) {
    let f = getAnchorOffset(from.x, from.y, from.dir);
    let t = getAnchorOffset(to.x, to.y, to.dir);
    return "M " + f![0] + " " + f![1] + " L " + t![0] + " " + t![1];
}