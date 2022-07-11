import { getMetadata, saveMetadata } from '../utils/metadata.util';
import { TransformFunc } from '../types/transform-func.type';

export const _modelValueSymbol = Symbol('api-model-value');

export function ModelValue(toField?: string, transformFunc?: TransformFunc<any, any>): any;
export function ModelValue(transformFunc: TransformFunc<any, any>): any;

export function ModelValue(...args: any[]) {
  let toField: string;
  let transformFunc: TransformFunc<any, any>;

  // if first arg is string, then it's the toField param
  if (typeof args[0] === 'string') {
    toField = args[0];
    args.shift();
  }

  if (typeof args[0] === 'function') {
    transformFunc = args[0];
    args.shift();
  }

  return function (target, property) {
    let modelValueMap = getMetadata(target, _modelValueSymbol);
    if (!modelValueMap) {
      modelValueMap = {};
      saveMetadata(target, _modelValueSymbol, modelValueMap);
    }

    modelValueMap[property] = {
      toField,
      transformFunc,
    };
  };
}
