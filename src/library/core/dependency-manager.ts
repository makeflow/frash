import {DoubleKeyMap} from '../utils';

class DependencyManager {
  private observableMap = new DoubleKeyMap<string, object, Function[]>();

  private observerStack: Function[] = [];

  private targetStack: any[] = [];

  private get currentObserver(): Function | undefined {
    if (!this.observerStack.length) {
      return undefined;
    }

    return this.observerStack[this.observerStack.length - 1];
  }

  private get currentTarget(): any | undefined {
    if (!this.targetStack.length) {
      return undefined;
    }

    return this.targetStack[this.observerStack.length - 1];
  }

  // TODO: bimap optimization
  getDependencyObservableIds(target: any): string[] {
    let keys: string[] = [];

    for (let [key, subMap] of this.observableMap) {
      if (subMap.has(target)) {
        keys.push(key);
      }
    }

    return keys;
  }

  trigger(observableId: string): void {
    let info = this.observableMap.getSubMap(observableId);

    if (!info) {
      return;
    }

    for (let [target, observers] of info) {
      if (Array.isArray(observers)) {
        for (let observer of observers) {
          observer.call(target || this);
        }
      }
    }
  }

  beginCollect(observer: Function, target: any): void {
    this.observerStack.push(observer);
    this.targetStack.push(target);

    if (typeof target !== 'undefined') {
      this.observableMap.deleteBySubKey(target);
    }
  }

  collect(observableId: string): void {
    if (!this.currentObserver) {
      return;
    }

    let observers = this.observableMap.get(observableId, this.currentTarget);

    if (observers) {
      if (!observers.includes(this.currentObserver)) {
        observers.push(this.currentObserver);
      }
    } else {
      this.observableMap.set(observableId, this.currentTarget, [
        this.currentObserver,
      ]);
    }
  }

  endCollect(): void {
    this.observerStack.pop();
    this.targetStack.pop();
  }
}

export const dependencyManager = new DependencyManager();
