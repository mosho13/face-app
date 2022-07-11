const metadataMap = new WeakMap();

export function getMetadata(classProto: any, metadataKey: symbol, travelProtoChain = false) {
  let metadata, metadataObj;
  if (!travelProtoChain) {
    metadataObj = metadataMap.get(classProto);
    metadata = metadataObj && metadataObj[metadataKey];
  } else {
    metadata = [];
    while (classProto) {
      metadataObj = metadataMap.get(classProto);
      const currentProtoMetadata = metadataObj && metadataObj[metadataKey];
      if (currentProtoMetadata) {
        metadata.push(currentProtoMetadata);
      }
      classProto = Object.getPrototypeOf(classProto);
    }
  }

  return metadata;
}

export function saveMetadata(classProto: any, metadataKey: symbol, value: any) {
  let metadataObj = metadataMap.get(classProto);
  if (!metadataObj) {
    metadataObj = {};
    metadataMap.set(classProto, metadataObj);
  }
  metadataObj[metadataKey] = value;
}
