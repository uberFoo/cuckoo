import React, { Component } from 'react';
import { v5 as uuid } from 'uuid';

import { PaperStore } from '../../app/store';
import styles from './Paper.module.css';

const width = 3200;
const height = 1600;
const gridSize = 25;
const defaultScale = 1.25;
const minScale = 0.4;
const maxScale = 4.5;
const defaultPosition = [0, 0];

interface PaperProps {
    domain: string,
    domain_ns: string
}

export class Paper extends Component<PaperProps, {}> {
    // All the bits we need to draw ourselves
    x: number;
    y: number;
    scale: number;
    ref: SVGGElement | null;
    x_lines: Array<JSX.Element>;
    y_lines: Array<JSX.Element>;

    state: PaperStore;
    //
    // Things needed to pan and zoom
    mouseDown: Boolean;
    // gestureHandler;

    constructor(props: PaperProps) {

        super(props);
        let [x, y] = defaultPosition;
        this.x = x;
        this.y = y;
        this.scale = defaultScale;
        this.ref = null;
        this.x_lines = [];
        for (let i = 0; i < height + 1; i += gridSize) {
            this.x_lines.push(<line x1={0} y1={i} x2={width} y2={i} />);
        }

        this.y_lines = [];
        for (let i = 0; i < width + 1; i += gridSize) {
            this.y_lines.push(<line x1={i} y1={0} x2={i} y2={height} />);
        }

        this.state = {
            width: width,
            height: height,
            domain_name: props.domain,
            domain_ns: props.domain_ns,
            // objects: [],
            // attributes: [],
            // relationships: []
        };

        console.log(this.state);

        this.mouseDown = false;
        // this.gestuerHandler = useDrag(())

        // Bind Callbacks to this. Still?
        this.onMouseDownHandler = this.onMouseDownHandler.bind(this);
        this.onMouseUpHandler = this.onMouseUpHandler.bind(this);
        this.onMouseMoveHandler = this.onMouseMoveHandler.bind(this);
    }

    componentDidMount(): void {
        // this.ref!.onmouseDown = this.onMouseDownHandler;
    }

    render(): React.ReactNode {
        return (
            <g id="paper" pointerEvents="all" transform={"translate(" + this.x + "," + this.y + ") scale(" + this.scale + ")"} ref={(ref: SVGGElement) => this.ref = ref} onMouseDown={this.onMouseDownHandler} onMouseUp={this.onMouseUpHandler} onMouseMove={this.onMouseMoveHandler} onMouseLeave={this.onMouseUpHandler} >
                < rect id="background" width={width} height={height} className={styles.paperBase} />
                <g className={styles.axis}>
                    {this.x_lines}
                </g>
                <g className={styles.axis}>
                    {this.y_lines}
                </g>
                <g id="canvas">
                </g>
            </g >
        )
    }

    private onMouseDownHandler(event: React.MouseEvent) {
        // console.log(`down: ${this}`);
        this.mouseDown = true;
    }

    private onMouseUpHandler(event: React.MouseEvent) {
        // console.log(`up: ${this}`);
        this.mouseDown = false;
    }

    private onMouseMoveHandler(event: React.MouseEvent) {
        // If mouseDown we are panning. This is wrong, and actually needs to start drawing.
        if (this.mouseDown) {
            this.x += event.movementX;
            this.y += event.movementY;

            this.forceUpdate();
        }
    }
}