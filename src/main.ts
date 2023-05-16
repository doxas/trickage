
import { BladeApi } from '@tweakpane/core';
import { Pane } from 'tweakpane';
import { Renderer } from './canvas';
import './main.scss';

window.addEventListener('DOMContentLoaded', () => {
  const renderer = new Renderer(document.body);
  console.log('😇', renderer);

  const pane = new Pane();

  const list = pane.addBlade({
    view: 'list',
    label: 'mode',
    options: [
      {text: 'default', value: 0},
      {text: 'with-line', value: 1},
    ],
    value: 0,
  }) as unknown as any;
  list.on('change', (v) => {
    renderer.mode = v.value;
  });
  pane.addInput({sizeRatio: renderer.sizeRatio}, 'sizeRatio', {
    step: 0.1,
    min: 0.1,
    max: 10.0,
  }).on('change', (v) => {
    renderer.sizeRatio = v.value;
  });
  pane.addInput({maxLimitCount: renderer.maxLimitCount}, 'maxLimitCount', {
    step: 1,
    min: 10,
    max: 10000,
  }).on('change', (v) => {
    renderer.maxLimitCount = v.value;
  });
  pane.addInput({originalScale: renderer.originalScale}, 'originalScale', {
    step: 1,
    min: 1,
    max: 8,
  }).on('change', (v) => {
    renderer.originalScale = v.value;
  });
  pane.addInput({minimumSplitWidth: renderer.minimumSplitWidth}, 'minimumSplitWidth', {
    step: 1,
    min: 1,
    max: 16,
  }).on('change', (v) => {
    renderer.minimumSplitWidth = v.value;
  });
  pane.addInput({lineLuminanceScale: renderer.lineLuminanceScale}, 'lineLuminanceScale', {
    step: 0.01,
    min: 0.01,
    max: 1.0,
  }).on('change', (v) => {
    renderer.lineLuminanceScale = v.value;
  });

}, false);
