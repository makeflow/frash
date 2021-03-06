import {isPrimitiveType} from '../utils';

import {dependencyManager} from './dependency-manager';
import {idManager} from './id-manager';

export type Getter<T> = () => T;

export class Computed<T = any> {
  private computedId = idManager.generate('computed');

  private hasBindAutoRecompute = false;

  private value!: T;

  constructor(private target: object, private getter: Getter<T>) {}

  get(): T {
    this.bindAutoRecompute();

    dependencyManager.collect(this.computedId);

    return this.value;
  }

  private recompute(): void {
    let oldValue = this.value;

    dependencyManager.beginCollect(this.recompute, this);
    this.value = this.getter.call(this.target);
    dependencyManager.endCollect();

    if (oldValue !== this.value || !isPrimitiveType(this.value)) {
      dependencyManager.trigger(this.computedId);
    }
  }

  private bindAutoRecompute(): void {
    if (this.hasBindAutoRecompute) {
      return;
    }

    this.hasBindAutoRecompute = true;

    this.recompute();
  }
}
