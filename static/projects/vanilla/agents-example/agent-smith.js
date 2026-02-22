onmessage = (message) => {
  let heapArray = new Int32Array(message.data)
  let indexToModify = 1
  heapArray[indexToModify] = 100
  postMessage(indexToModify)
}